#!/usr/bin/env python3
"""
WarIntel — Supabase Backup Script
Exports all Supabase tables to JSON files in supabase/backups/
Run before any schema migration or destructive operation.

Usage:
    python supabase_backup.py                    # backup all tables
    python supabase_backup.py --table backlog_items  # backup one table
    python supabase_backup.py --restore latest   # restore from latest backup

Backups are committed to the repo so they're version-controlled and
recoverable even if Supabase is wiped.
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

# ── CONFIG ────────────────────────────────────────────────────
SUPABASE_URL     = 'https://ftrnujvgzsbbilngwmps.supabase.co'
SUPABASE_ANON    = 'sb_publishable_67jHG2gtSvaPasM8Qjwy3A_SCg6v7a7'

# Tables to back up, in dependency order (parents before children)
TABLES = [
    'users',
    'backlog_items',
    'messages',
    'notification_subscriptions',
    'push_tokens',
]

BACKUP_DIR = Path(__file__).parent / 'supabase' / 'backups'


# ── HELPERS ───────────────────────────────────────────────────

def supabase_get(table, select='*', page_size=1000):
    """Fetch all rows from a Supabase table via REST API with pagination."""
    rows = []
    offset = 0
    headers = {
        'apikey':        SUPABASE_ANON,
        'Authorization': f'Bearer {SUPABASE_ANON}',
        'Accept':        'application/json',
        'Prefer':        'count=exact',
    }
    while True:
        params = urllib.parse.urlencode({
            'select': select,
            'limit':  page_size,
            'offset': offset,
        })
        url = f'{SUPABASE_URL}/rest/v1/{table}?{params}'
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read().decode())
                rows.extend(data)
                if len(data) < page_size:
                    break
                offset += page_size
        except Exception as e:
            print(f'  [WARN] Failed to fetch {table} (offset {offset}): {e}')
            break
    return rows


def supabase_upsert(table, rows):
    """Upsert rows into a Supabase table via REST API."""
    if not rows:
        return
    headers = {
        'apikey':        SUPABASE_ANON,
        'Authorization': f'Bearer {SUPABASE_ANON}',
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates',
    }
    url = f'{SUPABASE_URL}/rest/v1/{table}'
    body = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'  [ERROR] Upsert {table} failed: {e.code} {body[:200]}')
        return e.code


# ── BACKUP ────────────────────────────────────────────────────

def backup(tables=None):
    tables = tables or TABLES
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_path = BACKUP_DIR / timestamp
    backup_path.mkdir(parents=True, exist_ok=True)

    manifest = {
        'created_at': datetime.now(timezone.utc).isoformat(),
        'tables':     {},
    }

    print(f'\nWarIntel Supabase Backup — {timestamp}')
    print('=' * 50)

    for table in tables:
        print(f'  Backing up {table}...', end=' ', flush=True)
        rows = supabase_get(table)
        out_file = backup_path / f'{table}.json'
        out_file.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding='utf-8')
        manifest['tables'][table] = {'rows': len(rows), 'file': f'{table}.json'}
        print(f'{len(rows)} rows → {out_file.relative_to(Path.cwd())}')

    # Write manifest
    manifest_file = backup_path / 'manifest.json'
    manifest_file.write_text(json.dumps(manifest, indent=2), encoding='utf-8')

    # Update 'latest' symlink-equivalent (a plain file pointing to timestamp)
    latest_file = BACKUP_DIR / 'latest.txt'
    latest_file.write_text(timestamp, encoding='utf-8')

    print(f'\n✓ Backup complete: supabase/backups/{timestamp}/')
    print(f'  Total tables: {len(tables)}')
    print(f'  Total rows:   {sum(v["rows"] for v in manifest["tables"].values())}')
    print(f'\nCommit this backup before running any migration:')
    print(f'  git add supabase/backups/{timestamp}/')
    print(f'  git commit -m "backup: pre-migration snapshot {timestamp}"')

    return timestamp


# ── RESTORE ───────────────────────────────────────────────────

def restore(timestamp='latest', tables=None):
    if timestamp == 'latest':
        latest_file = BACKUP_DIR / 'latest.txt'
        if not latest_file.exists():
            print('[ERROR] No backups found. Run backup first.')
            sys.exit(1)
        timestamp = latest_file.read_text().strip()

    backup_path = BACKUP_DIR / timestamp
    if not backup_path.exists():
        print(f'[ERROR] Backup not found: {backup_path}')
        sys.exit(1)

    manifest_file = backup_path / 'manifest.json'
    manifest = json.loads(manifest_file.read_text()) if manifest_file.exists() else {}
    tables_to_restore = tables or list(manifest.get('tables', {}).keys()) or TABLES

    print(f'\nWarIntel Supabase Restore — from {timestamp}')
    print('=' * 50)
    print('[WARN] This will upsert all backed-up rows into the current database.')
    confirm = input('Type YES to continue: ').strip()
    if confirm != 'YES':
        print('Aborted.')
        sys.exit(0)

    for table in tables_to_restore:
        file_path = backup_path / f'{table}.json'
        if not file_path.exists():
            print(f'  [SKIP] {table} — no backup file found')
            continue
        rows = json.loads(file_path.read_text())
        if not rows:
            print(f'  [SKIP] {table} — 0 rows')
            continue
        print(f'  Restoring {table} ({len(rows)} rows)...', end=' ', flush=True)
        status = supabase_upsert(table, rows)
        print(f'done (HTTP {status})')

    print('\n✓ Restore complete.')


# ── WRITE BACK TO LOCAL FILES ─────────────────────────────────
# After a rollback, re-populate local data files from the latest backup
# so the site and backlog.html work immediately from localStorage/static data.

def write_local_files(timestamp='latest'):
    """
    Write backup data back into local files the site already uses:
    - backlog_items → supabase/backups/<ts>/backlog_items.json (already done)
    - backlog_items → readable export for backlog.html localStorage seed
    - messages → supabase/backups/<ts>/messages.json
    Future: headlines → headlines_cache.json (if we ever move that to Supabase)
    """
    if timestamp == 'latest':
        latest_file = BACKUP_DIR / 'latest.txt'
        if not latest_file.exists():
            print('[ERROR] No backups found.')
            return
        timestamp = latest_file.read_text().strip()

    backup_path = BACKUP_DIR / timestamp
    project_root = Path(__file__).parent

    print(f'\nWriting local files from backup {timestamp}...')

    # backlog_items → js-compatible seed file
    bl_file = backup_path / 'backlog_items.json'
    if bl_file.exists():
        rows = json.loads(bl_file.read_text())
        # Convert DB shape → JS shape (same as backlog.html does at runtime)
        js_items = [
            {
                'id':      r['item_id'],
                'cat':     r['category'],
                'title':   r['title'],
                'detail':  r.get('detail', ''),
                'history': r.get('history', ''),
                'done':    r.get('is_done', False),
            }
            for r in rows if not r.get('deleted_at')
        ]
        seed_file = project_root / 'supabase' / 'backups' / 'backlog_seed.json'
        seed_file.write_text(json.dumps(js_items, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f'  ✓ backlog_seed.json ({len(js_items)} items) → supabase/backups/backlog_seed.json')
        print(f'    backlog.html will auto-load this as localStorage seed on rollback')

    # messages (community chat)
    msg_file = backup_path / 'messages.json'
    if msg_file.exists():
        rows = json.loads(msg_file.read_text())
        print(f'  ✓ messages.json ({len(rows)} rows) — retained in backup folder')

    print('\n✓ Local files written.')
    print('  After git revert + push, backlog.html will fall back to localStorage')
    print('  and seed from backlog_seed.json on first load.')


# ── CLI ───────────────────────────────────────────────────────

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='WarIntel Supabase backup/restore')
    parser.add_argument('action', nargs='?', default='backup',
                        choices=['backup', 'restore', 'write-local'],
                        help='Action to perform (default: backup)')
    parser.add_argument('--table', nargs='+', help='Specific table(s) to backup/restore')
    parser.add_argument('--from',  dest='from_ts', default='latest',
                        help='Backup timestamp to restore from (default: latest)')
    args = parser.parse_args()

    if args.action == 'backup':
        backup(args.table)
    elif args.action == 'restore':
        restore(args.from_ts, args.table)
    elif args.action == 'write-local':
        write_local_files(args.from_ts)
