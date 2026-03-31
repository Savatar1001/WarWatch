# SESSION_LOG.md — WarIntel Development History

**Project:** WarIntel Iran War Intelligence Dashboard
**URL:** warintel.info
**Developer:** Savvas D (SavvasD / Savatar1001)
**AI Pair:** Claude Code (Anthropic)
**Log started:** 2026-03-30

This file captures session-by-session work: what was attempted, what broke, what decisions were made, and why. Not a changelog (that's RELEASE_NOTES.md) — this is the raw record.

---

## 2026-03-30 — Session 6 (~09:00–13:00 SAST)

**Release:** v0.7.0

### Work done

**Article panel overlay bugs (B3)**
- Labels were wrong font/wrong case — root cause was `styles.css?v=CACHE_BUST` being a literal string, browser cached forever. Fixed by moving to dated version string, then auto-stamped by fetch_data.py.
- JS changes not taking effect — no `?v=` on any JS files at all. Added version stamps to all script tags. fetch_data.py now auto-stamps all `?v=` references (JS + CSS) with Unix timestamp on every run.
- Click-to-close not working — `activeRow === row` always evaluated false because JS closure variable didn't survive the event. Switched to DOM class `ap-active` on the row element — no closure issues possible.
- Panel covering the clicked row — animation `translateY(100%)` was fighting the inline `top` style, panel always ended up at top of widget. Removed translateY, kept fade-only animation.
- Close button too dim, too far right — restyled with red border/text/background (`rgba(192,57,43,...)`).
- Headline click not closing panel + no cursor — added `cursor: pointer` to `.ap-headline`, added click listener to close panel.
- Panel position: `overlay.style.top = (row.offsetTop + row.offsetHeight) + 'px'` — places panel immediately below clicked row.

**Source filter pills (B5)**
- Pills were showing only 6 sources — RSS_FEEDS only had 6 entries at that point.
- Ordering fix — removed bad logic that was moving active pills to end of list.
- Made pills dynamic — `build_pills_html(news_items)` in fetch_data.py generates pill HTML from actual feed sources. PILLS_START/PILLS_END injection anchors added to index.html. No more hardcoded 24-pill HTML block.

**RSS feeds expanded**
- Decision: build for end state, not throwaway code. 6 feeds → 30 feeds. Sources include Reuters, AP, BBC, Al Jazeera, Times of Israel, Jerusalem Post, The Guardian, NY Times, Washington Post, NPR, Fox News, CNN, France24, Deutsche Welle, Middle East Eye, Haaretz, IRNA, Press TV, UN News, IAEA, CENTCOM, UNHCR, Amnesty, Human Rights Watch, Foreign Policy, The Atlantic, Breaking Defence, Jane's, War on the Rocks, OSINT aggregators.

**Primary sources replacing Wikipedia (B14)**
- Wikipedia flagged as unacceptable source — any editor can change figures. User: "absolutely yes. explain to me why this wasnt done from the get go, this was an OBVIOUS issue just waiting to happen"
- Built `fetch_centcom()` — scrapes CENTCOM RSS for strikes/waves/drones
- Built `fetch_iaea()` — scrapes IAEA press releases for nuclear status
- Built `fetch_unhcr()` — scrapes UNHCR for displaced figures
- Built `fetch_conflict_data()` — orchestrates all three, Wikipedia as last-resort fallback
- Replaced `wiki = fetch_wikipedia()` with `wiki = fetch_conflict_data()` in main()
- Casualties still need a primary source (OHCHR, IRNA, Reuters/AP wire) — logged as B11

**Architecture decisions (session)**
- Two data tiers agreed:
  1. Static injection (30-min cron) — slow-changing data (casualties, oil prices, war stats)
  2. Supabase Realtime — live data (headlines, AI summaries, breaking news)
- AI summaries (B13): browser was calling Anthropic API directly → CORS block + no API key. Fix agreed: pre-generate in fetch_data.py, store in Supabase, serve instantly. Not yet built.
- Global date range filter (F18) requires time-series schema (I37) — all data points stored as rows with timestamps, not overwritten.
- Live headlines (F19): fetch_data.py inserts into Supabase on each run. Frontend subscribes via Supabase Realtime.
- Decision: "spent too many sessions on plumbing" — infra scope locked, no new infra items.

**GitHub Actions deploy workflow**
- Multi-environment hosting on gh-pages branch: `/dev`, `/staging`, `/` root (prod)
- `.github/workflows/deploy.yml` created — triggers on push to dev/staging/prod, rsyncs to correct subpath
- User: "will [dev, staging, prod] be simultaneously available" — yes, each branch a subpath

**Cloudflare setup**
- User was completing Cloudflare setup during session — DDoS protection, CDN, free analytics
- Decision: Cloudflare free analytics + Hotjar free tier — no cost, no paid analytics
- Domain nameservers updated at domains.co.za to Cloudflare nameservers
- Awaiting DNS propagation

**Bat file cleanup**
- Old numbered bat files (`1 push-warintel-dev.bat` etc.) deleted from repo root
- New files created at `D:\_Development\Projects\` root (no numbers, correct org path):
  - `push-warintel-dev.bat`
  - `push-warintel-staging.bat`
  - `push-warintel-prod.bat`

**Release notes format established**
- Format: `YYYY-MM-DD HH:MM–HH:MM SAST — Bx desc, Fy desc, ...` comma-separated, item numbers required
- Rule added to CLAUDE.md Session DoD

**CLAUDE.md and BACKLOG.md updated**
- Hosting section updated to gh-pages subpath model
- Document ownership rules added (CC owns CLAUDE.md + RELEASE_NOTES.md, claude.ai owns CONTEXT.md)
- New backlog items added: B10, B11, B13, B14, F18, F19, I37, U9, U10, U11, M20

### Bugs found this session
- B12: Headline click scrolls to top of page — `e.preventDefault()` missing
- B13: AI summary CORS + no API key — pre-generate in fetch_data.py (fix designed, not built)
- B14: Wikipedia as primary source — replaced with CENTCOM/IAEA/UNHCR

### Decisions not to build (yet)
- Wikipedia revision ID citation with edit count — agreed it's valuable, deferred
- Web Vitals JS (U11) — added to backlog, not built this session
- Skeleton UX (U9) — added to backlog, not built
- Performance budget (U10) — added to backlog, not built

---

## 2026-03-29 — Session 5

**Release:** v0.6.1

### Work done
- DNS A records confirmed resolving to GitHub Pages IPs
- Site live at warintel.info, HTTPS provisioned
- Repo made private (GitHub Pro) — Pages continues to serve
- Loading overlay bug fixed — ui.js and other modified files were uncommitted, pushed to prod
- Scroll-to-top on load fixed — inline `scrollRestoration` script added to `<head>`
- GitHub MCP server configured (I27) — `✓ Connected`, fine-grained PAT scoped to warintel.info repo
- Claude Desktop MCP attempted (I29) — Node.js v24.14.1 installed, config written, hammer not appearing, parked
- Document ownership rules added to CLAUDE.md

---

## 2026-03-28 — Session 4

**Release:** v0.6.0

### Work done
- `dev` → `staging` → `prod` branch structure created
- `prod` set as GitHub Pages source, `dev` as default branch
- `First-Branch` legacy branch deleted
- Push bat files created for each environment
- `CNAME` file created with `warintel.info`, DNS A records updated
- Radar logo: animated inline SVG, phosphor green (#00ff41), clockwise sweep arm, fading trail sectors, four timed blips
- Armalite military font added
- `WARINTEL.INFO` wordmark in gold
- Favicon generated at 6 sizes (16–256px)
- Page title, meta description, footer tagline updated

---

## 2026-03-28 — Session 3

**Release:** v0.5.0

### Work done
- Oil prices: dual-source fallback — oilpriceapi.com primary, EIA.gov fallback
- War cost clock: `~` prefix, "ESTIMATED COST" label, source links (Pentagon, CSIS, Watson Institute)
- Exchange rates: client-side refresh every 10 minutes via open.er-api.com
- Timestamp injection confirmed (B4)
- Wikipedia stale selectors: "Source unavailable" shown on failure instead of bare dash
- Source links + transparency: casualty cards link to Wikipedia, Hengaw, HRANA
- update.yml cron confirmed at 30-minute intervals
- push-warintel.bat and push-workscrumlist.bat added to Projects/ root

---

## 2026-03-26 — Session 2

**Release:** v0.4.0

### Work done
- CSS audit: 334 lines removed (1899 → 1566), duplicates eliminated, `!important` reduced
- Source pills: join back of active group on selection, separator between selected/unselected, per-source counts, zero-count pills hidden
- Date filter timezone off-by-one bug fixed
- JS refactor: monolithic JS extracted to `js/` folder (8 files — utils, warcost, widgets, casualties, charts, latest-updates-panel, headlines, ui)
- Test suite written (not committed): 25 pytest, 23 Vitest, 10 Playwright
- Supabase schema: 001_initial_schema.sql (5 tables), RLS, indexes, soft deletes, updated_at triggers, Realtime on messages + backlog_items
- supabase_backup.py, backup.bat written

---

## ~2026-03-22 — Historical date picker spec (never built)

**Spec document written (Date picker feature.txt). Not yet implemented — became F18.**

- Proposed: replace day pill with interactive date picker. Selecting any past date rewinds every panel.
- Data storage: `history.json` one entry per day, ~3KB/day, under 1MB/year.
- Backfill script: loop from Day 1 (2026-02-28) to today, hit Wikipedia Revisions API for each date, run existing scrapers on historical wikitext.
- Ongoing: `fetch_data.py` appends today's snapshot to `history.json` on every run.
- Frontend: `replaySnapshot(dateKey)` reads cached history.json and updates same element IDs that fetch_data.py already targets.
- **Superseded by:** I37 (time-series schema in Supabase) + F18 (global date range filter). history.json approach replaced with Supabase rows with timestamps. Same goal, proper architecture.

---

## 2026-03-23 — Session 1b

**Release:** v0.3.0 / v0.2.0

### Work done
- CSS extracted to styles.css (1,900 lines)
- JS split into js/ folder structure
- Source filter pills: multi-select, active states, per-source counts
- Date range filter: from/to pickers, defaults to war start
- Rows per page dropdown (10/25/50)
- Article panel overlay with AI summary (Claude API — later found to be broken, B13)
- Row tints per source (0.22 opacity)
- Dynamic day pill (DAY X — date — UTC time)
- Local time display in header
- Cache bust on deploy: styles.css?v=TIMESTAMP
- headlines_cache.json: persistent store of all headline objects, keyed by URL
- Exchange rates: EUR, GBP, CNY, JPY, ZAR
- War cost clock: $11.3B first 6 days, $1,157/sec ongoing
- push.bat with force push + rebase

---

## Pre-project — 2026-03-21

**No code yet. Research and strategy session on claude.ai.**

- Researched top 20 most searched topics globally — US-Iran war was #1 by far
- Confirmed data volume: Iran had already launched 70+ missile waves by Day 22, major outlets publishing live updates every 10-15 minutes
- Assessed platform options for a war news channel — YouTube, TikTok, X, cross-platform
- Key concern raised: AdSense/ad networks may reject war/conflict content — noted as risk
- Conclusion: enough data volume to publish every 2 hours, war is the dominant global news event
- Decision: build a dashboard, not just a channel

---

## 2026-03-22 — Session 1 (early) — WarWatch era

**Project name at this point: WarWatch, hosted at iranwarstats.info**
**Tooling: claude.ai (not Claude Code), files uploaded/downloaded manually**

### Work done
- Project already existed with basic structure — exchange rate fetch had been written in a previous session but never committed
- Exchange rates added: `fetch_exchange_rates()` hitting open.er-api.com (free, no key), injecting EUR/GBP/CNY/JPY/ZAR into war cost panel. Silent fallback to hardcoded rates.
- Glossary added: 24 terms A–Z (Air Superiority, Arak, Arrow-3, Ballistic Missile, Brent Crude, CBRN, CENTCOM, CEP, Cruise Missile, David's Sling, Drone, Enriched Uranium, Fordow, Hengaw, HRANA, IAEA, IDF, Iron Dome, LNG, Natanz, NPT, OSINT, Sortie, Strait of Hormuz, WTI). Collapsible, two-column grid, gold mono terms.
- Glossary repositioned: moved from footer to standalone full-width block above footer, larger heading, separate from legal links
- Ad slot moved to bottom of page (was above footer)
- Key stats card alignment: `min-height: 2.4em` on `.hs-label` to ensure numbers align regardless of label wrapping
- Key stats font size: `clamp` applied, floor tuned to 2.2em, numbers centred, gap below increased

### Bugs found and fixed
- `<script>` opening tag missing after `</footer>` — all JS rendered as raw text on page. Fixed.
- Glossary block missing closing divs — swallowed everything below it including war cost panel. Fixed.
- Row tints too intense (0.22 opacity) — dropped to 0.10, subtle colour coding not a wall of orange.
- Injection regex fragile — dummy data not being replaced by cron output. Root cause: anchor comment had drifted. Fixed with stable EVENTS_FEED_START/END anchors.
- push.bat push conflicts: cron job pushing while developer was working. Fixed with `git stash → pull → unstash → commit → push` order.
- Pagination sort not working: `parseItemDate` was parsing `pub[:10]` from RSS which gave "Sun, 22 Ma" — not parseable. Fixed by adding `data-date` ISO attribute in `fetch_data.py`, reading that in JS.

### Key decisions
- NewsAPI added as second source alongside RSS: RSS = last 24–72h real-time, NewsAPI = 30-day history via keyword search ("Iran war"). Combined and deduplicated. Free tier: 100 requests/day — one well-crafted query per run.
- Pagination and sort: implemented this session (newest first, Prev/Next, page X of Y) — but bugs persisted due to stale data, revisited in later sessions.
- push.bat added to `.gitignore` to prevent cron conflicts on the file itself.

---

## 2026-03-22 — Session 1 (late)

**Release:** v0.1.0 (as documented in RELEASE_NOTES.md)

### Work done — Stabilisation + feature additions
- Iran war intelligence dashboard stabilised at iranwarstats.info (later moved to warintel.info)
- GitHub Pages hosting, GitHub Actions CI/CD (30-min cron)
- RSS aggregation from 14 sources
- War cost clock + currency converter
- Key stats panel (casualties, strikes, nuclear, energy)
- Coalition status table
- Source filter pills
- Date range filter
- Article panel overlay with AI summary placeholder
- Scrolling ticker
- Glossary (24 terms, collapsible) — see Session 1 early above
- Wikipedia scraping for live casualty/strike data
- oilpriceapi.com for Brent/WTI prices
- fetch_data.py data pipeline
- mock_data.py for local development

---

## Pending (carried forward)

| Item | Status |
|------|--------|
| Verify Cloudflare active after DNS propagation | Next session |
| Verify deploy workflow — gh-pages subpaths | Next session |
| Delete old numbered bat files from repo root | Next session |
| Set up .env for local API keys | Next session |
| Run fetch_data.py + verify CENTCOM/IAEA/UNHCR | Next session |
| B1/B2 — Headlines pagination + sort order | Backlog |
| U8 — Delete main branch | Backlog |
| B12 — Headline click scrolls to top | Backlog |
| B13 — AI summary pre-generation in fetch_data.py | Backlog |
| B11 — Multi-source strategy for every data point | Backlog |
| I9 — Run Supabase migration in SQL Editor | Backlog |

---

*To merge conversation dumps: paste raw text below this line under a `## Conversation Dump — [date]` heading. Claude will extract and merge into the session entries above.*
