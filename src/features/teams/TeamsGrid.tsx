import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Confederation } from "../../data/types";
import { TEAMS } from "./data";
import { TeamCard } from "./TeamCard";
import { JourneyModal } from "./JourneyModal";

type SortKey = "rank" | "name";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;
const CONFEDERATIONS: Confederation[] = ["AFC", "CAF", "CONCACAF", "CONMEBOL", "OFC", "UEFA"];

export function TeamsGrid() {
  const { t } = useTranslation();
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [confFilter, setConfFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const rows = useMemo(() => {
    const filtered = TEAMS.filter(
      (t) =>
        (!groupFilter || t.groupId === groupFilter) &&
        (!confFilter || t.confederation === confFilter),
    );
    return filtered.sort((a, b) =>
      sortKey === "rank" ? a.fifaRank - b.fifaRank : a.name.localeCompare(b.name),
    );
  }, [groupFilter, confFilter, sortKey]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <Selector
          label={t("teams.filterGroup")}
          value={groupFilter}
          onChange={setGroupFilter}
          options={[{ value: "", label: t("teams.all") }, ...GROUPS.map((g) => ({ value: g, label: g }))]}
        />
        <Selector
          label={t("teams.filterConfederation")}
          value={confFilter}
          onChange={setConfFilter}
          options={[{ value: "", label: t("teams.all") }, ...CONFEDERATIONS.map((c) => ({ value: c, label: c }))]}
        />
        <Selector
          label="Sort"
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
          options={[
            { value: "rank", label: t("teams.sortRank") },
            { value: "name", label: t("teams.sortName") },
          ]}
        />
        <span className="ml-auto text-xs text-[var(--text-muted)]">{rows.length} / {TEAMS.length}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{t("teams.empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((team) => (
            <TeamCard key={team.code} team={team} onClick={setSelectedCode} />
          ))}
        </div>
      )}

      <JourneyModal code={selectedCode} onClose={() => setSelectedCode(null)} />
    </>
  );
}

function Selector<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-[var(--text-secondary)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-sm text-[var(--text)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
