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

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError(t('auth.fillAllFields')); return; }
    setError('');
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>{t('auth.appName')}</Text>
          <Text style={styles.sub}>{t('auth.loginSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.email')}
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label={t('auth.password')}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            secureToggle
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
            <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button title={t('auth.login')} onPress={handleLogin} loading={loading} style={styles.btn} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>{t('auth.createAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header:     { alignItems: 'center', marginBottom: 40 },
  crown:      { fontSize: 52, marginBottom: 10 },
  title:      { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub:        { fontSize: 14, color: colors.textDim, marginTop: 6 },
  form:       { marginBottom: 24 },
  error:      { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgot:     { fontSize: 13, color: colors.accent },
  btn:        { marginTop: 4 },
  footer:     { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
