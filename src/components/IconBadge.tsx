import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  icon: React.ReactNode;
  size?: number;
  gradient?: boolean;
  glow?: boolean;
  color?: string;
  rounded?: boolean;
}

export const IconBadge: React.FC<Props> = ({
  icon,
  size = 48,
  gradient = true,
  glow = true,
  color,
  rounded = true,
}) => {
  const { theme } = useTheme();

  const Container = gradient ? LinearGradient : View;
  const containerProps = gradient
    ? {
        colors: theme.colors.brandGradient,
        start: { x: 0, y: 0 } as const,
        end: { x: 1, y: 1 } as const,
      }
    : {};

  return (
    <Container
      {...(containerProps as any)}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? size * 0.28 : size * 0.18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: gradient ? undefined : color || theme.colors.primarySoft,
        shadowColor: glow ? (color || theme.colors.primary) : 'transparent',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {icon}
    </Container>
  );
};