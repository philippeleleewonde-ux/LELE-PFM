import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncomeCode } from '@/constants/income-categories';

export interface IncomeTransaction {
  id: string;
  source: IncomeCode;
  label: string;
  amount: number;
  transaction_date: string;
  week_number: number;
  year: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface IncomeState {
  incomes: IncomeTransaction[];
  isLoading: boolean;

  addIncome: (tx: Omit<IncomeTransaction, 'id' | 'created_at' | 'updated_at'>) => void;
  deleteIncome: (id: string) => void;
  clearIncomes: () => void;
  getWeekIncomes: (week: number, year: number) => IncomeTransaction[];
  getWeekTotalBySource: (week: number, year: number) => Record<IncomeCode, number>;
  getWeekTotal: (week: number, year: number) => number;
}

export const useIncomeStore = create<IncomeState>()(
  persist(
    (set, get) => ({
      incomes: [],
      isLoading: false,

      addIncome: (tx) => {
        const now = new Date().toISOString();
        const newIncome: IncomeTransaction = {
          ...tx,
          id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: now,
          updated_at: now,
        };
        set((state) => ({
          incomes: [newIncome, ...state.incomes],
        }));
      },

      deleteIncome: (id) => {
        set((state) => ({
          incomes: state.incomes.filter((inc) => inc.id !== id),
        }));
      },

      clearIncomes: () => {
        set({ incomes: [] });
      },

      getWeekIncomes: (week, year) => {
        return get().incomes.filter(
          (inc) => inc.week_number === week && inc.year === year
        );
      },

      getWeekTotalBySource: (week, year) => {
        const incs = get().incomes.filter(
          (inc) => inc.week_number === week && inc.year === year
        );
        const totals = {} as Record<IncomeCode, number>;
        const codes: IncomeCode[] = [
          'salaire', 'primes', 'locatifs', 'aides',
          'freelance', 'dividendes', 'pension', 'autres_revenus',
        ];
        for (const code of codes) {
          totals[code] = 0;
        }
        for (const inc of incs) {
          if (totals[inc.source] !== undefined) {
            totals[inc.source] += inc.amount;
          }
        }
        return totals;
      },

      getWeekTotal: (week, year) => {
        return get()
          .incomes.filter((inc) => inc.week_number === week && inc.year === year)
          .reduce((sum, inc) => sum + inc.amount, 0);
      },
    }),
    {
      name: 'lele-pfm-incomes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        incomes: state.incomes,
      }),
    }
  )
);
