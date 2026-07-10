#!/usr/bin/env node
/**
 * Resolve match-highlight URLs for every played bracket match and cache
 * them into src/data/highlights.json.
 *
 * Primary source:  YouTube Data API v3 scoped to the official FIFA channel
 *                  — picks up the canonical "Highlights | ..." videos.
 * Fallback source: FIFA's own match-report article page — used when
 *                  YouTube hasn't yet uploaded the canonical video.
 *
 * Usage:
 *   YOUTUBE_API_KEY=... node scripts/resolve-highlights.mjs                  # all played matches
 *   YOUTUBE_API_KEY=... node scripts/resolve-highlights.mjs --match=R16-5    # one match
 *   YOUTUBE_API_KEY=... node scripts/resolve-highlights.mjs --force          # re-resolve even if cached
 *
 * Local: `node --env-file=.env scripts/resolve-highlights.mjs`
 *
 * Get a key: https://console.cloud.google.com/apis/credentials
 *   → APIs & Services → Library → enable "YouTube Data API v3"
 *   → Credentials → Create credentials → API key
 */

import { readFileSync, writeFileSync } from "node:fs";

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error("YOUTUBE_API_KEY not set.");
  console.error("Create one at https://console.cloud.google.com/apis/credentials");
  process.exit(1);
}

// FIFA's official YouTube channel (@fifa, 31.9M subscribers). Verified
// via `channels.list?forHandle=@fifa` — do not confuse with the older
// UCXlxRDXe75... ID which points elsewhere.
const FIFA_CHANNEL_ID = "UCpcTrCXblq78GZrTUTLWeBw";

// FIFA's public site is a client-rendered SPA — regular fetches get an
// empty shell. Using a Googlebot UA gets the fully-SSR'd page with
// meta tags and the article body, which lets us verify existence.
const FIFA_BOT_UA = "Googlebot/2.1 (+http://www.google.com/bot.html)";
const FIFA_ARTICLE_BASE =
  "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles";

const args = new Set(process.argv.slice(2));
const onlyMatch = [...args].find((a) => a.startsWith("--match="))?.split("=")[1];
const force = args.has("--force");

const bracket = JSON.parse(readFileSync("src/data/bracket.json", "utf8"));
const groups = JSON.parse(readFileSync("src/data/groups.json", "utf8"));
const teams = JSON.parse(readFileSync("src/data/teams.json", "utf8"));
const highlightsPath = "src/data/highlights.json";
const highlights = JSON.parse(readFileSync(highlightsPath, "utf8"));

const teamByCode = Object.fromEntries(teams.map((t) => [t.code, t]));

// ─────────────────── YouTube ───────────────────

/** FIFA channel's canonical main-highlights title:
 *    "Highlights | <TeamA> <X-Y> <TeamB> | FIFA World Cup 2026™"
 *  Everything else (🆚 Shorts reels, Alt Cast broadcast, pressers,
 *  training clips, single-goal edits, historical recaps) is filtered
 *  out — otherwise "watch highlights" ends up on the wrong video. */
const NEGATIVE_MARKERS = [
  "#fifaworldcupony",
  "alt cast",
  "alternate cast",
  "press conference",
  "train before",
  "training",
  "takes questions",
  "15-minute",
  "post-match",
  "reaction",
  "preview",
  "behind the scenes",
  "goal |",
  "goal:",
  "scores again",
  "1998",
  "u-17",
  "u-20",
  "women",
];

/** teams.json uses one spelling per country; FIFA's channel and article
 *  URLs sometimes use another. `title` variants apply to YouTube title
 *  matching; `slug` variants apply to FIFA URL construction. */
const NAME_INFO = {
  "Ivory Coast":            { title: ["cote d", "côte d"],                     slug: "cote-d-ivoire" },
  "DR Congo":               { title: ["congo dr", "dr congo"],                 slug: "congo-dr" },
  "United States":          { title: ["usa", "united states of america"],      slug: "usa" },
  "Cape Verde":             { title: ["cabo verde"],                           slug: "cabo-verde" },
  "South Korea":            { title: ["korea republic", "republic of korea"],  slug: "korea-republic" },
  "North Korea":            { title: ["korea dpr", "dpr korea"],               slug: "korea-dpr" },
  "Bosnia and Herzegovina": { title: ["bosnia & herzegovina"],                 slug: "bosnia-and-herzegovina" },
  "Czech Republic":         { title: ["czechia"],                              slug: "czech-republic" },
  "Turkey":                 { title: ["türkiye", "turkiye"],                   slug: "turkiye" },
};

function titleContainsName(title, name) {
  if (title.includes(name.toLowerCase())) return true;
  return (NAME_INFO[name]?.title ?? []).some((a) => title.includes(a));
}

