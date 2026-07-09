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
          {/* Column stays for row alignment; label is redundant on mobile
              where the cell just shows a flag. */}
          <TH>
            <span className="hidden sm:inline">{t("teams.title")}</span>
          </TH>
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
                  <span className="relative inline-flex">
                    <Flag code={s.code} size={22} />
                    {/* Mobile-only overlay: tiny green dot on the flag's
                        top-right corner instead of the inline ✓ badge,
                        so the standings numbers keep their horizontal
                        room. Ring in surface colour "punches" it out
                        of the flag edge. */}
                    {advanced ? (
                      <span
                        aria-hidden="true"
                        className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--success)] ring-2 ring-[var(--surface-elevated)] sm:hidden"
                      />
                    ) : null}
                  </span>
                  {/* On mobile, flag alone identifies the team — the
                      standings columns need the horizontal room. */}
                  <span className="hidden font-medium text-[var(--text)] sm:inline">
                    {team?.name ?? s.code}
                  </span>
                  {advanced ? (
                    <span className="hidden sm:inline-flex">
                      <Badge variant="success">✓</Badge>
                    </span>
                  ) : null}
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
