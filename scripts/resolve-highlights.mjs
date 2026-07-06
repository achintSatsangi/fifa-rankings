#!/usr/bin/env node
/**
 * Resolve match-highlight YouTube URLs by querying the YouTube Data API
 * scoped to the official FIFA channel, and cache them into
 * src/data/highlights.json.
 *
 * Usage:
 *   YOUTUBE_API_KEY=... node scripts/resolve-highlights.mjs                    # all played matches
 *   YOUTUBE_API_KEY=... node scripts/resolve-highlights.mjs --match=R16-5      # one match
 *   YOUTUBE_API_KEY=... node scripts/resolve-highlights.mjs --force            # re-resolve even if cached
 *
 * The `.env` file (via `node --env-file=.env`) is the recommended local entrypoint.
 *
 * Get a key: https://console.cloud.google.com/apis/credentials
 *   1. Create/select a project
 *   2. APIs & Services → Library → enable "YouTube Data API v3"
 *   3. Credentials → Create credentials → API key
 *   4. Restrict the key to "YouTube Data API v3" (recommended)
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

const args = new Set(process.argv.slice(2));
const onlyMatch = [...args].find((a) => a.startsWith("--match="))?.split("=")[1];
const force = args.has("--force");

const bracket = JSON.parse(readFileSync("src/data/bracket.json", "utf8"));
const teams = JSON.parse(readFileSync("src/data/teams.json", "utf8"));
const highlightsPath = "src/data/highlights.json";
const highlights = JSON.parse(readFileSync(highlightsPath, "utf8"));

const teamByCode = Object.fromEntries(teams.map((t) => [t.code, t]));

function normalizeExisting(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { youtube: entry };
  return entry;
}

function isPlayed(m) {
  return m.scoreA !== null && m.scoreB !== null && m.teamCodeA && m.teamCodeB;
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

/** FIFA's main match-highlights video on the official channel follows
 *  ONE canonical title pattern:
 *    "Highlights | <TeamA> <X-Y> <TeamB> | FIFA World Cup 2026™"
 *  Anything else — the "🆚 #FIFAWorldCupOnYT" Shorts/reels, Alt Cast
 *  broadcast feeds, pressers, training clips, single-goal edits,
 *  historical recaps — is NOT what a user clicking "watch highlights"
 *  wants. If no video matches the canonical pattern, we return null
 *  and let the client fall back to the FIFA-channel search URL. */
const NEGATIVE_MARKERS = [
  "#fifaworldcupony",   // Shorts/reels (matches #FIFAWorldCupOnYT)
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

/** FIFA's channel uses different team-name spellings than teams.json
 *  (e.g. "Cote d'Ivoire", "Cabo Verde", "USA", "Congo DR"). Aliases
 *  are checked in addition to the canonical name. */
const NAME_ALIASES = {
  "Ivory Coast": ["cote d", "côte d"],
  "DR Congo": ["congo dr", "congo dr.", "dr congo", "democratic republic of congo"],
  "United States": ["usa", "united states of america"],
  "Cape Verde": ["cabo verde"],
  "South Korea": ["korea republic", "republic of korea"],
  "North Korea": ["korea dpr", "dpr korea"],
  "Bosnia and Herzegovina": ["bosnia and herzegovina", "bosnia & herzegovina"],
  "Czech Republic": ["czechia"],
};

function titleContainsName(title, name) {
  if (title.includes(name.toLowerCase())) return true;
  const aliases = NAME_ALIASES[name] ?? [];
  return aliases.some((a) => title.includes(a));
}

function scoreCandidate(item, nameA, nameB) {
  const title = item.snippet.title.toLowerCase();
  if (!titleContainsName(title, nameA) || !titleContainsName(title, nameB)) return -Infinity;
  for (const neg of NEGATIVE_MARKERS) if (title.includes(neg)) return -Infinity;

  // The canonical FIFA main-highlights format. Reject anything else.
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

const played = bracket.filter(isPlayed);
const targets = onlyMatch ? played.filter((m) => m.id === onlyMatch) : played;

if (onlyMatch && targets.length === 0) {
  console.error(`No played match with id=${onlyMatch}`);
  process.exit(1);
}

console.log(`Resolving ${targets.length} match${targets.length === 1 ? "" : "es"}...\n`);

let resolved = 0;
let skipped = 0;
let missed = 0;

for (const m of targets) {
  const existing = normalizeExisting(highlights[m.id]);
  if (!force && existing?.youtube) {
    console.log(`- ${m.id} cached: ${existing.youtube}`);
    skipped++;
    continue;
  }
  const nameA = teamByCode[m.teamCodeA]?.name ?? m.teamCodeA;
  const nameB = teamByCode[m.teamCodeB]?.name ?? m.teamCodeB;
  const query = `${nameA} ${nameB} highlights`;

  try {
    const items = await searchYouTube(query);
    const pick = pickBestMatch(items, nameA, nameB);
    if (pick) {
      const videoUrl = `https://www.youtube.com/watch?v=${pick.id.videoId}`;
      highlights[m.id] = {
        ...(existing ?? {}),
        youtube: videoUrl,
        resolvedAt: new Date().toISOString(),
      };
      console.log(`✓ ${m.id} ${nameA} vs ${nameB}`);
      console.log(`  → ${videoUrl}`);
      console.log(`  title: ${pick.snippet.title}`);
      resolved++;
    } else {
      console.log(`✗ ${m.id} ${nameA} vs ${nameB} — no matching video`);
      if (items.length > 0) {
        console.log(`  top result was: ${items[0].snippet.title}`);
      }
      missed++;
    }
  } catch (err) {
    // Persist whatever we've got so far, then continue. The YouTube
    // API sometimes returns transient "cannot act on behalf of"
    // errors under load; skipping the failing match now lets a later
    // scheduled run pick it up.
    console.error(`⚠ ${m.id} ${nameA} vs ${nameB} — ${err.message} (skipping)`);
    writeFileSync(highlightsPath, JSON.stringify(highlights, null, 2) + "\n");
    missed++;
  }

  // Be gentle: 1.5s between calls. Free tier quota isn't the concern
  // here (search costs 100 units, 100 searches/day), but we don't
  // want to spike QPS.
  if (targets.length > 1) await new Promise((r) => setTimeout(r, 1500));
}

writeFileSync(highlightsPath, JSON.stringify(highlights, null, 2) + "\n");

console.log(`\nDone. resolved=${resolved} skipped=${skipped} missed=${missed}`);
