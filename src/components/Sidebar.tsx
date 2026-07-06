import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../features/i18n/LanguageSwitcher";
import { LiveStatus } from "../features/live/LiveStatus";
import { ThemeToggle } from "../features/theme/ThemeToggle";
import { FavouriteTeamLink } from "../features/favourites/FavouriteTeamLink";

type Props = {
  /** Called when a nav link is clicked — useful for closing a mobile drawer. */
  onNavClick?: () => void;
  /** Renders a close button in the drawer header. */
  onClose?: () => void;
};

export function Sidebar({ onNavClick, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col gap-4 px-7 py-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-[var(--text)]">
            {t("app.title")}
          </h1>
          <p className="mt-2 text-sm leading-snug text-[var(--text-secondary)]">
            {t("app.tagline")}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
            className="-mt-1 -mr-1 rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav aria-label={t("nav.primary")} className="flex flex-col gap-1 text-sm">
        <NavItem to="/" label={t("nav.bracket")} onNavigate={onNavClick} />
        <NavItem to="/teams" label={t("nav.teams")} onNavigate={onNavClick} />
        <NavItem to="/groups" label={t("nav.groups")} onNavigate={onNavClick} />
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6 text-sm">
        <FavouriteTeamLink onNavigate={onNavClick} />
        <LanguageSwitcher />
        <ThemeToggle />
        <LiveStatus />
        <p className="text-xs text-[var(--text-muted)]">{t("app.footer")}</p>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  onNavigate,
}: {
  to: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      onClick={onNavigate}
      className="rounded px-2 py-1.5 text-[var(--text)] hover:bg-[var(--surface-muted)]"
      activeProps={{ className: "bg-[var(--surface-elevated)] font-semibold" }}
    >
      {label}
    </Link>
  );
}
