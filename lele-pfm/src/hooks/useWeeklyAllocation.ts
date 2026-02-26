/**
 * useWeeklyAllocation — Cascade d'Allocation des Economies
 *
 * Distribue chaque franc d'economies realise dans un waterfall clair :
 *
 * ECONOMIES REALISEES (Budget - Depenses)
 *   │
 *   ├── Niveau 0 : PLAN RING-FENCE (Sinking Fund / LDI / DCA)
 *   │   = MIN(planDesired, economies)
 *   │   → obligation contractuelle, prioritaire
 *   │   → Ref: Brealey & Myers (Sinking Fund), Das (GBI)
 *   │
 *   ├── Niveau 1 : EPR Provision (plancher discipline)
 *   │   = MIN(economies, target_hebdo)
 *   │   → mesure la note/grade (scoring inchange)
 *   │
 *   ├── Niveau 2 : SURPLUS AJUSTE = MAX(0, economies - planAllocated - EPR)
 *   │   [surplus = ce qui reste apres plan + EPR]
 *   │
 *   │   ├── Poche PROJETS (contributions manuelles + auto legacy)
 *   │   │
 *   │   ├── Poche EPARGNE (67% du reste)
 *   │   │   → matelas de securite long terme
 *   │   │
 *   │   └── Poche LIBERTE (33% du reste)
 *   │       → argent libre
 *   │       → achats impulsifs deduits en priorite
 *   │
 *   └── TOTAL = Plan + EPR(net) + Projets + Epargne + Liberte = Economies ✓
 */

import { useMemo } from 'react';
import { useSavingsGoalStore, AllocationMode } from '@/stores/savings-goal-store';
import { useImpulseStore } from '@/stores/impulse-store';
import { useInvestmentStore } from '@/stores/investment-store';
import { WeeklySavingsResult } from '@/domain/calculators/weekly-savings-engine';
import { getWeekNumber, getISOYear } from '@/utils/week-helpers';
import type { ScenarioId } from '@/domain/calculators/savings-scenario-engine';

// ─── Distribution ratios (same as weekly-savings-engine) ───
const EPARGNE_RATIO = 0.67;
const DISCRETIONNAIRE_RATIO = 0.33;

// ─── Types ───

export interface GoalAllocation {
  goalId: string;
  goalName: string;
  goalIcon: string;
  goalColor: string;
  amount: number;
}

export interface PendingAutoAllocation {
  goalId: string;
  goalName: string;
  desiredAmount: number;
  allocatedAmount: number;
  mode: AllocationMode;
  weekKey: string;
  alreadyDone: boolean;
}

export interface PlanAllocationInfo {
  goalId: string;
  goalName: string;
  planWeeklyAmount: number;     // engagement plan
  actualAllocated: number;      // reel cette semaine
  isPartial: boolean;           // actual < planned
  scenarioId: ScenarioId;
  alreadyDone: boolean;         // plan contribution already made this week
}

export interface WeeklyAllocation {
  // ── Source ──
  economies: number;

  // ── Niveau 0 : Plan ring-fence (Sinking Fund) ──
  planAllocations: PlanAllocationInfo[];
  totalPendingPlan: number;

  // ── Niveau 1 : EPR (mesure discipline) ──
  eprProvision: number;
  eprTarget: number;
  eprAtteint: boolean;

  // ── Niveau 2 : Surplus ajuste ──
  surplus: number;         // surplus brut (economies - EPR)
  adjustedSurplus: number; // surplus apres plan ring-fence

  // ── Poche Projets ──
  goalAllocations: GoalAllocation[];
  totalGoals: number;

  // ── Auto-allocations (pur calcul, pas de side-effect) ──
  pendingAutoAllocations: PendingAutoAllocation[];
  totalPendingAuto: number;

  // ── Distribution du reste ──
  remainder: number;
  epargne: number;        // 67% du remainder
  investissement: number; // part investissement (si profil investisseur)
  discretionnaire: number; // 33% du remainder

  // ── Compensation impulsifs ──
  impulseTotal: number;
  impulseCompensation: number;
  discretionnaireNet: number;
  impulseDebt: number;   // impulsifs non couverts par liberte

  // ── Informationnel ──
  economiesIfNoImpulse: number; // economies hypothetiques sans impulsifs

  // ── Pour le ContributeGoalModal ──
  availableForGoals: number; // combien on peut encore verser cette semaine

  // ── Totaux pour affichage ──
  totalEpargne: number; // EPR + epargne (tout ce qui va en securite)
}

// ─── Hook ───

