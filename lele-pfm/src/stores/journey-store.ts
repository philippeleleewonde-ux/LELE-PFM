import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  JourneyPhase,
  SelectedAsset,
  InvestmentStrategy,
  StrategyId,
  InvestmentDuration,
  RendezVousConfig,
  CheckInRecord,
  AdvisoryMessage,
  JourneyState,
} from '@/types/investor-journey';
import type { AssetClass } from '@/types/investment';

const DEFAULT_RENDEZ_VOUS: RendezVousConfig = {
  frequency: 'monthly',
  dayOfWeek: 0,
  reminderHoursBefore: 24,
  enabled: true,
};

const DEFAULT_STATE: JourneyState & { investedAmounts: Record<string, number> } = {
  currentPhase: 'recommendation',
  recommendedAssets: [],
  selectedAssets: [],
  activeStrategies: [],
  chosenStrategyId: null,
  investmentDuration: null,
  rendezVousConfig: DEFAULT_RENDEZ_VOUS,
  checkIns: [],
  advisoryMessages: [],
  procedureProgress: {},
  journeyStartedAt: null,
  lastCheckInAt: null,
  investedAmounts: {},
};

interface JourneyActions {
  setPhase: (phase: JourneyPhase) => void;
  setRecommendedAssets: (assets: SelectedAsset[]) => void;
  acceptAsset: (assetId: string) => void;
  rejectAsset: (assetId: string) => void;
  addCustomAsset: (asset: SelectedAsset) => void;
  removeCustomAsset: (assetId: string) => void;
  updateAssetAllocation: (assetId: string, percent: number) => void;
  setActiveStrategies: (strategies: InvestmentStrategy[]) => void;
  chooseStrategy: (strategyId: StrategyId) => void;
  setDuration: (duration: InvestmentDuration) => void;
  setRendezVousConfig: (config: RendezVousConfig) => void;
  addCheckIn: (checkIn: CheckInRecord) => void;
  addAdvisoryMessage: (message: AdvisoryMessage) => void;
  dismissAdvisory: (messageId: string) => void;
  toggleStepComplete: (assetId: string, stepOrder: number) => void;
  initProcedureProgress: (assetId: string, assetClass: AssetClass, countryCode: string) => void;
  setInvestedAmount: (assetId: string, amount: number) => void;
  startJourney: () => void;
  resetJourney: () => void;
  getAcceptedAssets: () => SelectedAsset[];
  getCompletionPercent: (assetId: string) => number;
  getPendingAdvisories: () => AdvisoryMessage[];
  getCheckInCount: () => number;
  getStreak: () => number;
}

