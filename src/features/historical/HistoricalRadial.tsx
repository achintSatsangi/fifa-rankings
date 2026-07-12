import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BracketMatch, BracketRound } from "../../data/types";
import { Flag } from "../flags/Flag";
import { TeamPoint } from "../bracket/radial/TeamPoint";
import { Trophy } from "../bracket/radial/Trophy";
import {
  championOf,
  winnerOf,
  type HistoricalMatch,
  type HistoricalTournament,
} from "./data";

/**
 * Radial view of a past 16-team knockout tournament. Follows the same
 * "everyone equidistant from the trophy" idea as the current WC26
 * RadialBracket, but with a 16-slot outer ring and one fewer inner
 * ring (no R32).
 *
 * Bracket structure is inferred from the ORDER of matches in each round
 * — Wikipedia lists knockout matches in bracket-tree order (top half
 * then bottom half), so R16 matches [m0..m7] pair with QF matches
 * [q0..q3] as (m0,m1→q0), (m2,m3→q1), (m4,m5→q2), (m6,m7→q3), and so
 * on. If a match is missing from the scrape, the slot stays empty
 * (dashed placeholder) rather than shifting positions.
 */

const OUTER_R = 0.44;
const R16_WIN_R = 0.32;
const QF_WIN_R = 0.21;
const SF_WIN_R = 0.10;

// 8-team knockout variant (1954-1970 World Cups): no R16 stage, so the
// 4 QF winners sit further from the trophy to preserve visible spacing.
const QF8_WIN_R = 0.30;
const SF8_WIN_R = 0.16;

// 4-team knockout variant (1982): only SF + Final on the knockout
// bracket (a second group stage played the QF role). Very shallow ring.
const SF4_WIN_R = 0.22;

type Point = { x: number; y: number };

function pointAt(angle: number, radius: number): Point {
  return {
    x: 0.5 + radius * Math.sin(angle),
    y: 0.5 - radius * Math.cos(angle),
  };
}
function svgPoint(angle: number, radius: number): Point {
  const p = pointAt(angle, radius);
  return { x: p.x * 100, y: p.y * 100 };
}

/** Outer slot i (0..total-1) → angle. Half-step offset centers the flag
 *  in its wedge; matches the WC26 layout convention. `total` defaults to
 *  16 for the standard R16 bracket; pass 8 for the QF-start variant. */
function slotAngle(slot: number, total: number = 16): number {
  return ((slot + 0.5) / total) * Math.PI * 2;
}

/** Angle midpoint of a range of outer slots (inclusive endpoints). */
function midAngleOfSlots(startSlot: number, endSlot: number, total: number = 16): number {
  return ((startSlot + endSlot + 1) / total) * Math.PI;
}

function flagSizesFor(size: number) {
  const s = Math.min(1, Math.max(0, size) / 720);
  return {
    OUTER: Math.round(52 * s),
    R16: Math.round(50 * s),
    QF: Math.round(46 * s),
    SF: Math.round(42 * s),
  };
}

function trophySizeFor(size: number): number {
  return Math.round(44 * Math.min(1, size / 720));
}

type LaidOutMatch = {
  match: HistoricalMatch | null;
  winner: string | null;
  loser: string | null;
  angle: number;
  radius: number;
  // Source positions (for connector drawing).
  srcAAngle: number;
  srcBAngle: number;
  srcRadius: number;
};

/** Which historical bracket shape does the tournament use?
 *  - R16 (1986-2022): full 16-team knockout starting at R16
 *  - QF  (1954-1970): 8-team knockout starting at QF
 *  - SF  (1982):      4-team knockout (SF only) after a 2nd group stage */
function bracketShape(t: HistoricalTournament): "R16" | "QF" | "SF" {
  if (t.matches.some((m) => m.round === "R16")) return "R16";
  if (t.matches.some((m) => m.round === "QF")) return "QF";
  return "SF";
}

/** Shim a scraped historical match into the BracketMatch shape that
 *  the shared MatchTooltip understands. Fields the tooltip doesn't
 *  read (feedsInto, slotA/B) get harmless defaults. */
