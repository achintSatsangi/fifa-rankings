import { useEffect, useState } from "react";
import { BUILD_TIMESTAMP } from "../../lib/buildInfo";

const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const INITIAL_DELAY_MS = 5000;

/**
 * Polls `/version.json` (emitted by the versionJson Vite plugin at
 * build time) and returns `true` once the server's build timestamp
 * differs from the one baked into the currently-running bundle —
 * meaning a fresh deploy has landed while this tab was open.
 *
 * No-op locally (no `VITE_BUILD_TIMESTAMP` → nothing to compare).
 */
export function useUpdateAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!BUILD_TIMESTAMP) return;

    const url = `${import.meta.env.BASE_URL}version.json`;

    let cancelled = false;

    const check = async () => {
      try {
        // Cache-bust the poll itself so intermediate caches don't hide
        // a real deploy behind an old ETag.
        const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildTimestamp?: string };
        if (
          !cancelled &&
          typeof data.buildTimestamp === "string" &&
          data.buildTimestamp.length > 0 &&
          data.buildTimestamp !== BUILD_TIMESTAMP
        ) {
          setAvailable(true);
        }
      } catch {
        /* offline / blocked / network hiccup — try again on next tick */
      }
    };

    const initial = window.setTimeout(check, INITIAL_DELAY_MS);
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    // Re-check when the tab comes back into focus — catches the case
    // where a user leaves the tab for hours and comes back.
    const onFocus = () => {
      void check();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return available;
}
