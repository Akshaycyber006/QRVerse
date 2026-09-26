import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { formatDate } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';
import { FileKind } from '../components/FileIcon';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_FILTERS: Array<{ key: 'all' | 'fav' | FileKind | 'recent'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'fav', label: 'Favorites' },
  { key: 'recent', label: 'Recent' },
  { key: 'pdf', label: 'Docs' },
  { key: 'image', label: 'Media' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'vcard', label: 'Contacts' },
  { key: 'meeting', label: 'Meetings' },
];

export const QRScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const qrCards = useStore(s => s.qrCards);
  const [filter, setFilter] = useState<typeof TYPE_FILTERS[number]['key']>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = qrCards;
    if (filter === 'fav') list = list.filter(c => c.isFavorite);
    else if (filter === 'recent') list = list.slice(0, 6);
    else if (filter !== 'all') list = list.filter(c => c.kind === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)));
    }
    return list;
  }, [qrCards, filter, search]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={theme.colors.backgroundGradient}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <FadeIn delay={50} from="top">
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>
                  LIBRARY
                </Text>
                <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 }}>
                  Your QR Cards
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Scanner')}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 14,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="scan" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Search bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
              <TextInput
                placeholder="Search QR cards, tags..."
                placeholderTextColor={theme.colors.textTertiary}
                value={search}
                onChangeText={setSearch}
                style={{ flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '500', marginLeft: 10, paddingVertical: 2 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
                </Pressable>
              )}
            </View>
          </View>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={120}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
          >
            {TYPE_FILTERS.map(f => (
              <Chip
                key={f.key}
                label={f.label}
                active={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </ScrollView>
        </FadeIn>

        {/* CTA create */}
        <FadeIn delay={160}>
          <Pressable
            onPress={() => navigation.navigate('CreateQR')}
            style={({ pressed }) => ({
              marginHorizontal: 20,
              marginBottom: 16,
              borderRadius: 22,
              overflow: 'hidden',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <LinearGradient
              colors={theme.colors.brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="add" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Create New QR Card</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginTop: 2 }}>20+ content types · 7 templates</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </FadeIn>

        {/* QR Cards grid */}
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 20, gap: 12 }}
          contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <Ionicons name="qr-code-outline" size={56} color={theme.colors.textTertiary} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 12, fontSize: 14, fontWeight: '600' }}>
                No QR cards match
              </Text>
              <Text style={{ color: theme.colors.textTertiary, marginTop: 4, fontSize: 12 }}>
                Try a different filter or create a new one
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeIn delay={200 + index * 40} from="bottom" style={{ flex: 1 }}>
              <Pressable
                onPress={() => navigation.navigate('QRCardDetail', { id: item.id })}
                style={({ pressed }) => ({
                  flex: 1,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <GlassCard
                  radius={20}
                  noPadding
                  glow={item.isFavorite}
                >
                  <View style={{ padding: 14 }}>
                    <View style={{ alignItems: 'center', marginBottom: 10 }}>
                      <View style={{ padding: 6, backgroundColor: '#fff', borderRadius: 12 }}>
                        <QRCode
                          matrix={generateQRMatrix(item.data)}
                          size={120}
                          color={item.qrColor}
                          rounded
                        />
                      </View>
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: item.qrColor, marginRight: 5 }} />
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '700' }}>
                          {item.kind.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="scan" size={11} color={theme.colors.textTertiary} />
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 10, marginLeft: 3, fontWeight: '700' }}>
                          {item.scans}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '600' }}>
                        {formatDate(item.createdAt)}
                      </Text>
                      <Ionicons
                        name={item.isFavorite ? 'heart' : 'heart-outline'}
                        size={14}
                        color={item.isFavorite ? theme.colors.accent : theme.colors.textTertiary}
                      />
                    </View>
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