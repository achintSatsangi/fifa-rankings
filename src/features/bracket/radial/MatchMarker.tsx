import type { BracketMatch } from "../../../data/types";
import { MatchTooltip } from "../MatchTooltip";
import type { Point } from "./layout";

type Props = {
  match: BracketMatch;
  point: Point;
  /** Diameter in pixels. */
  size?: number;
};

/**
 * Small dashed placeholder circle at an unplayed match's centre in the
 * radial view. Shows a floating tooltip with kickoff time + venue on
 * hover. Positioned absolutely inside the aspect-square ring frame.
 */
export function MatchMarker({ match, point, size = 18 }: Props) {
  return (
    <div
      className="group absolute z-[2]"
      style={{
        left: `${point.x * 100}%`,
        top: `${point.y * 100}%`,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="h-full w-full rounded-full border border-dashed border-[var(--border-strong)] transition-colors group-hover:border-[var(--text-secondary)]"
        style={{ background: "var(--surface)" }}
      />
      <MatchTooltip match={match} />
    </div>
  );
}
