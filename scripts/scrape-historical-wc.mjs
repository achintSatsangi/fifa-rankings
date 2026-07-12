#!/usr/bin/env node
/**
 * Scrape a historical FIFA World Cup's knockout stage from Wikipedia
 * and emit a JSON file under src/data/historical/<year>.json.
 *
 * Wikipedia's `<year> FIFA World Cup knockout stage` article uses the
 * `{{Football box}}` template for each match. We fetch the wikitext
 * via the MediaWiki parse API, walk section headers to assign a
 * round to each match, and pull out date / teams / score / venue.
 *
 * Usage:
 *   node scripts/scrape-historical-wc.mjs 2022
 *   node scripts/scrape-historical-wc.mjs 2018
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const year = process.argv[2];
if (!year || !/^\d{4}$/.test(year)) {
  console.error("Usage: node scripts/scrape-historical-wc.mjs <year>");
  process.exit(1);
}

const KNOCKOUT_PAGE = `${year}_FIFA_World_Cup_knockout_stage`;
const API = `https://en.wikipedia.org/w/api.php?action=parse&page=${KNOCKOUT_PAGE}&format=json&prop=wikitext&redirects=1`;

// Wikipedia section header depth for the round groupings. `== Round of 16 ==`
// is depth-2 (== ==), sub-matches are depth-3 (=== ===), etc.
const ROUND_SECTIONS = [
  { header: /^Round of 16$/i, round: "R16" },
  { header: /^Quarter-?finals?$/i, round: "QF" },
  { header: /^Semi-?finals?$/i, round: "SF" },
  { header: /^(Match for )?Third[- ]place( play[- ]?off)?$/i, round: "3RD" },
  { header: /^Final$/i, round: "F" },
];

async function fetchWikitext(page) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&format=json&prop=wikitext&redirects=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "fifa-ranking-scraper/1.0 (https://github.com/achintSatsangi/fifa-rankings; personal side project)",
      Accept: "application/json",
    },
  });
  const text = await res.text();
  if (!text.trim().startsWith("{")) {
    // Wikipedia returns an HTML rate-limit / error page instead of
    // JSON when it's cranky. Surface that so we can back off.
    throw new Error(`non-JSON response (status ${res.status}): ${text.slice(0, 100)}`);
  }
  const d = JSON.parse(text);
  if (d.error) throw new Error(`Wikipedia API: ${d.error.info}`);
  return d.parse?.wikitext?.["*"] ?? "";
}

/** Small delay to stay polite with Wikipedia's per-IP rate limit —
 *  it 429s when you burst through multiple parses quickly. */
async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Balanced-brace extraction of `{{name...}}` templates that may
 *  contain nested `{{...}}`. Returns array of full template strings
 *  in document order, each with its start index. */
function extractTemplates(text, name) {
  const marker = `{{${name}`;
  const out = [];
  let i = 0;
  while (true) {
    const start = text.indexOf(marker, i);
    if (start < 0) return out;
    let depth = 1;
    let j = start + 2;
    while (j < text.length && depth > 0) {
      if (text.slice(j, j + 2) === "{{") { depth++; j += 2; }
      else if (text.slice(j, j + 2) === "}}") { depth--; j += 2; }
      else j++;
    }
    out.push({ start, text: text.slice(start, j) });
    i = j;
  }
}

/** Iterate section headers (== Title == or === Title ===) with their
 *  start positions. Lets us associate a Football box's start offset
 *  with the round header that precedes it. */
function extractSections(text) {
  const out = [];
  // Match headers of any depth; capture title and depth for filtering.
  const rx = /^(={2,4})\s*(.+?)\s*\1\s*$/gm;
  let m;
  while ((m = rx.exec(text)) !== null) {
    out.push({ start: m.index, title: m[2].trim(), depth: m[1].length });
  }
  return out;
}

/** Parse a Football box template body into an object with the fields
 *  we care about. Wikipedia's template supports many variants; we
 *  handle the common ones from 2010-2022 knockout pages. */
