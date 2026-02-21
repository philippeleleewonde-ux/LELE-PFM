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

    for (const goal of goals) {
      totalTargeted += goal.targetAmount;
      for (const c of goal.contributions) {
        totalContributed += c.amount;
        const cDate = new Date(c.date);
        if (getWeekNumber(cDate) === currentWeek && getISOYear(cDate) === currentYear) {
          thisWeekContributions += c.amount;
        }
        if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentFullYear) {
          thisMonthContributions += c.amount;
        }
      }
    }

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
    };
  }, [goals]);
}
