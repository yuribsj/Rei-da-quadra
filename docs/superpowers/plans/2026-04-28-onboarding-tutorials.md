# Onboarding & Tutorials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-time onboarding walkthrough (5-slide animated carousel) and persistent scoring tooltips so new users understand the app and scoring system.

**Architecture:** New `OnboardingScreen` component shown between profile setup and app entry via AsyncStorage flag. Reusable `ScoringTooltip` modal placed on championship dashboard + ranking tabs. All animations use React Native `Animated` API (same patterns as existing `SplashScreen.tsx`). No DB changes — purely client-side.

**Tech Stack:** React Native, Expo, `Animated` API, `@react-native-async-storage/async-storage`, `react-i18next`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/i18n/pt.ts` | Modify | Add `onboarding` + `scoringTooltip` + `profile.tutorial` keys (Portuguese) |
| `lib/i18n/en.ts` | Modify | Same keys (English) |
| `lib/i18n/es.ts` | Modify | Same keys (Spanish) |
| `components/ScoringTooltip.tsx` | Create | Reusable modal showing 4-row scoring breakdown |
| `components/OnboardingScreen.tsx` | Create | 5-slide animated carousel with per-slide animations |
| `App.tsx` | Modify | AsyncStorage check + OnboardingScreen gate |
| `app/championships/ChampionshipDetailScreen.tsx` | Modify | Add "?" buttons on dashboard + ranking tabs |
| `app/tabs/ProfileScreen.tsx` | Modify | Add "Tutorial" row + modal presentation |

---

### Task 1: i18n Keys

**Files:**
- Modify: `lib/i18n/pt.ts`
- Modify: `lib/i18n/en.ts`
- Modify: `lib/i18n/es.ts`

- [ ] **Step 1: Add onboarding + scoringTooltip sections to pt.ts**

Add before the closing `} as const;` at the end of the file, after the `languages` section:

```typescript
  // ── Onboarding ──────────────────────────────────────────────────────────────
  onboarding: {
    slide1Title: 'Bem-vindo ao\nRei da Quadra!',
    slide1Subtitle: 'Organize campeonatos de padel americano com seus amigos.',
    slide2Title: 'Como funciona',
    slide2Subtitle: 'Duplas rotativas em rodadas todos-contra-todos.',
    slide3Title: 'Pontuação',
    slide4Title: 'Acompanhe tudo',
    slide4Subtitle: 'Dashboard, ranking ao vivo e histórico completo de partidas.',
    slide5Title: 'Bora pra quadra!',
    slide5Subtitle: 'Crie seu primeiro campeonato ou entre com um código de convite.',
    slide5Btn: 'Entrar na quadra 🎾',
    next: 'Próximo',
    skip: 'Pular',
  },

  // ── Scoring Tooltip ─────────────────────────────────────────────────────────
  scoringTooltip: {
    title: 'Sistema de Pontuação',
    subtitle: 'Como funciona o placar',
    directWin: 'Vitória direta',
    directWinDesc: 'Ganhou os dois sets',
    tbWin: 'Vitória no tie-break',
    tbWinDesc: 'Ganhou no set desempate',
    tbLoss: 'Derrota no tie-break',
    tbLossDesc: 'Perdeu no set desempate',
    directLoss: 'Derrota direta',
    directLossDesc: 'Perdeu os dois sets',
  },