function scoreCandidate(item, nameA, nameB) {
  const title = item.snippet.title.toLowerCase();
  if (!titleContainsName(title, nameA) || !titleContainsName(title, nameB)) return -Infinity;
  for (const neg of NEGATIVE_MARKERS) if (title.includes(neg)) return -Infinity;
  if (!title.startsWith("highlights |")) return -Infinity;
  let score = 10;
  if (title.includes("fifa world cup 2026")) score += 5;
  return score;
}

function pickBestMatch(items, nameA, nameB) {
  let best = null;
  let bestScore = -Infinity;
  for (const item of items) {
    const s = scoreCandidate(item, nameA, nameB);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }
  return bestScore > 0 ? best : null;
}

async function searchYouTube(query) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("channelId", FIFA_CHANNEL_ID);
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("maxResults", "5");
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`YouTube API: ${data.error.message}`);
  return data.items ?? [];
}

async function resolveYouTube(nameA, nameB) {
  const items = await searchYouTube(`${nameA} ${nameB} highlights`);
  const pick = pickBestMatch(items, nameA, nameB);
  if (pick) {
    return {
      url: `https://www.youtube.com/watch?v=${pick.id.videoId}`,
      title: pick.snippet.title,
      topTitleIfMissed: null,
    };
  }
  return {
    url: null,
    title: null,
    topTitleIfMissed: items[0]?.snippet.title ?? null,
  };
}

// ─────────────────── FIFA article ───────────────────

