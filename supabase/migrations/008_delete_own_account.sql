-- ============================================================
-- Allow a user to delete their own account.
--
-- Deletes the row from auth.users, which cascades to
-- public.users (via the trigger/FK) and all related
-- memberships (via cascade delete on user_id FK).
-- ============================================================

create or replace function public.delete_own_account()
returns void
language sql
security definer
as $$
  delete from auth.users where id = auth.uid();
$$;