```

Also add `tutorial: 'Tutorial',` inside the existing `profile` section, after the `language` key.

- [ ] **Step 2: Add same sections to en.ts**

```typescript
  onboarding: {
    slide1Title: 'Welcome to\nRei da Quadra!',
    slide1Subtitle: 'Organize padel americano championships with your friends.',
    slide2Title: 'How it works',
    slide2Subtitle: 'Rotating pairs in round-robin rounds.',
    slide3Title: 'Scoring',
    slide4Title: 'Track everything',
    slide4Subtitle: 'Dashboard, live ranking, and full match history.',
    slide5Title: "Let's hit the court!",
    slide5Subtitle: 'Create your first championship or join with a code.',
    slide5Btn: 'Enter the court 🎾',
    next: 'Next',
    skip: 'Skip',
  },

  scoringTooltip: {
    title: 'Scoring System',
    subtitle: 'How scoring works',
    directWin: 'Direct win',
    directWinDesc: 'Won both sets',
    tbWin: 'Tiebreak win',
    tbWinDesc: 'Won the deciding set',
    tbLoss: 'Tiebreak loss',
    tbLossDesc: 'Lost the deciding set',
    directLoss: 'Direct loss',
    directLossDesc: 'Lost both sets',
  },
```

Add `tutorial: 'Tutorial',` inside `profile` section after `language`.

- [ ] **Step 3: Add same sections to es.ts**

```typescript
  onboarding: {
    slide1Title: '¡Bienvenido a\nRei da Quadra!',
    slide1Subtitle: 'Organiza campeonatos de padel americano con tus amigos.',
    slide2Title: 'Cómo funciona',
    slide2Subtitle: 'Duplas rotativas en rondas todos-contra-todos.',
    slide3Title: 'Puntuación',
    slide4Title: 'Sigue todo',
    slide4Subtitle: 'Dashboard, ranking en vivo e historial completo de partidas.',
    slide5Title: '¡Vamos a la cancha!',
    slide5Subtitle: 'Crea tu primer campeonato o únete con un código de invitación.',
    slide5Btn: 'Entrar a la cancha 🎾',
    next: 'Siguiente',
    skip: 'Saltar',
  },

  scoringTooltip: {
    title: 'Sistema de Puntuación',
    subtitle: 'Cómo funciona el marcador',
    directWin: 'Victoria directa',
    directWinDesc: 'Ganó los dos sets',
    tbWin: 'Victoria en tie-break',
    tbWinDesc: 'Ganó en el set de desempate',
    tbLoss: 'Derrota en tie-break',
    tbLossDesc: 'Perdió en el set de desempate',
    directLoss: 'Derrota directa',
    directLossDesc: 'Perdió los dos sets',
  },
```

Add `tutorial: 'Tutorial',` inside `profile` section after `language`.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/pt.ts lib/i18n/en.ts lib/i18n/es.ts
git commit -m "feat: add i18n keys for onboarding and scoring tooltip"
```

---

### Task 2: ScoringTooltip Component

**Files:**
- Create: `components/ScoringTooltip.tsx`

- [ ] **Step 1: Create the ScoringTooltip component**

Create `components/ScoringTooltip.tsx`:

```typescript
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, ThemeColors } from '../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ROWS = [
  { emoji: '🏆', key: 'directWin',  descKey: 'directWinDesc',  pts: '3 pts', color: '#4CAF50' },
  { emoji: '💪', key: 'tbWin',      descKey: 'tbWinDesc',      pts: '2 pts', color: '#D4A843' },
  { emoji: '👊', key: 'tbLoss',     descKey: 'tbLossDesc',     pts: '1 pt',  color: '#FF9800' },
  { emoji: '😤', key: 'directLoss', descKey: 'directLossDesc', pts: '0 pts', color: '#EF5350' },
] as const;

export default function ScoringTooltip({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{t('scoringTooltip.title')}</Text>
          <Text style={styles.subtitle}>{t('scoringTooltip.subtitle')}</Text>

          {ROWS.map(row => (
            <View key={row.key} style={[styles.row, { backgroundColor: row.color + '14' }]}>
              <Text style={styles.emoji}>{row.emoji}</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t(`scoringTooltip.${row.key}`)}</Text>
                <Text style={styles.rowDesc}>{t(`scoringTooltip.${row.descKey}`)}</Text>
              </View>
              <Text style={[styles.rowPts, { color: row.color }]}>{row.pts}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: colors.border },
  title:     { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 },
  subtitle:  { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, marginBottom: 8 },
  emoji:     { fontSize: 24 },
  rowText:   { flex: 1 },
  rowLabel:  { fontSize: 13, fontWeight: '700', color: colors.text },
  rowDesc:   { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  rowPts:    { fontSize: 18, fontWeight: '800' },
  closeBtn:  { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 32, alignSelf: 'center', marginTop: 12 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ScoringTooltip.tsx
git commit -m "feat: add ScoringTooltip modal component"
```

