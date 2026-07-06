import { getStorageItem, setStorageItem } from "../../lib/storage";

const BRACKET_VIEW_KEY = "fifa-ranking:bracket-view";
const BRACKET_VIEW_EVENT = "fifa-ranking:bracket-view-change";

/** The two views available on the home one-pager. Horizontal lives on
 *  its own /bracket page and does not need to be persisted. Legacy
 *  values like "horizontal" are coerced to "radial" on read. */
export type BracketView = "radial" | "interactive";

export function readBracketView(): BracketView {
  const stored = getStorageItem(BRACKET_VIEW_KEY);
  if (stored === "interactive") return "interactive";
  return "radial";
}

export function persistBracketView(v: BracketView): void {
  setStorageItem(BRACKET_VIEW_KEY, v);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<BracketView>(BRACKET_VIEW_EVENT, { detail: v }));
  }
}
