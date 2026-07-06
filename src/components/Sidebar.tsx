import { Link } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../features/i18n/LanguageSwitcher";
import { ThemeToggle } from "../features/theme/ThemeToggle";
import { FavouriteTeamLink } from "../features/favourites/FavouriteTeamLink";
import { useSkipLanding } from "../features/preferences/preferences";
import { BUILD_TIMESTAMP, formatAbsolute, formatRelative } from "../lib/buildInfo";
import { BracketIcon, CloseIcon, GroupsIcon, HomeIcon, TeamsIcon, TrophyIcon } from "./NavIcons";

type Props = {
  onNavClick?: () => void;
  onClose?: () => void;
};

export function Sidebar({ onNavClick, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-start justify-between gap-2 px-6 pt-6 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--btn-bg)] text-[var(--btn-text)]"
            >
              <TrophyIcon width={18} height={18} />
            </span>
            <h1 className="m-0 text-lg font-bold tracking-tight text-[var(--text)]">
              {t("app.title")}
            </h1>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-[var(--text-secondary)]">
            {t("app.tagline")}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
            className="-mt-1 -mr-1 rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <Divider />

      {/* Primary nav */}
      <nav
        aria-label={t("nav.primary")}
        className="flex flex-col gap-1 px-3 py-3"
      >
        <HomeNavItem label={t("nav.home")} onNavigate={onNavClick} />
        <NavItem to="/bracket" label={t("nav.bracket")} Icon={BracketIcon} onNavigate={onNavClick} />
        <NavItem to="/teams" label={t("nav.teams")} Icon={TeamsIcon} onNavigate={onNavClick} />
        <NavItem to="/groups" label={t("nav.groups")} Icon={GroupsIcon} onNavigate={onNavClick} />
      </nav>

      <Divider />

      {/* Favourite team */}
      <div className="px-6 py-3">
        <FavouriteTeamLink onNavigate={onNavClick} />
      </div>

      {/* Settings pushed to bottom */}
      <div className="mt-auto flex flex-col gap-3 px-6 pb-6 pt-4">
        <Divider className="-mx-6 mb-1" />
        <LanguageSwitcher />
        <ThemeToggle />
        <SkipLandingToggle />
        {BUILD_TIMESTAMP ? (
          <p
            className="text-[11px] leading-snug text-[var(--text-muted)]"
            title={formatAbsolute(BUILD_TIMESTAMP)}
          >
            {t("meta.dataUpdated")} {formatRelative(BUILD_TIMESTAMP)}
          </p>
        ) : null}
        <p className="text-[11px] leading-snug text-[var(--text-muted)]">{t("app.footer")}</p>
      </div>
    </div>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return <div className={`border-t border-[var(--border-subtle)] ${className}`} aria-hidden="true" />;
}

function SkipLandingToggle() {
  const [skip, setSkip] = useSkipLanding();
  const { t } = useTranslation();
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
      <span>{t("settings.startOnBracket")}</span>
      <input
        type="checkbox"
        checked={skip}
        onChange={(e) => setSkip(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-[var(--btn-bg)]"
      />
    </label>
  );
}

const NAV_CLASS =
  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium " +
  "text-[var(--text-secondary)] transition-colors " +
  "hover:bg-[var(--surface-muted)] hover:text-[var(--text)]";

const NAV_ACTIVE = {
  className:
    "!bg-[var(--btn-bg)] !text-[var(--btn-text)] hover:!bg-[var(--btn-bg-hover)]",
};

function NavItem({
  to,
  label,
  Icon,
  onNavigate,
}: {
  to: "/bracket" | "/teams" | "/groups";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={NAV_CLASS}
      activeProps={NAV_ACTIVE}
    >
      <Icon width={20} height={20} />
      <span>{label}</span>
    </Link>
  );
}

/**
 * The Home item passes `?home=1` so beforeLoad on `/` skips the
 * "start on bracket" redirect — otherwise the button is a trap when
 * that pref is on. `activeProps` still matches an exact `/` visit
 * (no search), which is fine — Home is a manual jump target.
 */
function HomeNavItem({ label, onNavigate }: { label: string; onNavigate?: () => void }) {
  return (
    <Link
      to="/"
      search={{ home: 1 }}
      activeOptions={{ exact: true }}
      onClick={onNavigate}
      className={NAV_CLASS}
      activeProps={NAV_ACTIVE}
    >
      <HomeIcon width={20} height={20} />
      <span>{label}</span>
    </Link>
  );
}
