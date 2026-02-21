import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EngineOutput } from '@/types';

export interface IncomeTarget {
  monthlyAmount: number;
}

interface EngineState {
  engineOutput: EngineOutput | null;
  currency: string;
  isCalculating: boolean;
  lastCalculatedAt: string | null;
  incomeTargets: Record<string, IncomeTarget> | null;
  setEngineOutput: (output: EngineOutput) => void;
  setCurrency: (currency: string) => void;
  clearEngineOutput: () => void;
  setCalculating: (calculating: boolean) => void;
  setIncomeTargets: (targets: Record<string, IncomeTarget>) => void;
}

export const useEngineStore = create<EngineState>()(
  persist(
    (set) => ({
      engineOutput: null,
      currency: 'FCFA',
      isCalculating: false,
      lastCalculatedAt: null,
      incomeTargets: null,

      setEngineOutput: (output: EngineOutput) => {
        set({
          engineOutput: output,
          lastCalculatedAt: new Date().toISOString(),
          isCalculating: false,
        });
      },

      setCurrency: (currency: string) => {
        set({ currency });
      },

      clearEngineOutput: () => {
        set({
          engineOutput: null,
          lastCalculatedAt: null,
          isCalculating: false,
        });
      },

      setCalculating: (calculating: boolean) => {
        set({ isCalculating: calculating });
      },

      setIncomeTargets: (targets: Record<string, IncomeTarget>) => {
        set({ incomeTargets: targets });
      },
    }),
    {
      name: 'lele-pfm-engine',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        engineOutput: state.engineOutput,
        currency: state.currency,
        lastCalculatedAt: state.lastCalculatedAt,
        incomeTargets: state.incomeTargets,
      }),
    }
  )
);
