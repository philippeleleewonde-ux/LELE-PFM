import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, LucideIcon } from 'lucide-react-native';

// Performance palette — extends WZ (wizard) neon dark theme
export const PF = {
  darkBg: '#0F1014',
  darkBgAlt: '#1A1C23',
  border: 'rgba(255,255,255,0.08)',
  cardBg: 'rgba(255,255,255,0.04)',
  accent: '#FBBF24',
  accentDark: '#D9A11B',
  green: '#4ADE80',
  greenLight: '#86EFAC',
  red: '#F87171',
  redLight: '#FCA5A5',
  orange: '#FDBA74',
  orangeDark: '#FB923C',
  yellow: '#FDE68A',
  cyan: '#FBBF24',
  violet: '#A78BFA',
  gold: '#FFD700',
  blue: '#60A5FA',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  neonCyan: '#FBBF24',
  neonPurple: '#D9A11B',
  neonLime: '#4ADE80',
} as const;

// COICOP category labels and colors
export const COICOP_LABELS: Record<string, string> = {
  '01': 'Alimentation',
  '02': 'Logement',
  '03': 'Transports',
  '04': 'Loisirs',
  '05': 'Habillement',
  '06': 'Communications',
  '07': 'Santé',
  '08': 'Éducation',
};

export const COICOP_COLORS: Record<string, string> = {
  '01': '#4ADE80',
  '02': '#60A5FA',
  '03': '#FDBA74',
  '04': '#FB923C',
  '05': '#A78BFA',
  '06': '#22D3EE',
  '07': '#F87171',
  '08': '#FDE68A',
};

// ─── SectionHeader ───
interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  color?: string;
}

export function SectionHeader({ icon: Icon, title, color = PF.accent }: SectionHeaderProps) {
  return (
    <View style={sectionStyles.header}>
      <View style={[sectionStyles.iconBox, { backgroundColor: color + '20' }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: PF.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});

// ─── CollapsibleSection ───
interface CollapsibleSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CollapsibleSection({
  title,
  icon,
  iconColor = PF.accent,
  defaultOpen = false,
  children,
  style,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const animHeight = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animHeight, {
        toValue: open ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: open ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [open]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[collapsibleStyles.wrapper, style]}>
      <Pressable onPress={() => setOpen(!open)} style={collapsibleStyles.header}>
        <SectionHeader icon={icon} title={title} color={iconColor} />
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={20} color={PF.textSecondary} />
        </Animated.View>
      </Pressable>
      {open && <View style={collapsibleStyles.content}>{children}</View>}
    </View>
  );
}

const collapsibleStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: PF.cardBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

// ─── PerfGlassCard ───
interface PerfGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PerfGlassCard({ children, style }: PerfGlassCardProps) {
  return (
    <View style={[perfGlassStyles.card, style]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const perfGlassStyles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PF.border,
    borderRadius: 16,
    padding: 16,
  },
});

// ─── FadeInView (reused pattern) ───
interface FadeInViewProps {
  active?: boolean;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function FadeInView({ active = true, delay = 0, duration = 500, style, children }: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (active) {
      opacity.setValue(0);
      translateY.setValue(15);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: false }),
        Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: false }),
      ]).start();
    }
  }, [active]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] } as any]}>
      {children}
    </Animated.View>
  );
}
