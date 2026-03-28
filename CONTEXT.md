# WarIntel -- Project Context
> Living document. Update and commit with every push.
> Last updated: 2026-03-28 (session 2)

---

## Session DoD
Before ending every session, confirm:
- [ ] RELEASE_NOTES.md updated
- [ ] BACKLOG.md updated
- [ ] New backlog items confirmed and numbered
- [ ] `push-warintel-dev.bat` run (changes go to dev first)
- [ ] `push-workscrumlist.bat` run (if WSL changed)
- [ ] Next session priorities noted at top of BACKLOG.md

---

## Project Overview
- **URL:** warintel.info
- **Repo:** github.com/Savatar1001/warintel.info
- **Hosting:** GitHub Pages (prod branch, / root)
- **Branching:** `dev` (default) → `staging` → `prod` (live). `main` retained but redundant — delete once fully confirmed.
- **Architecture:** Static site -- index.html + styles.css + js/ + fetch_data.py + headlines_cache.json
- **Data pipeline:** GitHub Actions cron every 30 minutes (*/30 * * * *) via update.yml (currently manual-only — cron disabled pending CI)
- **Developer:** Savvas D -- South Africa (SAST = UTC+2)

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
├── CONTEXT.md              # This file
├── BACKLOG.md              # Full project backlog
├── RELEASE_NOTES.md        # Version history
├── CLAUDE.md               # Claude Code instructions
└── js/
    ├── utils.js            # Shared helpers
    ├── warcost.js          # War cost clock + currency converter
    ├── widgets.js          # Widget system: collapse, drag, reorder
    ├── casualties.js       # Casualty counters, progress bars, slider
    ├── charts.js           # All Chart.js initialisations
    ├── latest-updates-panel.js  # Change tracker, tag cloud
    ├── headlines.js        # Source filter pills, article panel
    └── ui.js               # Font slider, scroll-to-top
```

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
- No inline styles -- classes only
- CSS variables throughout -- no hardcoded values
- `--fz` drives all font sizing via `html { font-size: var(--fz) }`
- em units for spacing

---

## Known Issues
See BACKLOG.md -- Bugs section

---

## White-Label / SaaS Potential
WarIntel is architected to become a configurable real-time intelligence dashboard.
Key items: I17 (JS separation), I18 (white-label config), I19 (theming layer), I20 (data source abstraction).
