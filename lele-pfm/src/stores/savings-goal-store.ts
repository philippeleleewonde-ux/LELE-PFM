import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalIcon } from '@/constants/goal-categories';
import type { ScenarioId, PlanStatus, SavingsPlan } from '@/domain/calculators/savings-scenario-engine';

// ─── Allocation types ───

export type ContributionSource = 'manual' | 'auto' | 'plan' | 'extra';
export type AllocationMode = 'manual' | 'fixed' | 'deadline' | 'percent' | 'plan';

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
  expenseValidated: boolean;
  expenseValidatedAt: string | null;
  created_at: string;
  updated_at: string;
  allocation: AllocationConfig;
  plan: SavingsPlan | null;
}

// Re-export for convenience
export type { ScenarioId, PlanStatus, SavingsPlan };

interface SavingsGoalState {
  goals: SavingsGoal[];

  addGoal: (goal: Omit<SavingsGoal, 'id' | 'contributions' | 'isCompleted' | 'completedAt' | 'expenseValidated' | 'expenseValidatedAt' | 'created_at' | 'updated_at'>) => void;
  updateGoal: (id: string, updates: Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'deadline' | 'icon' | 'color'>>) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, label: string, source?: ContributionSource) => void;
  deleteContribution: (goalId: string, contributionId: string) => void;
  addAutoContributions: (entries: Array<{ goalId: string; amount: number; weekKey: string }>) => void;
  updateAllocation: (goalId: string, allocation: AllocationConfig) => void;
  validateGoalExpense: (goalId: string) => void;
  clearGoals: () => void;
  getActiveGoals: () => SavingsGoal[];
  getCompletedGoals: () => SavingsGoal[];

  /** Add a contribution capped to the maximum available amount (for auto-allocations) */
  addContributionCapped: (goalId: string, amount: number, label: string, maxAmount: number) => void;

  // ── Plan methods ──
  setPlan: (goalId: string, plan: SavingsPlan) => void;
  updatePlanStatus: (goalId: string, status: PlanStatus) => void;
  addPlanContribution: (goalId: string, amount: number, weekKey: string) => void;
  addExtraContribution: (goalId: string, amount: number, label: string) => void;
  syncPlanTracking: (goalId: string) => void;
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
          expenseValidated: false,
          expenseValidatedAt: null,
          created_at: now,
          updated_at: now,
          allocation: goal.allocation ?? { mode: 'manual' },
          plan: goal.plan ?? null,
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

      validateGoalExpense: (goalId) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? { ...g, expenseValidated: true, expenseValidatedAt: new Date().toISOString(), updated_at: new Date().toISOString() }
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

      addContributionCapped: (goalId, amount, label, maxAmount) => {
        // Note: callers should use addContributionWithAudit from goal-contribution-service
        // for production paths. This method is a low-level fallback.
        const cappedAmount = Math.min(amount, Math.max(0, maxAmount));
        if (cappedAmount <= 0) return;
        get().addContribution(goalId, cappedAmount, label);
      },

      // ── Plan methods ──

      setPlan: (goalId, plan) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  plan,
                  allocation: { mode: 'plan' as AllocationMode },
                  updated_at: new Date().toISOString(),
                }
              : g
          ),
        }));
      },

      updatePlanStatus: (goalId, status) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId || !g.plan) return g;
            return {
              ...g,
              plan: { ...g.plan, status },
              updated_at: new Date().toISOString(),
            };
          }),
        }));
      },

      addPlanContribution: (goalId, amount, weekKey) => {
        if (amount <= 0) return;
        const now = new Date().toISOString();

        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;

            // Dedup: skip if plan contribution with same weekKey already exists
            const alreadyExists = g.contributions.some(
              (c) => c.source === 'plan' && c.label === weekKey
            );
            if (alreadyExists) return g;

            const contribution: GoalContribution = {
              id: `gc-plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              goalId: g.id,
              amount,
              label: weekKey,
              date: now,
              created_at: now,
              source: 'plan',
            };

            const updatedContributions = [contribution, ...g.contributions];
            const total = updatedContributions.reduce((s, c) => s + c.amount, 0);
            const completed = total >= g.targetAmount;

            // Update plan tracking
            const updatedPlan = g.plan ? {
              ...g.plan,
              planContributions: g.plan.planContributions + amount,
              weeksExecuted: g.plan.weeksExecuted + 1,
              status: (completed ? 'completed' : g.plan.status) as PlanStatus,
            } : null;

            return {
              ...g,
              contributions: updatedContributions,
              isCompleted: completed,
              completedAt: completed && !g.isCompleted ? now : g.completedAt,
              plan: updatedPlan,
              updated_at: now,
            };
          }),
        }));
      },

      addExtraContribution: (goalId, amount, label) => {
        if (amount <= 0) return;
        const now = new Date().toISOString();

        const contribution: GoalContribution = {
          id: `gc-extra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          goalId,
          amount,
          label,
          date: now,
          created_at: now,
          source: 'extra',
        };

        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;

            const updatedContributions = [contribution, ...g.contributions];
            const total = updatedContributions.reduce((s, c) => s + c.amount, 0);
            const completed = total >= g.targetAmount;

            // Update plan extra tracking
            const updatedPlan = g.plan ? {
              ...g.plan,
              extraContributions: g.plan.extraContributions + amount,
              status: (completed ? 'completed' : g.plan.status) as PlanStatus,
            } : null;

            return {
              ...g,
              contributions: updatedContributions,
              isCompleted: completed,
              completedAt: completed && !g.isCompleted ? now : g.completedAt,
              plan: updatedPlan,
              updated_at: now,
            };
          }),
        }));
      },

      syncPlanTracking: (goalId) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId || !g.plan) return g;

            const planContribs = g.contributions.filter((c) => c.source === 'plan');
            const extraContribs = g.contributions.filter((c) => c.source === 'extra');

            return {
              ...g,
              plan: {
                ...g.plan,
                planContributions: planContribs.reduce((s, c) => s + c.amount, 0),
                extraContributions: extraContribs.reduce((s, c) => s + c.amount, 0),
                weeksExecuted: planContribs.length,
              },
              updated_at: new Date().toISOString(),
            };
          }),
        }));
      },
    }),
    {
      name: 'lele-pfm-savings-goals',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
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
              plan: null,
              contributions: (g.contributions ?? []).map((c: any) => ({
                ...c,
                source: c.source ?? 'manual',
              })),
            }));
          }
        }
        if (version <= 1) {
          // v1 → v2: add plan: null to existing goals
          const state = persistedState as { goals: any[] };
          if (state.goals) {
            state.goals = state.goals.map((g: any) => ({
              ...g,
              plan: g.plan ?? null,
            }));
          }
        }
        if (version <= 2) {
          // v2 → v3: add expenseValidated fields to existing goals
          const state = persistedState as { goals: any[] };
          if (state.goals) {
            state.goals = state.goals.map((g: any) => ({
              ...g,
              expenseValidated: g.expenseValidated ?? false,
              expenseValidatedAt: g.expenseValidatedAt ?? null,
            }));
          }
        }
        return persistedState as any;
      },
    }
  )
);
