import React, { useState, useMemo } from 'react';
import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeContext';
import { useStore, addLink, deleteLink, toggleFavoriteLink } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { formatDate } from '../utils/helpers';
import { loadSavedLinks, removeLink, saveLink as saveCloudLink, updateLinkFavorite } from '../services/cloudData';
import { supabase } from '../lib/supabase';
import { createAndPersistQRCard } from '../services/cloudData';

const CATEGORIES: Array<{ key: any; label: string; icon: string; color: string }> = [
  { key: 'all', label: 'All', icon: 'apps', color: '#8B5CF6' },
  { key: 'github', label: 'GitHub', icon: 'logo-github', color: '#24292E' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { key: 'gdrive', label: 'Drive', icon: 'logo-google', color: '#34A853' },
  { key: 'shopping', label: 'Shop', icon: 'cart', color: '#F59E0B' },
  { key: 'college', label: 'Study', icon: 'school', color: '#3B82F6' },
  { key: 'article', label: 'Articles', icon: 'newspaper', color: '#10B981' },
  { key: 'other', label: 'Other', icon: 'link', color: '#64748B' },
];

export const LinkVaultScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const links = useStore(s => s.savedLinks);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [addLinkVisible, setAddLinkVisible] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [categoryOverride, setCategoryOverride] = useState('');
  useEffect(() => {
    if (!supabase) return;
    loadSavedLinks().catch(error => Alert.alert('Link sync failed', error instanceof Error ? error.message : 'Unable to load saved links.'));
  }, []);

  const filtered = useMemo(() => {
    let list = links;
    if (category !== 'all') list = list.filter(l => l.category === category);
    if (showFavOnly) list = list.filter(l => l.isFavorite);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.tags.some(tag => tag.toLowerCase().includes(q)));
    }
    return list;
  }, [links, category, search, showFavOnly]);

  const openAddLink = () => {
    setAddLinkVisible(true);
  };

  const saveLink = async () => {
    const raw = newUrl.trim();
    let parsed: URL;
    try {
      parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Unsupported protocol');
    } catch {
      Alert.alert('Invalid link', 'Enter a valid website address, such as example.com.');
      return;
    }
    const host = parsed.hostname.replace(/^www\./, '');
    const detectedCategory: 'github' | 'youtube' | 'instagram' | 'linkedin' | 'gdrive' | 'other' =
      host.includes('github.com') ? 'github' :
      host.includes('youtube.com') || host.includes('youtu.be') ? 'youtube' :
      host.includes('instagram.com') ? 'instagram' :
      host.includes('linkedin.com') ? 'linkedin' :
      host.includes('drive.google.com') ? 'gdrive' : 'other';
    let title = host;
    let description: string | undefined;
    let favicon = 'link';
    let previewImage: string | undefined;
    try {
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(parsed.toString())}&meta.title=true&meta.description=true&meta.logo=true&meta.image=true`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const preview = await response.json();
        title = preview.data?.title || title;
        description = preview.data?.description || undefined;
        favicon = preview.data?.logo?.url || favicon;
        previewImage = preview.data?.image?.url || undefined;
      }
    } catch { /* The link remains usable when preview lookup is unavailable. */ }
    const category = categoryOverride || detectedCategory;
    const item = addLink({ url: parsed.toString(), title, description, previewImage, category: category as typeof detectedCategory | 'shopping' | 'college' | 'article', favicon, tags: [], isFavorite: false });
    if (supabase) {
      try { await saveCloudLink(item); }
      catch (error) {
        deleteLink(item.id);
        Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save this link.');
        return;
      }
    }
    setNewUrl('');
    setCategoryOverride('');
    setAddLinkVisible(false);
  };


  const handleFavorite = async (id: string) => {
    const link = links.find(item => item.id === id);
    if (!link) return;
    try { if (supabase) await updateLinkFavorite(id, !link.isFavorite); toggleFavoriteLink(id); }
    catch (error) { Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to update this link.'); }
  };

  const handleDeleteLink = async (id: string) => {
    try { if (supabase) await removeLink(id); deleteLink(id); }
    catch (error) { Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unable to delete this link.'); }
  };

  const handleMakeQR = async (linkId: string) => {
    const link = links.find(l => l.id === linkId);
    if (!link) return;
    try {
    const card = await createAndPersistQRCard({
      title: link.title,
      kind: 'url',
      template: 'glass',
      data: link.url,
      sizeBytes: 0,
      isFavorite: link.isFavorite,
      encrypted: false,
      passwordProtected: false,
      oneTimeScan: false,
      qrColor: '#7C3AED',
      bgColor: '#F3F0FF',
      tags: link.tags,
    });
    navigation.navigate('QRCardDetail', { id: card.id });
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
            Link Vault
          </Text>
          <Pressable
            onPress={openAddLink}
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14, overflow: 'hidden',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <LinearGradient colors={theme.colors.brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={22} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
              borderWidth: 1, borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
            <TextInput
              placeholder="Search links, tags, titlesâ€¦"
              placeholderTextColor={theme.colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '500', marginLeft: 10 }}
            />
            <Pressable onPress={() => setShowFavOnly(!showFavOnly)}>
              <Ionicons
                name={showFavOnly ? 'heart' : 'heart-outline'}
                size={18}
                color={showFavOnly ? theme.colors.accent : theme.colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          {CATEGORIES.map(c => (
            <View key={c.key} style={{ marginRight: 8 }}>
              <Pressable
                onPress={() => setCategory(c.key)}
                style={({ pressed }) => ({
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: category === c.key ? c.color : theme.colors.surface,
                  borderWidth: 1, borderColor: category === c.key ? c.color : theme.colors.border,
                  flexDirection: 'row', alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name={c.icon as any} size={13} color={category === c.key ? '#fff' : c.color} />
                <Text style={{ color: category === c.key ? '#fff' : theme.colors.text, fontSize: 11, fontWeight: '800', marginLeft: 6 }}>
                  {c.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <FadeIn delay={50}>
            {filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="bookmark-outline" size={48} color={theme.colors.textTertiary} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 10 }}>
                  No links in this view
                </Text>
              </View>
            )}
            {filtered.map(l => (
              <Pressable
                key={l.id}
                onPress={() => handleMakeQR(l.id)}
                style={({ pressed }) => ({ marginBottom: 10, opacity: pressed ? 0.9 : 1 })}
              >
                <GlassCard radius={18} noPadding>
                  <View style={{ padding: 14 }}>
                    {l.previewImage ? <Image source={{ uri: l.previewImage }} style={{ width: '100%', height: 124, borderRadius: 14, marginBottom: 12, backgroundColor: theme.colors.surface }} resizeMode="cover" /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 46, height: 46, borderRadius: 13,
                          backgroundColor: theme.colors.primarySoft,
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {l.favicon.startsWith('http') ? <Image source={{ uri: l.favicon }} style={{ width: 26, height: 26 }} resizeMode="contain" /> : <Text style={{ fontSize: 22 }}>{l.favicon}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800', flex: 1 }} numberOfLines={1}>
                            {l.title}
                          </Text>
                            <Pressable onPress={event => { event.stopPropagation(); void handleFavorite(l.id); }} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 4 })}>
                            <Ionicons name={l.isFavorite ? 'heart' : 'heart-outline'} size={16} color={l.isFavorite ? theme.colors.accent : theme.colors.textTertiary} />
                          </Pressable>
                        </View>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '500', marginTop: 2 }} numberOfLines={1}>
                          {l.url}
                        </Text>
                      </View>
                    </View>
                    {l.description && (
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 10 }} numberOfLines={2}>
                        {l.description}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.borderSubtle }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {l.tags.slice(0, 3).map(tag => (
                          <View key={tag} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: theme.colors.primarySoft, marginRight: 6 }}>
                            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '800' }}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '600' }}>
                          {formatDate(l.savedAt)} Â· {l.clicks} clicks
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <Pressable
                        onPress={event => { event.stopPropagation(); void handleMakeQR(l.id); }}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 8, borderRadius: 999,
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.primarySoft,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Ionicons name="qr-code" size={14} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Make QR</Text>
                      </Pressable>
                      <Pressable
                        onPress={async event => {
                          event.stopPropagation();
                          try {
                            await Clipboard.setStringAsync(l.url);
                            Alert.alert('Copied', `${l.url} copied to clipboard.`);
                          } catch {
                            Alert.alert('Copy failed', 'Unable to access the clipboard.');
                          }
                        }}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 8, borderRadius: 999,
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1, borderColor: theme.colors.border,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Ionicons name="copy-outline" size={14} color={theme.colors.text} />
                        <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800', marginLeft: 6 }}>Copy</Text>
                      </Pressable>
                      <Pressable
                        onPress={event => { event.stopPropagation(); void handleDeleteLink(l.id); }}
                        style={({ pressed }) => ({
                          paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1, borderColor: theme.colors.border,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Ionicons name="trash-outline" size={14} color={theme.colors.error} />
                      </Pressable>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </FadeIn>
        </ScrollView>
        <Modal visible={addLinkVisible} transparent animationType="fade" onRequestClose={() => setAddLinkVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.55)" }}>
            <View style={{ padding: 20, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "800" }}>Save a link</Text>
              <TextInput value={newUrl} onChangeText={setNewUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="example.com or https://example.com" placeholderTextColor={theme.colors.textTertiary} returnKeyType="done" onSubmitEditing={saveLink} style={{ marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, fontSize: 14 }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.filter(item => item.key !== 'all').map(item => <Pressable key={item.key} onPress={() => setCategoryOverride(item.key)} style={{ borderRadius: 999, borderWidth: 1, borderColor: categoryOverride === item.key ? item.color : theme.colors.border, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: categoryOverride === item.key ? item.color : theme.colors.background }}><Text style={{ color: categoryOverride === item.key ? '#fff' : theme.colors.text, fontSize: 10, fontWeight: '800' }}>{item.label}</Text></Pressable>)}
              </ScrollView>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <Pressable onPress={() => { setNewUrl(""); setAddLinkVisible(false); }} style={{ flex: 1, padding: 12, borderRadius: 14, alignItems: "center", backgroundColor: theme.colors.background }}><Text style={{ color: theme.colors.text, fontWeight: "700" }}>Cancel</Text></Pressable>
                <Pressable onPress={saveLink} style={{ flex: 1, padding: 12, borderRadius: 14, alignItems: "center", backgroundColor: theme.colors.primary }}><Text style={{ color: "#fff", fontWeight: "800" }}>Save link</Text></Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

