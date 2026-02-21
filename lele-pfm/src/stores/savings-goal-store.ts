import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalIcon } from '@/constants/goal-categories';

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  label: string;
  date: string;
  created_at: string;
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
}

interface SavingsGoalState {
  goals: SavingsGoal[];

  addGoal: (goal: Omit<SavingsGoal, 'id' | 'contributions' | 'isCompleted' | 'completedAt' | 'created_at' | 'updated_at'>) => void;
  updateGoal: (id: string, updates: Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'deadline' | 'icon' | 'color'>>) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, label: string) => void;
  deleteContribution: (goalId: string, contributionId: string) => void;
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

      addContribution: (goalId, amount, label) => {
        const now = new Date().toISOString();
        const contribution: GoalContribution = {
          id: `gc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          goalId,
          amount,
          label,
          date: now,
          created_at: now,
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
      partialize: (state) => ({
        goals: state.goals,
      }),
    }
  )
);
