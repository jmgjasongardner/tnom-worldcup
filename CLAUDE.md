# CLAUDE.md

## Project Overview

Build a production-quality lightweight web app for an internal office pool called **Technomics 2026 World Cup Challenge**.

This is a World Cup portfolio game. Users sign in with their Technomics email, pick exactly **6 teams** under a fictional **$100 budget**, submit their portfolio, edit their own picks before bracket lock, and track scoring throughout the tournament.

The app should feel like a polished fantasy sports / World Cup dashboard, but it must remain simple, free-friendly, and realistic to deploy.

Primary goals:

1. Let users sign in with a Technomics email.
2. Let users build and submit a valid 6-team portfolio under $100.
3. Let users edit only their own portfolio before bracket lock.
4. Lock all picks after opening kickoff.
5. Show team costs, team information, and scoring rules clearly.
6. Show live or manually updated leaderboard standings.
7. Show individual participant portfolios after bracket lock.
8. Provide an admin page for manual score/result updates.
9. Keep the app deployable for free or near-free.

Preferred stack:

* Frontend: **Vite + React + TypeScript**
* Styling: **plain CSS / CSS modules**, using reusable design tokens
* Routing: **React Router**
* Database/auth: **Supabase**
* Hosting: **Netlify Free** or **Cloudflare Pages**
* Charts: Use CSS-based bars first; avoid adding chart libraries unless truly needed
* Deployment target: static SPA with Supabase client access

Do not build this as a Shiny app. Do not use a heavyweight full-stack framework unless specifically requested later.

---

## Development Philosophy

Build this in small, working increments.

Prioritize:

1. Correct game logic
2. Secure user ownership of portfolios
3. Clean, maintainable code
4. Polished but simple UI
5. Easy deployment
6. Clear data model

Avoid:

* Overengineering
* Unnecessary backend services
* Overly complex animation
* Complex live data APIs before the core app works
* Exposing private Supabase service keys in frontend code
* Allowing users to view/copy everyone’s picks before lock

Important competitive rule:

> Before bracket lock, users should only be able to view and edit their own portfolio. Public leaderboard and participant portfolio detail pages should either be hidden, anonymized, or limited until picks lock. After lock, everyone can view leaderboard and participant portfolios.

---

## Game Rules

### Portfolio Rules

* Each participant picks exactly **6 teams**.
* Each team has a fictional cost.
* Total portfolio cost must be **$100 or less**.
* Users submit using a Technomics email.
* Users may edit their own portfolio until bracket lock.
* Bracket lock occurs at kickoff of the opening match.
* After lock, portfolios are read-only.
* Highest total score wins.

### Scoring Rules

Group-stage match points:

| Event            | Points |
| ---------------- | -----: |
| Group-stage win  |      3 |
| Group-stage draw |      1 |
| Group-stage loss |      0 |

Group finish bonuses:

| Event                          | Points |
| ------------------------------ | -----: |
| Win group                      |     +4 |
| Finish 2nd in group            |     +2 |
| Finish 3rd and advance         |     +1 |
| Finish 3rd and fail to advance |      0 |
| Finish 4th                     |      0 |

Knockout win points:

| Event                     | Points |
| ------------------------- | -----: |
| Win Round of 32           |     +3 |
| Win Round of 16           |     +5 |
| Win Quarterfinal          |     +7 |
| Win Semifinal             |    +10 |
| Win Final / Win World Cup |    +14 |

Example champion run:

* Two group wins + one draw = 7 points
* Group winner bonus = 4 points
* Knockout wins = 3 + 5 + 7 + 10 + 14 = 39 points
* Total = 50 points

---

## Current Team Pricing

Use this exact 48-team pricing list unless instructed otherwise.

Create a seed file such as `src/data/teams.ts` and a Supabase seed file containing these teams.

