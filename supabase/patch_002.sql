-- patch_002.sql
-- Remove Supabase Auth dependency from entries.
-- Picks are now identified by email address (honor-system trust model).
-- Run this AFTER patch_001.sql.

-- ─── 1. DROP OLD TABLES (clears beta test data) ──────────────────────────────
drop table if exists public.entry_teams cascade;
drop table if exists public.entries cascade;

-- ─── 2. RECREATE ENTRIES WITH EMAIL AS KEY ───────────────────────────────────
create table public.entries (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  display_name  text not null,
  total_cost    integer not null default 0,
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint entries_email_unique unique (email),
  constraint entries_total_cost_check check (total_cost <= 100)
);

-- ─── 3. RECREATE ENTRY_TEAMS ─────────────────────────────────────────────────
create table public.entry_teams (
  entry_id    uuid not null references public.entries(id) on delete cascade,
  team_id     text not null references public.teams(id) on delete restrict,
  created_at  timestamptz not null default now(),
  primary key (entry_id, team_id)
);

-- ─── 4. UPDATED_AT TRIGGER ───────────────────────────────────────────────────
create trigger set_entries_updated_at
  before update on public.entries
  for each row execute function public.handle_updated_at();

-- ─── 5. RLS — PERMISSIVE (honor-system, no auth required) ────────────────────
alter table public.entries enable row level security;
alter table public.entry_teams enable row level security;

-- Anyone (including unauthenticated) can read all entries
create policy "entries: public read" on public.entries
  for select using (true);

-- Anyone can insert an entry (email uniqueness enforced by constraint)
create policy "entries: public insert" on public.entries
  for insert with check (true);

-- Anyone can update any entry (honor system — client enforces email match)
create policy "entries: public update" on public.entries
  for update using (true);

-- entry_teams
create policy "entry_teams: public read" on public.entry_teams
  for select using (true);

create policy "entry_teams: public insert" on public.entry_teams
  for insert with check (true);

create policy "entry_teams: public delete" on public.entry_teams
  for delete using (true);

-- ─── 6. UPDATE count_entries (still works the same) ──────────────────────────
-- No change needed — count_entries() queries public.entries which is now email-keyed.
