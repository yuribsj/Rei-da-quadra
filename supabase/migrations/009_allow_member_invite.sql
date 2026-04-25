-- Add toggle for whether non-admin members can share the invite code.
-- Defaults to true (existing championships keep open invites).

alter table public.championships
  add column if not exists allow_member_invite boolean not null default true;
