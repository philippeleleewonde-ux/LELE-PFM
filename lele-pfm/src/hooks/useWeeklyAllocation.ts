/**
 * useWeeklyAllocation — Cascade d'Allocation des Economies
 *
 * Distribue chaque franc d'economies realise dans un waterfall clair :
 *
 * ECONOMIES REALISEES (Budget - Depenses)
 *   │
 *   ├── Niveau 1 : EPR Provision (plancher discipline)
 *   │   = MIN(economies, target_hebdo)
 *   │   → mesure la note/grade
 *   │
 *   ├── Niveau 2 : SURPLUS = economies - EPR
 *   │
 *   │   ├── Poche PROJETS (objectifs d'epargne)
 *   │   │   = contributions manuelles + auto-allocations
 *   │   │   Plafonne au surplus disponible
 *   │   │
 *   │   ├── Poche EPARGNE (67% du reste)
 *   │   │   → matelas de securite long terme
 *   │   │
 *   │   └── Poche LIBERTE (33% du reste)
 *   │       → argent libre
 *   │       → achats impulsifs deduits en priorite
 *   │
 *   └── TOTAL = EPR + Projets + Epargne + Liberte = Economies ✓
 */

import { useMemo } from 'react';
import { useSavingsGoalStore, AllocationMode } from '@/stores/savings-goal-store';
import { useImpulseStore } from '@/stores/impulse-store';
import { useInvestmentStore } from '@/stores/investment-store';
import { WeeklySavingsResult } from '@/domain/calculators/weekly-savings-engine';
import { getWeekNumber, getISOYear } from '@/utils/week-helpers';

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

export interface WeeklyAllocation {
  // ── Source ──
  economies: number;

  // ── Niveau 1 : EPR (mesure discipline) ──
  eprProvision: number;
  eprTarget: number;
  eprAtteint: boolean;

  // ── Niveau 2 : Surplus ──
  surplus: number;

  // ── Poche Projets ──
  goalAllocations: GoalAllocation[];
  totalGoals: number;

  // ── Auto-allocations (pur calcul, pas de side-effect) ──
  pendingAutoAllocations: PendingAutoAllocation[];
  totalPendingAuto: number;

  // ── Distribution du reste (surplus - goals - pendingAuto) ──
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

    // ── Niveau 1 : EPR ──
    const eprAtteint = eprProvision >= weeklyTarget;

    // ── Niveau 2 : Manual goal contributions this week ──
    const goalAllocations: GoalAllocation[] = [];
    let rawGoalTotal = 0;

    for (const goal of goals) {
      // Include both active and recently completed goals for this week
      const weekContribs = goal.contributions.filter((c) => {
        const d = new Date(c.date);
        return getWeekNumber(d) === week && getISOYear(d) === year;
      });
      const total = weekContribs.reduce((s, c) => s + c.amount, 0);
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

    // Cap goal contributions to surplus
    const totalGoals = Math.min(rawGoalTotal, surplus);

    // ── Niveau 2b : Auto-allocations (pure calculation) ──
    const weekKey = `Auto S${week}-${year}`;
    const pendingAutoAllocations: PendingAutoAllocation[] = [];

    const activeAutoGoals = goals.filter(
      (g) => !g.isCompleted && g.allocation && g.allocation.mode !== 'manual'
    );

    for (const goal of activeAutoGoals) {
      const { allocation } = goal;
      const totalContributed = goal.contributions.reduce((s, c) => s + c.amount, 0);
      const remaining = Math.max(0, goal.targetAmount - totalContributed);
      if (remaining <= 0) continue;

      // Check if already done for this week
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
            Math.round(surplus * (allocation.percentAmount ?? 0) / 100),
            remaining
          );
          break;
      }

      if (desiredAmount > 0) {
        pendingAutoAllocations.push({
          goalId: goal.id,
          goalName: goal.name,
          desiredAmount,
          allocatedAmount: desiredAmount, // will be prorated below if needed
          mode: allocation.mode,
          weekKey,
          alreadyDone,
        });
      }
    }

    // Prorate if total desired exceeds available surplus (after manual goals)
    const availableSurplusForAuto = Math.max(0, surplus - totalGoals);
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

    // Total pending auto (only not-yet-done entries count towards remainder reduction)
    const totalPendingAuto = pendingAutoAllocations
      .filter((p) => !p.alreadyDone)
      .reduce((s, p) => s + p.allocatedAmount, 0);

    // ── Niveau 3 : Distribution du reste ──
    // Note: already-done auto allocations are already counted in goalAllocations
    // since they exist as real contributions. Only pending ones reduce remainder.
    const remainder = Math.max(0, surplus - totalGoals - totalPendingAuto);
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
    const availableForGoals = Math.max(0, surplus - totalGoals - totalPendingAuto);

    // Total epargne = EPR provision + epargne from distribution
    const totalEpargne = eprProvision + epargne;

    return {
      economies,
      eprProvision,
      eprTarget: weeklyTarget,
      eprAtteint,
      surplus,
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
