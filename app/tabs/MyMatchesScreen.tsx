import { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { MatchOutcome } from '../../lib/types';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import Avatar from '../../components/Avatar';

interface PlayerInfo {
  name:      string;
  nickname:  string | null;
  avatarUrl: string | null;
}

interface DisplayMatch {
  id:          string;
  roundNumber: number;
  pair1: [PlayerInfo, PlayerInfo];
  pair2: [PlayerInfo, PlayerInfo];
  inPair1:     boolean;
  result: {
    outcome: MatchOutcome;
    score:   string | null;
    points:  number;
    won:     boolean;
    tb:      boolean;
    pair1Won: boolean;
  } | null;
}

interface ChampSection {
  championshipId:   string;
  championshipName: string;
  status:           string;
  matches:          DisplayMatch[];
}

const PTS: Record<MatchOutcome, [number, number]> = {
  p1win: [3, 0],
  p1tb:  [2, 1],
  p2tb:  [1, 2],
  p2win: [0, 3],
};

export default function MyMatchesScreen() {
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

  const [sections,  setSections]  = useState<ChampSection[]>([]);
  const [allChamps, setAllChamps] = useState<{ id: string; name: string }[]>([]);
  const [filter, setFilter]       = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    const userId = user!.id;

    const { data: memberData } = await supabase
      .from('memberships')
      .select('championship_id, championships(id, name, status)')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!memberData?.length) {
      setSections([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const champMeta = new Map<string, { name: string; status: string }>();
    (memberData as any[]).forEach(m => {
      if (m.championships) {
        champMeta.set(m.championship_id, {
          name:   m.championships.name,
          status: m.championships.status,
        });
      }
    });
    const champIds = [...champMeta.keys()];

    setAllChamps(
      champIds.map(id => ({ id, name: champMeta.get(id)!.name })),
    );

    const { data: matchData } = await supabase
      .from('matches')
      .select('*, rounds(round_number), results(*)')
      .in('championship_id', champIds)
      .or(
        `pair1_player1_id.eq.${userId},pair1_player2_id.eq.${userId},` +
        `pair2_player1_id.eq.${userId},pair2_player2_id.eq.${userId}`,
      );

    if (!matchData?.length) {
      setSections([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const playerIds = new Set<string>();
    (matchData as any[]).forEach(m => {
      playerIds.add(m.pair1_player1_id);
      playerIds.add(m.pair1_player2_id);
      playerIds.add(m.pair2_player1_id);
      playerIds.add(m.pair2_player2_id);
    });

    const { data: profileData } = await supabase
      .from('users')
      .select('id, name, nickname, avatar_url')
      .in('id', [...playerIds]);

    const profileOf = new Map<string, PlayerInfo>();
    (profileData ?? []).forEach((p: any) =>
      profileOf.set(p.id, { name: p.name ?? '—', nickname: p.nickname ?? null, avatarUrl: p.avatar_url }),
    );
    const getInfo = (id: string): PlayerInfo => profileOf.get(id) ?? { name: '—', nickname: null, avatarUrl: null };

    const buckets = new Map<string, DisplayMatch[]>();
    champIds.forEach(id => buckets.set(id, []));

    for (const m of matchData as any[]) {
      const inPair1 = m.pair1_player1_id === userId || m.pair1_player2_id === userId;

      const raw = (Array.isArray(m.results) ? m.results[0] : m.results) ?? null;
      let result: DisplayMatch['result'] = null;

      if (raw) {
        const [p1pts, p2pts] = PTS[raw.outcome as MatchOutcome];
        const points = inPair1 ? p1pts : p2pts;
        const oppPts = inPair1 ? p2pts : p1pts;
        const pair1Won = raw.outcome === 'p1win' || raw.outcome === 'p1tb';
        result = {
          outcome:  raw.outcome,
          score:    raw.score,
          points,
          won:      points > oppPts,
          tb:       raw.outcome === 'p1tb' || raw.outcome === 'p2tb',
          pair1Won,
        };
      }

      buckets.get(m.championship_id)?.push({
        id:          m.id,
        roundNumber: m.rounds?.round_number ?? 0,
        pair1:       [getInfo(m.pair1_player1_id), getInfo(m.pair1_player2_id)],
        pair2:       [getInfo(m.pair2_player1_id), getInfo(m.pair2_player2_id)],
        inPair1,
        result,
      });
    }

    buckets.forEach(list => list.sort((a, b) => a.roundNumber - b.roundNumber));

    const built: ChampSection[] = champIds
      .filter(id => (buckets.get(id)?.length ?? 0) > 0)
      .map(id => ({
        championshipId:   id,
        championshipName: champMeta.get(id)!.name,
        status:           champMeta.get(id)!.status,
        matches:          buckets.get(id)!,
      }))
      .sort((a, b) => {
        const order: Record<string, number> = { active: 0, finished: 1, waiting: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });

    setSections(built);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const showFilter = allChamps.length > 1;
  const filteredSections = filter
    ? sections.filter(s => s.championshipId === filter)
    : sections;

  const parseScoreSets = (score: string | null): [number, number][] => {
    if (!score) return [];
    return score.split('/').map(s => {
      const parts = s.trim().split('-').map(Number);
      return [parts[0] ?? 0, parts[1] ?? 0] as [number, number];
    });
  };

  const renderMatchCard = (match: DisplayMatch) => {
    const { result } = match;
    const pair1Won = result?.pair1Won ?? false;
    const pair2Won = result ? !pair1Won : false;
    const isTiebreak = result?.tb ?? false;
    const isSingles = match.pair1[0].name === match.pair1[1].name;
    const sets = result ? parseScoreSets(result.score) : [];

    return (
      <View
        key={match.id}
        style={[styles.matchCard, result && styles.matchCardDone]}
      >
        <View style={styles.roundRow}>
          <Text style={styles.roundLabel}>{t('myMatches.round', { number: match.roundNumber })}</Text>
          {result && (
            <Text style={[styles.resultPts, result.won ? styles.resultPtsWon : styles.resultPtsLost]}>
              {result.won ? '+' : ''}{result.points} pts
            </Text>
          )}
        </View>

        {/* Scoreboard table */}
        <View style={styles.scoreboardWrap}>
          {/* TB label on top of last set column */}
          {result && isTiebreak && sets.length > 0 && (
            <View style={styles.tbRow}>
              <View style={styles.tbSpacer} />
              <View style={styles.tbCells}>
                {sets.map((_, i) => (
                  <View key={i} style={styles.tbCellSlot}>
                    {i === sets.length - 1 && (
                      <View style={styles.tbBadge}>
                        <Text style={styles.tbBadgeText}>TB</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.scoreboard}>
            {/* Pair 1 row */}
            <View style={[styles.scoreRow, result && { opacity: pair1Won ? 1 : 0.45 }]}>
              <View style={styles.scoreRowPlayers}>
                <View style={styles.scoreAvatars}>
                  <Avatar name={match.pair1[0].nickname ?? match.pair1[0].name} imageUrl={match.pair1[0].avatarUrl} size={24} />
                  {!isSingles && <Avatar name={match.pair1[1].nickname ?? match.pair1[1].name} imageUrl={match.pair1[1].avatarUrl} size={24} />}
                </View>
                <View style={styles.pairDetails}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName} numberOfLines={1}>{match.pair1[0].name}</Text>
                    {match.pair1[0].nickname && <Text style={styles.playerNickname} numberOfLines={1}>{match.pair1[0].nickname}</Text>}
                  </View>
                  {!isSingles && (
                    <>
                      <Text style={styles.pairAmp}>&</Text>
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName} numberOfLines={1}>{match.pair1[1].name}</Text>
                        {match.pair1[1].nickname && <Text style={styles.playerNickname} numberOfLines={1}>{match.pair1[1].nickname}</Text>}
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.scoreCells}>
                {sets.map((s, i) => (
                  <View key={i} style={[styles.scoreCell, s[0] > s[1] && styles.scoreCellWon]}>
                    <Text style={[styles.scoreCellText, s[0] > s[1] && styles.scoreCellTextWon]}>{s[0]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* VS divider */}
            <View style={styles.vsDivider}>
              <View style={styles.vsLine} />
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.vsLine} />
            </View>

            {/* Pair 2 row */}
            <View style={[styles.scoreRow, result && { opacity: pair2Won ? 1 : 0.45 }]}>
              <View style={styles.scoreRowPlayers}>
                <View style={styles.scoreAvatars}>
                  <Avatar name={match.pair2[0].nickname ?? match.pair2[0].name} imageUrl={match.pair2[0].avatarUrl} size={24} />
                  {!isSingles && <Avatar name={match.pair2[1].nickname ?? match.pair2[1].name} imageUrl={match.pair2[1].avatarUrl} size={24} />}
                </View>
                <View style={styles.pairDetails}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName} numberOfLines={1}>{match.pair2[0].name}</Text>
                    {match.pair2[0].nickname && <Text style={styles.playerNickname} numberOfLines={1}>{match.pair2[0].nickname}</Text>}
                  </View>
                  {!isSingles && (
                    <>
                      <Text style={styles.pairAmp}>&</Text>
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName} numberOfLines={1}>{match.pair2[1].name}</Text>
                        {match.pair2[1].nickname && <Text style={styles.playerNickname} numberOfLines={1}>{match.pair2[1].nickname}</Text>}
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.scoreCells}>
                {sets.map((s, i) => (
                  <View key={i} style={[styles.scoreCell, s[1] > s[0] && styles.scoreCellWon]}>
                    <Text style={[styles.scoreCellText, s[1] > s[0] && styles.scoreCellTextWon]}>{s[1]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {result && (
          <View style={styles.closedRow}>
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>{t('myMatches.closed')}</Text>
            </View>
          </View>
        )}

        {!result && (
          <View style={styles.pendingRow}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{t('myMatches.awaitingResult')}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('myMatches.title')}</Text>
        </View>
        <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('myMatches.title')}</Text>
      </View>

      {showFilter && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          <TouchableOpacity
            style={[styles.filterChip, !filter && styles.filterChipActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[styles.filterChipText, !filter && styles.filterChipTextActive]}>
              {t('myMatches.all')}
            </Text>
          </TouchableOpacity>
          {allChamps.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.filterChip, filter === c.id && styles.filterChipActive]}
              onPress={() => setFilter(c.id)}
            >
              <Text
                style={[styles.filterChipText, filter === c.id && styles.filterChipTextActive]}
                numberOfLines={1}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎾</Text>
          <Text style={styles.emptyTitle}>{t('myMatches.noMatches')}</Text>
          <Text style={styles.emptyBody}>
            {t('myMatches.noMatchesHint')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {filteredSections.map(section => (
            <View key={section.championshipId} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionName} numberOfLines={1}>{section.championshipName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[section.status] ?? colors.textMuted) + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[section.status] ?? colors.textMuted }]}>
                    {STATUS_LABEL[section.status] ?? section.status}
                  </Text>
                </View>
              </View>

              {section.matches.map(renderMatchCard)}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title:          { fontSize: 22, fontWeight: '800', color: colors.text },

  filterBar:          { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 8 },
  filterChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterChipActive:   { borderColor: colors.accent, backgroundColor: `rgba(${colors.accentRgb},0.12)` },
  filterChipText:     { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterChipTextActive: { color: colors.accent, fontWeight: '700' },

  list:           { padding: spacing.lg, paddingBottom: 40, gap: 20 },

  section:        { gap: 8 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionName:    { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text, marginRight: 8 },
  statusBadge:    { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:     { fontSize: 11, fontWeight: '700' },

  matchCard:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  matchCardDone:  { backgroundColor: colors.cardDoneBg, borderColor: colors.cardDoneBorder },

  roundRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  roundLabel:     { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultPts:      { fontSize: 12, fontWeight: '800' },
  resultPtsWon:   { color: '#4CAF50' },
  resultPtsLost:  { color: colors.textMuted },

  // Scoreboard
  scoreboardWrap:   {},
  tbRow:            { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  tbSpacer:         { flex: 1 },
  tbCells:          { flexDirection: 'row', gap: 4 },
  tbCellSlot:       { width: 28, alignItems: 'center' },
  tbBadge:          { backgroundColor: `rgba(${colors.accentRgb},0.15)`, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tbBadgeText:      { fontSize: 9, color: colors.accent, fontWeight: '800', letterSpacing: 0.5 },

  scoreboard:       { gap: 6 },
  scoreRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreRowPlayers:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  scoreAvatars:     { flexDirection: 'row', gap: -6 },
  pairDetails:      { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  playerInfo:       {},
  playerName:       { fontSize: 13, fontWeight: '700', color: colors.text },
  playerNickname:   { fontSize: 10, color: colors.text, opacity: 0.7, marginTop: 1 },
  pairAmp:          { fontSize: 11, fontWeight: '700', color: colors.accent, marginHorizontal: 2, marginTop: 2 },
  scoreCells:       { flexDirection: 'row', gap: 4 },
  scoreCell:        { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  scoreCellWon:     { backgroundColor: `rgba(${colors.accentRgb},0.15)` },
  scoreCellText:    { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  scoreCellTextWon: { color: colors.accent, fontWeight: '800' },

  vsDivider:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2, paddingLeft: 4 },
  vsLine:         { width: 14, height: 1.5, backgroundColor: colors.accent, opacity: 0.4 },
  vsText:         { fontSize: 11, fontWeight: '800', color: colors.accent, opacity: 0.7 },

  closedRow:      { marginTop: 8 },
  closedBadge:    { backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  closedBadgeText:{ fontSize: 10, color: '#4CAF50', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  pendingRow:     { marginTop: 8 },
  pendingBadge:   { backgroundColor: `rgba(${colors.accentRgb},0.1)`, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: colors.accent },

  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon:      { fontSize: 56, marginBottom: 20 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyBody:      { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
