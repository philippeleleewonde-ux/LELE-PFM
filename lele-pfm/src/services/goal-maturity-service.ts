/**
 * Goal Maturity Service — Atomic execution of goal expense validation
 *
 * Ensures ACID-like behavior: either both the transaction AND the goal flag
 * are set, or neither is. Prevents orphaned transactions (Bug #2).
 */

import { useTransactionStore } from '@/stores/transaction-store';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { COICOPCode } from '@/types';

export interface GoalMaturityParams {
  goalId: string;
  goalName: string;
  targetAmount: number;
  coicopCode: COICOPCode;
  transactionLabel: string;
  transactionNote: string;
  transactionDate: string;
  weekNumber: number;
  year: number;
}

export interface GoalMaturityResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export function executeGoalMaturity(params: GoalMaturityParams): GoalMaturityResult {
  const {
    goalId,
    targetAmount,
    coicopCode,
    transactionLabel,
    transactionNote,
    transactionDate,
    weekNumber,
    year,
  } = params;

  // Step 1: Validate preconditions
  const goal = useSavingsGoalStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) {
    return { success: false, error: 'Goal not found' };
  }
  if (!goal.isCompleted) {
    return { success: false, error: 'Goal is not completed yet' };
  }
  if (goal.expenseValidated) {
    return { success: false, error: 'Goal expense already validated' };
  }

  // Step 2: Create the transaction
  const txStore = useTransactionStore.getState();
  const txCountBefore = txStore.transactions.length;

  txStore.addTransaction({
    profile_id: 'local',
    type: 'Variable',
    category: coicopCode,
    label: transactionLabel,
    amount: targetAmount,
    payment_method: 'Virement',
    transaction_date: transactionDate,
    week_number: weekNumber,
    year,
    is_reconciled: false,
    notes: transactionNote,
    isGoalExpense: true,
    goalId,
  });

  // Step 3: Verify transaction was created
  const txStoreAfter = useTransactionStore.getState();
  if (txStoreAfter.transactions.length <= txCountBefore) {
    return { success: false, error: 'Transaction creation failed' };
  }

  const newTx = txStoreAfter.transactions[0]; // addTransaction prepends
  const transactionId = newTx.id;

  // Step 4: Validate the goal expense
  try {
    useSavingsGoalStore.getState().validateGoalExpense(goalId);
  } catch (err) {
    // Step 5: Rollback — remove orphaned transaction
    useTransactionStore.getState().deleteTransaction(transactionId);
    return { success: false, error: `Goal validation failed: ${err}` };
  }

  // Step 6: Verify the flag was set
  const goalAfter = useSavingsGoalStore.getState().goals.find((g) => g.id === goalId);
  if (!goalAfter?.expenseValidated) {
    // Rollback — remove orphaned transaction
    useTransactionStore.getState().deleteTransaction(transactionId);
    return { success: false, error: 'Goal expense flag not set after validation' };
  }

  return { success: true, transactionId };
}
