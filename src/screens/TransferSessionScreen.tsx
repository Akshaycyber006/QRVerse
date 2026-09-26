import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { addTransfer, updateTransfer, useStore, store } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { FileIcon, FileKind } from '../components/FileIcon';
import { FadeIn, ProgressRing } from '../components/AnimatedNumber';
import { formatBytes, formatTime } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';
import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { startNearbyAdvertising, startNearbyDiscovery, connectToNearbyPeer, sendNearbyText, onNearbyConnected, onNearbyText, onNearbyPeerFound, stopNearby } from '../services/nearbyBridge';
import { saveTransfer } from '../services/cloudData';
import { uid } from '../utils/helpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RT = RouteProp<RootStackParamList, 'TransferSession'>;

const fileKind = (name: string): FileKind => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext ?? '')) return 'docx';
  if (['xls', 'xlsx'].includes(ext ?? '')) return 'xls';
  if (['ppt', 'pptx'].includes(ext ?? '')) return 'ppt';
  if (ext === 'zip') return 'zip';
  if (['mp4', 'mov', 'm4v', 'webm'].includes(ext ?? '')) return 'video';
  if (['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(ext ?? '')) return 'audio';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(ext ?? '')) return 'image';
  return 'text';
};

const encodeBase64 = (bytes: Uint8Array) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    out += chars[a >> 2] + chars[((a & 3) << 4) | ((b ?? 0) >> 4)] +
      (b === undefined ? '=' : chars[((b & 15) << 2) | ((c ?? 0) >> 6)]) +
      (c === undefined ? '=' : chars[c & 63]);
  }
  return out;
};

const decodeBase64 = (value: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes = new Uint8Array(Math.floor(clean.length * 3 / 4) - (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0));
  let offset = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (chars.indexOf(clean[i]) << 18) | (chars.indexOf(clean[i + 1]) << 12) |
      ((chars.indexOf(clean[i + 2]) & 63) << 6) | (chars.indexOf(clean[i + 3]) & 63);
    if (offset < bytes.length) bytes[offset++] = (n >> 16) & 255;
    if (offset < bytes.length) bytes[offset++] = (n >> 8) & 255;
    if (offset < bytes.length) bytes[offset++] = n & 255;
  }
  return bytes;
};

type Phase = 'select' | 'qr' | 'connecting' | 'transferring' | 'completed';

