import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Championship, Match, Membership, UserProfile } from '../../lib/types';
import Avatar from '../../components/Avatar';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeList'> };

interface ChampionshipRow extends Championship {
  memberCount: number;
  matchesPlayed: number;
  matchesTotal:  number;
}

interface PendingInvite extends Membership {
  championships: Championship;
}

interface QuickStats {
  winRate:         number;
  matchesPlayed:   number;
  championships:   number;
}

interface NextMatchInfo {
  match:            Match;
  championshipId:   string;
  championshipName: string;
  players:          Map<string, UserProfile>;
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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

  const [championships, setChampionships] = useState<ChampionshipRow[]>([]);
  const [invites, setInvites]             = useState<PendingInvite[]>([]);
  const [stats, setStats]                 = useState<QuickStats | null>(null);
  const [nextMatch, setNextMatch]         = useState<NextMatchInfo | null>(null);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const activeChampionships   = championships.filter(c => c.status !== 'finished');
  const finishedChampionships = championships.filter(c => c.status === 'finished');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const userId = user!.id;

    const [champsRes, invitesRes, myMemberships, myMatches] = await Promise.all([
      supabase
        .from('championships')
        .select('*, memberships(count)')
        .order('created_at', { ascending: false }),
      supabase
        .from('memberships')
        .select('*, championships(*)')
        .eq('user_id', userId)
        .eq('status', 'invited'),
      supabase
        .from('memberships')
        .select('championship_id')
        .eq('user_id', userId)
        .eq('status', 'accepted'),
      supabase
        .from('matches')
        .select('pair1_player1_id, pair1_player2_id, pair2_player1_id, pair2_player2_id, results(outcome)')
        .or(
          `pair1_player1_id.eq.${userId},pair1_player2_id.eq.${userId},` +
          `pair2_player1_id.eq.${userId},pair2_player2_id.eq.${userId}`,
        ),
    ]);

    // ── Quick stats ──
    const myChampIds = (myMemberships.data ?? []).map((m: any) => m.championship_id);
    let wins = 0, tbWins = 0, played = 0;
    for (const m of (myMatches.data ?? []) as any[]) {
      const result = Array.isArray(m.results) ? m.results[0] : m.results ?? null;
      if (!result) continue;
      played++;
      const inPair1 = m.pair1_player1_id === userId || m.pair1_player2_id === userId;
      const outcome = result.outcome as string;
      if (inPair1) {
        if (outcome === 'p1win') wins++;
        else if (outcome === 'p1tb') tbWins++;
      } else {
        if (outcome === 'p2win') wins++;
        else if (outcome === 'p2tb') tbWins++;
      }
    }
    setStats({
      winRate: played > 0 ? Math.round((wins + tbWins) / played * 100) : 0,
      matchesPlayed: played,
      championships: myChampIds.length,
    });

    // ── Championships with match progress ──
    const champRows: ChampionshipRow[] = [];
    if (champsRes.data) {
      // Fetch all rounds+matches for active championships to compute progress
      const activeIds = champsRes.data
        .filter((c: any) => c.status === 'active')
        .map((c: any) => c.id);

      let matchesByChamp = new Map<string, { total: number; played: number }>();
      if (activeIds.length > 0) {
        const { data: roundsData } = await supabase
          .from('rounds')
          .select('championship_id, matches(id, results(id))')
          .in('championship_id', activeIds);

        for (const r of (roundsData ?? []) as any[]) {
          const entry = matchesByChamp.get(r.championship_id) ?? { total: 0, played: 0 };
          for (const m of (r.matches ?? [])) {
            entry.total++;
            const res = Array.isArray(m.results) ? m.results[0] : m.results;
            if (res) entry.played++;
          }
          matchesByChamp.set(r.championship_id, entry);
        }
      }

      for (const c of champsRes.data as any[]) {
        const progress = matchesByChamp.get(c.id);
        champRows.push({
          ...c,
          memberCount:   c.memberships?.[0]?.count ?? 0,
          matchesPlayed: progress?.played ?? 0,
          matchesTotal:  progress?.total ?? 0,
        });
      }
    }
    setChampionships(champRows);

    // ── Next pending match ──
    const activeChampIds = champRows
      .filter(c => c.status === 'active')
      .map(c => c.id);

