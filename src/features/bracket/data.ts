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
