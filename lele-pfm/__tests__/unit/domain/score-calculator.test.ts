import { calculateWeeklyScore, scoreToGrade } from '@/domain/calculators/score-calculator';

describe('Score Calculator', () => {
  describe('scoreToGrade', () => {
    it('should return A+ for score 9.5', () => {
      expect(scoreToGrade(9.5)).toBe('A+');
    });

    it('should return A for score 8.5', () => {
      expect(scoreToGrade(8.5)).toBe('A');
    });

    it('should return B for score 7.5', () => {
      expect(scoreToGrade(7.5)).toBe('B');
    });

    it('should return C for score 6.5', () => {
      expect(scoreToGrade(6.5)).toBe('C');
    });

    it('should return D for score 5.5', () => {
      expect(scoreToGrade(5.5)).toBe('D');
    });

    it('should return E for score 3.0', () => {
      expect(scoreToGrade(3.0)).toBe('E');
    });

    it('should return A+ for score 10.0 (perfect)', () => {
      expect(scoreToGrade(10.0)).toBe('A+');
    });

    it('should return E for score 0.0 (minimum)', () => {
      expect(scoreToGrade(0.0)).toBe('E');
    });

    it('should handle boundary score 9.0', () => {
      expect(scoreToGrade(9.0)).toBe('A+');
    });

    it('should handle boundary score 8.0', () => {
      expect(scoreToGrade(8.0)).toBe('A');
    });

    it('should handle boundary score 7.0', () => {
      expect(scoreToGrade(7.0)).toBe('B');
    });

    it('should handle boundary score 6.0', () => {
      expect(scoreToGrade(6.0)).toBe('C');
    });

    it('should handle boundary score 5.0', () => {
      expect(scoreToGrade(5.0)).toBe('D');
    });

    it('should handle scores below 5.0 as E', () => {
      expect(scoreToGrade(4.9)).toBe('E');
      expect(scoreToGrade(2.0)).toBe('E');
      expect(scoreToGrade(0.1)).toBe('E');
    });

    it('should handle mid-range scores correctly', () => {
      expect(scoreToGrade(9.5)).toBe('A+');
      expect(scoreToGrade(8.5)).toBe('A');
      expect(scoreToGrade(7.5)).toBe('B');
      expect(scoreToGrade(6.5)).toBe('C');
      expect(scoreToGrade(5.5)).toBe('D');
    });
  });

  describe('calculateWeeklyScore', () => {
    it('should return 10 for perfect scores', () => {
      const result = calculateWeeklyScore(100, 100, 100, 100);
      expect(result.score).toBe(10);
      expect(result.grade).toBe('A+');
    });

    it('should return 0 for zero scores', () => {
      const result = calculateWeeklyScore(0, 0, 0, 0);
      expect(result.score).toBe(0);
      expect(result.grade).toBe('E');
    });

    it('should weight EKH at 4x', () => {
      // Only EKH at 100%, rest at 0%
      const result = calculateWeeklyScore(100, 0, 0, 0);
      expect(result.score).toBe(4);
    });

    it('should weight EAMK at 1x', () => {
      // Only EAMK at 100%, rest at 0%
      const result = calculateWeeklyScore(0, 100, 0, 0);
      expect(result.score).toBe(1);
    });

    it('should weight EAMU at 1x', () => {
      // Only EAMU at 100%, rest at 0%
      const result = calculateWeeklyScore(0, 0, 100, 0);
      expect(result.score).toBe(1);
    });

    it('should weight EAMP at 1x', () => {
      // Only EAMP at 100%, rest at 0%
      const result = calculateWeeklyScore(0, 0, 0, 100);
      expect(result.score).toBe(1);
    });

    it('should calculate weighted average correctly: 4*EKH + 1*EAMK + 1*EAMU + 1*EAMP divided by 7', () => {
      // EKH=100%, others=0%
      // (4*100 + 1*0 + 1*0 + 1*0) / 7 / 100 * 10 = 4 / 7 * 10 = 5.714...
      const result = calculateWeeklyScore(100, 0, 0, 0);
      expect(result.score).toBeCloseTo(5.71, 1);
    });

    it('should calculate with equal distribution of other metrics', () => {
      // EKH=100%, EAMK=100%, EAMU=100%, EAMP=100%
      // (4*100 + 1*100 + 1*100 + 1*100) / 7 / 100 * 10 = 7 / 7 * 10 = 10
      const result = calculateWeeklyScore(100, 100, 100, 100);
      expect(result.score).toBe(10);
    });

    it('should handle partial percentages', () => {
      // EKH=50%, EAMK=75%, EAMU=60%, EAMP=80%
      // (4*50 + 1*75 + 1*60 + 1*80) / 700 * 10 = (200+75+60+80) / 700 * 10 = 415/700*10 = 5.928...
      const result = calculateWeeklyScore(50, 75, 60, 80);
      expect(result.score).toBeCloseTo(5.93, 1);
    });

    it('should return grade based on calculated score', () => {
      const result = calculateWeeklyScore(100, 100, 100, 100);
      expect(result.grade).toBe('A+');
    });

    it('should return E grade for very low scores', () => {
      const result = calculateWeeklyScore(5, 5, 5, 5);
      expect(result.grade).toBe('E');
    });

    it('should return object with both score and grade properties', () => {
      const result = calculateWeeklyScore(80, 80, 80, 80);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('grade');
      expect(typeof result.score).toBe('number');
      expect(typeof result.grade).toBe('string');
    });

    it('should cap percentage values at 100', () => {
      // If implementation caps percentages
      const result = calculateWeeklyScore(150, 150, 150, 150);
      expect(result.score).toBeLessThanOrEqual(10);
    });

    it('should handle zero percentages gracefully', () => {
      const result = calculateWeeklyScore(0, 0, 0, 0);
      expect(result.score).toBe(0);
      expect(isNaN(result.score)).toBe(false);
    });

    it('should produce consistent results for same input', () => {
      const result1 = calculateWeeklyScore(80, 85, 90, 75);
      const result2 = calculateWeeklyScore(80, 85, 90, 75);
      expect(result1.score).toBe(result2.score);
      expect(result1.grade).toBe(result2.grade);
    });
  });
});
