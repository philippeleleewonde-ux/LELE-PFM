/**
 * Module 1 - Form Validation Utilities
 *
 * Provides validation functions for Module 1 forms with user-friendly error messages
 */

import { CompanyInfo, BusinessLine, RiskData, QualitativeAssessment, SocioeconomicImprovement } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate Company Information (Page 1)
 */
export function validateCompanyInfo(data: CompanyInfo): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.companyName || data.companyName.trim().length === 0) {
    errors.push({ field: 'companyName', message: 'Company name is required' });
  } else if (data.companyName.trim().length < 2) {
    errors.push({ field: 'companyName', message: 'Company name must be at least 2 characters' });
  }

  if (!data.sector || data.sector.trim().length === 0) {
    errors.push({ field: 'sector', message: 'Sector is required' });
  }

  if (data.totalEmployees === undefined || data.totalEmployees === null || data.totalEmployees <= 0) {
    errors.push({ field: 'totalEmployees', message: 'Total employees must be greater than 0' });
  } else if (data.totalEmployees > 1000000) {
    errors.push({ field: 'totalEmployees', message: 'Total employees seems unreasonably high' });
  }

  if (data.annualRevenue !== undefined && data.annualRevenue !== null && data.annualRevenue < 0) {
    errors.push({ field: 'annualRevenue', message: 'Annual revenue cannot be negative' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Business Line
 */
export function validateBusinessLine(line: BusinessLine): ValidationResult {
  const errors: ValidationError[] = [];

  if (!line.name || line.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Business line name is required' });
  }

  if (line.revenue !== undefined && line.revenue !== null && line.revenue < 0) {
    errors.push({ field: 'revenue', message: 'Revenue cannot be negative' });
  }

  if (line.employees !== undefined && line.employees !== null && line.employees < 0) {
    errors.push({ field: 'employees', message: 'Employees cannot be negative' });
  }

  if (line.employeeCosts !== undefined && line.employeeCosts !== null && line.employeeCosts < 0) {
    errors.push({ field: 'employeeCosts', message: 'Employee costs cannot be negative' });
  }

  if (line.nonEmployeeCosts !== undefined && line.nonEmployeeCosts !== null && line.nonEmployeeCosts < 0) {
    errors.push({ field: 'nonEmployeeCosts', message: 'Non-employee costs cannot be negative' });
  }

  // Logical validation: costs shouldn't exceed revenue significantly
  const totalCosts = (line.employeeCosts || 0) + (line.nonEmployeeCosts || 0);
  if (line.revenue && totalCosts > line.revenue * 3) {
    errors.push({
      field: 'costs',
      message: 'Total costs are unusually high compared to revenue. Please verify.'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Risk Data
 */
export function validateRiskData(data: RiskData): ValidationResult {
  const errors: ValidationError[] = [];

  if (data.totalUL !== undefined && data.totalUL !== null && data.totalUL < 0) {
    errors.push({ field: 'totalUL', message: 'Total UL cannot be negative' });
  }

  if (!data.yearsOfCollection || data.yearsOfCollection <= 0) {
    errors.push({ field: 'yearsOfCollection', message: 'Years of collection must be at least 1' });
  } else if (data.yearsOfCollection > 20) {
    errors.push({ field: 'yearsOfCollection', message: 'Years of collection should not exceed 20' });
  }

  // Validate risk categories
  const riskCategories = [
    { key: 'operationalRisk', name: 'Operational Risk' },
    { key: 'creditRisk', name: 'Credit Risk' },
    { key: 'marketRisk', name: 'Market Risk' },
    { key: 'liquidityRisk', name: 'Liquidity Risk' },
    { key: 'reputationalRisk', name: 'Reputational Risk' },
    { key: 'strategicRisk', name: 'Strategic Risk' }
  ] as const;

  riskCategories.forEach(({ key, name }) => {
    const value = data.riskCategories[key];
    if (value !== undefined && value !== null && value < 0) {
      errors.push({ field: key, message: `${name} cannot be negative` });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Qualitative Assessment
 */
export function validateQualitativeAssessment(data: QualitativeAssessment): ValidationResult {
  const errors: ValidationError[] = [];

  // For qualitative assessments, we just check that values are within valid range
  const fields = [
    { key: 'operationalRiskIncidents', name: 'Operational Risk' },
    { key: 'creditRiskAssessment', name: 'Credit Risk' },
    { key: 'marketVolatility', name: 'Market Volatility' },
    { key: 'liquidityPosition', name: 'Liquidity Position' },
    { key: 'reputationalFactors', name: 'Reputational Factors' },
    { key: 'strategicAlignment', name: 'Strategic Alignment' }
  ] as const;

  const validScores = [1, 2, 3, 4, 5];
  const validLabels = [
    'Not important at all',
    'Not very important',
    'Somewhat important',
    'Important',
    'Very important'
  ];

  fields.forEach(({ key, name }) => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      const isValidScore = typeof value === 'number' && validScores.includes(value);
      const isValidLabel = typeof value === 'string' && validLabels.includes(value);

      if (!isValidScore && !isValidLabel) {
        errors.push({
          field: key,
          message: `${name} must be a valid assessment value`
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Socioeconomic Improvement
 */
export function validateSocioeconomicImprovement(data: SocioeconomicImprovement): ValidationResult {
  const errors: ValidationError[] = [];

  const fields = [
    { key: 'keyArea1_workingConditions', name: 'Working Conditions' },
    { key: 'keyArea2_workOrganization', name: 'Work Organization' },
    { key: 'keyArea3_communication', name: 'Communication (3C)' },
    { key: 'keyArea4_timeManagement', name: 'Time Management' },
    { key: 'keyArea5_training', name: 'On-the-job Training' },
    { key: 'keyArea6_strategy', name: 'Strategic Implementation' }
  ] as const;

  const validScores = [1, 2, 3, 4, 5];
  const validLabels = [
    'Not important at all',
    'Not very important',
    'Somewhat important',
    'Important',
    'Very important'
  ];

  fields.forEach(({ key, name }) => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      const isValidScore = typeof value === 'number' && validScores.includes(value);
      const isValidLabel = typeof value === 'string' && validLabels.includes(value);

      if (!isValidScore && !isValidLabel) {
        errors.push({
          field: key,
          message: `${name} must be a valid importance level`
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if a form step is complete (all required fields filled)
 */
export function isStepComplete(stepIndex: number, formData: any): boolean {
  switch (stepIndex) {
    case 0: // Welcome - always complete
      return true;

    case 1: // Company Info
      return validateCompanyInfo(formData.companyInfo).isValid;

    case 2: // Business Lines - at least one valid business line
      return formData.businessLines &&
             formData.businessLines.length > 0 &&
             formData.businessLines.every((line: BusinessLine) =>
               validateBusinessLine(line).isValid
             );

    case 3: // Calculated Fields - no validation needed (auto-calculated)
      return true;

    case 4: // Risk Data
      return validateRiskData(formData.riskData).isValid;

    case 5: // Qualitative Assessment - optional but validate if filled
      return true; // Optional step

    case 6: // Socioeconomic Improvement - optional but validate if filled
      return true; // Optional step

    default:
      return true;
  }
}

/**
 * Get user-friendly error message for a field
 */
export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  const error = errors.find(e => e.field === fieldName);
  return error?.message;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;

  return `Please fix the following errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
}
