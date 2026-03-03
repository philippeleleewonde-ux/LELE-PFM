import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { OB, SLIDE_COUNT, AmbientSpotlights } from './shared';
import Slide1Home from './slides/Slide1Home';
import Slide2Receipt from './slides/Slide2Receipt';
import Slide3Level from './slides/Slide3Level';
import Slide4Waterfall from './slides/Slide4Waterfall';
import Slide5Calendar from './slides/Slide5Calendar';
import Slide6Cube from './slides/Slide6Cube';
import Slide7Final from './slides/Slide7Final';

const SLIDES = [Slide1Home, Slide2Receipt, Slide3Level, Slide4Waterfall, Slide5Calendar, Slide6Cube, Slide7Final];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { t } = useTranslation('onboarding');
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
    setCurrent(clamped);
  }, []);

  const handleNext = () => {
    if (current === SLIDE_COUNT - 1) {
      onComplete();
    } else {
      goTo(current + 1);
    }
  };

  const isLast = current === SLIDE_COUNT - 1;
  const CurrentSlide = SLIDES[current];

  return (
    <View style={styles.root}>
      <AmbientSpotlights />

      {/* Current slide — only render the active one */}
      <View style={styles.contentArea}>
        <CurrentSlide key={current} isActive={true} />
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={8}>
              <View style={[styles.dot, i === current && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* Button */}
        <Pressable onPress={handleNext} style={[styles.buttonWrap, isLast && styles.buttonWrapLast]}>
          <LinearGradient
            colors={isLast ? ['#FBBF24', '#D9A11B'] : ['rgba(251,189,35,0.12)', 'rgba(217,161,27,0.06)']}
            style={[styles.button, !isLast && styles.buttonNonLast]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>{t(`buttons.${current}`)}</Text>
          </LinearGradient>
        </Pressable>

        {/* Skip */}
        {!isLast && (
          <Pressable onPress={onComplete} hitSlop={12}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OB.darkBg,
    ...(Platform.OS === 'web' ? { maxHeight: '100dvh' as any, height: '100dvh' as any } : {}),
  },
  contentArea: { flex: 1 },
  controls: {
    paddingBottom: Platform.OS === 'web' ? 24 : 40,
    paddingTop: 12,
    alignItems: 'center',
    backgroundColor: OB.darkBg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(148,163,184,0.3)' },
  dotActive: { width: 24, backgroundColor: OB.accent, borderRadius: 4 },
  buttonWrap: { width: '80%', maxWidth: 320, marginBottom: 8 },
  buttonWrapLast: { shadowColor: '#FBBF24', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  button: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonNonLast: { borderWidth: 1, borderColor: 'rgba(251,189,35,0.2)' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipText: { fontSize: 14, color: OB.textMuted },
});
