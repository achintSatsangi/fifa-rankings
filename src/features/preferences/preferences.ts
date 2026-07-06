import { useCallback, useEffect, useState } from "react";
import { getStorageItem, setStorageItem } from "../../lib/storage";

const BRACKET_VIEW_KEY = "fifa-ranking:bracket-view";
const SKIP_LANDING_KEY = "fifa-ranking:skip-landing";
const LANDING_BYPASS_KEY = "fifa-ranking:landing-bypass";

const BRACKET_VIEW_EVENT = "fifa-ranking:bracket-view-change";
const SKIP_LANDING_EVENT = "fifa-ranking:skip-landing-change";

export type BracketView = "radial" | "horizontal" | "interactive";

/** Read outside of React (used by TanStack Router's validateSearch). */
export function readBracketView(): BracketView {
  const stored = getStorageItem(BRACKET_VIEW_KEY);
  if (stored === "horizontal") return "horizontal";
  if (stored === "interactive") return "interactive";
  return "radial";
}

/** Write without going through React (validateSearch + navigate paths). */
export function persistBracketView(v: BracketView): void {
  setStorageItem(BRACKET_VIEW_KEY, v);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<BracketView>(BRACKET_VIEW_EVENT, { detail: v }));
  }
}

/** Should navigating to `/` skip the landing and go to `/bracket` directly? */
export function readSkipLanding(): boolean {
  return getStorageItem(SKIP_LANDING_KEY) === "true";
}

export function persistSkipLanding(v: boolean): void {
  setStorageItem(SKIP_LANDING_KEY, v ? "true" : "false");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<boolean>(SKIP_LANDING_EVENT, { detail: v }));
  }
}

/**
 * One-shot "let me through" flag for the landing route. The sidebar's
 * Home link sets this in sessionStorage right before navigating to `/`,
 * and the landing route's `beforeLoad` consumes it so the "Start on
 * bracket" pref doesn't redirect away. Session-scoped so a refresh on
 * `/` reverts to the pref (as expected).
 */
export function requestLandingBypass(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LANDING_BYPASS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeLandingBypass(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(LANDING_BYPASS_KEY) === "1") {
      window.sessionStorage.removeItem(LANDING_BYPASS_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function useSkipLanding(): [boolean, (v: boolean) => void] {
  const [skip, setSkip] = useState<boolean>(readSkipLanding);
  useEffect(() => {
    const onChange = (e: Event) => setSkip((e as CustomEvent<boolean>).detail);
    window.addEventListener(SKIP_LANDING_EVENT, onChange);
    return () => window.removeEventListener(SKIP_LANDING_EVENT, onChange);
  }, []);
  const set = useCallback((v: boolean) => {
    persistSkipLanding(v);
    setSkip(v);
  }, []);
  return [skip, set];
}
