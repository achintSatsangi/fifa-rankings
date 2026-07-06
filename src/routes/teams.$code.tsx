import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/teams/$code")({
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { code } = Route.useParams();
  const { t } = useTranslation();
  return (
    <section className="w-full max-w-3xl">
      <header className="mb-4">
        <h2 className="m-0 text-2xl font-semibold">
          {t("team.journey")}: <span className="font-mono">{code}</span>
        </h2>
      </header>
      <div className="rounded border border-dashed border-[var(--border)] p-8 text-sm text-[var(--text-muted)]">
        Team journey table lands here.
      </div>
    </section>
  );
}
