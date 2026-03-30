# WarIntel — Backlog
**Last updated:** 2026-03-30

## 🔺 Next Session Priorities
1. **B3** — Verify article overlay panel still works post-refactor
2. **B1/B2** — Headlines pagination and sort order (core functionality, currently broken)
3. **B5** — Source filter pills out of sync with 14 RSS feeds
4. **I9** — Run Supabase migration SQL (paste `supabase/migrations/001_initial_schema.sql` into Supabase SQL Editor — run `backup.bat` first)
5. **U8** — Delete `main` branch (5 min task, just noise)

---
**Maintained by:** Developer + Claude. Update and commit at the end of every session.
**Truth rule:** Later entries supersede earlier ones. Check this file at the start of every session.
**Working practice:** At the end of every discussion topic, Claude lists what needs adding in point form and confirms before updating.

---

## Pipeline statuses
| Status | Meaning |
|--------|---------|
| **Coded** | Built and in outputs/local. Not yet committed to repo. |
| **Tested** | Committed to `dev` branch. Automated tests passing. |
| **Staged** | Merged to `staging`. Manually verified on staging URL. |
| **Deployed** | Merged to `prod`. Live on warintel.info. |

## Priority levels
| Priority | Meaning |
|----------|---------|
| 🔴 Critical | Breaks core functionality or blocks other work. Fix immediately. |
| 🟠 High | Significant user-facing impact or important tech debt. Next in queue. |
| 🟡 Medium | Meaningful improvement but site works without it. Plan for next session. |
| 🟢 Low | Nice to have. Do when higher priorities are clear. |

---

## Definition of Done

### Coded ✅
- [ ] Code written and working locally, no console errors
- [ ] Follows naming conventions and file structure
- [ ] CSS variables used throughout, no inline styles
- [ ] Files saved to outputs and copied to local repo folder
- [ ] `BACKLOG.md` updated (confirmed with developer)
- [ ] `CONTEXT.md` updated if architecture changed
- [ ] Data persists correctly in localStorage — verified manually as per feature description

### Tested ✅
- [ ] All Coded criteria met
- [ ] Committed to `dev` branch
- [ ] Backend / unit tests passing (pytest)
- [ ] Frontend automation tests passing (Vitest + Playwright)
- [ ] New functionality has corresponding backend tests
- [ ] New functionality has corresponding frontend tests
- [ ] Manually tested in Chrome + Firefox
- [ ] No regressions in existing functionality
- [ ] Data persists correctly after test suite runs — no corruption or data loss

### Staged ✅
- [ ] All Tested criteria met
- [ ] PR from `dev` → `staging` opened and reviewed
- [ ] Merged to `staging`, GitHub Actions workflow deployed
- [ ] Manually verified on staging URL (not localhost)
- [ ] `fetch_data.py` run against staging to confirm data injection
- [ ] `backup.bat` run before any schema/database changes
- [ ] No broken links, missing assets, or layout regressions
- [ ] Data persists correctly on staging URL as per feature description

### Deployed ✅
- [ ] All Staged criteria met
- [ ] PR from `staging` → `main` opened and approved
- [ ] Merged to `main`, GitHub Pages confirmed live
- [ ] Hard refresh confirms new version serving
- [ ] `BACKLOG.md` pipeline tracker updated
- [ ] `CONTEXT.md` updated, both files committed
- [ ] Data persists correctly on production — verified on live URL
- [ ] No environment or deployment issues (console clean, network requests healthy)

---

## 🔴 Bugs / Broken

