import bracketData from "../../data/bracket.json";
import type { BracketMatch, BracketRound } from "../../data/types";

export const BRACKET = bracketData as BracketMatch[];

const BY_ID = new Map(BRACKET.map((m) => [m.id, m]));

export function matchById(id: string | null | undefined): BracketMatch | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export const ROUNDS: BracketRound[] = ["R32", "R16", "QF", "SF", "3RD", "F"];

export function matchesByRound(round: BracketRound): BracketMatch[] {
  return BRACKET.filter((m) => m.round === round);
}

/**
 * Tree-order sort key: each match takes its parent's key × 10 plus 0
 * for slot A or 1 for slot B. Recurses to the Final (key 0). Ensures
 * matches from the same round come out in the order they'd appear in
 * a nicely-drawn bracket tree — pairs are always adjacent — regardless
 * of what internal `R32-1`/`R16-3` numbers we assigned.
 */
const ORDER_KEY_CACHE = new Map<string, number>();

function treeOrderKey(m: BracketMatch): number {
  const cached = ORDER_KEY_CACHE.get(m.id);
  if (cached !== undefined) return cached;
  let key: number;
  if (m.round === "F") key = 0;
  else if (!m.feedsInto) key = Number.MAX_SAFE_INTEGER;
  else {
    const parent = BY_ID.get(m.feedsInto.matchId);
    const parentKey = parent ? treeOrderKey(parent) : Number.MAX_SAFE_INTEGER;
    key = parentKey * 10 + (m.feedsInto.slot === "A" ? 0 : 1);
  }
  ORDER_KEY_CACHE.set(m.id, key);
  return key;
}

export function matchesByRoundInTreeOrder(round: BracketRound): BracketMatch[] {
  return matchesByRound(round).sort((a, b) => treeOrderKey(a) - treeOrderKey(b));
}
