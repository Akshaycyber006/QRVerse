import React from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../auth/AuthProvider';

const SECTIONS: Array<{ title: string; items: Array<{ icon: string; color: string; label: string; sub?: string; type: 'toggle' | 'link' | 'value'; value?: boolean; valueText?: string }> }> = [
  {
    title: 'Security',
    items: [
      { icon: 'finger-print', color: '#10B981', label: 'Biometric Lock', type: 'toggle', value: true },
      { icon: 'keypad', color: '#8B5CF6', label: 'PIN Lock', sub: '6-digit fallback', type: 'toggle', value: true },
      { icon: 'shield-checkmark', color: '#3B82F6', label: 'End-to-End Encryption', type: 'toggle', value: true },
      { icon: 'timer-outline', color: '#F59E0B', label: 'Expiring QR Default', sub: '7 days', type: 'value', valueText: '7 days' },
      { icon: 'eye-off', color: '#64748B', label: 'Hidden Files', type: 'link' },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { icon: 'swap-horizontal', color: '#3B82F6', label: 'Transfer Completion', type: 'toggle', value: true },
      { icon: 'videocam', color: '#EC4899', label: 'Meeting Reminders', sub: '15 min before', type: 'toggle', value: true },
      { icon: 'language', color: '#A855F7', label: 'Translation Done', type: 'toggle', value: true },
      { icon: 'timer', color: '#F59E0B', label: 'QR Expirations', type: 'toggle', value: false },
      { icon: 'warning', color: '#EF4444', label: 'Storage Issues', type: 'toggle', value: true },
    ],
  },
  {
    title: 'Data & Sync',
    items: [
      { icon: 'cloud-upload', color: '#3B82F6', label: 'Auto Cloud Sync', sub: 'Wi-Fi only', type: 'toggle', value: true },
      { icon: 'cloud-download', color: '#10B981', label: 'Backup to Cloud', sub: 'Last backup 2h ago', type: 'link' },
      { icon: 'download', color: '#8B5CF6', label: 'Export History', type: 'link' },
      { icon: 'refresh', color: '#06B6D4', label: 'Reset All Data', type: 'link' },
    ],
  },
];

export const SettingsScreen: React.FC = () => {
  const { theme, mode, toggleMode } = useTheme();
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out of this account on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => signOut().catch(error => Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Please try again.')),
      },
    ]);
  };

  const renderItem = (item: any, idx: number, total: number) => {
    return (
      <View
        key={idx}
        style={{
          paddingVertical: 14, paddingHorizontal: 16,
          flexDirection: 'row', alignItems: 'center',
          borderTopWidth: idx === 0 ? 0 : 1,
          borderTopColor: theme.colors.borderSubtle,
        }}
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
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>{item.label}</Text>
          {item.sub && (
            <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{item.sub}</Text>
          )}
        </View>
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={() => {}}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        )}
        {item.type === 'value' && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '800', marginRight: 4 }}>{item.valueText}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
          </View>
        )}
        {item.type === 'link' && (
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
        )}
      </View>
    );
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
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>Settings</Text>
          <View style={{ width: 42, height: 42 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Theme */}
          <View style={{ borderRadius: 22, overflow: 'hidden' }}>
            <LinearGradient colors={theme.colors.brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6, opacity: 0.85 }}>APPEARANCE</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500', marginTop: 4 }}>
                Premium palette with glassmorphism
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 14 }}>
                <Pressable
                  onPress={() => mode === 'light' && toggleMode()}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
                    backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.95)',
                    marginRight: 8, opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="moon" size={14} color={mode === 'dark' ? '#fff' : '#0F172A'} />
                    <Text style={{ color: mode === 'dark' ? '#fff' : '#0F172A', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Dark</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => mode === 'dark' && toggleMode()}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
                    backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.3)',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="sunny" size={14} color={mode === 'light' ? '#0F172A' : '#fff'} />
                    <Text style={{ color: mode === 'light' ? '#0F172A' : '#fff', fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Light</Text>
                  </View>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {SECTIONS.map((section, sIdx) => (
            <View key={sIdx} style={{ marginTop: 24 }}>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 }}>
                {section.title.toUpperCase()}
              </Text>
              <GlassCard radius={20} noPadding>
                {section.items.map((item, idx) => renderItem(item, idx, section.items.length))}
              </GlassCard>
            </View>
          ))}

          <View style={{ marginTop: 24 }}>
            <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 }}>
              ABOUT
            </Text>
            <GlassCard radius={20} noPadding>
              {[
                { icon: 'information-circle', color: '#3B82F6', label: 'Version', value: '1.0.0 (build 2026.01)' },
                { icon: 'document-text', color: '#8B5CF6', label: 'Privacy Policy', link: true },
                { icon: 'help-circle', color: '#10B981', label: 'Help & Support', link: true },
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => ({
                    paddingVertical: 14, paddingHorizontal: 16,
                    flexDirection: 'row', alignItems: 'center',
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: theme.colors.borderSubtle,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', flex: 1 }}>{item.label}</Text>
                  {item.value ? (
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '600' }}>{item.value}</Text>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                  )}
                </Pressable>
              ))}
            </GlassCard>
          </View>

          <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 12 }}>
            <GradientButton
              title="Sign out"
              variant="danger"
              onPress={handleSignOut}
              fullWidth
              style={{ marginBottom: 22 }}
            />
            <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600' }}>
              QRVerse · Made with care
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
