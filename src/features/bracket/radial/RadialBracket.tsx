import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BracketMatch } from "../../../data/types";
import { BRACKET, matchById } from "../data";
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
  flagSizesFor,
  markerSizeFor,
  matchCenterPoint,
  outerSlots,
  trophySizeFor,
} from "./layout";

/**
 * Walk a team's bracket path from R32 forward. Return the first
 * UNPLAYED match on their path (their upcoming game) if they're still
 * alive, or the LAST played match otherwise (a loss, or the Final
 * they won).
 */
function currentMatchFor(teamCode: string): BracketMatch | null {
  const r32 = BRACKET.find(
    (m) => m.round === "R32" && (m.teamCodeA === teamCode || m.teamCodeB === teamCode),
  );
  if (!r32) return null;

  let current: BracketMatch | null = r32;
  let last: BracketMatch | null = null;
  while (current) {
    last = current;
    if (!isMatchPlayed(current)) return current;
    if (winnerCode(current) !== teamCode) return current;
    const nextId: string | undefined = current.feedsInto?.matchId;
    current = nextId ? (matchById(nextId) ?? null) : null;
  }
  return last;
}

export function RadialBracket() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

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

  // Each team focuses on their current-or-next match — their upcoming
  // game if they're still alive, otherwise their loss (or final win).
  const currentMatch = useMemo<Map<string, BracketMatch>>(() => {
    const map = new Map<string, BracketMatch>();
    for (const s of outer) {
      if (!s.teamCode) continue;
      const m = currentMatchFor(s.teamCode);
      if (m) map.set(s.teamCode, m);
    }
    return map;
  }, [outer]);

  return (
    <div className="flex h-full w-full flex-col">
      <div
        ref={outerRef}
        className="relative flex min-h-0 flex-1 items-center justify-center"
      >
        {size > 0 ? (
          <RingContent
            size={size}
            outer={outer}
            eliminationCache={eliminationCache}
            winners={winners}
            unplayedMarkers={unplayedMarkers}
            currentMatch={currentMatch}
            onTeamClick={setSelectedCode}
          />
        ) : null}
      </div>

      <JourneyModal code={selectedCode} onClose={() => setSelectedCode(null)} />
    </div>
  );
}

type OuterSlot = ReturnType<typeof outerSlots>[number];
type Winner = { match: (typeof BRACKET)[number]; code: string | null; point: ReturnType<typeof matchCenterPoint> };
type Marker = { match: (typeof BRACKET)[number]; point: ReturnType<typeof matchCenterPoint> };

function RingContent({
  size,
  outer,
  eliminationCache,
  winners,
  unplayedMarkers,
  currentMatch,
  onTeamClick,
}: {
  size: number;
  outer: OuterSlot[];
  eliminationCache: Map<string, ReturnType<typeof eliminationRound>>;
  winners: Winner[];
  unplayedMarkers: Marker[];
  currentMatch: Map<string, BracketMatch>;
  onTeamClick: (code: string) => void;
}) {
  const sizes = useMemo(() => flagSizesFor(size), [size]);
  const markerSize = useMemo(() => markerSizeFor(size), [size]);
  const trophySize = useMemo(() => trophySizeFor(size), [size]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Connectors />
      {outer.map((s) => (
        <TeamPoint
          key={`o-${s.slot}`}
          code={s.teamCode}
          point={s.point}
          size={sizes.OUTER}
          faded={s.teamCode ? eliminationCache.get(s.teamCode) !== null : false}
          onClick={s.teamCode ? onTeamClick : undefined}
          layer="outer"
          match={s.teamCode ? currentMatch.get(s.teamCode) : undefined}
        />
      ))}
      {winners.map((w) => (
        <TeamPoint
          key={`w-${w.match.id}`}
          code={w.code}
          point={w.point}
          size={sizes[w.match.round]}
          onClick={w.code ? onTeamClick : undefined}
          layer="winner"
          match={w.code ? currentMatch.get(w.code) : undefined}
        />
      ))}
      {unplayedMarkers.map((m) => (
        <MatchMarker key={`u-${m.match.id}`} match={m.match} point={m.point} size={markerSize} />
      ))}
      <Trophy size={trophySize} />
    </div>
  );
}
