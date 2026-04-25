import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'CreateChampionship'> };

const MAX_OPTIONS = [4, 8, 12, 16, 20];

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

type Sport = 'Padel' | 'Tênis';
type TennisMode = 'Simples' | 'Duplas';

const SPORTS: { key: Sport; label: string }[] = [
  { key: 'Padel',  label: 'Padel' },
  { key: 'Tênis',  label: 'Tênis' },
];

const TENNIS_MODES: { key: TennisMode; label: string }[] = [
  { key: 'Simples', label: 'Simples' },
  { key: 'Duplas',  label: 'Duplas' },
];

export default function CreateChampionshipScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [name, setName]                     = useState('');
  const [sport, setSport]                   = useState<Sport>('Padel');
  const [tennisMode, setTennisMode]         = useState<TennisMode>('Simples');
  const [maxPlayers, setMax]                = useState(12);
  const [allowMemberInvite, setAllowInvite] = useState(true);
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [loading, setLoading]               = useState(false);

  const sportValue = sport === 'Tênis' ? `Tênis - ${tennisMode}` : 'Padel';

  const handleCreate = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('createChampionship.nameRequired');
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);

    let championshipId: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('championships')
        .insert({
          name:                 name.trim(),
          sport:                sportValue,
          max_players:          maxPlayers,
          allow_member_invite:  allowMemberInvite,
          status:               'waiting',
          admin_id:             user!.id,
          invite_code:          generateCode(),
        })
        .select('id')
        .single();

      if (error?.code === '23505') continue;
      if (error) { setErrors({ global: error.message }); setLoading(false); return; }
      championshipId = data.id;
      break;
    }

    if (!championshipId) {
      setErrors({ global: t('createChampionship.codeError') });
      setLoading(false);
      return;
    }

    const { error: mErr } = await supabase.from('memberships').insert({
      championship_id: championshipId,
      user_id:         user!.id,
      status:          'accepted',
      joined_at:       new Date().toISOString(),
    });

    setLoading(false);

    if (mErr) {
      setErrors({ global: mErr.message });
      return;
    }

    navigation.replace('ChampionshipDetail', { id: championshipId, name: name.trim() });
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{t('createChampionship.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('createChampionship.title')}</Text>
        </View>

        <Input
          label={t('createChampionship.nameLabel')}
          placeholder={t('createChampionship.namePlaceholder')}
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <View style={styles.field}>
          <Text style={styles.label}>{t('createChampionship.sport')}</Text>
          <View style={styles.optionRow}>
            {SPORTS.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[styles.option, sport === s.key && styles.optionActive]}
                onPress={() => setSport(s.key)}
              >
                <Text style={[styles.optionText, sport === s.key && styles.optionTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {sport === 'Tênis' && (
            <View style={styles.subOptionRow}>
              {TENNIS_MODES.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.subOption, tennisMode === m.key && styles.subOptionActive]}
                  onPress={() => setTennisMode(m.key)}
                >
                  <Text style={[styles.subOptionText, tennisMode === m.key && styles.subOptionTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('createChampionship.maxPlayers')}</Text>
          <View style={styles.optionRow}>
            {MAX_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.option, maxPlayers === n && styles.optionActive]}
                onPress={() => setMax(n)}
              >
                <Text style={[styles.optionText, maxPlayers === n && styles.optionTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.label}>{t('createChampionship.membersCanInvite')}</Text>
            <Text style={styles.switchHint}>
              {allowMemberInvite
                ? t('createChampionship.membersCanInviteOn')
                : t('createChampionship.membersCanInviteOff')}
            </Text>
          </View>
          <Switch
            value={allowMemberInvite}
            onValueChange={setAllowInvite}
            trackColor={{ false: colors.surface2, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>

        {errors.global ? <Text style={styles.errorGlobal}>{errors.global}</Text> : null}

        <Button
          title={t('createChampionship.createBtn')}
          onPress={handleCreate}
          loading={loading}
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  scroll:          { flexGrow: 1, padding: spacing.xl },
  header:          { marginBottom: 28 },
  backBtn:         { marginBottom: 16 },
  backText:        { color: colors.textMuted, fontSize: 14 },
  title:           { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  field:           { marginBottom: 20 },
  label:           { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow:       { flexDirection: 'row', gap: 10 },
  option:          { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  optionActive:    { backgroundColor: colors.accent, borderColor: colors.accent },
  optionText:      { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  optionTextActive:{ color: '#000' },
  subOptionRow:    { flexDirection: 'row', gap: 8, marginTop: 10 },
  subOption:       { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  subOptionActive: { backgroundColor: `rgba(${colors.accentRgb},0.15)`, borderColor: colors.accent },
  subOptionText:   { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  subOptionTextActive: { color: colors.accent, fontWeight: '700' },
  switchRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 },
  switchInfo:      { flex: 1 },
  switchHint:      { fontSize: 12, color: colors.textDim, marginTop: 4, lineHeight: 17 },
  errorGlobal:     { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:             { marginTop: 8 },
});
