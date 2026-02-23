import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle, View, Text, Pressable, StyleSheet, Platform, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Wizard-specific color palette (neon dark fintech theme — Gemini design)
export const WZ = {
  darkBg: '#0F1014',
  darkBgAlt: '#1A1C23',
  border: 'rgba(255,255,255,0.1)',
  cardBg: 'rgba(255,255,255,0.05)',
  cardBorder: 'rgba(255,255,255,0.08)',
  accent: '#FBBF24',
  accentLight: '#FBBF24',
  accentDark: '#D9A11B',
  accentMid: '#D9A11B',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  green: '#4ADE80',
  greenLight: '#4ADE80',
  greenDark: '#16A34A',
  orange: '#F97316',
  orangeLight: '#FB923C',
  red: '#EF4444',
  redLight: '#F87171',
  gold: '#FFD700',
  neonCyan: '#FBBF24',
  neonPurple: '#D9A11B',
  neonLime: '#4ADE80',
} as const;

export const WIZARD_STEP_COUNT = 8;

/** i18n keys resolved via t(`wizard:stepLabels.${index}`) */
export const WIZARD_STEP_LABEL_KEYS = [
  'stepLabels.0', 'stepLabels.1', 'stepLabels.2', 'stepLabels.3',
  'stepLabels.4', 'stepLabels.5', 'stepLabels.6', 'stepLabels.7',
];

// ─── GlassCard ───
interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function GlassCard({ style, children }: GlassCardProps) {
  return (
    <View style={[glassStyles.card, style]}>
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

const glassStyles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WZ.cardBorder,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});

// ─── TipBox ───
interface TipBoxProps {
  text: string;
  style?: StyleProp<ViewStyle>;
}

export function TipBox({ text, style }: TipBoxProps) {
  return (
    <View style={[tipStyles.box, style]}>
      <Text style={tipStyles.icon}>⚡</Text>
      <Text style={tipStyles.text}>{text}</Text>
    </View>
  );
}

const tipStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: WZ.accent,
    backgroundColor: 'rgba(251,189,35,0.06)',
    borderRadius: 12,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 13, color: WZ.textSecondary, lineHeight: 20 },
});

// ─── Neon Glow Helper ───
export function neonGlow(color: string = WZ.accent): TextStyle {
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
      <View style={[spotStyles.circle, { top: -60, left: -80, backgroundColor: 'rgba(217,161,27,0.12)' }, blur]} />
      <View style={[spotStyles.circle, { top: '40%' as any, right: -100, backgroundColor: 'rgba(251,189,35,0.10)' }, blur]} />
      <View style={[spotStyles.circle, { bottom: -40, left: '30%' as any, backgroundColor: 'rgba(74,222,128,0.06)' }, blur]} />
    </>
  );
}

const spotStyles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});

// ─── PrimaryButton ───
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, disabled = false, style }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        btnStyles.button,
        disabled && btnStyles.disabled,
        pressed && !disabled && btnStyles.pressed,
        style,
      ]}
    >
      <Text style={[btnStyles.text, disabled && btnStyles.textDisabled]}>{label}</Text>
    </Pressable>
  );
}

const btnStyles = StyleSheet.create({
  button: {
    backgroundColor: '#FBBF24',
    paddingVertical: 16,
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  text: { color: '#0F1014', fontSize: 16, fontWeight: '700' },
  textDisabled: { color: '#52525B' },
});

// ─── Animation wrappers (reuse same pattern as onboarding) ───

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
