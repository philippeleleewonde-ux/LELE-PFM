import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, ScrollView, Animated, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WZ, GlassCard, FadeInView, ZoomInView, PrimaryButton, neonGlow } from '../shared';
import { useWizardStore } from '@/stores/wizard-store';
import { useAppStore, ViewMode } from '@/stores/app.store';

interface Props {
  isActive: boolean;
  onComplete: () => void;
}

const CONFETTI_COUNT = 25;
const CONFETTI_COLORS = [
  WZ.accent, WZ.green, WZ.greenLight, WZ.gold, WZ.orange,
  '#60A5FA', '#A78BFA', '#F472B6', '#34D399', '#FBBF24',
];

interface ConfettiPiece {
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  isCircle: boolean;
}

function useConfetti(active: boolean, containerWidth: number) {
  const effectiveWidth = containerWidth > 0 ? containerWidth : 400;
  const pieces = useMemo<ConfettiPiece[]>(() =>
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: Math.random() * (effectiveWidth - 20),
      delay: Math.random() * 2000,
      duration: 2000 + Math.random() * 2000,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      isCircle: Math.random() > 0.5,
    })),
  [effectiveWidth]);

  const anims = useRef(
    pieces.map(() => ({
      translateY: new Animated.Value(-40),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => {
        a.translateY.setValue(-40);
        a.opacity.setValue(0);
        a.rotate.setValue(0);
      });
      return;
    }

    const animations = anims.map((a, i) => {
      const piece = pieces[i];
      return Animated.sequence([
        Animated.delay(piece.delay),
        Animated.parallel([
          Animated.timing(a.translateY, {
            toValue: 600,
            duration: piece.duration,
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(a.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.delay(piece.duration - 600),
            Animated.timing(a.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: false,
            }),
          ]),
          Animated.timing(a.rotate, {
            toValue: 3 + Math.random() * 4,
            duration: piece.duration,
            useNativeDriver: false,
          }),
        ]),
      ]);
    });

    const composite = Animated.stagger(60, animations);
    composite.start();

    return () => composite.stop();
  }, [active]);

  return { pieces, anims };
}

function getEngagementLevelKey(formData: {
  ratings: number[];
  risks: Record<string, number>;
  levers: Record<string, number>;
}): string {
  const ratingTotal = formData.ratings.reduce((a, b) => a + b, 0);
  const leverValues = Object.values(formData.levers);
  const avgLever = leverValues.length > 0
    ? leverValues.reduce((a, b) => a + b, 0) / leverValues.length
    : 0;
  const score = ratingTotal + avgLever;

  if (score >= 80) return 'expert';
  if (score >= 55) return 'advanced';
  if (score >= 30) return 'intermediate';
  return 'beginner';
}

const VIEW_MODE_OPTIONS: Array<{
  key: ViewMode;
  i18nKey: string;
  icon: string;
  color: string;
}> = [
  { key: 'simple', i18nKey: 'simple', icon: '🌱', color: WZ.green },
  { key: 'expert', i18nKey: 'expert', icon: '📊', color: WZ.accent },
  { key: 'investor', i18nKey: 'investor', icon: '🏦', color: '#A78BFA' },
];