function fifaSlug(name) {
  const alias = NAME_INFO[name]?.slug;
  if (alias) return alias;
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/'/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Check candidate FIFA article URL. Real articles return 200 with a
 *  <title> like "Mexico 2-3 England | Match report & highlights | ..."
 *  Non-existent slugs return 404 (even to Googlebot). */
async function checkFifaUrl(url, nameA, nameB) {
  const res = await fetch(url, { headers: { "User-Agent": FIFA_BOT_UA } });
  if (res.status !== 200) return false;
  const html = await res.text();
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (!m) return false;
  const title = m[1].toLowerCase();
  if (!title.includes("match report") && !title.includes("highlights")) return false;
  // Sanity: title should reference both teams (guards against a
  // redirect to a generic page).
  const hasA = titleContainsName(title, nameA);
  const hasB = titleContainsName(title, nameB);
  return hasA && hasB;
}

async function resolveFifa(nameA, nameB) {
  const slugA = fifaSlug(nameA);
  const slugB = fifaSlug(nameB);
  // Try both orderings — the user's example was mexico-england (teamA
  // first, matching bracket.json), but not every article follows that.
  const candidates = [
    `${slugA}-${slugB}-match-report-highlights`,
    `${slugB}-${slugA}-match-report-highlights`,
  ];
  for (const slug of candidates) {
    const url = `${FIFA_ARTICLE_BASE}/${slug}`;
    if (await checkFifaUrl(url, nameA, nameB)) return url;
  }
  return null;
}

// ─────────────────── Main ───────────────────

function normalizeExisting(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { youtube: entry };
  return entry;
}

function isBracketPlayed(m) {
  return m.scoreA !== null && m.scoreB !== null && m.teamCodeA && m.teamCodeB;
}

function isGroupPlayed(gm) {
  return gm.homeScore !== null && gm.awayScore !== null && gm.homeCode && gm.awayCode;
}

/** Journey modal keys group-stage rows as `G-{groupId}-{matchDay}-{homeCode}-{awayCode}`
 *  (see src/features/teams/journey.ts). Mirror that exactly so
 *  highlights.json keys line up. */
function groupMatchId(groupId, gm) {
  return `G-${groupId}-${gm.matchDay}-${gm.homeCode}-${gm.awayCode}`;
}

function collectTargets() {
  const out = [];
  for (const m of bracket) {
    if (!isBracketPlayed(m)) continue;
    out.push({ id: m.id, codeA: m.teamCodeA, codeB: m.teamCodeB });
  }
  for (const g of groups) {
    for (const gm of g.matches) {
      if (!isGroupPlayed(gm)) continue;
      out.push({ id: groupMatchId(g.id, gm), codeA: gm.homeCode, codeB: gm.awayCode });
    }
  }
  return out;
}

const all = collectTargets();
const targets = onlyMatch ? all.filter((t) => t.id === onlyMatch) : all;

if (onlyMatch && targets.length === 0) {
  console.error(`No played match with id=${onlyMatch}`);
  process.exit(1);
}

// YouTube fetching is gated. Two ways to enable it:
//   1. Manual: flip scripts/config/youtube-fetch.json → enabled: true
//      and push. Script auto-resets the flag to false at the end —
//      genuinely one-shot.
//   2. Nightly CI: workflow sets FORCE_YOUTUBE_FETCH=true on its
//      21:00-CEST cron. Doesn't touch the file flag.
// FIFA fallback runs regardless — costs nothing, no quota to burn.
const YT_FLAG_PATH = "scripts/config/youtube-fetch.json";
const ytFlag = JSON.parse(readFileSync(YT_FLAG_PATH, "utf8"));
const forceEnv = process.env.FORCE_YOUTUBE_FETCH === "true";
let youtubeAvailable = ytFlag.enabled === true || forceEnv;
// Only the FILE-flag path is one-shot — env override doesn't rewrite
// the file, so back-to-back nightly runs work naturally.
const youtubeWasFileEnabled = ytFlag.enabled === true;
if (!youtubeAvailable) {
  console.log(`YouTube fetch disabled (flip scripts/config/youtube-fetch.json → enabled: true or set FORCE_YOUTUBE_FETCH=true to run). FIFA fallback only for this run.\n`);
} else if (forceEnv && !youtubeWasFileEnabled) {
  console.log(`YouTube fetch enabled via FORCE_YOUTUBE_FETCH env (nightly cron).\n`);
}

console.log(`Resolving ${targets.length} match${targets.length === 1 ? "" : "es"}...\n`);

let resolvedYouTube = 0;
let resolvedFifa = 0;
let skipped = 0;
let missed = 0;

for (const t of targets) {
  const existing = normalizeExisting(highlights[t.id]);
  const hasYouTube = Boolean(existing?.youtube);
  const hasFifa = Boolean(existing?.fifa);
  if (!force && hasYouTube) {
    console.log(`- ${t.id} youtube cached`);
    skipped++;
    continue;
  }
  const nameA = teamByCode[t.codeA]?.name ?? t.codeA;
  const nameB = teamByCode[t.codeB]?.name ?? t.codeB;
  const next = { ...(existing ?? {}) };

  // Tier 1: YouTube (skip when in quota cooldown or already cached in
  // this session).
  let ytUrl = null;
  let ytTitle = null;
  if (youtubeAvailable) {
    try {
      const yt = await resolveYouTube(nameA, nameB);
      ytUrl = yt.url;
      ytTitle = yt.title;
    } catch (err) {
      if (/quota exceeded/i.test(err.message)) {
        youtubeAvailable = false;
        console.error(
          `⚠ YouTube quota exhausted mid-run. Falling back to FIFA for remaining matches.`,
        );
      } else {
        // Transient YouTube error ("cannot act on behalf of...") —
        // don't disable the API for the whole run, just for this match.
        console.error(`⚠ ${t.id} youtube: ${err.message}`);
      }
    }
  }

  if (ytUrl) {
    next.youtube = ytUrl;
    // Once YouTube has the canonical video, the FIFA article link is
    // redundant; drop any stale value.
    delete next.fifa;
    next.resolvedAt = new Date().toISOString();
    highlights[t.id] = next;
    console.log(`✓ ${t.id} youtube: ${nameA} vs ${nameB}`);
    console.log(`  → ${ytUrl}`);
    console.log(`  title: ${ytTitle}`);
    resolvedYouTube++;
  } else if (!force && hasFifa) {
    console.log(`- ${t.id} fifa cached; awaiting youtube upload`);
    skipped++;
  } else {
    // Tier 2: FIFA article. Always try when we don't have YouTube —
    // costs nothing (free anonymous HTTP) and guarantees the button
    // shows something meaningful instead of the search fallback.
    try {
      const fifaUrl = await resolveFifa(nameA, nameB);
      if (fifaUrl) {
        next.fifa = fifaUrl;
        next.resolvedAt = new Date().toISOString();
        highlights[t.id] = next;
        console.log(`✓ ${t.id} fifa: ${nameA} vs ${nameB}`);
        console.log(`  → ${fifaUrl}`);
        resolvedFifa++;
      } else {
        console.log(`✗ ${t.id} ${nameA} vs ${nameB} — no youtube video, no fifa article`);
        missed++;
      }
    } catch (err) {
      console.error(`⚠ ${t.id} fifa: ${err.message}`);
      missed++;
    }
  }

  // Persist after each match so a crash mid-run doesn't lose progress.
  writeFileSync(highlightsPath, JSON.stringify(highlights, null, 2) + "\n");

  // Gentle: 1s between matches to avoid hammering FIFA or YouTube.
  if (targets.length > 1) await new Promise((r) => setTimeout(r, 1000));
}

writeFileSync(highlightsPath, JSON.stringify(highlights, null, 2) + "\n");

// One-shot semantics: any run that started with the FILE flag enabled
// resets it to false at the end. Env-forced runs (nightly cron) don't
// touch the file — the recurring schedule is the "opt-in" signal.
if (youtubeWasFileEnabled) {
  ytFlag.enabled = false;
  writeFileSync(YT_FLAG_PATH, JSON.stringify(ytFlag, null, 2) + "\n");
  console.log(`\nYouTube fetch flag reset to false (was one-shot opt-in).`);
}

console.log(
  `\nDone. youtube=${resolvedYouTube} fifa=${resolvedFifa} skipped=${skipped} missed=${missed}`,
);