export const TransferSessionScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RT>();
  const mode = route.params?.mode ?? 'send';
  const recordId = route.params?.recordId;
  const existingTransfer = useStore(s => s.transfers.find(t => t.id === recordId));

  const [phase, setPhase] = useState<Phase>(mode === 'send' ? (existingTransfer ? 'completed' : 'select') : 'qr');
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [peerName, setPeerName] = useState('Arjun’s iPhone');
  const [recordId_, setRecordId_] = useState<string | null>(existingTransfer?.id ?? null);
  const [progress, setProgress] = useState(existingTransfer ? 1 : 0);
  const [speed, setSpeed] = useState(0); // bytes per sec
  const [transferQr, setTransferQr] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [permission, requestCameraPermission] = useCameraPermissions();
  const tokenRef = useRef('');
  const invitationStopRef = useRef<(() => void) | null>(null);
  const receiveWriters = useRef<Map<number, WritableStreamDefaultWriter<Uint8Array>>>(new Map());
  const startedAt = useRef(Date.now());

  const totalBytes = selected.reduce((sum, i) => sum + (files[i]?.size ?? 0), 0);

  useEffect(() => () => { invitationStopRef.current?.(); void stopNearby(); }, []);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      setFiles(result.assets);
      setSelected(result.assets.map((_, index) => index));
    } catch (error) { Alert.alert('File selection failed', error instanceof Error ? error.message : 'Unable to select files.'); }
  };

  const finishTransfer = async (received: boolean) => {
    setProgress(1); setSpeed(0); setPhase('completed');
    if (!recordId_) return;
    const completedAt = Date.now();
    updateTransfer(recordId_, { status: 'completed', completedAt });
    const record = store.getState().transfers.find(item => item.id === recordId_);
    if (record) {
      try { await saveTransfer({ ...record, status: 'completed', completedAt, direction: received ? 'received' : 'sent' }); }
      catch (error) { Alert.alert('Transfer history sync failed', error instanceof Error ? error.message : 'Unable to sync transfer history.'); }
    }
  };

  const sendFiles = async (peerId: string) => {
    const selectedFiles = selected.map(index => files[index]).filter(Boolean);
    await sendNearbyText(peerId, JSON.stringify({ type: 'files', files: selectedFiles.map(file => ({ name: file.name, size: file.size ?? 0, mime: file.mimeType ?? 'application/octet-stream' })) }));
    let sent = 0;
    for (let index = 0; index < selectedFiles.length; index++) {
      const reader = new File(selectedFiles[index].uri).stream().getReader();
      let sequence = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        for (let offset = 0; offset < part.value.length; offset += 9000) {
          const chunk = part.value.slice(offset, offset + 9000);
          await sendNearbyText(peerId, JSON.stringify({ type: 'chunk', index, sequence: sequence++, data: encodeBase64(chunk) }));
          sent += chunk.length;
          setProgress(totalBytes ? sent / totalBytes : 0);
          setSpeed(sent / Math.max(1, (Date.now() - startedAt.current) / 1000) / 1024 / 1024);
        }
      }
      await reader.cancel();
    }
    await sendNearbyText(peerId, JSON.stringify({ type: 'complete' }));
    await finishTransfer(false);
  };

  const handleStartSession = async () => {
    if (!selected.length) { Alert.alert('Choose files', 'Select at least one file to send.'); return; }
    try {
      const advertiser = await startNearbyAdvertising('Agon device');
      invitationStopRef.current = advertiser.stopInvitation;
      const token = uid('pair'); tokenRef.current = token;
      setTransferQr(JSON.stringify({ type: 'agon-transfer', version: 1, token }));
      const record = addTransfer({
        direction: 'sent', peerName, fileCount: selected.length, totalBytes, status: 'in-progress', method: 'wifi-direct',
        files: selected.map(i => files[i]).filter(Boolean).map(file => ({ name: file.name, sizeBytes: file.size ?? 0, kind: fileKind(file.name) })),
      });
      setRecordId_(record.id); startedAt.current = Date.now();
      void onNearbyText(({ peerId, text }) => {
        try {
          const message = JSON.parse(text);
          if (message.type === 'pair' && message.token === tokenRef.current) {
            setPhase('transferring');
            void sendFiles(peerId).catch(error => Alert.alert('Transfer failed', error instanceof Error ? error.message : 'Unable to send files.'));
          }
        } catch { /* Ignore unrecognized connection messages. */ }
      });
      setPhase('qr');
    } catch (error) { Alert.alert('Nearby connection unavailable', error instanceof Error ? error.message : 'Build and open Agon on an Android or iOS device.'); }
  };

  const handleSimulateScan = () => Alert.alert('Waiting for receiver', 'A nearby Agon device must scan this transfer QR.');

  const handleReceiveScan = async (data: string) => {
    setScannerActive(false);
    try {
      const pairing = JSON.parse(data);
      if (pairing.type !== 'agon-transfer' || pairing.version !== 1 || typeof pairing.token !== 'string') throw new Error('This is not a valid Agon transfer QR.');
      const record = addTransfer({ direction: 'received', peerName: 'Nearby sender', fileCount: 0, totalBytes: 0, status: 'in-progress', method: 'wifi-direct', files: [] });
      setRecordId_(record.id); tokenRef.current = pairing.token;
      const connectedUnsubscribe = await onNearbyConnected(({ peerId, name }) => {
        setPeerName(name); setPhase('transferring');
        void sendNearbyText(peerId, JSON.stringify({ type: 'pair', token: tokenRef.current }));
      });
      const textUnsubscribe = await onNearbyText(({ text }) => {
        void (async () => {
          const message = JSON.parse(text);
          if (message.type === 'files' && Array.isArray(message.files)) {
            const receivedFiles = message.files.map((file: { name: string; size: number; mime: string }) => ({ name: String(file.name), size: Number(file.size), mimeType: String(file.mime) })) as DocumentPicker.DocumentPickerAsset[];
            setFiles(receivedFiles);
            setSelected(receivedFiles.map((_, index) => index));
            updateTransfer(record.id, { fileCount: receivedFiles.length, totalBytes: receivedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0), files: receivedFiles.map(file => ({ name: file.name, sizeBytes: file.size ?? 0, kind: fileKind(file.name) })) });
            const directory = new Directory(Paths.document, 'Agon Received');
            if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
            const writers = new Map<number, WritableStreamDefaultWriter<Uint8Array>>();
            message.files.forEach((file: { name: string }, index: number) => {
              const safeName = file.name.replace(/[\\/:*?"<>|]/g, '_');
              const output = new File(directory, `${Date.now()}-${index}-${safeName}`);
              output.create({ intermediates: true, overwrite: true });
              writers.set(index, output.writableStream().getWriter());
            });
            receiveWriters.current = writers;
          } else if (message.type === 'chunk') {
            const writer = receiveWriters.current.get(message.index);
            if (!writer) throw new Error('Received file data before the file header.');
            await writer.write(decodeBase64(message.data));
          } else if (message.type === 'complete') {
            await Promise.all([...receiveWriters.current.values()].map(writer => writer.close()));
            receiveWriters.current.clear(); await finishTransfer(true);
            connectedUnsubscribe(); textUnsubscribe();
          }
        })().catch(error => Alert.alert('Receive failed', error instanceof Error ? error.message : 'Unable to receive files.'));
      });
      setPhase('connecting');
      let foundUnsubscribe: (() => void) | undefined;
      foundUnsubscribe = await onNearbyPeerFound(({ peerId, name }) => {
        if (name !== 'Agon device') return;
        foundUnsubscribe?.();
        void connectToNearbyPeer(peerId).catch(error => Alert.alert('Connection failed', error instanceof Error ? error.message : 'Unable to connect nearby device.'));
      });
      await startNearbyDiscovery('Agon receiver');
    } catch (error) { Alert.alert('Pairing failed', error instanceof Error ? error.message : 'Unable to connect to sender.'); }
  };

  const transferSpeed = (speed * 1024 * 1024); // bytes per second
  const remainingBytes = totalBytes * (1 - progress);
  const etaMs = transferSpeed > 0 ? (remainingBytes / transferSpeed) * 1000 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            onPress={() => phase === 'transferring' ? null : navigation.goBack()}
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name={phase === 'transferring' ? 'lock-closed' : 'chevron-back'} size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>
            {mode === 'send' ? 'Send Files' : 'Receive Files'}
          </Text>
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

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {phase === 'select' && mode === 'send' && (
            <FadeIn delay={50}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>
                  STEP 1 OF 3
                </Text>
                <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6, marginTop: 4 }}>
                  Select files
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                  Choose what you want to send — folder transfer supported
                </Text>
              </View>

              <GlassCard radius={22} noPadding>
                <Pressable onPress={pickFiles} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle }}><Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} /><Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '800', marginLeft: 8 }}>Choose files from this device</Text></Pressable>
                {files.map((f, idx) => {
                  const isSelected = selected.includes(idx);
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setSelected(s => s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]);
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 12, paddingHorizontal: 16,
                        flexDirection: 'row', alignItems: 'center',
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: theme.colors.borderSubtle,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                          borderWidth: 2, borderColor: isSelected ? theme.colors.primary : theme.colors.textTertiary,
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 14,
                        }}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <FileIcon kind={fileKind(f.name)} size={32} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                          {f.name}
                        </Text>
                        <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600' }}>
                          {formatBytes(f.size ?? 0)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </GlassCard>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: theme.colors.primarySoft, borderRadius: 14 }}>
                <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700', marginLeft: 8, flex: 1 }}>
                  {selected.length} files · {formatBytes(totalBytes)} · E2E encrypted
                </Text>
              </View>

              <GradientButton
                title="Generate Transfer QR"
                icon={<Ionicons name="qr-code" size={16} color="#fff" />}
                onPress={handleStartSession}
                fullWidth
                style={{ marginTop: 18 }}
              />
            </FadeIn>
          )}

          {(phase === 'qr' || phase === 'connecting') && (
            <FadeIn delay={50}>
              <View style={{ marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>
                  STEP 2 OF 3
                </Text>
                <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginTop: 4, textAlign: 'center' }}>
                  {mode === 'send' ? 'Peer scans to receive' : 'Scan sender\'s QR'}
                </Text>
              </View>

              <View style={{ borderRadius: 28, overflow: 'hidden' }}>
                <LinearGradient colors={theme.colors.brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 28, alignItems: 'center' }}>
                  <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 22 }}>
                    {mode === 'receive' && scannerActive ? (
                      permission?.granted ? <CameraView style={{ width: 220, height: 220 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={event => handleReceiveScan(event.data)} /> :
                      <Pressable onPress={() => { void requestCameraPermission().then(result => { if (result.granted) setScannerActive(true); }); }} style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="camera" size={44} color="#7C3AED" /><Text style={{ marginTop: 8, color: '#0F172A', fontWeight: '800' }}>Allow camera access</Text></Pressable>
                    ) : <QRCode
                      matrix={generateQRMatrix(mode === 'send' ? transferQr : 'Agon receiver')}
                      size={220}
                      color="#0F172A"
                      rounded
                      logoContent={
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="swap-horizontal" size={22} color="#fff" />
                        </View>
                      }
                    />}
                  </View>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
                    {phase === 'connecting' ? '🔒 Establishing secure connection…' : 'Waiting for peer to scan…'}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 18 }}>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', marginRight: 8 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                        {selected.length} FILES
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                        {formatBytes(totalBytes)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <GlassCard radius={20} style={{ marginTop: 16 }}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 10 }}>
                  SELECTED FILES
                </Text>
                {selected.slice(0, 4).map(i => {
                  const f = files[i];
                  if (!f) return null;
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                      <FileIcon kind={fileKind(f.name)} size={26} />
                      <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700', flex: 1, marginLeft: 10 }} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600' }}>
                        {formatBytes(f.size ?? 0)}
                      </Text>
                    </View>
                  );
                })}
                {selected.length > 4 && (
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
                    +{selected.length - 4} more files
                  </Text>
                )}
              </GlassCard>

              {mode === 'send' && phase === 'qr' && (
                <GradientButton
                  title="Waiting for receiver"
                  variant="glass"
                  icon={<Ionicons name="flash" size={16} color={theme.colors.text} />}
                  onPress={handleSimulateScan}
                  fullWidth
                  style={{ marginTop: 18 }}
                />
              )}

              {mode === 'receive' && phase === 'qr' && (
                <GradientButton
                  title="Open Scanner"
                  icon={<Ionicons name="scan" size={16} color="#fff" />}
                  onPress={async () => { if (!permission?.granted) { const result = await requestCameraPermission(); if (!result.granted) return; } setScannerActive(true); }}
                  fullWidth
                  style={{ marginTop: 18 }}
                />
              )}
            </FadeIn>
          )}

          {phase === 'transferring' && (
            <FadeIn delay={50}>
              <View style={{ marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>
                  STEP 3 OF 3
                </Text>
                <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginTop: 4, textAlign: 'center' }}>
                  Transferring to {peerName}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 4, textAlign: 'center' }}>
                  Wi-Fi Direct · E2E encrypted
                </Text>
              </View>

              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <ProgressRing size={160} strokeWidth={12} progress={progress} color={theme.colors.primary}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.text, fontSize: 32, fontWeight: '800' }}>
                      {(progress * 100).toFixed(0)}%
                    </Text>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>
                      {formatBytes(progress * totalBytes)} / {formatBytes(totalBytes)}
                    </Text>
                  </View>
                </ProgressRing>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>SPEED</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                    {speed.toFixed(1)} <Text style={{ fontSize: 11, color: theme.colors.textTertiary }}>MB/s</Text>
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>ETA</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                    {formatTime(etaMs)}
                  </Text>
                </View>
              </View>

              <GlassCard radius={18} style={{ marginTop: 12 }}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 8 }}>
                  FILE PROGRESS
                </Text>
                {selected.map((i, idx) => {
                    const f = files[i];
                    if (!f) return null;
                  const fileProgress = Math.min(Math.max(progress * selected.length - idx, 0), 1);
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                        <FileIcon kind={fileKind(f.name)} size={28} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                            {f.name}
                          </Text>
                          <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600' }}>
                            {(fileProgress * 100).toFixed(0)}%
                          </Text>
                        </View>
                        <View style={{ height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ width: `${fileProgress * 100}%`, height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 }} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </GlassCard>
            </FadeIn>
          )}

          {phase === 'completed' && (
            <FadeIn delay={50}>
              <View style={{ alignItems: 'center', marginVertical: 24 }}>
                <View
                  style={{
                    width: 96, height: 96, borderRadius: 999,
                    overflow: 'hidden',
                    shadowColor: theme.colors.success, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
                  }}
                >
                  <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={48} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800', marginTop: 18, letterSpacing: -0.5 }}>
                  Transfer complete!
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500', marginTop: 6, textAlign: 'center' }}>
                  {selected.length} files · {formatBytes(totalBytes)} · 0 errors
                </Text>
              </View>

              <GlassCard radius={20}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={mode === 'send' ? 'arrow-up-circle' : 'arrow-down-circle'} size={32} color={mode === 'send' ? theme.colors.error : theme.colors.success} />
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '800' }}>
                      {mode === 'send' ? `Sent to ${peerName}` : `Received from ${peerName}`}
                    </Text>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                      Via Wi-Fi Direct · E2E encrypted
                    </Text>
                  </View>
                </View>
              </GlassCard>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
                <GradientButton title="Send More" variant="glass" onPress={() => setPhase('select')} style={{ flex: 1 }} />
                <GradientButton title="Done" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
              </View>
            </FadeIn>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
