-- ============================================================
-- Fix infinite recursion in RLS policies
--
-- Root cause: championships SELECT policy checks memberships,
-- and memberships SELECT policy checks championships — circular.
--
-- Fix: security definer helper functions bypass RLS when doing
-- cross-table checks, breaking the cycle.
-- ============================================================

-- ── Helper functions ──────────────────────────────────────────

create or replace function public.is_championship_admin(champ_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.championships
    where id = champ_id
      and admin_id = auth.uid()
  );
$$;

create or replace function public.is_championship_member(champ_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.memberships
    where championship_id = champ_id
      and user_id = auth.uid()
      and status = 'accepted'
  );
$$;

-- ── Rebuild championships SELECT policy ───────────────────────

drop policy if exists "championships: read if member or admin" on public.championships;

create policy "championships: read if member or admin"
  on public.championships for select using (
    auth.uid() = admin_id or
    public.is_championship_member(id)
  );

-- ── Rebuild memberships SELECT policy ────────────────────────

drop policy if exists "memberships: read if member or admin" on public.memberships;

create policy "memberships: read if member or admin"
  on public.memberships for select using (
    user_id = auth.uid() or
    public.is_championship_admin(championship_id) or
    public.is_championship_member(championship_id)
  );
