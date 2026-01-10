// ============================================
// HCM DATA SCANNER - TYPE DEFINITIONS
// ============================================

/**
 * COMPREHENSIVE KEYWORD DATABASE
 * Supports 180+ keywords across 10 financial categories
 * Covers: Accounting, Banking, Insurance, HR, and Organizational Risk reports
 */
export const KEYWORD_DATABASE = {
  // ==========================================
  // 1. REVENUE / SALES (Rapports Comptables)
  // ==========================================
  revenue: [
    // French variations
    'chiffre d\'affaires',
    'chiffre d affaires',
    'CA',
    'revenus',
    'ventes',
    'produits',
    'produits d\'exploitation',
    'produits d exploitation',
    'recettes',
    'total des ventes',
    'montant des ventes',
    'revenus bruts',
    'revenus nets',

    // English variations
    'revenue',
    'revenues',
    'sales',
    'total sales',
    'turnover',
    'income',
    'gross revenue',
    'gross sales',
    'total revenue',
    'sales revenue',
    'operating revenue',
    'top line',
    'net revenue',
    'gross income'
  ],

  // ==========================================
  // 2. EXPENSES / CHARGES (Rapports Comptables)
  // ==========================================
  expenses: [
    // French variations
    'charges',
    'dépenses',
    'depenses',
    'coûts',
    'couts',
    'frais',
    'charges d\'exploitation',
    'charges d exploitation',
    'charges totales',
    'total des charges',
    'dépenses totales',
    'depenses totales',

    // English variations
    'expenses',
    'costs',
    'expenditure',
    'expenditures',
    'operating expenses',
    'total expenses',
    'total costs',
    'opex',
    'operational costs',
    'operating costs',
    'cost of sales',
    'COGS'
  ],

  // ==========================================
  // 3. BANKING - CREDIT RISK (Pilier 3, ICAAP)
  // ==========================================
  credit_risk: [
    // French
    'risque de crédit',
    'risque de credit',
    'exposition au risque de crédit',
    'exposition au risque de credit',
    'perte attendue',
    'perte inattendue',
    'EAD',
    'exposition en cas de défaut',
    'exposition en cas de defaut',
    'PD',
    'probabilité de défaut',
    'probabilite de defaut',
    'LGD',
    'perte en cas de défaut',
    'perte en cas de defaut',
    'actifs pondérés par le risque',
    'actifs ponderes par le risque',
    'RWA',

    // English
    'credit risk',
    'credit exposure',
    'expected loss',
    'EL',
    'unexpected loss',
    'UL',
    'exposure at default',
    'EAD',
    'probability of default',
    'PD',
    'loss given default',
    'LGD',
    'risk weighted assets',
    'RWA',
    'credit risk capital',
    'default rate',
    'non-performing loans',
    'NPL'
  ],

  // ==========================================
  // 4. BANKING - MARKET RISK (Pilier 3)
  // ==========================================
  market_risk: [
    // French
    'risque de marché',
    'risque de marche',
    'value at risk',
    'VaR',
    'VaR stressée',
    'VaR stresse',
    'stressed VaR',
    'risque de taux',
    'risque de change',
    'risque sur actions',
    'risque de matières premières',
    'risque de matieres premieres',

    // English
    'market risk',
    'value at risk',
    'VaR',
    'stressed VaR',
    'sVaR',
    'interest rate risk',
    'foreign exchange risk',
    'FX risk',
    'equity risk',
    'commodity risk',
    'market risk capital',
    'trading book',
    'incremental risk charge',
    'IRC'
  ],

  // ==========================================
  // 5. BANKING - LIQUIDITY (ICAAP, COREP)
  // ==========================================
  liquidity_risk: [
    // French
    'risque de liquidité',
    'risque de liquidite',
    'ratio de liquidité',
    'ratio de liquidite',
    'LCR',
    'liquidity coverage ratio',
    'NSFR',
    'net stable funding ratio',
    'actifs liquides de haute qualité',
    'HQLA',
    'ratio de couverture de liquidité',
    'ratio de financement stable net',

    // English
    'liquidity risk',
    'liquidity ratio',
    'LCR',
    'liquidity coverage ratio',
    'NSFR',
    'net stable funding ratio',
    'high quality liquid assets',
    'HQLA',
    'funding ratio',
    'loan to deposit ratio',
    'LTD',
    'available stable funding',
    'ASF',
    'required stable funding',
    'RSF'
  ],

  // ==========================================
  // 6. BANKING - OPERATIONAL RISK (Pilier 3)
  // ==========================================
  operational_risk: [
    // French
    'risque opérationnel',
    'risque operationnel',
    'pertes opérationnelles',
    'pertes operationnelles',
    'approche mesure avancée',
    'AMA',
    'approche indicateur de base',
    'BIA',
    'approche standard',
    'TSA',
    'exigence de fonds propres opérationnels',

    // English
    'operational risk',
    'operational losses',
    'advanced measurement approach',
    'AMA',
    'basic indicator approach',
    'BIA',
    'standardized approach',
    'TSA',
    'operational risk capital',
    'op risk',
    'operational risk RWA',
    'loss event',
    'risk event'
  ],

  // ==========================================
  // 7. INSURANCE - SOLVENCY (SFCR, QRT)
  // ==========================================
  solvency_risk: [
    // French
    'solvabilité',
    'solvabilite',
    'SCR',
    'capital de solvabilité requis',
    'capital de solvabilite requis',
    'MCR',
    'minimum de capital requis',
    'fonds propres',
    'fonds propres éligibles',
    'fonds propres eligibles',
    'ratio de solvabilité',
    'ratio de solvabilite',
    'ratio de couverture du SCR',
    'excédent de fonds propres',
    'excedent de fonds propres',

    // English
    'solvency',
    'solvency capital requirement',
    'SCR',
    'minimum capital requirement',
    'MCR',
    'own funds',
    'eligible own funds',
    'solvency ratio',
    'SCR coverage ratio',
    'capital surplus',
    'capital adequacy',
    'solvency II',
    'regulatory capital'
  ],

  // ==========================================
  // 8. INSURANCE - UNDERWRITING RISK (SFCR)
  // ==========================================
  underwriting_risk: [
    // French
    'risque de souscription',
    'risque vie',
    'risque de mortalité',
    'risque de mortalite',
    'risque de longévité',
    'risque de longevite',
    'risque de rachat',
    'risque de lapse',
    'risque santé',
    'risque sante',
    'risque non-vie',
    'risque de prime',
    'risque de réserve',
    'risque de reserve',
    'risque catastrophe',

    // English
    'underwriting risk',
    'life risk',
    'mortality risk',
    'longevity risk',
    'lapse risk',
    'surrender risk',
    'health risk',
    'disability risk',
    'non-life risk',
    'premium risk',
    'reserve risk',
    'catastrophe risk',
    'cat risk',
    'morbidity risk'
  ],

  // ==========================================
  // 9. HR INDICATORS (Bilan Social, RSE)
  // ==========================================
  hr_indicators: [
    // French
    'effectifs',
    'effectif total',
    'ETP',
    'équivalent temps plein',
    'equivalent temps plein',
    'FTE',
    'heures travaillées',
    'heures travaillees',
    'heures de travail',
    'absentéisme',
    'absenteisme',
    'taux d\'absentéisme',
    'taux d absenteisme',
    'turnover',
    'rotation du personnel',
    'départs',
    'departs',
    'embauches',
    'recrutements',
    'formation',
    'heures de formation',
    'budget formation',
    'masse salariale',

    // English
    'headcount',
    'full-time equivalent',
    'FTE',
    'working hours',
    'hours worked',
    'absenteeism',
    'absence rate',
    'absenteeism rate',
    'turnover',
    'turnover rate',
    'attrition',
    'attrition rate',
    'hires',
    'new hires',
    'departures',
    'leavers',
    'training hours',
    'training budget',
    'payroll',
    'total compensation'
  ],

  // ==========================================
  // 10. ORGANIZATIONAL RISKS
  // ==========================================
  organizational_risk: [
    // French
    'risques organisationnels',
    'risque personnel',
    'risque humain',
    'risque matériel',
    'risque materiel',
    'risque équipement',
    'risque equipement',
    'risque informatique',
    'risque IT',
    'risque cyber',
    'cybersécurité',
    'cybersecurite',
    'risque environnemental',
    'risque de conformité',
    'risque de conformite',
    'risque juridique',
    'risque de réputation',
    'risque de reputation',

    // English
    'organizational risk',
    'people risk',
    'human risk',
    'equipment risk',
    'IT risk',
    'information technology risk',
    'cyber risk',
    'cybersecurity risk',
    'environmental risk',
    'compliance risk',
    'legal risk',
    'regulatory risk',
    'reputational risk',
    'reputation risk',
    'business continuity',
    'disaster recovery'
  ]
} as const;

