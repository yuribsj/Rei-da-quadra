-- ============================================================
-- Fix column-ambiguity bug in RLS policies for rounds,
-- matches, and results.
--
-- Root cause: all affected policies had a subquery of the form:
--
--   EXISTS (
--     SELECT 1 FROM public.memberships m
--     WHERE m.championship_id = championship_id   ← ambiguous!
--       AND m.user_id = auth.uid()
--       AND m.status = 'accepted'
--   )
--
-- Inside the subquery `FROM memberships m`, PostgreSQL resolves
-- unqualified `championship_id` to memberships.championship_id
-- (the nearer scope), not to the outer row's column. This makes
-- the condition trivially true — or, in stricter contexts,
-- PostgreSQL raises an "ambiguous column" error, causing the
-- policy to deny the operation silently.
--
-- Fix: replace all such subqueries with the
-- `is_championship_member(championship_id)` security-definer
-- helper created in migration 002. In policy expressions,
-- `championship_id` (unqualified) correctly refers to the
-- current row's column because there is no inner subquery
-- scope to shadow it.
-- ============================================================

-- ── Rounds: SELECT ────────────────────────────────────────
drop policy if exists "rounds: read if member" on public.rounds;

create policy "rounds: read if member"
  on public.rounds for select using (
    public.is_championship_member(championship_id)
  );

-- ── Matches: SELECT ───────────────────────────────────────
drop policy if exists "matches: read if member" on public.matches;

create policy "matches: read if member"
  on public.matches for select using (
    public.is_championship_member(championship_id)
  );

-- ── Results: SELECT ───────────────────────────────────────
drop policy if exists "results: read if member" on public.results;

create policy "results: read if member"
  on public.results for select using (
    public.is_championship_member(championship_id)
  );

-- ── Results: INSERT ───────────────────────────────────────
-- Same ambiguity existed in the WITH CHECK clause.
drop policy if exists "results: member insert" on public.results;

create policy "results: member insert"
  on public.results for insert with check (
    registered_by = auth.uid() and
    public.is_championship_member(championship_id)
  );
