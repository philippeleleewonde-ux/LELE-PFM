import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InvestorProfile,
  AllocationRecommendation,
  WeeklyInvestmentRecord,
} from '@/types/investment';

interface InvestmentState {
  investorProfile: InvestorProfile | null;
  setInvestorProfile: (profile: InvestorProfile) => void;
  clearInvestorProfile: () => void;

  allocations: AllocationRecommendation[];
  setAllocations: (allocs: AllocationRecommendation[]) => void;

  investmentRecords: WeeklyInvestmentRecord[];
  addInvestmentRecord: (record: WeeklyInvestmentRecord) => void;
  clearInvestmentRecords: () => void;

  getTotalInvested: () => number;
  getInvestedThisWeek: (week: number, year: number) => number;
}

export const useInvestmentStore = create<InvestmentState>()(
  persist(
    (set, get) => ({
      investorProfile: null,
      allocations: [],
      investmentRecords: [],

      setInvestorProfile: (profile) => set({ investorProfile: profile }),
      clearInvestorProfile: () => set({ investorProfile: null, allocations: [] }),
      clearInvestmentRecords: () => set({ investmentRecords: [] }),

      setAllocations: (allocs) => set({ allocations: allocs }),

      addInvestmentRecord: (record) => {
        set((state) => {
          const existing = state.investmentRecords.findIndex(
            (r) => r.week_number === record.week_number && r.year === record.year,
          );
          if (existing >= 0) {
            const updated = [...state.investmentRecords];
            updated[existing] = record;
            return { investmentRecords: updated };
          }
          return { investmentRecords: [...state.investmentRecords, record] };
        });
      },

      getTotalInvested: () => {
        return get().investmentRecords.reduce((sum, r) => sum + r.amount, 0);
      },

      getInvestedThisWeek: (week, year) => {
        const record = get().investmentRecords.find(
          (r) => r.week_number === week && r.year === year,
        );
        return record?.amount ?? 0;
      },
    }),
    {
      name: 'lele-pfm-investment',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        investorProfile: state.investorProfile,
        allocations: state.allocations,
        investmentRecords: state.investmentRecords,
      }),
    },
  ),
);
