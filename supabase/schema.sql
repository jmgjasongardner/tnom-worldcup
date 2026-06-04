-- ============================================================
-- Technomics 2026 World Cup Challenge — Full Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─── Helper: auto-update updated_at ─────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── PROFILES ────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── TEAMS ───────────────────────────────────────────────────
create table public.teams (
  id               text primary key,
  country          text not null unique,
  group_letter     text not null,
  cost             integer not null,
  tier             text not null,
  key_player       text,
  player_position  text,
  player_club      text,
  flag_emoji       text,
  flag_url         text,
  fifa_rank        integer,
  group_win_odds   text,
  title_odds       text,
  why_pick         text,
  pool_angle       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger teams_updated_at before update on public.teams
  for each row execute procedure public.handle_updated_at();

-- ─── APP SETTINGS (singleton) ────────────────────────────────
create table public.app_settings (
  id                    boolean primary key default true,
  bracket_lock_at       timestamptz,
  picks_locked          boolean not null default false,
  last_score_update_at  timestamptz,
  updated_at            timestamptz not null default now(),
  constraint app_settings_singleton check (id = true)
);

insert into public.app_settings (id) values (true);

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute procedure public.handle_updated_at();

-- ─── ENTRIES ─────────────────────────────────────────────────
create table public.entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  display_name  text not null,
  total_cost    integer not null default 0,
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint entries_user_unique unique (user_id),
  constraint entries_total_cost_check check (total_cost <= 100)
);

create trigger entries_updated_at before update on public.entries
  for each row execute procedure public.handle_updated_at();

-- ─── ENTRY TEAMS ─────────────────────────────────────────────
create table public.entry_teams (
  entry_id    uuid not null references public.entries(id) on delete cascade,
  team_id     text not null references public.teams(id) on delete restrict,
  created_at  timestamptz not null default now(),
  primary key (entry_id, team_id)
);

-- ─── MATCHES ─────────────────────────────────────────────────
create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  stage          text not null,
  group_letter   text,
  home_team_id   text references public.teams(id),
  away_team_id   text references public.teams(id),
  home_score     integer,
  away_score     integer,
  status         text not null default 'scheduled',
  played_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger matches_updated_at before update on public.matches
  for each row execute procedure public.handle_updated_at();

-- ─── TEAM STATUS ─────────────────────────────────────────────
create table public.team_status (
  team_id               text primary key references public.teams(id) on delete cascade,
  group_match_points    integer not null default 0,
  group_finish_bonus    integer not null default 0,
  knockout_points       integer not null default 0,
  total_points          integer generated always as (group_match_points + group_finish_bonus + knockout_points) stored,
  max_possible_points   integer not null default 50,
  is_alive              boolean not null default true,
  current_stage         text not null default 'group',
  group_finish          integer,
  advanced_from_group   boolean,
  latest_result         text,
  next_match            text,
  updated_at            timestamptz not null default now()
);

create trigger team_status_updated_at before update on public.team_status
  for each row execute procedure public.handle_updated_at();

-- ─── SCORING EVENTS ──────────────────────────────────────────
create table public.scoring_events (
  id          uuid primary key default gen_random_uuid(),
  team_id     text not null references public.teams(id) on delete cascade,
  match_id    uuid references public.matches(id) on delete set null,
  event_type  text not null,
  stage       text not null,
  points      integer not null,
  label       text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

create or replace function public.picks_are_locked()
returns boolean as $$
  select coalesce(
    (select picks_locked from public.app_settings where id = true),
    false
  );
$$ language sql security definer stable;

create or replace function public.owns_entry(entry_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.entries e
    where e.id = entry_id and e.user_id = auth.uid()
  );
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.teams         enable row level security;
alter table public.app_settings  enable row level security;
alter table public.entries       enable row level security;
alter table public.entry_teams   enable row level security;
alter table public.matches       enable row level security;
alter table public.team_status   enable row level security;
alter table public.scoring_events enable row level security;

-- ── profiles ─────────────────────────────────────────────────
create policy "profiles: own or admin read"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── teams (read-only for all authenticated) ───────────────────
create policy "teams: authenticated read"
  on public.teams for select
  using (auth.uid() is not null);

create policy "teams: admin write"
  on public.teams for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── app_settings ─────────────────────────────────────────────
create policy "app_settings: authenticated read"
  on public.app_settings for select
  using (auth.uid() is not null);

create policy "app_settings: admin update"
  on public.app_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── entries ──────────────────────────────────────────────────
create policy "entries: select own or after lock"
  on public.entries for select
  using (
    auth.uid() is not null and (
      user_id = auth.uid() or
      public.picks_are_locked() or
      public.is_admin()
    )
  );

create policy "entries: insert own before lock"
  on public.entries for insert
  with check (
    auth.uid() = user_id and
    not public.picks_are_locked()
  );

create policy "entries: update own before lock"
  on public.entries for update
  using (
    user_id = auth.uid() and not public.picks_are_locked()
  )
  with check (
    user_id = auth.uid() and not public.picks_are_locked()
  );

create policy "entries: admin all"
  on public.entries for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── entry_teams ───────────────────────────────────────────────
create policy "entry_teams: select own or after lock"
  on public.entry_teams for select
  using (
    auth.uid() is not null and (
      public.picks_are_locked() or
      public.is_admin() or
      exists (
        select 1 from public.entries e
        where e.id = entry_id and e.user_id = auth.uid()
      )
    )
  );

create policy "entry_teams: insert own before lock"
  on public.entry_teams for insert
  with check (
    not public.picks_are_locked() and
    exists (
      select 1 from public.entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "entry_teams: delete own before lock"
  on public.entry_teams for delete
  using (
    not public.picks_are_locked() and
    exists (
      select 1 from public.entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "entry_teams: admin all"
  on public.entry_teams for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── matches / team_status / scoring_events ────────────────────
create policy "matches: authenticated read"
  on public.matches for select using (auth.uid() is not null);
create policy "matches: admin write"
  on public.matches for all
  using (public.is_admin()) with check (public.is_admin());

create policy "team_status: authenticated read"
  on public.team_status for select using (auth.uid() is not null);
create policy "team_status: admin write"
  on public.team_status for all
  using (public.is_admin()) with check (public.is_admin());

create policy "scoring_events: authenticated read"
  on public.scoring_events for select using (auth.uid() is not null);
create policy "scoring_events: admin write"
  on public.scoring_events for all
  using (public.is_admin()) with check (public.is_admin());
