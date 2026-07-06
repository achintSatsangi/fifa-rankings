import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TeamsGrid } from "../features/teams/TeamsGrid";

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-4">
        <h2 className="m-0 text-2xl font-semibold">{t("teams.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Click any team to see their tournament journey.
        </p>
      </header>
      <TeamsGrid />
    </section>
  );
}
