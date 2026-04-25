import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { ProfileStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'> };

interface CareerStats {
  championships: number;
  played:        number;
  wins:          number;
  tbWins:        number;
  tbLosses:      number;
  losses:        number;
  points:        number;
}

export default function ProfileScreen({ navigation }: Props) {
  const { profile, user, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [stats,        setStats]        = useState<CareerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [langOpen,     setLangOpen]     = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const userId = user!.id;

    const { data: memberData } = await supabase
      .from('memberships')
      .select('championship_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    const champIds = (memberData ?? []).map((m: any) => m.championship_id);

    if (champIds.length === 0) {
      setStats({ championships: 0, played: 0, wins: 0, tbWins: 0, tbLosses: 0, losses: 0, points: 0 });
      setStatsLoading(false);
      return;
    }

    const { data: matchData } = await supabase
      .from('matches')
      .select('pair1_player1_id, pair1_player2_id, pair2_player1_id, pair2_player2_id, results(outcome)')
      .in('championship_id', champIds)
      .or(
        `pair1_player1_id.eq.${userId},pair1_player2_id.eq.${userId},` +
        `pair2_player1_id.eq.${userId},pair2_player2_id.eq.${userId}`,
      );

    let wins = 0, tbWins = 0, tbLosses = 0, losses = 0, played = 0, points = 0;

    for (const m of (matchData ?? []) as any[]) {
      const result = Array.isArray(m.results) ? m.results[0] : m.results ?? null;
      if (!result) continue;
      played++;
      const inPair1 = m.pair1_player1_id === userId || m.pair1_player2_id === userId;
      const outcome = result.outcome as string;
      if (inPair1) {
        if      (outcome === 'p1win') { wins++;     points += 3; }
        else if (outcome === 'p1tb')  { tbWins++;   points += 2; }
        else if (outcome === 'p2tb')  { tbLosses++; points += 1; }
        else                          { losses++;                 }
      } else {
        if      (outcome === 'p2win') { wins++;     points += 3; }
        else if (outcome === 'p2tb')  { tbWins++;   points += 2; }
        else if (outcome === 'p1tb')  { tbLosses++; points += 1; }
        else                          { losses++;                 }
      }
    }

    setStats({ championships: champIds.length, played, wins, tbWins, tbLosses, losses, points });
    setStatsLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteConfirmTitle'),
      t('profile.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteConfirmBtn'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_own_account');
            if (error) {
              Alert.alert(t('common.error'), error.message);
              return;
            }
            await signOut();
          },
        },
      ],
    );
  };

  const winRate = stats && stats.played > 0
    ? Math.round((stats.wins + stats.tbWins) / stats.played * 100)
    : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <View style={styles.identityCard}>
          <Avatar
            name={profile?.nickname ?? profile?.name ?? '?'}
            imageUrl={profile?.avatar_url}
            size={80}
          />
          <Text style={styles.name}>{profile?.name ?? '—'}</Text>
          {profile?.nickname ? (
            <Text style={styles.nickname}>"{profile.nickname}"</Text>
          ) : null}
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Career stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionLabel}>{t('profile.career')}</Text>
          {statsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ paddingVertical: 24 }} />
          ) : (
            <>
              <View style={styles.statsTopRow}>
                <View style={styles.statBig}>
                  <Text style={styles.statBigValue}>{stats?.championships ?? 0}</Text>
                  <Text style={styles.statBigLabel}>{t('profile.championships')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBig}>
                  <Text style={[styles.statBigValue, { color: colors.accent }]}>{stats?.points ?? 0}</Text>
                  <Text style={styles.statBigLabel}>{t('profile.totalPoints')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBig}>
                  <Text style={[styles.statBigValue, { color: '#4CAF50' }]}>{winRate}%</Text>
                  <Text style={styles.statBigLabel}>{t('profile.winRate')}</Text>
                </View>
              </View>

              <View style={styles.recordRow}>
                <View style={styles.recordItem}>
                  <Text style={[styles.recordValue, { color: '#4CAF50' }]}>{stats?.wins ?? 0}</Text>
                  <Text style={styles.recordLabel}>{t('profile.wins')}</Text>
                </View>
                <View style={styles.recordItem}>
                  <Text style={[styles.recordValue, { color: colors.accent }]}>{stats?.tbWins ?? 0}</Text>
                  <Text style={styles.recordLabel}>{t('profile.tbWins')}</Text>
                </View>
                <View style={styles.recordItem}>
                  <Text style={[styles.recordValue, { color: colors.warning }]}>{stats?.tbLosses ?? 0}</Text>
                  <Text style={styles.recordLabel}>{t('profile.tbLosses')}</Text>
                </View>
                <View style={styles.recordItem}>
                  <Text style={[styles.recordValue, { color: colors.error }]}>{stats?.losses ?? 0}</Text>
                  <Text style={styles.recordLabel}>{t('profile.losses')}</Text>
                </View>
                <View style={styles.recordItem}>
                  <Text style={[styles.recordValue, { color: colors.textMuted }]}>{stats?.played ?? 0}</Text>
                  <Text style={styles.recordLabel}>{t('profile.matchesPlayed')}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.rowLabel}>{t('profile.editProfile')}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('CareerHistory')}
          >
            <Text style={styles.rowLabel}>{t('profile.championshipHistory')}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.lightMode')}</Text>
            <Switch
              value={!isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.surface2, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity style={[styles.row, styles.rowLast]} onPress={() => setLangOpen(true)}>
            <Text style={styles.rowLabel}>{t('profile.language')}</Text>
            <View style={styles.langDropdown}>
              <Text style={styles.langDropdownValue}>{t(`languages.${language}`)}</Text>
              <Text style={styles.rowChevron}>›</Text>
            </View>
          </TouchableOpacity>

          <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangOpen(false)}>
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>{t('profile.language')}</Text>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.modalOption, language === lang && styles.modalOptionActive]}
                    onPress={() => { setLanguage(lang); setLangOpen(false); }}
                  >
                    <Text style={[styles.modalOptionText, language === lang && styles.modalOptionTextActive]}>
                      {t(`languages.${lang}`)}
                    </Text>
                    {language === lang && <Text style={styles.modalCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>{t('profile.deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title:          { fontSize: 22, fontWeight: '800', color: colors.text },
  scroll:         { paddingHorizontal: spacing.lg, paddingBottom: 40 },

  identityCard:   { alignItems: 'center', paddingVertical: 28 },
  name:           { fontSize: 20, fontWeight: '800', color: colors.text },
  nickname:       { fontSize: 14, color: colors.accent, marginTop: 4 },
  email:          { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  statsCard:      { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  sectionLabel:   { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 16, textTransform: 'uppercase' },
  statsTopRow:    { flexDirection: 'row', marginBottom: 16 },
  statBig:        { flex: 1, alignItems: 'center' },
  statBigValue:   { fontSize: 26, fontWeight: '900', color: colors.text },
  statBigLabel:   { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  statDivider:    { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  recordRow:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  recordItem:     { flex: 1, alignItems: 'center', gap: 3 },
  recordValue:    { fontSize: 18, fontWeight: '800' },
  recordLabel:    { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  section:        { borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLast:        { borderBottomWidth: 0 },
  rowLabel:       { fontSize: 15, color: colors.text },
  rowChevron:     { fontSize: 20, color: colors.textMuted },

  langDropdown:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langDropdownValue:    { fontSize: 14, color: colors.textMuted, fontWeight: '600' },

  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalSheet:           { width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, gap: 4 },
  modalTitle:           { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalOption:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.md },
  modalOptionActive:    { backgroundColor: `rgba(${colors.accentRgb},0.1)` },
  modalOptionText:      { fontSize: 15, color: colors.text },
  modalOptionTextActive:{ color: colors.accent, fontWeight: '700' },
  modalCheck:           { fontSize: 16, fontWeight: '800', color: colors.accent },

  signOutBtn:     { padding: spacing.lg, alignItems: 'center', marginTop: 8 },
  signOutText:    { fontSize: 15, color: colors.error, fontWeight: '600' },
  deleteBtn:      { padding: spacing.lg, alignItems: 'center' },
  deleteText:     { fontSize: 13, color: colors.textMuted },
});
