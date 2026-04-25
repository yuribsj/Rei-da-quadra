import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET = 'avatars';

export type AvatarResult = {
  /** Local file URI — use for immediate display */
  localUri: string;
  /** Remote Supabase public URL — save to database */
  publicUrl: string;
};

/**
 * Opens the image picker and uploads the selected image to Supabase Storage.
 * Returns both the local URI (instant display) and remote URL (persistence).
 * Returns null if the user cancelled.
 */
export async function pickAndUploadAvatar(userId: string): Promise<AvatarResult | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão para acessar a galeria é necessária.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled) return null;

  const localUri = result.assets[0].uri;
  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const filePath = `${userId}.${ext}`;

  // React Native: read file as ArrayBuffer for reliable Supabase upload
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return {
    localUri,
    publicUrl: `${data.publicUrl}?t=${Date.now()}`,
  };
}
