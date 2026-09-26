import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeContext';
import { addTranslation } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { addQRCard } from '../store/store';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText } from 'expo-mlkit-ocr';
import { loadTranslations, saveQRCard as persistQRCard, saveTranslation as persistTranslation } from '../services/cloudData';
import { supabase } from '../lib/supabase';

const MODES = [
  { key: 'camera', label: 'Camera', icon: 'camera' },
  { key: 'gallery', label: 'Gallery', icon: 'images' },
  { key: 'live', label: 'Live', icon: 'radio' },
];

const SOURCE_LANGS = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
];

const TARGET_LANGS = SOURCE_LANGS.filter(l => l.code !== 'auto');

export const TranslationScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<typeof MODES[number]['key']>('camera');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [original, setOriginal] = useState('');
  const [translated, setTranslated] = useState('');
  const [editing, setEditing] = useState(false);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    loadTranslations().catch(error => Alert.alert('Translation history sync failed', error instanceof Error ? error.message : 'Unable to load saved translations.'));
  }, []);

  const translateText = async (text: string) => {
    if (text.length > 4500) throw new Error('Please select a shorter passage (up to 4,500 characters).');
    const languagePair = `${sourceLang === 'auto' ? 'autodetect' : sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(languagePair)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Translation service returned ${response.status}.`);
    const payload = await response.json();
    if (payload.responseStatus !== 200 || !payload.responseData?.translatedText) {
      throw new Error(payload.responseDetails || 'The translation service did not return a translation.');
    }
    return String(payload.responseData.translatedText).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  };

  const pickAndDetect = async (useCamera: boolean) => {
    try {
      setWorking(true);
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      const image = result.assets?.[0];
      if (result.canceled || !image) return;
      setImageUri(image.uri);
      const recognized = await recognizeText(image.uri);
      const text = recognized.text.trim();
      if (!text) throw new Error('No readable text was found in this image.');
      setOriginal(text);
      setTranslated(await translateText(text));
      setEditing(false);
    } catch (error) {
      Alert.alert('Picture translation failed', error instanceof Error ? error.message : 'Unable to read or translate this image.');
    } finally { setWorking(false); }
  };

  const handleCapture = () => { void pickAndDetect(mode === 'camera' || mode === 'live'); };

  const handleSaveResult = async () => {
    if (!original.trim() || !translated.trim()) {
      Alert.alert('Nothing to save', 'Enter both the original and translated text first.');
      return;
    }
    const record = {
      sourceLang,
      targetLang,
      originalText: original.trim(),
      translatedText: translated.trim(),
      imageUri,
    };
    try {
      if (supabase) await persistTranslation({ ...record, id: '', detectedAt: Date.now() });
      addTranslation(record);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save translation.');
      return;
    }
    Alert.alert('Saved', 'Translation added to your history.');
  };

  const handleCreateQR = async () => {
    if (!translated.trim()) {
      Alert.alert('Nothing to encode', 'Enter translated text before creating a QR code.');
      return;
    }
    const card = addQRCard({
      title: 'Translation · ' + targetLang.toUpperCase(),
      kind: 'text',
      template: 'glass',
      data: translated,
      sizeBytes: translated.length * 8,
      isFavorite: false,
      encrypted: false,
      passwordProtected: false,
      oneTimeScan: false,
      qrColor: '#7C3AED',
      bgColor: '#F3F0FF',
      tags: ['translation', targetLang],
    });
    try {
      const saved = supabase ? await persistQRCard(card) : card;
      navigation.navigate('QRCardDetail', { id: saved.id });
    } catch (error) { Alert.alert('QR save failed', error instanceof Error ? error.message : 'Unable to save QR.'); }
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
            AI Translate
          </Text>
          <Pressable
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Mode selector */}
          <FadeIn delay={50}>
            <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 18, padding: 4, borderWidth: 1, borderColor: theme.colors.border }}>
              {MODES.map(m => (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={({ pressed }) => ({
                    flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
                    backgroundColor: mode === m.key ? theme.colors.primary : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Ionicons name={m.icon as any} size={18} color={mode === m.key ? '#fff' : theme.colors.text} />
                  <Text style={{ color: mode === m.key ? '#fff' : theme.colors.text, fontSize: 11, fontWeight: '800', marginTop: 3 }}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FadeIn>

          {/* Camera viewport (simulated) */}
          <FadeIn delay={120}>
            <View style={{ marginTop: 18, borderRadius: 24, overflow: 'hidden' }}>
              <LinearGradient colors={['#0F172A', '#1E1B4B']} style={{ height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.error, marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>
                    {mode.toUpperCase()} MODE
                  </Text>
                </View>
                {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" /> : null}
                {working ? <ActivityIndicator size="large" color="#fff" /> : <Ionicons name={mode === 'live' ? 'recording' : 'camera'} size={42} color="rgba(255,255,255,0.7)" />}
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 8, opacity: 0.85 }}>
                  {working ? 'Reading and translating…' : imageUri ? 'Image ready for text translation' : 'Point camera at text'}
                </Text>
              </LinearGradient>
            </View>
          </FadeIn>

          <FadeIn delay={180}>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <GradientButton title={working ? 'Working…' : 'Capture & Detect'} icon={<Ionicons name="scan" size={16} color="#fff" />} onPress={handleCapture} style={{ flex: 1 }} disabled={working} />
              <Pressable
                onPress={() => { void pickAndDetect(false); }}
                style={({ pressed }) => ({
                  paddingHorizontal: 18, borderRadius: 26,
                  backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="images-outline" size={20} color={theme.colors.text} />
              </Pressable>
            </View>
          </FadeIn>

          {/* Language selectors */}
          <FadeIn delay={220}>
            <View style={{ marginTop: 22 }}>
              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>
                Source Language
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {SOURCE_LANGS.map(l => (
                  <Chip
                    key={l.code}
                    label={l.label}
                    active={sourceLang === l.code}
                    onPress={() => setSourceLang(l.code)}
                  />
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 10 }}>
                <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800', flex: 1 }}>
                  Target Language
                </Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700' }}>
                  {TARGET_LANGS.length} languages
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {TARGET_LANGS.map(l => (
                  <Chip
                    key={l.code}
                    label={l.label}
                    active={targetLang === l.code}
                    onPress={() => setTargetLang(l.code)}
                  />
                ))}
              </ScrollView>
            </View>
          </FadeIn>

          {/* Side-by-side translation */}
          <FadeIn delay={280}>
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
                  Translation Result
                </Text>
                <Pressable
                  onPress={() => setEditing(!editing)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
                    backgroundColor: theme.colors.primarySoft, opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '800' }}>
                    {editing ? 'DONE' : 'EDIT'}
                  </Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Original */}
                <View style={{ flex: 1 }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.surface, alignSelf: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>
                      ORIGINAL · {sourceLang.toUpperCase()}
                    </Text>
                  </View>
                  <TextInput
                    value={original}
                    onChangeText={setOriginal}
                    editable={editing}
                    multiline
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderRadius: 16,
                      padding: 14,
                      color: theme.colors.text,
                      fontSize: 13,
                      fontWeight: '500',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      minHeight: 140,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* Arrow */}
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 18 }}>
                  <View
                    style={{
                      width: 32, height: 32, borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient colors={theme.colors.brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </LinearGradient>
                  </View>
                </View>

                {/* Translated */}
                <View style={{ flex: 1 }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.primary, alignSelf: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>
                      TRANSLATED · {targetLang.toUpperCase()}
                    </Text>
                  </View>
                  <TextInput
                    value={translated}
                    onChangeText={setTranslated}
                    editable={editing}
                    multiline
                    style={{
                      backgroundColor: theme.colors.primarySoft,
                      borderRadius: 16,
                      padding: 14,
                      color: theme.colors.text,
                      fontSize: 13,
                      fontWeight: '600',
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      minHeight: 140,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={340}>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
              <GradientButton
                title="Save Result"
                variant="glass"
                icon={<Ionicons name="bookmark-outline" size={16} color={theme.colors.text} />}
                onPress={handleSaveResult}
                style={{ flex: 1 }}
              />
              <GradientButton
                title="Make QR"
                icon={<Ionicons name="qr-code" size={16} color="#fff" />}
                onPress={handleCreateQR}
                style={{ flex: 1 }}
              />
            </View>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
