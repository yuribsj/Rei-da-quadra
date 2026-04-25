import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, ScrollView, Share,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Avatar from '../../components/Avatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { computeRanking } from '../../lib/rankings';
import { Match, Membership, RankingEntry, UserProfile } from '../../lib/types';
import { useTheme } from '../../contexts/ThemeContext';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'ChampionReveal'>;
  route:      RouteProp<HomeStackParamList, 'ChampionReveal'>;
};

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Floating star particle ────────────────────────────────────────────────────

const STAR_CONFIGS = [
  { x: 0.12, size: 16, delay: 0,   emoji: '⭐' },
  { x: 0.28, size: 12, delay: 120, emoji: '✨' },
  { x: 0.45, size: 20, delay: 60,  emoji: '⭐' },
  { x: 0.60, size: 14, delay: 200, emoji: '✨' },
  { x: 0.75, size: 18, delay: 80,  emoji: '⭐' },
  { x: 0.88, size: 12, delay: 160, emoji: '✨' },
];

// ─── Podium bar ────────────────────────────────────────────────────────────────

const PODIUM_HEIGHTS = [140, 100, 80];
const PODIUM_COLORS  = ['#D4A843', '#B0BEC5', '#CD7F32'];
const PODIUM_MEDALS  = ['👑', '🥈', '🥉'];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChampionRevealScreen({ navigation, route }: Props) {
  const { championshipId, championshipName } = route.params;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const PodiumBar = ({ entry, position }: { entry: RankingEntry; position: 0 | 1 | 2 }) => {
    const h     = PODIUM_HEIGHTS[position];
    const color = PODIUM_COLORS[position];
    const medal = PODIUM_MEDALS[position];
    return (
      <View style={styles.podiumColumn}>
        <Avatar
          name={entry.nickname ?? entry.name}
          imageUrl={entry.avatarUrl}
          size={position === 0 ? 56 : 44}
        />
        <Text style={styles.podiumName} numberOfLines={1}>
          {entry.nickname ?? entry.name}
        </Text>
        <Text style={styles.podiumPts}>{entry.points} pts</Text>
        <View style={[styles.podiumBar, { height: h, backgroundColor: color + '33', borderColor: color }]}>
          <Text style={[styles.podiumMedal, { color }]}>{medal}</Text>
          <Text style={[styles.podiumPos, { color }]}>{position + 1}°</Text>
        </View>
      </View>
    );
  };

  // Animation refs
  const crownScale   = useRef(new Animated.Value(0)).current;
  const contentAnim  = useRef(new Animated.Value(0)).current;
  const podiumAnim   = useRef(new Animated.Value(0)).current;
  const starAnims    = useRef(
    STAR_CONFIGS.map(() => ({ y: new Animated.Value(0), opacity: new Animated.Value(0) })),
  ).current;

  const load = useCallback(async () => {
    const [membersRes, roundsRes] = await Promise.all([
      supabase
        .from('memberships')
        .select('*, users!user_id(id, name, nickname, avatar_url, phone, created_at)')
        .eq('championship_id', championshipId)
        .eq('status', 'accepted'),
      supabase
        .from('rounds')
        .select('*, matches(*, results(*))')
        .eq('championship_id', championshipId),
    ]);

    const members  = (membersRes.data ?? []) as Membership[];
    const profiles = members.map(m => m.users).filter(Boolean) as UserProfile[];
    const matches  = (roundsRes.data ?? []).flatMap((r: any) => r.matches ?? []) as Match[];
    const computed = computeRanking(matches, profiles);

    setRanking(computed);
    setLoading(false);
  }, [championshipId]);

  useEffect(() => { load(); }, [load]);

  // Start animations once data loads
  useEffect(() => {
    if (loading) return;

    // Crown bounce
    Animated.sequence([
      Animated.spring(crownScale, { toValue: 1.3, useNativeDriver: true, tension: 55, friction: 4 }),
      Animated.spring(crownScale, { toValue: 1.0, useNativeDriver: true, tension: 80, friction: 6 }),
    ]).start();

    // Stars float up with stagger
    starAnims.forEach((anim, i) => {
      const cfg = STAR_CONFIGS[i];
      Animated.sequence([
        Animated.delay(cfg.delay),
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(anim.y,       { toValue: -180, duration: 1600, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 0, duration: 1200, delay: 400, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // Champion identity fades in
    Animated.timing(contentAnim, {
      toValue: 1, duration: 700, delay: 600, useNativeDriver: true,
    }).start();

    // Podium slides up
    Animated.timing(podiumAnim, {
      toValue: 1, duration: 600, delay: 1000, useNativeDriver: true,
    }).start();
  }, [loading]);

  const champion = ranking[0];
  const top3     = ranking.slice(0, 3);
  // Podium order: 2nd (left), 1st (centre), 3rd (right)
  const podiumOrder = [
    top3[1] ?? null,
    top3[0] ?? null,
    top3[2] ?? null,
  ] as (RankingEntry | null)[];

  const handleShare = async () => {
    const lines = [
      t('championReveal.shareTitle', { name: championshipName }),
      '',
      ...ranking.slice(0, 3).map((e, i) => {
        const medals = ['👑', '🥈', '🥉'];
        return `${medals[i]} ${e.nickname ?? e.name} — ${e.points} pts`;
      }),
      '',
      t('championReveal.shareFooter'),
    ];
    await Share.share({ message: lines.join('\n') });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>{t('championReveal.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('championReveal.back')}</Text>
        </TouchableOpacity>

        {/* Floating stars */}
        <View style={styles.starsLayer} pointerEvents="none">
          {starAnims.map((anim, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.star,
                {
                  left:    STAR_CONFIGS[i].x * SCREEN_W,
                  fontSize: STAR_CONFIGS[i].size,
                  opacity: anim.opacity,
                  transform: [{ translateY: anim.y }],
                },
              ]}
            >
              {STAR_CONFIGS[i].emoji}
            </Animated.Text>
          ))}
        </View>

        {/* Crown */}
        <Animated.Text style={[styles.crown, { transform: [{ scale: crownScale }] }]}>
          👑
        </Animated.Text>

        {/* Champion identity */}
        <Animated.View style={[styles.championSection, { opacity: contentAnim }]}>
          <Text style={styles.championLabel}>{t('championReveal.champion')}</Text>
          <Avatar
            name={champion?.nickname ?? champion?.name ?? '?'}
            imageUrl={champion?.avatarUrl}
            size={96}
          />
          <Text style={styles.championName}>
            {champion?.nickname ?? champion?.name ?? '—'}
          </Text>
          {champion?.nickname && (
            <Text style={styles.championFullName}>{champion.name}</Text>
          )}
          <View style={styles.ptsRow}>
            <Text style={styles.ptsValue}>{champion?.points ?? 0}</Text>
            <Text style={styles.ptsUnit}>pts</Text>
          </View>
          <Text style={styles.champTitle}>{championshipName}</Text>
        </Animated.View>

        {/* Podium (CF-003) */}
        {top3.length > 0 && (
          <Animated.View
            style={[
              styles.podiumSection,
              {
                opacity: podiumAnim,
                transform: [{ translateY: podiumAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              },
            ]}
          >
            <Text style={styles.podiumTitle}>{t('championReveal.podiumTitle')}</Text>
            <View style={styles.podiumRow}>
              {podiumOrder.map((entry, colIdx) => {
                if (!entry) return <View key={colIdx} style={styles.podiumColumnEmpty} />;
                // Map column index to ranking position: col 0 = 2nd, col 1 = 1st, col 2 = 3rd
                const pos = ([1, 0, 2] as const)[colIdx];
                return <PodiumBar key={entry.userId} entry={entry} position={pos} />;
              })}
            </View>
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: podiumAnim }]}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>{t('championReveal.shareResult')}</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:               { flex: 1, backgroundColor: colors.bg },
  scroll:             { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  loadingWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:        { color: colors.textMuted, fontSize: 16 },

  backBtn:            { alignSelf: 'flex-start', padding: spacing.lg },
  backText:           { color: colors.textMuted, fontSize: 14 },

  // Stars
  starsLayer:         { position: 'absolute', top: 80, left: 0, right: 0, height: 300, pointerEvents: 'none' } as any,
  star:               { position: 'absolute', bottom: 0 },

  // Crown
  crown:              { fontSize: 80, marginTop: 16, marginBottom: 8 },

  // Champion identity
  championSection:    { alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: 36 },
  championLabel:      { fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' },
  championAvatar:     { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface2, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  championAvatarText: { fontSize: 40, fontWeight: '900', color: colors.accent },
  championName:       { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center', letterSpacing: -0.5 },
  championFullName:   { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  ptsRow:             { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 16, marginBottom: 8 },
  ptsValue:           { fontSize: 56, fontWeight: '900', color: colors.accent, lineHeight: 60 },
  ptsUnit:            { fontSize: 20, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  champTitle:         { fontSize: 13, color: colors.textDim, fontStyle: 'italic' },

  // Podium
  podiumSection:      { width: '100%', paddingHorizontal: spacing.lg, marginBottom: 32 },
  podiumTitle:        { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 2, textAlign: 'center', marginBottom: 20, textTransform: 'uppercase' },
  podiumRow:          { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  podiumColumn:       { flex: 1, alignItems: 'center', gap: 4 },
  podiumColumnEmpty:  { flex: 1 },
  podiumAvatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  podiumAvatarFirst:  { width: 56, height: 56, borderRadius: 28, borderColor: colors.accent, borderWidth: 2 },
  podiumAvatarText:   { fontSize: 16, fontWeight: '800', color: colors.accent },
  podiumName:         { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },
  podiumPts:          { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  podiumBar:          { width: '100%', borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  podiumMedal:        { fontSize: 20 },
  podiumPos:          { fontSize: 14, fontWeight: '900' },

  // Actions
  actions:            { paddingHorizontal: spacing.xl, width: '100%', gap: 12 },
  shareBtn:           { backgroundColor: `rgba(${colors.accentRgb},0.12)`, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.3)` },
  shareBtnText:       { fontSize: 15, fontWeight: '700', color: colors.accent },
});
