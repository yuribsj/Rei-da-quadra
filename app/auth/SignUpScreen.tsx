import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { AuthStackParamList } from '../_navigators';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'> };

export default function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [resent, setResent]     = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())               e.name     = t('auth.nameRequired');
    if (!email.trim())              e.email    = t('auth.emailRequired');
    if (password.length < 8)       e.password = t('auth.minChars');
    if (password !== confirm)      e.confirm  = t('auth.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) { setErrors({ global: error }); return; }
    setAwaitingConfirm(true);
  };

  const handleResend = async () => {
    await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  if (awaitingConfirm) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.confirmWrap}>
          <Text style={styles.confirmIcon}>📧</Text>
          <Text style={styles.confirmTitle}>{t('auth.confirmEmail')}</Text>
          <Text style={styles.confirmBody}>{t('auth.sentConfirmation')}</Text>
          <View style={styles.emailPill}>
            <Text style={styles.emailPillText}>{email.trim()}</Text>
          </View>
          <Text style={styles.confirmHint}>{t('auth.confirmHint')}</Text>

          <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resent}>
            <Text style={[styles.resendBtnText, resent && styles.resendBtnSent]}>
              {resent ? t('auth.emailResent') : t('auth.resendEmail')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>{t('auth.goToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.sub}>{t('auth.joinSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Input label={t('auth.fullName')} placeholder={t('auth.yourName')} value={name} onChangeText={setName} autoComplete="name" error={errors.name} />
          <Input label={t('auth.email')} placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" error={errors.email} />
          <Input label={t('auth.password')} placeholder={t('auth.minCharsPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry secureToggle error={errors.password} />
          <Input label={t('auth.confirmPassword')} placeholder={t('auth.repeatPassword')} value={confirm} onChangeText={setConfirm} secureTextEntry secureToggle error={errors.confirm} />
          {errors.global ? <Text style={styles.errorGlobal}>{errors.global}</Text> : null}

          <Button title={t('auth.createAccount')} onPress={handleSignUp} loading={loading} style={styles.btn} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.hasAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header:      { alignItems: 'center', marginBottom: 36 },
  crown:       { fontSize: 52, marginBottom: 10 },
  title:       { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub:         { fontSize: 14, color: colors.textDim, marginTop: 6 },
  form:        { marginBottom: 24 },
  errorGlobal: { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn:         { marginTop: 4 },
  footer:      { flexDirection: 'row', justifyContent: 'center' },
  footerText:  { color: colors.textMuted, fontSize: 14 },
  footerLink:  { color: colors.accent, fontSize: 14, fontWeight: '700' },
  confirmWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  confirmIcon:     { fontSize: 64, marginBottom: 24 },
  confirmTitle:    { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  confirmBody:     { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  emailPill:       { backgroundColor: `rgba(${colors.accentRgb},0.12)`, borderRadius: radius.full, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 20, borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.25)` },
  emailPillText:   { fontSize: 15, fontWeight: '700', color: colors.accent },
  confirmHint:     { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  resendBtn:       { paddingVertical: 12, paddingHorizontal: 24, marginBottom: 12 },
  resendBtnText:   { fontSize: 15, fontWeight: '700', color: colors.accent },
  resendBtnSent:   { color: '#4CAF50' },
  loginBtn:        { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 32 },
  loginBtnText:    { fontSize: 15, fontWeight: '800', color: '#000' },
});
