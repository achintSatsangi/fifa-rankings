import { useTranslation } from "react-i18next";
import { HamburgerIcon, TrophyIcon } from "./NavIcons";

type Props = {
  onOpenMenu: () => void;
};

/** Sticky top bar shown below the `lg` breakpoint. */
export function MobileHeader({ onOpenMenu }: Props) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--btn-bg)] text-[var(--btn-text)]"
        >
          <TrophyIcon width={16} height={16} />
        </span>
        <h1 className="m-0 text-sm font-bold tracking-tight text-[var(--text)]">
          {t("app.title")}
        </h1>
      </div>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("nav.openMenu")}
        aria-controls="app-sidebar"
        className="inline-flex items-center justify-center rounded-md p-2 text-[var(--text)] hover:bg-[var(--surface-muted)]"
      >
        <HamburgerIcon />
      </button>
    </header>
  );
}
