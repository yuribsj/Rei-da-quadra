import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/theme';

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: number;
};

export default function Avatar({ name, imageUrl, size = 36 }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const borderRadius = size / 2;
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.38 }]}>
        {name?.[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  image:        { resizeMode: 'cover', borderWidth: 1, borderColor: colors.border },
  fallback:     { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  fallbackText: { color: colors.accent, fontWeight: '800' },
});
