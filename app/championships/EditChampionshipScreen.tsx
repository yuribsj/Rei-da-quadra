import { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'EditChampionship'>;
  route:      RouteProp<HomeStackParamList, 'EditChampionship'>;
};

export default function EditChampionshipScreen({ navigation, route }: Props) {
  const { id, currentName } = route.params;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const [name, setName]     = useState(currentName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('editChampionship.invalidName'), t('editChampionship.nameEmpty'));
      return;
    }
    if (trimmed === currentName) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('championships')
      .update({ name: trimmed })
      .eq('id', id);
    setSaving(false);

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.handle} />

      <View style={styles.content}>
        <Text style={styles.title}>{t('editChampionship.title')}</Text>

        <Text style={styles.label}>{t('editChampionship.nameLabel')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('editChampionship.namePlaceholder')}
          placeholderTextColor={colors.textFaint}
          autoFocus
          maxLength={60}
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
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.surface },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content:       { padding: spacing.xl, gap: 12 },
  title:         { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label:         { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:         { backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text },
  saveBtn:       { marginTop: 8, backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center' },
  saveBtnDisabled:{ opacity: 0.5 },
  saveBtnText:   { fontSize: 15, fontWeight: '800', color: '#000' },
  cancelBtn:     { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
});
