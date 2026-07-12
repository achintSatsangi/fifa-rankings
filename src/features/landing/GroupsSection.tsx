import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStorageItem, setStorageItem } from "../../lib/storage";
import { GROUPS } from "../groups/data";
import { GroupCard } from "../groups/GroupCard";
import { ScrollReveal } from "./ScrollReveal";

const COLLAPSED_KEY = "fifa-ranking:groups-collapsed";

/**
 * Third section on the one-pager: group standings. Collapsible header —
 * expanded state persists to localStorage so returning visitors don't
 * have to re-open it every time.
 */
export function GroupsSection() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const stored = getStorageItem(COLLAPSED_KEY);
    // Default collapsed. Only expand if the user has explicitly opened
    // it before (persisted "false").
    return stored !== "false";
  });

  useEffect(() => {
    setStorageItem(COLLAPSED_KEY, collapsed ? "true" : "false");
  }, [collapsed]);

  return (
    <section className="mx-auto w-full max-w-6xl px-2 py-12 sm:py-16">
      <ScrollReveal>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls="groups-body"
          className="group mb-6 flex w-full items-start justify-between gap-4 text-left"
        >
          <div>
            <h2 className="m-0 text-2xl font-semibold text-[var(--text)] sm:text-3xl">
              {t("landing.groupsSection")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t("groups.subtitle")}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="mt-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-all group-hover:border-[var(--border-strong)] group-hover:text-[var(--text)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `rotate(${collapsed ? 0 : 180}deg)`,
                transition: "transform 240ms ease",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
      </ScrollReveal>

      {!collapsed ? (
        <div id="groups-body" className="grid gap-4">
          {GROUPS.map((g, i) => (
            // Stagger only across the first handful so a phone viewport
            // isn't waiting on 12 sequential fades.
            <ScrollReveal key={g.id} delay={Math.min(i, 3) * 60}>
              <GroupCard group={g} />
            </ScrollReveal>
          ))}
        </div>
      ) : null}
    </section>
  );
}
