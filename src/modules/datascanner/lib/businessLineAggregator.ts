/**
 * Business Line Aggregator
 *
 * This module provides two-step business line analysis:
 *
 * STEP 1: Unlimited Detection
 * - Detects all business lines without any limit (no maxBusinessLines constraint)
 * - Uses all 4 scanning modes (Table, Transposed, Scattered, Proximity)
 * - Applies duplicate detection and validation
 *
 * STEP 2: Intelligent Aggregation into 8 Macro Categories
 * - Semantic clustering using NER and text similarity
 * - LLM-based classification for ambiguous cases
 * - Aggregates metrics (revenue, expenses, headcount) by category
 *
 * The 8 macro categories are:
 * 1. Manufacturing & Production
 * 2. Sales & Distribution
 * 3. Services & Consulting
 * 4. Technology & R&D
 * 5. Financial Services
 * 6. Administrative & Support
 * 7. Marketing & Communication
 * 8. Other Activities
 *
 * Phase: 2.5 (Business Line Aggregation)
 * Date: 2025-11-23
 * Skill: Elite SaaS Developer
 */

import { BusinessLine, ScanConfig, DEFAULT_SCAN_CONFIG } from './types';
import { extractEntities, NamedEntity } from './nerExtractor';
import { calculateStringSimilarity } from './stringSimilarity';
// ⚠️ TEMPORARILY DISABLED: llmClassifier causes "superclass is not a constructor" error (classifier.js:30)
// import { classifyMultipleBusinessLines, LLMConfig } from './llmClassifier';
// import { BusinessLineClassification } from './classificationTypes';
type LLMConfig = any; // Temporary type placeholder
type BusinessLineClassification = any; // Temporary type placeholder

/**
 * The 8 macro categories for business line aggregation
 */
export enum MacroCategory {
  MANUFACTURING_PRODUCTION = 'Manufacturing & Production',
  SALES_DISTRIBUTION = 'Sales & Distribution',
  SERVICES_CONSULTING = 'Services & Consulting',
  TECHNOLOGY_RND = 'Technology & R&D',
  FINANCIAL_SERVICES = 'Financial Services',
  ADMINISTRATIVE_SUPPORT = 'Administrative & Support',
  MARKETING_COMMUNICATION = 'Marketing & Communication',
  OTHER_ACTIVITIES = 'Other Activities'
}

/**
 * Configuration for business line aggregation
 */
export interface AggregationConfig {
  /**
   * Use LLM for ambiguous classifications
   * Default: true
   */
  useLLM?: boolean;

  /**
   * Minimum similarity threshold for clustering (0-1)
   * Default: 0.6
   */
  similarityThreshold?: number;

  /**
   * Use NER for semantic analysis
   * Default: true
   */
  useNER?: boolean;

  /**
   * Verbose logging
   * Default: false
   */
  verbose?: boolean;

  /**
   * LLM configuration (if useLLM is true)
   */
  llmConfig?: Partial<LLMConfig>;
}

/**
 * Aggregated business line category with metrics
 */
export interface AggregatedCategory {
  /**
   * Macro category name
   */
  category: MacroCategory;

  /**
   * Business lines in this category
   */
  businessLines: BusinessLine[];

  /**
   * Total revenue (sum of all lines)
   */
  totalRevenue: number;

  /**
   * Total expenses (sum of all lines)
   */
  totalExpenses: number;

  /**
   * Total headcount (sum of all lines)
   */
  totalHeadcount: number;

  /**
   * Percentage of total company revenue
   */
  revenuePercentage: number;

  /**
   * Confidence score for this category (0-100)
   */
  confidence: number;

  /**
   * Classification method used (rule-based, semantic, or llm)
   */
  classificationMethod: 'rule-based' | 'semantic' | 'llm';
}

/**
 * Result of business line aggregation
 */
export interface AggregationResult {
  /**
   * All detected business lines (unlimited)
   */
  allBusinessLines: BusinessLine[];

  /**
   * Aggregated categories (8 categories)
   */
  aggregatedCategories: AggregatedCategory[];

