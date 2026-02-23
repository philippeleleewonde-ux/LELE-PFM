import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalIcon } from '@/constants/goal-categories';

// ─── Allocation types ───

export type ContributionSource = 'manual' | 'auto';
export type AllocationMode = 'manual' | 'fixed' | 'deadline' | 'percent';

export interface AllocationConfig {
  mode: AllocationMode;
  fixedAmount?: number;
  percentAmount?: number;
}

// ─── Core types ───

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  label: string;
  date: string;
  created_at: string;
  source: ContributionSource;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  deadline: string | null;
  icon: GoalIcon;
  color: string;
  contributions: GoalContribution[];
  isCompleted: boolean;
  completedAt: string | null;
  created_at: string;
  updated_at: string;
  allocation: AllocationConfig;
}

interface SavingsGoalState {
  goals: SavingsGoal[];

  addGoal: (goal: Omit<SavingsGoal, 'id' | 'contributions' | 'isCompleted' | 'completedAt' | 'created_at' | 'updated_at'>) => void;
  updateGoal: (id: string, updates: Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'deadline' | 'icon' | 'color'>>) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, label: string, source?: ContributionSource) => void;
  deleteContribution: (goalId: string, contributionId: string) => void;
  addAutoContributions: (entries: Array<{ goalId: string; amount: number; weekKey: string }>) => void;
  updateAllocation: (goalId: string, allocation: AllocationConfig) => void;
  clearGoals: () => void;
  getActiveGoals: () => SavingsGoal[];
  getCompletedGoals: () => SavingsGoal[];
}

export const useSavingsGoalStore = create<SavingsGoalState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => {
        const now = new Date().toISOString();
        const newGoal: SavingsGoal = {
          ...goal,
          id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          contributions: [],
          isCompleted: false,
          completedAt: null,
          created_at: now,
          updated_at: now,
          allocation: goal.allocation ?? { mode: 'manual' },
        };
        set((state) => ({
          goals: [newGoal, ...state.goals],
        }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, ...updates, updated_at: new Date().toISOString() }
              : g
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      addContribution: (goalId, amount, label, source = 'manual') => {
        const now = new Date().toISOString();
        const contribution: GoalContribution = {
          id: `gc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          goalId,
          amount,
          label,
          date: now,
          created_at: now,
          source,
        };
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const updatedContributions = [contribution, ...g.contributions];
            const total = updatedContributions.reduce((s, c) => s + c.amount, 0);
            const completed = total >= g.targetAmount;
            return {
              ...g,
              contributions: updatedContributions,
              isCompleted: completed,
              completedAt: completed && !g.isCompleted ? now : g.completedAt,
              updated_at: now,
            };
          }),
        }));
      },

      deleteContribution: (goalId, contributionId) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const updatedContributions = g.contributions.filter(
              (c) => c.id !== contributionId
            );
            const total = updatedContributions.reduce((s, c) => s + c.amount, 0);
            return {
              ...g,
              contributions: updatedContributions,
              isCompleted: total >= g.targetAmount,
              completedAt: total >= g.targetAmount ? g.completedAt : null,
              updated_at: new Date().toISOString(),
            };
          }),
        }));
      },

      addAutoContributions: (entries) => {
        if (entries.length === 0) return;
        const now = new Date().toISOString();

        set((state) => ({
          goals: state.goals.map((g) => {
            const matching = entries.filter((e) => e.goalId === g.id);
            if (matching.length === 0) return g;

            let updatedContributions = [...g.contributions];
            for (const entry of matching) {
              // Dedup: skip if auto contribution with same weekKey already exists
              const alreadyExists = updatedContributions.some(
                (c) => c.source === 'auto' && c.label === entry.weekKey
              );
              if (alreadyExists) continue;
              if (entry.amount <= 0) continue;

              updatedContributions = [{
                id: `gc-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                goalId: g.id,
                amount: entry.amount,
                label: entry.weekKey,
                date: now,
                created_at: now,
                source: 'auto' as ContributionSource,
              }, ...updatedContributions];
            }

            const total = updatedContributions.reduce((s, c) => s + c.amount, 0);
            const completed = total >= g.targetAmount;
            return {
              ...g,
              contributions: updatedContributions,
              isCompleted: completed,
              completedAt: completed && !g.isCompleted ? now : g.completedAt,
              updated_at: now,
            };
          }),
        }));
      },

      updateAllocation: (goalId, allocation) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? { ...g, allocation, updated_at: new Date().toISOString() }
              : g
          ),
        }));
      },

      clearGoals: () => {
        set({ goals: [] });
      },

      getActiveGoals: () => {
        return get().goals.filter((g) => !g.isCompleted);
      },

      getCompletedGoals: () => {
        return get().goals.filter((g) => g.isCompleted);
      },
    }),
    {
      name: 'lele-pfm-savings-goals',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        goals: state.goals,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === undefined) {
          // v0 → v1: add source to contributions, allocation to goals
          const state = persistedState as { goals: any[] };
          if (state.goals) {
            state.goals = state.goals.map((g: any) => ({
              ...g,
              allocation: g.allocation ?? { mode: 'manual' },
              contributions: (g.contributions ?? []).map((c: any) => ({
                ...c,
                source: c.source ?? 'manual',
              })),
            }));
          }
        }
        return persistedState as any;
      },
    }
  )
);