| # | Priority | Item | Full description | Status | Session history |
|---|----------|------|-----------------|--------|-----------------|
| B1 | 🟠 High | **Pagination not implemented** | The headlines grid uses `applyFilters()` which hides all rows beyond `maxRows` but there is no UI to navigate to hidden rows. No Prev/Next buttons, no "Page X of Y", no way to reach articles beyond the first page. | — | Discussed 2026-03-22. Agreed 2026-03-23. Never built. |
| B2 | 🟠 High | **Sort order not newest-first** | Articles display in cron-injection order, not chronological. Need to sort by `pub_iso` descending before pagination in `applyFilters()`. | — | Raised 2026-03-22. Agreed but never implemented. |
| B3 | 🔴 Critical | **Article panel broken after JS refactor** | Verified working 2026-03-31. Closed. | Deployed | Verified 2026-03-31. |
| B12 | 🟠 High | **Headline click scrolls to top of page** | Clicking a headline opens the overlay correctly but also jumps to the top of the page. Likely a stray `href="#"` or unhandled anchor default. Fix with `e.preventDefault()`. | — | Found 2026-03-31 during B3 verification. |
| B4 | 🟡 Medium | **"Data as of" timestamp is static** | `update-time` element shows hardcoded date. `inject_data()` has regex but may not be firing. | — | Raised 2026-03-22. Not confirmed working on live. |
| B5 | 🟠 High | **Source filter pills out of sync** | RSS_FEEDS expanded 2026-03-24 with 7 new sources. Pill HTML still shows original 7. | — | New sources added to backend 2026-03-24. Frontend not updated. |
| B6 | 🟠 High | **Ticker shows placeholder text** | "⚡ Live updates loading..." displays when articles exist. Ticker injection likely failing silently. | — | Raised 2026-03-22. Intermittently broken. |
| B7 | 🟠 High | **OilPrice API timing out** | oilpriceapi.com returning 504. Oil prices show dash on live site. No fallback. | — | Identified in GitHub Actions workflow logs. |
| B8 | 🟠 High | **Wikipedia scraping returning dash** | Some casualty/strike/nuclear fields returning dash. Selectors likely stale. | — | Known recurring issue. Wikipedia structure changes frequently. |
| B9 | 🟢 Low | **Hengaw + HRANA figures hardcoded** | Both orgs publish running totals. Hardcoded from a specific date. Scraping deferred as fragile. | — | Discussed 2026-03-22. |
| B10 | 🟠 High | **Store source URL + version with every scraped data point** | Every figure scraped from Wikipedia (or any source) must store the exact URL and version/revision ID it was pulled from. Enables audit trail, lets us reproduce exactly what was displayed at any point in time, and surfaces when a source has changed underneath us. | — | Added 2026-03-30. |
| B14 | 🔴 Critical | **Replace Wikipedia with primary sources for all key stats** | Wikipedia is unacceptable as a source for conflict casualty/strike data — any editor can change figures at any time. Replaced with: CENTCOM (strikes, missile waves, drones), IAEA (nuclear status), UNHCR (displaced), Wikipedia retained as last-resort fallback only. Casualties still need a primary source — candidates: OHCHR, IRNA (Iranian MoH), Reuters/AP wire extraction. Coded 2026-03-30. Each scraper needs monitoring as site structures change. | Coded | Added 2026-03-30. |
| B13 | 🟠 High | **AI summary broken — CORS + no API key** | `fetchSummary()` calls `api.anthropic.com` directly from the browser. Fails for two reasons: (1) CORS — browsers block direct Anthropic API calls, (2) no `x-api-key` header in the request. Summary always shows "Summary could not be loaded." Fix: pre-generate summaries in `fetch_data.py` using `ANTHROPIC_API_KEY` GitHub Secret, store in `headlines_cache.json`, inject alongside headlines into HTML. No browser API call, no key exposure, summaries load instantly. | — | Added 2026-03-30. |
| B11 | 🔴 Critical | **Multi-source strategy for every data point** | Wikipedia is a single point of failure for all casualty/strike/nuclear figures. Every data point needs identified alternate sources (ACLED, OHCHR, Reuters, AP, conflict monitors etc.) so if one breaks or goes stale the pipeline falls back automatically. Research + map alternates for each field before building fallback logic. | — | Added 2026-03-30. |

---

## 🟠 UI / Behaviour

