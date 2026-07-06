import { useMemo } from "react";
import { bracketEdges } from "./layout";

/**
 * SVG connector lines for the bracket tree. Uses viewBox 0..100 so
 * layout Points (0..1) map by multiplying by 100.
 */
export function Connectors() {
  const edges = useMemo(bracketEdges, []);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* Concentric guide rings — very faint */}
      {[44, 34, 24, 15].map((r) => (
        <circle
          key={r}
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="var(--connector)"
          strokeWidth={0.12}
          strokeDasharray="0.6 0.8"
          opacity={0.5}
        />
      ))}
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.from.x * 100}
          y1={e.from.y * 100}
          x2={e.to.x * 100}
          y2={e.to.y * 100}
          stroke="var(--connector)"
          strokeWidth={0.18}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