  /**
   * Total metrics across all categories
   */
  totals: {
    revenue: number;
    expenses: number;
    headcount: number;
  };

  /**
   * Statistics about the aggregation
   */
  stats: {
    totalBusinessLines: number;
    categoriesUsed: number;
    averageLinesPerCategory: number;
    averageConfidence: number;
  };
}

const DEFAULT_AGGREGATION_CONFIG: AggregationConfig = {
  useLLM: true,
  similarityThreshold: 0.6,
  useNER: true,
  verbose: false
};

/**
 * Rule-based category mapping keywords
 */
const CATEGORY_KEYWORDS: Record<MacroCategory, string[]> = {
  [MacroCategory.MANUFACTURING_PRODUCTION]: [
    'manufacturing', 'production', 'assembly', 'fabrication', 'factory',
    'fabrication', 'usine', 'production', 'assemblage', 'manufacture',
    'industrial', 'plant', 'processing', 'transformation',
    'metal', 'electronics', 'automotive', 'chemical', 'textile',
    'food processing', 'pharmaceuticals', 'machinery'
  ],
  [MacroCategory.SALES_DISTRIBUTION]: [
    'sales', 'distribution', 'wholesale', 'retail', 'commerce',
    'vente', 'distribution', 'commerce', 'négoce', 'détail',
    'trading', 'export', 'import', 'logistics', 'supply chain',
    'dealer', 'reseller', 'merchant', 'store', 'outlet'
  ],
  [MacroCategory.SERVICES_CONSULTING]: [
    'services', 'consulting', 'advisory', 'professional services',
    'conseil', 'services', 'prestation', 'expertise',
    'consulting', 'audit', 'legal', 'accounting', 'tax',
    'engineering services', 'design', 'architecture', 'project management'
  ],
  [MacroCategory.TECHNOLOGY_RND]: [
    'technology', 'r&d', 'research', 'development', 'innovation',
    'technologie', 'recherche', 'développement', 'innovation', 'r&d',
    'software', 'it', 'digital', 'tech', 'engineering',
    'laboratory', 'product development', 'prototyping', 'testing'
  ],
  [MacroCategory.FINANCIAL_SERVICES]: [
    'financial', 'banking', 'insurance', 'investment', 'finance',
    'financier', 'banque', 'assurance', 'investissement', 'finance',
    'credit', 'loan', 'asset management', 'wealth management',
    'trading', 'securities', 'fund', 'treasury', 'fintech'
  ],
  [MacroCategory.ADMINISTRATIVE_SUPPORT]: [
    'administrative', 'support', 'back office', 'operations',
    'administratif', 'support', 'opérations', 'services généraux',
    'hr', 'human resources', 'facilities', 'maintenance',
    'procurement', 'purchasing', 'administration', 'compliance',
    'legal department', 'internal audit', 'quality assurance'
  ],
  [MacroCategory.MARKETING_COMMUNICATION]: [
    'marketing', 'communication', 'advertising', 'promotion', 'branding',
    'marketing', 'communication', 'publicité', 'promotion', 'marque',
    'digital marketing', 'social media', 'pr', 'public relations',
    'content', 'campaign', 'events', 'sponsorship', 'brand management'
  ],
  [MacroCategory.OTHER_ACTIVITIES]: [
    'other', 'miscellaneous', 'various', 'diverse',
    'autre', 'divers', 'autres activités'
  ]
};

/**
 * Classify a business line into a macro category using rule-based approach
 */
function classifyByRules(businessLine: BusinessLine): {
  category: MacroCategory;
  confidence: number;
} {
  const text = `${businessLine.name} ${businessLine.description || ''}`.toLowerCase();

  let bestCategory = MacroCategory.OTHER_ACTIVITIES;
  let maxScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        // Weight longer keywords higher (more specific)
        score += keyword.split(' ').length;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as MacroCategory;
    }
  }

  // Confidence based on number of matching keywords
  const confidence = Math.min(100, maxScore * 20 + 40);

  return { category: bestCategory, confidence };
}

