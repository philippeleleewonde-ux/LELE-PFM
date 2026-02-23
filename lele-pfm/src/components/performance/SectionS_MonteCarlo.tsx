import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { useEngineStore } from '@/stores/engine-store';
import { formatCurrency } from '@/services/format-helpers';
import { runMonteCarlo, MonteCarloResult } from '@/domain/calculators/monte-carlo-simulator';

// ─── Helpers ───

function lossColor(prob: number): string {
  if (prob < 10) return PF.green;
  if (prob <= 25) return PF.orange;
  return PF.red;
}

// ─── PercentileRow ───

function PercentileRow({
  label,
  value,
  color,
  maxValue,
}: {
  label: string;
  value: number;
  color: string;
  maxValue: number;
}) {
  const barWidth = maxValue > 0 ? Math.max(4, (value / maxValue) * 100) : 0;

  return (
    <View style={styles.pctRow}>
      <Text style={styles.pctLabel}>{label}</Text>
      <View style={styles.pctBarContainer}>
        <View style={[styles.pctBar, { width: `${barWidth}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pctValue, { color }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

// ─── Main Component ───

export function SectionS_MonteCarlo() {
  const { t } = useTranslation('performance');
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const allocations = useInvestmentStore((s) => s.allocations);

  const monthlyInvestCalc = useMemo(() => {
    if (!engineOutput || !investorProfile) return 0;
    return engineOutput.step9.epr_n1 * investorProfile.investmentRatio / 100 / 12;
  }, [engineOutput, investorProfile]);

  const result: MonteCarloResult | null = useMemo(() => {
    if (allocations.length === 0 || monthlyInvestCalc <= 0) return null;
    return runMonteCarlo(allocations, monthlyInvestCalc);
  }, [allocations, monthlyInvestCalc]);

  if (!investorProfile || !engineOutput) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('monteCarlo.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  if (!result) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('monteCarlo.noAllocation')}
        </Text>
      </PerfGlassCard>
    );
  }

  const maxVal = result.finalValues.best;
  const probColor = lossColor(result.probabilityOfLoss);

  return (
    <View style={styles.container}>
      {/* Distribution grid */}
      <PerfGlassCard>
        <Text style={styles.sectionTitle}>{t('monteCarlo.distribution')}</Text>

        <View style={styles.distGrid}>
          <PercentileRow
            label={t('monteCarlo.bestCase')}
            value={result.finalValues.best}
            color={PF.green}
            maxValue={maxVal}
          />
          <PercentileRow
            label={t('monteCarlo.favorable')}
            value={result.finalValues.aboveAvg}
            color={PF.greenLight}
            maxValue={maxVal}
          />
          <PercentileRow
            label={t('monteCarlo.median')}
            value={result.finalValues.median}
            color={PF.accent}
            maxValue={maxVal}
          />
          <PercentileRow
            label={t('monteCarlo.unfavorable')}
            value={result.finalValues.belowAvg}
            color={PF.orange}
            maxValue={maxVal}
          />
          <PercentileRow
            label={t('monteCarlo.worstCase')}
            value={result.finalValues.worst}
            color={PF.red}
            maxValue={maxVal}
          />
        </View>

        {/* Capital invested reference */}
        <View style={styles.refRow}>
          <Text style={styles.refLabel}>{t('monteCarlo.investedCapital')}</Text>
          <Text style={styles.refValue}>{formatCurrency(result.investedCapital)}</Text>
        </View>
      </PerfGlassCard>

      {/* Risk metrics */}
      <PerfGlassCard>
        <Text style={styles.sectionTitle}>{t('monteCarlo.riskMetrics')}</Text>

        {/* Probability of loss */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('monteCarlo.lossProb')}</Text>
          <Text style={[styles.metricValue, { color: probColor }]}>
            {result.probabilityOfLoss.toFixed(1)}%
          </Text>
        </View>

        {/* Loss bar */}
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(result.probabilityOfLoss, 100)}%`,
                backgroundColor: probColor,
              },
            ]}
          />
        </View>

        {/* Expected value */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('monteCarlo.expectedGain')}</Text>
          <Text style={[styles.metricValue, { color: PF.green }]}>
            {formatCurrency(result.expectedValue)}
          </Text>
        </View>

        {/* Confidence interval */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('monteCarlo.confidenceInterval')}</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(result.confidenceInterval.lower)} —{' '}
            {formatCurrency(result.confidenceInterval.upper)}
          </Text>
        </View>
      </PerfGlassCard>

      {/* Disclaimer */}
      <PerfGlassCard>
        <Text style={styles.infoText}>
          {t('monteCarlo.disclaimer')}
        </Text>
      </PerfGlassCard>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Distribution grid
  distGrid: { gap: 10 },
  pctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pctLabel: {
    color: PF.textSecondary,
    fontSize: 11,
    width: 130,
  },
  pctBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  pctBar: {
    height: 8,
    borderRadius: 4,
  },
  pctValue: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 90,
    textAlign: 'right',
  },

  // Capital reference
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: PF.border,
    paddingTop: 10,
    marginTop: 12,
  },
  refLabel: {
    color: PF.textMuted,
    fontSize: 12,
  },
  refValue: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Risk metrics
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    color: PF.textSecondary,
    fontSize: 12,
  },
  metricValue: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },

  // Info
  infoText: {
    color: PF.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
