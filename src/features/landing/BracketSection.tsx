import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { InteractiveRadial } from "../bracket/radial/InteractiveRadial";
import { RadialBracket } from "../bracket/radial/RadialBracket";
import {
  persistBracketView,
  readBracketView,
  type BracketView,
} from "../preferences/preferences";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Middle section: the circular bracket, with a Radial ↔ Interactive
 * toggle. Horizontal view has moved to its own hidden /bracket page.
 * Toggle state persists to localStorage so a returning visitor lands
 * on their preferred mode.
 */
export function BracketSection() {
  const { t } = useTranslation();
  const [view, setView] = useState<HomeView>(() => coerceHomeView(readBracketView()));

  useEffect(() => {
    persistBracketView(view);
  }, [view]);

  const isInteractive = view === "interactive";
  const tagline = isInteractive ? t("interactive.tagline") : t("bracket.tagline");

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-2 py-12 sm:py-16">
      <ScrollReveal>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="m-0 text-2xl font-semibold text-[var(--text)] sm:text-3xl">
              {t("landing.bracketSection")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{tagline}</p>
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </ScrollReveal>

      {/* Fixed square-ish container so the ResizeObserver inside the
          bracket components sees a definite width AND height. Aspect
          ratio is roughly square on desktop; on very narrow phones we
          drop it slightly wider so the rings still get room. */}
      <ScrollReveal delay={120}>
        <div className="mx-auto aspect-square w-full max-w-[min(90vw,720px)]">
          {isInteractive ? <InteractiveRadial /> : <RadialBracket />}
        </div>
      </ScrollReveal>
    </section>
  );
}

type HomeView = "radial" | "interactive";

function coerceHomeView(v: BracketView): HomeView {
  // Legacy: someone with `horizontal` cached in localStorage should
  // fall back to `radial` on the one-pager since horizontal moved
  // to its own page.
  return v === "interactive" ? "interactive" : "radial";
}

function ViewToggle({
  value,
  onChange,
}: {
  value: HomeView;
  onChange: (v: HomeView) => void;
}) {
  const { t } = useTranslation();
  const options: { key: HomeView; label: string }[] = [
    { key: "radial", label: t("bracket.viewRadial") },
    { key: "interactive", label: t("bracket.viewInteractive") },
  ];
  return (
    <div
      role="tablist"
      aria-label={t("landing.bracketSection")}
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
