# Rei da Quadra — Product Backlog

> **Platform:** React Native (Expo) · **Sport:** Padel · **Format:** Round-robin, rotating pairs
> **Last updated:** 2026-04-20

---

## Priority Tiers

| Tier | Definition |
|------|------------|
| **P0 — MVP** | Required to run a real championship end-to-end |
| **P1 — Launch** | Required before sharing publicly |
| **P2 — Growth** | Post-launch improvements |

## Story Points

| Size | Points | Effort |
|------|--------|--------|
| XS | 1 | < 2 h |
| S | 2 | ~half day |
| M | 3 | ~1 day |
| L | 5 | 2–3 days |
| XL | 8 | ~1 week |

## Status Legend

📋 Backlog · 🔄 In Progress · ✅ Done · 🚫 Blocked

---

## E1 · Foundation `P0`

> Bootstrap the React Native project, navigation, design system, backend, and CI/CD.

| ID | Story | Points | Status |
|----|-------|--------|--------|
| F-001 | Bootstrap Expo + React Native project with TypeScript | S | 📋 |
| F-002 | Configure React Navigation: bottom tabs + nested stack navigators | M | 📋 |
| F-003 | Implement design tokens (colors, typography, spacing, radii) matching dark theme | S | 📋 |
| F-004 | Set up Supabase project: auth, database, realtime subscriptions, row-level security | L | 📋 |
| F-005 | Define database schema: users, championships, memberships, rounds, matches, results | L | 📋 |
| F-006 | Configure EAS Build + GitHub Actions CI/CD (lint, test, preview builds) | M | 📋 |
| F-007 | Set up ESLint, Prettier, TypeScript strict mode | S | 📋 |
| F-008 | Configure Expo environment variables (dev / staging / prod) | S | 📋 |

**Epic total: 26 pts**

---

## E2 · Authentication `P0`

> Players must have an account to join championships and register results.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| AU-001 | Sign up with email + password | Form validates email format and 8-char min password; creates user row in `users` table; redirects to profile setup | M | 📋 |
| AU-002 | Log in with email + password | Invalid credentials show inline error; successful login persists session via Supabase token | S | 📋 |
| AU-003 | Forgot password flow | User receives reset email; deep link opens new-password screen; old sessions invalidated | M | 📋 |
| AU-004 | Profile setup on first login | Requires: full name, optional nickname; auto-generates avatar initials; skippable photo upload | M | 📋 |
| AU-005 | Persist session / auto-login | App reads stored token on launch; expired tokens redirect to login gracefully | S | 📋 |
| AU-006 | Logout | Clears local session; redirects to login screen | XS | 📋 |
| AU-007 | Google Sign-In *(P1)* | OAuth via Expo AuthSession; creates user row on first login | M | 📋 |
| AU-008 | Apple Sign-In *(P1, iOS only)* | Required by App Store guidelines when Google login is offered | M | 📋 |

**Epic total: 22 pts**

---

## E3 · Championships `P0`

> Create and manage a championship. Schedule is auto-generated when the roster is locked.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| CH-001 | Create championship | Fields: name, sport (default: Padel), max players (default: 12), scoring preset; creator becomes admin | M | 📋 |
| CH-002 | Championship list on Home tab | Shows status badge (Waiting / Active / Finished), current round, leader name + points | S | 📋 |
| CH-003 | Championship detail — Matches tab | Lists rounds with match cards; pending matches show "Register" CTA; completed show score | M | 📋 |
| CH-004 | Championship detail — Ranking tab | Live sorted table: position, avatar, name, pts, W/L/TB; top 3 highlighted | M | 📋 |
| CH-005 | Championship detail — Players tab | Grid of all players with points; tap opens player profile modal | S | 📋 |
| CH-006 | Auto-generate round-robin schedule | On "Start championship": generates all rounds with rotating pairs ensuring each player partners every other player | XL | 📋 |
| CH-007 | Championship status machine | States: `waiting` → `active` → `finished`; transitions locked by business rules | M | 📋 |
| CH-008 | Empty state — no championships | Prompt to create first championship with illustrated empty state | S | 📋 |

**Epic total: 38 pts**

---

## E4 · Invites & Join `P0`

> Players join a championship by invite (creator-sent) or by self-joining via link/code.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| INV-001 | Creator invites player by phone number | Looks up user by phone; if found sends in-app invite; if not found sends SMS with install link | M | 📋 |
| INV-002 | Creator invites player by username or email | Search field finds registered users; sends in-app invite notification | M | 📋 |
| INV-003 | Generate shareable invite link | Unique link per championship; expires when championship starts or max players reached | S | 📋 |
| INV-004 | Generate 6-digit join code | Shown in championship settings; player enters code on Join screen | S | 📋 |
| INV-005 | Player joins via invite link (deep link) | Link opens app → Join screen with championship preview → one-tap join | M | 📋 |
| INV-006 | Player joins via 6-digit code | Manual entry fallback for when deep links fail | S | 📋 |
| INV-007 | Player accepts or declines in-app invite | Invite appears in notification center; accept adds to roster; decline removes invite | M | 📋 |
| INV-008 | Waiting room screen | Creator sees roster with join status (accepted / pending / invited); count vs max players | M | 📋 |
| INV-009 | Creator removes player before start | Player removed from roster; their slot opens; they receive a notification | S | 📋 |
| INV-010 | Max player enforcement | Join attempts beyond max players are rejected with friendly error | XS | 📋 |
| INV-011 | Cancel pending invite | Creator can retract an unanswered invite | XS | 📋 |

**Epic total: 31 pts**

---

## E5 · Match Results `P0`

