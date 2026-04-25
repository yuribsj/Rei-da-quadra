-- ============================================================
-- RPC helpers for the join-by-code flow.
-- security definer bypasses RLS so non-members can look up
-- a championship by invite code and count accepted players.
-- ============================================================

-- 1. Look up a championship by invite code (non-member safe)
create or replace function public.find_championship_by_code(code text)
returns table (
  id          uuid,
  name        text,
  status      championship_status,
  max_players int
)
language sql
security definer
stable
as $$
  select id, name, status, max_players
  from public.championships
  where invite_code = upper(trim(code))
  limit 1;
$$;

-- 2. Count accepted members (non-member safe)
create or replace function public.get_championship_member_count(champ_id uuid)
returns int
language sql
security definer
stable
as $$
  select count(*)::int
  from public.memberships
  where championship_id = champ_id
    and status = 'accepted';
$$;
