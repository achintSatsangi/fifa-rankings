import { FOOTBALL_DATA_BASE_URL, footballDataKey } from "./config";

export class FootballDataError extends Error {
  readonly status?: number;
  readonly retryAfterSeconds?: number;
  constructor(message: string, status?: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "FootballDataError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Thin fetch wrapper. Throws if the key is missing or the request fails.
 * On 429, parses `X-Requests-Available-Minute` / retry-after so callers
 * can surface a helpful message.
 */
export async function footballDataFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  init?: RequestInit,
): Promise<T> {
  if (!footballDataKey) {
    throw new FootballDataError("football-data.org key is not configured");
  }
  const url = new URL(path.replace(/^\//, ""), `${FOOTBALL_DATA_BASE_URL}/`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "X-Auth-Token": footballDataKey,
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || 60;
    throw new FootballDataError(
      `football-data rate limit hit — retry in ${retryAfter}s`,
      429,
      retryAfter,
    );
  }
  if (!res.ok) {
    throw new FootballDataError(`football-data HTTP ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}