function toBracketMatch(h: HistoricalMatch, year: number): BracketMatch {
  return {
    id: `hist-${year}-${h.round}-${h.teamA}-${h.teamB}`,
    round: h.round as BracketRound,
    date: h.date ?? "",
    utcDate: undefined,
    venue: h.venue ?? "",
    slotA: { type: "group", ref: "" },
    slotB: { type: "group", ref: "" },
    teamCodeA: h.teamA,
    teamCodeB: h.teamB,
    scoreA: h.scoreA,
    scoreB: h.scoreB,
    penaltyA: h.penaltyA,
    penaltyB: h.penaltyB,
    extraTime: h.extraTime,
    feedsInto: null,
  };
}

/** Route to the correct layout based on the tournament's bracket shape
 *  — 16-team (R16 start) for 1986-2022, 8-team (QF start) for 1954-1970,
 *  4-team (SF start) for 1982. */
function layoutBracket(t: HistoricalTournament) {
  const shape = bracketShape(t);
  if (shape === "R16") return layoutBracket16(t);
  if (shape === "QF") return layoutBracket8(t);
  return layoutBracket4(t);
}

/** Given the tournament, compute positions for every match + team.
 *
 *  IMPORTANT: Wikipedia lists knockout matches in whatever order the
 *  wikitext happened to be authored — that's NOT bracket-tree order.
 *  For example the 2022 QF scrape order is [CRO-BRA, MAR-POR, ENG-FRA,
 *  NED-ARG], but those correspond to R16 pairs 4-5, 6-7, 2-3, 0-1 —
 *  scrambled. Using raw scrape order for positioning makes each team's
 *  QF/SF winner flag jump to the wrong side of the ring.
 *
 *  So we walk the tournament tree top-down (Final → SFs → QFs → R16s),
 *  matched by team codes, and rebuild an in-bracket-order arrangement. */
