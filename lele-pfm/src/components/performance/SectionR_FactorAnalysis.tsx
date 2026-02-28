import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { analyzeFactors, FACTOR_INFO, InvestmentFactor } from '@/domain/calculators/factor-scoring-engine';
import RadarChart from '@/components/charts/RadarChart';

function levelColor(level: string): string {
  switch (level) {
    case 'high': return PF.green;
    case 'moderate': return PF.orange;
    case 'low': return PF.red;
    default: return PF.textMuted;
  }
}

export function SectionR_FactorAnalysis() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const analysis = useMemo(() => {
    if (allocations.length === 0) return null;
    return analyzeFactors(allocations);
  }, [allocations]);

  const radarData = useMemo(() => {
    if (!analysis) return [];
    return analysis.factors.map((f) => ({
      label: f.label,
      value: f.score,
      max: 10,
    }));
  }, [analysis]);

  if (!investorProfile || !analysis) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('factorAnalysis.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Radar chart */}
      {radarData.length >= 3 && (
        <PerfGlassCard>
          <RadarChart
            data={radarData}
            size={200}
            color={PF.violet}
          />
        </PerfGlassCard>
      )}

      {/* Factor bars */}
      <PerfGlassCard>
        <Text style={styles.sectionTitle}>{t('factorAnalysis.factorExposure')}</Text>
        {analysis.factors.map((f) => (
          <View key={f.factor} style={styles.factorRow}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorEmoji}>{FACTOR_INFO[f.factor as InvestmentFactor].emoji}</Text>
              <Text style={styles.factorName}>{f.label}</Text>
              <Text style={[styles.factorLevel, { color: levelColor(f.level) }]}>
                {f.level === 'high' ? t('factorAnalysis.high') : f.level === 'moderate' ? t('factorAnalysis.moderate') : t('factorAnalysis.low')}
              </Text>
              <Text style={styles.factorScore}>{f.score}/10</Text>
            </View>
            {/* Progress bar */}
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${f.score * 10}%`,
                    backgroundColor: FACTOR_INFO[f.factor as InvestmentFactor].color,
                  },
                ]}
              />
            </View>
          </View>
        ))}

        {/* Diversification score */}
        <View style={styles.divRow}>
          <Text style={styles.divLabel}>{t('factorAnalysis.factorBalance')}</Text>
          <Text
            style={[
              styles.divValue,
              { color: analysis.diversificationScore >= 7 ? PF.green : PF.orange },
            ]}
          >
            {analysis.diversificationScore}/10
          </Text>
        </View>
      </PerfGlassCard>

      {/* Recommendation */}
      <PerfGlassCard>
        <Text style={styles.recoText}>{analysis.recommendation}</Text>
      </PerfGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },
  factorRow: { marginBottom: 12 },
  factorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factorEmoji: { fontSize: 16, width: 24, textAlign: 'center' },
  factorName: { color: PF.textSecondary, fontSize: 12, flex: 1 },
  factorLevel: { fontSize: 10, fontWeight: '600', minWidth: 52, textAlign: 'right' },
  factorScore: { color: PF.textPrimary, fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  barBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 6 },
  barFill: { height: 6, borderRadius: 3, minWidth: 4 },
  divRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: PF.border,
    paddingTop: 10,
    marginTop: 4,
  },
  divLabel: { color: PF.textMuted, fontSize: 12, fontWeight: '600' },
  divValue: { fontSize: 14, fontWeight: '800' },
  recoText: { color: PF.textSecondary, fontSize: 13, lineHeight: 19 },
});