| Country                | Group | Cost | Tier            | Key Player             |
| ---------------------- | ----- | ---: | --------------- | ---------------------- |
| France                 | I     |   34 | Favorite        | Kylian Mbappé          |
| Spain                  | H     |   34 | Favorite        | Lamine Yamal           |
| Brazil                 | C     |   33 | Favorite        | Vinícius Júnior        |
| England                | L     |   33 | Favorite        | Jude Bellingham        |
| Argentina              | J     |   28 | Elite Contender | Lionel Messi           |
| Portugal               | K     |   28 | Elite Contender | Cristiano Ronaldo      |
| Germany                | E     |   26 | Elite Contender | Jamal Musiala          |
| Netherlands            | F     |   23 | Contender       | Virgil van Dijk        |
| Belgium                | G     |   22 | Contender       | Kevin De Bruyne        |
| Colombia               | K     |   20 | Contender       | Luis Díaz              |
| Norway                 | I     |   20 | Contender       | Erling Haaland         |
| Morocco                | C     |   17 | Dark Horse      | Achraf Hakimi          |
| Switzerland            | B     |   17 | Dark Horse      | Granit Xhaka           |
| Uruguay                | H     |   17 | Dark Horse      | Federico Valverde      |
| Japan                  | F     |   16 | Dark Horse      | Takefusa Kubo          |
| Mexico                 | A     |   16 | Host Pick       | Santiago Giménez       |
| United States          | D     |   16 | Host Pick       | Christian Pulisic      |
| Canada                 | B     |   15 | Host Pick       | Alphonso Davies        |
| Croatia                | L     |   15 | Dark Horse      | Luka Modrić            |
| Ecuador                | E     |   15 | Dark Horse      | Moisés Caicedo         |
| Austria                | J     |   14 | Mid-Tier        | Marcel Sabitzer        |
| Türkiye                | D     |   14 | Mid-Tier        | Hakan Çalhanoğlu       |
| Côte d’Ivoire          | E     |   13 | Mid-Tier        | Franck Kessié          |
| Czechia                | A     |   13 | Mid-Tier        | Patrik Schick          |
| Senegal                | I     |   13 | Mid-Tier        | Sadio Mané             |
| South Korea            | A     |   13 | Mid-Tier        | Son Heung-min          |
| Sweden                 | F     |   13 | Mid-Tier        | Alexander Isak         |
| Algeria                | J     |   12 | Mid-Tier        | Riyad Mahrez           |
| Egypt                  | G     |   12 | Mid-Tier        | Mohamed Salah          |
| Paraguay               | D     |   12 | Mid-Tier        | Miguel Almirón         |
| Bosnia and Herzegovina | B     |   10 | Value           | Edin Džeko             |
| Ghana                  | L     |   10 | Value           | Mohammed Kudus         |
| Iran                   | G     |   10 | Value           | Mehdi Taremi           |
| Australia              | D     |    9 | Value           | Mathew Ryan            |
| DR Congo               | K     |    9 | Value           | Yoane Wissa            |
| Scotland               | C     |    9 | Value           | Scott McTominay        |
| Tunisia                | F     |    9 | Value           | Ellyes Skhiri          |
| Qatar                  | B     |    6 | Sleeper         | Akram Afif             |
| Saudi Arabia           | H     |    6 | Sleeper         | Salem Al-Dawsari       |
| South Africa           | A     |    6 | Sleeper         | Percy Tau              |
| New Zealand            | G     |    5 | Sleeper         | Chris Wood             |
| Panama                 | L     |    5 | Sleeper         | Adalberto Carrasquilla |
| Uzbekistan             | K     |    5 | Sleeper         | Eldor Shomurodov       |
| Iraq                   | I     |    2 | Long Shot       | Aymen Hussein          |
| Jordan                 | J     |    2 | Long Shot       | Mousa Al-Taamari       |
| Cabo Verde             | H     |    1 | Deep Long Shot  | Ryan Mendes            |
| Curaçao                | E     |    1 | Deep Long Shot  | Placeholder Player     |
| Haiti                  | C     |    1 | Deep Long Shot  | Placeholder Player     |

Use flag emojis initially if flag image assets are not available. Do not block development on flag image files.

Use placeholder fields for:

* FIFA ranking
* Group win odds
* Title odds
* Player image
* Player club
* Player position

These can be filled in later.

---

## App Pages

Use React Router.

Suggested routes:

```txt
/                         Home / Rules
/pick                     Build Portfolio
/teams                    Teams & Costs
/leaderboard              Leaderboard
/participants/:entryId    Participant Portfolio Detail
/my-portfolio             My Portfolio
/admin                    Admin Results Update
```

Optional:

```txt
/teams/:teamId            Team Detail page
```

