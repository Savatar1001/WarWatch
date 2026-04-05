# WarIntel -- Project Context
> Living document. Update and commit with every push.
> Last updated: 2026-04-05
> Ingested by all collaborators — Claude Code, ChatGPT, human devs. Project-wide truth.

---

## Project Overview

**WarIntel** is a real-time intelligence dashboard tracking the 2026 US-Iran conflict, live at **warintel.info**. Zero-build static site — no npm, no bundler, no framework. Data is fetched by a Python pipeline running in GitHub Actions every 30 minutes and injected directly into `index.html` via regex replacement.

- **URL:** warintel.info
- **Repo:** github.com/Savatar1001/warintel.info
- **Hosting:** GitHub Pages (prod branch, / root)
- **Branching:** `dev` (default) → `staging` → `prod` (live). `main` retained but redundant — delete once fully confirmed.
- **Data pipeline:** GitHub Actions cron every 30 minutes (*/30 * * * *) via update.yml (currently manual-only — cron disabled pending CI)
- **Developer:** Savvas D — South Africa (SAST = UTC+2)
- **Supabase projects:** `warintel-dev` (dev + staging) and `warintel-prod` (production only) — both under OrgSavatar organisation in Supabase. Both on free tier. Credentials in KeePass.
- **Supabase org setup:** OrgSavatar org to be created in Supabase. `warintel-dev` currently under Savatar's Organisation — needs recreating under OrgSavatar once org is set up.

---

## Way of Working

- Adhere to Kaizen principles

---

## Key Constraints

- **Zero cost until revenue.** All infrastructure runs on free tiers. No paid services until the project generates enough revenue to justify them. Flag any proposed tool that has a cost.
- **Consistent across environments.** Same technology at every layer across dev/staging/prod. No mixing DB engines or platforms between environments.
- **No build step.** Do not introduce npm dependencies, bundlers, or transpilers unless explicitly agreed. JS and CSS load directly into HTML.
- **No frameworks.** All interactivity is vanilla JS.
- **Branching strategy:** `dev` → `staging` → `prod`. All work goes to `dev` first. CI not yet wired (I21).
- **Cron disabled.** `update.yml` is manual-only until CI is in place (U6).
- **Supabase not yet live.** Three projects created (warintel-dev, warintel-staging, warintel-prod). Migration SQL ready but not yet run (I9).
- **Many Coded items uncommitted.** See Pipeline Tracker in BACKLOG.md.

---

## Session DoD

