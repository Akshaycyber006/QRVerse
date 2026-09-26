import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  title: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GradientButton: React.FC<Props> = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const getGradient = (): [string, string, ...string[]] => {
    switch (variant) {
      case 'primary': return theme.colors.brandGradient;
      case 'secondary': return theme.colors.auroraGradient;
      case 'success': return ['#10B981', '#059669'];
      case 'danger': return ['#EF4444', '#DC2626'];
      default: return theme.colors.brandGradient;
    }
  };

  if (variant === 'glass' || variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            height: heights[size],
            paddingHorizontal: size === 'sm' ? 14 : 20,
            borderRadius: heights[size] / 2,
            backgroundColor: variant === 'glass'
              ? theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)'
              : 'transparent',
            borderWidth: 1.5,
            borderColor: variant === 'glass' ? theme.colors.border : theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          style,
        ]}
      >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text
          style={[
            {
              color: variant === 'outline' ? theme.colors.primary : theme.colors.text,
              fontSize: fontSizes[size],
              fontWeight: '700',
              letterSpacing: -0.2,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: heights[size],
          borderRadius: heights[size] / 2,
          overflow: 'hidden',
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: pressed ? 0.2 : 0.4,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}
      >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text
          style={[
            { color: '#fff', fontSize: fontSizes[size], fontWeight: '800', letterSpacing: -0.3 },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
};