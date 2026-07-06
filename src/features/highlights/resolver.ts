import highlightsData from "../../data/highlights.json";
import type { HighlightsMap } from "../../data/types";
import { teamByCode } from "../teams/data";

const CURATED: HighlightsMap = highlightsData as HighlightsMap;
const FIFA_CHANNEL_HANDLE = "@fifa";

export type HighlightSource = "youtube" | "search";

export type ResolvedHighlight = {
  url: string;
  source: HighlightSource;
};

function directYouTube(matchId: string): string | null {
  const entry = CURATED[matchId];
  if (!entry) return null;
  if (typeof entry === "string") return entry.startsWith("http") ? entry : null;
  if (typeof entry === "object" && typeof entry.youtube === "string" && entry.youtube.startsWith("http")) {
    return entry.youtube;
  }
  return null;
}

/**
 * Resolve a highlights link for a match. Returns the FIFA-channel YouTube
 * video when one has been cached in highlights.json; otherwise falls back
 * to a YouTube search scoped to the FIFA channel with both team names in
 * the query. Callers can style the click target differently based on
 * `source` (direct video → YouTube-red play icon, search → muted icon).
 */
export function resolveHighlight(
  matchId: string,
  teamCodeA?: string | null,
  teamCodeB?: string | null,
): ResolvedHighlight {
  const direct = directYouTube(matchId);
  if (direct) return { url: direct, source: "youtube" };

  const a = teamByCode(teamCodeA)?.name ?? teamCodeA ?? "";
  const b = teamByCode(teamCodeB)?.name ?? teamCodeB ?? "";
  const q = encodeURIComponent([a, "vs", b, "highlights"].filter(Boolean).join(" ").trim());
  return {
    url: `https://www.youtube.com/${FIFA_CHANNEL_HANDLE}/search?query=${q}`,
    source: "search",
  };
}

/** Back-compat shim for callers that only need the URL. */
export function highlightUrl(matchId: string, teamCodeA?: string | null, teamCodeB?: string | null): string {
  return resolveHighlight(matchId, teamCodeA, teamCodeB).url;
}

export function hasCuratedHighlight(matchId: string): boolean {
  return directYouTube(matchId) !== null;
}
