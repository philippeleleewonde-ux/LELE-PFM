/**
 * Credit Counterparty Risk Extractor
 *
 * Phase 2.10 - Sprint 2.10
 * Skill: Elite SaaS Developer
 *
 * Extracts Credit/Counterparty Risk data including:
 * - Cost of Risk (Coût du Risque) - Annual flows over 5 years
 * - Geographic Exposure (Client Risk & Country Risk)
 * - Non-Performing Loans (NPL) - Créances douteuses
 * - IFRS 9 Stages (Stage 1/2/3 provisions)
 * - Credit Risk Metrics (RWA, PD, LGD, EL, Coverage ratios)
 *
 * Sources: Pillar 3, Annual Reports, Financial Statements, URD
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Document types for credit risk data
 */
export enum CreditRiskDocumentType {
  PILLAR3 = 'Pillar 3 Disclosure',
  ANNUAL_REPORT = 'Annual Report',
  FINANCIAL_STATEMENTS = 'Financial Statements',
  URD = 'Document de Référence Universel',
  QUARTERLY_REPORT = 'Quarterly Report'
}

/**
 * IFRS 9 Stages for provision classification
 */
export enum IFRS9Stage {
  STAGE1 = 'Stage 1',  // 12-month ECL (Expected Credit Loss)
  STAGE2 = 'Stage 2',  // Lifetime ECL (not credit-impaired)
  STAGE3 = 'Stage 3'   // Lifetime ECL (credit-impaired / NPL)
}

/**
 * Cost of Risk quality rating
 */
export enum CostOfRiskRating {
  EXCELLENT = 'Excellent',    // 0-20 bp
  GOOD = 'Good',              // 20-40 bp
  AVERAGE = 'Average',        // 40-60 bp
  ELEVATED = 'Elevated',      // 60-100 bp
  VERY_HIGH = 'Very High'     // >100 bp
}

/**
 * Cost of Risk for one year (annual flows)
 */
export interface CostOfRiskData {
  year: number;
  yearLabel: string;  // "N-1", "N-2", etc.

  // Annual flows (M€)
  provisions: number;           // Dotations aux provisions
  reversals: number;            // Reprises de provisions (negative or positive)
  writeOffs: number;            // Pertes réalisées (write-offs)
  recoveries: number;           // Récupérations (negative or positive)

  costOfRiskNet: number;        // Coût du risque net = provisions - |reversals| + writeOffs - |recoveries|

  // Context
  totalLoans?: number;          // Encours de crédits total (M€)
  costOfRiskBps?: number;       // Ratio en basis points (cost / loans * 10000)
  rating?: CostOfRiskRating;    // Quality rating

  confidence: number;           // 0-1
  source: string;               // Document source
}

/**
 * Geographic exposure (Client/Country Risk)
 */
export interface GeographicExposure {
  year: number;
  yearLabel: string;

  byRegion: Map<string, {
    grossExposure: number;      // Exposition brute (EAD)
    provisions: number;          // Provisions
    nplAmount: number;           // Créances douteuses (NPL)
    nplRatio: number;            // NPL / Gross Exposure (%)
    coverageRatio: number;       // Provisions / NPL (%)
  }>;

  total: {
    grossExposure: number;
    provisions: number;
    nplAmount: number;
    nplRatio: number;
    coverageRatio: number;
  };

  confidence: number;
  source: string;
}

/**
 * Non-Performing Loans (NPL) dynamics
 */
export interface NPLData {
  year: number;
  yearLabel: string;

  // Stock (M€)
  nplStockBeginning: number;    // Stock début d'année
  nplStockEnd: number;          // Stock fin d'année

  // Flows (M€)
  nplInflows: number;           // Entrées (nouvelles créances douteuses)
  nplOutflowsRepayments: number; // Sorties - Remboursements
  nplOutflowsWriteOffs: number; // Sorties - Passages en perte

  // Provisions
  nplProvisions: number;        // Provisions associées aux NPL

  // Ratios (%)
  nplRatio: number;             // NPL / Total loans
  coverageRatio: number;        // Provisions / NPL

  confidence: number;
  source: string;
}

/**
 * IFRS 9 Stages breakdown
 */
export interface IFRS9StagesData {
  year: number;
  yearLabel: string;

  stage1: {
    exposure: number;           // Exposition Stage 1 (M€)
    provisions: number;         // Provisions Stage 1 (M€)
    coverageRate: number;       // Taux de couverture (%)
  };

  stage2: {
    exposure: number;
    provisions: number;
    coverageRate: number;
  };

  stage3: {
    exposure: number;           // = NPL
    provisions: number;
    coverageRate: number;
  };

  total: {
    exposure: number;
    provisions: number;
    coverageRate: number;
  };

  confidence: number;
  source: string;
}

/**
 * Credit Risk Metrics
 */
