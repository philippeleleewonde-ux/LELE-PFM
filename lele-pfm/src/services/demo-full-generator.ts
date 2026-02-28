/**
 * Full Demo Generator — Populates 10 weeks of realistic tracking data.
 *
 * Creates a believable progression story:
 *   S-9 (bad) → S-6 (improving) → S-3 (good) → S0 (excellent)
 *
 * Fills: transactions, incomes, performance records, savings goals,
 *        impulse purchases, and financial challenges.
 *
 * Called from settings.tsx after wizard data + engine calculation are done.
 */

import { useTransactionStore } from '@/stores/transaction-store';
import { useIncomeStore } from '@/stores/income-store';
import { usePerformanceStore } from '@/stores/performance-store';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { useImpulseStore } from '@/stores/impulse-store';
import { useChallengeStore } from '@/stores/challenge-store';
import { generateDemoTransactions } from '@/services/demo-transactions-generator';
import { calculateWeeklySavings } from '@/domain/calculators/weekly-savings-engine';
import { getCurrentWeek, getWeekDates, formatDateISO } from '@/utils/week-helpers';
import { IncomeCode } from '@/constants/income-categories';
import { FINANCIAL_CHALLENGES } from '@/constants/financial-challenges';
import { EngineOutput, COICOPCode } from '@/types';
import { IncomeTarget } from '@/stores/engine-store';
import { GoalIcon } from '@/constants/goal-categories';

// ─── Helpers ───

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

// ─── Progression curve (10 weeks) ───
// spendRatio = % of budget spent (lower = more savings)
// incomeRatio = % of expected income received

const WEEKLY_PROFILE = [
  { spendRatio: [0.92, 1.05], incomeRatio: [0.85, 0.95] },  // S-9: bad week
  { spendRatio: [0.85, 0.95], incomeRatio: [0.90, 1.00] },  // S-8: difficult
  { spendRatio: [0.78, 0.88], incomeRatio: [0.88, 0.98] },  // S-7: starting to improve
  { spendRatio: [0.80, 0.90], incomeRatio: [0.95, 1.05] },  // S-6: slight relapse
  { spendRatio: [0.70, 0.82], incomeRatio: [0.92, 1.02] },  // S-5: progress
  { spendRatio: [0.72, 0.80], incomeRatio: [0.95, 1.05] },  // S-4: stabilization
  { spendRatio: [0.65, 0.78], incomeRatio: [0.98, 1.08] },  // S-3: good
  { spendRatio: [0.60, 0.72], incomeRatio: [1.00, 1.10] },  // S-2: very good
  { spendRatio: [0.62, 0.75], incomeRatio: [0.97, 1.05] },  // S-1: excellent
  { spendRatio: [0.55, 0.68], incomeRatio: [1.00, 1.08] },  // S0: current (best)
];

// ─── Income label templates ───

const INCOME_LABELS: Record<string, string[]> = {
  salaire: ['Salaire', 'Virement salaire', 'Salaire mensuel'],
  primes: ['Prime Q1', 'Bonus performance', 'Prime annuelle'],
  locatifs: ['Loyer studio', 'Revenu locatif', 'Loyer appartement'],
  aides: ['Allocation logement', 'CAF', 'Aide familiale'],
  freelance: ['Mission freelance', 'Prestation client', 'Facturation mission'],
  dividendes: ['Dividendes', 'Revenus placements', 'Interets livret'],
  pension: ['Pension retraite', 'Pension alimentaire', 'Rente'],
  autres_revenus: ['Remboursement', 'Vente occasion', 'Autre revenu'],
};

// ─── Fixed vs Variable income sources ───

const FIXED_INCOME_SOURCES: IncomeCode[] = ['salaire', 'locatifs', 'pension', 'dividendes'];

// ─── Main function ───