The team detail can also be implemented as a drawer/modal instead of a full page.

---

## Frontend File Structure

Use a clear, boring, maintainable structure.

Suggested structure:

```txt
world-cup-challenge/
  CLAUDE.md
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  public/
    _redirects
    assets/
  src/
    main.tsx
    App.tsx
    routes/
      HomePage.tsx
      BuildPortfolioPage.tsx
      TeamsPage.tsx
      LeaderboardPage.tsx
      ParticipantPortfolioPage.tsx
      MyPortfolioPage.tsx
      AdminPage.tsx
    components/
      layout/
        AppShell.tsx
        Header.tsx
        Nav.tsx
        PageContainer.tsx
      auth/
        SignInPanel.tsx
        AuthStatus.tsx
        ProtectedRoute.tsx
      teams/
        TeamCard.tsx
        TeamCostTable.tsx
        TeamInfoPanel.tsx
        TeamInfoDrawer.tsx
        TeamFilters.tsx
      portfolio/
        PortfolioSidebar.tsx
        SelectedTeamList.tsx
        PortfolioStatusBadge.tsx
        PortfolioStrategyCard.tsx
        BudgetMeter.tsx
        TeamCountMeter.tsx
      leaderboard/
        LeaderboardTable.tsx
        LeaderboardRow.tsx
        ExpandedLeaderboardRow.tsx
        RankMovementBadge.tsx
      scoring/
        ScoringRulesTable.tsx
        ScoreBreakdownCard.tsx
        PointAccrualTimeline.tsx
        PortfolioSurvivalBar.tsx
      admin/
        ResultUploadPanel.tsx
        ManualMatchEntryForm.tsx
        ScoringAuditTable.tsx
      ui/
        Button.tsx
        Card.tsx
        Badge.tsx
        Input.tsx
        Select.tsx
        Tabs.tsx
        Modal.tsx
        Drawer.tsx
        EmptyState.tsx
        LoadingState.tsx
        ErrorState.tsx
    data/
      teams.ts
      scoringRules.ts
    lib/
      supabaseClient.ts
      auth.ts
      portfolio.ts
      scoring.ts
      formatting.ts
      validation.ts
      sorting.ts
    types/
      database.ts
      domain.ts
    styles/
      tokens.css
      global.css
      layout.css
      components.css
```

Keep components small and composable.

---

## Styling Instructions

Use plain CSS or CSS modules. Avoid introducing a large UI framework.

Define reusable design tokens in `src/styles/tokens.css`.

Use this palette:

```css
:root {
  --color-navy-900: #062B3A;
  --color-teal-800: #075E67;
  --color-teal-500: #00A6A6;
  --color-aqua-300: #7FDBDA;
  --color-gold-400: #F4C542;
  --color-bg: #F7FAFA;
  --color-card: #FFFFFF;
  --color-border: #DDE7E8;
  --color-success: #2EAD6B;
  --color-warning: #F4C542;
  --color-error: #D9534F;
  --color-eliminated: #A6AEB2;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;

  --shadow-soft: 0 8px 24px rgba(6, 43, 58, 0.10);
  --shadow-card: 0 4px 14px rgba(6, 43, 58, 0.08);

  --font-body: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Design feel:

* Teal/navy background accents
* White cards
* Gold accents for favorites/high leverage
* Teal for active/alive states
* Gray for eliminated states
* Rounded buttons and cards
* Soft shadows
* Clean dashboard tables
* Country flags visible in all team rows/cards
* Avoid tiny text

If Figma Make produces CSS, place it in a separate file first, such as:

```txt
src/styles/figma-import.css
```

Then gradually refactor into reusable component classes.

---

## Auth Requirements

Use Supabase Auth.

Initial auth flow:

1. User enters Technomics email.
2. User receives magic link or OTP.
3. User signs in.
4. App reads/creates profile.
5. User can create/update own portfolio before lock.

Validation:

* Email must end in `@technomics.net`.
* Client-side validation should prevent non-Technomics emails.
* Database/RLS should also enforce ownership and update restrictions.
* Do not rely only on frontend validation.

Important:

* Never expose Supabase service role key in frontend.
* Use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in browser.
* All sensitive permissions must be enforced through Supabase RLS or server-only functions if later added.

Environment variables:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Create `.env.example` with placeholder values.

Do not commit `.env`.

---

## Supabase Database Design

Use Supabase Postgres.

Create migration files under:

```txt
supabase/migrations/
```

Suggested core tables:

### `profiles`

One row per authenticated user.

Fields:

```sql
id uuid primary key references auth.users(id) on delete cascade,
email text not null unique,
display_name text,
is_admin boolean not null default false,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

