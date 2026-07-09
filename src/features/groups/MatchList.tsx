import { useTranslation } from "react-i18next";
import type { GroupMatch } from "../../data/types";
import { formatMatchDate } from "../bracket/matchTime";
import { Flag } from "../flags/Flag";
import { teamByCode } from "../teams/data";

export function MatchList({ matches }: { matches: GroupMatch[] }) {
  const { t } = useTranslation();
  const sorted = [...matches].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return (
    <ol className="flex flex-col divide-y divide-[var(--border-subtle)]">
      {sorted.map((m, i) => {
        const home = teamByCode(m.homeCode);
        const away = teamByCode(m.awayCode);
        const played = m.homeScore !== null && m.awayScore !== null;
        return (
          <li key={i} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-16 shrink-0 text-xs text-[var(--text-muted)]">
              MD{m.matchDay} · {formatMatchDate(m.date)}
            </span>
            <span className="flex flex-1 items-center justify-end gap-2 text-right">
              <span className="hidden text-[var(--text)] sm:inline">{home?.name ?? m.homeCode}</span>
              <Flag code={m.homeCode} size={20} />
            </span>
            <span className="w-16 shrink-0 text-center font-mono text-[var(--text)]">
              {played ? `${m.homeScore} – ${m.awayScore}` : t("team.notPlayed")}
            </span>
            <span className="flex flex-1 items-center gap-2">
              <Flag code={m.awayCode} size={20} />
              <span className="hidden text-[var(--text)] sm:inline">{away?.name ?? m.awayCode}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
