import React from 'react';
import { View, Text, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeContext';

const TEMPLATES: Array<{ key: string; label: string; sub: string; gradient: [string, string]; textColor: string; tags: string[] }> = [
  { key: 'minimal', label: 'Minimal', sub: 'Clean & simple', gradient: ['#FFFFFF', '#F8FAFC'], textColor: '#0F172A', tags: ['#FFFFFF', '#F8FAFC', '#E2E8F0'] },
  { key: 'glass', label: 'Glass', sub: 'Frosted elegance', gradient: ['#A78BFA', '#6366F1'], textColor: '#fff', tags: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.15)'] },
  { key: 'neon', label: 'Neon', sub: 'Vibrant glow', gradient: ['#06B6D4', '#0EA5E9'], textColor: '#fff', tags: ['#06B6D4', '#3B82F6', '#0EA5E9'] },
  { key: 'corporate', label: 'Corporate', sub: 'Business ready', gradient: ['#1E293B', '#0F172A'], textColor: '#fff', tags: ['#1E293B', '#334155', '#0F172A'] },
  { key: 'gold', label: 'Gold', sub: 'Premium shine', gradient: ['#FCD34D', '#F59E0B'], textColor: '#0F172A', tags: ['#FCD34D', '#F59E0B', '#D97706'] },
  { key: 'dark', label: 'Dark', sub: 'Stealth mode', gradient: ['#1E293B', '#020617'], textColor: '#fff', tags: ['#1E293B', '#020617'] },
  { key: 'festival', label: 'Festival', sub: 'Celebration', gradient: ['#EC4899', '#EF4444'], textColor: '#fff', tags: ['#EC4899', '#F59E0B', '#EF4444'] },
];

export const QRTemplateGalleryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

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
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>Templates</Text>
          <View style={{ width: 42, height: 42 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 4 }}>
            GALLERY
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6, marginBottom: 16 }}>
            Template Collection
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 22 }}>
            7 hand-crafted designs. Pick your vibe.
          </Text>

          {TEMPLATES.map((t, idx) => (
            <View key={t.key} style={{ marginBottom: 14 }}>
              <View style={{ borderRadius: 22, overflow: 'hidden' }}>
                <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: t.textColor, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, opacity: 0.8 }}>
                        TEMPLATE 0{idx + 1}
                      </Text>
                      <Text style={{ color: t.textColor, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 }}>
                        {t.label}
                      </Text>
                      <Text style={{ color: t.textColor, fontSize: 12, fontWeight: '500', marginTop: 2, opacity: 0.85 }}>
                        {t.sub}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      {t.tags.map((c, i) => (
                        <View key={i} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, marginLeft: 4, borderWidth: 1.5, borderColor: t.textColor + '30' }} />
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};