/**
 * Classify a business line using NER semantic analysis
 */
function classifyBySemantic(
  businessLine: BusinessLine,
  entities: NamedEntity[]
): {
  category: MacroCategory;
  confidence: number;
} {
  // Filter entities related to this business line
  const lineText = `${businessLine.name} ${businessLine.description || ''}`.toLowerCase();

  // Look for specific entity types that indicate category
  const departments = entities.filter(e => e.type === 'DEPARTMENT');
  const kpis = entities.filter(e => e.type === 'KPI');
  const products = entities.filter(e => e.type === 'PRODUCT');

  // Manufacturing indicators: production KPIs, manufacturing departments
  const manufacturingSignals = [
    departments.some(d => /production|manufacturing|assembly|factory/i.test(d.text)),
    kpis.some(k => /output|yield|capacity|throughput/i.test(k.text)),
    products.some(p => /equipment|machinery|component/i.test(p.text))
  ].filter(Boolean).length;

  // Sales indicators: sales departments, revenue KPIs
  const salesSignals = [
    departments.some(d => /sales|commercial|distribution/i.test(d.text)),
    kpis.some(k => /revenue|sales|volume|market share/i.test(k.text))
  ].filter(Boolean).length;

  // Technology indicators: R&D departments, innovation KPIs
  const technologySignals = [
    departments.some(d => /r&d|research|development|engineering|innovation/i.test(d.text)),
    kpis.some(k => /patent|innovation|development|research/i.test(k.text))
  ].filter(Boolean).length;

  // Marketing indicators: marketing departments, brand KPIs
  const marketingSignals = [
    departments.some(d => /marketing|communication|advertising|pr/i.test(d.text)),
    kpis.some(k => /brand|awareness|engagement|campaign/i.test(k.text))
  ].filter(Boolean).length;

  // Determine category by strongest signal
  const signals = [
    { category: MacroCategory.MANUFACTURING_PRODUCTION, score: manufacturingSignals },
    { category: MacroCategory.SALES_DISTRIBUTION, score: salesSignals },
    { category: MacroCategory.TECHNOLOGY_RND, score: technologySignals },
    { category: MacroCategory.MARKETING_COMMUNICATION, score: marketingSignals }
  ];

  const best = signals.reduce((prev, curr) => curr.score > prev.score ? curr : prev);

  if (best.score > 0) {
    return {
      category: best.category,
      confidence: Math.min(100, best.score * 30 + 50)
    };
  }

  // Fallback to rule-based
  return classifyByRules(businessLine);
}

/**
 * Classify business lines using LLM (for ambiguous cases)
 */
async function classifyByLLM(
  businessLines: BusinessLine[],
  llmConfig: Partial<LLMConfig>
): Promise<Map<string, { category: MacroCategory; confidence: number }>> {
  const result = new Map<string, { category: MacroCategory; confidence: number }>();

  // Use existing LLM classifier to get sector classifications
  const classifications = await classifyMultipleBusinessLines(
    businessLines,
    {}, // Empty context
    llmConfig
  );

  // Map NACE/GICS sectors to macro categories
  for (const classification of classifications) {
    const businessLineName = classification.businessLineName;
    let category = MacroCategory.OTHER_ACTIVITIES;
    let confidence = classification.confidence;

    // Map by NACE section
    if (classification.naceCode) {
      const naceSection = classification.naceCode.charAt(0);

      switch (naceSection) {
        case 'C': // Manufacturing
          category = MacroCategory.MANUFACTURING_PRODUCTION;
          break;
        case 'G': // Wholesale and retail trade
          category = MacroCategory.SALES_DISTRIBUTION;
          break;
        case 'J': // Information and communication
        case 'M': // Professional, scientific and technical activities (includes R&D)
          category = MacroCategory.TECHNOLOGY_RND;
          break;
        case 'K': // Financial and insurance activities
          category = MacroCategory.FINANCIAL_SERVICES;
          break;
        case 'N': // Administrative and support service activities
          category = MacroCategory.ADMINISTRATIVE_SUPPORT;
          break;
        case 'I': // Accommodation and food service
        case 'H': // Transportation and storage
          category = MacroCategory.SERVICES_CONSULTING;
          break;
        default:
          category = MacroCategory.OTHER_ACTIVITIES;
      }
    }

    result.set(businessLineName, { category, confidence });
  }

  return result;
}

