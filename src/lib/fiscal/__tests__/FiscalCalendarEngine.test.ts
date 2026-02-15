import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FiscalCalendarEngine,
  type FiscalPeriod,
  type CurrentPeriodInfo,
  type PeriodType,
} from '../FiscalCalendarEngine';

// Mock Supabase client (requis car importé dans le module)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
          lte: vi.fn(() => ({
            gte: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      })),
    })),
  },
}));

// ============================================
// TESTS FISCALCALENDARENGINE
// ============================================

describe('FiscalCalendarEngine', () => {
  // =====================
  // getCurrentPeriod()
  // =====================
  describe('getCurrentPeriod()', () => {
    it('should return correct year', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2026 });
      const period = engine.getCurrentPeriod();
      expect(period.year).toBe(new Date().getFullYear());
    });

    it('should return month between 1 and 12', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      expect(period.month).toBeGreaterThanOrEqual(1);
      expect(period.month).toBeLessThanOrEqual(12);
    });

    it('should return quarter between 1 and 4', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      expect(period.quarter).toBeGreaterThanOrEqual(1);
      expect(period.quarter).toBeLessThanOrEqual(4);
    });

    it('should return week between 1 and 53', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      expect(period.week).toBeGreaterThanOrEqual(1);
      expect(period.week).toBeLessThanOrEqual(53);
    });

    it('should return dayOfYear between 1 and 366', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      expect(period.dayOfYear).toBeGreaterThanOrEqual(1);
      expect(period.dayOfYear).toBeLessThanOrEqual(366);
    });

    it('should have exactly one isQ flag true', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      const qFlags = [period.isQ1, period.isQ2, period.isQ3, period.isQ4];
      expect(qFlags.filter(Boolean).length).toBe(1);
    });

    it('should set isQ1 true when quarter is 1', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      if (period.quarter === 1) {
        expect(period.isQ1).toBe(true);
        expect(period.isQ2).toBe(false);
        expect(period.isQ3).toBe(false);
        expect(period.isQ4).toBe(false);
      }
    });

    it('should calculate yearOffset relative to baseYear', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2024 });
      const period = engine.getCurrentPeriod();
      expect(period.yearOffset).toBe(new Date().getFullYear() - 2024);
    });

    it('should have yearOffset 0 when baseYear is current year', () => {
      const engine = new FiscalCalendarEngine({ baseYear: new Date().getFullYear() });
      const period = engine.getCurrentPeriod();
      expect(period.yearOffset).toBe(0);
    });

    it('should correctly map month to quarter (Q1: Jan-Mar)', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      const expectedQuarter = Math.ceil(period.month / 3);
      expect(period.quarter).toBe(expectedQuarter);
    });
  });

  // =====================
  // isInCurrentPeriod()
  // =====================
  describe('isInCurrentPeriod()', () => {
    it('should return true for today with YEAR period', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.isInCurrentPeriod(new Date(), 'YEAR')).toBe(true);
    });

    it('should return true for today with MONTH period', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.isInCurrentPeriod(new Date(), 'MONTH')).toBe(true);
    });

    it('should return true for today with QUARTER period', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.isInCurrentPeriod(new Date(), 'QUARTER')).toBe(true);
    });

    it('should return true for today with WEEK period', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.isInCurrentPeriod(new Date(), 'WEEK')).toBe(true);
    });

    it('should return false for a date in a different year with YEAR period', () => {
      const engine = new FiscalCalendarEngine();
      const pastDate = new Date(2020, 0, 1);
      expect(engine.isInCurrentPeriod(pastDate, 'YEAR')).toBe(false);
    });

    it('should return false for a date in a different month with MONTH period', () => {
      const engine = new FiscalCalendarEngine();
      const today = new Date();
      const differentMonth = new Date(today.getFullYear(), (today.getMonth() + 6) % 12, 1);
      // Only test if the different month isn't the same as current
      if (differentMonth.getMonth() !== today.getMonth()) {
        expect(engine.isInCurrentPeriod(differentMonth, 'MONTH')).toBe(false);
      }
    });

    it('should return false for unknown period type', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.isInCurrentPeriod(new Date(), 'UNKNOWN' as PeriodType)).toBe(false);
    });
  });

  // =====================
  // generateFiscalCalendar()
  // =====================
  describe('generateFiscalCalendar()', () => {
    const companyId = 'company-test-123';

    it('should generate periods for 3 years (N+1 to N+3)', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      // Without weeks: 3 years × (1 year + 4 quarters + 12 months) = 3 × 17 = 51
      expect(periods.length).toBe(51);
    });

    it('should have correct year offsets (1, 2, 3)', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const offsets = [...new Set(periods.map(p => p.yearOffset))];
      expect(offsets.sort()).toEqual([1, 2, 3]);
    });

    it('should generate exactly 1 YEAR period per year', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const yearPeriods = periods.filter(p => p.periodType === 'YEAR');
      expect(yearPeriods.length).toBe(3);
    });

    it('should generate exactly 4 QUARTER periods per year', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const quarterPeriods = periods.filter(p => p.periodType === 'QUARTER');
      expect(quarterPeriods.length).toBe(12); // 3 years × 4 quarters
    });

    it('should generate exactly 12 MONTH periods per year', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const monthPeriods = periods.filter(p => p.periodType === 'MONTH');
      expect(monthPeriods.length).toBe(36); // 3 years × 12 months
    });

    it('should NOT generate WEEK periods when includeWeeks is false', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const weekPeriods = periods.filter(p => p.periodType === 'WEEK');
      expect(weekPeriods.length).toBe(0);
    });

    it('should generate 52 or 53 WEEK periods per year when includeWeeks is true', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: true });
      const periods = engine.generateFiscalCalendar(companyId);

      const weekPeriods = periods.filter(p => p.periodType === 'WEEK');
      // Each year should have 52 or 53 weeks, total across 3 years
      expect(weekPeriods.length).toBeGreaterThanOrEqual(52 * 3); // at least 156
      expect(weekPeriods.length).toBeLessThanOrEqual(53 * 3); // at most 159
    });

    it('should generate correct fiscal years based on baseYear', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const years = [...new Set(periods.map(p => p.fiscalYear))];
      expect(years.sort()).toEqual([2026, 2027, 2028]);
    });

    it('should set correct companyId on all periods', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      periods.forEach(p => {
        expect(p.companyId).toBe(companyId);
      });
    });

    it('should create YEAR period with Jan 1 to Dec 31 dates', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const yearPeriod2026 = periods.find(p => p.periodType === 'YEAR' && p.fiscalYear === 2026);
      expect(yearPeriod2026).toBeDefined();
      expect(yearPeriod2026!.startDate.getMonth()).toBe(0); // January
      expect(yearPeriod2026!.startDate.getDate()).toBe(1);
      expect(yearPeriod2026!.endDate.getMonth()).toBe(11); // December
      expect(yearPeriod2026!.endDate.getDate()).toBe(31);
    });

    it('should create correct Q1 period (Jan 1 to Mar 31)', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const q1_2026 = periods.find(
        p => p.periodType === 'QUARTER' && p.fiscalYear === 2026 && p.periodNumber === 1
      );
      expect(q1_2026).toBeDefined();
      expect(q1_2026!.startDate.getMonth()).toBe(0); // January
      expect(q1_2026!.endDate.getMonth()).toBe(2); // March
      expect(q1_2026!.endDate.getDate()).toBe(31);
    });

    it('should create correct Q2 period (Apr 1 to Jun 30)', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const q2_2026 = periods.find(
        p => p.periodType === 'QUARTER' && p.fiscalYear === 2026 && p.periodNumber === 2
      );
      expect(q2_2026).toBeDefined();
      expect(q2_2026!.startDate.getMonth()).toBe(3); // April
      expect(q2_2026!.endDate.getMonth()).toBe(5); // June
      expect(q2_2026!.endDate.getDate()).toBe(30);
    });

    it('should create month periods with correct last day', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      // February 2028 (leap year)
      const feb2028 = periods.find(
        p => p.periodType === 'MONTH' && p.fiscalYear === 2028 && p.periodNumber === 2
      );
      expect(feb2028).toBeDefined();
      expect(feb2028!.endDate.getDate()).toBe(29); // 2028 is a leap year

      // February 2026 (non-leap year)
      const feb2026 = periods.find(
        p => p.periodType === 'MONTH' && p.fiscalYear === 2026 && p.periodNumber === 2
      );
      expect(feb2026).toBeDefined();
      expect(feb2026!.endDate.getDate()).toBe(28); // 2026 is NOT a leap year
    });

    it('should have correct period labels for months (French)', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const jan2026 = periods.find(
        p => p.periodType === 'MONTH' && p.fiscalYear === 2026 && p.periodNumber === 1
      );
      expect(jan2026!.periodLabel).toBe('Jan 2026');

      const dec2027 = periods.find(
        p => p.periodType === 'MONTH' && p.fiscalYear === 2027 && p.periodNumber === 12
      );
      expect(dec2027!.periodLabel).toBe('Déc 2027');
    });

    it('should have correct period labels for quarters', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const q3_2027 = periods.find(
        p => p.periodType === 'QUARTER' && p.fiscalYear === 2027 && p.periodNumber === 3
      );
      expect(q3_2027!.periodLabel).toBe('Q3 2027');
    });

    it('should have correct period labels for year', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar(companyId);

      const year2026 = periods.find(p => p.periodType === 'YEAR' && p.fiscalYear === 2026);
      expect(year2026!.periodLabel).toBe('2026 (N+1)');
    });

    it('should have correct period labels for weeks (zero-padded)', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: true });
      const periods = engine.generateFiscalCalendar(companyId);

      const w1_2026 = periods.find(
        p => p.periodType === 'WEEK' && p.fiscalYear === 2026 && p.periodNumber === 1
      );
      expect(w1_2026!.periodLabel).toBe('S01 2026');

      const w10_2026 = periods.find(
        p => p.periodType === 'WEEK' && p.fiscalYear === 2026 && p.periodNumber === 10
      );
      expect(w10_2026!.periodLabel).toBe('S10 2026');
    });
  });

  // =====================
  // distributeAnnualValue()
  // =====================
  describe('distributeAnnualValue()', () => {
    it('should return 1 period for YEAR', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeAnnualValue(120000, 'YEAR');
      expect(result.length).toBe(1);
      expect(result[0].value).toBe(120000);
    });

    it('should return 4 equal periods for QUARTER', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeAnnualValue(120000, 'QUARTER');
      expect(result.length).toBe(4);
      result.forEach(r => {
        expect(r.value).toBe(30000);
      });
    });

    it('should return 12 equal periods for MONTH', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeAnnualValue(120000, 'MONTH');
      expect(result.length).toBe(12);
      result.forEach(r => {
        expect(r.value).toBe(10000);
      });
    });

    it('should return 52 equal periods for WEEK', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeAnnualValue(52000, 'WEEK');
      expect(result.length).toBe(52);
      result.forEach(r => {
        expect(r.value).toBeCloseTo(1000, 2);
      });
    });

    it('should have period numbers starting at 1', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeAnnualValue(120000, 'QUARTER');
      expect(result[0].periodNumber).toBe(1);
      expect(result[3].periodNumber).toBe(4);
    });

    it('should sum distributed values to equal annual value (MONTH)', () => {
      const engine = new FiscalCalendarEngine();
      const annualValue = 99999;
      const result = engine.distributeAnnualValue(annualValue, 'MONTH');
      const total = result.reduce((sum, r) => sum + r.value, 0);
      expect(total).toBeCloseTo(annualValue, 5);
    });

    it('should sum distributed values to equal annual value (WEEK)', () => {
      const engine = new FiscalCalendarEngine();
      const annualValue = 100000;
      const result = engine.distributeAnnualValue(annualValue, 'WEEK');
      const total = result.reduce((sum, r) => sum + r.value, 0);
      expect(total).toBeCloseTo(annualValue, 5);
    });

    it('should handle zero annual value', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeAnnualValue(0, 'QUARTER');
      expect(result.length).toBe(4);
      result.forEach(r => expect(r.value).toBe(0));
    });

    it('should handle negative annual value', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeAnnualValue(-120000, 'QUARTER');
      expect(result.length).toBe(4);
      result.forEach(r => expect(r.value).toBe(-30000));
    });
  });

  // =====================
  // distributeWithWeights()
  // =====================
  describe('distributeWithWeights()', () => {
    it('should distribute proportionally to weights', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeWithWeights(100, [25, 25, 25, 25]);
      expect(result).toEqual([25, 25, 25, 25]);
    });

    it('should handle unequal weights', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeWithWeights(100, [50, 30, 20]);
      expect(result[0]).toBeCloseTo(50, 5);
      expect(result[1]).toBeCloseTo(30, 5);
      expect(result[2]).toBeCloseTo(20, 5);
    });

    it('should normalize weights that do not sum to 100', () => {
      const engine = new FiscalCalendarEngine();
      const result = engine.distributeWithWeights(100, [1, 1, 1, 1]);
      // Each weight is 1/4 of total weight 4, so each gets 25
      result.forEach(r => expect(r).toBeCloseTo(25, 5));
    });

    it('should sum distributed values to equal annual value', () => {
      const engine = new FiscalCalendarEngine();
      const annualValue = 50000;
      const result = engine.distributeWithWeights(annualValue, [40, 30, 20, 10]);
      const total = result.reduce((sum, r) => sum + r, 0);
      expect(total).toBeCloseTo(annualValue, 5);
    });
  });

  // =====================
  // getValueForPeriod()
  // =====================
  describe('getValueForPeriod()', () => {
    it('should return full value for YEAR', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.getValueForPeriod(120000, 'YEAR', 1)).toBe(120000);
    });

    it('should return 1/4 for QUARTER', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.getValueForPeriod(120000, 'QUARTER', 2)).toBe(30000);
    });

    it('should return 1/12 for MONTH', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.getValueForPeriod(120000, 'MONTH', 6)).toBe(10000);
    });

    it('should return 1/52 for WEEK', () => {
      const engine = new FiscalCalendarEngine();
      expect(engine.getValueForPeriod(52000, 'WEEK', 1)).toBeCloseTo(1000, 2);
    });
  });

  // =====================
  // getDaysRemainingInPeriod()
  // =====================
  describe('getDaysRemainingInPeriod()', () => {
    it('should return non-negative days for YEAR', () => {
      const engine = new FiscalCalendarEngine();
      const days = engine.getDaysRemainingInPeriod('YEAR');
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(366);
    });

    it('should return non-negative days for QUARTER', () => {
      const engine = new FiscalCalendarEngine();
      const days = engine.getDaysRemainingInPeriod('QUARTER');
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(92);
    });

    it('should return non-negative days for MONTH', () => {
      const engine = new FiscalCalendarEngine();
      const days = engine.getDaysRemainingInPeriod('MONTH');
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(31);
    });
  });

  // =====================
  // formatDate()
  // =====================
  describe('formatDate()', () => {
    it('should format date in medium format by default', () => {
      const engine = new FiscalCalendarEngine();
      const date = new Date(2026, 0, 15);
      const formatted = engine.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format date in short format', () => {
      const engine = new FiscalCalendarEngine();
      const date = new Date(2026, 5, 1);
      const formatted = engine.formatDate(date, 'short');
      expect(formatted).toBeTruthy();
    });

    it('should format date in long format', () => {
      const engine = new FiscalCalendarEngine();
      const date = new Date(2026, 11, 25);
      const formatted = engine.formatDate(date, 'long');
      expect(formatted).toBeTruthy();
    });
  });

  // =====================
  // Constructor defaults
  // =====================
  describe('constructor defaults', () => {
    it('should default baseYear to current year', () => {
      const engine = new FiscalCalendarEngine();
      const period = engine.getCurrentPeriod();
      expect(period.yearOffset).toBe(0);
    });

    it('should default includeWeeks to false', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025 });
      const periods = engine.generateFiscalCalendar('test');
      const weekPeriods = periods.filter(p => p.periodType === 'WEEK');
      expect(weekPeriods.length).toBe(0);
    });
  });

  // =====================
  // Edge cases: Leap year handling
  // =====================
  describe('leap year handling', () => {
    it('should handle leap year 2028 correctly in calendar generation', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: false });
      const periods = engine.generateFiscalCalendar('test');

      const feb2028 = periods.find(
        p => p.periodType === 'MONTH' && p.fiscalYear === 2028 && p.periodNumber === 2
      );
      expect(feb2028).toBeDefined();
      // Feb 2028 should end on 29th (leap year)
      expect(feb2028!.endDate.getDate()).toBe(29);
    });

    it('should handle non-leap year correctly', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2024, includeWeeks: false });
      const periods = engine.generateFiscalCalendar('test');

      const feb2025 = periods.find(
        p => p.periodType === 'MONTH' && p.fiscalYear === 2025 && p.periodNumber === 2
      );
      expect(feb2025).toBeDefined();
      // Feb 2025 should end on 28th (non-leap year)
      expect(feb2025!.endDate.getDate()).toBe(28);
    });
  });

  // =====================
  // Week count per year (BUG target: should be 52 or 53, not 50)
  // =====================
  describe('weeks per year validation', () => {
    it('should generate at least 52 weeks for year 2026', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: true });
      const periods = engine.generateFiscalCalendar('test');

      const weeks2026 = periods.filter(
        p => p.periodType === 'WEEK' && p.fiscalYear === 2026
      );
      expect(weeks2026.length).toBeGreaterThanOrEqual(52);
    });

    it('should generate at least 52 weeks for year 2027', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: true });
      const periods = engine.generateFiscalCalendar('test');

      const weeks2027 = periods.filter(
        p => p.periodType === 'WEEK' && p.fiscalYear === 2027
      );
      expect(weeks2027.length).toBeGreaterThanOrEqual(52);
    });

    it('should generate at least 52 weeks for year 2028', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: true });
      const periods = engine.generateFiscalCalendar('test');

      const weeks2028 = periods.filter(
        p => p.periodType === 'WEEK' && p.fiscalYear === 2028
      );
      expect(weeks2028.length).toBeGreaterThanOrEqual(52);
    });

    it('should never generate more than 53 weeks per year', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: true });
      const periods = engine.generateFiscalCalendar('test');

      for (const year of [2026, 2027, 2028]) {
        const weeksForYear = periods.filter(
          p => p.periodType === 'WEEK' && p.fiscalYear === year
        );
        expect(weeksForYear.length).toBeLessThanOrEqual(53);
      }
    });

    it('should have sequential week numbers from 1 to N', () => {
      const engine = new FiscalCalendarEngine({ baseYear: 2025, includeWeeks: true });
      const periods = engine.generateFiscalCalendar('test');

      const weeks2026 = periods
        .filter(p => p.periodType === 'WEEK' && p.fiscalYear === 2026)
        .map(p => p.periodNumber)
        .sort((a, b) => a - b);

      expect(weeks2026[0]).toBe(1);
      // Each number should be consecutive
      for (let i = 1; i < weeks2026.length; i++) {
        expect(weeks2026[i]).toBe(weeks2026[i - 1] + 1);
      }
    });
  });
});
