import { useTranslation } from "react-i18next";
import { GROUPS } from "../groups/data";
import { GroupCard } from "../groups/GroupCard";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Third section on the one-pager: group standings. Mirrors the
 * /groups route so users don't have to leave the home page to inspect
 * pool results.
 */
export function GroupsSection() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto w-full max-w-6xl px-2 py-12 sm:py-16">
      <ScrollReveal>
        <header className="mb-6">
          <h2 className="m-0 text-2xl font-semibold text-[var(--text)] sm:text-3xl">
            {t("landing.groupsSection")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t("groups.subtitle")}
          </p>
        </header>
      </ScrollReveal>

      <div className="grid gap-4">
        {GROUPS.map((g, i) => (
          // Stagger only across the first handful so a phone viewport
          // isn't waiting on 12 sequential fades.
          <ScrollReveal key={g.id} delay={Math.min(i, 3) * 60}>
            <GroupCard group={g} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
