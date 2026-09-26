import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StatusBar, Dimensions, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';
import { GlassCard } from '../components/GlassCard';
import { QRCode } from '../components/QRCode';
import { generateQRMatrix } from '../utils/qrGenerator';
import { FileIcon, FileKind } from '../components/FileIcon';
import { FadeIn } from '../components/AnimatedNumber';
import { formatDate } from '../utils/helpers';
import { RootStackParamList } from '../navigation/RootNavigator';
import { createAndPersistQRCard } from '../services/cloudData';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

type ScanResult = { type: string; content: string; kind: FileKind; title: string };

const describeContent = (content: string): ScanResult => {
  if (content.startsWith('WIFI:')) return { type: 'Wi-Fi', content, kind: 'wifi', title: 'Wi-Fi Network' };
  if (content.startsWith('BEGIN:VCARD')) return { type: 'Contact', content, kind: 'vcard', title: 'Scanned Contact' };
  if (content.startsWith('qrverse://meeting/')) return { type: 'Meeting Invite', content, kind: 'meeting', title: 'Meeting Invite' };

  try {
    const url = new URL(content);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      const hostname = url.hostname.replace(/^www\./, '');
      const kind: FileKind = hostname.includes('youtube.com') || hostname.includes('youtu.be') ? 'youtube' : 'url';
      return { type: 'Website URL', content, kind, title: hostname };
    }
  } catch {}

  return { type: 'Text', content, kind: 'text', title: 'Scanned Text' };
};

export const ScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [flashOn, setFlashOn] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [detected, setDetected] = useState<ScanResult | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission?.granted === false && permission.canAskAgain) {
      requestPermission().catch(() => Alert.alert('Camera unavailable', 'Unable to request camera access.'));
    }
  }, [permission?.granted, permission?.canAskAgain, requestPermission]);

  const recentScans = useStore(s => s.qrCards.slice(0, 4));

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanning || !data) return;
    setDetected(describeContent(data));
    setScanning(false);
  };

  const handleOpenResult = async () => {
    if (!detected) return;
    let newCard;
    try { newCard = await createAndPersistQRCard({
      title: detected.title,
      kind: detected.kind,
      template: 'glass',
      data: detected.content,
      sizeBytes: detected.content.length * 8,
      isFavorite: false,
      encrypted: false,
      passwordProtected: false,
      oneTimeScan: false,
      qrColor: '#7C3AED',
      bgColor: '#F3F0FF',
      tags: ['scanned'],
    }); }
    catch (error) { Alert.alert('QR save failed', error instanceof Error ? error.message : 'Unable to save scan history.'); return; }

    if (/^https?:\/\//i.test(detected.content)) {
      try {
        await Linking.openURL(detected.content);
      } catch {
        Alert.alert('Unable to open link', 'The scanned address could not be opened. The QR was saved to your library.');
      }
      return;
    }

    navigation.replace('QRCardDetail', { id: newCard.id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />

      {/* Live camera viewport */}
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {permission?.granted && (
          <CameraView
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            facing="back"
            enableTorch={flashOn}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
            onMountError={() => Alert.alert('Camera unavailable', 'The camera could not be started. Check permissions and try again.')}
          />
        )}
        {/* Subtle grid lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{ position: 'absolute', top: `${(i + 1) * 12}%`, left: 0, right: 0, height: 1, backgroundColor: 'rgba(139,92,246,0.06)' }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{ position: 'absolute', left: `${(i + 1) * 12}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(139,92,246,0.06)' }}
          />
        ))}

        {/* Animated scan line */}
        {scanning && (
          <View
            style={{
              position: 'absolute',
              left: '15%',
              right: '15%',
              top: '50%',
              height: 3,
              borderRadius: 2,
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 12,
            }}
          />
        )}

        {/* Viewfinder */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View
            style={{
              width: width * 0.7,
              height: width * 0.7,
              position: 'relative',
            }}
          >
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
              { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
              { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
              { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
            ].map((p, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  width: 36, height: 36,
                  borderColor: theme.colors.primary,
                  ...p,
                }}
              />
            ))}

            {/* Inner dim overlay */}
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.25)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {scanning ? (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name={permission?.granted ? 'scan' : 'camera-outline'} size={48} color="rgba(255,255,255,0.7)" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 10, opacity: 0.85 }}>
                    {permission?.granted ? 'Auto-detecting QR...' : 'Camera permission required'}
                  </Text>
                </View>
              ) : detected ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={{ padding: 14, backgroundColor: '#fff', borderRadius: 14 }}>
                    <QRCode matrix={generateQRMatrix(detected.content)} size={120} color="#7C3AED" rounded />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Top controls */}
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 14,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
            <View style={{ flexDirection: 'row' }}>
              <Pressable
                onPress={() => setFlashOn(!flashOn)}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 14,
                  backgroundColor: flashOn ? theme.colors.primary : 'rgba(0,0,0,0.45)',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={20} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => setBatchMode(!batchMode)}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 14,
                  backgroundColor: batchMode ? theme.colors.primary : 'rgba(0,0,0,0.45)',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name="layers" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Bottom result panel */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <SafeAreaView edges={['bottom']}>
            <View style={{ padding: 20 }}>
              {detected ? (
                <FadeIn delay={50} from="bottom">
                  <View style={{ borderRadius: 24, overflow: 'hidden' }}>
                    <LinearGradient colors={['rgba(20,20,30,0.92)', 'rgba(15,15,25,0.95)']} style={{ padding: 18 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View
                          style={{
                            width: 8, height: 8, borderRadius: 4,
                            backgroundColor: theme.colors.success, marginRight: 8,
                          }}
                        />
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
                          DETECTED · {detected.type.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                        <FileIcon kind={detected.kind} size={42} />
                        <View style={{ marginLeft: 14, flex: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
                            {detected.title}
                          </Text>
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
                            {detected.content.slice(0, 40)}...
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={handleOpenResult}
                          style={({ pressed }) => ({
                            flex: 2, paddingVertical: 12, borderRadius: 999,
                            backgroundColor: theme.colors.primary, alignItems: 'center',
                            opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Open Card</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => { setDetected(null); setScanning(true); }}
                          style={({ pressed }) => ({
                            flex: 1, paddingVertical: 12, borderRadius: 999,
                            backgroundColor: 'rgba(255,255,255,0.12)',
                            alignItems: 'center', opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Scan Again</Text>
                        </Pressable>
                      </View>
                    </LinearGradient>
                  </View>
                </FadeIn>
              ) : (
                <FadeIn delay={50}>
                  <View style={{ padding: 16, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name={batchMode ? 'layers' : 'scan'} size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                        {batchMode ? 'Batch mode · scan multiple' : 'Auto-detect · instant capture'}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                        Hold steady · QR will be detected automatically
                      </Text>
                    </View>
                  </View>
                </FadeIn>
              )}

              {/* Recent scans quick row */}
              {!detected && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14 }}>
                  {recentScans.map(card => (
                    <Pressable
                      key={card.id}
                      onPress={() => navigation.replace('QRCardDetail', { id: card.id })}
                      style={({ pressed }) => ({
                        marginRight: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 16,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.12)',
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6 }} numberOfLines={1}>
                          {card.title}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </View>
  );
};

