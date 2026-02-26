import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { usePerformanceStore } from '@/stores/performance-store';
import { addPlanContributionWithAudit } from '@/services/goal-contribution-service';
import { getWeeksBetween } from '@/utils/week-helpers';
import { formatCurrency } from '@/services/format-helpers';

/**
 * Sinking Fund / Standing Order / DCA — Automatic Plan Provisioning
 *
 * This hook MUST be called from a component that is ALWAYS rendered
 * (e.g. transactions.tsx), NOT from a conditionally-rendered component.
 *
 * For each active plan goal, fills missing weeks from
 * plan.startWeek to the VIEWED week (inclusive).
 *
 * Guardrails:
 *  b) If performance record exists with economies, caps to economies; otherwise honors plan commitment
 *  c) Caps plan contributions to estimatedWeeks — plan can't exceed its calendar
 *
 * Runs on mount + on every week navigation.
 *
 * Ref: Brealey & Myers (Sinking Fund), Standing Order, DCA
 */
export function usePlanProvisioning(week: number, year: number, _weeklyBudget: number) {
  const [catchUpBanner, setCatchUpBanner] = useState<string | null>(null);
  const { t } = useTranslation('tracking');

  useEffect(() => {
    // Read FRESH goals from store — avoids stale closure + feedback loop
    const freshGoals = useSavingsGoalStore.getState().goals;
    const activePlanGoals = freshGoals.filter(
      (g) => !g.isCompleted && g.plan && g.plan.status === 'active' && g.allocation?.mode === 'plan'
    );
    if (activePlanGoals.length === 0) return;

    // Read fresh performance records
    const perfStore = usePerformanceStore.getState();

    let totalNewAmount = 0;
    let totalNewCount = 0;

    for (const goal of activePlanGoals) {
      if (!goal.plan) continue;
      const { startWeek, startYear, estimatedWeeks: planMaxWeeks } = goal.plan;

      // Fill from plan start to VIEWED week (inclusive)
      const weeks = getWeeksBetween(startWeek, startYear, week, year);

      // Read latest contributions from store (not stale closure)
      const currentGoal = useSavingsGoalStore.getState().goals.find((g) => g.id === goal.id);
      if (!currentGoal) continue;

      // Guardrail (c): Count existing plan contributions — stop at estimatedWeeks
      const existingPlanContribs = currentGoal.contributions.filter((c) => c.source === 'plan').length;
      if (existingPlanContribs >= planMaxWeeks) continue;

      const storeContributed = currentGoal.contributions.reduce((s, c) => s + c.amount, 0);
      let cycleContributed = 0;
      let cyclePlanCount = existingPlanContribs;

      for (const { week: w, year: y } of weeks) {
        // Guardrail (c): Don't exceed plan calendar
        if (cyclePlanCount >= planMaxWeeks) break;

        const remaining = Math.max(0, goal.targetAmount - storeContributed - cycleContributed);
        if (remaining <= 0) break;

        const weekKey = `Plan S${w}-${y}`;

        // Skip if contribution already exists in store
        const latestGoal = useSavingsGoalStore.getState().goals.find((g) => g.id === goal.id);
        const alreadyContributed = latestGoal?.contributions.some(
          (c) => c.source === 'plan' && c.label === weekKey
        );
        if (alreadyContributed) continue;

        // Standing order: plan provisions weeklyAmount regardless of tracked expenses.
        // If a performance record exists with positive economies, cap to economies
        // to avoid over-provisioning beyond actual savings. Otherwise, honor the commitment.
        const perfRecord = perfStore.getWeekRecord(w, y);
        const amount = perfRecord && perfRecord.economies > 0
          ? Math.min(goal.plan.weeklyAmount, remaining, perfRecord.economies)
          : Math.min(goal.plan.weeklyAmount, remaining);
        if (amount > 0) {
          // Use audit service — creates plan contribution + audit transaction (ISA 500)
          addPlanContributionWithAudit(goal.id, amount, weekKey);
          cycleContributed += amount;
          cyclePlanCount++;
          totalNewAmount += amount;
          totalNewCount++;
        }
      }
    }

    if (totalNewCount > 0) {
      setCatchUpBanner(
        t('scenarios.catchUpBanner', {
          count: totalNewCount,
          amount: formatCurrency(totalNewAmount),
        })
      );
      setTimeout(() => setCatchUpBanner(null), 5000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, year]);

  return { catchUpBanner };
}