export function populateDemoTracking(
  engineOutput: EngineOutput,
  currency: string,
  incomeTargets: Record<string, IncomeTarget> | null,
): void {
  const { week: currentWeek, year: currentYear } = getCurrentWeek();

  const weeklyBudget = engineOutput.step9?.weekly_budget ?? 0;
  const weeklyTarget = engineOutput.step9?.weekly_target_n1 ?? 0;
  if (weeklyBudget <= 0) return;

  const isFCFA = currency === 'FCFA' || currency === 'XOF' || currency === 'XAF';
  const roundStep = isFCFA ? 500 : 1;

  // Collect week coordinates for 10 weeks going back
  const weeks: Array<{ week: number; year: number; profileIdx: number }> = [];
  for (let i = 9; i >= 0; i--) {
    let w = currentWeek - i;
    let y = currentYear;
    while (w <= 0) {
      w += 52;
      y -= 1;
    }
    weeks.push({ week: w, year: y, profileIdx: 9 - i });
  }

  // Track weekly economies for goal contributions & impulse affordability
  const weeklyEconomies: number[] = [];

  // ─── 1a. Transactions ───
  populateTransactions(engineOutput, currency, weeks, weeklyBudget, roundStep, weeklyEconomies);

  // ─── 1b. Incomes ───
  populateIncomes(incomeTargets, weeks, roundStep, isFCFA);

  // ─── 1c. Performance records ───
  populatePerformanceRecords(weeks, weeklyBudget, weeklyTarget, weeklyEconomies);

  // ─── 1d. Savings goals ───
  populateSavingsGoals(weeklyBudget, weeks, weeklyEconomies, roundStep);

  // ─── 1e. Impulse purchases ───
  populateImpulses(weeklyBudget, weeks, weeklyEconomies, roundStep);

  // ─── 1f. Challenges ───
  populateChallenges(weeks);
}

// ─── 1a. Transactions ───

function populateTransactions(
  engineOutput: EngineOutput,
  currency: string,
  weeks: Array<{ week: number; year: number; profileIdx: number }>,
  weeklyBudget: number,
  roundStep: number,
  weeklyEconomies: number[],
): void {
  const txStore = useTransactionStore.getState();

  for (const { week, year, profileIdx } of weeks) {
    const profile = WEEKLY_PROFILE[profileIdx];
    const targetSpendRatio = randFloat(profile.spendRatio[0], profile.spendRatio[1]);
    const targetTotalSpend = weeklyBudget * targetSpendRatio;

    // Generate raw transactions
    const rawTxs = generateDemoTransactions(engineOutput, currency, week, year);
    if (rawTxs.length === 0) {
      weeklyEconomies.push(Math.max(0, weeklyBudget * (1 - targetSpendRatio)));
      continue;
    }

    // Calculate scale factor to hit target spend
    const rawTotal = rawTxs.reduce((s, t) => s + t.amount, 0);
    const scaleFactor = rawTotal > 0 ? targetTotalSpend / rawTotal : 1;

    let actualTotal = 0;
    for (const tx of rawTxs) {
      const scaledAmount = roundTo(Math.max(tx.amount * scaleFactor, roundStep), roundStep);
      txStore.addTransaction({
        profile_id: 'local',
        type: tx.type,
        category: tx.category,
        label: tx.label,
        amount: scaledAmount,
        payment_method: tx.payment_method,
        transaction_date: tx.transaction_date,
        week_number: week,
        year: year,
        is_reconciled: false,
        notes: null,
      });
      actualTotal += scaledAmount;
    }

    weeklyEconomies.push(Math.max(0, weeklyBudget - actualTotal));
  }
}

// ─── 1b. Incomes ───

function populateIncomes(
  incomeTargets: Record<string, IncomeTarget> | null,
  weeks: Array<{ week: number; year: number; profileIdx: number }>,
  roundStep: number,
  _isFCFA: boolean,
): void {
  if (!incomeTargets || Object.keys(incomeTargets).length === 0) return;

  const incStore = useIncomeStore.getState();

  for (const { week, year, profileIdx } of weeks) {
    const profile = WEEKLY_PROFILE[profileIdx];
    const incomeRatio = randFloat(profile.incomeRatio[0], profile.incomeRatio[1]);

    const { start: weekStart } = getWeekDates(week, year);

    for (const [source, target] of Object.entries(incomeTargets)) {
      const code = source as IncomeCode;
      const weeklyExpected = target.monthlyAmount / 4;
      const isFixed = FIXED_INCOME_SOURCES.includes(code);

      // Fixed sources: every week with small variance
      // Variable sources: present ~1 in 3 weeks
      if (!isFixed && Math.random() > 0.35) continue;

      const variance = isFixed ? randFloat(0.95, 1.05) : incomeRatio;
      const amount = roundTo(Math.max(weeklyExpected * variance, roundStep), roundStep);
      if (amount <= 0) continue;

      // Pick a random day in the week for the income
      const dayOffset = isFixed ? randInt(0, 2) : randInt(0, 6); // Fixed incomes tend to be early in week
      const txDate = new Date(weekStart);
      txDate.setUTCDate(txDate.getUTCDate() + dayOffset);

      const labels = INCOME_LABELS[code] || ['Revenu'];
      const label = labels[Math.floor(Math.random() * labels.length)];

      incStore.addIncome({
        source: code,
        label,
        amount,
        transaction_date: formatDateISO(txDate),
        week_number: week,
        year,
        notes: null,
      });
    }
  }
}

