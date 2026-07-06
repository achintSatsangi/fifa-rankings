import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BracketRound } from "../../../data/types";
import { matchesByRoundInTreeOrder } from "../data";
import { JourneyModal } from "../../teams/JourneyModal";
import { MatchCard } from "./MatchCard";

const KNOCKOUT_ROUNDS: { round: BracketRound; label: string }[] = [
  { round: "R32", label: "Round of 32" },
  { round: "R16", label: "Round of 16" },
  { round: "QF",  label: "Quarter-finals" },
  { round: "SF",  label: "Semi-finals" },
  { round: "F",   label: "Final" },
];

export function HorizontalBracket() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-w-max gap-6 pb-2">
          {KNOCKOUT_ROUNDS.map(({ round, label }) => {
            const matches = matchesByRoundInTreeOrder(round);
            return (
              <div key={round} className="flex flex-col">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {label}
                </h3>
                <div className="flex flex-1 flex-col justify-around gap-2">
                  {matches.map((m) => (
                    <MatchCard key={m.id} match={m} onTeamClick={setSelectedCode} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-[var(--text-muted)]">{t("shortcuts.hint")}</p>

      <JourneyModal code={selectedCode} onClose={() => setSelectedCode(null)} />
    </div>
  );
}
