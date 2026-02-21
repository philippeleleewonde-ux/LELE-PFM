import { useMemo } from 'react';
import { useTransactionStore } from '@/stores/transaction-store';
import { Transaction } from '@/types/database';

export function useDashboardData() {
  const transactions = useTransactionStore((s) => s.transactions);

  const recentTransactions = useMemo<Transaction[]>(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [transactions]);

  return {
    recentTransactions,
    isLoading: false,
  };
}
