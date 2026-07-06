import { useTranslation } from "react-i18next";
import { useFavouriteTeam } from "./store";

type Props = {
  code: string;
  size?: "sm" | "md";
};

const SIZES = {
  sm: { icon: 16, pad: "p-1" },
  md: { icon: 20, pad: "p-1.5" },
};

export function FavouriteButton({ code, size = "md" }: Props) {
  const [current, setFavourite] = useFavouriteTeam();
  const { t } = useTranslation();
  const isFav = current === code;
  const s = SIZES[size];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setFavourite(isFav ? null : code);
      }}
      aria-pressed={isFav}
      aria-label={isFav ? t("favourite.remove") : t("favourite.add")}
      title={isFav ? t("favourite.remove") : t("favourite.add")}
      className={
        `${s.pad} inline-flex items-center justify-center rounded-full ` +
        `transition-colors hover:bg-[var(--surface)] ` +
        (isFav
          ? "text-[#e0b04a]"
          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")
      }
    >
      <StarIcon size={s.icon} filled={isFav} />
    </button>
  );
}

function StarIcon({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
