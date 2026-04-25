import { useCallback, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { ProfileStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<ProfileStackParamList, 'CareerHistory'> };

interface ChampStat {
  championshipId:   string;
  name:             string;
  status:           string;
  played:           number;
  wins:             number;
  tbWins:           number;
  tbLosses:         number;
  losses:           number;
  points:           number;
}

export default function CareerHistoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const STATUS_LABEL: Record<string, string> = {
    waiting:  t('status.waiting'),
    active:   t('status.active'),
    finished: t('status.finished'),
  };

  const STATUS_COLOR: Record<string, string> = {
    waiting:  colors.textMuted,
    active:   colors.accent,
    finished: '#4CAF50',
  };

  const [stats,   setStats]   = useState<ChampStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const userId = user!.id;

    const { data: memberData } = await supabase
      .from('memberships')
      .select('championship_id, championships(id, name, status)')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!memberData || memberData.length === 0) {
      setStats([]);
      setLoading(false);
      return;
    }

    const champMeta = new Map<string, { name: string; status: string }>();
    memberData.forEach((m: any) => {
      if (m.championships) {
        champMeta.set(m.championship_id, {
          name:   m.championships.name,
          status: m.championships.status,
        });
      }
    });
    const champIds = [...champMeta.keys()];

    const { data: matchData } = await supabase
      .from('matches')
      .select('championship_id, pair1_player1_id, pair1_player2_id, pair2_player1_id, pair2_player2_id, results(outcome)')
      .in('championship_id', champIds)
      .or(
        `pair1_player1_id.eq.${userId},pair1_player2_id.eq.${userId},` +
        `pair2_player1_id.eq.${userId},pair2_player2_id.eq.${userId}`,
      );

    const buckets = new Map<string, Omit<ChampStat, 'championshipId' | 'name' | 'status'>>();
    champIds.forEach(id => buckets.set(id, { played: 0, wins: 0, tbWins: 0, tbLosses: 0, losses: 0, points: 0 }));

    for (const m of (matchData ?? []) as any[]) {
      const result = Array.isArray(m.results) ? m.results[0] : m.results ?? null;
      if (!result) continue;

      const bucket = buckets.get(m.championship_id);
      if (!bucket) continue;

      bucket.played++;
      const inPair1 = m.pair1_player1_id === userId || m.pair1_player2_id === userId;
      const outcome = result.outcome as string;

      if (inPair1) {
        if      (outcome === 'p1win') { bucket.wins++;     bucket.points += 3; }
        else if (outcome === 'p1tb')  { bucket.tbWins++;   bucket.points += 2; }
        else if (outcome === 'p2tb')  { bucket.tbLosses++; bucket.points += 1; }
        else                          { bucket.losses++;                        }
      } else {
        if      (outcome === 'p2win') { bucket.wins++;     bucket.points += 3; }
        else if (outcome === 'p2tb')  { bucket.tbWins++;   bucket.points += 2; }
        else if (outcome === 'p1tb')  { bucket.tbLosses++; bucket.points += 1; }
        else                          { bucket.losses++;                        }
      }
    }

    const result: ChampStat[] = champIds.map(id => {
      const meta   = champMeta.get(id)!;
      const bucket = buckets.get(id)!;
      return { championshipId: id, name: meta.name, status: meta.status, ...bucket };
    });

    result.sort((a, b) => {
      const order = { finished: 0, active: 1, waiting: 2 };
      const diff = (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });

    setStats(result);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('careerHistory.title')}</Text>
        </View>
        <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('careerHistory.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {stats.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎾</Text>
            <Text style={styles.emptyTitle}>{t('careerHistory.noChampionships')}</Text>
            <Text style={styles.emptyBody}>{t('careerHistory.noChampionshipsHint')}</Text>
          </View>
        ) : (
          stats.map(s => {
            const winRate = s.played > 0
              ? Math.round((s.wins + s.tbWins) / s.played * 100)
              : 0;
            return (
              <View key={s.championshipId} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName} numberOfLines={1}>{s.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[s.status] ?? colors.textMuted) + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[s.status] ?? colors.textMuted }]}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.ptsRow}>
                  <Text style={styles.ptsValue}>{s.points}</Text>
                  <Text style={styles.ptsUnit}>pts</Text>
                  <View style={styles.winRateBadge}>
                    <Text style={styles.winRateText}>{t('careerHistory.winRateLabel', { rate: winRate })}</Text>
                  </View>
                </View>

                <View style={styles.recordRow}>
                  <View style={styles.recordItem}>
                    <Text style={[styles.recordValue, { color: '#4CAF50' }]}>{s.wins}</Text>
                    <Text style={styles.recordLabel}>{t('careerHistory.winsLabel')}</Text>
                  </View>
                  <View style={styles.recordItem}>
                    <Text style={[styles.recordValue, { color: colors.accent }]}>{s.tbWins}</Text>
                    <Text style={styles.recordLabel}>{t('careerHistory.tbPlusLabel')}</Text>
                  </View>
                  <View style={styles.recordItem}>
                    <Text style={[styles.recordValue, { color: colors.warning }]}>{s.tbLosses}</Text>
                    <Text style={styles.recordLabel}>{t('careerHistory.tbMinusLabel')}</Text>
                  </View>
                  <View style={styles.recordItem}>
                    <Text style={[styles.recordValue, { color: colors.error }]}>{s.losses}</Text>
                    <Text style={styles.recordLabel}>{t('careerHistory.lossesLabel')}</Text>
                  </View>
                  <View style={styles.recordItem}>
                    <Text style={[styles.recordValue, { color: colors.textMuted }]}>{s.played}</Text>
                    <Text style={styles.recordLabel}>{t('careerHistory.matchesLabel')}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12 },
  backBtn:        { padding: 4 },
  backText:       { fontSize: 22, color: colors.textMuted },
  title:          { fontSize: 20, fontWeight: '800', color: colors.text },

  list:           { padding: spacing.lg, paddingBottom: 40, gap: 12 },

  card:           { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 12 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName:       { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  statusBadge:    { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:     { fontSize: 11, fontWeight: '700' },

  ptsRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  ptsValue:       { fontSize: 40, fontWeight: '900', color: colors.accent, lineHeight: 44 },
  ptsUnit:        { fontSize: 16, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  winRateBadge:   { marginLeft: 'auto' as any, backgroundColor: `rgba(${colors.accentRgb},0.1)`, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  winRateText:    { fontSize: 12, fontWeight: '700', color: colors.accent },

  recordRow:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  recordItem:     { flex: 1, alignItems: 'center', gap: 2 },
  recordValue:    { fontSize: 18, fontWeight: '800' },
  recordLabel:    { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  empty:          { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon:      { fontSize: 56 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyBody:      { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
