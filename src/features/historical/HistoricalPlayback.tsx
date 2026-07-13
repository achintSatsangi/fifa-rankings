import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flag } from "../flags/Flag";
import { TeamPoint } from "../bracket/radial/TeamPoint";
import { Trophy } from "../bracket/radial/Trophy";
import { teamByCode } from "../teams/data";
import {
  type HistoricalMatch,
  type HistoricalTournament,
} from "./data";
import {
  HistoricalConnectors,
  flagSizesFor,
  layoutBracket,
  OUTER_R,
  pointAt,
  slotAngle,
  toBracketMatch,
  trophySizeFor,
  type LaidOutMatch,
  type LayoutResult,
} from "./HistoricalRadial";
import { formatMatchDateLong, formatScore } from "../bracket/matchTime";

/**
 * Replay view for historical tournaments. Reuses `layoutBracket` for
 * positions and `HistoricalConnectors` for the bracket geometry, then
 * gates winner-ring flags on which chronologically-sorted matches have
 * been "played" up to `playbackIndex`. UI mirrors the WC26 replay:
 * ring on top, inline match card, scrubber + speed + play controls.
 *
 * No highlight-video integration — no YouTube data exists for pre-2026
 * matches, so the card just shows round, date, and score.
 */

const BASE_STEP_MS = 2400;
const BASE_INFO_DWELL_MS = 1900;
const CARD_FADE_MS = 390;

const SPEED_OPTIONS = [1, 2, 4] as const;
const SPEED_LABEL: Record<(typeof SPEED_OPTIONS)[number], string> = {
  1: "0.5×",
  2: "1×",
  4: "2×",
};
type Speed = (typeof SPEED_OPTIONS)[number];

const ROUND_LABELS: Record<HistoricalMatch["round"], string> = {
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3RD": "3rd",
  F: "F",
};

/** Sort by date, then by team codes as a stable tiebreak for same-day
 *  kickoffs. Third-place match is excluded — it doesn't fit the "path
 *  to trophy" narrative and confuses the scrubber markers. */
function orderedPlayableMatches(t: HistoricalTournament): HistoricalMatch[] {
  return t.matches
    .filter((m) => m.round !== "3RD" && m.date !== null)
    .sort((a, b) => {
      if (a.date !== b.date) return (a.date ?? "").localeCompare(b.date ?? "");
      return (a.teamA + a.teamB).localeCompare(b.teamA + b.teamB);
    });
}

type RoundMarker = { round: HistoricalMatch["round"]; label: string; startIndex: number };

/** Markers for the rounds present in this tournament, in play order. */
function markersFor(sorted: HistoricalMatch[]): RoundMarker[] {
  const seen: RoundMarker[] = [];
  const usedRounds = new Set<string>();
  sorted.forEach((m, i) => {
    if (usedRounds.has(m.round)) return;
    usedRounds.add(m.round);
    seen.push({ round: m.round, label: ROUND_LABELS[m.round], startIndex: i });
  });
  return seen;
}

