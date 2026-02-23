import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import {
  analyzeAllWeather,
  type ScenarioProtection,
} from '@/domain/calculators/all-weather-engine';

// ─── Asset label keys (for adjustments display via i18n) ───

const ASSET_LABEL_KEYS: Record<string, string> = {
  savings_account: 'allWeather.assetLabels.savings_account',
  term_deposit: 'allWeather.assetLabels.term_deposit',
  government_bonds: 'allWeather.assetLabels.government_bonds',
  corporate_bonds: 'allWeather.assetLabels.corporate_bonds',
  stock_index: 'allWeather.assetLabels.stock_index',
  local_stocks: 'allWeather.assetLabels.local_stocks',
  real_estate_fund: 'allWeather.assetLabels.real_estate_fund',
  gold: 'allWeather.assetLabels.gold',
  crypto: 'allWeather.assetLabels.crypto',
  tontine: 'allWeather.assetLabels.tontine',
  micro_enterprise: 'allWeather.assetLabels.micro_enterprise',
  money_market: 'allWeather.assetLabels.money_market',
  sukuk: 'allWeather.assetLabels.sukuk',
  mutual_fund: 'allWeather.assetLabels.mutual_fund',
};

// ─── Status rendering ───

function statusIcon(status: ScenarioProtection['status']): string {
  switch (status) {
    case 'strong': return '\u2705';
    case 'moderate': return '\u26a0\ufe0f';
    case 'weak': return '\u274c';
  }
}

function statusColor(status: ScenarioProtection['status']): string {
  switch (status) {
    case 'strong': return PF.green;
    case 'moderate': return PF.orange;
    case 'weak': return PF.red;
  }
}

// ─── Component ───

export function SectionP_AllWeather() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const analysis = useMemo(() => {
    if (allocations.length === 0) return null;
    return analyzeAllWeather(allocations);
  }, [allocations]);

  if (!investorProfile || !analysis) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('allWeather.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scenario resilience */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('allWeather.macroResilience')}</Text>
        <View style={styles.scenarioList}>
          {analysis.scenarios.map((s) => (
            <View key={s.scenario} style={styles.scenarioRow}>
              <Text style={styles.scenarioIcon}>{statusIcon(s.status)}</Text>
              <Text style={styles.scenarioLabel}>{s.label}</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${s.score}%`,
                      backgroundColor: statusColor(s.status),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.scenarioScore, { color: statusColor(s.status) }]}>
                {s.score}%
              </Text>
            </View>
          ))}
        </View>

        {/* Overall score */}
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>{t('globalScore')}</Text>
          <Text
            style={[
              styles.overallValue,
              {
                color:
                  analysis.overallScore > 70
                    ? PF.green
                    : analysis.overallScore >= 40
                      ? PF.orange
                      : PF.red,
              },
            ]}
          >
            {analysis.overallScore}%
          </Text>
        </View>

        {/* Recommendation */}
        <Text style={styles.recommendationText}>{analysis.recommendation}</Text>
      </PerfGlassCard>

      {/* Suggested adjustments */}
      {analysis.suggestedAdjustments.length > 0 && (
        <PerfGlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('allWeather.recommendations')}</Text>
          <View style={styles.adjustmentList}>
            {analysis.suggestedAdjustments.map((adj) => (
              <View key={adj.asset} style={styles.adjustmentRow}>
                <View style={styles.adjustmentHeader}>
                  <Text style={styles.adjustmentAsset}>
                    {ASSET_LABEL_KEYS[adj.asset] ? t(ASSET_LABEL_KEYS[adj.asset]) : adj.asset}
                  </Text>
                  <View style={styles.adjustmentWeights}>
                    <Text style={styles.weightCurrent}>{adj.currentWeight}%</Text>
                    <Text style={styles.weightArrow}>{'\u2192'}</Text>
                    <Text style={styles.weightSuggested}>{adj.suggestedWeight}%</Text>
                  </View>
                </View>
                <Text style={styles.adjustmentReason}>{adj.reason}</Text>
              </View>
            ))}
          </View>
        </PerfGlassCard>
      )}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
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

  // Scenarios
  scenarioList: { gap: 10 },
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scenarioIcon: { fontSize: 14, width: 20, textAlign: 'center' },
  scenarioLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    width: 90,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  scenarioScore: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },

  // Overall
  overallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: PF.border,
    paddingTop: 10,
    marginTop: 12,
  },
  overallLabel: {
    color: PF.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  overallValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Recommendation
  recommendationText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  // Adjustments
  adjustmentList: { gap: 10 },
  adjustmentRow: {
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
    paddingBottom: 8,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adjustmentAsset: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  adjustmentWeights: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightCurrent: {
    color: PF.textMuted,
    fontSize: 12,
  },
  weightArrow: {
    color: PF.textMuted,
    fontSize: 12,
  },
  weightSuggested: {
    color: PF.green,
    fontSize: 12,
    fontWeight: '700',
  },
  adjustmentReason: {
    color: PF.textMuted,
    fontSize: 11,
  },
});
