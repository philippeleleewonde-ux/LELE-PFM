/**
 * useWeeklyChallenge — Selects the current week's challenge,
 * auto-checks the maitriser condition, and provides actions.
 */
import { useMemo, useCallback } from 'react';
import { FINANCIAL_CHALLENGES, FinancialChallenge } from '@/constants/financial-challenges';
import { useChallengeStore, ChallengeRecord } from '@/stores/challenge-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { useIncomeStore } from '@/stores/income-store';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { usePerformanceStore } from '@/stores/performance-store';
import { useEngineStore } from '@/stores/engine-store';
import { getCurrentWeek, getWeekDates, getWeekNumber, getISOYear } from '@/utils/week-helpers';

export interface WeeklyChallengeResult {
  challenge: FinancialChallenge | null;
  planWeek: number;
  record: ChallengeRecord | undefined;
  savoirRead: boolean;
  conditionMet: boolean;
  isFullyComplete: boolean;
  score: number;
  maxScore: number;
  completedCount: number;
  rolling8Score: number;
  onReadSavoir: () => void;
  onManualFaire: () => void;
}

// ─── Condition Context ───

interface CondCtx {
  // Transactions
  weekTxCount: number;
  weekUniqueCats: number;
  weekDaysWithTx: number;
  weekFixeTx: number;
  weeklySpent: number;
  weeklyBudget: number;
  executionRate: number;
  catsUnderBudget: number;
  topCatSpent: number;
  topCatPrevWeek: number;
  // Income
  weekIncomeCount: number;
  hasNonSalaryIncome: boolean;
  weeklyIncomeActual: number;
  monthUniqueIncomeSources: number;
  weeksWithIncomeIn8: number;
  // Goals
  hasUrgenceGoal: boolean;
  weekGoalContribs: number;
  hasGoalWithDeadline: boolean;
  activeGoals: number;
  completedGoals: number;
  uniqueActiveIcons: number;
  urgenceProgress: number;
  weekContribUniqueGoals: number;
  // Savings/Performance
  hasWeekRecord: boolean;
  economies: number;
  walletNet: number;
  grade: string;
  weeklyTarget: number;
  last4Positive: boolean;
  prevWeekOverBudget: boolean;
  thisWeekUnderBudget: boolean;
  recordsCount: number;
  prevSavedScore: number;
  gradesBPlusCount: number;
  trend: string;
  // Meta
  completedChallenges: number;
}

// ─── Condition Checkers ───

const CHECKERS: Record<string, (ctx: CondCtx) => boolean> = {
  S1:  (ctx) => ctx.weekTxCount >= 1,
  S2:  (ctx) => ctx.weekUniqueCats >= 3,
  S3:  (ctx) => ctx.weeklySpent > 0,
  S4:  (ctx) => ctx.hasWeekRecord,
  S5:  (ctx) => ctx.weeklyBudget > 0 && ctx.executionRate < 1.0,
  S7:  (ctx) => ctx.weeklyBudget > 0 && ctx.executionRate <= 0.85,
  S8:  (ctx) => ctx.weekDaysWithTx >= 5,
  S9:  (ctx) => ctx.economies > 0,
  S10: (ctx) => ctx.hasUrgenceGoal,
  S11: (ctx) => ctx.weekGoalContribs >= 1,
  S12: (ctx) => ctx.walletNet > 0,
  S13: (ctx) => ctx.weekIncomeCount >= 1,
  S14: (ctx) => ctx.hasNonSalaryIncome,
  S15: (ctx) => ctx.weeklyIncomeActual > ctx.weeklySpent && ctx.weeklySpent > 0,
  S16: (ctx) => ctx.monthUniqueIncomeSources >= 2,
  S18: (ctx) => ctx.weekFixeTx >= 2,
  S19: (ctx) => ctx.topCatPrevWeek > 0 && ctx.topCatSpent < ctx.topCatPrevWeek,
  S20: (ctx) => ctx.catsUnderBudget >= 4,
  S21: (ctx) => ctx.hasGoalWithDeadline,
  S22: (ctx) => ctx.weekGoalContribs >= 2,
  S23: (ctx) => ctx.activeGoals >= 2,
  S24: (ctx) => ctx.prevSavedScore > 0 && ctx.prevSavedScore < 100, // score exists, improvement implicit
  S25: (ctx) => ctx.weeklyTarget > 0 && ctx.weeklySpent > 0,
  S26: (ctx) => ['A+', 'A', 'B'].includes(ctx.grade),
  S27: (ctx) => ctx.weeklyTarget > 0 && ctx.economies > ctx.weeklyTarget,
  S28: (ctx) => ctx.last4Positive,
  S29: (ctx) => ctx.recordsCount >= 4,
  S30: (ctx) => ctx.trend === 'up',
  S31: (ctx) => ctx.prevSavedScore >= 40 && ctx.prevSavedScore <= 100, // proxy: has reasonable score
  S32: (ctx) => ['A+', 'A'].includes(ctx.grade),
  S33: (ctx) => ctx.weeklyBudget > 0 && ctx.executionRate < 0.80,
  S34: (ctx) => ctx.completedGoals >= 1,
  S35: (ctx) => ctx.prevSavedScore >= 70,
  S36: (ctx) => ctx.walletNet > 0 && ctx.recordsCount >= 20,
  S37: (ctx) => (ctx.prevWeekOverBudget && ctx.thisWeekUnderBudget) || ctx.thisWeekUnderBudget,
  S38: (ctx) => ctx.urgenceProgress >= 50,
  S39: (ctx) => ctx.weeksWithIncomeIn8 >= 4,
  S40: (ctx) => ctx.prevSavedScore >= 70, // proxy for REG>=80 + PRE>=70 combined
  S41: (ctx) => ctx.gradesBPlusCount >= 10,
  S42: (ctx) => ctx.uniqueActiveIcons >= 3 && ctx.activeGoals >= 3,
  S43: (ctx) => ctx.prevSavedScore >= 60, // proxy for all levers above 50
  S44: (ctx) => ctx.prevSavedScore >= 75, // proxy for REG >= 85
  S45: (ctx) => ctx.weeklyBudget > 0 && ctx.executionRate <= 0.90,
  S46: (ctx) => ctx.weekContribUniqueGoals >= 2,
  S47: (ctx) => ctx.prevSavedScore >= 75,
  S48: (ctx) => ctx.completedChallenges >= 40,
  manual: () => false, // never auto-validated
};