---

### Task 3: OnboardingScreen Component

**Files:**
- Create: `components/OnboardingScreen.tsx`

This is the largest task. The component renders 5 slides in a paging `ScrollView`, each with per-slide animations triggered when the slide becomes active. A "Skip" link appears at top-right, dot indicators + Next/CTA button at bottom.

- [ ] **Step 1: Create OnboardingScreen.tsx**

Create `components/OnboardingScreen.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, NativeScrollEvent, NativeSyntheticEvent,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, ThemeColors } from '../constants/theme';

const { width: W } = Dimensions.get('window');

type Props = {
  onFinish: () => void;
};

// ── Slide 1: Welcome ──────────────────────────────────────────────────────────

function WelcomeSlide({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const crownScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(16)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslate = useRef(new Animated.Value(16)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    Animated.spring(crownScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }).start();
    Animated.timing(glowOpacity, { toValue: 0.35, duration: 600, delay: 100, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(subTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    sparkleAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 800, delay: i * 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    });
  }, [active]);

  return (
    <View style={[slideStyles.container, { backgroundColor: colors.bg }]}>
      <View style={slideStyles.center}>
        <Animated.View style={{ opacity: glowOpacity, position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(212,168,67,0.12)' }} />
        <View style={{ position: 'relative' }}>
          <Animated.Text style={[slideStyles.icon, { transform: [{ scale: crownScale }] }]}>👑</Animated.Text>
          {[{ top: -5, left: -15, size: 18 }, { top: 10, right: -20, size: 14 }, { bottom: 5, left: 0, size: 16 }].map((pos, i) => (
            <Animated.Text key={i} style={[{ position: 'absolute', fontSize: pos.size, opacity: sparkleAnims[i] }, pos]}>✨</Animated.Text>
          ))}
        </View>
        <Animated.Text style={[slideStyles.title, { color: colors.text, opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
          {t('onboarding.slide1Title')}
        </Animated.Text>
        <Animated.Text style={[slideStyles.subtitle, { color: colors.textMuted, opacity: subOpacity, transform: [{ translateY: subTranslate }] }]}>
          {t('onboarding.slide1Subtitle')}
        </Animated.Text>
      </View>
    </View>
  );
}

// ── Slide 2: How it works ──────────────────────────────────────────────────────

const PLAYER_COLORS = ['#D4A843', '#4CAF50', '#2196F3', '#EF5350'];
const PLAYER_LABELS = ['A', 'B', 'C', 'D'];
const PLAYER_TEXT_COLORS = ['#000', '#000', '#fff', '#fff'];

function HowItWorksSlide({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const courtOpacity = useRef(new Animated.Value(0)).current;
  const playerScales = useRef(PLAYER_LABELS.map(() => new Animated.Value(0))).current;
  const playerBounce = useRef(PLAYER_LABELS.map(() => new Animated.Value(0))).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(16)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslate = useRef(new Animated.Value(16)).current;
  const vsOpacity = useRef(new Animated.Value(0.3)).current;
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    Animated.timing(courtOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(subTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    playerScales.forEach((scale, i) => {
      Animated.sequence([
        Animated.delay(300 + i * 150),
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      ]).start();
    });

    playerBounce.forEach((b, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.timing(b, { toValue: -8, duration: 600, useNativeDriver: true }),
          Animated.timing(b, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(vsOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(vsOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [active]);

  const positions = [
    { top: 15, left: 25 },
    { top: 15, right: 25 },
    { bottom: 15, left: 25 },
    { bottom: 15, right: 25 },
  ];

  return (
    <View style={[slideStyles.container, { backgroundColor: colors.bg }]}>
      <View style={slideStyles.center}>
        <Animated.Text style={[slideStyles.title, { color: colors.text, opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
          {t('onboarding.slide2Title')}
        </Animated.Text>

        <Animated.View style={[{ width: 200, height: 140, marginVertical: 24, position: 'relative' }, { opacity: courtOpacity }]}>
          <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: colors.border }} />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.border }} />
          <Animated.Text style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -8, marginLeft: -10, fontSize: 12, fontWeight: '800', color: colors.textMuted, opacity: vsOpacity }}>VS</Animated.Text>

          {PLAYER_LABELS.map((label, i) => (
            <Animated.View key={label} style={[{ position: 'absolute', ...positions[i] }, { transform: [{ scale: playerScales[i] }, { translateY: playerBounce[i] }] }]}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: PLAYER_COLORS[i], alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: PLAYER_TEXT_COLORS[i] }}>{label}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.Text style={[slideStyles.subtitle, { color: colors.textMuted, opacity: subOpacity, transform: [{ translateY: subTranslate }] }]}>
          {t('onboarding.slide2Subtitle')}
        </Animated.Text>
      </View>
    </View>
  );
}

// ── Slide 3: Scoring ──────────────────────────────────────────────────────────

const SCORE_ROWS = [
  { emoji: '🏆', key: 'directWin',  pts: '3 pts', color: '#4CAF50' },
  { emoji: '💪', key: 'tbWin',      pts: '2 pts', color: '#D4A843' },
  { emoji: '👊', key: 'tbLoss',     pts: '1 pt',  color: '#FF9800' },
  { emoji: '😤', key: 'directLoss', pts: '0 pts', color: '#EF5350' },
] as const;

function ScoringSlide({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(16)).current;
  const rowAnims = useRef(SCORE_ROWS.map(() => ({
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(-30),
    ptsScale: new Animated.Value(0.5),
  }))).current;
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(titleTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    rowAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(200 + i * 200),
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim.translateX, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(200),
            Animated.spring(anim.ptsScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  }, [active]);

  return (
    <View style={[slideStyles.container, { backgroundColor: colors.bg }]}>
      <View style={slideStyles.center}>
        <Animated.Text style={[slideStyles.title, { color: colors.text, opacity: titleOpacity, transform: [{ translateY: titleTranslate }], marginBottom: 24 }]}>
          {t('onboarding.slide3Title')}
        </Animated.Text>

        {SCORE_ROWS.map((row, i) => (
          <Animated.View key={row.key} style={[
            {
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: row.color + '14', padding: 12, borderRadius: radius.md,
              marginBottom: 8, width: W - 80,
            },
            { opacity: rowAnims[i].opacity, transform: [{ translateX: rowAnims[i].translateX }] },
          ]}>
            <Text style={{ fontSize: 22 }}>{row.emoji}</Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.text }}>
              {t(`scoringTooltip.${row.key}`)}
            </Text>
            <Animated.Text style={[{ fontSize: 18, fontWeight: '800', color: row.color }, { transform: [{ scale: rowAnims[i].ptsScale }] }]}>
              {row.pts}
            </Animated.Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ── Slide 4: Track Progress ───────────────────────────────────────────────────

function TrackProgressSlide({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(16)).current;
  const rankScale = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslate = useRef(new Animated.Value(16)).current;
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(titleTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.spring(rankScale, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
    ]).start();

    // barWidth uses layout animation (non-native driver)
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(barWidth, { toValue: 1, duration: 1200, useNativeDriver: false }),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(subTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [active]);

  const barInterpolation = barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '66%'] });

  return (
    <View style={[slideStyles.container, { backgroundColor: colors.bg }]}>
      <View style={slideStyles.center}>
        <Animated.Text style={[slideStyles.title, { color: colors.text, opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
          {t('onboarding.slide4Title')}
        </Animated.Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginVertical: 24, width: W - 80, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Animated.View style={[
              { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
              { transform: [{ scale: rankScale }] },
            ]}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.accent }}>1º</Text>
            </Animated.View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Seu ranking</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>8 pontos</Text>
            </View>
          </View>

          <View style={{ backgroundColor: colors.bg, borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 8 }}>
            <Animated.View style={{ height: '100%', width: barInterpolation, backgroundColor: colors.accent, borderRadius: 6 }} />
          </View>
          <Text style={{ fontSize: 10, color: colors.textMuted }}>4/6 partidas jogadas</Text>
        </View>

        <Animated.Text style={[slideStyles.subtitle, { color: colors.textMuted, opacity: subOpacity, transform: [{ translateY: subTranslate }] }]}>
          {t('onboarding.slide4Subtitle')}
        </Animated.Text>
      </View>
    </View>
  );
}

// ── Slide 5: Get Started ──────────────────────────────────────────────────────

function GetStartedSlide({ active, onFinish }: { active: boolean; onFinish: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const rocketTranslate = useRef(new Animated.Value(40)).current;
  const rocketScale = useRef(new Animated.Value(0.5)).current;
  const rocketOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(16)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslate = useRef(new Animated.Value(16)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    Animated.parallel([
      Animated.spring(rocketTranslate, { toValue: 0, tension: 40, friction: 5, useNativeDriver: true }),
      Animated.spring(rocketScale, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
      Animated.timing(rocketOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(subTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Pulse loop on button
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(btnScale, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [active]);

  return (
    <View style={[slideStyles.container, { backgroundColor: colors.bg }]}>
      <View style={slideStyles.center}>
        <Animated.Text style={[slideStyles.icon, { opacity: rocketOpacity, transform: [{ translateY: rocketTranslate }, { scale: rocketScale }] }]}>🚀</Animated.Text>
        <Animated.Text style={[slideStyles.title, { color: colors.text, opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
          {t('onboarding.slide5Title')}
        </Animated.Text>
        <Animated.Text style={[slideStyles.subtitle, { color: colors.textMuted, opacity: subOpacity, transform: [{ translateY: subTranslate }] }]}>
          {t('onboarding.slide5Subtitle')}
        </Animated.Text>
        <Animated.View style={{ opacity: btnOpacity, transform: [{ scale: btnScale }], marginTop: 32 }}>
          <TouchableOpacity
            style={{ backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 40, borderRadius: radius.md }}
            onPress={onFinish}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', textAlign: 'center' }}>
              {t('onboarding.slide5Btn')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Main OnboardingScreen ─────────────────────────────────────────────────────

export default function OnboardingScreen({ onFinish }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    if (idx !== page) setPage(idx);
  };

  const goNext = () => {
    if (page < 4) {
      scrollRef.current?.scrollTo({ x: (page + 1) * W, animated: true });
    }
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }]}>
      {/* Skip */}
      <TouchableOpacity style={slideStyles.skipBtn} onPress={onFinish}>
        <Text style={[slideStyles.skipText, { color: colors.textMuted }]}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        <WelcomeSlide active={page === 0} />
        <HowItWorksSlide active={page === 1} />
        <ScoringSlide active={page === 2} />
        <TrackProgressSlide active={page === 3} />
        <GetStartedSlide active={page === 4} onFinish={onFinish} />
      </ScrollView>

      {/* Dots + Next button */}
      <View style={slideStyles.footer}>
        <View style={slideStyles.dots}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={[
              slideStyles.dot,
              i === page ? { width: 8, height: 8, backgroundColor: colors.accent } : { width: 6, height: 6, backgroundColor: '#333' },
            ]} />
          ))}
        </View>
        {page < 4 && (
          <TouchableOpacity style={[slideStyles.nextBtn, { backgroundColor: colors.accent }]} onPress={goNext}>
            <Text style={slideStyles.nextBtnText}>{t('onboarding.next')} →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  container: { width: W, flex: 1, justifyContent: 'center', alignItems: 'center' },
  center:    { alignItems: 'center', paddingHorizontal: 40 },
  icon:      { fontSize: 72, marginBottom: 16 },
  title:     { fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 32 },
  subtitle:  { fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  skipBtn:   { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 8 },
  skipText:  { fontSize: 14, fontWeight: '600' },
  footer:    { paddingBottom: 48, alignItems: 'center', gap: 20 },
  dots:      { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot:       { borderRadius: 10 },
  nextBtn:   { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#000', textAlign: 'center' },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/OnboardingScreen.tsx
git commit -m "feat: add OnboardingScreen 5-slide animated carousel"
```

