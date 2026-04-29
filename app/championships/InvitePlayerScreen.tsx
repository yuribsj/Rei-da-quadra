import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';
import Input from '../../components/Input';
import { radius, spacing, ThemeColors } from '../../constants/theme';
import { HomeStackParamList } from '../_navigators';
import { UserProfile } from '../../lib/types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'InvitePlayer'>;
  route:      RouteProp<HomeStackParamList, 'InvitePlayer'>;
};

export default function InvitePlayerScreen({ navigation, route }: Props) {
  const { championshipId, championshipName, existingMemberIds } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<UserProfile[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [invited, setInvited]         = useState<Set<string>>(new Set());
  const [searching, setSearching]     = useState(false);

  // Load suggestions: players from user's other championships + match opponents
  useEffect(() => {
    (async () => {
      const userId = user!.id;

      // Get all championship IDs the user belongs to
      const { data: myMemberships } = await supabase
        .from('memberships')
        .select('championship_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const champIds = (myMemberships ?? []).map((m: any) => m.championship_id);
      if (champIds.length === 0) return;

      // Get all users who are members of those championships
      const { data: fellowMembers } = await supabase
        .from('memberships')
        .select('users!user_id(id, name, nickname, phone, avatar_url, created_at)')
        .in('championship_id', champIds)
        .eq('status', 'accepted')
        .neq('user_id', userId);

      const seen = new Set<string>();
      const unique: UserProfile[] = [];
      for (const m of (fellowMembers ?? []) as any[]) {
        const u = m.users as UserProfile | null;
        if (!u || seen.has(u.id) || existingMemberIds.includes(u.id)) continue;
        seen.add(u.id);
        unique.push(u);
      }

      // Sort alphabetically by name
      unique.sort((a, b) => a.name.localeCompare(b.name));
      setSuggestions(unique);
    })();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(() => search(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const search = async (q: string) => {
    setSearching(true);
    const safe = q.replace(/[,.*()\\]/g, '');
    if (!safe) { setResults([]); setSearching(false); return; }
    const { data } = await supabase
      .from('users')
      .select('id, name, nickname, phone, avatar_url, created_at')
      .or(`name.ilike.%${safe}%,nickname.ilike.%${safe}%,phone.ilike.%${safe}%`)
      .neq('id', user!.id)
      .limit(20);

    setResults(
      (data ?? []).filter((u: UserProfile) => !existingMemberIds.includes(u.id)),
    );
    setSearching(false);
  };

  const handleInvite = async (player: UserProfile) => {
    const { error } = await supabase.from('memberships').insert({
      championship_id: championshipId,
      user_id:         player.id,
      status:          'invited',
      invited_by:      user!.id,
    });

    if (!error) {
      setInvited(prev => new Set(prev).add(player.id));
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{t('invitePlayer.title')}</Text>
          <Text style={styles.sub} numberOfLines={1}>{championshipName}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Input
          placeholder={t('invitePlayer.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {searching && (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('invitePlayer.noResults')}</Text>
        </View>
      )}

      <FlatList
        data={query.trim().length >= 2 ? results : suggestions}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          query.trim().length < 2 && suggestions.length > 0 ? (
            <Text style={styles.suggestionsLabel}>{t('invitePlayer.suggestions')}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const alreadyInvited = invited.has(item.id);
          return (
            <View style={styles.row}>
              <Avatar name={item.nickname ?? item.name} imageUrl={item.avatar_url} size={40} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.nickname ? (
                  <Text style={styles.nickname}>"{item.nickname}"</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.inviteBtn, alreadyInvited && styles.invitedBtn]}
                onPress={() => !alreadyInvited && handleInvite(item)}
                disabled={alreadyInvited}
              >
                <Text style={[styles.inviteBtnText, alreadyInvited && styles.invitedBtnText]}>
                  {alreadyInvited ? t('invitePlayer.invited') : t('invitePlayer.invite')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12 },
  closeBtn:      { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText:     { fontSize: 18, color: colors.textMuted },
  headerInfo:    { flex: 1 },
  title:         { fontSize: 18, fontWeight: '800', color: colors.text },
  sub:           { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  searchWrap:    { paddingHorizontal: spacing.lg },
  spinner:       { marginTop: 24 },
  empty:         { alignItems: 'center', marginTop: 40 },
  emptyText:     { color: colors.textMuted, fontSize: 14 },
  hint:          { alignItems: 'center', marginTop: 40 },
  hintText:      { color: colors.textFaint, fontSize: 14 },
  suggestionsLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  list:          { paddingHorizontal: spacing.lg, paddingTop: 8 },
  row:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  info:          { flex: 1 },
  name:          { fontSize: 15, fontWeight: '700', color: colors.text },
  nickname:      { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  inviteBtn:     { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14 },
  invitedBtn:    { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  inviteBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },
  invitedBtnText:{ color: colors.textMuted },
});
