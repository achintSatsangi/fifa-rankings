import { useTranslation } from "react-i18next";

type Props = {
  onOpenMenu: () => void;
};

/** Sticky top bar shown below the `lg` breakpoint. */
export function MobileHeader({ onOpenMenu }: Props) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 lg:hidden">
      <h1 className="m-0 text-base font-semibold tracking-tight text-[var(--text)]">
        {t("app.title")}
      </h1>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("nav.openMenu")}
        aria-controls="app-sidebar"
        className="inline-flex items-center justify-center rounded p-2 text-[var(--text)] hover:bg-[var(--surface-muted)]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  );
}