### `teams`

Stores all 48 teams and static metadata.

Fields:

```sql
id text primary key,
country text not null unique,
group_letter text not null,
cost integer not null,
tier text not null,
key_player text,
player_position text,
player_club text,
flag_emoji text,
flag_url text,
fifa_rank integer,
group_win_odds text,
title_odds text,
why_pick text,
pool_angle text,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Use `id` slugs like:

```txt
france
spain
brazil
united-states
cote-divoire
bosnia-and-herzegovina
dr-congo
cabo-verde
curacao
```

### `app_settings`

Stores lock time and app status.

Simplest version:

```sql
id boolean primary key default true,
bracket_lock_at timestamptz,
picks_locked boolean not null default false,
last_score_update_at timestamptz,
updated_at timestamptz not null default now(),
constraint app_settings_singleton check (id = true)
```

Insert exactly one row.

### `entries`

One portfolio entry per user.

Fields:

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
display_name text not null,
total_cost integer not null default 0,
submitted_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
constraint entries_user_unique unique (user_id),
constraint entries_total_cost_check check (total_cost <= 100)
```

### `entry_teams`

Join table for selected teams.

Fields:

```sql
entry_id uuid not null references entries(id) on delete cascade,
team_id text not null references teams(id) on delete restrict,
created_at timestamptz not null default now(),
primary key (entry_id, team_id)
```

Important: enforce exactly 6 teams at the application level initially. If possible, add a database function for final validation. Do not let users submit fewer or more than 6.

### `matches`

Stores tournament match results.

Fields:

```sql
id uuid primary key default gen_random_uuid(),
stage text not null,
group_letter text,
home_team_id text references teams(id),
away_team_id text references teams(id),
home_score integer,
away_score integer,
status text not null default 'scheduled',
played_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Recommended `stage` values:

```txt
group
round_of_32
round_of_16
quarterfinal
semifinal
final
```

Recommended `status` values:

```txt
scheduled
in_progress
complete
```

### `team_status`

Stores current tournament status for each team.

Fields:

```sql
team_id text primary key references teams(id) on delete cascade,
group_match_points integer not null default 0,
group_finish_bonus integer not null default 0,
knockout_points integer not null default 0,
total_points integer generated always as (group_match_points + group_finish_bonus + knockout_points) stored,
max_possible_points integer not null default 50,
is_alive boolean not null default true,
current_stage text not null default 'group',
group_finish integer,
advanced_from_group boolean,
latest_result text,
next_match text,
updated_at timestamptz not null default now()
```

For first version, `team_status` may be manually updated by admin. Later it can be derived from match results.

### `scoring_events`

Auditable scoring records.

Fields:

```sql
id uuid primary key default gen_random_uuid(),
team_id text not null references teams(id) on delete cascade,
match_id uuid references matches(id) on delete set null,
event_type text not null,
stage text not null,
points integer not null,
label text not null,
created_at timestamptz not null default now()
```

Example events:

```txt
France group win +3
USA group draw +1
Spain won group +4
Brazil won Round of 32 +3
```

In early versions, admin may insert scoring events manually. Later, automate.

---

## RLS / Security Expectations

Enable Row Level Security on all user-sensitive tables.

Core rules:

### Profiles

* User can read their own profile.
* User can update their own display name.
* Admin can read all profiles.
* Admin can update admin fields.

### Teams

* Everyone authenticated can read teams.
* Only admin can insert/update/delete teams.

### App Settings

* Everyone authenticated can read lock status.
* Only admin can update lock status.

### Entries

Before lock:

* User can insert their own entry.
* User can read their own entry.
* User can update their own entry.
* User cannot read other users’ entries unless picks are locked.

After lock:

* Authenticated users can read all entries.
* No normal user can update entries.

Admin:

* Admin can read all entries.
* Admin can update/delete only if absolutely needed.

### Entry Teams

Before lock:

* User can insert/update/delete selected teams for their own entry.
* User cannot read other users’ selected teams unless picks are locked.

After lock:

* Authenticated users can read all entry teams.
* No normal user can update entry teams.

### Matches, Team Status, Scoring Events

* Authenticated users can read.
* Only admin can insert/update/delete.

Implement helper functions if useful:

```sql
is_admin()
picks_are_locked()
owns_entry(entry_id uuid)
```

Do not allow frontend-only security.

---

## Portfolio Validation Logic

Create reusable validation in `src/lib/validation.ts`.

Rules:

```ts
const REQUIRED_TEAM_COUNT = 6;
const MAX_BUDGET = 100;
const EMAIL_DOMAIN = "@technomics.net";
```

Validation checks:

* Email is present
* Email ends with `@technomics.net`
* Display name is present
* Exactly 6 teams selected
* Total cost <= 100
* No duplicate teams
* Picks are not locked

Return structured validation results:

```ts
type PortfolioValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalCost: number;
  remainingBudget: number;
  teamCount: number;
};
```

Portfolio strategy labels:

* `Stars & Sleepers`
* `Balanced`
* `One Favorite + Depth`
* `Value Hunting`
* `Long Shot Heavy`
* `Favorite Heavy`

Simple heuristic:

* If selected teams include 2+ teams costing 33 or more: `Stars & Sleepers`
* If selected teams include 1 team costing 33 or more and 3+ mid/value teams: `One Favorite + Depth`
* If no team costs 28+ and most teams cost 9–23: `Balanced`
* If many teams cost 10 or less: `Value Hunting`
* If many teams cost 5 or less: `Long Shot Heavy`

This can be approximate; it is a UI helper, not official scoring.

---

## Scoring Logic

Create scoring helpers in `src/lib/scoring.ts`.

Constants:

```ts
export const SCORING = {
  groupWin: 3,
  groupDraw: 1,
  groupLoss: 0,
  groupFirst: 4,
  groupSecond: 2,
  groupThirdAdvance: 1,
  roundOf32Win: 3,
  roundOf16Win: 5,
  quarterfinalWin: 7,
  semifinalWin: 10,
  finalWin: 14,
} as const;
```

Useful types:

```ts
export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final";

