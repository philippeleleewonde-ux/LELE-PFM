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
  LeverType,
  ProfileType,
  COICOPCode,
} from '@/types/database';
import { WizardFormData } from '@/stores/wizard-store';


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
export function mapLabelToCOICOP(label: string, lang?: string): COICOPCode {
  const norm = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // FR keywords (default)
  const FR_PATTERNS: Array<[RegExp, COICOPCode]> = [
    [/aliment|nourrit|courses|epicer|restaurant|cantine|repas|manger|bouffe|vivr|supermarche|marche|boulanger|boucher|poisson|legume|fruit/, '01'],
    [/vetement|habit|chaussur|textile|mode|linge|fringue/, '02'],
    [/loyer|logement|habitation|electricite|eau|gaz|chauffag|charges|syndic|immobil|amenag/, '03'],
    [/sante|medecin|pharmac|mutuelle|hopital|dentist|optique|medicament|doctor|soins/, '04'],
    [/transport|essence|carburant|voiture|auto|moto|bus|metro|train|taxi|peage|parking|deplac|uber|bolt/, '05'],
    [/communic|telephone|mobile|internet|forfait|fibre|telecom/, '06'],
    [/loisir|sortie|cinema|sport|voyage|vacanc|jeu|divertiss|abonnement|netflix|spotify/, '07'],
    [/education|scolar|ecole|universi|formation|cours|etude|livre|fourniture/, '08'],
  ];

  // EN keywords
  const EN_PATTERNS: Array<[RegExp, COICOPCode]> = [
    [/food|grocer|supermarket|restaurant|meal|eat|lunch|dinner|breakfast|bakery|butcher|fish|vegetable|fruit|snack/, '01'],
    [/cloth|shoe|garment|textile|fashion|apparel|dress|shirt|pants/, '02'],
    [/rent|housing|electricity|water|gas|heating|mortgage|home|apartment|utility|maintenance/, '03'],
    [/health|doctor|pharmacy|hospital|dentist|medical|medicine|insurance|clinic/, '04'],
    [/transport|fuel|gasoline|car|bike|bus|subway|train|taxi|parking|uber|bolt|ride|commute|toll/, '05'],
    [/phone|mobile|internet|telecom|subscription|data|wifi|fiber/, '06'],
    [/leisure|entertainment|cinema|movie|sport|travel|vacation|game|hobby|netflix|spotify|gym/, '07'],
    [/education|school|university|tuition|course|study|book|supplies|training/, '08'],
  ];

  // ES keywords
  const ES_PATTERNS: Array<[RegExp, COICOPCode]> = [
    [/aliment|comida|supermercado|restaurante|comestible|cena|almuerzo|desayuno|panaderia|carniceria|fruta|verdura|mercado/, '01'],
    [/ropa|calzado|zapato|textil|moda|vestido|camisa|pantalon/, '02'],
    [/alquiler|vivienda|electricidad|agua|gas|calefaccion|hipoteca|hogar|mantenimiento/, '03'],
    [/salud|medico|farmacia|hospital|dentista|medicina|seguro|clinica/, '04'],
    [/transporte|combustible|gasolina|coche|moto|autobus|metro|tren|taxi|peaje|estacion|uber|bolt/, '05'],
    [/telefono|movil|internet|telecom|datos|fibra/, '06'],
    [/ocio|entretenimiento|cine|deporte|viaje|vacacion|juego|netflix|spotify|gimnasio/, '07'],
    [/educacion|escuela|universidad|curso|estudio|libro|material|formacion/, '08'],
  ];

  // PT keywords
  const PT_PATTERNS: Array<[RegExp, COICOPCode]> = [
    [/aliment|comida|supermercado|restaurante|refeicao|almoco|jantar|cafe|padaria|acougue|fruta|legume|mercado|feira/, '01'],
    [/roupa|calcado|sapato|textil|moda|vestido|camisa|calca/, '02'],
    [/aluguel|moradia|eletricidade|agua|gas|aquecimento|hipoteca|casa|manutencao|condominio/, '03'],
    [/saude|medico|farmacia|hospital|dentista|medicina|seguro|clinica/, '04'],
    [/transporte|combustivel|gasolina|carro|moto|onibus|metro|trem|taxi|pedagio|uber|bolt/, '05'],
    [/telefone|celular|internet|telecom|dados|fibra/, '06'],
    [/lazer|entretenimento|cinema|esporte|viagem|ferias|jogo|netflix|spotify|academia/, '07'],
    [/educacao|escola|universidade|curso|estudo|livro|material|formacao/, '08'],
  ];

  const patternSets: Record<string, Array<[RegExp, COICOPCode]>> = {
    fr: FR_PATTERNS,
    en: EN_PATTERNS,
    es: ES_PATTERNS,
    pt: PT_PATTERNS,
  };

  // Try current language first, then FR as fallback
  const primaryPatterns = patternSets[lang ?? 'fr'] ?? FR_PATTERNS;
  for (const [regex, code] of primaryPatterns) {
    if (regex.test(norm)) return code;
  }

  // If not FR, also try FR patterns as fallback
  if (lang && lang !== 'fr') {
    for (const [regex, code] of FR_PATTERNS) {
      if (regex.test(norm)) return code;
    }
  }

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
      (riskAssessment as unknown as Record<string, number>)[dbKey] = val * 20; // 1-5 → 20-100
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
      lever_type: (LEVER_TYPE_MAP[key] ?? 'reduction_depenses') as LeverType,
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
