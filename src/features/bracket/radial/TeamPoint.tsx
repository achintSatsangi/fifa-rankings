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
};

export function TeamPoint({
  code,
  point,
  size,
  faded = false,
  onClick,
  layer = "outer",
  match,
}: Props) {
  const team = teamByCode(code);
  const [hovered, setHovered] = useState(false);
  const style: React.CSSProperties = {
    left: `${point.x * 100}%`,
    top: `${point.y * 100}%`,
    width: size,
    height: size,
    transform: "translate(-50%, -50%)",
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

  if (!onClick) {
    return (
      <span
        className="absolute"
        style={style}
        title={showTooltip ? undefined : team.name}
        {...hoverProps}
      >
        {flagEl}
        {tooltipEl}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(team.code)}
      className="absolute rounded-full ring-0 transition-transform hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110"
      style={style}
      aria-label={team.name}
      title={showTooltip ? undefined : team.name}
      {...hoverProps}
    >
      {flagEl}
      {tooltipEl}
    </button>
  );
}
