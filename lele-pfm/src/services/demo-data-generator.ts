import { WizardFormData, IncomeEntry, ExpenseEntry, FinancialHistoryEntry } from '@/stores/wizard-store';

// ─── Helpers ───

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(chance: number): boolean {
  return Math.random() < chance;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

// ─── Constants ───

const PROFILES = [
  'Salarié', 'Indépendant', 'Fonctionnaire', 'Étudiant', 'Retraité',
  'Entrepreneur', 'Intérimaire', 'Auto-entrepreneur', 'Sans emploi',
  'Cadre', 'Profession libérale', 'Agriculteur',
] as const;

const SITUATIONS = [
  'Célibataire', 'En couple', 'Pacsé(e)', 'Marié(e)',
  'Séparé(e)', 'Divorcé(e)', 'Veuf/Veuve',
] as const;

const ENGAGEMENT_LEVELS = ['beginner', 'curious', 'active', 'expert'] as const;

const COUNTRIES = [
  'CI', 'SN', 'CM', 'FR', 'BE', 'NG', 'GH', 'MA', 'TN', 'CD',
  'GA', 'ML', 'BF', 'TG', 'BJ', 'KE', 'ZA', 'US', 'CA', 'DE',
] as const;

const INCOME_SOURCES = ['formal', 'mixed', 'informal', 'seasonal'] as const;
const URBAN_RURAL = ['urban', 'rural'] as const;

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  CI: 'FCFA', SN: 'FCFA', ML: 'FCFA', BF: 'FCFA', NE: 'FCFA', TG: 'FCFA', BJ: 'FCFA', GW: 'FCFA',
  CM: 'FCFA', GA: 'FCFA', CG: 'FCFA', TD: 'FCFA', CF: 'FCFA', GQ: 'FCFA',
  FR: 'EUR', BE: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR',
  CH: 'CHF', GB: 'GBP',
  MA: 'MAD', TN: 'TND', DZ: 'DZD',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
  CD: 'CDF', GN: 'GNF', RW: 'RWF', ET: 'ETB', TZ: 'TZS',
  US: 'USD', CA: 'CAD', BR: 'BRL', MX: 'MXN', HT: 'HTG',
  IN: 'INR', CN: 'CNY', JP: 'JPY', VN: 'VND', PH: 'PHP', BD: 'BDT', PK: 'PKR',
  LB: 'LBP', AE: 'AED', SA: 'SAR',
};

// Income sources with realistic FCFA ranges (monthly equivalent)
const INCOME_CONFIGS: Array<{
  key: string;
  minAmount: number;
  maxAmount: number;
  frequency: 'monthly' | 'annual';
  probability: number;
  growthRate: number;
  type: 'Fixe' | 'Variable';
  chance: number; // probability this source is active
}> = [
  { key: 'salaire',        minAmount: 200000,  maxAmount: 1500000, frequency: 'monthly', probability: 98, growthRate: 2.5, type: 'Fixe',     chance: 0.85 },
  { key: 'primes',          minAmount: 100000,  maxAmount: 800000,  frequency: 'annual',  probability: 70, growthRate: 0,   type: 'Variable', chance: 0.55 },
  { key: 'locatifs',        minAmount: 50000,   maxAmount: 300000,  frequency: 'monthly', probability: 90, growthRate: 1.7, type: 'Fixe',     chance: 0.25 },
  { key: 'aides',           minAmount: 20000,   maxAmount: 100000,  frequency: 'monthly', probability: 85, growthRate: 1.0, type: 'Fixe',     chance: 0.35 },
  { key: 'freelance',       minAmount: 50000,   maxAmount: 500000,  frequency: 'monthly', probability: 65, growthRate: 0,   type: 'Variable', chance: 0.20 },
  { key: 'dividendes',      minAmount: 100000,  maxAmount: 2000000, frequency: 'annual',  probability: 80, growthRate: 3.0, type: 'Variable', chance: 0.15 },
  { key: 'pension',         minAmount: 100000,  maxAmount: 500000,  frequency: 'monthly', probability: 95, growthRate: 1.0, type: 'Fixe',     chance: 0.10 },
  { key: 'autres_revenus',  minAmount: 20000,   maxAmount: 200000,  frequency: 'monthly', probability: 50, growthRate: 0,   type: 'Variable', chance: 0.15 },
];

// Expense categories with realistic FCFA ranges (monthly)
const EXPENSE_CONFIGS: Array<{
  key: string;
  minAmount: number;
  maxAmount: number;
  frequency: 'monthly' | 'annual';
  type: 'Fixe' | 'Variable';
  nature: 'Essentielle' | 'Discrétionnaire';
  elasticity: number;
  chance: number;
}> = [
  { key: 'logement',       minAmount: 50000,  maxAmount: 400000, frequency: 'monthly', type: 'Fixe',     nature: 'Essentielle',       elasticity: 10, chance: 0.90 },
  { key: 'alimentation',   minAmount: 40000,  maxAmount: 250000, frequency: 'monthly', type: 'Variable', nature: 'Essentielle',       elasticity: 25, chance: 0.95 },
  { key: 'transport',      minAmount: 20000,  maxAmount: 150000, frequency: 'monthly', type: 'Variable', nature: 'Essentielle',       elasticity: 35, chance: 0.85 },
  { key: 'sante',          minAmount: 10000,  maxAmount: 80000,  frequency: 'monthly', type: 'Variable', nature: 'Essentielle',       elasticity: 15, chance: 0.70 },
  { key: 'telecom',        minAmount: 10000,  maxAmount: 45000,  frequency: 'monthly', type: 'Fixe',     nature: 'Discrétionnaire',   elasticity: 45, chance: 0.90 },
  { key: 'education',      minAmount: 20000,  maxAmount: 200000, frequency: 'monthly', type: 'Fixe',     nature: 'Essentielle',       elasticity: 10, chance: 0.45 },
  { key: 'loisirs',        minAmount: 15000,  maxAmount: 120000, frequency: 'monthly', type: 'Variable', nature: 'Discrétionnaire',   elasticity: 65, chance: 0.75 },
  { key: 'habillement',    minAmount: 10000,  maxAmount: 80000,  frequency: 'monthly', type: 'Variable', nature: 'Discrétionnaire',   elasticity: 70, chance: 0.65 },
];

