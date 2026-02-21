import { create } from 'zustand';
import { Transaction, FilterParams, SortParams } from '@/types';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: FilterParams;
  sort: SortParams;
  selectedTransactionId: string | null;

  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterParams>) => void;
  setSort: (sort: SortParams) => void;
  selectTransaction: (id: string | null) => void;
  clearTransactions: () => void;
  getFilteredTransactions: () => Transaction[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  filters: {},
  sort: { field: 'date', direction: 'desc' },
  selectedTransactionId: null,

  setTransactions: (transactions) => set({ transactions }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  updateTransaction: (id, update) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...update } : t
      ),
    })),

  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setSort: (sort) => set({ sort }),

  selectTransaction: (id) => set({ selectedTransactionId: id }),

  clearTransactions: () =>
    set({
      transactions: [],
      selectedTransactionId: null,
      filters: {},
      error: null,
    }),

  getFilteredTransactions: () => {
    const state = get();
    let filtered = [...state.transactions];

    // Apply filters
    if (state.filters.startDate) {
      filtered = filtered.filter((t) => t.date >= state.filters.startDate!);
    }
    if (state.filters.endDate) {
      filtered = filtered.filter((t) => t.date <= state.filters.endDate!);
    }
    if (state.filters.categories && state.filters.categories.length > 0) {
      filtered = filtered.filter((t) =>
        state.filters.categories!.includes(t.categoryId)
      );
    }
    if (state.filters.accounts && state.filters.accounts.length > 0) {
      filtered = filtered.filter((t) =>
        state.filters.accounts!.includes(t.accountId)
      );
    }
    if (state.filters.minAmount !== undefined) {
      filtered = filtered.filter((t) => t.amount >= state.filters.minAmount!);
    }
    if (state.filters.maxAmount !== undefined) {
      filtered = filtered.filter((t) => t.amount <= state.filters.maxAmount!);
    }

    // Apply sort
    filtered.sort((a, b) => {
      let aVal = a[state.sort.field as keyof Transaction];
      let bVal = b[state.sort.field as keyof Transaction];

      if (typeof aVal === 'string') {
        return state.sort.direction === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      if (typeof aVal === 'number') {
        return state.sort.direction === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      return 0;
    });

    return filtered;
  },
}));
