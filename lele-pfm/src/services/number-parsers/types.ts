export interface NumberParser {
  parseNumber(input: string): number;
  parseVoiceExpense(input: string): { amount: number; description: string };
}
