// ============================================
// NER EXTRACTOR - Named Entity Recognition & Text Preprocessing
// ============================================
//
// Phase 2.4 Features:
// - Company name extraction
// - Address and location detection
// - Date and temporal entity extraction
// - Custom KPI/metric entity types
// - Context-aware extraction
// - Text preprocessing pipeline
// ============================================

import nlp from 'compromise';
import * as natural from 'natural';

/**
 * Named entity types
 */
export type EntityType =
  | 'COMPANY'
  | 'PERSON'
  | 'LOCATION'
  | 'DATE'
  | 'MONEY'
  | 'PERCENTAGE'
  | 'KPI'
  | 'METRIC'
  | 'DEPARTMENT'
  | 'PRODUCT';

/**
 * Extracted entity
 */
export interface NamedEntity {
  text: string;
  type: EntityType;
  confidence: number; // 0-1
  position: {
    start: number;
    end: number;
  };
  context?: string; // Surrounding text
  metadata?: Record<string, any>;
}

/**
 * NER extraction configuration
 */
export interface NERConfig {
  /** Extract company names */
  extractCompanies?: boolean;
  /** Extract person names */
  extractPersons?: boolean;
  /** Extract locations/addresses */
  extractLocations?: boolean;
  /** Extract dates */
  extractDates?: boolean;
  /** Extract monetary values */
  extractMoney?: boolean;
  /** Extract percentages */
  extractPercentages?: boolean;
  /** Extract KPI names */
  extractKPIs?: boolean;
  /** Extract metric names */
  extractMetrics?: boolean;
  /** Extract department names */
  extractDepartments?: boolean;
  /** Extract product names */
  extractProducts?: boolean;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Context window size (chars) */
  contextWindow?: number;
}

const DEFAULT_NER_CONFIG: NERConfig = {
  extractCompanies: true,
  extractPersons: true,
  extractLocations: true,
  extractDates: true,
  extractMoney: true,
  extractPercentages: true,
  extractKPIs: true,
  extractMetrics: true,
  extractDepartments: true,
  extractProducts: true,
  minConfidence: 0.6,
  contextWindow: 50
};

/**
 * Known KPI patterns (financial domain)
 */
const KPI_PATTERNS = [
  // Revenue metrics
  'revenue', 'turnover', 'sales', 'income', 'receipts',
  'chiffre d\'affaires', 'revenus', 'ventes', 'recettes',

  // Profit metrics
  'profit', 'margin', 'ebitda', 'ebit', 'net income', 'operating income',
  'résultat', 'bénéfice', 'marge', 'résultat opérationnel', 'résultat net',

  // Cost metrics
  'cost', 'expense', 'opex', 'capex', 'overhead',
  'coût', 'charge', 'dépense', 'frais',

  // HR metrics
  'headcount', 'fte', 'employees', 'workforce', 'staff',
  'effectif', 'personnel', 'employés', 'collaborateurs',

  // Performance metrics
  'roi', 'roa', 'roe', 'growth rate', 'market share',
  'taux de croissance', 'part de marché', 'rentabilité'
];

/**
 * Known department patterns
 */
const DEPARTMENT_PATTERNS = [
  'sales', 'marketing', 'finance', 'hr', 'human resources', 'it', 'operations',
  'r&d', 'research', 'development', 'legal', 'compliance', 'customer service',
  'ventes', 'commercial', 'marketing', 'comptabilité', 'finance', 'rh',
  'ressources humaines', 'informatique', 'opérations', 'juridique', 'service client'
];

/**
 * Extract company names using NLP
 */
function extractCompanyNames(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];
  const doc = nlp(text);

  // Use compromise's organization detection
  const orgs = doc.organizations().out('array');

  orgs.forEach((orgName: string) => {
    const position = text.indexOf(orgName);
    if (position !== -1) {
      entities.push({
        text: orgName,
        type: 'COMPANY',
        confidence: 0.85,
        position: {
          start: position,
          end: position + orgName.length
        },
        context: getContext(text, position, config.contextWindow || 50)
      });
    }
  });

  // Additional pattern matching for company suffixes
  const companyPatterns = [
    /\b([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Ltd|Corp|SA|SARL|SAS|AG|GmbH)\.?)\b/g,
    /\b([A-Z][a-zA-Z\s&]+ (?:International|Group|Holdings|Services|Solutions))\b/g
  ];

  companyPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[1],
        type: 'COMPANY',
        confidence: 0.75,
        position: {
          start: match.index,
          end: match.index + match[1].length
        },
        context: getContext(text, match.index, config.contextWindow || 50)
      });
    }
  });

  return deduplicateEntities(entities);
}

