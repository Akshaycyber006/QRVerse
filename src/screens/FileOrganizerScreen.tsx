import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, Alert, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { FileIcon } from '../components/FileIcon';
import { Chip } from '../components/Chip';
import { FadeIn } from '../components/AnimatedNumber';
import { formatBytes } from '../utils/helpers';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../auth/AuthProvider';
import { addUploadedFile, replaceFiles } from '../store/store';
import { listUploadedFiles, uploadPickedFile } from '../services/fileUploads';
import { supabase } from '../lib/supabase';
import { createAndPersistQRCard } from '../services/cloudData';

const BUCKETS: Array<{ key: string; label: string; icon: string; kinds: string[]; color: string }> = [
  { key: 'documents', label: 'Documents', icon: 'document-text', kinds: ['pdf', 'docx', 'ppt', 'xls', 'text'], color: '#3B82F6' },
  { key: 'media', label: 'Media', icon: 'images', kinds: ['image', 'video', 'audio'], color: '#EC4899' },
  { key: 'archives', label: 'Archives', icon: 'archive', kinds: ['zip', 'apk'], color: '#10B981' },
  { key: 'duplicates', label: 'Duplicates', icon: 'copy', kinds: ['duplicate'], color: '#F59E0B' },
  { key: 'large', label: 'Large Files', icon: 'cloud-download', kinds: ['large'], color: '#EF4444' },
  { key: 'hidden', label: 'Hidden', icon: 'eye-off', kinds: ['hidden'], color: '#64748B' },
];

