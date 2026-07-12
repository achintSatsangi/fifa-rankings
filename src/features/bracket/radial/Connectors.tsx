import { useMemo } from "react";
import { matchById } from "../data";
import { winnerCode } from "../resolver";
import { bracketGeometry, svgPoint, WINNER_RING_RADIUS, OUTER_FLAG_RADIUS } from "./layout";
import type { MatchGeometry } from "./layout";

/**
 * SVG connectors. For every match we draw a "bracket" glyph:
 *   1. two short radial stubs from each source inward to the shoulder ring
 *   2. one tangent arc joining the two stubs along the shoulder ring
 *   3. one radial stem from the arc's midpoint inward to the match centre
 * Elbow dots at each corner mark the geometry — those dots pick up
 * the theme accent (turf green) and get a soft blur glow so the
 * whole diagram reads as "lit up" without swamping the flag markers.
 *
 * When `highlightedTeam` is set, the side of each match glyph that
 * team occupies gets an accent-color neon overlay (stub + half-arc,
 * plus the stem if they won and advanced). Losers stop at the
 * shoulder — same rule as the historical radial.
 */
export function Connectors({ highlightedTeam }: { highlightedTeam?: string | null } = {}) {
  const geoms = useMemo(bracketGeometry, []);

  const guideRings = [
    OUTER_FLAG_RADIUS,
    WINNER_RING_RADIUS.R32,
    WINNER_RING_RADIUS.R16,
    WINNER_RING_RADIUS.QF,
    WINNER_RING_RADIUS.SF,
  ];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        {/* Soft glow for accent-colored geometry. feGaussianBlur is
            cheap at this resolution; feMerge stacks the blur behind
            the original stroke so shapes stay crisp. */}
        <filter id="connector-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Layered blur for the highlighted-path overlay — wide halo +
            tight bright core, so the accent stroke reads as neon. */}
        <filter id="connector-path-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="halo" />
          <feGaussianBlur stdDeviation="0.5" result="core" in="SourceGraphic" />
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="halo" />
            <feMergeNode in="core" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {guideRings.map((r) => (
        <circle
          key={r}
          cx={50}
          cy={50}
          r={r * 100}
          fill="none"
          stroke="var(--connector)"
          strokeWidth={0.1}
          strokeDasharray="0.5 0.9"
          opacity={0.35}
        />
      ))}
      {geoms.map((g) => (
        <MatchBracket key={g.matchId} g={g} highlightedTeam={highlightedTeam ?? null} />
      ))}
    </svg>
  );
}

/** For a match geometry, which side does the highlighted team sit on?
 *  We look up the underlying BracketMatch to compare teamCodeA/B.
 *  Note: R16+ slots can be null when the R32 result isn't in yet — a
 *  team can still be highlighted at their R32 slot in that case. */
function sideFor(g: MatchGeometry, team: string | null): "A" | "B" | "none" {
  if (!team) return "none";
  const m = matchById(g.matchId);
  if (!m) return "none";
  if (m.teamCodeA === team) return "A";
  if (m.teamCodeB === team) return "B";
  return "none";
}

function MatchBracket({ g, highlightedTeam }: { g: MatchGeometry; highlightedTeam: string | null }) {
  const sA = svgPoint(g.angleA, g.sourceRadius);
  const eA = svgPoint(g.angleA, g.shoulderRadius);
  const sB = svgPoint(g.angleB, g.sourceRadius);
  const eB = svgPoint(g.angleB, g.shoulderRadius);
  const mid = svgPoint(g.angleMid, g.shoulderRadius);
  const mc = svgPoint(g.angleMid, g.matchRadius);

  const r = g.shoulderRadius * 100;
  const sweep = g.angleB > g.angleA ? 1 : 0;

  const strokeColor = "var(--connector)";
  const stroke = 0.22;

  const side = sideFor(g, highlightedTeam);
  // A team "won" this match (and takes the stem inward) only if the
  // match is actually played and they're the recorded winner.
  const match = matchById(g.matchId);
  const isWinner = side !== "none" && !!match && winnerCode(match) === highlightedTeam;

  return (
    <g>
      <g stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" fill="none">
        <line x1={sA.x} y1={sA.y} x2={eA.x} y2={eA.y} />
        <line x1={sB.x} y1={sB.y} x2={eB.x} y2={eB.y} />
        <path d={`M ${eA.x} ${eA.y} A ${r} ${r} 0 0 ${sweep} ${eB.x} ${eB.y}`} />
        <line x1={mid.x} y1={mid.y} x2={mc.x} y2={mc.y} />
        <circle cx={eA.x} cy={eA.y} r={0.42} fill="var(--accent)" stroke="none" filter="url(#connector-glow)" />
        <circle cx={eB.x} cy={eB.y} r={0.42} fill="var(--accent)" stroke="none" filter="url(#connector-glow)" />
      </g>

      {/* Neon overlay for the highlighted team's side of this match.
          Three layered strokes give the halo → core read; ambient
          pulse comes from the CSS animate-hist-path class (shared
          with the historical radial). */}
      {side !== "none" ? (() => {
        const stubD = side === "A"
          ? `M ${sA.x} ${sA.y} L ${eA.x} ${eA.y}`
          : `M ${sB.x} ${sB.y} L ${eB.x} ${eB.y}`;
        const arcD = side === "A"
          ? `M ${eA.x} ${eA.y} A ${r} ${r} 0 0 ${sweep} ${mid.x} ${mid.y}`
          : `M ${mid.x} ${mid.y} A ${r} ${r} 0 0 ${sweep} ${eB.x} ${eB.y}`;
        const stemD = `M ${mid.x} ${mid.y} L ${mc.x} ${mc.y}`;
        return (
          <g
            className="animate-hist-path motion-reduce:animate-none"
            stroke="var(--accent)"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <g strokeWidth={1.2} opacity={0.10}>
              <path d={stubD} />
              <path d={arcD} />
              {isWinner ? <path d={stemD} /> : null}
            </g>
            <g strokeWidth={0.6} opacity={0.28} filter="url(#connector-path-glow)">
              <path d={stubD} />
              <path d={arcD} />
              {isWinner ? <path d={stemD} /> : null}
            </g>
            <g strokeWidth={0.28} opacity={0.7}>
              <path d={stubD} />
              <path d={arcD} />
              {isWinner ? <path d={stemD} /> : null}
            </g>
          </g>
        );
      })() : null}
    </g>
  );
}

