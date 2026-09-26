import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { formatDate } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTIONS = [
  { icon: 'qr-code', label: 'Convert these images into one QR', to: 'CreateQR' as const },
  { icon: 'language', label: 'Translate this menu', to: 'Translation' as const },
  { icon: 'videocam', label: 'Create a meeting QR', to: 'Meeting' as const },
  { icon: 'swap-horizontal', label: 'Share this folder offline', to: 'TransferSession' as const },
  { icon: 'bookmark', label: 'Save a link to vault', to: 'LinkVault' as const },
  { icon: 'folder', label: 'Find duplicate files', to: 'FileOrganizer' as const },
];

export const AIScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const translations = useStore(s => s.translations);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    const reply = {
      role: 'ai' as const,
      content: 'The AI assistant service is not configured. Use the quick commands above to open an available feature.',
    };
    setMessages(m => [...m, userMsg, reply]);
    setInput('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={theme.colors.backgroundGradient}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FadeIn delay={50} from="top">
          <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>
                AI ASSISTANT
              </Text>
              <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginTop: 2 }}>
                Ask QRVerse
              </Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient
                colors={theme.colors.auroraGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="sparkles" size={22} color="#fff" />
              </LinearGradient>
            </View>
          </View>
        </FadeIn>

        {/* Quick suggestion chips */}
        <FadeIn delay={120}>
          <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, paddingHorizontal: 20, marginTop: 16 }}>
            QUICK COMMANDS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            {SUGGESTIONS.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => navigation.navigate(s.to as any)}
                style={({ pressed }) => ({ marginRight: 8, opacity: pressed ? 0.85 : 1 })}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Ionicons name={s.icon as any} size={14} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700', marginLeft: 8 }}>{s.label}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </FadeIn>

        {/* Conversation */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
        >
          <FadeIn delay={200}>
            {messages.map((m, idx) => (
              <View key={idx} style={{ marginBottom: 14, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', maxWidth: '88%' }}>
                  {m.role === 'ai' && (
                    <View
                      style={{
                        width: 30, height: 30, borderRadius: 10,
                        overflow: 'hidden', marginRight: 8, marginBottom: 2,
                      }}
                    >
                      <LinearGradient colors={theme.colors.auroraGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="sparkles" size={14} color="#fff" />
                      </LinearGradient>
                    </View>
                  )}
                  <View
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      borderTopLeftRadius: m.role === 'ai' ? 4 : 18,
                      borderTopRightRadius: m.role === 'user' ? 4 : 18,
                      backgroundColor: m.role === 'user' ? theme.colors.primary : theme.colors.surface,
                      borderWidth: m.role === 'user' ? 0 : 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Text style={{ color: m.role === 'user' ? '#fff' : theme.colors.text, fontSize: 14, lineHeight: 20, fontWeight: '500' }}>
                      {m.content}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </FadeIn>

          {/* Translation shortcuts */}
          <FadeIn delay={260}>
            <View style={{ marginTop: 18 }}>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 12 }}>
                AI FEATURES
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Translation')}
                style={({ pressed }) => ({ marginBottom: 10, opacity: pressed ? 0.9 : 1 })}
              >
                <View style={{ borderRadius: 22, overflow: 'hidden' }}>
                  <LinearGradient colors={['#A855F7', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="language" size={22} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>AI Picture Translation</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>100+ languages · preserves layout</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </LinearGradient>
                </View>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('CreateQR')}
                style={({ pressed }) => ({ marginBottom: 10, opacity: pressed ? 0.9 : 1 })}
              >
                <View style={{ borderRadius: 22, overflow: 'hidden' }}>
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="qr-code" size={22} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Smart QR Generator</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>20+ types · 7 premium templates</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </LinearGradient>
                </View>
              </Pressable>

              <View style={{ marginTop: 18 }}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 10 }}>
                  RECENT TRANSLATIONS
                </Text>
                {translations.length === 0 ? (
                  <GlassCard radius={18}>
                    <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                      <Ionicons name="document-text-outline" size={28} color={theme.colors.textTertiary} />
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 12, marginTop: 6, fontWeight: '600' }}>
                        No translations yet
                      </Text>
                    </View>
                  </GlassCard>
                ) : (
                  translations.slice(0, 4).map((t) => (
                    <GlassCard key={t.id} radius={18} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.colors.primarySoft, marginRight: 8 }}>
                          <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '800' }}>
                            {t.sourceLang.toUpperCase()} → {t.targetLang.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600' }}>
                          {formatDate(t.detectedAt)}
                        </Text>
                      </View>
                      <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
                        {t.translatedText}
                      </Text>
                    </GlassCard>
                  ))
                )}
              </View>
            </View>
          </FadeIn>
        </ScrollView>

        {/* Input bar */}
        <View
          style={{
            position: 'absolute',
            left: 0, right: 0, bottom: 0,
            padding: 16,
            paddingBottom: 90,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderRadius: 28,
              backgroundColor: theme.colors.surfaceElevated,
              borderWidth: 1,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <TextInput
              placeholder="Ask me anything..."
              placeholderTextColor={theme.colors.textTertiary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: 14,
                fontWeight: '500',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <View
                style={{
                  width: 40, height: 40, borderRadius: 999, overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={theme.colors.brandGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="arrow-up" size={20} color="#fff" />
                </LinearGradient>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};