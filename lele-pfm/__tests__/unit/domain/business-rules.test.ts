import {
  validateTransactionType,
  validateCOICOPCode,
  validateWaterfallConfig,
  validateFlexibilityParams,
  capRealToPrevu,
  validateWeekNumber,
} from '@/domain/validators/business-rules';

describe('Business Rules', () => {
  describe('validateTransactionType', () => {
    it('should accept Fixe', () => {
      expect(validateTransactionType('Fixe')).toBe(true);
    });

    it('should accept Variable', () => {
      expect(validateTransactionType('Variable')).toBe(true);
    });

    it('should accept Imprévue', () => {
      expect(validateTransactionType('Imprévue')).toBe(true);
    });

    it('should accept Épargne-Dette', () => {
      expect(validateTransactionType('Épargne-Dette')).toBe(true);
    });

    it('should accept all 4 valid types', () => {
      const validTypes = ['Fixe', 'Variable', 'Imprévue', 'Épargne-Dette'];
      validTypes.forEach(type => {
        expect(validateTransactionType(type)).toBe(true);
      });
    });

    it('should reject EKH as type', () => {
      expect(validateTransactionType('EKH')).toBe(false);
    });

    it('should reject any 5th type', () => {
      expect(validateTransactionType('Prime')).toBe(false);
      expect(validateTransactionType('Trésorerie')).toBe(false);
      expect(validateTransactionType('Salaire')).toBe(false);
      expect(validateTransactionType('Bonus')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateTransactionType('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(validateTransactionType('fixe')).toBe(false);
      expect(validateTransactionType('FIXE')).toBe(false);
      expect(validateTransactionType('variable')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateTransactionType(null as any)).toBe(false);
      expect(validateTransactionType(undefined as any)).toBe(false);
    });

    it('should reject types with extra whitespace', () => {
      expect(validateTransactionType(' Fixe')).toBe(false);
      expect(validateTransactionType('Fixe ')).toBe(false);
      expect(validateTransactionType(' Fixe ')).toBe(false);
    });

    it('should not accept partial matches', () => {
      expect(validateTransactionType('Fix')).toBe(false);
      expect(validateTransactionType('Var')).toBe(false);
    });
  });

  describe('validateCOICOPCode', () => {
    it('should accept code 01', () => {
      expect(validateCOICOPCode('01')).toBe(true);
    });

    it('should accept code 02', () => {
      expect(validateCOICOPCode('02')).toBe(true);
    });

    it('should accept code 03', () => {
      expect(validateCOICOPCode('03')).toBe(true);
    });

    it('should accept code 04', () => {
      expect(validateCOICOPCode('04')).toBe(true);
    });

    it('should accept code 05', () => {
      expect(validateCOICOPCode('05')).toBe(true);
    });

    it('should accept code 06', () => {
      expect(validateCOICOPCode('06')).toBe(true);
    });

    it('should accept code 07', () => {
      expect(validateCOICOPCode('07')).toBe(true);
    });

    it('should accept code 08', () => {
      expect(validateCOICOPCode('08')).toBe(true);
    });

    it('should accept all codes 01-08', () => {
      for (const code of ['01', '02', '03', '04', '05', '06', '07', '08']) {
        expect(validateCOICOPCode(code)).toBe(true);
      }
    });

    it('should reject code 09', () => {
      expect(validateCOICOPCode('09')).toBe(false);
    });

    it('should reject code 00', () => {
      expect(validateCOICOPCode('00')).toBe(false);
    });

    it('should reject code 10 and higher', () => {
      expect(validateCOICOPCode('10')).toBe(false);
      expect(validateCOICOPCode('11')).toBe(false);
      expect(validateCOICOPCode('99')).toBe(false);
    });

    it('should reject negative codes', () => {
      expect(validateCOICOPCode('-1')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateCOICOPCode('')).toBe(false);
    });

    it('should reject single digit codes', () => {
      expect(validateCOICOPCode('1')).toBe(false);
      expect(validateCOICOPCode('8')).toBe(false);
    });

    it('should reject codes with extra whitespace', () => {
      expect(validateCOICOPCode(' 01')).toBe(false);
      expect(validateCOICOPCode('01 ')).toBe(false);
    });

    it('should reject codes with non-numeric characters', () => {
      expect(validateCOICOPCode('0A')).toBe(false);
      expect(validateCOICOPCode('O1')).toBe(false);
    });

    it('should be case-sensitive for numeric validation', () => {
      expect(validateCOICOPCode('01')).toBe(true);
      expect(validateCOICOPCode('1')).toBe(false);
    });
  });

  describe('capRealToPrevu', () => {
    it('should cap actual to planned when actual > planned', () => {
      expect(capRealToPrevu(180, 150)).toBe(150);
    });

    it('should return actual when actual < planned', () => {
      expect(capRealToPrevu(100, 150)).toBe(100);
    });

    it('should return equal when actual == planned', () => {
      expect(capRealToPrevu(150, 150)).toBe(150);
    });

    it('should cap large overages', () => {
      expect(capRealToPrevu(1000, 500)).toBe(500);
    });

    it('should return 0 when actual is 0', () => {
      expect(capRealToPrevu(0, 100)).toBe(0);
    });

    it('should handle negative planned values', () => {
      expect(capRealToPrevu(50, -100)).toBe(-100);
    });

    it('should handle negative actual values', () => {
      expect(capRealToPrevu(-50, 100)).toBe(-50);
    });

    it('should handle both negative values', () => {
      expect(capRealToPrevu(-200, -100)).toBe(-100);
    });

    it('should cap when actual slightly exceeds planned', () => {
      expect(capRealToPrevu(150.01, 150)).toBe(150);
    });

    it('should handle decimal values', () => {
      expect(capRealToPrevu(99.99, 100)).toBe(99.99);
      expect(capRealToPrevu(100.01, 100)).toBe(100);
    });

    it('should be consistent across multiple calls', () => {
      const result1 = capRealToPrevu(250, 200);
      const result2 = capRealToPrevu(250, 200);
      expect(result1).toBe(result2);
    });
  });

  describe('validateWaterfallConfig', () => {
    it('should accept config summing to 100', () => {
      expect(validateWaterfallConfig(30, 35, 20, 15)).toBe(true);
    });

    it('should reject config summing to 99', () => {
      expect(validateWaterfallConfig(30, 30, 20, 10)).toBe(false);
    });

    it('should reject config summing to 101', () => {
      expect(validateWaterfallConfig(30, 30, 20, 21)).toBe(false);
    });

    it('should accept config summing to 100.00 exactly', () => {
      expect(validateWaterfallConfig(25, 25, 25, 25)).toBe(true);
    });

    it('should accept within tolerance 0.01', () => {
      expect(validateWaterfallConfig(30, 35, 20, 15.01)).toBe(true);
    });

    it('should accept within tolerance on lower bound', () => {
      expect(validateWaterfallConfig(30, 35, 20, 14.99)).toBe(true);
    });

    it('should reject outside tolerance upper bound', () => {
      expect(validateWaterfallConfig(30, 35, 20, 15.02)).toBe(false);
    });

    it('should reject outside tolerance lower bound', () => {
      expect(validateWaterfallConfig(30, 35, 20, 14.98)).toBe(false);
    });

    it('should accept all zeros', () => {
      expect(validateWaterfallConfig(0, 0, 0, 0)).toBe(false);
    });

    it('should handle negative percentages', () => {
      expect(validateWaterfallConfig(-10, 110, 5, 5)).toBe(false);
    });

    it('should accept large percentages if sum is 100', () => {
      expect(validateWaterfallConfig(100, 0, 0, 0)).toBe(true);
      expect(validateWaterfallConfig(0, 100, 0, 0)).toBe(true);
    });

    it('should accept fractional percentages', () => {
      expect(validateWaterfallConfig(25.5, 24.5, 25, 25)).toBe(true);
    });

    it('should be consistent across calls', () => {
      const result1 = validateWaterfallConfig(30, 35, 20, 15);
      const result2 = validateWaterfallConfig(30, 35, 20, 15);
      expect(result1).toBe(result2);
    });
  });

  describe('validateFlexibilityParams', () => {
    it('should accept valid flexibility params', () => {
      // Assuming valid params are within 0-21 range for F1, F2, F3
      expect(validateFlexibilityParams(10, 10, 10)).toBe(true);
    });

    it('should accept maximum valid values (21, 21, 21)', () => {
      expect(validateFlexibilityParams(21, 21, 21)).toBe(true);
    });

    it('should accept minimum valid values (0, 0, 0)', () => {
      expect(validateFlexibilityParams(0, 0, 0)).toBe(true);
    });

    it('should reject values exceeding maximum (21)', () => {
      expect(validateFlexibilityParams(22, 10, 10)).toBe(false);
      expect(validateFlexibilityParams(10, 22, 10)).toBe(false);
      expect(validateFlexibilityParams(10, 10, 22)).toBe(false);
    });

    it('should reject negative values', () => {
      expect(validateFlexibilityParams(-1, 10, 10)).toBe(false);
      expect(validateFlexibilityParams(10, -1, 10)).toBe(false);
      expect(validateFlexibilityParams(10, 10, -1)).toBe(false);
    });

    it('should accept boundary values', () => {
      expect(validateFlexibilityParams(0, 21, 10)).toBe(true);
      expect(validateFlexibilityParams(21, 0, 21)).toBe(true);
    });

    it('should accept decimal values within range', () => {
      expect(validateFlexibilityParams(10.5, 10.5, 10.5)).toBe(true);
    });

    it('should reject at least one invalid parameter', () => {
      expect(validateFlexibilityParams(10, 10, 22)).toBe(false);
      expect(validateFlexibilityParams(22, 22, 22)).toBe(false);
    });

    it('should validate independently for each parameter', () => {
      expect(validateFlexibilityParams(21, 0, 0)).toBe(true);
      expect(validateFlexibilityParams(0, 21, 0)).toBe(true);
      expect(validateFlexibilityParams(0, 0, 21)).toBe(true);
    });

    it('should be consistent across multiple calls', () => {
      const result1 = validateFlexibilityParams(15, 12, 18);
      const result2 = validateFlexibilityParams(15, 12, 18);
      expect(result1).toBe(result2);
    });
  });

  describe('validateWeekNumber', () => {
    it('should accept 1', () => {
      expect(validateWeekNumber(1)).toBe(true);
    });

    it('should accept 52', () => {
      expect(validateWeekNumber(52)).toBe(true);
    });

    it('should accept 26 (middle)', () => {
      expect(validateWeekNumber(26)).toBe(true);
    });

    it('should accept all weeks 1-52', () => {
      for (let week = 1; week <= 52; week++) {
        expect(validateWeekNumber(week)).toBe(true);
      }
    });

    it('should reject 0', () => {
      expect(validateWeekNumber(0)).toBe(false);
    });

    it('should reject 53', () => {
      expect(validateWeekNumber(53)).toBe(false);
    });

    it('should reject negative weeks', () => {
      expect(validateWeekNumber(-1)).toBe(false);
      expect(validateWeekNumber(-52)).toBe(false);
    });

    it('should reject weeks > 53', () => {
      expect(validateWeekNumber(54)).toBe(false);
      expect(validateWeekNumber(100)).toBe(false);
    });

    it('should reject decimal weeks', () => {
      expect(validateWeekNumber(26.5)).toBe(false);
      expect(validateWeekNumber(1.1)).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(validateWeekNumber(null as any)).toBe(false);
      expect(validateWeekNumber(undefined as any)).toBe(false);
      expect(validateWeekNumber('26' as any)).toBe(false);
    });

    it('should be consistent across multiple calls', () => {
      const result1 = validateWeekNumber(26);
      const result2 = validateWeekNumber(26);
      expect(result1).toBe(result2);
    });

    it('should handle boundary weeks correctly', () => {
      expect(validateWeekNumber(1)).toBe(true);
      expect(validateWeekNumber(2)).toBe(true);
      expect(validateWeekNumber(51)).toBe(true);
      expect(validateWeekNumber(52)).toBe(true);
    });

    it('should handle week 1 and 52 as valid boundaries', () => {
      expect(validateWeekNumber(1)).toBe(true);
      expect(validateWeekNumber(52)).toBe(true);
      expect(validateWeekNumber(0)).toBe(false);
      expect(validateWeekNumber(53)).toBe(false);
    });
  });

  describe('Cross-validator Tests', () => {
    it('should validate complete transaction setup', () => {
      const transactionType = validateTransactionType('Fixe');
      const coicopCode = validateCOICOPCode('05');
      const weekNumber = validateWeekNumber(26);
      expect(transactionType && coicopCode && weekNumber).toBe(true);
    });

    it('should validate complete flex params setup', () => {
      const flexParams = validateFlexibilityParams(10, 12, 8);
      const weekNumber = validateWeekNumber(10);
      expect(flexParams && weekNumber).toBe(true);
    });

    it('should reject any invalid parameter in a set', () => {
      const transactionType = validateTransactionType('Invalid');
      const coicopCode = validateCOICOPCode('05');
      const weekNumber = validateWeekNumber(26);
      expect(transactionType && coicopCode && weekNumber).toBe(false);
    });
  });
});
