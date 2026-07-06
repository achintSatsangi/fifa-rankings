import { flagUrl, flagUrl2x } from "../../lib/teamCodes";
import { teamByCode } from "../teams/data";

type FlagProps = {
  code: string;
  size?: number;
  rounded?: boolean;
  title?: string;
  className?: string;
};

const BASE_WIDTHS = [40, 80, 160, 320] as const;
type BaseWidth = (typeof BASE_WIDTHS)[number];

function pickBase(size: number): BaseWidth {
  const target = size * 2;
  return BASE_WIDTHS.find((w) => w >= target) ?? 320;
}

export function Flag({ code, size = 32, rounded = true, title, className = "" }: FlagProps) {
  const team = teamByCode(code);
  const label = title ?? team?.name ?? code;
  const base = pickBase(size);
  return (
    <img
      src={flagUrl(code, base)}
      srcSet={`${flagUrl(code, base)} 1x, ${flagUrl2x(code, base)} 2x`}
      alt={label}
      title={label}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block object-cover ${rounded ? "rounded-full" : "rounded-sm"} ${className}`}
      style={{ width: size, height: size, backgroundColor: "var(--bg-flag)" }}
    />
  );
}
