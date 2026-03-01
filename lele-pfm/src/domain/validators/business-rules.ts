import { TransactionType, COICOPCode, ProfileType, WaterfallConfig } from '../../types';

export function validateTransactionType(type: string): type is TransactionType {
  const validTypes: TransactionType[] = ['Fixe', 'Variable', 'Imprévue', 'Épargne-Dette'];
  return validTypes.includes(type as TransactionType);
}

export function validateCOICOPCode(code: string): code is COICOPCode {
  const validCodes: COICOPCode[] = ['01', '02', '03', '04', '05', '06', '07', '08'];
  return validCodes.includes(code as COICOPCode);
}

export function validateWaterfallConfig(config: WaterfallConfig): { valid: boolean; error?: string } {
  const sum = config.p1 + config.p2 + config.p3 + config.p4;
  const tolerance = 0.01;
  
  if (Math.abs(sum - 100) > tolerance) {
    return {
      valid: false,
      error: `Waterfall percentages must sum to 100, got ${sum.toFixed(2)}`,
    };
  }
  
  return { valid: true };
}

export function validateFlexibilityParams(f1: number, f2: number, f3: number): { valid: boolean; error?: string } {
  if (f1 < 0 || f1 > 21) {
    return { valid: false, error: 'F1 must be between 0 and 21' };
  }
  if (f2 < 0 || f2 > 21) {
    return { valid: false, error: 'F2 must be between 0 and 21' };
  }
  if (f3 < 0 || f3 > 21) {
    return { valid: false, error: 'F3 must be between 0 and 21' };
  }
  
  return { valid: true };
}

// capRealToPrevu — use the canonical version from @/domain/utils/math-utils
export { capRealToPrevu } from '../utils/math-utils';

export function validateWeekNumber(week: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(week)) {
    return { valid: false, error: 'Week number must be an integer' };
  }
  if (week < 1 || week > 52) {
    return { valid: false, error: 'Week number must be between 1 and 52' };
  }
  
  return { valid: true };
}
