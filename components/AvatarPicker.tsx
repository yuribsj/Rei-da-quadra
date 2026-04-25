import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/theme';
import { AvatarResult } from '../lib/avatar';

type Props = {
  currentUrl?: string | null;
  fallbackName: string;
  size?: number;
  onPick: () => Promise<AvatarResult | null>;
  onUploaded?: (publicUrl: string) => void;
};

export default function AvatarPicker({ currentUrl, fallbackName, size = 100, onPick, onUploaded }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const displayUri = localUri ?? currentUrl;

  const handlePress = async () => {
    setError('');
    setUploading(true);
    try {
      const result = await onPick();
      if (result) {
        setLocalUri(result.localUri);
        onUploaded?.(result.publicUrl);
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const borderRadius = size / 2;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.container, { width: size, height: size, borderRadius, overflow: 'hidden' }]}
        onPress={handlePress}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {displayUri && !error ? (
          <Image
            source={{ uri: displayUri }}
            style={{ width: size, height: size, borderRadius }}
            resizeMode="cover"
            onError={() => setError('Não foi possível carregar a imagem.')}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius }]}>
            <Text style={[styles.placeholderText, { fontSize: size * 0.38 }]}>
              {fallbackName[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        {uploading && (
          <View style={[styles.overlay, { borderRadius }]}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📷</Text>
        </View>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper:         { alignItems: 'center' },
  container:       { position: 'relative' },
  placeholder:     { backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.accent, fontWeight: '800' },
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  badge:           { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  badgeText:       { fontSize: 14 },
  error:           { color: colors.error, fontSize: 12, marginTop: 6, textAlign: 'center' },
});
