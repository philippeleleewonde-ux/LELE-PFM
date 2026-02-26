import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useWeeklyTracking } from '@/hooks/useWeeklyTracking';
import { useWeeklyAllocation } from '@/hooks/useWeeklyAllocation';
import { getCurrentWeek } from '@/utils/week-helpers';
import { formatCurrency } from '@/services/format-helpers';
import { SavingsGoalCard } from './SavingsGoalCard';
import type { SavingsGoal } from '@/stores/savings-goal-store';

interface SavingsGoalsSectionProps {
  onGoalPress: (goal: SavingsGoal) => void;
  onContribute: (goal: SavingsGoal) => void;
}

export function SavingsGoalsSection({ onGoalPress, onContribute }: SavingsGoalsSectionProps) {
  const { t } = useTranslation('tracking');
  const {
    activeGoals, completedGoals,
    thisWeekContributions, activeAutoGoalsCount,
    activePlanGoalsCount, totalPlanWeeklyCommitment,
  } = useSavingsGoals();
  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const weeklyTracking = useWeeklyTracking(currentWeek, currentYear);
  const allocation = useWeeklyAllocation(currentWeek, currentYear, weeklyTracking.savings);
  const surplusUsedPercent = allocation.surplus > 0
    ? Math.min(100, Math.round(((allocation.totalGoals + allocation.totalPendingPlan) / allocation.surplus) * 100))
    : 0;

  // Sort: active plan goals first, then auto legacy, then manual, then completed
  const sortedGoals = useMemo(() => {
    const planGoals = activeGoals.filter((g) => g.plan && g.plan.status === 'active');
    const pausedPlanGoals = activeGoals.filter((g) => g.plan && g.plan.status === 'paused');
    const autoGoals = activeGoals.filter((g) => !g.plan && g.allocation?.mode !== 'manual');
    const manualGoals = activeGoals.filter((g) => !g.plan && (!g.allocation || g.allocation.mode === 'manual'));
    return [...planGoals, ...pausedPlanGoals, ...autoGoals, ...manualGoals, ...completedGoals];
  }, [activeGoals, completedGoals]);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Target size={14} color="#22D3EE" />
        <Text style={styles.sectionTitle}>{t('goals.myGoals')}</Text>
      </View>

      {/* Summary row */}
      {(thisWeekContributions > 0 || activePlanGoalsCount > 0) && (
        <View style={styles.summaryRow}>
          {thisWeekContributions > 0 && (
            <Text style={styles.summaryText}>
              {t('goals.weeklyAllocated', { amount: formatCurrency(thisWeekContributions) })}
            </Text>
          )}
          {allocation.surplus > 0 && thisWeekContributions > 0 && (
            <Text style={styles.summaryPercent}>
              {surplusUsedPercent}% {t('goals.ofSurplus')}
            </Text>
          )}
          {activePlanGoalsCount > 0 && (
            <View style={styles.planSummaryBadge}>
              <Target size={10} color="#60A5FA" />
              <Text style={styles.planSummaryText}>
                {t('scenarios.activePlans', { count: activePlanGoalsCount })}
              </Text>
            </View>
          )}
          {totalPlanWeeklyCommitment > 0 && (
            <Text style={styles.commitmentText}>
              {t('scenarios.weeklyEngaged', { amount: formatCurrency(totalPlanWeeklyCommitment) })}
            </Text>
          )}
          {activeAutoGoalsCount > 0 && activePlanGoalsCount === 0 && (
            <View style={styles.autoBadge}>
              <Zap size={10} color="#A78BFA" />
              <Text style={styles.autoBadgeText}>{activeAutoGoalsCount} auto</Text>
            </View>
          )}
        </View>
      )}

      {sortedGoals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Target size={32} color="#52525B" />
          <Text style={styles.emptyTitle}>{t('goals.noGoals')}</Text>
          <Text style={styles.emptyText}>
            {t('goals.noGoalsHint')}
          </Text>
        </View>
      ) : (
        <>
          {sortedGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onPress={() => onGoalPress(goal)}
              onContribute={() => onContribute(goal)}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  summaryText: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryPercent: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
  },
  planSummaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  planSummaryText: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '700',
  },
  commitmentText: {
    color: '#52525B',
    fontSize: 9,
    fontWeight: '600',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  autoBadgeText: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#71717A',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: '#52525B',
    fontSize: 13,
    textAlign: 'center',
  },
});