| # | Priority | Item | Full description | Status | Session history |
|---|----------|------|-----------------|--------|-----------------|
| U1 | 🟡 Medium | **Key stats card layout — number alignment** | Numbers misalign when labels wrap to different heights. Needs flex column with number anchored below label. | — | Raised 2026-03-23. |
| U2 | 🟠 High | **Day pill — verify not regressed** | Dynamic day pill implemented 2026-03-23. Needs live verification after recent commits. | — | Implemented 2026-03-23. |
| U3 | 🟢 Low | **Sort order indicator in headlines header** | When B2 is fixed, show sort direction indicator in header. Click to toggle. | — | Raised 2026-03-22. Pairs with B2. |
| U4 | 🟢 Low | **Headlines grid column widths** | Current widths cause title truncation at narrower viewports. | — | Adjusted multiple sessions. Never fully settled. |
| U5 | 🟠 High | **Pill separator + ordering — verify live** | Pills join back of active group. HR separator between selected/unselected. Implemented but not verified live. | — | Implemented 2026-03-23. |
| U6 | 🟠 High | **Re-enable cron schedule** | `update.yml` currently manual only. Re-enable once branching strategy (I21) is in place. | — | Disabled deliberately 2026-03-23. |
| U7 | 🟡 Medium | **Verify logo + favicon on mobile** | Radar SVG logo and favicon added 2026-03-28. Header layout not yet verified at mobile breakpoints. May need flex-wrap or size adjustment. | — | Added 2026-03-28. |
| U9 | 🟠 High | **Skeleton loading + stale-while-revalidate UX** | Two-layer loading strategy: (1) Skeleton/loading divs — placeholder shapes shown while panels load, gives instant perceived performance. (2) Stale-while-revalidate — static injection provides last-known data on first load, Supabase Realtime updates values in place silently as fresh data arrives. No spinners, no blank panels. New users see skeletons briefly; returning users see last known data immediately. Pairs with F19 (live headlines architecture). | — | Added 2026-03-30. |
| U11 | 🟠 High | **Web Vitals JS — real-user performance monitoring** | Add web-vitals.js (2KB) to capture Core Web Vitals from real users: LCP, CLS, INP, FCP, TTFB. On each metric fire, POST to Supabase `web_vitals` table: metric name, value, rating (good/needs-improvement/poor), page URL, timestamp. Query Supabase to track performance trends over time, segmented by page, date, rating. Requires new `web_vitals` table in next Supabase migration. Pairs with I35 (Lighthouse CI) for build-time + runtime performance picture. | — | Added 2026-03-30. |
| U10 | 🟠 High | **Global performance budget config** | Single config controlling lazy loading, asset defer, analytics weight, image quality. One file to tighten or loosen performance tradeoffs. Include Web Vitals JS (2KB) for real-user load time capture — feeds into Lighthouse CI (I35). | — | Added 2026-03-30. |
| U8 | 🟡 Medium | **Delete `main` branch** | `main` is now redundant — `prod` is the live branch. Requires confirming GitHub Pages and default branch are fully switched to `prod` first. | — | Added 2026-03-28. |

---

## 💰 Monetisation

