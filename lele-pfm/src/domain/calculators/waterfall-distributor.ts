export interface WaterfallConfig {
  p1: number; // Essential Fixed (%)
  p2: number; // Essential Variable (%)
  p3: number; // Discretionary (%)
  p4: number; // Savings & Debt (%)
}

export interface WaterfallResult {
  p1_amount: number;
  p2_amount: number;
  p3_amount: number;
  p4_amount: number;
  total: number;
  is_valid: boolean;
  validation_errors: string[];
}

export function distributeWaterfall(totalEPR: number, config: WaterfallConfig): WaterfallResult {
  const errors: string[] = [];
  
  const sum = config.p1 + config.p2 + config.p3 + config.p4;
  const isValid = Math.abs(sum - 100) <= 0.01;
  
  if (!isValid) {
    errors.push(`Waterfall percentages must sum to 100, got ${sum.toFixed(2)}`);
  }
  
  const p1 = Math.round((totalEPR * config.p1) / 100);
  const p2 = Math.round((totalEPR * config.p2) / 100);
  const p3 = Math.round((totalEPR * config.p3) / 100);
  const p4 = Math.round((totalEPR * config.p4) / 100);
  
  return {
    p1_amount: p1,
    p2_amount: p2,
    p3_amount: p3,
    p4_amount: p4,
    total: p1 + p2 + p3 + p4,
    is_valid: isValid,
    validation_errors: errors,
  };
}
