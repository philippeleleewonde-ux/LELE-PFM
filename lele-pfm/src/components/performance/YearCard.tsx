import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressRing } from './ProgressRing';
import { PerfGlassCard, PF } from './shared';
import { formatCurrency } from '@/services/format-helpers';
import { YearPlan } from '@/hooks/usePerformanceData';

interface YearCardProps {
  plan: YearPlan;
}

export function YearCard({ plan }: YearCardProps) {
  const { t } = useTranslation('performance');
  const ringColor = plan.year === 1 ? PF.cyan : plan.year === 2 ? PF.blue : PF.green;

  return (
    <PerfGlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.yearLabel}>{plan.label}</Text>
        <View style={[styles.badge, { backgroundColor: ringColor + '20' }]}>
          <Text style={[styles.badgeText, { color: ringColor }]}>{plan.recoveryPercent}%</Text>
        </View>
      </View>

      {/* Ring + EPR */}
      <View style={styles.ringRow}>
        <ProgressRing progress={plan.recoveryPercent} size={70} strokeWidth={6} color={ringColor}>
          <Text style={[styles.ringPercent, { color: ringColor }]}>{plan.recoveryPercent}%</Text>
        </ProgressRing>
        <View style={styles.eprInfo}>
          <Text style={styles.eprLabel}>{t('yearCard.cashback')}</Text>
          <Text style={[styles.eprValue, { color: ringColor }]}>{formatCurrency(plan.epr)}</Text>
        </View>
      </View>

      {/* Boost split */}
      <View style={styles.splitRow}>
        <View style={styles.splitItem}>
          <Text style={styles.splitLabel}>{t('yearCard.boostSavings')}</Text>
          <Text style={styles.splitValue}>{formatCurrency(plan.epargne)}</Text>
        </View>
        <View style={styles.splitDivider} />
        <View style={styles.splitItem}>
          <Text style={styles.splitLabel}>{t('yearCard.boostFun')}</Text>
          <Text style={styles.splitValue}>{formatCurrency(plan.discretionnaire)}</Text>
        </View>
      </View>

      {/* Targets */}
      <View style={styles.targetRow}>
        <View style={styles.targetItem}>
          <Text style={styles.targetLabel}>{t('yearCard.monthly')}</Text>
          <Text style={styles.targetValue}>{formatCurrency(plan.monthlyTarget)}</Text>
        </View>
        <View style={styles.targetItem}>
          <Text style={styles.targetLabel}>{t('yearCard.weekly')}</Text>
          <Text style={styles.targetValue}>{formatCurrency(plan.weeklyTarget)}</Text>
        </View>
      </View>
    </PerfGlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearLabel: {
    color: PF.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  eprInfo: {
    flex: 1,
    gap: 4,
  },
  eprLabel: {
    color: PF.textSecondary,
    fontSize: 12,
  },
  eprValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitItem: {
    flex: 1,
    gap: 2,
  },
  splitDivider: {
    width: 1,
    height: 30,
    backgroundColor: PF.border,
  },
  splitLabel: {
    color: PF.textMuted,
    fontSize: 11,
  },
  splitValue: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  targetRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: PF.border,
  },
  targetItem: {
    flex: 1,
    gap: 2,
  },
  targetLabel: {
    color: PF.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  targetValue: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
