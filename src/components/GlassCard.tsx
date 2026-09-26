import React from 'react';
import { View, ViewStyle, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  gradient?: boolean;
  glow?: boolean;
  onPress?: () => void;
  radius?: number;
  noPadding?: boolean;
}

export const GlassCard: React.FC<Props> = ({
  children,
  style,
  intensity = 30,
  gradient = false,
  glow = false,
  onPress,
  radius = 24,
  noPadding = false,
}) => {
  const { theme } = useTheme();
  const baseStyle: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  };

  const inner = (
    <>
      <BlurView
        intensity={intensity}
        tint={theme.mode === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {gradient && (
        <LinearGradient
          colors={theme.mode === 'dark'
            ? ['rgba(139,92,246,0.12)', 'rgba(99,102,241,0.06)', 'transparent']
            : ['rgba(139,92,246,0.08)', 'rgba(99,102,241,0.04)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={{ padding: noPadding ? 0 : 18 }}>{children}</View>
    </>
  );

  const glowStyle: ViewStyle = glow
    ? {
        shadowColor: theme.colors.glow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
      }
    : {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          glowStyle,
          { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
          style as any,
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, glowStyle, style as any]}>
      {inner}
    </View>
  );
};