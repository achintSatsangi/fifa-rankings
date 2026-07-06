import { Flag } from "../../flags/Flag";
import { teamByCode } from "../../teams/data";
import type { Point } from "./layout";

type Props = {
  code: string | null;
  point: Point;
  size: number;
  faded?: boolean;
  onClick?: (code: string) => void;
  layer?: "outer" | "winner";
};

export function TeamPoint({ code, point, size, faded = false, onClick, layer = "outer" }: Props) {
  const team = teamByCode(code);
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

  const flagEl = (
    <Flag
      code={team.code}
      size={size}
      title={team.name}
      className={faded ? "opacity-40 grayscale" : ""}
    />
  );

  if (!onClick) {
    return (
      <span className="absolute" style={style} title={team.name}>
        {flagEl}
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
      title={team.name}
    >
      {flagEl}
    </button>
  );
}
