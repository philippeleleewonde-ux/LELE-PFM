import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { useActiveCompensations } from '@/hooks/useActiveCompensations';
import { getCOICOPCategory } from '@/constants';

interface ActiveCompensationCardProps {
  week: number;
  year: number;
}

export function ActiveCompensationCard({ week, year }: ActiveCompensationCardProps) {
  const { t } = useTranslation('tracking');
  const { hasActiveCompensations, byPurchase, totalWeeklyReduction } = useActiveCompensations(week, year);

  if (!hasActiveCompensations) return null;

  return (
    <GlassCard variant="dark" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Shield size={16} color="#A78BFA" />
        <Text style={styles.title}>{t('compensation.title')}</Text>
      </View>

      {/* Purchase groups */}
      {byPurchase.map((group) => {
        const progress = group.currentWeekIndex / group.maxTotalWeeks;
        const isLastWeek = group.compensations.every((c) => c.remainingWeeks === 0);
        const totalRemaining = group.compensations.reduce((s, c) => s + c.remainingToCompensate, 0);

        return (
          <View key={group.purchaseId} style={styles.purchaseGroup}>
            {/* Purchase label + amount */}
            <View style={styles.purchaseHeader}>
              <Text style={styles.purchaseLabel} numberOfLines={1}>
                "{group.label}"
              </Text>
              <Text style={styles.purchaseAmount}>
                {formatCurrency(group.amount)}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>

            {/* Week progress + last week badge */}
            <View style={styles.weekRow}>
              <Text style={styles.weekText}>
                {t('compensation.weekProgress', { current: group.currentWeekIndex, total: group.maxTotalWeeks })}
              </Text>
              {isLastWeek && (
                <View style={styles.lastWeekBadge}>
                  <Text style={styles.lastWeekText}>{t('compensation.lastWeek')}</Text>
                </View>
              )}
            </View>

            {/* Category reductions */}
            {group.compensations.map((comp, idx) => {
              const cat = getCOICOPCategory(comp.category);
              const catLabel = cat?.label ?? comp.category;
              return (
                <Text key={idx} style={styles.reductionText}>
                  {t('compensation.weeklyReduction', { amount: formatCurrency(comp.weeklyReduction) })} sur {catLabel}
                </Text>
              );
            })}

            {/* Remaining to compensate */}
            {totalRemaining > 0 && (
              <Text style={styles.remainingText}>
                {t('compensation.remaining')} : {formatCurrency(totalRemaining)}
              </Text>
            )}
          </View>
        );
      })}

      {/* Total reductions this week */}
      {byPurchase.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('compensation.totalReduction')}</Text>
          <Text style={styles.totalValue}>-{formatCurrency(totalWeeklyReduction)}</Text>
        </View>
      )}
    </GlassCard>
  );
}

const VIOLET = '#A78BFA';
const VIOLET_DIM = 'rgba(167,139,250,0.15)';
const VIOLET_BORDER = 'rgba(167,139,250,0.25)';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: VIOLET_BORDER,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: VIOLET,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  purchaseGroup: {
    backgroundColor: VIOLET_DIM,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purchaseLabel: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  purchaseAmount: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: VIOLET,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  weekText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  lastWeekBadge: {
    backgroundColor: 'rgba(251,189,35,0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lastWeekText: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '700',
  },
  reductionText: {
    color: VIOLET,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  remainingText: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  totalLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  totalValue: {
    color: VIOLET,
    fontSize: 14,
    fontWeight: '800',
  },
});
