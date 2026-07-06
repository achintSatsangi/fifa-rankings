import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * Compact bottom-of-page block: the fan-made disclaimer + a discreet
 * link to the horizontal bracket for visitors who prefer the classic
 * layout. Freshness data lives in the header chip, so we don't repeat
 * it here.
 */
export function HomeFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto w-full max-w-6xl border-t border-[var(--border-subtle)] px-2 py-8 text-center text-sm text-[var(--text-muted)]">
      <p className="mb-3">
        <Link
          to="/bracket"
          className="text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
        >
          {t("landing.horizontalLink")}
        </Link>
      </p>
      <p>{t("app.footer")}</p>
    </footer>
  );
}