// ─── 1c. Performance records ───

function populatePerformanceRecords(
  weeks: Array<{ week: number; year: number; profileIdx: number }>,
  weeklyBudget: number,
  weeklyTarget: number,
  weeklyEconomies: number[],
): void {
  const perfStore = usePerformanceStore.getState();

  for (let i = 0; i < weeks.length; i++) {
    const { week, year } = weeks[i];
    const economies = weeklyEconomies[i] ?? 0;
    const weeklySpent = weeklyBudget - economies;

    const result = calculateWeeklySavings(weeklyBudget, weeklyTarget, weeklySpent);

    perfStore.saveWeeklyRecord({
      week_number: week,
      year,
      weeklyBudget,
      weeklyTarget,
      weeklySpent,
      economies: result.economies,
      economiesTotal: result.economiesTotal,
      eprProvision: result.eprProvision,
      surplus: result.surplus,
      depassement: result.depassement,
      note: result.note,
      grade: result.grade,
      epargne: result.epargne,
      investissement: result.investissement,
      discretionnaire: result.discretionnaire,
      budgetRespecte: result.budgetRespecte,
      tauxExecution: result.tauxExecution,
    });
  }
}

// ─── 1d. Savings goals ───

function populateSavingsGoals(
  weeklyBudget: number,
  weeks: Array<{ week: number; year: number; profileIdx: number }>,
  weeklyEconomies: number[],
  roundStep: number,
): void {
  const goalStore = useSavingsGoalStore.getState();

  const monthlyBudget = weeklyBudget * 4;
  const goalDefs: Array<{
    name: string;
    icon: GoalIcon;
    color: string;
    targetMultiplier: number;
    contributionWeeks: number[];  // indices into weeks array
    contributionRatio: number;    // % of surplus to contribute
    allocation: { mode: 'manual' | 'fixed' | 'deadline' | 'percent'; fixedAmount?: number; percentAmount?: number };
    contributionSource: 'manual' | 'auto';
  }> = [
    {
      name: "Fonds d'urgence",
      icon: 'urgence',
      color: '#34D399',
      targetMultiplier: 4,
      contributionWeeks: [2, 4, 5, 6, 7, 8, 9],
      contributionRatio: 0.20,
      allocation: { mode: 'percent', percentAmount: 20 },
      contributionSource: 'auto',
    },
    {
      name: 'Voyage vacances',
      icon: 'voyage',
      color: '#60A5FA',
      targetMultiplier: 8,
      contributionWeeks: [4, 6, 7, 9],
      contributionRatio: 0.12,
      allocation: { mode: 'deadline' },
      contributionSource: 'auto',
    },
    {
      name: 'Nouveau telephone',
      icon: 'tech',
      color: '#22D3EE',
      targetMultiplier: 2,
      contributionWeeks: [5, 7, 8],
      contributionRatio: 0.10,
      allocation: { mode: 'fixed', fixedAmount: roundTo(weeklyBudget * 0.10, roundStep) },
      contributionSource: 'auto',
    },
  ];

  // Calculate deadline: ~6 months from now
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 6);
  const deadlineStr = deadline.toISOString().slice(0, 10);

  for (const def of goalDefs) {
    goalStore.addGoal({
      name: def.name,
      targetAmount: roundTo(monthlyBudget * def.targetMultiplier, roundStep),
      deadline: deadlineStr,
      icon: def.icon,
      color: def.color,
      allocation: def.allocation,
      plan: null,
    });

    // Get the freshly created goal (first in array since addGoal prepends)
    const goals = goalStore.getActiveGoals();
    const goal = goals.find((g) => g.name === def.name);
    if (!goal) continue;

    // Add contributions for specified weeks
    for (const weekIdx of def.contributionWeeks) {
      if (weekIdx >= weeklyEconomies.length) continue;
      const surplus = weeklyEconomies[weekIdx];
      if (surplus <= 0) continue;

      const amount = roundTo(
        Math.max(surplus * def.contributionRatio, roundStep),
        roundStep,
      );
      if (amount <= 0) continue;

      const weekLabel = def.contributionSource === 'auto'
        ? `Auto S${weeks[weekIdx].week}-${weeks[weekIdx].year}`
        : `Semaine ${weeks[weekIdx].week}`;
      goalStore.addContribution(goal.id, amount, weekLabel, def.contributionSource);
    }
  }
}

