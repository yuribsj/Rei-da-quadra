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
