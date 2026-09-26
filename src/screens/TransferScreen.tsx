import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { FileIcon } from '../components/FileIcon';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { formatBytes, formatDate, formatTime } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadTransfers } from '../services/cloudData';
import { supabase } from '../lib/supabase';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const METHODS = [
  { key: 'wifi-direct', label: 'Wi-Fi Direct', icon: 'wifi', speed: '450 Mbps', color: '#8B5CF6', desc: 'Fastest peer-to-peer' },
  { key: 'hotspot', label: 'Local Hotspot', icon: 'radio', speed: '120 Mbps', color: '#3B82F6', desc: 'Works everywhere' },
  { key: 'bluetooth', label: 'Bluetooth Fallback', icon: 'bluetooth', speed: '3 Mbps', color: '#06B6D4', desc: 'Low energy backup' },
];

export const TransferScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const transfers = useStore(s => s.transfers);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  useEffect(() => {
    if (!supabase) return;
    loadTransfers().catch(error => Alert.alert('Transfer history sync failed', error instanceof Error ? error.message : 'Unable to load transfer history.'));
  }, []);

  const filtered = transfers.filter(t => filter === 'all' || t.direction === filter);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={theme.colors.backgroundGradient}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <FadeIn delay={50} from="top">
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>
                OFFLINE BRIDGE
              </Text>
              <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginTop: 2 }}>
                Transfer Files
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 6 }}>
                Send and receive without internet. End-to-end encrypted.
              </Text>
            </View>
          </FadeIn>

          {/* Big CTA - Send / Receive */}
          <FadeIn delay={120}>
            <View style={{ paddingHorizontal: 20, marginTop: 24, flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => navigation.navigate('TransferSession', { mode: 'send' })}
                style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <View style={{ borderRadius: 24, overflow: 'hidden', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 }}>
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, height: 130, justifyContent: 'space-between' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cloud-upload" size={22} color="#fff" />
                    </View>
                    <View>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Send</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>Push to peer device</Text>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('TransferSession', { mode: 'receive' })}
                style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <View style={{ borderRadius: 24, overflow: 'hidden', shadowColor: '#10B981', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 }}>
                  <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, height: 130, justifyContent: 'space-between' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cloud-download" size={22} color="#fff" />
                    </View>
                    <View>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Receive</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>Scan to receive</Text>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>
            </View>
          </FadeIn>

          {/* Methods */}
          <FadeIn delay={200}>
            <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 }}>
                Transfer Methods
              </Text>
              {METHODS.map((m) => (
                <View key={m.key} style={{ marginBottom: 10 }}>
                  <GlassCard radius={18}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 44, height: 44, borderRadius: 13,
                          backgroundColor: m.color + '20',
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 14,
                        }}
                      >
                        <Ionicons name={m.icon as any} size={20} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }}>{m.label}</Text>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{m.desc}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: m.color, fontSize: 13, fontWeight: '800' }}>{m.speed}</Text>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.colors.success + '20', marginTop: 4 }}>
                          <Text style={{ color: theme.colors.success, fontSize: 9, fontWeight: '800' }}>AVAILABLE</Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              ))}
            </View>
          </FadeIn>

          {/* History */}
          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>
                Transfer History
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="Sent" active={filter === 'sent'} onPress={() => setFilter('sent')} />
              <Chip label="Received" active={filter === 'received'} onPress={() => setFilter('received')} />
            </View>
          </View>

          <FadeIn delay={280}>
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              {filtered.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Ionicons name="swap-horizontal-outline" size={48} color={theme.colors.textTertiary} />
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 13, marginTop: 10, fontWeight: '600' }}>No transfers yet</Text>
                </View>
              )}
              {filtered.map((t) => {
                const duration = t.completedAt ? t.completedAt - t.startedAt : 0;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => navigation.navigate('TransferSession', { mode: t.direction === 'sent' ? 'send' : 'receive', recordId: t.id })}
                    style={({ pressed }) => ({ marginBottom: 10, opacity: pressed ? 0.85 : 1 })}
                  >
                    <GlassCard radius={20}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View
                          style={{
                            width: 46, height: 46, borderRadius: 14,
                            backgroundColor: t.direction === 'sent' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            alignItems: 'center', justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          <Ionicons
                            name={t.direction === 'sent' ? 'arrow-up-circle' : 'arrow-down-circle'}
                            size={24}
                            color={t.direction === 'sent' ? theme.colors.error : theme.colors.success}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
                            {t.direction === 'sent' ? 'Sent to' : 'From'} {t.peerName}
                          </Text>
                          <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                            {formatDate(t.startedAt)} · {duration > 0 ? formatTime(duration) : 'in progress'}
                          </Text>
                        </View>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.success + '20' }}>
                          <Text style={{ color: theme.colors.success, fontSize: 9, fontWeight: '800' }}>
                            {t.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        {t.files.slice(0, 4).map((f, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 6 }}>
                            <FileIcon kind={f.kind} size={20} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', marginLeft: 6 }} numberOfLines={1}>
                              {f.name.length > 14 ? f.name.slice(0, 12) + '…' : f.name}
                            </Text>
                          </View>
                        ))}
                        {t.files.length > 4 && (
                          <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700' }}>
                            +{t.files.length - 4} more
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700' }}>
                          {t.fileCount} files · {formatBytes(t.totalBytes)}
                        </Text>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700' }}>
                          via {t.method === 'wifi-direct' ? 'Wi-Fi Direct' : t.method === 'hotspot' ? 'Hotspot' : 'Bluetooth'}
                        </Text>
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
