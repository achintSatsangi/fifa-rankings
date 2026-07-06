import highlightsData from "../../data/highlights.json";
import type { HighlightsMap } from "../../data/types";
import { teamByCode } from "../teams/data";

const CURATED: HighlightsMap = highlightsData as HighlightsMap;
const FIFA_CHANNEL_HANDLE = "@fifa";

/**
 * Returns a URL for the highlight video of a match. If we have a curated
 * YouTube link, use it. Otherwise fall back to a YouTube search scoped
 * to the FIFA channel with the two team names in the query.
 */
export function highlightUrl(matchId: string, teamCodeA?: string | null, teamCodeB?: string | null): string {
  const curated = CURATED[matchId];
  if (curated && curated.startsWith("http")) return curated;

  const a = teamByCode(teamCodeA)?.name ?? teamCodeA ?? "";
  const b = teamByCode(teamCodeB)?.name ?? teamCodeB ?? "";
  const query = [a, "vs", b, "highlights"].filter(Boolean).join(" ").trim();
  const q = encodeURIComponent(query);
  return `https://www.youtube.com/${FIFA_CHANNEL_HANDLE}/search?query=${q}`;
}

export function hasCuratedHighlight(matchId: string): boolean {
  const v = CURATED[matchId];
  return typeof v === "string" && v.startsWith("http");
}