export type TeamTournamentStatus =
  | "scheduled"
  | "group_stage"
  | "advanced"
  | "eliminated"
  | "round_of_32"
  | "round_of_16"
  | "quarterfinalist"
  | "semifinalist"
  | "finalist"
  | "champion";
```

For leaderboard:

* Team total points = group match points + group finish bonus + knockout points
* Entry current points = sum current points for six teams
* Entry max possible = sum max possible points for six teams
* Teams alive = count selected teams where `is_alive = true`
* Portfolio cost = sum selected team costs

Use database views when possible, but frontend can also calculate from fetched rows for first version.

---

## UI Screens and Behavior

### 1. Home / Rules

Purpose:

* Explain the game quickly.
* Drive users to pick teams.
* Show compact rules and scoring.

Must include:

* App title
* Hero CTA
* Rules cards
* Compact scoring preview
* “Start Picking” button
* “View Teams & Costs” button

Do not overcrowd this page.

### 2. Build Portfolio

This is the main screen.

Must include:

* Technomics email input or signed-in state
* Display name input
* Search country/player
* Sort by:

  * Cost high to low
  * Cost low to high
  * Group A–L
  * Country A–Z
  * Tier
* Filter chips:

  * All
  * Favorites
  * Elite Contenders
  * Contenders
  * Dark Horses
  * Host Picks
  * Mid-Tier
  * Value
  * Sleepers
  * Long Shots
  * Groups A–L
* Main team list using all 48 teams
* Team cards with direct information
* Inline expandable team info
* Sticky portfolio sidebar
* Budget meter
* Team count meter
* Submit button
* Edit/save state

Each team card must show:

* Flag
* Country
* Group
* Cost
* Tier
* Key player
* FIFA rank placeholder
* Group win odds placeholder
* Title odds placeholder
* Pool angle summary
* Add/remove button
* “More team info” expandable section

Selected portfolio sidebar must show:

* Teams selected, e.g. `4 / 6`
* Budget used, e.g. `$82 / $100`
* Remaining budget
* Status badge
* Budget progress bar
* Team count progress bar
* Selected teams list
* Remove buttons before lock
* Strategy label
* Submit button

Submit button disabled unless:

* User is signed in or has valid Technomics email flow ready
* Exactly 6 teams selected
* Budget <= 100
* Picks not locked

### 3. Teams & Costs

Reference page.

Must include:

* Full 48-team table
* Search
* Sort by cost/group/country/tier
* Filter by group/tier
* Expandable rows or “See team info”
* Scoring rules link or summary

Default sort:

1. Cost descending
2. Country alphabetical

### 4. Leaderboard

Before lock:

* Show either:

  * “Leaderboard unlocks after picks lock”
  * Number of submitted entries
  * Countdown to lock
* Do not reveal everyone’s picks before lock.

After lock:

Show full leaderboard.

Must include:

* Summary cards:

  * Current Leader
  * Most Teams Alive
  * Highest Max Possible
  * Biggest Mover
* Leaderboard table
* Search participant
* Sort by current points, max possible, teams alive, rank movement
* Participant rows with flag clusters
* Expandable row showing selected teams and scoring
* “View Portfolio” button

Columns:

* Rank
* Participant
* Current Points
* Max Possible Points
* Teams Alive
* Portfolio Cost
* Champion Pick or Highest-Cost Pick
* Portfolio Type
* Rank Movement
* View

### 5. Participant Portfolio Detail

Only available after lock, except for the signed-in user viewing their own portfolio.

Must include:

* Participant name
* Rank
* Current points
* Max possible
* Teams alive
* Portfolio cost
* Portfolio type
* Six team cards
* Points table
* Score breakdown
* Portfolio survival bar
* Back to Leaderboard button

### 6. My Portfolio

Signed-in user’s own portfolio page.

Before lock:

* Show current portfolio
* Allow edit via “Edit Portfolio”
* Show lock countdown/status

After lock:

* Read-only
* Show rank and scoring

Must include:

* Current points
* Max possible
* Teams alive
* Portfolio cost
* Six selected team cards
* Points by team table
* Score breakdown
* Path to win card
* Bar chart using CSS bars

### 7. Team Detail / Inline Team Info

Team details should be accessible from:

* Build Portfolio
* Teams & Costs
* Leaderboard expanded rows
* My Portfolio

Use either drawer or page.

Must show:

* Flag
* Country
* Group
* Cost
* Tier
* Key player
* Player image placeholder
* FIFA rank placeholder
* Group win odds placeholder
* Title odds placeholder
* Current tournament status
* Current points
* Max possible points
* Why pick them?
* Pool angle
* Scoring status
* Latest / next match
* Selected by count after lock

### 8. Admin Results Update

Admin-only page.

Do not put this prominently in main nav for normal users.

Must include:

* App status: picks open / locked
* Bracket lock time
* Last score update timestamp
* Upload results CSV
* Manual match entry
* Refresh/recalculate leaderboard button
* Scoring audit table
* Recent scoring events
* Lock/unlock control

Admin actions:

* Update match results
* Update team status
* Insert scoring events
* Recalculate team points
* Recalculate leaderboard
* Lock picks

Use admin RLS. Do not expose service key.

---

## Components to Prioritize

Build these first:

1. `AppShell`
2. `Header`
3. `TeamCard`
4. `PortfolioSidebar`
5. `BudgetMeter`
6. `TeamCountMeter`
7. `BuildPortfolioPage`
8. `TeamsPage`
9. `LeaderboardTable`
10. `MyPortfolioPage`
11. `SignInPanel`
12. `AdminPage`

Keep reusable UI components simple.

Button variants:

* primary
* secondary
* ghost
* danger
* disabled

Badge variants:

* favorite
* contender
* host
* value
* sleeper
* long-shot
* alive
* eliminated
* locked
* valid
* warning
* error

---

## Data Fetching Strategy

Use Supabase client in `src/lib/supabaseClient.ts`.

Create data access helpers. Do not scatter Supabase queries throughout components if avoidable.

Suggested files:

```txt
src/lib/teamsApi.ts
src/lib/entriesApi.ts
src/lib/leaderboardApi.ts
src/lib/adminApi.ts
```

Initial approach:

* Fetch teams on app load or page load.
* Fetch current user/session through Supabase Auth.
* Fetch user entry after sign-in.
* Fetch leaderboard only after lock.
* Fetch participant portfolios only after lock unless owner/admin.

Use loading and error states.

Do not assume queries always succeed.

---

## Local Development Without Supabase

It should be possible to work on UI before Supabase is fully configured.

Use static mock data from:

```txt
src/data/teams.ts
src/data/mockEntries.ts
src/data/mockLeaderboard.ts
```

The app can initially render from mock data. Then wire to Supabase.

Do not block UI development on database setup.

---

## Suggested Implementation Phases

### Phase 1: Project Scaffold

* Create Vite React TypeScript app.
* Add React Router.
* Add base CSS tokens.
* Create AppShell and navigation.
* Create mock team data.
* Create Home, Build Portfolio, Teams, Leaderboard, My Portfolio placeholder pages.

Acceptance:

* App runs locally.
* Navigation works.
* Styling tokens are loaded.
* All pages render.

### Phase 2: Static Portfolio Builder

* Build all 48 team cards.
* Add sort/filter/search.
* Add selected portfolio sidebar.
* Add budget/team count validation.
* Add add/remove behavior.
* Add valid/incomplete/over-budget states.
* Add inline team info expansion.

Acceptance:

* User can select exactly 6 teams.
* Budget validation works.
* Cannot submit invalid portfolio.
* Team list sorts by cost and group.

### Phase 3: Supabase Schema

* Add Supabase client.
* Create migrations.
* Create seed data for teams.
* Add environment variables.
* Document setup steps.

Acceptance:

* Supabase database has teams.
* App can fetch teams from Supabase.
* Static fallback still works if needed.

### Phase 4: Auth and User Portfolio

* Add Supabase Auth magic link/OTP UI.
* Restrict to Technomics email domain.
* Create/read profile.
* Submit entry and entry_teams.
* Edit own entry before lock.
* Prevent edits after lock.

Acceptance:

* User can sign in.
* User can submit one portfolio.
* User can edit own portfolio before lock.
* User cannot edit after lock.

### Phase 5: RLS and Security Hardening

* Enable RLS.
* Add policies for profiles, entries, entry_teams, teams, app_settings.
* Test owner-only behavior.
* Hide participant portfolios before lock.

Acceptance:

* User A cannot read or edit User B’s picks before lock.
* After lock, User A can view leaderboard and participant portfolios.
* Admin can update results/settings.

### Phase 6: Leaderboard and Scoring

* Add team_status and scoring_events.
* Add leaderboard query/view.
* Build leaderboard page.
* Build participant detail page.
* Build My Portfolio score breakdown.
* Add mock scoring if tournament not started.

Acceptance:

* Current points display correctly.
* Max possible displays.
* Teams alive display.
* Leaderboard sorts by score.
* Participant detail shows scoring by team.

### Phase 7: Admin Result Updates

* Build admin-only page.
* Add manual result/scoring event forms.
* Add CSV upload UI.
* Add scoring audit table.
* Add lock controls.

Acceptance:

* Admin can update team status/scoring.
* Leaderboard updates after scoring changes.
* Normal users cannot access admin actions.

### Phase 8: Polish and Deploy

* Responsive layout
* Mobile cards
* Empty/loading/error states
* Netlify deployment config
* `_redirects` file for SPA routing
* Final visual polish

Acceptance:

* App builds successfully.
* App deploys to Netlify or Cloudflare Pages.
* Environment variables work.
* Deep links work after refresh.

---

## Deployment Notes

For Netlify:

Build command:

```txt
npm run build
```

Publish directory:

```txt
dist
```

Create `public/_redirects`:

```txt
/* /index.html 200
```

Environment variables in Netlify:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not deploy with `.env`.

---

## Testing / Quality Checks

Before considering work complete, run:

```txt
npm run build
```

If linting is added:

```txt
npm run lint
```

Recommended validation tests, manual or automated:

* Cannot select more than 6 teams.
* Cannot submit fewer than 6 teams.
* Cannot submit over $100.
* Can submit exactly 6 teams under $100.
* Can remove selected teams.
* Sorting by cost works.
* Sorting by group works.
* Filtering by tier works.
* Search works by country and player.
* Email domain validation works.
* Signed-in user can edit own portfolio before lock.
* Signed-in user cannot edit after lock.
* User cannot view other users’ picks before lock.
* User can view leaderboard after lock.
* Admin page is not accessible to normal users.
* Responsive layout works on desktop/tablet/mobile.

---

## Accessibility Requirements

Use semantic HTML.

* Buttons should be buttons, not divs.
* Inputs should have labels.
* Tables should use proper table structure.
* Modals/drawers should be keyboard accessible if possible.
* Color should not be the only indicator of status.
* Use readable contrast.
* Add aria labels where appropriate.

---

## Important UX Details

### Before Lock

Users should see:

* Their own portfolio
* Edit buttons
* Countdown or lock status
* Confirmation that picks can still be changed

Users should not see:

* Other participants’ exact picks
* Full copyable leaderboard portfolios

Leaderboard page before lock should say something like:

> “Leaderboard unlocks after picks lock. 87 portfolios submitted so far.”

### After Lock

Users should see:

* Full leaderboard
* Participant portfolios
* Team ownership counts
* Scoring details
* Teams alive/eliminated
* Max possible points

### Locked State

When locked:

* Disable add/remove buttons
* Disable submit button
* Replace edit messaging with:

  * “Picks locked after opening kickoff.”

### Error States

Include friendly messages:

* Invalid email domain:

  * “Please use your Technomics email.”
* Over budget:

  * “This portfolio is $7 over budget.”
* Too few teams:

  * “Pick 2 more teams.”
* Too many teams:

  * “Remove 1 team before submitting.”
* Already submitted:

  * “Portfolio loaded. You can edit until lock.”
* Locked:

  * “Picks are locked. Your portfolio is now read-only.”

---

## Copy / Labels

Use these labels consistently:

* “Build Portfolio”
* “Teams & Costs”
* “Leaderboard”
* “My Portfolio”
* “Submit Portfolio”
* “Edit Portfolio”
* “Picks Locked”
* “Teams Alive”
* “Max Possible”
* “Current Points”
* “Portfolio Cost”
* “More Team Info”
* “Add Team”
* “Remove”

Game title:

```txt
Technomics 2026 World Cup Challenge
```

Subtitle:

```txt
Pick 6 teams. Stay under $100. Follow your portfolio from group stage to the final.
```

---

## Notes on Team Images and Flags

Initial version:

* Use flag emojis.
* Use player image placeholders.
* Do not scrape or hotlink copyrighted images.
* Later, user may add local flag/player assets.

If image URLs are added later, store them in `teams.flag_url` and maybe `teams.player_image_url`.

---

## What Not To Do

Do not:

* Store portfolios only in localStorage.
* Trust frontend-only validation.
* Expose service role keys.
* Reveal all picks before lock.
* Add complex paid APIs before the app works.
* Build an elaborate backend unless needed.
* Add a giant UI framework unless requested.
* Make the admin page the center of the app.
* Hardcode scores only in components.
* Scatter scoring constants across files.
* Change the game rules without explicit instruction.

---

## Expected Final User Flow

### New user before lock

1. Opens app.
2. Clicks “Build Portfolio.”
3. Enters Technomics email.
4. Signs in.
5. Searches/sorts teams.
6. Opens inline team info.
7. Selects exactly 6 teams.
8. Confirms total cost <= $100.
9. Submits portfolio.
10. Sees confirmation.
11. Can return later and edit before lock.

### User after lock

1. Opens app.
2. Signs in.
3. Views My Portfolio.
4. Views Leaderboard.
5. Clicks participant to inspect picks.
6. Tracks teams alive, current points, and max possible.

### Admin

1. Signs in as admin.
2. Opens Admin Results Update.
3. Locks picks at kickoff.
4. Updates results manually or by CSV.
5. Recalculates scores.
6. Confirms leaderboard updated.

---

## First Concrete Task

Start by creating the Vite React TypeScript app with the full static frontend using mock data.

Do not start with Supabase until the static portfolio builder works.

First deliverable:

* Running app
* Home page
* Build Portfolio page
* Teams & Costs page
* Full 48-team list
* Sorting by cost and group
* Portfolio selection sidebar
* Validation for exactly 6 teams and $100 budget
* Clean teal/navy styling

After that, wire to Supabase.
