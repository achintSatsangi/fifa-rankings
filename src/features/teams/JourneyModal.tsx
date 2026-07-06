import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../ui/Modal";
import { Table, THead, TBody, TR, TH, TD } from "../../ui/Table";
import { Badge } from "../../ui/Badge";
import { Flag } from "../flags/Flag";
import { highlightUrl } from "../highlights/resolver";
import { teamByCode } from "./data";
import { buildJourney, currentStageLabel, type JourneyResult } from "./journey";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

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
          <header className="mb-4 flex flex-wrap items-center gap-4">
            <Flag code={team.code} size={56} />
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span>{t("team.group")} {team.groupId}</span>
                <span>·</span>
                <span>{team.confederation}</span>
                <span>·</span>
                <span>{t("team.rank")} #{team.fifaRank}</span>
              </div>
              <div className="text-sm text-[var(--text)]">{stageLabel}</div>
            </div>
          </header>

          <Table>
            <THead>
              <TR>
                <TH>{t("team.stage")}</TH>
                <TH>{t("team.date")}</TH>
                <TH>{t("team.opponent")}</TH>
                <TH align="center">{t("team.score")}</TH>
                <TH align="center">{t("team.result")}</TH>
                <TH>{t("team.venue")}</TH>
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
                    <TD className="whitespace-nowrap">{r.stage}</TD>
                    <TD className="whitespace-nowrap text-[var(--text-secondary)]">
                      {dateFmt.format(new Date(r.date))}
                    </TD>
                    <TD>
                      {r.opponentCode ? (
                        <span className="inline-flex items-center gap-2">
                          <Flag code={r.opponentCode} size={20} />
                          <span>{opp?.name ?? r.opponentCode}</span>
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
                    <TD className="text-[var(--text-secondary)]">{r.venue}</TD>
                    <TD align="center">
                      {r.played ? (
                        <a
                          href={highlightUrl(r.matchId, team.code, r.opponentCode)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
                          aria-label={t("team.watchHighlights")}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <span className="sr-only">{t("team.watchHighlights")}</span>
                        </a>
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
