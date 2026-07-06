# fifa-ranking

Interactive companion for the **FIFA World Cup 2026** — 48 teams, group stage, and the knockout bracket. Play the bracket, follow live results, and see how your picks land.

Inspired by [fwc2026-knockout.vercel.app](https://fwc2026-knockout.vercel.app/) (the "circle draw" bracket), rebuilt from scratch with more features.

## Stack

- **React 19 + TypeScript + Vite 7**
- **Tailwind CSS v4** — CSS-variable design tokens, first-class light/dark
- **TanStack Router** — file-based, type-safe routing; picks live in the URL
- **TanStack Query** — client-side cache for the live-results overlay
- **Zustand** — bracket state and undo history
- **react-i18next** — 8 languages: EN, ES, FR, PT, NO, SV, DA, FI
- **html-to-image** — screenshot export
- **focus-trap-react** — modal focus containment

## Locked feature set (v1 target)

1. **Knockout bracket** — radial (concentric rings) + horizontal (classic tree) views with a toggle.
2. **Pick winners** — click a team to advance them; smooth animation; undo / reset.
3. **Bracket picks in URL** — TanStack Router search params, compressed encoding; shareable.
4. **Share modal** — copy link.
5. **Live results overlay** — real match results badged against your picks (via a live football API).
6. **Groups page** — 12 groups × 4 teams with standings + interactive **group-stage simulator** (Quick: pick winners, Detailed: enter scores). Auto-computes best-third ranking for R32 seeding.
7. **Teams grid** — 48 teams, filter by group/confederation, sort by rank/name.
8. **Team journey modal** — click any team's flag → table of every match they've played (opponent, date, venue, score, W/D/L, highlights link).
9. **Match highlight links** — each played match links out to the FIFA YouTube channel highlight video (curated map + search-URL fallback). Opens in a new tab.
10. **Screenshot export** — download bracket or standings as PNG.
11. **i18n** — 8 launch languages; URL param `?lang=xx`.
12. **Keyboard navigation** — arrow keys between matches, Enter to pick, U/R/T shortcuts, `?` overlay.
13. **Light/dark theme** — respects OS + manual toggle.

## Dev setup

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production build
pnpm preview    # preview the production build
pnpm lint       # oxlint
```

**Node** ≥ 22.12 (or 20.19). Vite 7 will print a warning on lower versions.

### Data pipeline

The app has no client-side API integration — everything at runtime reads from bundled JSON. Those files are refreshed by a script that hits [football-data.org](https://www.football-data.org/) (free tier, 10 req/min).

**Locally:** copy `.env.example` to `.env`, set `FOOTBALL_DATA_KEY`, then:

```bash
node --env-file=.env scripts/refresh-live.mjs
```

**In CI:** `.github/workflows/refresh-and-deploy.yml` runs every 15 minutes (at :02/:17/:32/:47), refreshes the JSON, commits any changes back to `main` as `github-actions[bot]`, builds, and deploys to GitHub Pages. Store your key as the `FOOTBALL_DATA_KEY` repo secret.

Free key at [football-data.org/client/register](https://www.football-data.org/client/register). Their free tier includes the FIFA World Cup (competition code `WC`, id 2000) — 2026 season is accessible.

## Project structure

```
src/
  routes/                  # __root, index (bracket), teams, teams.$code, groups
  components/              # Sidebar, MobileHeader, NavIcons
  features/
    bracket/               # radial + horizontal views + tree-order helpers
    groups/                # standings + matches
    teams/                 # grid + journey modal
    favourites/            # star toggle + persisted favourite team
    highlights/            # curated map + FIFA YouTube search-URL fallback
    i18n/                  # react-i18next + 8 locales
    theme/                 # provider + toggle
    query/                 # QueryClient (kept for future async needs)
  data/                    # teams.json, groups.json, bracket.json, highlights.json, types.ts
  lib/                     # storage (localStorage helpers), team-code map
  ui/                      # Modal, Table, Badge
scripts/
  refresh-live.mjs         # pulls football-data.org → src/data/*.json
.github/workflows/
  refresh-and-deploy.yml   # hourly cron: refresh → build → deploy
```

## Data notes

- Team codes use FIFA broadcast convention (NED, GER, POR, SUI, CRO, RSA) rather than strict ISO 3166-1 alpha-3.
- Bracket/group data snapshot: **2026-07-06** (mid-Round of 16). R16-3 (POR–ESP), R16-6 (USA–BEL), R16-7 (ARG–EGY), R16-8 (SUI–COL) still to play.
- Highlights map is intentionally sparse; the fallback links to a search on the [FIFA YouTube channel](https://www.youtube.com/@fifa).

## Deploy

Deploys automatically to **GitHub Pages** from `main` via `.github/workflows/refresh-and-deploy.yml` — see the Data pipeline section above.

Live at [https://achintsatsangi.github.io/fifa-rankings/](https://achintsatsangi.github.io/fifa-rankings/).

**First-time repo setup:**
1. Add `FOOTBALL_DATA_KEY` to Settings > Secrets and variables > Actions.
2. Set Settings > Pages > Source to "GitHub Actions".

To preview the production build locally with the CI base path:

```bash
PUBLIC_BASE=/fifa-rankings/ pnpm build && pnpm preview --base /fifa-rankings/
```

## Roadmap (post-v1)

- YouTube Data API integration (replace curated highlights map)
- Head-to-head bracket compare (paste two share URLs, diff picks)
- Prediction leaderboard (backend needed — Supabase)
- Historical winners archive
- More languages