export const FileOrganizerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const files = useStore(s => s.files);
  const [bucket, setBucket] = useState('documents');
  const [uploading, setUploading] = useState(false);
  const { configured, session } = useAuth();

  useEffect(() => {
    if (!configured || !session) return;
    listUploadedFiles()
      .then(replaceFiles)
      .catch(error => Alert.alert('Could not load files', error instanceof Error ? error.message : 'Please try again.'));
  }, [configured, session?.user.id]);

  const handleUploadFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      setUploading(true);
      const outcomes = await Promise.allSettled(result.assets.map(uploadPickedFile));
      const uploaded = outcomes.filter((outcome): outcome is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadPickedFile>>> => outcome.status === 'fulfilled');
      uploaded.forEach(outcome => addUploadedFile(outcome.value));
      const failures = outcomes.filter(outcome => outcome.status === 'rejected');
      if (failures.length) {
        const reason = failures[0].status === 'rejected' ? failures[0].reason : undefined;
        Alert.alert('Upload finished with errors', `${uploaded.length} uploaded, ${failures.length} failed. ${reason instanceof Error ? reason.message : ''}`.trim());
      } else {
        Alert.alert('Upload complete', `${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded securely.`);
      }
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not open the file picker.');
    } finally {
      setUploading(false);
    }
  };

  const handleMakeFileQR = async (file: typeof files[number]) => {
    if (!supabase) return;
    const { data, error } = await supabase.storage.from('user-files').createSignedUrl(file.path, 60 * 60);
    if (error) {
      Alert.alert('Could not create file link', error.message);
      return;
    }
    try {
    const card = await createAndPersistQRCard({
      title: file.name,
      kind: file.kind,
      template: 'glass',
      data: data.signedUrl,
      sizeBytes: file.sizeBytes,
      isFavorite: false,
      encrypted: false,
      passwordProtected: false,
      oneTimeScan: false,
      expiresAt: Date.now() + 60 * 60 * 1000,
      qrColor: '#7C3AED',
      bgColor: '#F3F0FF',
      tags: ['file'],
    });
    navigation.navigate('QRCardDetail', { id: card.id });
    } catch (error) { Alert.alert('QR save failed', error instanceof Error ? error.message : 'Unable to save QR.'); }
  };

  const handleShareFile = async (file: typeof files[number]) => {
    if (!supabase) return;
    const { data, error } = await supabase.storage.from('user-files').createSignedUrl(file.path, 60 * 60);
    if (error) {
      Alert.alert('Could not share file', error.message);
      return;
    }
    await Share.share({ title: file.name, message: `${file.name}\n${data.signedUrl}` });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    BUCKETS.forEach(b => {
      if (b.key === 'duplicates') c[b.key] = files.filter(f => f.isDuplicate).length;
      else if (b.key === 'large') c[b.key] = files.filter(f => f.isLarge).length;
      else if (b.key === 'hidden') c[b.key] = files.filter(f => f.hidden).length;
      else c[b.key] = files.filter(f => b.kinds.includes(f.kind)).length;
    });
    return c;
  }, [files]);

  const filtered = useMemo(() => {
    const b = BUCKETS.find(x => x.key === bucket)!;
    if (bucket === 'duplicates') return files.filter(f => f.isDuplicate);
    if (bucket === 'large') return files.filter(f => f.isLarge);
    if (bucket === 'hidden') return files.filter(f => f.hidden);
    return files.filter(f => b.kinds.includes(f.kind));
  }, [files, bucket]);

  const totalSize = filtered.reduce((s, f) => s + f.sizeBytes, 0);

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
            File Organizer
          </Text>
          <Pressable
            disabled={uploading}
            onPress={handleUploadFiles}
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {uploading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.text} />}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
          {/* Smart insights */}
          <FadeIn delay={50}>
            <View style={{ borderRadius: 22, overflow: 'hidden' }}>
              <LinearGradient colors={['#3B82F6', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  </View>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.4 }}>SMART INSIGHTS</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>
                  {files.length ? `${files.length} files in your cloud library` : 'Your cloud library is ready'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500', marginTop: 4 }}>
                  Choose files to upload to your private storage
                </Text>
                <Pressable
                  onPress={handleUploadFiles}
                  style={({ pressed }) => ({
                    marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'flex-start',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Upload files</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </FadeIn>

          {/* Bucket cards */}
          <FadeIn delay={120}>
            <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginTop: 22, marginBottom: 12 }}>
              Categories
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {BUCKETS.map(b => {
                const isActive = bucket === b.key;
                return (
                  <Pressable
                    key={b.key}
                    onPress={() => setBucket(b.key)}
                    style={({ pressed }) => ({
                      width: '48.5%',
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <View
                      style={{
                        padding: 14, borderRadius: 18,
                        backgroundColor: isActive ? b.color : theme.colors.surface,
                        borderWidth: 1, borderColor: isActive ? b.color : theme.colors.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Ionicons name={b.icon as any} size={20} color={isActive ? '#fff' : b.color} />
                        <Text style={{ color: isActive ? '#fff' : b.color, fontSize: 22, fontWeight: '800' }}>
                          {counts[b.key]}
                        </Text>
                      </View>
                      <Text style={{ color: isActive ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '800', marginTop: 10, letterSpacing: -0.2 }}>
                        {b.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </FadeIn>

          {/* Files */}
          <FadeIn delay={180}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>
                {BUCKETS.find(b => b.key === bucket)?.label} ({filtered.length})
              </Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700' }}>
                {formatBytes(totalSize)}
              </Text>
            </View>

            <GlassCard radius={20} noPadding>
              {filtered.length === 0 ? (
                <View style={{ alignItems: 'center', padding: 30 }}>
                  <Ionicons name="folder-open-outline" size={36} color={theme.colors.textTertiary} />
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 12, marginTop: 8, fontWeight: '600' }}>
                    Nothing here
                  </Text>
                </View>
              ) : (
                filtered.map((f, idx) => (
                  <View
                    key={f.id}
                    style={{
                      paddingVertical: 12, paddingHorizontal: 16,
                      flexDirection: 'row', alignItems: 'center',
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: theme.colors.borderSubtle,
                    }}
                  >
                    <FileIcon kind={f.kind} size={36} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                          {f.name}
                        </Text>
                        {f.isDuplicate && (
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.colors.warning + '20', marginLeft: 6 }}>
                            <Text style={{ color: theme.colors.warning, fontSize: 9, fontWeight: '800' }}>DUPLICATE</Text>
                          </View>
                        )}
                        {f.isLarge && (
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.colors.error + '20', marginLeft: 6 }}>
                            <Text style={{ color: theme.colors.error, fontSize: 9, fontWeight: '800' }}>LARGE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                        {formatBytes(f.sizeBytes)} · {f.path}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <Pressable
                        onPress={() => handleMakeFileQR(f).catch(error => Alert.alert('Could not create QR', error instanceof Error ? error.message : 'Please try again.'))}
                        style={({ pressed }) => ({
                          width: 32, height: 32, borderRadius: 10,
                          backgroundColor: theme.colors.surface,
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 6,
                          borderWidth: 1, borderColor: theme.colors.border,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Ionicons name="qr-code" size={14} color={theme.colors.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleShareFile(f).catch(error => Alert.alert('Could not share file', error instanceof Error ? error.message : 'Please try again.'))}
                        style={({ pressed }) => ({
                          width: 32, height: 32, borderRadius: 10,
                          backgroundColor: theme.colors.surface,
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: 1, borderColor: theme.colors.border,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Ionicons name="share-outline" size={14} color={theme.colors.text} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </GlassCard>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
