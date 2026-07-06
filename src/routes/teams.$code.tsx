import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { JourneyModal } from "../features/teams/JourneyModal";
import { teamByCode } from "../features/teams/data";

export const Route = createFileRoute("/teams/$code")({
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const team = teamByCode(code);
  return (
    <JourneyModal
      code={team ? team.code : code}
      onClose={() => void navigate({ to: "/teams" })}
    />
  );
}
