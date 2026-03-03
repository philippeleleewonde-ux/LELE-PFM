import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { WZ, GlassCard, FadeInView, neonGlow } from '../shared';
import { useWizardStore } from '@/stores/wizard-store';

interface Props {
  isActive: boolean;
}

interface Lever {
  key: string;
}

const LEVERS: Lever[] = [
  { key: 'formation' },
  { key: 'epargne_auto' },
  { key: 'negociation' },
  { key: 'reduction_depenses' },
  { key: 'side_project' },
  { key: 'investissement' },
];

const DIMENSION_COLORS: Record<string, string> = {
  formation: '#FBBF24',
  epargne_auto: '#4ADE80',
  negociation: '#FFD700',
  reduction_depenses: '#F97316',
  side_project: '#D9A11B',
  investissement: '#FBBF24',
};

export default function Step6Levers({ isActive }: Props) {
  const { t } = useTranslation('wizard');
  const { formData, updateFormData } = useWizardStore();
  const levers = formData.levers;

  const handleChange = useCallback((key: string, value: number) => {
    updateFormData({
      levers: { ...levers, [key]: Math.round(value) },
    });
  }, [levers, updateFormData]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView active={isActive} delay={0}>
        <Text style={styles.title}>{t('step6.title')}</Text>
        <Text style={styles.subtitle}>
          {t('step6.subtitle')}
        </Text>
      </FadeInView>

      {LEVERS.map((lever, index) => {
        const value = levers[lever.key] ?? 0;
        const dimColor = DIMENSION_COLORS[lever.key] ?? WZ.accent;

        return (
          <FadeInView key={lever.key} active={isActive} delay={100 + index * 80}>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.leverName}>{t('step6.levers.' + lever.key)}</Text>
                <View style={[styles.dimensionBadge, { backgroundColor: dimColor + '22' }]}>
                  <View style={[styles.dimensionDot, { backgroundColor: dimColor, shadowColor: dimColor, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }]} />
                  <Text style={[styles.dimensionText, { color: dimColor }]}>
                    {t('step6.levers.' + lever.key + 'Dim')}
                  </Text>
                </View>
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderMin}>0</Text>
                <View style={styles.sliderWrap}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={value}
                    onValueChange={(v: number) => handleChange(lever.key, v)}
                    minimumTrackTintColor={dimColor}
                    maximumTrackTintColor={WZ.border}
                    thumbTintColor={dimColor}
                  />
                </View>
                <Text style={[styles.valueText, { color: dimColor, ...neonGlow(dimColor) }]}>
                  {value}
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${value}%`, backgroundColor: dimColor },
                  ]}
                />
              </View>

              <View style={styles.tipRow}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>{t('step6.levers.' + lever.key + 'Tip')}</Text>
              </View>
            </GlassCard>
          </FadeInView>
        );
      })}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WZ.darkBg,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: WZ.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: WZ.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  leverName: {
    fontSize: 17,
    fontWeight: '700',
    color: WZ.textPrimary,
  },
  dimensionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  dimensionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dimensionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderWrap: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMin: {
    fontSize: 12,
    color: WZ.textMuted,
    width: 20,
    textAlign: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '800',
    width: 36,
    textAlign: 'right',
  },
  progressBar: {
    height: 4,
    backgroundColor: WZ.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(251,189,35,0.05)',
    borderRadius: 10,
    padding: 10,
  },
  tipIcon: {
    fontSize: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: WZ.textMuted,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 40,
  },
});
