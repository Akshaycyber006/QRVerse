import React from 'react';
import { View, Text, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { FadeIn } from '../components/AnimatedNumber';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthProvider';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATS = (s: { qr: number; tr: number; lk: number; mt: number }) => [
  { label: 'QR Cards', value: s.qr, icon: 'qr-code', color: '#8B5CF6' },
  { label: 'Transfers', value: s.tr, icon: 'swap-horizontal', color: '#3B82F6' },
  { label: 'Links', value: s.lk, icon: 'bookmark', color: '#EC4899' },
  { label: 'Meetings', value: s.mt, icon: 'videocam', color: '#10B981' },
];

const MENU_ITEMS = [
  { key: 'qr', label: 'QR History', icon: 'qr-code', to: 'AllQRCards', color: '#8B5CF6' },
  { key: 'transfers', label: 'Transfer History', icon: 'swap-horizontal', to: 'Tabs', target: 'Transfer' as const, color: '#3B82F6' },
  { key: 'links', label: 'Saved Links', icon: 'bookmark', to: 'LinkVault', color: '#EC4899' },
  { key: 'files', label: 'File Organizer', icon: 'folder', to: 'FileOrganizer', color: '#06B6D4' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications', to: 'Notifications', color: '#F59E0B' },
  { key: 'settings', label: 'Settings', icon: 'settings', to: 'Settings', color: '#64748B' },
];

export const ProfileScreen: React.FC = () => {
  const { theme, toggleMode, mode } = useTheme();
  const navigation = useNavigation<Nav>();
  const qrCount = useStore(s => s.qrCards.length);
  const trCount = useStore(s => s.transfers.length);
  const lkCount = useStore(s => s.savedLinks.length);
  const mtCount = useStore(s => s.meetings.length);
  const unread = useStore(s => s.notifications.filter(n => !n.read).length);
  const { session } = useAuth();

  const stats = STATS({ qr: qrCount, tr: trCount, lk: lkCount, mt: mtCount });
  const userName = String(session?.user.user_metadata?.name ?? session?.user.user_metadata?.full_name ?? session?.user.email?.split('@')[0] ?? 'Agon user');
  const userId = session?.user.id ?? 'agon-user';
  const isVerified = Boolean(session?.user.email_confirmed_at);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={theme.colors.backgroundGradient}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      />
      <LinearGradient
        colors={[theme.colors.primary + '22', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: -100, right: -80, width: 320, height: 320, borderRadius: 999 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          <FadeIn delay={50} from="top">
            <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 }}>
                Profile
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Settings')}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 14,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
              </Pressable>
            </View>
          </FadeIn>

          {/* Profile card with avatar + QR */}
          <FadeIn delay={120}>
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <GlassCard radius={28} glow noPadding>
                <LinearGradient
                  colors={theme.mode === 'dark'
                    ? ['rgba(139,92,246,0.18)', 'rgba(99,102,241,0.08)', 'transparent']
                    : ['rgba(139,92,246,0.12)', 'rgba(99,102,241,0.06)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28 }}
                />
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: 16 }}>
                      <View
                        style={{
                          width: 76, height: 76, borderRadius: 22, overflow: 'hidden',
                          shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
                        }}
                      >
                        <LinearGradient colors={theme.colors.auroraGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900' }}>AC</Text>
                        </LinearGradient>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>
                        {userName}
                      </Text>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                        @{userId.slice(0, 8)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.success + '20', marginRight: 6 }}>
                          <Text style={{ color: theme.colors.success, fontSize: 10, fontWeight: '800' }}>FREE PLAN</Text>
                        </View>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.primarySoft }}>
                          <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '800' }}>{isVerified ? 'VERIFIED' : 'UNVERIFIED'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                    {stats.map((s, idx) => (
                      <View key={s.label} style={{ flex: 1, alignItems: 'center', borderRightWidth: idx === stats.length - 1 ? 0 : 1, borderRightColor: theme.colors.border }}>
                        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>{s.value}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Ionicons name={s.icon as any} size={11} color={s.color} />
                          <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                            {s.label}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            </View>
          </FadeIn>

          {/* Identity QR */}
          <FadeIn delay={200}>
            <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
              <GlassCard radius={22} noPadding>
                <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ padding: 6, backgroundColor: '#fff', borderRadius: 12, marginRight: 16 }}>
                    <QRCode
                      matrix={generateQRMatrix(userId)}
                      size={88}
                      color={theme.colors.primary}
                      rounded
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800' }}>Your Identity QR</Text>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                      Share to add contacts instantly
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                      <Pressable
                        onPress={() => {}}
                        style={({ pressed }) => ({
                          paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                          backgroundColor: theme.colors.primarySoft,
                          marginRight: 8,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '800' }}>Share</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {}}
                        style={({ pressed }) => ({
                          paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1, borderColor: theme.colors.border,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text style={{ color: theme.colors.text, fontSize: 11, fontWeight: '800' }}>Download</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </GlassCard>
            </View>
          </FadeIn>

          {/* Menu list */}
          <FadeIn delay={260}>
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 }}>
                Library & Activity
              </Text>
              <GlassCard radius={22} noPadding>
                <View>
                  {MENU_ITEMS.map((item, idx) => (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        if (item.to === 'Tabs') {
                          navigation.navigate('Tabs' as any, { screen: item.target } as any);
                        } else {
                          navigation.navigate(item.to as any);
                        }
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: theme.colors.borderSubtle,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 38, height: 38, borderRadius: 12,
                          backgroundColor: item.color + '20',
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Ionicons name={item.icon as any} size={18} color={item.color} />
                      </View>
                      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1 }}>
                        {item.label}
                      </Text>
                      {item.key === 'notifications' && unread > 0 && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: theme.colors.error + '20', marginRight: 8 }}>
                          <Text style={{ color: theme.colors.error, fontSize: 10, fontWeight: '800' }}>{unread} NEW</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                    </Pressable>
                  ))}
                </View>
              </GlassCard>
            </View>
          </FadeIn>

          {/* Quick toggles */}
          <FadeIn delay={320}>
            <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 }}>
                Quick Settings
              </Text>
              <GlassCard radius={22} noPadding>
                <View>
                  <View style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 0 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1 }}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                    <Pressable
                      onPress={toggleMode}
                      style={({ pressed }) => ({
                        width: 48, height: 28, borderRadius: 14,
                        backgroundColor: mode === 'dark' ? theme.colors.primary : theme.colors.border,
                        padding: 3,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: '#fff',
                          transform: [{ translateX: mode === 'dark' ? 20 : 0 }],
                          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
                        }}
                      />
                    </Pressable>
                  </View>
                  <View style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.borderSubtle }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="finger-print" size={18} color={theme.colors.success} />
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1 }}>Biometric Lock</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: theme.colors.success + '20' }}>
                      <Text style={{ color: theme.colors.success, fontSize: 10, fontWeight: '800' }}>ON</Text>
                    </View>
                  </View>
                  <View style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.borderSubtle }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="cloud-upload" size={18} color={theme.colors.warning} />
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1 }}>Auto Cloud Sync</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: theme.colors.warning + '20' }}>
                      <Text style={{ color: theme.colors.warning, fontSize: 10, fontWeight: '800' }}>WIFI ONLY</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('Settings')}
                    style={({ pressed }) => ({
                      paddingVertical: 14, paddingHorizontal: 16,
                      flexDirection: 'row', alignItems: 'center',
                      borderTopWidth: 1, borderTopColor: theme.colors.borderSubtle,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="shield-checkmark" size={18} color={theme.colors.error} />
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1 }}>Security & Privacy</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                  </Pressable>
                </View>
              </GlassCard>
            </View>
          </FadeIn>

          {/* Premium upsell */}
          <FadeIn delay={380}>
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Pressable
                onPress={() => navigation.navigate('Settings')}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <View style={{ borderRadius: 24, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={['#1A0F2E', '#2D1B4E', '#0F0A1F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 22 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <LinearGradient colors={['#FCD34D', '#F59E0B']} style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="diamond" size={16} color="#fff" />
                      </LinearGradient>
                      <Text style={{ color: '#FCD34D', fontSize: 13, fontWeight: '800', marginLeft: 10, letterSpacing: 0.6 }}>
                        UPGRADE TO PRO
                      </Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>
                      Unlock unlimited cloud, AI summaries, business QR & more
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 }}>
                      {['Unlimited Cloud', 'AI Summary', 'QR Analytics', 'Team Workspace'].map((f) => (
                        <View key={f} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 6 }}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>{f}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>$4.99</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>/month</Text>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>
            </View>
          </FadeIn>

          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700' }}>
              QRVerse v1.0 · Made with care
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
