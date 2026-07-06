/**
 * Small cookie helpers. This is a client-only SPA with no backend
 * requests, so cookies are mostly equivalent to localStorage here —
 * we use them because they're the storage the app was asked to use
 * and they double as a hook for a future SSR/edge deploy that might
 * read prefs on the server.
 *
 * All cookies are set with `SameSite=Lax`, a 1-year expiry, and a
 * path of `/`. Values are `encodeURIComponent`-encoded so they can
 * carry any UTF-8 string safely.
 */

const ONE_YEAR_DAYS = 365;

export function setCookie(name: string, value: string, days: number = ONE_YEAR_DAYS): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
