import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Chip: React.FC<Props> = ({ label, active, onPress, icon, variant = 'default', size = 'md' }) => {
  const { theme } = useTheme();

  const variantColors = {
    default: { bg: theme.colors.primarySoft, fg: theme.colors.primary },
    success: { bg: 'rgba(16,185,129,0.15)', fg: theme.colors.success },
    warning: { bg: 'rgba(245,158,11,0.15)', fg: theme.colors.warning },
    danger: { bg: 'rgba(239,68,68,0.15)', fg: theme.colors.error },
    info: { bg: 'rgba(59,130,246,0.15)', fg: theme.colors.info },
  };

  const v = variantColors[variant];
  const paddingV = size === 'sm' ? 4 : 6;
  const paddingH = size === 'sm' ? 10 : 12;
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: paddingV,
        paddingHorizontal: paddingH,
        borderRadius: 999,
        backgroundColor: active ? theme.colors.primary : v.bg,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : v.fg + '40',
        opacity: pressed ? 0.85 : 1,
        marginRight: 6,
      })}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={{ color: active ? '#fff' : v.fg, fontSize, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
};