function layoutBracket16(t: HistoricalTournament) {
  const inOrder = (round: HistoricalMatch["round"]) =>
    t.matches.filter((m) => m.round === round);

  const r16s = inOrder("R16");
  const qfs = inOrder("QF");
  const sfs = inOrder("SF");
  const finals = inOrder("F");

  // Reverse-index each round by team code so we can find the match a
  // given team played in that round.
  const indexByTeam = (list: HistoricalMatch[]) => {
    const m = new Map<string, number>();
    list.forEach((match, i) => {
      if (match.teamA) m.set(match.teamA, i);
      if (match.teamB) m.set(match.teamB, i);
    });
    return m;
  };
  const r16IdxByTeam = indexByTeam(r16s);
  const qfIdxByTeam = indexByTeam(qfs);
  const sfIdxByTeam = indexByTeam(sfs);

  // For each QF/SF/Final: which two prior-round pairs feed into it?
  const qfR16Pairs = qfs.map((q) => ({
    a: r16IdxByTeam.get(q.teamA),
    b: r16IdxByTeam.get(q.teamB),
  }));
  const sfQfPairs = sfs.map((s) => ({
    a: qfIdxByTeam.get(s.teamA),
    b: qfIdxByTeam.get(s.teamB),
  }));
  const finalSfPair = finals[0]
    ? { a: sfIdxByTeam.get(finals[0].teamA), b: sfIdxByTeam.get(finals[0].teamB) }
    : { a: undefined as number | undefined, b: undefined as number | undefined };

  // Walk the tree. Bracket positions 0..7 for R16, 0..3 for QF, 0..1
  // for SF. Left half of ring = pos 0/1/etc; right half = later. Any
  // matches we can't place (missing scrape data) get slotted afterward.
  const r16InOrder: (HistoricalMatch | null)[] = new Array(8).fill(null);
  const qfInOrder: (HistoricalMatch | null)[] = new Array(4).fill(null);
  const sfInOrder: (HistoricalMatch | null)[] = new Array(2).fill(null);
  const usedR16 = new Set<number>();
  const usedQf = new Set<number>();
  const usedSf = new Set<number>();

  const walkQf = (qfIdx: number | undefined, pos: number) => {
    if (qfIdx === undefined || usedQf.has(qfIdx) || qfInOrder[pos] !== null) return;
    usedQf.add(qfIdx);
    qfInOrder[pos] = qfs[qfIdx];
    const pair = qfR16Pairs[qfIdx];
    if (pair.a !== undefined && !usedR16.has(pair.a)) {
      usedR16.add(pair.a);
      r16InOrder[pos * 2] = r16s[pair.a];
    }
    if (pair.b !== undefined && !usedR16.has(pair.b)) {
      usedR16.add(pair.b);
      r16InOrder[pos * 2 + 1] = r16s[pair.b];
    }
  };
  const walkSf = (sfIdx: number | undefined, pos: number) => {
    if (sfIdx === undefined || usedSf.has(sfIdx) || sfInOrder[pos] !== null) return;
    usedSf.add(sfIdx);
    sfInOrder[pos] = sfs[sfIdx];
    const pair = sfQfPairs[sfIdx];
    walkQf(pair.a, pos * 2);
    walkQf(pair.b, pos * 2 + 1);
  };

  walkSf(finalSfPair.a, 0);
  walkSf(finalSfPair.b, 1);

  // Fallback: fill unused matches into any remaining empty slots so a
  // partial/incomplete scrape still renders every match somewhere.
  const fillLeftover = <T,>(
    all: T[],
    used: Set<number>,
    ordered: (T | null)[],
  ) => {
    let k = 0;
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i] !== null) continue;
      while (k < all.length && used.has(k)) k++;
      if (k >= all.length) break;
      used.add(k);
      ordered[i] = all[k];
      k++;
    }
  };
  fillLeftover(sfs, usedSf, sfInOrder);
  fillLeftover(qfs, usedQf, qfInOrder);
  fillLeftover(r16s, usedR16, r16InOrder);

  // ─── Outer ring: 16 slots, 2 per R16 match in BRACKET-TREE order ─
  const outerTeams: (string | null)[] = new Array(16).fill(null);
  for (let i = 0; i < 8; i++) {
    const m = r16InOrder[i];
    outerTeams[i * 2] = m?.teamA ?? null;
    outerTeams[i * 2 + 1] = m?.teamB ?? null;
  }

  const laidOut = (m: HistoricalMatch | null, angle: number, radius: number,
                   srcAAngle: number, srcBAngle: number, srcRadius: number): LaidOutMatch => ({
    match: m,
    winner: m ? winnerOf(m) : null,
    loser: m ? (winnerOf(m) === m.teamA ? m.teamB : m.teamA) : null,
    angle,
    radius,
    srcAAngle,
    srcBAngle,
    srcRadius,
  });

  const r16Layout: LaidOutMatch[] = r16InOrder.map((m, i) =>
    laidOut(m, midAngleOfSlots(i * 2, i * 2 + 1), R16_WIN_R,
            slotAngle(i * 2), slotAngle(i * 2 + 1), OUTER_R));

  const qfLayout: LaidOutMatch[] = qfInOrder.map((m, i) =>
    laidOut(m, midAngleOfSlots(i * 4, i * 4 + 3), QF_WIN_R,
            midAngleOfSlots(i * 4, i * 4 + 1), midAngleOfSlots(i * 4 + 2, i * 4 + 3), R16_WIN_R));

  const sfLayout: LaidOutMatch[] = sfInOrder.map((m, i) =>
    laidOut(m, midAngleOfSlots(i * 8, i * 8 + 7), SF_WIN_R,
            midAngleOfSlots(i * 8, i * 8 + 3), midAngleOfSlots(i * 8 + 4, i * 8 + 7), QF_WIN_R));

  const finalLayout: LaidOutMatch[] = finals.map((m) =>
    laidOut(m, 0, 0, midAngleOfSlots(0, 7), midAngleOfSlots(8, 15), SF_WIN_R));

  const innermost = new Map<string, number>();
  const consider = (team: string | null, r: number) => {
    if (!team) return;
    const cur = innermost.get(team);
    if (cur === undefined || r < cur) innermost.set(team, r);
  };
  outerTeams.forEach((t) => consider(t, OUTER_R));
  r16Layout.forEach((m) => consider(m.winner, R16_WIN_R));
  qfLayout.forEach((m) => consider(m.winner, QF_WIN_R));
  sfLayout.forEach((m) => consider(m.winner, SF_WIN_R));
  finalLayout.forEach((m) => consider(m.winner, 0));

  const outerPoints = outerTeams.map((_, i) => pointAt(slotAngle(i, 16), OUTER_R));

  return { outerTeams, outerPoints, r16Layout, qfLayout, sfLayout, finalLayout, innermost };
}

/** 8-team knockout variant (1954-1970): 8 outer slots, no R16 stage.
 *  Same tree-walk logic as the 16-team version, but shallower — QF
 *  winners live at QF8_WIN_R, SF winners at SF8_WIN_R, Final at centre. */
