import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BRACKET, matchesByRound } from "../data";
import { winnerCode } from "../resolver";
import { JourneyModal } from "../../teams/JourneyModal";
import { MatchCard } from "../horizontal/MatchCard";
import { Connectors } from "./Connectors";
import { TeamPoint } from "./TeamPoint";
import { Trophy } from "./Trophy";
import {
  FLAG_SIZE,
  eliminationRound,
  matchCenterPoint,
  outerSlots,
} from "./layout";

export function RadialBracket() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const { t } = useTranslation();

  const outer = useMemo(outerSlots, []);
  const eliminationCache = useMemo(() => {
    const map = new Map<string, ReturnType<typeof eliminationRound>>();
    for (const s of outer) if (s.teamCode) map.set(s.teamCode, eliminationRound(s.teamCode));
    return map;
  }, [outer]);

  const winners = useMemo(() => {
    return BRACKET.filter((m) => m.round !== "3RD" && m.round !== "R32")
      .map((m) => ({
        match: m,
        code: winnerCode(m),
        point: matchCenterPoint(m),
      }))
      .filter((x) => x.code !== null);
  }, []);

  const thirdPlace = matchesByRound("3RD")[0];

  return (
    <>
      <div className="relative mx-auto aspect-square w-full max-w-[min(720px,calc(100vh-14rem))]">
        <Connectors />

        {outer.map((s) => (
          <TeamPoint
            key={`o-${s.slot}`}
            code={s.teamCode}
            point={s.point}
            size={FLAG_SIZE.OUTER}
            faded={s.teamCode ? eliminationCache.get(s.teamCode) === "R32" : false}
            onClick={s.teamCode ? setSelectedCode : undefined}
            layer="outer"
          />
        ))}

        {winners.map((w) => (
          <TeamPoint
            key={`w-${w.match.id}`}
            code={w.code}
            point={w.point}
            size={FLAG_SIZE[w.match.round]}
            onClick={w.code ? setSelectedCode : undefined}
            layer="winner"
          />
        ))}

        <Trophy />
      </div>

      {thirdPlace ? (
        <div className="mx-auto mt-8 flex max-w-[420px] flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Third-place match
          </span>
          <MatchCard match={thirdPlace} onTeamClick={setSelectedCode} />
        </div>
      ) : null}

      <p className="mt-4 text-center text-xs text-[var(--text-muted)]">{t("shortcuts.hint")}</p>

      <JourneyModal code={selectedCode} onClose={() => setSelectedCode(null)} />
    </>
  );
}
