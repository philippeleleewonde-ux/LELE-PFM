/**
 * Mathematical utility functions for financial calculations
 * All monetary values are in CENTS (integers)
 */

/**
 * Convert cents to formatted currency string
 */
export function centsToCurrency(
  cents: number,
  devise: string = 'EUR',
  locale: string = 'en-US'
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(cents / 100);
}

/**
 * Convert currency amount to cents
 */
export function currencyToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Cap real value to planned value (minimum)
 */
export function capRealToPrevu(actual: number, planned: number): number {
  return Math.min(actual, planned);
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate percentile
 */
export function percentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }

  const index = (percentile / 100) * sortedValues.length;
  const lower = Math.floor(index) - 1;
  const upper = lower + 1;
  const weight = index % 1;

  if (lower < 0) {
    return sortedValues[0];
  }
  if (upper >= sortedValues.length) {
    return sortedValues[sortedValues.length - 1];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round to specific number of decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Get ISO week number from date
 */
export function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
}

/**
 * Calculate monthly progression percentage
 */
export function progressionMensuelle(month: number): number {
  if (month < 1 || month > 36) {
    throw new Error('Month must be between 1 and 36');
  }
  return 5 + ((month - 1) * (11 - 5)) / 35;
}

/**
 * Calculate 5th percentile for VAR
 */
export function vat5thPercentile(values: number[]): number {
  return percentile(values, 5);
}

/**
 * Calculate combined volatility
 */
export function combinedVolatility(
  sigmaRevenue: number,
  sigmaExpense: number
): number {
  return Math.sqrt(Math.pow(sigmaRevenue, 2) + Math.pow(sigmaExpense, 2));
}

/**
 * Calculate VaR95 using formula
 */
export function calculateVaR95Formula(
  ul: number,
  el: number,
  sigma: number
): number {
  const sigmaSquareRoot = Math.sqrt(Math.abs(sigma));
  const zScore = 1.645;
  return Math.round((ul + el) * sigmaSquareRoot * zScore);
}

/**
 * Calculate contextual coefficient
 */
export function calculateContextualCoefficient(
  ekhScore: number,
  horizonMonths: number,
  profileType: string
): number {
  let coefficient = 1.0;

  if (ekhScore <= 2) {
    coefficient *= 1.3;
  } else if (ekhScore >= 4.5) {
    coefficient *= 0.7;
  } else if (ekhScore >= 3 && ekhScore < 4.5) {
    coefficient *= 1.0;
  }

  if (horizonMonths <= 3) {
    coefficient *= 1.2;
  } else if (horizonMonths > 3 && horizonMonths <= 10) {
    coefficient *= 1.0;
  } else if (horizonMonths > 10) {
    coefficient *= 0.8;
  }

  switch (profileType) {
    case 'Salarié':
      coefficient *= 0.9;
      break;
    case 'Freelance':
    case 'Entrepreneur':
      coefficient *= 1.2;
      break;
    case 'Retraité':
      coefficient *= 0.7;
      break;
    default:
      coefficient *= 1.0;
  }

  return clamp(coefficient, 0.5, 1.5);
}

/**
 * Risk score to probability
 */
export function riskScoreToProbability(riskScore: number): number {
  return (riskScore / 5) * 0.8;
}

/**
 * Get impact range for risk category
 */
export function getRiskImpactRange(
  category: string
): [number, number] {
  const impactRanges: Record<string, [number, number]> = {
    emploi: [0.3, 0.5],
    santé: [0.1, 0.2],
    résidentiel: [0.15, 0.25],
    familial: [0.1, 0.2],
    endettement: [0.2, 0.4],
    inflation: [0.05, 0.15],
  };
  return impactRanges[category] || [0.1, 0.2];
}

/**
 * Get median impact for a risk category
 */
export function getRiskMedianImpact(category: string): number {
  const [min, max] = getRiskImpactRange(category);
  return (min + max) / 2;
}

/**
 * Get PRL acceptance threshold
 */
export function getPRLAcceptanceThreshold(riskTolerance: string): number {
  switch (riskTolerance) {
    case 'Conservative':
      return 0.05;
    case 'Agressif':
      return 0.3;
    case 'Modéré':
    default:
      return 0.125;
  }
}

/**
 * Calculate weekly score from components
 */
export function calculateWeeklyScore(
  ekhScore: number,
  completionRate: number,
  budgetRespect: number,
  variation: number
): number {
  const normalized = clamp(ekhScore / 10, 0, 1);
  const score =
    normalized * 4 +
    clamp(completionRate, 0, 1) * 3 +
    clamp(budgetRespect, 0, 1) * 2 +
    clamp(variation, 0, 1) * 1;
  return clamp(score, 0, 10);
}

/**
 * Convert score to grade
 */
export function scoreToGrade(
  score: number
): 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= 9) return 'A+';
  if (score >= 8) return 'A';
  if (score >= 7) return 'B';
  if (score >= 6) return 'C';
  if (score >= 5) return 'D';
  return 'E';
}

/**
 * Validate if value is in valid cents range
 */
export function isValidCents(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Convert percentage to decimal
 */
export function percentageToDecimal(percentage: number): number {
  return clamp(percentage / 100, 0, 1);
}

/**
 * Convert decimal to percentage
 */
export function decimalToPercentage(decimal: number): number {
  return clamp(decimal * 100, 0, 100);
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Calculate compound growth rate
 */
export function compoundGrowthRate(
  initial: number,
  final: number,
  periods: number
): number {
  if (initial <= 0 || periods <= 0) {
    return 0;
  }
  return Math.pow(final / initial, 1 / periods) - 1;
}

/**
 * Calculate future value with compound growth
 */
export function futureValue(
  present: number,
  growthRate: number,
  periods: number
): number {
  return present * Math.pow(1 + growthRate, periods);
}

/**
 * Validate allocation percentages sum to 100%
 */
export function validateAllocationSum(
  percentages: number[],
  tolerance: number = 0.01
): boolean {
  const sum = percentages.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) <= tolerance;
}