// ─── Generator ───

export function generateDemoData(): WizardFormData {
  const currentYear = new Date().getFullYear();

  // Step 1 — Profile
  const job = randPick(PROFILES);
  const age = String(randInt(22, 62));
  const dependents = String(randInt(0, 5));
  const situation = randPick(SITUATIONS);

  // Step 2 — Incomes
  const incomes: Record<string, IncomeEntry> = {};
  let hasAtLeastOneIncome = false;
  for (const cfg of INCOME_CONFIGS) {
    if (maybe(cfg.chance)) {
      incomes[cfg.key] = {
        amount: roundTo(randInt(cfg.minAmount, cfg.maxAmount), 5000),
        frequency: cfg.frequency,
        probability: cfg.probability + randInt(-10, 5),
        growthRate: cfg.growthRate + (Math.random() * 2 - 0.5),
        type: cfg.type,
      };
      hasAtLeastOneIncome = true;
    }
  }
  // Ensure at least salary exists
  if (!hasAtLeastOneIncome) {
    incomes['salaire'] = {
      amount: roundTo(randInt(250000, 1200000), 5000),
      frequency: 'monthly',
      probability: 98,
      growthRate: 2.5,
      type: 'Fixe',
    };
  }

  // Step 2 — Expenses
  const expenses: Record<string, ExpenseEntry> = {};
  for (const cfg of EXPENSE_CONFIGS) {
    if (maybe(cfg.chance)) {
      expenses[cfg.key] = {
        amount: roundTo(randInt(cfg.minAmount, cfg.maxAmount), 5000),
        frequency: cfg.frequency,
        type: cfg.type,
        nature: cfg.nature,
        elasticity: cfg.elasticity + randInt(-5, 10),
      };
    }
  }
  // Ensure at least logement + alimentation
  if (!expenses['logement']) {
    expenses['logement'] = { amount: roundTo(randInt(60000, 300000), 5000), frequency: 'monthly', type: 'Fixe', nature: 'Essentielle', elasticity: 10 };
  }
  if (!expenses['alimentation']) {
    expenses['alimentation'] = { amount: roundTo(randInt(50000, 200000), 5000), frequency: 'monthly', type: 'Variable', nature: 'Essentielle', elasticity: 25 };
  }

  // Step 3 — History (5 years with realistic growth)
  // getMonthlyTotal returns MONTHLY totals — multiply by 12 for ANNUAL history values
  const annualIncome = getMonthlyTotal(incomes) * 12;
  const annualExpense = getMonthlyTotal(expenses) * 12;
  const history: FinancialHistoryEntry[] = [];
  for (let i = 0; i < 5; i++) {
    const yearOffset = i - 4; // -4, -3, -2, -1, 0
    const growthFactor = 1 + yearOffset * (0.03 + Math.random() * 0.04); // 3-7% annual growth
    const expenseGrowth = 1 + yearOffset * (0.02 + Math.random() * 0.03); // 2-5% expense growth
    history.push({
      year: currentYear + yearOffset,
      income: roundTo(annualIncome * Math.max(0.6, growthFactor) + randInt(-200000, 200000), 50000),
      expenses: roundTo(annualExpense * Math.max(0.6, expenseGrowth) + randInt(-150000, 150000), 50000),
    });
  }

  const engagementLevel = randPick(ENGAGEMENT_LEVELS);

  // Step 4 — Risks (6 domains)
  const risks: Record<string, number> = {
    emploi: randInt(10, 85),
    logement: randInt(10, 75),
    sante: randInt(5, 60),
    endettement: randInt(10, 80),
    epargne: randInt(15, 90),
    juridique: randInt(5, 50),
  };

  // Step 5 — Self-evaluation (5 ratings, each 1-5)
  const ratings = [
    randInt(1, 5),
    randInt(1, 5),
    randInt(1, 5),
    randInt(1, 5),
    randInt(1, 5),
  ];

  // Step 6 — Levers (6 levers, each 0-100)
  const levers: Record<string, number> = {
    formation: randInt(10, 90),
    epargne_auto: randInt(15, 85),
    negociation: randInt(5, 80),
    reduction_depenses: randInt(10, 75),
    side_project: randInt(0, 70),
    investissement: randInt(5, 85),
  };

  // New context fields
  const country = randPick(COUNTRIES);
  const currency = COUNTRY_TO_CURRENCY[country] ?? 'FCFA';
  const urbanRural = randPick(URBAN_RURAL);
  const incomeSource = randPick(INCOME_SOURCES);
  const extendedFamilyObligations = maybe(0.45); // 45% chance

  return {
    job,
    age,
    dependents,
    situation,
    country,
    currency,
    urbanRural,
    incomeSource,
    extendedFamilyObligations,
    incomes,
    expenses,
    history,
    engagementLevel,
    risks,
    ratings,
    levers,
  };
}

// ─── Utility ───

function getMonthlyTotal(entries: Record<string, { amount: number; frequency: 'monthly' | 'annual' }>): number {
  let total = 0;
  for (const entry of Object.values(entries)) {
    total += entry.frequency === 'annual' ? entry.amount / 12 : entry.amount;
  }
  return total;
}
