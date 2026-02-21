/**
 * Maps WizardFormData (from wizard-store) -> EngineInput (for PersonalFinanceEngine)
 * Handles type conversions, default values, and cents conversion where needed.
 */
import { EngineInput } from '@/types/engine';
import {
  Profile,
  Revenue,
  Expense,
  FinancialHistory,
  FinancialCommitment,
  RiskAssessment,
  EKHScore,
  ImprovementLever,
  ProfileType,
  COICOPCode,
} from '@/types/database';
import { WizardFormData } from '@/stores/wizard-store';

const COICOP_CODES: COICOPCode[] = ['01', '02', '03', '04', '05', '06', '07', '08'];

const PROFILE_TYPE_MAP: Record<string, ProfileType> = {
  'salarie': 'Salarié',
  'independant': 'Indépendant',
  'fonctionnaire': 'Fonctionnaire',
  'etudiant': 'Étudiant',
  'retraite': 'Retraité',
  'entrepreneur': 'Entrepreneur',
  'interimaire': 'Intérimaire',
  'auto-entrepreneur': 'Auto-entrepreneur',
  'sans-emploi': 'Sans emploi',
  'cadre': 'Cadre',
  'profession-liberale': 'Profession libérale',
  'agriculteur': 'Agriculteur',
};

const RISK_KEY_MAP: Record<string, keyof Pick<RiskAssessment, 'employment_stability' | 'income_predictability' | 'expense_predictability' | 'emergency_fund_months' | 'debt_to_income_ratio' | 'liquidity_score'>> = {
  'emploi': 'employment_stability',
  'revenus': 'income_predictability',
  'depenses': 'expense_predictability',
  'epargne': 'emergency_fund_months',
  'endettement': 'debt_to_income_ratio',
  'liquidite': 'liquidity_score',
};

const LEVER_TYPE_MAP: Record<string, string> = {
  'reduction': 'reduction_depenses',
  'assurances': 'optimisation_assurances',
  'revenus': 'augmentation_revenus',
  'dette': 'remboursement_dette',
  'epargne': 'boost_epargne',
  'fiscal': 'optimisation_fiscale',
};

/**
 * Maps a free-text expense label to the closest COICOP code via keyword matching.
 *
 * CODES ALIGNÉS sur COICOPCategory (database.ts:55-64) :
 *   01 = FOOD (Alimentation)
 *   02 = CLOTHING (Vêtements)
 *   03 = HOUSING (Logement)
 *   04 = HEALTH (Santé)
 *   05 = TRANSPORT (Transports)
 *   06 = COMMUNICATIONS
 *   07 = RECREATION (Loisirs)
 *   08 = EDUCATION
 *
 * Fallback: '07' (Loisirs) if no match found.
 */
function mapLabelToCOICOP(label: string): COICOPCode {
  const norm = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // 01 - Alimentation (FOOD)
  if (/aliment|nourrit|courses|epicer|restaurant|cantine|repas|manger|bouffe|vivr/.test(norm)) return '01';
  // 02 - Vêtements et chaussures (CLOTHING)
  if (/vetement|habit|chaussur|textile|mode|linge|fringue/.test(norm)) return '02';
  // 03 - Logement, eau, électricité, gaz (HOUSING)
  if (/loyer|logement|habitation|electricite|eau|gaz|chauffag|charges|syndic|immobil|amenag/.test(norm)) return '03';
  // 04 - Santé (HEALTH)
  if (/sante|medecin|pharmac|mutuelle|hopital|dentist|optique|medicament|doctor|soins/.test(norm)) return '04';
  // 05 - Transports (TRANSPORT)
  if (/transport|essence|carburant|voiture|auto|moto|bus|metro|train|taxi|peage|parking|deplac/.test(norm)) return '05';
  // 06 - Communications
  if (/communic|telephone|mobile|internet|forfait|fibre|telecom/.test(norm)) return '06';
  // 07 - Loisirs et culture (RECREATION)
  if (/loisir|sortie|cinema|sport|voyage|vacanc|jeu|divertiss|abonnement|netflix|spotify/.test(norm)) return '07';
  // 08 - Éducation (EDUCATION)
  if (/education|scolar|ecole|universi|formation|cours|etude|livre|fourniture/.test(norm)) return '08';
  return '07'; // fallback Loisirs
}

function resolveProfileType(job: string): ProfileType {
  const normalized = job.toLowerCase().trim().replace(/[éè]/g, 'e').replace(/\s+/g, '-');
  return PROFILE_TYPE_MAP[normalized] ?? 'Salarié';
}