// ─── 1e. Impulse purchases ───

function populateImpulses(
  weeklyBudget: number,
  weeks: Array<{ week: number; year: number; profileIdx: number }>,
  weeklyEconomies: number[],
  roundStep: number,
): void {
  const impulseStore = useImpulseStore.getState();

  const impulseDefs = [
    { label: 'Chaussures en promo', category: '02' as COICOPCode, weekIdx: 1, mode: 'control' as const, ratio: 0.15 },
    { label: 'Restaurant entre amis', category: '07' as COICOPCode, weekIdx: 4, mode: 'wealth' as const, ratio: 0.08 },
    { label: 'Gadget electronique', category: '07' as COICOPCode, weekIdx: 6, mode: 'control' as const, ratio: 0.12 },
  ];

  for (const def of impulseDefs) {
    if (def.weekIdx >= weeks.length) continue;
    const { week, year } = weeks[def.weekIdx];
    const { start: weekStart } = getWeekDates(week, year);
    const txDate = new Date(weekStart);
    txDate.setUTCDate(txDate.getUTCDate() + randInt(1, 5));

    const amount = roundTo(weeklyBudget * def.ratio, roundStep);
    const surplus = weeklyEconomies[def.weekIdx] ?? 0;
    const canAfford = surplus >= amount;

    // Build compensations for non-affordable purchases
    const compensations = canAfford
      ? []
      : [
          {
            category: def.category,
            weeklyReduction: roundTo(amount / 3, roundStep),
            totalWeeks: 3,
            startWeek: week + 1 > 52 ? 1 : week + 1,
            startYear: week + 1 > 52 ? year + 1 : year,
          },
        ];

    impulseStore.addPurchase({
      label: def.label,
      amount,
      category: def.category,
      date: formatDateISO(txDate),
      week_number: week,
      year,
      mode: def.mode,
      verdict: canAfford ? 'can_afford' : 'compensated',
      compensations,
    });
  }
}

// ─── 1f. Challenges ───

function populateChallenges(
  weeks: Array<{ week: number; year: number; profileIdx: number }>,
): void {
  const challengeStore = useChallengeStore.getState();

  // Complete challenges S1–S8 (first 8 plan weeks)
  // Map demo weeks to plan weeks 1-8
  const challengesToComplete = Math.min(8, weeks.length);

  for (let i = 0; i < challengesToComplete; i++) {
    const planWeek = i + 1;
    const challenge = FINANCIAL_CHALLENGES.find((c) => c.week === planWeek);
    if (!challenge) continue;

    const { week: calWeek, year: calYear } = weeks[i];

    // Mark savoir read
    challengeStore.markSavoirRead(
      challenge.id,
      planWeek,
      calWeek,
      calYear,
      challenge.points.savoir,
    );

    // Mark condition met for most (skip 2 to make it realistic — not 100%)
    // Skip S6 (manual — impulse shield) and sometimes S8
    const skipCondition = challenge.conditionKey === 'manual' || (i === 7 && Math.random() < 0.4);
    if (!skipCondition) {
      challengeStore.markConditionMet(
        challenge.id,
        planWeek,
        calWeek,
        calYear,
        challenge.points.faire,
        challenge.points.maitriser,
      );
    }
  }
}
