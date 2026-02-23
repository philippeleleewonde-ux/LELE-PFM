import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { stressTestPortfolio } from '@/domain/calculators/stress-test-engine';
import { HISTORICAL_CRISES } from '@/domain/models/historical-scenarios';

export function SectionT_StressTest() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const [selectedId, setSelectedId] = useState(HISTORICAL_CRISES[0].id);

  const results = useMemo(() => stressTestPortfolio(allocations), [allocations]);

  const selectedResult = useMemo(
    () => results.find((r) => r.crisis.id === selectedId) ?? null,
    [results, selectedId],
  );

  if (allocations.length === 0) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('stressTest.configurePortfolio')}
        </Text>
      </PerfGlassCard>
    );
  }

  const verdictColor = selectedResult
    ? selectedResult.verdict === 'survives'
      ? PF.green
      : selectedResult.verdict === 'damaged'
        ? PF.orange
        : PF.red
    : PF.textMuted;

  return (
    <View style={styles.container}>
      {/* Crisis selector pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.pillContent}
      >
        {HISTORICAL_CRISES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setSelectedId(c.id)}
            style={[styles.pill, selectedId === c.id && styles.pillActive]}
          >
            <Text style={[styles.pillText, selectedId === c.id && styles.pillTextActive]}>
              {c.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Selected crisis results */}
      {selectedResult && (
        <>
          <PerfGlassCard>
            <Text style={styles.sectionTitle}>{selectedResult.crisis.name}</Text>
            <Text style={styles.periodText}>
              {selectedResult.crisis.period} · {selectedResult.crisis.duration_months} mois
            </Text>
            <Text style={styles.descText}>{selectedResult.crisis.description}</Text>
          </PerfGlassCard>

          <PerfGlassCard>
            <Text style={styles.sectionTitle}>{t('stressTest.portfolioImpact')}</Text>

            {/* Big drawdown number */}
            <Text style={[styles.bigNumber, { color: verdictColor }]}>
              {selectedResult.portfolioMaxDrawdown.toFixed(1)}%
            </Text>
            <Text style={styles.bigLabel}>{t('stressTest.maxLoss')}</Text>

            {/* Recovery and total return */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {selectedResult.portfolioRecoveryMonths.toFixed(0)} {t('stressTest.months')}
                </Text>
                <Text style={styles.metricLabel}>{t('stressTest.recovery')}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color:
                        selectedResult.portfolioTotalReturn >= 0 ? PF.green : PF.red,
                    },
                  ]}
                >
                  {selectedResult.portfolioTotalReturn >= 0 ? '+' : ''}
                  {selectedResult.portfolioTotalReturn.toFixed(1)}%
                </Text>
                <Text style={styles.metricLabel}>{t('stressTest.totalReturn')}</Text>
              </View>
            </View>

            {/* Verdict badge */}
            <View
              style={[
                styles.verdictBadge,
                { backgroundColor: verdictColor + '20', borderColor: verdictColor + '40' },
              ]}
            >
              <Text style={[styles.verdictText, { color: verdictColor }]}>
                {selectedResult.verdict === 'survives'
                  ? t('stressTest.survives')
                  : selectedResult.verdict === 'damaged'
                    ? t('stressTest.damaged')
                    : t('stressTest.criticalVerdict')}
              </Text>
            </View>
            <Text style={styles.verdictExpl}>{selectedResult.verdictText}</Text>
          </PerfGlassCard>

          {/* Simplified path visualization */}
          <PerfGlassCard>
            <Text style={styles.sectionTitle}>{t('stressTest.simplifiedPath')}</Text>
            <View style={styles.pathRow}>
              <View style={styles.pathNode}>
                <Text style={styles.pathValue}>100</Text>
                <Text style={styles.pathLabel}>{t('stressTest.start')}</Text>
              </View>
              <Text style={styles.pathArrow}>--v--</Text>
              <View style={styles.pathNode}>
                <Text style={[styles.pathValue, { color: PF.red }]}>
                  {(100 + selectedResult.portfolioMaxDrawdown).toFixed(0)}
                </Text>
                <Text style={styles.pathLabel}>{t('stressTest.trough')}</Text>
              </View>
              <Text style={styles.pathArrow}>--^--</Text>
              <View style={styles.pathNode}>
                <Text
                  style={[
                    styles.pathValue,
                    {
                      color:
                        selectedResult.portfolioTotalReturn >= 0 ? PF.green : PF.orange,
                    },
                  ]}
                >
                  {(100 + selectedResult.portfolioTotalReturn).toFixed(0)}
                </Text>
                <Text style={styles.pathLabel}>{t('stressTest.final')}</Text>
              </View>
            </View>
          </PerfGlassCard>

          {/* Best/worst asset */}
          <PerfGlassCard>
            <View style={styles.assetRow}>
              <Text style={styles.assetLabel}>{t('stressTest.bestAsset')}</Text>
              <Text style={[styles.assetValue, { color: PF.green }]}>
                {selectedResult.bestAsset.name} (+{selectedResult.bestAsset.totalReturn}%)
              </Text>
            </View>
            <View style={[styles.assetRow, { marginTop: 8 }]}>
              <Text style={styles.assetLabel}>Pire actif</Text>
              <Text style={[styles.assetValue, { color: PF.red }]}>
                {selectedResult.worstAsset.name} ({selectedResult.worstAsset.drawdown}%)
              </Text>
            </View>
          </PerfGlassCard>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },

  // Pill selector
  pillScroll: { marginBottom: 4 },
  pillContent: { gap: 8, paddingHorizontal: 2 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PF.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: PF.accent,
    borderColor: PF.accent,
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

  // Section
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  periodText: { color: PF.textSecondary, fontSize: 12, marginBottom: 4 },
  descText: { color: PF.textMuted, fontSize: 12, lineHeight: 18 },

  // Big number
  bigNumber: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  bigLabel: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Metrics row
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  metricItem: { alignItems: 'center' },
  metricValue: { color: PF.textPrimary, fontSize: 16, fontWeight: '700' },
  metricLabel: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Verdict
  verdictBadge: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  verdictText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  verdictExpl: { color: PF.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },

  // Path
  pathRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  pathNode: { alignItems: 'center' },
  pathValue: { color: PF.textPrimary, fontSize: 18, fontWeight: '800' },
  pathLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  pathArrow: { color: PF.textMuted, fontSize: 12, fontWeight: '600' },

  // Assets
  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetLabel: { color: PF.textSecondary, fontSize: 12 },
  assetValue: { fontSize: 12, fontWeight: '700' },
});