/**
 * Extract person names
 */
function extractPersonNames(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];
  const doc = nlp(text);

  const people = doc.people().out('array');

  people.forEach((personName: string) => {
    const position = text.indexOf(personName);
    if (position !== -1) {
      entities.push({
        text: personName,
        type: 'PERSON',
        confidence: 0.8,
        position: {
          start: position,
          end: position + personName.length
        },
        context: getContext(text, position, config.contextWindow || 50)
      });
    }
  });

  return entities;
}

/**
 * Extract locations and addresses
 */
function extractLocations(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];
  const doc = nlp(text);

  const places = doc.places().out('array');

  places.forEach((placeName: string) => {
    const position = text.indexOf(placeName);
    if (position !== -1) {
      entities.push({
        text: placeName,
        type: 'LOCATION',
        confidence: 0.85,
        position: {
          start: position,
          end: position + placeName.length
        },
        context: getContext(text, position, config.contextWindow || 50)
      });
    }
  });

  // Extract addresses with street numbers
  const addressPattern = /\b\d{1,5}\s+[A-Z][a-zA-Z\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|rue|avenue|boulevard)\b/gi;
  let match;

  while ((match = addressPattern.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: 'LOCATION',
      confidence: 0.9,
      position: {
        start: match.index,
        end: match.index + match[0].length
      },
      context: getContext(text, match.index, config.contextWindow || 50),
      metadata: { addressType: 'street' }
    });
  }

  return deduplicateEntities(entities);
}

/**
 * Extract dates and temporal entities
 */
function extractDates(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];
  const doc = nlp(text);

  const dates = doc.dates().out('array');

  dates.forEach((dateText: string) => {
    const position = text.indexOf(dateText);
    if (position !== -1) {
      entities.push({
        text: dateText,
        type: 'DATE',
        confidence: 0.9,
        position: {
          start: position,
          end: position + dateText.length
        },
        context: getContext(text, position, config.contextWindow || 50)
      });
    }
  });

  // Additional date patterns
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,   // MM-DD-YYYY
    /\b\d{4}-\d{2}-\d{2}\b/g,         // YYYY-MM-DD (ISO)
    /\b(?:Q[1-4]|FY)\s*\d{2,4}\b/gi   // Q1 2024, FY2024
  ];

  datePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'DATE',
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        context: getContext(text, match.index, config.contextWindow || 50)
      });
    }
  });

  return deduplicateEntities(entities);
}

/**
 * Extract monetary values
 */
function extractMoney(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];
  const doc = nlp(text);

  const money = doc.money().out('array');

  money.forEach((moneyText: string) => {
    const position = text.indexOf(moneyText);
    if (position !== -1) {
      entities.push({
        text: moneyText,
        type: 'MONEY',
        confidence: 0.95,
        position: {
          start: position,
          end: position + moneyText.length
        },
        context: getContext(text, position, config.contextWindow || 50)
      });
    }
  });

  // Additional currency patterns
  const currencyPattern = /(?:[€$£¥]|EUR|USD|GBP|JPY)\s*\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?(?:\s*(?:million|billion|thousand|M|B|K))?/gi;
  let match;

  while ((match = currencyPattern.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: 'MONEY',
      confidence: 0.9,
      position: {
        start: match.index,
        end: match.index + match[0].length
      },
      context: getContext(text, match.index, config.contextWindow || 50)
    });
  }

  return deduplicateEntities(entities);
}

/**
 * Extract percentages
 */
