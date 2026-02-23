import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, Platform, LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WZ, WIZARD_STEP_COUNT, AmbientSpotlights, neonGlow } from './shared';
import { useWizardStore } from '@/stores/wizard-store';
import Step1Profile from './steps/Step1Profile';
import Step2Flows from './steps/Step2Flows';
import Step3History from './steps/Step3History';
import Step4Risks from './steps/Step4Risks';
import Step5SelfEval from './steps/Step5SelfEval';
import Step6Levers from './steps/Step6Levers';
import Step7InvestorProfile from './steps/Step7InvestorProfile';
import Step7Final from './steps/Step7Final';
import { useViewMode } from '@/hooks/useViewMode';

interface Props {
  onComplete: () => void;
}

export default function SetupWizardScreen({ onComplete }: Props) {
  const { t } = useTranslation('wizard');
  const { currentStep, setStep } = useWizardStore();
  const { isInvestor } = useViewMode();
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const onRootLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / WIZARD_STEP_COUNT,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Scroll to current step
  useEffect(() => {
    if (containerWidth > 0) {
      scrollRef.current?.scrollTo({ x: currentStep * containerWidth, animated: true });
    }
  }, [currentStep, containerWidth]);

  const goNext = () => {
    if (currentStep < WIZARD_STEP_COUNT - 1) {
      setStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const isLast = currentStep === WIZARD_STEP_COUNT - 1;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root} onLayout={onRootLayout}>
      <AmbientSpotlights />
      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {currentStep > 0 && !isLast ? (
            <Pressable onPress={goBack} hitSlop={12} style={styles.backButton}>
              <Text style={styles.backText}>{t('nav.back')}</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.stepIndicator}>
            {currentStep + 1}/{WIZARD_STEP_COUNT}
          </Text>
        </View>
        <Text style={[styles.stepLabel, neonGlow(WZ.accent)]}>{t(`stepLabels.${currentStep}`)}</Text>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      {/* Steps content - horizontal scrolling */}
      {containerWidth > 0 && (
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={[styles.stepContainer, { width: containerWidth }]}>
            {i === 0 && <Step1Profile isActive={currentStep === 0} />}
            {i === 1 && <Step2Flows isActive={currentStep === 1} />}
            {i === 2 && <Step3History isActive={currentStep === 2} />}
            {i === 3 && <Step4Risks isActive={currentStep === 3} />}
            {i === 4 && <Step5SelfEval isActive={currentStep === 4} />}
            {i === 5 && <Step6Levers isActive={currentStep === 5} />}
            {i === 6 && <Step7InvestorProfile isActive={currentStep === 6} />}
            {i === 7 && <Step7Final isActive={currentStep === 7} onComplete={onComplete} />}
          </View>
        ))}
      </ScrollView>
      )}

      {/* Bottom navigation (hidden on last step) */}
      {!isLast && (
        <View style={styles.bottomNav}>
          <View style={styles.buttonRow}>
            {currentStep > 0 && (
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backBottomButton, pressed && styles.backBottomButtonPressed]}
              >
                <Text style={styles.backBottomText}>{t('nav.back')}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.nextButton,
                currentStep > 0 && styles.nextButtonFlex,
                pressed && styles.nextButtonPressed,
              ]}
            >
              <Text style={styles.nextButtonText}>{t('nav.continue')}</Text>
            </Pressable>
          </View>
          <Text style={styles.stepHint}>
            {currentStep === 0 ? t('nav.tellUsAboutYou') : t('nav.stepXofY', { step: currentStep + 1, total: WIZARD_STEP_COUNT })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WZ.darkBg,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: WZ.darkBgAlt,
    borderBottomWidth: 1,
    borderBottomColor: WZ.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 14,
    color: WZ.accent,
    fontWeight: '600',
  },
  backPlaceholder: {
    width: 80,
  },
  stepIndicator: {
    fontSize: 14,
    color: WZ.textMuted,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: WZ.textPrimary,
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: WZ.accent,
    shadowColor: WZ.accent,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  bottomNav: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: WZ.darkBg,
    borderTopWidth: 1,
    borderTopColor: WZ.border,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginBottom: 8,
  },
  backBottomButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backBottomButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  backBottomText: {
    color: WZ.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: WZ.accentLight,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: WZ.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  nextButtonFlex: {
    flex: 2,
    width: undefined,
    maxWidth: undefined,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  nextButtonText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '700',
  },
  stepHint: {
    fontSize: 12,
    color: WZ.textMuted,
  },
});
