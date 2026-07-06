import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

const GITHUB_ISSUES_URL = "https://github.com/achintSatsangi/fifa-rankings/issues";

/**
 * Bottom-of-page block: friendly disclaimer about free APIs + AI-authored
 * code (so nothing feels sneaky when a bug shows up), an invitation to
 * report issues on GitHub, and a discreet link to the horizontal
 * bracket for visitors who want the classic layout.
 */
export function HomeFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto w-full max-w-3xl border-t border-[var(--border-subtle)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
      <p className="mb-4 leading-relaxed">
        {t("landing.disclaimer.body")}{" "}
        {t("landing.disclaimer.linkPrefix")}
        <a
          href={GITHUB_ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
        >
          {t("landing.disclaimer.linkText")}
        </a>
        {t("landing.disclaimer.linkSuffix")}
      </p>
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