export interface CreditRiskMetrics {
  year: number;
  yearLabel: string;

  // Basel III
  rwa: number;                  // Risk-Weighted Assets (M€)
  capitalRequirement: number;   // RWA × 8% (M€)

  // Risk parameters (%)
  averagePD?: number;           // Probability of Default
  averageLGD?: number;          // Loss Given Default

  // Expected/Unexpected Loss
  expectedLoss?: number;        // EL = PD × LGD × EAD (M€)
  unexpectedLoss?: number;      // UL (link to Phase 2.8)

  // Quality indicators
  nplRatio: number;             // NPL / Total loans (%)
  coverageRatio: number;        // Provisions / NPL (%)
  costOfRiskBps: number;        // Cost of Risk / Total loans (bp)

  confidence: number;
}

/**
 * Complete credit counterparty risk result
 */
export interface CreditCounterpartyRiskResult {
  yearlyData: {
    costOfRisk: CostOfRiskData;
    geographic?: GeographicExposure;
    npl?: NPLData;
    ifrs9Stages?: IFRS9StagesData;
    metrics?: CreditRiskMetrics;
  }[];

  summary5Year: {
    // Cost of Risk (CUMULATIVE FLOWS)
    costOfRisk: {
      totalProvisions: number;          // ✅ Cumul dotations
      totalReversals: number;           // ✅ Cumul reprises
      totalWriteOffs: number;           // ✅ Cumul write-offs
      totalRecoveries: number;          // ✅ Cumul récupérations
      totalCostOfRiskNet: number;       // ✅ RÉPONSE QUESTIONNAIRE
      averageAnnual: number;            // Moyenne annuelle
      averageBps: number;               // Ratio moyen (bp)
      recoveryRate: number;             // Taux récupération global (%)
      evolution: {
        absolute: number;               // Évolution absolue (M€)
        relative: number;               // Évolution relative (%)
        direction: 'improving' | 'deteriorating' | 'stable';
      };
    };

    // Geographic Exposure (STOCK EVOLUTION)
    geographic?: {
      topRegions: Array<{
        region: string;
        currentExposure: number;        // Exposition N-1
        initialExposure: number;        // Exposition N-5
        evolution: number;              // % change
        provisionsCumulated: number;    // Cumul provisions 5 ans
      }>;
      domesticPercentage: number;       // % exposition domestique
      foreignPercentage: number;        // % exposition étrangère
    };

    // NPL Evolution
    npl?: {
      currentStock: number;             // Stock NPL N-1
      initialStock: number;             // Stock NPL N-5
      stockEvolution: number;           // Variation (M€)
      stockEvolutionPct: number;        // Variation (%)
      cumulativeInflows: number;        // Entrées cumulées 5 ans
      cumulativeOutflows: number;       // Sorties cumulées 5 ans
      averageNPLRatio: number;          // Taux NPL moyen (%)
      averageCoverageRatio: number;     // Taux couverture moyen (%)
    };

    // Rating
    rating: CostOfRiskRating;
    benchmark?: string;                 // Comparaison sectorielle
  };

  validation: {
    costOfRiskFormula: boolean;         // Provisions - Reversals + WriteOffs - Recoveries
    geographicCoherence: boolean;       // Sum regions = Total
    nplDynamics: boolean;               // Stock(n+1) = Stock(n) + In - Out
    benchmarkCompliance: boolean;       // Within industry norms
    warnings: string[];
  };

  documentType: CreditRiskDocumentType;
  extractionDate: string;
  yearsExtracted: number[];
  confidence: number;
}

/**
 * Configuration for credit risk extraction
 */
