-- ============================================================
-- Rei da Quadra — Initial Schema
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

create type championship_status as enum ('waiting', 'active', 'finished');
create type membership_status   as enum ('invited', 'accepted', 'declined');
create type match_outcome       as enum ('p1win', 'p1tb', 'p2tb', 'p2win');
create type notification_type   as enum (
  'result_registered',
  'championship_started',
  'championship_finished',
  'player_invited',
  'roster_full'
);

-- ── Users ────────────────────────────────────────────────────
-- Extends auth.users with profile data.

create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text        not null,
  nickname    text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

-- Anyone can read any profile (needed for search + ranking display)
create policy "users: read all"
  on public.users for select using (true);

-- Users can only update their own profile
create policy "users: update own"
  on public.users for update using (auth.uid() = id);

-- Trigger: auto-create user row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Jogador'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Championships ─────────────────────────────────────────────

create table public.championships (
  id           uuid primary key default gen_random_uuid(),
  name         text                  not null,
  sport        text                  not null default 'Padel',
  max_players  int                   not null default 12 check (max_players between 2 and 32),
  status       championship_status   not null default 'waiting',
  admin_id     uuid                  not null references public.users (id),
  invite_code  text                  not null unique,
  created_at   timestamptz           not null default now()
);

alter table public.championships enable row level security;

-- Read: must be a member (accepted) or the admin
create policy "championships: read if member"
  on public.championships for select using (
    auth.uid() = admin_id or
    exists (
      select 1 from public.memberships m
      where m.championship_id = id
        and m.user_id = auth.uid()
        and m.status = 'accepted'
    )
  );

-- Create: any authenticated user
create policy "championships: create"
  on public.championships for insert with check (auth.uid() = admin_id);

-- Update/Delete: admin only
create policy "championships: admin update"
  on public.championships for update using (auth.uid() = admin_id);

create policy "championships: admin delete"
  on public.championships for delete using (auth.uid() = admin_id);

-- ── Memberships ───────────────────────────────────────────────

create table public.memberships (
  id                uuid primary key default gen_random_uuid(),
  championship_id   uuid              not null references public.championships (id) on delete cascade,
  user_id           uuid              not null references public.users (id) on delete cascade,
  status            membership_status not null default 'invited',
  invited_by        uuid              references public.users (id),
  joined_at         timestamptz,
  created_at        timestamptz       not null default now(),
  unique (championship_id, user_id)
);

alter table public.memberships enable row level security;

-- Read: see memberships of championships you belong to, or championships you admin
create policy "memberships: read if member or admin"
  on public.memberships for select using (
    user_id = auth.uid() or
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    ) or
    exists (
      select 1 from public.memberships m
      where m.championship_id = championship_id
        and m.user_id = auth.uid()
        and m.status = 'accepted'
    )
  );

-- Insert: admin invites, or user self-joins via code
create policy "memberships: invite or join"
  on public.memberships for insert with check (
    -- admin inviting someone
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    ) or
    -- user joining themselves
    user_id = auth.uid()
  );

-- Update: user updates own membership (accept/decline), or admin manages
create policy "memberships: update own or admin"
  on public.memberships for update using (
    user_id = auth.uid() or
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    )
  );

-- Delete: admin removes player
create policy "memberships: admin delete"
  on public.memberships for delete using (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    )
  );

-- ── Rounds ────────────────────────────────────────────────────

create table public.rounds (
  id                uuid primary key default gen_random_uuid(),
  championship_id   uuid not null references public.championships (id) on delete cascade,
  round_number      int  not null,
  created_at        timestamptz not null default now(),
  unique (championship_id, round_number)
);

alter table public.rounds enable row level security;

create policy "rounds: read if member"
  on public.rounds for select using (
    exists (
      select 1 from public.memberships m
      where m.championship_id = championship_id
        and m.user_id = auth.uid()
        and m.status = 'accepted'
    )
  );

create policy "rounds: admin insert"
  on public.rounds for insert with check (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    )
  );

-- ── Matches ───────────────────────────────────────────────────

create table public.matches (
  id                  uuid primary key default gen_random_uuid(),
  round_id            uuid not null references public.rounds (id) on delete cascade,
  championship_id     uuid not null references public.championships (id) on delete cascade,
  pair1_player1_id    uuid not null references public.users (id),
  pair1_player2_id    uuid not null references public.users (id),
  pair2_player1_id    uuid not null references public.users (id),
  pair2_player2_id    uuid not null references public.users (id),
  created_at          timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "matches: read if member"
  on public.matches for select using (
    exists (
      select 1 from public.memberships m
      where m.championship_id = championship_id
        and m.user_id = auth.uid()
        and m.status = 'accepted'
    )
  );

create policy "matches: admin insert"
  on public.matches for insert with check (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    )
  );

-- ── Results ───────────────────────────────────────────────────

create table public.results (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid         not null unique references public.matches (id) on delete cascade,
  championship_id uuid         not null references public.championships (id) on delete cascade,
  outcome         match_outcome not null,
  score           text,
  registered_by   uuid         not null references public.users (id),
  created_at      timestamptz  not null default now()
);

alter table public.results enable row level security;

create policy "results: read if member"
  on public.results for select using (
    exists (
      select 1 from public.memberships m
      where m.championship_id = championship_id
        and m.user_id = auth.uid()
        and m.status = 'accepted'
    )
  );

-- Any accepted member can register a result
create policy "results: member insert"
  on public.results for insert with check (
    registered_by = auth.uid() and
    exists (
      select 1 from public.memberships m
      where m.championship_id = championship_id
        and m.user_id = auth.uid()
        and m.status = 'accepted'
    )
  );

-- Admin can edit results
create policy "results: admin update"
  on public.results for update using (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    )
  );

-- Admin can delete results
create policy "results: admin delete"
  on public.results for delete using (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.admin_id = auth.uid()
    )
  );

-- ── Notifications ─────────────────────────────────────────────

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid              not null references public.users (id) on delete cascade,
  type            notification_type not null,
  title           text              not null,
  body            text              not null,
  data            jsonb,
  read            boolean           not null default false,
  created_at      timestamptz       not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: read own"
  on public.notifications for select using (user_id = auth.uid());

create policy "notifications: mark read"
  on public.notifications for update using (user_id = auth.uid());

-- Notifications are inserted by server-side functions (service role)
-- so no insert policy needed for anon/authenticated

-- ── Indexes ───────────────────────────────────────────────────

create index on public.memberships (championship_id);
create index on public.memberships (user_id);
create index on public.rounds (championship_id);
create index on public.matches (round_id);
create index on public.matches (championship_id);
create index on public.matches (pair1_player1_id);
create index on public.matches (pair1_player2_id);
create index on public.matches (pair2_player1_id);
create index on public.matches (pair2_player2_id);
create index on public.results (match_id);
create index on public.results (championship_id);
create index on public.notifications (user_id, read, created_at desc);
create index on public.championships (invite_code);
