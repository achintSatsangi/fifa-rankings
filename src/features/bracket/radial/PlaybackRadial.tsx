import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BracketMatch, BracketRound } from "../../../data/types";
import { Flag } from "../../flags/Flag";
import { HighlightButton } from "../../highlights/HighlightButton";
import { resolveHighlight } from "../../highlights/resolver";
import { teamByCode } from "../../teams/data";
import { BRACKET } from "../data";
import { formatMatchDateLong, formatScore, isMatchPlayed } from "../matchTime";
import { computeTeamStates, type TeamPickState } from "../picks/state";
import type { Picks } from "../picks/store";
import { winnerCode } from "../resolver";
import { Confetti } from "../../celebrations/Confetti";
import { Connectors } from "./Connectors";
import {
  flagSizesFor,
  OUTER_FLAG_RADIUS,
  trophySizeFor,
  WINNER_RING_RADIUS,
} from "./layout";
import { TeamPoint } from "./TeamPoint";
import { Trophy } from "./Trophy";

/** Base step interval (ms) at 1× speed. Slide is 550ms; leftover is
 *  breathing time before the next transition. */
const BASE_STEP_MS = 2400;
/** How long the info card stays fully visible after a step, at 1×. */
const BASE_INFO_DWELL_MS = 1900;
/** Card fade duration — fixed regardless of playback speed so
 *  transitions never feel "jumpy" at 2× or "sluggish" at 0.5×. */
const CARD_FADE_MS = 390;
/** Ring zoom transition — matches feel of the fade, distinct from the
 *  team-flag slide (which is 550ms). */
const ZOOM_TRANSITION_MS = 900;

/** How much to zoom the ring based on how far we've played. Kicks up
 *  each time a full round completes so the focus stays on the still-
 *  active inner rings while eliminated outer flags recede off-frame. */
function zoomForIndex(playbackIndex: number): number {
  if (playbackIndex >= 30) return 2.2; // F done — celebrate champion
  if (playbackIndex >= 28) return 1.8; // SF done — 2 finalists
  if (playbackIndex >= 24) return 1.55; // QF done — 4 semis
  if (playbackIndex >= 16) return 1.25; // R32 done — 16 R16 slots
  return 1;
}

/** Speed multipliers applied to BASE_STEP_MS / BASE_INFO_DWELL_MS.
 *  Labels shown to users are half the raw value ("1" ⇒ "0.5×", "2"
 *  ⇒ "1×", "4" ⇒ "2×") — an earlier real 0.5× option felt too slow
 *  to watch, so we shifted the scale up. */
const SPEED_OPTIONS = [1, 2, 4] as const;
const SPEED_LABEL: Record<(typeof SPEED_OPTIONS)[number], string> = {
  1: "0.5×",
  2: "1×",
  4: "2×",
};
type Speed = (typeof SPEED_OPTIONS)[number];

const ROUND_LABELS: Record<BracketRound, string> = {
  R32: "R32",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3RD": "3rd",
  F: "F",
};
/** Rounds shown as scrubber markers, in play order. Third-place is
 *  intentionally skipped — it doesn't fit the "path to trophy" reading. */
const MARKER_ROUNDS: BracketRound[] = ["R32", "R16", "QF", "SF", "F"];

type RoundMarker = { round: BracketRound; label: string; startIndex: number };

function orderedPlayedMatches(): BracketMatch[] {
  return BRACKET.filter(isMatchPlayed).sort((a, b) => {
    const da = a.utcDate ?? a.date;
    const db = b.utcDate ?? b.date;
    if (da < db) return -1;
    if (da > db) return 1;
    return a.id.localeCompare(b.id);
  });
}

/** Fixed marker positions across the FULL knockout tournament (played
 *  or not). Users always see R32/R16/QF/SF/F on the timeline; the
 *  slider itself is capped separately so they can't scrub past what
 *  has actually been played. */