---

### Task 4: Wire OnboardingScreen into App.tsx

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Add AsyncStorage check and OnboardingScreen gate**

Modify `App.tsx`:

1. Add imports at the top:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './components/OnboardingScreen';
```

2. Inside `RootNavigator`, add state + effect after the existing `useAuth`/`useTheme` hooks:

```typescript
const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

useEffect(() => {
  AsyncStorage.getItem('@onboarding_done').then(val => {
    setOnboardingDone(val === 'true');
  });
}, []);
```

3. Update the loading check — also wait for onboarding state:

Replace:
```typescript
if (loading) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} />
  );
}
```

With:
```typescript
if (loading || onboardingDone === null) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} />
  );
}
```

4. Add the onboarding gate between profile setup and AppNavigator. Replace:

```typescript
// Fully onboarded → Main app
return <AppNavigator />;
```

With:

```typescript
// Onboarding not done → Show walkthrough
if (!onboardingDone) {
  return (
    <OnboardingScreen
      onFinish={async () => {
        await AsyncStorage.setItem('@onboarding_done', 'true');
        setOnboardingDone(true);
      }}
    />
  );
}

// Fully onboarded → Main app
return <AppNavigator />;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Test manually**

Run: `npm start`

Test the following:
1. Clear onboarding flag: in the app's debug console or via `AsyncStorage.removeItem('@onboarding_done')`
2. Log in with a user that already has a nickname set
3. OnboardingScreen should appear with slide 1
4. Swipe through all 5 slides — verify animations play on each
5. Tap "Pular" (skip) — should go to HomeScreen
6. Kill and reopen app — should go straight to HomeScreen (flag persisted)
7. New user flow: sign up → profile setup → onboarding → HomeScreen

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: wire onboarding screen into app root with AsyncStorage gate"
```

---

### Task 5: Add Scoring Tooltip to ChampionshipDetailScreen

**Files:**
- Modify: `app/championships/ChampionshipDetailScreen.tsx`

- [ ] **Step 1: Add import and state**

Add import at the top of the file:

```typescript
import ScoringTooltip from '../../components/ScoringTooltip';
```

Add state inside the component function, alongside the other `useState` calls:

```typescript
const [scoringVisible, setScoringVisible] = useState(false);
```

- [ ] **Step 2: Add "?" button to dashboard tab**

In `renderDashboardTab()`, after the `dashStatsGrid` closing `</View>` tag (after line ~844), add:

```typescript
        {/* Scoring tooltip trigger */}
        <TouchableOpacity
          style={styles.scoringHelpBtn}
          onPress={() => setScoringVisible(true)}
        >
          <Text style={styles.scoringHelpText}>?</Text>
        </TouchableOpacity>