| # | Priority | Item | Full description | Status | Session history |
|---|----------|------|-----------------|--------|-----------------|
| M0 | 🔴 Critical | **Research + select ad networks before implementation** | AdSense may decline war/conflict content. Must identify alternatives (Media.net, Ezoic, Carbon Ads, BuySellAds, direct programmatic) and confirm eligibility, CPM rates, and content policies before writing a line of ad code. Decision gates all M1–M4 implementation. | — | Added 2026-03-30. |
| M1 | 🟠 High | **Header + footer banner ads** | Narrow persistent banner slots at top and bottom of every page. Currently placeholder HTML exists. Needs ad network integration (AdSense or programmatic). Sitewide, always visible. | — | Confirmed 2026-03-29. Placeholder slots already in HTML. |
| M2 | 🟠 High | **Article overlay ads** | Ad placement shown inside the article panel when a user opens an article in-dashboard. High-intent placement — user is actively reading. | — | Confirmed 2026-03-29. |
| M3 | 🟠 High | **Article interstitial** | Full-page ad shown between "Open Article" click and redirect to source. Guaranteed full-attention moment, premium CPM. Requires interstitial page with countdown or skip option. | — | Confirmed 2026-03-29. |
| M4 | 🟠 High | **Video interstitial** | Full-page ad shown when user clicks a video card to open the hosting site. Same pattern as M3. Complements F17 inline carousel ads. | — | Confirmed 2026-03-29. Pairs with F17. |
| M5 | 🟡 Medium | **User affiliate links** | Contextually relevant affiliate products surfaced alongside content — financial products, VPNs, gold/oil ETFs, insurance, travel, survival gear. Triggered by conflict topic. Amazon Associates + vertical-specific affiliate networks. | — | Confirmed 2026-03-29. |
| M6 | 🟡 Medium | **Publisher affiliate / referral** | Monetise outbound clicks to news sources and video hosts where affiliate or partner programmes exist. Longer term: direct sponsored content deals with publishers WarIntel already drives traffic to. | — | Confirmed 2026-03-29. F4 partially covers this. |
| M7 | 🟠 High | **Sponsored data panels** | Branded panel sponsorship — e.g. "Oil Prices powered by [Broker]", "War Cost data by [Think Tank]". Native, non-intrusive, high CPM. Financial services, energy companies, defence analysts are natural fits. Direct sales. | — | Added 2026-03-29. |
| M8 | 🟡 Medium | **Email newsletter sponsorship** | Sponsored placement in daily/breaking news digest emails. Single sponsor per send, premium rate. Requires F6 (notification subscriptions) to be built first. | — | Added 2026-03-29. Depends on F6. |
| M9 | 🟡 Medium | **Premium subscription — ad-free + features** | Paid tier removes ads, unlocks extra features (data export, custom alerts, advanced filters). Supabase memberships table already planned (I14). | — | Added 2026-03-29. Depends on I14. |
| M10 | 🟢 Low | **Data API access** | Sell API access to aggregated conflict data for researchers, journalists, analysts, hedge funds. Metered pricing. Only viable once data quality and uptime are consistent. | — | Added 2026-03-29. Long-term. |
| M11 | 🟢 Low | **Push notification sponsorship** | Sponsored breaking news alerts — "BREAKING: [headline] — Brought to you by [Brand]". Premium because it's opt-in, high-intent audience. Depends on F6. | — | Added 2026-03-29. Depends on F6. |
| M12 | 🟠 High | **Subscription tier — widget personalisation** | Save custom panel layout, pinned panels, custom source filters. Persisted server-side per user. Free tier gets default layout only. | — | Added 2026-03-30. |
| M13 | 🟠 High | **Subscription tier — theming** | Dark/light/high contrast modes, custom accent colours. Free tier gets default theme only. | — | Added 2026-03-30. |
| M14 | 🟠 High | **Subscription tier — priority alerts** | Subscriber-only breaking news notifications before the public feed updates. Higher tier feature — justifies premium pricing. | — | Added 2026-03-30. Depends on F6. |
| M15 | 🟠 High | **Self-serve ad placement** | Businesses pay to place contextual ads directly on the platform, cutting out the ad network middleman. Higher CPM, direct relationship, full control over placement. | — | Added 2026-03-30. |
| M16 | 🟠 High | **Early access — new conflict dashboards** | Subscribers see new conflict dashboards before public launch. Exclusivity driver for subscription conversions. | — | Added 2026-03-30. |
| M17 | 🟠 High | **Data export — CSV/JSON download** | Subscribers can download headlines, casualty figures, and historical data as CSV or JSON. Individual subscriber tier + higher-volume API tier (M10). Target audience: journalists, researchers, analysts, hedge funds tracking conflict risk. | — | Added 2026-03-30. |
| M18 | 🟡 Medium | **Custom watchlists + keyword alerts** | Track specific sources, regions, or keywords. Get notified on matches. Subscriber-only feature. | — | Added 2026-03-30. Depends on F6. |
| M19 | 🟡 Medium | **Tiered data refresh rate** | Free tier gets throttled refresh (e.g. hourly). Subscribers get real-time or near-real-time updates. Creates tangible value difference between tiers. | — | Added 2026-03-30. |

---

## 🔵 Features — Agreed

