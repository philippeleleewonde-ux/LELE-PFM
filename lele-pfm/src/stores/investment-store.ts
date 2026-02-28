import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InvestorProfile,
  AllocationRecommendation,
  WeeklyInvestmentRecord,
  PillarAllocation,
  MissionRecord,
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

  pillarAllocations: PillarAllocation[];
  setPillarAllocations: (allocs: PillarAllocation[]) => void;

  missions: MissionRecord[];
  completeMission: (templateId: string) => void;
  skipMission: (templateId: string) => void;

  strategyGeneratedAt: string | null;
  setStrategyGeneratedAt: (date: string) => void;

  getTotalInvested: () => number;
  getInvestedThisWeek: (week: number, year: number) => number;
}

export const useInvestmentStore = create<InvestmentState>()(
  persist(
    (set, get) => ({
      investorProfile: null,
      allocations: [],
      investmentRecords: [],
      pillarAllocations: [],
      missions: [],
      strategyGeneratedAt: null,

      setInvestorProfile: (profile) => set({ investorProfile: profile }),
      clearInvestorProfile: () => set({ investorProfile: null, allocations: [], pillarAllocations: [] }),
      clearInvestmentRecords: () => set({ investmentRecords: [] }),

      setAllocations: (allocs) => set({ allocations: allocs }),

      setPillarAllocations: (allocs) => set({ pillarAllocations: allocs }),

      completeMission: (templateId) => {
        const now = new Date();
        set((state) => ({
          missions: [
            ...state.missions,
            {
              templateId,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              status: 'completed' as const,
              completedAt: now.toISOString(),
            },
          ],
        }));
      },

      skipMission: (templateId) => {
        const now = new Date();
        set((state) => ({
          missions: [
            ...state.missions,
            {
              templateId,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              status: 'skipped' as const,
            },
          ],
        }));
      },

      setStrategyGeneratedAt: (date) => set({ strategyGeneratedAt: date }),

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
        pillarAllocations: state.pillarAllocations,
        missions: state.missions,
        strategyGeneratedAt: state.strategyGeneratedAt,
      }),
    },
  ),
);