function extractPercentages(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];
  const doc = nlp(text);

  const percentages = doc.percentages().out('array');

  percentages.forEach((pctText: string) => {
    const position = text.indexOf(pctText);
    if (position !== -1) {
      entities.push({
        text: pctText,
        type: 'PERCENTAGE',
        confidence: 0.95,
        position: {
          start: position,
          end: position + pctText.length
        },
        context: getContext(text, position, config.contextWindow || 50)
      });
    }
  });

  // Additional percentage patterns
  const pctPattern = /\b\d+(?:\.\d+)?%\b/g;
  let match;

  while ((match = pctPattern.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: 'PERCENTAGE',
      confidence: 0.95,
      position: {
        start: match.index,
        end: match.index + match[0].length
      },
      context: getContext(text, match.index, config.contextWindow || 50)
    });
  }

  return deduplicateEntities(entities);
}

/**
 * Extract KPI mentions
 */
function extractKPIs(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];
  const lowerText = text.toLowerCase();

  KPI_PATTERNS.forEach(kpiPattern => {
    const pattern = new RegExp(`\\b${kpiPattern}\\b`, 'gi');
    let match;

    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'KPI',
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        context: getContext(text, match.index, config.contextWindow || 50),
        metadata: { category: categorizeKPI(kpiPattern) }
      });
    }
  });

  return deduplicateEntities(entities);
}

/**
 * Extract metric names (numeric KPIs with values)
 */
function extractMetrics(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];

  // Pattern: KPI name followed by value
  const metricPattern = /\b([A-Z]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:?\s*([€$£¥]?\s*\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?|\\d+(?:\.\d+)?%)\b/g;
  let match;

  while ((match = metricPattern.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: 'METRIC',
      confidence: 0.8,
      position: {
        start: match.index,
        end: match.index + match[0].length
      },
      context: getContext(text, match.index, config.contextWindow || 50),
      metadata: {
        metricName: match[1],
        metricValue: match[2]
      }
    });
  }

  return entities;
}

/**
 * Extract department names
 */
function extractDepartments(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];

  DEPARTMENT_PATTERNS.forEach(deptPattern => {
    const pattern = new RegExp(`\\b${deptPattern}(?:\\s+(?:department|dept|division|team))?\\b`, 'gi');
    let match;

    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'DEPARTMENT',
        confidence: 0.8,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        context: getContext(text, match.index, config.contextWindow || 50)
      });
    }
  });

  return deduplicateEntities(entities);
}

/**
 * Extract product names (capitalized multi-word terms)
 */
function extractProducts(text: string, config: NERConfig): NamedEntity[] {
  const entities: NamedEntity[] = [];

  // Pattern: Capitalized words that might be products
  const productPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  let match;

  while ((match = productPattern.exec(text)) !== null) {
    // Filter out common non-product phrases
    const notProduct = /^(?:The|This|That|These|Those|Our|Your|Their|Please|Thank)\b/;
    if (!notProduct.test(match[1])) {
      entities.push({
        text: match[1],
        type: 'PRODUCT',
        confidence: 0.65,
        position: {
          start: match.index,
          end: match.index + match[1].length
        },
        context: getContext(text, match.index, config.contextWindow || 50)
      });
    }
  }

  return entities;
}

/**
 * Get surrounding context for an entity
 */
function getContext(text: string, position: number, windowSize: number): string {
  const start = Math.max(0, position - windowSize);
  const end = Math.min(text.length, position + windowSize);
  return text.substring(start, end);
}

/**
 * Categorize KPI by type
 */
function categorizeKPI(kpiName: string): string {
  const lower = kpiName.toLowerCase();

  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('chiffre')) return 'revenue';
  if (lower.includes('profit') || lower.includes('margin') || lower.includes('résultat')) return 'profitability';
  if (lower.includes('cost') || lower.includes('expense') || lower.includes('coût')) return 'cost';
  if (lower.includes('headcount') || lower.includes('employee') || lower.includes('effectif')) return 'hr';
  if (lower.includes('roi') || lower.includes('growth') || lower.includes('market')) return 'performance';

  return 'general';
}

/**
 * Remove duplicate entities (same text + overlapping positions)
 */
