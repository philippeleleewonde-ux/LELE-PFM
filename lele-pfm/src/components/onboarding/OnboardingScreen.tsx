import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent, Platform } from 'react-native';
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
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onRootLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const onContentLayout = (e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height);
  };

  const goTo = useCallback((index: number) => {
    if (containerWidth <= 0) return;
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
    setCurrent(clamped);
    scrollRef.current?.scrollTo({ x: clamped * containerWidth, animated: true });
  }, [containerWidth]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / containerWidth);
    if (page !== current && page >= 0 && page < SLIDE_COUNT) {
      setCurrent(page);
    }
  }, [current, containerWidth]);

  const handleNext = () => {
    if (current === SLIDE_COUNT - 1) {
      onComplete();
    } else {
      goTo(current + 1);
    }
  };

  const isLast = current === SLIDE_COUNT - 1;

  return (
    <View style={styles.root} onLayout={onRootLayout}>
      <AmbientSpotlights />

      {/* Content area — flex: 1 takes all space above controls */}
      <View style={styles.contentArea} onLayout={onContentLayout}>
        {containerWidth > 0 && contentHeight > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
          >
            {SLIDES.map((SlideComponent, i) => (
              <View key={i} style={{ width: containerWidth, height: contentHeight }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.slideContent}
                  nestedScrollEnabled
                >
                  <SlideComponent isActive={i === current} />
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom controls — normal flow, not absolute */}
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
  scrollView: { flex: 1 },
  slideContent: { flexGrow: 1 },
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
