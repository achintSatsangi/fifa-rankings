import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { choice, setChoice } = useTheme();
  const { t } = useTranslation();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      <span>{t("theme.label")}</span>
      <select
        value={choice}
        onChange={(e) => setChoice(e.target.value as "light" | "dark" | "system")}
        className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-sm text-[var(--text)]"
      >
        <option value="system">{t("theme.system")}</option>
        <option value="light">{t("theme.light")}</option>
        <option value="dark">{t("theme.dark")}</option>
      </select>
    </label>
  );
}