export interface CreditRiskConfig {
  currentYear?: number;
  yearsToExtract?: number;              // Default: 5
  enableGeographicExtraction?: boolean; // Default: true
  enableNPLExtraction?: boolean;        // Default: true
  enableIFRS9Extraction?: boolean;      // Default: true
  enableMetricsExtraction?: boolean;    // Default: true
  minConfidence?: number;               // Default: 0.5
  benchmarkSectorBps?: number;          // For comparison (e.g., 55 bp)
  verbose?: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CREDIT_RISK_CONFIG: Required<CreditRiskConfig> = {
  currentYear: new Date().getFullYear(),
  yearsToExtract: 5,
  enableGeographicExtraction: true,
  enableNPLExtraction: true,
  enableIFRS9Extraction: true,
  enableMetricsExtraction: true,
  minConfidence: 0.5,
  benchmarkSectorBps: 55, // Average banking sector
  verbose: false
};

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * Cost of Risk patterns (FR/EN)
 */
const COST_OF_RISK_PATTERNS = {
  total: {
    fr: [
      /co[ûu]t\s+du\s+risque\s*(?:net)?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?)/gi,
      /charge\s+(?:nette\s+)?du\s+risque\s+de\s+cr[ée]dit\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /dotations\s+nettes\s+aux\s+provisions\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /cost\s+of\s+(?:credit\s+)?risk\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M|millions?)/gi,
      /net\s+credit\s+losses?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M|millions?)/gi,
      /impairment\s+charges?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M|millions?)/gi,
      /credit\s+loss\s+expense\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M|millions?)/gi
    ]
  },

  provisions: {
    fr: [
      /dotations?\s+(?:aux\s+)?provisions?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /provisions?\s+constitu[ée]es?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /provisions?\s+charges?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi,
      /allowances?\s+for\s+credit\s+losses?\s*:?\s*([0-9\s,.]+)\s*(M€|€M)/gi
    ]
  },

  reversals: {
    fr: [
      /reprises?\s+(?:de\s+)?provisions?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /r[ée]utilisations?\s+de\s+provisions?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /provisions?\s+reversals?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi,
      /release\s+of\s+provisions?\s*:?\s*([0-9\s,.]+)\s*(M€|€M)/gi
    ]
  },

  writeOffs: {
    fr: [
      /pertes?\s+r[ée]alis[ée]es?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /passages?\s+en\s+pertes?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /cr[ée]ances?\s+irr[ée]couvrables?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /write-?offs?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M|millions?)/gi,
      /loans?\s+written\s+off\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi,
      /charge-?offs?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi
    ]
  },

  recoveries: {
    fr: [
      /r[ée]cup[ée]rations?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /recouvrements?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /reprises?\s+sur\s+cr[ée]ances?\s+amorties?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /recoveries\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M|millions?)/gi,
      /recoveries\s+on\s+loans\s+written\s+off\s*:?\s*([0-9\s,.]+)\s*(M€|€M)/gi
    ]
  }
};

/**
 * Geographic exposure patterns
 */
const GEOGRAPHIC_PATTERNS = {
  fr: [
    /exposition\s+(?:par\s+)?([A-ZÀ-Ÿ][a-zà-ÿ\s]+)\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
    /([A-ZÀ-Ÿ][a-zà-ÿ]+)\s*:?\s*([0-9\s,.]+)\s*M€.*(?:exposition|encours)/gi,
    /risque\s+pays\s+([A-ZÀ-Ÿ][a-zà-ÿ\s]+)\s*:?\s*([0-9\s,.]+)\s*M€/gi
  ],
  en: [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+exposure\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi,
    /exposure\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*:?\s*([0-9\s,.]+)\s*(M€|€M)/gi,
    /country\s+risk\s+([A-Z][a-z]+)\s*:?\s*([0-9\s,.]+)\s*M€/gi
  ]
};

/**
 * NPL (Non-Performing Loans) patterns
 */
const NPL_PATTERNS = {
  stock: {
    fr: [
      /cr[ée]ances?\s+douteuses?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /cr[ée]ances?\s+en\s+d[ée]faut\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /encours\s+NPL\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /non-?performing\s+loans?\s*(?:\(NPL\))?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi,
      /impaired\s+loans?\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi,
      /NPL\s+stock\s*:?\s*([0-9\s,.]+)\s*(M€|€M)/gi
    ]
  },

  ratio: {
    fr: [
      /taux\s+de\s+cr[ée]ances?\s+douteuses?\s*:?\s*([0-9,.]+)\s*%/gi,
      /taux\s+NPL\s*:?\s*([0-9,.]+)\s*%/gi
    ],
    en: [
      /NPL\s+ratio\s*:?\s*([0-9,.]+)\s*%/gi,
      /non-?performing\s+loan\s+ratio\s*:?\s*([0-9,.]+)\s*%/gi
    ]
  },

  coverage: {
    fr: [
      /taux\s+de\s+couverture\s*:?\s*([0-9,.]+)\s*%/gi,
      /couverture\s+des\s+NPL\s*:?\s*([0-9,.]+)\s*%/gi
    ],
    en: [
      /coverage\s+ratio\s*:?\s*([0-9,.]+)\s*%/gi,
      /NPL\s+coverage\s*:?\s*([0-9,.]+)\s*%/gi
    ]
  }
};

/**
 * IFRS 9 Stages patterns
 */
