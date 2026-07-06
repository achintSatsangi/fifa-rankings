import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from ".";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      <span>{t("language.label")}</span>
      <select
        value={i18n.resolvedLanguage ?? "en"}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-sm text-[var(--text)]"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
