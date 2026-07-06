import type { BracketMatch, BracketRound } from "../../../data/types";
import { BRACKET, ROUNDS, matchesByRoundInTreeOrder } from "../data";
import { winnerCode } from "../resolver";

/**
 * Radial bracket layout math.
 *
 * The 32 outer team slots are evenly distributed around a circle
 * (OUTER_FLAG_RADIUS). Slot assignments come from the tree order —
 * matches that share a parent in the bracket end up on adjacent slots
 * — so every match's angular position is the true midpoint of its two
 * sources' positions. Winners live one ring further in per round
 * (R32→0.34, R16→0.24, QF→0.15, SF→0.075, F→centre/trophy).
 *
 * Connectors follow a "bracket" pattern — a short radial stub inward
 * from each source, a tangent arc joining the pair on the shoulder
 * ring, then a single radial stem from the arc's midpoint to the match
 * centre. Same math applies at every ring.
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

/**
 * Flag sizes per ring at the design container width (720 px). Values
 * scale down linearly on smaller viewports via `flagSizesFor()` so
 * outer flags never overlap on mobile.
 *
 * The `F` and `3RD` entries are 0 — a marker that we render no winner
 * flag for those rounds (Final champion shares the trophy centre).
 */
export const FLAG_SIZE: Record<BracketRound | "OUTER", number> = {
  OUTER: 52,
  R32: 42,
  R16: 36,
  QF:  32,
  SF:  28,
  F:   0,
  "3RD": 0,
};

/** Container size the FLAG_SIZE values were tuned for. */
const DESIGN_SIZE = 720;

const MARKER_BASE = 18;   // unplayed-match dashed circle
const TROPHY_BASE = 40;   // centre trophy icon

function scale(v: number, containerSize: number): number {
  return Math.round(v * Math.min(1, Math.max(0, containerSize) / DESIGN_SIZE));
}

/** Flag sizes scaled to the actual container. Returns 0-entries unchanged. */
export function flagSizesFor(containerSize: number): Record<BracketRound | "OUTER", number> {
  return {
    OUTER: scale(FLAG_SIZE.OUTER, containerSize),
    R32:   scale(FLAG_SIZE.R32,   containerSize),
    R16:   scale(FLAG_SIZE.R16,   containerSize),
    QF:    scale(FLAG_SIZE.QF,    containerSize),
    SF:    scale(FLAG_SIZE.SF,    containerSize),
    F:     0,
    "3RD": 0,
  };
}

export function markerSizeFor(containerSize: number): number {
  return scale(MARKER_BASE, containerSize);
}

export function trophySizeFor(containerSize: number): number {
  return scale(TROPHY_BASE, containerSize);
}

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

/** R32 → tree-order position (0..15). Assigned once at module load. */
const R32_TREE_POS: Record<string, number> = {};
matchesByRoundInTreeOrder("R32").forEach((m, i) => {
  R32_TREE_POS[m.id] = i;
});

/**
 * Outer slot index (0..31) for a given R32 match and side. Derived
 * from the tree-order position so that R32 pairs feeding the same R16
 * land on adjacent slots, R16 pairs feeding the same QF span an
 * adjacent quadrant, and so on.
 */
export function outerSlotIndex(r32MatchId: string, ab: "A" | "B"): number {
  const pos = R32_TREE_POS[r32MatchId] ?? 0;
  return pos * 2 + (ab === "A" ? 0 : 1);
}

/**
 * Angular midpoint of a knockout match in slot units (0..32).
 * Computed recursively as the midpoint of its two sources' slot units,
 * bottoming out at R32 which reads its outer-slot pair. Cached so the
 * recursion only pays off once per match.
 */
const SLOT_UNITS_CACHE = new Map<string, number>();

function matchSlotUnits(match: BracketMatch): number {
  const cached = SLOT_UNITS_CACHE.get(match.id);
  if (cached !== undefined) return cached;
  let units: number;
  if (match.round === "R32") {
    const pos = R32_TREE_POS[match.id] ?? 0;
    units = pos * 2 + 1; // midpoint of outer slots pos*2 and pos*2+1
  } else if (match.round === "3RD") {
    units = 0;
  } else if (match.slotA.type === "winner" && match.slotB.type === "winner") {
    const srcA = BRACKET.find((m) => m.id === (match.slotA as { ref: string }).ref);
    const srcB = BRACKET.find((m) => m.id === (match.slotB as { ref: string }).ref);
    units = srcA && srcB ? (matchSlotUnits(srcA) + matchSlotUnits(srcB)) / 2 : 0;
  } else {
    units = 0;
  }
  SLOT_UNITS_CACHE.set(match.id, units);
  return units;
}

function matchAngle(match: BracketMatch): number {
  return slotAngle(matchSlotUnits(match));
}

/** Outer ring slot i (0..31) — where a specific R32 team's flag sits. */
export function outerSlotPoint(i: number): Point {
  return pointAt(slotAngle(i + 0.5), OUTER_FLAG_RADIUS);
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
  for (const match of BRACKET) {
    if (match.round !== "R32") continue;
    (["A", "B"] as const).forEach((ab) => {
      const slot = outerSlotIndex(match.id, ab);
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
    angleA = slotAngle(outerSlotIndex(match.id, "A") + 0.5);
    angleB = slotAngle(outerSlotIndex(match.id, "B") + 0.5);
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