type JourneyStore = JourneyState & { investedAmounts: Record<string, number> } & JourneyActions;

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setPhase: (phase) => set({ currentPhase: phase }),

      setRecommendedAssets: (assets) => set({ recommendedAssets: assets }),

      acceptAsset: (assetId) => {
        set((state) => {
          const recommendedAssets = state.recommendedAssets.map((a) =>
            a.id === assetId ? { ...a, status: 'accepted' as const } : a,
          );
          const existing = state.selectedAssets.find((a) => a.id === assetId);
          let selectedAssets: SelectedAsset[];
          if (existing) {
            selectedAssets = state.selectedAssets.map((a) =>
              a.id === assetId ? { ...a, status: 'accepted' as const } : a,
            );
          } else {
            const rec = recommendedAssets.find((a) => a.id === assetId);
            selectedAssets = rec
              ? [...state.selectedAssets, rec]
              : state.selectedAssets;
          }
          return { recommendedAssets, selectedAssets };
        });
      },

      rejectAsset: (assetId) => {
        set((state) => ({
          recommendedAssets: state.recommendedAssets.map((a) =>
            a.id === assetId ? { ...a, status: 'rejected' as const } : a,
          ),
          selectedAssets: state.selectedAssets.filter((a) => a.id !== assetId),
        }));
      },

      addCustomAsset: (asset) => {
        set((state) => ({
          selectedAssets: [
            ...state.selectedAssets,
            { ...asset, isCustom: true, status: 'custom' as const },
          ],
        }));
      },

      removeCustomAsset: (assetId) => {
        set((state) => ({
          selectedAssets: state.selectedAssets.filter((a) => a.id !== assetId),
        }));
      },

      updateAssetAllocation: (assetId, percent) => {
        set((state) => ({
          selectedAssets: state.selectedAssets.map((a) =>
            a.id === assetId ? { ...a, allocationPercent: percent } : a,
          ),
        }));
      },

      setActiveStrategies: (strategies) => set({ activeStrategies: strategies }),

      chooseStrategy: (strategyId) => set({ chosenStrategyId: strategyId }),

      setDuration: (duration) => set({ investmentDuration: duration }),

      setRendezVousConfig: (config) => set({ rendezVousConfig: config }),

      addCheckIn: (checkIn) => {
        set((state) => ({
          checkIns: [...state.checkIns, checkIn],
          lastCheckInAt: checkIn.date,
        }));
      },

      addAdvisoryMessage: (message) => {
        set((state) => ({
          advisoryMessages: [...state.advisoryMessages, message],
        }));
      },

      dismissAdvisory: (messageId) => {
        set((state) => ({
          advisoryMessages: state.advisoryMessages.map((m) =>
            m.id === messageId ? { ...m, dismissed: true } : m,
          ),
        }));
      },

      toggleStepComplete: (assetId, stepOrder) => {
        set((state) => {
          const progress = state.procedureProgress[assetId];
          if (!progress) return state;
          const completed = progress.completedSteps.includes(stepOrder)
            ? progress.completedSteps.filter((s) => s !== stepOrder)
            : [...progress.completedSteps, stepOrder];
          return {
            procedureProgress: {
              ...state.procedureProgress,
              [assetId]: {
                ...progress,
                completedSteps: completed,
                lastUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      initProcedureProgress: (assetId, assetClass, countryCode) => {
        set((state) => {
          if (state.procedureProgress[assetId]) return state;
          const now = new Date().toISOString();
          return {
            procedureProgress: {
              ...state.procedureProgress,
              [assetId]: {
                assetId,
                assetClass,
                countryCode,
                completedSteps: [],
                startedAt: now,
                lastUpdatedAt: now,
              },
            },
          };
        });
      },

      setInvestedAmount: (assetId, amount) => {
        set((state) => ({
          investedAmounts: {
            ...state.investedAmounts,
            [assetId]: amount,
          },
        }));
      },

      startJourney: () => set({ journeyStartedAt: new Date().toISOString() }),

      resetJourney: () => set({ ...DEFAULT_STATE }),

      // ─── Derived Getters ───

      getAcceptedAssets: () => {
        const { selectedAssets } = get();
        return selectedAssets.filter(
          (a) => a.status === 'accepted' || a.status === 'custom',
        );
      },

      getCompletionPercent: (assetId) => {
        const { procedureProgress } = get();
        const progress = procedureProgress[assetId];
        if (!progress) return 0;
        // totalSteps is tracked by completedSteps length vs known steps
        // Without a procedure definition loaded, we report based on completed count
        const completed = progress.completedSteps.length;
        if (completed === 0) return 0;
        // When procedures are loaded, consumers should compute total from procedure.steps.length
        return completed;
      },

      getPendingAdvisories: () => {
        const { advisoryMessages } = get();
        return advisoryMessages.filter((m) => !m.dismissed);
      },

      getCheckInCount: () => {
        return get().checkIns.length;
      },

      getStreak: () => {
        const { checkIns } = get();
        if (checkIns.length === 0) return 0;
        // Sort by date descending
        const sorted = [...checkIns].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        let streak = 0;
        for (const ci of sorted) {
          if (ci.status === 'missed') break;
          streak++;
        }
        return streak;
      },
    }),
    {
      name: 'lele-pfm-investor-journey',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentPhase: state.currentPhase,
        recommendedAssets: state.recommendedAssets,
        selectedAssets: state.selectedAssets,
        activeStrategies: state.activeStrategies,
        chosenStrategyId: state.chosenStrategyId,
        investmentDuration: state.investmentDuration,
        rendezVousConfig: state.rendezVousConfig,
        checkIns: state.checkIns,
        advisoryMessages: state.advisoryMessages,
        procedureProgress: state.procedureProgress,
        investedAmounts: state.investedAmounts,
        journeyStartedAt: state.journeyStartedAt,
        lastCheckInAt: state.lastCheckInAt,
      }),
    },
  ),
);
