import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, ThemeColors } from '../../constants/theme';
import { AuthStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { setError(t('auth.emailRequired')); return; }
    setError('');
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {sent ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentIcon}>📧</Text>
            <Text style={styles.sentTitle}>{t('auth.emailSent')}</Text>
            <Text style={styles.sentBody}>{t('auth.checkInbox')}</Text>
            <Button
              title={t('auth.backToLogin')}
              variant="ghost"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
              <Text style={styles.sub}>{t('auth.forgotSubtitle')}</Text>
            </View>
            <Input
              label={t('auth.email')}
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              error={error}
            />
            <Button title={t('auth.sendLink')} onPress={handleReset} loading={loading} />
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>← {t('common.back')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header:    { marginBottom: 28 },
  title:     { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 10 },
  sub:       { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  back:      { marginTop: 18, alignItems: 'center' },
  backText:  { color: colors.textMuted, fontSize: 14 },
  sentBox:   { alignItems: 'center' },
  sentIcon:  { fontSize: 52, marginBottom: 16 },
  sentTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10 },
  sentBody:  { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
