import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  const { t } = useTranslation();
  return (
    <section className="w-full max-w-5xl">
      <header className="mb-4">
        <h2 className="m-0 text-2xl font-semibold">{t("teams.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          48 teams playing FWC26. Grid + filters land here.
        </p>
      </header>
      <div className="rounded border border-dashed border-[var(--border)] p-8 text-sm text-[var(--text-muted)]">
        Team grid + journey modal land next.
      </div>
    </section>
  );
}
