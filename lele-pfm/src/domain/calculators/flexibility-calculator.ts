/**
 * Flexibility Calculator
 * Calculates financial flexibility score from three parameters (F1, F2, F3)
 * Formula: (F1 + F2 + F3) / 63 × 100
 */

import { FlexibilityScores, Expense } from '../engine/types';
import { capRealToPrevu, clamp, roundTo } from '../utils/math-utils';
import { validateFlexibilityParams, validateFlexibilityScore } from '../utils/validation';

export function calculateFlexibilityScore(
  f1: number,
  f2: number,
  f3: number
): FlexibilityScores {
  const validation = validateFlexibilityParams(f1, f2, f3);
  if (!validation.valid) {
    throw new Error(`Invalid flexibility parameters: ${validation.errors.join(', ')}`);
  }

  const sum = f1 + f2 + f3;
  const totalScore = (sum / 63) * 100;
  const clampedScore = clamp(totalScore, 0, 100);

  if (!validateFlexibilityScore(clampedScore)) {
    throw new Error(`Calculated flexibility score ${clampedScore} is invalid`);
  }

  return {
    f1,
    f2,
    f3,
    total_score: roundTo(clampedScore, 2),
  };
}

export function calculateF1FixedExpenseRigidity(
  fixedExpenses: number,
  totalExpenses: number
): number {
  if (totalExpenses === 0) {
    return 21;
  }

  const fixedRatio = Math.min(fixedExpenses / totalExpenses, 1);
  const f1 = 21 * (1 - fixedRatio);

  return clamp(f1, 0, 21);
}

export function calculateF2VariableFlexibility(
  variableExpenses: number,
  totalExpenses: number,
  meanFlexibility: number
): number {
  if (totalExpenses === 0) {
    return 21;
  }

  const variableRatio = Math.min(variableExpenses / totalExpenses, 1);
  const normalizedFlexibility = clamp(meanFlexibility / 100, 0, 1);
  const combinedScore = variableRatio * 0.5 + normalizedFlexibility * 0.5;
  const f2 = combinedScore * 21;

  return clamp(f2, 0, 21);
}

export function calculateF3BudgetCompliance(
  actualSpending: number,
  plannedSpending: number
): number {
  if (plannedSpending === 0) {
    return 21;
  }

  const cappedActual = capRealToPrevu(actualSpending, plannedSpending);
  const complianceRatio = cappedActual / plannedSpending;
  const f3 = complianceRatio * 21;

  return clamp(f3, 0, 21);
}

export function calculateTransactionEPR(
  montant: number,
  tauxIncompressibilite: number,
  scoreFlexibilite: number
): number {
  if (!Number.isInteger(montant) || montant < 0) {
    throw new Error('Montant must be a non-negative integer (cents)');
  }

  if (tauxIncompressibilite < 0 || tauxIncompressibilite > 100) {
    throw new Error('taux_incompressibilite must be 0-100');
  }

  if (scoreFlexibilite < 0 || scoreFlexibilite > 100) {
    throw new Error('score_flexibilite must be 0-100');
  }

  const incompressibilityFactor = 1 - tauxIncompressibilite / 100;
  const flexibilityFactor = scoreFlexibilite / 100;
  const epr = montant * incompressibilityFactor * flexibilityFactor;

  return Math.round(epr);
}

export function calculateAggregateEPR(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => {
    const montantAnnuel = expense.montant_annuel || (expense.montant_mensuel || 0) * 12;
    const epr = calculateTransactionEPR(
      montantAnnuel,
      expense.incompressibilite || 0,
      expense.flexibilite || 0
    );
    return total + epr;
  }, 0);
}

export function calculateCategoryFlexibility(expenses: Expense[]): {
  average_flexibility: number;
  average_incompressibility: number;
  count: number;
  total_amount: number;
} {
  if (expenses.length === 0) {
    return {
      average_flexibility: 0,
      average_incompressibility: 100,
      count: 0,
      total_amount: 0,
    };
  }

  let totalFlexibility = 0;
  let totalIncompressibility = 0;
  let totalAmount = 0;

  for (const expense of expenses) {
    totalFlexibility += expense.flexibilite || 0;
    totalIncompressibility += expense.incompressibilite || 0;
    totalAmount += expense.montant_annuel || (expense.montant_mensuel || 0) * 12;
  }

  return {
    average_flexibility: roundTo(totalFlexibility / expenses.length, 2),
    average_incompressibility: roundTo(totalIncompressibility / expenses.length, 2),
    count: expenses.length,
    total_amount: Math.round(totalAmount),
  };
}

export function calculateFlexibilityImprovement(
  f1Current: number,
  fixedExpenses: number,
  totalExpenses: number,
  incompressibilityReduction: number
): number {
  if (totalExpenses === 0) {
    return 0;
  }

  const reducedFixedExpenses = Math.max(
    0,
    fixedExpenses * (1 - incompressibilityReduction / 100)
  );

  const f1Improved = calculateF1FixedExpenseRigidity(reducedFixedExpenses, totalExpenses);

  return Math.max(0, f1Improved - f1Current);
}

export function getFlexibilityDescription(score: number): string {
  if (score < 10) return 'Very Rigid - Limited flexibility';
  if (score < 30) return 'Rigid - Low flexibility';
  if (score < 50) return 'Moderately Rigid - Some flexibility';
  if (score < 70) return 'Flexible - Good flexibility';
  if (score < 85) return 'Very Flexible - High flexibility';
  return 'Extremely Flexible - Maximum flexibility';
}

export function getFlexibilityRecommendations(
  f1: number,
  f2: number,
  f3: number
): string[] {
  const recommendations: string[] = [];

  if (f1 < 7) {
    recommendations.push(
      'Review fixed expenses: High rigid costs limit adaptability. Consider renegotiating contracts.'
    );
  }

  if (f2 < 7) {
    recommendations.push(
      'Increase variable spending flexibility: Identify discretionary expenses that can be reduced when needed.'
    );
  }

  if (f3 < 7) {
    recommendations.push(
      'Improve budget compliance: Track spending more carefully to stay within planned limits.'
    );
  }

  const total = f1 + f2 + f3;
  if (total < 21) {
    recommendations.push('Priority: Build an emergency fund to handle unexpected expenses.');
  } else if (total > 42) {
    recommendations.push('Your flexibility is strong. Consider investing excess savings.');
  }

  return recommendations;
}
