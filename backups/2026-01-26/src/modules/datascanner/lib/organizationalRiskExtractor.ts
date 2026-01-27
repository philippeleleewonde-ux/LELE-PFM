/**
 * Organizational Risk Extractor (Phase 2.13)
 *
 * Extracts organizational risk data across 3 pillars:
 * - Workforce (Personnel): Fraude interne, litiges sociaux, absentéisme, turnover, accidents
 * - Equipment (Équipement): Pannes systèmes, cyberattaques, maintenance, obsolescence
 * - Environment (Environnement): Catastrophes naturelles, amendes environnementales, pandémie
 *
 * Uses Basel II operational risk categories (extended from Phase 2.9)
 * with additional indirect cost calculations from RSE indicators
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Workforce Risk Data (Personnel)
 * Combines Basel II Cat. 1 (Fraude) + Cat. 3 (Employment Practices)
 */
export interface WorkforceRiskData {
  year: number;
  yearLabel: string;  // "N-1", "N-2", etc.

  // Direct losses from Pillar 3 (M€)
  fraudeInterne: number;              // Basel Cat. 1 - Internal fraud
  litigesSociaux: number;             // Basel Cat. 3 - Employment litigation
  accidentsTravail: number;           // Basel Cat. 3 - Workplace accidents
  discriminationHarcelement: number;  // Basel Cat. 3 - Discrimination/harassment

  // Indirect costs (calculated from RSE indicators) (M€)
  coutAbsenteisme: number;            // Calculated from taux absentéisme × effectif
  coutTurnover: number;               // Calculated from nb départs × coût remplacement

  totalWorkforce: number;             // Sum of all workforce costs

  confidence: number;
  source: string;
}

/**
 * Equipment Risk Data (Équipement)
 * Combines Basel II Cat. 6 (Business Disruption) + Cat. 7 (Execution - partial)
 */
export interface EquipmentRiskData {
  year: number;
  yearLabel: string;

  // Direct losses from Pillar 3 (M€)
  pannesSystemes: number;             // Basel Cat. 6 - System failures
  cyberattaques: number;              // Basel Cat. 6 - Cyber incidents
  maintenanceUrgence: number;         // Exceptional repair costs
  obsolescence: number;               // Equipment replacement costs
  defaillancesInfrastructure: number; // Infrastructure failures

  totalEquipment: number;             // Sum of all equipment costs

  confidence: number;
  source: string;
}

/**
 * Environment Risk Data (Environnement)
 * Combines Basel II Cat. 5 (Physical Damage) + Environmental penalties
 */
export interface EnvironmentRiskData {
  year: number;
  yearLabel: string;

  // Direct losses from Pillar 3 & Annexes (M€)
  catastrophesNaturelles: number;     // Basel Cat. 5 - Natural disasters
  amendesEnvironnementales: number;   // Environmental fines/penalties
  sanctionsESG: number;               // ESG-related sanctions
  coutPandemie: number;               // Pandemic-related costs (COVID, etc.)
  dommagesLocaux: number;             // Basel Cat. 5 - Damage to premises
  criseSanitaire: number;             // Health crisis costs

  totalEnvironment: number;           // Sum of all environment costs

  confidence: number;
  source: string;
}

/**
 * Combined organizational risk data for one year
 */
export interface OrganizationalRiskYearData {
  year: number;
  yearLabel: string;

  workforce: WorkforceRiskData;
  equipment: EquipmentRiskData;
  environment: EnvironmentRiskData;

  totalOrganisationnel: number;       // Grand total across 3 pillars

  // Optional: link to OpRisk total for proportion calculation
  risqueOpTotal?: number;
  proportionOfOpRisk?: number;        // % of total operational risk
}

/**
 * Top cost item across all pillars
 */
export interface TopCostItem {
  label: string;
  pillar: 'Workforce' | 'Equipment' | 'Environment';
  category: string;
  amount: number;
  percentOfTotal: number;
}

/**
 * 5-Year cumulative summary with 3-pillar breakdown
 */
export interface OrganizationalRisk5YearSummary {
  // WORKFORCE (Personnel) - Cumulative 5Y
  workforce: {
    fraudeInterne5Y: number;
    litigesSociaux5Y: number;
    accidentsTravail5Y: number;
    discriminationHarcelement5Y: number;
    coutAbsenteisme5Y: number;
    coutTurnover5Y: number;
    totalWorkforce5Y: number;
    percentOfTotal: number;
    averageAnnual: number;
  };

  // EQUIPMENT (Équipement) - Cumulative 5Y
  equipment: {
    pannesSystemes5Y: number;
    cyberattaques5Y: number;
    maintenanceUrgence5Y: number;
    obsolescence5Y: number;
    defaillancesInfrastructure5Y: number;
    totalEquipment5Y: number;
    percentOfTotal: number;
    averageAnnual: number;
  };

  // ENVIRONMENT (Environnement) - Cumulative 5Y
  environment: {
    catastrophesNaturelles5Y: number;
    amendesEnvironnementales5Y: number;
    sanctionsESG5Y: number;
    coutPandemie5Y: number;
    dommagesLocaux5Y: number;
    criseSanitaire5Y: number;
    totalEnvironment5Y: number;
    percentOfTotal: number;
    averageAnnual: number;
  };

  // TOTAL & ANALYTICS
  totalOrganisationnel5Y: number;
  moyenneAnnuelle: number;

  // Evolution
  evolution: {
    initial: number;              // Oldest year
    final: number;                // Most recent year
    variationAbsolue: number;     // Final - Initial (M€)
    variationRelative: number;    // % change
    direction: 'increasing' | 'decreasing' | 'stable';
  };

