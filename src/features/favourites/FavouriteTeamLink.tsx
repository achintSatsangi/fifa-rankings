import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Flag } from "../flags/Flag";
import { teamByCode } from "../teams/data";
import { useFavouriteTeam } from "./store";

/** "Your team" row for the sidebar. Renders nothing if no favourite. */
export function FavouriteTeamLink({ onNavigate }: { onNavigate?: () => void }) {
  const [code] = useFavouriteTeam();
  const { t } = useTranslation();
  const team = teamByCode(code);
  if (!team) return null;
  return (
    <Link
      to="/teams/$code"
      params={{ code: team.code }}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm transition-colors hover:border-[var(--border-strong)]"
      title={team.name}
    >
      <Flag code={team.code} size={28} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          {t("favourite.yourTeam")}
        </span>
        <span className="truncate text-sm font-semibold text-[var(--text)]">
          {team.name}
        </span>
      </div>
      <span aria-hidden="true" className="text-lg leading-none text-[#e0b04a]">★</span>
    </Link>
  );
}