function layoutBracket8(t: HistoricalTournament) {
  const inOrder = (round: HistoricalMatch["round"]) =>
    t.matches.filter((m) => m.round === round);

  const qfs = inOrder("QF");
  const sfs = inOrder("SF");
  const finals = inOrder("F");

  const indexByTeam = (list: HistoricalMatch[]) => {
    const m = new Map<string, number>();
    list.forEach((match, i) => {
      if (match.teamA) m.set(match.teamA, i);
      if (match.teamB) m.set(match.teamB, i);
    });
    return m;
  };
  const qfIdxByTeam = indexByTeam(qfs);
  const sfIdxByTeam = indexByTeam(sfs);

  const sfQfPairs = sfs.map((s) => ({
    a: qfIdxByTeam.get(s.teamA),
    b: qfIdxByTeam.get(s.teamB),
  }));
  const finalSfPair = finals[0]
    ? { a: sfIdxByTeam.get(finals[0].teamA), b: sfIdxByTeam.get(finals[0].teamB) }
    : { a: undefined as number | undefined, b: undefined as number | undefined };

  const qfInOrder: (HistoricalMatch | null)[] = new Array(4).fill(null);
  const sfInOrder: (HistoricalMatch | null)[] = new Array(2).fill(null);
  const usedQf = new Set<number>();
  const usedSf = new Set<number>();

  const walkSf = (sfIdx: number | undefined, pos: number) => {
    if (sfIdx === undefined || usedSf.has(sfIdx) || sfInOrder[pos] !== null) return;
    usedSf.add(sfIdx);
    sfInOrder[pos] = sfs[sfIdx];
    const pair = sfQfPairs[sfIdx];
    if (pair.a !== undefined && !usedQf.has(pair.a)) {
      usedQf.add(pair.a);
      qfInOrder[pos * 2] = qfs[pair.a];
    }
    if (pair.b !== undefined && !usedQf.has(pair.b)) {
      usedQf.add(pair.b);
      qfInOrder[pos * 2 + 1] = qfs[pair.b];
    }
  };
  walkSf(finalSfPair.a, 0);
  walkSf(finalSfPair.b, 1);

  // Leftover fill for partial data.
  let k = 0;
  for (let i = 0; i < 4; i++) {
    if (qfInOrder[i] !== null) continue;
    while (k < qfs.length && usedQf.has(k)) k++;
    if (k >= qfs.length) break;
    usedQf.add(k);
    qfInOrder[i] = qfs[k];
    k++;
  }
  k = 0;
  for (let i = 0; i < 2; i++) {
    if (sfInOrder[i] !== null) continue;
    while (k < sfs.length && usedSf.has(k)) k++;
    if (k >= sfs.length) break;
    usedSf.add(k);
    sfInOrder[i] = sfs[k];
    k++;
  }

  const outerTeams: (string | null)[] = new Array(8).fill(null);
  for (let i = 0; i < 4; i++) {
    const m = qfInOrder[i];
    outerTeams[i * 2] = m?.teamA ?? null;
    outerTeams[i * 2 + 1] = m?.teamB ?? null;
  }
  const outerPoints = outerTeams.map((_, i) => pointAt(slotAngle(i, 8), OUTER_R));

  const laidOut = (m: HistoricalMatch | null, angle: number, radius: number,
                   srcAAngle: number, srcBAngle: number, srcRadius: number): LaidOutMatch => ({
    match: m,
    winner: m ? winnerOf(m) : null,
    loser: m ? (winnerOf(m) === m.teamA ? m.teamB : m.teamA) : null,
    angle, radius, srcAAngle, srcBAngle, srcRadius,
  });

  // QF layout: pair i sits at midangle of outer slots (2i, 2i+1) with
  // 8-slot geometry. Sources are the two outer positions on the OUTER_R ring.
  const qfLayout: LaidOutMatch[] = qfInOrder.map((m, i) =>
    laidOut(m, midAngleOfSlots(i * 2, i * 2 + 1, 8), QF8_WIN_R,
            slotAngle(i * 2, 8), slotAngle(i * 2 + 1, 8), OUTER_R));

  // SF: pair i sits at midangle of outer slots (4i, 4i+3). Sources are
  // the two QF winner positions at QF8_WIN_R.
  const sfLayout: LaidOutMatch[] = sfInOrder.map((m, i) =>
    laidOut(m, midAngleOfSlots(i * 4, i * 4 + 3, 8), SF8_WIN_R,
            midAngleOfSlots(i * 4, i * 4 + 1, 8),
            midAngleOfSlots(i * 4 + 2, i * 4 + 3, 8),
            QF8_WIN_R));

  // Final: centre. Sources = two SF winner positions.
  const finalLayout: LaidOutMatch[] = finals.map((m) =>
    laidOut(m, 0, 0,
            midAngleOfSlots(0, 3, 8),
            midAngleOfSlots(4, 7, 8),
            SF8_WIN_R));

  const innermost = new Map<string, number>();
  const consider = (team: string | null, r: number) => {
    if (!team) return;
    const cur = innermost.get(team);
    if (cur === undefined || r < cur) innermost.set(team, r);
  };
  outerTeams.forEach((t) => consider(t, OUTER_R));
  qfLayout.forEach((m) => consider(m.winner, QF8_WIN_R));
  sfLayout.forEach((m) => consider(m.winner, SF8_WIN_R));
  finalLayout.forEach((m) => consider(m.winner, 0));

  // r16Layout stays empty — no such round in this format. Downstream
  // .map()/.find() over an empty array is harmless.
  const r16Layout: LaidOutMatch[] = [];

  return { outerTeams, outerPoints, r16Layout, qfLayout, sfLayout, finalLayout, innermost };
}

