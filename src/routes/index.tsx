import { createFileRoute } from "@tanstack/react-router";
import { BracketSection } from "../features/landing/BracketSection";
import { GroupsSection } from "../features/landing/GroupsSection";
import { HomeFooter } from "../features/landing/HomeFooter";

export const Route = createFileRoute("/")({
  component: HomePage,
});

/**
 * One-pager: circular bracket (radial/interactive toggle) → group
 * standings → footer. The root layout's <main> is already
 * `overflow-auto`, so this component just stacks children top-to-bottom
 * and lets the browser handle scrolling.
 */
function HomePage() {
  return (
    <div className="flex w-full flex-col">
      <BracketSection />
      <GroupsSection />
      <HomeFooter />
    </div>
  );
}
