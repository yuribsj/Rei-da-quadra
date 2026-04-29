# Onboarding & Tutorials — Design Spec

## Overview

Add a first-time onboarding walkthrough (5-slide animated carousel) and persistent scoring tooltips to help new users understand the app and scoring system.

## Scope

- **Onboarding carousel** — 5 full-screen slides shown once after profile setup, before HomeScreen
- **Scoring tooltips** — "?" icon on dashboard stats grid and ranking tab, opening a modal with scoring breakdown
- **Replay tutorial** — settings row in ProfileScreen to re-watch the walkthrough
- **Out of scope** — sample championship, coach marks, contextual per-feature tooltips

## Onboarding Flow

### Trigger

```
No session           → AuthNavigator
Session, no nickname → ProfileSetupScreen
Session, nickname, !onboarding_done → OnboardingScreen
Session, nickname, onboarding_done  → AppNavigator
```

`onboarding_done` is stored in AsyncStorage (`@onboarding_done`). No DB changes needed.

### Slides

**Slide 1 — Welcome**
- Icon: 👑 (crown bounces in with spring, sparkles pulse around it, gold glow behind)
- Title: "Bem-vindo ao Rei da Quadra!"
- Subtitle: "Organize campeonatos de padel americano com seus amigos."
- Text fades up staggered (title → subtitle, 200ms delay between)

**Slide 2 — How it works**
- Visual: mini court with 4 colored player circles (A/B/C/D) that swap positions in a loop
- Title: "Como funciona"
- Subtitle: "Duplas rotativas em rodadas todos-contra-todos."
- Court fades in first, then players drop in, "VS" pulses between pairs

**Slide 3 — Scoring (interactive)**
- Title: "Pontuação"
- 4 scoring rows, each slides in from left with 200ms stagger:
  - 🏆 Vitória direta → 3 pts (green)
  - 💪 Vitória no tie-break → 2 pts (gold)
  - 👊 Derrota no tie-break → 1 pt (orange)
  - 😤 Derrota direta → 0 pts (red)
- Points scale up from 0 when row appears
- Each row's background color glows once on entrance

**Slide 4 — Track progress**
- Visual: mini dashboard replica showing rank circle (1º), progress bar, stats
- Title: "Acompanhe tudo"
- Subtitle: "Dashboard, ranking ao vivo e histórico completo."
- Rank circle scales in with spring bounce
- Progress bar fills from 0% → 66% smoothly
- Stats text fades up below

**Slide 5 — Get started**
- Icon: 🚀 (slides up from below with bounce)
- Title: "Bora pra quadra!"
- Subtitle: "Crie seu primeiro campeonato ou entre com um código."
- CTA button: "Entrar na quadra 🎾" — pulses with gold glow
- Text fades up staggered

### Navigation

- Horizontal `ScrollView` with `pagingEnabled` (swipe between slides)
- Dot indicators at bottom (active dot = gold `#D4A843`, inactive = `#333`)
- Active dot is 8px, inactive 6px
- "Próximo →" button on slides 1-4
- "Entrar na quadra 🎾" button on slide 5 (completes onboarding)
- "Pular" (skip) link at top-right on all slides — completes onboarding immediately

### Completion

On completing (last slide CTA or skip):
1. Set `@onboarding_done = 'true'` in AsyncStorage
2. Component sets state → `App.tsx` renders `AppNavigator`

## Scoring Tooltip

### Component: `ScoringTooltip.tsx`

A reusable modal showing the 4-row scoring breakdown. Same content/styling as onboarding slide 3 but in a `Modal` container.

**Content:**
- Title: "Sistema de Pontuação" / "Scoring System" / "Sistema de Puntuación"
- Subtitle: "Como funciona o placar"
- 4 rows: emoji + outcome name + description + points (same as onboarding)
- "Fechar" button at bottom

### Placement

1. **Dashboard tab** (ChampionshipDetailScreen `renderDashboardTab`) — small 28px "?" circle below the stats grid, right-aligned. Gold border + gold "?" text.

2. **Ranking tab** (ChampionshipDetailScreen `renderRankingTab`) — same "?" circle near the ranking header area.

Both open the same `ScoringTooltip` modal via `useState<boolean>`.

### Styling

- "?" circle: 28×28px, `colors.surface` background, 1px `colors.accent` border, centered "?" in `colors.accent`
- Modal: centered card, `colors.surface` background, 16px border-radius, semi-transparent overlay backdrop
- Rows: same pattern as onboarding slide 3 (emoji + text + colored points)

