// ============================================
// CLASSIFICATION TYPES - NACE & GICS Standards
// ============================================

/**
 * NACE (Nomenclature statistique des activités économiques dans la Communauté européenne)
 * European standard for economic activity classification
 *
 * Structure:
 * - Section: 1 letter (A-U)
 * - Division: 2 digits (01-99)
 * - Group: 3 digits
 * - Class: 4 digits
 *
 * Example: K64.19 - "Monetary intermediation - Other"
 */
export interface NACEClassification {
  code: string;           // e.g., "K64.19"
  section: string;        // e.g., "K"
  sectionName: string;    // e.g., "Financial and insurance activities"
  division: string;       // e.g., "64"
  divisionName: string;   // e.g., "Financial service activities, except insurance and pension funding"
  group?: string;         // e.g., "64.1"
  groupName?: string;     // e.g., "Monetary intermediation"
  className: string;      // e.g., "Other monetary intermediation"
  confidence: number;     // 0-1
}

/**
 * GICS (Global Industry Classification Standard)
 * Global standard developed by MSCI and S&P
 *
 * Structure:
 * - Sector: 2 digits (10-60)
 * - Industry Group: 4 digits
 * - Industry: 6 digits
 * - Sub-Industry: 8 digits
 *
 * Example: 40101010 - "Diversified Banks"
 */
export interface GICSClassification {
  code: string;              // e.g., "40101010"
  sector: string;            // e.g., "40"
  sectorName: string;        // e.g., "Financials"
  industryGroup: string;     // e.g., "4010"
  industryGroupName: string; // e.g., "Banks"
  industry: string;          // e.g., "401010"
  industryName: string;      // e.g., "Diversified Banks"
  subIndustry: string;       // e.g., "40101010"
  subIndustryName: string;   // e.g., "Diversified Banks"
  confidence: number;        // 0-1
}

/**
 * Combined classification result for a business line
 */
export interface BusinessLineClassification {
  businessLineId: string;
  businessLineName: string;
  nace?: NACEClassification;
  gics?: GICSClassification;
  sector: 'banking' | 'insurance' | 'asset_management' | 'other' | 'unknown';
  tags: string[];  // Additional tags: ["retail", "corporate", "trading", etc.]
  confidence: number;  // Overall classification confidence
  timestamp: Date;
}

/**
 * Classification context for better accuracy
 */
export interface ClassificationContext {
  companyName?: string;
  industry?: string;
  country?: string;
  metrics?: {
    revenue?: number;
    headcount?: number;
    assets?: number;
  };
}

/**
 * LLM Prompt response structure
 */
export interface LLMClassificationResponse {
  naceCode: string;
  naceName: string;
  gicsCode: string;
  gicsName: string;
  sector: string;
  tags: string[];
  reasoning: string;  // LLM explanation
  confidence: number;
}
