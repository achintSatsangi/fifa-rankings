import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HorizontalBracket } from "../features/bracket/horizontal/HorizontalBracket";

export const Route = createFileRoute("/")({
  component: BracketPage,
});

function BracketPage() {
  const { t } = useTranslation();
  return (
    <section className="w-full max-w-6xl">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="m-0 text-2xl font-semibold">{t("bracket.title")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Click any team to see their tournament journey. The radial view lands next.
          </p>
        </div>
        <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
          {t("bracket.viewHorizontal")}
        </span>
      </header>
      <HorizontalBracket />
    </section>
  );
}