## Replay Tutorial

### ProfileScreen

Add a new row in the settings section (between "Language" and "Sign out"):
- Icon: 🎓
- Label: "Tutorial" / "Tutorial" / "Tutorial"
- On press: present `OnboardingScreen` as a modal (full-screen)
- On completion: dismiss modal (no AsyncStorage change needed — already `true`)

## i18n Keys

### New keys (all 3 languages):

**`onboarding` section:**
- `slide1Title` — "Bem-vindo ao Rei da Quadra!" / "Welcome to Rei da Quadra!" / "¡Bienvenido a Rei da Quadra!"
- `slide1Subtitle` — "Organize campeonatos..." / "Organize padel americano..." / "Organiza campeonatos..."
- `slide2Title` — "Como funciona" / "How it works" / "Cómo funciona"
- `slide2Subtitle` — "Duplas rotativas em rodadas todos-contra-todos." / "Rotating pairs in round-robin rounds." / "Duplas rotativas en rondas todos-contra-todos."
- `slide3Title` — "Pontuação" / "Scoring" / "Puntuación"
- `slide4Title` — "Acompanhe tudo" / "Track everything" / "Sigue todo"
- `slide4Subtitle` — "Dashboard, ranking ao vivo e histórico completo." / "Dashboard, live ranking, and full match history." / "Dashboard, ranking en vivo e historial completo."
- `slide5Title` — "Bora pra quadra!" / "Let's hit the court!" / "¡Vamos a la cancha!"
- `slide5Subtitle` — "Crie seu primeiro campeonato ou entre com um código." / "Create your first championship or join with a code." / "Crea tu primer campeonato o únete con un código."
- `slide5Btn` — "Entrar na quadra 🎾" / "Enter the court 🎾" / "Entrar a la cancha 🎾"
- `next` — "Próximo" / "Next" / "Siguiente"
- `skip` — "Pular" / "Skip" / "Saltar"

**`scoringTooltip` section:**
- `title` — "Sistema de Pontuação" / "Scoring System" / "Sistema de Puntuación"
- `subtitle` — "Como funciona o placar" / "How scoring works" / "Cómo funciona el marcador"
- `directWin` — "Vitória direta" / "Direct win" / "Victoria directa"
- `directWinDesc` — "Ganhou os dois sets" / "Won both sets" / "Ganó los dos sets"
- `tbWin` — "Vitória no tie-break" / "Tiebreak win" / "Victoria en tie-break"
- `tbWinDesc` — "Ganhou no set desempate" / "Won the deciding set" / "Ganó en el set de desempate"
- `tbLoss` — "Derrota no tie-break" / "Tiebreak loss" / "Derrota en tie-break"
- `tbLossDesc` — "Perdeu no set desempate" / "Lost the deciding set" / "Perdió en el set de desempate"
- `directLoss` — "Derrota direta" / "Direct loss" / "Derrota directa"
- `directLossDesc` — "Perdeu os dois sets" / "Lost both sets" / "Perdió los dos sets"

**`profile` section (add):**
- `tutorial` — "Tutorial" / "Tutorial" / "Tutorial"

## New Files

| File | Purpose |
|------|---------|
| `components/OnboardingScreen.tsx` | 5-slide animated carousel |
| `components/ScoringTooltip.tsx` | Reusable scoring modal |

## Modified Files

| File | Change |
|------|--------|
| `App.tsx` | Add AsyncStorage check + OnboardingScreen between profile setup and AppNavigator |
| `app/championships/ChampionshipDetailScreen.tsx` | Add "?" buttons on dashboard + ranking tabs, ScoringTooltip state |
| `app/tabs/ProfileScreen.tsx` | Add "Tutorial" row + modal presentation |
| `lib/i18n/pt.ts` | Add `onboarding` + `scoringTooltip` + `profile.tutorial` keys |
| `lib/i18n/en.ts` | Same |
| `lib/i18n/es.ts` | Same |

## Animation Implementation

All animations use React Native `Animated` API (already used in `SplashScreen.tsx`). No extra dependencies.

Key patterns to reuse from SplashScreen:
- `Animated.spring` for bounce/scale effects
- `Animated.timing` with `useNativeDriver: true` for opacity/translate
- `Animated.sequence` + `Animated.delay` for staggering
- `Animated.loop` for repeating animations (sparkles, player swap, pulse)
