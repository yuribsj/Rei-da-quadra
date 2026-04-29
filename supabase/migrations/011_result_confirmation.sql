-- 011: Result confirmation flow
-- Adds a status lifecycle to results: pending → confirmed / disputed

-- 1. New enum
create type result_status as enum ('pending', 'confirmed', 'disputed');

-- 2. Add columns
alter table public.results
  add column status       result_status not null default 'pending',
  add column confirmed_by uuid references public.users(id),
  add column confirmed_at timestamptz;

-- 3. Backfill: treat every existing result as confirmed
update public.results set status = 'confirmed';

-- 4. Partial index for fast pending-result lookups
create index idx_results_pending on public.results (status) where status = 'pending';

-- 5. RLS: allow an opponent (match player who is NOT the registrant) to confirm or dispute
create policy "results: opponent confirm"
  on public.results for update using (
    auth.uid() != registered_by
    and exists (
      select 1 from public.matches m
      where m.id = results.match_id
        and (
          m.pair1_player1_id = auth.uid() or
          m.pair1_player2_id = auth.uid() or
          m.pair2_player1_id = auth.uid() or
          m.pair2_player2_id = auth.uid()
        )
    )
  )
  with check (
    status in ('confirmed', 'disputed')
  );
