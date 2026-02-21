/**
 * useWeeklyEvolution — Hook central d'evolution hebdomadaire
 *
 * Calcule toutes les donnees de progression a partir du performance-store
 * et de useFinancialScore : deltas semaine/semaine, series, records personnels,
 * bilan mensuel, deltas par levier.
 */

import { useMemo } from 'react';
import { usePerformanceStore, WeeklyRecord } from '@/stores/performance-store';
import { useFinancialScore } from '@/hooks/useFinancialScore';
import { getCurrentWeek } from '@/utils/week-helpers';

// ─── Types ───

export interface LeverEvolution {
  code: string;
  label: string;
  color: string;
  current: number;
  previous: number | null;
  delta: number | null;
  trend: 'up' | 'down' | 'stable';
}

export interface StreakData {
  budgetStreak: number;
  savingsStreak: number;
  scoreAbove60Streak: number;
  bestBudgetStreak: number;
  bestSavingsStreak: number;
  bestScoreStreak: number;
}

export interface PersonalRecord {
  bestScore: { value: number; week: number; year: number } | null;
  bestSavings: { value: number; week: number; year: number } | null;
  bestNote: { value: number; week: number; year: number } | null;
  bestLeverScores: Record<string, { value: number; week: number; year: number }>;
  nextScoreMilestone: number;
}

export interface MonthlyData {
  monthLabel: string;
  monthAvgScore: number | null;
  monthTotalSavings: number;
  monthBudgetRespectRate: number;
  monthWeeksCount: number;
  prevMonthLabel: string;
  prevMonthAvgScore: number | null;
  prevMonthTotalSavings: number;
  monthTrend: 'up' | 'down' | 'stable';
  monthScoreDelta: number | null;
}

export interface WeeklyEvolutionData {
  // Week over week
  currentScore: number;
  previousScore: number | null;
  scoreDelta: number | null;
  currentEcon: number;
  previousEcon: number | null;
  econDelta: number | null;
  econDeltaPercent: number | null;
  currentNote: number;
  previousNote: number | null;
  bestImprovedLever: LeverEvolution | null;
  worstLever: LeverEvolution | null;

  // Streaks
  streaks: StreakData;

  // Personal records
  records: PersonalRecord;

  // Monthly
  monthly: MonthlyData;

  // Lever evolution (all 5)
  leversEvolution: LeverEvolution[];

  // Meta
  totalWeeks: number;
  hasData: boolean;
  currentWeek: number;
  currentYear: number;
}

// ─── Helpers ───

const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

/** Get approximate month from ISO week number */
function weekToMonth(week: number): number {
  // Approximate: week 1-4 → Jan, 5-8 → Feb, etc.
  return Math.min(11, Math.floor((week - 1) / 4.33));
}

