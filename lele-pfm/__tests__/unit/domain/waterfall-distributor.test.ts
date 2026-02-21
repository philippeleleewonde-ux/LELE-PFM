import { distributeWaterfall } from '@/domain/calculators/waterfall-distributor';

describe('Waterfall Distributor', () => {
  describe('Basic Distribution', () => {
    it('should distribute correctly with default config', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 35, p3: 20, p4: 15 });
      expect(result.p1Amount).toBe(3000);
      expect(result.p2Amount).toBe(3500);
      expect(result.p3Amount).toBe(2000);
      expect(result.p4Amount).toBe(1500);
      expect(result.isValid).toBe(true);
    });

    it('should sum to original EPR amount', () => {
      const epr = 10000;
      const result = distributeWaterfall(epr, { p1: 25, p2: 25, p3: 25, p4: 25 });
      const total = result.p1Amount + result.p2Amount + result.p3Amount + result.p4Amount;
      expect(total).toBe(epr);
    });

    it('should distribute with equal percentages', () => {
      const result = distributeWaterfall(10000, { p1: 25, p2: 25, p3: 25, p4: 25 });
      expect(result.p1Amount).toBe(2500);
      expect(result.p2Amount).toBe(2500);
      expect(result.p3Amount).toBe(2500);
      expect(result.p4Amount).toBe(2500);
      expect(result.isValid).toBe(true);
    });

    it('should distribute with unequal percentages', () => {
      const result = distributeWaterfall(10000, { p1: 50, p2: 30, p3: 15, p4: 5 });
      expect(result.p1Amount).toBe(5000);
      expect(result.p2Amount).toBe(3000);
      expect(result.p3Amount).toBe(1500);
      expect(result.p4Amount).toBe(500);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should reject config that does not sum to 100', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 30, p3: 20, p4: 10 });
      expect(result.isValid).toBe(false);
    });

    it('should reject config that sums to 99', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 30, p3: 20, p4: 19 });
      expect(result.isValid).toBe(false);
    });

    it('should reject config that sums to 101', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 30, p3: 20, p4: 21 });
      expect(result.isValid).toBe(false);
    });

    it('should accept config within tolerance (0.01)', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 35, p3: 20, p4: 15.01 });
      expect(result.isValid).toBe(true);
    });

    it('should reject negative percentages', () => {
      const result = distributeWaterfall(10000, { p1: -10, p2: 60, p3: 30, p4: 20 });
      expect(result.isValid).toBe(false);
    });

    it('should accept zero percentage in one bucket', () => {
      const result = distributeWaterfall(10000, { p1: 0, p2: 50, p3: 30, p4: 20 });
      expect(result.isValid).toBe(true);
      expect(result.p1Amount).toBe(0);
    });
  });

  describe('Zero EPR Handling', () => {
    it('should handle zero EPR', () => {
      const result = distributeWaterfall(0, { p1: 30, p2: 35, p3: 20, p4: 15 });
      expect(result.p1Amount).toBe(0);
      expect(result.p2Amount).toBe(0);
      expect(result.p3Amount).toBe(0);
      expect(result.p4Amount).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should maintain zero distribution proportionally', () => {
      const result = distributeWaterfall(0, { p1: 25, p2: 25, p3: 25, p4: 25 });
      const total = result.p1Amount + result.p2Amount + result.p3Amount + result.p4Amount;
      expect(total).toBe(0);
    });
  });

  describe('Config-Driven Behavior (Not Hardcoded)', () => {
    it('should NEVER hardcode 67/33 split - verify with 50/20/20/10', () => {
      const result = distributeWaterfall(10000, { p1: 50, p2: 20, p3: 20, p4: 10 });
      expect(result.p1Amount).toBe(5000);
      expect(result.p2Amount).toBe(2000);
      expect(result.p3Amount).toBe(2000);
      expect(result.p4Amount).toBe(1000);
    });

    it('should NEVER hardcode 67/33 split - verify with 10/60/20/10', () => {
      const result = distributeWaterfall(10000, { p1: 10, p2: 60, p3: 20, p4: 10 });
      expect(result.p1Amount).toBe(1000);
      expect(result.p2Amount).toBe(6000);
      expect(result.p3Amount).toBe(2000);
      expect(result.p4Amount).toBe(1000);
    });

    it('should respect different configurations independently', () => {
      const config1 = distributeWaterfall(10000, { p1: 40, p2: 30, p3: 20, p4: 10 });
      const config2 = distributeWaterfall(10000, { p1: 10, p2: 30, p3: 40, p4: 20 });
      expect(config1.p1Amount).toBe(4000);
      expect(config2.p3Amount).toBe(4000);
      expect(config1.p1Amount).not.toBe(config2.p1Amount);
    });

    it('should reverse distributions with reversed config', () => {
      const result1 = distributeWaterfall(10000, { p1: 40, p2: 30, p3: 20, p4: 10 });
      const result2 = distributeWaterfall(10000, { p1: 10, p2: 20, p3: 30, p4: 40 });
      expect(result1.p1Amount).toBe(result2.p4Amount);
      expect(result1.p4Amount).toBe(result2.p1Amount);
    });
  });

  describe('Large Amount Distribution', () => {
    it('should distribute large amounts correctly', () => {
      const result = distributeWaterfall(1000000, { p1: 30, p2: 35, p3: 20, p4: 15 });
      expect(result.p1Amount).toBe(300000);
      expect(result.p2Amount).toBe(350000);
      expect(result.p3Amount).toBe(200000);
      expect(result.p4Amount).toBe(150000);
    });

    it('should handle decimal EPR amounts', () => {
      const result = distributeWaterfall(10000.50, { p1: 25, p2: 25, p3: 25, p4: 25 });
      const total = result.p1Amount + result.p2Amount + result.p3Amount + result.p4Amount;
      expect(total).toBeCloseTo(10000.50, 2);
    });
  });

  describe('Return Value Structure', () => {
    it('should return object with all required properties', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 35, p3: 20, p4: 15 });
      expect(result).toHaveProperty('p1Amount');
      expect(result).toHaveProperty('p2Amount');
      expect(result).toHaveProperty('p3Amount');
      expect(result).toHaveProperty('p4Amount');
      expect(result).toHaveProperty('isValid');
    });

    it('should have numeric amount values', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 35, p3: 20, p4: 15 });
      expect(typeof result.p1Amount).toBe('number');
      expect(typeof result.p2Amount).toBe('number');
      expect(typeof result.p3Amount).toBe('number');
      expect(typeof result.p4Amount).toBe('number');
    });

    it('should have boolean isValid property', () => {
      const result = distributeWaterfall(10000, { p1: 30, p2: 35, p3: 20, p4: 15 });
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('Percentage Edge Cases', () => {
    it('should handle all budget in P1 (100/0/0/0)', () => {
      const result = distributeWaterfall(10000, { p1: 100, p2: 0, p3: 0, p4: 0 });
      expect(result.p1Amount).toBe(10000);
      expect(result.p2Amount).toBe(0);
      expect(result.p3Amount).toBe(0);
      expect(result.p4Amount).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should handle all budget in P4 (0/0/0/100)', () => {
      const result = distributeWaterfall(10000, { p1: 0, p2: 0, p3: 0, p4: 100 });
      expect(result.p1Amount).toBe(0);
      expect(result.p2Amount).toBe(0);
      expect(result.p3Amount).toBe(0);
      expect(result.p4Amount).toBe(10000);
      expect(result.isValid).toBe(true);
    });

    it('should handle decimal percentages', () => {
      const result = distributeWaterfall(10000, { p1: 33.33, p2: 33.33, p3: 16.67, p4: 16.67 });
      const total = result.p1Amount + result.p2Amount + result.p3Amount + result.p4Amount;
      expect(total).toBeCloseTo(10000, 1);
    });

    it('should distribute without loss or gain', () => {
      const eprAmounts = [1000, 5000, 10000, 99999];
      eprAmounts.forEach(epr => {
        const result = distributeWaterfall(epr, { p1: 30, p2: 35, p3: 20, p4: 15 });
        const total = result.p1Amount + result.p2Amount + result.p3Amount + result.p4Amount;
        expect(total).toBeCloseTo(epr, 2);
      });
    });
  });

  describe('Consistency and Determinism', () => {
    it('should produce same result for same inputs', () => {
      const config = { p1: 30, p2: 35, p3: 20, p4: 15 };
      const result1 = distributeWaterfall(10000, config);
      const result2 = distributeWaterfall(10000, config);
      expect(result1.p1Amount).toBe(result2.p1Amount);
      expect(result1.p2Amount).toBe(result2.p2Amount);
      expect(result1.p3Amount).toBe(result2.p3Amount);
      expect(result1.p4Amount).toBe(result2.p4Amount);
      expect(result1.isValid).toBe(result2.isValid);
    });
  });
});
