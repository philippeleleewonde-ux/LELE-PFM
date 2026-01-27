/**
 * Operational Risk Loss Data Extractor
 *
 * Phase 2.9 - Sprint 2.9
 * Skill: Elite SaaS Developer
 *
 * Extracts Operational Risk Loss Data following Basel II Committee framework
 * - 7 Loss Event Types (Basel II classification)
 * - QIS 2 format (Quantitative Impact Study 2, 4 May 2001)
 * - Gross Loss / Recoveries / Net Loss breakdown
 * - Frequency tracking (number of events)
 * - Severity classification (Low/Medium/High/Critical)
 * - Multi-year aggregation (N to N-4)
 *
 * Reference: Basel II Committee, Loss event type classification, QIS 2 - Operational Risk Loss Data, 4 May 2001
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Basel II Loss Event Types
 *
 * Official 7 categories defined by Basel Committee on Banking Supervision
 */
export enum BaselIILossEventType {
  INTERNAL_FRAUD = 'Internal Fraud',
  EXTERNAL_FRAUD = 'External Fraud',
  EMPLOYMENT_PRACTICES = 'Employment Practices & Workplace Safety',
  CLIENTS_PRODUCTS = 'Clients, Products & Business Practices',
  PHYSICAL_DAMAGE = 'Damage to Physical Assets',
  BUSINESS_DISRUPTION = 'Business Disruption & System Failures',
  EXECUTION_DELIVERY = 'Execution, Delivery & Process Management'
}

/**
 * Severity classification for operational risk losses
 */
export enum LossSeverity {
  LOW = 'Low',           // < 100K€
  MEDIUM = 'Medium',     // 100K€ - 1M€
  HIGH = 'High',         // 1M€ - 10M€
  CRITICAL = 'Critical'  // > 10M€
}

/**
 * QIS 2 table format detection
 */
export enum QIS2TableFormat {
  FULL = 'Full QIS 2 Format',              // All columns present
  SIMPLIFIED = 'Simplified QIS 2',         // Gross + Net only
  GROSS_ONLY = 'Gross Loss Only',          // Single column
  FREQUENCY_SEVERITY = 'Frequency-Severity' // Event count + amount
}

/**
 * Single operational risk loss event
 */
export interface OpRiskLossEvent {
  year: number;
  yearLabel: string;           // "N-1", "N-2", etc.
  eventType: BaselIILossEventType;
  grossLoss: number;           // Gross loss amount (M€)
  recoveries: number;          // Recoveries amount (M€) - positive value
  netLoss: number;             // Net loss = Gross - Recoveries (M€)
  frequency: number;           // Number of loss events
  severity: LossSeverity;      // Classification based on net loss
  recoveryRate: number;        // Recoveries / Gross Loss (%)
  confidence: number;          // Extraction confidence (0-100)
  source: string;              // Source location in document
}

/**
 * Operational risk loss data by event type for one year
 */
export interface OpRiskYearData {
  year: number;
  yearLabel: string;
  eventTypes: {
    [key in BaselIILossEventType]?: {
      grossLoss: number;
      recoveries: number;
      netLoss: number;
      frequency: number;
      severity: LossSeverity;
      recoveryRate: number;
    };
  };
  total: {
    grossLoss: number;
    recoveries: number;
    netLoss: number;
    frequency: number;
    averageSeverity: LossSeverity;
    recoveryRate: number;
  };
  qis2Format: QIS2TableFormat;
  confidence: number;
}

/**
 * Complete operational risk loss extraction result
 */
export interface OpRiskLossResult {
  yearlyData: OpRiskYearData[];

  summary5Year: {
    totalGrossLoss: number;      // Sum of gross losses (M€)
    totalRecoveries: number;     // Sum of recoveries (M€)
    totalNetLoss: number;        // Sum of net losses (M€)
    totalFrequency: number;      // Total number of events
    averageGrossLoss: number;    // Average per year (M€)
    averageNetLoss: number;      // Average per year (M€)
    overallRecoveryRate: number; // Total recoveries / Total gross (%)

    byEventType: {
      [key in BaselIILossEventType]?: {
        totalGrossLoss: number;
        totalNetLoss: number;
        totalFrequency: number;
        recoveryRate: number;
        percentOfTotal: number;    // % of total gross loss
      };
    };

    topEventType: {
      type: BaselIILossEventType;
      grossLoss: number;
      percentOfTotal: number;
    };

    trend: {
      direction: 'increasing' | 'decreasing' | 'stable';
      percentageChange: number;    // (N-1 - N-5) / N-5 * 100
      cagr: number;                 // Compound Annual Growth Rate
    };
  };