/**
 * Aggregate business lines into 8 macro categories
 *
 * This is the main function that performs two-step analysis:
 * 1. Unlimited detection (input: all business lines)
 * 2. Intelligent grouping into 8 categories
 */
export async function aggregateBusinessLines(
  businessLines: BusinessLine[],
  config: AggregationConfig = DEFAULT_AGGREGATION_CONFIG,
  entities?: NamedEntity[]
): Promise<AggregationResult> {
  const finalConfig = { ...DEFAULT_AGGREGATION_CONFIG, ...config };

  if (finalConfig.verbose) {
    }

  // Initialize 8 categories
  const categories: Map<MacroCategory, BusinessLine[]> = new Map();
  Object.values(MacroCategory).forEach(cat => categories.set(cat, []));

  const confidenceMap: Map<string, number> = new Map();
  const methodMap: Map<string, 'rule-based' | 'semantic' | 'llm'> = new Map();

  // Step 1: Try rule-based classification first (fast)
  const needsLLM: BusinessLine[] = [];

  for (const line of businessLines) {
    let classification: { category: MacroCategory; confidence: number };
    let method: 'rule-based' | 'semantic' | 'llm' = 'rule-based';

    // Try rule-based first
    classification = classifyByRules(line);

    // If low confidence and NER available, try semantic
    if (classification.confidence < 70 && finalConfig.useNER && entities) {
      const semanticClassification = classifyBySemantic(line, entities);
      if (semanticClassification.confidence > classification.confidence) {
        classification = semanticClassification;
        method = 'semantic';
      }
    }

    // If still low confidence, mark for LLM
    if (classification.confidence < 60 && finalConfig.useLLM) {
      needsLLM.push(line);
    } else {
      categories.get(classification.category)!.push(line);
      confidenceMap.set(line.name, classification.confidence);
      methodMap.set(line.name, method);
    }
  }

  // Step 2: Use LLM for ambiguous cases
  // ⚠️ TEMPORARILY DISABLED: classifyByLLM causes "superclass is not a constructor" error
  if (needsLLM.length > 0 && finalConfig.useLLM && finalConfig.llmConfig) {
    if (finalConfig.verbose) {
      }

    // Use rule-based fallback for all ambiguous cases
    for (const line of needsLLM) {
      const fallback = classifyByRules(line);
      categories.get(fallback.category)!.push(line);
      confidenceMap.set(line.name, fallback.confidence);
      methodMap.set(line.name, 'rule-based');
    }

    /* DISABLED CODE:
    const llmClassifications = await classifyByLLM(needsLLM, finalConfig.llmConfig);

    for (const line of needsLLM) {
      const llmResult = llmClassifications.get(line.name);
      if (llmResult) {
        categories.get(llmResult.category)!.push(line);
        confidenceMap.set(line.name, llmResult.confidence);
        methodMap.set(line.name, 'llm');
      } else {
        // Fallback to rule-based if LLM fails
        const fallback = classifyByRules(line);
        categories.get(fallback.category)!.push(line);
        confidenceMap.set(line.name, fallback.confidence);
        methodMap.set(line.name, 'rule-based');
      }
    }
    */
  }

  // Step 3: Calculate aggregated metrics
  const aggregatedCategories: AggregatedCategory[] = [];
  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalHeadcount = 0;

  // First pass: calculate totals
  for (const lines of categories.values()) {
    for (const line of lines) {
      totalRevenue += line.metrics?.totalRevenue || 0;
      totalExpenses += line.metrics?.totalExpenses || 0;
      totalHeadcount += line.metrics?.totalHeadcount || 0;
    }
  }

  // Second pass: create aggregated categories
  for (const [category, lines] of categories.entries()) {
    if (lines.length === 0) continue;

    const categoryRevenue = lines.reduce((sum, line) =>
      sum + (line.metrics?.totalRevenue || 0), 0);
    const categoryExpenses = lines.reduce((sum, line) =>
      sum + (line.metrics?.totalExpenses || 0), 0);
    const categoryHeadcount = lines.reduce((sum, line) =>
      sum + (line.metrics?.totalHeadcount || 0), 0);

    const avgConfidence = lines.reduce((sum, line) =>
      sum + (confidenceMap.get(line.name) || 50), 0) / lines.length;

    // Determine most common classification method
    const methods = lines.map(line => methodMap.get(line.name) || 'rule-based');
    const methodCounts = methods.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const classificationMethod = Object.entries(methodCounts)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0] as 'rule-based' | 'semantic' | 'llm';

    aggregatedCategories.push({
      category,
      businessLines: lines,
      totalRevenue: categoryRevenue,
      totalExpenses: categoryExpenses,
      totalHeadcount: categoryHeadcount,
      revenuePercentage: totalRevenue > 0 ? (categoryRevenue / totalRevenue) * 100 : 0,
      confidence: avgConfidence,
      classificationMethod
    });
  }

  // Sort by revenue (largest first)
  aggregatedCategories.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const stats = {
    totalBusinessLines: businessLines.length,
    categoriesUsed: aggregatedCategories.length,
    averageLinesPerCategory: aggregatedCategories.length > 0
      ? businessLines.length / aggregatedCategories.length
      : 0,
    averageConfidence: aggregatedCategories.reduce((sum, cat) =>
      sum + cat.confidence, 0) / (aggregatedCategories.length || 1)
  };

  if (finalConfig.verbose) {
    } avg lines/category`);
    }% avg confidence`);
  }

  return {
    allBusinessLines: businessLines,
    aggregatedCategories,
    totals: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      headcount: totalHeadcount
    },
    stats
  };
}

