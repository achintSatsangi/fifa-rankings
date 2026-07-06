import { useMemo, useState } from "react";
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

export function RadialBracket() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

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
      {/*
       * `containerType: size` establishes an inline-and-block sized query
       * container so we can size the aspect-square inner div to the
       * smaller of the container's width/height using `min(100cqi, 100cqb)`.
       * Result: the ring uses as much space as the layout offers without
       * ever overflowing.
       */}
      <div
        style={{ containerType: "size" }}
        className="relative flex min-h-0 flex-1 items-center justify-center"
      >
        <div
          className="relative aspect-square"
          style={{ width: "min(100cqi, 100cqb)" }}
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
        </div>
      </div>

      <JourneyModal code={selectedCode} onClose={() => setSelectedCode(null)} />
    </div>
  );
}
