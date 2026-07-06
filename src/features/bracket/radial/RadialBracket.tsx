import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ZoomContainer } from "../../../components/ZoomContainer";
import { BRACKET } from "../data";
import { winnerCode } from "../resolver";
import { JourneyModal } from "../../teams/JourneyModal";
import { Connectors } from "./Connectors";
import { TeamPoint } from "./TeamPoint";
import { Trophy } from "./Trophy";
import {
  FLAG_SIZE,
  eliminationRound,
  matchCenterPoint,
  outerSlots,
} from "./layout";

/** Natural CSS-pixel size of the radial layout. ZoomContainer scales
 *  it down to fit the viewport on load; user gestures zoom in from there. */
const CONTENT_SIZE = 720;

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
    return BRACKET.filter((m) => m.round !== "3RD" && FLAG_SIZE[m.round] > 0)
      .map((m) => ({
        match: m,
        code: winnerCode(m),
        point: matchCenterPoint(m),
      }))
      .filter((x) => x.code !== null);
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <ZoomContainer
          storageKey="fifa-ranking:zoom:radial"
          contentWidth={CONTENT_SIZE}
          contentHeight={CONTENT_SIZE}
        >
          <Connectors />
          {outer.map((s) => (
            <TeamPoint
              key={`o-${s.slot}`}
              code={s.teamCode}
              point={s.point}
              size={FLAG_SIZE.OUTER}
              faded={s.teamCode ? eliminationCache.get(s.teamCode) !== null : false}
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
        </ZoomContainer>
      </div>

      <p className="mt-2 text-center text-xs text-[var(--text-muted)]">{t("shortcuts.hint")}</p>

      <JourneyModal code={selectedCode} onClose={() => setSelectedCode(null)} />
    </div>
  );
}
