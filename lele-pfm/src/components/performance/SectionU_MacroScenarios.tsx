import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import {
  analyzeScenario,
  PRESET_SCENARIOS,
  MACRO_LABELS,
  MacroScenarioResult,
} from '@/domain/calculators/macro-scenario-engine';

export function SectionU_MacroScenarios() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const result: MacroScenarioResult | null = useMemo(() => {
    if (allocations.length === 0) return null;
    return analyzeScenario(allocations, PRESET_SCENARIOS[selectedIndex]);
  }, [allocations, selectedIndex]);

  if (!investorProfile) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('macro.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  if (!result) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>{t('macro.noAllocation')}</Text>
      </PerfGlassCard>
    );
  }

  const hypothesis = result.hypothesis;
  const varMeta = MACRO_LABELS[hypothesis.variable];
  const verdictColor =
    result.verdict === 'favorable'
      ? PF.green
      : result.verdict === 'unfavorable'
        ? PF.red
        : PF.textSecondary;
  const verdictLabel =
    result.verdict === 'favorable'
      ? t('macro.favorable')
      : result.verdict === 'unfavorable'
        ? t('macro.unfavorable')
        : t('macro.neutral');

  return (
    <View style={styles.container}>
      {/* Scenario pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContainer}
      >
        {PRESET_SCENARIOS.map((scenario, idx) => {
          const active = idx === selectedIndex;
          return (
            <Pressable
              key={idx}
              onPress={() => setSelectedIndex(idx)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {scenario.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Hypothesis summary */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('macro.hypothesis')}</Text>
        <View style={styles.hypoRow}>
          <Text style={styles.hypoLabel}>{varMeta.label}</Text>
          <Text style={styles.hypoValues}>
            {hypothesis.currentValue}{varMeta.unit} {'  '}
            <Text style={styles.hypoArrow}>{hypothesis.delta > 0 ? '\u2191' : '\u2193'}</Text>
            {'  '}{hypothesis.newValue}{varMeta.unit}
          </Text>
        </View>
        <Text style={styles.hypoDelta}>
          {t('macro.variation')} : {hypothesis.delta > 0 ? '+' : ''}{hypothesis.delta}pp
        </Text>
      </PerfGlassCard>

      {/* Portfolio impact */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('macro.portfolioImpact')}</Text>
        <View style={styles.impactCenter}>
          <Text style={[styles.impactValue, { color: verdictColor }]}>
            {result.portfolioImpact >= 0 ? '+' : ''}{result.portfolioImpact.toFixed(2)}%
          </Text>
          <View style={[styles.verdictBadge, { backgroundColor: verdictColor + '20' }]}>
            <Text style={[styles.verdictText, { color: verdictColor }]}>{verdictLabel}</Text>
          </View>
        </View>
        <View style={styles.returnRow}>
          <View style={styles.returnItem}>
            <Text style={styles.returnLabel}>{t('macro.currentReturn')}</Text>
            <Text style={styles.returnValue}>{result.portfolioBaseReturn.toFixed(1)}%</Text>
          </View>
          <View style={styles.returnItem}>
            <Text style={styles.returnLabel}>{t('macro.adjustedReturn')}</Text>
            <Text style={[styles.returnValue, { color: verdictColor }]}>
              {result.portfolioAdjustedReturn.toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={styles.explanationText}>{result.explanation}</Text>
      </PerfGlassCard>

      {/* Per-asset impacts */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('macro.perAssetImpact')}</Text>
        <View style={styles.assetList}>
          {result.assetImpacts.map((ai, idx) => {
            const impactColor =
              ai.direction === 'positive'
                ? PF.green
                : ai.direction === 'negative'
                  ? PF.red
                  : PF.textSecondary;
            const arrow =
              ai.direction === 'positive' ? '\u2191' : ai.direction === 'negative' ? '\u2193' : '\u2194';

            return (
              <View key={`${ai.asset}-${idx}`} style={styles.assetRow}>
                <Text style={styles.assetName} numberOfLines={1}>{ai.assetName}</Text>
                <Text style={styles.assetBase}>{ai.baseReturn.toFixed(1)}%</Text>
                <Text style={styles.assetArrowSep}>{'\u2192'}</Text>
                <Text style={[styles.assetAdjusted, { color: impactColor }]}>
                  {ai.adjustedReturn.toFixed(1)}%
                </Text>
                <Text style={[styles.assetImpact, { color: impactColor }]}>
                  {arrow} {ai.impact >= 0 ? '+' : ''}{ai.impact.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      </PerfGlassCard>

      {/* Info footer */}
      <Text style={styles.footerText}>
        {t('macro.disclaimer')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },

  // Pills
  pillsContainer: { paddingBottom: 4, gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillActive: {
    backgroundColor: PF.accent,
  },
  pillText: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: PF.darkBg,
    fontWeight: '700',
  },

  // Hypothesis
  hypoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hypoLabel: { color: PF.textSecondary, fontSize: 13, fontWeight: '600' },
  hypoValues: { color: PF.textPrimary, fontSize: 13, fontWeight: '700' },
  hypoArrow: { color: PF.accent, fontWeight: '800' },
  hypoDelta: { color: PF.textMuted, fontSize: 11, marginTop: 2 },

  // Impact center
  impactCenter: { alignItems: 'center', marginBottom: 12 },
  impactValue: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  verdictBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verdictText: { fontSize: 12, fontWeight: '700' },

  // Returns row
  returnRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  returnItem: { alignItems: 'center' },
  returnLabel: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  returnValue: { color: PF.textPrimary, fontSize: 14, fontWeight: '700' },

  // Explanation
  explanationText: { color: PF.textSecondary, fontSize: 12, lineHeight: 18 },

  // Asset list
  assetList: { gap: 8 },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assetName: { color: PF.textSecondary, fontSize: 12, flex: 1 },
  assetBase: { color: PF.textMuted, fontSize: 11, minWidth: 36, textAlign: 'right' },
  assetArrowSep: { color: PF.textMuted, fontSize: 10 },
  assetAdjusted: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  assetImpact: { fontSize: 11, fontWeight: '700', minWidth: 52, textAlign: 'right' },

  // Footer
  footerText: { color: PF.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 14, paddingHorizontal: 8 },
});
