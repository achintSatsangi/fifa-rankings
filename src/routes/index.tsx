import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, type ComponentType, type SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { BracketIcon, GroupsIcon, TeamsIcon, TrophyIcon } from "../components/NavIcons";
import { FavouriteTeamLink } from "../features/favourites/FavouriteTeamLink";
import {
  persistSkipLanding,
  readBracketView,
  readSkipLanding,
} from "../features/preferences/preferences";

type LandingSearch = { home?: 1 };

export const Route = createFileRoute("/")({
  // `?home=1` is the escape hatch — the sidebar Home link uses it so
  // clicking Home always shows the landing, regardless of the
  // "Start on bracket" pref. A plain `/` visit still honours the pref.
  validateSearch: (search: Record<string, unknown>): LandingSearch =>
    search.home === "1" || search.home === 1 ? { home: 1 } : {},
  beforeLoad: ({ search }) => {
    if (search.home) return;
    if (readSkipLanding()) {
      throw redirect({ to: "/bracket", search: { view: readBracketView() } });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Strip the `?home=1` marker from the address bar once we're rendered
  // — it's only there to bypass beforeLoad, no need to keep it around.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("home")) {
      url.searchParams.delete("home");
      const clean = url.pathname + (url.search ? url.search : "") + url.hash;
      window.history.replaceState(null, "", clean);
    }
  }, []);

  const skipNextTime = () => {
    persistSkipLanding(true);
    void navigate({ to: "/bracket", search: { view: readBracketView() } });
  };

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col justify-center gap-10 py-8">
      <div className="text-center">
        <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--btn-bg)] text-[var(--btn-text)] shadow-sm">
          <TrophyIcon width={32} height={32} />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
          {t("app.title")}
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          {t("app.tagline")}
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        <FeatureCard
          to="/bracket"
          Icon={BracketIcon}
          title={t("nav.bracket")}
          description={t("landing.bracketDesc")}
        />
        <FeatureCard
          to="/teams"
          Icon={TeamsIcon}
          title={t("nav.teams")}
          description={t("landing.teamsDesc")}
        />
        <FeatureCard
          to="/groups"
          Icon={GroupsIcon}
          title={t("nav.groups")}
          description={t("landing.groupsDesc")}
        />
      </div>

      <div className="mx-auto w-full max-w-sm">
        <FavouriteTeamLink />
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={skipNextTime}
          className="text-sm text-[var(--text-muted)] underline decoration-dotted underline-offset-2 hover:text-[var(--text-secondary)]"
        >
          {t("landing.skipNextTime")}
        </button>
      </div>
    </section>
  );
}

function FeatureCard({
  to,
  Icon,
  title,
  description,
}: {
  to: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--text)] transition-colors group-hover:bg-[var(--btn-bg)] group-hover:text-[var(--btn-text)]">
        <Icon width={20} height={20} />
      </span>
      <div>
        <h2 className="mb-1 text-base font-semibold text-[var(--text)]">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
    </Link>
  );
}
