#!/usr/bin/env node
/**
 * One-shot refresh of src/data/{groups,bracket}.json from football-data.org.
 *
 * Uses 2 requests against the 10/min free-tier budget. Run with:
 *
 *   node --env-file=.env scripts/refresh-live.mjs
 *
 * Preserves fields the API doesn't return (venue, our slot structure);
 * overwrites scores/status/dates. Team `tla` codes returned by the API
 * are our FIFA broadcast codes, so no code mapping is needed.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Accept both names for backward compat with the old client-side integration.
const KEY = process.env.FOOTBALL_DATA_KEY ?? process.env.VITE_FOOTBALL_DATA_KEY;
const COMP = process.env.FOOTBALL_DATA_COMPETITION ?? process.env.VITE_FOOTBALL_DATA_COMPETITION ?? "WC";
if (!KEY) {
  console.error("Missing FOOTBALL_DATA_KEY. Locally: node --env-file=.env scripts/refresh-live.mjs. CI: set the FOOTBALL_DATA_KEY repo secret.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");

const STAGE_ROUND = {
  LAST_32: "R32",
  LAST_16: "R16",
  QUARTER_FINALS: "QF",
  SEMI_FINALS: "SF",
  THIRD_PLACE: "3RD",
  FINAL: "F",
};

async function fetchApi(path) {
  const res = await fetch(`https://api.football-data.org/v4${path}`, {
    headers: { "X-Auth-Token": KEY, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET ${path} → HTTP ${res.status}\n${body}`);
  }
  return res.json();
}

const readJson = async (name) => JSON.parse(await readFile(join(dataDir, name), "utf8"));
const writeJson = async (name, data) =>
  writeFile(join(dataDir, name), JSON.stringify(data, null, 2) + "\n");

/** Return the winner of a completed knockout match, or null if the
 *  result is missing / a draw without penalty shootout. */
function winnerOf(m) {
  if (m.scoreA === null || m.scoreB === null) return null;
  if (m.scoreA > m.scoreB) return m.teamCodeA;
  if (m.scoreB > m.scoreA) return m.teamCodeB;
  if (m.penaltyA != null && m.penaltyB != null) {
    return m.penaltyA > m.penaltyB ? m.teamCodeA : m.teamCodeB;
  }
  return null;
}

/** Walk the bracket and fill any null teamCodeA/teamCodeB whose slot
 *  references a played predecessor's winner. Iterates to a fixpoint so
 *  a single R16 update can cascade all the way to the Final. */
function resolveKnockoutSlots(bracket) {
  const byId = new Map(bracket.map((m) => [m.id, m]));
  const resolveSlot = (slot) => {
    if (!slot || slot.type !== "winner") return null;
    const src = byId.get(slot.ref);
    return src ? winnerOf(src) : null;
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of bracket) {
      if (!m.teamCodeA && m.slotA) {
        const w = resolveSlot(m.slotA);
        if (w) { m.teamCodeA = w; changed = true; }
      }
      if (!m.teamCodeB && m.slotB) {
        const w = resolveSlot(m.slotB);
        if (w) { m.teamCodeB = w; changed = true; }
      }
    }
  }
}

console.log(`Fetching ${COMP} matches + standings…`);
const [matchesResp, standingsResp] = await Promise.all([
  fetchApi(`/competitions/${COMP}/matches`),
  fetchApi(`/competitions/${COMP}/standings`),
]);
console.log(`  matches: ${matchesResp.matches.length}, standings groups: ${standingsResp.standings.length}`);

const groups = await readJson("groups.json");
const bracket = await readJson("bracket.json");

// ---- Group matches ----
const groupMatchIndex = new Map();
for (const g of groups) {
  for (const m of g.matches) {
    groupMatchIndex.set(`${g.id}|${m.matchDay}|${m.homeCode}|${m.awayCode}`, m);
  }
}

let groupMatchUpdates = 0;
for (const api of matchesResp.matches) {
  if (api.stage !== "GROUP_STAGE") continue;
  const gId = api.group?.replace("GROUP_", "");
  const key = `${gId}|${api.matchday}|${api.homeTeam.tla}|${api.awayTeam.tla}`;
  const local = groupMatchIndex.get(key);
  if (!local) {
    console.warn(`  ⚠ group match not found locally: ${key}`);
    continue;
  }
  const before = `${local.homeScore}-${local.awayScore}`;
  local.homeScore = api.score.fullTime.home;
  local.awayScore = api.score.fullTime.away;
  // Store the full UTC kickoff so the client can render local time,
  // but keep the venue-local `date` — utcDate drifts a day forward
  // for late US-evening kickoffs.
  local.utcDate = api.utcDate;
  const after = `${local.homeScore}-${local.awayScore}`;
  if (before !== after) {
    groupMatchUpdates++;
    console.log(`  ${key}: ${before} → ${after}`);
  }
}

