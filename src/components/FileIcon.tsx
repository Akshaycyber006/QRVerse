import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type FileKind =
  | 'pdf' | 'docx' | 'ppt' | 'xls' | 'zip'
  | 'apk' | 'image' | 'video' | 'audio'
  | 'text' | 'url' | 'youtube' | 'instagram' | 'linkedin' | 'github'
  | 'maps' | 'email' | 'phone' | 'whatsapp' | 'wifi' | 'vcard'
  | 'meeting' | 'link' | 'unknown';

interface Props {
  kind: FileKind;
  size?: number;
  showLabel?: boolean;
}

const getConfig = (kind: FileKind): { color: [string, string]; letter: string; icon: string } => {
  switch (kind) {
    case 'pdf': return { color: ['#EF4444', '#DC2626'], letter: 'PDF', icon: '📄' };
    case 'docx': return { color: ['#3B82F6', '#2563EB'], letter: 'DOC', icon: '📝' };
    case 'ppt': return { color: ['#F97316', '#EA580C'], letter: 'PPT', icon: '📊' };
    case 'xls': return { color: ['#10B981', '#059669'], letter: 'XLS', icon: '📈' };
    case 'zip': return { color: ['#8B5CF6', '#7C3AED'], letter: 'ZIP', icon: '🗜️' };
    case 'apk': return { color: ['#06B6D4', '#0891B2'], letter: 'APK', icon: '📱' };
    case 'image': return { color: ['#EC4899', '#DB2777'], letter: 'IMG', icon: '🖼️' };
    case 'video': return { color: ['#F59E0B', '#D97706'], letter: 'VID', icon: '🎬' };
    case 'audio': return { color: ['#A855F7', '#9333EA'], letter: 'MP3', icon: '🎵' };
    case 'text': return { color: ['#64748B', '#475569'], letter: 'TXT', icon: '📃' };
    case 'url': return { color: ['#6366F1', '#4F46E5'], letter: 'URL', icon: '🌐' };
    case 'youtube': return { color: ['#FF0000', '#CC0000'], letter: 'YT', icon: '▶️' };
    case 'instagram': return { color: ['#E1306C', '#833AB4'], letter: 'IG', icon: '📷' };
    case 'linkedin': return { color: ['#0A66C2', '#084D92'], letter: 'IN', icon: '💼' };
    case 'github': return { color: ['#24292E', '#0D1117'], letter: 'GH', icon: '🐙' };
    case 'maps': return { color: ['#34A853', '#0F9D58'], letter: 'MAP', icon: '📍' };
    case 'email': return { color: ['#3B82F6', '#2563EB'], letter: '@', icon: '✉️' };
    case 'phone': return { color: ['#10B981', '#059669'], letter: 'TEL', icon: '📞' };
    case 'whatsapp': return { color: ['#25D366', '#128C7E'], letter: 'WA', icon: '💬' };
    case 'wifi': return { color: ['#0EA5E9', '#0284C7'], letter: 'WIFI', icon: '📶' };
    case 'vcard': return { color: ['#8B5CF6', '#7C3AED'], letter: 'VCF', icon: '👤' };
    case 'meeting': return { color: ['#8B5CF6', '#6366F1'], letter: 'MTG', icon: '🎥' };
    case 'link': return { color: ['#6366F1', '#4F46E5'], letter: 'LINK', icon: '🔗' };
    default: return { color: ['#94A3B8', '#64748B'], letter: 'FILE', icon: '📁' };
  }
};

export const FileIcon: React.FC<Props> = ({ kind, size = 56, showLabel = false }) => {
  const { theme } = useTheme();
  const cfg = getConfig(kind);
  const fontSize = size * 0.32;
  const labelSize = size * 0.10;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: cfg.color[0],
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: cfg.color[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: size * 0.28,
            backgroundColor: cfg.color[1],
            opacity: 0.5,
          }}
        />
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: fontSize, letterSpacing: -0.5 }}>
          {cfg.letter}
        </Text>
      </View>
      {showLabel && (
        <Text style={{ color: theme.colors.textTertiary, fontSize: labelSize, marginTop: 6, fontWeight: '700' }}>
          {cfg.icon} {kind.toUpperCase()}
        </Text>
      )}
    </View>
  );
};