/** Compute longest consecutive streak for a condition */
function longestStreak(records: WeeklyRecord[], condition: (r: WeeklyRecord) => boolean): number {
  let longest = 0;
  let current = 0;
  for (const r of records) {
    if (condition(r)) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

/** Compute current streak (from end backwards) */
function currentStreak(records: WeeklyRecord[], condition: (r: WeeklyRecord) => boolean): number {
  let streak = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (condition(records[i])) streak++;
    else break;
  }
  return streak;
}

// ─── Hook ───

export function useWeeklyEvolution(): WeeklyEvolutionData {
  const allRecords = usePerformanceStore((s) => s.records);
  const { globalScore, levers } = useFinancialScore();
  const { week: nowWeek, year: nowYear } = getCurrentWeek();

  return useMemo(() => {
    // Sort chronologically (ascending by year then week)
    const sorted = [...allRecords].sort(
      (a, b) => a.year - b.year || a.week_number - b.week_number,
    );
    const nbWeeks = sorted.length;
    const hasData = nbWeeks > 0;

    // ─── Week over week ───
    const currentRecord = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const previousRecord = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    const currentEcon = currentRecord?.economies ?? 0;
    const previousEcon = previousRecord?.economies ?? null;
    const econDelta = previousEcon !== null ? currentEcon - previousEcon : null;
    const econDeltaPercent = previousEcon !== null && previousEcon > 0
      ? Math.round(((currentEcon - previousEcon) / previousEcon) * 100)
      : null;

    const previousScore = previousRecord?.financialScore ?? null;
    const scoreDelta = previousScore !== null ? globalScore - previousScore : null;

    const currentNote = currentRecord?.note ?? 0;
    const previousNote = previousRecord?.note ?? null;

    // ─── Lever deltas ───
    const currentLeverScores: Record<string, number> = {};
    for (const l of levers) {
      currentLeverScores[l.code] = l.score;
    }

    const prevLeverScores = previousRecord?.leverScores ?? null;

    const leversEvolution: LeverEvolution[] = levers.map((l) => {
      const prev = prevLeverScores ? (prevLeverScores[l.code] ?? null) : null;
      const delta = prev !== null ? l.score - prev : null;
      const trend: 'up' | 'down' | 'stable' =
        delta !== null ? (delta > 3 ? 'up' : delta < -3 ? 'down' : 'stable') : 'stable';
      return {
        code: l.code,
        label: l.label,
        color: l.color,
        current: l.score,
        previous: prev,
        delta,
        trend,
      };
    });

    // Best improved and worst lever
    const leversWithDelta = leversEvolution.filter((l) => l.delta !== null);
    const bestImprovedLever = leversWithDelta.length > 0
      ? leversWithDelta.reduce((best, l) => (l.delta! > (best.delta ?? -999) ? l : best), leversWithDelta[0])
      : null;
    const worstLever = leversWithDelta.length > 0
      ? leversWithDelta.reduce((worst, l) => (l.delta! < (worst.delta ?? 999) ? l : worst), leversWithDelta[0])
      : null;

    // ─── Streaks ───
    const budgetStreak = currentStreak(sorted, (r) => r.budgetRespecte);
    const savingsStreak = currentStreak(sorted, (r) => r.economies > 0);
    const scoreAbove60Streak = currentStreak(sorted, (r) => (r.financialScore ?? 0) >= 60);

    const bestBudgetStreak = longestStreak(sorted, (r) => r.budgetRespecte);
    const bestSavingsStreak = longestStreak(sorted, (r) => r.economies > 0);
    const bestScoreStreak = longestStreak(sorted, (r) => (r.financialScore ?? 0) >= 60);

    // ─── Personal records ───
    let bestScore: PersonalRecord['bestScore'] = null;
    let bestSavings: PersonalRecord['bestSavings'] = null;
    let bestNote: PersonalRecord['bestNote'] = null;
    const bestLeverScores: Record<string, { value: number; week: number; year: number }> = {};

    for (const r of sorted) {
      const fs = r.financialScore ?? 0;
      if (!bestScore || fs > bestScore.value) {
        bestScore = { value: fs, week: r.week_number, year: r.year };
      }
      if (!bestSavings || r.economies > bestSavings.value) {
        bestSavings = { value: r.economies, week: r.week_number, year: r.year };
      }
      if (!bestNote || r.note > bestNote.value) {
        bestNote = { value: r.note, week: r.week_number, year: r.year };
      }
      // Best lever scores from saved leverScores
      if (r.leverScores) {
        for (const [code, score] of Object.entries(r.leverScores)) {
          if (!bestLeverScores[code] || score > bestLeverScores[code].value) {
            bestLeverScores[code] = { value: score, week: r.week_number, year: r.year };
          }
        }
      }
    }

    // Also check current lever scores (may not be saved yet)
    for (const l of levers) {
      if (!bestLeverScores[l.code] || l.score > bestLeverScores[l.code].value) {
        bestLeverScores[l.code] = { value: l.score, week: nowWeek, year: nowYear };
      }
    }

    // Next milestone: round up to nearest 5 above current score
    const nextScoreMilestone = Math.min(100, Math.ceil((globalScore + 1) / 5) * 5);

    // ─── Monthly synthesis ───
    const currentMonth = weekToMonth(nowWeek);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? nowYear - 1 : nowYear;

    const monthRecords = sorted.filter(
      (r) => r.year === nowYear && weekToMonth(r.week_number) === currentMonth,
    );
    const prevMonthRecords = sorted.filter(
      (r) => r.year === prevMonthYear && weekToMonth(r.week_number) === prevMonth,
    );

    const monthWeeksCount = monthRecords.length;
    const monthAvgScore = monthWeeksCount > 0
      ? Math.round(monthRecords.reduce((s, r) => s + (r.financialScore ?? 0), 0) / monthWeeksCount)
      : null;
    const monthTotalSavings = monthRecords.reduce((s, r) => s + r.economies, 0);
    const monthBudgetRespectRate = monthWeeksCount > 0
      ? Math.round((monthRecords.filter((r) => r.budgetRespecte).length / monthWeeksCount) * 100)
      : 0;

    const prevMonthWeeksCount = prevMonthRecords.length;
    const prevMonthAvgScore = prevMonthWeeksCount > 0
      ? Math.round(prevMonthRecords.reduce((s, r) => s + (r.financialScore ?? 0), 0) / prevMonthWeeksCount)
      : null;
    const prevMonthTotalSavings = prevMonthRecords.reduce((s, r) => s + r.economies, 0);

    const monthScoreDelta = monthAvgScore !== null && prevMonthAvgScore !== null
      ? monthAvgScore - prevMonthAvgScore
      : null;
    const monthTrend: 'up' | 'down' | 'stable' =
      monthScoreDelta !== null
        ? (monthScoreDelta > 2 ? 'up' : monthScoreDelta < -2 ? 'down' : 'stable')
        : 'stable';

    return {
      // Week over week
      currentScore: globalScore,
      previousScore,
      scoreDelta,
      currentEcon,
      previousEcon,
      econDelta,
      econDeltaPercent,
      currentNote,
      previousNote,
      bestImprovedLever: bestImprovedLever && (bestImprovedLever.delta ?? 0) > 0 ? bestImprovedLever : null,
      worstLever: worstLever && (worstLever.delta ?? 0) < 0 ? worstLever : null,

      // Streaks
      streaks: {
        budgetStreak,
        savingsStreak,
        scoreAbove60Streak,
        bestBudgetStreak,
        bestSavingsStreak,
        bestScoreStreak,
      },

      // Personal records
      records: {
        bestScore,
        bestSavings,
        bestNote,
        bestLeverScores,
        nextScoreMilestone,
      },

      // Monthly
      monthly: {
        monthLabel: MONTH_NAMES[currentMonth],
        monthAvgScore,
        monthTotalSavings,
        monthBudgetRespectRate,
        monthWeeksCount,
        prevMonthLabel: MONTH_NAMES[prevMonth],
        prevMonthAvgScore,
        prevMonthTotalSavings,
        monthTrend,
        monthScoreDelta,
      },

      // Levers
      leversEvolution,

      // Meta
      totalWeeks: nbWeeks,
      hasData,
      currentWeek: nowWeek,
      currentYear: nowYear,
    };
  }, [allRecords, globalScore, levers, nowWeek, nowYear]);
}
