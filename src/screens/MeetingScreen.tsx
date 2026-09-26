import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore, addMeeting } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { formatDate, formatTime } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createAndPersistQRCard } from '../services/cloudData';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RT = RouteProp<RootStackParamList, 'Meeting'>;

const FEATURES = [
  { icon: 'videocam', label: 'HD Video', color: '#8B5CF6' },
  { icon: 'mic', label: 'Audio', color: '#EC4899' },
  { icon: 'desktop', label: 'Screen Share', color: '#3B82F6' },
  { icon: 'chatbubbles', label: 'Live Chat', color: '#10B981' },
  { icon: 'text', label: 'Captions', color: '#F59E0B' },
  { icon: 'sparkles', label: 'AI Summary', color: '#A855F7' },
  { icon: 'list', label: 'Action Items', color: '#06B6D4' },
  { icon: 'recording', label: 'Recording', color: '#EF4444' },
];

export const MeetingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RT>();
  const meetings = useStore(s => s.meetings);
  const [tab, setTab] = useState<'join' | 'host'>('join');
  const [joinCode, setJoinCode] = useState(route.params?.id ? '' : '');
  const [title, setTitle] = useState('Quick Sync');

  const upcoming = meetings.filter(m => m.status !== 'ended');

  const handleHost = async () => {
    const code = Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
    const newMeeting = addMeeting({
      title: title || 'Untitled Meeting',
      hostName: 'You',
      scheduledAt: Date.now(),
      duration: 60,
      participants: 1,
      joinCode: code,
      status: 'live',
    });
    try { await createAndPersistQRCard({
      title: title || 'Meeting Invite',
      kind: 'meeting',
      template: 'glass',
      data: `qrverse://meeting/${code}`,
      sizeBytes: 0,
      isFavorite: false,
      encrypted: true,
      passwordProtected: true,
      oneTimeScan: false,
      expiresAt: Date.now() + 86400000,
      qrColor: '#6366F1',
      bgColor: '#FFFFFF',
      tags: ['meeting', 'live'],
    }); } catch (error) { Alert.alert('QR save failed', error instanceof Error ? error.message : 'Unable to save meeting QR.'); return; }
    Alert.alert('Meeting Created', `Code: ${code}\nQR invite saved to library.`, [
      { text: 'Open QR', onPress: () => navigation.navigate('Tabs' as any, { screen: 'QR' }) },
      { text: 'Done' },
    ]);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      Alert.alert('Enter Code', 'Please enter a meeting code to join.');
      return;
    }
    Alert.alert('Joining...', `Connecting to ${joinCode.toUpperCase()}.`);
  };

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
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
            Cloud Meeting
          </Text>
          <View style={{ width: 42, height: 42 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <FadeIn delay={50}>
            <View style={{ borderRadius: 28, overflow: 'hidden' }}>
              <LinearGradient colors={['#6366F1', '#8B5CF6', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>PREMIUM</Text>
                  </View>
                </View>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>
                  Meet anywhere, beautifully.
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                  HD video · AI summaries · zero setup.
                </Text>
              </LinearGradient>
            </View>
          </FadeIn>

          {/* Tab switcher */}
          <FadeIn delay={100}>
            <View style={{ marginTop: 22, flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: theme.colors.border }}>
              {(['join', 'host'] as const).map(t => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={({ pressed }) => ({
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                    backgroundColor: tab === t ? theme.colors.primary : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: tab === t ? '#fff' : theme.colors.text, fontSize: 13, fontWeight: '800' }}>
                    {t === 'join' ? 'Join Meeting' : 'Host New'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          {/* Join/Host body */}
          <FadeIn delay={150}>
            <View style={{ marginTop: 18 }}>
              {tab === 'join' ? (
                <GlassCard radius={22}>
                  <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800', marginBottom: 12 }}>
                    Join with code or invite link
                  </Text>
                  <TextInput
                    value={joinCode}
                    onChangeText={setJoinCode}
                    placeholder="Enter code (e.g. J7K2-MEET)"
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="characters"
                    style={{
                      backgroundColor: theme.colors.backgroundElevated,
                      borderRadius: 14,
                      padding: 14,
                      color: theme.colors.text,
                      fontSize: 15,
                      fontWeight: '700',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      letterSpacing: 1,
                    }}
                  />
                  <GradientButton
                    title="Join Now"
                    icon={<Ionicons name="enter-outline" size={16} color="#fff" />}
                    onPress={handleJoin}
                    style={{ marginTop: 14, alignSelf: 'stretch' }}
                    fullWidth
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700', marginHorizontal: 10, letterSpacing: 0.4 }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('Scanner')}
                    style={({ pressed }) => ({
                      marginTop: 14, padding: 14, borderRadius: 16,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: theme.colors.primarySoft,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons name="scan" size={18} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '800', marginLeft: 8 }}>
                      Scan Meeting QR
                    </Text>
                  </Pressable>
                </GlassCard>
              ) : (
                <GlassCard radius={22}>
                  <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800', marginBottom: 12 }}>
                    Start an instant meeting
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Meeting title"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={{
                      backgroundColor: theme.colors.backgroundElevated,
                      borderRadius: 14,
                      padding: 14,
                      color: theme.colors.text,
                      fontSize: 15,
                      fontWeight: '700',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
                    <Chip label="HD Video" active />
                    <Chip label="Captions" active />
                    <Chip label="AI Summary" active />
                    <Chip label="Recording" />
                  </View>
                  <GradientButton
                    title="Start Meeting"
                    icon={<Ionicons name="videocam" size={16} color="#fff" />}
                    onPress={handleHost}
                    style={{ marginTop: 16, alignSelf: 'stretch' }}
                    fullWidth
                  />
                </GlassCard>
              )}
            </View>
          </FadeIn>

          {/* Features grid */}
          <FadeIn delay={200}>
            <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginTop: 24, marginBottom: 12 }}>
              What's included
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FEATURES.map(f => (
                <View key={f.label} style={{ width: '23.5%' }}>
                  <View
                    style={{
                      padding: 12, borderRadius: 16,
                      backgroundColor: f.color + '15',
                      alignItems: 'center',
                      borderWidth: 1, borderColor: f.color + '30',
                    }}
                  >
                    <Ionicons name={f.icon as any} size={20} color={f.color} />
                    <Text style={{ color: theme.colors.text, fontSize: 10, fontWeight: '800', marginTop: 6, textAlign: 'center' }}>
                      {f.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeIn>

          {/* Upcoming meetings */}
          {upcoming.length > 0 && (
            <FadeIn delay={250}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginTop: 24, marginBottom: 12 }}>
                Upcoming ({upcoming.length})
              </Text>
              {upcoming.map(m => (
                <GlassCard key={m.id} radius={20} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        padding: 10, borderRadius: 14,
                        backgroundColor: '#fff',
                        marginRight: 14,
                      }}
                    >
                      <QRCode matrix={generateQRMatrix(m.joinCode)} size={64} color="#6366F1" rounded />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
                        {m.title}
                      </Text>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                        {formatDate(m.scheduledAt)} · {m.participants} ppl
                      </Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.colors.primarySoft, alignSelf: 'flex-start', marginTop: 6 }}>
                        <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
                          {m.joinCode}
                        </Text>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </FadeIn>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
