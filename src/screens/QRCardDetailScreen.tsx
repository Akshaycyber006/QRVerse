import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore, toggleFavoriteQR, deleteQRCard, incrementScan } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { FileIcon } from '../components/FileIcon';
import { FadeIn } from '../components/AnimatedNumber';
import { formatBytes, formatDate } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';
import ViewShot, { captureRef, type ViewShotRef } from 'react-native-view-shot';
import { Platform } from 'react-native';
import { exportQrPng, exportQrSvg } from '../services/qrExport';
import { removeQRCard, updateQRFavorite } from '../services/cloudData';
import { supabase } from '../lib/supabase';
import QRCodeEncoder from 'qrcode';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RT = RouteProp<RootStackParamList, 'QRCardDetail'>;

const TEMPLATE_GRADIENTS: Record<string, [string, string, string]> = {
  minimal: ['#FFFFFF', '#F8FAFC', '#E2E8F0'],
  glass: ['#A78BFA', '#8B5CF6', '#6366F1'],
  neon: ['#06B6D4', '#3B82F6', '#0EA5E9'],
  corporate: ['#1E293B', '#334155', '#0F172A'],
  gold: ['#FCD34D', '#F59E0B', '#D97706'],
  dark: ['#0F172A', '#1E293B', '#020617'],
  festival: ['#EC4899', '#F59E0B', '#EF4444'],
};

