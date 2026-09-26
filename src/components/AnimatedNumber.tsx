import React, { useEffect } from 'react';
import { TextStyle, ViewStyle, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  from?: 'bottom' | 'top' | 'left' | 'right' | 'fade' | 'scale';
  distance?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 600,
  style,
  from = 'bottom',
  distance = 24,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = progress.value;
    const d = distance * (1 - progress.value);
    let transform: any[] = [];
    switch (from) {
      case 'bottom': transform = [{ translateY: d }]; break;
      case 'top': transform = [{ translateY: -d }]; break;
      case 'left': transform = [{ translateX: -d }]; break;
      case 'right': transform = [{ translateX: d }]; break;
      case 'scale': transform = [{ scale: 0.85 + 0.15 * progress.value }]; break;
      case 'fade': transform = []; break;
    }
    return { opacity, transform };
  });

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
};

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  children?: React.ReactNode;
  color?: string;
  trackColor?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 64,
  strokeWidth = 6,
  progress,
  children,
  color,
  trackColor,
}) => {
  const { theme } = useTheme();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, { damping: 16, stiffness: 90 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${animatedProgress.value * 360}deg` }],
    };
  });

  const trackColorFinal = trackColor || theme.colors.border;
  const colorFinal = color || theme.colors.primary;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: trackColorFinal,
          opacity: 0.4,
        }}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colorFinal,
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
          },
          animatedStyle,
        ]}
      />
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
};

export { Animated };