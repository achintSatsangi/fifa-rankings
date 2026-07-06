import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HorizontalBracket } from "../features/bracket/horizontal/HorizontalBracket";
import { InteractiveRadial } from "../features/bracket/radial/InteractiveRadial";
import { RadialBracket } from "../features/bracket/radial/RadialBracket";
import {
  persistBracketView,
  readBracketView,
  type BracketView,
} from "../features/preferences/preferences";

export const Route = createFileRoute("/bracket")({
  validateSearch: (search: Record<string, unknown>): { view: BracketView } => {
    const v = search.view;
    if (v === "horizontal" || v === "radial" || v === "interactive") {
      return { view: v };
    }
    return { view: readBracketView() };
  },
  component: BracketPage,
});

function BracketPage() {
  const { view } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    persistBracketView(view);
  }, [view]);

  const setView = (v: BracketView) =>
    void navigate({ search: { view: v }, replace: true });

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col">
      <header className="mb-4 flex shrink-0 flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="m-0 text-2xl font-semibold">{t("bracket.title")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {view === "interactive"
              ? t("interactive.tagline")
              : t("bracket.tagline")}
          </p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </header>

      <div className="min-h-0 flex-1">
        {view === "radial" ? (
          <RadialBracket />
        ) : view === "horizontal" ? (
          <HorizontalBracket />
        ) : (
          <InteractiveRadial />
        )}
      </div>
    </section>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: BracketView;
  onChange: (v: BracketView) => void;
}) {
  const { t } = useTranslation();
  const options: { key: BracketView; label: string }[] = [
    { key: "radial", label: t("bracket.viewRadial") },
    { key: "horizontal", label: t("bracket.viewHorizontal") },
    { key: "interactive", label: t("bracket.viewInteractive") },
  ];
  return (
    <div
      role="tablist"
      aria-label={t("bracket.title")}
      className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] p-0.5 text-xs"
    >
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={
              "rounded-full px-3 py-1 transition-colors " +
              (active
                ? "bg-[var(--btn-bg)] text-[var(--btn-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
