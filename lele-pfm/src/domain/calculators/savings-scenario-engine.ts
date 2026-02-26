/**
 * Savings Scenario Engine — Pure calculator, zero side-effects
 *
 * Generates 5 savings plan scenarios based on historical surplus data.
 * References:
 *  - Sinking Fund (Brealey & Myers)
 *  - LDI — Liability-Driven Investment
 *  - GBI — Goal-Based Investing (Brunel, Das et al.)
 *  - DCA — Dollar Cost Averaging (Markowitz variance reduction)
 *  - Basel III — Capital adequacy / risk classification
 *
 * Feasibility scoring uses normal distribution CDF (Abramowitz & Stegun approximation).
 */

// ─── Types ───

export type ScenarioId = 'prudent' | 'equilibre' | 'ambitieux' | 'accelere' | 'custom';
export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';
export type PlanStatus = 'active' | 'completed' | 'paused';

export interface ScenarioResult {
  id: ScenarioId;
  labelKey: string;
  referenceKey: string;
  weeklyAmount: number;
  surplusPercent: number;
  estimatedWeeks: number;
  estimatedEndDate: string;
  feasibilityScore: number;    // 0-100
  riskLevel: RiskLevel;
  isFeasible: boolean;
}

export interface SurplusStatistics {
  mean: number;
  median: number;
  stdDev: number;
  cv: number;                   // Coefficient of Variation (Markowitz)
  stability: 'stable' | 'moderate' | 'volatile';
  maxSafePercent: number;
}

export interface ScenarioEngineInput {
  remainingAmount: number;
  historicalSurplus: number[];
  currentWeek: number;
  currentYear: number;
  customWeeklyAmount?: number;
}

export interface ScenarioEngineOutput {
  scenarios: ScenarioResult[];
  surplusStats: SurplusStatistics;
  hasEnoughData: boolean;       // >= 4 weeks
}

export interface SavingsPlan {
  scenarioId: ScenarioId;
  weeklyAmount: number;
  startWeek: number;
  startYear: number;
  estimatedEndWeek: number;
  estimatedEndYear: number;
  estimatedWeeks: number;
  totalPlanned: number;         // weeklyAmount * estimatedWeeks
  feasibilityScore: number;
  status: PlanStatus;
  createdAt: string;
  weeksExecuted: number;
  planContributions: number;    // total source='plan'
  extraContributions: number;   // total source='extra'
}

// ─── Constants ───

/**
 * Minimum plan duration in weeks (~1 month).
 * Prevents scenarios from completing in 1-2 weeks even with large surplus.
 * Ensures "prudent" actually means prudent.
 */
const MIN_PLAN_WEEKS = 4;

// ─── Scenario definitions ───

interface ScenarioDefinition {
  id: ScenarioId;
  labelKey: string;
  referenceKey: string;
  surplusPercent: number;
  riskLevel: RiskLevel;
}

const SCENARIO_DEFS: ScenarioDefinition[] = [
  { id: 'prudent',   labelKey: 'scenarios.prudent',   referenceKey: 'scenarios.sinkingFund', surplusPercent: 10, riskLevel: 'low' },
  { id: 'equilibre', labelKey: 'scenarios.equilibre',  referenceKey: 'scenarios.ldi',         surplusPercent: 20, riskLevel: 'medium' },
  { id: 'ambitieux', labelKey: 'scenarios.ambitieux',  referenceKey: 'scenarios.gbi',         surplusPercent: 35, riskLevel: 'high' },
  { id: 'accelere',  labelKey: 'scenarios.accelere',   referenceKey: 'scenarios.dca',         surplusPercent: 50, riskLevel: 'very_high' },
];

// ─── Statistical helpers ───

function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  // Bessel correction (N-1)
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Standard normal CDF approximation (Abramowitz & Stegun, formula 26.2.17)
 * Accuracy: |error| < 7.5e-8
 */