```

- [ ] **Step 3: Add "?" button to ranking tab**

In `renderRankingTab()`, inside the ScrollView, before the `ranking.map(...)` call (after the empty check), add:

```typescript
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.lg, marginBottom: 8 }}>
        <TouchableOpacity
          style={styles.scoringHelpBtn}
          onPress={() => setScoringVisible(true)}
        >
          <Text style={styles.scoringHelpText}>?</Text>
        </TouchableOpacity>
      </View>
```

- [ ] **Step 4: Add ScoringTooltip modal to the JSX**

At the end of the component's return JSX, just before the closing `</SafeAreaView>`, add:

```typescript
      <ScoringTooltip visible={scoringVisible} onClose={() => setScoringVisible(false)} />
```

- [ ] **Step 5: Add styles**

Add these styles to the `createStyles` function:

```typescript
  scoringHelpBtn:  { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  scoringHelpText: { fontSize: 14, fontWeight: '700', color: colors.accent },
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Test manually**

Run: `npm start`

1. Open an active championship → Dashboard tab → see "?" button below stats grid
2. Tap "?" → scoring modal appears with 4 rows + close button
3. Tap "Fechar" or overlay → modal closes
4. Go to Ranking tab → see "?" button at top-right
5. Tap "?" → same scoring modal appears
6. Verify both dark and light themes look correct

- [ ] **Step 8: Commit**

```bash
git add app/championships/ChampionshipDetailScreen.tsx
git commit -m "feat: add scoring tooltip to dashboard and ranking tabs"
```

---

### Task 6: Add Replay Tutorial to ProfileScreen

**Files:**
- Modify: `app/tabs/ProfileScreen.tsx`

- [ ] **Step 1: Add imports and state**

Add imports at the top:

```typescript
import { Modal } from 'react-native';
import OnboardingScreen from '../../components/OnboardingScreen';
```

Note: `Modal` may already be imported — if so, skip that import. Check the existing import from `react-native` and add `Modal` to it if not already present.

Add state inside the component:

```typescript
const [tutorialOpen, setTutorialOpen] = useState(false);
```

- [ ] **Step 2: Add Tutorial row in settings section**

After the language `TouchableOpacity` + `Modal` block (around line 240, after the language modal's closing tag and before `</View>`), add a new row:

```typescript
          <TouchableOpacity style={styles.row} onPress={() => setTutorialOpen(true)}>
            <Text style={styles.rowLabel}>🎓  {t('profile.tutorial')}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
```

Also change the language row from `[styles.row, styles.rowLast]` to just `styles.row` (since it's no longer the last row), and add `styles.rowLast` to the new tutorial row instead:

Change the tutorial row to:
```typescript
          <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={() => setTutorialOpen(true)}>
```

- [ ] **Step 3: Add Tutorial modal**

Right after the tutorial `TouchableOpacity`, add the modal:

```typescript
          <Modal visible={tutorialOpen} animationType="slide" onRequestClose={() => setTutorialOpen(false)}>
            <OnboardingScreen onFinish={() => setTutorialOpen(false)} />
          </Modal>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Test manually**

Run: `npm start`

1. Go to Profile tab → see "🎓 Tutorial" row between Language and Sign out
2. Tap it → onboarding carousel appears as full-screen modal
3. Swipe through all slides — animations play
4. Tap "Pular" or finish slide 5 → modal closes, back to Profile
5. Verify it doesn't reset the AsyncStorage flag (app still skips onboarding on next launch)

- [ ] **Step 6: Commit**

```bash
git add app/tabs/ProfileScreen.tsx
git commit -m "feat: add replay tutorial option to profile settings"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: End-to-end manual test**

Test the complete flow:

1. **New user flow:** Sign up → Profile setup → Onboarding carousel (5 slides with animations) → HomeScreen
2. **Returning user:** Kill app → reopen → goes straight to HomeScreen (skips onboarding)
3. **Replay tutorial:** Profile → Tutorial → carousel plays again → close
4. **Scoring tooltip dashboard:** Open championship → Dashboard tab → tap "?" → modal → close
5. **Scoring tooltip ranking:** Ranking tab → tap "?" → modal → close
6. **Skip:** New user → tap "Pular" on slide 1 → goes to HomeScreen
7. **Language:** Change language to English → replay tutorial → text is in English. Same for Spanish.
8. **Theme:** Toggle light mode → replay tutorial → colors adapt. Check scoring tooltip too.

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address onboarding review feedback"
```

Plan complete and saved to `docs/superpowers/plans/2026-04-28-onboarding-tutorials.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?