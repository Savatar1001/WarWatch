# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

---

## Project Overview

**WarIntel** is a real-time intelligence dashboard tracking the 2026 US-Iran conflict, live at **warintel.info**. It is a **zero-build static site** — no npm, no bundler, no framework. Data is fetched by a Python pipeline running in GitHub Actions every 30 minutes and injected directly into `index.html` via regex replacement.

- **Repo:** github.com/Savatar1001/warintel.info
- **Hosting:** GitHub Pages (`prod` branch, / root)
- **Branching:** `dev` (default) → `staging` → `prod` (live)
- **Developer:** Savvas D — South Africa (SAST = UTC+2)

---

## Commands

### Local Development
```bash
# Serve the site locally (no build step needed):
python -m http.server 8000
# Then open http://localhost:8000

# Inject mock data locally:
python mock_data.py

# Run the data pipeline locally (API keys optional):
export OIL_API_KEY="your_key"
export NEWS_API_KEY="your_key"
python fetch_data.py
```

### Deployment
```bash
# From the parent Projects/ folder (Windows batch files):
push-warintel-dev.bat       # Push WarIntel to dev branch
push-warintel-staging.bat   # Push WarIntel to staging branch
push-warintel-prod.bat      # Push WarIntel to prod (live) branch
push-workscrumlist.bat      # Push WorkScrumList to GitHub

# Supabase backup before schema changes:
python supabase_backup.py backup
# OR:
backup.bat
```

### Tests (written but not yet committed — blocked on I21 branching strategy)
```bash
pytest tests/               # 25 Python unit tests
npm test                    # 23 Vitest frontend unit tests
npx playwright test         # 10 browser tests
```

---

## Architecture

### Data Flow
1. GitHub Actions cron (`*/30 * * * *`) triggers `fetch_data.py` via `update.yml` (currently set to manual-only — cron disabled pending I21)
2. `fetch_data.py` scrapes Wikipedia (casualties/strikes/nuclear), fetches 14 RSS feeds, NewsAPI, and oil prices
3. Results are injected into `index.html` via regex — casualty figures into `hero-*` elements, headlines into the article grid, ticker text between `TICKER_START`/`TICKER_END` markers, timestamp into `update-time`
4. `headlines_cache.json` accumulates all fetched articles (keyed by URL) across runs
5. GitHub Pages serves the updated static files from the `prod` branch

**GitHub Secrets required:** `OIL_API_KEY` (oilpriceapi.com, with EIA.gov fallback), `NEWS_API_KEY` (newsapi.org, with RSS fallback)

### Frontend JS Modules (`js/`)
Each file owns exactly one feature domain. Load order matters — `utils.js` must load first.

| File | Responsibility |
|------|---------------|
| `utils.js` | Shared helpers: casualty sums, time/date formatting, Chart.js utilities |
| `warcost.js` | War cost clock + currency converter (5 currencies) |
| `widgets.js` | Panel collapse, drag-to-reorder, persistence via localStorage |
| `casualties.js` | Casualty counters, progress bars, date range slider |
| `charts.js` | All Chart.js initializations |
| `latest-updates-panel.js` | Change tracker, tag cloud |
| `headlines.js` | Source filter pills, article grid, pagination, overlay panel |
| `ui.js` | Font size slider, scroll-to-top |
| `supabase-client.js` | Supabase client (coded but not yet active) |

### CSS Standards
- No inline styles — classes only
- No `!important` (except grid layout — known exception, tracked as I6)
- CSS variables throughout — no hardcoded color or size values
- `--fz` drives all font sizing via `html { font-size: var(--fz) }` — all spacing in `em`
- `--phosphor: #00ff41` — radar/night-vision green
- `--army-olive: #8b9a4a` — olive drab (defined, not currently used)
- User preferences (font size, panel order, selected sources) persist in `localStorage`

### Data Pipeline Injection Anchors
`fetch_data.py` uses regex to find and replace named anchors in `index.html`. Do not rename or remove:
- Elements with IDs prefixed `hero-` (casualty/strike/nuclear figures)
- The `update-time` element (timestamp)
- `TICKER_START` / `TICKER_END` comment markers (ticker headlines)

---

## Session DoD

Before ending every session, confirm:
- [ ] `RELEASE_NOTES.md` updated
- [ ] `BACKLOG.md` updated
- [ ] New backlog items confirmed and numbered
- [ ] `push-warintel-dev.bat` run (changes go to dev first)
- [ ] `push-workscrumlist.bat` run (if WSL changed)
- [ ] Next session priorities noted at top of `BACKLOG.md`

---

## Living Documentation

Always update these files and commit them at the end of every session:

- **BACKLOG.md** — full issue tracker with pipeline statuses and priority levels. Source of truth for what needs doing. Later entries supersede earlier ones.
- **CONTEXT.md** — architecture snapshot. Update when file structure or data flow changes.
- **RELEASE_NOTES.md** — version history. Add entry when deploying to prod.

**Working practice:** At the end of every discussion topic, Claude lists what needs adding in point form and confirms before updating BACKLOG.md.

---

## Pipeline Statuses

| Status | Meaning |
|--------|---------|
| **Coded** | Built and in outputs/local. Not yet committed to repo. |
| **Tested** | Committed to `dev` branch. Automated tests passing. |
| **Staged** | Merged to `staging`. Manually verified on staging URL. |
| **Deployed** | Merged to `prod`. Live on warintel.info. |

## Priority Levels

| Priority | Meaning |
|----------|---------|
| 🔴 Critical | Breaks core functionality or blocks other work. Fix immediately. |
| 🟠 High | Significant user-facing impact or important tech debt. Next in queue. |
| 🟡 Medium | Meaningful improvement but site works without it. Plan for next session. |
| 🟢 Low | Nice to have. Do when higher priorities are clear. |

---

## Key Constraints

- **No build step.** Do not introduce npm dependencies, bundlers, or transpilers unless explicitly agreed. JS and CSS load directly into HTML.
- **No frameworks.** All interactivity is vanilla JS.
- **Branching strategy:** `dev` → `staging` → `prod`. All work goes to `dev` first. CI not yet wired (I21).
- **Cron disabled.** `update.yml` is manual-only until CI is in place (U6).
- **Supabase not yet live.** Schema is designed, tables not yet migrated (I9).
- **Many Coded items uncommitted.** See Pipeline Tracker in BACKLOG.md.
