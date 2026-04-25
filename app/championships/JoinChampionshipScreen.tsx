import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'JoinChampionship'> };

export default function JoinChampionshipScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError(t('joinChampionship.codeLength')); return; }
    setError('');
    setLoading(true);

    const { data: results, error: champErr } = await supabase
      .rpc('find_championship_by_code', { code: trimmed });

    if (champErr) {
      setError(t('joinChampionship.searchError') + champErr.message);
      setLoading(false);
      return;
    }

    const champ = (results as any[])?.[0] ?? null;
    if (!champ) {
      setError(t('joinChampionship.invalidCode'));
      setLoading(false);
      return;
    }

    if (champ.status !== 'waiting') {
      setError(t('joinChampionship.alreadyStarted'));
      setLoading(false);
      return;
    }

    const { data: existing, error: existingErr } = await supabase
      .from('memberships')
      .select('id, status')
      .eq('championship_id', champ.id)
      .eq('user_id', user!.id)
      .maybeSingle();

    if (existingErr) {
      setError(t('joinChampionship.memberError') + existingErr.message);
      setLoading(false);
      return;
    }

    if (existing?.status === 'accepted') {
      navigation.replace('ChampionshipDetail', { id: champ.id, name: champ.name });
      return;
    }

    if (existing?.status === 'invited') {
      const { error: updateErr } = await supabase
        .from('memberships')
        .update({ status: 'accepted', joined_at: new Date().toISOString() })
        .eq('id', existing.id);
      setLoading(false);
      if (updateErr) { setError(updateErr.message); return; }
      navigation.replace('ChampionshipDetail', { id: champ.id, name: champ.name });
      return;
    }

    const { data: memberCount, error: countErr } = await supabase
      .rpc('get_championship_member_count', { champ_id: champ.id });

    if (countErr) {
      setError(t('joinChampionship.slotsError') + countErr.message);
      setLoading(false);
      return;
    }

    if ((memberCount ?? 0) >= champ.max_players) {
      setError(t('joinChampionship.maxReached'));
      setLoading(false);
      return;
    }

    const joinedAt = new Date().toISOString();
    let joinErr;

    if (existing?.status === 'declined') {
      ({ error: joinErr } = await supabase
        .from('memberships')
        .update({ status: 'accepted', joined_at: joinedAt })
        .eq('id', existing.id));
    } else {
      ({ error: joinErr } = await supabase
        .from('memberships')
        .insert({
          championship_id: champ.id,
          user_id:         user!.id,
          status:          'accepted',
          joined_at:       joinedAt,
        }));
    }

    setLoading(false);
    if (joinErr) { setError(joinErr.message); return; }
    navigation.replace('ChampionshipDetail', { id: champ.id, name: champ.name });
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>{t('joinChampionship.close')}</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.crown}>🎾</Text>
          <Text style={styles.title}>{t('joinChampionship.title')}</Text>
          <Text style={styles.sub}>
            {t('joinChampionship.subtitle')}
          </Text>
        </View>

        <Input
          label={t('joinChampionship.codeLabel')}
          placeholder={t('joinChampionship.codePlaceholder')}
          value={code}
          onChangeText={v => {
            const match = v.match(/\b([A-Z0-9]{6})\b/i);
            setCode(match && v.length > 6 ? match[1].toUpperCase() : v.toUpperCase());
          }}
          autoCapitalize="characters"
          maxLength={6}
          error={error}
          style={styles.codeInput}
        />

        <Button title={t('joinChampionship.joinBtn')} onPress={handleJoin} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { flexGrow: 1, padding: spacing.xl },
  closeBtn:   { marginBottom: 24 },
  closeText:  { color: colors.textMuted, fontSize: 14 },
  hero:       { alignItems: 'center', marginBottom: 36 },
  crown:      { fontSize: 52, marginBottom: 12 },
  title:      { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  sub:        { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  codeInput:  { fontSize: 22, fontWeight: '800', letterSpacing: 4, textAlign: 'center' } as any,
  btn:        { marginTop: 8 },
});