function parseFootballBox(templateText) {
  // Split top-level pipe-separated params (respecting nested braces).
  const body = templateText.slice(2, -2); // strip outer {{ }}
  const parts = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === "{{" || two === "[[") { depth++; buf += two; i++; continue; }
    if (two === "}}" || two === "]]") { depth--; buf += two; i++; continue; }
    if (body[i] === "|" && depth === 0) { parts.push(buf); buf = ""; continue; }
    buf += body[i];
  }
  parts.push(buf);
  // parts[0] is the template name; rest are "key=value" (may be empty).
  const params = {};
  for (const p of parts.slice(1)) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const key = p.slice(0, eq).trim();
    const value = p.slice(eq + 1).trim();
    params[key] = value;
  }

  const date = extractDate(params.date ?? "");
  const time = params.time ?? null;
  const teamA = extractTeamCode(params.team1 ?? "");
  const teamB = extractTeamCode(params.team2 ?? "");
  const parsed = extractScore(params.score ?? "");
  // Some templates use a separate `aet=yes` param instead of inlining
  // {{aet}} into the score field (2006-era pattern).
  const extraTime = parsed.extraTime || /^\s*yes\s*$/i.test(params.aet ?? "");
  const venue = extractVenue(params.stadium ?? "");

  // Wikipedia's Football box supports a compact `|penaltyscore=4–2`
  // param that some finals use instead of inlining "(p)" into `|score`
  // (1994, 2006, 2022 finals all use this). Fall back to it if the
  // inline extraction didn't find penalties.
  let penaltyA = parsed.penaltyA, penaltyB = parsed.penaltyB;
  if ((penaltyA === null || penaltyB === null) && params.penaltyscore) {
    const m = params.penaltyscore.match(/(\d+)\s*[–\-−]\s*(\d+)/);
    if (m) { penaltyA = Number(m[1]); penaltyB = Number(m[2]); }
  }

  return {
    date, time,
    teamA, teamB,
    scoreA: parsed.scoreA, scoreB: parsed.scoreB,
    extraTime,
    penaltyA, penaltyB,
    venue,
  };
}

