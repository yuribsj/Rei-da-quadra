-- Store individual set scores as structured JSONB for stats.
-- Format: [[6,3],[4,6],[10,7]] — array of [pairA, pairB] per set.
-- The existing `score` column remains as a display-friendly string.

alter table public.results
  add column if not exists sets jsonb;
