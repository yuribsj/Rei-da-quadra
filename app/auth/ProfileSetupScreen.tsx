import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { pickAndUploadAvatar } from '../../lib/avatar';
import AvatarPicker from '../../components/AvatarPicker';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, ThemeColors } from '../../constants/theme';

export default function ProfileSetupScreen() {
  const { user, refreshProfile, signOut } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [nickname, setNickname]   = useState('');
  const [phone, setPhone]         = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!nickname.trim()) e.nickname = t('profileSetup.nicknameRequired');
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);

    const updates: Record<string, any> = {
      nickname: nickname.trim(),
      phone: phone.trim() || null,
    };
    if (avatarUrl) updates.avatar_url = avatarUrl;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user!.id);
    setLoading(false);

    if (error) {
      setErrors({ global: error.message });
    } else {
      await refreshProfile();
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
    <View style={styles.topBar}>
      <TouchableOpacity onPress={signOut} style={styles.backBtn}>
        <Text style={styles.backChevron}>‹</Text>
      </TouchableOpacity>
    </View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>{t('profileSetup.title')}</Text>
          <Text style={styles.sub}>{t('profileSetup.subtitle')}</Text>
        </View>

        <View style={styles.avatarSection}>
          <AvatarPicker
            currentUrl={avatarUrl}
            fallbackName={nickname || user?.email || '?'}
            size={100}
            onPick={() => pickAndUploadAvatar(user!.id)}
            onUploaded={setAvatarUrl}
          />
          <Text style={styles.avatarHint}>{t('profileSetup.tapToAddPhoto')}</Text>
        </View>

        <Input
          label={t('profileSetup.nicknameLabel')}
          placeholder={t('profileSetup.nicknamePlaceholder')}
          value={nickname}
          onChangeText={setNickname}
          error={errors.nickname}
        />
        <Input
          label={t('profileSetup.phoneLabel')}
          placeholder={t('profileSetup.phonePlaceholder')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        {errors.global ? <Text style={styles.errorGlobal}>{errors.global}</Text> : null}

        <Button title={t('profileSetup.submit')} onPress={handleSave} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  topBar:        { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backChevron:   { fontSize: 28, color: colors.textMuted, marginTop: -2 },
  scroll:        { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header:        { alignItems: 'center', marginBottom: 28 },
  crown:         { fontSize: 52, marginBottom: 10 },
  title:         { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub:           { fontSize: 14, color: colors.textDim, marginTop: 6, textAlign: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarHint:    { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  errorGlobal:   { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:           { marginTop: 8 },
});
