import React from 'react';
import { View, Text, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeContext';
import { useStore, markNotificationRead, clearAllNotifications } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { FadeIn } from '../components/AnimatedNumber';
import { formatDate } from '../utils/helpers';

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  transfer: { icon: 'swap-horizontal', color: '#3B82F6', label: 'Transfer' },
  meeting: { icon: 'videocam', color: '#8B5CF6', label: 'Meeting' },
  translation: { icon: 'language', color: '#EC4899', label: 'Translation' },
  qr: { icon: 'qr-code', color: '#10B981', label: 'QR' },
  storage: { icon: 'cloud-download', color: '#F59E0B', label: 'Storage' },
};

export const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const notifications = useStore(s => s.notifications);

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
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>Notifications</Text>
          <Pressable
            onPress={clearAllNotifications}
            style={({ pressed }) => ({
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
              backgroundColor: theme.colors.primarySoft,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '800' }}>CLEAR ALL</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <View
                style={{
                  width: 80, height: 80, borderRadius: 999,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="notifications-off-outline" size={36} color={theme.colors.textTertiary} />
              </View>
              <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>All caught up</Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 13, fontWeight: '500', marginTop: 4, textAlign: 'center' }}>
                We'll let you know when something important happens.
              </Text>
            </View>
          ) : (
            <FadeIn delay={50}>
              {notifications.map((n, idx) => {
                const meta = TYPE_META[n.type];
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => markNotificationRead(n.id)}
                    style={({ pressed }) => ({ marginBottom: 10, opacity: pressed ? 0.9 : 1 })}
                  >
                    <View
                      style={{
                        padding: 14, borderRadius: 18,
                        backgroundColor: n.read ? theme.colors.surface : theme.colors.primarySoft,
                        borderWidth: 1, borderColor: n.read ? theme.colors.border : meta.color + '40',
                        flexDirection: 'row', alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 42, height: 42, borderRadius: 13,
                          backgroundColor: meta.color + '20',
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', flex: 1 }} numberOfLines={1}>
                            {n.title}
                          </Text>
                          {!n.read && (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: meta.color }} />
                          )}
                        </View>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 2 }} numberOfLines={2}>
                          {n.message}
                        </Text>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 }}>
                          {formatDate(n.createdAt)} · {meta.label.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </FadeIn>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};