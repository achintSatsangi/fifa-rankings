# FIFA Ranking — site summary

Fan-made companion to the 2026 World Cup. A one-pager built around the circular knockout bracket, backed by build-time data refresh, deployed to GitHub Pages.

**Live**: https://achintsatsangi.github.io/fifa-rankings/
**Repo**: `achintSatsangi/fifa-rankings`

---

## Pages

**`/` (Home, one-pager)** — three vertical sections + footer:

1. **Storyline hero** — 7 scroll-revealed beats that frame the circular bracket concept, credit Paul Noble at the end. Fade-in-on-scroll via `IntersectionObserver`.
2. **Bracket section** — Radial ↔ Interactive toggle. Radial: all 32 knockout teams on the outer ring, trophy at center, connectors trace advancement paths. Interactive: click a team to advance them through the bracket; picks persist to localStorage.
3. **Groups section** — 12 group cards with standings, results, venues.
4. **Footer** — link to horizontal view, fan-made disclaimer.

**`/bracket`** — classic left-to-right bracket (hidden; footer link only).

**`/teams`** — grid of all 48 nations; filter by group / confederation, sort by FIFA rank.

**`/teams/$code`** — individual team page (also opens as a modal from any bracket click).

**`/groups`** — same content as home's groups section (kept for direct-link support).

---

## Core interactions

- **Click any team flag** → Journey Modal: every match they've played (group + knockout), with score, opponent, venue (hidden on mobile), result badge, and a highlights button.
- **Highlights button** on each row:
  - 🟥 **Red YouTube pill** — links to the FIFA channel's canonical `Highlights | X-Y | FIFA World Cup 2026™` video.
  - 🟦 **Blue FIFA pill** — falls back to the official FIFA match-report article when YouTube hasn't uploaded yet.
  - ⬜ **Grey pill** — search fallback (rarely seen; means both sources missed).
- **Hover a future match** on the bracket → tooltip with kickoff time, venue, and live countdown (`3d:15h:24m:45s`).
- **Hover a played match on outer rings** → tooltip with that specific match's score `1(4) – 1(2)` from the focus team's perspective.
- **Favourite a team** → star toggle, link in sidebar.
- **Language switcher** — 8 locales (EN, ES, FR, PT, NO, SV, DA, FI).
- **Theme toggle** — light / dark / system.
- **Header freshness chip** — "Updated 12m ago · next in 18m" with live countdown; hover for exact timestamps.
- **Update banner** — bottom-right toast when a new build is available (compares client `BUILD_TIMESTAMP` to `dist/version.json` polled every 10 min).

---

## Data pipeline (build-time; no client API calls at runtime)

Bundled JSON files in `src/data/` (`teams.json`, `groups.json`, `bracket.json`, `highlights.json`) are refreshed by CI hourly at `:02`:

1. **`scripts/refresh-live.mjs`** — pulls scores from football-data.org (free tier, WC competition id 2000). Handles penalty-shootout goals correctly, preserves local dates against UTC-drift for US-evening kickoffs.
2. **`scripts/resolve-highlights.mjs`** — three-tier highlight resolution:
   - **Tier 1 — YouTube Data API**: canonical `Highlights | TeamA X-Y TeamB | FIFA World Cup 2026™` on the FIFA channel (`UCpcTrCXblq78GZrTUTLWeBw`). Rejects `🆚 #FIFAWorldCupOnYT` reels, Alt Cast feeds, pressers, single-goal clips.
   - **Tier 2 — FIFA article page**: guessed URL pattern `/articles/{teamA-slug}-{teamB-slug}-match-report-highlights`, fetched with Googlebot UA (FIFA is a client-rendered SPA that only SSRs for bots), verified via `<title>` tag.
   - **Tier 3 — Client-side FIFA-channel search URL fallback**.
   - Country name variants unified (`Cote d'Ivoire`, `Cabo Verde`, `USA`, `Congo DR`, `Türkiye`).
3. **`scripts/config/youtube-fetch.json`** — manual gate for tier 1. Defaults to `{ "enabled": false }` (only FIFA runs). Flip to `true` and push to trigger a YouTube pass; script auto-resets to `false` at end of run. Prevents the daily 100-search quota from being burned on every cron.

**CI workflow**: `.github/workflows/refresh-and-deploy.yml` — cron `:02` hourly, plus on push to `main` and manual dispatch. Refresh → resolve → commit any changes → build → deploy to Pages.

**Coverage today**: 79 / 92 played matches have a direct highlights link (13 no-data cases are group matches without published articles — Curaçao / Iran / Cape Verde MD1).

---

## Analytics

Google Analytics 4 tag `G-HHK7D4H2J2` in `index.html` with `send_page_view: false`. The TanStack Router subscribes to `onResolved` and fires `page_view` on every navigation (including query-string changes, so `?view=radial` vs `?view=horizontal` count as distinct hits).

---

## Demo videos

Short scripted walkthroughs live under `docs/` — regenerated any time features change:

- **`docs/radial-demo.webm`** — read-only tour: freshness chip, Final trophy tooltip, played-team score tooltip, Journey Modal open + close.
- **`docs/interactive-demo.webm`** — picks flow: advance 5 teams (each shows the slide + pop + gamified toast), then reset.

Both are recorded with Playwright + a red fake-cursor overlay, against the deployed site by default (override with `TARGET=http://localhost:5173`). Regenerate:

```bash
node scripts/record-radial-demo.mjs
node scripts/record-interactive-demo.mjs
```

## Stack

- React 19 + TypeScript + Vite 7 (do NOT upgrade to 8 — Rolldown native binding fails under pnpm 10)
- Tailwind CSS v4, CSS-variable design tokens for light/dark
- TanStack Router (file-based, auto-generated route tree) + TanStack Query
- Zustand + `persist` for interactive picks
- react-i18next, 8 locales
- Node 24.18.0 pinned via `.nvmrc`; pnpm 10
- Deployed to GitHub Pages at `/fifa-rankings/` base path