export default function Step7Final({ isActive, onComplete }: Props) {
  const { t } = useTranslation('wizard');
  const { formData, resetWizard } = useWizardStore();
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const [containerWidth, setContainerWidth] = useState(0);
  const { pieces, anims } = useConfetti(isActive, containerWidth);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };
  const cardWidth = containerWidth > 0 ? (containerWidth - 52) / 2 : 160;

  const incomeCount = Object.values(formData.incomes).filter((v) => v.amount > 0).length;
  const expenseCount = Object.values(formData.expenses).filter((v) => v.amount > 0).length;
  const engagementKey = getEngagementLevelKey(formData);

  // Coherence ratio (Dep/Rev %)
  const totalIncome = Object.values(formData.incomes).reduce((sum, v) => {
    if (!v || v.amount <= 0) return sum;
    return sum + (v.frequency === 'annual' ? v.amount / 12 : v.amount);
  }, 0);
  const totalExpense = Object.values(formData.expenses).reduce((sum, v) => {
    if (!v || v.amount <= 0) return sum;
    return sum + (v.frequency === 'annual' ? v.amount / 12 : v.amount);
  }, 0);
  const coherenceRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

  const stats = [
    { label: t('step8.profileConfigured'), value: '\u2713', accent: true },
    { label: t('step8.incomeSources'), value: `${incomeCount}`, accent: false },
    { label: t('step8.expenseCategories'), value: `${expenseCount}`, accent: false },
    { label: t('step8.expenseRatio'), value: `${coherenceRatio}%`, accent: false },
    { label: t('step8.engagementLevel'), value: t(`step8.engagement.${engagementKey}`), accent: false },
  ];

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Confetti layer */}
      {isActive && (
        <View style={styles.confettiLayer} pointerEvents="none">
          {pieces.map((piece, i) => {
            const rotation = anims[i].rotate.interpolate({
              inputRange: [0, 7],
              outputRange: ['0deg', '2520deg'],
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.confettiPiece,
                  {
                    left: piece.x,
                    width: piece.size,
                    height: piece.isCircle ? piece.size : piece.size * 1.4,
                    backgroundColor: piece.color,
                    borderRadius: piece.isCircle ? piece.size / 2 : 2,
                    opacity: anims[i].opacity,
                    transform: [
                      { translateY: anims[i].translateY as any },
                      { rotate: rotation as any },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated checkmark */}
        <ZoomInView active={isActive} delay={200} style={styles.checkmarkWrap}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </ZoomInView>

        <FadeInView active={isActive} delay={500}>
          <Text style={styles.title}>{t('step8.title')}</Text>
          <Text style={styles.subtitle}>
            {t('step8.subtitle')}
          </Text>
        </FadeInView>

        {/* Stats cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <FadeInView key={index} active={isActive} delay={700 + index * 120}>
              <GlassCard style={[styles.statCard, { width: cardWidth }]}>
                <Text
                  style={[
                    styles.statValue,
                    stat.accent && styles.statValueAccent,
                  ]}
                >
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </GlassCard>
            </FadeInView>
          ))}
        </View>

        {/* View Mode Selector */}
        <FadeInView active={isActive} delay={1100}>
          <Text style={styles.modeTitle}>{t('step8.chooseModeTitle')}</Text>
          <Text style={styles.modeSubtitle}>
            {t('step8.chooseModeSubtitle')}
          </Text>
          <View style={styles.modeGrid}>
            {VIEW_MODE_OPTIONS.map((opt) => {
              const isSelected = viewMode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setViewMode(opt.key)}
                  style={[
                    styles.modeCard,
                    isSelected && [styles.modeCardSelected, { borderColor: opt.color }],
                  ]}
                >
                  <Text style={styles.modeIcon}>{opt.icon}</Text>
                  <Text style={[
                    styles.modeLabel,
                    isSelected && { color: opt.color },
                  ]}>
                    {t(`step8.modes.${opt.i18nKey}`)}
                  </Text>
                  <Text style={styles.modeDesc}>{t(`step8.modes.${opt.i18nKey}Desc`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </FadeInView>

        {/* CTA Button */}
        <FadeInView active={isActive} delay={1400}>
          <PrimaryButton
            label={t('step8.goToDashboard')}
            onPress={onComplete}
            style={styles.ctaButton}
          />
        </FadeInView>

        {/* Reset Button */}
        <FadeInView active={isActive} delay={1400}>
          <Pressable
            onPress={resetWizard}
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.resetText}>🔄 {t('step8.resetWizard')}</Text>
          </Pressable>
        </FadeInView>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WZ.darkBg,
  },
  content: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  // Confetti
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    top: -20,
  },
  // Checkmark
  checkmarkWrap: {
    marginBottom: 24,
    alignItems: 'center',
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: WZ.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: WZ.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  checkIcon: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
  // Text
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: WZ.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: WZ.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  // Stats grid
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: WZ.textPrimary,
    marginBottom: 6,
    ...neonGlow(WZ.textPrimary),
  },
  statValueAccent: {
    color: WZ.green,
    fontSize: 36,
  },
  statLabel: {
    fontSize: 13,
    color: WZ.textSecondary,
    textAlign: 'center',
  },
  // View mode selector
  modeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: WZ.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  modeSubtitle: {
    fontSize: 13,
    color: WZ.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  modeGrid: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modeCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modeIcon: {
    fontSize: 28,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: WZ.textSecondary,
    minWidth: 100,
  },
  modeDesc: {
    flex: 1,
    fontSize: 12,
    color: WZ.textMuted,
    lineHeight: 16,
  },
  // CTA
  ctaButton: {
    width: '100%',
    maxWidth: 340,
  },
  // Reset
  resetButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  resetText: {
    fontSize: 14,
    color: WZ.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
