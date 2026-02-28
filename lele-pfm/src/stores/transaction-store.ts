import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, COICOPCode } from '@/types';
import { COICOP_CATEGORIES } from '@/constants';
import { getCurrentWeek } from '@/utils/week-helpers';

interface TransactionState {
  transactions: Transaction[];
  currentWeek: number;
  currentYear: number;
  isLoading: boolean;

  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;
  setCurrentWeek: (week: number, year: number) => void;
  getWeekTransactions: (week: number, year: number) => Transaction[];
  getWeekTotalByCategory: (week: number, year: number) => Record<COICOPCode, number>;
  getWeekTotal: (week: number, year: number) => number;
  getDayTransactions: (dateISO: string) => Transaction[];
}

const { week: initWeek, year: initYear } = getCurrentWeek();

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      currentWeek: initWeek,
      currentYear: initYear,
      isLoading: false,

      addTransaction: (tx) => {
        const now = new Date().toISOString();
        const newTransaction: Transaction = {
          ...tx,
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: now,
          updated_at: now,
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates, updated_at: new Date().toISOString() } : tx
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },

      clearTransactions: () => {
        set({ transactions: [] });
      },

      setCurrentWeek: (week, year) => {
        set({ currentWeek: week, currentYear: year });
      },

      getWeekTransactions: (week, year) => {
        return get().transactions.filter(
          (tx) => tx.week_number === week && tx.year === year
        );
      },

      getWeekTotalByCategory: (week, year) => {
        const txs = get().transactions.filter(
          (tx) => tx.week_number === week && tx.year === year
        );
        const totals = {} as Record<COICOPCode, number>;
        for (const code of Object.keys(COICOP_CATEGORIES) as COICOPCode[]) {
          totals[code] = 0;
        }
        for (const tx of txs) {
          if (totals[tx.category] !== undefined) {
            totals[tx.category] += tx.amount;
          }
        }
        return totals;
      },

      getWeekTotal: (week, year) => {
        return get()
          .transactions.filter((tx) => tx.week_number === week && tx.year === year)
          .reduce((sum, tx) => sum + tx.amount, 0);
      },

      getDayTransactions: (dateISO) => {
        return get().transactions.filter(
          (tx) => tx.transaction_date.startsWith(dateISO)
        );
      },
    }),
    {
      name: 'lele-pfm-transactions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        // Don't persist currentWeek/currentYear — always start on current week
      }),
    }
  )
);