/**
 * BUSINESS LINE DETECTION KEYWORDS
 * Used to detect structured tables with business line names and associated metrics
 */
export const BUSINESS_LINE_KEYWORDS = {
  // Column headers for business line names
  nameColumns: [
    // French
    'ligne d\'activité',
    'ligne d activité',
    'ligne d\'activite',
    'ligne d activite',
    'activité',
    'activite',
    'département',
    'departement',
    'division',
    'service',
    'entité',
    'entite',
    'unité',
    'unite',
    'branche',
    'secteur',

    // English
    'business line',
    'business unit',
    'department',
    'division',
    'service',
    'entity',
    'unit',
    'branch',
    'sector',
    'segment'
  ],

  // Column headers for headcount
  headcountColumns: [
    // French
    'effectifs',
    'effectif',
    'ETP',
    'FTE',
    'équivalent temps plein',
    'equivalent temps plein',
    'nombre d\'employés',
    'nombre d employés',
    'nombre d\'employes',
    'nombre d employes',
    'personnel',
    'salariés',
    'salaries',

    // English
    'headcount',
    'head count',
    'employees',
    'FTE',
    'full-time equivalent',
    'workforce',
    'staff'
  ],

  // Column headers for budget
  budgetColumns: [
    // French
    'budget',
    'budget N-1',
    'budget n-1',
    'budget année précédente',
    'budget annee precedente',
    'budget prévisionnel',
    'budget previsionnel',
    'dotation',
    'enveloppe budgétaire',
    'enveloppe budgetaire',

    // English
    'budget',
    'budget N-1',
    'budget n-1',
    'previous year budget',
    'annual budget',
    'budgetary allocation',
    'funding'
  ]
} as const;