  // Top 5 cost categories across all pillars
  topCosts: TopCostItem[];

  // Pillar with highest cost
  pillarLePlusCouteux: {
    pillar: 'Workforce' | 'Equipment' | 'Environment';
    amount: number;
    percent: number;
  };

  // Risk rating
  riskRating: 'Low' | 'Moderate' | 'Elevated' | 'High';
  recommendations: string[];
}

/**
 * Validation results for organizational risk data
 */
export interface OrganizationalRiskValidation {
  // Coherence with OpRisk total
  coherenceChecks: {
    workforceVsOpRisk: {
      workforceAmount: number;
      opRiskTotal: number;
      proportion: number;
      status: string;
    };
    temporalConsistency: Array<{
      year: number;
      pillar: string;
      variation: number;
      alert: string | null;
    }>;
  };

  // RSE cross-validation (if RSE data available)
  rseCorrelation?: {
    absenteismeCorrelation: number;
    turnoverCorrelation: number;
    accidentsCorrelation: number;
    status: string;
  };

  alerts: string[];
}

/**
 * Complete organizational risk extraction result
 */
export interface OrganizationalRiskResult {
  yearlyData: OrganizationalRiskYearData[];
  summary5Year: OrganizationalRisk5YearSummary;
  yearsExtracted: number[];
  confidence: number;
  validation: OrganizationalRiskValidation;
  documentType: 'Pillar3_OpRisk' | 'AnnualReport' | 'RSE_DPEF' | 'RiskReport';
}

/**
 * Configuration for organizational risk extraction
 */
export interface OrganizationalRiskConfig {
  currentYear?: number;
  yearsToExtract?: number;
  minConfidence?: number;
  enableValidation?: boolean;

  // Calculation parameters for indirect costs
  salaireMoyenAnnuel?: number;      // Average annual salary (default: 50,000€)
  coutMoyenRemplacement?: number;   // Average replacement cost (default: 75,000€)

  // Integration with OpRisk data
  includeOpRiskTotal?: boolean;     // Calculate proportion vs total OpRisk

  verbose?: boolean;
}

export const DEFAULT_ORGANIZATIONAL_RISK_CONFIG: Required<OrganizationalRiskConfig> = {
  currentYear: new Date().getFullYear(),
  yearsToExtract: 5,
  minConfidence: 0.6,
  enableValidation: true,
  salaireMoyenAnnuel: 50000,
  coutMoyenRemplacement: 75000,
  includeOpRiskTotal: true,
  verbose: false,
};

// ============================================================================
// REGEX PATTERNS - 3 PILLARS
// ============================================================================

