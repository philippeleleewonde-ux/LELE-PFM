import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DonutChart } from '../charts/DonutChart';
import { ProgressBar } from '../charts/ProgressBar';
import { PerfGlassCard, PF, COICOP_LABELS, COICOP_COLORS } from './shared';
import { CategoryItem } from '@/hooks/usePerformanceData';
import { formatCurrency, formatPercent } from '@/services/format-helpers';

interface SectionDProps {
  categories: CategoryItem[];
  elRevenue: number;
  elExpense: number;
  coherenceRatio: number;
}

export function SectionD_EconomicBreakdown({ categories, elRevenue, elExpense, coherenceRatio }: SectionDProps) {
  const { t } = useTranslation('performance');
  const donutData = categories.map((cat) => ({
    label: cat.label,
    value: cat.budgetRate,
    color: COICOP_COLORS[cat.code] || PF.textMuted,
  }));

  const totalEL = elRevenue + elExpense;
  const elRevPercent = totalEL > 0 ? (elRevenue / totalEL) * 100 : 50;
  const elExpPercent = totalEL > 0 ? (elExpense / totalEL) * 100 : 50;

  const coherenceColor = coherenceRatio < 85
    ? PF.green
    : coherenceRatio <= 100
    ? PF.orange
    : PF.red;

  return (
    <View style={styles.container}>
      {/* COICOP Donut */}
      <DonutChart
        data={donutData}
        size={150}
        strokeWidth={18}
        centerLabel={t('actions.budget')}
        centerValue="100%"
      />

      {/* EL Split bar */}
      <PerfGlassCard style={styles.splitCard}>
        <Text style={styles.splitTitle}>{t('economicBreakdown.costOrigins')}</Text>
        <View style={styles.stackedBar}>
          <View style={[styles.barSegment, { flex: elRevPercent, backgroundColor: PF.blue }]} />
          <View style={[styles.barSegment, { flex: elExpPercent, backgroundColor: PF.red }]} />
        </View>
        <View style={styles.splitLabels}>
          <View style={styles.splitItem}>
            <View style={[styles.dot, { backgroundColor: PF.blue }]} />
            <Text style={styles.splitLabel}>{t('economicBreakdown.revenueCosts')}</Text>
            <Text style={styles.splitValue}>{formatCurrency(elRevenue)}</Text>
          </View>
          <View style={styles.splitItem}>
            <View style={[styles.dot, { backgroundColor: PF.red }]} />
            <Text style={styles.splitLabel}>{t('economicBreakdown.expenseCosts')}</Text>
            <Text style={styles.splitValue}>{formatCurrency(elExpense)}</Text>
          </View>
        </View>
      </PerfGlassCard>

      {/* Coherence ratio */}
      <PerfGlassCard style={styles.coherenceCard}>
        <View style={styles.coherenceHeader}>
          <Text style={styles.coherenceTitle}>{t('economicBreakdown.financeBalance')}</Text>
          <Text style={[styles.coherenceValue, { color: coherenceColor }]}>
            {formatPercent(coherenceRatio, 1)}
          </Text>
        </View>
        <ProgressBar
          progress={Math.min(100, coherenceRatio)}
          color={coherenceColor}
          height={6}
        />
        <Text style={styles.coherenceHint}>
          {coherenceRatio < 85
            ? t('economicBreakdown.balanceGood')
            : coherenceRatio <= 100
            ? t('economicBreakdown.balanceWarning')
            : t('economicBreakdown.balanceAlert')}
        </Text>
      </PerfGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  splitCard: {
    gap: 10,
  },
  splitTitle: {
    color: PF.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barSegment: {
    height: 12,
  },
  splitLabels: {
    gap: 6,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  splitLabel: {
    flex: 1,
    color: PF.textSecondary,
    fontSize: 12,
  },
  splitValue: {
    color: PF.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  coherenceCard: {
    gap: 8,
  },
  coherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coherenceTitle: {
    color: PF.textSecondary,
    fontSize: 13,
  },
  coherenceValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  coherenceHint: {
    color: PF.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
