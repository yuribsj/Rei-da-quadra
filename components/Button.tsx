import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, ThemeColors } from '../constants/theme';

type Props = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export default function Button({ title, loading, variant = 'primary', style, disabled, ...props }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.btn, isPrimary ? styles.primary : styles.ghost, (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#000' : colors.accent} />
        : <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textGhost]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  btn:         { borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  primary:     { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  ghost:       { backgroundColor: 'transparent', borderWidth: 1, borderColor: `rgba(${colors.accentRgb},0.3)` },
  disabled:    { opacity: 0.45 },
  text:        { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  textPrimary: { color: '#000' },
  textGhost:   { color: colors.accent },
});
