import { useState } from "react";
import type { BracketMatch } from "../../../data/types";
import { Flag } from "../../flags/Flag";
import { teamByCode } from "../../teams/data";
import { MatchTooltip } from "../MatchTooltip";
import type { Point } from "./layout";

type Props = {
  code: string | null;
  point: Point;
  size: number;
  faded?: boolean;
  onClick?: (code: string) => void;
  layer?: "outer" | "winner";
  /** If provided, hovering the flag reveals a MatchTooltip focused on
   *  this team. Suppresses Flag's built-in name tooltip so they don't
   *  overlap. */
  match?: BracketMatch;
  /** Monotonic counter used to trigger the scale-pop animation on the
   *  inner flag wrapper. When this changes, the inner wrapper remounts
   *  and the pop plays fresh. */
  pulseKey?: number;
};

/**
 * Position transition tuning. Runs on left/top/width/height so a team
 * advancing to their next node slides across the ring instead of
 * teleporting. cubic-bezier(0.4, 0, 0.2, 1) is the Material "standard"
 * curve — gentle start, snap into place at the end.
 */
const SLIDE_TRANSITION =
  "left 550ms cubic-bezier(0.4, 0, 0.2, 1), " +
  "top 550ms cubic-bezier(0.4, 0, 0.2, 1), " +
  "width 550ms cubic-bezier(0.4, 0, 0.2, 1), " +
  "height 550ms cubic-bezier(0.4, 0, 0.2, 1)";

export function TeamPoint({
  code,
  point,
  size,
  faded = false,
  onClick,
  layer = "outer",
  match,
  pulseKey,
}: Props) {
  const team = teamByCode(code);
  const [hovered, setHovered] = useState(false);
  const style: React.CSSProperties = {
    left: `${point.x * 100}%`,
    top: `${point.y * 100}%`,
    width: size,
    height: size,
    transform: "translate(-50%, -50%)",
    transition: SLIDE_TRANSITION,
  };

  if (!team) {
    return (
      <span
        aria-hidden="true"
        className={`absolute rounded-full border border-dashed ${
          layer === "outer" ? "border-[var(--border-strong)]" : "border-[var(--border-subtle)]"
        }`}
        style={{ ...style, background: "var(--surface)" }}
      />
    );
  }

  const showTooltip = match !== undefined;

  const flagEl = (
    <Flag
      code={team.code}
      size={size}
      title={team.name}
      tooltip={!showTooltip}
      className={faded ? "opacity-40 grayscale" : ""}
    />
  );

  const hoverProps = showTooltip
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};

  const tooltipEl = showTooltip && match ? (
    <MatchTooltip match={match} visible={hovered} focusTeam={team.code} />
  ) : null;

  // Inner wrapper carries both the hover-scale and the pick-pop
  // animation. Keyed by pulseKey so the pop replays on every pick
  // without unmounting the outer container (which would kill the
  // left/top slide transition).
  const innerClass =
    "h-full w-full transition-transform duration-200 " +
    "hover:scale-110 focus-visible:scale-110 " +
    (pulseKey !== undefined ? "motion-safe:animate-pick-pop" : "");

  if (!onClick) {
    return (
      <span
        className="absolute"
        style={style}
        title={showTooltip ? undefined : team.name}
        {...hoverProps}
      >
        <span key={pulseKey} className={innerClass}>
          {flagEl}
        </span>
        {tooltipEl}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(team.code)}
      className="absolute rounded-full ring-0 hover:z-10 focus-visible:z-10"
      style={style}
      aria-label={team.name}
      title={showTooltip ? undefined : team.name}
      {...hoverProps}
    >
      <span key={pulseKey} className={innerClass}>
        {flagEl}
      </span>
      {tooltipEl}
    </button>
  );
}
