import { flagUrl, flagUrl2x } from "../../lib/teamCodes";
import { teamByCode } from "../teams/data";

type FlagProps = {
  code: string;
  size?: number;
  rounded?: boolean;
  title?: string;
  className?: string;
  /** Show a floating tooltip with the team name on hover/focus. */
  tooltip?: boolean;
};

const BASE_WIDTHS = [40, 80, 160, 320] as const;
type BaseWidth = (typeof BASE_WIDTHS)[number];

function pickBase(size: number): BaseWidth {
  const target = size * 2;
  return BASE_WIDTHS.find((w) => w >= target) ?? 320;
}

export function Flag({
  code,
  size = 32,
  rounded = true,
  title,
  className = "",
  tooltip = true,
}: FlagProps) {
  const team = teamByCode(code);
  const label = title ?? team?.name ?? code;
  const base = pickBase(size);
  const img = (
    <img
      src={flagUrl(code, base)}
      srcSet={`${flagUrl(code, base)} 1x, ${flagUrl2x(code, base)} 2x`}
      alt={label}
      width={size}
      height={size}
      loading="lazy"
      className={`h-full w-full object-cover ${rounded ? "rounded-full" : "rounded-sm"}`}
      style={{ backgroundColor: "var(--bg-flag)" }}
    />
  );

  if (!tooltip) {
    // The `img` was the only element before — apply caller className + native title.
    return (
      <span
        className={`inline-block leading-none ${className}`}
        style={{ width: size, height: size, verticalAlign: "middle" }}
        title={label}
      >
        {img}
      </span>
    );
  }

  return (
    <span
      className={`group relative inline-block leading-none ${className}`}
      style={{ width: size, height: size, verticalAlign: "middle" }}
    >
      {img}
      <span
        role="tooltip"
        className={
          "pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 -translate-x-1/2 " +
          "whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 " +
          "shadow-md transition-opacity duration-150 group-hover:opacity-100"
        }
        style={{ background: "var(--tooltip-bg)", color: "var(--tooltip-text)" }}
      >
        {label}
      </span>
    </span>
  );
}
