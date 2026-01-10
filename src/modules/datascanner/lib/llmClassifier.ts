// ============================================
// LLM CLASSIFIER - AI-powered business line classification
// Uses OpenAI/Anthropic for NACE & GICS classification
// ============================================

import { BusinessLine } from '../types';
import {
  BusinessLineClassification,
  ClassificationContext,
  LLMClassificationResponse,
  NACEClassification,
  GICSClassification
} from './classificationTypes';
import {
  detectSector,
  getSectorPrompt,
  SECTOR_NACE_MAPPING,
  SECTOR_GICS_MAPPING,
  SECTOR_PROMPTS
} from './sectorPrompts';

/**
 * LLM Provider configuration
 */
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',  // Cost-effective model
  temperature: 0.1,      // Low temperature for consistent classification
  maxTokens: 500
};

/**
 * Build classification prompt for LLM
 */
function buildClassificationPrompt(
  businessLine: BusinessLine,
  context?: ClassificationContext
): string {
  // Detect sector automatically
  const detectedSector = detectSector(businessLine.name);
  const sectorPrompt = detectedSector !== 'unknown'
    ? getSectorPrompt(detectedSector as keyof typeof SECTOR_PROMPTS)
    : 'You are an expert in business classification.';

  // Get relevant NACE codes for detected sector
  const naceHints = detectedSector !== 'unknown' && detectedSector in SECTOR_NACE_MAPPING
    ? SECTOR_NACE_MAPPING[detectedSector as keyof typeof SECTOR_NACE_MAPPING]
    : null;

  // Get relevant GICS codes for detected sector
  const gicsHints = detectedSector !== 'unknown' && detectedSector in SECTOR_GICS_MAPPING
    ? SECTOR_GICS_MAPPING[detectedSector as keyof typeof SECTOR_GICS_MAPPING]
    : null;

  const prompt = `${sectorPrompt}

**Business Line Information:**
- Name: "${businessLine.name}"
- Year: ${businessLine.year}
${businessLine.metrics.headcount ? `- Headcount: ${businessLine.metrics.headcount} employees` : ''}
${businessLine.metrics.revenue ? `- Revenue: ${businessLine.metrics.revenue.toLocaleString()} €` : ''}
${businessLine.metrics.expenses ? `- Expenses: ${businessLine.metrics.expenses.toLocaleString()} €` : ''}
${businessLine.metrics.budgetN1 ? `- Budget: ${businessLine.metrics.budgetN1.toLocaleString()} €` : ''}
${context?.companyName ? `\n**Company Context:**\n- Company: ${context.companyName}` : ''}
${context?.industry ? `- Industry: ${context.industry}` : ''}
${context?.country ? `- Country: ${context.country}` : ''}

${naceHints ? `**Relevant NACE Codes for this sector:**\n${Object.entries(naceHints.codes).map(([code, desc]) => `- ${code}: ${desc}`).join('\n')}` : ''}

${gicsHints ? `**Relevant GICS Codes for this sector:**\n${Object.entries(gicsHints.codes).map(([code, desc]) => `- ${code}: ${desc}`).join('\n')}` : ''}

**Task:**
Classify this business line according to:
1. NACE (European standard) - Provide the most specific 4-digit code
2. GICS (Global standard) - Provide the 8-digit sub-industry code
3. Sector type: banking, insurance, asset_management, or other
4. Tags: Provide 3-5 relevant tags (e.g., "retail", "corporate", "digital", "traditional")
5. Reasoning: Explain your classification in 1-2 sentences
6. Confidence: Rate your confidence from 0.0 to 1.0

**Output Format (JSON):**
{
  "naceCode": "K64.19",
  "naceName": "Other monetary intermediation",
  "gicsCode": "40101010",
  "gicsName": "Diversified Banks",
  "sector": "banking",
  "tags": ["retail", "deposits", "traditional"],
  "reasoning": "This is a retail banking unit focused on traditional deposit-taking and lending activities.",
  "confidence": 0.92
}

Respond ONLY with valid JSON.`;

  return prompt;
}

/**
 * Parse NACE code into structured format
 */
