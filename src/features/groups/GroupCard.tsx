import type { Group } from "../../data/types";
import { StandingsTable } from "./StandingsTable";
import { MatchList } from "./MatchList";

export function GroupCard({ group }: { group: Group }) {
  return (
    <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      <header className="mb-3 flex items-baseline gap-3">
        <h3 className="m-0 text-lg font-semibold text-[var(--text)]">Group {group.id}</h3>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <StandingsTable standings={group.standings} />
        </div>
        <div>
          <MatchList matches={group.matches} />
        </div>
      </div>
    </section>
  );
}
