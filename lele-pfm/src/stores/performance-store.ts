import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Grade } from '@/types';

/**
 * Stored weekly performance record with savings data.
 */
export interface WeeklyRecord {
  id: string;
  week_number: number;
  year: number;
  /** Budget variable hebdo (plafond de dépense = Reste à vivre × 12 / 48) */
  weeklyBudget: number;
  /** Objectif d'épargne hebdo (weekly_target_n1 = EPR / 48) */
  weeklyTarget: number;
  /** Actual spending */
  weeklySpent: number;
  /** Économies réelles = MAX(0, budget - spent) */
  economies: number;
  /** Économies totales = economies (pas de cap en finance perso) */
  economiesCappees: number;
  /** Provision EPR = MIN(économies, target) — cashback minimum garanti */
  eprProvision?: number;
  /** Surplus = MAX(0, économies - target) — capital libre au-dessus de l'EPR */
  surplus?: number;
  /** Dépassement = MAX(0, spent - budget) */
  depassement: number;
  /** Note 0-10 */
  note: number;
  /** Grade A+ to E */
  grade: Grade;
  /** 67% des économies totales */
  epargne: number;
  /** Part investissement des économies totales (defaut: 0) */
  investissement: number;
  /** Part discrétionnaire des économies totales */
  discretionnaire: number;
  /** Budget was respected (spent ≤ budget) */
  budgetRespecte: boolean;
  /** Taux d'exécution (spent/budget %) */
  tauxExecution: number;
  /** Score financier dynamique (5 leviers) — Phase D */
  financialScore?: number;
  /** Scores individuels des 5 leviers {REG: 78, PRE: 62, ...} */
  leverScores?: Record<string, number>;
  /** Poche epargne post-allocation waterfall (EPR exclu) */
  waterfallEpargne?: number;
  /** Poche liberte post-allocation waterfall */
  waterfallDiscretionnaire?: number;
  /** Total epargne = EPR + waterfallEpargne */
  waterfallTotalEpargne?: number;
  /** Total alloue aux objectifs cette semaine */
  waterfallGoalAllocations?: number;
  /** Total plan ring-fence cette semaine */
  waterfallPlanAllocations?: number;
  /** Schema version for migration */
  _schemaVersion?: number;
  /** When this record was saved */
  savedAt: string;
}

interface PerformanceState {
  records: WeeklyRecord[];

  /** Save or update a weekly performance record */
  saveWeeklyRecord: (record: Omit<WeeklyRecord, 'id' | 'savedAt'>) => void;

  /** Get record for a specific week */
  getWeekRecord: (week: number, year: number) => WeeklyRecord | undefined;

  /** Get all records for a year */
  getYearRecords: (year: number) => WeeklyRecord[];

  /** Get records for weeks in a given range */
  getRecordsForWeeks: (weeks: number[], year: number) => WeeklyRecord[];

  /** Delete a record */
  deleteRecord: (id: string) => void;

  /** Clear all records */
  clearRecords: () => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      records: [],

      saveWeeklyRecord: (record) => {
        const existing = get().records.find(
          (r) => r.week_number === record.week_number && r.year === record.year,
        );

        if (existing) {
          // Update existing
          set((state) => ({
            records: state.records.map((r) =>
              r.id === existing.id
                ? { ...r, ...record, savedAt: new Date().toISOString() }
                : r,
            ),
          }));
        } else {
          // Create new
          const newRecord: WeeklyRecord = {
            ...record,
            id: `perf-${record.year}-w${record.week_number}-${Date.now()}`,
            savedAt: new Date().toISOString(),
          };
          set((state) => ({
            records: [...state.records, newRecord],
          }));
        }
      },

      getWeekRecord: (week, year) => {
        return get().records.find(
          (r) => r.week_number === week && r.year === year,
        );
      },

      getYearRecords: (year) => {
        return get()
          .records.filter((r) => r.year === year)
          .sort((a, b) => a.week_number - b.week_number);
      },

      getRecordsForWeeks: (weeks, year) => {
        const weekSet = new Set(weeks);
        return get()
          .records.filter((r) => r.year === year && weekSet.has(r.week_number))
          .sort((a, b) => a.week_number - b.week_number);
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },

      clearRecords: () => {
        set({ records: [] });
      },
    }),
    {
      name: 'lele-pfm-performance',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ records: state.records }),
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === undefined) {
          // v0 → v1: mark existing records with _schemaVersion: 0
          const state = persistedState as { records: any[] };
          if (state.records) {
            state.records = state.records.map((r: any) => ({
              ...r,
              _schemaVersion: r._schemaVersion ?? 0,
            }));
          }
        }
        return persistedState as any;
      },
    },
  ),
);