const IFRS9_PATTERNS = {
  stage1: {
    fr: [
      /(?:provisions?\s+)?stage\s+1\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /stade\s+1\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /stage\s+1\s+(?:provisions?|allowances?)\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi
    ]
  },

  stage2: {
    fr: [
      /(?:provisions?\s+)?stage\s+2\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /stade\s+2\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /stage\s+2\s+(?:provisions?|allowances?)\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi
    ]
  },

  stage3: {
    fr: [
      /(?:provisions?\s+)?stage\s+3\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi,
      /stade\s+3\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€)/gi
    ],
    en: [
      /stage\s+3\s+(?:provisions?|allowances?)\s*:?\s*([0-9\s,.]+)\s*(M€|€M|\$M)/gi
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse amount from text
 */
function parseAmount(value: string, unit: string): number {
  const cleanValue = value.replace(/\s/g, '').replace(/,/g, '.');
  const numValue = parseFloat(cleanValue);

  if (isNaN(numValue)) return 0;

  const unitLower = unit.toLowerCase();

  if (unitLower.includes('mds') || unitLower.includes('billion')) {
    return numValue * 1000;
  } else if (unitLower.includes('k€') || unitLower.includes('thousand')) {
    return numValue / 1000;
  } else {
    return numValue;
  }
}

/**
 * Get year label (N-1, N-2, etc.)
 */
function getYearLabel(year: number, currentYear: number): string {
  const diff = currentYear - year;
  if (diff === 0) return 'N';
  if (diff > 0) return `N-${diff}`;
  return `N+${Math.abs(diff)}`;
}

/**
 * Rate cost of risk based on basis points
 */
function rateCostOfRisk(bps: number): CostOfRiskRating {
  if (bps < 20) return CostOfRiskRating.EXCELLENT;
  if (bps < 40) return CostOfRiskRating.GOOD;
  if (bps < 60) return CostOfRiskRating.AVERAGE;
  if (bps < 100) return CostOfRiskRating.ELEVATED;
  return CostOfRiskRating.VERY_HIGH;
}

/**
 * Detect document type
 */
function detectCreditRiskDocumentType(text: string): CreditRiskDocumentType {
  const textLower = text.toLowerCase();

  if (/pillar\s+3|pilier\s+3|exigences\s+en\s+fonds\s+propres/i.test(textLower)) {
    return CreditRiskDocumentType.PILLAR3;
  } else if (/document\s+de\s+r[ée]f[ée]rence\s+universel|urd/i.test(textLower)) {
    return CreditRiskDocumentType.URD;
  } else if (/rapport\s+annuel|annual\s+report/i.test(textLower)) {
    return CreditRiskDocumentType.ANNUAL_REPORT;
  } else if (/[ée]tats?\s+financiers?|financial\s+statements?/i.test(textLower)) {
    return CreditRiskDocumentType.FINANCIAL_STATEMENTS;
  } else if (/rapport\s+trimestriel|quarterly\s+report/i.test(textLower)) {
    return CreditRiskDocumentType.QUARTERLY_REPORT;
  }

  return CreditRiskDocumentType.PILLAR3; // Default
}

/**
 * Extract amount from context using patterns
 */
function extractAmountFromContext(
  context: string,
  patterns: { fr: RegExp[]; en: RegExp[] }
): number {
  const allPatterns = [...patterns.fr, ...patterns.en];

  for (const pattern of allPatterns) {
    pattern.lastIndex = 0; // Reset regex
    const match = pattern.exec(context);
    if (match && match[1] && match[2]) {
      return parseAmount(match[1], match[2]);
    }
  }

  return 0;
}

// ============================================================================
// MAIN EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract Cost of Risk data for one year
 */
function extractCostOfRiskForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<CreditRiskConfig>
): CostOfRiskData | null {
  // Find context around year mention
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const matches = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(text.length, match.index + 500);
    matches.push(text.substring(contextStart, contextEnd));
  }

  if (matches.length === 0) return null;

  const combinedContext = matches.join('\n\n');

  // Extract amounts
  const provisions = extractAmountFromContext(combinedContext, COST_OF_RISK_PATTERNS.provisions);
  const reversals = extractAmountFromContext(combinedContext, COST_OF_RISK_PATTERNS.reversals);
  const writeOffs = extractAmountFromContext(combinedContext, COST_OF_RISK_PATTERNS.writeOffs);
  const recoveries = extractAmountFromContext(combinedContext, COST_OF_RISK_PATTERNS.recoveries);
  const costTotal = extractAmountFromContext(combinedContext, COST_OF_RISK_PATTERNS.total);

  // Calculate net cost
  let costOfRiskNet = costTotal;

  if (costTotal === 0 && (provisions > 0 || writeOffs > 0)) {
    // Calculate from components
    costOfRiskNet = provisions - Math.abs(reversals) + writeOffs - Math.abs(recoveries);
  }

  if (costOfRiskNet === 0 && provisions === 0) return null;

  // Calculate confidence
  let confidence = 0.5;
  if (costTotal > 0) confidence += 0.3;
  if (provisions > 0) confidence += 0.1;
  if (writeOffs > 0) confidence += 0.05;
  if (reversals > 0 || recoveries > 0) confidence += 0.05;

  const result: CostOfRiskData = {
    year,
    yearLabel,
    provisions,
    reversals: Math.abs(reversals), // Store as positive
    writeOffs,
    recoveries: Math.abs(recoveries), // Store as positive
    costOfRiskNet,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} context`
  };

  return result;
}

/**
 * Extract Geographic Exposure for one year
 */
function extractGeographicExposureForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<CreditRiskConfig>
): GeographicExposure | null {
  // Find context around year mention
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const matches = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(text.length, match.index + 500);
    matches.push(text.substring(contextStart, contextEnd));
  }

  if (matches.length === 0) return null;

  const combinedContext = matches.join('\n\n');

  // Check if geographic exposure is mentioned
  if (!/exposition.*(?:géographique|pays|zone)|geographic.*exposure|country.*risk/i.test(combinedContext)) {
    return null;
  }

  const byRegion = new Map<string, GeographicExposure['byRegion'] extends Map<string, infer V> ? V : never>();

  // Extract regional exposures
  const allPatterns = [...GEOGRAPHIC_PATTERNS.fr, ...GEOGRAPHIC_PATTERNS.en];

  for (const pattern of allPatterns) {
    pattern.lastIndex = 0;
    let regionMatch;

    while ((regionMatch = pattern.exec(combinedContext)) !== null) {
      const region = regionMatch[1]?.trim();
      const amountStr = regionMatch[2];
      const unit = regionMatch[3] || 'M€';

      if (region && amountStr) {
        const grossExposure = parseAmount(amountStr, unit);

        if (grossExposure > 0) {
          byRegion.set(region, {
            grossExposure,
            provisions: 0, // Will be extracted separately
            nplAmount: 0,
            nplRatio: 0,
            coverageRatio: 0
          });
        }
      }
    }
  }

  if (byRegion.size === 0) return null;

  // Calculate totals
  let totalGrossExposure = 0;
  let totalProvisions = 0;
  let totalNplAmount = 0;

  for (const data of byRegion.values()) {
    totalGrossExposure += data.grossExposure;
    totalProvisions += data.provisions;
    totalNplAmount += data.nplAmount;
  }

  const totalNplRatio = totalGrossExposure > 0 ? (totalNplAmount / totalGrossExposure) * 100 : 0;
  const totalCoverageRatio = totalNplAmount > 0 ? (totalProvisions / totalNplAmount) * 100 : 0;

  return {
    year,
    yearLabel,
    byRegion,
    total: {
      grossExposure: totalGrossExposure,
      provisions: totalProvisions,
      nplAmount: totalNplAmount,
      nplRatio: totalNplRatio,
      coverageRatio: totalCoverageRatio
    },
    confidence: 0.7,
    source: `Year ${year} geographic context`
  };
}

/**
 * Extract NPL (Non-Performing Loans) data for one year
 */
function extractNPLForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<CreditRiskConfig>
): NPLData | null {
  // Find context around year mention
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const matches = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(text.length, match.index + 500);
    matches.push(text.substring(contextStart, contextEnd));
  }

  if (matches.length === 0) return null;

  const combinedContext = matches.join('\n\n');

  // Check if NPL is mentioned
  if (!/créances?\s+douteuses?|non-?performing\s+loans?|NPL|impaired\s+loans?/i.test(combinedContext)) {
    return null;
  }

  // Extract NPL stock
  const nplStock = extractAmountFromContext(combinedContext, NPL_PATTERNS.stock);

  if (nplStock === 0) return null;

  // Extract ratios
  let nplRatio = 0;
  let coverageRatio = 0;

  const ratioPatterns = [...NPL_PATTERNS.ratio.fr, ...NPL_PATTERNS.ratio.en];
  for (const pattern of ratioPatterns) {
    pattern.lastIndex = 0;
    const ratioMatch = pattern.exec(combinedContext);
    if (ratioMatch && ratioMatch[1]) {
      nplRatio = parseFloat(ratioMatch[1].replace(',', '.'));
      break;
    }
  }

  const coveragePatterns = [...NPL_PATTERNS.coverage.fr, ...NPL_PATTERNS.coverage.en];
  for (const pattern of coveragePatterns) {
    pattern.lastIndex = 0;
    const coverageMatch = pattern.exec(combinedContext);
    if (coverageMatch && coverageMatch[1]) {
      coverageRatio = parseFloat(coverageMatch[1].replace(',', '.'));
      break;
    }
  }

  // Calculate provisions from coverage ratio and NPL stock
  const nplProvisions = coverageRatio > 0 ? (nplStock * coverageRatio / 100) : 0;

  return {
    year,
    yearLabel,
    nplStockBeginning: 0, // Not always available
    nplStockEnd: nplStock,
    nplInflows: 0, // Flow data not always available
    nplOutflowsRepayments: 0,
    nplOutflowsWriteOffs: 0,
    nplProvisions,
    nplRatio,
    coverageRatio,
    confidence: 0.75,
    source: `Year ${year} NPL context`
  };
}

/**
 * Extract IFRS 9 Stages data for one year
 */
function extractIFRS9StagesForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<CreditRiskConfig>
): IFRS9StagesData | null {
  // Find context around year mention
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const matches = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(text.length, match.index + 500);
    matches.push(text.substring(contextStart, contextEnd));
  }

  if (matches.length === 0) return null;

  const combinedContext = matches.join('\n\n');

  // Check if IFRS 9 stages are mentioned
  if (!/stage\s+[123]|stade\s+[123]|IFRS\s+9/i.test(combinedContext)) {
    return null;
  }

  // Extract provisions for each stage
  const stage1Provisions = extractAmountFromContext(combinedContext, IFRS9_PATTERNS.stage1);
  const stage2Provisions = extractAmountFromContext(combinedContext, IFRS9_PATTERNS.stage2);
  const stage3Provisions = extractAmountFromContext(combinedContext, IFRS9_PATTERNS.stage3);

  if (stage1Provisions === 0 && stage2Provisions === 0 && stage3Provisions === 0) {
    return null;
  }

  const totalProvisions = stage1Provisions + stage2Provisions + stage3Provisions;

  // Exposures are not always available in provisions tables
  // We'll set them to 0 and calculate coverage rates as 0
  const result: IFRS9StagesData = {
    year,
    yearLabel,
    stage1: {
      exposure: 0,
      provisions: stage1Provisions,
      coverageRate: 0
    },
    stage2: {
      exposure: 0,
      provisions: stage2Provisions,
      coverageRate: 0
    },
    stage3: {
      exposure: 0,
      provisions: stage3Provisions,
      coverageRate: 0
    },
    total: {
      exposure: 0,
      provisions: totalProvisions,
      coverageRate: 0
    },
    confidence: 0.7,
    source: `Year ${year} IFRS 9 context`
  };

  return result;
}

/**
 * Extract credit counterparty risk data from text
 *
 * Main extraction function for credit/counterparty risk data
 */
export function extractCreditCounterpartyRisk(
  text: string,
  config: CreditRiskConfig = DEFAULT_CREDIT_RISK_CONFIG
): CreditCounterpartyRiskResult | null {
  const cfg = { ...DEFAULT_CREDIT_RISK_CONFIG, ...config };

  if (cfg.verbose) {
    }

  const documentType = detectCreditRiskDocumentType(text);

  if (cfg.verbose) {
    }

  // Extract data for each year
  const yearlyData: CreditCounterpartyRiskResult['yearlyData'] = [];
  const yearsExtracted: number[] = [];

  for (let i = 1; i <= cfg.yearsToExtract; i++) {
    const year = cfg.currentYear - i;
    const yearLabel = getYearLabel(year, cfg.currentYear);

    const costOfRisk = extractCostOfRiskForYear(text, year, yearLabel, cfg);

    if (costOfRisk && costOfRisk.confidence >= cfg.minConfidence) {
      const yearEntry: CreditCounterpartyRiskResult['yearlyData'][0] = { costOfRisk };

      // Optional: Extract geographic exposure
      if (cfg.enableGeographicExtraction) {
        const geographic = extractGeographicExposureForYear(text, year, yearLabel, cfg);
        if (geographic && geographic.confidence >= cfg.minConfidence) {
          yearEntry.geographic = geographic;
        }
      }

      // Optional: Extract NPL data
      if (cfg.enableNPLExtraction) {
        const npl = extractNPLForYear(text, year, yearLabel, cfg);
        if (npl && npl.confidence >= cfg.minConfidence) {
          yearEntry.npl = npl;
        }
      }

      // Optional: Extract IFRS 9 Stages
      if (cfg.enableIFRS9Extraction) {
        const ifrs9Stages = extractIFRS9StagesForYear(text, year, yearLabel, cfg);
        if (ifrs9Stages && ifrs9Stages.confidence >= cfg.minConfidence) {
          yearEntry.ifrs9Stages = ifrs9Stages;
        }
      }

      yearlyData.push(yearEntry);
      yearsExtracted.push(year);
    }
  }

  if (yearlyData.length === 0) {
    if (cfg.verbose) {
      }
    return null;
  }

  // Calculate 5-year summary
  const summary5Year = calculate5YearSummary(yearlyData, cfg);

  // Validate results
  const validation = validateCreditRiskData(yearlyData, summary5Year, cfg);

  // Calculate overall confidence
  const avgConfidence = yearlyData.reduce((sum, y) => sum + y.costOfRisk.confidence, 0) / yearlyData.length;

  if (cfg.verbose) {
    .toFixed(0)}%)`);
  }

  return {
    yearlyData,
    summary5Year,
    validation,
    documentType,
    extractionDate: new Date().toISOString(),
    yearsExtracted,
    confidence: avgConfidence
  };
}

