-- ============================================================
-- WarIntel Schema Migration 001 — Initial Schema
-- Run in Supabase SQL Editor
-- Run backup.bat FIRST if any data exists
-- ============================================================

-- Shared updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── USERS ────────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  anon_id     text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger users_updated_at before update on users
  for each row execute function update_updated_at();

-- ── BACKLOG ITEMS ─────────────────────────────────────────────
create table if not exists backlog_items (
  id          uuid primary key default gen_random_uuid(),
  item_id     text unique not null,       -- e.g. B1, U3, I9
  category    text not null,              -- bug, ui, feat, infra
  priority    text not null,              -- critical, high, medium, low
  status      text not null default '',   -- '', coded, tested, staged, deployed
  title       text not null,
  detail      text,
  history     text,
  is_done     boolean not null default false,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger backlog_items_updated_at before update on backlog_items
  for each row execute function update_updated_at();

-- ── MESSAGES (community chat) ─────────────────────────────────
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id),
  body        text not null,
  room        text not null default 'community',
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger messages_updated_at before update on messages
  for each row execute function update_updated_at();

-- ── NOTIFICATION SUBSCRIPTIONS ────────────────────────────────
create table if not exists notification_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id),
  channel     text not null,             -- email, push, whatsapp
  address     text not null,             -- email address, phone, push endpoint
  topics      text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger notification_subscriptions_updated_at before update on notification_subscriptions
  for each row execute function update_updated_at();

-- ── PUSH TOKENS ───────────────────────────────────────────────
create table if not exists push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id),
  token       text not null unique,
  platform    text,                       -- web, ios, android
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger push_tokens_updated_at before update on push_tokens
  for each row execute function update_updated_at();
