import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../ui/Modal";
import { Table, THead, TBody, TR, TH, TD } from "../../ui/Table";
import { Badge } from "../../ui/Badge";
import { formatMatchDate } from "../bracket/matchTime";
import { Flag } from "../flags/Flag";
import { FavouriteButton } from "../favourites/FavouriteButton";
import { HighlightButton } from "../highlights/HighlightButton";
import { resolveHighlight } from "../highlights/resolver";
import { teamByCode } from "./data";
import { buildJourney, currentStageLabel, type JourneyResult } from "./journey";

function resultVariant(r: JourneyResult): "success" | "warning" | "danger" | "neutral" {
  if (r === "W") return "success";
  if (r === "D") return "warning";
  if (r === "L") return "danger";
  return "neutral";
}

type Props = {
  code: string | null;
  onClose: () => void;
};

export function JourneyModal({ code, onClose }: Props) {
  const team = teamByCode(code);
  const { t } = useTranslation();
  const rows = useMemo(() => (code ? buildJourney(code) : []), [code]);
  const stageLabel = useMemo(() => (code ? currentStageLabel(code) : ""), [code]);
  const open = Boolean(code);

  return (
    <Modal open={open} onClose={onClose} title={team?.name ?? code ?? ""} size="xl">
      {team ? (
        <>
          <header className="mb-6 flex items-center gap-3 sm:gap-4">
            <Flag code={team.code} size={64} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {/* flex-wrap + whitespace-nowrap on each label so narrow
                  viewports wrap in clean two-line chunks instead of
                  breaking "Group D" or "FIFA rank" across lines. */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--text-secondary)] sm:text-base">
                <span className="whitespace-nowrap">{t("team.group")} {team.groupId}</span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{team.confederation}</span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{t("team.rank")} #{team.fifaRank}</span>
              </div>
              <div className="text-sm text-[var(--text)] sm:text-base">{stageLabel}</div>
            </div>
            <FavouriteButton code={team.code} size="md" />
          </header>

          <Table>
            <THead>
              <TR>
                <TH>{t("team.stage")}</TH>
                <TH className="hidden sm:table-cell">{t("team.date")}</TH>
                <TH>{t("team.opponent")}</TH>
                <TH align="center">{t("team.score")}</TH>
                <TH align="center">{t("team.result")}</TH>
                <TH className="hidden md:table-cell">{t("team.venue")}</TH>
                <TH align="center">{t("team.highlights")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => {
                const opp = teamByCode(r.opponentCode);
                const scoreCell = r.played
                  ? `${r.teamScore} – ${r.opponentScore}${r.teamPen !== null && r.opponentPen !== null ? ` (${r.teamPen}–${r.opponentPen} pens)` : r.extraTime ? " (a.e.t.)" : ""}`
                  : t("team.notPlayed");
                return (
                  <TR key={r.matchId}>
                    <TD className="whitespace-nowrap">
                      {/* Short compact label on mobile ("MA1" / "R16"),
                          full ("Group A · MD1" / "Round of 16") on ≥sm. */}
                      <div className="sm:hidden">{r.stageShort}</div>
                      <div className="hidden sm:block">{r.stage}</div>
                      {/* On mobile, tuck the date under the stage since we
                          hide the standalone Date column below `sm`. */}
                      <div className="text-xs text-[var(--text-muted)] sm:hidden">
                        {formatMatchDate(r.date)}
                      </div>
                    </TD>
                    <TD className="hidden whitespace-nowrap text-[var(--text-secondary)] sm:table-cell">
                      {formatMatchDate(r.date)}
                    </TD>
                    <TD>
                      {r.opponentCode ? (
                        <span className="inline-flex items-center gap-2">
                          <Flag code={r.opponentCode} size={20} />
                          {/* Team name hidden below sm — flag is enough. */}
                          <span className="hidden truncate sm:inline">{opp?.name ?? r.opponentCode}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">TBD</span>
                      )}
                    </TD>
                    <TD align="center" className="whitespace-nowrap font-mono">{scoreCell}</TD>
                    <TD align="center">
                      {r.played && r.result ? (
                        <Badge variant={resultVariant(r.result)}>
                          {t(`team.result${r.result === "W" ? "Win" : r.result === "D" ? "Draw" : "Loss"}`)}
                        </Badge>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </TD>
                    <TD className="hidden text-[var(--text-secondary)] md:table-cell">{r.venue}</TD>
                    <TD align="center">
                      {r.played ? (
                        <HighlightButton
                          {...resolveHighlight(r.matchId, team.code, r.opponentCode)}
                          label={t("team.watchHighlights")}
                        />
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </>
      ) : null}
    </Modal>
  );
}
