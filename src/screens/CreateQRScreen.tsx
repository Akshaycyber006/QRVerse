import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { addQRCard } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { FileIcon, FileKind } from '../components/FileIcon';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { RootStackParamList } from '../navigation/RootNavigator';
import { saveQRCard } from '../services/cloudData';
import { supabase } from '../lib/supabase';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPES: { kind: FileKind; label: string; icon: any }[] = [
  { kind: 'pdf', label: 'PDF', icon: 'document-text' },
  { kind: 'docx', label: 'DOCX', icon: 'document' },
  { kind: 'ppt', label: 'PPT', icon: 'easel' },
  { kind: 'xls', label: 'XLS', icon: 'grid' },
  { kind: 'image', label: 'Image', icon: 'image' },
  { kind: 'video', label: 'Video', icon: 'videocam' },
  { kind: 'audio', label: 'Audio', icon: 'musical-notes' },
  { kind: 'zip', label: 'ZIP', icon: 'archive' },
  { kind: 'apk', label: 'APK', icon: 'phone-portrait' },
  { kind: 'text', label: 'Text', icon: 'text' },
  { kind: 'url', label: 'Website', icon: 'globe' },
  { kind: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { kind: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { kind: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
  { kind: 'github', label: 'GitHub', icon: 'logo-github' },
  { kind: 'maps', label: 'Maps', icon: 'location' },
  { kind: 'email', label: 'Email', icon: 'mail' },
  { kind: 'phone', label: 'Phone', icon: 'call' },
  { kind: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { kind: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { kind: 'vcard', label: 'Contact', icon: 'person' },
];

const TEMPLATES: { key: any; label: string; gradient: [string, string]; textColor: string }[] = [
  { key: 'minimal', label: 'Minimal', gradient: ['#FFFFFF', '#F8FAFC'], textColor: '#0F172A' },
  { key: 'glass', label: 'Glass', gradient: ['#A78BFA', '#6366F1'], textColor: '#fff' },
  { key: 'neon', label: 'Neon', gradient: ['#06B6D4', '#0EA5E9'], textColor: '#fff' },
  { key: 'corporate', label: 'Corporate', gradient: ['#1E293B', '#0F172A'], textColor: '#fff' },
  { key: 'gold', label: 'Gold', gradient: ['#FCD34D', '#F59E0B'], textColor: '#0F172A' },
  { key: 'dark', label: 'Dark', gradient: ['#1E293B', '#020617'], textColor: '#fff' },
  { key: 'festival', label: 'Festival', gradient: ['#EC4899', '#EF4444'], textColor: '#fff' },
];

const COLOR_OPTIONS = ['#7C3AED', '#6366F1', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#0F172A'];

export const CreateQRScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kind, setKind] = useState<FileKind>('pdf');
  const [template, setTemplate] = useState<typeof TEMPLATES[number]['key']>('glass');
  const [color, setColor] = useState('#7C3AED');
  const [title, setTitle] = useState('My QR Card');
  const [data, setData] = useState('');
  const [password, setPassword] = useState('');
  const [oneTime, setOneTime] = useState(false);
  const [expiresIn, setExpiresIn] = useState<'never' | '1h' | '24h' | '7d'>('never');

  const tpl = TEMPLATES.find(t => t.key === template)!;

  const handleCreate = async () => {
    if (!data.trim()) {
      Alert.alert('Content required', 'Enter the content for this QR code first.');
      return;
    }
    const newCard = addQRCard({
      title: title.trim() || 'Untitled QR',
      kind,
      template,
      data: data.trim(),
      sizeBytes: data.trim().length * 8,
      isFavorite: false,
      encrypted: !!password,
      passwordProtected: !!password,
      oneTimeScan: oneTime,
      expiresAt: expiresIn === '1h' ? Date.now() + 3600_000 :
                 expiresIn === '24h' ? Date.now() + 86_400_000 :
                 expiresIn === '7d' ? Date.now() + 7 * 86_400_000 : undefined,
      qrColor: color,
      bgColor: tpl.gradient[0],
      tags: [],
    });
    let savedCard = newCard;
    if (supabase) {
      try { savedCard = await saveQRCard(newCard); }
      catch (error) {
        Alert.alert('Cloud save failed', error instanceof Error ? error.message : 'The QR could not be saved to Supabase.');
        return;
      }
    }
    Alert.alert('Created', `"${savedCard.title}" is now in your library.`, [
      { text: 'Open', onPress: () => navigation.replace('QRCardDetail', { id: savedCard.id }) },
      { text: 'Done', onPress: () => navigation.goBack(), style: 'cancel' },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            onPress={() => step > 1 ? setStep((step - 1) as any) : navigation.goBack()}
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: 14 }}>
            <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textAlign: 'center' }}>
              STEP {step} OF 3
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 6, gap: 4 }}>
              {[1, 2, 3].map(s => (
                <View
                  key={s}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: s <= step ? theme.colors.primary : theme.colors.border,
                  }}
                />
              ))}
            </View>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Live preview */}
          <FadeIn delay={50}>
            <View style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 22 }}>
              <LinearGradient colors={tpl.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22, alignItems: 'center' }}>
                <Text style={{ color: tpl.textColor, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginBottom: 12, opacity: 0.7 }}>
                  LIVE PREVIEW
                </Text>
                <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 18 }}>
                  <QRCode
                    matrix={generateQRMatrix(data)}
                    size={180}
                    color={color}
                    rounded
                  />
                </View>
                <Text style={{ color: tpl.textColor, fontSize: 16, fontWeight: '800', marginTop: 14 }} numberOfLines={1}>
                  {title || 'Untitled'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <FileIcon kind={kind} size={18} />
                  <Text style={{ color: tpl.textColor, fontSize: 11, fontWeight: '700', marginLeft: 6, opacity: 0.85 }}>
                    {kind.toUpperCase()}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </FadeIn>

          {step === 1 && (
            <FadeIn delay={100}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 }}>
                Choose content type
              </Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '600', marginBottom: 16 }}>
                20+ supported types · pick what you want to convert
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TYPES.map(t => (
                  <Pressable
                    key={t.kind}
                    onPress={() => setKind(t.kind)}
                    style={({ pressed }) => ({
                      width: '23.5%',
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View
                      style={{
                        padding: 10,
                        borderRadius: 16,
                        alignItems: 'center',
                        backgroundColor: kind === t.kind ? theme.colors.primary : theme.colors.surface,
                        borderWidth: 1,
                        borderColor: kind === t.kind ? theme.colors.primary : theme.colors.border,
                      }}
                    >
                      <Ionicons name={t.icon as any} size={20} color={kind === t.kind ? '#fff' : theme.colors.text} />
                      <Text style={{ color: kind === t.kind ? '#fff' : theme.colors.text, fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 0.2 }}>
                        {t.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={{ marginTop: 24 }}>
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800', marginBottom: 8 }}>
                  Content
                </Text>
                <TextInput
                  value={data}
                  onChangeText={setData}
                  placeholder="Paste URL, Wi-Fi credentials, contact, or any text"
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    padding: 14,
                    color: theme.colors.text,
                    fontSize: 14,
                    fontWeight: '500',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              <GradientButton
                title="Continue"
                fullWidth
                icon={<Ionicons name="arrow-forward" size={16} color="#fff" />}
                onPress={() => {
                  if (!data.trim()) {
                    Alert.alert('Content required', 'Enter the content for this QR code first.');
                    return;
                  }
                  setStep(2);
                }}
                style={{ marginTop: 24 }}
              />
            </FadeIn>
          )}

          {step === 2 && (
            <FadeIn delay={100}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 }}>
                Pick a template
              </Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '600', marginBottom: 16 }}>
                Premium designs crafted for every mood
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {TEMPLATES.map(t => (
                  <Pressable
                    key={t.key}
                    onPress={() => setTemplate(t.key)}
                    style={({ pressed }) => ({ width: '47.5%', opacity: pressed ? 0.9 : 1 })}
                  >
                    <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: template === t.key ? 2.5 : 0, borderColor: theme.colors.primary }}>
                      <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14, alignItems: 'center', minHeight: 96, justifyContent: 'center' }}>
                        <Ionicons name={template === t.key ? 'checkmark-circle' : 'sparkles'} size={20} color={t.textColor} />
                        <Text style={{ color: t.textColor, fontSize: 14, fontWeight: '800', marginTop: 6, letterSpacing: -0.2 }}>
                          {t.label}
                        </Text>
                      </LinearGradient>
                    </View>
                  </Pressable>
                ))}
              </View>

              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800', marginTop: 24, marginBottom: 8 }}>
                QR Color
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {COLOR_OPTIONS.map(c => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: c,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: color === c ? 3 : 0,
                        borderColor: theme.colors.text,
                      }}
                    >
                      {color === c && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
                <GradientButton
                  title="Back"
                  variant="glass"
                  onPress={() => setStep(1)}
                  style={{ flex: 1 }}
                />
                <GradientButton
                  title="Continue"
                  onPress={() => setStep(3)}
                  style={{ flex: 2 }}
                  icon={<Ionicons name="arrow-forward" size={16} color="#fff" />}
                />
              </View>
            </FadeIn>
          )}

          {step === 3 && (
            <FadeIn delay={100}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 }}>
                Final touches
              </Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '600', marginBottom: 16 }}>
                Title, security and expiry
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 }}>TITLE</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="My beautiful QR card"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    color: theme.colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 }}>PASSWORD (OPTIONAL)</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Set password to lock QR"
                  placeholderTextColor={theme.colors.textTertiary}
                  secureTextEntry
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    color: theme.colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                />
              </View>

              <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 8, letterSpacing: 0.2 }}>EXPIRES IN</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <Chip label="Never" active={expiresIn === 'never'} onPress={() => setExpiresIn('never')} />
                <Chip label="1 hour" active={expiresIn === '1h'} onPress={() => setExpiresIn('1h')} />
                <Chip label="24 hours" active={expiresIn === '24h'} onPress={() => setExpiresIn('24h')} />
                <Chip label="7 days" active={expiresIn === '7d'} onPress={() => setExpiresIn('7d')} />
              </View>

              <Pressable
                onPress={() => setOneTime(!oneTime)}
                style={({ pressed }) => ({
                  marginTop: 18, padding: 14, borderRadius: 16,
                  backgroundColor: oneTime ? theme.colors.primarySoft : theme.colors.surface,
                  borderWidth: 1, borderColor: oneTime ? theme.colors.primary : theme.colors.border,
                  flexDirection: 'row', alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 22, height: 22, borderRadius: 6,
                    backgroundColor: oneTime ? theme.colors.primary : 'transparent',
                    borderWidth: 2, borderColor: oneTime ? theme.colors.primary : theme.colors.textTertiary,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {oneTime && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800' }}>One-time scan</Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                    Self-destruct after first scan
                  </Text>
                </View>
              </Pressable>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
                <GradientButton title="Back" variant="glass" onPress={() => setStep(2)} style={{ flex: 1 }} />
                <GradientButton title="Create QR" onPress={handleCreate} style={{ flex: 2 }} icon={<Ionicons name="sparkles" size={16} color="#fff" />} />
              </View>
            </FadeIn>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
