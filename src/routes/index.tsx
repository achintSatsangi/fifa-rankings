import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { BracketIcon, GroupsIcon, TeamsIcon, TrophyIcon } from "../components/NavIcons";
import { FavouriteTeamLink } from "../features/favourites/FavouriteTeamLink";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { t } = useTranslation();
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
