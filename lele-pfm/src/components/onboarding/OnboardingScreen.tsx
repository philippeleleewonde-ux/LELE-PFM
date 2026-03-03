import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
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
  const [visited, setVisited] = useState(new Set([0]));
  const scrollRef = useRef<ScrollView>(null);
  const [contentDims, setContentDims] = useState({ width: Dimensions.get('window').width, height: 0 });
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const currentRef = useRef(0);
  currentRef.current = current;

  // Track visited slides so animations persist after viewing
  useEffect(() => {
    setVisited(prev => {
      if (prev.has(current)) return prev;
      return new Set(prev).add(current);
    });
  }, [current]);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
    setCurrent(clamped);
    scrollRef.current?.scrollTo({ x: clamped * contentDims.width, animated: true });
  }, [contentDims.width]);

  const handleNext = () => {
    if (current === SLIDE_COUNT - 1) {
      onComplete();
    } else {
      goTo(current + 1);
    }
  };

  // Detect which slide is visible after scroll settles
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    const offsetX = e.nativeEvent.contentOffset.x;
    const width = contentDims.width;
    scrollTimerRef.current = setTimeout(() => {
      if (width <= 0) return;
      const index = Math.round(offsetX / width);
      if (index >= 0 && index < SLIDE_COUNT) {
        setCurrent(index);
      }
    }, 100);
  }, [contentDims.width]);

  // Measure the content area for accurate slide dimensions
  const handleContentLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContentDims({ width, height });
      // Re-align scroll position after resize
      scrollRef.current?.scrollTo({ x: currentRef.current * width, animated: false });
    }
  }, []);

  const isLast = current === SLIDE_COUNT - 1;

  return (
    <View style={styles.root}>
      <AmbientSpotlights />

      <View style={styles.contentArea} onLayout={handleContentLayout}>
        {contentDims.height > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
            decelerationRate="fast"
            style={Platform.OS === 'web' ? { scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as any : undefined}
          >
            {SLIDES.map((SlideComponent, index) => (
              <View
                key={index}
                style={[
                  { width: contentDims.width, height: contentDims.height },
                  Platform.OS === 'web' && { scrollSnapAlign: 'start' } as any,
                ]}
              >
                <SlideComponent isActive={visited.has(index)} />
              </View>
            ))}
          </ScrollView>
        )}
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
  buttonWrap: { width: '80%' as any, maxWidth: 320, marginBottom: 8 },
  buttonWrapLast: { shadowColor: '#FBBF24', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  button: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonNonLast: { borderWidth: 1, borderColor: 'rgba(251,189,35,0.2)' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipText: { fontSize: 14, color: OB.textMuted },
});
