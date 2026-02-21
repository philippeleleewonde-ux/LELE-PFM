/**
 * Validation utilities for engine calculations
 */

import {
  TransactionType,
  RiskCategory,
  WaterfallAllocation,
  FlexibilityScores,
} from '../engine/types';
import { validateAllocationSum } from './math-utils';

/**
 * Validate waterfall conformity
 */
export function validateWaterfallConformity(
  p1_pct: number,
  p2_pct: number,
  p3_pct: number,
  p4_pct: number,
  totalEPR: number
): { valid: boolean; message: string; errors: string[] } {
  const errors: string[] = [];
  const tolerance = 0.01;

  if (p1_pct < 0) errors.push('P1 (Urgence) percentage cannot be negative');
  if (p2_pct < 0) errors.push('P2 (Dette) percentage cannot be negative');
  if (p3_pct < 0) errors.push('P3 (Investissement) percentage cannot be negative');
  if (p4_pct < 0) errors.push('P4 (Plaisir) percentage cannot be negative');

  const sum = p1_pct + p2_pct + p3_pct + p4_pct;
  if (Math.abs(sum - 100) > tolerance) {
    errors.push(
      `Sum of percentages (${sum.toFixed(2)}%) must equal 100% ± ${tolerance}%`
    );
  }

  if (!Number.isInteger(totalEPR) || totalEPR < 0) {
    errors.push('Total EPR must be a non-negative integer (cents)');
  }

  return {
    valid: errors.length === 0,
    message:
      errors.length === 0
        ? 'Waterfall allocation is valid'
        : `Waterfall validation failed: ${errors.length} error(s)`,
    errors,
  };
}

/**
 * Validate transaction type
 */
export function validateTransactionType(type: string): type is TransactionType {
  const validTypes: TransactionType[] = [
    'Fixe',
    'Variable',
    'Imprévue',
    'Épargne-Dette',
  ];
  return validTypes.includes(type as TransactionType);
}

/**
 * Get all valid transaction types
 */
export function getValidTransactionTypes(): TransactionType[] {
  return ['Fixe', 'Variable', 'Imprévue', 'Épargne-Dette'];
}

/**
 * Validate COICOP code
 */
export function validateCOICOPCode(code: string): boolean {
  const validCodes = ['01', '02', '03', '04', '05', '06', '07', '08'];
  return validCodes.includes(code);
}

/**
 * Get all valid COICOP codes
 */
export function getValidCOICOPCodes(): string[] {
  return ['01', '02', '03', '04', '05', '06', '07', '08'];
}

/**
 * Get COICOP category name
 */
export function getCOICOPCategoryName(code: string): string {
  const categories: Record<string, string> = {
    '01': 'Food and non-alcoholic beverages',
    '02': 'Alcoholic beverages and tobacco',
    '03': 'Clothing and footwear',
    '04': 'Housing, water, electricity, gas',
    '05': 'Furnishings and household equipment',
    '06': 'Health',
    '07': 'Transport',
    '08': 'Communication',
  };
  return categories[code] || 'Unknown';
}

/**
 * Validate flexibility parameters
 */
export function validateFlexibilityParams(
  f1: number,
  f2: number,
  f3: number
): { valid: boolean; message: string; errors: string[] } {
  const errors: string[] = [];

  if (f1 < 0 || f1 > 21) {
    errors.push(`F1 must be 0-21, got ${f1}`);
  }
  if (f2 < 0 || f2 > 21) {
    errors.push(`F2 must be 0-21, got ${f2}`);
  }
  if (f3 < 0 || f3 > 21) {
    errors.push(`F3 must be 0-21, got ${f3}`);
  }

  return {
    valid: errors.length === 0,
    message:
      errors.length === 0
        ? 'Flexibility parameters are valid'
        : `Flexibility validation failed: ${errors.length} error(s)`,
    errors,
  };
}

/**
 * Validate flexibility score
 */
export function validateFlexibilityScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 100;
}

/**
 * Validate score range
 */
export function validateScoreRange(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

/**
 * Validate EKH score
 */
export function validateEKHScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

/**
 * Validate component scores
 */
export function validateComponentScore(score: number): boolean {
  return Number.isFinite(score) && score >= 1 && score <= 5;
}

/**
 * Validate risk category
 */
export function validateRiskCategory(category: string): category is RiskCategory {
  const validCategories: RiskCategory[] = [
    'emploi',
    'santé',
    'résidentiel',
    'familial',
    'endettement',
    'inflation',
  ];
  return validCategories.includes(category as RiskCategory);
}

/**
 * Get all valid risk categories
 */
export function getValidRiskCategories(): RiskCategory[] {
  return [
    'emploi',
    'santé',
    'résidentiel',
    'familial',
    'endettement',
    'inflation',
  ];
}

/**
 * Validate percentage
 */
export function validatePercentage(
  value: number,
  fieldName: string = 'Value'
): { valid: boolean; message: string } {
  if (!Number.isFinite(value)) {
    return { valid: false, message: `${fieldName} must be a finite number` };
  }
  if (value < 0 || value > 100) {
    return { valid: false, message: `${fieldName} must be 0-100, got ${value}` };
  }
  return { valid: true, message: 'Valid percentage' };
}

/**
 * Validate cents value
 */
export function validateCents(
  value: number,
  fieldName: string = 'Value'
): { valid: boolean; message: string } {
  if (!Number.isInteger(value)) {
    return { valid: false, message: `${fieldName} must be an integer, got ${value}` };
  }
  if (value < 0) {
    return { valid: false, message: `${fieldName} must be non-negative, got ${value}` };
  }
  return { valid: true, message: 'Valid cents value' };
}

/**
 * Validate date
 */
export function validateDate(
  date: Date,
  minDate?: Date,
  maxDate?: Date
): { valid: boolean; message: string } {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date' };
  }

  if (minDate && date < minDate) {
    return { valid: false, message: `Date must be after ${minDate.toISOString()}` };
  }

  if (maxDate && date > maxDate) {
    return { valid: false, message: `Date must be before ${maxDate.toISOString()}` };
  }

  return { valid: true, message: 'Valid date' };
}

