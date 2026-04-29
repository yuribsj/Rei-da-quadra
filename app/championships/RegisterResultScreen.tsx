import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';
import { MatchOutcome } from '../../lib/types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'RegisterResult'>;
  route:      RouteProp<HomeStackParamList, 'RegisterResult'>;
};

type SetScore = [number, number];

function deriveOutcome(sets: SetScore[]): { outcome: MatchOutcome; scoreStr: string } | null {
  const filledSets = sets.filter(s => s[0] > 0 || s[1] > 0);
  if (filledSets.length < 2) return null;

  let setsWonA = 0;
  let setsWonB = 0;
  for (const s of filledSets) {
    if (s[0] > s[1]) setsWonA++;
    else if (s[1] > s[0]) setsWonB++;
  }

  if (setsWonA === 0 && setsWonB === 0) return null;

  const isTiebreak = filledSets.length === 3;
  let outcome: MatchOutcome;

  if (setsWonA > setsWonB) {
    outcome = isTiebreak ? 'p1tb' : 'p1win';
  } else if (setsWonB > setsWonA) {
    outcome = isTiebreak ? 'p2tb' : 'p2win';
  } else {
    return null;
  }

  const scoreStr = filledSets.map(s => `${s[0]}-${s[1]}`).join(' / ');
  return { outcome, scoreStr };
}

