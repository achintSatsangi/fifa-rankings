import { useMemo } from "react";
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
 */
export function Connectors() {
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
        <MatchBracket key={g.matchId} g={g} />
      ))}
    </svg>
  );
}

function MatchBracket({ g }: { g: MatchGeometry }) {
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

  return (
    <g stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" fill="none">
      {/* Two radial stubs, source → elbow */}
      <line x1={sA.x} y1={sA.y} x2={eA.x} y2={eA.y} />
      <line x1={sB.x} y1={sB.y} x2={eB.x} y2={eB.y} />
      {/* Tangent arc along the shoulder ring, elbow A → elbow B (passes through mid) */}
      <path d={`M ${eA.x} ${eA.y} A ${r} ${r} 0 0 ${sweep} ${eB.x} ${eB.y}`} />
      {/* Radial stem, shoulder mid → match centre */}
      <line x1={mid.x} y1={mid.y} x2={mc.x} y2={mc.y} />
      {/* Corner dots at each elbow — accent-colored + subtle glow so
          the geometry reads as lit-up turf lines. */}
      <circle cx={eA.x} cy={eA.y} r={0.42} fill="var(--accent)" stroke="none" filter="url(#connector-glow)" />
      <circle cx={eB.x} cy={eB.y} r={0.42} fill="var(--accent)" stroke="none" filter="url(#connector-glow)" />
    </g>
  );
}
