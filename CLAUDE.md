# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (opens Expo Go on device/simulator)
npm start

# Platform-specific
npm run ios
npm run android
npm run web
```

There are no lint or test scripts configured.

## Environment Variables

Create a `.env` file at the root with:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

**Rei da Quadra** is a React Native + Expo app for managing *padel americano* championships (rotating 2v2 doubles format). The UI language is Brazilian Portuguese.

### Navigation

`App.tsx` is the entry point. `RootNavigator` (inside `AuthProvider`) switches between three root states:
1. No session → `AuthNavigator` (Login / SignUp / ForgotPassword)
2. Session but no nickname → `ProfileSetupScreen`
3. Fully onboarded → `AppNavigator` (bottom tabs)

All navigators live in `app/_navigators.tsx`. All screens use `headerShown: false` — headers are built inline in each screen. Navigation param types are declared in the same file (`AuthStackParamList`, `HomeStackParamList`, `ProfileStackParamList`, `AppTabParamList`).

### Data Layer

`lib/supabase.ts` exports a single `supabase` client (persisted via AsyncStorage). All DB access happens directly in screen components via this client — there is no separate data-fetching layer.

`contexts/AuthContext.tsx` wraps Supabase auth and exposes `session`, `user`, `profile`, `loading`, and auth helpers via `useAuth()`. Profile is fetched from `public.users` (not from `auth.users`).

### Domain Logic

`lib/types.ts` is the single source of truth for all TypeScript types, mirroring the DB schema.

`lib/schedule.ts` generates the round-robin schedule using the Berger/circle method. Works for any N >= 4 players. Odd player counts get an internal BYE slot; non-multiple-of-4 counts produce extra rounds for leftover pairs.

`lib/rankings.ts` computes the `RankingEntry[]` from matches + members. Scoring: outright win = 3 pts, tiebreak win = 2 pts, tiebreak loss = 1 pt, loss = 0 pts. The ranking sorts by points → wins → tiebreak wins → userId (stable fallback).

### Styling

All styling is via React Native inline styles referencing `constants/theme.ts`, which exports `colors`, `radius`, `spacing`, and `font`. There is no stylesheet library — use these constants directly.

### Database Schema

Tables (all with RLS): `users`, `championships`, `memberships`, `rounds`, `matches`, `results`, `notifications`. Migrations are in `supabase/migrations/`.

Key relationships:
- `championships` → `memberships` (many, cascade delete)
- `championships` → `rounds` → `matches` → `results` (all cascade delete)
- A result has a `unique` constraint on `match_id` (one result per match)
- A `membership` status of `'accepted'` is required to read championships, rounds, matches, and results via RLS
- `admin_id` on a championship controls write access for that championship
- New users get a row in `public.users` auto-created via a trigger on `auth.users` insert
