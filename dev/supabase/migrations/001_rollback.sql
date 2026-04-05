-- ============================================================
-- WarIntel Rollback 001 — Undoes 001_initial_schema.sql
-- Run in Supabase SQL Editor
-- ============================================================

drop trigger if exists push_tokens_updated_at              on push_tokens;
drop trigger if exists notification_subscriptions_updated_at on notification_subscriptions;
drop trigger if exists messages_updated_at                 on messages;
drop trigger if exists backlog_items_updated_at            on backlog_items;
drop trigger if exists users_updated_at                    on users;
drop function if exists update_updated_at();

drop table if exists push_tokens                  cascade;
drop table if exists notification_subscriptions   cascade;
drop table if exists messages                     cascade;
drop table if exists backlog_items                cascade;
drop table if exists users                        cascade;