/** 4-team knockout variant (1982): the 2nd group-stage winners played
 *  directly in the semi-finals, so we only have SF + Final on the ring.
 *  4 outer flags, 2 SF winners at SF4_WIN_R, Final at centre. */
function layoutBracket4(t: HistoricalTournament) {
  const sfs = t.matches.filter((m) => m.round === "SF");
  const finals = t.matches.filter((m) => m.round === "F");

  const sfIdxByTeam = new Map<string, number>();
  sfs.forEach((m, i) => {
    if (m.teamA) sfIdxByTeam.set(m.teamA, i);
    if (m.teamB) sfIdxByTeam.set(m.teamB, i);
  });
  const finalSfPair = finals[0]
    ? { a: sfIdxByTeam.get(finals[0].teamA), b: sfIdxByTeam.get(finals[0].teamB) }
    : { a: undefined as number | undefined, b: undefined as number | undefined };

  // Order the two SFs so the Final's teamA path lands on the left,
  // teamB on the right — same tree-walk logic, just shallower.
  const sfInOrder: (HistoricalMatch | null)[] = new Array(2).fill(null);
  const usedSf = new Set<number>();
  const place = (idx: number | undefined, pos: number) => {
    if (idx === undefined || usedSf.has(idx)) return;
    usedSf.add(idx);
    sfInOrder[pos] = sfs[idx];
  };
  place(finalSfPair.a, 0);
  place(finalSfPair.b, 1);
  // Fill any unused SFs (shouldn't happen for 1982, but keeps the
  // fallback consistent with the 8- and 16-team variants).
  let k = 0;
  for (let i = 0; i < 2; i++) {
    if (sfInOrder[i] !== null) continue;
    while (k < sfs.length && usedSf.has(k)) k++;
    if (k >= sfs.length) break;
    usedSf.add(k);
    sfInOrder[i] = sfs[k];
    k++;
  }

  const outerTeams: (string | null)[] = new Array(4).fill(null);
  for (let i = 0; i < 2; i++) {
    const m = sfInOrder[i];
    outerTeams[i * 2] = m?.teamA ?? null;
    outerTeams[i * 2 + 1] = m?.teamB ?? null;
  }
  const outerPoints = outerTeams.map((_, i) => pointAt(slotAngle(i, 4), OUTER_R));

  const laidOut = (m: HistoricalMatch | null, angle: number, radius: number,
                   srcAAngle: number, srcBAngle: number, srcRadius: number): LaidOutMatch => ({
    match: m,
    winner: m ? winnerOf(m) : null,
    loser: m ? (winnerOf(m) === m.teamA ? m.teamB : m.teamA) : null,
    angle, radius, srcAAngle, srcBAngle, srcRadius,
  });

  const sfLayout: LaidOutMatch[] = sfInOrder.map((m, i) =>
    laidOut(m, midAngleOfSlots(i * 2, i * 2 + 1, 4), SF4_WIN_R,
            slotAngle(i * 2, 4), slotAngle(i * 2 + 1, 4), OUTER_R));

  const finalLayout: LaidOutMatch[] = finals.map((m) =>
    laidOut(m, 0, 0,
            midAngleOfSlots(0, 1, 4),
            midAngleOfSlots(2, 3, 4),
            SF4_WIN_R));

  const innermost = new Map<string, number>();
  const consider = (team: string | null, r: number) => {
    if (!team) return;
    const cur = innermost.get(team);
    if (cur === undefined || r < cur) innermost.set(team, r);
  };
  outerTeams.forEach((t) => consider(t, OUTER_R));
  sfLayout.forEach((m) => consider(m.winner, SF4_WIN_R));
  finalLayout.forEach((m) => consider(m.winner, 0));

  const r16Layout: LaidOutMatch[] = [];
  const qfLayout: LaidOutMatch[] = [];

  return { outerTeams, outerPoints, r16Layout, qfLayout, sfLayout, finalLayout, innermost };
}

