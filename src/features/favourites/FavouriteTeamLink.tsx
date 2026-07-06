import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Flag } from "../flags/Flag";
import { teamByCode } from "../teams/data";
import { useFavouriteTeam } from "./store";

/** Small "Your team" line for the sidebar. Hidden if no favourite set. */
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
      className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text)]"
      title={team.name}
    >
      <span aria-hidden="true" className="text-[#e0b04a]">★</span>
      <Flag code={team.code} size={18} />
      <span className="truncate">
        {t("favourite.yourTeam")}: <span className="font-medium">{team.name}</span>
      </span>
    </Link>
  );
}