    let foundNext: NextMatchInfo | null = null;
    if (activeChampIds.length > 0) {
      const { data: pendingMatches } = await supabase
        .from('matches')
        .select('*, results(id)')
        .in('championship_id', activeChampIds)
        .or(
          `pair1_player1_id.eq.${userId},pair1_player2_id.eq.${userId},` +
          `pair2_player1_id.eq.${userId},pair2_player2_id.eq.${userId}`,
        )
        .order('created_at', { ascending: true });

      const pending = (pendingMatches ?? []).find((m: any) => {
        const r = Array.isArray(m.results) ? m.results[0] : m.results;
        return !r;
      }) as Match | undefined;

      if (pending) {
        const champ = champRows.find(c => c.id === pending.championship_id);
        const playerIds = [
          pending.pair1_player1_id, pending.pair1_player2_id,
          pending.pair2_player1_id, pending.pair2_player2_id,
        ];
        const { data: profiles } = await supabase
          .from('users')
          .select('id, name, nickname, avatar_url, phone, created_at')
          .in('id', playerIds);

        const pMap = new Map<string, UserProfile>();
        (profiles ?? []).forEach((p: UserProfile) => pMap.set(p.id, p));

        foundNext = {
          match: pending,
          championshipId: pending.championship_id,
          championshipName: champ?.name ?? '',
          players: pMap,
        };
      }
    }
    setNextMatch(foundNext);

    setInvites((invitesRes.data ?? []) as PendingInvite[]);

    if (!silent) setLoading(false);
    else setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAccept = async (invite: PendingInvite) => {
    const champ = invite.championships;
    if (!champ) return;

    const { count } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('championship_id', champ.id)
      .eq('status', 'accepted');

    if ((count ?? 0) >= champ.max_players) {
      Alert.alert(t('home.championshipFull'), t('home.noSlotsLeft'));
      return;
    }

    await supabase
      .from('memberships')
      .update({ status: 'accepted', joined_at: new Date().toISOString() })
      .eq('id', invite.id);

    navigation.navigate('ChampionshipDetail', { id: champ.id, name: champ.name });
    load(true);
  };

