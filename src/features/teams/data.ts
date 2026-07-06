import teamsData from "../../data/teams.json";
import type { Team } from "../../data/types";

export const TEAMS = teamsData as Team[];

const BY_CODE = new Map(TEAMS.map((t) => [t.code, t]));

export function teamByCode(code: string | null | undefined): Team | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code);
}