Before ending every session, confirm:
- [ ] `RELEASE_NOTES.md` updated with timestamped entry (format: `YYYY-MM-DD HH:MM–HH:MM SAST — B3 desc, B5 desc, ...`)
- [ ] `BACKLOG.md` updated
- [ ] New backlog items confirmed and numbered
- [ ] Release notes generated before every push (item numbers + descriptions, comma-separated, timestamped)
- [ ] `push-warintel-dev.bat` run from `D:\_Development\Projects\` (changes go to dev first)
- [ ] `push-workscrumlist.bat` run (if WSL changed)
- [ ] Next session priorities noted at top of `BACKLOG.md`
- [ ] Memory files updated

---

## Pipeline Statuses

| Status | Meaning |
|--------|---------|
| **Coded** | Built and in outputs/local. Not yet committed to repo. |
| **Tested** | Committed to `dev` branch. Automated tests passing. |
| **Staged** | Merged to `staging`. Manually verified on staging URL. |
| **Deployed** | Merged to `prod`. Live on warintel.info. |

---

## Priority Levels

| Priority | Meaning |
|----------|---------|
| 🔴 Critical | Breaks core functionality or blocks other work. Fix immediately. |
| 🟠 High | Significant user-facing impact or important tech debt. Next in queue. |
| 🟡 Medium | Meaningful improvement but site works without it. Plan for next session. |
| 🟢 Low | Nice to have. Do when higher priorities are clear. |

---

## Deployment

- **Push to dev:** `push-warintel-dev.bat` from Projects/ folder
- **Push to staging:** `push-warintel-staging.bat` from Projects/ folder
- **Push to prod:** `push-warintel-prod.bat` from Projects/ folder
- **Push WSL:** `push-workscrumlist.bat` from Projects/ folder
- **Secrets:** OIL_API_KEY, NEWS_API_KEY (GitHub repo secrets)
- **DNS:** warintel.info A records → 185.199.108–111.153. www CNAME → savatar1001.github.io

---

## File Structure

```
WarIntel.info.dev/
├── index.html              # Main dashboard -- injection anchors
├── styles.css              # All CSS (includes @font-face for Armalite)
├── armalite.ttf            # Military stencil font -- logo wordmark
├── favicon.ico             # Radar favicon (16/32/48/64/128/256px)
├── CNAME                   # GitHub Pages custom domain -- warintel.info
├── fetch_data.py           # Data fetcher -- runs in GitHub Actions
├── headlines_cache.json    # Persistent headline store (keyed by URL)
├── mock_data.py            # Local dev mock injector
├── supabase_backup.py      # Backup/restore utility
├── CONTEXT.md              # This file — project-wide truth for all collaborators
├── BACKLOG.md              # Full project backlog
├── RELEASE_NOTES.md        # Version history
├── CLAUDE.md               # Claude Code bootstrap (auto-loaded)
├── CLAUDE_OPS.md           # Claude Code operational instructions: commands, doc ownership
├── PLANNING.md             # Planning session bootstrap — paste into ChatGPT or Claude.ai
└── js/
    ├── utils.js            # Shared helpers
    ├── warcost.js          # War cost clock + currency converter
    ├── widgets.js          # Widget system: collapse, drag, reorder
    ├── casualties.js       # Casualty counters, progress bars, slider
    ├── charts.js           # All Chart.js initialisations
    ├── latest-updates-panel.js  # Change tracker, tag cloud
    ├── headlines.js        # Source filter pills, article panel
    ├── ui.js               # Font slider, scroll-to-top
    └── supabase-client.js  # Supabase client (coded but not yet active)
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

### Data Pipeline Injection Anchors
`fetch_data.py` uses regex to find and replace named anchors in `index.html`. Do not rename or remove:
- Elements with IDs prefixed `hero-` (casualty/strike/nuclear figures)
- The `update-time` element (timestamp)
- `TICKER_START` / `TICKER_END` comment markers (ticker headlines)

---

## Data Sources

| Source | Data | Frequency | Key required |
|--------|------|-----------|-------------|
| Wikipedia | Casualties, strikes, nuclear | Per workflow run | No |
| NewsAPI | Headlines | Per workflow run | Yes (NEWS_API_KEY) |
| RSS (14 feeds) | Headlines | Per workflow run | No |
| oilpriceapi.com | Brent, WTI | Per workflow run | Yes (OIL_API_KEY) |
| EIA.gov (fallback) | Brent, WTI | Per workflow run | No |
| open.er-api.com | Exchange rates | Every 10 min (client) | No |
| Hengaw/HRANA | Casualty figures | Via Wikipedia | No |

---

## CSS Standards

- No inline styles — classes only
- No `!important` (except grid layout — known exception, tracked as I6)
- CSS variables throughout — no hardcoded color or size values
- `--fz` drives all font sizing via `html { font-size: var(--fz) }` — all spacing in `em`
- `--phosphor: #00ff41` — radar/night-vision green
- `--army-olive: #8b9a4a` — olive drab (defined, not currently used)
- User preferences (font size, panel order, selected sources) persist in `localStorage`

---

## Known Issues
See BACKLOG.md — Bugs section

---

## White-Label / SaaS Potential
WarIntel is architected to become a configurable real-time intelligence dashboard.
Key items: I17 (JS separation), I18 (white-label config), I19 (theming layer), I20 (data source abstraction).

---

## Document Ownership

| File | Owner | When to update |
|------|-------|---------------|
| `CONTEXT.md` | Shared — confirm with Sav before overwriting | When architecture, constraints, DoD, or way of working changes |
| `BACKLOG.md` | Shared | Claude Code updates pipeline statuses; planning sessions update strategic items |
| `CLAUDE.md` | Claude Code | If session start process changes |
| `CLAUDE_OPS.md` | Claude Code | When commands or operational process changes |
| `PLANNING.md` | Sav / planning sessions | When planning session inputs change |
| `RELEASE_NOTES.md` | Claude Code | Every prod deploy |
