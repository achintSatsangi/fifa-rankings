import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flag } from "../flags/Flag";
import { ScrollReveal } from "../landing/ScrollReveal";
import {
  championOf,
  groupByRound,
  HISTORICAL_HOSTS,
  HISTORICAL_TOURNAMENTS,
  HISTORICAL_YEARS,
  roundLabel,
  type HistoricalMatch,
  type HistoricalRound,
} from "./data";
import { HistoricalPlayback } from "./HistoricalPlayback";
import { HistoricalRadial } from "./HistoricalRadial";

type ViewMode = "radial" | "replay" | "legacy";

/**
 * Below the bracket + groups on the home one-pager. Pick a past World
 * Cup year from the dropdown; render its knockout matches grouped by
 * round. Data source is Wikipedia (`{{Football box}}` template scrape)
 * via scripts/scrape-historical-wc.mjs. Bundled at build time.
 */
export function HistoricalWCSection() {
  const { t } = useTranslation();
  const [year, setYear] = useState<number>(HISTORICAL_YEARS[0]);
  const [view, setView] = useState<ViewMode>("radial");
  const tournament = HISTORICAL_TOURNAMENTS[year];
  const rounds = groupByRound(tournament);
  const champion = championOf(tournament);
  const hosts = HISTORICAL_HOSTS[year] ?? [];

  return (
    <section className="mx-auto w-full max-w-6xl px-2 py-12 sm:py-16">
      <ScrollReveal>
        <header className="mb-6">
          <h2 className="m-0 text-2xl font-semibold text-[var(--text)] sm:text-3xl">
            {t("historical.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t("historical.subtitle")}
          </p>
        </header>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <YearPicker value={year} onChange={setYear} />
      </ScrollReveal>

      {(hosts.length > 0 || champion) ? (
        <ScrollReveal delay={80}>
          <div className="mb-6 mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm">
            {hosts.length > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">{t("historical.hostedBy")}</span>
                {hosts.map((h, i) => (
                  <span key={h.code} className="inline-flex items-center gap-1.5">
                    <Flag code={h.code} size={20} tooltip={false} />
                    <span className="font-medium text-[var(--text)]">{h.name}</span>
                    {i < hosts.length - 1 ? <span aria-hidden="true" className="text-[var(--text-muted)]">·</span> : null}
                  </span>
                ))}
              </span>
            ) : null}
            {champion ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">🏆</span>
                <span className="text-[var(--text-secondary)]">{t("historical.champion")}</span>
                <Flag code={champion} size={20} tooltip={false} />
                <span className="font-semibold text-[var(--text)]">{champion}</span>
              </span>
            ) : null}
          </div>
        </ScrollReveal>
      ) : null}

      {/* View toggle sits directly above the bracket — the choice is
          about how the bracket below renders, so it lives where the
          user's eye is when they make it. Right-aligned to stay out
          of the way of the host/champion callout above. */}
      <ScrollReveal delay={100}>
        <div className="mb-3 flex justify-end">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </ScrollReveal>

      {view === "radial" ? (
        <ScrollReveal delay={60}>
          <HistoricalRadial tournament={tournament} />
        </ScrollReveal>
      ) : view === "replay" ? (
        <ScrollReveal delay={60}>
          <HistoricalPlayback tournament={tournament} />
        </ScrollReveal>
      ) : (
        <div className="flex flex-col gap-6">
          {rounds.map((section, i) => (
            <ScrollReveal key={section.round} delay={Math.min(i, 3) * 60}>
              <RoundBlock round={section.round} matches={section.matches} />
            </ScrollReveal>
          ))}
        </div>
      )}

      <p className="mt-6 text-[11px] text-[var(--text-muted)]">
        {t("historical.sourceNote")}{" "}
        <a
          href={tournament.source}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-[var(--text-secondary)]"
        >
          Wikipedia
        </a>
        .
      </p>
    </section>
  );
}

function YearPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTranslation();
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Scroll the selected card into view when the picker mounts or the
  // selection changes via keyboard on the page. `nearest` avoids
  // jumping the whole page vertically.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [value]);

  return (
    <div className="relative">
      <div
        role="radiogroup"
        aria-label={t("historical.yearLabel")}
        className={
          "-mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-2 " +
          // Hide scrollbar cross-browser — the fade + snap-mandatory
          // scroll are the affordances for horizontal navigation.
          "[scrollbar-width:none] [-ms-overflow-style:none] " +
          "[&::-webkit-scrollbar]:hidden"
        }
      >
      {HISTORICAL_YEARS.map((y) => {
        const active = y === value;
        const tournament = HISTORICAL_TOURNAMENTS[y];
        const champ = championOf(tournament);
        return (
          <button
            key={y}
            ref={active ? activeRef : null}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(y)}
            className={
              "group flex shrink-0 snap-start flex-col items-center gap-1 rounded-lg border px-4 py-2 transition-all " +
              (active
                ? "border-[var(--accent)] bg-[var(--surface-elevated)] shadow-md"
                : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]")
            }
            style={active ? { boxShadow: "0 0 0 1px var(--accent), 0 4px 12px var(--accent-glow)" } : undefined}
          >
            <span
              className={
                "text-lg font-semibold tabular-nums " +
                (active ? "text-[var(--text)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text)]")
              }
            >
              {y}
            </span>
            {champ ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Flag code={champ} size={14} tooltip={false} />
                <span>{champ}</span>
              </span>
            ) : null}
          </button>
        );
      })}
      </div>
      {/* Edge fade — right side hints at more years scrollable off-screen.
          `from-[var(--bg)]` matches the page background so the last card
          appears to dissolve into it. Non-interactive; the scroll region
          underneath still receives wheel/touch events. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent"
      />
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const { t } = useTranslation();
  const options: { key: ViewMode; label: string }[] = [
    { key: "radial", label: t("historical.viewRadial") },
    { key: "replay", label: t("historical.viewReplay") },
    { key: "legacy", label: t("historical.viewLegacy") },
  ];
  return (
    <div
      role="tablist"
      aria-label={t("historical.title")}
      className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] p-0.5 text-xs"
    >
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={
              "rounded-full px-3 py-1 transition-colors " +
              (active
                ? "bg-[var(--btn-bg)] text-[var(--btn-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RoundBlock({ round, matches }: { round: HistoricalRound; matches: HistoricalMatch[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {roundLabel(round)}
      </h3>
      <ul className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
        {matches.map((m, i) => (
          <MatchRow key={i} match={m} />
        ))}
      </ul>
    </div>
  );
}

function MatchRow({ match }: { match: HistoricalMatch }) {
  const suffix = formatSuffix(match);
  return (
    <li className="flex items-center gap-3 px-3 py-2 text-sm">
      <span className="w-20 shrink-0 text-xs text-[var(--text-muted)]">
        {match.date ? formatShortDate(match.date) : ""}
      </span>
      <span className="flex flex-1 items-center justify-end gap-2 text-right">
        <span className="hidden text-[var(--text)] sm:inline">{match.teamA}</span>
        <Flag code={match.teamA} size={20} tooltip={false} />
      </span>
      <span className="flex shrink-0 flex-col items-center">
        <span className="font-mono text-[var(--text)] tabular-nums">
          {match.scoreA} – {match.scoreB}
        </span>
        {suffix ? (
          <span className="text-[10px] text-[var(--text-muted)]">{suffix}</span>
        ) : null}
      </span>
      <span className="flex flex-1 items-center gap-2">
        <Flag code={match.teamB} size={20} tooltip={false} />
        <span className="hidden text-[var(--text)] sm:inline">{match.teamB}</span>
      </span>
      <span className="hidden w-56 shrink-0 truncate text-right text-xs text-[var(--text-muted)] lg:inline">
        {match.venue ?? ""}
      </span>
    </li>
  );
}

function formatSuffix(m: HistoricalMatch): string | null {
  if (m.penaltyA !== null && m.penaltyB !== null) {
    return `${m.penaltyA}–${m.penaltyB} pens`;
  }
  if (m.extraTime) return "a.e.t.";
  return null;
}

const dateFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatShortDate(iso: string): string {
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}
