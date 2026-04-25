import { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, ThemeColors } from '../constants/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  secureToggle?: boolean;
};

export default function Input({ label, error, secureToggle, secureTextEntry, style, ...props }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, error ? styles.rowError : null]}>
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, style]}
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} style={styles.eye}>
            <Text style={styles.eyeText}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap:      { marginBottom: 14 },
  label:     { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  rowError:  { borderColor: colors.error },
  input:     { flex: 1, color: colors.text, fontSize: 15, padding: 13, fontFamily: 'System' },
  eye:       { padding: 12 },
  eyeText:   { fontSize: 16 },
  error:     { fontSize: 11.5, color: colors.error, marginTop: 5 },
});