function normalCDF(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Add weeks to a (week, year) pair.
 * Simple approximation: converts to date, adds weeks, converts back.
 */
function addWeeksToDate(currentWeek: number, currentYear: number, weeksToAdd: number): { week: number; year: number; isoDate: string } {
  // Approximate: Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(currentYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const targetDate = new Date(week1Monday);
  targetDate.setUTCDate(week1Monday.getUTCDate() + (currentWeek - 1 + weeksToAdd) * 7);

  // Compute ISO week of target
  const d = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return {
    week,
    year: d.getUTCFullYear(),
    isoDate: targetDate.toISOString().split('T')[0],
  };
}

// ─── Stability classification (Basel III / Markowitz) ───

function classifyStability(cv: number): { stability: 'stable' | 'moderate' | 'volatile'; maxSafePercent: number } {
  if (cv < 0.30) return { stability: 'stable', maxSafePercent: 50 };
  if (cv <= 0.60) return { stability: 'moderate', maxSafePercent: 35 };
  return { stability: 'volatile', maxSafePercent: 20 };
}

// ─── Feasibility score ───

function computeFeasibilityScore(weeklyAmount: number, mean: number, stdDev: number): number {
  if (stdDev === 0 || mean <= 0) {
    return weeklyAmount <= mean ? 100 : 0;
  }
  const z = (weeklyAmount - mean) / stdDev;
  const pExceed = 1 - normalCDF(z);
  return Math.min(100, Math.max(0, Math.round(pExceed * 100)));
}

// ─── Risk level for custom scenario ───

function computeCustomRiskLevel(surplusPercent: number): RiskLevel {
  if (surplusPercent <= 15) return 'low';
  if (surplusPercent <= 30) return 'medium';
  if (surplusPercent <= 45) return 'high';
  return 'very_high';
}

// ─── Main engine ───

export function generateScenarios(input: ScenarioEngineInput): ScenarioEngineOutput {
  const { remainingAmount, historicalSurplus, currentWeek, currentYear, customWeeklyAmount } = input;

  // Filter positive surplus values
  const positiveSurplus = historicalSurplus.filter((v) => v > 0);
  const hasEnoughData = positiveSurplus.length >= 4;

  // Compute statistics (use fallback mean if no data)
  const rawMean = computeMean(positiveSurplus);
  // Fallback: if no surplus data, estimate from target amount (24 weeks = ~6 months)
  const fallbackMean = remainingAmount > 0 ? Math.round(remainingAmount / 12) : 10000;
  const mean = rawMean > 0 ? rawMean : fallbackMean;
  const median = rawMean > 0 ? computeMedian(positiveSurplus) : mean;
  const stdDev = rawMean > 0 ? computeStdDev(positiveSurplus, rawMean) : Math.round(mean * 0.4);
  const cv = mean > 0 ? stdDev / mean : 0;
  const { stability, maxSafePercent } = classifyStability(cv);

  const surplusStats: SurplusStatistics = {
    mean: Math.round(mean),
    median: Math.round(median),
    stdDev: Math.round(stdDev),
    cv: Math.round(cv * 100) / 100,
    stability,
    maxSafePercent,
  };

  // Always build ALL 5 scenarios (beginner mode just caps feasibility)
  const scenarios: ScenarioResult[] = [];

  for (const def of SCENARIO_DEFS) {
    const result = buildScenario(def, mean, stdDev, maxSafePercent, remainingAmount, currentWeek, currentYear);
    if (!hasEnoughData) {
      // Beginner: cap feasibility at 50 (uncertain data quality)
      result.feasibilityScore = Math.min(50, result.feasibilityScore);
    }
    scenarios.push(result);
  }

  // Custom scenario
  const customAmount = customWeeklyAmount && customWeeklyAmount > 0
    ? customWeeklyAmount
    : Math.round(mean * 0.20); // Default to 20% of mean
  const customResult = buildCustomScenario(customAmount, mean, stdDev, maxSafePercent, remainingAmount, currentWeek, currentYear);
  if (!hasEnoughData) {
    customResult.feasibilityScore = Math.min(50, customResult.feasibilityScore);
  }
  scenarios.push(customResult);

  return { scenarios, surplusStats, hasEnoughData };
}

function buildScenario(
  def: ScenarioDefinition,
  mean: number,
  stdDev: number,
  maxSafePercent: number,
  remainingAmount: number,
  currentWeek: number,
  currentYear: number,
): ScenarioResult {
  const rawWeeklyAmount = Math.round(mean * def.surplusPercent / 100);
  // Cap: weeklyAmount cannot exceed remainingAmount / MIN_PLAN_WEEKS
  // This guarantees estimatedWeeks >= MIN_PLAN_WEEKS for any scenario
  const maxWeeklyForMinDuration = Math.floor(remainingAmount / MIN_PLAN_WEEKS);
  const weeklyAmount = Math.min(rawWeeklyAmount, maxWeeklyForMinDuration);
  const estimatedWeeks = weeklyAmount > 0 ? Math.ceil(remainingAmount / weeklyAmount) : 0;
  const endInfo = estimatedWeeks > 0
    ? addWeeksToDate(currentWeek, currentYear, estimatedWeeks)
    : { week: currentWeek, year: currentYear, isoDate: '' };

  const feasibilityScore = computeFeasibilityScore(weeklyAmount, mean, stdDev);
  const isFeasible = def.surplusPercent <= maxSafePercent && weeklyAmount > 0 && weeklyAmount <= mean * 0.8;

  return {
    id: def.id,
    labelKey: def.labelKey,
    referenceKey: def.referenceKey,
    weeklyAmount,
    surplusPercent: def.surplusPercent,
    estimatedWeeks,
    estimatedEndDate: endInfo.isoDate,
    feasibilityScore,
    riskLevel: def.riskLevel,
    isFeasible,
  };
}

function buildCustomScenario(
  weeklyAmount: number,
  mean: number,
  stdDev: number,
  maxSafePercent: number,
  remainingAmount: number,
  currentWeek: number,
  currentYear: number,
): ScenarioResult {
  // Cap: custom amount cannot exceed remainingAmount / MIN_PLAN_WEEKS
  const maxWeeklyForMinDuration = Math.floor(remainingAmount / MIN_PLAN_WEEKS);
  const effectiveWeeklyAmount = Math.min(weeklyAmount, maxWeeklyForMinDuration);
  const surplusPercent = mean > 0 ? Math.round((effectiveWeeklyAmount / mean) * 100) : 0;
  const estimatedWeeks = effectiveWeeklyAmount > 0 ? Math.ceil(remainingAmount / effectiveWeeklyAmount) : 0;
  const endInfo = estimatedWeeks > 0
    ? addWeeksToDate(currentWeek, currentYear, estimatedWeeks)
    : { week: currentWeek, year: currentYear, isoDate: '' };

  const feasibilityScore = computeFeasibilityScore(effectiveWeeklyAmount, mean, stdDev);
  const isFeasible = surplusPercent <= maxSafePercent && effectiveWeeklyAmount > 0 && effectiveWeeklyAmount <= mean * 0.8;

  return {
    id: 'custom',
    labelKey: 'scenarios.custom',
    referenceKey: 'scenarios.custom',
    weeklyAmount: effectiveWeeklyAmount,
    surplusPercent,
    estimatedWeeks,
    estimatedEndDate: endInfo.isoDate,
    feasibilityScore,
    riskLevel: computeCustomRiskLevel(surplusPercent),
    isFeasible,
  };
}

// ─── Plan builder (from selected scenario) ───

export function buildPlanFromScenario(
  scenario: ScenarioResult,
  remainingAmount: number,
  currentWeek: number,
  currentYear: number,
): SavingsPlan {
  const endInfo = addWeeksToDate(currentWeek, currentYear, scenario.estimatedWeeks);

  return {
    scenarioId: scenario.id,
    weeklyAmount: scenario.weeklyAmount,
    startWeek: currentWeek,
    startYear: currentYear,
    estimatedEndWeek: endInfo.week,
    estimatedEndYear: endInfo.year,
    estimatedWeeks: scenario.estimatedWeeks,
    totalPlanned: scenario.weeklyAmount * scenario.estimatedWeeks,
    feasibilityScore: scenario.feasibilityScore,
    status: 'active',
    createdAt: new Date().toISOString(),
    weeksExecuted: 0,
    planContributions: 0,
    extraContributions: 0,
  };
}

// ─── Scenario colors (for UI) ───

export const SCENARIO_COLORS: Record<ScenarioId, string> = {
  prudent: '#4ADE80',
  equilibre: '#60A5FA',
  ambitieux: '#FBBF24',
  accelere: '#FB923C',
  custom: '#A78BFA',
};
