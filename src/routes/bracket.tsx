import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HorizontalBracket } from "../features/bracket/horizontal/HorizontalBracket";

export const Route = createFileRoute("/bracket")({
  component: BracketPage,
});

/**
 * Horizontal (classic left-to-right) bracket. Radial + interactive
 * variants live on the home one-pager; this route stays for anyone
 * who prefers the traditional layout, and is linked from the home
 * footer only (not in the sidebar nav).
 */
function BracketPage() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col">
      <header className="mb-4 shrink-0">
        <h2 className="m-0 text-2xl font-semibold">{t("bracket.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("bracket.tagline")}</p>
      </header>
      <div className="min-h-0 flex-1">
        <HorizontalBracket />
      </div>
    </section>
  );
}
