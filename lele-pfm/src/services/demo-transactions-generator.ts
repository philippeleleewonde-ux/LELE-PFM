/**
 * Demo Transaction Generator
 *
 * Generates realistic weekly transactions based on the user's engine output
 * (budget per category, currency, profile). Transactions are coherent with
 * the weekly budget, spread across weekdays, and use contextually appropriate labels.
 */

import { COICOPCode, TransactionType, PaymentMethod, EngineOutput } from '@/types';
import { getWeekDates, formatDateISO } from '@/utils/week-helpers';

// ─── Helpers ───

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybe(chance: number): boolean {
  return Math.random() < chance;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

// ─── Realistic Labels per Category & Currency Zone ───

interface LabelConfig {
  label: string;
  minRatio: number; // min % of category budget for this transaction
  maxRatio: number;
  paymentMethod: PaymentMethod;
  type: TransactionType;
}

// Labels adapted for FCFA zone (West/Central Africa) vs EUR/USD zones
const LABELS_FCFA: Record<COICOPCode, LabelConfig[]> = {
  '01': [
    { label: 'Marché du quartier', minRatio: 0.08, maxRatio: 0.25, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Supermarché Prosuma', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Boulangerie', minRatio: 0.03, maxRatio: 0.08, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Restaurant midi', minRatio: 0.05, maxRatio: 0.12, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Fruits et légumes', minRatio: 0.04, maxRatio: 0.10, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Poissonnerie', minRatio: 0.06, maxRatio: 0.15, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Eau minérale', minRatio: 0.02, maxRatio: 0.05, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Maquis (repas)', minRatio: 0.04, maxRatio: 0.10, paymentMethod: 'Espèces', type: 'Variable' },
  ],
  '02': [
    { label: 'Couturier', minRatio: 0.20, maxRatio: 0.50, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Chaussures', minRatio: 0.15, maxRatio: 0.40, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Pagne/Tissu', minRatio: 0.10, maxRatio: 0.30, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Friperie', minRatio: 0.05, maxRatio: 0.15, paymentMethod: 'Espèces', type: 'Variable' },
  ],
  '03': [
    { label: 'Loyer mensuel', minRatio: 0.50, maxRatio: 0.80, paymentMethod: 'Virement', type: 'Fixe' },
    { label: 'Facture CIE (électricité)', minRatio: 0.08, maxRatio: 0.20, paymentMethod: 'Virement', type: 'Fixe' },
    { label: 'Facture SODECI (eau)', minRatio: 0.03, maxRatio: 0.10, paymentMethod: 'Virement', type: 'Fixe' },
    { label: 'Gaz butane', minRatio: 0.02, maxRatio: 0.06, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Entretien maison', minRatio: 0.03, maxRatio: 0.10, paymentMethod: 'Espèces', type: 'Variable' },
  ],
  '04': [
    { label: 'Pharmacie', minRatio: 0.15, maxRatio: 0.40, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Consultation médecin', minRatio: 0.20, maxRatio: 0.50, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Mutuelle santé', minRatio: 0.25, maxRatio: 0.60, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Analyses laboratoire', minRatio: 0.10, maxRatio: 0.30, paymentMethod: 'Espèces', type: 'Variable' },
  ],
  '05': [
    { label: 'Carburant', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Gbaka/Wôrô-wôrô', minRatio: 0.05, maxRatio: 0.12, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Taxi', minRatio: 0.05, maxRatio: 0.15, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Entretien véhicule', minRatio: 0.10, maxRatio: 0.25, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Péage autoroute', minRatio: 0.02, maxRatio: 0.06, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Assurance auto', minRatio: 0.15, maxRatio: 0.30, paymentMethod: 'Virement', type: 'Fixe' },
  ],
  '06': [
    { label: 'Forfait Orange/MTN', minRatio: 0.30, maxRatio: 0.60, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Internet fibre', minRatio: 0.25, maxRatio: 0.50, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Recharge crédit', minRatio: 0.05, maxRatio: 0.15, paymentMethod: 'Espèces', type: 'Variable' },
  ],
  '07': [
    { label: 'Cinéma', minRatio: 0.10, maxRatio: 0.25, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Sortie week-end', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Abonnement Netflix', minRatio: 0.10, maxRatio: 0.20, paymentMethod: 'CarteBancaire', type: 'Fixe' },
    { label: 'Sport/Fitness', minRatio: 0.10, maxRatio: 0.25, paymentMethod: 'CarteBancaire', type: 'Fixe' },
    { label: 'Cadeau', minRatio: 0.05, maxRatio: 0.20, paymentMethod: 'Espèces', type: 'Variable' },
  ],
  '08': [
    { label: 'Fournitures scolaires', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Cours de soutien', minRatio: 0.20, maxRatio: 0.45, paymentMethod: 'Espèces', type: 'Fixe' },
    { label: 'Formation en ligne', minRatio: 0.15, maxRatio: 0.30, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Livres/manuels', minRatio: 0.05, maxRatio: 0.15, paymentMethod: 'CarteBancaire', type: 'Variable' },
  ],
};

const LABELS_EUR: Record<COICOPCode, LabelConfig[]> = {
  '01': [
    { label: 'Supermarché Carrefour', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Boulangerie', minRatio: 0.03, maxRatio: 0.08, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Restaurant midi', minRatio: 0.06, maxRatio: 0.14, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Lidl courses', minRatio: 0.10, maxRatio: 0.25, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Primeur fruits', minRatio: 0.03, maxRatio: 0.08, paymentMethod: 'Espèces', type: 'Variable' },
    { label: 'Deliveroo/UberEats', minRatio: 0.05, maxRatio: 0.12, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Café croissant', minRatio: 0.02, maxRatio: 0.05, paymentMethod: 'CarteBancaire', type: 'Variable' },
  ],
  '02': [
    { label: 'Zara / H&M', minRatio: 0.20, maxRatio: 0.50, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Chaussures sport', minRatio: 0.15, maxRatio: 0.40, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Pressing/nettoyage', minRatio: 0.05, maxRatio: 0.15, paymentMethod: 'CarteBancaire', type: 'Variable' },
  ],
  '03': [
    { label: 'Loyer', minRatio: 0.50, maxRatio: 0.80, paymentMethod: 'Virement', type: 'Fixe' },
    { label: 'Électricité EDF', minRatio: 0.05, maxRatio: 0.15, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Assurance habitation', minRatio: 0.05, maxRatio: 0.12, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Charges copropriété', minRatio: 0.04, maxRatio: 0.10, paymentMethod: 'Prélèvement', type: 'Fixe' },
  ],
  '04': [
    { label: 'Pharmacie', minRatio: 0.10, maxRatio: 0.30, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Consultation médecin', minRatio: 0.15, maxRatio: 0.40, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Mutuelle complémentaire', minRatio: 0.20, maxRatio: 0.50, paymentMethod: 'Prélèvement', type: 'Fixe' },
  ],
  '05': [
    { label: 'Essence Total', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Pass Navigo', minRatio: 0.15, maxRatio: 0.30, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Uber/Bolt', minRatio: 0.05, maxRatio: 0.15, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Parking', minRatio: 0.03, maxRatio: 0.08, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Assurance auto', minRatio: 0.10, maxRatio: 0.25, paymentMethod: 'Prélèvement', type: 'Fixe' },
  ],
  '06': [
    { label: 'Forfait mobile Free', minRatio: 0.25, maxRatio: 0.50, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Internet box', minRatio: 0.25, maxRatio: 0.50, paymentMethod: 'Prélèvement', type: 'Fixe' },
  ],
  '07': [
    { label: 'Cinéma UGC', minRatio: 0.08, maxRatio: 0.20, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Sortie restaurant', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Netflix/Spotify', minRatio: 0.08, maxRatio: 0.15, paymentMethod: 'CarteBancaire', type: 'Fixe' },
    { label: 'Salle de sport', minRatio: 0.10, maxRatio: 0.25, paymentMethod: 'Prélèvement', type: 'Fixe' },
    { label: 'Livre/BD', minRatio: 0.04, maxRatio: 0.10, paymentMethod: 'CarteBancaire', type: 'Variable' },
  ],
  '08': [
    { label: 'Formation Udemy', minRatio: 0.15, maxRatio: 0.35, paymentMethod: 'CarteBancaire', type: 'Variable' },
    { label: 'Cours de langue', minRatio: 0.20, maxRatio: 0.40, paymentMethod: 'CarteBancaire', type: 'Fixe' },
    { label: 'Livres/manuels', minRatio: 0.10, maxRatio: 0.25, paymentMethod: 'CarteBancaire', type: 'Variable' },
  ],
};

// ─── Category spending probability & intensity ───

// How likely each category gets transactions this week, and spending intensity
const CATEGORY_BEHAVIOR: Record<COICOPCode, { weeklyChance: number; spendRatio: [number, number] }> = {
  '01': { weeklyChance: 1.00, spendRatio: [0.55, 0.90] }, // Always spend on food, 55-90% of budget
  '02': { weeklyChance: 0.25, spendRatio: [0.20, 0.60] }, // Clothes: 1 in 4 weeks
  '03': { weeklyChance: 0.90, spendRatio: [0.70, 1.00] }, // Housing: almost always (rent, bills)
  '04': { weeklyChance: 0.30, spendRatio: [0.15, 0.50] }, // Health: occasional
  '05': { weeklyChance: 0.85, spendRatio: [0.40, 0.80] }, // Transport: frequent
  '06': { weeklyChance: 0.80, spendRatio: [0.60, 0.95] }, // Telecom: subscriptions
  '07': { weeklyChance: 0.65, spendRatio: [0.25, 0.70] }, // Leisure: variable
  '08': { weeklyChance: 0.20, spendRatio: [0.15, 0.45] }, // Education: occasional
};

// ─── Main Generator ───

export interface DemoTransactionInput {
  profile_id: string;
  type: TransactionType;
  category: COICOPCode;
  label: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_date: string;
  week_number: number;
  year: number;
  is_reconciled: boolean;
  notes: string | null;
}

/**
 * Generate realistic demo transactions for a given week.
 * Uses engine output to determine budgets and distribution.
 *
 * @param engineOutput - The calculated engine output
 * @param currency - The user's currency (FCFA, EUR, USD, etc.)
 * @param week - ISO week number
 * @param year - ISO year
 * @returns Array of transaction inputs ready for addTransaction()
 */
export function generateDemoTransactions(
  engineOutput: EngineOutput,
  currency: string,
  week: number,
  year: number,
): DemoTransactionInput[] {
  const transactions: DemoTransactionInput[] = [];

  const weeklyBudget = engineOutput.step9?.weekly_budget ?? 0;
  if (weeklyBudget <= 0) return transactions;

  const categoryVentilation = engineOutput.step10?.by_category;
  if (!categoryVentilation) return transactions;

  // Get week dates for realistic date distribution
  const { start: weekStart } = getWeekDates(week, year);

  // Choose label set based on currency
  const isFCFA = currency === 'FCFA' || currency === 'XOF' || currency === 'XAF';
  const labelSet = isFCFA ? LABELS_FCFA : LABELS_EUR;

  // Rounding step based on currency
  const roundStep = isFCFA ? 500 : 1;

  const COICOP_CODES: COICOPCode[] = ['01', '02', '03', '04', '05', '06', '07', '08'];

  // Target total spending = 60-90% of weekly budget (realistic)
  const targetSpendRatio = 0.60 + Math.random() * 0.30;
  const targetTotalSpend = weeklyBudget * targetSpendRatio;
  let currentTotal = 0;

  for (const code of COICOP_CODES) {
    const behavior = CATEGORY_BEHAVIOR[code];
    const catVentilation = categoryVentilation[code];

    // Skip if no budget or random skip
    if (!catVentilation || catVentilation.budget_rate <= 0) continue;
    if (!maybe(behavior.weeklyChance)) continue;

    // Category weekly budget
    const catBudget = Math.round(weeklyBudget * catVentilation.budget_rate / 100);
    if (catBudget <= 0) continue;

    // Target spend for this category: ratio of its budget
    const [minSpend, maxSpend] = behavior.spendRatio;
    const catTargetSpend = catBudget * (minSpend + Math.random() * (maxSpend - minSpend));

    // Budget guard: don't exceed total target
    const remainingBudget = targetTotalSpend - currentTotal;
    if (remainingBudget <= 0) break;
    const cappedSpend = Math.min(catTargetSpend, remainingBudget);

    // Generate 1-4 transactions for this category
    const labels = labelSet[code];
    if (!labels || labels.length === 0) continue;

    // Shuffle and pick 1-4 labels
    const shuffled = [...labels].sort(() => Math.random() - 0.5);
    const txCount = Math.min(randInt(1, 4), shuffled.length);
    const selectedLabels = shuffled.slice(0, txCount);

    // Distribute the category spend across transactions
    let catRemaining = cappedSpend;

    for (let i = 0; i < selectedLabels.length; i++) {
      const cfg = selectedLabels[i];

      // Amount for this transaction
      let txAmount: number;
      if (i === selectedLabels.length - 1) {
        // Last transaction gets the remainder
        txAmount = catRemaining;
      } else {
        // Random portion based on label's ratio config
        const ratio = cfg.minRatio + Math.random() * (cfg.maxRatio - cfg.minRatio);
        txAmount = catBudget * ratio;
        txAmount = Math.min(txAmount, catRemaining * 0.7); // Leave room for remaining txs
      }

      txAmount = roundTo(Math.max(txAmount, roundStep), roundStep);
      if (txAmount <= 0) continue;
      catRemaining -= txAmount;

      // Random day within the week (0-6 offset from Monday)
      const dayOffset = randInt(0, 6);
      const txDate = new Date(weekStart);
      txDate.setUTCDate(txDate.getUTCDate() + dayOffset);

      transactions.push({
        profile_id: 'local',
        type: cfg.type,
        category: code,
        label: cfg.label,
        amount: txAmount,
        payment_method: cfg.paymentMethod,
        transaction_date: formatDateISO(txDate),
        week_number: week,
        year: year,
        is_reconciled: false,
        notes: null,
      });

      currentTotal += txAmount;
    }
  }

  return transactions;
}

/**
 * Generate demo transactions for the current week plus optionally previous weeks.
 * Useful for populating the calendar/history.
 */
export function generateMultiWeekDemo(
  engineOutput: EngineOutput,
  currency: string,
  currentWeek: number,
  currentYear: number,
  weeksBack: number = 0,
): DemoTransactionInput[] {
  const allTransactions: DemoTransactionInput[] = [];

  for (let i = weeksBack; i >= 0; i--) {
    let w = currentWeek - i;
    let y = currentYear;
    if (w <= 0) {
      w += 52;
      y -= 1;
    }
    const weekTxs = generateDemoTransactions(engineOutput, currency, w, y);
    allTransactions.push(...weekTxs);
  }

  return allTransactions;
}
