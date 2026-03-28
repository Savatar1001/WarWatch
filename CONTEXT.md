# WarWatch -- Project Context
> Living document. Update and commit with every push.
> Last updated: 2026-03-28

---

## Session DoD
Before ending every session, confirm:
- [ ] RELEASE_NOTES.md updated (both sites)
- [ ] BACKLOG.md updated (both sites)
- [ ] New backlog items confirmed and numbered
- [ ] Sites.zip regenerated
- [ ] push-warwatch.bat run (if WarWatch changed)
- [ ] push-workscrumlist.bat run (if WSL changed)
- [ ] Next session priorities noted at top of BACKLOG.md

---

## Project Overview
- **URL:** iranwarstats.info
- **Repo:** github.com/Savatar1001/WarWatch
- **Hosting:** GitHub Pages (main branch)
- **Architecture:** Static site -- index.html + styles.css + js/ + fetch_data.py + headlines_cache.json
- **Data pipeline:** GitHub Actions cron every 30 minutes (*/30 * * * *) via update.yml
- **Developer:** Savvas D -- South Africa (SAST = UTC+2)

---

## Deployment
- **Extract:** `tar -xf Sites.zip -C "D:\_Development\Projects\"`
- **Push WarWatch:** run `push-warwatch.bat` from Projects/ folder
- **Push WSL:** run `push-workscrumlist.bat` from Projects/ folder
- **Secrets:** OIL_API_KEY, NEWS_API_KEY (GitHub repo secrets)

---

## File Structure
```
WarWatch/
├── index.html              # Main dashboard -- injection anchors
├── styles.css              # All CSS
├── fetch_data.py           # Data fetcher -- runs in GitHub Actions
├── headlines_cache.json    # Persistent headline store (keyed by URL)
├── mock_data.py            # Local dev mock injector
├── supabase_backup.py      # Backup/restore utility
├── CONTEXT.md              # This file
├── BACKLOG.md              # Full project backlog
├── RELEASE_NOTES.md        # Version history
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
WarWatch is architected to become a configurable real-time intelligence dashboard.
Key items: I17 (JS separation), I18 (white-label config), I19 (theming layer), I20 (data source abstraction).
