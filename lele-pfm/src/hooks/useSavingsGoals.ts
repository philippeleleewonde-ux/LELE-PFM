import { useMemo } from 'react';
import { useSavingsGoalStore, SavingsGoal } from '@/stores/savings-goal-store';
import { getWeekNumber, getISOYear } from '@/utils/week-helpers';

export interface SavingsGoalsAggregation {
  activeGoals: SavingsGoal[];
  completedGoals: SavingsGoal[];
  totalTargeted: number;
  totalContributed: number;
  globalProgress: number;
  thisWeekContributions: number;
  thisMonthContributions: number;
  thisWeekAutoContributions: number;
  thisWeekManualContributions: number;
  activeAutoGoalsCount: number;
  // ── Plan aggregation ──
  activePlanGoalsCount: number;
  totalPlanWeeklyCommitment: number;
  averagePlanAdherence: number;
  thisWeekPlanContributions: number;
  thisWeekExtraContributions: number;
}

export function useSavingsGoals(): SavingsGoalsAggregation {
  const goals = useSavingsGoalStore((s) => s.goals);

  return useMemo(() => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = getISOYear(now);
    const currentMonth = now.getMonth();
    const currentFullYear = now.getFullYear();

    const activeGoals = goals.filter((g) => !g.isCompleted);
    const completedGoals = goals.filter((g) => g.isCompleted);

    let totalTargeted = 0;
    let totalContributed = 0;
    let thisWeekContributions = 0;
    let thisMonthContributions = 0;
    let thisWeekAutoContributions = 0;
    let thisWeekManualContributions = 0;
    let thisWeekPlanContributions = 0;
    let thisWeekExtraContributions = 0;

    for (const goal of goals) {
      totalTargeted += goal.targetAmount;
      for (const c of goal.contributions) {
        totalContributed += c.amount;
        const cDate = new Date(c.date);
        const isThisWeek = getWeekNumber(cDate) === currentWeek && getISOYear(cDate) === currentYear;
        if (isThisWeek) {
          thisWeekContributions += c.amount;
          if (c.source === 'auto') {
            thisWeekAutoContributions += c.amount;
          } else if (c.source === 'plan') {
            thisWeekPlanContributions += c.amount;
          } else if (c.source === 'extra') {
            thisWeekExtraContributions += c.amount;
          } else {
            thisWeekManualContributions += c.amount;
          }
        }
        if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentFullYear) {
          thisMonthContributions += c.amount;
        }
      }
    }

    const activeAutoGoalsCount = goals.filter(
      (g) => !g.isCompleted && g.allocation?.mode !== 'manual'
    ).length;

    // ── Plan aggregation ──
    const activePlanGoals = goals.filter(
      (g) => !g.isCompleted && g.plan && g.plan.status === 'active'
    );
    const activePlanGoalsCount = activePlanGoals.length;
    const totalPlanWeeklyCommitment = activePlanGoals.reduce(
      (s, g) => s + (g.plan?.weeklyAmount ?? 0), 0
    );

    // Average adherence across active plan goals
    let adherenceSum = 0;
    let adherenceCount = 0;
    for (const g of activePlanGoals) {
      if (g.plan && g.plan.weeksExecuted > 0) {
        const expectedTotal = g.plan.weeklyAmount * g.plan.weeksExecuted;
        const adherence = expectedTotal > 0
          ? Math.min(100, Math.round((g.plan.planContributions / expectedTotal) * 100))
          : 0;
        adherenceSum += adherence;
        adherenceCount++;
      }
    }
    const averagePlanAdherence = adherenceCount > 0
      ? Math.round(adherenceSum / adherenceCount)
      : 0;

    const globalProgress = totalTargeted > 0
      ? Math.min(100, Math.round((totalContributed / totalTargeted) * 100))
      : 0;

    return {
      activeGoals,
      completedGoals,
      totalTargeted,
      totalContributed,
      globalProgress,
      thisWeekContributions,
      thisMonthContributions,
      thisWeekAutoContributions,
      thisWeekManualContributions,
      activeAutoGoalsCount,
      activePlanGoalsCount,
      totalPlanWeeklyCommitment,
      averagePlanAdherence,
      thisWeekPlanContributions,
      thisWeekExtraContributions,
    };
  }, [goals]);
}
