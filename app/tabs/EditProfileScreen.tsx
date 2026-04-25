import { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { pickAndUploadAvatar } from '../../lib/avatar';
import AvatarPicker from '../../components/AvatarPicker';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { ProfileStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'> };

export default function EditProfileScreen({ navigation }: Props) {
  const { profile, user, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const [name,      setName]      = useState(profile?.name       ?? '');
  const [nickname,  setNickname]  = useState(profile?.nickname   ?? '');
  const [phone,     setPhone]     = useState(profile?.phone      ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [saving,    setSaving]    = useState(false);

  const handleAvatarUploaded = async (url: string) => {
    setAvatarUrl(url);
    await supabase.from('users').update({ avatar_url: url }).eq('id', user!.id);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(t('editProfile.invalidName'), t('editProfile.nameEmpty'));
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        name:       trimmedName,
        nickname:   nickname.trim() || null,
        phone:      phone.trim()    || null,
        avatar_url: avatarUrl,
      })
      .eq('id', user!.id);
    setSaving(false);

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }

    await refreshProfile();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.handle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('editProfile.title')}</Text>

          <View style={styles.avatarRow}>
            <AvatarPicker
              currentUrl={avatarUrl}
              fallbackName={nickname || name || '?'}
              size={80}
              onPick={() => pickAndUploadAvatar(user!.id)}
              onUploaded={handleAvatarUploaded}
            />
          </View>

          <Text style={styles.label}>{t('editProfile.fullName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('editProfile.namePlaceholder')}
            placeholderTextColor={colors.textFaint}
            autoFocus
            maxLength={60}
            returnKeyType="next"
          />

          <Text style={styles.label}>{t('editProfile.nickname')}</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('editProfile.nicknamePlaceholder')}
            placeholderTextColor={colors.textFaint}
            maxLength={30}
            returnKeyType="next"
          />

          <Text style={styles.label}>{t('editProfile.phone')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('editProfile.phonePlaceholder')}
            placeholderTextColor={colors.textFaint}
            keyboardType="phone-pad"
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={styles.saveBtnText}>{t('common.save')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.surface },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content:        { padding: spacing.xl, gap: 10 },
  avatarRow:      { alignItems: 'center', marginBottom: 8 },
  title:          { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label:          { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:          { backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text, marginBottom: 4 },
  saveBtn:        { marginTop: 12, backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
  saveBtnDisabled:{ opacity: 0.5 },
  saveBtnText:    { fontSize: 15, fontWeight: '800', color: '#000' },
  cancelBtn:      { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:  { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
});
