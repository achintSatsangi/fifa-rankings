import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/groups")({
  component: GroupsPage,
});

function GroupsPage() {
  const { t } = useTranslation();
  return (
    <section className="w-full max-w-5xl">
      <header className="mb-4">
        <h2 className="m-0 text-2xl font-semibold">{t("groups.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          12 groups × 4 teams. Standings + simulator land here.
        </p>
      </header>
      <div className="rounded border border-dashed border-[var(--border)] p-8 text-sm text-[var(--text-muted)]">
        Group tables + simulator land next.
      </div>
    </section>
  );
}
