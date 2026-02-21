import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChallengeRecord {
  challengeId: string;
  planWeek: number;
  calendarWeek: number;
  calendarYear: number;
  savoirRead: boolean;
  conditionMet: boolean;
  score: number;
  completedAt: string | null;
}

interface ChallengeState {
  records: ChallengeRecord[];

  markSavoirRead: (challengeId: string, planWeek: number, calWeek: number, calYear: number, savoirPoints: number) => void;
  markConditionMet: (challengeId: string, planWeek: number, calWeek: number, calYear: number, fairePoints: number, maitriserPoints: number) => void;
  markManualFaire: (challengeId: string, planWeek: number, calWeek: number, calYear: number, fairePoints: number, maitriserPoints: number) => void;
  getRecord: (challengeId: string, planWeek: number) => ChallengeRecord | undefined;
  clearChallenges: () => void;
  getCompletedCount: () => number;
  getRolling8Score: () => number;
}

function findOrCreateRecord(
  records: ChallengeRecord[],
  challengeId: string,
  planWeek: number,
  calWeek: number,
  calYear: number,
): { record: ChallengeRecord; isNew: boolean } {
  const existing = records.find(
    (r) => r.challengeId === challengeId && r.planWeek === planWeek,
  );
  if (existing) return { record: existing, isNew: false };
  return {
    record: {
      challengeId,
      planWeek,
      calendarWeek: calWeek,
      calendarYear: calYear,
      savoirRead: false,
      conditionMet: false,
      score: 0,
      completedAt: null,
    },
    isNew: true,
  };
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      records: [],

      markSavoirRead: (challengeId, planWeek, calWeek, calYear, savoirPoints) => {
        set((state) => {
          const { record, isNew } = findOrCreateRecord(
            state.records, challengeId, planWeek, calWeek, calYear,
          );
          if (record.savoirRead) return state;

          const updated: ChallengeRecord = {
            ...record,
            savoirRead: true,
            score: record.score + savoirPoints,
          };
          if (updated.savoirRead && updated.conditionMet && !updated.completedAt) {
            updated.completedAt = new Date().toISOString();
          }

          return {
            records: isNew
              ? [...state.records, updated]
              : state.records.map((r) =>
                  r.challengeId === challengeId && r.planWeek === planWeek ? updated : r,
                ),
          };
        });
      },

      markConditionMet: (challengeId, planWeek, calWeek, calYear, fairePoints, maitriserPoints) => {
        set((state) => {
          const { record, isNew } = findOrCreateRecord(
            state.records, challengeId, planWeek, calWeek, calYear,
          );
          if (record.conditionMet) return state;

          const updated: ChallengeRecord = {
            ...record,
            conditionMet: true,
            score: record.score + fairePoints + maitriserPoints,
          };
          if (updated.savoirRead && updated.conditionMet && !updated.completedAt) {
            updated.completedAt = new Date().toISOString();
          }

          return {
            records: isNew
              ? [...state.records, updated]
              : state.records.map((r) =>
                  r.challengeId === challengeId && r.planWeek === planWeek ? updated : r,
                ),
          };
        });
      },

      markManualFaire: (challengeId, planWeek, calWeek, calYear, fairePoints, maitriserPoints) => {
        // Same as markConditionMet — for manual challenges
        get().markConditionMet(challengeId, planWeek, calWeek, calYear, fairePoints, maitriserPoints);
      },

      getRecord: (challengeId, planWeek) => {
        return get().records.find(
          (r) => r.challengeId === challengeId && r.planWeek === planWeek,
        );
      },

      clearChallenges: () => {
        set({ records: [] });
      },

      getCompletedCount: () => {
        return get().records.filter((r) => r.savoirRead && r.conditionMet).length;
      },

      getRolling8Score: () => {
        const sorted = [...get().records]
          .sort((a, b) => b.planWeek - a.planWeek)
          .slice(0, 8);
        if (sorted.length === 0) return 0;
        const total = sorted.reduce((s, r) => s + r.score, 0);
        return Math.round(total / sorted.length);
      },
    }),
    {
      name: 'lele-pfm-challenges',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        records: state.records,
      }),
    },
  ),
);
