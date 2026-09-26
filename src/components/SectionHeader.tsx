import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const SectionHeader: React.FC<Props> = ({ title, subtitle, actionLabel, onAction, icon }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 28,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {icon && (
          <View style={{ marginRight: 10 }}>
            {icon}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: '800',
              letterSpacing: -0.4,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {actionLabel && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: theme.colors.primarySoft,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};