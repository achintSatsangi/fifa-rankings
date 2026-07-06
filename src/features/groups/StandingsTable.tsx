import { useTranslation } from "react-i18next";
import type { Standing } from "../../data/types";
import { Flag } from "../flags/Flag";
import { teamByCode } from "../teams/data";
import { Table, THead, TBody, TR, TH, TD } from "../../ui/Table";
import { Badge } from "../../ui/Badge";

export function StandingsTable({ standings }: { standings: Standing[] }) {
  const { t } = useTranslation();
  return (
    <Table>
      <THead>
        <TR>
          <TH align="center" className="w-8">#</TH>
          <TH>{t("teams.title")}</TH>
          <TH align="center" className="w-8">{t("groups.played")}</TH>
          <TH align="center" className="w-8">{t("groups.won")}</TH>
          <TH align="center" className="w-8">{t("groups.drawn")}</TH>
          <TH align="center" className="w-8">{t("groups.lost")}</TH>
          <TH align="center" className="w-10">{t("groups.goalsFor")}</TH>
          <TH align="center" className="w-10">{t("groups.goalsAgainst")}</TH>
          <TH align="center" className="w-10">{t("groups.goalDiff")}</TH>
          <TH align="center" className="w-10 font-semibold text-[var(--text)]">{t("groups.points")}</TH>
        </TR>
      </THead>
      <TBody>
        {standings.map((s) => {
          const team = teamByCode(s.code);
          const advanced = s.position <= 2 || (s.position === 3 && team?.advanced);
          return (
            <TR key={s.code} className={advanced ? "bg-[var(--surface)]" : ""}>
              <TD align="center" className="font-mono text-[var(--text-muted)]">{s.position}</TD>
              <TD>
                <span className="inline-flex items-center gap-2">
                  <Flag code={s.code} size={22} />
                  <span className="font-medium text-[var(--text)]">{team?.name ?? s.code}</span>
                  {advanced ? <Badge variant="success">✓</Badge> : null}
                </span>
              </TD>
              <TD align="center">{s.played}</TD>
              <TD align="center">{s.won}</TD>
              <TD align="center">{s.drawn}</TD>
              <TD align="center">{s.lost}</TD>
              <TD align="center">{s.gf}</TD>
              <TD align="center">{s.ga}</TD>
              <TD align="center">{s.gd > 0 ? `+${s.gd}` : s.gd}</TD>
              <TD align="center" className="font-semibold text-[var(--text)]">{s.points}</TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
