import type { MouseEvent } from "react";
import type { BracketMatch } from "../../../data/types";
import { useHoverTapToggle } from "../../../lib/hoverTapToggle";
import { Flag } from "../../flags/Flag";
import { teamByCode } from "../../teams/data";
import { MatchTooltip } from "../MatchTooltip";
import { formatMatchDate } from "../matchTime";
import { isWinner, resolveSlotCode, slotLabel } from "../resolver";

type Props = {
  match: BracketMatch;
  onTeamClick: (code: string) => void;
};

export function MatchCard({ match, onTeamClick }: Props) {
  const codeA = resolveSlotCode(match.slotA, match.teamCodeA);
  const codeB = resolveSlotCode(match.slotB, match.teamCodeB);
  const { visible, triggerProps, containerRef } = useHoverTapToggle();

  const handleCardClick = (e: MouseEvent) => {
    // Team-row buttons open the journey modal — don't hijack them.
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    triggerProps.onClick(e);
  };

  return (
    <article
      ref={containerRef as React.RefObject<HTMLElement>}
      onMouseEnter={triggerProps.onMouseEnter}
      onMouseLeave={triggerProps.onMouseLeave}
      onClick={handleCardClick}
      className="group relative flex w-56 cursor-pointer flex-col rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-sm"
      aria-label={`${match.id} ${formatMatchDate(match.date)}`}
    >
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        <span>{match.id}</span>
        <span>{formatMatchDate(match.date)}</span>
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
      <MatchTooltip match={match} visible={visible} />
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
