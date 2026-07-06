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
- [x] **Foundation** — FIFA→ISO2 code map, `Flag` component (flagcdn.com, 2x srcset), `Modal` (focus-trap-react + Esc + backdrop click), `Table`, `Badge` primitives.
- [x] **Groups page** — 12 group cards with full standings table (P/W/D/L/GF/GA/GD/Pts, advanced badge) and per-group match list with dates and scores.
- [x] **Teams grid + filters** — 48 team cards, filter by group + confederation, sort by rank/name, count indicator. Card click opens the journey modal.
- [x] **Team journey modal** — joins group + bracket matches for a team into one chronological table (stage, date, opponent flag, score with penalties/AET, W/D/L badge, venue, highlights link). Modal has focus trap + Esc.
- [x] **Highlight link resolver** — `highlights.json` first, else fallback to `youtube.com/@fifa/search?query=...`. Opens in new tab (`rel="noopener noreferrer"`).
- [x] **Horizontal bracket view** — 5 columns (R32→F) plus a Third-place card. Match cards show flag + name + score (+ penalty shootout / a.e.t. marker). Winner row bolded. Unresolved slots show the slot label (`Winner R16-3`, `3rd D`, etc.). Click a team → journey modal.
- [x] **Radial bracket view** — concentric rings from R32 outer down to Final ring plus a centre trophy. 32 team flags around the outer ring with grayscale on R32 eliminations; winner flags placed on the inner rings for each played match. SVG connector tree, faint dashed guide circles. Third-place match rendered as a card below. Click any flag → journey modal.
- [x] **Bracket view toggle** — pill toggle (Radial / Horizontal) on `/`, URL-synced via TanStack Router `?view=` search param (`radial` is the default). Shared links keep the view.
- [x] **`scripts/refresh-live.mjs`** — one-shot Node script that refreshes `src/data/{groups,bracket}.json` from football-data.org. Handles the two API quirks: `utcDate` drifts a day for US-evening kickoffs (so we preserve local dates), and `fullTime` on pen-shootout matches includes shootout goals (so we subtract `penalties` back out). Reads `FOOTBALL_DATA_KEY` from env. Used by both `pnpm` locally and CI.
- [x] **15-minute refresh + Pages deploy** — `.github/workflows/refresh-and-deploy.yml` runs at `:02/:17/:32/:47` past every hour, on push, and on manual dispatch. Fetches from football-data.org, commits data changes back to `main` as `github-actions[bot]`, builds with `PUBLIC_BASE=/fifa-rankings/`, uploads the artifact, and deploys to GitHub Pages. Vite base + TanStack Router basepath both wire off `PUBLIC_BASE`. `public/.nojekyll` in the artifact so Pages doesn't strip underscore-prefixed files.
- [x] **Landing page at `/`** — hero (trophy mark + title + tagline) + three feature cards linking to `/bracket`, `/teams`, `/groups`. Favourite-team card shown below if set. Bracket route moved to `/bracket` (search param `?view=` preserved).
- [x] **Sidebar hidden by default on every viewport** — the always-visible desktop sidebar is gone; on all viewports the top `<header>` shows brand + hamburger, and the sidebar is a slide-in drawer with backdrop + focus trap + Esc-to-close. Header brand is a link back to `/`.
- [x] **Bigger flags + hover tooltip on every flag** — radial `FLAG_SIZE` bumped ~20% (outer 44→52, R32→42, R16→36, QF→32, SF→28); horizontal `MatchCard` flag 18→22. `Flag` component now wraps in a `group relative` span with a floating tooltip that reads the team name on hover/focus (opt-out via `tooltip={false}`).
- [x] **Cookie persistence** — `src/lib/cookies.ts` primitives (SameSite=Lax, 1-year default). Theme choice migrated from localStorage to cookie; i18next detector now caches to both cookie + localStorage. Ready for any future SSR/edge read of prefs.
- [x] **Favourite team** — star toggle on team card + journey modal header; cookie-backed store (`useFavouriteTeam`); "★ Your team: X" line in the sidebar links to their journey. Survives refresh + across sessions.
- [x] **Mobile nav + drawer** — sticky top `<header>` with hamburger on `< lg`; sidebar becomes a slide-in drawer with backdrop, Esc to close, focus trap, body scroll lock. Sidebar unchanged on `lg+`. Drawer auto-closes on route change. Semantic `<header>`/`<nav aria-label>`/`<aside aria-label>`/`<main>` throughout.

---

## In progress

_Nothing right now — pick from Next._

---

## Next (priority order)

1. [ ] **Pick winners** — click a flag to advance to the next ring; Zustand state; undo/reset. Wire up the R16→QF, QF→SF, SF→F propagation. On radial, animate the flag "travelling" inward to its next ring position.
2. [ ] **URL codec for picks** — compact encoding into TanStack Router search params; state hydrates from URL on load; shareable.
3. [ ] **Share modal** — copy link with picks summary; success toast.
4. [ ] **Group-stage simulator** — Quick (pick winner/draw) + Detailed (enter score) modes; auto-computes standings; ranks best-third teams per FIFA tiebreakers; feeds R32 placeholders.
5. [ ] **Live-results overlay** — use the wired hooks to merge live scores onto bracket cards / groups; badge each match with ✓/✗ against picks. Join key is `tla` (FIFA broadcast code). Fall back to static JSON on any error.
6. [ ] **Screenshot export** — `html-to-image` PNG download for the bracket (radial + horizontal) and the groups page.
7. [ ] **Keyboard navigation** — arrow keys between matches, Enter to pick, U undo, R reset, T toggle view, G go to groups, `?` help overlay.
8. [ ] **Full translations** — currently EN is complete and the other 7 locales have the same key set with translated chrome. Audit as new strings are added — every commit that adds a UI string must add it in all 8 locales.

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