  validation: {
    coherence: boolean;           // Gross = Net + Recoveries
    plausibility: boolean;        // Values within realistic ranges
    completeness: number;         // % of years with data (0-100)
    qis2Compliance: boolean;      // Follows QIS 2 format
    warnings: string[];
  };

  documentType: string;
  extractionDate: string;
  yearsExtracted: number[];
  confidence: number;
}

/**
 * Configuration for operational risk loss extraction
 */
export interface OpRiskConfig {
  currentYear?: number;                    // Default: current year
  yearsToExtract?: number;                 // Default: 5 (N-1 to N-5)
  enableQIS2Detection?: boolean;           // Default: true
  enableSeverityClassification?: boolean;  // Default: true
  severityThresholds?: {
    low: number;        // Default: 100000 (100K€)
    medium: number;     // Default: 1000000 (1M€)
    high: number;       // Default: 10000000 (10M€)
  };
  minConfidence?: number;                  // Default: 0.5 (50%)
  enableRecoveryTracking?: boolean;        // Default: true
  verbose?: boolean;                       // Default: false
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_OPRISK_CONFIG: Required<OpRiskConfig> = {
  currentYear: new Date().getFullYear(),
  yearsToExtract: 5,
  enableQIS2Detection: true,
  enableSeverityClassification: true,
  severityThresholds: {
    low: 100000,      // 100K€
    medium: 1000000,  // 1M€
    high: 10000000    // 10M€
  },
  minConfidence: 0.5,
  enableRecoveryTracking: true,
  verbose: false
};

// ============================================================================
// REGEX PATTERNS - BASEL II EVENT TYPES
// ============================================================================

/**
 * French/English patterns for each Basel II Loss Event Type
 */
const BASEL_EVENT_PATTERNS = {
  [BaselIILossEventType.INTERNAL_FRAUD]: {
    fr: [
      /fraude\s+interne/gi,
      /activit[ée]s?\s+non\s+autoris[ée]es?/gi,
      /vol\s+par\s+employ[ée]s?/gi,
      /d[ée]tournement\s+de\s+fonds/gi
    ],
    en: [
      /internal\s+fraud/gi,
      /unauthorized\s+activity/gi,
      /theft\s+by\s+employee/gi,
      /embezzlement/gi
    ]
  },

  [BaselIILossEventType.EXTERNAL_FRAUD]: {
    fr: [
      /fraude\s+externe/gi,
      /vol\s+externe/gi,
      /cyberattaque/gi,
      /cyber\s+fraude/gi,
      /hacking/gi
    ],
    en: [
      /external\s+fraud/gi,
      /external\s+theft/gi,
      /cyber\s+attack/gi,
      /cyber\s+fraud/gi,
      /hacking/gi
    ]
  },

  [BaselIILossEventType.EMPLOYMENT_PRACTICES]: {
    fr: [
      /pratiques?\s+en\s+mati[èe]re\s+d'emploi/gi,
      /s[ée]curit[ée]\s+du\s+travail/gi,
      /discrimination/gi,
      /harc[èe]lement/gi,
      /contentieux\s+social/gi
    ],
    en: [
      /employment\s+practices/gi,
      /workplace\s+safety/gi,
      /discrimination/gi,
      /harassment/gi,
      /labor\s+dispute/gi
    ]
  },

  [BaselIILossEventType.CLIENTS_PRODUCTS]: {
    fr: [
      /clients?,?\s+produits?\s+et\s+pratiques?\s+commerciales?/gi,
      /manquement\s+aux\s+obligations?\s+fiduciaires?/gi,
      /abus\s+de\s+confiance/gi,
      /vente\s+abusive/gi,
      /mis-selling/gi
    ],
    en: [
      /clients?,?\s+products?\s+(?:and|&)\s+business\s+practices?/gi,
      /fiduciary\s+breach/gi,
      /breach\s+of\s+trust/gi,
      /mis-?selling/gi,
      /unsuitable\s+product/gi
    ]
  },

  [BaselIILossEventType.PHYSICAL_DAMAGE]: {
    fr: [
      /dommages?\s+aux\s+actifs\s+physiques?/gi,
      /catastrophes?\s+naturelles?/gi,
      /incendie/gi,
      /inondation/gi,
      /terrorisme/gi
    ],
    en: [
      /damage\s+to\s+physical\s+assets?/gi,
      /natural\s+disaster/gi,
      /fire/gi,
      /flood/gi,
      /terrorism/gi
    ]
  },

  [BaselIILossEventType.BUSINESS_DISRUPTION]: {
    fr: [
      /interruption\s+d'activit[ée]/gi,
      /d[ée]faillance\s+syst[èe]me/gi,
      /panne\s+informatique/gi,
      /indisponibilit[ée]\s+(?:du\s+)?syst[èe]me/gi
    ],
    en: [
      /business\s+disruption/gi,
      /system\s+failure/gi,
      /it\s+outage/gi,
      /system\s+unavailability/gi
    ]
  },

  [BaselIILossEventType.EXECUTION_DELIVERY]: {
    fr: [
      /ex[ée]cution,?\s+livraison\s+et\s+gestion\s+des?\s+processus/gi,
      /erreurs?\s+de\s+saisie/gi,
      /erreurs?\s+op[ée]rationnelles?/gi,
      /d[ée]faut\s+de\s+livraison/gi,
      /litiges?\s+avec\s+contreparties?/gi
    ],
    en: [
      /execution,?\s+delivery\s+(?:and|&)\s+process\s+management/gi,
      /data\s+entry\s+error/gi,
      /operational\s+error/gi,
      /failed\s+delivery/gi,
      /counterparty\s+dispute/gi
    ]
  }
};

// ============================================================================
// REGEX PATTERNS - LOSS AMOUNTS
// ============================================================================

/**
 * Patterns for extracting loss amounts (Gross, Net, Recoveries)
 */
const LOSS_AMOUNT_PATTERNS = {
  grossLoss: {
    fr: [
      /perte\s+brute\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi,
      /montant\s+brut\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi,
      /gross\s+loss\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi
    ],
    en: [
      /gross\s+loss\s*:?\s*([0-9\s,.]+)\s*(M€|€M|millions?|billions?|k€|K€)/gi,
      /total\s+loss\s*:?\s*([0-9\s,.]+)\s*(M€|€M|millions?|billions?|k€|K€)/gi
    ]
  },

  netLoss: {
    fr: [
      /perte\s+nette\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi,
      /montant\s+net\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi,
      /net\s+loss\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi
    ],
    en: [
      /net\s+loss\s*:?\s*([0-9\s,.]+)\s*(M€|€M|millions?|billions?|k€|K€)/gi
    ]
  },

  recoveries: {
    fr: [
      /r[ée]cup[ée]rations?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi,
      /recouvrements?\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi,
      /recoveries\s*:?\s*([0-9\s,.]+)\s*(M€|Mds?€|millions?|milliards?|k€|K€)/gi
    ],
    en: [
      /recoveries\s*:?\s*([0-9\s,.]+)\s*(M€|€M|millions?|billions?|k€|K€)/gi,
      /recovered\s+amount\s*:?\s*([0-9\s,.]+)\s*(M€|€M|millions?|billions?|k€|K€)/gi
    ]
  },

  frequency: {
    fr: [
      /fr[ée]quence\s*:?\s*([0-9]+)/gi,
      /nombre\s+d'[ée]v[èe]nements?\s*:?\s*([0-9]+)/gi,
      /nombre\s+de\s+pertes?\s*:?\s*([0-9]+)/gi
    ],
    en: [
      /frequency\s*:?\s*([0-9]+)/gi,
      /number\s+of\s+events?\s*:?\s*([0-9]+)/gi,
      /event\s+count\s*:?\s*([0-9]+)/gi
    ]
  }
};

// ============================================================================
// REGEX PATTERNS - QIS 2 TABLE DETECTION
// ============================================================================

const QIS2_TABLE_PATTERNS = {
  headers: [
    /loss\s+event\s+type/gi,
    /type\s+de\s+perte/gi,
    /gross\s+loss/gi,
    /perte\s+brute/gi,
    /recoveries/gi,
    /r[ée]cup[ée]rations?/gi,
    /net\s+loss/gi,
    /perte\s+nette/gi,
    /frequency/gi,
    /fr[ée]quence/gi
  ],

  tableStructure: [
    /\|\s*loss\s+event\s+type\s*\|\s*gross\s+loss\s*\|\s*recoveries\s*\|\s*net\s+loss\s*\|/gi,
    /loss\s+event\s+type\s+gross\s+loss\s+recoveries\s+net\s+loss/gi
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse amount from text (handles M€, Mds€, k€, etc.)
 */
function parseAmount(value: string, unit: string): number {
  const cleanValue = value.replace(/\s/g, '').replace(/,/g, '.');
  const numValue = parseFloat(cleanValue);

  if (isNaN(numValue)) return 0;

  const unitLower = unit.toLowerCase();

  // Convert to millions (M€)
  if (unitLower.includes('mds') || unitLower.includes('billion')) {
    return numValue * 1000; // Billions to millions
  } else if (unitLower.includes('k€') || unitLower.includes('thousand')) {
    return numValue / 1000; // Thousands to millions
  } else {
    return numValue; // Already in millions
  }
}

/**
 * Classify severity based on net loss amount
 */
function classifySeverity(
  netLoss: number,
  thresholds: { low: number; medium: number; high: number }
): LossSeverity {
  const amountInEuros = netLoss * 1000000; // Convert M€ to €

  if (amountInEuros < thresholds.low) {
    return LossSeverity.LOW;
  } else if (amountInEuros < thresholds.medium) {
    return LossSeverity.MEDIUM;
  } else if (amountInEuros < thresholds.high) {
    return LossSeverity.HIGH;
  } else {
    return LossSeverity.CRITICAL;
  }
}

/**
 * Calculate recovery rate
 */
function calculateRecoveryRate(grossLoss: number, recoveries: number): number {
  if (grossLoss === 0) return 0;
  return (Math.abs(recoveries) / grossLoss) * 100;
}

/**
 * Detect QIS 2 table format
 */
function detectQIS2Format(text: string): QIS2TableFormat {
  let score = 0;
  let hasGross = false;
  let hasRecoveries = false;
  let hasNet = false;
  let hasFrequency = false;

  for (const pattern of QIS2_TABLE_PATTERNS.headers) {
    if (pattern.test(text)) {
      score++;
      const patternStr = pattern.source.toLowerCase();
      if (patternStr.includes('gross')) hasGross = true;
      if (patternStr.includes('recover') || patternStr.includes('récup')) hasRecoveries = true;
      if (patternStr.includes('net')) hasNet = true;
      if (patternStr.includes('freq')) hasFrequency = true;
    }
  }

  if (hasGross && hasRecoveries && hasNet && hasFrequency) {
    return QIS2TableFormat.FULL;
  } else if (hasGross && hasNet) {
    return QIS2TableFormat.SIMPLIFIED;
  } else if (hasGross) {
    return QIS2TableFormat.GROSS_ONLY;
  } else if (hasFrequency) {
    return QIS2TableFormat.FREQUENCY_SEVERITY;
  }

  return QIS2TableFormat.GROSS_ONLY;
}

/**
 * Identify Basel II event type from text
 */
function identifyEventType(text: string): { type: BaselIILossEventType; confidence: number } | null {
  const matches: Array<{ type: BaselIILossEventType; score: number }> = [];

  for (const [eventType, patterns] of Object.entries(BASEL_EVENT_PATTERNS)) {
    let score = 0;

    // Check French patterns
    for (const pattern of patterns.fr) {
      if (pattern.test(text)) {
        score += 2; // Higher weight for exact match
      }
    }

    // Check English patterns
    for (const pattern of patterns.en) {
      if (pattern.test(text)) {
        score += 2;
      }
    }

    if (score > 0) {
      matches.push({
        type: eventType as BaselIILossEventType,
        score
      });
    }
  }

  if (matches.length === 0) return null;

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  const topMatch = matches[0];
  const confidence = Math.min(topMatch.score / 4, 1); // Normalize to 0-1

  return {
    type: topMatch.type,
    confidence
  };
}

/**
 * Extract year label (N-1, N-2, etc.)
 */
function getYearLabel(year: number, currentYear: number): string {
  const diff = currentYear - year;
  if (diff === 0) return 'N';
  if (diff > 0) return `N-${diff}`;
  return `N+${Math.abs(diff)}`;
}

// ============================================================================
// MAIN EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract operational risk loss data from text
 *
 * Main extraction function that processes text and extracts OpRisk loss data
 * following Basel II classification and QIS 2 format.
 */
export function extractOpRiskLossFromText(
  text: string,
  config: OpRiskConfig = DEFAULT_OPRISK_CONFIG
): OpRiskLossResult | null {
  const cfg = { ...DEFAULT_OPRISK_CONFIG, ...config };

  if (cfg.verbose) {
    }

  // Detect QIS 2 format
  const qis2Format = cfg.enableQIS2Detection ? detectQIS2Format(text) : QIS2TableFormat.GROSS_ONLY;

  if (cfg.verbose) {
    }

  // Extract data for each year (N-1 to N-yearsToExtract)
  const yearlyData: OpRiskYearData[] = [];
  const yearsExtracted: number[] = [];

  for (let i = 1; i <= cfg.yearsToExtract; i++) {
    const year = cfg.currentYear - i;
    const yearLabel = getYearLabel(year, cfg.currentYear);

    const yearData = extractYearData(text, year, yearLabel, qis2Format, cfg);

    if (yearData) {
      yearlyData.push(yearData);
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
  const validation = validateOpRiskData(yearlyData, summary5Year, cfg);

  // Calculate overall confidence
  const avgConfidence = yearlyData.reduce((sum, y) => sum + y.confidence, 0) / yearlyData.length;

  if (cfg.verbose) {
    .toFixed(0)}%)`);
  }

  return {
    yearlyData,
    summary5Year,
    validation,
    documentType: qis2Format,
    extractionDate: new Date().toISOString(),
    yearsExtracted,
    confidence: avgConfidence
  };
}

/**
 * Extract operational risk loss data for a single year
 */
function extractYearData(
  text: string,
  year: number,
  yearLabel: string,
  qis2Format: QIS2TableFormat,
  config: Required<OpRiskConfig>
): OpRiskYearData | null {
  const eventTypes: OpRiskYearData['eventTypes'] = {};
  let totalGrossLoss = 0;
  let totalRecoveries = 0;
  let totalNetLoss = 0;
  let totalFrequency = 0;
  let confidenceSum = 0;
  let eventTypeCount = 0;

  // Extract data for each Basel II event type
  for (const eventType of Object.values(BaselIILossEventType)) {
    const eventData = extractEventTypeData(text, year, eventType, config);

    if (eventData && eventData.confidence >= config.minConfidence) {
      eventTypes[eventType] = {
        grossLoss: eventData.grossLoss,
        recoveries: eventData.recoveries,
        netLoss: eventData.netLoss,
        frequency: eventData.frequency,
        severity: eventData.severity,
        recoveryRate: eventData.recoveryRate
      };

      totalGrossLoss += eventData.grossLoss;
      totalRecoveries += eventData.recoveries;
      totalNetLoss += eventData.netLoss;
      totalFrequency += eventData.frequency;
      confidenceSum += eventData.confidence;
      eventTypeCount++;
    }
  }

  if (eventTypeCount === 0) return null;

  const avgConfidence = confidenceSum / eventTypeCount;
  const overallRecoveryRate = calculateRecoveryRate(totalGrossLoss, totalRecoveries);

  // Determine average severity
  const severities = Object.values(eventTypes).map(e => e.severity);
  const averageSeverity = determineDominantSeverity(severities);

  return {
    year,
    yearLabel,
    eventTypes,
    total: {
      grossLoss: totalGrossLoss,
      recoveries: totalRecoveries,
      netLoss: totalNetLoss,
      frequency: totalFrequency,
      averageSeverity,
      recoveryRate: overallRecoveryRate
    },
    qis2Format,
    confidence: avgConfidence
  };
}

/**
 * Extract data for a specific event type in a specific year
 */
function extractEventTypeData(
  text: string,
  year: number,
  eventType: BaselIILossEventType,
  config: Required<OpRiskConfig>
): OpRiskLossEvent | null {
  // Find sections mentioning this event type
  const patterns = BASEL_EVENT_PATTERNS[eventType];
  if (!patterns) return null;

  let bestMatch: OpRiskLossEvent | null = null;
  let highestConfidence = 0;

  // Try all patterns
  const allPatterns = [...patterns.fr, ...patterns.en];

  for (const pattern of allPatterns) {
    const matches = text.matchAll(new RegExp(pattern.source, 'gi'));

    for (const match of matches) {
      const contextStart = Math.max(0, match.index! - 500);
      const contextEnd = Math.min(text.length, match.index! + 500);
      const context = text.substring(contextStart, contextEnd);

      // Check if year is mentioned in context
      const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
      if (!yearPattern.test(context)) continue;

      // Extract amounts
      const grossLoss = extractAmountFromContext(context, LOSS_AMOUNT_PATTERNS.grossLoss);
      const netLoss = extractAmountFromContext(context, LOSS_AMOUNT_PATTERNS.netLoss);
      const recoveries = extractAmountFromContext(context, LOSS_AMOUNT_PATTERNS.recoveries);
      const frequency = extractFrequencyFromContext(context);

      if (grossLoss === 0 && netLoss === 0) continue;

      // Calculate net loss if not provided
      const finalNetLoss = netLoss > 0 ? netLoss : grossLoss - recoveries;
      const finalGrossLoss = grossLoss > 0 ? grossLoss : finalNetLoss + recoveries;
      const finalRecoveries = recoveries > 0 ? recoveries : finalGrossLoss - finalNetLoss;

      // Calculate metrics
      const recoveryRate = calculateRecoveryRate(finalGrossLoss, finalRecoveries);
      const severity = config.enableSeverityClassification
        ? classifySeverity(finalNetLoss, config.severityThresholds)
        : LossSeverity.MEDIUM;

      // Calculate confidence (0-1)
      let confidence = 0.5; // Base confidence
      if (grossLoss > 0) confidence += 0.2;
      if (netLoss > 0) confidence += 0.15;
      if (recoveries > 0) confidence += 0.1;
      if (frequency > 0) confidence += 0.05;

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          year,
          yearLabel: getYearLabel(year, config.currentYear),
          eventType,
          grossLoss: finalGrossLoss,
          recoveries: finalRecoveries,
          netLoss: finalNetLoss,
          frequency: frequency || 0,
          severity,
          recoveryRate,
          confidence,
          source: context.substring(0, 100)
        };
      }
    }
  }

  return bestMatch;
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
    const match = pattern.exec(context);
    if (match && match[1] && match[2]) {
      return parseAmount(match[1], match[2]);
    }
  }

  return 0;
}

/**
 * Extract frequency (number of events) from context
 */
function extractFrequencyFromContext(context: string): number {
  const allPatterns = [
    ...LOSS_AMOUNT_PATTERNS.frequency.fr,
    ...LOSS_AMOUNT_PATTERNS.frequency.en
  ];

  for (const pattern of allPatterns) {
    const match = pattern.exec(context);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return 0;
}

/**
 * Determine dominant severity from array of severities
 */
function determineDominantSeverity(severities: LossSeverity[]): LossSeverity {
  if (severities.length === 0) return LossSeverity.LOW;

  const counts = {
    [LossSeverity.LOW]: 0,
    [LossSeverity.MEDIUM]: 0,
    [LossSeverity.HIGH]: 0,
    [LossSeverity.CRITICAL]: 0
  };

  for (const severity of severities) {
    counts[severity]++;
  }

  // Return the most frequent, or highest if tied
  if (counts[LossSeverity.CRITICAL] > 0) return LossSeverity.CRITICAL;
  if (counts[LossSeverity.HIGH] > 0) return LossSeverity.HIGH;
  if (counts[LossSeverity.MEDIUM] > 0) return LossSeverity.MEDIUM;
  return LossSeverity.LOW;
}

/**
 * Calculate 5-year summary statistics
 */
function calculate5YearSummary(
  yearlyData: OpRiskYearData[],
  config: Required<OpRiskConfig>
): OpRiskLossResult['summary5Year'] {
  let totalGrossLoss = 0;
  let totalRecoveries = 0;
  let totalNetLoss = 0;
  let totalFrequency = 0;

  const byEventType: OpRiskLossResult['summary5Year']['byEventType'] = {};

  // Aggregate across all years
  for (const yearData of yearlyData) {
    totalGrossLoss += yearData.total.grossLoss;
    totalRecoveries += yearData.total.recoveries;
    totalNetLoss += yearData.total.netLoss;
    totalFrequency += yearData.total.frequency;

    // Aggregate by event type
    for (const [eventType, data] of Object.entries(yearData.eventTypes)) {
      const type = eventType as BaselIILossEventType;

      if (!byEventType[type]) {
        byEventType[type] = {
          totalGrossLoss: 0,
          totalNetLoss: 0,
          totalFrequency: 0,
          recoveryRate: 0,
          percentOfTotal: 0
        };
      }

      byEventType[type]!.totalGrossLoss += data.grossLoss;
      byEventType[type]!.totalNetLoss += data.netLoss;
      byEventType[type]!.totalFrequency += data.frequency;
    }
  }

  // Calculate percentages and recovery rates
  for (const [eventType, data] of Object.entries(byEventType)) {
    const type = eventType as BaselIILossEventType;
    data.percentOfTotal = (data.totalGrossLoss / totalGrossLoss) * 100;
    data.recoveryRate = calculateRecoveryRate(
      data.totalGrossLoss,
      data.totalGrossLoss - data.totalNetLoss
    );
  }

  // Find top event type
  let topEventType: OpRiskLossResult['summary5Year']['topEventType'] = {
    type: BaselIILossEventType.EXECUTION_DELIVERY,
    grossLoss: 0,
    percentOfTotal: 0
  };

  for (const [eventType, data] of Object.entries(byEventType)) {
    if (data.totalGrossLoss > topEventType.grossLoss) {
      topEventType = {
        type: eventType as BaselIILossEventType,
        grossLoss: data.totalGrossLoss,
        percentOfTotal: data.percentOfTotal
      };
    }
  }

  // Calculate trend
  const sortedYears = [...yearlyData].sort((a, b) => a.year - b.year);
  const oldestYear = sortedYears[0];
  const newestYear = sortedYears[sortedYears.length - 1];

  const percentageChange = oldestYear.total.netLoss > 0
    ? ((newestYear.total.netLoss - oldestYear.total.netLoss) / oldestYear.total.netLoss) * 100
    : 0;

  const yearsDiff = newestYear.year - oldestYear.year;
  const cagr = yearsDiff > 0
    ? (Math.pow(newestYear.total.netLoss / oldestYear.total.netLoss, 1 / yearsDiff) - 1) * 100
    : 0;

  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (percentageChange > 5) direction = 'increasing';
  else if (percentageChange < -5) direction = 'decreasing';

  return {
    totalGrossLoss,
    totalRecoveries,
    totalNetLoss,
    totalFrequency,
    averageGrossLoss: totalGrossLoss / yearlyData.length,
    averageNetLoss: totalNetLoss / yearlyData.length,
    overallRecoveryRate: calculateRecoveryRate(totalGrossLoss, totalRecoveries),
    byEventType,
    topEventType,
    trend: {
      direction,
      percentageChange,
      cagr
    }
  };
}

/**
 * Validate operational risk data
 */
function validateOpRiskData(
  yearlyData: OpRiskYearData[],
  summary: OpRiskLossResult['summary5Year'],
  config: Required<OpRiskConfig>
): OpRiskLossResult['validation'] {
  const warnings: string[] = [];

  // 1. Coherence check: Gross = Net + Recoveries
  let coherence = true;
  for (const yearData of yearlyData) {
    const calculated = yearData.total.netLoss + yearData.total.recoveries;
    const diff = Math.abs(yearData.total.grossLoss - calculated);
    const tolerance = yearData.total.grossLoss * 0.05; // 5% tolerance

    if (diff > tolerance) {
      coherence = false;
      warnings.push(
        `Year ${yearData.year}: Gross (${yearData.total.grossLoss.toFixed(1)}M€) ≠ Net + Recoveries (${calculated.toFixed(1)}M€)`
      );
    }
  }

  // 2. Plausibility check: Values within realistic ranges
  let plausibility = true;
  const MAX_OPRISK_LOSS = 50000; // 50B€ (extremely conservative upper bound)

  if (summary.totalGrossLoss > MAX_OPRISK_LOSS) {
    plausibility = false;
    warnings.push(
      `Total gross loss (${summary.totalGrossLoss.toLocaleString()}M€) exceeds plausible maximum (${MAX_OPRISK_LOSS.toLocaleString()}M€)`
    );
  }

  // 3. Completeness check
  const completeness = (yearlyData.length / config.yearsToExtract) * 100;

  if (completeness < 60) {
    warnings.push(
      `Low data completeness (${completeness.toFixed(0)}%) - only ${yearlyData.length} of ${config.yearsToExtract} years extracted`
    );
  }

  // 4. QIS 2 Compliance check
  const qis2Compliance = yearlyData.every(
    y => y.qis2Format === QIS2TableFormat.FULL || y.qis2Format === QIS2TableFormat.SIMPLIFIED
  );

  if (!qis2Compliance) {
    warnings.push('QIS 2 format compliance incomplete - some years may have limited data');
  }

  return {
    coherence,
    plausibility,
    completeness,
    qis2Compliance,
    warnings
  };
}

// ============================================================================
// FORMATTING & EXPORT FUNCTIONS
// ============================================================================

/**
 * Format operational risk loss data for questionnaire
 *
 * Returns formatted text suitable for Basel II OpRisk questionnaire responses
 */
export function formatOpRiskForQuestionnaire(result: OpRiskLossResult): string {
  let output = '';

  output += '═══════════════════════════════════════════════════════════\n';
  output += 'OPERATIONAL RISK LOSS DATA - BASEL II CLASSIFICATION\n';
  output += '═══════════════════════════════════════════════════════════\n\n';

  output += `Period: ${Math.min(...result.yearsExtracted)} - ${Math.max(...result.yearsExtracted)} (${result.yearsExtracted.length} years)\n`;
  output += `Format: ${result.documentType}\n`;
  output += `Extraction Date: ${new Date(result.extractionDate).toLocaleDateString()}\n`;
  output += `Overall Confidence: ${(result.confidence * 100).toFixed(0)}%\n\n`;

  // 5-Year Summary
  output += '───────────────────────────────────────────────────────────\n';
  output += '5-YEAR SUMMARY (N-1 TO N-5)\n';
  output += '───────────────────────────────────────────────────────────\n\n';

  output += `Total Gross Loss:      €${result.summary5Year.totalGrossLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M\n`;
  output += `Total Recoveries:      €${result.summary5Year.totalRecoveries.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M\n`;
  output += `Total Net Loss:        €${result.summary5Year.totalNetLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M\n`;
  output += `Total Events:          ${result.summary5Year.totalFrequency}\n`;
  output += `Recovery Rate:         ${result.summary5Year.overallRecoveryRate.toFixed(1)}%\n\n`;

  output += `Average Gross Loss/Year: €${result.summary5Year.averageGrossLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} M\n`;
  output += `Average Net Loss/Year:   €${result.summary5Year.averageNetLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} M\n\n`;

  // Trend
  const trendEmoji = result.summary5Year.trend.direction === 'increasing' ? '📈' :
                     result.summary5Year.trend.direction === 'decreasing' ? '📉' : '➡️';
  output += `Trend: ${trendEmoji} ${result.summary5Year.trend.direction.toUpperCase()}\n`;
  output += `  Change: ${result.summary5Year.trend.percentageChange >= 0 ? '+' : ''}${result.summary5Year.trend.percentageChange.toFixed(1)}%\n`;
  output += `  CAGR: ${result.summary5Year.trend.cagr >= 0 ? '+' : ''}${result.summary5Year.trend.cagr.toFixed(1)}%\n\n`;

  // Breakdown by Basel II Event Type
  output += '───────────────────────────────────────────────────────────\n';
  output += 'BREAKDOWN BY BASEL II LOSS EVENT TYPE\n';
  output += '───────────────────────────────────────────────────────────\n\n';

  const sortedEventTypes = Object.entries(result.summary5Year.byEventType)
    .sort(([, a], [, b]) => b.totalGrossLoss - a.totalGrossLoss);

  for (const [eventType, data] of sortedEventTypes) {
    output += `${eventType}:\n`;
    output += `  Gross Loss:  €${data.totalGrossLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} M (${data.percentOfTotal.toFixed(1)}% of total)\n`;
    output += `  Net Loss:    €${data.totalNetLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} M\n`;
    output += `  Events:      ${data.totalFrequency}\n`;
    output += `  Recovery:    ${data.recoveryRate.toFixed(1)}%\n\n`;
  }

  // Top Event Type
  output += '───────────────────────────────────────────────────────────\n';
  output += 'TOP LOSS EVENT TYPE\n';
  output += '───────────────────────────────────────────────────────────\n\n';
  output += `${result.summary5Year.topEventType.type}\n`;
  output += `  Gross Loss: €${result.summary5Year.topEventType.grossLoss.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} M\n`;
  output += `  % of Total: ${result.summary5Year.topEventType.percentOfTotal.toFixed(1)}%\n\n`;

  // Validation
  output += '───────────────────────────────────────────────────────────\n';
  output += 'VALIDATION\n';
  output += '───────────────────────────────────────────────────────────\n\n';

  output += `Coherence (Gross = Net + Recoveries): ${result.validation.coherence ? '✅ PASS' : '❌ FAIL'}\n`;
  output += `Plausibility (Realistic ranges):      ${result.validation.plausibility ? '✅ PASS' : '❌ FAIL'}\n`;
  output += `Completeness:                          ${result.validation.completeness.toFixed(0)}%\n`;
  output += `QIS 2 Compliance:                      ${result.validation.qis2Compliance ? '✅ YES' : '⚠️  PARTIAL'}\n\n`;

  if (result.validation.warnings.length > 0) {
    output += 'Warnings:\n';
    for (const warning of result.validation.warnings) {
      output += `  ⚠️  ${warning}\n`;
    }
    output += '\n';
  }

  output += '═══════════════════════════════════════════════════════════\n';

  return output;
}

/**
 * Export operational risk data as JSON for API consumption
 */
export function exportOpRiskAsJSON(result: OpRiskLossResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Get recommended metric for questionnaire (5-year total net loss)
 */
export function getRecommendedOpRiskMetric(result: OpRiskLossResult): {
  metric: string;
  value: number;
  unit: string;
  description: string;
} {
  return {
    metric: 'Total Net Operational Risk Losses (5 years)',
    value: result.summary5Year.totalNetLoss,
    unit: 'M€',
    description: `Cumulative net operational risk losses from ${Math.min(...result.yearsExtracted)} to ${Math.max(...result.yearsExtracted)} following Basel II classification`
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are already declared inline with their definitions:
// - extractOpRiskLossFromText (main extraction)
// - formatOpRiskForQuestionnaire (formatting)
// - exportOpRiskAsJSON (JSON export)
// - getRecommendedOpRiskMetric (questionnaire helper)
// - DEFAULT_OPRISK_CONFIG (configuration)
// - BaselIILossEventType, LossSeverity, QIS2TableFormat (enums)
