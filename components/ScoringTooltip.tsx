import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, ThemeColors } from '../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ROWS = [
  { emoji: '🏆', key: 'directWin',  descKey: 'directWinDesc',  pts: '3 pts', color: '#4CAF50' },
  { emoji: '💪', key: 'tbWin',      descKey: 'tbWinDesc',      pts: '2 pts', color: '#D4A843' },
  { emoji: '👊', key: 'tbLoss',     descKey: 'tbLossDesc',     pts: '1 pt',  color: '#FF9800' },
  { emoji: '😤', key: 'directLoss', descKey: 'directLossDesc', pts: '0 pts', color: '#EF5350' },
] as const;

export default function ScoringTooltip({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{t('scoringTooltip.title')}</Text>
          <Text style={styles.subtitle}>{t('scoringTooltip.subtitle')}</Text>

          {ROWS.map(row => (
            <View key={row.key} style={[styles.row, { backgroundColor: row.color + '14' }]}>
              <Text style={styles.emoji}>{row.emoji}</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t(`scoringTooltip.${row.key}`)}</Text>
                <Text style={styles.rowDesc}>{t(`scoringTooltip.${row.descKey}`)}</Text>
              </View>
              <Text style={[styles.rowPts, { color: row.color }]}>{row.pts}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card:      { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: colors.border },
  title:     { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 },
  subtitle:  { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, marginBottom: 8 },
  emoji:     { fontSize: 24 },
  rowText:   { flex: 1 },
  rowLabel:  { fontSize: 13, fontWeight: '700', color: colors.text },
  rowDesc:   { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  rowPts:    { fontSize: 18, fontWeight: '800' },
  closeBtn:  { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 32, alignSelf: 'center', marginTop: 12 },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
