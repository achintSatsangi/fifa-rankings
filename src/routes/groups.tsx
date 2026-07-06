import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { GROUPS } from "../features/groups/data";
import { GroupCard } from "../features/groups/GroupCard";

export const Route = createFileRoute("/groups")({
  component: GroupsPage,
});

function GroupsPage() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="mb-6">
        <h2 className="m-0 text-2xl font-semibold">{t("groups.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          12 groups × 4 teams. Top 2 and the 8 best third-placed teams advanced to the Round of 32.
        </p>
      </header>
      <div className="grid gap-4">
        {GROUPS.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
    </section>
  );
}