export function HistoricalPlayback({ tournament }: { tournament: HistoricalTournament }) {
  const { t } = useTranslation();
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

  const layout = useMemo(() => layoutBracket(tournament), [tournament]);
  const sortedMatches = useMemo(() => orderedPlayableMatches(tournament), [tournament]);
  const total = sortedMatches.length;
  const markers = useMemo(() => markersFor(sortedMatches), [sortedMatches]);

  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(2);
  const [cardVisible, setCardVisible] = useState(false);
  const [infoMatch, setInfoMatch] = useState<HistoricalMatch | null>(null);

  // Reset on tournament change so scrubbing state doesn't carry across
  // year switches.
  useEffect(() => {
    setPlaybackIndex(0);
    setPlaying(false);
    setCardVisible(false);
    setInfoMatch(null);
  }, [tournament]);

  // Autoplay: step forward every BASE_STEP_MS / speed while playing.
  useEffect(() => {
    if (!playing) return;
    if (playbackIndex >= total) {
      setPlaying(false);
      return;
    }
    const step = window.setTimeout(() => {
      setPlaybackIndex((i) => i + 1);
    }, BASE_STEP_MS / speed);
    return () => window.clearTimeout(step);
  }, [playing, playbackIndex, total, speed]);

  // When the playback index advances, surface the current match in the
  // card and start a dwell timer to fade it out (only relevant during
  // autoplay — scrubbing keeps the card up until they scrub away).
  useEffect(() => {
    if (playbackIndex === 0) {
      setInfoMatch(null);
      setCardVisible(false);
      return;
    }
    const m = sortedMatches[playbackIndex - 1];
    if (!m) return;
    setInfoMatch(m);
    setCardVisible(true);
    if (!playing) return;
    const timer = window.setTimeout(() => setCardVisible(false), BASE_INFO_DWELL_MS / speed);
    return () => window.clearTimeout(timer);
  }, [playbackIndex, sortedMatches, playing, speed]);

  const handlePlayPause = () => {
    if (playbackIndex >= total) {
      setPlaybackIndex(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };
  const handleReset = () => {
    setPlaying(false);
    setPlaybackIndex(0);
    setInfoMatch(null);
    setCardVisible(false);
  };
  const handleScrub = useCallback(
    (v: number) => {
      const idx = Math.max(0, Math.min(total, Math.round(v)));
      setPlaying(false);
      setPlaybackIndex(idx);
      if (idx > 0) {
        setInfoMatch(sortedMatches[idx - 1]);
        setCardVisible(true);
      } else {
        setInfoMatch(null);
        setCardVisible(false);
      }
    },
    [total, sortedMatches],
  );

  // Which matches from the layout have been played by this index?
  // Set of the underlying HistoricalMatch object references — the layout
  // stores the same references so identity comparison works.
  const playedSet = useMemo(() => {
    return new Set<HistoricalMatch>(sortedMatches.slice(0, playbackIndex));
  }, [sortedMatches, playbackIndex]);

  const done = playbackIndex >= total;

  return (
    <div className="flex h-full w-full flex-col">
      <div
        ref={outerRef}
        // Aspect-square by width — full mobile width for the ring,
        // card + scrubber stack below with their own height.
        className="relative mx-auto flex aspect-square w-full max-w-[min(100%,calc(100svh-15rem),1000px)] items-center justify-center overflow-hidden"
      >
        {size > 0 ? (
          <PlaybackRing
            size={size}
            layout={layout}
            playedSet={playedSet}
            year={tournament.year}
          />
        ) : null}
      </div>

      {/* Inline match card — reserved height so scrubber doesn't jump. */}
      <div className="mt-2 flex min-h-[80px] shrink-0 justify-center sm:mt-3 sm:min-h-[104px]">
        {infoMatch ? (
          <HistoricalMatchInfoCard match={infoMatch} visible={cardVisible} />
        ) : null}
      </div>

      <div className="mt-3 shrink-0 space-y-2">
        <PlaybackScrubber
          index={playbackIndex}
          total={total}
          markers={markers}
          onScrub={handleScrub}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--text-secondary)]">
          <span className="tabular-nums">
            {t("replay.match")} {playbackIndex} / {total}
            {done ? ` · ${t("replay.done")}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <PlaybackSpeedControl value={speed} onChange={setSpeed} />
            <button
              type="button"
              onClick={handleReset}
              disabled={playbackIndex === 0}
              className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("replay.reset")}
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              className="rounded-full bg-[var(--btn-bg)] px-3 py-1 text-xs font-medium text-[var(--btn-text)] transition-colors hover:bg-[var(--btn-bg-hover)]"
            >
              {playing ? t("replay.pause") : t("replay.play")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaybackRing({
  size,
  layout,
  playedSet,
  year,
}: {
  size: number;
  layout: LayoutResult;
  playedSet: Set<HistoricalMatch>;
  year: number;
}) {
  const sizes = flagSizesFor(size);
  const trophySize = trophySizeFor(size);
  const championFlagSize = Math.round(trophySize * 1.4);
  const outerCount = layout.outerTeams.length;

  // The trophy flag hovers ABOVE the trophy icon (matches the static
  // HistoricalRadial). Compute its target y in normalised coords —
  // `trophySize * 0.9` above centre, converted from px → fraction.
  const championY = 0.5 - (trophySize * 0.9) / size;

  // For each team on the outer ring, compute their CURRENT position by
  // walking their path (R16 → QF → SF → F) and stopping at the last
  // played match they won. Rendering one TeamPoint per team (keyed by
  // team code) means the SAME DOM element moves inward when they
  // advance — SLIDE_TRANSITION on left/top/width/height then animates
  // the transition, matching the WC26 replay.
  const states = layout.outerTeams.map((team, i) => {
    if (!team) {
      // Empty outer slot — render as a placeholder TeamPoint (null code
      // becomes the dashed circle) at its fixed outer position.
      return {
        key: `empty-${i}`,
        code: null as string | null,
        point: pointAt(slotAngle(i, outerCount), OUTER_R),
        size: sizes.OUTER,
        match: undefined as HistoricalMatch | undefined,
        isChampion: false,
      };
    }

    let point = pointAt(slotAngle(i, outerCount), OUTER_R);
    let currentSize = sizes.OUTER;
    // Fall back tooltip: this team's FIRST-round match (R16/QF/SF).
    let currentMatch: HistoricalMatch | undefined = (layout.r16Layout.length > 0
      ? layout.r16Layout[Math.floor(i / 2)]?.match
      : layout.qfLayout.length > 0
        ? layout.qfLayout[Math.floor(i / 2)]?.match
        : layout.sfLayout[Math.floor(i / 2)]?.match) ?? undefined;
    let isChampion = false;

    const advance = (list: LaidOutMatch[], nextSize: number) => {
      const m = list.find((x) => x.winner === team && x.match && playedSet.has(x.match));
      if (m && m.match) {
        point = pointAt(m.angle, m.radius);
        currentSize = nextSize;
        currentMatch = m.match;
      }
    };
    advance(layout.r16Layout, sizes.R16);
    advance(layout.qfLayout, sizes.QF);
    advance(layout.sfLayout, sizes.SF);
    const f = layout.finalLayout[0];
    if (f && f.winner === team && f.match && playedSet.has(f.match)) {
      point = { x: 0.5, y: championY };
      currentSize = championFlagSize;
      currentMatch = f.match;
      isChampion = true;
    }

    return { key: team, code: team, point, size: currentSize, match: currentMatch, isChampion };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <HistoricalConnectors layout={layout} highlightedTeam={null} />

      <Trophy
        size={trophySize}
        match={layout.finalLayout[0]?.match ? toBracketMatch(layout.finalLayout[0].match, year) : undefined}
        focusTeam={layout.finalLayout[0]?.winner ?? undefined}
      />

      {/* One TeamPoint per team, keyed stably by team code so React
          reuses the DOM element across playback advances. */}
      {states.map((s) => (
        <TeamPoint
          key={s.key}
          code={s.code}
          point={s.point}
          size={s.size}
          layer={s.isChampion ? "outer" : "outer"}
          match={s.match ? toBracketMatch(s.match, year) : undefined}
        />
      ))}
    </div>
  );
}

function HistoricalMatchInfoCard({
  match,
  visible,
}: {
  match: HistoricalMatch;
  visible: boolean;
}) {
  const codeA = match.teamA;
  const codeB = match.teamB;
  const teamA = teamByCode(codeA);
  const teamB = teamByCode(codeB);
  const bracketMatch = toBracketMatch(match, 0);
  return (
    <div
      aria-label={`${ROUND_LABELS[match.round]}: ${teamA?.name ?? codeA} vs ${teamB?.name ?? codeB}`}
      className="flex h-[80px] w-[240px] flex-col justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1.5 text-center text-xs shadow-sm sm:h-[104px] sm:w-[260px] sm:px-3 sm:py-2.5"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${CARD_FADE_MS}ms ease`,
      }}
    >
      <div className="truncate text-[9px] uppercase tracking-wide text-[var(--text-muted)] sm:text-[10px]">
        {ROUND_LABELS[match.round]} · {match.date ? formatMatchDateLong(match.date) : ""}
      </div>
      <div className="flex items-center justify-center gap-2 text-[var(--text)] sm:gap-1.5">
        <Flag code={codeA} size={18} tooltip={false} />
        <span className="hidden min-w-0 flex-1 truncate text-right text-[11px] font-medium sm:inline">
          {teamA?.name ?? codeA}
        </span>
        <span className="shrink-0 font-mono text-[12px] tabular-nums">{formatScore(bracketMatch)}</span>
        <span className="hidden min-w-0 flex-1 truncate text-left text-[11px] font-medium sm:inline">
          {teamB?.name ?? codeB}
        </span>
        <Flag code={codeB} size={18} tooltip={false} />
      </div>
      <div className="truncate text-[10px] text-[var(--text-muted)]">
        {match.venue ?? ""}
      </div>
    </div>
  );
}

