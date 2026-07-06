import type { BracketMatch, BracketRound } from "../../../data/types";
import { BRACKET, ROUNDS } from "../data";
import { winnerCode } from "../resolver";

/**
 * Radial bracket layout math.
 *
 * The 32 outer team slots are evenly distributed around a circle.
 * Each match center is the angular midpoint of its two source positions
 * (for R32: the two outer team slots; for later rounds: the two source
 * matches' centers). Radii shrink round-by-round toward the trophy.
 *
 * All positions are normalised to [0, 1] with (0.5, 0.5) as the centre.
 * Multiply by container size (or 100 for SVG viewBox=0..100) to render.
 */

export type Point = { x: number; y: number };

export const RING_RADIUS: Record<BracketRound, number> = {
  R32: 0.44,
  R16: 0.34,
  QF:  0.24,
  SF:  0.15,
  F:   0.075,
  "3RD": 0,
};

export const FLAG_SIZE: Record<BracketRound | "OUTER", number> = {
  OUTER: 44,
  R32: 44,
  R16: 34,
  QF:  30,
  SF:  26,
  F:   24,
  "3RD": 0,
};

const TWO_PI = Math.PI * 2;

function pointAt(angleRad: number, radius: number): Point {
  return {
    x: 0.5 + radius * Math.sin(angleRad),
    y: 0.5 - radius * Math.cos(angleRad),
  };
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

/** Outer ring slot i (0..31) — where a specific R32 team's flag sits. */
export function outerSlotPoint(i: number): Point {
  return pointAt(slotAngle(i + 0.5), RING_RADIUS.R32);
}

export function outerSlotIndex(r32MatchIndex: number, ab: "A" | "B"): number {
  return 2 * (r32MatchIndex - 1) + (ab === "A" ? 0 : 1);
}

/** Match-centre point on its own ring. */
export function matchCenterPoint(match: BracketMatch): Point {
  return pointAt(slotAngle(matchSlotUnits(match)), RING_RADIUS[match.round]);
}

export type OuterSlot = {
  slot: number;              // 0..31
  matchId: string;           // R32 match this slot belongs to
  ab: "A" | "B";
  teamCode: string | null;
  point: Point;
};

/** All 32 outer team slots, in order 0..31. */
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
 * A team is "eliminated" if they lost their most recent played match
 * (unless that match is the Final and they won, in which case they're
 * the champion — return null).
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

export type BracketEdge = { from: Point; to: Point; round: BracketRound };

/** All edges in the bracket tree (each match connects to its two source positions). */
export function bracketEdges(): BracketEdge[] {
  const edges: BracketEdge[] = [];
  for (const match of BRACKET) {
    if (match.round === "3RD") continue;
    const self = matchCenterPoint(match);

    if (match.round === "R32") {
      const idx = Number(match.id.split("-")[1]);
      edges.push({ from: outerSlotPoint(outerSlotIndex(idx, "A")), to: self, round: match.round });
      edges.push({ from: outerSlotPoint(outerSlotIndex(idx, "B")), to: self, round: match.round });
    } else {
      const sources = [match.slotA, match.slotB];
      for (const src of sources) {
        if (src.type !== "winner") continue;
        const dep = BRACKET.find((m) => m.id === src.ref);
        if (!dep) continue;
        edges.push({ from: matchCenterPoint(dep), to: self, round: match.round });
      }
    }
  }
  return edges;
}
