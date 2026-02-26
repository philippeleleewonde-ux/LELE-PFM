import {
  generateScenarios,
  buildPlanFromScenario,
  SCENARIO_COLORS,
  type ScenarioEngineInput,
  type ScenarioId,
} from '@/domain/calculators/savings-scenario-engine';

// ─── Helper: generate stable surplus data ───
function makeSurplus(values: number[]): number[] {
  return values;
}

describe('Savings Scenario Engine', () => {
  // ═══════════════════════════════════════════════
  // 1. generateScenarios — Basic Output Structure
  // ═══════════════════════════════════════════════

  describe('generateScenarios — output structure', () => {
    const input: ScenarioEngineInput = {
      remainingAmount: 120000,
      historicalSurplus: makeSurplus([15000, 12000, 18000, 14000, 16000]),
      currentWeek: 9,
      currentYear: 2026,
    };

    it('should always return exactly 5 scenarios', () => {
      const output = generateScenarios(input);
      expect(output.scenarios).toHaveLength(5);
    });

    it('should return scenarios in correct order: prudent, equilibre, ambitieux, accelere, custom', () => {
      const output = generateScenarios(input);
      const ids = output.scenarios.map((s) => s.id);
      expect(ids).toEqual(['prudent', 'equilibre', 'ambitieux', 'accelere', 'custom']);
    });

    it('should return hasEnoughData=true with >= 4 surplus values', () => {
      const output = generateScenarios(input);
      expect(output.hasEnoughData).toBe(true);
    });

    it('should return hasEnoughData=false with < 4 surplus values', () => {
      const output = generateScenarios({
        ...input,
        historicalSurplus: [10000, 12000, 11000], // only 3
      });
      expect(output.hasEnoughData).toBe(false);
    });

    it('should include surplusStats with all required fields', () => {
      const output = generateScenarios(input);
      expect(output.surplusStats).toHaveProperty('mean');
      expect(output.surplusStats).toHaveProperty('median');
      expect(output.surplusStats).toHaveProperty('stdDev');
      expect(output.surplusStats).toHaveProperty('cv');
      expect(output.surplusStats).toHaveProperty('stability');
      expect(output.surplusStats).toHaveProperty('maxSafePercent');
    });

    it('each scenario should have all required fields', () => {
      const output = generateScenarios(input);
      for (const s of output.scenarios) {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('labelKey');
        expect(s).toHaveProperty('referenceKey');
        expect(s).toHaveProperty('weeklyAmount');
        expect(s).toHaveProperty('surplusPercent');
        expect(s).toHaveProperty('estimatedWeeks');
        expect(s).toHaveProperty('estimatedEndDate');
        expect(s).toHaveProperty('feasibilityScore');
        expect(s).toHaveProperty('riskLevel');
        expect(s).toHaveProperty('isFeasible');
        expect(typeof s.weeklyAmount).toBe('number');
        expect(typeof s.estimatedWeeks).toBe('number');
        expect(typeof s.feasibilityScore).toBe('number');
      }
    });
  });

  // ═══════════════════════════════════════════════
  // 2. Surplus Statistics Calculations
  // ═══════════════════════════════════════════════

  describe('surplus statistics', () => {
    it('should compute mean correctly', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [10000, 20000, 30000, 40000],
        currentWeek: 9,
        currentYear: 2026,
      });
      // Mean of [10000, 20000, 30000, 40000] = 25000
      expect(output.surplusStats.mean).toBe(25000);
    });

    it('should compute median correctly for even count', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [10000, 20000, 30000, 40000],
        currentWeek: 9,
        currentYear: 2026,
      });
      // Median of [10000, 20000, 30000, 40000] = (20000+30000)/2 = 25000
      expect(output.surplusStats.median).toBe(25000);
    });

    it('should compute median correctly for odd count', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [10000, 20000, 30000, 40000, 50000],
        currentWeek: 9,
        currentYear: 2026,
      });
      // Median of sorted [10000, 20000, 30000, 40000, 50000] = 30000
      expect(output.surplusStats.median).toBe(30000);
    });

    it('should filter out zero and negative surplus values', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [10000, 0, -5000, 20000, 30000, 0, 40000],
        currentWeek: 9,
        currentYear: 2026,
      });
      // Positive only: [10000, 20000, 30000, 40000] → mean = 25000
      expect(output.surplusStats.mean).toBe(25000);
    });

    it('should classify stability based on CV (stable < 0.30)', () => {
      // Very low variance → stable
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.surplusStats.stability).toBe('stable');
      expect(output.surplusStats.maxSafePercent).toBe(50);
    });

    it('should classify stability as volatile for high CV (> 0.60)', () => {
      // High variance → volatile
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [5000, 50000, 3000, 45000, 2000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.surplusStats.cv).toBeGreaterThan(0.60);
      expect(output.surplusStats.stability).toBe('volatile');
      expect(output.surplusStats.maxSafePercent).toBe(20);
    });
  });

  // ═══════════════════════════════════════════════
  // 3. Scenario Amounts and Proportions
  // ═══════════════════════════════════════════════

  describe('scenario amounts', () => {
    it('prudent should use 10% of mean surplus', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const prudent = output.scenarios.find((s) => s.id === 'prudent')!;
      // 10% of 20000 = 2000
      expect(prudent.weeklyAmount).toBe(2000);
      expect(prudent.surplusPercent).toBe(10);
    });

    it('equilibre should use 20% of mean surplus', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const equilibre = output.scenarios.find((s) => s.id === 'equilibre')!;
      expect(equilibre.weeklyAmount).toBe(4000);
      expect(equilibre.surplusPercent).toBe(20);
    });

    it('ambitieux should use 35% of mean surplus', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const ambitieux = output.scenarios.find((s) => s.id === 'ambitieux')!;
      expect(ambitieux.weeklyAmount).toBe(7000);
      expect(ambitieux.surplusPercent).toBe(35);
    });

    it('accelere should use 50% of mean surplus', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const accelere = output.scenarios.find((s) => s.id === 'accelere')!;
      expect(accelere.weeklyAmount).toBe(10000);
      expect(accelere.surplusPercent).toBe(50);
    });

    it('custom should use customWeeklyAmount when provided', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
        customWeeklyAmount: 5000,
      });
      const custom = output.scenarios.find((s) => s.id === 'custom')!;
      expect(custom.weeklyAmount).toBe(5000);
    });

    it('custom should default to 20% of mean when no customWeeklyAmount', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const custom = output.scenarios.find((s) => s.id === 'custom')!;
      // 20% of 20000 = 4000
      expect(custom.weeklyAmount).toBe(4000);
    });

    it('higher scenario should have higher weeklyAmount (prudent < equilibre < ambitieux < accelere)', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const p = output.scenarios.find((s) => s.id === 'prudent')!;
      const e = output.scenarios.find((s) => s.id === 'equilibre')!;
      const a = output.scenarios.find((s) => s.id === 'ambitieux')!;
      const ac = output.scenarios.find((s) => s.id === 'accelere')!;
      expect(p.weeklyAmount).toBeLessThan(e.weeklyAmount);
      expect(e.weeklyAmount).toBeLessThan(a.weeklyAmount);
      expect(a.weeklyAmount).toBeLessThan(ac.weeklyAmount);
    });
  });

  // ═══════════════════════════════════════════════
  // 4. Estimated Duration
  // ═══════════════════════════════════════════════

  describe('estimated weeks', () => {
    it('should compute estimatedWeeks = CEIL(remaining / weeklyAmount)', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const prudent = output.scenarios.find((s) => s.id === 'prudent')!;
      // weeklyAmount = 2000, remaining = 100000 → 100000/2000 = 50
      expect(prudent.estimatedWeeks).toBe(50);
    });

    it('higher weekly amount should mean fewer weeks', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const p = output.scenarios.find((s) => s.id === 'prudent')!;
      const ac = output.scenarios.find((s) => s.id === 'accelere')!;
      expect(ac.estimatedWeeks).toBeLessThan(p.estimatedWeeks);
    });

    it('should return estimatedEndDate as ISO date string', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      for (const s of output.scenarios) {
        if (s.estimatedWeeks > 0) {
          expect(s.estimatedEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════
  // 5. Risk Levels
  // ═══════════════════════════════════════════════

  describe('risk levels', () => {
    it('prudent should be low risk', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios.find((s) => s.id === 'prudent')!.riskLevel).toBe('low');
    });

    it('equilibre should be medium risk', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios.find((s) => s.id === 'equilibre')!.riskLevel).toBe('medium');
    });

    it('ambitieux should be high risk', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios.find((s) => s.id === 'ambitieux')!.riskLevel).toBe('high');
    });

    it('accelere should be very_high risk', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios.find((s) => s.id === 'accelere')!.riskLevel).toBe('very_high');
    });

    it('custom risk should depend on surplus percent', () => {
      // Low custom amount → low risk
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
        customWeeklyAmount: 1000, // 5% of 20000 → low
      });
      const custom = output.scenarios.find((s) => s.id === 'custom')!;
      expect(custom.riskLevel).toBe('low');
    });
  });

  // ═══════════════════════════════════════════════
  // 6. Feasibility Scoring (Normal CDF)
  // ═══════════════════════════════════════════════

  describe('feasibility scoring', () => {
    it('feasibility should be 0-100 for all scenarios', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [15000, 12000, 18000, 14000, 16000],
        currentWeek: 9,
        currentYear: 2026,
      });
      for (const s of output.scenarios) {
        expect(s.feasibilityScore).toBeGreaterThanOrEqual(0);
        expect(s.feasibilityScore).toBeLessThanOrEqual(100);
      }
    });

    it('prudent (low amount) should have higher feasibility than accelere (high amount)', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [15000, 12000, 18000, 14000, 16000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const p = output.scenarios.find((s) => s.id === 'prudent')!;
      const ac = output.scenarios.find((s) => s.id === 'accelere')!;
      expect(p.feasibilityScore).toBeGreaterThanOrEqual(ac.feasibilityScore);
    });

    it('beginner mode (< 4 weeks) should cap feasibility at 50', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [15000, 12000, 18000], // only 3 weeks
        currentWeek: 9,
        currentYear: 2026,
      });
      for (const s of output.scenarios) {
        expect(s.feasibilityScore).toBeLessThanOrEqual(50);
      }
    });

    it('perfect stability (stdDev=0) should give 100 feasibility for amounts <= mean', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const p = output.scenarios.find((s) => s.id === 'prudent')!;
      // stdDev is 0, weeklyAmount (2000) <= mean (20000) → should be 100
      expect(p.feasibilityScore).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════
  // 7. Fallback Mode (No Historical Data)
  // ═══════════════════════════════════════════════

  describe('fallback mode — no surplus data', () => {
    it('should still return 5 scenarios with no historical surplus', () => {
      const output = generateScenarios({
        remainingAmount: 120000,
        historicalSurplus: [],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios).toHaveLength(5);
      expect(output.hasEnoughData).toBe(false);
    });

    it('should use fallback mean based on remainingAmount', () => {
      const output = generateScenarios({
        remainingAmount: 120000,
        historicalSurplus: [],
        currentWeek: 9,
        currentYear: 2026,
      });
      // Fallback mean = 120000 / 12 = 10000
      expect(output.surplusStats.mean).toBe(10000);
    });

    it('should calculate scenario amounts from fallback mean', () => {
      const output = generateScenarios({
        remainingAmount: 120000,
        historicalSurplus: [],
        currentWeek: 9,
        currentYear: 2026,
      });
      const prudent = output.scenarios.find((s) => s.id === 'prudent')!;
      // 10% of 10000 = 1000
      expect(prudent.weeklyAmount).toBe(1000);
    });

    it('should handle all-zero surplus values', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [0, 0, 0, 0, 0],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios).toHaveLength(5);
      expect(output.hasEnoughData).toBe(false);
    });

    it('should handle all-negative surplus values', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [-1000, -2000, -3000, -4000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios).toHaveLength(5);
      expect(output.hasEnoughData).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════
  // 8. isFeasible Flag
  // ═══════════════════════════════════════════════

  describe('isFeasible flag', () => {
    it('should be true when surplusPercent <= maxSafePercent and amount <= 80% of mean', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000, 20000], // stable → maxSafe=50%
        currentWeek: 9,
        currentYear: 2026,
      });
      const prudent = output.scenarios.find((s) => s.id === 'prudent')!;
      // 10% <= 50% && 2000 <= 20000*0.8=16000 → true
      expect(prudent.isFeasible).toBe(true);
    });

    it('should be false for accelere in volatile surplus', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [5000, 50000, 3000, 45000, 2000], // volatile → maxSafe=20%
        currentWeek: 9,
        currentYear: 2026,
      });
      const accelere = output.scenarios.find((s) => s.id === 'accelere')!;
      // 50% > 20% → false
      expect(accelere.isFeasible).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════
  // 9. buildPlanFromScenario
  // ═══════════════════════════════════════════════

  describe('buildPlanFromScenario', () => {
    it('should create a plan with correct fields', () => {
      const output = generateScenarios({
        remainingAmount: 120000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const scenario = output.scenarios.find((s) => s.id === 'equilibre')!;
      const plan = buildPlanFromScenario(scenario, 120000, 9, 2026);

      expect(plan.scenarioId).toBe('equilibre');
      expect(plan.weeklyAmount).toBe(scenario.weeklyAmount);
      expect(plan.startWeek).toBe(9);
      expect(plan.startYear).toBe(2026);
      expect(plan.estimatedWeeks).toBe(scenario.estimatedWeeks);
      expect(plan.totalPlanned).toBe(scenario.weeklyAmount * scenario.estimatedWeeks);
      expect(plan.feasibilityScore).toBe(scenario.feasibilityScore);
      expect(plan.status).toBe('active');
      expect(plan.weeksExecuted).toBe(0);
      expect(plan.planContributions).toBe(0);
      expect(plan.extraContributions).toBe(0);
    });

    it('should have a valid createdAt ISO string', () => {
      const output = generateScenarios({
        remainingAmount: 120000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const scenario = output.scenarios[0];
      const plan = buildPlanFromScenario(scenario, 120000, 9, 2026);
      expect(new Date(plan.createdAt).toISOString()).toBe(plan.createdAt);
    });

    it('totalPlanned should equal weeklyAmount * estimatedWeeks', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      for (const scenario of output.scenarios) {
        if (scenario.weeklyAmount > 0) {
          const plan = buildPlanFromScenario(scenario, 100000, 9, 2026);
          expect(plan.totalPlanned).toBe(plan.weeklyAmount * plan.estimatedWeeks);
        }
      }
    });

    it('estimatedEndWeek and estimatedEndYear should be in the future', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      const scenario = output.scenarios.find((s) => s.id === 'prudent')!;
      const plan = buildPlanFromScenario(scenario, 100000, 9, 2026);
      // With 50 weeks from week 9/2026, should extend into the future
      const endYearWeek = plan.estimatedEndYear * 100 + plan.estimatedEndWeek;
      const startYearWeek = 2026 * 100 + 9;
      expect(endYearWeek).toBeGreaterThan(startYearWeek);
    });
  });

  // ═══════════════════════════════════════════════
  // 10. SCENARIO_COLORS
  // ═══════════════════════════════════════════════

  describe('SCENARIO_COLORS', () => {
    it('should have a color for each scenario ID', () => {
      const ids: ScenarioId[] = ['prudent', 'equilibre', 'ambitieux', 'accelere', 'custom'];
      for (const id of ids) {
        expect(SCENARIO_COLORS[id]).toBeDefined();
        expect(typeof SCENARIO_COLORS[id]).toBe('string');
        expect(SCENARIO_COLORS[id]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  // ═══════════════════════════════════════════════
  // 11. Edge Cases and Determinism
  // ═══════════════════════════════════════════════

  describe('edge cases', () => {
    it('should handle remainingAmount = 0', () => {
      const output = generateScenarios({
        remainingAmount: 0,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios).toHaveLength(5);
      // All estimatedWeeks should be 0 since remaining is 0
      for (const s of output.scenarios) {
        expect(s.estimatedWeeks).toBe(0);
      }
    });

    it('should handle very large remainingAmount', () => {
      const output = generateScenarios({
        remainingAmount: 10000000,
        historicalSurplus: [20000, 20000, 20000, 20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios).toHaveLength(5);
      const prudent = output.scenarios.find((s) => s.id === 'prudent')!;
      // 10000000 / 2000 = 5000 weeks
      expect(prudent.estimatedWeeks).toBe(5000);
    });

    it('should produce deterministic results for same input', () => {
      const input: ScenarioEngineInput = {
        remainingAmount: 120000,
        historicalSurplus: [15000, 12000, 18000, 14000, 16000],
        currentWeek: 9,
        currentYear: 2026,
      };
      const output1 = generateScenarios(input);
      const output2 = generateScenarios(input);

      expect(output1.scenarios.map((s) => s.weeklyAmount))
        .toEqual(output2.scenarios.map((s) => s.weeklyAmount));
      expect(output1.scenarios.map((s) => s.feasibilityScore))
        .toEqual(output2.scenarios.map((s) => s.feasibilityScore));
      expect(output1.surplusStats).toEqual(output2.surplusStats);
    });

    it('should handle single surplus value', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000],
        currentWeek: 9,
        currentYear: 2026,
      });
      expect(output.scenarios).toHaveLength(5);
      expect(output.hasEnoughData).toBe(false);
    });

    it('should handle mixed positive/negative/zero surplus', () => {
      const output = generateScenarios({
        remainingAmount: 100000,
        historicalSurplus: [20000, -5000, 0, 15000, -2000, 25000, 0, 18000],
        currentWeek: 9,
        currentYear: 2026,
      });
      // Positive: [20000, 15000, 25000, 18000] → 4 values, hasEnoughData=true
      expect(output.hasEnoughData).toBe(true);
      expect(output.surplusStats.mean).toBe(19500); // (20000+15000+25000+18000)/4
    });
  });
});