export default function RegisterResultScreen({ navigation, route }: Props) {
  const { matchId, championshipId, pair1Names, pair2Names, pair1Nicknames, pair2Nicknames, pair1Avatars, pair2Avatars, existingResultId, existingSets, isAdmin } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const [sets, setSets] = useState<[SetScore, SetScore, SetScore]>(() => {
    const s: [SetScore, SetScore, SetScore] = [[0, 0], [0, 0], [0, 0]];
    if (existingSets) {
      if (existingSets[0]) s[0] = [existingSets[0][0], existingSets[0][1]];
      if (existingSets[1]) s[1] = [existingSets[1][0], existingSets[1][1]];
      if (existingSets[2]) s[2] = [existingSets[2][0], existingSets[2][1]];
    }
    return s;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const isEditing = !!existingResultId;
  const isSinglesMatch = pair1Names[0] === pair1Names[1];

  const set1Won = sets[0][0] > sets[0][1] ? 'A' : sets[0][1] > sets[0][0] ? 'B' : null;
  const set2Won = sets[1][0] > sets[1][1] ? 'A' : sets[1][1] > sets[1][0] ? 'B' : null;
  const showSet3 = set1Won !== null && set2Won !== null && set1Won !== set2Won;

  const derived = deriveOutcome(showSet3 ? sets : [sets[0], sets[1]]);

  const updateSet = (setIndex: number, pairIndex: 0 | 1, delta: number) => {
    setSets(prev => {
      const next = [...prev] as [SetScore, SetScore, SetScore];
      const val = next[setIndex][pairIndex] + delta;
      next[setIndex] = [...next[setIndex]] as SetScore;
      next[setIndex][pairIndex] = Math.max(0, Math.min(99, val));
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!derived) {
      setError(t('registerResult.fillScores'));
      return;
    }
    setError('');
    setLoading(true);

    const { outcome, scoreStr } = derived;
    const setsData = (showSet3 ? sets : [sets[0], sets[1]]).filter(
      s => s[0] > 0 || s[1] > 0,
    );
    let dbError: any = null;

    if (isEditing) {
      const updatePayload: Record<string, any> = { outcome, score: scoreStr, sets: setsData };
      if (!isAdmin) {
        updatePayload.status = 'pending';
        updatePayload.confirmed_by = null;
        updatePayload.confirmed_at = null;
      }
      const { error: e } = await supabase
        .from('results')
        .update(updatePayload)
        .eq('id', existingResultId);
      dbError = e;
    } else {
      const { error: e } = await supabase.from('results').insert({
        match_id:        matchId,
        championship_id: championshipId,
        outcome,
        score:           scoreStr,
        sets:            setsData,
        registered_by:   user!.id,
        ...(isAdmin ? { status: 'confirmed', confirmed_by: user!.id, confirmed_at: new Date().toISOString() } : {}),
      });
      dbError = e;
    }

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      const state = navigation.getState();
      const champRoute = state.routes.find(r => r.name === 'ChampionshipDetail');
      const champName = (champRoute?.params as any)?.name ?? '';

      if (champName) {
        navigation.navigate('ChampionshipDetail', {
          id:   championshipId,
          name: champName,
          _t:   Date.now(),
        });
      } else {
        navigation.goBack();
      }
    }
  };

  const renderStepper = (setIndex: number, pairIndex: 0 | 1) => (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => updateSet(setIndex, pairIndex, -1)}
        activeOpacity={0.6}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{sets[setIndex][pairIndex]}</Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => updateSet(setIndex, pairIndex, 1)}
        activeOpacity={0.6}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSetRow = (setIndex: number, label: string) => (
    <View style={styles.setRow} key={setIndex}>
      <Text style={styles.setLabel}>{label}</Text>
      <View style={styles.setScores}>
        {renderStepper(setIndex, 0)}
        <Text style={styles.setDash}>–</Text>
        {renderStepper(setIndex, 1)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>{t('registerResult.close')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {isEditing ? t('registerResult.editTitle') : t('registerResult.registerTitle')}
        </Text>

        {/* Players card */}
        <View style={styles.playersCard}>
          <View style={styles.pairLabelRow}>
            <Text style={styles.pairBadge}>A</Text>
          </View>
          <View style={styles.pairRow}>
            <View style={styles.pairAvatars}>
              <Avatar name={pair1Nicknames?.[0] ?? pair1Names[0]} imageUrl={pair1Avatars?.[0] ?? null} size={36} />
              {!isSinglesMatch && <Avatar name={pair1Nicknames?.[1] ?? pair1Names[1]} imageUrl={pair1Avatars?.[1] ?? null} size={36} />}
            </View>
            <View style={styles.pairNames}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerNameTop} numberOfLines={1}>{pair1Names[0]}</Text>
                {pair1Nicknames?.[0] && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{pair1Nicknames[0]}</Text>}
              </View>
              {!isSinglesMatch && (
                <>
                  <Text style={styles.pairAmpersand}>&</Text>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerNameTop} numberOfLines={1}>{pair1Names[1]}</Text>
                    {pair1Nicknames?.[1] && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{pair1Nicknames[1]}</Text>}
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.vsDividerRow}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsLine} />
          </View>

          <View style={styles.pairLabelRow}>
            <Text style={styles.pairBadge}>B</Text>
          </View>
          <View style={styles.pairRow}>
            <View style={styles.pairAvatars}>
              <Avatar name={pair2Nicknames?.[0] ?? pair2Names[0]} imageUrl={pair2Avatars?.[0] ?? null} size={36} />
              {!isSinglesMatch && <Avatar name={pair2Nicknames?.[1] ?? pair2Names[1]} imageUrl={pair2Avatars?.[1] ?? null} size={36} />}
            </View>
            <View style={styles.pairNames}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerNameTop} numberOfLines={1}>{pair2Names[0]}</Text>
                {pair2Nicknames?.[0] && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{pair2Nicknames[0]}</Text>}
              </View>
              {!isSinglesMatch && (
                <>
                  <Text style={styles.pairAmpersand}>&</Text>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerNameTop} numberOfLines={1}>{pair2Names[1]}</Text>
                    {pair2Nicknames?.[1] && <Text style={styles.playerNicknameBottom} numberOfLines={1}>{pair2Nicknames[1]}</Text>}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Team headers above sets */}
        <View style={styles.teamHeaders}>
          <View style={styles.teamHeaderSpacer} />
          <View style={styles.teamHeaderScores}>
            <View style={styles.teamHeaderGroup}>
              <View style={styles.teamHeaderAvatars}>
                <Avatar name={pair1Nicknames?.[0] ?? pair1Names[0]} imageUrl={pair1Avatars?.[0] ?? null} size={22} />
                {!isSinglesMatch && <Avatar name={pair1Nicknames?.[1] ?? pair1Names[1]} imageUrl={pair1Avatars?.[1] ?? null} size={22} />}
              </View>
              <Text style={styles.teamHeaderLabel}>{t('registerResult.pairA')}</Text>
            </View>
            <View style={styles.teamHeaderDashSpacer} />
            <View style={styles.teamHeaderGroup}>
              <View style={styles.teamHeaderAvatars}>
                <Avatar name={pair2Nicknames?.[0] ?? pair2Names[0]} imageUrl={pair2Avatars?.[0] ?? null} size={22} />
                {!isSinglesMatch && <Avatar name={pair2Nicknames?.[1] ?? pair2Names[1]} imageUrl={pair2Avatars?.[1] ?? null} size={22} />}
              </View>
              <Text style={styles.teamHeaderLabel}>{t('registerResult.pairB')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('registerResult.scoreSection')}</Text>
        {renderSetRow(0, t('registerResult.set1'))}
        {renderSetRow(1, t('registerResult.set2'))}
        {showSet3 && renderSetRow(2, t('registerResult.set3'))}

        {!showSet3 && set1Won && set2Won && set1Won === set2Won && (
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>
              {t('registerResult.directWin', { pair: set1Won })}
            </Text>
          </View>
        )}

        {showSet3 && (
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>
              {t('registerResult.tiebreakHint')}
            </Text>
          </View>
        )}

        {derived && (
          <View style={styles.outcomePreview}>
            <View style={styles.outcomePreviewHeader}>
              <Text style={styles.outcomePreviewLabel}>{t(`registerResult.${derived.outcome}`)}</Text>
              {(derived.outcome === 'p1tb' || derived.outcome === 'p2tb') && (
                <View style={styles.tbBadge}>
                  <Text style={styles.tbText}>TB</Text>
                </View>
              )}
            </View>
            <Text style={styles.outcomePreviewPts}>{t(`registerResult.${derived.outcome}Pts`)}</Text>
            <Text style={styles.outcomePreviewScore}>{derived.scoreStr}</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={isEditing ? t('registerResult.saveEdit') : t('registerResult.confirmResult')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!derived}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  scroll:         { flexGrow: 1, padding: spacing.xl },
  closeBtn:       { marginBottom: 20 },
  closeText:      { color: colors.textMuted, fontSize: 14 },
  title:          { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 24, letterSpacing: -0.5 },

  playersCard:    { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: 28, borderWidth: 1, borderColor: colors.border, gap: 10 },
  pairLabelRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairBadge:      { fontSize: 11, fontWeight: '800', color: colors.accent, backgroundColor: `rgba(${colors.accentRgb},0.12)`, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  pairRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pairAvatars:    { flexDirection: 'row', gap: -8 },
  pairNames:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  playerInfo:     {},
  playerNameTop:  { fontSize: 14, fontWeight: '700', color: colors.text },
  playerNicknameBottom: { fontSize: 10, color: colors.text, opacity: 0.7, marginTop: 1 },
  pairAmpersand:  { fontSize: 12, fontWeight: '700', color: colors.accent },
  vsDividerRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  vsLine:         { flex: 1, height: 1.5, backgroundColor: colors.accent, opacity: 0.3 },
  vsText:         { fontSize: 14, fontWeight: '800', color: colors.accent },

  sectionLabel:   { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },

  teamHeaders:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  teamHeaderSpacer: { width: 60 },
  teamHeaderScores: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  teamHeaderGroup:  { flex: 1, alignItems: 'center', gap: 4 },
  teamHeaderAvatars:{ flexDirection: 'row', gap: -6 },
  teamHeaderLabel:  { textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  teamHeaderDashSpacer: { width: 20 },

  setRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  setLabel:       { width: 60, fontSize: 13, fontWeight: '700', color: colors.textMuted },
  setScores:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  setDash:        { fontSize: 16, fontWeight: '800', color: colors.accent },

  stepper:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  stepBtn:        { width: 40, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.inputBg },
  stepBtnText:    { fontSize: 20, fontWeight: '600', color: colors.accent },
  stepValue:      { width: 36, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },

  hintRow:        { marginBottom: 16 },
  hintText:       { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },

  outcomePreview:       { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: 16, borderWidth: 1, borderColor: colors.accent + '40', gap: 6 },
  outcomePreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outcomePreviewLabel:  { fontSize: 15, fontWeight: '800', color: colors.text },
  outcomePreviewPts:    { fontSize: 12, color: colors.textMuted },
  outcomePreviewScore:  { fontSize: 13, fontWeight: '700', color: colors.accent, letterSpacing: 0.5 },
  tbBadge:              { backgroundColor: `rgba(${colors.accentRgb},0.15)`, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  tbText:               { fontSize: 10, fontWeight: '800', color: colors.accent },

  error:          { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  submitBtn:      { marginTop: 4 },
});