function toNumber(val: string | number, fallback: number = 0): number {
  if (typeof val === 'number') return val;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function toCents(amount: number): number {
  // Wizard collects whole values (e.g. 350000 for 350,000 FCFA)
  // Engine expects CENTS. If values are already in whole units, multiply by 100.
  // However, the wizard amounts are already in the base unit (FCFA), and the engine
  // works with these values directly (called "cents" for precision).
  // Keep as-is since wizard already collects integer amounts.
  return Math.round(amount);
}

export function mapWizardToEngineInput(formData: WizardFormData): EngineInput {
  // --- Profile ---
  const totalMonthlyRevenue = Object.values(formData.incomes).reduce((sum, inc) => {
    const monthly = inc.frequency === 'annual' ? inc.amount / 12 : inc.amount;
    return sum + monthly;
  }, 0);

  const profile: Profile = {
    id: 'wizard-profile',
    user_id: 'wizard-user',
    profile_type: resolveProfileType(formData.job),
    situation: formData.situation || 'Célibataire',
    budget_period: toCents(totalMonthlyRevenue),
    weekly_target_epr: 0,
    incompressibility_rate: 50,
    flexibility_score: 50,
    dependents: toNumber(formData.dependents),
    experience_years: 0,
    age: toNumber(formData.age, 35),
    risk_profile: 'Modéré',
    country_code: formData.country || 'CI',
    urban_rural: formData.urbanRural || 'urban',
    income_source: formData.incomeSource || 'formal',
    extended_family_obligations: formData.extendedFamilyObligations ?? false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // --- Revenues ---
  const revenues: Revenue[] = Object.entries(formData.incomes).map(([key, inc], idx) => ({
    id: `rev-${idx}`,
    profile_id: 'wizard-profile',
    type: inc.type === 'Fixe' ? 'Fixe' : 'Variable',
    label: key,
    amount: toCents(inc.amount),
    frequency: inc.frequency as 'monthly' | 'annual',
    probability: inc.probability ?? 100,
    start_date: new Date().toISOString(),
    end_date: null,
    growth_rate: inc.growthRate ?? 0,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // --- Expenses ---
  const expenses: Expense[] = Object.entries(formData.expenses).map(([key, exp], idx) => {
    const code = mapLabelToCOICOP(key);
    return {
      id: `exp-${idx}`,
      profile_id: 'wizard-profile',
      type: exp.type === 'Fixe' ? 'Fixe' : 'Variable',
      nature: exp.nature ?? 'Essentielle',
      label: key,
      amount: toCents(exp.amount),
      frequency: (exp.frequency as 'monthly' | 'annual') ?? 'monthly',
      probability: 100,
      payment_method: 'Virement' as const,
      coicop_code: code,
      start_date: new Date().toISOString(),
      end_date: null,
      elasticity: exp.elasticity ?? 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  // --- History ---
  const filteredHistory = formData.history.filter((h) => h.income > 0 || h.expenses > 0);

  // Calculate trend-based epr_planned: use previous year's EPR + average growth
  const eprValues = filteredHistory.map((h) => h.income - h.expenses);
  const eprGrowthRates: number[] = [];
  for (let i = 1; i < eprValues.length; i++) {
    if (eprValues[i - 1] !== 0) {
      eprGrowthRates.push((eprValues[i] - eprValues[i - 1]) / Math.abs(eprValues[i - 1]));
    }
  }
  const avgEprGrowth = eprGrowthRates.length > 0
    ? eprGrowthRates.reduce((a, b) => a + b, 0) / eprGrowthRates.length
    : 0;

  const history: FinancialHistory[] = filteredHistory.map((h, idx) => {
      const eprActual = h.income - h.expenses;
      // Trend-based planned: previous year's actual EPR × (1 + avg growth)
      const eprPlanned = idx > 0
        ? (filteredHistory[idx - 1].income - filteredHistory[idx - 1].expenses) * (1 + avgEprGrowth)
        : eprActual; // first year: planned = actual (no prior reference)
      return {
        id: `hist-${idx}`,
        profile_id: 'wizard-profile',
        period: `${h.year}`,
        actual_revenue: toCents(h.income),
        actual_expenses: toCents(h.expenses),
        epr_actual: toCents(eprActual),
        epr_planned: toCents(eprPlanned),
        savings_rate: h.income > 0 ? Math.round((eprActual / h.income) * 100) : 0,
        inflation_index: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

  // --- Commitments (none from wizard) ---
  const commitments: FinancialCommitment[] = [];

  // --- Risk Assessment ---
  const riskAssessment: RiskAssessment = {
    id: 'wizard-risk',
    profile_id: 'wizard-profile',
    employment_stability: 50,
    income_predictability: 50,
    expense_predictability: 50,
    emergency_fund_months: 3,
    debt_to_income_ratio: 30,
    liquidity_score: 50,
    health_insurance: false,
    unemployment_insurance: false,
    liability_insurance: false,
    property_insurance: false,
    life_insurance: false,
    auto_insurance: false,
    risk_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Map wizard risk sliders (1-5 scale → percentage)
  for (const [wizardKey, dbKey] of Object.entries(RISK_KEY_MAP)) {
    const val = formData.risks[wizardKey];
    if (val !== undefined) {
      (riskAssessment as any)[dbKey] = val * 20; // 1-5 → 20-100
    }
  }

  // --- EKH Score ---
  // ratings[0] = E (Economique), ratings[1] = K (Kompetences), ratings[2] = H (Home)
  const ratings = formData.ratings || [0, 0, 0, 0, 0];
  const eScore = Math.min(5, Math.max(0, ratings[0] ?? 0));
  const kScore = Math.min(5, Math.max(0, ratings[1] ?? 0));
  const hScore = Math.min(5, Math.max(0, ratings[2] ?? 0));

  const ekhScore: EKHScore = {
    id: 'wizard-ekh',
    profile_id: 'wizard-profile',
    e_score: eScore,
    k_score: kScore,
    h_score: hScore,
    combined_score: eScore + kScore + hScore,
    interpretation: '',
    assessment_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // --- Improvement Levers ---
  const levers: ImprovementLever[] = Object.entries(formData.levers)
    .filter(([, val]) => val > 0)
    .map(([key, val], idx) => ({
      id: `lever-${idx}`,
      profile_id: 'wizard-profile',
      lever_type: (LEVER_TYPE_MAP[key] ?? 'reduction_depenses') as any,
      label: key,
      description: '',
      estimated_impact: toCents(val),
      priority: idx + 1,
      implementation_timeline: 'short_term' as const,
      is_active: true,
      actual_impact: null,
      implementation_date: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  // Raw risk scores (6 domaines wizard, non transformés) pour les 5 indicateurs PFM
  const rawRiskScores: Record<string, number> = { ...formData.risks };

  return {
    profile,
    revenues,
    expenses,
    history,
    commitments,
    riskAssessment,
    ekhScore,
    levers,
    rawRiskScores,
  };
}
