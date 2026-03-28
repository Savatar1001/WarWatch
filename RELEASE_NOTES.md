# WarIntel -- Release Notes
**Project:** WarIntel Iran War Intelligence Dashboard
**URL:** warintel.info
**Developer:** Savvas D (SavvasD)
**AI Pair:** Claude (Anthropic)

---

## v0.6.0 -- 2026-03-28
### Branching Strategy, Logo, Favicon, Site Identity

**Branching Strategy (I21 — Coded)**
- `dev` → `staging` → `prod` branch structure created in git and on GitHub
- `prod` branch set as GitHub Pages source
- `dev` set as default branch
- `First-Branch` legacy branch deleted (fully superseded)
- Push bat files created for each environment: `push-warintel-dev.bat`, `push-warintel-staging.bat`, `push-warintel-prod.bat`

**CNAME**
- `CNAME` file created with `warintel.info` — committed to `prod`
- DNS A records updated to GitHub Pages IPs (185.199.108–111.153)
- `www` CNAME record updated to `savatar1001.github.io`

**Radar Logo**
- Replaced plain text header logo with animated inline SVG radar
- Phosphor green (#00ff41) on black, night-vision colour scheme
- Animated clockwise sweep arm with fading trail sectors
- Four timed blips synced to sweep arm position
- Armalite military font (`armalite.ttf`) added to project root
- `WARINTEL.INFO` wordmark in gold (`--gold`) to the right of radar
- `@font-face` declaration added to `styles.css`
- `--phosphor` CSS variable added

**Favicon**
- `favicon.ico` generated at 6 sizes: 16, 32, 48, 64, 128, 256px
- Radar design: black background, bold sweep arm, range rings, blips at larger sizes
- Linked in `<head>` via `<link rel="icon">`

**Site Identity**
- Page title updated: `WarIntel.info — Worldwide Realtime Statistics`
- Meta description updated to reflect worldwide scope
- Footer tagline updated: `WarIntel.info · Worldwide Realtime Statistics`

---

## v0.5.0 -- 2026-03-28
### Data Integrity & Source Transparency

**Oil Prices -- Dual Source Fallback**
- Primary: oilpriceapi.com (via OIL_API_KEY secret)
- Automatic fallback: EIA.gov open data (free, no key required)
- OIL_API_KEY now optional -- workflow no longer crashes if key missing
- Silent fallback -- no user-facing error, just switches source

**War Cost Clock -- Disclosure & Accuracy**
- Added `~` prefix to cost figure (was bare dollar amount)
- Added "ESTIMATED COST" label above the number
- Source links added: Pentagon comptroller, CSIS, Watson Institute methodology
- Wikipedia article linked as data source
- CSS added for label and link styles

**Exchange Rates -- Client-Side Refresh**
- Rates now refresh every 10 minutes client-side via open.er-api.com
- Independent of 30-minute workflow cycle
- Silent fail -- stale rates continue to display if fetch fails

**Data Timestamp (Bug B4 fix)**
- Injection regex confirmed working -- timestamp was stale due to workflow not running
- Will update automatically on next cron run

**Wikipedia Stale Selectors (Bug B8 improvement)**
- Fields now display "Source unavailable" instead of bare dash when scraping fails
- "Updating..." shown during scrape, "Source unavailable" on failure
- Much cleaner UX than silent dashes

**Source Links & Transparency**
- Casualty cards link directly to Wikipedia article, Hengaw, HRANA
- Section tags updated with Wikipedia source links
- cas-note links styled (dim, gold on hover)

**Automation**
- update.yml cron confirmed at 30-minute intervals (*/30 * * * *)
- push-warintel.bat and push-workscrumlist.bat added to Projects/ root
- Deployment: `tar -xf Sites.zip -C "D:\_Development\Projects\"` then run push bat

---

## v0.4.0 -- 2026-03-26
### JS Refactor, CSS Audit, Test Suite, Supabase Schema

**CSS Audit**
- 334 lines removed (1899 to 1566)
- Duplicates eliminated, dead rules deleted
- `!important` reduced to grid layout only
- Source pill colours fixed to border-only opacity system
- `--fz` variable system established for font scaling

**Headlines Filter System**
- Pills join back of active group on selection
- Full-width horizontal separator between selected/unselected
- Per-source article counts shown, zero-count pills hidden
- Controls bar between pill row and headlines grid
- Date filter timezone off-by-one bug fixed

**JS Refactor**
- Monolithic JS extracted to `js/` folder (8 files)
- utils.js, warcost.js, widgets.js, casualties.js, charts.js, latest-updates-panel.js, headlines.js, ui.js
- Each file named after the feature it implements

**Test Suite Written (not yet committed)**
- pytest: 25 tests (helpers, cache, tag classification, HTML injection, war cost, keyword filtering)
- Vitest: 23 unit tests (date parsing, war cost formula, currency formatting, filter logic)
- Playwright: 10 browser tests (page load, widget, pills, date filter, visual regression)
- CI workflow in tests.yml

**Supabase Schema**
- 001_initial_schema.sql -- 5 tables (users, backlog_items, messages, notification_subscriptions, push_tokens)
- RLS, indexes, soft deletes, updated_at triggers, Realtime on messages and backlog_items
- 001_rollback.sql paired
- supabase_backup.py -- backup/write-local/restore commands
- backup.bat -- pre-migration safety script

---

## v0.3.0 -- 2026-03-25
### Data Pipeline, Cache, Exchange Rates, War Cost

**Headlines Cache**
- seen_headlines.json replaced with headlines_cache.json
- Persistent store of all headline objects, keyed by URL
- Each run merges new headlines -- no cap, accumulates permanently
- Never re-downloads same URL twice within a run

**Exchange Rates**
- open.er-api.com integration (free, no key)
- EUR, GBP, CNY, JPY, ZAR displayed in cost panel
- Custom currency lookup added

**War Cost Clock**
- Formula: $11.3B first 6 days, $1,157/sec ongoing
- Source: Pentagon/CSIS briefing data
- Currency converter with live FX rates
- Chips: per-day cost, budget request, Patriot missile cost, cost ratio

**push.bat**
- Force push with rebase
- git pull --rebase origin main before push

---

## v0.2.0 -- 2026-03-23
### CSS Extraction, JS Architecture, Filter System

- CSS extracted to styles.css (1,900 lines)
- JS split into js/ folder structure
- Source filter pills -- multi-select, active states, per-source counts
- Date range filter -- from/to date pickers, defaults to war start
- Rows per page dropdown (10/25/50)
- Article panel overlay with AI summary (Claude API)
- Row tints per source (0.22 opacity)
- Dynamic day pill (DAY X -- date -- UTC time)
- Local time display in header
- Cache bust on every deploy (styles.css?v=TIMESTAMP)

---

## v0.1.0 -- 2026-03-22
### Initial Build & Live Deployment

- Iran war intelligence dashboard live at warintel.info
- GitHub Pages hosting, GitHub Actions CI/CD
- RSS aggregation from 14 sources
- War cost clock + currency converter
- Key stats panel (casualties, strikes, nuclear, energy)
- Coalition status table
- Source filter pills
- Date range filter
- Article panel overlay
- Scrolling ticker
- Glossary (24 terms, collapsible)
- Wikipedia scraping for live casualty/strike data
- oilpriceapi.com for Brent/WTI prices
- fetch_data.py data pipeline
- mock_data.py for local development