> Any player in the championship can register a result. Admins can edit or delete.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| MR-001 | Register match result | Options: pair A wins / pair A wins TB / pair B wins TB / pair B wins; optional score field; updates ranking in real-time | M | 📋 |
| MR-002 | Real-time ranking update | All users viewing the championship see ranking update without manual refresh (Supabase realtime) | M | 📋 |
| MR-003 | Prevent duplicate result | If match already has a result, show it with "Edit" CTA (admin only) instead of register form | S | 📋 |
| MR-004 | Match detail view | Shows both pairs with avatars, result, score, timestamp of registration, registered-by | S | 📋 |

**Epic total: 13 pts**

---

## E6 · Ranking `P0`

> Live ranking drives the championship experience.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| RK-001 | Live ranking table | Sorted by pts desc → wins desc; updates on any result change | M | 📋 |
| RK-002 | Points breakdown per player | Tap player row → modal shows: pts, wins, losses, tie-breaks, matches played | S | 📋 |
| RK-003 | Tiebreaker rules applied | Equal pts → sort by wins; equal wins → sort by tie-breaks won | S | 📋 |
| RK-004 | My position highlight | Logged-in user's row always highlighted in ranking list | XS | 📋 |

**Epic total: 10 pts**

---

## E7 · Notifications `P1`

> Keep all players in the loop without requiring them to open the app.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| NT-001 | Push notification setup | Expo Notifications + Supabase Edge Function trigger; stores device token per user | L | 📋 |
| NT-002 | Notify when match result registered | Both pairs in the match receive: "Result registered — X & Y beat A & B (6-4)" | M | 📋 |
| NT-003 | Notify creator when roster is full | "All 12 players have joined — you can start the championship" | S | 📋 |
| NT-004 | Notify all players when championship starts | "Liga dos Amigos has started! Check your first round matches" | S | 📋 |
| NT-005 | Notify all players when champion is crowned | "🏆 Yuri Martins is the Rei da Quadra with 28 pts!" | S | 📋 |
| NT-006 | Notify player when invited to championship | "Carlos Pagnano invited you to join Liga dos Amigos" | S | 📋 |
| NT-007 | In-app notification center | Bell icon in header; lists recent notifications; marks as read on open | L | 📋 |
| NT-008 | Notification preferences | Per-user toggle: results / invites / championship events / all | M | 📋 |

**Epic total: 30 pts**

---

## E8 · Champion & Finalization `P1`

> Close the championship officially and celebrate the winner.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| CF-001 | Admin finalizes championship | "End championship" CTA (only when all matches played, or manual override); sets status to `finished` | M | 📋 |
| CF-002 | Champion reveal screen | Animated crown, floating stars, player avatar, final points — matches existing prototype design | M | 📋 |
| CF-003 | Final podium (top 3) | 1st / 2nd / 3rd podium bars with avatars and points | S | 📋 |
| CF-004 | Share champion result card | Generates image card (expo-sharing); shareable to WhatsApp, Instagram, etc. | L | 📋 |
| CF-005 | Championship archive | Finished championships move to "Histórico" section; read-only view | S | 📋 |

**Epic total: 21 pts**

---

## E9 · Admin Controls `P1`

> Championship creator has admin powers to correct mistakes and manage the roster.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| AD-001 | Edit match result | Admin-only; opens register screen pre-filled; saves new result; recalculates ranking | M | 📋 |
| AD-002 | Delete match result | Admin-only; confirmation dialog; resets match to pending; recalculates ranking | S | 📋 |
| AD-003 | Remove player from active championship | Admin-only; player's results remain but they can no longer register results | M | 📋 |
| AD-004 | Transfer admin role | Admin selects another player to become admin; original admin becomes regular player | S | 📋 |
| AD-005 | Cancel championship | Admin-only; confirmation required; notifies all players; deletes all data | M | 📋 |
| AD-006 | Championship settings screen | Edit name, sport, max players (before start only); view join code and invite link | S | 📋 |

**Epic total: 20 pts**

---

## E10 · Profile & Career `P2`

> Richer player identity and cross-championship stats.

| ID | Story | AC | Points | Status |
|----|-------|----|--------|--------|
| PR-001 | Upload profile photo | Camera or gallery picker; stored in Supabase Storage; shown as circular avatar everywhere | M | 📋 |
| PR-002 | Edit profile | Name, nickname, phone number, profile photo | S | 📋 |
| PR-003 | Career stats across championships | Total pts, total wins, win rate, championships played, championships won | M | 📋 |
| PR-004 | Head-to-head record | Profile shows W/L record vs each opponent across all championships | L | 📋 |
| PR-005 | Win streak tracking | Current streak + longest streak; shown on profile | M | 📋 |
| PR-006 | Best partner stat | Player who you've won most with; shown on profile | M | 📋 |
| PR-007 | Shareable profile link | Public URL showing career stats; no account required to view | L | 📋 |

**Epic total: 27 pts**

---

## Summary

| Epic | Priority | Points | Stories |
|------|----------|--------|---------|
| E1 · Foundation | P0 | 26 | 8 |
| E2 · Auth | P0 | 22 | 8 |
| E3 · Championships | P0 | 38 | 8 |
| E4 · Invites & Join | P0 | 31 | 11 |
| E5 · Match Results | P0 | 13 | 4 |
| E6 · Ranking | P0 | 10 | 4 |
| E7 · Notifications | P1 | 30 | 8 |
| E8 · Champion & Finalization | P1 | 21 | 5 |
| E9 · Admin Controls | P1 | 20 | 6 |
| E10 · Profile & Career | P2 | 27 | 7 |
| **Total** | | **238 pts** | **69 stories** |

### MVP scope (P0): 140 pts across 43 stories
### Launch scope (P0+P1): 211 pts across 62 stories