type LayoutResult = ReturnType<typeof layoutBracket>;

/** For a match, which side (A or B or none) does the highlighted team
 *  occupy? teamA always aligns with srcA (the walk in layoutBracket
 *  guarantees this), teamB with srcB. */
type HighlightSide = "A" | "B" | "none";
function sideFor(m: LaidOutMatch, team: string | null): HighlightSide {
  if (!team || !m.match) return "none";
  if (m.match.teamA === team) return "A";
  if (m.match.teamB === team) return "B";
  return "none";
}

export function HistoricalRadial({ tournament }: { tournament: HistoricalTournament }) {
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
  const champion = useMemo(() => championOf(tournament), [tournament]);
  const year = tournament.year;

  // Currently-highlighted team's flags stay in colour; everyone else
  // fades. Defaults to the champion so the winner's journey pops on
  // first render. Hovering any other flag swaps the highlight to that
  // team; mouseleave off the ring restores the champion default.
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const highlightedTeam = hoveredTeam ?? champion;

  return (
    <div
      ref={outerRef}
      onMouseLeave={() => setHoveredTeam(null)}
      className="relative mx-auto flex aspect-square w-full max-w-[min(100%,calc(100svh-13rem),1000px)] items-center justify-center overflow-hidden"
    >
      {size > 0 ? (
        <Ring
          size={size}
          layout={layout}
          champion={champion}
          highlightedTeam={highlightedTeam}
          onHoverTeam={setHoveredTeam}
          year={year}
        />
      ) : null}
    </div>
  );
}

