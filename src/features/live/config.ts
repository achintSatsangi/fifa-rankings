/**
 * football-data.org configuration.
 *
 * Auth: `X-Auth-Token` header. Base URL `https://api.football-data.org/v4/`.
 * Free tier includes the FIFA World Cup (`WC`, id 2000). Rate limit is
 * 10 requests per minute — cache aggressively.
 */

export const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

const KEY = import.meta.env.VITE_FOOTBALL_DATA_KEY as string | undefined;
const COMP = import.meta.env.VITE_FOOTBALL_DATA_COMPETITION as string | undefined;

export const footballDataKey = KEY && KEY.length > 0 ? KEY : null;
export const footballDataCompetition = COMP && COMP.length > 0 ? COMP : "WC";
export const footballDataEnabled = footballDataKey !== null;

/** Free-tier rate limit — 10 requests per minute per key. */
export const RATE_LIMIT_PER_MIN = 10;