| # | Priority | Item | Full description | Status | Session history |
|---|----------|------|-----------------|--------|-----------------|
| F19 | 🔴 Critical | **Live headlines architecture — Supabase-driven feed** | Headlines must be real-time, not 30-min cron delayed. Architecture: (1) `fetch_data.py` runs continuously or on short interval, inserts new headlines into Supabase `headlines` table as they arrive, (2) AI summary generated server-side at insert time using `ANTHROPIC_API_KEY` GitHub Secret, stored against the headline row, (3) frontend subscribes to Supabase Realtime on the headlines table — new rows push to the browser instantly without page reload, (4) static HTML injection replaced by JS query on page load + Realtime subscription for updates. Static injection (`fetch_data.py` → `index.html`) becomes "latest snapshot" fallback only. Cron interval reduced to 5 min or event-driven. Gates: B13 (AI summary fix), F15 (live feed). | — | Added 2026-03-30. Prerequisite for B13, F15. |
| F18 | 🟠 High | **Global date range filter** | Single date range selector that filters all panels simultaneously — headlines, casualties, strikes, oil prices, all data. When active, every panel queries Supabase by date range rather than showing latest-only. Requires I37 (time-series schema) and full DB-driven data pipeline before it can be built. Static injection becomes "latest snapshot" only — historical views served entirely from DB. | — | Added 2026-03-30. Prerequisite: I37. |
| F17 | 🟠 High | **Video source carousel** | Horizontal auto-scrolling strip of live/recent video thumbnails from major news networks (CNN, BBC, Al Jazeera, Sky News, France 24, CGTN). Pauses on hover. Click opens source site or expands inline embed. Every N-th card is a paid ad slot — contextual, native-looking, non-intrusive. Two revenue streams: (1) affiliate/referral clicks to network sites, (2) display ad slots in carousel. Technical approach: YouTube Data API for networks that publish clips/streams publicly, direct embeds where permitted (Al Jazeera, France 24), thumbnail+link fallback for others. Separate panel from Articles and Live Feed — its own horizontal row in the dashboard layout. | — | Raised 2026-03-27. Two revenue streams identified: affiliate clicks + ad slots. YouTube Data API recommended as primary source — clean, legal, free. |
| F15 | 🟠 High | **Never-ending live news feed** | Unified infinite-scroll feed pulling from all available sources: RSS feeds, Telegram public channels (proper API, no ToS issues), scraped live blogs (BBC, Sky, Al Jazeera), social media where accessible. Auto-refreshes without page reload. New items slide in at top with a "X new items" notification bar. Filterable by source type. Telegram is the priority integration — many Iran/Middle East war channels are public and have a proper API. WhatsApp channels deferred until Meta opens a read API. | — | Raised 2026-03-27. WhatsApp channel explored but content not publicly accessible via web — ToS issues with scraping. Telegram recommended as technically clean alternative. |
| F16 | 🟡 Medium | **Telegram channel integration** | Subscribe to public Telegram channels (e.g. Iran war, Middle East news) via Telegram Bot API or MTProto. Pull messages into the unified feed (F15). Channels are public, API is clean, no ToS issues. Much more accessible than WhatsApp. | — | Raised 2026-03-27. Recommended over WhatsApp for initial social/messaging integration. |
| F1 | 🟡 Medium | **Social & video content** | YouTube, Reddit, Twitter/X, TikTok, Instagram Reels alongside RSS. Tabs or mixed feed. | — | Discussed 2026-03-23. |
| F2 | 🟡 Medium | **Live blog scraping** | Sky News, BBC, Al Jazeera live war blogs — timestamped entries, more granular than articles. | — | Identified 2026-03-24. |
| F3 | 🟡 Medium | **AI-powered content pipeline** | Auto-discover, score, caption, auto-post to WarIntel socials with backlinks. Claude API curation layer. | — | Discussed 2026-03-23. |
| F4 | 🟡 Medium | **Related sites / content slider** | Horizontal scrollable strip of curated external links. Affiliate/referral revenue potential. | — | Raised 2026-03-22. |
| F5 | 🟡 Medium | **Share controls** | Per-panel and per-headline Web Share API with copy-link fallback. | — | Raised 2026-03-23. |
| F6 | 🟡 Medium | **Notification subscriptions** | Email, browser push, WhatsApp (Twilio). Subscribe by panel/topic/source. Supabase table already designed. | — | Raised 2026-03-23. |
| F7 | 🟡 Medium | **Community chat panel** | Supabase Realtime on messages table. Anonymous posting. Moderation before public launch. | — | Raised 2026-03-23. |
| F8 | 🟡 Medium | **Twitter/X panel** | Curated hashtags + verified accounts. AI layer scores the stream. | — | Raised 2026-03-23. |
| F9 | 🟡 Medium | **Expanded data panels** | Markets, shipping & logistics, real-world impact panels. | — | Raised 2026-03-23. |
| F10 | 🟢 Low | **"See all data sources" link** | Replace static footer strip with link to #legal-sources section. | — | Raised 2026-03-23. |
| F11 | 🟡 Medium | **Site analytics** | Page views, user paths, hotspots, conversion events. GA4 or Plausible. | — | Raised 2026-03-22. |
| F12 | 🟢 Low | **Feedback form** | Simple modal for feedback, data corrections, source suggestions. Supabase-backed. | — | Raised 2026-03-22. |
| F13 | 🟢 Low | **Coalition casualties from Wikipedia** | Auto-update US/Israel/Iraq/Bahrain figures from Wikipedia infobox. | — | Identified 2026-03-24. |
| F14 | 🟢 Low | **Glossary — ongoing curation** | 24 terms currently. Collapsed by default, alphabetical, above footer. | Deployed | Implemented 2026-03-22. |

