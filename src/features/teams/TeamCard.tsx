import type { Team } from "../../data/types";
import { Flag } from "../flags/Flag";
import { Badge } from "../../ui/Badge";
import { FavouriteButton } from "../favourites/FavouriteButton";

type Props = {
  team: Team;
  onClick: (code: string) => void;
};

export function TeamCard({ team, onClick }: Props) {
  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => onClick(team.code)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`${team.name} — open journey`}
      >
        <Flag code={team.code} size={40} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-[var(--text)]">{team.name}</span>
            {team.advanced ? <Badge variant="success">R32</Badge> : null}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Group {team.groupId} · {team.confederation} · #{team.fifaRank}
          </div>
        </div>
      </button>
      <FavouriteButton code={team.code} size="sm" />
    </div>
  );
}
