import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { footballDataFetch, FootballDataError } from "./client";
import { footballDataCompetition, footballDataEnabled } from "./config";
import type { FdCompetition, FdMatchesResponse, FdStandingsResponse } from "./types";

/**
 * Rate-limit hygiene: free plan allows 10 requests / minute. Every hook
 * below sets a long `staleTime` (>=5min) and does not retry on 429 so
 * one over-limit page load doesn't burn through the whole quota.
 */

const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const retryFn = (count: number, err: Error) => {
  if (err instanceof FootballDataError && err.status === 429) return false;
  return count < 1;
};

/** Metadata about the competition (name, current season, matchday). Cheap. */
export function useCompetition(): UseQueryResult<FdCompetition> {
  return useQuery({
    queryKey: ["football-data", "competition", footballDataCompetition],
    enabled: footballDataEnabled,
    staleTime: FIVE_MIN,
    gcTime: ONE_HOUR,
    retry: retryFn,
    queryFn: () => footballDataFetch<FdCompetition>(`/competitions/${footballDataCompetition}`),
  });
}

/** All matches for the current season. Filter by stage/status client-side. */
export function useCompetitionMatches(): UseQueryResult<FdMatchesResponse> {
  return useQuery({
    queryKey: ["football-data", "matches", footballDataCompetition],
    enabled: footballDataEnabled,
    staleTime: FIVE_MIN,
    gcTime: ONE_HOUR,
    retry: retryFn,
    queryFn: () =>
      footballDataFetch<FdMatchesResponse>(`/competitions/${footballDataCompetition}/matches`),
  });
}

/** Group-stage standings. */
export function useCompetitionStandings(): UseQueryResult<FdStandingsResponse> {
  return useQuery({
    queryKey: ["football-data", "standings", footballDataCompetition],
    enabled: footballDataEnabled,
    staleTime: FIVE_MIN,
    gcTime: ONE_HOUR,
    retry: retryFn,
    queryFn: () =>
      footballDataFetch<FdStandingsResponse>(`/competitions/${footballDataCompetition}/standings`),
  });
}
