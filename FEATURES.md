# FEATURES — fifa-ranking

Living tracker. Move items between sections as they progress. Keep it terse; commit messages carry the details.

**Legend:** `[x]` done · `[~]` in progress · `[ ]` not started

---

## Done

- [x] **Project scaffold** — Vite 7 + React 19 + TS, Tailwind v4, pnpm 10, Node 24 via `.nvmrc`.
- [x] **Theme system** — CSS-variable tokens for light/dark, `ThemeProvider` with system/light/dark choice, `ThemeToggle` in sidebar.
- [x] **TanStack Router** — file-based routes: `/`, `/teams`, `/teams/$code`, `/groups`. Root layout with sidebar + main.
- [x] **TanStack Query** — `QueryClient` configured, provider in `main.tsx`, devtools in dev.
- [x] **i18n** — react-i18next with 8 launch languages (EN, ES, FR, PT, NO, SV, DA, FI), locale detector (querystring → localStorage → navigator), `LanguageSwitcher` in sidebar.
- [x] **App shell** — sidebar (title, tagline, nav, language, theme, footer) + main area, responsive stacked layout below `lg`.
- [x] **Data files** — `teams.json` (48), `groups.json` (12 × 4 with matches + standings), `bracket.json` (31 matches, R32 complete + partial R16 through 2026-07-05), `highlights.json` (seeded with 2 URLs), `types.ts`.

---

## In progress

_Nothing right now — pick from Next._

---

## Next (priority order)

1. [ ] **Radial bracket view (v1)** — concentric rings (32 → trophy at center), flags on outer ring, SVG connector paths, static render from `bracket.json`. No interactivity yet.
2. [ ] **Horizontal bracket view** — classic left-to-right tree from the same data. Toggle between radial and horizontal.
3. [ ] **Pick winners** — click a flag to advance to the next ring; Zustand state; undo/reset. Wire up the R16→QF, QF→SF, SF→F propagation.
4. [ ] **URL codec for picks** — compact encoding into TanStack Router search params; state hydrates from URL on load; shareable.
5. [ ] **Share modal** — copy link with picks summary; success toast.
6. [ ] **Teams grid + filters** — `/teams` page: 48 team cards, filter by group + confederation, sort by rank/name.
7. [ ] **Team journey modal** — click a team's flag → modal with a table of every match played (opponent flag, stage, date, venue, score, W/D/L, highlights link). Uses `bracket.json` + `groups.json` to build the row set.
8. [ ] **Groups page (read-only)** — 12 group tables with standings and matches, using `groups.json`.
9. [ ] **Group-stage simulator** — Quick (pick winner/draw) + Detailed (enter score) modes; auto-computes standings; ranks best-third teams per FIFA tiebreakers; feeds R32 placeholders.
10. [ ] **Highlight link resolver** — reads `highlights.json`; missing entries fall back to a `youtube.com/@fifa/search?q=` URL; opens in a new tab.
11. [ ] **Live-results overlay** — TanStack Query hook against football-data.org; badges pick as ✓/✗ once the real result is in; graceful fallback if no API key.
12. [ ] **Screenshot export** — `html-to-image` PNG download for the bracket (radial + horizontal) and the groups page.
13. [ ] **Keyboard navigation** — arrow keys between matches, Enter to pick, U undo, R reset, T toggle view, G go to groups, `?` help overlay.
14. [ ] **Full translations** — currently EN is complete and the other 7 locales have the same key set with translated chrome. Audit as new strings are added — every commit that adds a UI string must add it in all 8 locales.

---

## Backlog / stretch (post-v1)

- [ ] YouTube Data API integration (drop-in replacement for the curated highlights map).
- [ ] Head-to-head bracket compare — paste two share URLs, diff picks.
- [ ] Prediction leaderboard — requires a backend (Supabase or similar).
- [ ] Historical winners archive (previous World Cups).
- [ ] More languages (JA, KO, AR, ZH, DE, IT, RU).
- [ ] PWA / offline shell.
- [ ] E2E smoke test with Playwright.
- [ ] Vitest unit tests for URL codec, tiebreaker logic, geometry helpers.

---

## Notes for editors

- One feature ≈ one commit. Update this file in the same commit.
- If you add a feature not on this list, add it here first, then build it — future-you needs the record.
- Data snapshot age: **2026-07-06**. Refresh notes go in the commit message, not here.