/**
 * Helper function to format aggregation result as a summary table
 */
export function formatAggregationSummary(result: AggregationResult): string {
  const lines: string[] = [];

  lines.push('\n📊 BUSINESS LINE AGGREGATION SUMMARY');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`Total Business Lines Detected: ${result.stats.totalBusinessLines}`);
  lines.push(`Categories Used: ${result.stats.categoriesUsed} / 8`);
  lines.push(`Average Lines per Category: ${result.stats.averageLinesPerCategory.toFixed(1)}`);
  lines.push(`Average Classification Confidence: ${result.stats.averageConfidence.toFixed(1)}%`);
  lines.push('');

  lines.push('MACRO CATEGORIES BREAKDOWN:');
  lines.push('───────────────────────────────────────────────────────────────');

  for (const cat of result.aggregatedCategories) {
    const revenueFormatted = cat.totalRevenue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    });

    lines.push(`\n📁 ${cat.category}`);
    lines.push(`   Lines: ${cat.businessLines.length}`);
    lines.push(`   Revenue: ${revenueFormatted} (${cat.revenuePercentage.toFixed(1)}%)`);
    lines.push(`   Expenses: ${cat.totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
    lines.push(`   Headcount: ${cat.totalHeadcount}`);
    lines.push(`   Confidence: ${cat.confidence.toFixed(1)}%`);
    lines.push(`   Method: ${cat.classificationMethod}`);

    if (cat.businessLines.length <= 5) {
      lines.push(`   Business Lines:`);
      cat.businessLines.forEach(line => {
        lines.push(`      • ${line.name}`);
      });
    } else {
      lines.push(`   Business Lines: ${cat.businessLines.slice(0, 3).map(l => l.name).join(', ')}, ... (${cat.businessLines.length - 3} more)`);
    }
  }

  lines.push('\n═══════════════════════════════════════════════════════════════');
  lines.push(`TOTALS:`);
  lines.push(`   Revenue: ${result.totals.revenue.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
  lines.push(`   Expenses: ${result.totals.expenses.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}`);
  lines.push(`   Headcount: ${result.totals.headcount}`);
  lines.push('');

  return lines.join('\n');
}