// ─── Hook ───

export function useWeeklyChallenge(selectedWeek?: number, selectedYear?: number): WeeklyChallengeResult {
  const { week: realWeek, year: realYear } = getCurrentWeek();
  const calWeek = selectedWeek ?? realWeek;
  const calYear = selectedYear ?? realYear;
  const lastCalculatedAt = useEngineStore((s) => s.lastCalculatedAt);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const transactions = useTransactionStore((s) => s.transactions);
  const incomes = useIncomeStore((s) => s.incomes);
  const goals = useSavingsGoalStore((s) => s.goals);
  const perfRecords = usePerformanceStore((s) => s.records);
  const challengeRecords = useChallengeStore((s) => s.records);
  const markSavoirRead = useChallengeStore((s) => s.markSavoirRead);
  const markConditionMet = useChallengeStore((s) => s.markConditionMet);
  const markManualFaire = useChallengeStore((s) => s.markManualFaire);
  const getCompletedCount = useChallengeStore((s) => s.getCompletedCount);
  const getRolling8Score = useChallengeStore((s) => s.getRolling8Score);

  // Determine plan week (1-48, cycling) based on selected week
  const planWeek = useMemo(() => {
    if (!lastCalculatedAt) return 1;
    const calcDate = new Date(lastCalculatedAt);
    const { start: selectedWeekStart } = getWeekDates(calWeek, calYear);
    const elapsed = selectedWeekStart.getTime() - calcDate.getTime();
    const weeksElapsed = Math.max(0, Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)));
    return (weeksElapsed % 48) + 1;
  }, [lastCalculatedAt, calWeek, calYear]);

  // Current challenge
  const challenge = useMemo(() => {
    return FINANCIAL_CHALLENGES.find((c) => c.week === planWeek) ?? null;
  }, [planWeek]);

  // Current record
  const record = useMemo(() => {
    if (!challenge) return undefined;
    return challengeRecords.find(
      (r) => r.challengeId === challenge.id && r.planWeek === planWeek,
    );
  }, [challenge, planWeek, challengeRecords]);

  // Build condition context
  const condCtx = useMemo((): CondCtx => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentFullYear = now.getFullYear();

    // Week transactions
    const weekTxs = transactions.filter(
      (t) => t.week_number === calWeek && t.year === calYear,
    );
    const weekTxCount = weekTxs.length;
    const weekUniqueCats = new Set(weekTxs.map((t) => t.category)).size;
    const weekDays = new Set(weekTxs.map((t) => t.transaction_date));
    const weekDaysWithTx = weekDays.size;
    const weekFixeTx = weekTxs.filter((t) => t.type === 'Fixe').length;
    const weeklySpent = weekTxs.reduce((s, t) => s + t.amount, 0);

    // Budget from engine
    const weeklyBudget = engineOutput
      ? (engineOutput.step6.reste_a_vivre * 12) / 48
      : 0;
    const executionRate = weeklyBudget > 0 ? weeklySpent / weeklyBudget : 0;
    const weeklyTarget = engineOutput
      ? engineOutput.step9.epr_n1 / 48
      : 0;
    const economies = Math.max(0, weeklyBudget - weeklySpent);

    // Categories under budget
    const catBudgets: Record<string, number> = {};
    const catSpent: Record<string, number> = {};
    if (Array.isArray(engineOutput?.step10?.by_category)) {
      for (const cat of engineOutput.step10.by_category) {
        catBudgets[cat.code] = cat.monthly_target_n1 / 4;
      }
    }
    for (const tx of weekTxs) {
      catSpent[tx.category] = (catSpent[tx.category] ?? 0) + tx.amount;
    }
    let catsUnderBudget = 0;
    for (const code of Object.keys(catBudgets)) {
      if ((catSpent[code] ?? 0) <= catBudgets[code]) catsUnderBudget++;
    }

    // Top category current vs previous week
    const catTotals = Object.entries(catSpent).sort((a, b) => b[1] - a[1]);
    const topCatCode = catTotals[0]?.[0];
    const topCatSpent = catTotals[0]?.[1] ?? 0;
    let topCatPrevWeek = 0;
    if (topCatCode) {
      const prevWeek = calWeek > 1 ? calWeek - 1 : 52;
      const prevYear = calWeek > 1 ? calYear : calYear - 1;
      const prevTxs = transactions.filter(
        (t) => t.week_number === prevWeek && t.year === prevYear && t.category === topCatCode,
      );
      topCatPrevWeek = prevTxs.reduce((s, t) => s + t.amount, 0);
    }

    // Income
    const weekIncs = incomes.filter(
      (i) => i.week_number === calWeek && i.year === calYear,
    );
    const weekIncomeCount = weekIncs.length;
    const hasNonSalaryIncome = weekIncs.some((i) => i.source !== 'salaire');
    const weeklyIncomeActual = weekIncs.reduce((s, i) => s + i.amount, 0);
    const monthIncs = incomes.filter((i) => {
      const d = new Date(i.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentFullYear;
    });
    const monthUniqueIncomeSources = new Set(monthIncs.map((i) => i.source)).size;

    // Weeks with income in last 8 calendar weeks
    let weeksWithIncomeIn8 = 0;
    for (let w = 0; w < 8; w++) {
      let checkWeek = calWeek - w;
      let checkYear = calYear;
      if (checkWeek <= 0) { checkWeek += 52; checkYear--; }
      if (incomes.some((i) => i.week_number === checkWeek && i.year === checkYear)) {
        weeksWithIncomeIn8++;
      }
    }

    // Goals
    const activeGoalsList = goals.filter((g) => !g.isCompleted);
    const completedGoalsList = goals.filter((g) => g.isCompleted);
    const hasUrgenceGoal = goals.some((g) => g.icon === 'urgence');
    const hasGoalWithDeadline = goals.some((g) => g.deadline !== null && g.targetAmount > 0);
    const uniqueActiveIcons = new Set(activeGoalsList.map((g) => g.icon)).size;

    // Goal contributions this week
    let weekGoalContribs = 0;
    const weekContribGoalIds = new Set<string>();
    for (const g of goals) {
      for (const c of g.contributions) {
        const cd = new Date(c.date);
        if (getWeekNumber(cd) === calWeek && getISOYear(cd) === calYear) {
          weekGoalContribs++;
          weekContribGoalIds.add(g.id);
        }
      }
    }

    // Urgence goal progress
    let urgenceProgress = 0;
    const urgenceGoal = goals.find((g) => g.icon === 'urgence');
    if (urgenceGoal && urgenceGoal.targetAmount > 0) {
      const total = urgenceGoal.contributions.reduce((s, c) => s + c.amount, 0);
      urgenceProgress = Math.round((total / urgenceGoal.targetAmount) * 100);
    }

    // Performance
    const currentRecord = perfRecords.find(
      (r) => r.week_number === calWeek && r.year === calYear,
    );
    const hasWeekRecord = !!currentRecord;
    const grade = currentRecord?.grade ?? 'E';

    // Last 4 weeks positive
    let last4Positive = true;
    const sorted = [...perfRecords].sort(
      (a, b) => b.year - a.year || b.week_number - a.week_number,
    );
    const recent4 = sorted.slice(0, 4);
    if (recent4.length < 4) {
      last4Positive = false;
    } else {
      last4Positive = recent4.every((r) => r.economies > 0);
    }

    // Previous week budget status
    const prevWeekNum = calWeek > 1 ? calWeek - 1 : 52;
    const prevWeekYear = calWeek > 1 ? calYear : calYear - 1;
    const prevRecord = perfRecords.find(
      (r) => r.week_number === prevWeekNum && r.year === prevWeekYear,
    );
    const prevWeekOverBudget = prevRecord ? prevRecord.depassement > 0 : false;
    const thisWeekUnderBudget = weeklyBudget > 0 && weeklySpent <= weeklyBudget;

    // Wallet net (from performance records)
    let walletNet = 0;
    for (const r of perfRecords) {
      walletNet += r.economies - r.depassement;
    }

    // Grades B+ count
    const goodGrades = new Set(['A+', 'A', 'B']);
    const gradesBPlusCount = perfRecords.filter((r) => goodGrades.has(r.grade)).length;

    // Previous saved financial score
    const prevSavedScore = sorted[0]?.financialScore ?? 0;

    // Trend (compare last 2 records)
    let trend = 'stable';
    if (sorted.length >= 2 && sorted[0].financialScore != null && sorted[1].financialScore != null) {
      const diff = sorted[0].financialScore - sorted[1].financialScore;
      if (diff > 3) trend = 'up';
      else if (diff < -3) trend = 'down';
    }

    return {
      weekTxCount,
      weekUniqueCats,
      weekDaysWithTx,
      weekFixeTx,
      weeklySpent,
      weeklyBudget,
      executionRate,
      catsUnderBudget,
      topCatSpent,
      topCatPrevWeek,
      weekIncomeCount,
      hasNonSalaryIncome,
      weeklyIncomeActual,
      monthUniqueIncomeSources,
      weeksWithIncomeIn8,
      hasUrgenceGoal,
      weekGoalContribs,
      hasGoalWithDeadline,
      activeGoals: activeGoalsList.length,
      completedGoals: completedGoalsList.length,
      uniqueActiveIcons,
      urgenceProgress,
      weekContribUniqueGoals: weekContribGoalIds.size,
      hasWeekRecord,
      economies,
      walletNet,
      grade,
      weeklyTarget,
      last4Positive,
      prevWeekOverBudget,
      thisWeekUnderBudget,
      recordsCount: perfRecords.length,
      prevSavedScore,
      gradesBPlusCount,
      trend,
      completedChallenges: challengeRecords.filter((r) => r.savoirRead && r.conditionMet).length,
    };
  }, [transactions, incomes, goals, perfRecords, engineOutput, calWeek, calYear, challengeRecords]);

  // Auto-check condition
  const conditionMet = useMemo(() => {
    if (!challenge) return false;
    if (record?.conditionMet) return true;
    const checker = CHECKERS[challenge.conditionKey];
    if (!checker) return false;
    return checker(condCtx);
  }, [challenge, record, condCtx]);

  // Auto-save condition when met
  useMemo(() => {
    if (challenge && conditionMet && record && !record.conditionMet) {
      markConditionMet(
        challenge.id, planWeek, calWeek, calYear,
        challenge.points.faire, challenge.points.maitriser,
      );
    }
  }, [challenge, conditionMet, record?.conditionMet]);

  const savoirRead = record?.savoirRead ?? false;
  const isFullyComplete = savoirRead && (record?.conditionMet ?? conditionMet);
  const score = record?.score ?? 0;
  const maxScore = challenge
    ? challenge.points.savoir + challenge.points.faire + challenge.points.maitriser
    : 100;

  const onReadSavoir = useCallback(() => {
    if (!challenge || savoirRead) return;
    markSavoirRead(challenge.id, planWeek, calWeek, calYear, challenge.points.savoir);
  }, [challenge, planWeek, calWeek, calYear, savoirRead, markSavoirRead]);

  const onManualFaire = useCallback(() => {
    if (!challenge || record?.conditionMet) return;
    markManualFaire(
      challenge.id, planWeek, calWeek, calYear,
      challenge.points.faire, challenge.points.maitriser,
    );
  }, [challenge, planWeek, calWeek, calYear, record?.conditionMet, markManualFaire]);

  return {
    challenge,
    planWeek,
    record,
    savoirRead,
    conditionMet: record?.conditionMet ?? conditionMet,
    isFullyComplete,
    score,
    maxScore,
    completedCount: getCompletedCount(),
    rolling8Score: getRolling8Score(),
    onReadSavoir,
    onManualFaire,
  };
}