function Ring({
  size,
  layout,
  champion,
  highlightedTeam,
  onHoverTeam,
  year,
}: {
  size: number;
  layout: ReturnType<typeof layoutBracket>;
  champion: string | null;
  highlightedTeam: string | null;
  onHoverTeam: (team: string | null) => void;
  year: number;
}) {
  const sizes = flagSizesFor(size);
  const trophySize = trophySizeFor(size);

  // Historical fade rule: only the currently-highlighted team's flags
  // stay in colour at any ring they occupied. Everyone else is grayed
  // out. Combined with `highlightedTeam` defaulting to the champion,
  // this lights up the winner's journey from outer slot to trophy.
  const isFaded = (team: string | null): boolean => {
    if (!team) return false; // dashed placeholder — leave neutral
    return team !== highlightedTeam;
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <HistoricalConnectors layout={layout} highlightedTeam={highlightedTeam} />

      {/* Outer flags — pair i is R16 match at floor(i/2). Match tooltip
          on hover shows that R16 result (round, date, score, venue).
          Hover also updates the highlighted team → lights up their path. */}
      {layout.outerTeams.map((team, i) => {
        const p = layout.outerPoints[i];
        // Outer flags carry their FIRST-round match as tooltip context:
        //   16-team format → R16 match
        //   8-team format  → QF match
        //   4-team format  → SF match
        // Pair index = floor(i / 2) in every case.
        const firstRound = layout.r16Layout.length > 0
          ? layout.r16Layout[Math.floor(i / 2)]
          : layout.qfLayout.length > 0
            ? layout.qfLayout[Math.floor(i / 2)]
            : layout.sfLayout[Math.floor(i / 2)];
        return (
          <TeamPoint
            key={`o-${i}`}
            code={team}
            point={p}
            size={sizes.OUTER}
            faded={isFaded(team)}
            layer="outer"
            match={firstRound?.match ? toBracketMatch(firstRound.match, year) : undefined}
            onHoverChange={team ? (h) => onHoverTeam(h ? team : null) : undefined}
          />
        );
      })}

      {/* R16 winners — tooltip = the R16 match they won. */}
      {layout.r16Layout.map((m, i) => {
        if (!m.winner) return null;
        const p = pointAt(m.angle, m.radius);
        return (
          <TeamPoint
            key={`w16-${i}`}
            code={m.winner}
            point={p}
            size={sizes.R16}
            faded={isFaded(m.winner)}
            layer="winner"
            match={m.match ? toBracketMatch(m.match, year) : undefined}
            onHoverChange={(h) => onHoverTeam(h ? m.winner : null)}
          />
        );
      })}

      {/* QF winners — tooltip = the QF match. */}
      {layout.qfLayout.map((m, i) => {
        if (!m.winner) return null;
        const p = pointAt(m.angle, m.radius);
        return (
          <TeamPoint
            key={`wqf-${i}`}
            code={m.winner}
            point={p}
            size={sizes.QF}
            faded={isFaded(m.winner)}
            layer="winner"
            match={m.match ? toBracketMatch(m.match, year) : undefined}
            onHoverChange={(h) => onHoverTeam(h ? m.winner : null)}
          />
        );
      })}

      {/* SF winners — tooltip = the SF match. */}
      {layout.sfLayout.map((m, i) => {
        if (!m.winner) return null;
        const p = pointAt(m.angle, m.radius);
        return (
          <TeamPoint
            key={`wsf-${i}`}
            code={m.winner}
            point={p}
            size={sizes.SF}
            faded={isFaded(m.winner)}
            layer="winner"
            match={m.match ? toBracketMatch(m.match, year) : undefined}
            onHoverChange={(h) => onHoverTeam(h ? m.winner : null)}
          />
        );
      })}

      {/* Trophy at centre; champion flag layered above it, bigger
          than any other flag on the ring so it reads as THE prize.
          Trophy remains hover-target for the Final's MatchTooltip
          (flag has pointer-events-none so events pass through). */}
      <Trophy
        size={trophySize}
        match={layout.finalLayout[0]?.match ? toBracketMatch(layout.finalLayout[0].match, year) : undefined}
        focusTeam={champion ?? undefined}
      />
      {champion ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-20 select-none"
          style={{
            left: "50%",
            // Sit ABOVE the trophy (bottom of flag touches trophy top)
            // so the trophy silhouette stays visible below.
            top: `calc(50% - ${trophySize * 0.9}px)`,
            transform: "translate(-50%, -50%)",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))",
          }}
        >
          <Flag code={champion} size={Math.round(trophySize * 1.4)} tooltip={false} />
        </span>
      ) : null}
    </div>
  );
}

/** Bracket-glyph connectors for a 16-team knockout: two radial stubs
 *  from each source inward to a shoulder ring, an arc joining them
 *  along that ring, then a single radial stem to the match centre.
 *  Elbow corner dots pick up the theme accent so the geometry reads
 *  as lit turf.
 *
 *  When `highlightedTeam` is set, an accent-coloured polyline is
 *  drawn on top connecting that team's ring positions from their
 *  outer slot inward — the "journey" overlay. */
function HistoricalConnectors({
  layout,
  highlightedTeam,
}: {
  layout: LayoutResult;
  highlightedTeam: string | null;
}) {
  // Derive guide rings from whichever match rings the layout actually
  // populated — this adjusts automatically between the 16-team and
  // 8-team variants.
  const guideRingSet = new Set<number>([OUTER_R]);
  [...layout.r16Layout, ...layout.qfLayout, ...layout.sfLayout].forEach((m) => {
    if (m.radius > 0) guideRingSet.add(m.radius);
  });
  const guideRings = Array.from(guideRingSet).sort((a, b) => b - a);
  const brackets = [
    ...layout.r16Layout,
    ...layout.qfLayout,
    ...layout.sfLayout,
    ...layout.finalLayout,
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <filter id="hist-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Layered blur → wide soft halo + tight bright core; when
            painted with the accent stroke on top it reads as neon,
            not a solid line. */}
        <filter id="hist-path-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="halo" />
          <feGaussianBlur stdDeviation="0.5" result="core" in="SourceGraphic" />
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="halo" />
            <feMergeNode in="core" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {guideRings.map((r) => (
        <circle
          key={r}
          cx={50}
          cy={50}
          r={r * 100}
          fill="none"
          stroke="var(--connector)"
          strokeWidth={0.1}
          strokeDasharray="0.5 0.9"
          opacity={0.35}
        />
      ))}
      {brackets.map((g, i) => (
        <MatchBracket key={i} g={g} highlightSide={sideFor(g, highlightedTeam)} />
      ))}
    </svg>
  );
}