// WORKFORCE PATTERNS (Personnel)
const WORKFORCE_PATTERNS = {
  // Fraude interne (Basel Cat. 1)
  fraudeInterne: [
    /fraude\s+interne[:\s]+([\d\s,.]+)\s*(M€|millions?)/gi,
    /internal\s+fraud[:\s]+([\d\s,.]+)\s*(M€|\$M)/gi,
    /d[ée]tournements?\s+(?:par\s+)?employ[ée]s?[:\s]+([\d\s,.]+)\s*M€/gi,
    /employee\s+theft[:\s]+([\d\s,.]+)/gi,
    /vol\s+interne[:\s]+([\d\s,.]+)\s*M€/gi,
  ],

  // Litiges sociaux (Basel Cat. 3)
  litigesSociaux: [
    /litiges?\s+(?:sociaux|prud'homaux)[:\s]+([\d\s,.]+)\s*M€/gi,
    /employment\s+litigation[:\s]+([\d\s,.]+)/gi,
    /condamnations?\s+prud'homales?[:\s]+([\d\s,.]+)\s*M€/gi,
    /wrongful\s+termination\s+costs?[:\s]+([\d\s,.]+)/gi,
    /provisions?\s+(?:pour\s+)?litiges?\s+du\s+travail[:\s]+([\d\s,.]+)\s*M€/gi,
    /labor\s+disputes?[:\s]+([\d\s,.]+)/gi,
  ],

  // Accidents du travail (Basel Cat. 3)
  accidentsTravail: [
    /co[ûu]ts?\s+accidents?\s+du\s+travail[:\s]+([\d\s,.]+)\s*M€/gi,
    /workplace\s+accidents?\s+costs?[:\s]+([\d\s,.]+)/gi,
    /s[ée]curit[ée]\s+du\s+travail[:\s]+([\d\s,.]+)\s*M€/gi,
    /occupational\s+accidents?[:\s]+([\d\s,.]+)/gi,
  ],

  // Discrimination/harcèlement (Basel Cat. 3)
  discriminationHarcelement: [
    /discrimination[:\s]+([\d\s,.]+)\s*M€/gi,
    /harc[èe]lement[:\s]+([\d\s,.]+)\s*M€/gi,
    /harassment[:\s]+([\d\s,.]+)/gi,
    /discrimination\s+claims?[:\s]+([\d\s,.]+)/gi,
  ],

  // Coût absentéisme (indirect - from RSE)
  coutAbsenteisme: [
    /co[ûu]t\s+(?:de\s+)?l'absent[ée]isme[:\s]+([\d\s,.]+)\s*M€/gi,
    /absenteeism\s+cost[:\s]+([\d\s,.]+)/gi,
    /co[ûu]t\s+des\s+absences[:\s]+([\d\s,.]+)\s*M€/gi,
  ],

  // Coût turnover (indirect - from RSE)
  coutTurnover: [
    /co[ûu]ts?\s+(?:de\s+)?(?:recrutement|turn-?over)[:\s]+([\d\s,.]+)\s*M€/gi,
    /turnover\s+cost[:\s]+([\d\s,.]+)/gi,
    /replacement\s+cost[:\s]+([\d\s,.]+)/gi,
    /co[ûu]t\s+des\s+d[ée]parts[:\s]+([\d\s,.]+)\s*M€/gi,
  ],
};

// EQUIPMENT PATTERNS (Équipement)
const EQUIPMENT_PATTERNS = {
  // Pannes systèmes (Basel Cat. 6)
  pannesSystemes: [
    /pertes\s+sur\s+pannes?[:\s]+([\d\s,.]+)\s*M€/gi,
    /system\s+failures?[:\s]+([\d\s,.]+)/gi,
    /d[ée]faillances?\s+(?:informatiques?|syst[èe]mes?)[:\s]+([\d\s,.]+)\s*M€/gi,
    /interruptions?\s+(?:d')?activit[ée][:\s]+([\d\s,.]+)\s*M€/gi,
    /business\s+disruption[:\s]+([\d\s,.]+)/gi,
    /IT\s+outage[:\s]+([\d\s,.]+)/gi,
  ],

  // Cyberattaques (Basel Cat. 6)
  cyberattaques: [
    /(?:pertes|co[ûu]ts?)\s+(?:sur|de\s+)?cyberattaque[s]?[:\s]+([\d\s,.]+)\s*M€/gi,
    /cyber\s+(?:incident|attack)\s+(?:losses?|cost)[:\s]+([\d\s,.]+)/gi,
    /ran[çc]ons?\s+pay[ée]e?s?[:\s]+([\d\s,.]+)\s*M€/gi,
    /ransomware\s+payments?[:\s]+([\d\s,.]+)/gi,
    /incidents?\s+de\s+s[ée]curit[ée][:\s]+([\d\s,.]+)\s*M€/gi,
    /data\s+breach\s+costs?[:\s]+([\d\s,.]+)/gi,
  ],

  // Maintenance urgence
  maintenanceUrgence: [
    /co[ûu]ts?\s+exceptionnels?\s+(?:de\s+)?r[ée]paration[:\s]+([\d\s,.]+)\s*M€/gi,
    /emergency\s+maintenance[:\s]+([\d\s,.]+)/gi,
    /r[ée]parations?\s+d'urgence[:\s]+([\d\s,.]+)\s*M€/gi,
    /urgent\s+repairs?[:\s]+([\d\s,.]+)/gi,
  ],

  // Obsolescence
  obsolescence: [
    /obsolescence\s+(?:[ée]quipements?|mat[ée]riels?)[:\s]+([\d\s,.]+)\s*M€/gi,
    /equipment\s+obsolescence[:\s]+([\d\s,.]+)/gi,
    /remplacement\s+[ée]quipements?[:\s]+([\d\s,.]+)\s*M€/gi,
    /equipment\s+replacement[:\s]+([\d\s,.]+)/gi,
  ],

  // Défaillances infrastructure
  defaillancesInfrastructure: [
    /d[ée]faillances?\s+infrastructure[:\s]+([\d\s,.]+)\s*M€/gi,
    /infrastructure\s+failures?[:\s]+([\d\s,.]+)/gi,
    /pannes?\s+[ée]lectriques?[:\s]+([\d\s,.]+)\s*M€/gi,
    /power\s+failures?[:\s]+([\d\s,.]+)/gi,
  ],
};

// ENVIRONMENT PATTERNS (Environnement)
const ENVIRONMENT_PATTERNS = {
  // Catastrophes naturelles (Basel Cat. 5)
  catastrophesNaturelles: [
    /(?:dommages?|pertes)\s+catastrophes?\s+naturelles?[:\s]+([\d\s,.]+)\s*M€/gi,
    /natural\s+disasters?\s+(?:losses?|damage)[:\s]+([\d\s,.]+)/gi,
    /(?:inondations?|flood)[s]?[:\s]+([\d\s,.]+)\s*M€/gi,
    /(?:incendie|fire)[s]?[:\s]+([\d\s,.]+)\s*M€/gi,
    /temp[êe]tes?[:\s]+([\d\s,.]+)\s*M€/gi,
    /s[ée]ismes?[:\s]+([\d\s,.]+)\s*M€/gi,
  ],

  // Amendes environnementales
  amendesEnvironnementales: [
    /amendes?\s+environnementales?[:\s]+([\d\s,.]+)\s*M€/gi,
    /environmental\s+(?:fines?|penalties)[:\s]+([\d\s,.]+)/gi,
    /sanctions?\s+(?:[ée]cologiques?|environnementales?)[:\s]+([\d\s,.]+)\s*M€/gi,
    /environmental\s+violations?[:\s]+([\d\s,.]+)/gi,
  ],

  // Sanctions ESG
  sanctionsESG: [
    /sanctions?\s+ESG[:\s]+([\d\s,.]+)\s*M€/gi,
    /ESG\s+penalties[:\s]+([\d\s,.]+)/gi,
    /non-?conformit[ée]\s+ESG[:\s]+([\d\s,.]+)\s*M€/gi,
  ],

  // Coûts pandémie
  coutPandemie: [
    /co[ûu]ts?\s+(?:exceptionnels?\s+)?(?:COVID|pand[ée]mie)[:\s]+([\d\s,.]+)\s*M€/gi,
    /pandemic[- ]related\s+(?:losses?|costs?)[:\s]+([\d\s,.]+)/gi,
    /COVID[-\s]?19\s+(?:impact|costs?)[:\s]+([\d\s,.]+)/gi,
    /pertes\s+(?:li[ée]es\s+[àa]\s+)?la\s+pand[ée]mie[:\s]+([\d\s,.]+)\s*M€/gi,
  ],

  // Dommages locaux (Basel Cat. 5)
  dommagesLocaux: [
    /dommages?\s+aux\s+locaux[:\s]+([\d\s,.]+)\s*M€/gi,
    /damage\s+to\s+(?:premises|facilities)[:\s]+([\d\s,.]+)/gi,
    /d[ée]gradations?[:\s]+([\d\s,.]+)\s*M€/gi,
    /property\s+damage[:\s]+([\d\s,.]+)/gi,
  ],

  // Crise sanitaire
  criseSanitaire: [
    /crise\s+sanitaire[:\s]+([\d\s,.]+)\s*M€/gi,
    /health\s+crisis[:\s]+([\d\s,.]+)/gi,
    /([ée]pid[ée]mies?|health\s+emergency)[:\s]+([\d\s,.]+)/gi,
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseAmount(amountStr: string, unit: string = 'M€'): number {
  const cleanStr = amountStr.replace(/\s/g, '').replace(',', '.');
  let amount = parseFloat(cleanStr);
  if (isNaN(amount)) return 0;

  // Handle negative values (parentheses)
  if (amountStr.includes('(') && amountStr.includes(')')) {
    amount = -Math.abs(amount);
  }

  // Unit conversion
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit.includes('k') || lowerUnit.includes('milliers')) {
    amount = amount / 1000;  // Convert to M€
  } else if (lowerUnit.includes('md') || lowerUnit.includes('milliard') ||
             lowerUnit.includes('bn') || lowerUnit.includes('billion')) {
    amount = amount * 1000;  // Convert to M€
  }

  return amount;
}

function extractAmountFromContext(context: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(context);
    if (match && match[1]) {
      const amountStr = match[1];
      const unit = match[2] || 'M€';
      const amount = parseAmount(amountStr, unit);
      if (amount > 0) return amount;
    }
  }
  return 0;
}

function getYearLabel(year: number, currentYear: number): string {
  const diff = currentYear - year;
  if (diff === 0) return 'N';
  if (diff === 1) return 'N-1';
  if (diff === 2) return 'N-2';
  if (diff === 3) return 'N-3';
  if (diff === 4) return 'N-4';
  if (diff === 5) return 'N-5';
  return `N-${diff}`;
}

function detectDocumentType(text: string): OrganizationalRiskResult['documentType'] {
  const lowerText = text.toLowerCase();
  if (/pillar\s+3|pilier\s+3|operational\s+risk|risque\s+op[ée]rationnel/i.test(lowerText)) {
    return 'Pillar3_OpRisk';
  }
  if (/rse|dpef|responsabilit[ée]\s+sociale|esg\s+report/i.test(lowerText)) {
    return 'RSE_DPEF';
  }
  if (/annual\s+report|rapport\s+annuel/i.test(lowerText)) {
    return 'AnnualReport';
  }
  return 'RiskReport';
}

// ============================================================================
// EXTRACTION FUNCTIONS BY PILLAR
// ============================================================================

/**
 * Extract Workforce risk data for one year
 */
function extractWorkforceRiskForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<OrganizationalRiskConfig>
): WorkforceRiskData | null {
  // Find context around year mention
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const yearMatches: number[] = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    yearMatches.push(match.index);
  }

  if (yearMatches.length === 0) return null;

  // Extract amounts for each workforce category
  let fraudeInterne = 0;
  let litigesSociaux = 0;
  let accidentsTravail = 0;
  let discriminationHarcelement = 0;
  let coutAbsenteisme = 0;
  let coutTurnover = 0;

  let confidence = 0.3; // Base confidence
  let categoriesFound = 0;

  for (const yearIdx of yearMatches) {
    const contextStart = Math.max(0, yearIdx - 500);
    const contextEnd = Math.min(text.length, yearIdx + 500);
    const context = text.substring(contextStart, contextEnd);

    // Check if workforce/employment context
    if (!/(?:personnel|employ[ée]|workforce|fraude|litiges?|absent|turnover)/i.test(context)) {
      continue;
    }

    // Extract each category
    if (fraudeInterne === 0) {
      const amount = extractAmountFromContext(context, WORKFORCE_PATTERNS.fraudeInterne);
      if (amount > 0) {
        fraudeInterne = amount;
        confidence += 0.15;
        categoriesFound++;
      }
    }

    if (litigesSociaux === 0) {
      const amount = extractAmountFromContext(context, WORKFORCE_PATTERNS.litigesSociaux);
      if (amount > 0) {
        litigesSociaux = amount;
        confidence += 0.15;
        categoriesFound++;
      }
    }

    if (accidentsTravail === 0) {
      const amount = extractAmountFromContext(context, WORKFORCE_PATTERNS.accidentsTravail);
      if (amount > 0) {
        accidentsTravail = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }

    if (discriminationHarcelement === 0) {
      const amount = extractAmountFromContext(context, WORKFORCE_PATTERNS.discriminationHarcelement);
      if (amount > 0) {
        discriminationHarcelement = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }

    if (coutAbsenteisme === 0) {
      const amount = extractAmountFromContext(context, WORKFORCE_PATTERNS.coutAbsenteisme);
      if (amount > 0) {
        coutAbsenteisme = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }

    if (coutTurnover === 0) {
      const amount = extractAmountFromContext(context, WORKFORCE_PATTERNS.coutTurnover);
      if (amount > 0) {
        coutTurnover = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }
  }

  if (categoriesFound === 0) return null;

  const totalWorkforce = fraudeInterne + litigesSociaux + accidentsTravail +
                         discriminationHarcelement + coutAbsenteisme + coutTurnover;

  return {
    year,
    yearLabel,
    fraudeInterne,
    litigesSociaux,
    accidentsTravail,
    discriminationHarcelement,
    coutAbsenteisme,
    coutTurnover,
    totalWorkforce,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} workforce context`,
  };
}

/**
 * Extract Equipment risk data for one year
 */
function extractEquipmentRiskForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<OrganizationalRiskConfig>
): EquipmentRiskData | null {
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const yearMatches: number[] = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    yearMatches.push(match.index);
  }

  if (yearMatches.length === 0) return null;

  let pannesSystemes = 0;
  let cyberattaques = 0;
  let maintenanceUrgence = 0;
  let obsolescence = 0;
  let defaillancesInfrastructure = 0;

  let confidence = 0.3;
  let categoriesFound = 0;

  for (const yearIdx of yearMatches) {
    const contextStart = Math.max(0, yearIdx - 500);
    const contextEnd = Math.min(text.length, yearIdx + 500);
    const context = text.substring(contextStart, contextEnd);

    // Check if equipment/IT context
    if (!/(?:[ée]quipement|syst[èe]me|cyber|IT|infrastructure|panne|maintenance)/i.test(context)) {
      continue;
    }

    if (pannesSystemes === 0) {
      const amount = extractAmountFromContext(context, EQUIPMENT_PATTERNS.pannesSystemes);
      if (amount > 0) {
        pannesSystemes = amount;
        confidence += 0.15;
        categoriesFound++;
      }
    }

    if (cyberattaques === 0) {
      const amount = extractAmountFromContext(context, EQUIPMENT_PATTERNS.cyberattaques);
      if (amount > 0) {
        cyberattaques = amount;
        confidence += 0.15;
        categoriesFound++;
      }
    }

    if (maintenanceUrgence === 0) {
      const amount = extractAmountFromContext(context, EQUIPMENT_PATTERNS.maintenanceUrgence);
      if (amount > 0) {
        maintenanceUrgence = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }

    if (obsolescence === 0) {
      const amount = extractAmountFromContext(context, EQUIPMENT_PATTERNS.obsolescence);
      if (amount > 0) {
        obsolescence = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }

    if (defaillancesInfrastructure === 0) {
      const amount = extractAmountFromContext(context, EQUIPMENT_PATTERNS.defaillancesInfrastructure);
      if (amount > 0) {
        defaillancesInfrastructure = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }
  }

  if (categoriesFound === 0) return null;

  const totalEquipment = pannesSystemes + cyberattaques + maintenanceUrgence +
                         obsolescence + defaillancesInfrastructure;

  return {
    year,
    yearLabel,
    pannesSystemes,
    cyberattaques,
    maintenanceUrgence,
    obsolescence,
    defaillancesInfrastructure,
    totalEquipment,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} equipment context`,
  };
}

/**
 * Extract Environment risk data for one year
 */
function extractEnvironmentRiskForYear(
  text: string,
  year: number,
  yearLabel: string,
  config: Required<OrganizationalRiskConfig>
): EnvironmentRiskData | null {
  const yearPattern = new RegExp(`\\b${year}\\b`, 'g');
  const yearMatches: number[] = [];
  let match;

  while ((match = yearPattern.exec(text)) !== null) {
    yearMatches.push(match.index);
  }

  if (yearMatches.length === 0) return null;

  let catastrophesNaturelles = 0;
  let amendesEnvironnementales = 0;
  let sanctionsESG = 0;
  let coutPandemie = 0;
  let dommagesLocaux = 0;
  let criseSanitaire = 0;

  let confidence = 0.3;
  let categoriesFound = 0;

  for (const yearIdx of yearMatches) {
    const contextStart = Math.max(0, yearIdx - 500);
    const contextEnd = Math.min(text.length, yearIdx + 500);
    const context = text.substring(contextStart, contextEnd);

    // Check if environment context
    if (!/(?:environnement|catastrophe|amende|ESG|pand[ée]mie|COVID|naturel)/i.test(context)) {
      continue;
    }

    if (catastrophesNaturelles === 0) {
      const amount = extractAmountFromContext(context, ENVIRONMENT_PATTERNS.catastrophesNaturelles);
      if (amount > 0) {
        catastrophesNaturelles = amount;
        confidence += 0.15;
        categoriesFound++;
      }
    }

    if (amendesEnvironnementales === 0) {
      const amount = extractAmountFromContext(context, ENVIRONMENT_PATTERNS.amendesEnvironnementales);
      if (amount > 0) {
        amendesEnvironnementales = amount;
        confidence += 0.15;
        categoriesFound++;
      }
    }

    if (sanctionsESG === 0) {
      const amount = extractAmountFromContext(context, ENVIRONMENT_PATTERNS.sanctionsESG);
      if (amount > 0) {
        sanctionsESG = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }

    if (coutPandemie === 0) {
      const amount = extractAmountFromContext(context, ENVIRONMENT_PATTERNS.coutPandemie);
      if (amount > 0) {
        coutPandemie = amount;
        confidence += 0.15;
        categoriesFound++;
      }
    }

    if (dommagesLocaux === 0) {
      const amount = extractAmountFromContext(context, ENVIRONMENT_PATTERNS.dommagesLocaux);
      if (amount > 0) {
        dommagesLocaux = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }

    if (criseSanitaire === 0) {
      const amount = extractAmountFromContext(context, ENVIRONMENT_PATTERNS.criseSanitaire);
      if (amount > 0) {
        criseSanitaire = amount;
        confidence += 0.10;
        categoriesFound++;
      }
    }
  }

  if (categoriesFound === 0) return null;

  const totalEnvironment = catastrophesNaturelles + amendesEnvironnementales + sanctionsESG +
                           coutPandemie + dommagesLocaux + criseSanitaire;

  return {
    year,
    yearLabel,
    catastrophesNaturelles,
    amendesEnvironnementales,
    sanctionsESG,
    coutPandemie,
    dommagesLocaux,
    criseSanitaire,
    totalEnvironment,
    confidence: Math.min(confidence, 1),
    source: `Year ${year} environment context`,
  };
}

// ============================================================================
// 5-YEAR AGGREGATION
// ============================================================================

function calculate5YearSummary(
  yearlyData: OrganizationalRiskYearData[],
  config: Required<OrganizationalRiskConfig>
): OrganizationalRisk5YearSummary {
  const sorted = [...yearlyData].sort((a, b) => b.year - a.year);

  // WORKFORCE cumulative
  const workforce = {
    fraudeInterne5Y: sorted.reduce((sum, d) => sum + d.workforce.fraudeInterne, 0),
    litigesSociaux5Y: sorted.reduce((sum, d) => sum + d.workforce.litigesSociaux, 0),
    accidentsTravail5Y: sorted.reduce((sum, d) => sum + d.workforce.accidentsTravail, 0),
    discriminationHarcelement5Y: sorted.reduce((sum, d) => sum + d.workforce.discriminationHarcelement, 0),
    coutAbsenteisme5Y: sorted.reduce((sum, d) => sum + d.workforce.coutAbsenteisme, 0),
    coutTurnover5Y: sorted.reduce((sum, d) => sum + d.workforce.coutTurnover, 0),
    totalWorkforce5Y: 0,
    percentOfTotal: 0,
    averageAnnual: 0,
  };
  workforce.totalWorkforce5Y = workforce.fraudeInterne5Y + workforce.litigesSociaux5Y +
                                workforce.accidentsTravail5Y + workforce.discriminationHarcelement5Y +
                                workforce.coutAbsenteisme5Y + workforce.coutTurnover5Y;
  workforce.averageAnnual = workforce.totalWorkforce5Y / sorted.length;

  // EQUIPMENT cumulative
  const equipment = {
    pannesSystemes5Y: sorted.reduce((sum, d) => sum + d.equipment.pannesSystemes, 0),
    cyberattaques5Y: sorted.reduce((sum, d) => sum + d.equipment.cyberattaques, 0),
    maintenanceUrgence5Y: sorted.reduce((sum, d) => sum + d.equipment.maintenanceUrgence, 0),
    obsolescence5Y: sorted.reduce((sum, d) => sum + d.equipment.obsolescence, 0),
    defaillancesInfrastructure5Y: sorted.reduce((sum, d) => sum + d.equipment.defaillancesInfrastructure, 0),
    totalEquipment5Y: 0,
    percentOfTotal: 0,
    averageAnnual: 0,
  };
  equipment.totalEquipment5Y = equipment.pannesSystemes5Y + equipment.cyberattaques5Y +
                                equipment.maintenanceUrgence5Y + equipment.obsolescence5Y +
                                equipment.defaillancesInfrastructure5Y;
  equipment.averageAnnual = equipment.totalEquipment5Y / sorted.length;

  // ENVIRONMENT cumulative
  const environment = {
    catastrophesNaturelles5Y: sorted.reduce((sum, d) => sum + d.environment.catastrophesNaturelles, 0),
    amendesEnvironnementales5Y: sorted.reduce((sum, d) => sum + d.environment.amendesEnvironnementales, 0),
    sanctionsESG5Y: sorted.reduce((sum, d) => sum + d.environment.sanctionsESG, 0),
    coutPandemie5Y: sorted.reduce((sum, d) => sum + d.environment.coutPandemie, 0),
    dommagesLocaux5Y: sorted.reduce((sum, d) => sum + d.environment.dommagesLocaux, 0),
    criseSanitaire5Y: sorted.reduce((sum, d) => sum + d.environment.criseSanitaire, 0),
    totalEnvironment5Y: 0,
    percentOfTotal: 0,
    averageAnnual: 0,
  };
  environment.totalEnvironment5Y = environment.catastrophesNaturelles5Y + environment.amendesEnvironnementales5Y +
                                    environment.sanctionsESG5Y + environment.coutPandemie5Y +
                                    environment.dommagesLocaux5Y + environment.criseSanitaire5Y;
  environment.averageAnnual = environment.totalEnvironment5Y / sorted.length;

  // TOTAL
  const totalOrganisationnel5Y = workforce.totalWorkforce5Y + equipment.totalEquipment5Y + environment.totalEnvironment5Y;
  const moyenneAnnuelle = totalOrganisationnel5Y / sorted.length;

  // Calculate percentages
  workforce.percentOfTotal = (workforce.totalWorkforce5Y / totalOrganisationnel5Y) * 100;
  equipment.percentOfTotal = (equipment.totalEquipment5Y / totalOrganisationnel5Y) * 100;
  environment.percentOfTotal = (environment.totalEnvironment5Y / totalOrganisationnel5Y) * 100;

  // Evolution
  const initial = sorted[sorted.length - 1].totalOrganisationnel;
  const final = sorted[0].totalOrganisationnel;
  const variationAbsolue = final - initial;
  const variationRelative = initial !== 0 ? ((final / initial) - 1) * 100 : 0;

  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(variationRelative) > 10) {
    direction = variationRelative > 0 ? 'increasing' : 'decreasing';
  }

  const evolution = {
    initial,
    final,
    variationAbsolue,
    variationRelative,
    direction,
  };

  // Top 5 costs across all categories
  const allCosts: TopCostItem[] = [
    { label: 'Absentéisme', pillar: 'Workforce', category: 'Coût absentéisme', amount: workforce.coutAbsenteisme5Y, percentOfTotal: (workforce.coutAbsenteisme5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Fraude interne', pillar: 'Workforce', category: 'Fraude', amount: workforce.fraudeInterne5Y, percentOfTotal: (workforce.fraudeInterne5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Litiges sociaux', pillar: 'Workforce', category: 'Litiges', amount: workforce.litigesSociaux5Y, percentOfTotal: (workforce.litigesSociaux5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Turnover', pillar: 'Workforce', category: 'Coût turnover', amount: workforce.coutTurnover5Y, percentOfTotal: (workforce.coutTurnover5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Accidents travail', pillar: 'Workforce', category: 'Accidents', amount: workforce.accidentsTravail5Y, percentOfTotal: (workforce.accidentsTravail5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Pannes systèmes', pillar: 'Equipment', category: 'Pannes', amount: equipment.pannesSystemes5Y, percentOfTotal: (equipment.pannesSystemes5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Cyberattaques', pillar: 'Equipment', category: 'Cyber', amount: equipment.cyberattaques5Y, percentOfTotal: (equipment.cyberattaques5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Maintenance urgence', pillar: 'Equipment', category: 'Maintenance', amount: equipment.maintenanceUrgence5Y, percentOfTotal: (equipment.maintenanceUrgence5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Catastrophes naturelles', pillar: 'Environment', category: 'Catastrophes', amount: environment.catastrophesNaturelles5Y, percentOfTotal: (environment.catastrophesNaturelles5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Pandémie', pillar: 'Environment', category: 'Pandémie', amount: environment.coutPandemie5Y, percentOfTotal: (environment.coutPandemie5Y / totalOrganisationnel5Y) * 100 },
    { label: 'Amendes environnementales', pillar: 'Environment', category: 'Amendes', amount: environment.amendesEnvironnementales5Y, percentOfTotal: (environment.amendesEnvironnementales5Y / totalOrganisationnel5Y) * 100 },
  ];

  const topCosts = allCosts
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Pillar le plus coûteux
  const pillarAmounts = [
    { pillar: 'Workforce' as const, amount: workforce.totalWorkforce5Y, percent: workforce.percentOfTotal },
    { pillar: 'Equipment' as const, amount: equipment.totalEquipment5Y, percent: equipment.percentOfTotal },
    { pillar: 'Environment' as const, amount: environment.totalEnvironment5Y, percent: environment.percentOfTotal },
  ];
  const pillarLePlusCouteux = pillarAmounts.sort((a, b) => b.amount - a.amount)[0];

  // Risk rating
  let riskRating: 'Low' | 'Moderate' | 'Elevated' | 'High' = 'Moderate';
  if (moyenneAnnuelle < 50) riskRating = 'Low';
  else if (moyenneAnnuelle < 100) riskRating = 'Moderate';
  else if (moyenneAnnuelle < 200) riskRating = 'Elevated';
  else riskRating = 'High';

  // Recommendations
  const recommendations: string[] = [];
  if (topCosts[0]?.pillar === 'Workforce') {
    recommendations.push(`Focus sur ${topCosts[0].label} (pilier le plus coûteux)`);
  }
  if (workforce.coutAbsenteisme5Y > workforce.totalWorkforce5Y * 0.3) {
    recommendations.push('Programme de réduction de l\'absentéisme recommandé (ROI élevé)');
  }
  if (equipment.cyberattaques5Y > 0 && evolution.direction === 'increasing') {
    recommendations.push('Renforcement de la cybersécurité (risque croissant)');
  }
  if (workforce.coutTurnover5Y > workforce.totalWorkforce5Y * 0.15) {
    recommendations.push('Amélioration de la fidélisation pour réduire le turnover');
  }

  return {
    workforce,
    equipment,
    environment,
    totalOrganisationnel5Y,
    moyenneAnnuelle,
    evolution,
    topCosts,
    pillarLePlusCouteux,
    riskRating,
    recommendations,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateData(
  yearlyData: OrganizationalRiskYearData[],
  config: Required<OrganizationalRiskConfig>
): OrganizationalRiskValidation {
  const alerts: string[] = [];

  // Temporal consistency check
  const temporalConsistency: Array<{year: number; pillar: string; variation: number; alert: string | null}> = [];

  for (let i = 0; i < yearlyData.length - 1; i++) {
    const current = yearlyData[i];
    const next = yearlyData[i + 1];

    // Check Workforce variation
    const workforceVar = current.workforce.totalWorkforce !== 0 ?
      ((next.workforce.totalWorkforce / current.workforce.totalWorkforce) - 1) * 100 : 0;
    if (Math.abs(workforceVar) > 50) {
      alerts.push(`⚠️ Variation importante Workforce ${current.year} → ${next.year}: ${workforceVar >= 0 ? '+' : ''}${workforceVar.toFixed(1)}%`);
    }
    temporalConsistency.push({
      year: current.year,
      pillar: 'Workforce',
      variation: workforceVar,
      alert: Math.abs(workforceVar) > 50 ? `Variation > 50%` : null,
    });

    // Check Equipment variation
    const equipmentVar = current.equipment.totalEquipment !== 0 ?
      ((next.equipment.totalEquipment / current.equipment.totalEquipment) - 1) * 100 : 0;
    if (Math.abs(equipmentVar) > 50) {
      alerts.push(`⚠️ Variation importante Equipment ${current.year} → ${next.year}: ${equipmentVar >= 0 ? '+' : ''}${equipmentVar.toFixed(1)}%`);
    }
    temporalConsistency.push({
      year: current.year,
      pillar: 'Equipment',
      variation: equipmentVar,
      alert: Math.abs(equipmentVar) > 50 ? `Variation > 50%` : null,
    });

    // Check Environment variation
    const environmentVar = current.environment.totalEnvironment !== 0 ?
      ((next.environment.totalEnvironment / current.environment.totalEnvironment) - 1) * 100 : 0;
    if (Math.abs(environmentVar) > 50) {
      alerts.push(`⚠️ Variation importante Environment ${current.year} → ${next.year}: ${environmentVar >= 0 ? '+' : ''}${environmentVar.toFixed(1)}%`);
    }
    temporalConsistency.push({
      year: current.year,
      pillar: 'Environment',
      variation: environmentVar,
      alert: Math.abs(environmentVar) > 50 ? `Variation > 50%` : null,
    });
  }

  // Coherence with OpRisk (if available)
  const coherenceChecks = {
    workforceVsOpRisk: {
      workforceAmount: yearlyData.reduce((sum, d) => sum + d.workforce.totalWorkforce, 0),
      opRiskTotal: yearlyData[0]?.risqueOpTotal || 0,
      proportion: 0,
      status: 'Not available',
    },
    temporalConsistency,
  };

  if (yearlyData[0]?.risqueOpTotal) {
    const totalOrg = yearlyData.reduce((sum, d) => sum + d.totalOrganisationnel, 0);
    const totalOpRisk = yearlyData.reduce((sum, d) => sum + (d.risqueOpTotal || 0), 0);
    coherenceChecks.workforceVsOpRisk.proportion = totalOpRisk !== 0 ? (totalOrg / totalOpRisk) * 100 : 0;
    coherenceChecks.workforceVsOpRisk.status = coherenceChecks.workforceVsOpRisk.proportion > 20 && coherenceChecks.workforceVsOpRisk.proportion < 80 ? 'OK ✓' : 'Review ⚠️';
  }

  return {
    coherenceChecks,
    alerts,
  };
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

export function extractOrganizationalRisk(
  text: string,
  config: OrganizationalRiskConfig = DEFAULT_ORGANIZATIONAL_RISK_CONFIG
): OrganizationalRiskResult | null {
  const cfg: Required<OrganizationalRiskConfig> = { ...DEFAULT_ORGANIZATIONAL_RISK_CONFIG, ...config };
  if (cfg.verbose) ...');

  const yearlyData: OrganizationalRiskYearData[] = [];
  const yearsExtracted: number[] = [];

  for (let i = 1; i <= cfg.yearsToExtract; i++) {
    const year = cfg.currentYear - i;
    const yearLabel = getYearLabel(year, cfg.currentYear);

    // Extract each pillar
    const workforce = extractWorkforceRiskForYear(text, year, yearLabel, cfg);
    const equipment = extractEquipmentRiskForYear(text, year, yearLabel, cfg);
    const environment = extractEnvironmentRiskForYear(text, year, yearLabel, cfg);

    // At least one pillar must have data
    if (!workforce && !equipment && !environment) continue;

    // Create year entry with defaults for missing pillars
    const yearEntry: OrganizationalRiskYearData = {
      year,
      yearLabel,
      workforce: workforce || {
        year, yearLabel,
        fraudeInterne: 0, litigesSociaux: 0, accidentsTravail: 0,
        discriminationHarcelement: 0, coutAbsenteisme: 0, coutTurnover: 0,
        totalWorkforce: 0, confidence: 0, source: 'N/A',
      },
      equipment: equipment || {
        year, yearLabel,
        pannesSystemes: 0, cyberattaques: 0, maintenanceUrgence: 0,
        obsolescence: 0, defaillancesInfrastructure: 0,
        totalEquipment: 0, confidence: 0, source: 'N/A',
      },
      environment: environment || {
        year, yearLabel,
        catastrophesNaturelles: 0, amendesEnvironnementales: 0, sanctionsESG: 0,
        coutPandemie: 0, dommagesLocaux: 0, criseSanitaire: 0,
        totalEnvironment: 0, confidence: 0, source: 'N/A',
      },
      totalOrganisationnel: (workforce?.totalWorkforce || 0) + (equipment?.totalEquipment || 0) + (environment?.totalEnvironment || 0),
    };

    yearlyData.push(yearEntry);
    yearsExtracted.push(year);

    if (cfg.verbose) {
      if (workforce) }M`);
      if (equipment) }M`);
      if (environment) }M`);
    }
  }

  if (yearlyData.length === 0) {
    if (cfg.verbose) return null;
  }

  const summary5Year = calculate5YearSummary(yearlyData, cfg);
  const validation = cfg.enableValidation ? validateData(yearlyData, cfg) : {
    coherenceChecks: {
      workforceVsOpRisk: { workforceAmount: 0, opRiskTotal: 0, proportion: 0, status: 'Disabled' },
      temporalConsistency: [],
    },
    alerts: [],
  };

  const averageConfidence = yearlyData.reduce((sum, d) => {
    const conf = (d.workforce.confidence + d.equipment.confidence + d.environment.confidence) / 3;
    return sum + conf;
  }, 0) / yearlyData.length;

  if (cfg.verbose) {
    }M`);
    }M (${summary5Year.workforce.percentOfTotal.toFixed(1)}%)`);
    }M (${summary5Year.equipment.percentOfTotal.toFixed(1)}%)`);
    }M (${summary5Year.environment.percentOfTotal.toFixed(1)}%)`);
    }%)`);
    .toFixed(1)}%\n`);
  }

  return {
    yearlyData,
    summary5Year,
    yearsExtracted,
    confidence: averageConfidence,
    validation,
    documentType: detectDocumentType(text),
  };
}
