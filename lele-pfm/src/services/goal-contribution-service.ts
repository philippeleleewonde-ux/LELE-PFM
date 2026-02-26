/**
 * Goal Contribution Service — Audit Trail (ISA 500)
 *
 * Every goal contribution creates a matching internal transfer transaction
 * in the transaction store for audit traceability.
 *
 * Internal transfers:
 * - Have isInternalTransfer=true (excluded from weeklySpent)
 * - Have transferType='goal_contribution'
 * - Are visible in transaction history for audit purposes
 * - Do NOT affect budget/economies calculations
 *
 * Ref: ISA 500 (Éléments probants), IAS 1.15 (Image fidèle)
 */

import { useTransactionStore } from '@/stores/transaction-store';
import { useSavingsGoalStore, ContributionSource } from '@/stores/savings-goal-store';
import { GOAL_ICON_TO_COICOP } from '@/constants/goal-categories';
import { COICOPCode } from '@/types';
import { getWeekNumber, getISOYear, formatDateISO } from '@/utils/week-helpers';

// ─── Manual / Extra contributions ───

export function addContributionWithAudit(
  goalId: string,
  amount: number,
  label: string,
  source: ContributionSource = 'manual',
) {
  if (amount <= 0) return;

  const goal = useSavingsGoalStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) return;

  // 1. Add contribution to goal store
  if (source === 'extra') {
    useSavingsGoalStore.getState().addExtraContribution(goalId, amount, label);
  } else {
    useSavingsGoalStore.getState().addContribution(goalId, amount, label, source);
  }

  // 2. Create audit trail transaction
  createAuditTransaction(goalId, goal.name, amount, label, source);
}

// ─── Auto contributions (batch) ───

export function addAutoContributionsWithAudit(
  entries: Array<{ goalId: string; amount: number; weekKey: string }>,
) {
  if (entries.length === 0) return;

  // 1. Add contributions to goal store (batch)
  useSavingsGoalStore.getState().addAutoContributions(entries);

  // 2. Create audit trail for each entry
  const goals = useSavingsGoalStore.getState().goals;
  for (const entry of entries) {
    if (entry.amount <= 0) continue;
    const goal = goals.find((g) => g.id === entry.goalId);
    if (!goal) continue;
    createAuditTransaction(entry.goalId, goal.name, entry.amount, entry.weekKey, 'auto');
  }
}

// ─── Plan contributions ───

export function addPlanContributionWithAudit(
  goalId: string,
  amount: number,
  weekKey: string,
) {
  if (amount <= 0) return;

  const goal = useSavingsGoalStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) return;

  // 1. Add plan contribution to goal store
  useSavingsGoalStore.getState().addPlanContribution(goalId, amount, weekKey);

  // 2. Create audit trail transaction
  createAuditTransaction(goalId, goal.name, amount, weekKey, 'plan');
}

// ─── Internal: create the audit transaction ───

function createAuditTransaction(
  goalId: string,
  goalName: string,
  amount: number,
  label: string,
  source: ContributionSource,
) {
  const now = new Date();
  const coicopCode = getGoalCoicop(goalId) ?? '07'; // fallback to recreation

  // Dedup: check if audit transaction already exists for this contribution
  const existing = useTransactionStore.getState().transactions.find(
    (tx) =>
      tx.isInternalTransfer &&
      tx.goalId === goalId &&
      tx.notes === label &&
      tx.transferType === 'goal_contribution',
  );
  if (existing) return; // already audited

  // Source tag in label for audit traceability (manual/auto/plan/extra)
  const sourceTag = source !== 'manual' ? ` [${source}]` : '';

  useTransactionStore.getState().addTransaction({
    profile_id: 'local',
    type: 'Épargne-Dette',
    category: coicopCode,
    label: `↗ ${goalName}${sourceTag}`,
    amount,
    payment_method: 'Virement',
    transaction_date: formatDateISO(now),
    week_number: getWeekNumber(now),
    year: getISOYear(now),
    is_reconciled: true,
    notes: label,
    isInternalTransfer: true,
    transferType: 'goal_contribution',
    goalId,
  });
}

function getGoalCoicop(goalId: string): COICOPCode | undefined {
  const goal = useSavingsGoalStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) return undefined;
  return GOAL_ICON_TO_COICOP[goal.icon];
}
