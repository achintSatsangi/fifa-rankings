import groupsData from "../../data/groups.json";
import type { Group } from "../../data/types";

export const GROUPS = groupsData as Group[];

const BY_ID = new Map(GROUPS.map((g) => [g.id, g]));

export function groupById(id: string | null | undefined): Group | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}