export const QRCardDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RT>();
  const { id } = route.params;
  const card = useStore(s => s.qrCards.find(c => c.id === id));
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const previewRef = useRef<ViewShotRef>(null);

  if (!card) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>Card not found</Text>
      </View>
    );
  }

  const gradient = TEMPLATE_GRADIENTS[card.template];
  const textColor = ['minimal', 'glass'].includes(card.template) ? '#0F172A' : '#fff';

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web' && navigator.share) {
        const dataUrl = await QRCodeEncoder.toDataURL(card.data, { errorCorrectionLevel: 'H', margin: 4, width: 1024 });
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const image = new File([blob], `${card.title.replace(/[^a-z0-9-_]+/gi, '-')}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [image] })) await navigator.share({ title: card.title, files: [image] });
        else await navigator.share({ title: card.title, text: `QR content: ${card.data}` });
        return;
      }
      if (Platform.OS !== 'web') {
        const uri = await captureRef(previewRef, { format: 'png', quality: 1 });
        const Sharing = await import('expo-sharing');
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: card.title });
        return;
      }
      await Share.share({ message: `${card.title}\n${card.data}`, title: card.title });
    } catch (error) { Alert.alert('Share failed', error instanceof Error ? error.message : 'Unable to share this QR.'); }
  };

  const handleDownload = async () => {
    try {
      await exportQrSvg(card.data, `${card.title.replace(/[^a-z0-9-_]+/gi, '-')}.svg`);
    } catch (error) { Alert.alert('Export failed', error instanceof Error ? error.message : 'Unable to export SVG.'); }
  };

  const handleSaveToGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        await exportQrPng(card.data, `${card.title.replace(/[^a-z0-9-_]+/gi, '-')}.png`, async () => '');
        return;
      }
      const MediaLibrary = await import('expo-media-library');
      const uri = await captureRef(previewRef, { format: 'png', quality: 1 });
      await MediaLibrary.Asset.create(uri);
      Alert.alert('Saved', 'QR image added to your photo gallery.');
    } catch (error) { Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save this QR.'); }
  };

  const handleDelete = () => {
    Alert.alert('Delete QR Card', `Remove "${card.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { if (supabase) await removeQRCard(card.id); deleteQRCard(card.id); navigation.goBack(); }
        catch (error) { Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unable to delete QR.'); }
      } },
    ]);
  };

  const handleCopyContent = async () => {
    try {
      await Clipboard.setStringAsync(card.data);
      Alert.alert('Copied', 'QR content copied to clipboard.');
    } catch {
      Alert.alert('Copy failed', 'Unable to access the clipboard.');
    }
  };

  const handleSimulateScan = () => {
    incrementScan(card.id);
    Alert.alert('QR Scanned', `Someone scanned "${card.title}". +1 to total scans.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Top nav */}
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
          <Text
            numberOfLines={1}
            style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800', maxWidth: 180 }}
          >
            {card.title}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <Pressable
              onPress={async () => {
                const favorite = !card.isFavorite;
                try { if (supabase) await updateQRFavorite(card.id, favorite); toggleFavoriteQR(card.id); }
                catch (error) { Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to update favorite.'); }
              }}
              style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 14,
                backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 8, opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name={card.isFavorite ? 'heart' : 'heart-outline'} size={20} color={card.isFavorite ? theme.colors.accent : theme.colors.text} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 14,
                backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <FadeIn delay={80}>
            {/* QR card preview with template gradient */}
            <ViewShot ref={previewRef} options={{ format: 'png', quality: 1 }} style={{ borderRadius: 32, overflow: 'hidden', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 }}>
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, alignItems: 'center', minHeight: 380 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: textColor + '20' }}>
                    <Text style={{ color: textColor, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                      {card.template.toUpperCase()} TEMPLATE
                    </Text>
                  </View>
                </View>

                {/* White QR background */}
                <View
                  style={{
                    padding: 16,
                    backgroundColor: '#fff',
                    borderRadius: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <QRCode
                    matrix={generateQRMatrix(card.data)}
                    size={220}
                    color={card.qrColor}
                    rounded
                    logoContent={
                      <View
                        style={{
                          width: 44, height: 44, borderRadius: 12,
                          backgroundColor: card.qrColor,
                          alignItems: 'center', justifyContent: 'center',
                          shadowColor: card.qrColor, shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.5, shadowRadius: 8,
                        }}
                      >
                        <Ionicons name="qr-code" size={20} color="#fff" />
                      </View>
                    }
                  />
                </View>

                <Text style={{ color: textColor, fontSize: 20, fontWeight: '800', marginTop: 18, letterSpacing: -0.4, textAlign: 'center' }} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={{ color: textColor, fontSize: 11, fontWeight: '700', marginTop: 6, opacity: 0.7, letterSpacing: 0.4 }}>
                  {card.kind.toUpperCase()} · {card.sizeBytes > 0 ? formatBytes(card.sizeBytes) : 'TEXT'}
                </Text>
              </LinearGradient>
            </ViewShot>
          </FadeIn>

          {/* Quick stats */}
          <FadeIn delay={140}>
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>{card.scans}</Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 }}>SCANS</Text>
              </View>
              <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>{card.encrypted ? 'E2E' : '—'}</Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 }}>ENCRYPTED</Text>
              </View>
              <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>{card.expiresAt ? 'YES' : '∞'}</Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 }}>EXPIRES</Text>
              </View>
            </View>
          </FadeIn>

          {/* Actions */}
          <FadeIn delay={200}>
            <View style={{ marginTop: 22 }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 }}>
                Actions
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <GradientButton
                  title="Download"
                  icon={<Ionicons name="download-outline" size={16} color="#fff" />}
                  onPress={handleDownload}
                  style={{ flex: 1 }}
                />
                <GradientButton
                  title="Share"
                  variant="secondary"
                  icon={<Ionicons name="share-outline" size={16} color="#fff" />}
                  onPress={handleShare}
                  style={{ flex: 1 }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <GradientButton
                  title="Copy Link"
                  variant="glass"
                  icon={<Ionicons name="link-outline" size={16} color={theme.colors.text} />}
                  onPress={handleCopyContent}
                  style={{ flex: 1 }}
                />
                <GradientButton
                  title="Save to Gallery"
                  variant="glass"
                  icon={<Ionicons name="images-outline" size={16} color={theme.colors.text} />}
                  onPress={handleSaveToGallery}
                  style={{ flex: 1 }}
                />
              </View>
              <Pressable
                onPress={handleSimulateScan}
                style={({ pressed }) => ({
                  marginTop: 8, paddingVertical: 14, borderRadius: 26,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: theme.colors.primarySoft,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="scan" size={18} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '800', marginLeft: 8 }}>Simulate Scan</Text>
              </Pressable>
            </View>
          </FadeIn>

          {/* File info */}
          <FadeIn delay={260}>
            <View style={{ marginTop: 22 }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 }}>
                Details
              </Text>
              <GlassCard radius={20}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <FileIcon kind={card.kind} size={48} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
                        {card.title}
                      </Text>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                        {card.kind.toUpperCase()} {card.sizeBytes > 0 ? `· ${formatBytes(card.sizeBytes)}` : ''}
                      </Text>
                    </View>
                  </View>
                  {[
                    { label: 'Created', value: formatDate(card.createdAt) },
                    { label: 'QR Color', value: card.qrColor },
                    { label: 'Template', value: card.template },
                    { label: 'One-Time Scan', value: card.oneTimeScan ? 'Enabled' : 'Disabled' },
                    { label: 'Password', value: card.passwordProtected ? 'Required' : 'None' },
                    { label: 'Tags', value: card.tags.join(', ') || 'None' },
                  ].map((row, idx) => (
                    <View key={row.label} style={{ flexDirection: 'row', paddingVertical: 10, borderTopWidth: idx === 0 ? 1 : 1, borderTopColor: theme.colors.borderSubtle }}>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '700', flex: 1 }}>{row.label}</Text>
                      <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </GlassCard>
            </View>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
