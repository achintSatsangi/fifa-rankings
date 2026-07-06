/**
 * Subset of the football-data.org v4 response shapes we consume.
 * Extend as more fields get used.
 */

export type FdSeason = {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number | null;
  winner: FdTeamMini | null;
};

export type FdCompetition = {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string | null;
  currentSeason: FdSeason;
  seasons: FdSeason[];
};

export type FdTeamMini = {
  id: number;
  name: string;
  shortName: string | null;
  tla: string | null;   // 3-letter code — usually matches our FIFA broadcast codes
  crest: string | null;
};

export type FdMatchStage =
  | "GROUP_STAGE"
  | "LAST_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "THIRD_PLACE"
  | "FINAL";

export type FdMatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "LIVE"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED"
  | "AWARDED";

export type FdScore = {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
  extraTime?: { home: number | null; away: number | null };
  penalties?: { home: number | null; away: number | null };
};

export type FdMatch = {
  id: number;
  utcDate: string;
  status: FdMatchStatus;
  matchday: number | null;
  stage: FdMatchStage;
  group: string | null;
  homeTeam: FdTeamMini;
  awayTeam: FdTeamMini;
  score: FdScore;
  lastUpdated: string;
};

export type FdMatchesResponse = {
  count: number;
  filters: Record<string, string>;
  competition: Pick<FdCompetition, "id" | "name" | "code" | "type" | "emblem">;
  matches: FdMatch[];
};

export type FdStandingRow = {
  position: number;
  team: FdTeamMini;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export type FdStandingsResponse = {
  competition: Pick<FdCompetition, "id" | "name" | "code" | "type" | "emblem">;
  season: FdSeason;
  standings: {
    stage: FdMatchStage;
    type: "TOTAL" | "HOME" | "AWAY";
    group: string | null;
    table: FdStandingRow[];
  }[];
};
