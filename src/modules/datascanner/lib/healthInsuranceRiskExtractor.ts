/**
 * Phase 2.14: Health & Insurance Risk Extractor
 *
 * Extracts Specific Health and Insurance Risk data over 5 years for:
 * - Type A: Insurance Companies/Mutuals (SFCR, combined ratio, solvency)
 * - Type B: Banks with Insurance Activity (contribution to NBI)
 * - Type C: Employers/Non-Insurance (HR costs, health coverage)
 *
 * Key Features:
 * - Automatic entity type detection from document
 * - 60+ regex patterns (French/English)
 * - FLUX vs STOCK aggregation methodology
 * - Solvency II compliance validation
 * - Combined ratio profitability analysis
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Entity type determines which metrics to extract
 */
export type EntityType = 'insurance_company' | 'bank_with_insurance' | 'employer' | 'unknown';

/**
 * Configuration for health & insurance risk extraction
 */
export interface HealthInsuranceRiskConfig {
  yearsToExtract?: number;
  currentYear?: number;
  minConfidence?: number;
  verbose?: boolean;
  entityType?: EntityType; // Auto-detect if not specified

  // Enable/disable specific extractions
  enableCombinedRatio?: boolean;
  enableSolvency?: boolean;
  enableProvisions?: boolean;
  enableMaliBoni?: boolean;
  enableBankContribution?: boolean;
  enableEmployerCosts?: boolean;
}

export const DEFAULT_HEALTH_INSURANCE_RISK_CONFIG: Required<HealthInsuranceRiskConfig> = {
  yearsToExtract: 5,
  currentYear: new Date().getFullYear(),
  minConfidence: 0.6,
  verbose: false,
  entityType: 'unknown', // Will auto-detect
  enableCombinedRatio: true,
  enableSolvency: true,
  enableProvisions: true,
  enableMaliBoni: true,
  enableBankContribution: true,
  enableEmployerCosts: true,
};

// ============================================================================
// TYPE A: INSURANCE COMPANY DATA STRUCTURES
// ============================================================================

/**
 * Insurance Company technical performance data (yearly)
 */
export interface InsuranceCompanyYearData {
  year: number;
  yearLabel: string;

  // Technical ratios (EVOLUTION - not cumulative)
  combinedRatio: number;        // Ratio combiné (%) - <100% = profitable
  lossRatio: number;            // Ratio S/P (%) - Claims/Premiums
  expenseRatio: number;         // Ratio frais de gestion (%)

  // Claims (FLUX - cumulative)
  claimsPaid: number;           // Sinistres payés (M€)
  claimsIncurred: number;       // Sinistres survenus (M€)
  premiumsWritten: number;      // Primes émises (M€)

  // Technical provisions (STOCK - not cumulative)
  technicalProvisions: number;  // Provisions techniques totales (M€)
  outstandingClaims: number;    // Provisions sinistres à payer (M€)

  // Mali/Boni (FLUX - cumulative)
  reserveDeficiency: number;    // Mali de liquidation (M€) - under-provisioning
  reserveRelease: number;       // Boni de liquidation (M€) - over-provisioning

  // Solvency (EVOLUTION)
  solvencyRatio: number;        // Ratio de solvabilité (%) - must be ≥100%
  scrRequired: number;          // SCR - Solvency Capital Requirement (M€)
  ownFunds: number;             // Fonds propres éligibles (M€)

  confidence: number;
  source: string;
}

/**
 * Insurance Company 5-year summary
 */
export interface InsuranceCompany5YearSummary {
  // Technical performance (EVOLUTION of ratios)
  technicalPerformance: {
    avgCombinedRatio: number;
    initialCombinedRatio: number;
    finalCombinedRatio: number;
    evolutionPoints: number;      // Change in points
    profitableYears: number;      // Years with ratio < 100%
    unprofitableYears: number;    // Years with ratio ≥ 100%
  };

  // Claims (CUMULATIVE - FLUX)
  claims: {
    totalClaims5Y: number;        // Cumul sinistres 5 ans (M€)
    avgAnnual: number;
    peakYear: number;
    peakAmount: number;
  };

  // Provisions (STOCK evolution)
  provisions: {
    initialProvisions: number;    // First year (M€)
    finalProvisions: number;      // Last year (M€)
    evolutionAbsolute: number;    // Absolute change (M€)
    evolutionPercent: number;     // Relative change (%)
  };

  // Mali/Boni (CUMULATIVE - FLUX)
  maliBoni: {
    totalMali5Y: number;          // Cumul mali (M€)
    totalBoni5Y: number;          // Cumul boni (M€)
    netBalance5Y: number;         // Net (boni - mali)
    interpretation: 'over_provisioned' | 'under_provisioned' | 'balanced';
  };

  // Solvency (EVOLUTION)
  solvency: {
    avgSolvencyRatio: number;
    minSolvencyRatio: number;
    yearWithMinRatio: number;
    alwaysCompliant: boolean;     // Always ≥100%
    avgMargin: number;            // Average margin above 100%
  };

  overallRating: 'Excellent' | 'Good' | 'Adequate' | 'Weak';
  recommendations: string[];
}

// ============================================================================
// TYPE B: BANK WITH INSURANCE DATA STRUCTURES
// ============================================================================

/**
 * Bank insurance activity data (yearly)
 */
export interface BankInsuranceYearData {
  year: number;
  yearLabel: string;

  // Insurance contribution (FLUX - cumulative)
  insuranceRevenue: number;        // Revenus assurance (M€)
  insuranceLosses: number;         // Pertes activité assurance (M€)

  // Contribution to bank results (EVOLUTION)
  contributionToNBI: number;       // % of total NBI

  confidence: number;
  source: string;
}

/**
 * Bank insurance 5-year summary
 */
export interface BankInsurance5YearSummary {
  // Revenue contribution (CUMULATIVE - FLUX)
  revenue: {
    totalRevenue5Y: number;
    avgAnnual: number;
    evolutionPercent: number;
  };

  // Losses (CUMULATIVE - FLUX)
  losses: {
    totalLosses5Y: number;
    yearsWithLosses: number;
  };

  // Contribution to NBI (EVOLUTION)
  nbiContribution: {
    avgContributionPercent: number;
    evolution: 'increasing' | 'stable' | 'decreasing';
  };