const STUB = 0.02;

function MatchBracket({ g, highlightSide }: { g: LaidOutMatch; highlightSide: HighlightSide }) {
  const shoulder = Math.max(g.srcRadius - STUB, g.radius + 0.005);
  const sA = svgPoint(g.srcAAngle, g.srcRadius);
  const eA = svgPoint(g.srcAAngle, shoulder);
  const sB = svgPoint(g.srcBAngle, g.srcRadius);
  const eB = svgPoint(g.srcBAngle, shoulder);
  const mid = svgPoint(g.angle, shoulder);
  const mc = svgPoint(g.angle, g.radius);
  const r = shoulder * 100;
  const sweep = g.srcBAngle > g.srcAAngle ? 1 : 0;
  const isWinner = highlightSide !== "none" && g.winner !== null && (
    (highlightSide === "A" && g.match?.teamA === g.winner) ||
    (highlightSide === "B" && g.match?.teamB === g.winner)
  );
  return (
    <g>
      {/* Base bracket — always drawn in dim connector color. */}
      <g stroke="var(--connector)" strokeWidth={0.22} strokeLinecap="round" fill="none">
        <line x1={sA.x} y1={sA.y} x2={eA.x} y2={eA.y} />
        <line x1={sB.x} y1={sB.y} x2={eB.x} y2={eB.y} />
        <path d={`M ${eA.x} ${eA.y} A ${r} ${r} 0 0 ${sweep} ${eB.x} ${eB.y}`} />
        <line x1={mid.x} y1={mid.y} x2={mc.x} y2={mc.y} />
        <circle cx={eA.x} cy={eA.y} r={0.42} fill="var(--accent)" stroke="none" filter="url(#hist-glow)" />
        <circle cx={eB.x} cy={eB.y} r={0.42} fill="var(--accent)" stroke="none" filter="url(#hist-glow)" />
      </g>

      {/* Highlight overlay for the side the highlighted team occupies:
          stub + their half of the arc, then the stem only if they WON
          (winners take the stem into the next round; losers stop at
          the shoulder).
          Layered strokes give a neon-glow read: a wide, translucent
          halo underneath and a thin bright core on top, with a soft
          ambient pulse via CSS. */}
      {highlightSide !== "none" ? (() => {
        const stubD = highlightSide === "A"
          ? `M ${sA.x} ${sA.y} L ${eA.x} ${eA.y}`
          : `M ${sB.x} ${sB.y} L ${eB.x} ${eB.y}`;
        const arcD = highlightSide === "A"
          ? `M ${eA.x} ${eA.y} A ${r} ${r} 0 0 ${sweep} ${mid.x} ${mid.y}`
          : `M ${mid.x} ${mid.y} A ${r} ${r} 0 0 ${sweep} ${eB.x} ${eB.y}`;
        const stemD = `M ${mid.x} ${mid.y} L ${mc.x} ${mc.y}`;
        return (
          <g
            className="animate-hist-path motion-reduce:animate-none"
            stroke="var(--accent)"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Wide halo — soft ambient bloom */}
            <g strokeWidth={1.2} opacity={0.10}>
              <path d={stubD} />
              <path d={arcD} />
              {isWinner ? <path d={stemD} /> : null}
            </g>
            {/* Mid glow */}
            <g strokeWidth={0.6} opacity={0.28} filter="url(#hist-path-glow)">
              <path d={stubD} />
              <path d={arcD} />
              {isWinner ? <path d={stemD} /> : null}
            </g>
            {/* Bright core on top — thin, subtle */}
            <g strokeWidth={0.28} opacity={0.7}>
              <path d={stubD} />
              <path d={arcD} />
              {isWinner ? <path d={stemD} /> : null}
            </g>
          </g>
        );
      })() : null}
    </g>
  );
}