function fullTournamentMarkers(): { markers: RoundMarker[]; total: number } {
  const counts: Partial<Record<BracketRound, number>> = {};
  for (const m of BRACKET) {
    if (m.round === "3RD") continue;
    counts[m.round] = (counts[m.round] ?? 0) + 1;
  }
  let running = 0;
  const markers: RoundMarker[] = MARKER_ROUNDS.map((r) => {
    const start = running;
    running += counts[r] ?? 0;
    return { round: r, label: ROUND_LABELS[r], startIndex: start };
  });
  return { markers, total: running };
}

export function PlaybackRadial() {
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

  const sortedMatches = useMemo(orderedPlayedMatches, []);
  const totalPlayed = sortedMatches.length;
  const { markers, total: totalKnockoutMatches } = useMemo(fullTournamentMarkers, []);

  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Default 2 (labelled "1×") = old 2× real. Old default (1) felt slow.
  const [speed, setSpeed] = useState<Speed>(2);
  const [infoMatch, setInfoMatch] = useState<BracketMatch | null>(null);
  const [cardVisible, setCardVisible] = useState(false);

  const picks: Picks = useMemo(() => {
    const p: Picks = {};
    for (let i = 0; i < playbackIndex; i++) {
      const m = sortedMatches[i];
      const w = winnerCode(m);
      if (w) p[m.id] = w;
    }
    return p;
  }, [playbackIndex, sortedMatches]);

  const teamStates = useMemo(() => computeTeamStates(picks), [picks]);
  const finalMatch = useMemo(() => BRACKET.find((m) => m.round === "F"), []);
  const zoom = zoomForIndex(playbackIndex);

  useEffect(() => {
    if (!playing) return;
    if (playbackIndex >= totalPlayed) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const nextMatch = sortedMatches[playbackIndex];
      setInfoMatch(nextMatch);
      setCardVisible(true);
      setPlaybackIndex((i) => i + 1);
    }, BASE_STEP_MS / speed);
    return () => window.clearTimeout(timer);
  }, [playing, playbackIndex, totalPlayed, sortedMatches, speed]);

  useEffect(() => {
    if (!cardVisible || !playing) return;
    const timer = window.setTimeout(() => setCardVisible(false), BASE_INFO_DWELL_MS / speed);
    return () => window.clearTimeout(timer);
  }, [cardVisible, playing, speed]);

  const handlePlayPause = () => {
    if (playbackIndex >= totalPlayed) {
      setPlaybackIndex(0);
      setInfoMatch(null);
      setCardVisible(false);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };
  const handleReset = () => {
    setPlaying(false);
    setPlaybackIndex(0);
    setInfoMatch(null);
    setCardVisible(false);
  };

  /** Scrub — fires on every value change (drag live, drag end, click,
   *  keyboard). Updates the card in-flight so users see the current
   *  match's info track their drag position. Flag images cache by URL,
   *  so rapid content swaps are cheap after first paint. */
  const handleScrub = useCallback(
    (v: number) => {
      const idx = Math.max(0, Math.min(totalPlayed, Math.round(v)));
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
    [totalPlayed, sortedMatches],
  );

  const done = playbackIndex >= totalPlayed;

  // Confetti fires when the CURRENT (most recently played) match is the
  // Final. Scrubbing away flips this back off; re-hitting the Final
  // triggers a fresh burst.
  const finalJustPlayed =
    playbackIndex > 0 && sortedMatches[playbackIndex - 1]?.round === "F";

  return (
    <div className="flex h-full w-full flex-col">
      <Confetti active={finalJustPlayed} />
      <div
        ref={outerRef}
        // Aspect-square by WIDTH so the ring gets the full viewport
        // width on mobile. Card + scrubber stack below and add their
        // own height — the parent wrapper is no longer forced-square,
        // so nothing steals height from the ring.
        className="relative mx-auto flex aspect-square w-full max-w-[calc(100svh-15rem)] items-center justify-center overflow-hidden"
      >
        {size > 0 ? (
          <Ring size={size} teamStates={teamStates} finalMatch={finalMatch} zoom={zoom} />
        ) : null}
      </div>
      {/* Match info card lives INLINE between the ring and the scrubber
          — reserved height so the scrubber never jumps when a match is
          scrubbed in or out. Card fades via opacity so successive
          matches transition smoothly during autoplay. Compact height
          on mobile so the bracket keeps more vertical real estate. */}
      <div className="mt-2 flex min-h-[80px] shrink-0 justify-center sm:mt-3 sm:min-h-[104px]">
        {infoMatch ? (
          <MatchInfoCard match={infoMatch} visible={cardVisible} />
        ) : null}
      </div>
      {/* All controls stacked at the bottom: scrubber first (visual
          orientation), then the play/speed row. */}
      <div className="mt-3 shrink-0 space-y-2">
        <Scrubber
          index={playbackIndex}
          total={totalKnockoutMatches}
          maxScrub={totalPlayed}
          markers={markers}
          onScrub={handleScrub}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--text-secondary)]">
          <span className="tabular-nums">
            {t("replay.match")} {playbackIndex} / {totalPlayed}
            {done ? ` · ${t("replay.done")}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <SpeedControl value={speed} onChange={setSpeed} />
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

function SpeedControl({ value, onChange }: { value: Speed; onChange: (v: Speed) => void }) {
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

function Scrubber({
  index,
  total,
  maxScrub,
  markers,
  onScrub,
}: {
  index: number;
  total: number;
  maxScrub: number;
  markers: RoundMarker[];
  onScrub: (v: number) => void;
}) {
  const localValue = index;

  if (total === 0) return null;

  const handleInputChange = (v: number) => {
    onScrub(Math.min(v, maxScrub));
  };

  // Three zones on the track for at-a-glance state:
  //   0 → index       — bright accent  (what you've watched)
  //   index → maxScrub — accent 30%   (available to seek forward)
  //   maxScrub → total — dim border   (unplayed matches, unavailable)
  const pctIndex = (localValue / total) * 100;
  const pctMax = (maxScrub / total) * 100;

  return (
    <div className="px-1">
      <div className="relative h-[22px]">
        {/* Zone backgrounds sit BEHIND the native range track (which
            keeps its own default drawing but is transparent-enough).
            We paint zones at the same vertical midpoint as the track. */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-[var(--border-subtle)]" />
        <div
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-l bg-[var(--accent)]/30"
          style={{ left: 0, width: `${pctMax}%` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-l bg-[var(--accent)]"
          style={{ left: 0, width: `${pctIndex}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={0}
          max={total}
          value={localValue}
          onChange={(e) => handleInputChange(Number(e.currentTarget.value))}
          aria-label="Scrub through the tournament"
          className="themed-range relative"
          style={{ background: "transparent" }}
        />
      </div>
      {/* Round markers pinned to their fixed positions in the full
          tournament — QF/SF/F show even before those matches happen. */}
      <div className="relative mt-1 h-4">
        {markers.map((m) => {
          const pct = (m.startIndex / total) * 100;
          const played = m.startIndex <= maxScrub;
          return (
            <div
              key={m.round}
              className={
                "absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-[9px] uppercase tracking-wide " +
                (played ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]/60")
              }
              style={{ left: `${pct}%` }}
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

function Ring({
  size,
  teamStates,
  finalMatch,
  zoom,
}: {
  size: number;
  teamStates: TeamPickState[];
  finalMatch: BracketMatch | undefined;
  zoom: number;
}) {
  const sizes = useMemo(() => flagSizesFor(size), [size]);
  const trophySize = useMemo(() => trophySizeFor(size), [size]);

  const flagSizeForRadius = (r: number): number => {
    if (r === OUTER_FLAG_RADIUS) return sizes.OUTER;
    if (r === WINNER_RING_RADIUS.R32) return sizes.R32;
    if (r === WINNER_RING_RADIUS.R16) return sizes.R16;
    if (r === WINNER_RING_RADIUS.QF) return sizes.QF;
    if (r === WINNER_RING_RADIUS.SF) return sizes.SF;
    return sizes.OUTER;
  };

  // Outer wrapper keeps a stable box for layout; inner wrapper carries
  // the scale so the transform animates without shifting the flex
  // container around it. Overflow lives on the parent (relative flex)
  // so overflowing outer flags get clipped cleanly during zoom.
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: `transform ${ZOOM_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: "transform",
        }}
      >
        <Connectors />
        {teamStates.map((state) => (
          <TeamPoint
            key={state.code}
            code={state.code}
            point={state.point}
            size={flagSizeForRadius(state.radius)}
            faded={state.eliminated}
            layer={state.radius === OUTER_FLAG_RADIUS ? "outer" : "winner"}
          />
        ))}
        <Trophy size={trophySize} match={finalMatch} />
      </div>
    </div>
  );
}

/** Compact inline card rendered between the ring and the scrubber.
 *  Fades in/out via a CSS opacity transition — the parent controls
 *  `visible`, we stay mounted through the fade so successive matches
 *  transition smoothly during autoplay. */
function MatchInfoCard({
  match,
  visible,
}: {
  match: BracketMatch;
  visible: boolean;
}) {
  const { t } = useTranslation();
  const codeA = match.teamCodeA ?? "";
  const codeB = match.teamCodeB ?? "";
  const teamA = teamByCode(codeA);
  const teamB = teamByCode(codeB);
  const roundLabel = roundName(match.round);
  const highlight = resolveHighlight(match.id, codeA, codeB);
  return (
    <div
      aria-label={`${roundLabel}: ${teamA?.name ?? codeA} vs ${teamB?.name ?? codeB}`}
      // Fixed width + fixed height so the box doesn't resize between
      // matches (short-name pairs shrinking, long-name pairs growing was
      // visually distracting during autoplay). Team names inside truncate
      // with ellipsis so a "Bosnia and Herzegovina" doesn't blow it up.
      // Mobile compact: shorter card + tighter padding so the bracket
      // keeps most of the viewport height.
      className="flex h-[80px] w-[240px] flex-col justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1.5 text-center text-xs shadow-sm sm:h-[104px] sm:w-[260px] sm:px-3 sm:py-2.5"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${CARD_FADE_MS}ms ease`,
      }}
    >
      <div className="truncate text-[9px] uppercase tracking-wide text-[var(--text-muted)] sm:text-[10px]">
        {roundLabel} · {formatMatchDateLong(match.date)}
      </div>
      <div className="flex items-center justify-center gap-2 text-[var(--text)] sm:gap-1.5">
        <Flag code={codeA} size={18} tooltip={false} />
        {/* Team names hidden on mobile — flags already identify the
            teams, and the extra text pushed the card too wide. */}
        <span className="hidden min-w-0 flex-1 truncate text-right text-[11px] font-medium sm:inline">
          {teamA?.name ?? codeA}
        </span>
        <span className="shrink-0 font-mono text-[12px] tabular-nums">{formatScore(match)}</span>
        <span className="hidden min-w-0 flex-1 truncate text-left text-[11px] font-medium sm:inline">
          {teamB?.name ?? codeB}
        </span>
        <Flag code={codeB} size={18} tooltip={false} />
      </div>
      <div className="flex items-center justify-center">
        <HighlightButton
          url={highlight.url}
          source={highlight.source}
          label={t("team.watchHighlights")}
        />
      </div>
    </div>
  );
}

function roundName(round: BracketRound): string {
  switch (round) {
    case "R32":
      return "Round of 32";
    case "R16":
      return "Round of 16";
    case "QF":
      return "Quarter-final";
    case "SF":
      return "Semi-final";
    case "3RD":
      return "Third-place";
    case "F":
      return "Final";
  }
}
