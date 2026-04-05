# CLAUDE_OPS.md — Claude Code Operational Instructions

Claude Code specific. Not relevant to ChatGPT or Claude.ai planning sessions.

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

## Document Ownership

See `CONTEXT.md` — Document Ownership section.

**Working practice:** At the end of every discussion topic, Claude lists what needs adding in point form and confirms before updating BACKLOG.md.
