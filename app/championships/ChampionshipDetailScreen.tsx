import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, Share,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateSchedule, generateSinglesSchedule } from '../../lib/schedule';
import { computeRanking } from '../../lib/rankings';
import {
  Championship, Match, Membership, MatchOutcome,
  RankingEntry, Round, UserProfile,
} from '../../lib/types';
import Avatar from '../../components/Avatar';
import ScoringTooltip from '../../components/ScoringTooltip';
import { useTheme } from '../../contexts/ThemeContext';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'ChampionshipDetail'>;
  route:      RouteProp<HomeStackParamList, 'ChampionshipDetail'>;
};

type Tab = 'waiting' | 'dashboard' | 'matches' | 'ranking';

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChampionshipDetailScreen({ navigation, route }: Props) {
  const { id, name } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const STATUS_LABEL: Record<string, string> = {
    waiting:  t('status.waiting'),
    active:   t('status.active'),
    finished: t('status.finished'),
  };

  const MEMBER_STATUS_LABEL: Record<string, string> = {
    accepted: t('memberStatus.accepted'),
    invited:  t('memberStatus.invited'),
    declined: t('memberStatus.declined'),
  };

  const STATUS_COLOR: Record<string, string> = {
    waiting:  '#6A6A8A',
    active:   colors.accent,
    finished: '#4CAF50',
  };
  const MEMBER_STATUS_COLOR: Record<string, string> = {
    accepted: '#4CAF50',
    invited:  colors.warning,
    declined: colors.error,
  };

  const StatBox = ({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) => (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [allMembers, setAllMembers]     = useState<Membership[]>([]);
  const [rounds, setRounds]             = useState<Round[]>([]);
  const [ranking, setRanking]           = useState<RankingEntry[]>([]);
  const [loading, setLoading]           = useState(true);
  const [silentRefresh, setSilentRefresh] = useState(false);
  const [starting, setStarting]         = useState(false);
  const [activeTab, setActiveTab]       = useState<Tab>('dashboard');
  const [selectedRankEntry, setSelectedRankEntry] = useState<RankingEntry | null>(null);
  const [scoringVisible, setScoringVisible] = useState(false);
  const tabInitialized = useRef(false); // tracks first successful load for tab init
  const hasMounted     = useRef(false);  // tracks first focus for spinner vs silent

  // Derived
  const acceptedMembers = allMembers.filter(m => m.status === 'accepted');
  const isAdmin = championship?.admin_id === user?.id;

  const playerMap = new Map<string, { name: string; nickname: string | null; avatar_url: string | null }>();
  acceptedMembers.forEach(m => {
    if (m.users) playerMap.set(m.user_id, { name: m.users.name, nickname: m.users.nickname, avatar_url: m.users.avatar_url });
  });
  const playerLabel = (pid: string) => {
    const p = playerMap.get(pid);
    return p?.nickname ?? p?.name ?? '—';
  };
  const playerAvatar = (pid: string) => playerMap.get(pid)?.avatar_url ?? null;
  const playerInfo = (pid: string) => {
    const p = playerMap.get(pid);
    return { name: p?.name ?? '—', nickname: p?.nickname ?? null, avatarUrl: p?.avatar_url ?? null };
  };

  // ── Load data ───────────────────────────────────────────────────────────────

  const load = useCallback(async (silent = false) => {
    if (silent) setSilentRefresh(true);
    else setLoading(true);

    const [champRes, membersRes, roundsRes] = await Promise.all([
      supabase.from('championships').select('*').eq('id', id).single(),

      supabase.from('memberships')
        .select('*, users!user_id(id, name, nickname, avatar_url, created_at, phone)')
        .eq('championship_id', id)
        .neq('status', 'declined'),

      supabase.from('rounds')
        .select('*, matches(*, results(*))')
        .eq('championship_id', id)
        .order('round_number'),
    ]);

    const champ = champRes.data as Championship | null;
    const members = (membersRes.data ?? []) as Membership[];
    const fetchedRounds = (roundsRes.data ?? []) as Round[];

    setChampionship(champ);
    setAllMembers(members);
    setRounds(fetchedRounds);

    // Ranking uses accepted members only
    const accepted = members.filter(m => m.status === 'accepted');
    const profiles = accepted.map(m => m.users).filter(Boolean) as UserProfile[];
    const allMatches = fetchedRounds.flatMap(r => r.matches ?? []);
    setRanking(computeRanking(allMatches as Match[], profiles));

    // Set initial tab only once — subsequent reloads preserve the user's current tab
    if (!tabInitialized.current) {
      setActiveTab(champ?.status === 'waiting' ? 'waiting' : 'dashboard');
      tabInitialized.current = true;
    }

    setLoading(false);
    setSilentRefresh(false);
  }, [id]);

  // ── Primary load: runs on every focus (initial + returning from child) ──────
  useFocusEffect(
    useCallback(() => {
      const silent = hasMounted.current;
      hasMounted.current = true;
      load(silent);
    }, [load]),
  );

  // ── Guaranteed refresh via route param _t ────────────────────────────────────
  // RegisterResultScreen navigates here with _t = Date.now() after a successful
  // insert/update. This useEffect fires whenever _t changes — no focus event
  // needed — so the card and ranking always update after result registration.
  useEffect(() => {
    if (route.params._t) load(true);
  }, [route.params._t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime removed: Supabase reuses cached channel objects by name, so
  // re-running this effect (React StrictMode double-invoke or HMR) caused
  // "cannot add postgres_changes callbacks after subscribe()".
  // Refresh is handled by useFocusEffect + the _t param trigger from
  // RegisterResultScreen, which is more reliable.

  // ── AC-001 / CF-001: Admin menu ─────────────────────────────────────────────

  const handleAdminMenu = () => {
    if (championship?.status === 'waiting') {
      Alert.alert(
        t('championshipDetail.adminOptions'),
        undefined,
        [
          {
            text: t('championshipDetail.editName'),
            onPress: () => navigation.navigate('EditChampionship', { id, currentName: championship.name }),
          },
          {
            text: t('championshipDetail.cancelChampionship'),
            style: 'destructive',
            onPress: handleDeleteChampionship,
          },
          { text: t('championshipDetail.closeMenu'), style: 'cancel' },
        ],
      );
      return;
    }

    // active status
    const allMatches   = rounds.flatMap(r => r.matches ?? []);
    const pendingCount = allMatches.filter(m => {
      const r = Array.isArray(m.results) ? m.results[0] : m.results;
      return !r || r.status !== 'confirmed';
    }).length;
    const subtitle     = pendingCount > 0
      ? t('championshipDetail.pendingMatches', { count: pendingCount })
      : t('championshipDetail.allMatchesRegistered');

    Alert.alert(
      t('championshipDetail.adminOptions'),
      subtitle,
      [
        {
          text: t('championshipDetail.editName'),
          onPress: () => navigation.navigate('EditChampionship', { id, currentName: championship!.name }),
        },
        {
          text: pendingCount > 0 ? t('championshipDetail.finalizeAnyway') : t('championshipDetail.finalize'),
          onPress: handleFinalize,
        },
        {
          text: t('championshipDetail.cancelChampionship'),
          style: 'destructive',
          onPress: handleDeleteChampionship,
        },
        { text: t('championshipDetail.closeMenu'), style: 'cancel' },
      ],
    );
  };

  // ── AC-002: Delete championship (waiting only) ───────────────────────────────

  const handleDeleteChampionship = () => {
    Alert.alert(
      t('championshipDetail.cancelConfirmTitle'),
      t('championshipDetail.cancelConfirmBody'),
      [
        { text: t('championshipDetail.cancelConfirmNo'), style: 'cancel' },
        {
          text: t('championshipDetail.cancelConfirmYes'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('championships')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert(t('common.error'), error.message);
              return;
            }

            navigation.navigate('HomeList');
          },
        },
      ],
    );
  };

  // ── CF-001: Finalize ─────────────────────────────────────────────────────────

  const handleFinalize = async () => {
    const { error } = await supabase
      .from('championships')
      .update({ status: 'finished' })
      .eq('id', id);

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }

    await load();
    navigation.navigate('ChampionReveal', { championshipId: id, championshipName: name });
  };

  // ── Waiting room actions ─────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!championship) return;
    await Share.share({
      message:
        `${championship.invite_code}\n\n` +
        `Use esse código para entrar no campeonato "${championship.name}" no Rei da Quadra! 🎾`,
    });
  };

  const handleRemoveMember = (member: Membership) => {
    const memberName = member.users?.nickname ?? member.users?.name ?? '—';
    Alert.alert(
      t('championshipDetail.removePlayer'),
      t('championshipDetail.removePlayerConfirm', { name: memberName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('championshipDetail.removeBtn'),
          style: 'destructive',
          onPress: async () => {
            await supabase.from('memberships').delete().eq('id', member.id);
            await load();
          },
        },
      ],
    );
  };

  const handleCancelInvite = (member: Membership) => {
    const memberName = member.users?.nickname ?? member.users?.name ?? '—';
    Alert.alert(
      t('championshipDetail.cancelInvite'),
      t('championshipDetail.cancelInviteConfirm', { name: memberName }),
      [
        { text: t('championshipDetail.cancelConfirmNo'), style: 'cancel' },
        {
          text: t('championshipDetail.cancelInviteBtn'),
          style: 'destructive',
          onPress: async () => {
            await supabase.from('memberships').delete().eq('id', member.id);
            await load();
          },
        },
      ],
    );
  };

  // ── Start championship ───────────────────────────────────────────────────────

  const handleStart = async () => {
    const isSingles = championship?.sport === 'Tênis - Simples';
    const minPlayers = isSingles ? 2 : 4;
    if (acceptedMembers.length < minPlayers) {
      Alert.alert(t('championshipDetail.insufficientPlayers'), t('championshipDetail.insufficientPlayersBody'));
      return;
    }

    Alert.alert(
      t('championshipDetail.startConfirmTitle'),
      t('championshipDetail.startConfirmBody', { count: acceptedMembers.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('championshipDetail.startConfirmBtn'), onPress: () => startChampionship(acceptedMembers.map(m => m.user_id)) },
      ],
    );
  };

  const startChampionship = async (playerIds: string[]) => {
    setStarting(true);
    try {
      const isSingles = championship?.sport === 'Tênis - Simples';
      const schedule = isSingles
        ? generateSinglesSchedule(playerIds)
        : generateSchedule(playerIds);

      const roundIds: string[] = [];
      for (const r of schedule) {
        const { data, error } = await supabase
          .from('rounds')
          .insert({ championship_id: id, round_number: r.roundNumber })
          .select('id')
          .single();
        if (error) throw error;
        roundIds.push(data.id);
      }

      for (let i = 0; i < schedule.length; i++) {
        const { error } = await supabase.from('matches').insert(
          schedule[i].matches.map(m => ({
            round_id:          roundIds[i],
            championship_id:   id,
            pair1_player1_id:  m.pair1[0],
            pair1_player2_id:  m.pair1[1],
            pair2_player1_id:  m.pair2[0],
            pair2_player2_id:  m.pair2[1],
          })),
        );
        if (error) throw error;
      }

      const { error } = await supabase
        .from('championships')
        .update({ status: 'active' })
        .eq('id', id);
      if (error) throw error;

      await load();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message ?? t('championshipDetail.startError'));
    } finally {
      setStarting(false);
    }
  };

  // ── Tab renderers ─────────────────────────────────────────────────────────────

  const refreshControl = (
    <RefreshControl
      refreshing={silentRefresh}
      onRefresh={() => load(true)}
      tintColor={colors.accent}
      colors={[colors.accent]}
    />
  );

  const canInvite = isAdmin || (championship?.allow_member_invite ?? false);

  const renderWaitingRoom = () => (
    <ScrollView contentContainerStyle={styles.tabScrollContent} refreshControl={refreshControl}>
      {/* Join code card — only visible to admin or when member invites are allowed */}
      {canInvite && (
        <View style={styles.codeCard}>
          <Text style={styles.codeCardLabel}>{t('championshipDetail.entryCode')}</Text>
          <Text style={styles.codeValue}>{championship?.invite_code}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>{t('championshipDetail.shareInvite')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Roster header */}
      <View style={styles.rosterHeader}>
        <Text style={styles.rosterTitle}>
          {t('championshipDetail.playersCount', { accepted: acceptedMembers.length, max: championship?.max_players ?? '?' })}
        </Text>
        {canInvite && (
          <TouchableOpacity
            style={styles.inviteSmallBtn}
            onPress={() =>
              navigation.navigate('InvitePlayer', {
                championshipId:   id,
                championshipName: name,
                existingMemberIds: allMembers.map(m => m.user_id),
              })
            }
          >
            <Text style={styles.inviteSmallBtnText}>{t('championshipDetail.inviteBtn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Member list */}
      {allMembers.map(m => {
        const displayName = m.users?.nickname ?? m.users?.name ?? '—';
        return (
          <View key={m.id} style={styles.memberRow}>
            <Avatar name={displayName} imageUrl={m.users?.avatar_url} size={40} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{displayName}</Text>
              {m.users?.name && m.users.nickname ? (
                <Text style={styles.memberSub}>{m.users.name}</Text>
              ) : null}
            </View>
            <View style={[
              styles.memberStatusBadge,
              { backgroundColor: MEMBER_STATUS_COLOR[m.status] + '22' },
            ]}>
              <Text style={[styles.memberStatusText, { color: MEMBER_STATUS_COLOR[m.status] }]}>
                {MEMBER_STATUS_LABEL[m.status]}
              </Text>
            </View>
            {isAdmin && m.user_id !== user?.id && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() =>
                  m.status === 'invited' ? handleCancelInvite(m) : handleRemoveMember(m)
                }
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {allMembers.length === 0 && (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabText}>
            {t('championshipDetail.noPlayers')}
          </Text>
        </View>
      )}

      {/* Start button */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.startBtn, starting && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={starting}
        >
          {starting
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={styles.startBtnText}>{t('championshipDetail.startBtn')}</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const parseScoreSets = (score: string | null): [number, number][] => {
    if (!score) return [];
    return score.split('/').map(s => {
      const parts = s.trim().split('-').map(Number);
      return [parts[0] ?? 0, parts[1] ?? 0] as [number, number];
    });
  };

  const renderMatchesTab = () => (
    <FlatList
      data={rounds}
      keyExtractor={r => r.id}
      contentContainerStyle={styles.tabScrollContent}
      refreshControl={refreshControl}
      ListEmptyComponent={
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabText}>{t('championshipDetail.noRounds')}</Text>
        </View>
      }
      renderItem={({ item: round }) => (
        <View style={styles.roundSection}>
          <Text style={styles.roundTitle}>{t('championshipDetail.roundTitle', { number: round.round_number })}</Text>
          {(round.matches ?? []).map(match => {
            const result = Array.isArray(match.results) ? match.results[0] : match.results ?? null;
            const pair1Names: [string, string] = [
              playerLabel(match.pair1_player1_id),
              playerLabel(match.pair1_player2_id),
            ];
            const pair2Names: [string, string] = [
              playerLabel(match.pair2_player1_id),
              playerLabel(match.pair2_player2_id),
            ];
            const p1a = playerInfo(match.pair1_player1_id);
            const p1b = playerInfo(match.pair1_player2_id);
            const p2a = playerInfo(match.pair2_player1_id);
            const p2b = playerInfo(match.pair2_player2_id);
            const isSinglesMatch = match.pair1_player1_id === match.pair1_player2_id;
            const uid = user?.id;
            const isPlayerInMatch =
              match.pair1_player1_id === uid ||
              match.pair1_player2_id === uid ||
              match.pair2_player1_id === uid ||
              match.pair2_player2_id === uid;
            const canRegister = isAdmin || isPlayerInMatch;
            const outcome = result?.outcome as MatchOutcome | undefined;
            const pair1Won = outcome === 'p1win' || outcome === 'p1tb';
            const pair2Won = outcome === 'p2win' || outcome === 'p2tb';
            const isTiebreak = outcome === 'p1tb' || outcome === 'p2tb';
            const sets = result ? parseScoreSets(result.score) : [];

            return (
              <TouchableOpacity
                key={match.id}
                style={[styles.matchCard, result?.status === 'confirmed' && styles.matchCardDone]}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate('MatchDetail', {
                    matchId: match.id,
                    championshipId: id,
                  })
                }
              >
                {/* Scoreboard */}
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
                          <Avatar name={p1a.nickname ?? p1a.name} imageUrl={p1a.avatarUrl} size={24} />
                          {!isSinglesMatch && <Avatar name={p1b.nickname ?? p1b.name} imageUrl={p1b.avatarUrl} size={24} />}
                        </View>
                        <View style={styles.pairDetails}>
                          <View style={styles.playerInfoBlock}>
                            <Text style={styles.playerNameTop} numberOfLines={1}>{p1a.name}</Text>
                            {p1a.nickname && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{p1a.nickname}</Text>}
                          </View>
                          {!isSinglesMatch && (
                            <>
                              <Text style={styles.pairAmp}>&</Text>
                              <View style={styles.playerInfoBlock}>
                                <Text style={styles.playerNameTop} numberOfLines={1}>{p1b.name}</Text>
                                {p1b.nickname && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{p1b.nickname}</Text>}
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
                          <Avatar name={p2a.nickname ?? p2a.name} imageUrl={p2a.avatarUrl} size={24} />
                          {!isSinglesMatch && <Avatar name={p2b.nickname ?? p2b.name} imageUrl={p2b.avatarUrl} size={24} />}
                        </View>
                        <View style={styles.pairDetails}>
                          <View style={styles.playerInfoBlock}>
                            <Text style={styles.playerNameTop} numberOfLines={1}>{p2a.name}</Text>
                            {p2a.nickname && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{p2a.nickname}</Text>}
                          </View>
                          {!isSinglesMatch && (
                            <>
                              <Text style={styles.pairAmp}>&</Text>
                              <View style={styles.playerInfoBlock}>
                                <Text style={styles.playerNameTop} numberOfLines={1}>{p2b.name}</Text>
                                {p2b.nickname && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{p2b.nickname}</Text>}
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

                {/* Status badges */}
                {result && result.status === 'confirmed' && (
                  <View style={styles.closedRow}>
                    <View style={styles.closedBadge}>
                      <Text style={styles.closedBadgeText}>{t('championshipDetail.closed')}</Text>
                    </View>
                  </View>
                )}
                {result && result.status === 'pending' && (
                  <View style={styles.closedRow}>
                    <View style={styles.pendingConfirmBadge}>
                      <Text style={styles.pendingConfirmText}>{t('championshipDetail.pendingConfirmation')}</Text>
                    </View>
                  </View>
                )}
                {result && result.status === 'disputed' && (
                  <View style={styles.closedRow}>
                    <View style={styles.disputedBadge}>
                      <Text style={styles.disputedBadgeText}>{t('championshipDetail.disputed')}</Text>
                    </View>
                  </View>
                )}

                {/* CTAs */}
                {!result && (
                  championship?.status !== 'finished' ? (
                    canRegister ? (
                      <TouchableOpacity
                        style={styles.registerCta}
                        onPress={e => {
                          e.stopPropagation();
                          navigation.navigate('RegisterResult', {
                            matchId:        match.id,
                            championshipId: id,
                            pair1Names,
                            pair2Names,
                            pair1Nicknames: [p1a.nickname, p1b.nickname],
                            pair2Nicknames: [p2a.nickname, p2b.nickname],
                            pair1Avatars:   [p1a.avatarUrl, p1b.avatarUrl],
                            pair2Avatars:   [p2a.avatarUrl, p2b.avatarUrl],
                            isAdmin,
                          });
                        }}
                      >
                        <Text style={styles.registerCtaText}>{t('championshipDetail.registerResult')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>{t('championshipDetail.awaitingResult')}</Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>{t('championshipDetail.noResult')}</Text>
                    </View>
                  )
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    />
  );

  const renderRankingTab = () => (
    <ScrollView contentContainerStyle={styles.tabScrollContent} refreshControl={refreshControl}>
      {ranking.length === 0 ? (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabText}>{t('championshipDetail.rankingEmpty')}</Text>
        </View>
      ) : (
        <>
        {ranking.map((entry, idx) => (
          <TouchableOpacity
            key={entry.userId}
            style={[styles.rankRow, entry.userId === user?.id && styles.rankRowMe]}
            activeOpacity={0.7}
            onPress={() => setSelectedRankEntry(entry)}
          >
            {/* Position — top 3 in gold */}
            {idx < 3 ? (
              <Text style={styles.rankPosEmoji}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </Text>
            ) : (
              <Text style={styles.rankPos}>{idx + 1}</Text>
            )}
            <Avatar name={entry.nickname ?? entry.name} imageUrl={entry.avatarUrl} size={36} />
            <View style={styles.rankInfo}>
              <View style={styles.rankNameRow}>
                <Text style={styles.rankName} numberOfLines={1}>
                  {entry.nickname ?? entry.name}
                </Text>
                {entry.userId === user?.id && (
                  <View style={styles.meBadge}>
                    <Text style={styles.meBadgeText}>{t('championshipDetail.you')}</Text>
                  </View>
                )}
              </View>
              {entry.nickname ? (
                <Text style={styles.rankFullName} numberOfLines={1}>{entry.name}</Text>
              ) : null}
              <Text style={styles.rankSub}>
                {entry.wins}V · {entry.tbWins}TB+ · {entry.tbLosses}TB- · {entry.losses}D
              </Text>
            </View>
            <View style={styles.rankPtsWrap}>
              <Text style={styles.rankPts}>{entry.points}</Text>
              <Text style={styles.rankPtsLabel}>pts</Text>
            </View>
          </TouchableOpacity>
        ))}
        </>
      )}
    </ScrollView>
  );

  const renderDashboardTab = () => {
    const myEntry = ranking.find(r => r.userId === user?.id);
    const myRank = ranking.findIndex(r => r.userId === user?.id);
    const totalPlayers = ranking.length;
    const allMatches = rounds.flatMap(r => r.matches ?? []);
    const totalMatches = allMatches.filter(m => {
      const uid = user?.id;
      return m.pair1_player1_id === uid || m.pair1_player2_id === uid ||
             m.pair2_player1_id === uid || m.pair2_player2_id === uid;
    }).length;
    const playedMatches = myEntry?.played ?? 0;
    const winRate = playedMatches > 0 ? Math.round(((myEntry?.wins ?? 0) + (myEntry?.tbWins ?? 0)) / playedMatches * 100) : 0;

    // Find next pending match for this user
    let nextPendingMatch: Match | null = null;
    for (const round of rounds) {
      for (const match of (round.matches ?? [])) {
        const uid = user?.id;
        const isInMatch = match.pair1_player1_id === uid || match.pair1_player2_id === uid ||
                          match.pair2_player1_id === uid || match.pair2_player2_id === uid;
        if (!isInMatch) continue;
        const result = Array.isArray(match.results) ? match.results[0] : match.results ?? null;
        if (!result) { nextPendingMatch = match; break; }
      }
      if (nextPendingMatch) break;
    }

    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent} refreshControl={refreshControl}>
        {/* Rank + Points hero */}
        <View style={styles.dashHero}>
          <View style={styles.dashRankCircle}>
            <Text style={styles.dashRankPos}>
              {myRank >= 0 && myRank < 3
                ? (myRank === 0 ? '🥇' : myRank === 1 ? '🥈' : '🥉')
                : myRank >= 0 ? `${myRank + 1}º` : '—'}
            </Text>
            <Text style={styles.dashRankLabel}>{t('home.rankPlace')}</Text>
          </View>
          <View style={styles.dashHeroDivider} />
          <View style={styles.dashPtsBlock}>
            <Text style={styles.dashPtsValue}>{myEntry?.points ?? 0}</Text>
            <Text style={styles.dashPtsLabel}>{t('championshipDetail.pointsLabel')}</Text>
          </View>
          <View style={styles.dashHeroDivider} />
          <View style={styles.dashWinRateBlock}>
            <Text style={styles.dashWinRateValue}>{winRate}%</Text>
            <Text style={styles.dashWinRateLabel}>{t('home.statsWinRate')}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.dashProgressCard}>
          <View style={styles.dashProgressHeader}>
            <Text style={styles.dashProgressLabel}>{t('home.matchesProgress', { played: playedMatches, total: totalMatches })}</Text>
            <Text style={styles.dashProgressPct}>{totalMatches > 0 ? Math.round(playedMatches / totalMatches * 100) : 0}%</Text>
          </View>
          <View style={styles.dashProgressBar}>
            <View style={[styles.dashProgressFill, { width: `${totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0}%` }]} />
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.dashStatsGrid}>
          <View style={styles.dashStatBox}>
            <Text style={[styles.dashStatValue, { color: '#4CAF50' }]}>{myEntry?.wins ?? 0}</Text>
            <Text style={styles.dashStatLabel} numberOfLines={1} adjustsFontSizeToFit>{t('championshipDetail.winsLabel')}</Text>
            <Text style={styles.dashStatSub}>3 pts</Text>
          </View>
          <View style={styles.dashStatBox}>
            <Text style={[styles.dashStatValue, { color: colors.accent }]}>{myEntry?.tbWins ?? 0}</Text>
            <Text style={styles.dashStatLabel} numberOfLines={1} adjustsFontSizeToFit>{t('championshipDetail.tbPlusLabel')}</Text>
            <Text style={styles.dashStatSub}>2 pts</Text>
          </View>
          <View style={styles.dashStatBox}>
            <Text style={[styles.dashStatValue, { color: colors.warning }]}>{myEntry?.tbLosses ?? 0}</Text>
            <Text style={styles.dashStatLabel} numberOfLines={1} adjustsFontSizeToFit>{t('championshipDetail.tbMinusLabel')}</Text>
            <Text style={styles.dashStatSub}>1 pt</Text>
          </View>
          <View style={styles.dashStatBox}>
            <Text style={[styles.dashStatValue, { color: colors.error }]}>{myEntry?.losses ?? 0}</Text>
            <Text style={styles.dashStatLabel} numberOfLines={1} adjustsFontSizeToFit>{t('championshipDetail.lossesLabel')}</Text>
            <Text style={styles.dashStatSub}>0 pts</Text>
          </View>
        </View>

        {/* Next match card */}
        {nextPendingMatch && (() => {
          const m = nextPendingMatch!;
          const p1a = playerInfo(m.pair1_player1_id);
          const p1b = playerInfo(m.pair1_player2_id);
          const p2a = playerInfo(m.pair2_player1_id);
          const p2b = playerInfo(m.pair2_player2_id);
          const isSinglesMatch = m.pair1_player1_id === m.pair1_player2_id;
          return (
            <TouchableOpacity
              style={styles.dashNextMatch}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('RegisterResult', {
                  matchId: m.id,
                  championshipId: id,
                  pair1Names: [p1a.name, p1b.name],
                  pair2Names: [p2a.name, p2b.name],
                  pair1Nicknames: [p1a.nickname, p1b.nickname],
                  pair2Nicknames: [p2a.nickname, p2b.nickname],
                  pair1Avatars: [p1a.avatarUrl, p1b.avatarUrl],
                  pair2Avatars: [p2a.avatarUrl, p2b.avatarUrl],
                  isAdmin,
                })
              }
            >
              <Text style={styles.dashNextLabel}>{t('home.nextMatch')}</Text>
              <View style={styles.dashNextTeams}>
                <View style={styles.dashNextPair}>
                  <View style={styles.dashNextAvatars}>
                    <Avatar name={p1a.nickname ?? p1a.name} imageUrl={p1a.avatarUrl} size={32} />
                    {!isSinglesMatch && <Avatar name={p1b.nickname ?? p1b.name} imageUrl={p1b.avatarUrl} size={32} />}
                  </View>
                  <Text style={styles.dashNextNames} numberOfLines={1}>
                    {isSinglesMatch ? (p1a.nickname ?? p1a.name) : `${p1a.nickname ?? p1a.name} & ${p1b.nickname ?? p1b.name}`}
                  </Text>
                </View>
                <Text style={styles.dashNextVs}>VS</Text>
                <View style={styles.dashNextPair}>
                  <View style={styles.dashNextAvatars}>
                    <Avatar name={p2a.nickname ?? p2a.name} imageUrl={p2a.avatarUrl} size={32} />
                    {!isSinglesMatch && <Avatar name={p2b.nickname ?? p2b.name} imageUrl={p2b.avatarUrl} size={32} />}
                  </View>
                  <Text style={styles.dashNextNames} numberOfLines={1}>
                    {isSinglesMatch ? (p2a.nickname ?? p2a.name) : `${p2a.nickname ?? p2a.name} & ${p2b.nickname ?? p2b.name}`}
                  </Text>
                </View>
              </View>
              <View style={styles.dashNextCta}>
                <Text style={styles.dashNextCtaText}>{t('home.registerResult')}</Text>
              </View>
            </TouchableOpacity>
          );
        })()}

      </ScrollView>
    );
  };

  // ── Build tab bar ─────────────────────────────────────────────────────────────

  type TabDef = { key: Tab; label: string };
  const tabDefs: TabDef[] = championship?.status === 'waiting'
    ? [{ key: 'waiting', label: t('championshipDetail.waitingRoom') }]
    : [
        { key: 'dashboard', label: t('championshipDetail.dashboardTab') },
        { key: 'matches',   label: t('championshipDetail.matchesTab')   },
        { key: 'ranking',   label: t('championshipDetail.rankingTab')   },
      ];

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.champName} numberOfLines={1}>{name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.scoringHelpBtn}
            onPress={() => setScoringVisible(true)}
          >
            <Text style={styles.scoringHelpText}>?</Text>
          </TouchableOpacity>
          {/* AC-001/AC-002/CF-001 — admin menu */}
          {isAdmin && championship?.status !== 'finished' && (
            <TouchableOpacity style={styles.menuBtn} onPress={handleAdminMenu}>
              <Text style={styles.menuBtnText}>⋮</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CF-001 / CF-002 — "Ver resultado final" banner for finished championships */}
      {championship?.status === 'finished' && (
        <TouchableOpacity
          style={styles.revealBanner}
          onPress={() => navigation.navigate('ChampionReveal', { championshipId: id, championshipName: name })}
        >
          <Text style={styles.revealBannerText}>{t('championshipDetail.viewFinalResult')}</Text>
        </TouchableOpacity>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabDefs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'waiting'   && renderWaitingRoom()}
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'matches'   && renderMatchesTab()}
        {activeTab === 'ranking'   && renderRankingTab()}
      </View>

      {/* ── RK-002: Player breakdown modal ── */}
      <Modal
        visible={!!selectedRankEntry}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRankEntry(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedRankEntry(null)}
        >
          {selectedRankEntry && (
            <View
              style={styles.modalCard}
              onStartShouldSetResponder={() => true}
            >
              {/* Close */}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedRankEntry(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              {/* Player identity */}
              <View style={styles.modalIdentity}>
                <Avatar name={selectedRankEntry.nickname ?? selectedRankEntry.name} imageUrl={selectedRankEntry.avatarUrl} size={60} />
                <Text style={styles.modalName}>
                  {selectedRankEntry.nickname ?? selectedRankEntry.name}
                </Text>
                {selectedRankEntry.nickname && (
                  <Text style={styles.modalFullName}>{selectedRankEntry.name}</Text>
                )}
                {selectedRankEntry.userId === user?.id && (
                  <View style={styles.meBadge}>
                    <Text style={styles.meBadgeText}>{t('championshipDetail.you')}</Text>
                  </View>
                )}
              </View>

              {/* Big points */}
              <View style={styles.modalPtsCard}>
                <Text style={styles.modalPtsValue}>{selectedRankEntry.points}</Text>
                <Text style={styles.modalPtsLabel}>{t('championshipDetail.pointsLabel')}</Text>
              </View>

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <StatBox label={t('championshipDetail.winsLabel')}    value={selectedRankEntry.wins}      sub="3 pts" color="#4CAF50" />
                <StatBox label={t('championshipDetail.tbPlusLabel')}  value={selectedRankEntry.tbWins}    sub="2 pts" color={colors.accent} />
                <StatBox label={t('championshipDetail.tbMinusLabel')} value={selectedRankEntry.tbLosses}  sub="1 pt"  color={colors.warning} />
                <StatBox label={t('championshipDetail.lossesLabel')}  value={selectedRankEntry.losses}    sub="0 pts" color={colors.error} />
                <StatBox label={t('championshipDetail.matchesLabel')} value={selectedRankEntry.played}    sub="total" color={colors.textMuted} />
              </View>

              {/* Breakdown calculation */}
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>{t('championshipDetail.calculationTitle')}</Text>
                {selectedRankEntry.wins > 0 && (
                  <Text style={styles.breakdownLine}>
                    {selectedRankEntry.wins} × 3 = {selectedRankEntry.wins * 3} pts
                  </Text>
                )}
                {selectedRankEntry.tbWins > 0 && (
                  <Text style={styles.breakdownLine}>
                    {selectedRankEntry.tbWins} × 2 = {selectedRankEntry.tbWins * 2} pts
                  </Text>
                )}
                {selectedRankEntry.tbLosses > 0 && (
                  <Text style={styles.breakdownLine}>
                    {selectedRankEntry.tbLosses} × 1 = {selectedRankEntry.tbLosses} pts
                  </Text>
                )}
                {selectedRankEntry.losses > 0 && (
                  <Text style={styles.breakdownLine}>
                    {selectedRankEntry.losses} × 0 = 0 pts
                  </Text>
                )}
                <View style={styles.breakdownDivider} />
                <Text style={styles.breakdownTotal}>
                  {t('championshipDetail.totalLabel', { points: selectedRankEntry.points })}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      <ScoringTooltip visible={scoringVisible} onClose={() => setScoringVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.bg },

  // Header
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12, gap: 10 },
  backBtn:           { padding: 4 },
  backText:          { fontSize: 22, color: colors.textMuted },
  headerInfo:        { flex: 1, gap: 4 },
  champName:         { fontSize: 18, fontWeight: '800', color: colors.text },
  statusBadge:       { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText:        { fontSize: 11, fontWeight: '700' },
  playerCount:       { fontSize: 13, color: colors.textMuted, fontWeight: '600' },

  // Tab bar
  tabBar:            { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabItem:           { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive:     { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabLabel:          { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive:    { color: colors.accent },

  // Shared
  tabScrollContent:  { padding: spacing.lg, paddingBottom: 40 },
  emptyTab:          { alignItems: 'center', paddingTop: 60 },
  emptyTabText:      { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Waiting room — code card
  codeCard:          { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  codeCardLabel:     { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  codeValue:         { fontSize: 36, fontWeight: '900', color: colors.accent, letterSpacing: 6, marginBottom: 16 },
  shareBtn:          { backgroundColor: `rgba(${colors.accentRgb},0.12)`, borderRadius: radius.lg, paddingVertical: 10, paddingHorizontal: 20 },
  shareBtnText:      { fontSize: 14, fontWeight: '700', color: colors.accent },

  // Waiting room — roster
  rosterHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  rosterTitle:       { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteSmallBtn:    { flexShrink: 0, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: 14 },
  inviteSmallBtnText:{ fontSize: 13, fontWeight: '800', color: '#000' },

  memberRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberInfo:        { flex: 1 },
  memberName:        { fontSize: 15, fontWeight: '700', color: colors.text },
  memberSub:         { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  memberStatusBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  memberStatusText:  { fontSize: 11, fontWeight: '700' },
  removeBtn:         { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,107,107,0.12)', alignItems: 'center', justifyContent: 'center' },
  removeBtnText:     { fontSize: 12, color: colors.error, fontWeight: '700' },

  // Start button
  startBtn:          { marginTop: 28, backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
  startBtnDisabled:  { opacity: 0.5 },
  startBtnText:      { fontSize: 15, fontWeight: '800', color: '#000' },

  // Matches tab
  roundSection:      { marginBottom: 20 },
  roundTitle:        { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  matchCard:         { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  matchCardDone:     { backgroundColor: colors.cardDoneBg, borderColor: colors.cardDoneBorder },

  // Scoreboard
  scoreboardWrap:    {},
  tbRow:             { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  tbSpacer:          { flex: 1 },
  tbCells:           { flexDirection: 'row', gap: 4 },
  tbCellSlot:        { width: 28, alignItems: 'center' },
  tbBadge:           { backgroundColor: `rgba(${colors.accentRgb},0.15)`, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tbBadgeText:       { fontSize: 9, color: colors.accent, fontWeight: '800', letterSpacing: 0.5 },

  scoreboard:        { gap: 6 },
  scoreRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreRowPlayers:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  scoreAvatars:      { flexDirection: 'row', gap: -6 },
  pairDetails:       { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  playerInfoBlock:   {},
  playerNameTop:     { fontSize: 13, fontWeight: '700', color: colors.text },
  playerNicknameBottom: { fontSize: 10, color: colors.text, opacity: 0.7, marginTop: 1 },
  pairAmp:           { fontSize: 11, fontWeight: '700', color: colors.accent, marginHorizontal: 2, marginTop: 2 },
  scoreCells:        { flexDirection: 'row', gap: 4 },
  scoreCell:         { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  scoreCellWon:      { backgroundColor: `rgba(${colors.accentRgb},0.15)` },
  scoreCellText:     { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  scoreCellTextWon:  { color: colors.accent, fontWeight: '800' },

  vsDivider:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2, paddingLeft: 4 },
  vsLine:            { width: 14, height: 1.5, backgroundColor: colors.accent, opacity: 0.4 },
  vsText:            { fontSize: 11, fontWeight: '800', color: colors.accent, opacity: 0.7 },

  closedRow:         { marginTop: 8 },
  closedBadge:       { backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  closedBadgeText:   { fontSize: 10, color: '#4CAF50', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  pendingConfirmBadge: { backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  pendingConfirmText:  { fontSize: 10, color: colors.warning, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  disputedBadge:       { backgroundColor: 'rgba(255,107,107,0.15)', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  disputedBadgeText:   { fontSize: 10, color: colors.error, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  pendingBadge:      { marginTop: 8, backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  pendingText:       { fontSize: 12, color: colors.textMuted },
  registerCta:       { marginTop: 10, backgroundColor: `rgba(${colors.accentRgb},0.1)`, borderRadius: radius.md, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.2)` },
  registerCtaText:   { fontSize: 13, fontWeight: '800', color: colors.accent },

  // Ranking tab
  rankRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankRowMe:         { backgroundColor: `rgba(${colors.accentRgb},0.07)` },
  rankPos:           { width: 24, fontSize: 15, fontWeight: '800', color: colors.textMuted, textAlign: 'center' },
  rankPosTop:        { color: colors.accent },
  rankInfo:          { flex: 1 },
  rankName:          { fontSize: 15, fontWeight: '700', color: colors.text },
  rankFullName:      { fontSize: 12, color: colors.textDim, marginTop: 1 },
  rankSub:           { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rankPts:           { fontSize: 18, fontWeight: '800', color: colors.accent },

  // Dashboard tab
  dashHero:            { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, marginBottom: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  dashRankCircle:      { flex: 1, alignItems: 'center', gap: 2 },
  dashRankPos:         { fontSize: 22, fontWeight: '900', color: colors.text },
  dashRankLabel:       { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  dashHeroDivider:     { width: 1, height: 36, backgroundColor: colors.border },
  dashPtsBlock:        { flex: 1, alignItems: 'center', gap: 2 },
  dashPtsValue:        { fontSize: 28, fontWeight: '900', color: colors.accent },
  dashPtsLabel:        { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  dashWinRateBlock:    { flex: 1, alignItems: 'center', gap: 2 },
  dashWinRateValue:    { fontSize: 22, fontWeight: '900', color: '#4CAF50' },
  dashWinRateLabel:    { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  dashProgressCard:    { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  dashProgressHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dashProgressLabel:   { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  dashProgressPct:     { fontSize: 12, fontWeight: '800', color: colors.accent },
  dashProgressBar:     { height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' as const },
  dashProgressFill:    { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  dashStatsGrid:       { flexDirection: 'row', gap: 8, marginBottom: 14 },
  dashStatBox:         { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  dashStatValue:       { fontSize: 24, fontWeight: '900' },
  dashStatLabel:       { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  dashStatSub:         { fontSize: 9, color: colors.textFaint },
  dashNextMatch:       { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: 14, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.25)` },
  dashNextLabel:       { fontSize: 10, fontWeight: '800', color: colors.accent, letterSpacing: 1.5, marginBottom: 10 },
  dashNextTeams:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  dashNextPair:        { flex: 1, alignItems: 'center', gap: 6 },
  dashNextAvatars:     { flexDirection: 'row', gap: -6 },
  dashNextNames:       { fontSize: 12, color: colors.text, fontWeight: '600', textAlign: 'center' },
  dashNextVs:          { fontSize: 12, fontWeight: '800', color: colors.accent },
  dashNextCta:         { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  dashNextCtaText:     { fontSize: 13, fontWeight: '800', color: '#000' },
  dashBreakdown:       { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: 4, borderWidth: 1, borderColor: colors.border },
  dashBreakdownTitle:  { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  dashBreakdownLine:   { fontSize: 13, color: colors.textDim },
  dashBreakdownDivider:{ height: 1, backgroundColor: colors.border, marginVertical: 6 },
  dashBreakdownTotal:  { fontSize: 14, fontWeight: '800', color: colors.text },

  // Avatar
  avatar:            { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText:        { color: colors.accent, fontWeight: '800' },

  // Header — right side group
  headerRight:       { alignItems: 'flex-end', gap: 6 },
  menuBtn:           { padding: 4 },
  menuBtnText:       { fontSize: 22, color: colors.textMuted, fontWeight: '700' },

  // Finished — reveal banner
  revealBanner:      { marginHorizontal: spacing.lg, marginBottom: 10, backgroundColor: `rgba(${colors.accentRgb},0.12)`, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.3)` },
  revealBannerText:  { fontSize: 15, fontWeight: '800', color: colors.accent },

  // Ranking tab — enhanced rows
  rankNameRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankPosEmoji:      { width: 28, fontSize: 18, textAlign: 'center' },
  rankPtsWrap:       { alignItems: 'flex-end' },
  rankPtsLabel:      { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  meBadge:           { backgroundColor: `rgba(${colors.accentRgb},0.15)`, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  meBadgeText:       { fontSize: 10, color: colors.accent, fontWeight: '700' },

  // Breakdown modal
  modalBackdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:         { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: 40 },
  modalCloseBtn:     { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  modalCloseText:    { fontSize: 18, color: colors.textMuted },
  modalIdentity:     { alignItems: 'center', gap: 6, marginBottom: 20 },
  modalName:         { fontSize: 22, fontWeight: '800', color: colors.text },
  modalFullName:     { fontSize: 13, color: colors.textMuted },
  modalPtsCard:      { backgroundColor: `rgba(${colors.accentRgb},0.1)`, borderRadius: radius.xl, paddingVertical: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.2)` },
  modalPtsValue:     { fontSize: 48, fontWeight: '900', color: colors.accent, lineHeight: 56 },
  modalPtsLabel:     { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  statsGrid:         { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statBox:           { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.lg, padding: 10, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: colors.border },
  statValue:         { fontSize: 20, fontWeight: '900' },
  statLabel:         { fontSize: 10, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  statSub:           { fontSize: 9, color: colors.textFaint },
  breakdownSection:  { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.md, gap: 4, borderWidth: 1, borderColor: colors.border },
  breakdownTitle:    { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  breakdownLine:     { fontSize: 13, color: colors.textDim },
  breakdownDivider:  { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  breakdownTotal:    { fontSize: 14, fontWeight: '800', color: colors.text },

  scoringHelpBtn:  { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  scoringHelpText: { fontSize: 14, fontWeight: '700', color: colors.accent },
});