function extractDate(v) {
  // {{Start date|2022|12|3|df=y}} → 2022-12-03. Case-insensitive
  // because 2006-era articles use lowercase `start date`.
  const m = v.match(/\{\{start date\|(\d{4})\|(\d{1,2})\|(\d{1,2})/i);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Fallback: bare "3 December 2022"
  return v.replace(/\{\{[^}]*\}\}/g, "").trim() || null;
}

function extractTeamCode(v) {
  // Wikipedia has many team-code template variants across years; try
  // each in priority order (modern first, older fallbacks after).
  const patterns = [
    /\{\{#invoke:flagg\|[^{}]*\|([A-Z]{2,4})\s*\}\}/, // {{#invoke:flagg|main|unpre|avar=fb|NED}}
    /\{\{fb-rt\|([A-Z]{2,4})/,                        // {{fb-rt|FRA|1974}}
    /\{\{fb-r\|([A-Z]{2,4})/,                         // {{fb-r|FRA}}
    /\{\{fb-w\|([A-Z]{2,4})/,                         // {{fb-w|NED}}
    /\{\{fbw\|([A-Z]{2,4})/,                          // {{fbw|NED}}
    /\{\{fb\|([A-Z]{2,4})\s*[|}]/,                    // {{fb|NED}} or {{fb|NED|extra}}
    /\{\{fbicon\|([A-Z]{2,4})/,                       // {{fbicon|NED}}
    /\{\{football\|team=([A-Z]{2,4})/i,               // {{football|team=NED|...}}
  ];
  for (const p of patterns) {
    const m = v.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractScore(v) {
  // {{score link|...|3–1}} → 3-1
  // "3–1" (en dash)
  // "0–0 {{aet}}" — after extra time
  // "1–1 {{aet}}<br />[[penalty shoot-out|3–2 (p)]]" — pens
  // Strip Wikipedia templates that wrap the score.
  const cleaned = v.replace(/\{\{score link\|[^|]+\|/g, "").replace(/\}\}/g, "");
  // Detect extra time
  const extraTime = /\baet\b|extra[- ]time/i.test(v);
  // Penalty scores — pattern like "3–2 (p)" or "4–2 pen"
  let penaltyA = null, penaltyB = null;
  const penMatch = v.match(/(\d+)[–\-−](\d+)\s*(?:\(p\)|pen)/i);
  if (penMatch) { penaltyA = Number(penMatch[1]); penaltyB = Number(penMatch[2]); }
  // Main score: first N–M in the string that isn't the penalty group.
  const scoreMatches = [...cleaned.matchAll(/(\d+)\s*[–\-−]\s*(\d+)/g)];
  let scoreA = null, scoreB = null;
  if (scoreMatches.length > 0) {
    const [, a, b] = scoreMatches[0];
    scoreA = Number(a); scoreB = Number(b);
  }
  return { scoreA, scoreB, extraTime, penaltyA, penaltyB };
}

function extractVenue(v) {
  // "[[Khalifa International Stadium]], [[Al Rayyan (city)|Al Rayyan]]"
  // → "Khalifa International Stadium, Al Rayyan"
  return v
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim() || null;
}

function roundForOffset(offset, sections) {
  // Walk backward through section headers before `offset` and return
  // the first one whose title matches a known round.
  let round = null;
  for (const s of sections) {
    if (s.start > offset) break;
    for (const { header, round: r } of ROUND_SECTIONS) {
      if (header.test(s.title)) { round = r; break; }
    }
  }
  return round;
}

async function scrapePage(pageTitle, forcedRound = null) {
  const wt = await fetchWikitext(pageTitle);
  if (!wt) return [];
  const boxes = extractTemplates(wt, "Football box");
  const sections = extractSections(wt);
  const inline = boxes
    .map((b) => {
      const round = forcedRound ?? roundForOffset(b.start, sections);
      const parsed = parseFootballBox(b.text);
      return { round, ...parsed };
    })
    .filter((m) => m.round && m.teamA && m.teamB && m.scoreA !== null);

  // Follow {{#lst:PageName|LabelName}} transclusions — used when a
  // knockout match has its own dedicated article (e.g. "Battle of
  // Nuremberg" for 2006 POR-NED R16). The match's Football box lives
  // on the target page, wrapped in `<section begin=Label />` markers.
  const lsts = extractLstTransclusions(wt);
  const transcluded = [];
  for (const lst of lsts) {
    const round = forcedRound ?? roundForOffset(lst.offset, sections);
    if (!round) continue;
    try {
      await sleep(1200);
      const parsed = await scrapeLstSection(lst.page, lst.label);
      for (const p of parsed) {
        if (p.teamA && p.teamB && p.scoreA !== null) {
          transcluded.push({ round, ...p });
        }
      }
    } catch (err) {
      console.warn(`  lst fetch failed for ${lst.page}#${lst.label}: ${err.message}`);
    }
  }

  return [...inline, ...transcluded];
}

/** Find `{{#lst:PageName|LabelName}}` transclusions and record their
 *  offset so we can look up the containing round. */
function extractLstTransclusions(wt) {
  const rx = /\{\{#lst:([^|}]+)\|([^|}]+)\}\}/g;
  const out = [];
  let m;
  while ((m = rx.exec(wt)) !== null) {
    out.push({ page: m[1].trim(), label: m[2].trim(), offset: m.index });
  }
  return out;
}

/** Fetch target page, extract content between the labeled section
 *  markers, parse Football boxes inside. */
async function scrapeLstSection(page, label) {
  const wt = await fetchWikitext(page);
  if (!wt) return [];
  const escLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(
    `<section\\s+begin\\s*=\\s*"?${escLabel}"?\\s*/>([\\s\\S]*?)<section\\s+end\\s*=\\s*"?${escLabel}"?\\s*/>`,
    "i",
  );
  const m = wt.match(rx);
  if (!m) return [];
  const boxes = extractTemplates(m[1], "Football box");
  return boxes.map((b) => parseFootballBox(b.text));
}

async function main() {
  console.log(`Scraping ${KNOCKOUT_PAGE}...`);
  const knockoutMatches = await scrapePage(KNOCKOUT_PAGE);
  console.log(`  parsed ${knockoutMatches.length} matches from knockout page`);

  // The Final and (sometimes) individual knockout matches live on their
  // own pages — the knockout stage article uses `{{main|...}}` pointers.
  // Fetch the Final separately so it never goes missing.
  await sleep(2000);
  const finalPageTitle = `${year}_FIFA_World_Cup_final`;
  let finalMatches = [];
  try {
    console.log(`Scraping ${finalPageTitle}...`);
    finalMatches = await scrapePage(finalPageTitle, "F");
    console.log(`  parsed ${finalMatches.length} matches from final page`);
  } catch (err) {
    console.warn(`  final page not scraped: ${err.message}`);
  }

  // Merge — dedupe on (round, teamA, teamB) in case the final was
  // ALSO present on the knockout page.
  const seen = new Set();
  const matches = [];
  for (const m of [...knockoutMatches, ...finalMatches]) {
    const key = `${m.round}|${m.teamA}|${m.teamB}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push(m);
  }

  console.log(`\nTotal: ${matches.length} matches`);
  const byRound = {};
  for (const m of matches) byRound[m.round] = (byRound[m.round] ?? 0) + 1;
  console.log(`  by round: ${JSON.stringify(byRound)}`);

  const outDir = "src/data/historical";
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = `${outDir}/${year}.json`;
  const output = {
    year: Number(year),
    source: `https://en.wikipedia.org/wiki/${KNOCKOUT_PAGE}`,
    scrapedAt: new Date().toISOString().slice(0, 10),
    matches,
  };
  writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`  wrote ${outPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
