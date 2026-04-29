import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Match, MatchOutcome, Result, UserProfile } from '../../lib/types';
import Avatar from '../../components/Avatar';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'MatchDetail'>;
  route:      RouteProp<HomeStackParamList, 'MatchDetail'>;
};

export default function MatchDetailScreen({ navigation, route }: Props) {
  const { matchId, championshipId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const OUTCOME_COLOR: Record<MatchOutcome, string> = {
    p1win: '#4CAF50',
    p1tb:  colors.accent,
    p2tb:  colors.accent,
    p2win: '#4CAF50',
  };

  const [match, setMatch]       = useState<Match | null>(null);
  const [result, setResult]     = useState<Result | null>(null);
  const [players, setPlayers]   = useState<Map<string, UserProfile>>(new Map());
  const [registeredBy, setRegisteredBy] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const [matchRes, champRes] = await Promise.all([
      supabase.from('matches').select('*, results(*)').eq('id', matchId).single(),
      supabase.from('championships').select('admin_id').eq('id', championshipId).single(),
    ]);

    const m = matchRes.data as Match & { results: Result[] | Result | null };
    const r = (Array.isArray(m?.results) ? m.results[0] : m?.results) ?? null;

    setMatch(m);
    setResult(r);
    setIsAdmin(champRes.data?.admin_id === user?.id);

    const ids = new Set([
      m.pair1_player1_id, m.pair1_player2_id,
      m.pair2_player1_id, m.pair2_player2_id,
      ...(r ? [r.registered_by] : []),
    ]);

    const { data: profiles } = await supabase
      .from('users')
      .select('id, name, nickname, avatar_url, phone, created_at')
      .in('id', [...ids]);

    const map = new Map<string, UserProfile>();
    (profiles ?? []).forEach((p: UserProfile) => map.set(p.id, p));
    setPlayers(map);

    if (r?.registered_by) {
      setRegisteredBy(map.get(r.registered_by) ?? null);
    }

    setLoading(false);
  }, [matchId, championshipId, user?.id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const label = (id: string) => {
    const p = players.get(id);
    return p?.nickname ?? p?.name ?? '—';
  };
  const fullName = (id: string) => players.get(id)?.name ?? '—';
  const nickname = (id: string) => players.get(id)?.nickname ?? null;
  const avatar = (id: string) => players.get(id)?.avatar_url ?? null;

  const isPlayerInMatch = match && (
    match.pair1_player1_id === user?.id ||
    match.pair1_player2_id === user?.id ||
    match.pair2_player1_id === user?.id ||
    match.pair2_player2_id === user?.id
  );

  const canEdit = isAdmin || isPlayerInMatch;

  const isOpposingPlayer = result && result.registered_by !== user?.id && isPlayerInMatch;
  const canConfirm = result?.status === 'pending' && isOpposingPlayer;
  const canAdminConfirm = result?.status === 'pending' && isAdmin;

  const handleConfirm = async () => {
    const { error } = await supabase
      .from('results')
      .update({
        status: 'confirmed',
        confirmed_by: user!.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', result!.id);
    if (error) Alert.alert(t('common.error'), error.message);
    else load();
  };

  const handleDispute = () => {
    Alert.alert(
      t('matchDetail.disputeTitle'),
      t('matchDetail.disputeBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('matchDetail.disputeBtn'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('results')
              .update({
                status: 'disputed',
                confirmed_by: user!.id,
                confirmed_at: new Date().toISOString(),
              })
              .eq('id', result!.id);
            if (error) Alert.alert(t('common.error'), error.message);
            else load();
          },
        },
      ],
    );
  };

  if (loading || !match) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const outcome = result?.outcome as MatchOutcome | undefined;
  const pair1Won = outcome === 'p1win' || outcome === 'p1tb';
  const pair2Won = outcome === 'p2win' || outcome === 'p2tb';
  const isTiebreak = outcome === 'p1tb' || outcome === 'p2tb';
  const isSinglesMatch = match.pair1_player1_id === match.pair1_player2_id;

  const renderPlayerChip = (id: string) => (
    <View style={styles.playerChip}>
      <Avatar name={label(id)} imageUrl={avatar(id)} size={44} />
      <Text style={styles.playerNameTop} numberOfLines={1}>{fullName(id)}</Text>
      {nickname(id) && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{nickname(id)}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('matchDetail.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.pairLabelRow}>
            <Text style={styles.pairBadge}>A</Text>
            {pair1Won && <Text style={styles.winnerBadge}>{isTiebreak ? '🏆 TB' : '🏆'}</Text>}
          </View>
          <View style={[styles.pairPlayers, result && { opacity: pair1Won ? 1 : 0.4 }]}>
            {renderPlayerChip(match.pair1_player1_id)}
            {!isSinglesMatch && <><Text style={styles.pairAmp}>&</Text>{renderPlayerChip(match.pair1_player2_id)}</>}
          </View>

          <View style={styles.vsDividerRow}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsLine} />
          </View>

          <View style={styles.pairLabelRow}>
            <Text style={styles.pairBadge}>B</Text>
            {pair2Won && <Text style={styles.winnerBadge}>{isTiebreak ? '🏆 TB' : '🏆'}</Text>}
          </View>
          <View style={[styles.pairPlayers, result && { opacity: pair2Won ? 1 : 0.4 }]}>
            {renderPlayerChip(match.pair2_player1_id)}
            {!isSinglesMatch && <><Text style={styles.pairAmp}>&</Text>{renderPlayerChip(match.pair2_player2_id)}</>}
          </View>

          {result && (
            <>
              <View style={styles.divider} />

              <View style={[styles.resultBadge, { borderColor: OUTCOME_COLOR[outcome!] + '44' }]}>
                <Text style={[styles.resultOutcome, { color: OUTCOME_COLOR[outcome!] }]}>
                  {t(`rankings.${outcome}`)}
                </Text>
              </View>

              {result.score ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t('matchDetail.score')}</Text>
                  <Text style={styles.scoreValue}>{result.score}</Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t('matchDetail.registeredBy')}</Text>
                <Text style={styles.metaValue}>
                  {registeredBy?.name ?? '—'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t('matchDetail.date')}</Text>
                <Text style={styles.metaValue}>
                  {new Date(result.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </>
          )}

          {!result && (
            <>
              <View style={styles.divider} />
              <Text style={styles.pendingText}>{t('matchDetail.pending')}</Text>
            </>
          )}

          {/* Status & actions — inside card */}
          {result && result.status === 'pending' && (
            <>
              <View style={styles.divider} />
              {canConfirm ? (
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.disputeBtn} onPress={handleDispute}>
                    <Text style={styles.disputeBtnText}>{t('matchDetail.disputeResult')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmBtnText}>{t('common.confirm')}</Text>
                  </TouchableOpacity>
                </View>
              ) : canAdminConfirm ? (
                <TouchableOpacity style={styles.confirmBtnFull} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>{t('matchDetail.adminConfirm')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.statusRow}>
                  <View style={styles.pendingConfirmBadge}>
                    <Text style={styles.pendingConfirmText}>
                      {t('matchDetail.pendingConfirmation')}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {result && result.status === 'disputed' && (
            <>
              <View style={styles.divider} />
              <View style={styles.statusRow}>
                <View style={styles.disputedBadge}>
                  <Text style={styles.disputedBadgeText}>{t('matchDetail.disputed')}</Text>
                </View>
              </View>
              {canAdminConfirm && (
                <TouchableOpacity style={styles.confirmBtnFull} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>{t('matchDetail.adminConfirm')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Edit / Register button — inside card */}
          {canEdit && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={result ? styles.editBtn : styles.registerBtn}
                onPress={() =>
                  navigation.navigate('RegisterResult', {
                    matchId:        match.id,
                    championshipId,
                    pair1Names:     [fullName(match.pair1_player1_id), fullName(match.pair1_player2_id)],
                    pair2Names:     [fullName(match.pair2_player1_id), fullName(match.pair2_player2_id)],
                    pair1Nicknames: [nickname(match.pair1_player1_id), nickname(match.pair1_player2_id)],
                    pair2Nicknames: [nickname(match.pair2_player1_id), nickname(match.pair2_player2_id)],
                    pair1Avatars:   [avatar(match.pair1_player1_id), avatar(match.pair1_player2_id)],
                    pair2Avatars:   [avatar(match.pair2_player1_id), avatar(match.pair2_player2_id)],
                    ...(result ? { existingResultId: result.id, existingSets: result.sets ?? undefined } : {}),
                    isAdmin,
                  })
                }
              >
                <Text style={result ? styles.editBtnText : styles.registerBtnText}>
                  {result ? t('matchDetail.editResult') : t('matchDetail.registerResult')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12 },
  backBtn:        { padding: 4 },
  backText:       { fontSize: 22, color: colors.textMuted },
  title:          { fontSize: 18, fontWeight: '800', color: colors.text },

  scroll:         { padding: spacing.lg, paddingBottom: 40 },

  card:           { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 12 },

  pairLabelRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairBadge:      { fontSize: 12, fontWeight: '800', color: colors.accent, backgroundColor: `rgba(${colors.accentRgb},0.12)`, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  winnerBadge:    { fontSize: 12, fontWeight: '700', color: '#4CAF50' },

  pairPlayers:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerChip:     { flex: 1, alignItems: 'center', gap: 4 },
  playerNameTop:  { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
  playerNicknameBottom: { fontSize: 10, color: colors.text, opacity: 0.7, textAlign: 'center' },
  pairAmp:        { fontSize: 14, fontWeight: '700', color: colors.accent },

  vsDividerRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  vsLine:         { flex: 1, height: 1.5, backgroundColor: colors.accent, opacity: 0.3 },
  vsText:         { fontSize: 14, fontWeight: '800', color: colors.accent },

  divider:        { height: 1, backgroundColor: colors.border },

  resultBadge:    { borderRadius: radius.lg, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  resultOutcome:  { fontSize: 15, fontWeight: '800' },
  metaRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel:      { fontSize: 12, color: colors.textMuted },
  metaValue:      { fontSize: 13, color: colors.text, fontWeight: '600' },
  scoreValue:     { fontSize: 15, color: colors.text, fontWeight: '700' },

  pendingText:    { fontSize: 14, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },

  statusRow:           {},
  pendingConfirmBadge: { backgroundColor: 'rgba(245,166,35,0.12)', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  pendingConfirmText:  { fontSize: 12, fontWeight: '700', color: colors.warning },
  confirmActions:      { flexDirection: 'row', gap: 10 },
  confirmBtn:          { flex: 1, backgroundColor: '#4CAF50', borderRadius: radius.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  confirmBtnFull:      { backgroundColor: '#4CAF50', borderRadius: radius.md, height: 44, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText:      { fontSize: 13, fontWeight: '800', color: '#FFF' },
  disputeBtn:          { flex: 1, borderRadius: radius.md, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.error },
  disputeBtnText:      { fontSize: 13, fontWeight: '700', color: colors.error },
  disputedBadge:       { backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  disputedBadgeText:   { fontSize: 12, fontWeight: '700', color: colors.error },

  editBtn:        { borderRadius: radius.lg, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.3)`, paddingVertical: 14, alignItems: 'center' },
  editBtnText:    { fontSize: 15, fontWeight: '700', color: colors.accent },
  registerBtn:    { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  registerBtnText:{ fontSize: 15, fontWeight: '800', color: '#000' },
});