function PlaybackSpeedControl({ value, onChange }: { value: Speed; onChange: (v: Speed) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Playback speed"
      className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] p-0.5"
    >
      {SPEED_OPTIONS.map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s)}
            className={
              "rounded-full px-2 py-0.5 text-[11px] tabular-nums transition-colors " +
              (active
                ? "bg-[var(--btn-bg)] text-[var(--btn-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]")
            }
          >
            {SPEED_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}

function PlaybackScrubber({
  index,
  total,
  markers,
  onScrub,
}: {
  index: number;
  total: number;
  markers: RoundMarker[];
  onScrub: (v: number) => void;
}) {
  if (total === 0) return null;

  const pct = (index / total) * 100;

  return (
    <div className="px-1">
      <div className="relative h-[22px]">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-[var(--border-subtle)]" />
        <div
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-l bg-[var(--accent)]"
          style={{ left: 0, width: `${pct}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={0}
          max={total}
          value={index}
          onChange={(e) => onScrub(Number(e.currentTarget.value))}
          aria-label="Scrub through the tournament"
          className="themed-range relative"
          style={{ background: "transparent" }}
        />
      </div>
      <div className="relative mt-1 h-4">
        {markers.map((m) => {
          const p = (m.startIndex / total) * 100;
          return (
            <div
              key={m.round}
              className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-[9px] uppercase tracking-wide text-[var(--text-secondary)]"
              style={{ left: `${p}%` }}
            >
              <span className="block h-1 w-px bg-[var(--border-strong)]" aria-hidden="true" />
              <span>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
