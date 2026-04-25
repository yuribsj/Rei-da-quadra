-- ============================================================
-- Enable Supabase Realtime for the results table.
--
-- Without this, the postgres_changes subscription in
-- ChampionshipDetailScreen receives no events when results
-- are inserted or updated, so the UI never auto-refreshes.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor).
-- ============================================================

alter publication supabase_realtime add table public.results;
