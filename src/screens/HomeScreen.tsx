import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { FileIcon, FileKind } from '../components/FileIcon';
import { IconBadge } from '../components/IconBadge';
import { FadeIn, ProgressRing } from '../components/AnimatedNumber';
import { SectionHeader } from '../components/SectionHeader';
import { formatBytes, formatDate } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const QUICK_ACTIONS = [
  { key: 'create', icon: 'qr-code', label: 'Create QR', sub: '20+ types', to: 'CreateQR' as const, gradient: ['#6366F1', '#8B5CF6'] as [string, string] },
  { key: 'transfer', icon: 'swap-horizontal', label: 'Offline Transfer', sub: 'Wi-Fi Direct', to: 'Tabs' as const, target: 'Transfer' as const, gradient: ['#06B6D4', '#3B82F6'] as [string, string] },
  { key: 'translate', icon: 'language', label: 'AI Translate', sub: '100+ langs', to: 'Translation' as const, gradient: ['#A855F7', '#EC4899'] as [string, string] },
  { key: 'meeting', icon: 'videocam', label: 'Meeting', sub: 'HD + AI', to: 'Meeting' as const, gradient: ['#F59E0B', '#EF4444'] as [string, string] },
  { key: 'vault', icon: 'bookmark', label: 'Link Vault', sub: 'Organize', to: 'LinkVault' as const, gradient: ['#10B981', '#059669'] as [string, string] },
  { key: 'files', icon: 'folder', label: 'Files', sub: 'Smart sort', to: 'FileOrganizer' as const, gradient: ['#8B5CF6', '#6366F1'] as [string, string] },
];

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const qrCards = useStore(s => s.qrCards);
  const transfers = useStore(s => s.transfers);
  const meetings = useStore(s => s.meetings);
  const links = useStore(s => s.savedLinks);
  const files = useStore(s => s.files);
  const notifications = useStore(s => s.notifications);

  const storageUsed = useMemo(() => files.reduce((sum, f) => sum + f.sizeBytes, 0), [files]);
  const storageCap = 50_000_000_000; // 50GB cap for demo
  const storagePercent = storageUsed / storageCap;
  const unreadCount = notifications.filter(n => !n.read).length;

  const recentQRs = qrCards.slice(0, 4);
  const liveMeetings = meetings.filter(m => m.status === 'live' || m.status === 'upcoming').slice(0, 2);
  const recentTransfers = transfers.slice(0, 2);
  const favoriteLinks = links.filter(l => l.isFavorite).slice(0, 3);

  const goToAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.to === 'Tabs') {
      navigation.navigate('Tabs' as any, { screen: action.target });
    } else {
      navigation.navigate(action.to as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Aurora background gradient */}
      <LinearGradient
        colors={theme.colors.backgroundGradient}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 480 }}
      />
      <LinearGradient
        colors={[theme.colors.primary + '20', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: 999 }}
      />
      <LinearGradient
        colors={[theme.colors.accent + '18', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 80, left: -100, width: 280, height: 280, borderRadius: 999 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <FadeIn delay={50} from="top">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginRight: 12,
                  }}
                >
                  <LinearGradient
                    colors={theme.colors.brandGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="qr-code" size={22} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '600' }}>
                    Welcome back
                  </Text>
                  <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>
                    QRVerse
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Pressable
                  onPress={() => navigation.navigate('Notifications')}
                  style={({ pressed }) => ({
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: theme.colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Ionicons name="notifications" size={20} color={theme.colors.text} />
                  {unreadCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 9,
                        height: 9,
                        borderRadius: 5,
                        backgroundColor: theme.colors.error,
                        borderWidth: 2,
                        borderColor: theme.colors.background,
                      }}
                    />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('Scanner')}
                  style={({ pressed }) => ({
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    overflow: 'hidden',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <LinearGradient
                    colors={theme.colors.brandGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="scan" size={20} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </FadeIn>

          {/* Hero card with featured QR */}
          <FadeIn delay={120}>
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <GlassCard radius={28} glow>
                <LinearGradient
                  colors={theme.mode === 'dark'
                    ? ['rgba(99,102,241,0.18)', 'rgba(139,92,246,0.10)', 'rgba(168,85,247,0.06)']
                    : ['rgba(99,102,241,0.10)', 'rgba(139,92,246,0.06)', 'rgba(168,85,247,0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28 }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ marginRight: 18 }}>
                    <View
                      style={{
                        padding: 8,
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                        elevation: 8,
                      }}
                    >
                      <QRCode
                        matrix={generateQRMatrix(qrCards[0]?.data || 'qrverse')}
                        size={108}
                        color={qrCards[0]?.qrColor || theme.colors.primary}
                        rounded
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: theme.colors.success,
                          marginRight: 6,
                        }}
                      />
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>
                        FEATURED QR
                      </Text>
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={1}>
                      {qrCards[0]?.title || 'Create your first QR'}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                      {qrCards[0]
                        ? `${qrCards[0].scans} scans · ${formatDate(qrCards[0].createdAt)}`
                        : 'Tap below to design something beautiful.'}
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 14 }}>
                      <GradientButton
                        title={qrCards[0] ? 'Open' : 'Create'}
                        size="sm"
                        icon={<Ionicons name={qrCards[0] ? 'open' : 'add'} size={14} color="#fff" />}
                        onPress={() => qrCards[0]
                          ? navigation.navigate('QRCardDetail', { id: qrCards[0].id })
                          : navigation.navigate('CreateQR')}
                      />
                    </View>
                  </View>
                </View>
              </GlassCard>
            </View>
          </FadeIn>

          {/* Quick Actions grid */}
          <SectionHeader title="Quick Actions" subtitle="One tap to your favorite feature" />
          <FadeIn delay={200}>
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {QUICK_ACTIONS.map((action, idx) => (
                <Pressable
                  key={action.key}
                  onPress={() => goToAction(action)}
                  style={({ pressed }) => ({
                    width: '31.5%',
                    marginBottom: 12,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View
                    style={{
                      borderRadius: 22,
                      overflow: 'hidden',
                      shadowColor: action.gradient[0],
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        padding: 14,
                        height: 116,
                        justifyContent: 'space-between',
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.18)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={action.icon as any} size={18} color="#fff" />
                      </View>
                      <View>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={1}>
                          {action.label}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>
                          {action.sub}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          {/* Storage usage */}
          <SectionHeader title="Storage" subtitle={`${formatBytes(storageUsed)} of 50 GB used`} />
          <FadeIn delay={280}>
            <View style={{ paddingHorizontal: 20 }}>
              <GlassCard>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ProgressRing size={68} strokeWidth={7} progress={storagePercent} color={theme.colors.primary}>
                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800' }}>
                      {(storagePercent * 100).toFixed(1)}%
                    </Text>
                  </ProgressRing>
                  <View style={{ marginLeft: 18, flex: 1 }}>
                    {[
                      { label: 'Documents', value: files.filter(f => ['pdf', 'docx', 'ppt', 'xls', 'text'].includes(f.kind)).reduce((s, f) => s + f.sizeBytes, 0), color: '#3B82F6' },
                      { label: 'Media', value: files.filter(f => ['image', 'video', 'audio'].includes(f.kind)).reduce((s, f) => s + f.sizeBytes, 0), color: '#EC4899' },
                      { label: 'Archives', value: files.filter(f => ['zip', 'apk'].includes(f.kind)).reduce((s, f) => s + f.sizeBytes, 0), color: '#10B981' },
                    ].map((cat) => {
                      const pct = cat.value / storageCap;
                      return (
                        <View key={cat.label} style={{ marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 11, fontWeight: '700' }}>{cat.label}</Text>
                            <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600' }}>{formatBytes(cat.value)}</Text>
                          </View>
                          <View style={{ height: 5, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ width: `${Math.max(pct * 100, 0.5)}%`, height: '100%', backgroundColor: cat.color, borderRadius: 3 }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </GlassCard>
            </View>
          </FadeIn>

          {/* Recent QR Cards */}
          <SectionHeader title="Recent QR Cards" subtitle={`${qrCards.length} cards created`} actionLabel="See all" onAction={() => navigation.navigate('AllQRCards')} />
          <FadeIn delay={340}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {recentQRs.map((card, idx) => (
                <Pressable
                  key={card.id}
                  onPress={() => navigation.navigate('QRCardDetail', { id: card.id })}
                  style={({ pressed }) => ({
                    marginRight: 14,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <GlassCard
                    style={{ width: 180 }}
                    radius={20}
                  >
                    <View style={{ alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ padding: 8, backgroundColor: '#fff', borderRadius: 12 }}>
                        <QRCode
                          matrix={generateQRMatrix(card.data)}
                          size={120}
                          color={card.qrColor}
                          rounded
                        />
                      </View>
                    </View>
                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FileIcon kind={card.kind} size={18} />
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 10, marginLeft: 6, fontWeight: '700' }}>
                          {card.kind.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="scan" size={10} color={theme.colors.textTertiary} />
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 10, marginLeft: 3, fontWeight: '700' }}>
                          {card.scans}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          </FadeIn>

          {/* Recent Transfers */}
          <SectionHeader title="Recent Transfers" subtitle="Your offline bridge activity" />
          <FadeIn delay={400}>
            <View style={{ paddingHorizontal: 20 }}>
              {recentTransfers.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => navigation.navigate('TransferSession', { mode: 'send', recordId: t.id })}
                  style={({ pressed }) => ({ marginBottom: 10, opacity: pressed ? 0.85 : 1 })}
                >
                  <GlassCard radius={20}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          backgroundColor: t.direction === 'sent' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 14,
                        }}
                      >
                        <Ionicons
                          name={t.direction === 'sent' ? 'arrow-up-circle' : 'arrow-down-circle'}
                          size={22}
                          color={t.direction === 'sent' ? theme.colors.error : theme.colors.success}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                          {t.direction === 'sent' ? 'Sent to' : 'Received from'} {t.peerName}
                        </Text>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                          {t.fileCount} files · {formatBytes(t.totalBytes)} · {formatDate(t.startedAt)}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: t.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        }}
                      >
                        <Text
                          style={{
                            color: t.status === 'completed' ? theme.colors.success : theme.colors.warning,
                            fontSize: 10,
                            fontWeight: '800',
                            letterSpacing: 0.4,
                          }}
                        >
                          {t.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          {/* Saved Links */}
          {favoriteLinks.length > 0 && (
            <>
              <SectionHeader title="Saved Links" subtitle={`${links.length} total · ${favoriteLinks.length} favorites`} actionLabel="Open Vault" onAction={() => navigation.navigate('LinkVault')} />
              <FadeIn delay={460}>
                <View style={{ paddingHorizontal: 20 }}>
                  {favoriteLinks.map((l) => (
                    <Pressable
                      key={l.id}
                      onPress={() => navigation.navigate('LinkVault')}
                      style={({ pressed }) => ({ marginBottom: 10, opacity: pressed ? 0.85 : 1 })}
                    >
                      <GlassCard radius={18} noPadding>
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              backgroundColor: theme.colors.primarySoft,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }}
                          >
                            <Text style={{ fontSize: 20 }}>{l.favicon}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                              {l.title}
                            </Text>
                            <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '500', marginTop: 2 }} numberOfLines={1}>
                              {l.url}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                        </View>
                      </GlassCard>
                    </Pressable>
                  ))}
                </View>
              </FadeIn>
            </>
          )}

          {/* Upcoming Meetings */}
          {liveMeetings.length > 0 && (
            <>
              <SectionHeader title="Upcoming Meetings" subtitle="Join with one tap" />
              <FadeIn delay={520}>
                <View style={{ paddingHorizontal: 20 }}>
                  {liveMeetings.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => navigation.navigate('Meeting', { id: m.id })}
                      style={({ pressed }) => ({ marginBottom: 12, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
                    >
                      <View style={{ borderRadius: 24, overflow: 'hidden', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
                        <LinearGradient
                          colors={['#6366F1', '#8B5CF6', '#A855F7']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ padding: 18 }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success, marginRight: 6 }} />
                              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                                UPCOMING
                              </Text>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' }}>
                              {m.duration}m · {m.participants} ppl
                            </Text>
                          </View>
                          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 8, letterSpacing: -0.3 }}>
                            {m.title}
                          </Text>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginTop: 4 }}>
                            Hosted by {m.hostName} · Join code {m.joinCode}
                          </Text>
                          <View style={{ flexDirection: 'row', marginTop: 12 }}>
                            <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="videocam" size={14} color="#fff" />
                              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Join Now</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </FadeIn>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};