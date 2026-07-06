import type { RefObject } from "react";
import type { BracketMatch } from "../../../data/types";
import { useHoverTapToggle } from "../../../lib/hoverTapToggle";
import { MatchTooltip } from "../MatchTooltip";

type Props = {
  size?: number;
  /** When provided, the trophy becomes a tooltip trigger surfacing the
   *  Final's kickoff, countdown, and venue. Because the F match sits
   *  at the geometric centre of the radial (same point as the trophy),
   *  we skip the usual MatchMarker for that round and let the trophy
   *  double as its info affordance. */
  match?: BracketMatch;
  /** Optional team perspective for the tooltip's matchup line. Only
   *  useful in the non-interactive radial once the real semifinal
   *  results have populated F.teamCodeA. */
  focusTeam?: string;
};

export function Trophy({ size = 40, match, focusTeam }: Props) {
  const { visible, triggerProps, containerRef } = useHoverTapToggle();
  const interactive = match !== undefined;

  const svgEl = (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="var(--accent)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={interactive ? "transition-transform duration-200 hover:scale-110" : ""}
      style={interactive ? { filter: "drop-shadow(0 0 8px var(--accent-glow))" } : undefined}
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M17 4h3v2a3 3 0 0 1-3 3" />
      <path d="M7 4H4v2a3 3 0 0 0 3 3" />
    </svg>
  );

  const style: React.CSSProperties = {
    left: "50%",
    top: "50%",
    width: size,
    height: size,
    transform: "translate(-50%, -50%)",
  };

  if (!interactive) {
    return (
      <span aria-hidden="true" className="absolute z-10 select-none" style={style}>
        {svgEl}
      </span>
    );
  }

  return (
    <div
      ref={containerRef as RefObject<HTMLDivElement>}
      {...triggerProps}
      role="button"
      tabIndex={0}
      aria-label="Final"
      className="absolute z-10 cursor-pointer"
      style={style}
    >
      {svgEl}
      <MatchTooltip match={match} visible={visible} focusTeam={focusTeam} />
    </div>
  );
}
