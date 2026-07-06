import type { BracketMatch, BracketRound } from "../../../data/types";
import { BRACKET, ROUNDS } from "../data";
import { winnerCode } from "../resolver";

/**
 * Radial bracket layout math.
 *
 * The 32 outer team slots are evenly distributed around a circle
 * (OUTER_FLAG_RADIUS). Each round's winners live one ring further in:
 * R32 winners on the R32 ring (0.34), R16 winners on the R16 ring
 * (0.24), and so on toward the trophy at the centre.
 *
 * Each match position is at the angular midpoint of its two source
 * positions. Connectors follow a "bracket" pattern — a short radial
 * stub inward from each source, a tangent arc joining the pair on the
 * shoulder ring, then a single radial stem from the arc's midpoint to
 * the match centre. Same math applies at every ring.
 *
 * All positions are normalised to [0, 1] with (0.5, 0.5) as the centre.
 * `svgPoint` multiplies by 100 for use with SVG viewBox="0 0 100 100".
 */

export type Point = { x: number; y: number };

/** Where the 32 team flags sit (outermost ring). */
export const OUTER_FLAG_RADIUS = 0.44;

/** Where winners of each round appear and where connectors converge. */
export const WINNER_RING_RADIUS: Record<BracketRound, number> = {
  R32: 0.34,
  R16: 0.24,
  QF:  0.15,
  SF:  0.075,
  F:   0,      // Champion = trophy at centre
  "3RD": 0,
};

/** Flag sizes per ring. Winners get smaller flags on inner rings. */
export const FLAG_SIZE: Record<BracketRound | "OUTER", number> = {
  OUTER: 44,
  R32: 34,
  R16: 30,
  QF:  26,
  SF:  22,
  F:   0,      // Champion overlaps the trophy — omit its own flag for now
  "3RD": 0,
};

/** Radial distance of the connector stub from source position inward. */
const STUB_LENGTH = 0.02;

const TWO_PI = Math.PI * 2;

function pointAt(angleRad: number, radius: number): Point {
  return {
    x: 0.5 + radius * Math.sin(angleRad),
    y: 0.5 - radius * Math.cos(angleRad),
  };
}

/** Same as pointAt but scaled to SVG viewBox 0..100. */
export function svgPoint(angleRad: number, radius: number): Point {
  const p = pointAt(angleRad, radius);
  return { x: p.x * 100, y: p.y * 100 };
}

function slotAngle(slotUnits: number): number {
  return (slotUnits / 32) * TWO_PI;
}

/** Angular midpoint of a knockout match, in slot units (0..32). */
function matchSlotUnits(match: BracketMatch): number {
  const [, idxStr] = match.id.split("-");
  const idx = Number(idxStr);
  switch (match.round) {
    case "R32": return 2 * (idx - 1) + 1;
    case "R16": return 4 * (idx - 1) + 2;
    case "QF":  return 8 * (idx - 1) + 4;
    case "SF":  return 16 * (idx - 1) + 8;
    case "F":   return 16;
    case "3RD": return 0;
  }
}

function matchAngle(match: BracketMatch): number {
  return slotAngle(matchSlotUnits(match));
}

/** Outer ring slot i (0..31) — where a specific R32 team's flag sits. */
export function outerSlotPoint(i: number): Point {
  return pointAt(slotAngle(i + 0.5), OUTER_FLAG_RADIUS);
}

export function outerSlotIndex(r32MatchIndex: number, ab: "A" | "B"): number {
  return 2 * (r32MatchIndex - 1) + (ab === "A" ? 0 : 1);
}

/** Position where the match's winner appears (and where connectors converge). */
export function matchCenterPoint(match: BracketMatch): Point {
  return pointAt(matchAngle(match), WINNER_RING_RADIUS[match.round]);
}

export type OuterSlot = {
  slot: number;              // 0..31
  matchId: string;
  ab: "A" | "B";
  teamCode: string | null;
  point: Point;
};

export function outerSlots(): OuterSlot[] {
  const out: OuterSlot[] = [];
  const r32 = BRACKET.filter((m) => m.round === "R32");
  for (const match of r32) {
    const idx = Number(match.id.split("-")[1]);
    (["A", "B"] as const).forEach((ab) => {
      const slot = outerSlotIndex(idx, ab);
      out.push({
        slot,
        matchId: match.id,
        ab,
        teamCode: ab === "A" ? match.teamCodeA : match.teamCodeB,
        point: outerSlotPoint(slot),
      });
    });
  }
  return out.sort((a, b) => a.slot - b.slot);
}

/**
 * The round at which a team was eliminated, or null if still alive.
 * A team is "eliminated" if they lost their most recent played match.
 */
export function eliminationRound(teamCode: string): BracketRound | null {
  for (const round of ROUNDS) {
    const match = BRACKET.find(
      (m) => m.round === round && (m.teamCodeA === teamCode || m.teamCodeB === teamCode),
    );
    if (!match) continue;
    if (match.scoreA === null || match.scoreB === null) continue;
    const w = winnerCode(match);
    if (w && w !== teamCode) return round;
  }
  return null;
}

/**
 * Per-match geometry for the bracket-style connectors. `null` if the
 * match isn't connected in the standard tree (e.g. 3rd-place playoff,
 * or an R16+ slot that doesn't reference a winner match).
 */
export type MatchGeometry = {
  matchId: string;
  round: BracketRound;
  sourceRadius: number;
  matchRadius: number;
  shoulderRadius: number;
  angleA: number;
  angleB: number;
  angleMid: number;
};

function computeGeometry(match: BracketMatch): MatchGeometry | null {
  const matchRadius = WINNER_RING_RADIUS[match.round];
  const angleMid = matchAngle(match);

  let angleA: number, angleB: number, sourceRadius: number;
  if (match.round === "R32") {
    const idx = Number(match.id.split("-")[1]);
    angleA = slotAngle(outerSlotIndex(idx, "A") + 0.5);
    angleB = slotAngle(outerSlotIndex(idx, "B") + 0.5);
    sourceRadius = OUTER_FLAG_RADIUS;
  } else {
    if (match.slotA.type !== "winner" || match.slotB.type !== "winner") return null;
    const depA = BRACKET.find((m) => m.id === (match.slotA as { ref: string }).ref);
    const depB = BRACKET.find((m) => m.id === (match.slotB as { ref: string }).ref);
    if (!depA || !depB) return null;
    angleA = matchAngle(depA);
    angleB = matchAngle(depB);
    sourceRadius = WINNER_RING_RADIUS[depA.round];
  }

  return {
    matchId: match.id,
    round: match.round,
    sourceRadius,
    matchRadius,
    shoulderRadius: Math.max(sourceRadius - STUB_LENGTH, matchRadius + 0.005),
    angleA,
    angleB,
    angleMid,
  };
}

export function bracketGeometry(): MatchGeometry[] {
  return BRACKET.filter((m) => m.round !== "3RD")
    .map(computeGeometry)
    .filter((x): x is MatchGeometry => x !== null);
}
