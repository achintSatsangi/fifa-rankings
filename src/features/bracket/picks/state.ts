import type { BracketMatch, SlotSource } from "../../../data/types";
import { TEAMS } from "../../teams/data";
import { BRACKET, matchById } from "../data";
import {
  OUTER_FLAG_RADIUS,
  WINNER_RING_RADIUS,
  matchCenterPoint,
  outerSlotIndex,
  outerSlotPoint,
  type Point,
} from "../radial/layout";
import type { Picks } from "./store";

export type TeamPickState = {
  code: string;
  /** Where the flag renders — either the team's outer slot or the
   *  centre of the last match they won. */
  point: Point;
  radius: number;
  /** True if the team lost their most recent picked match. */
  eliminated: boolean;
  /** The next match the team would play, if they're still alive and
   *  the match exists (Final winners have no next match). */
  nextMatch: BracketMatch | null;
  /** Whether both slots of `nextMatch` are resolved — i.e. the team
   *  actually has an opponent and could be advanced by a click. */
  canAdvance: boolean;
};

/** Which R32 match + side is a team in? */
function findR32(teamCode: string): { match: BracketMatch; side: "A" | "B" } | null {
  for (const m of BRACKET) {
    if (m.round !== "R32") continue;
    if (m.teamCodeA === teamCode) return { match: m, side: "A" };
    if (m.teamCodeB === teamCode) return { match: m, side: "B" };
  }
  return null;
}

/** Team occupying a slot of a match, given current picks. */
export function resolveSlotTeam(slot: SlotSource, match: BracketMatch, side: "A" | "B", picks: Picks): string | null {
  if (slot.type === "winner") return picks[slot.ref] ?? null;
  if (slot.type === "loser") {
    const src = matchById(slot.ref);
    if (!src) return null;
    const winner = picks[slot.ref];
    if (!winner) return null;
    if (src.teamCodeA === winner) return src.teamCodeB;
    if (src.teamCodeB === winner) return src.teamCodeA;
    return null;
  }
  // group / best3 — team is known from the bracket data itself.
  return side === "A" ? match.teamCodeA : match.teamCodeB;
}

function opponentIn(match: BracketMatch, teamCode: string, picks: Picks): string | null {
  const a = resolveSlotTeam(match.slotA, match, "A", picks);
  const b = resolveSlotTeam(match.slotB, match, "B", picks);
  if (a === teamCode) return b;
  if (b === teamCode) return a;
  return null;
}

/** Compute one team's current state given a picks map. */
function stateFor(teamCode: string, picks: Picks): TeamPickState | null {
  const r32 = findR32(teamCode);
  if (!r32) return null;

  let currentMatch: BracketMatch | null = r32.match;
  let lastWon: BracketMatch | null = null;
  let eliminated = false;

  while (currentMatch) {
    const pick = picks[currentMatch.id];
    if (pick === undefined) break;
    if (pick !== teamCode) {
      eliminated = true;
      break;
    }
    lastWon = currentMatch;
    const nextId: string | undefined = currentMatch.feedsInto?.matchId;
    const nextMatch: BracketMatch | null = nextId ? (matchById(nextId) ?? null) : null;
    currentMatch = nextMatch;
  }

  let point: Point;
  let radius: number;
  if (lastWon) {
    point = matchCenterPoint(lastWon);
    radius = WINNER_RING_RADIUS[lastWon.round];
  } else {
    const slot = outerSlotIndex(r32.match.id, r32.side);
    point = outerSlotPoint(slot);
    radius = OUTER_FLAG_RADIUS;
  }

  const nextMatch = eliminated ? null : currentMatch;
  const canAdvance = nextMatch !== null && opponentIn(nextMatch, teamCode, picks) !== null;

  return { code: teamCode, point, radius, eliminated, nextMatch, canAdvance };
}

export function computeTeamStates(picks: Picks): TeamPickState[] {
  const out: TeamPickState[] = [];
  for (const team of TEAMS) {
    if (!team.advanced) continue;
    const s = stateFor(team.code, picks);
    if (s) out.push(s);
  }
  return out;
}
