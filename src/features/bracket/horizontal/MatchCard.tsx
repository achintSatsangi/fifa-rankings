import type { BracketMatch } from "../../../data/types";
import { Flag } from "../../flags/Flag";
import { teamByCode } from "../../teams/data";
import { isWinner, resolveSlotCode, slotLabel } from "../resolver";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

type Props = {
  match: BracketMatch;
  onTeamClick: (code: string) => void;
};

export function MatchCard({ match, onTeamClick }: Props) {
  const codeA = resolveSlotCode(match.slotA, match.teamCodeA);
  const codeB = resolveSlotCode(match.slotB, match.teamCodeB);
  return (
    <article
      className="flex w-56 flex-col rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-sm"
      aria-label={`${match.id} ${dateFmt.format(new Date(match.date))}`}
    >
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        <span>{match.id}</span>
        <span>{dateFmt.format(new Date(match.date))}</span>
      </header>
      <TeamRow
        code={codeA}
        placeholder={slotLabel(match.slotA)}
        score={match.scoreA}
        pen={match.penaltyA ?? null}
        highlight={isWinner(match, codeA)}
        onClick={onTeamClick}
      />
      <TeamRow
        code={codeB}
        placeholder={slotLabel(match.slotB)}
        score={match.scoreB}
        pen={match.penaltyB ?? null}
        highlight={isWinner(match, codeB)}
        onClick={onTeamClick}
      />
      {match.extraTime || match.penaltyA !== null ? (
        <footer className="border-t border-[var(--border-subtle)] px-2 py-1 text-right text-[10px] text-[var(--text-muted)]">
          {match.penaltyA !== null && match.penaltyB !== null
            ? `${match.penaltyA}–${match.penaltyB} pens`
            : "a.e.t."}
        </footer>
      ) : null}
    </article>
  );
}

function TeamRow({
  code,
  placeholder,
  score,
  pen,
  highlight,
  onClick,
}: {
  code: string | null;
  placeholder: string;
  score: number | null;
  pen: number | null;
  highlight: boolean;
  onClick: (code: string) => void;
}) {
  const team = teamByCode(code);
  const isPlaceholder = !team;
  const base =
    "flex items-center gap-2 border-b border-[var(--border-subtle)] px-2 py-1.5 text-sm last:border-b-0";
  const emphasis = highlight ? "font-semibold text-[var(--text)]" : "text-[var(--text-secondary)]";
  const inner = (
    <>
      {team ? (
        <Flag code={team.code} size={22} />
      ) : (
        <span className="inline-block h-[22px] w-[22px] rounded-full border border-dashed border-[var(--border)]" />
      )}
      <span className={`min-w-0 flex-1 truncate ${isPlaceholder ? "italic text-[var(--text-muted)]" : ""}`}>
        {team?.name ?? placeholder}
      </span>
      {score !== null ? (
        <span className={`font-mono tabular-nums ${emphasis}`}>
          {score}
          {pen !== null ? <span className="ml-0.5 text-[10px] text-[var(--text-muted)]">({pen})</span> : null}
        </span>
      ) : null}
    </>
  );
  if (team) {
    return (
      <button
        type="button"
        onClick={() => onClick(team.code)}
        className={`${base} ${emphasis} text-left transition-colors hover:bg-[var(--surface)]`}
      >
        {inner}
      </button>
    );
  }
  return <div className={`${base} ${emphasis}`}>{inner}</div>;
}