---

## 🟢 Infrastructure / Dev

| # | Priority | Item | Full description | Status | Session history |
|---|----------|------|-----------------|--------|-----------------|
| I1 | 🔴 Critical | **Commit test suite and enable CI** | CI workflow live (`.github/workflows/tests.yml`) with stub tests. Stubs pass — real pytest/Vitest/Playwright to replace later. | Tested | CI live 2026-03-30. Stub tests passing. |
| I2 | 🔴 Critical | **Implement branching strategy** | `dev` → `staging` → `prod`. CI gates dev→staging. Branch protection on `staging` requires Tests workflow to pass. | Tested | Branches created 2026-03-28. CI + branch protection wired 2026-03-30. |
| I4 | 🟡 Medium | **Local dev with real data** | Gitignored `.env` with API keys so `fetch_data.py` runs locally. `mock_data.py` is current workaround. | — | Raised multiple sessions. |
| I5 | 🟢 Low | **Node.js 24 upgrade** | GitHub Actions warning: Node 20 deprecation June 2026. | — | Identified in workflow logs. |
| I6 | 🟢 Low | **CSS further cleanup** | Post-audit `!important` remains in grid layout. Ongoing maintenance. | — | Audit done 2026-03-23. |
| I7 | 🔴 Critical | **Commit CONTEXT.md + BACKLOG.md** | Both committed to repo. | Deployed | Committed 2026-03-28. |
| I8 | 🟠 High | **Set up Claude Code CLI** | `npm install -g @anthropic-ai/claude-code`. Eliminates upload/download cycle. | Deployed | Live and in use from 2026-03-28. |
| I9 | 🔴 Critical | **Run Supabase schema migration** | `supabase/migrations/001_initial_schema.sql` run successfully. 5 tables live: users, backlog_items, messages, notification_subscriptions, push_tokens. | Deployed | Run 2026-03-31. |
| I10 | 🟠 High | **Supabase rollback strategy** | `supabase/migrations/001_rollback.sql` committed. | Coded | Committed 2026-03-30. |
| I11 | 🟠 High | **`supabase_backup.py`** | backup / write-local / restore commands. Exports versioned JSON. | Coded | Committed 2026-03-28. |
| I12 | 🟠 High | **`backup.bat`** | Pre-migration safety script. Always run before schema changes. | Coded | Committed 2026-03-30. |
| I13 | 🟠 High | **`supabase-client.js`** | Shared Supabase client module. Single import for all features. | Coded | Committed 2026-03-28. |
| I14 | 🟢 Low | **Future: paid membership/plans table** | Memberships for paid tiers. Do not build until revenue model confirmed. | — | Agreed 2026-03-25. |
| I15 | 🟠 High | **Environment config files** | Same pattern as WorkScrumList — 4 env configs, `build.bat` swaps active config. | — | Agreed 2026-03-25. |
| I16 | 🟠 High | **Timestamps on all persisted records** | `created_at`/`updated_at` on every record. Collapsible column in UI. | — | Agreed 2026-03-26. |
| I17 | 🔴 Critical | **JS file separation** | One file per feature, named after the feature. Current 8 files need audit. | — | Agreed 2026-03-26. |
| I18 | 🟠 High | **White-label config architecture** | Extract all WarIntel-specific content to `warintel.config.js`. Codebase becomes domain-agnostic. | — | Agreed 2026-03-26. |
| I19 | 🟡 Medium | **White-label theming layer** | `theme.css` client-overridable layer on top of base styles. | — | Agreed 2026-03-26. |
| I20 | 🟡 Medium | **Data source config abstraction** | RSS_FEEDS, API endpoints, Wikipedia selectors moved to `sources.config.json`. | — | Agreed 2026-03-26. |
| I21 | 🔴 Critical | **Branching strategy** | `dev` → `staging` → `prod`. CI gates dev→staging. Branch protection wired. | Tested | Branches 2026-03-28. CI + protection 2026-03-30. |
| I22 | 🟠 High | **Prod smoke test suite** | Lightweight post-deployment tests. Runs automatically after staging→main merge. | — | Agreed 2026-03-26. |
| I23 | 🟠 High | **Test data tagging and cleanup** | `is_test: true` tag on all test data. Cleanup script post-run. | — | Agreed 2026-03-26. |
| I24 | 🟠 High | **Pre-deployment restore point** | Versioned restore point before every prod deployment. Auto-rollback if smoke tests fail. | — | Agreed 2026-03-26. |
| I25 | 🟡 Medium | **Automated rollback on smoke test failure** | Auto-revert git + restore Supabase if prod smoke tests fail. | — | Agreed 2026-03-26. |
| I26 | 🟠 High | **`rollback.bat`** | One-click rollback — reads latest backup, runs paired rollback SQL, restores data. | — | Agreed 2026-03-26. |
| I27 | 🔴 Critical | **Migrate primary workflow to Claude Code** | Claude Code (v2.1.86) is now installed and active. All coding, file changes, commits and pushes should be done via CC going forward. claude.ai used for planning, architecture decisions, and session summaries only. This is the #1 tech debt priority. | Deployed | 2026-03-28. |
| I28 | 🟠 High | **_Tools repo version control** | _Tools git repo created at github.com/Savatar1001/_Tools. Contains Deploy.bat, push-warintel-dev.bat, push-warintel-staging.bat, push-warintel-prod.bat, push-workscrumlist.bat, push-tools.bat, SETUP.bat. Source of truth for all deployment batch files. Deploy.bat self-copies to Projects/ on run. | Deployed | 2026-03-28. |
| I31 | 🔴 Critical | **Write acceptance criteria for every backlog item** | No item moves to Tested without documented AC. AC defines exactly what "done" means — inputs, outputs, edge cases, expected behaviour. Must be written before test cases. Gates I32–I35. | — | Added 2026-03-30. |
| I32 | 🔴 Critical | **Write test cases from AC** | Formal test cases derived from AC for every item — each case has: precondition, steps, expected result, pass/fail. Covers happy path, edge cases, failure modes. Used by both manual testers and automation. | — | Added 2026-03-30. Depends on I31. |
| I33 | 🔴 Critical | **Real pytest suite — replace CI stubs** | Replace stub tests in `tests.yml` with real pytest suite covering: data pipeline logic, scraper output validation, injection anchors, fallback behaviour, API timeout handling. Derived from test cases in I32. | — | Added 2026-03-30. Depends on I32. |
| I34 | 🔴 Critical | **Real E2E suite (Playwright) — replace CI stubs** | Full browser automation: panel loads, filter pills, pagination, article overlay, ticker, war cost clock, responsive layout. Every user-facing feature has a corresponding E2E test. No release without full suite passing. | — | Added 2026-03-30. Depends on I32. |
| I35 | 🟠 High | **Performance testing** | Lighthouse CI on every prod deploy — performance, accessibility, SEO scores. Define pass thresholds (e.g. performance ≥ 85). Block deployment if thresholds not met. Separate load test for the data pipeline under concurrent fetches. | — | Added 2026-03-30. |
| I37 | 🔴 Critical | **Time-series schema for all data points** | Every data point — casualties, strikes, nuclear figures, oil prices, exchange rates — must be stored as a time-series row in Supabase with a timestamp, not just overwritten as a latest value. `fetch_data.py` inserts a new row on every run rather than updating in place. This is the prerequisite for F18 (global date range filter) and any historical view. Design the schema before the next Supabase migration. Current `001_initial_schema.sql` only covers headlines and user data — extend with time-series tables for all scraped data points. | — | Added 2026-03-30. Gates F18. |
| I36 | 🟠 High | **Manual testing checklist — pre-release gate** | Formal manual test run required before every staging→prod promotion. Checklist covers: Chrome + Firefox, mobile breakpoints, all panels, data freshness, no console errors. Signed off by name before merge is allowed. | — | Added 2026-03-30. |
| I29 | 🟡 Medium | **Claude Desktop MCP** | Attempted 2026-03-29. Node.js installed. Config written to `%APPDATA%\Claude\claude_desktop_config.json`. Hammer not appearing — root cause unresolved. Park and revisit. Claude Code MCP fully working as primary. | — | Attempted 2026-03-29. |
| I30 | 🟢 Low | **Migrate historical data into data stores** | All completed pipeline items exist only in BACKLOG.md. Create closed GitHub Issues for completed work and seed Supabase with historical backlog data — for audit trail completeness. | — | Added 2026-03-30. |