/**
 * Validate waterfall allocation
 */
export function validateWaterfallAllocation(
  allocation: Partial<WaterfallAllocation>
): { valid: boolean; message: string; errors: string[] } {
  const errors: string[] = [];

  if (
    allocation.p1_pct === undefined ||
    allocation.p2_pct === undefined ||
    allocation.p3_pct === undefined ||
    allocation.p4_pct === undefined
  ) {
    errors.push('All P1-P4 percentages must be defined');
  } else {
    const pctValidation = validateWaterfallConformity(
      allocation.p1_pct,
      allocation.p2_pct,
      allocation.p3_pct,
      allocation.p4_pct,
      0
    );
    if (!pctValidation.valid) {
      errors.push(...pctValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    message:
      errors.length === 0
        ? 'Waterfall allocation is valid'
        : `Validation failed: ${errors.length} error(s)`,
    errors,
  };
}

/**
 * Validate flexibility scores
 */
export function validateFlexibilityScores(
  scores: Partial<FlexibilityScores>
): { valid: boolean; message: string; errors: string[] } {
  const errors: string[] = [];

  if (scores.f1 !== undefined) {
    if (scores.f1 < 0 || scores.f1 > 21) {
      errors.push(`F1 must be 0-21, got ${scores.f1}`);
    }
  }

  if (scores.f2 !== undefined) {
    if (scores.f2 < 0 || scores.f2 > 21) {
      errors.push(`F2 must be 0-21, got ${scores.f2}`);
    }
  }

  if (scores.f3 !== undefined) {
    if (scores.f3 < 0 || scores.f3 > 21) {
      errors.push(`F3 must be 0-21, got ${scores.f3}`);
    }
  }

  return {
    valid: errors.length === 0,
    message:
      errors.length === 0
        ? 'Flexibility scores are valid'
        : `Validation failed: ${errors.length} error(s)`,
    errors,
  };
}

/**
 * Validate month number
 */
export function validateVentilationMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 36;
}

/**
 * Validate horizon
 */
export function validateHorizon(horizon: number): boolean {
  return Number.isInteger(horizon) && horizon > 0;
}

/**
 * Validate profile type
 */
export function validateProfileType(profileType: string): boolean {
  const validTypes = ['Salarié', 'Freelance', 'Entrepreneur', 'Retraité'];
  return validTypes.includes(profileType);
}

/**
 * Validate risk tolerance
 */
export function validateRiskTolerance(tolerance: string): boolean {
  const validTolerances = ['Conservative', 'Modéré', 'Agressif'];
  return validTolerances.includes(tolerance);
}

/**
 * Comprehensive validation of entire engine input
 */
export function validateEngineInput(input: any): {
  valid: boolean;
  message: string;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(input.revenues)) {
    errors.push('revenues must be an array');
  }
  if (!Array.isArray(input.expenses)) {
    errors.push('expenses must be an array');
  }
  if (!Array.isArray(input.financialHistory)) {
    errors.push('financialHistory must be an array');
  }
  if (!Array.isArray(input.commitments)) {
    errors.push('commitments must be an array');
  }
  if (!input.riskAssessment || typeof input.riskAssessment !== 'object') {
    errors.push('riskAssessment must be an object');
  }
  if (!input.ekhScore || typeof input.ekhScore !== 'object') {
    errors.push('ekhScore must be an object');
  }
  if (!Array.isArray(input.levers)) {
    errors.push('levers must be an array');
  }
  if (!input.profile || typeof input.profile !== 'object') {
    errors.push('profile must be an object');
  }

  if (input.ekhScore) {
    if (!validateEKHScore(input.ekhScore.score)) {
      errors.push('ekhScore.score must be 0-10');
    }
  }

  if (input.profile) {
    if (!validateProfileType(input.profile.type)) {
      errors.push('profile.type must be one of: Salarié, Freelance, Entrepreneur, Retraité');
    }
    if (!validateRiskTolerance(input.profile.risk_tolerance)) {
      errors.push('profile.risk_tolerance must be one of: Conservative, Modéré, Agressif');
    }
  }

  return {
    valid: errors.length === 0,
    message:
      errors.length === 0
        ? 'Engine input is valid'
        : `Validation failed: ${errors.length} error(s)`,
    errors,
  };
}
