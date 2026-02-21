import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle, View, StyleSheet, Platform, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Onboarding-specific color palette (neon dark fintech theme — Gemini design)
export const OB = {
  darkBg: '#0F1014',
  darkBgAlt: '#1A1C23',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#FBBF24',
  accentLight: '#FBBF24',
  accentDark: '#D9A11B',
  accentMid: '#D9A11B',
  // Legacy aliases (slides reference these)
  blue: '#FBBF24',
  blueLight: '#FBBF24',
  purple: '#D9A11B',
  purpleLight: '#D9A11B',
  green: '#4ADE80',
  greenLight: '#4ADE80',
  greenDark: '#16A34A',
  orange: '#F97316',
  orangeLight: '#FB923C',
  pink: '#EC4899',
  pinkLight: '#F472B6',
  gold: '#FFD700',
  red: '#EF4444',
  redLight: '#F87171',
  neonCyan: '#FBBF24',
  neonPurple: '#D9A11B',
  neonLime: '#4ADE80',
} as const;

export const SLIDE_COUNT = 7;

// ─── OBGlassCard ───
interface OBGlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function OBGlassCard({ style, children }: OBGlassCardProps) {
  return (
    <View style={[obGlassStyles.card, style]}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const obGlassStyles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});

// ─── Neon Glow Helper ───
export function neonGlow(color: string = OB.accent): TextStyle {
  return {
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  };
}

// ─── Ambient Spotlights ───
export function AmbientSpotlights() {
  const blur = Platform.select({ web: { filter: 'blur(80px)' } as any, default: { opacity: 0.4 } });
  return (
    <>
      <View style={[obSpotStyles.circle, { top: -60, left: -80, backgroundColor: 'rgba(217,161,27,0.12)' }, blur]} />
      <View style={[obSpotStyles.circle, { top: '40%' as any, right: -100, backgroundColor: 'rgba(251,189,35,0.10)' }, blur]} />
      <View style={[obSpotStyles.circle, { bottom: -40, left: '30%' as any, backgroundColor: 'rgba(74,222,128,0.06)' }, blur]} />
    </>
  );
}

const obSpotStyles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});

// ─── Animation wrappers using RN core Animated (reanimated broken on web) ───

interface FadeInViewProps {
  active: boolean;
  delay?: number;
  duration?: number;
  from?: 'bottom' | 'top' | 'left' | 'none';
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function FadeInView({ active, delay = 0, duration = 600, from = 'bottom', distance = 20, style, children }: FadeInViewProps) {
  const initialTranslate = (from === 'top' || from === 'left') ? -distance : distance;
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(initialTranslate)).current;

  useEffect(() => {
    if (active) {
      opacity.setValue(0);
      translate.setValue(initialTranslate);

      const anim = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: false }),
        Animated.timing(translate, { toValue: 0, duration, delay, useNativeDriver: false }),
      ]);
      anim.start();
      return () => anim.stop();
    } else {
      opacity.setValue(0);
      translate.setValue(initialTranslate);
    }
  }, [active]);

  const transformStyle = from === 'left'
    ? { transform: [{ translateX: translate }] }
    : from === 'none'
    ? {}
    : { transform: [{ translateY: translate }] };

  return (
    <Animated.View style={[style, { opacity } as any, transformStyle as any]}>
      {children}
    </Animated.View>
  );
}

interface ZoomInViewProps {
  active: boolean;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function ZoomInView({ active, delay = 0, style, children }: ZoomInViewProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      scale.setValue(0);
      opacity.setValue(0);

      const anim = Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: false }),
        ]),
        Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: false }),
      ]);
      anim.start();
      return () => anim.stop();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [active]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] } as any]}>
      {children}
    </Animated.View>
  );
}