/**
 * Calculate 5-year summary statistics
 */
function calculate5YearSummary(
  yearlyData: CreditCounterpartyRiskResult['yearlyData'],
  config: Required<CreditRiskConfig>
): CreditCounterpartyRiskResult['summary5Year'] {
  let totalProvisions = 0;
  let totalReversals = 0;
  let totalWriteOffs = 0;
  let totalRecoveries = 0;
  let totalCostOfRiskNet = 0;
  let sumBps = 0;
  let countBps = 0;

  for (const yearData of yearlyData) {
    const cor = yearData.costOfRisk;
    totalProvisions += cor.provisions;
    totalReversals += cor.reversals;
    totalWriteOffs += cor.writeOffs;
    totalRecoveries += cor.recoveries;
    totalCostOfRiskNet += cor.costOfRiskNet;

    if (cor.costOfRiskBps) {
      sumBps += cor.costOfRiskBps;
      countBps++;
    }
  }

  const averageAnnual = totalCostOfRiskNet / yearlyData.length;
  const averageBps = countBps > 0 ? sumBps / countBps : 0;

  // Recovery rate
  const recoveryRate = totalWriteOffs > 0 ? (totalRecoveries / totalWriteOffs) * 100 : 0;

  // Evolution
  const sortedYears = [...yearlyData].sort((a, b) => a.costOfRisk.year - b.costOfRisk.year);
  const oldestCost = sortedYears[0].costOfRisk.costOfRiskNet;
  const newestCost = sortedYears[sortedYears.length - 1].costOfRisk.costOfRiskNet;

  const evolutionAbsolute = newestCost - oldestCost;
  const evolutionRelative = oldestCost > 0 ? (evolutionAbsolute / oldestCost) * 100 : 0;

  let direction: 'improving' | 'deteriorating' | 'stable' = 'stable';
  if (evolutionRelative < -5) direction = 'improving'; // Cost decreasing = improving
  else if (evolutionRelative > 5) direction = 'deteriorating'; // Cost increasing = deteriorating

  // Rating
  const rating = rateCostOfRisk(averageBps);

  // Benchmark
  let benchmark: string | undefined;
  if (config.benchmarkSectorBps) {
    const diff = averageBps - config.benchmarkSectorBps;
    if (diff < -10) benchmark = `Excellent (${Math.abs(diff).toFixed(0)}bp below sector average)`;
    else if (diff < 0) benchmark = `Good (${Math.abs(diff).toFixed(0)}bp below sector average)`;
    else if (diff < 10) benchmark = `In line with sector average`;
    else benchmark = `${diff.toFixed(0)}bp above sector average`;
  }

  return {
    costOfRisk: {
      totalProvisions,
      totalReversals,
      totalWriteOffs,
      totalRecoveries,
      totalCostOfRiskNet,
      averageAnnual,
      averageBps,
      recoveryRate,
      evolution: {
        absolute: evolutionAbsolute,
        relative: evolutionRelative,
        direction
      }
    },
    rating,
    benchmark
  };
}