---

## Pipeline tracker

| Item | Coded | Tested | Staged | Deployed |
|------|-------|--------|--------|----------|
| Live site + GitHub Pages | ✅ | ✅ | ✅ | ✅ |
| `headlines_cache.json` | ✅ | ✅ | ✅ | ✅ |
| `update.yml` corrected | ✅ | ✅ | ✅ | ✅ |
| Stable injection anchors | ✅ | ✅ | ✅ | ✅ |
| Full cache injected | ✅ | ✅ | ✅ | ✅ |
| Exchange rate fetch | ✅ | ✅ | ✅ | ✅ |
| Glossary | ✅ | ✅ | ✅ | ✅ |
| War cost clock + currency converter | ✅ | ✅ | ✅ | ✅ |
| Article panel overlay | ✅ | ✅ | ✅ | ✅ |
| Row tints per source | ✅ | ✅ | ✅ | ✅ |
| Key stats panel responsive font sizing | ✅ | ✅ | ✅ | ✅ |
| Ticker | ✅ | ✅ | ✅ | ✅ |
| `push.bat` | ✅ | ✅ | ✅ | ✅ |
| CSS extracted to `styles.css` | ✅ | ✅ | ✅ | ✅ |
| CSS audit and cleanup (334 lines removed) | ✅ | ✅ | ✅ | ✅ |
| Cache bust | ✅ | ✅ | ✅ | ✅ |
| JS refactored into `js/` folder (8 files) | ✅ | ✅ | ✅ | ✅ |
| Panel pill drag fix | ✅ | ✅ | ✅ | ✅ |
| Expand panel scrolls into view | ✅ | ✅ | ✅ | ✅ |
| Source filter pills — multi-select | ✅ | ✅ | ✅ | ✅ |
| Date range filter | ✅ | ✅ | ✅ | ✅ |
| Rows-per-page dropdown | ✅ | ✅ | ✅ | ✅ |
| Controls bar repositioned | ✅ | ✅ | ✅ | ✅ |
| Dynamic day pill | ✅ | ✅ | ✅ | ✅ |
| Local time in header | ✅ | ✅ | ✅ | ✅ |
| Tag cloud external link fix | ✅ | ✅ | ✅ | ✅ |
| RSS sources expanded to 14 | ✅ | ✅ | ✅ | ✅ |
| `mock_data.py` | ✅ | — | — | — |
| Test suite (pytest + Vitest + Playwright) | ✅ | — | — | — |
| `CONTEXT.md` | ✅ | — | — | — |
| `BACKLOG.md` | ✅ | — | — | — |
| `backlog.html` | ✅ | — | — | — |
| Supabase schema + migration SQL | ✅ | — | — | — |
| `supabase_backup.py` + `backup.bat` | ✅ | — | — | — |
| `supabase-client.js` | ✅ | — | — | — |
| Branching strategy (`dev`/`staging`/`prod`) | ✅ | — | — | — |
| `push-warintel-dev.bat` | ✅ | — | — | — |
| `push-warintel-staging.bat` | ✅ | — | — | — |
| `push-warintel-prod.bat` | ✅ | — | — | — |
| `CNAME` | ✅ | — | — | ✅ |
| Radar SVG logo + Armalite font | ✅ | — | — | — |
| `favicon.ico` | ✅ | — | — | — |
| Site title + meta description updated | ✅ | — | — | — |
