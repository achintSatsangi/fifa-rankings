export type Confederation = "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";

export type Team = {
  code: string;
  name: string;
  confederation: Confederation;
  fifaRank: number;
  groupId: string;
  groupPosition: 1 | 2 | 3 | 4;
  advanced: boolean;
};

export type GroupMatch = {
  matchDay: 1 | 2 | 3;
  date: string;
  /** Full kickoff timestamp (ISO 8601 UTC) when known. `date` is the local
   *  calendar date at the venue; `utcDate` also carries the time. */
  utcDate?: string;
  homeCode: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string;
};

export type Standing = {
  code: string;
  position: 1 | 2 | 3 | 4;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export type Group = {
  id: string;
  teamCodes: string[];
  matches: GroupMatch[];
  standings: Standing[];
};

export type BracketRound = "R32" | "R16" | "QF" | "SF" | "3RD" | "F";

export type SlotSource =
  | { type: "group"; ref: string }
  | { type: "best3"; ref: string }
  | { type: "winner"; ref: string }
  | { type: "loser"; ref: string };

export type FeedTarget = { matchId: string; slot: "A" | "B" } | null;

export type BracketMatch = {
  id: string;
  round: BracketRound;
  date: string;
  /** Full kickoff timestamp (ISO 8601 UTC) when known. */
  utcDate?: string;
  venue: string;
  slotA: SlotSource;
  slotB: SlotSource;
  teamCodeA: string | null;
  teamCodeB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  penaltyA?: number | null;
  penaltyB?: number | null;
  extraTime?: boolean;
  feedsInto: FeedTarget;
  losersFeedInto?: FeedTarget;
};

export type HighlightEntry = {
  /** Direct YouTube URL to the primary FIFA-channel highlights video. */
  youtube?: string;
  /** ISO timestamp of when scripts/resolve-highlights.mjs found it. */
  resolvedAt?: string;
};

/** highlights.json shape. `__note` is a free-form doc string; every other
 *  key is a bracket match id (e.g. "R32-7"). */
export type HighlightsMap = Record<string, HighlightEntry | string | undefined>;
