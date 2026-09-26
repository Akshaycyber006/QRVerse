import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, TextInput, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeContext';
import { useStore, toggleFavoriteQR, deleteQRCard } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { formatDate } from '../utils/helpers';
import { loadQRCards, removeQRCard, updateQRFavorite } from '../services/cloudData';
import { supabase } from '../lib/supabase';

export const AllQRCardsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const cards = useStore(s => s.qrCards);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'scans' | 'name'>('recent');

  useEffect(() => {
    if (!supabase) return;
    loadQRCards().catch(error => Alert.alert('QR sync failed', error instanceof Error ? error.message : 'Unable to load QR history.'));
  }, []);

  const toggleFavorite = async (card: (typeof cards)[number]) => {
    try { if (supabase) await updateQRFavorite(card.id, !card.isFavorite); toggleFavoriteQR(card.id); }
    catch (error) { Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to update QR favorite.'); }
  };

  const deleteCard = async (id: string) => {
    try { if (supabase) await removeQRCard(id); deleteQRCard(id); }
    catch (error) { Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unable to delete QR.'); }
  };

  const filtered = cards
    .filter(c => !search.trim() || c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'recent') return b.createdAt - a.createdAt;
      if (sort === 'scans') return b.scans - a.scans;
      return a.title.localeCompare(b.title);
    });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>QR History</Text>
          <Pressable
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="filter" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border }}>
            <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
            <TextInput
              placeholder="Search by title…"
              placeholderTextColor={theme.colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '500', marginLeft: 10 }}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <Chip label="Recent" active={sort === 'recent'} onPress={() => setSort('recent')} icon={<Ionicons name="time-outline" size={12} color={sort === 'recent' ? '#fff' : undefined} />} />
          <Chip label="Most Scans" active={sort === 'scans'} onPress={() => setSort('scans')} icon={<Ionicons name="scan-outline" size={12} color={sort === 'scans' ? '#fff' : undefined} />} />
          <Chip label="Name" active={sort === 'name'} onPress={() => setSort('name')} icon={<Ionicons name="text-outline" size={12} color={sort === 'name' ? '#fff' : undefined} />} />
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 20, gap: 12 }}
          contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeIn delay={50 + index * 30} style={{ flex: 1 }}>
              <Pressable
                onPress={() => navigation.navigate('QRCardDetail', { id: item.id })}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <GlassCard radius={20} noPadding glow={item.isFavorite}>
                  <View style={{ padding: 12 }}>
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ padding: 5, backgroundColor: '#fff', borderRadius: 10 }}>
                        <QRCode matrix={generateQRMatrix(item.data)} size={108} color={item.qrColor} rounded />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800', flex: 1 }} numberOfLines={1}>{item.title}</Text>
                      <Pressable onPress={event => { event.stopPropagation(); void toggleFavorite(item); }} hitSlop={8} style={{ padding: 4 }}><Ionicons name={item.isFavorite ? 'heart' : 'heart-outline'} size={14} color={item.isFavorite ? theme.colors.accent : theme.colors.textTertiary} /></Pressable>
                      <Pressable onPress={event => { event.stopPropagation(); void deleteCard(item.id); }} hitSlop={8} style={{ padding: 4 }}><Ionicons name="trash-outline" size={14} color={theme.colors.error} /></Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 }}>
                        {item.kind.toUpperCase()}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="scan" size={10} color={theme.colors.textTertiary} />
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '700', marginLeft: 3 }}>
                          {item.scans}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 9, fontWeight: '600', marginTop: 6 }}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            </FadeIn>
          )}
        />
      </SafeAreaView>
    </View>
  );
};
