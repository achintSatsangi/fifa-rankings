import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { BRACKET } from "../data";
import { isMatchPlayed } from "../matchTime";
import { winnerCode } from "../resolver";
import { JourneyModal } from "../../teams/JourneyModal";
import { Connectors } from "./Connectors";
import { MatchMarker } from "./MatchMarker";
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
  const outerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  // Measure the available slot and size the (square) ring to the smaller of
  // width/height. ResizeObserver is more reliable than `container-type: size`
  // container queries — the latter needs a definite parent height, which our
  // flex-column chain doesn't always give (min-h-svh is not `height`).
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize(Math.floor(Math.min(width, height)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const unplayedMarkers = useMemo(() => {
    return BRACKET.filter((m) => m.round !== "3RD" && !isMatchPlayed(m)).map((m) => ({
      match: m,
      point: matchCenterPoint(m),
    }));
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div
        ref={outerRef}
        className="relative flex min-h-0 flex-1 items-center justify-center"
      >
        {size > 0 ? (
          <div className="relative" style={{ width: size, height: size }}>
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
            {unplayedMarkers.map((m) => (
              <MatchMarker key={`u-${m.match.id}`} match={m.match} point={m.point} />
            ))}
            <Trophy />
          </div>
        ) : null}
      </div>

      <JourneyModal code={selectedCode} onClose={() => setSelectedCode(null)} />
    </div>
  );
}
