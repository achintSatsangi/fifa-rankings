import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { computeTeamStates, type TeamPickState } from "../picks/state";
import { usePicksStore } from "../picks/store";
import { Connectors } from "./Connectors";
import { TeamPoint } from "./TeamPoint";
import { Trophy } from "./Trophy";
import { flagSizesFor, trophySizeFor, WINNER_RING_RADIUS, OUTER_FLAG_RADIUS } from "./layout";

export function InteractiveRadial() {
  const picks = usePicksStore((s) => s.picks);
  const setPick = usePicksStore((s) => s.setPick);
  const reset = usePicksStore((s) => s.reset);
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

  const teamStates = useMemo(() => computeTeamStates(picks), [picks]);

  const handleClick = (teamCode: string) => {
    const state = teamStates.find((s) => s.code === teamCode);
    if (!state || state.eliminated || !state.nextMatch || !state.canAdvance) return;
    setPick(state.nextMatch.id, teamCode);
  };

  const totalPicks = Object.keys(picks).length;
  const totalPickable = 30; // 16 R32 + 8 R16 + 4 QF + 2 SF + 1 F (3rd place is separate)

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between px-1 text-xs text-[var(--text-secondary)]">
        <span>
          {totalPicks} / {totalPickable} {t("interactive.picks")}
        </span>
        <button
          type="button"
          onClick={reset}
          disabled={totalPicks === 0}
          className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("bracket.reset")}
        </button>
      </div>
      <div
        ref={outerRef}
        className="relative flex min-h-0 flex-1 items-center justify-center"
      >
        {size > 0 ? <Ring size={size} teamStates={teamStates} onClick={handleClick} /> : null}
      </div>

      <p className="mt-2 shrink-0 text-center text-xs text-[var(--text-muted)]">
        {t("interactive.hint")}
      </p>
    </div>
  );
}

function Ring({
  size,
  teamStates,
  onClick,
}: {
  size: number;
  teamStates: TeamPickState[];
  onClick: (code: string) => void;
}) {
  const sizes = useMemo(() => flagSizesFor(size), [size]);
  const trophySize = useMemo(() => trophySizeFor(size), [size]);

  const flagSizeForRadius = (r: number): number => {
    if (r === OUTER_FLAG_RADIUS) return sizes.OUTER;
    if (r === WINNER_RING_RADIUS.R32) return sizes.R32;
    if (r === WINNER_RING_RADIUS.R16) return sizes.R16;
    if (r === WINNER_RING_RADIUS.QF)  return sizes.QF;
    if (r === WINNER_RING_RADIUS.SF)  return sizes.SF;
    return sizes.OUTER;
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Connectors />
      {teamStates.map((state) => {
        const clickable = !state.eliminated && state.canAdvance;
        return (
          <TeamPoint
            key={state.code}
            code={state.code}
            point={state.point}
            size={flagSizeForRadius(state.radius)}
            faded={state.eliminated}
            onClick={clickable ? onClick : undefined}
            layer={state.radius === OUTER_FLAG_RADIUS ? "outer" : "winner"}
          />
        );
      })}
      <Trophy size={trophySize} />
    </div>
  );
}
