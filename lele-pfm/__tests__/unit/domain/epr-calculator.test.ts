import { calculateEPR, calculateFlexibilityScore } from '@/domain/calculators/epr-calculator';

describe('EPR Calculator', () => {
  describe('calculateFlexibilityScore', () => {
    it('should return 0 for all zeros', () => {
      expect(calculateFlexibilityScore(0, 0, 0)).toBe(0);
    });

    it('should return 100 for maximum values (21, 21, 21)', () => {
      expect(calculateFlexibilityScore(21, 21, 21)).toBe(100);
    });

    it('should calculate (F1+F2+F3)/63*100 correctly', () => {
      expect(calculateFlexibilityScore(10, 10, 10)).toBeCloseTo(47.62, 1);
    });

    it('should handle partial maximum values', () => {
      // (21 + 0 + 0) / 63 * 100 = 33.33%
      expect(calculateFlexibilityScore(21, 0, 0)).toBeCloseTo(33.33, 1);
    });

    it('should handle mixed values', () => {
      // (15 + 10 + 5) / 63 * 100 = 47.62%
      expect(calculateFlexibilityScore(15, 10, 5)).toBeCloseTo(47.62, 1);
    });

    it('should handle single maximum dimension', () => {
      // (21 + 21 + 0) / 63 * 100 = 66.67%
      expect(calculateFlexibilityScore(21, 21, 0)).toBeCloseTo(66.67, 1);
    });

    it('should handle nearly maximum values', () => {
      // (20 + 20 + 20) / 63 * 100 = 95.24%
      expect(calculateFlexibilityScore(20, 20, 20)).toBeCloseTo(95.24, 1);
    });
  });

  describe('calculateEPR', () => {
    it('should return 0 when incompressibility is 100%', () => {
      expect(calculateEPR(10000, 100, 50)).toBe(0);
    });

    it('should return 0 when flexibility is 0%', () => {
      expect(calculateEPR(10000, 50, 0)).toBe(0);
    });

    it('should calculate correctly for normal values', () => {
      // amount=10000 cents, incomp=30%, flex=60%
      // 10000 * (1 - 0.3) * (0.6) = 10000 * 0.7 * 0.6 = 4200
      expect(calculateEPR(10000, 30, 60)).toBe(4200);
    });

    it('should calculate correctly when both compressibility and flexibility are 100%', () => {
      // amount=10000, incomp=0%, flex=100%
      // 10000 * (1 - 0) * (1) = 10000 * 1 * 1 = 10000
      expect(calculateEPR(10000, 0, 100)).toBe(10000);
    });

    it('should handle zero amount', () => {
      expect(calculateEPR(0, 50, 50)).toBe(0);
    });

    it('should handle 50/50 incompressibility and flexibility', () => {
      // amount=10000, incomp=50%, flex=50%
      // 10000 * (1 - 0.5) * (0.5) = 10000 * 0.5 * 0.5 = 2500
      expect(calculateEPR(10000, 50, 50)).toBe(2500);
    });

    it('should apply compressibility before flexibility', () => {
      // amount=5000, incomp=20%, flex=80%
      // 5000 * (1 - 0.2) * (0.8) = 5000 * 0.8 * 0.8 = 3200
      expect(calculateEPR(5000, 20, 80)).toBe(3200);
    });

    it('should never exceed the original amount', () => {
      const result = calculateEPR(10000, 10, 95);
      expect(result).toBeLessThanOrEqual(10000);
    });

    it('should handle large amounts', () => {
      // amount=1000000, incomp=25%, flex=75%
      // 1000000 * (1 - 0.25) * (0.75) = 1000000 * 0.75 * 0.75 = 562500
      expect(calculateEPR(1000000, 25, 75)).toBe(562500);
    });

    it('should round result correctly to cents', () => {
      // Verify rounding behavior for decimal results
      const result = calculateEPR(10001, 33, 66);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});
