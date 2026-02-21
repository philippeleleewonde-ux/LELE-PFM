import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COICOPCode } from '@/types';

export interface CompensationEntry {
  category: COICOPCode;
  weeklyReduction: number;
  totalWeeks: number;
  startWeek: number;
  startYear: number;
}

export interface ImpulsePurchase {
  id: string;
  label: string;
  amount: number;
  category: COICOPCode;
  date: string;
  week_number: number;
  year: number;
  mode: 'wealth' | 'control';
  verdict: 'can_afford' | 'cannot_afford' | 'compensated';
  compensations: CompensationEntry[];
}

export interface ActiveCompensation {
  category: COICOPCode;
  weeklyReduction: number;
  purchaseLabel: string;
}

interface ImpulseState {
  purchases: ImpulsePurchase[];
  addPurchase: (p: Omit<ImpulsePurchase, 'id'>) => void;
  clearPurchases: () => void;
  getActiveCompensations: (week: number, year: number) => ActiveCompensation[];
}

function isCompensationActive(
  comp: CompensationEntry,
  week: number,
  year: number,
): boolean {
  // Convert to absolute week index for cross-year comparison
  const compAbsolute = comp.startYear * 52 + comp.startWeek;
  const currentAbsolute = year * 52 + week;
  return currentAbsolute >= compAbsolute && currentAbsolute < compAbsolute + comp.totalWeeks;
}

export const useImpulseStore = create<ImpulseState>()(
  persist(
    (set, get) => ({
      purchases: [],

      addPurchase: (p) => {
        const newPurchase: ImpulsePurchase = {
          ...p,
          id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };
        set((state) => ({
          purchases: [newPurchase, ...state.purchases],
        }));
      },

      clearPurchases: () => {
        set({ purchases: [] });
      },

      getActiveCompensations: (week, year) => {
        const result: ActiveCompensation[] = [];
        for (const purchase of get().purchases) {
          for (const comp of purchase.compensations) {
            if (isCompensationActive(comp, week, year)) {
              result.push({
                category: comp.category,
                weeklyReduction: comp.weeklyReduction,
                purchaseLabel: purchase.label,
              });
            }
          }
        }
        return result;
      },
    }),
    {
      name: 'lele-pfm-impulse',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        purchases: state.purchases,
      }),
    }
  )
);
