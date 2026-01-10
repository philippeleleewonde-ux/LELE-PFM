// ============================================
// DATA VALIDATOR - Mathematical Coherence Validation
// ============================================

import { BusinessLine, FinancialDataPoint } from '../types';

/**
 * Validation result for a single check
 */
export interface ValidationResult {
  isValid: boolean;
  errorType?: 'profitability' | 'segment_sum' | 'ratio' | 'negative_value' | 'outlier';
  message?: string;
  severity: 'error' | 'warning' | 'info';
  affectedItems?: string[]; // IDs of affected business lines or data points
}

/**
 * Full validation report
 */
export interface ValidationReport {
  overallValid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
  timestamp: Date;
}

/**
 * Validate profitability: Revenue - Expenses should be reasonable
 * Flags if profit margin is < -50% or > 90% (suspicious)
 */
export function validateProfitability(businessLines: BusinessLine[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  businessLines.forEach(bl => {
    const { revenue, expenses } = bl.metrics;

    if (revenue && expenses) {
      const profit = revenue - expenses;
      const profitMargin = (profit / revenue) * 100;

      // Check for unrealistic profit margins
      if (profitMargin < -50) {
        results.push({
          isValid: false,
          errorType: 'profitability',
          message: `${bl.name}: Profit margin ${profitMargin.toFixed(1)}% is extremely low (< -50%). Revenue: ${revenue.toLocaleString()}, Expenses: ${expenses.toLocaleString()}`,
          severity: 'warning',
          affectedItems: [bl.id]
        });
      } else if (profitMargin > 90) {
        results.push({
          isValid: false,
          errorType: 'profitability',
          message: `${bl.name}: Profit margin ${profitMargin.toFixed(1)}% is extremely high (> 90%). Revenue: ${revenue.toLocaleString()}, Expenses: ${expenses.toLocaleString()}`,
          severity: 'warning',
          affectedItems: [bl.id]
        });
      }

      // Check for negative revenue or expenses
      if (revenue < 0) {
        results.push({
          isValid: false,
          errorType: 'negative_value',
          message: `${bl.name}: Negative revenue detected (${revenue.toLocaleString()})`,
          severity: 'error',
          affectedItems: [bl.id]
        });
      }

      if (expenses < 0) {
        results.push({
          isValid: false,
          errorType: 'negative_value',
          message: `${bl.name}: Negative expenses detected (${expenses.toLocaleString()})`,
          severity: 'error',
          affectedItems: [bl.id]
        });
      }
    }
  });

  return results;
}

/**
 * Validate segment sums: Check if there's a "Total" line that matches sum of components
 * This requires identifying potential total rows (usually named "Total", "Somme", etc.)
 */
export function validateSegmentSum(businessLines: BusinessLine[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Find potential total rows
  const totalRows = businessLines.filter(bl =>
    bl.name.toLowerCase().includes('total') ||
    bl.name.toLowerCase().includes('somme') ||
    bl.name.toLowerCase().includes('consolidated')
  );

  const componentRows = businessLines.filter(bl =>
    !bl.name.toLowerCase().includes('total') &&
    !bl.name.toLowerCase().includes('somme') &&
    !bl.name.toLowerCase().includes('consolidated')
  );

  if (totalRows.length === 0 || componentRows.length === 0) {
    // No total row found, skip validation
    return results;
  }

  totalRows.forEach(totalRow => {
    const { revenue: totalRevenue, expenses: totalExpenses, headcount: totalHeadcount } = totalRow.metrics;

    // Validate revenue sum
    if (totalRevenue) {
      const sumRevenue = componentRows
        .map(bl => bl.metrics.revenue || 0)
        .reduce((sum, val) => sum + val, 0);

      const revenueDiff = Math.abs(totalRevenue - sumRevenue);
      const revenueErrorPercent = (revenueDiff / totalRevenue) * 100;

      if (revenueErrorPercent > 5) {
        results.push({
          isValid: false,
          errorType: 'segment_sum',
          message: `${totalRow.name}: Revenue total mismatch. Expected ${sumRevenue.toLocaleString()}, found ${totalRevenue.toLocaleString()} (${revenueErrorPercent.toFixed(1)}% difference)`,
          severity: 'warning',
          affectedItems: [totalRow.id]
        });
      }
    }

    // Validate expenses sum
    if (totalExpenses) {
      const sumExpenses = componentRows
        .map(bl => bl.metrics.expenses || 0)
        .reduce((sum, val) => sum + val, 0);

      const expensesDiff = Math.abs(totalExpenses - sumExpenses);
      const expensesErrorPercent = (expensesDiff / totalExpenses) * 100;

      if (expensesErrorPercent > 5) {
        results.push({
          isValid: false,
          errorType: 'segment_sum',
          message: `${totalRow.name}: Expenses total mismatch. Expected ${sumExpenses.toLocaleString()}, found ${totalExpenses.toLocaleString()} (${expensesErrorPercent.toFixed(1)}% difference)`,
          severity: 'warning',
          affectedItems: [totalRow.id]
        });
      }
    }

    // Validate headcount sum
    if (totalHeadcount) {
      const sumHeadcount = componentRows
        .map(bl => bl.metrics.headcount || 0)
        .reduce((sum, val) => sum + val, 0);

      const headcountDiff = Math.abs(totalHeadcount - sumHeadcount);

      if (headcountDiff > 0) {
        results.push({
          isValid: false,
          errorType: 'segment_sum',
          message: `${totalRow.name}: Headcount total mismatch. Expected ${sumHeadcount}, found ${totalHeadcount}`,
          severity: 'warning',
          affectedItems: [totalRow.id]
        });
      }
    }
  });

  return results;
}

/**
 * Validate business ratios: Revenue per employee, Cost per employee
 * Flags if ratios are statistical outliers
 */
export function validateBusinessRatios(businessLines: BusinessLine[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Calculate revenue per employee for all lines
  const revenuePerEmployee = businessLines
    .filter(bl => bl.metrics.revenue && bl.metrics.headcount)
    .map(bl => ({
      id: bl.id,
      name: bl.name,
      ratio: bl.metrics.revenue! / bl.metrics.headcount!
    }));

  if (revenuePerEmployee.length >= 3) {
    // Calculate mean and standard deviation
    const mean = revenuePerEmployee.reduce((sum, item) => sum + item.ratio, 0) / revenuePerEmployee.length;
    const variance = revenuePerEmployee.reduce((sum, item) => sum + Math.pow(item.ratio - mean, 2), 0) / revenuePerEmployee.length;
    const stdDev = Math.sqrt(variance);

    // Flag outliers (> 2 standard deviations from mean)
    revenuePerEmployee.forEach(item => {
      const zScore = Math.abs((item.ratio - mean) / stdDev);

      if (zScore > 2) {
        results.push({
          isValid: false,
          errorType: 'outlier',
          message: `${item.name}: Revenue per employee (${item.ratio.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €) is a statistical outlier (${zScore.toFixed(1)} std devs from mean)`,
          severity: 'info',
          affectedItems: [item.id]
        });
      }
    });
  }

  // Calculate cost per employee for all lines
  const costPerEmployee = businessLines
    .filter(bl => bl.metrics.expenses && bl.metrics.headcount)
    .map(bl => ({
      id: bl.id,
      name: bl.name,
      ratio: bl.metrics.expenses! / bl.metrics.headcount!
    }));

  if (costPerEmployee.length >= 3) {
    const mean = costPerEmployee.reduce((sum, item) => sum + item.ratio, 0) / costPerEmployee.length;
    const variance = costPerEmployee.reduce((sum, item) => sum + Math.pow(item.ratio - mean, 2), 0) / costPerEmployee.length;
    const stdDev = Math.sqrt(variance);

    costPerEmployee.forEach(item => {
      const zScore = Math.abs((item.ratio - mean) / stdDev);

      if (zScore > 2) {
        results.push({
          isValid: false,
          errorType: 'outlier',
          message: `${item.name}: Cost per employee (${item.ratio.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €) is a statistical outlier (${zScore.toFixed(1)} std devs from mean)`,
          severity: 'info',
          affectedItems: [item.id]
        });
      }
    });
  }

  return results;
}

/**
 * Main validation function: Runs all validation checks
 */
export function validateBusinessLines(businessLines: BusinessLine[]): ValidationReport {
  const allResults: ValidationResult[] = [];

  // Run all validation checks
  allResults.push(...validateProfitability(businessLines));
  allResults.push(...validateSegmentSum(businessLines));
  allResults.push(...validateBusinessRatios(businessLines));

  // Separate by severity
  const errors = allResults.filter(r => r.severity === 'error');
  const warnings = allResults.filter(r => r.severity === 'warning');
  const info = allResults.filter(r => r.severity === 'info');

  const report: ValidationReport = {
    overallValid: errors.length === 0,
    errors,
    warnings,
    info,
    timestamp: new Date()
  };

  // Log validation summary
  if (errors.length > 0) {
    errors.forEach(e => );
  }

  if (warnings.length > 0) {
    warnings.forEach(w => );
  }

  return report;
}

/**
 * Validate financial data points for basic consistency
 */
export function validateFinancialDataPoints(dataPoints: FinancialDataPoint[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  dataPoints.forEach(dp => {
    // Check for negative values in categories that should be positive
    if (dp.value < 0 && (
      dp.category === 'revenue' ||
      dp.category === 'hr_indicators'
    )) {
      results.push({
        isValid: false,
        errorType: 'negative_value',
        message: `Negative value detected in ${dp.category}: ${dp.value.toLocaleString()} at row ${dp.position.row}, col ${dp.position.col}`,
        severity: 'warning',
        affectedItems: [`dp-${dp.position.row}-${dp.position.col}`]
      });
    }

    // Check for extremely large values (> 1 trillion)
    if (Math.abs(dp.value) > 1_000_000_000_000) {
      results.push({
        isValid: false,
        errorType: 'outlier',
        message: `Extremely large value detected: ${dp.value.toLocaleString()} in ${dp.category} (possible parsing error)`,
        severity: 'warning',
        affectedItems: [`dp-${dp.position.row}-${dp.position.col}`]
      });
    }
  });

  return results;
}
