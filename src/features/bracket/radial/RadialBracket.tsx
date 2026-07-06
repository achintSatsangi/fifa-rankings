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
  OUTER_FLAG_RADIUS,
  WINNER_RING_RADIUS,
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
    // Skip F: the trophy occupies its centre and doubles as the
    // Final's info affordance (see Trophy component).
    return BRACKET.filter(
      (m) => m.round !== "3RD" && m.round !== "F" && !isMatchPlayed(m),
    ).map((m) => ({
      match: m,
      point: matchCenterPoint(m),
    }));
  }, []);

  const finalMatch = useMemo(() => BRACKET.find((m) => m.round === "F"), []);

  const currentMatch = useMemo<Map<string, BracketMatch>>(() => {
    const map = new Map<string, BracketMatch>();
    for (const s of outer) {
      if (!s.teamCode) continue;
      const m = currentMatchFor(s.teamCode);
      if (m) map.set(s.teamCode, m);
    }
    return map;
  }, [outer]);

  // For every team, look up their R32 match (used as the "past match"
  // tooltip content for their outer flag when it's not their innermost).
  const r32ByTeam = useMemo<Map<string, BracketMatch>>(() => {
    const map = new Map<string, BracketMatch>();
    for (const m of BRACKET) {
      if (m.round !== "R32") continue;
      if (m.teamCodeA) map.set(m.teamCodeA, m);
      if (m.teamCodeB) map.set(m.teamCodeB, m);
    }
    return map;
  }, []);

  // For every team, the smallest radius they appear at across all rings —
  // that's their "innermost" flag, which represents where they currently
  // stand in the tournament.
  const innermostByTeam = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    for (const s of outer) {
      if (s.teamCode) map.set(s.teamCode, OUTER_FLAG_RADIUS);
    }
    for (const w of winners) {
      if (!w.code) continue;
      const r = WINNER_RING_RADIUS[w.match.round];
      const cur = map.get(w.code);
      if (cur === undefined || r < cur) map.set(w.code, r);
    }
    return map;
  }, [outer, winners]);

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
            r32ByTeam={r32ByTeam}
            innermostByTeam={innermostByTeam}
            finalMatch={finalMatch}
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
  r32ByTeam,
  innermostByTeam,
  finalMatch,
  onTeamClick,
}: {
  size: number;
  outer: OuterSlot[];
  eliminationCache: Map<string, ReturnType<typeof eliminationRound>>;
  winners: Winner[];
  unplayedMarkers: Marker[];
  currentMatch: Map<string, BracketMatch>;
  r32ByTeam: Map<string, BracketMatch>;
  innermostByTeam: Map<string, number>;
  finalMatch: BracketMatch | undefined;
  onTeamClick: (code: string) => void;
}) {
  const sizes = useMemo(() => flagSizesFor(size), [size]);
  const markerSize = useMemo(() => markerSizeFor(size), [size]);
  const trophySize = useMemo(() => trophySizeFor(size), [size]);

  // Given a team + which ring the flag sits on, pick the tooltip's match:
  // - Innermost flag → team's current/upcoming match
  // - Other flags   → the past match this ring represents
  const matchForFlag = (
    teamCode: string,
    thisRingRadius: number,
    ringSpecificMatch: BracketMatch | undefined,
  ): BracketMatch | undefined => {
    const innermost = innermostByTeam.get(teamCode);
    if (innermost !== undefined && thisRingRadius === innermost) {
      return currentMatch.get(teamCode);
    }
    return ringSpecificMatch;
  };

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
          match={
            s.teamCode
              ? matchForFlag(s.teamCode, OUTER_FLAG_RADIUS, r32ByTeam.get(s.teamCode))
              : undefined
          }
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
          match={
            w.code
              ? matchForFlag(w.code, WINNER_RING_RADIUS[w.match.round], w.match)
              : undefined
          }
        />
      ))}
      {unplayedMarkers.map((m) => (
        <MatchMarker key={`u-${m.match.id}`} match={m.match} point={m.point} size={markerSize} />
      ))}
      <Trophy
        size={trophySize}
        match={finalMatch}
        focusTeam={finalMatch?.teamCodeA ?? undefined}
      />
    </div>
  );
}