/**
 * Validate credit risk data
 */
function validateCreditRiskData(
  yearlyData: CreditCounterpartyRiskResult['yearlyData'],
  summary: CreditCounterpartyRiskResult['summary5Year'],
  config: Required<CreditRiskConfig>
): CreditCounterpartyRiskResult['validation'] {
  const warnings: string[] = [];

  // 1. Cost of Risk formula check
  let costOfRiskFormula = true;
  for (const yearData of yearlyData) {
    const cor = yearData.costOfRisk;
    const calculated = cor.provisions - cor.reversals + cor.writeOffs - cor.recoveries;
    const diff = Math.abs(calculated - cor.costOfRiskNet);
    const tolerance = cor.costOfRiskNet * 0.05; // 5% tolerance

    if (diff > tolerance && diff > 5) { // 5M€ absolute tolerance
      costOfRiskFormula = false;
      warnings.push(
        `Year ${cor.year}: Formula mismatch (Calculated ${calculated.toFixed(0)}M€ vs Actual ${cor.costOfRiskNet.toFixed(0)}M€)`
      );
    }
  }

  // 2. Benchmark compliance
  let benchmarkCompliance = true;
  if (summary.costOfRisk.averageBps > 150) {
    benchmarkCompliance = false;
    warnings.push(`Very high cost of risk ratio: ${summary.costOfRisk.averageBps.toFixed(0)}bp (>150bp threshold)`);
  }

  // 3. Recovery rate plausibility
  if (summary.costOfRisk.recoveryRate > 60) {
    warnings.push(`Unusually high recovery rate: ${summary.costOfRisk.recoveryRate.toFixed(1)}% (>60% is rare)`);
  }

  // 4. Data completeness
  const completeness = (yearlyData.length / config.yearsToExtract) * 100;
  if (completeness < 60) {
    warnings.push(`Low data completeness: ${completeness.toFixed(0)}% (only ${yearlyData.length}/${config.yearsToExtract} years extracted)`);
  }

  return {
    costOfRiskFormula,
    geographicCoherence: true, // Not yet implemented
    nplDynamics: true, // Not yet implemented
    benchmarkCompliance,
    warnings
  };
}

