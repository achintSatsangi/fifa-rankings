import { create } from "zustand";
import { persist } from "zustand/middleware";
import { matchById } from "../data";

export type Picks = Record<string, string>;

type PicksState = {
  picks: Picks;
  setPick: (matchId: string, winnerCode: string) => void;
  reset: () => void;
};

/**
 * When a pick changes (user swaps the winner of a match they'd
 * already decided), any downstream picks that depended on the old
 * winner become stale. Cascade a wipe from the changed match forward
 * along the `feedsInto` chain.
 */
function wipeDownstream(picks: Picks, fromMatchId: string): void {
  const queue = [fromMatchId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const next = matchById(id)?.feedsInto?.matchId;
    if (next && picks[next] !== undefined) {
      delete picks[next];
      queue.push(next);
    }
  }
}

export const usePicksStore = create<PicksState>()(
  persist(
    (set) => ({
      picks: {},
      setPick: (matchId, winnerCode) =>
        set((state) => {
          const picks = { ...state.picks };
          const previous = picks[matchId];
          picks[matchId] = winnerCode;
          if (previous !== undefined && previous !== winnerCode) {
            wipeDownstream(picks, matchId);
          }
          return { picks };
        }),
      reset: () => set({ picks: {} }),
    }),
    { name: "fifa-ranking:picks" },
  ),
);