  const handleDecline = async (invite: PendingInvite) => {
    Alert.alert(
      t('home.declineInvite'),
      t('home.declineConfirm', { name: invite.championships?.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.decline'),
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('memberships')
              .update({ status: 'declined' })
              .eq('id', invite.id);
            load(true);
          },
        },
      ],
    );
  };

  const renderInviteSection = () => {
    if (invites.length === 0) return null;
    return (
      <View style={styles.inviteSection}>
        <Text style={styles.sectionLabel}>{t('home.pendingInvites')}</Text>
        {invites.map(inv => (
          <View key={inv.id} style={styles.inviteCard}>
            <View style={styles.inviteInfo}>
              <Text style={styles.inviteName} numberOfLines={1}>
                {inv.championships?.name ?? '—'}
              </Text>
              <Text style={styles.inviteMeta}>
                🎾 {inv.championships?.sport ?? 'Padel'} · {inv.championships?.max_players} {t('home.players')}
              </Text>
            </View>
            <View style={styles.inviteActions}>
              <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(inv)}>
                <Text style={styles.declineBtnText}>{t('home.decline')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(inv)}>
                <Text style={styles.acceptBtnText}>{t('home.accept')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderChampionshipItem = (item: ChampionshipRow) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ChampionshipDetail', { id: item.id, name: item.name })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? colors.textMuted) + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? colors.textMuted }]}>
            {STATUS_LABEL[item.status]}
          </Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>🎾 {item.sport}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>
          {item.status === 'waiting'
            ? `${item.memberCount}/${item.max_players} ${t('home.players')}`
            : `${item.memberCount} ${t('home.players')}`}
        </Text>
      </View>
      {item.status === 'active' && item.matchesTotal > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(item.matchesPlayed / item.matchesTotal) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {t('home.matchesProgress', { played: item.matchesPlayed, total: item.matchesTotal })}
          </Text>
        </View>
      )}
      {item.status === 'waiting' && (
        <View style={styles.cardFooter}>
          <Text style={styles.codeLabel}>{t('home.code')}</Text>
          <Text style={styles.codeValue}>{item.invite_code}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderArchivedItem = (item: ChampionshipRow) => (
    <TouchableOpacity
      key={item.id}
      style={styles.archivedCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ChampionshipDetail', { id: item.id, name: item.name })}
    >
      <Text style={styles.archivedName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.archivedMeta}>
        <Text style={styles.archivedMetaText}>🎾 {item.sport}</Text>
        <Text style={styles.archivedMetaText}>·</Text>
        <Text style={styles.archivedMetaText}>{item.memberCount} {t('home.players')}</Text>
        <View style={styles.archivedRevealBtn}>
          <Text style={styles.archivedRevealText}>🏆 {t('home.viewResult')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.watermark} pointerEvents="none">
        <Image
          source={isDark ? require('../../assets/logo.png') : require('../../assets/logo-light.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('home.title')}</Text>
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => navigation.navigate('JoinChampionship')}
        >
          <Text style={styles.joinBtnText}>{t('home.join')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
      >
        {/* Quick stats banner */}
        {stats && stats.matchesPlayed > 0 && (
          <View style={styles.statsBanner}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.winRate}%</Text>
              <Text style={styles.statLabel}>{t('home.statsWinRate')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.matchesPlayed}</Text>
              <Text style={styles.statLabel}>{t('home.statsMatches')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.championships}</Text>
              <Text style={styles.statLabel}>{t('home.statsChampionships')}</Text>
            </View>
          </View>
        )}

        {/* Next pending match */}
        {nextMatch && (() => {
          const m = nextMatch.match;
          const p = (id: string) => nextMatch.players.get(id);
          const name = (id: string) => p(id)?.nickname ?? p(id)?.name ?? '—';
          const avatarUrl = (id: string) => p(id)?.avatar_url ?? null;
          const fullName = (id: string) => p(id)?.name ?? '—';
          const nick = (id: string) => p(id)?.nickname ?? null;
          const isSingles = m.pair1_player1_id === m.pair1_player2_id;
          return (
            <TouchableOpacity
              style={styles.nextMatchCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('RegisterResult', {
                  matchId: m.id,
                  championshipId: nextMatch.championshipId,
                  pair1Names: [fullName(m.pair1_player1_id), fullName(m.pair1_player2_id)],
                  pair2Names: [fullName(m.pair2_player1_id), fullName(m.pair2_player2_id)],
                  pair1Nicknames: [nick(m.pair1_player1_id), nick(m.pair1_player2_id)],
                  pair2Nicknames: [nick(m.pair2_player1_id), nick(m.pair2_player2_id)],
                  pair1Avatars: [avatarUrl(m.pair1_player1_id), avatarUrl(m.pair1_player2_id)],
                  pair2Avatars: [avatarUrl(m.pair2_player1_id), avatarUrl(m.pair2_player2_id)],
                })
              }
            >
              <Text style={styles.nextMatchLabel}>{t('home.nextMatch')}</Text>
              <Text style={styles.nextMatchChamp} numberOfLines={1}>{nextMatch.championshipName}</Text>
              <View style={styles.nextMatchTeams}>
                <View style={styles.nextMatchPair}>
                  <View style={styles.nextMatchAvatars}>
                    <Avatar name={name(m.pair1_player1_id)} imageUrl={avatarUrl(m.pair1_player1_id)} size={32} />
                    {!isSingles && <Avatar name={name(m.pair1_player2_id)} imageUrl={avatarUrl(m.pair1_player2_id)} size={32} />}
                  </View>
                  <Text style={styles.nextMatchPairNames} numberOfLines={1}>
                    {isSingles ? name(m.pair1_player1_id) : `${name(m.pair1_player1_id)} & ${name(m.pair1_player2_id)}`}
                  </Text>
                </View>
                <Text style={styles.nextMatchVs}>VS</Text>
                <View style={styles.nextMatchPair}>
                  <View style={styles.nextMatchAvatars}>
                    <Avatar name={name(m.pair2_player1_id)} imageUrl={avatarUrl(m.pair2_player1_id)} size={32} />
                    {!isSingles && <Avatar name={name(m.pair2_player2_id)} imageUrl={avatarUrl(m.pair2_player2_id)} size={32} />}
                  </View>
                  <Text style={styles.nextMatchPairNames} numberOfLines={1}>
                    {isSingles ? name(m.pair2_player1_id) : `${name(m.pair2_player1_id)} & ${name(m.pair2_player2_id)}`}
                  </Text>
                </View>
              </View>
              <View style={styles.nextMatchCta}>
                <Text style={styles.nextMatchCtaText}>{t('home.registerResult')}</Text>
              </View>
            </TouchableOpacity>
          );
        })()}

        {renderInviteSection()}
        {activeChampionships.map(renderChampionshipItem)}

        {championships.length === 0 && invites.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyCrown}>👑</Text>
            <Text style={styles.emptyTitle}>{t('home.noChampionships')}</Text>
            <Text style={styles.emptyBody}>{t('home.noChampionshipsHint')}</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateChampionship')}
              >
                <Text style={styles.createBtnText}>{t('home.create')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.joinBtnLarge}
                onPress={() => navigation.navigate('JoinChampionship')}
              >
                <Text style={styles.joinBtnLargeText}>{t('home.joinWithCode')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {finishedChampionships.length > 0 && (
          <View style={styles.archiveSection}>
            <Text style={styles.sectionLabel}>{t('home.history')}</Text>
            {finishedChampionships.map(renderArchivedItem)}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateChampionship')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center' },

  watermark:       { position: 'absolute', width: '90%', height: '90%', top: '50%', left: '50%', transform: [{ translateX: '-50%' }, { translateY: '-45%' }], opacity: 0.04, zIndex: 0 },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xl, paddingBottom: spacing.lg, zIndex: 1 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  joinBtn:         { borderRadius: radius.lg, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.4)`, paddingVertical: 8, paddingHorizontal: 14 },
  joinBtnText:     { fontSize: 13, fontWeight: '700', color: colors.accent },

  fab:             { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabText:         { fontSize: 30, fontWeight: '300', color: '#000', lineHeight: 34 },

  list:            { paddingHorizontal: spacing.lg, paddingBottom: 80, zIndex: 1 },

  // Stats banner
  statsBanner:     { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  statItem:        { flex: 1, alignItems: 'center' },
  statValue:       { fontSize: 20, fontWeight: '900', color: colors.text },
  statLabel:       { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  statDivider:     { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  // Next match card
  nextMatchCard:       { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: 14, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.25)` },
  nextMatchLabel:      { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1.5, marginBottom: 4 },
  nextMatchChamp:      { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  nextMatchTeams:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  nextMatchPair:       { flex: 1, alignItems: 'center', gap: 6 },
  nextMatchAvatars:    { flexDirection: 'row', gap: -6 },
  nextMatchPairNames:  { fontSize: 11, color: colors.text, fontWeight: '600', textAlign: 'center' },
  nextMatchVs:         { fontSize: 12, fontWeight: '800', color: colors.accent },
  nextMatchCta:        { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  nextMatchCtaText:    { fontSize: 13, fontWeight: '800', color: '#000' },

  // Progress bar on cards
  progressSection: { marginBottom: 12 },
  progressBar:     { height: 4, backgroundColor: colors.surface2, borderRadius: 2, overflow: 'hidden' as const, marginBottom: 6 },
  progressFill:    { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  progressText:    { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  inviteSection:   { marginBottom: 20 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  inviteCard:      { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.2)` },
  inviteInfo:      { marginBottom: 12 },
  inviteName:      { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  inviteMeta:      { fontSize: 13, color: colors.textMuted },
  inviteActions:   { flexDirection: 'row', gap: 8 },
  declineBtn:      { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  declineBtnText:  { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  acceptBtn:       { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center' },
  acceptBtnText:   { fontSize: 14, fontWeight: '800', color: '#000' },

  card:            { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTop:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  cardName:        { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  badge:           { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:       { fontSize: 11, fontWeight: '700' },
  cardMeta:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaText:        { fontSize: 13, color: colors.textMuted },
  metaDot:         { fontSize: 13, color: colors.textFaint },
  cardFooter:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  codeLabel:       { fontSize: 11, color: colors.textFaint, fontWeight: '600', textTransform: 'uppercase' },
  codeValue:       { fontSize: 13, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },

  archiveSection:      { marginTop: 8 },
  archivedCard:        { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: 10, borderWidth: 1, borderColor: colors.border, opacity: 0.65 },
  archivedName:        { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  archivedMeta:        { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  archivedMetaText:    { fontSize: 13, color: colors.textMuted },
  archivedRevealBtn:   { marginLeft: 'auto' as any, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: `rgba(${colors.accentRgb},0.12)`, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.25)` },
  archivedRevealText:  { fontSize: 12, fontWeight: '700', color: colors.accent },

  empty:           { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyCrown:      { fontSize: 64, marginBottom: 20 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyBody:       { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyActions:    { flexDirection: 'row', gap: 10 },
  createBtn:       { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 24 },
  createBtnText:   { fontSize: 15, fontWeight: '800', color: '#000' },
  joinBtnLarge:    { borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.4)` },
  joinBtnLargeText:{ fontSize: 15, fontWeight: '700', color: colors.accent },
});