  overallRating: 'Strong' | 'Moderate' | 'Weak';
}

// ============================================================================
// TYPE C: EMPLOYER DATA STRUCTURES
// ============================================================================

/**
 * Employer health & insurance costs (yearly)
 */
export interface EmployerHealthYearData {
  year: number;
  yearLabel: string;

  // Health coverage costs (FLUX - cumulative)
  healthCoverageCosts: number;     // Coûts couverture santé (M€)

  // Retirement provisions (STOCK - not cumulative)
  retirementProvisions: number;    // Provisions retraite IAS 19 (M€)

  // Per employee metrics
  averageHeadcount: number;
  costPerEmployee: number;         // Health cost per employee (€)

  confidence: number;
  source: string;
}

/**
 * Employer 5-year summary
 */
export interface EmployerHealth5YearSummary {
  // Health costs (CUMULATIVE - FLUX)
  healthCosts: {
    totalCosts5Y: number;
    avgAnnual: number;
    costPerEmployeeAvg: number;
    evolutionPercent: number;
  };

  // Retirement provisions (STOCK evolution)
  retirementProvisions: {
    initialProvisions: number;
    finalProvisions: number;
    evolutionAbsolute: number;
    evolutionPercent: number;
  };

  overallRating: 'Low' | 'Moderate' | 'High';
}

// ============================================================================
// UNIFIED RESULT STRUCTURE
// ============================================================================

/**
 * Main result structure - adapts to entity type
 */
export interface HealthInsuranceRiskResult {
  entityType: EntityType;
  entityTypeConfidence: number;

  // Type A: Insurance Company data
  insuranceCompanyData?: {
    yearlyData: InsuranceCompanyYearData[];
    summary5Year: InsuranceCompany5YearSummary;
  };

  // Type B: Bank with Insurance data
  bankInsuranceData?: {
    yearlyData: BankInsuranceYearData[];
    summary5Year: BankInsurance5YearSummary;
  };

  // Type C: Employer data
  employerHealthData?: {
    yearlyData: EmployerHealthYearData[];
    summary5Year: EmployerHealth5YearSummary;
  };

  yearsExtracted: number[];
  confidence: number;
  validation: HealthInsuranceRiskValidation;
  extractionDate: string;
  config: Required<HealthInsuranceRiskConfig>;
}

/**
 * Validation results
 */
export interface HealthInsuranceRiskValidation {
  isValid: boolean;
  alerts: string[];

  // Insurance-specific validations
  solvencyCompliance?: {
    alwaysCompliant: boolean;
    yearsNonCompliant: number[];
  };

  technicalProfitability?: {
    profitableYears: number;
    unprofitableYears: number;
  };

  provisionsCoherence?: {
    coherent: boolean;
    coverageYears: number;      // Provisions / Annual Claims
    message: string;
  };
}

// ============================================================================
// REGEX PATTERNS - TYPE A: INSURANCE COMPANY
// ============================================================================

/**
 * Combined Ratio patterns (Ratio Combiné)
 * Target: <100% = profitable
 */
const COMBINED_RATIO_PATTERNS = [
  // French
  /ratio\s+combin[ée][:\s]+([\d,.]+)\s*%/gi,
  /combined\s+ratio[:\s]+([\d,.]+)\s*%/gi,
  /résultat\s+technique[:\s]+([\d,.]+)\s*%/gi,
  // English
  /technical\s+result[:\s]+([\d,.]+)\s*%/gi,
];

/**
 * Loss Ratio patterns (Ratio S/P - Sinistres/Primes)
 */
const LOSS_RATIO_PATTERNS = [
  // French
  /ratio\s+(?:sinistres?[/-]primes?|S\s*\/\s*P)[:\s]+([\d,.]+)\s*%/gi,
  /taux\s+de\s+sinistralité[:\s]+([\d,.]+)\s*%/gi,
  /sinistres?\s*\/\s*primes?[:\s]+([\d,.]+)\s*%/gi,
  // English
  /loss\s+ratio[:\s]+([\d,.]+)\s*%/gi,
  /claims?\s*\/\s*premiums?[:\s]+([\d,.]+)\s*%/gi,
  /claims?\s+ratio[:\s]+([\d,.]+)\s*%/gi,
];

/**
 * Claims patterns (Sinistres)
 */