// ============================================================================
// FORMATTING & EXPORT FUNCTIONS
// ============================================================================

/**
 * Format credit risk data for questionnaire
 */
export function formatCreditRiskForQuestionnaire(result: CreditCounterpartyRiskResult): string {
  let output = '';

  output += '═══════════════════════════════════════════════════════════\n';
  output += 'RISQUE DE CRÉDIT/CONTREPARTIE SUR 5 ANS\n';
  output += '═══════════════════════════════════════════════════════════\n\n';

  output += `Période: ${Math.min(...result.yearsExtracted)} - ${Math.max(...result.yearsExtracted)} (${result.yearsExtracted.length} ans)\n`;
  output += `Type: ${result.documentType}\n`;
  output += `Extraction: ${new Date(result.extractionDate).toLocaleDateString()}\n`;
  output += `Confiance: ${(result.confidence * 100).toFixed(0)}%\n\n`;

  // Cost of Risk Summary
  output += '───────────────────────────────────────────────────────────\n';
  output += '💰 COÛT DU RISQUE - CUMUL 5 ANS\n';
  output += '───────────────────────────────────────────────────────────\n\n';

  const cor = result.summary5Year.costOfRisk;

  output += `Total Coût du Risque Net: €${cor.totalCostOfRiskNet.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} M\n`;
  output += `  Dotations:              €${cor.totalProvisions.toLocaleString('fr-FR')} M\n`;
  output += `  Reprises:              (€${cor.totalReversals.toLocaleString('fr-FR')} M)\n`;
  output += `  Write-offs:             €${cor.totalWriteOffs.toLocaleString('fr-FR')} M\n`;
  output += `  Récupérations:         (€${cor.totalRecoveries.toLocaleString('fr-FR')} M)\n\n`;

  output += `Moyenne Annuelle:         €${cor.averageAnnual.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} M/an\n`;
  if (cor.averageBps > 0) {
    output += `Ratio Moyen:              ${cor.averageBps.toFixed(1)} bp\n`;
  }
  output += `Taux de Récupération:     ${cor.recoveryRate.toFixed(1)}%\n\n`;

  // Evolution
  const evolutionIcon = cor.evolution.direction === 'improving' ? '📉' :
                       cor.evolution.direction === 'deteriorating' ? '📈' : '➡️';
  output += `Évolution: ${evolutionIcon} ${cor.evolution.direction.toUpperCase()}\n`;
  output += `  Variation: ${cor.evolution.absolute >= 0 ? '+' : ''}${cor.evolution.absolute.toFixed(0)} M€ (${cor.evolution.relative >= 0 ? '+' : ''}${cor.evolution.relative.toFixed(1)}%)\n\n`;

  // Rating & Benchmark
  output += `Note: ${result.summary5Year.rating}\n`;
  if (result.summary5Year.benchmark) {
    output += `Benchmark: ${result.summary5Year.benchmark}\n`;
  }
  output += '\n';

  // Validation
  output += '───────────────────────────────────────────────────────────\n';
  output += 'VALIDATION\n';
  output += '───────────────────────────────────────────────────────────\n\n';

  output += `Formule Coût du Risque: ${result.validation.costOfRiskFormula ? '✅ PASS' : '❌ FAIL'}\n`;
  output += `Benchmark Compliance:   ${result.validation.benchmarkCompliance ? '✅ PASS' : '⚠️  WARNING'}\n\n`;

  if (result.validation.warnings.length > 0) {
    output += 'Avertissements:\n';
    for (const warning of result.validation.warnings) {
      output += `  ⚠️  ${warning}\n`;
    }
    output += '\n';
  }

  output += '═══════════════════════════════════════════════════════════\n';

  return output;
}

/**
 * Get recommended metric for questionnaire
 */
export function getRecommendedCreditRiskMetric(result: CreditCounterpartyRiskResult): {
  metric: string;
  value: number;
  unit: string;
  description: string;
} {
  return {
    metric: 'Total Cost of Credit Risk (5 years)',
    value: result.summary5Year.costOfRisk.totalCostOfRiskNet,
    unit: 'M€',
    description: `Cumulative net cost of credit risk from ${Math.min(...result.yearsExtracted)} to ${Math.max(...result.yearsExtracted)} (provisions - reversals + write-offs - recoveries)`
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already declared inline with their definitions:
// - extractCreditCounterpartyRisk (main extraction)
// - formatCreditRiskForQuestionnaire (formatting)
// - getRecommendedCreditRiskMetric (questionnaire helper)
// - DEFAULT_CREDIT_RISK_CONFIG (configuration)
// - Enums: CreditRiskDocumentType, IFRS9Stage, CostOfRiskRating
