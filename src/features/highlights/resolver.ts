import highlightsData from "../../data/highlights.json";
import type { HighlightsMap } from "../../data/types";
import { teamByCode } from "../teams/data";

const CURATED: HighlightsMap = highlightsData as HighlightsMap;
const FIFA_CHANNEL_HANDLE = "@fifa";

export type HighlightSource = "youtube" | "fifa" | "search";

export type ResolvedHighlight = {
  url: string;
  source: HighlightSource;
};

function directUrls(matchId: string): { youtube: string | null; fifa: string | null } {
  const entry = CURATED[matchId];
  if (!entry) return { youtube: null, fifa: null };
  if (typeof entry === "string") {
    return { youtube: entry.startsWith("http") ? entry : null, fifa: null };
  }
  return {
    youtube: typeof entry.youtube === "string" && entry.youtube.startsWith("http") ? entry.youtube : null,
    fifa: typeof entry.fifa === "string" && entry.fifa.startsWith("http") ? entry.fifa : null,
  };
}

/**
 * Resolve a highlights link for a match. Priority:
 *   1. Cached YouTube video (FIFA channel main highlights)
 *   2. Cached FIFA article page (match report with embedded video)
 *   3. Fallback: YouTube search scoped to the FIFA channel
 * Callers style the click target off `source` (YouTube red, FIFA blue,
 * search grey).
 */
export function resolveHighlight(
  matchId: string,
  teamCodeA?: string | null,
  teamCodeB?: string | null,
): ResolvedHighlight {
  const { youtube, fifa } = directUrls(matchId);
  if (youtube) return { url: youtube, source: "youtube" };
  if (fifa) return { url: fifa, source: "fifa" };

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
  const { youtube, fifa } = directUrls(matchId);
  return Boolean(youtube || fifa);
}
