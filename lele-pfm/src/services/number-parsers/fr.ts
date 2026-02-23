import { NumberParser } from './types';
import { parseFrenchNumber, parseVoiceExpense } from '../french-number-parser';

export const frParser: NumberParser = {
  parseNumber: parseFrenchNumber,
  parseVoiceExpense,
};
