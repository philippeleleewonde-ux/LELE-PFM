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
 *   │   │   = contributions aux goals cette semaine
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
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
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

  // ── Distribution du reste (surplus - goals) ──
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

    // ── Niveau 2 : Goal contributions this week ──
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

    // ── Niveau 3 : Distribution du reste ──
    const remainder = Math.max(0, surplus - totalGoals);
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
    const availableForGoals = Math.max(0, surplus - totalGoals);

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