/**
 * Extended financial data categories
 * Now supports 10 categories across Banking, Insurance, HR, and Organizational reporting
 */
export type FinancialCategory =
  | 'revenue'
  | 'expenses'
  | 'credit_risk'
  | 'market_risk'
  | 'liquidity_risk'
  | 'operational_risk'
  | 'solvency_risk'
  | 'underwriting_risk'
  | 'hr_indicators'
  | 'organizational_risk';

/**
 * Single financial data point extracted from document
 */
export interface FinancialDataPoint {
  id: string;
  category: FinancialCategory;
  keyword: string; // The matched keyword
  amount: number;
  year: number;
  currency?: string;
  confidence: number; // 0-1 score from fuzzy matching
  position: {
    row: number;
    col: number;
  };
  sheetName?: string; // Name of the Excel sheet (for multi-sheet files)
  validated: boolean;
  manuallyEdited: boolean;
}

/**
 * Business Line (Ligne d'activité) with associated metrics
 * Maximum 8 business lines can be detected per file
 */
/**
 * Year-specific metrics for multi-year business line data
 */
export interface YearlyMetrics {
  headcount?: number;              // Effectifs
  budget?: number;                 // Budget
  revenue?: number;                // Revenus
  expenses?: number;               // Charges
  [key: string]: number | undefined;  // Extensible for other metrics
}

export interface BusinessLine {
  id: string;
  name: string;                    // e.g., "Retail Banking", "Corporate Banking"
  metrics: {
    headcount?: number;            // Effectifs
    budgetN1?: number;             // Budget année N-1
    revenue?: number;              // Revenus
    expenses?: number;             // Charges
    [key: string]: number | undefined;  // Extensible for other metrics
  };
  yearlyData?: {
    [year: number]: YearlyMetrics; // Multi-year data if detected (e.g., { 2022: {...}, 2023: {...}, 2024: {...} })
  };
  year: number;                    // Primary reference year
  confidence: number;              // Detection confidence (0-1)
  position: {
    row: number;                   // Row in Excel where this line was found
    col: number;
  };
  sheetName?: string;
}

/**
 * Scan result from a single file
 */
