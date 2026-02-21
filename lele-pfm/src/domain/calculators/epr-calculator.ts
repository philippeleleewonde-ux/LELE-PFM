/**
 * EPR Calculator - Calculates disposable income after essential expenses
 */

export function calculateEPR(
  amount: number,
  incompressibilityRate: number,
  flexibilityScore: number
): number {
  return amount * (1 - incompressibilityRate / 100) * (flexibilityScore / 100);
}

export function calculateFlexibilityScore(f1: number, f2: number, f3: number): number {
  return ((f1 + f2 + f3) / 63) * 100;
}

export function capRealToPrevu(actual: number, planned: number): number {
  return Math.min(actual, planned);
}
