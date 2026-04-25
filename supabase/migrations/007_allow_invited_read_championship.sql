-- ============================================================
-- Allow invited users to read the championship they were
-- invited to.
--
-- Root cause: the championships SELECT policy only allowed
-- admin or accepted members to read. Users with status
-- 'invited' could see their own membership row but not the
-- joined championship data, so the invite card showed null
-- and handleAccept() silently returned without doing anything.
-- ============================================================

-- Helper: does this user have any membership (invited or accepted) in the championship?
create or replace function public.is_championship_participant(champ_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.memberships
    where championship_id = champ_id
      and user_id = auth.uid()
      and status in ('invited', 'accepted')
  );
$$;

-- Rebuild championships SELECT policy to include invited users
drop policy if exists "championships: read if member or admin" on public.championships;
drop policy if exists "championships: read if member" on public.championships;

create policy "championships: read if member or admin"
  on public.championships for select using (
    auth.uid() = admin_id or
    public.is_championship_participant(id)
  );
