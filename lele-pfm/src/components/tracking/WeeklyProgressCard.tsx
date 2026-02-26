import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { TrendingUp, TrendingDown, PiggyBank, Shield, Target } from 'lucide-react-native';

const VIOLET = '#A78BFA';

interface WeeklyProgressCardProps {
  weeklyBudget: number;
  weeklyTarget: number;
  weeklySpent: number;
  weeklyRemaining: number;
  progressPercent: number;
  projectedWeekTotal: number;
  isOnTrack: boolean;
  planYear: 1 | 2 | 3;
  currentQuarter: 1 | 2 | 3 | 4;
  /** When true, all dynamic colors switch to violet to signal temporary compensation */
  hasActiveCompensation?: boolean;
  /** Total engaged by active savings plans (Sinking Fund) — 0 if none */
  planCommitment?: number;
  /** Budget effectif after all deductions (compensation + plan) */
  effectiveBudget?: number;
}

export function WeeklyProgressCard({
  weeklyBudget,
  weeklyTarget,
  weeklySpent,
  weeklyRemaining,
  progressPercent,
  projectedWeekTotal,
  isOnTrack,
  planYear,
  currentQuarter,
  hasActiveCompensation = false,
  planCommitment = 0,
  effectiveBudget,
}: WeeklyProgressCardProps) {
  const { t } = useTranslation('tracking');
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  // When compensation active, all dynamic colors → violet
  const barColor = hasActiveCompensation
    ? VIOLET
    : progressPercent > 100
      ? '#F87171'
      : progressPercent > 80
      ? '#FBBF24'
      : '#4ADE80';

  const barWidth = Math.min(progressPercent, 100);

  // Economies reelles = Budget net - Depense (si positif)
  // Base sur effectiveBudget (post-compensation + post-plan) pour refléter le vrai disponible
  const netBudget = effectiveBudget ?? weeklyBudget;
  const actualSavings = Math.max(0, netBudget - weeklySpent);
  const savingsOnTrack = actualSavings >= weeklyTarget;
  const hasPlan = planCommitment > 0;

  return (
    <GlassCard variant="dark" style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>{t('progress.spent')}</Text>
          <Text style={[styles.spent, { color: barColor }, isSmall && { fontSize: 20 }]}>
            {formatCurrency(weeklySpent)}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <View style={hasActiveCompensation ? styles.budgetCompRow : undefined}>
            {hasActiveCompensation && <Shield size={12} color={VIOLET} />}
            <Text style={styles.label}>{t('progress.budget')}</Text>
          </View>
          <Text style={[styles.budgetValue, isSmall && { fontSize: 15 }, hasActiveCompensation && { color: VIOLET }]}>{formatCurrency(weeklyBudget)}</Text>
          {hasPlan && (
            <>
              <View style={styles.planDeductRow}>
                <Target size={10} color="#60A5FA" />
                <Text style={styles.planDeductText}>
                  {t('scenarios.planEngagement')}: -{formatCurrency(planCommitment)}
                </Text>
              </View>
              <Text style={styles.netBudgetText}>
                {t('scenarios.netBudget')}: {formatCurrency(netBudget)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.remainingRow}>
          <Text style={styles.remainingLabel}>{t('progress.remaining')} </Text>
          <Text style={[styles.remainingValue, { color: hasActiveCompensation ? VIOLET : weeklyRemaining > 0 ? '#4ADE80' : '#F87171' }]}>
            {formatCurrency(weeklyRemaining)}
          </Text>
        </View>

        <View style={styles.projectionRow}>
          {isOnTrack ? (
            <TrendingDown size={14} color={hasActiveCompensation ? VIOLET : '#4ADE80'} />
          ) : (
            <TrendingUp size={14} color={hasActiveCompensation ? VIOLET : '#F87171'} />
          )}
          <Text style={[styles.projectionText, { color: hasActiveCompensation ? VIOLET : isOnTrack ? '#4ADE80' : '#F87171' }]}>
            {formatCurrency(projectedWeekTotal)} {t('progress.projected')}
          </Text>
        </View>
      </View>

      {/* Savings section */}
      {weeklyTarget > 0 && (
        <View style={styles.savingsRow}>
          <View style={styles.savingsDivider} />
          <View style={styles.savingsContent}>
            <PiggyBank size={16} color={hasActiveCompensation ? VIOLET : '#FBBF24'} />
            <View style={styles.savingsColumns}>
              <View style={styles.savingsCol}>
                <Text style={styles.savingsColLabel}>{t('progress.saved')}</Text>
                <Text style={[styles.savingsColValue, { color: hasActiveCompensation ? VIOLET : savingsOnTrack ? '#4ADE80' : '#FBBF24' }]}>
                  {formatCurrency(actualSavings)}
                </Text>
              </View>
              <View style={[styles.savingsCol, styles.savingsColRight]}>
                <Text style={styles.savingsColLabel}>{t('progress.eprTarget')} (An{planYear} T{currentQuarter})</Text>
                <Text style={[styles.savingsTargetValue, hasActiveCompensation && { color: VIOLET }]}>{formatCurrency(weeklyTarget)}</Text>
              </View>
            </View>
          </View>
          {/* Savings progress bar — uncapped to show bonus above target */}
          <View style={styles.savingsBarBg}>
            <View
              style={[
                styles.savingsBarFill,
                {
                  width: `${Math.min(weeklyTarget > 0 ? (actualSavings / weeklyTarget) * 100 : 0, 100)}%`,
                  backgroundColor: hasActiveCompensation ? VIOLET : savingsOnTrack ? '#4ADE80' : '#FBBF24',
                },
              ]}
            />
          </View>
          {/* EPR status label */}
          {actualSavings > 0 && (
            <Text style={[styles.eprStatusText, { color: hasActiveCompensation ? VIOLET : savingsOnTrack ? '#4ADE80' : '#A1A1AA' }]}>
              {savingsOnTrack
                ? `${t('progress.eprReached')}${actualSavings > weeklyTarget ? ` (+${formatCurrency(actualSavings - weeklyTarget)} ${t('progress.bonus')})` : ''}`
                : `${t('progress.eprLabel')} ${Math.round((actualSavings / weeklyTarget) * 100)}%`
              }
            </Text>
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  label: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  spent: {
    fontSize: 24,
    fontWeight: '800',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  budgetCompRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  planDeductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  planDeductText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '600',
  },
  netBudgetText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  barBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainingLabel: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  remainingValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  savingsRow: {
    marginTop: 8,
  },
  savingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savingsColumns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  savingsCol: {
    flex: 1,
    flexShrink: 1,
  },
  savingsColRight: {
    alignItems: 'flex-end',
  },
  savingsColLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  savingsColValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  savingsTargetValue: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '600',
  },
  savingsBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  savingsBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  eprStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
});