function parseNACECode(code: string, name: string): NACEClassification {
  const section = code.charAt(0);
  const division = code.substring(1, 3);
  const hasGroup = code.length >= 5;
  const group = hasGroup ? code.substring(0, 5) : undefined;

  // Section names (simplified mapping)
  const sectionNames: Record<string, string> = {
    'A': 'Agriculture, forestry and fishing',
    'B': 'Mining and quarrying',
    'C': 'Manufacturing',
    'D': 'Electricity, gas, steam and air conditioning supply',
    'E': 'Water supply; sewerage, waste management',
    'F': 'Construction',
    'G': 'Wholesale and retail trade',
    'H': 'Transportation and storage',
    'I': 'Accommodation and food service activities',
    'J': 'Information and communication',
    'K': 'Financial and insurance activities',
    'L': 'Real estate activities',
    'M': 'Professional, scientific and technical activities',
    'N': 'Administrative and support service activities',
    'O': 'Public administration and defence',
    'P': 'Education',
    'Q': 'Human health and social work activities',
    'R': 'Arts, entertainment and recreation',
    'S': 'Other service activities'
  };

  return {
    code,
    section,
    sectionName: sectionNames[section] || 'Unknown sector',
    division,
    divisionName: name.split(' - ')[0] || name,
    group,
    groupName: hasGroup ? name.split(' - ')[1] : undefined,
    className: name,
    confidence: 0.9
  };
}

/**
 * Parse GICS code into structured format
 */
function parseGICSCode(code: string, name: string): GICSClassification {
  const sector = code.substring(0, 2);
  const industryGroup = code.substring(0, 4);
  const industry = code.substring(0, 6);
  const subIndustry = code;

  // Sector names
  const sectorNames: Record<string, string> = {
    '10': 'Energy',
    '15': 'Materials',
    '20': 'Industrials',
    '25': 'Consumer Discretionary',
    '30': 'Consumer Staples',
    '35': 'Health Care',
    '40': 'Financials',
    '45': 'Information Technology',
    '50': 'Communication Services',
    '55': 'Utilities',
    '60': 'Real Estate'
  };

  return {
    code,
    sector,
    sectorName: sectorNames[sector] || 'Unknown',
    industryGroup,
    industryGroupName: name.split(' - ')[0] || name,
    industry,
    industryName: name.split(' - ')[1] || name,
    subIndustry,
    subIndustryName: name,
    confidence: 0.9
  };
}

/**
 * Call OpenAI API for classification
 */
async function callOpenAI(
  prompt: string,
  config: LLMConfig
): Promise<LLMClassificationResponse> {
  if (!config.apiKey) {
    return getMockClassification();
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business classifier. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature || 0.1,
        max_tokens: config.maxTokens || 500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return JSON.parse(content);
  } catch (error) {
    console.error('❌ OpenAI API call failed:', error);
    return getMockClassification();
  }
}

/**
 * Call Anthropic Claude API for classification
 */
async function callAnthropic(
  prompt: string,
  config: LLMConfig
): Promise<LLMClassificationResponse> {
  if (!config.apiKey) {
    return getMockClassification();
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-haiku-20240307',
        max_tokens: config.maxTokens || 500,
        temperature: config.temperature || 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('❌ Anthropic API call failed:', error);
    return getMockClassification();
  }
}

/**
 * Mock classification for testing/fallback
 */
function getMockClassification(): LLMClassificationResponse {
  return {
    naceCode: 'K64.19',
    naceName: 'Other monetary intermediation',
    gicsCode: '40101010',
    gicsName: 'Diversified Banks',
    sector: 'banking',
    tags: ['general', 'financial services'],
    reasoning: 'Mock classification used (no API key provided)',
    confidence: 0.5
  };
}

/**
 * Main classification function
 */
export async function classifyBusinessLine(
  businessLine: BusinessLine,
  context?: ClassificationContext,
  config: Partial<LLMConfig> = {}
): Promise<BusinessLineClassification> {
  const fullConfig: LLMConfig = { ...DEFAULT_CONFIG, ...config };

  // Build prompt
  const prompt = buildClassificationPrompt(businessLine, context);

  // Call LLM
  let llmResponse: LLMClassificationResponse;

  if (fullConfig.provider === 'openai') {
    llmResponse = await callOpenAI(prompt, fullConfig);
  } else if (fullConfig.provider === 'anthropic') {
    llmResponse = await callAnthropic(prompt, fullConfig);
  } else {
    llmResponse = getMockClassification();
  }

  // Parse and structure the result
  const nace = parseNACECode(llmResponse.naceCode, llmResponse.naceName);
  const gics = parseGICSCode(llmResponse.gicsCode, llmResponse.gicsName);

  const classification: BusinessLineClassification = {
    businessLineId: businessLine.id,
    businessLineName: businessLine.name,
    nace,
    gics,
    sector: llmResponse.sector as any,
    tags: llmResponse.tags,
    confidence: llmResponse.confidence,
    timestamp: new Date()
  };

  }`);
  .toFixed(1)}%`);
  return classification;
}

/**
 * Batch classify multiple business lines
 */
export async function classifyMultipleBusinessLines(
  businessLines: BusinessLine[],
  context?: ClassificationContext,
  config: Partial<LLMConfig> = {}
): Promise<BusinessLineClassification[]> {
  const results: BusinessLineClassification[] = [];

  for (const bl of businessLines) {
    const classification = await classifyBusinessLine(bl, context, config);
    results.push(classification);

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}