const CLAIMS_PATTERNS = [
  // French
  /(?:charges?|co[ûu]ts?)\s+de\s+sinistres?[:\s]+([\d\s,.]+)\s*(M€|millions?|Mds?€)/gi,
  /sinistres?\s+pay[ée]s?[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
  /sinistres?\s+survenus?[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
  /prestations?\s+vers[ée]es?[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
  // English
  /claims?\s+(?:paid|incurred)[:\s]+([\d\s,.]+)\s*(M€|\$M|millions?)/gi,
  /benefit\s+payments?[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
  /insurance\s+claims?[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
];

/**
 * Technical Provisions patterns (Provisions Techniques)
 * STOCK - not cumulative
 */
const TECHNICAL_PROVISIONS_PATTERNS = [
  // French
  /provisions?\s+techniques?[:\s]+([\d\s,.]+)\s*(Mds?€|milliards?|M€)/gi,
  /provisions?\s+(?:pour\s+)?sinistres?\s+à\s+payer[:\s]+([\d\s,.]+)\s*(Mds?€|M€)/gi,
  /provisions?\s+math[ée]matiques?[:\s]+([\d\s,.]+)\s*(Mds?€|milliards?)/gi,
  /engagements?\s+(?:envers\s+les\s+)?assurés?[:\s]+([\d\s,.]+)\s*(Mds?€)/gi,
  // English
  /technical\s+(?:provisions?|reserves?)[:\s]+([\d\s,.]+)\s*(€?bn|billion|M€)/gi,
  /insurance\s+contract\s+liabilities[:\s]+([\d\s,.]+)\s*(€?bn|billion)/gi,
  /outstanding\s+claims?\s+(?:provisions?|reserves?)[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
];

/**
 * Mali de liquidation (Reserve Deficiency - under-provisioning)
 * FLUX - cumulative
 */
const RESERVE_DEFICIENCY_PATTERNS = [
  // French
  /mali\s+de\s+liquidation[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
  /insuffisance\s+(?:de\s+)?provisions?[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /provisions?\s+insuffisantes?[:\s]+([\d\s,.]+)\s*(M€)/gi,
  // English
  /reserve\s+strengthening[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
  /(?:under-?provisioning|underprovision)[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /adverse\s+reserve\s+development[:\s]+([\d\s,.]+)\s*(M€)/gi,
];

/**
 * Boni de liquidation (Reserve Release - over-provisioning)
 * FLUX - cumulative
 */
const RESERVE_RELEASE_PATTERNS = [
  // French
  /boni\s+de\s+liquidation[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
  /excédent\s+(?:de\s+)?provisions?[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /reprises?\s+(?:sur\s+)?provisions?[:\s]+([\d\s,.]+)\s*(M€)/gi,
  // English
  /reserve\s+release[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
  /(?:over-?provisioning|overprovision)[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /favorable\s+reserve\s+development[:\s]+([\d\s,.]+)\s*(M€)/gi,
];

/**
 * Solvency II Ratio patterns (Ratio de Solvabilité)
 * Target: ≥100% (regulatory requirement)
 */
const SOLVENCY_RATIO_PATTERNS = [
  // French
  /ratio\s+de\s+solvabilit[ée][:\s]+([\d,.]+)\s*%/gi,
  /taux\s+de\s+couverture\s+(?:du\s+)?SCR[:\s]+([\d,.]+)\s*%/gi,
  /couverture\s+(?:du\s+)?capital\s+de\s+solvabilit[ée][:\s]+([\d,.]+)\s*%/gi,
  // English
  /solvency\s+(?:II\s+)?ratio[:\s]+([\d,.]+)\s*%/gi,
  /SCR\s+coverage\s+ratio[:\s]+([\d,.]+)\s*%/gi,
  /capital\s+adequacy\s+ratio[:\s]+([\d,.]+)\s*%/gi,
];

/**
 * SCR (Solvency Capital Requirement) patterns
 */
const SCR_PATTERNS = [
  // French
  /SCR[:\s]+([\d\s,.]+)\s*(Mds?€|milliards?|M€)/gi,
  /capital\s+de\s+solvabilit[ée]\s+requis[:\s]+([\d\s,.]+)\s*(Mds?€|M€)/gi,
  // English
  /solvency\s+capital\s+requirement[:\s]+([\d\s,.]+)\s*(€?bn|billion|M€)/gi,
];

// ============================================================================
// REGEX PATTERNS - TYPE B: BANK WITH INSURANCE
// ============================================================================

/**
 * Insurance revenue patterns (for banks)
 */
const INSURANCE_REVENUE_PATTERNS = [
  // French
  /revenus?\s+(?:de\s+)?(?:l')?assurance[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
  /(?:PNB|produit\s+net\s+bancaire)\s+assurance[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /contribution\s+(?:de\s+)?(?:l')?assurance[:\s]+([\d\s,.]+)\s*(M€)/gi,
  // English
  /insurance\s+revenues?[:\s]+([\d\s,.]+)\s*(M€|\$M|millions?)/gi,
  /bancassurance\s+revenues?[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
  /insurance\s+income[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
];

/**
 * Insurance losses patterns (for banks)
 */
const INSURANCE_LOSSES_PATTERNS = [
  // French
  /pertes?\s+(?:sur\s+)?(?:l')?activit[ée]\s+(?:d')?assurance[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /d[ée]ficit\s+(?:technique\s+)?assurance[:\s]+([\d\s,.]+)\s*(M€)/gi,
  // English
  /insurance\s+(?:underwriting\s+)?losses?[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
  /insurance\s+(?:technical\s+)?deficit[:\s]+([\d\s,.]+)\s*(M€)/gi,
];

/**
 * Contribution to NBI patterns (%)
 */
const NBI_CONTRIBUTION_PATTERNS = [
  // French
  /contribution\s+(?:de\s+)?(?:l')?assurance\s+au\s+(?:PNB|résultat)[:\s]+([\d,.]+)\s*%/gi,
  /part\s+(?:de\s+)?(?:l')?assurance\s+(?:dans\s+le\s+)?(?:PNB|résultat)[:\s]+([\d,.]+)\s*%/gi,
  // English
  /insurance\s+contribution\s+to\s+(?:NBI|revenue)[:\s]+([\d,.]+)\s*%/gi,
];

// ============================================================================
// REGEX PATTERNS - TYPE C: EMPLOYER
// ============================================================================

/**
 * Health coverage costs patterns (for employers)
 */
const HEALTH_COVERAGE_COSTS_PATTERNS = [
  // French
  /co[ûu]ts?\s+(?:de\s+)?couverture\s+sant[ée][:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
  /cotisations?\s+(?:mutuelle|assurance\s+sant[ée])\s+entreprise[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /charges?\s+(?:de\s+)?protection\s+sociale[:\s]+([\d\s,.]+)\s*(M€)/gi,
  /avantages?\s+sant[ée]\s+employ[ée]s?[:\s]+([\d\s,.]+)\s*(M€)/gi,
  // English
  /health\s+(?:insurance\s+)?costs?[:\s]+([\d\s,.]+)\s*(M€|\$M|millions?)/gi,
  /employee\s+health\s+benefits?[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
  /healthcare\s+coverage\s+costs?[:\s]+([\d\s,.]+)\s*(M€)/gi,
];

/**
 * Retirement provisions patterns (IAS 19)
 */
const RETIREMENT_PROVISIONS_PATTERNS = [
  // French
  /provisions?\s+pour\s+(?:engagements?\s+de\s+)?retraites?[:\s]+([\d\s,.]+)\s*(M€|millions?|Mds?€)/gi,
  /engagements?\s+(?:de\s+)?retraite\s+\(IAS\s+19\)[:\s]+([\d\s,.]+)\s*(M€|Mds?€)/gi,
  /provisions?\s+avantages?\s+(?:post[ée]rieurs?\s+à\s+l')?emploi[:\s]+([\d\s,.]+)\s*(M€)/gi,
  // English
  /post-?employment\s+benefit\s+obligations?[:\s]+([\d\s,.]+)\s*(M€|\$M|millions?)/gi,
  /retirement\s+(?:benefit\s+)?provisions?[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
  /pension\s+obligations?\s+\(IAS\s+19\)[:\s]+([\d\s,.]+)\s*(M€|bn)/gi,
];

// ============================================================================
// ENTITY TYPE DETECTION
// ============================================================================

/**
 * Detect entity type from document content
 */
function detectEntityType(text: string): { type: EntityType; confidence: number } {
  const lowerText = text.toLowerCase();

  // Score for each entity type
  let insuranceScore = 0;
  let bankScore = 0;
  let employerScore = 0;

  // TYPE A: Insurance Company indicators
  const insuranceKeywords = [
    { keyword: 'sfcr', weight: 10 },
    { keyword: 'solvency and financial condition report', weight: 10 },
    { keyword: 'ratio combiné', weight: 8 },
    { keyword: 'combined ratio', weight: 8 },
    { keyword: 'solvabilité ii', weight: 8 },
    { keyword: 'solvency ii', weight: 8 },
    { keyword: 'provisions techniques', weight: 6 },
    { keyword: 'technical provisions', weight: 6 },
    { keyword: 'sinistres', weight: 4 },
    { keyword: 'claims incurred', weight: 4 },
    { keyword: 'mali de liquidation', weight: 7 },
    { keyword: 'boni de liquidation', weight: 7 },
    { keyword: 'scr', weight: 6 },
    { keyword: 'mcr', weight: 6 },
    { keyword: 'ratio s/p', weight: 5 },
    { keyword: 'loss ratio', weight: 5 },
  ];

  for (const { keyword, weight } of insuranceKeywords) {
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      insuranceScore += weight * matches.length;
    }
  }

  // TYPE B: Bank with Insurance indicators
  const bankKeywords = [
    { keyword: 'bancassurance', weight: 10 },
    { keyword: 'contribution assurance au pnb', weight: 8 },
    { keyword: 'insurance contribution to nbi', weight: 8 },
    { keyword: 'revenus assurance', weight: 6 },
    { keyword: 'insurance revenues', weight: 6 },
    { keyword: 'produit net bancaire', weight: 4 },
    { keyword: 'filiale assurance', weight: 5 },
  ];

  for (const { keyword, weight } of bankKeywords) {
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      bankScore += weight * matches.length;
    }
  }

  // TYPE C: Employer indicators
  const employerKeywords = [
    { keyword: 'couverture santé', weight: 7 },
    { keyword: 'health coverage', weight: 7 },
    { keyword: 'avantages du personnel', weight: 6 },
    { keyword: 'employee benefits', weight: 6 },
    { keyword: 'ias 19', weight: 8 },
    { keyword: 'provisions retraite', weight: 6 },
    { keyword: 'post-employment benefits', weight: 6 },
    { keyword: 'cotisations mutuelle', weight: 5 },
  ];

  for (const { keyword, weight } of employerKeywords) {
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      employerScore += weight * matches.length;
    }
  }

  // Determine dominant type
  const maxScore = Math.max(insuranceScore, bankScore, employerScore);

  if (maxScore === 0) {
    return { type: 'unknown', confidence: 0 };
  }

  let type: EntityType;
  let confidence: number;

  if (insuranceScore === maxScore) {
    type = 'insurance_company';
    confidence = Math.min(insuranceScore / 50, 1); // Normalize to 0-1
  } else if (bankScore === maxScore) {
    type = 'bank_with_insurance';
    confidence = Math.min(bankScore / 40, 1);
  } else {
    type = 'employer';
    confidence = Math.min(employerScore / 30, 1);
  }

  return { type, confidence };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse amount from string with unit handling
 */
function parseAmount(amountStr: string, unit: string = 'M€'): number {
  const cleanStr = amountStr.replace(/\s/g, '').replace(',', '.');
  let amount = parseFloat(cleanStr);

  if (isNaN(amount)) return 0;

  const unitLower = unit.toLowerCase();

  // Convert to millions (M€)
  if (unitLower.includes('mds') || unitLower.includes('milliard') || unitLower.includes('bn') || unitLower.includes('billion')) {
    amount *= 1000; // Convert billions to millions
  }

  return amount;
}

/**
 * Parse percentage from string
 */
function parsePercentage(percentStr: string): number {
  const cleanStr = percentStr.replace(/\s/g, '').replace(',', '.');
  const value = parseFloat(cleanStr);
  return isNaN(value) ? 0 : value;
}

/**
 * Extract amount from context using patterns
 */
function extractAmountFromContext(context: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(context);

    if (match && match[1]) {
      const amountStr = match[1];
      const unit = match[2] || 'M€';
      return parseAmount(amountStr, unit);
    }
  }

  return 0;
}

/**
 * Extract percentage from context using patterns
 */
function extractPercentageFromContext(context: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(context);

    if (match && match[1]) {
      return parsePercentage(match[1]);
    }
  }

  return 0;
}

/**
 * Get year label relative to current year
 */
function getYearLabel(year: number, currentYear: number): string {
  const diff = currentYear - year;
  return diff === 1 ? `N-1 (${year})` : `N-${diff} (${year})`;
}

// ============================================================================
// EXTRACTION FUNCTIONS - TYPE A: INSURANCE COMPANY
// ============================================================================

/**
 * Extract Insurance Company data for one year
 */
function extractInsuranceCompanyDataForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<HealthInsuranceRiskConfig>
): InsuranceCompanyYearData | null {
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const yearMatches: number[] = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    yearMatches.push(match.index);
  }

  if (yearMatches.length === 0) return null;

  let combinedRatio = 0;
  let lossRatio = 0;
  let claimsPaid = 0;
  let technicalProvisions = 0;
  let reserveDeficiency = 0;
  let reserveRelease = 0;
  let solvencyRatio = 0;
  let scrRequired = 0;

  let confidence = 0.3; // Base confidence
  let fieldsFound = 0;

  // Extract from each year context
  for (const yearIdx of yearMatches) {
    const contextStart = Math.max(0, yearIdx - 600);
    const contextEnd = Math.min(text.length, yearIdx + 600);
    const context = text.substring(contextStart, contextEnd);

    // Combined ratio
    if (combinedRatio === 0 && config.enableCombinedRatio) {
      const value = extractPercentageFromContext(context, COMBINED_RATIO_PATTERNS);
      if (value > 0) {
        combinedRatio = value;
        fieldsFound++;
        confidence += 0.15;
      }
    }

    // Loss ratio
    if (lossRatio === 0) {
      const value = extractPercentageFromContext(context, LOSS_RATIO_PATTERNS);
      if (value > 0) {
        lossRatio = value;
        fieldsFound++;
        confidence += 0.1;
      }
    }

    // Claims
    if (claimsPaid === 0) {
      const value = extractAmountFromContext(context, CLAIMS_PATTERNS);
      if (value > 0) {
        claimsPaid = value;
        fieldsFound++;
        confidence += 0.12;
      }
    }

    // Technical provisions
    if (technicalProvisions === 0 && config.enableProvisions) {
      const value = extractAmountFromContext(context, TECHNICAL_PROVISIONS_PATTERNS);
      if (value > 0) {
        technicalProvisions = value;
        fieldsFound++;
        confidence += 0.1;
      }
    }

    // Mali/Boni
    if (config.enableMaliBoni) {
      if (reserveDeficiency === 0) {
        const value = extractAmountFromContext(context, RESERVE_DEFICIENCY_PATTERNS);
        if (value > 0) {
          reserveDeficiency = value;
          fieldsFound++;
          confidence += 0.08;
        }
      }

      if (reserveRelease === 0) {
        const value = extractAmountFromContext(context, RESERVE_RELEASE_PATTERNS);
        if (value > 0) {
          reserveRelease = value;
          fieldsFound++;
          confidence += 0.08;
        }
      }
    }

    // Solvency ratio
    if (solvencyRatio === 0 && config.enableSolvency) {
      const value = extractPercentageFromContext(context, SOLVENCY_RATIO_PATTERNS);
      if (value > 0) {
        solvencyRatio = value;
        fieldsFound++;
        confidence += 0.15;
      }
    }

    // SCR
    if (scrRequired === 0 && config.enableSolvency) {
      const value = extractAmountFromContext(context, SCR_PATTERNS);
      if (value > 0) {
        scrRequired = value;
        fieldsFound++;
        confidence += 0.1;
      }
    }
  }

  // Require at least 2 key metrics
  if (fieldsFound < 2) return null;

  return {
    year,
    yearLabel,
    combinedRatio,
    lossRatio,
    expenseRatio: combinedRatio > 0 && lossRatio > 0 ? combinedRatio - lossRatio : 0,
    claimsPaid,
    claimsIncurred: claimsPaid, // Approximation
    premiumsWritten: 0, // Not always available
    technicalProvisions,
    outstandingClaims: 0, // Not always available
    reserveDeficiency,
    reserveRelease,
    solvencyRatio,
    scrRequired,
    ownFunds: solvencyRatio > 0 && scrRequired > 0 ? (scrRequired * solvencyRatio / 100) : 0,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} SFCR/Annual Report`,
  };
}

// ============================================================================
// EXTRACTION FUNCTIONS - TYPE B: BANK WITH INSURANCE
// ============================================================================

/**
 * Extract Bank Insurance data for one year
 */
function extractBankInsuranceDataForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<HealthInsuranceRiskConfig>
): BankInsuranceYearData | null {
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const yearMatches: number[] = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    yearMatches.push(match.index);
  }

  if (yearMatches.length === 0) return null;

  let insuranceRevenue = 0;
  let insuranceLosses = 0;
  let contributionToNBI = 0;

  let confidence = 0.3;
  let fieldsFound = 0;

  for (const yearIdx of yearMatches) {
    const contextStart = Math.max(0, yearIdx - 600);
    const contextEnd = Math.min(text.length, yearIdx + 600);
    const context = text.substring(contextStart, contextEnd);

    if (insuranceRevenue === 0) {
      const value = extractAmountFromContext(context, INSURANCE_REVENUE_PATTERNS);
      if (value > 0) {
        insuranceRevenue = value;
        fieldsFound++;
        confidence += 0.25;
      }
    }

    if (insuranceLosses === 0) {
      const value = extractAmountFromContext(context, INSURANCE_LOSSES_PATTERNS);
      if (value > 0) {
        insuranceLosses = value;
        fieldsFound++;
        confidence += 0.15;
      }
    }

    if (contributionToNBI === 0) {
      const value = extractPercentageFromContext(context, NBI_CONTRIBUTION_PATTERNS);
      if (value > 0) {
        contributionToNBI = value;
        fieldsFound++;
        confidence += 0.2;
      }
    }
  }

  if (fieldsFound < 1) return null;

  return {
    year,
    yearLabel,
    insuranceRevenue,
    insuranceLosses,
    contributionToNBI,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} Bank Annual Report`,
  };
}

// ============================================================================
// EXTRACTION FUNCTIONS - TYPE C: EMPLOYER
// ============================================================================

/**
 * Extract Employer Health data for one year
 */
function extractEmployerHealthDataForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<HealthInsuranceRiskConfig>
): EmployerHealthYearData | null {
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const yearMatches: number[] = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    yearMatches.push(match.index);
  }

  if (yearMatches.length === 0) return null;

  let healthCoverageCosts = 0;
  let retirementProvisions = 0;

  let confidence = 0.3;
  let fieldsFound = 0;

  for (const yearIdx of yearMatches) {
    const contextStart = Math.max(0, yearIdx - 600);
    const contextEnd = Math.min(text.length, yearIdx + 600);
    const context = text.substring(contextStart, contextEnd);

    if (healthCoverageCosts === 0) {
      const value = extractAmountFromContext(context, HEALTH_COVERAGE_COSTS_PATTERNS);
      if (value > 0) {
        healthCoverageCosts = value;
        fieldsFound++;
        confidence += 0.3;
      }
    }

    if (retirementProvisions === 0) {
      const value = extractAmountFromContext(context, RETIREMENT_PROVISIONS_PATTERNS);
      if (value > 0) {
        retirementProvisions = value;
        fieldsFound++;
        confidence += 0.3;
      }
    }
  }

  if (fieldsFound < 1) return null;

  return {
    year,
    yearLabel,
    healthCoverageCosts,
    retirementProvisions,
    averageHeadcount: 0, // Could extract from HR metrics if available
    costPerEmployee: 0,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} Annual Report`,
  };
}

// ============================================================================
// 5-YEAR AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Calculate 5-year summary for Insurance Companies
 * FLUX vs STOCK methodology
 */
function calculateInsuranceCompany5YearSummary(
  yearlyData: InsuranceCompanyYearData[],
  config: Required<HealthInsuranceRiskConfig>
): InsuranceCompany5YearSummary {
  const sorted = [...yearlyData].sort((a, b) => b.year - a.year); // Most recent first

  // Technical performance (RATIOS - EVOLUTION)
  const ratios = sorted.map(d => d.combinedRatio).filter(r => r > 0);
  const avgCombinedRatio = ratios.length > 0 ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length : 0;
  const initialCombinedRatio = ratios[ratios.length - 1] || 0;
  const finalCombinedRatio = ratios[0] || 0;
  const evolutionPoints = finalCombinedRatio - initialCombinedRatio;
  const profitableYears = ratios.filter(r => r < 100).length;
  const unprofitableYears = ratios.filter(r => r >= 100).length;

  // Claims (CUMULATIVE - FLUX)
  const claimsValues = sorted.map(d => d.claimsPaid).filter(c => c > 0);
  const totalClaims5Y = claimsValues.reduce((sum, c) => sum + c, 0);
  const avgAnnualClaims = claimsValues.length > 0 ? totalClaims5Y / claimsValues.length : 0;
  const peakClaimsAmount = Math.max(...claimsValues, 0);
  const peakClaimsYear = peakClaimsAmount > 0 ? sorted.find(d => d.claimsPaid === peakClaimsAmount)!.year : 0;

  // Provisions (STOCK - EVOLUTION)
  const provisionsValues = sorted.map(d => d.technicalProvisions).filter(p => p > 0);
  const initialProvisions = provisionsValues[provisionsValues.length - 1] || 0;
  const finalProvisions = provisionsValues[0] || 0;
  const evolutionAbsolute = finalProvisions - initialProvisions;
  const evolutionPercent = initialProvisions > 0 ? (evolutionAbsolute / initialProvisions) * 100 : 0;

  // Mali/Boni (CUMULATIVE - FLUX)
  const totalMali5Y = sorted.reduce((sum, d) => sum + d.reserveDeficiency, 0);
  const totalBoni5Y = sorted.reduce((sum, d) => sum + d.reserveRelease, 0);
  const netBalance5Y = totalBoni5Y - totalMali5Y;
  const interpretation: 'over_provisioned' | 'under_provisioned' | 'balanced' =
    netBalance5Y > 5 ? 'over_provisioned' :
    netBalance5Y < -5 ? 'under_provisioned' :
    'balanced';

  // Solvency (EVOLUTION)
  const solvencyValues = sorted.map(d => d.solvencyRatio).filter(s => s > 0);
  const avgSolvencyRatio = solvencyValues.length > 0 ? solvencyValues.reduce((sum, s) => sum + s, 0) / solvencyValues.length : 0;
  const minSolvencyRatio = solvencyValues.length > 0 ? Math.min(...solvencyValues) : 0;
  const yearWithMinRatio = minSolvencyRatio > 0 ? sorted.find(d => d.solvencyRatio === minSolvencyRatio)!.year : 0;
  const alwaysCompliant = solvencyValues.every(s => s >= 100);
  const avgMargin = avgSolvencyRatio - 100;

  // Overall rating
  let overallRating: 'Excellent' | 'Good' | 'Adequate' | 'Weak';
  if (avgCombinedRatio < 95 && avgSolvencyRatio > 150 && profitableYears >= 4) {
    overallRating = 'Excellent';
  } else if (avgCombinedRatio < 100 && avgSolvencyRatio > 120 && profitableYears >= 3) {
    overallRating = 'Good';
  } else if (avgCombinedRatio < 105 && avgSolvencyRatio >= 100) {
    overallRating = 'Adequate';
  } else {
    overallRating = 'Weak';
  }

  // Recommendations
  const recommendations: string[] = [];

  if (avgCombinedRatio >= 100) {
    recommendations.push(`Combined ratio above 100% (${avgCombinedRatio.toFixed(1)}%) - Technical profitability at risk`);
  }

  if (evolutionPoints > 5) {
    recommendations.push(`Combined ratio deteriorating (+${evolutionPoints.toFixed(1)} points) - Investigate claims inflation or pricing issues`);
  } else if (evolutionPoints < -5) {
    recommendations.push(`Combined ratio improving (${evolutionPoints.toFixed(1)} points) - Positive trend maintained`);
  }

  if (!alwaysCompliant) {
    recommendations.push(`Solvency ratio fell below 100% - Regulatory non-compliance detected`);
  } else if (avgMargin < 20) {
    recommendations.push(`Low solvency margin (${avgMargin.toFixed(1)} pts above minimum) - Consider capital reinforcement`);
  }

  if (interpretation === 'under_provisioned') {
    recommendations.push(`Net reserve deficiency of €${Math.abs(netBalance5Y).toFixed(1)}M over 5 years - Strengthen provisioning methodology`);
  } else if (interpretation === 'over_provisioned') {
    recommendations.push(`Net reserve release of €${netBalance5Y.toFixed(1)}M over 5 years - Prudent provisioning approach`);
  }

  if (totalClaims5Y > 0 && finalProvisions > 0) {
    const coverageYears = finalProvisions / avgAnnualClaims;
    if (coverageYears < 2) {
      recommendations.push(`Technical provisions cover only ${coverageYears.toFixed(1)} years of claims - Consider increasing reserves`);
    }
  }

  return {
    technicalPerformance: {
      avgCombinedRatio,
      initialCombinedRatio,
      finalCombinedRatio,
      evolutionPoints,
      profitableYears,
      unprofitableYears,
    },
    claims: {
      totalClaims5Y,
      avgAnnual: avgAnnualClaims,
      peakYear: peakClaimsYear,
      peakAmount: peakClaimsAmount,
    },
    provisions: {
      initialProvisions,
      finalProvisions,
      evolutionAbsolute,
      evolutionPercent,
    },
    maliBoni: {
      totalMali5Y,
      totalBoni5Y,
      netBalance5Y,
      interpretation,
    },
    solvency: {
      avgSolvencyRatio,
      minSolvencyRatio,
      yearWithMinRatio,
      alwaysCompliant,
      avgMargin,
    },
    overallRating,
    recommendations,
  };
}

/**
 * Calculate 5-year summary for Banks with Insurance
 */
function calculateBankInsurance5YearSummary(
  yearlyData: BankInsuranceYearData[],
  config: Required<HealthInsuranceRiskConfig>
): BankInsurance5YearSummary {
  const sorted = [...yearlyData].sort((a, b) => b.year - a.year);

  // Revenue (CUMULATIVE - FLUX)
  const totalRevenue5Y = sorted.reduce((sum, d) => sum + d.insuranceRevenue, 0);
  const avgAnnual = sorted.length > 0 ? totalRevenue5Y / sorted.length : 0;
  const initialRevenue = sorted[sorted.length - 1]?.insuranceRevenue || 0;
  const finalRevenue = sorted[0]?.insuranceRevenue || 0;
  const evolutionPercent = initialRevenue > 0 ? ((finalRevenue / initialRevenue) - 1) * 100 : 0;

  // Losses (CUMULATIVE - FLUX)
  const totalLosses5Y = sorted.reduce((sum, d) => sum + d.insuranceLosses, 0);
  const yearsWithLosses = sorted.filter(d => d.insuranceLosses > 0).length;

  // NBI Contribution (EVOLUTION)
  const contributionValues = sorted.map(d => d.contributionToNBI).filter(c => c > 0);
  const avgContributionPercent = contributionValues.length > 0 ? contributionValues.reduce((sum, c) => sum + c, 0) / contributionValues.length : 0;
  const initialContribution = contributionValues[contributionValues.length - 1] || 0;
  const finalContribution = contributionValues[0] || 0;
  const contributionEvolution = Math.abs(finalContribution - initialContribution) < 1 ? 'stable' :
                                 finalContribution > initialContribution ? 'increasing' : 'decreasing';

  // Overall rating
  const overallRating: 'Strong' | 'Moderate' | 'Weak' =
    totalRevenue5Y > 1000 && yearsWithLosses === 0 ? 'Strong' :
    totalRevenue5Y > 500 && yearsWithLosses <= 1 ? 'Moderate' :
    'Weak';

  return {
    revenue: {
      totalRevenue5Y,
      avgAnnual,
      evolutionPercent,
    },
    losses: {
      totalLosses5Y,
      yearsWithLosses,
    },
    nbiContribution: {
      avgContributionPercent,
      evolution: contributionEvolution,
    },
    overallRating,
  };
}

/**
 * Calculate 5-year summary for Employers
 */
function calculateEmployerHealth5YearSummary(
  yearlyData: EmployerHealthYearData[],
  config: Required<HealthInsuranceRiskConfig>
): EmployerHealth5YearSummary {
  const sorted = [...yearlyData].sort((a, b) => b.year - a.year);

  // Health costs (CUMULATIVE - FLUX)
  const totalCosts5Y = sorted.reduce((sum, d) => sum + d.healthCoverageCosts, 0);
  const avgAnnual = sorted.length > 0 ? totalCosts5Y / sorted.length : 0;

  const costPerEmployeeValues = sorted.map(d => d.costPerEmployee).filter(c => c > 0);
  const costPerEmployeeAvg = costPerEmployeeValues.length > 0 ? costPerEmployeeValues.reduce((sum, c) => sum + c, 0) / costPerEmployeeValues.length : 0;

  const initialCosts = sorted[sorted.length - 1]?.healthCoverageCosts || 0;
  const finalCosts = sorted[0]?.healthCoverageCosts || 0;
  const evolutionPercent = initialCosts > 0 ? ((finalCosts / initialCosts) - 1) * 100 : 0;

  // Retirement provisions (STOCK - EVOLUTION)
  const provisionsValues = sorted.map(d => d.retirementProvisions).filter(p => p > 0);
  const initialProvisions = provisionsValues[provisionsValues.length - 1] || 0;
  const finalProvisions = provisionsValues[0] || 0;
  const evolutionAbsolute = finalProvisions - initialProvisions;
  const provisionEvolutionPercent = initialProvisions > 0 ? (evolutionAbsolute / initialProvisions) * 100 : 0;

  // Overall rating
  const overallRating: 'Low' | 'Moderate' | 'High' =
    totalCosts5Y < 50 ? 'Low' :
    totalCosts5Y < 200 ? 'Moderate' :
    'High';

  return {
    healthCosts: {
      totalCosts5Y,
      avgAnnual,
      costPerEmployeeAvg,
      evolutionPercent,
    },
    retirementProvisions: {
      initialProvisions,
      finalProvisions,
      evolutionAbsolute,
      evolutionPercent: provisionEvolutionPercent,
    },
    overallRating,
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Insurance Company data
 */
function validateInsuranceCompanyData(
  yearlyData: InsuranceCompanyYearData[],
  summary: InsuranceCompany5YearSummary,
  config: Required<HealthInsuranceRiskConfig>
): HealthInsuranceRiskValidation {
  const alerts: string[] = [];
  const yearsNonCompliant: number[] = [];

  // Solvency compliance check
  for (const yearData of yearlyData) {
    if (yearData.solvencyRatio > 0 && yearData.solvencyRatio < 100) {
      alerts.push(`🔴 CRITICAL - Year ${yearData.year}: Solvency ratio below regulatory minimum (${yearData.solvencyRatio.toFixed(1)}%)`);
      yearsNonCompliant.push(yearData.year);
    } else if (yearData.solvencyRatio > 0 && yearData.solvencyRatio < 120) {
      alerts.push(`⚠️ Year ${yearData.year}: Low solvency ratio (${yearData.solvencyRatio.toFixed(1)}%) - Limited margin`);
    }

    // Combined ratio check
    if (yearData.combinedRatio > 110) {
      alerts.push(`🔴 Year ${yearData.year}: Very high combined ratio (${yearData.combinedRatio.toFixed(1)}%) - Significant technical loss`);
    } else if (yearData.combinedRatio > 100) {
      alerts.push(`⚠️ Year ${yearData.year}: Combined ratio above 100% (${yearData.combinedRatio.toFixed(1)}%) - Technical deficit`);
    }
  }

  // Provisions coherence
  let provisionsCoherent = true;
  let coverageYears = 0;
  let coherenceMessage = '';

  if (summary.provisions.finalProvisions > 0 && summary.claims.avgAnnual > 0) {
    coverageYears = summary.provisions.finalProvisions / summary.claims.avgAnnual;

    if (coverageYears < 2) {
      provisionsCoherent = false;
      coherenceMessage = `Provisions cover only ${coverageYears.toFixed(1)} years of claims - Insufficient`;
      alerts.push(`⚠️ ${coherenceMessage}`);
    } else if (coverageYears > 8) {
      coherenceMessage = `Provisions cover ${coverageYears.toFixed(1)} years of claims - Potential over-provisioning`;
      alerts.push(`ℹ️ ${coherenceMessage}`);
    } else {
      coherenceMessage = `Provisions cover ${coverageYears.toFixed(1)} years of claims - Adequate`;
    }
  }

  return {
    isValid: alerts.filter(a => a.startsWith('🔴')).length === 0,
    alerts,
    solvencyCompliance: {
      alwaysCompliant: summary.solvency.alwaysCompliant,
      yearsNonCompliant,
    },
    technicalProfitability: {
      profitableYears: summary.technicalPerformance.profitableYears,
      unprofitableYears: summary.technicalPerformance.unprofitableYears,
    },
    provisionsCoherence: {
      coherent: provisionsCoherent,
      coverageYears,
      message: coherenceMessage,
    },
  };
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract Health & Insurance Risk data from text
 * Automatically detects entity type and extracts relevant metrics
 */
export function extractHealthInsuranceRisk(
  text: string,
  config: HealthInsuranceRiskConfig = DEFAULT_HEALTH_INSURANCE_RISK_CONFIG
): HealthInsuranceRiskResult | null {
  const cfg = { ...DEFAULT_HEALTH_INSURANCE_RISK_CONFIG, ...config };

  if (cfg.verbose) {
    // Debug removed;
  }

  // Step 1: Detect entity type if not specified
  let entityType = cfg.entityType;
  let entityTypeConfidence = 1.0;

  if (entityType === 'unknown') {
    const detection = detectEntityType(text);
    entityType = detection.type;
    entityTypeConfidence = detection.confidence;

    if (cfg.verbose) {
      .toFixed(1)}%)`);
    }
  }

  if (entityType === 'unknown') {
    if (cfg.verbose) {
      }
    return null;
  }

  // Step 2: Extract data based on entity type
  const yearsExtracted: number[] = [];
  let overallConfidence = 0;

  // TYPE A: Insurance Company
  if (entityType === 'insurance_company') {
    const yearlyData: InsuranceCompanyYearData[] = [];

    for (let i = 1; i <= cfg.yearsToExtract; i++) {
      const year = cfg.currentYear - i;
      const yearLabel = getYearLabel(year, cfg.currentYear);

      const yearData = extractInsuranceCompanyDataForYear(text, year, yearLabel, cfg);

      if (yearData && yearData.confidence >= cfg.minConfidence) {
        yearlyData.push(yearData);
        yearsExtracted.push(year);
        overallConfidence += yearData.confidence;

        if (cfg.verbose) {
          }%, Solvency=${yearData.solvencyRatio.toFixed(1)}%`);
        }
      }
    }

    if (yearlyData.length === 0) {
      if (cfg.verbose) {
        }
      return null;
    }

    overallConfidence = overallConfidence / yearlyData.length;

    const summary5Year = calculateInsuranceCompany5YearSummary(yearlyData, cfg);
    const validation = validateInsuranceCompanyData(yearlyData, summary5Year, cfg);

    return {
      entityType,
      entityTypeConfidence,
      insuranceCompanyData: {
        yearlyData,
        summary5Year,
      },
      yearsExtracted,
      confidence: overallConfidence,
      validation,
      extractionDate: new Date().toISOString(),
      config: cfg,
    };
  }

  // TYPE B: Bank with Insurance
  if (entityType === 'bank_with_insurance') {
    const yearlyData: BankInsuranceYearData[] = [];

    for (let i = 1; i <= cfg.yearsToExtract; i++) {
      const year = cfg.currentYear - i;
      const yearLabel = getYearLabel(year, cfg.currentYear);

      const yearData = extractBankInsuranceDataForYear(text, year, yearLabel, cfg);

      if (yearData && yearData.confidence >= cfg.minConfidence) {
        yearlyData.push(yearData);
        yearsExtracted.push(year);
        overallConfidence += yearData.confidence;

        if (cfg.verbose) {
          }M`);
        }
      }
    }

    if (yearlyData.length === 0) {
      if (cfg.verbose) {
        }
      return null;
    }

    overallConfidence = overallConfidence / yearlyData.length;

    const summary5Year = calculateBankInsurance5YearSummary(yearlyData, cfg);

    return {
      entityType,
      entityTypeConfidence,
      bankInsuranceData: {
        yearlyData,
        summary5Year,
      },
      yearsExtracted,
      confidence: overallConfidence,
      validation: { isValid: true, alerts: [] },
      extractionDate: new Date().toISOString(),
      config: cfg,
    };
  }

  // TYPE C: Employer
  if (entityType === 'employer') {
    const yearlyData: EmployerHealthYearData[] = [];

    for (let i = 1; i <= cfg.yearsToExtract; i++) {
      const year = cfg.currentYear - i;
      const yearLabel = getYearLabel(year, cfg.currentYear);

      const yearData = extractEmployerHealthDataForYear(text, year, yearLabel, cfg);

      if (yearData && yearData.confidence >= cfg.minConfidence) {
        yearlyData.push(yearData);
        yearsExtracted.push(year);
        overallConfidence += yearData.confidence;

        if (cfg.verbose) {
          }M`);
        }
      }
    }

    if (yearlyData.length === 0) {
      if (cfg.verbose) {
        }
      return null;
    }

    overallConfidence = overallConfidence / yearlyData.length;

    const summary5Year = calculateEmployerHealth5YearSummary(yearlyData, cfg);

    return {
      entityType,
      entityTypeConfidence,
      employerHealthData: {
        yearlyData,
        summary5Year,
      },
      yearsExtracted,
      confidence: overallConfidence,
      validation: { isValid: true, alerts: [] },
      extractionDate: new Date().toISOString(),
      config: cfg,
    };
  }

  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already declared inline with their definitions
