import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: BracketPage,
});

function BracketPage() {
  const { t } = useTranslation();
  return (
    <section className="w-full max-w-5xl">
      <header className="mb-4">
        <h2 className="m-0 text-2xl font-semibold">{t("bracket.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Radial and horizontal bracket views land here.
        </p>
      </header>
      <div className="grid aspect-square place-items-center rounded border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
        Bracket component coming next commit.
      </div>
    </section>
  );
}