export interface ScanResult {
  fileId: string;
  fileName: string;
  fileType: 'excel' | 'pdf';
  scanDate: Date;
  dataPoints: FinancialDataPoint[];
  businessLines?: BusinessLine[];  // Up to 8 business lines (NEW)
  status: 'scanning' | 'pending_validation' | 'validated' | 'error';
  errorMessage?: string;
}

/**
 * User's complete scan history
 */
export interface UserScanData {
  userId: string;
  scans: ScanResult[];
  lastUpdated: Date;
}

/**
 * Scanning algorithm directions
 */
export type ScanDirection = 'right' | 'left' | 'top' | 'bottom';

/**
 * Cell data from Excel/PDF parsing
 */
export interface CellData {
  row: number;
  col: number;
  value: string | number;
  type: 'string' | 'number' | 'date' | 'empty';
}

/**
 * Validation action from user
 */
export interface ValidationAction {
  dataPointId: string;
  action: 'accept' | 'reject' | 'edit';
  editedValue?: {
    amount?: number;
    year?: number;
    category?: FinancialCategory;
  };
}

/**
 * Upload file state
 */
export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'ready' | 'scanning' | 'completed' | 'error';
  errorMessage?: string;
}

/**
 * Scan engine configuration
 */
export interface ScanConfig {
  fuzzyThreshold: number; // 0-1, lower = more strict
  yearRange: {
    min: number; // N-5
    max: number; // N-1
  };
  searchDirections: ScanDirection[];
  maxSearchDistance: number; // Max cells to search in each direction
}

/**
 * Default scan configuration
 */
export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  fuzzyThreshold: 0.4, // 60% similarity required (plus tolérant)
  yearRange: {
    min: new Date().getFullYear() - 5, // N-5
    max: new Date().getFullYear() - 1  // N-1
  },
  searchDirections: ['right', 'left', 'top', 'bottom'],
  maxSearchDistance: 100 // Search up to 100 cells in each direction (spectre très large)
};

/**
 * Statistics for dashboard
 * Extended to support all 10 financial categories
 */
export interface ScanStatistics {
  totalScans: number;
  totalDataPoints: number;
  validatedDataPoints: number;
  averageConfidence: number;
  categoriesBreakdown: {
    revenue: number;
    expenses: number;
    credit_risk: number;
    market_risk: number;
    liquidity_risk: number;
    operational_risk: number;
    solvency_risk: number;
    underwriting_risk: number;
    hr_indicators: number;
    organizational_risk: number;
  };
  yearsCovered: number[];
}

/**
 * Category metadata for UI display
 */
export const CATEGORY_METADATA: Record<
  FinancialCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  revenue: {
    label: 'Revenus',
    icon: '💰',
    color: 'green',
    description: 'Chiffre d\'affaires, ventes, produits'
  },
  expenses: {
    label: 'Charges',
    icon: '📉',
    color: 'red',
    description: 'Dépenses, coûts, charges d\'exploitation'
  },
  credit_risk: {
    label: 'Risque de Crédit',
    icon: '🏦',
    color: 'blue',
    description: 'EAD, PD, LGD, RWA, pertes attendues/inattendues'
  },
  market_risk: {
    label: 'Risque de Marché',
    icon: '📊',
    color: 'purple',
    description: 'VaR, risque de taux, change, actions'
  },
  liquidity_risk: {
    label: 'Risque de Liquidité',
    icon: '💧',
    color: 'cyan',
    description: 'LCR, NSFR, HQLA, ratios de liquidité'
  },
  operational_risk: {
    label: 'Risque Opérationnel',
    icon: '⚙️',
    color: 'orange',
    description: 'Pertes opérationnelles, AMA, BIA'
  },
  solvency_risk: {
    label: 'Solvabilité',
    icon: '🛡️',
    color: 'indigo',
    description: 'SCR, MCR, fonds propres, Solvabilité II'
  },
  underwriting_risk: {
    label: 'Risque de Souscription',
    icon: '📋',
    color: 'pink',
    description: 'Mortalité, longévité, lapse, risques santé'
  },
  hr_indicators: {
    label: 'Indicateurs RH',
    icon: '👥',
    color: 'teal',
    description: 'Effectifs, ETP, absentéisme, turnover, formation'
  },
  organizational_risk: {
    label: 'Risques Organisationnels',
    icon: '🏢',
    color: 'gray',
    description: 'Risques humains, matériels, IT, cyber, conformité'
  }
};
