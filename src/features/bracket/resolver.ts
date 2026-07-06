import type { BracketMatch, SlotSource } from "../../data/types";
import { matchById } from "./data";

/** Human label for an unresolved slot (e.g. "Winner R16-3", "3rd D"). */
export function slotLabel(source: SlotSource): string {
  switch (source.type) {
    case "group":  return source.ref;
    case "best3":  return `3rd ${source.ref.replace(/^Best3-/, "")}`;
    case "winner": return `Winner ${source.ref}`;
    case "loser":  return `Loser ${source.ref}`;
  }
}

/** Determines the winner of a played match. Null if not played. */
export function winnerCode(m: BracketMatch): string | null {
  if (m.scoreA === null || m.scoreB === null) return null;
  if (m.scoreA > m.scoreB) return m.teamCodeA;
  if (m.scoreA < m.scoreB) return m.teamCodeB;
  if (m.penaltyA !== null && m.penaltyA !== undefined && m.penaltyB !== null && m.penaltyB !== undefined) {
    return m.penaltyA > m.penaltyB ? m.teamCodeA : m.teamCodeB;
  }
  return null;
}

export function loserCode(m: BracketMatch): string | null {
  const w = winnerCode(m);
  if (!w) return null;
  return w === m.teamCodeA ? m.teamCodeB : m.teamCodeA;
}

export function isWinner(m: BracketMatch, code: string | null): boolean {
  if (!code) return false;
  return winnerCode(m) === code;
}

/** Resolves the display code for a slot source, if any. */
export function resolveSlotCode(source: SlotSource, matchTeamCode: string | null): string | null {
  if (matchTeamCode) return matchTeamCode;
  if (source.type === "winner") {
    const dep = matchById(source.ref);
    if (dep) return winnerCode(dep);
  }
  if (source.type === "loser") {
    const dep = matchById(source.ref);
    if (dep) return loserCode(dep);
  }
  return null;
}