// ---- Standings ----
let standingsUpdates = 0;
for (const s of standingsResp.standings) {
  if (s.type !== "TOTAL" || s.stage !== "GROUP_STAGE" || !s.group) continue;
  const gId = s.group.replace("GROUP_", "");
  const g = groups.find((x) => x.id === gId);
  if (!g) continue;
  g.standings = s.table.map((row) => ({
    code: row.team.tla,
    position: row.position,
    played: row.playedGames,
    won: row.won,
    drawn: row.draw,
    lost: row.lost,
    gf: row.goalsFor,
    ga: row.goalsAgainst,
    gd: row.goalDifference,
    points: row.points,
  }));
  standingsUpdates++;
}

// ---- Bracket ----
// Propagate R16 winners → QF (and QF → SF, SF → F) so downstream
// slots have concrete teamCodeA/teamCodeB before we try to match
// them against the API's later-round results. Without this pass,
// API matches like "QF ARG vs SUI" fail to find a local bracket
// entry because our QF-4 still reads {teamCodeA: null, teamCodeB: null}.
resolveKnockoutSlots(bracket);

let bracketUpdates = 0;
let bracketMissing = 0;
for (const api of matchesResp.matches) {
  if (api.stage === "GROUP_STAGE") continue;
  const round = STAGE_ROUND[api.stage];
  if (!round) continue;
  const home = api.homeTeam.tla;
  const away = api.awayTeam.tla;
  const target = bracket.find(
    (bm) =>
      bm.round === round &&
      ((bm.teamCodeA === home && bm.teamCodeB === away) ||
        (bm.teamCodeA === away && bm.teamCodeB === home)),
  );
  if (!target) {
    bracketMissing++;
    console.warn(`  ⚠ bracket match not found: ${round} ${home} vs ${away}`);
    continue;
  }
  const swapped = target.teamCodeA !== home;

  // football-data's `fullTime` includes penalty shootout conversions
  // for pen-decided matches, so subtract them out to get the real
  // regulation/extra-time score we want to display.
  const isPen = api.score.duration === "PENALTY_SHOOTOUT";
  const pens = api.score.penalties ?? { home: null, away: null };
  const regHome = isPen ? api.score.fullTime.home - (pens.home ?? 0) : api.score.fullTime.home;
  const regAway = isPen ? api.score.fullTime.away - (pens.away ?? 0) : api.score.fullTime.away;

  const before = `${target.scoreA}-${target.scoreB}`;
  target.scoreA = swapped ? regAway : regHome;
  target.scoreB = swapped ? regHome : regAway;
  target.penaltyA = swapped ? pens.away ?? null : pens.home ?? null;
  target.penaltyB = swapped ? pens.home ?? null : pens.away ?? null;
  if (api.score.duration && api.score.duration !== "REGULAR") {
    target.extraTime = true;
  } else if ("extraTime" in target) {
    delete target.extraTime;
  }
  // Store the full UTC kickoff for client-side local-time formatting.
  // Keep `target.date` untouched — utcDate drifts a day for late US
  // evening kickoffs and we want the venue's calendar date to display.
  target.utcDate = api.utcDate;
  const after = `${target.scoreA}-${target.scoreB}`;
  if (before !== after) {
    bracketUpdates++;
    console.log(`  ${target.id}: ${before} → ${after} (${home} v ${away})`);
  }
}

// Second pass: some of the API results we just applied are R16 games
// whose scores were previously unknown — resolving them may now fill
// downstream QF/SF slots that were still null. Run the resolver again
// so subsequent runs (and the client-side bracket) reflect the full
// chain from newly-played matches.
resolveKnockoutSlots(bracket);

await writeJson("groups.json", groups);
await writeJson("bracket.json", bracket);

console.log(`\n✓ Refresh complete`);
console.log(`  group matches updated: ${groupMatchUpdates}`);
console.log(`  group standings updated: ${standingsUpdates}`);
console.log(`  bracket matches updated: ${bracketUpdates}`);
if (bracketMissing) console.log(`  bracket matches missed: ${bracketMissing}`);
