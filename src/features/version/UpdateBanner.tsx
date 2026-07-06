import { useTranslation } from "react-i18next";
import { useUpdateAvailable } from "./checker";

/** Small "New version available" toast — fixed to the bottom-right. */
export function UpdateBanner() {
  const available = useUpdateAvailable();
  const { t } = useTranslation();

  if (!available) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm shadow-[var(--modal-shadow)]"
    >
      <span className="text-[var(--text)]">{t("version.updateAvailable")}</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-[var(--btn-bg)] px-3 py-1 text-sm font-medium text-[var(--btn-text)] hover:bg-[var(--btn-bg-hover)]"
      >
        {t("version.reload")}
      </button>
    </div>
  );
}