function deduplicateEntities(entities: NamedEntity[]): NamedEntity[] {
  const unique: NamedEntity[] = [];
  const seen = new Set<string>();

  entities
    .sort((a, b) => b.confidence - a.confidence) // Higher confidence first
    .forEach(entity => {
      const key = `${entity.text}-${entity.position.start}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entity);
      }
    });

  return unique;
}

/**
 * Main NER extraction function
 */
export function extractEntities(
  text: string,
  config: Partial<NERConfig> = {}
): NamedEntity[] {
  const finalConfig: NERConfig = { ...DEFAULT_NER_CONFIG, ...config };
  const allEntities: NamedEntity[] = [];

  if (finalConfig.extractCompanies) {
    const companies = extractCompanyNames(text, finalConfig);
    allEntities.push(...companies);
    }

  if (finalConfig.extractPersons) {
    const persons = extractPersonNames(text, finalConfig);
    allEntities.push(...persons);
    }

  if (finalConfig.extractLocations) {
    const locations = extractLocations(text, finalConfig);
    allEntities.push(...locations);
    }

  if (finalConfig.extractDates) {
    const dates = extractDates(text, finalConfig);
    allEntities.push(...dates);
    }

  if (finalConfig.extractMoney) {
    const money = extractMoney(text, finalConfig);
    allEntities.push(...money);
    }

  if (finalConfig.extractPercentages) {
    const percentages = extractPercentages(text, finalConfig);
    allEntities.push(...percentages);
    }

  if (finalConfig.extractKPIs) {
    const kpis = extractKPIs(text, finalConfig);
    allEntities.push(...kpis);
    }

  if (finalConfig.extractMetrics) {
    const metrics = extractMetrics(text, finalConfig);
    allEntities.push(...metrics);
    }

  if (finalConfig.extractDepartments) {
    const departments = extractDepartments(text, finalConfig);
    allEntities.push(...departments);
    }

  if (finalConfig.extractProducts) {
    const products = extractProducts(text, finalConfig);
    allEntities.push(...products);
    }

  // Filter by confidence threshold
  const filtered = allEntities.filter(e => e.confidence >= (finalConfig.minConfidence || 0.6));

  `);

  return filtered.sort((a, b) => a.position.start - b.position.start);
}

/**
 * Text preprocessing utilities
 */
export const TextPreprocessor = {
  /**
   * Normalize whitespace
   */
  normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  },

  /**
   * Remove special characters (keeping alphanumeric + basic punctuation)
   */
  removeSpecialChars(text: string): string {
    return text.replace(/[^\w\s.,;:!?€$£¥%()-]/g, '');
  },

  /**
   * Tokenize text into sentences
   */
  tokenizeSentences(text: string): string[] {
    const tokenizer = new natural.SentenceTokenizer();
    return tokenizer.tokenize(text);
  },

  /**
   * Tokenize text into words
   */
  tokenizeWords(text: string): string[] {
    const tokenizer = new natural.WordTokenizer();
    return tokenizer.tokenize(text);
  },

  /**
   * Remove stop words (English + French)
   */
  removeStopWords(words: string[]): string[] {
    const stopWords = new Set([
      // English
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'can', 'could', 'may', 'might', 'must', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      // French
      'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais',
      'est', 'sont', 'a', 'ont', 'être', 'avoir', 'dans', 'sur', 'pour', 'par',
      'avec', 'sans', 'sous', 'vers', 'chez'
    ]);

    return words.filter(word => !stopWords.has(word.toLowerCase()));
  },

  /**
   * Stem words (Porter stemmer for English)
   */
  stemWords(words: string[]): string[] {
    return words.map(word => natural.PorterStemmer.stem(word));
  },

  /**
   * Full preprocessing pipeline
   */
  preprocess(text: string, options: {
    normalize?: boolean;
    removeSpecial?: boolean;
    tokenize?: boolean;
    removeStops?: boolean;
    stem?: boolean;
  } = {}): string | string[] {
    let result: any = text;

    if (options.normalize !== false) {
      result = TextPreprocessor.normalizeWhitespace(result);
    }

    if (options.removeSpecial) {
      result = TextPreprocessor.removeSpecialChars(result);
    }

    if (options.tokenize) {
      result = TextPreprocessor.tokenizeWords(result);
    }

    if (options.removeStops && Array.isArray(result)) {
      result = TextPreprocessor.removeStopWords(result);
    }

    if (options.stem && Array.isArray(result)) {
      result = TextPreprocessor.stemWords(result);
    }

    return result;
  }
};
