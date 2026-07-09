import type { BracketMatch, GroupMatch } from "../../data/types";
import { GROUPS } from "../groups/data";
import { BRACKET } from "../bracket/data";

export type JourneyResult = "W" | "D" | "L" | null;

export type JourneyRow = {
  stage: string;
  /** Compact stage label for narrow viewports:
   *   Group stage → "M<groupId><matchDay>"  (e.g. MA1, MD3)
   *   Bracket     → "R32" / "R16" / "QF" / "SF" / "3rd" / "F" */
  stageShort: string;
  date: string;
  venue: string;
  opponentCode: string | null;
  teamScore: number | null;
  opponentScore: number | null;
  teamPen: number | null;
  opponentPen: number | null;
  extraTime: boolean;
  result: JourneyResult;
  matchId: string;
  played: boolean;
};

function labelForRound(round: BracketMatch["round"]): string {
  switch (round) {
    case "R32": return "Round of 32";
    case "R16": return "Round of 16";
    case "QF":  return "Quarter-final";
    case "SF":  return "Semi-final";
    case "3RD": return "Third-place";
    case "F":   return "Final";
  }
}

function shortLabelForRound(round: BracketMatch["round"]): string {
  switch (round) {
    case "R32": return "R32";
    case "R16": return "R16";
    case "QF":  return "QF";
    case "SF":  return "SF";
    case "3RD": return "3rd";
    case "F":   return "F";
  }
}

function resultFromScores(a: number | null, b: number | null, penA: number | null, penB: number | null): JourneyResult {
  if (a === null || b === null) return null;
  if (a > b) return "W";
  if (a < b) return "L";
  if (penA !== null && penB !== null) return penA > penB ? "W" : "L";
  return "D";
}

function rowFromGroupMatch(teamCode: string, m: GroupMatch, groupId: string): JourneyRow {
  const isHome = m.homeCode === teamCode;
  const opponentCode = isHome ? m.awayCode : m.homeCode;
  const teamScore = isHome ? m.homeScore : m.awayScore;
  const opponentScore = isHome ? m.awayScore : m.homeScore;
  const played = teamScore !== null && opponentScore !== null;
  return {
    stage: `Group ${groupId} · MD${m.matchDay}`,
    stageShort: `M${groupId}${m.matchDay}`,
    date: m.date,
    venue: m.venue,
    opponentCode,
    teamScore,
    opponentScore,
    teamPen: null,
    opponentPen: null,
    extraTime: false,
    result: resultFromScores(teamScore, opponentScore, null, null),
    matchId: `G-${groupId}-${m.matchDay}-${m.homeCode}-${m.awayCode}`,
    played,
  };
}

function rowFromBracketMatch(teamCode: string, m: BracketMatch): JourneyRow | null {
  const isA = m.teamCodeA === teamCode;
  const isB = m.teamCodeB === teamCode;
  if (!isA && !isB) return null;
  const opponentCode = isA ? m.teamCodeB : m.teamCodeA;
  const teamScore = isA ? m.scoreA : m.scoreB;
  const opponentScore = isA ? m.scoreB : m.scoreA;
  const teamPen = isA ? (m.penaltyA ?? null) : (m.penaltyB ?? null);
  const opponentPen = isA ? (m.penaltyB ?? null) : (m.penaltyA ?? null);
  const played = teamScore !== null && opponentScore !== null;
  return {
    stage: labelForRound(m.round),
    stageShort: shortLabelForRound(m.round),
    date: m.date,
    venue: m.venue,
    opponentCode,
    teamScore,
    opponentScore,
    teamPen,
    opponentPen,
    extraTime: Boolean(m.extraTime),
    result: resultFromScores(teamScore, opponentScore, teamPen, opponentPen),
    matchId: m.id,
    played,
  };
}

export function buildJourney(teamCode: string): JourneyRow[] {
  const rows: JourneyRow[] = [];
  for (const group of GROUPS) {
    if (!group.teamCodes.includes(teamCode)) continue;
    for (const m of group.matches) {
      if (m.homeCode === teamCode || m.awayCode === teamCode) {
        rows.push(rowFromGroupMatch(teamCode, m, group.id));
      }
    }
  }
  for (const m of BRACKET) {
    const row = rowFromBracketMatch(teamCode, m);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return rows;
}

export function currentStageLabel(teamCode: string): string {
  const rows = buildJourney(teamCode);
  const played = rows.filter((r) => r.played);
  if (played.length === 0) return "Not started";
  const last = played[played.length - 1];
  if (last.result === "L" && last.stage !== "Third-place" && last.stage !== "Final") {
    return `Eliminated · ${last.stage}`;
  }
  const nextUnplayed = rows.find((r) => !r.played);
  if (nextUnplayed) return `Playing · ${nextUnplayed.stage}`;
  if (last.stage === "Final" && last.result === "W") return "Champion";
  return last.stage;
}
