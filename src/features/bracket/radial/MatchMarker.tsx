import type { BracketMatch } from "../../../data/types";
import { useHoverTapToggle } from "../../../lib/hoverTapToggle";
import { MatchTooltip } from "../MatchTooltip";
import type { Point } from "./layout";

type Props = {
  match: BracketMatch;
  point: Point;
  size?: number;
};

/**
 * Small dashed placeholder at an unplayed match's centre. Hover on
 * desktop, tap on mobile — both surface a MatchTooltip with the
 * kickoff time, live countdown, and venue.
 */
export function MatchMarker({ match, point, size = 18 }: Props) {
  const { visible, triggerProps, containerRef } = useHoverTapToggle();
  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      {...triggerProps}
      className="group absolute z-[2] cursor-pointer"
      style={{
        left: `${point.x * 100}%`,
        top: `${point.y * 100}%`,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={
          "h-full w-full rounded-full border border-dashed transition-colors " +
          (visible ? "border-[var(--text-secondary)]" : "border-[var(--border-strong)]")
        }
        style={{ background: "var(--surface)" }}
      />
      <MatchTooltip match={match} visible={visible} />
    </div>
  );
}