export function useWeeklyAllocation(
  week: number,
  year: number,
  savings: WeeklySavingsResult,
): WeeklyAllocation {
  const goals = useSavingsGoalStore((s) => s.goals);
  const impulsePurchases = useImpulseStore((s) => s.purchases);
  const investmentRatio = useInvestmentStore((s) => s.investorProfile?.investmentRatio ?? 0);

  return useMemo(() => {
    const { economies, eprProvision, surplus, weeklyTarget } = savings;

    // ═══════════════════════════════════════════════════════════════
    // NIVEAU 0 : PLAN RING-FENCE (Sinking Fund / LDI / DCA)
    // Plans are funded from TOTAL economies, not just surplus.
    // This is the contractual obligation — ring-fenced, prioritaire.
    // ═══════════════════════════════════════════════════════════════
    const planWeekKey = `Plan S${week}-${year}`;
    const planAllocations: PlanAllocationInfo[] = [];

    const activePlanGoals = goals.filter(
      (g) => !g.isCompleted && g.plan && g.plan.status === 'active' && g.allocation?.mode === 'plan'
    );

    for (const goal of activePlanGoals) {
      if (!goal.plan) continue;
      const totalContributed = goal.contributions.reduce((s, c) => s + c.amount, 0);
      const planRemaining = Math.max(0, goal.targetAmount - totalContributed);

      const doneContrib = goal.contributions.find(
        (c) => c.source === 'plan' && c.label === planWeekKey
      );

      if (doneContrib) {
        // Already executed this week — show as done
        planAllocations.push({
          goalId: goal.id,
          goalName: goal.name,
          planWeeklyAmount: goal.plan.weeklyAmount,
          actualAllocated: doneContrib.amount,
          isPartial: doneContrib.amount < goal.plan.weeklyAmount,
          scenarioId: goal.plan.scenarioId,
          alreadyDone: true,
        });
      } else if (planRemaining > 0 && economies > 0) {
        // Pending — fund from total economies (ring-fenced)
        const desiredAmount = Math.min(goal.plan.weeklyAmount, planRemaining);
        planAllocations.push({
          goalId: goal.id,
          goalName: goal.name,
          planWeeklyAmount: goal.plan.weeklyAmount,
          actualAllocated: desiredAmount,
          isPartial: false,
          scenarioId: goal.plan.scenarioId,
          alreadyDone: false,
        });
      }
    }

    // Prorate pending plans if total exceeds available economies
    const donePlanAllocations = planAllocations.filter((p) => p.alreadyDone);
    const pendingPlanAllocations = planAllocations.filter((p) => !p.alreadyDone);
    const totalDonePlan = donePlanAllocations.reduce((s, p) => s + p.actualAllocated, 0);
    const totalPendingPlanDesired = pendingPlanAllocations.reduce((s, p) => s + p.actualAllocated, 0);

    // Plan draws from total economies (ring-fence)
    const availableForPlans = Math.max(0, economies - totalDonePlan);

    if (totalPendingPlanDesired > availableForPlans && totalPendingPlanDesired > 0) {
      const ratio = availableForPlans / totalPendingPlanDesired;
      for (const p of pendingPlanAllocations) {
        p.actualAllocated = Math.round(p.actualAllocated * ratio);
        p.isPartial = p.actualAllocated < p.planWeeklyAmount;
      }
    }

    const totalPendingPlan = totalDonePlan + pendingPlanAllocations.reduce((s, p) => s + p.actualAllocated, 0);

    // ═══════════════════════════════════════════════════════════════
    // NIVEAU 1 : EPR (scoring inchange)
    // EPR measures discipline: economies vs target. Not affected by plan.
    // ═══════════════════════════════════════════════════════════════
    const eprAtteint = eprProvision >= weeklyTarget;

    // ═══════════════════════════════════════════════════════════════
    // NIVEAU 2 : SURPLUS AJUSTE
    // After plan ring-fence, what's left for distribution
    // adjustedSurplus = MAX(0, economies - planAllocated - eprProvision)
    // ═══════════════════════════════════════════════════════════════
    const adjustedSurplus = Math.max(0, economies - totalPendingPlan - eprProvision);

    // ── Manual/extra goal contributions this week ──
    const goalAllocations: GoalAllocation[] = [];
    let rawGoalTotal = 0;

    for (const goal of goals) {
      const weekContribs = goal.contributions.filter((c) => {
        const d = new Date(c.date);
        return getWeekNumber(d) === week && getISOYear(d) === year;
      });
      // Plan/auto contributions shown separately
      const hasPlanMode = goal.plan && goal.allocation?.mode === 'plan';
      const relevantContribs = hasPlanMode
        ? weekContribs.filter((c) => c.source === 'manual' || c.source === 'extra')
        : weekContribs.filter((c) => c.source !== 'auto');
      const total = relevantContribs.reduce((s, c) => s + c.amount, 0);
      if (total > 0) {
        goalAllocations.push({
          goalId: goal.id,
          goalName: goal.name,
          goalIcon: goal.icon,
          goalColor: goal.color,
          amount: total,
        });
        rawGoalTotal += total;
      }
    }

    const totalGoals = Math.min(rawGoalTotal, adjustedSurplus);

    // ── Auto-allocations (legacy modes: fixed/deadline/percent) ──
    const weekKey = `Auto S${week}-${year}`;
    const pendingAutoAllocations: PendingAutoAllocation[] = [];

    const activeAutoGoals = goals.filter(
      (g) => !g.isCompleted && g.allocation && g.allocation.mode !== 'manual' && g.allocation.mode !== 'plan'
    );

    for (const goal of activeAutoGoals) {
      const { allocation } = goal;
      const totalContributed = goal.contributions.reduce((s, c) => s + c.amount, 0);
      const remaining = Math.max(0, goal.targetAmount - totalContributed);
      if (remaining <= 0) continue;

      const alreadyDone = goal.contributions.some(
        (c) => c.source === 'auto' && c.label === weekKey
      );

      let desiredAmount = 0;

      switch (allocation.mode) {
        case 'fixed':
          desiredAmount = Math.min(allocation.fixedAmount ?? 0, remaining);
          break;

        case 'deadline': {
          if (!goal.deadline) break;
          const deadlineDate = new Date(goal.deadline);
          const now = new Date();
          const msPerWeek = 7 * 24 * 60 * 60 * 1000;
          const weeksToDeadline = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerWeek));
          desiredAmount = Math.min(Math.ceil(remaining / weeksToDeadline), remaining);
          break;
        }

        case 'percent':
          desiredAmount = Math.min(
            Math.round(adjustedSurplus * (allocation.percentAmount ?? 0) / 100),
            remaining
          );
          break;
      }

      if (desiredAmount > 0) {
        pendingAutoAllocations.push({
          goalId: goal.id,
          goalName: goal.name,
          desiredAmount,
          allocatedAmount: desiredAmount,
          mode: allocation.mode,
          weekKey,
          alreadyDone,
        });
      }
    }

    // Prorate auto-allocations if needed
    const availableSurplusForAuto = Math.max(0, adjustedSurplus - totalGoals);
    const totalDesired = pendingAutoAllocations
      .filter((p) => !p.alreadyDone)
      .reduce((s, p) => s + p.desiredAmount, 0);

    if (totalDesired > availableSurplusForAuto && totalDesired > 0) {
      const ratio = availableSurplusForAuto / totalDesired;
      for (const p of pendingAutoAllocations) {
        if (!p.alreadyDone) {
          p.allocatedAmount = Math.round(p.desiredAmount * ratio);
        }
      }
    }

    const totalPendingAuto = pendingAutoAllocations
      .filter((p) => !p.alreadyDone)
      .reduce((s, p) => s + p.allocatedAmount, 0);

    // ═══════════════════════════════════════════════════════════════
    // NIVEAU 3 : Distribution du reste
    // remainder = adjustedSurplus - goals - auto
    // ═══════════════════════════════════════════════════════════════
    const remainder = Math.max(0, adjustedSurplus - totalGoals - totalPendingAuto);
    const investRatio = investmentRatio / 100;
    const effectiveEpargneRatio = EPARGNE_RATIO - investRatio;

    const epargne = Math.round(remainder * effectiveEpargneRatio);
    const investissement = Math.round(remainder * investRatio);
    const discretionnaire = Math.round(remainder * DISCRETIONNAIRE_RATIO);

    // ── Niveau 4 : Compensation impulsifs ──
    const weekImpulses = impulsePurchases.filter(
      (p) => p.week_number === week && p.year === year,
    );
    const impulseTotal = weekImpulses.reduce((s, p) => s + p.amount, 0);
    const impulseCompensation = Math.min(impulseTotal, discretionnaire);
    const discretionnaireNet = discretionnaire - impulseCompensation;
    const impulseDebt = Math.max(0, impulseTotal - discretionnaire);

    // ── Informationnel ──
    const economiesIfNoImpulse = economies + impulseTotal;
    const availableForGoals = Math.max(0, adjustedSurplus - totalGoals - totalPendingAuto);

    // Total epargne = EPR provision + epargne from distribution
    const totalEpargne = eprProvision + epargne;

    return {
      economies,
      eprProvision,
      eprTarget: weeklyTarget,
      eprAtteint,
      surplus,
      adjustedSurplus,
      planAllocations,
      totalPendingPlan,
      goalAllocations,
      totalGoals,
      pendingAutoAllocations,
      totalPendingAuto,
      remainder,
      epargne,
      investissement,
      discretionnaire,
      impulseTotal,
      impulseCompensation,
      discretionnaireNet,
      impulseDebt,
      economiesIfNoImpulse,
      availableForGoals,
      totalEpargne,
    };
  }, [savings, goals, impulsePurchases, week, year, investmentRatio]);
}
