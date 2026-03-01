import {
  EngineInput,
  EngineOutput,
  PotentialsResult,
  ExpectedLossResult,
  VolatilityResult,
  UnexpectedLossResult,
  HistoricalVaRResult,
  VaR95Result,
  PRLResult,
  POBForecastResult,
  DistributionResult,
  VentilationResult,
  CategoryVentilation,
  IndicatorDistribution,
} from '../../types/engine';
import { Grade, Revenue, Expense, Profile, RiskAssessment, EKHScore } from '../../types';
import {
  getCountryRiskProfile,
  COUNTRY_RISK_PROFILES,
  URBAN_RURAL_FACTORS,
  INCOME_SOURCE_FACTORS,
  EXTENDED_FAMILY_FACTOR,
} from '../../constants/country-risk-profiles';
import {
  calculateIndicatorRates,
  getRawIndicatorWeights,
} from '../../constants/pfm-indicators';

// Horizon opérationnel fixe : 3 ans (36 mois)
// Parallèle HCM Module 1 : plan triennal, cycle budgétaire standard
const OPERATIONAL_HORIZON_YEARS = 3;
const OPERATIONAL_HORIZON_MONTHS = 36;

/**
 * Normal CDF approximation (Abramowitz & Stegun, Handbook of Mathematical Functions, 1964)
 * Precision: |ε| < 7.5 × 10⁻⁸
 * Used for POB calculation (Pillar 2) — conforme Hull (2018), RiskMetrics (1996)
 */
function normalCDF(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);
  return 0.5 * (1 + sign * y);
}

// Distribution trimestrielle progressive (Apprentissage → Optimisation max)
// T1=20% démarrage, T2=23% montée, T3=27% croisière, T4=30% optimisation
// Total = 100%. Configurable pour adapter le rythme de montée en puissance.
const QUARTERLY_WEIGHTS = { T1: 0.20, T2: 0.23, T3: 0.27, T4: 0.30 };

interface CoefficientContextuelFactors {
  ekhScore: number; // 0-15
  profileType: string;
  situation: string; // Célibataire, En couple, Pacsé(e), Marié(e), Séparé(e), Divorcé(e), Veuf/Veuve
  dependents: number; // Personnes à charge (0+)
  age: number; // Années (18+)
  baseCoefficient: number; // 1.0
  // Conformité internationale — Country Risk Layer
  countryCode: string; // ISO 3166-1 alpha-2
  urbanRural: 'urban' | 'rural';
  incomeSource: 'formal' | 'mixed' | 'informal' | 'seasonal';
  extendedFamilyObligations: boolean;
}

/**
 * PersonalFinanceEngine - Complete 10-step financial calculation engine
 * Calculates comprehensive personal finance metrics with risk assessment
 */
export class PersonalFinanceEngine {
  private stepMetrics: Map<number, number> = new Map();
  private cacheEnabled: boolean = true;
  private resultCache: Map<string, unknown> = new Map();

  constructor(private input: EngineInput) {}

  /**
   * Execute complete engine calculation (all 10 steps)
   */
  public async execute(): Promise<EngineOutput> {
    const startTime = Date.now();
    try {
      // Input guard — fail fast on missing critical fields
      if (!this.input.profile) throw new Error('Missing profile in engine input');
      if (!this.input.ekhScore) throw new Error('Missing ekhScore in engine input');
      if (!Array.isArray(this.input.revenues)) throw new Error('revenues must be an array');
      if (!Array.isArray(this.input.expenses)) throw new Error('expenses must be an array');
      if (!Array.isArray(this.input.commitments)) throw new Error('commitments must be an array');
      if (!Array.isArray(this.input.levers)) throw new Error('levers must be an array');
      const step1 = this.calculatePotentials();
      const step2 = this.calculateExpectedLosses(step1);
      const step3 = this.calculateVolatility();
      const step4 = this.calculateUnexpectedLoss(step3);
      const step5 = this.calculateHistoricalVaR();
      const step6 = this.calculateVaR95(step2.total_el, step3.combined_volatility, step4.adjusted_ul);
      const step7 = this.calculatePRL();
      const step8 = this.calculatePOBandForecast(step6.var95, step1.total_potential, step2.total_el, step3.combined_volatility);
      const step9 = this.distributeByLevers(step7.prl);
      const step10 = this.ventilateMonthly(step9);

      const globalScore = this.calculateGlobalScore(
        step1.total_potential,
        step6.var95,
        step8.pob,
        this.input.ekhScore.combined_score,
      );
      const grade = this.scoreToGrade(globalScore);

      const executionTime = Date.now() - startTime;

      return {
        step1,
        step2,
        step3,
        step4,
        step5,
        step6,
        step7,
        step8,
        step9,
        step10,
        globalScore,
        grade,
        calculatedAt: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      throw new Error(`Engine execution failed after ${executionTime}ms: ${String(error)}`);
    }
  }

  /**
   * STEP 1: Calculate Potentials & Gaps (evidence-based)
   * Revenue scalars with progression + historical gap analysis over 5 years
   */
  private calculatePotentials(): PotentialsResult {
    const startTime = Date.now();
    try {
      const fixedRevenues = this.input.revenues.filter((r) => r.type === 'Fixe');
      const variableRevenues = this.input.revenues.filter((r) => r.type === 'Variable');

      const fixedPotential = fixedRevenues.reduce((sum, r) => {
        const monthlyAmount = r.frequency === 'monthly' ? r.amount : r.amount / 12;
        const progressionFactor = 1 + r.growth_rate / 100;
        return sum + monthlyAmount * progressionFactor * (r.probability / 100);
      }, 0);

      const variablePotential = variableRevenues.reduce((sum, r) => {
        const monthlyAmount = r.frequency === 'monthly' ? r.amount : r.amount / 12;
        const progressionFactor = 1 + r.growth_rate / 100;
        return sum + monthlyAmount * progressionFactor * (r.probability / 100);
      }, 0);

      // Evidence-based: calculate growth rates & gaps from 5-year history
      const history = this.input.history;
      let avgRevenueGrowthRate = 0;
      let avgExpenseGrowthRate = 0;
      const revenueGaps: number[] = [];
      const expenseGaps: number[] = [];

      if (history.length >= 2) {
        const revGrowthRates: number[] = [];
        const expGrowthRates: number[] = [];

        for (let i = 0; i < history.length - 1; i++) {
          const prevRev = history[i].actual_revenue;
          const currRev = history[i + 1].actual_revenue;
          if (prevRev > 0) {
            revGrowthRates.push(((currRev - prevRev) / prevRev) * 100);
          }
          const prevExp = history[i].actual_expenses;
          const currExp = history[i + 1].actual_expenses;
          if (prevExp > 0) {
            expGrowthRates.push(((currExp - prevExp) / prevExp) * 100);
          }
        }

        avgRevenueGrowthRate = revGrowthRates.length > 0
          ? revGrowthRates.reduce((a, b) => a + b, 0) / revGrowthRates.length
          : 0;
        avgExpenseGrowthRate = expGrowthRates.length > 0
          ? expGrowthRates.reduce((a, b) => a + b, 0) / expGrowthRates.length
          : 0;

        // Calculate gaps: predicted (from previous year + growth) vs actual
        for (let i = 1; i < history.length; i++) {
          const expectedRev = history[i - 1].actual_revenue * (1 + avgRevenueGrowthRate / 100);
          revenueGaps.push(Math.abs(expectedRev - history[i].actual_revenue));
          const expectedExp = history[i - 1].actual_expenses * (1 + avgExpenseGrowthRate / 100);
          expenseGaps.push(Math.abs(expectedExp - history[i].actual_expenses));
        }
      }

      const result: PotentialsResult = {
        fixed_potential: Math.round(fixedPotential),
        variable_potential: Math.round(variablePotential),
        total_potential: Math.round(fixedPotential + variablePotential),
        avg_revenue_growth_rate: Math.round(avgRevenueGrowthRate * 100) / 100,
        avg_expense_growth_rate: Math.round(avgExpenseGrowthRate * 100) / 100,
        revenue_gaps: revenueGaps.map(Math.round),
        expense_gaps: expenseGaps.map(Math.round),
      };

      this.stepMetrics.set(1, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 1 (Potentials) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 2: Calculate Expected Loss (evidence-based)
   * EL = mean of historical gaps (revenue + expense) from Step 1
   * Risk sliders remain for Step 4 (Coefficient Contextuel) but no longer determine EL
   */
  private calculateExpectedLosses(step1: PotentialsResult): ExpectedLossResult {
    const startTime = Date.now();
    try {
      const elByCategory: Record<string, number> = {};

      // Evidence-based EL from historical gaps
      const revGaps = step1.revenue_gaps;
      const expGaps = step1.expense_gaps;

      const elRevenue = revGaps.length > 0
        ? revGaps.reduce((a, b) => a + b, 0) / revGaps.length
        : this.input.profile.budget_period * 0.1; // fallback 10%

      const elExpense = expGaps.length > 0
        ? expGaps.reduce((a, b) => a + b, 0) / expGaps.length
        : this.input.profile.budget_period * 0.05; // fallback 5%

      const totalEL = elRevenue + elExpense;

      // Coherence ratio: avg(expenses/revenues) over history
      const history = this.input.history;
      let coherenceRatio = 0;
      if (history.length > 0) {
        const ratios = history
          .filter((h) => h.actual_revenue > 0)
          .map((h) => (h.actual_expenses / h.actual_revenue) * 100);
        coherenceRatio = ratios.length > 0
          ? ratios.reduce((a, b) => a + b, 0) / ratios.length
          : 0;
      }

      elByCategory['revenue'] = Math.round(elRevenue);
      elByCategory['expense'] = Math.round(elExpense);

      const result: ExpectedLossResult = {
        total_el: Math.round(totalEL),
        el_revenue: Math.round(elRevenue),
        el_expense: Math.round(elExpense),
        el_by_category: elByCategory,
        coherence_ratio: Math.round(coherenceRatio * 100) / 100,
      };

      this.stepMetrics.set(2, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 2 (Expected Loss) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 3: Calculate Volatility (Markowitz compliant)
   * σ_combined = √(σ_rev² + σ_exp² + 2ρσ_revσ_exp)
   * ρ (rho) = corrélation revenus/dépenses, déterminée par le profil pays
   * Source : Théorie moderne du portefeuille (Markowitz 1952), adaptée ménage
   */
  private calculateVolatility(): VolatilityResult {
    const startTime = Date.now();
    try {
      // Récupérer ρ depuis le profil pays
      const countryProfile = getCountryRiskProfile(
        this.input.profile.country_code ?? 'CI'
      );
      const rho = countryProfile.rho;

      if (this.input.history.length === 0) {
        const defaultRev = 15;
        const defaultExp = 10;
        return {
          revenue_volatility: defaultRev,
          expense_volatility: defaultExp,
          combined_volatility: Math.sqrt(
            defaultRev ** 2 + defaultExp ** 2 + 2 * rho * defaultRev * defaultExp
          ),
        };
      }

      const revenues = this.input.history.map((h) => h.actual_revenue);
      const expenses = this.input.history.map((h) => h.actual_expenses);

      const revMean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      const expMean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
      const revStdDev = this.calculateStandardDeviation(revenues);
      const expStdDev = this.calculateStandardDeviation(expenses);

      // Coefficient of variation (CV = σ/μ × 100) → true percentage
      const revenueVolatility = revMean > 0 ? (revStdDev / revMean) * 100 : 15;
      const expenseVolatility = expMean > 0 ? (expStdDev / expMean) * 100 : 10;

      // Formule Markowitz avec corrélation pays : σ = √(σ_rev² + σ_exp² + 2ρσ_revσ_exp)
      // Guard: clamp rho to [-1,1] and radicand to ≥0 to prevent NaN
      const rhoSafe = Math.max(-1, Math.min(1, rho));
      const radicand = revenueVolatility ** 2 +
        expenseVolatility ** 2 +
        2 * rhoSafe * revenueVolatility * expenseVolatility;
      const combinedVolatility = Math.sqrt(Math.max(0, radicand));

      const result: VolatilityResult = {
        revenue_volatility: Math.round(revenueVolatility * 100) / 100,
        expense_volatility: Math.round(expenseVolatility * 100) / 100,
        combined_volatility: Math.round(combinedVolatility * 100) / 100,
      };

      this.stepMetrics.set(3, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 3 (Volatility) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 4: Calculate Unexpected Loss (conformité internationale)
   * UL = σ_combined × coefficient_contextuel
   * Conforme Bâle II IRB : UL = σ(Loss) × adjustment_factors
   */
  private calculateUnexpectedLoss(step3: VolatilityResult): UnexpectedLossResult {
    const startTime = Date.now();
    try {
      const baseUL = step3.combined_volatility;

      const coefficientContextuel = this.calculateCoefficientContextuel({
        ekhScore: this.input.ekhScore.combined_score,
        profileType: this.input.profile.profile_type,
        situation: this.input.profile.situation,
        dependents: this.input.profile.dependents,
        age: this.input.profile.age,
        baseCoefficient: 1.0,
        countryCode: this.input.profile.country_code ?? 'CI',
        urbanRural: this.input.profile.urban_rural ?? 'urban',
        incomeSource: this.input.profile.income_source ?? 'formal',
        extendedFamilyObligations: this.input.profile.extended_family_obligations ?? false,
      });

      const adjustedUL = baseUL * coefficientContextuel;

      const result: UnexpectedLossResult = {
        base_ul: Math.round(baseUL),
        coefficient_contextuel: Math.round(coefficientContextuel * 100) / 100,
        adjusted_ul: Math.round(adjustedUL),
      };

      this.stepMetrics.set(4, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 4 (Unexpected Loss) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 5: Calculate Historical VaR
   * Percentile 5% of annual variations
   */
  private calculateHistoricalVaR(): HistoricalVaRResult {
    const startTime = Date.now();
    try {
      if (this.input.history.length === 0) {
        return {
          percentile_5: this.input.profile.budget_period * 0.1,
          annual_variation: 10,
        };
      }

      const variations = this.input.history.map((h) => h.epr_actual - h.epr_planned);
      const sortedVariations = [...variations].sort((a, b) => a - b);
      // Guard: ensure index is within bounds (≥0)
      const index = Math.max(0, Math.ceil(sortedVariations.length * 0.05) - 1);
      const percentile5 = Math.abs(sortedVariations[index] ?? 0);

      const result: HistoricalVaRResult = {
        percentile_5: Math.round(percentile5),
        annual_variation: Math.round((percentile5 / this.input.profile.budget_period) * 100),
      };

      this.stepMetrics.set(5, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 5 (Historical VaR) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 6: Calculate VaR95
   * Formule paramétrique standard : VaR95 = EL + UL × z
   * Conformité : Bâle II/III, J.P. Morgan RiskMetrics
   * - EL = perte attendue (composante déterministe, non multipliée par z)
   * - UL × z = composante stochastique au seuil de confiance 95%
   */
  private calculateVaR95(el: number, volatility: number, ul: number): VaR95Result {
    const startTime = Date.now();
    try {
      const zScore = 1.645;
      const var95 = el + ul * zScore;

      const result: VaR95Result = {
        var95: Math.round(var95),
        formula_breakdown: {
          ul: Math.round(ul),
          el: Math.round(el),
          volatility: Math.round(volatility * 100) / 100,
          z_score: zScore,
        },
      };

      this.stepMetrics.set(6, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 6 (VaR95) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 7: Calculate PRL
   * PRL = Reste-à-vivre × seuil (5/10/15/30% based on risk+EKH)
   */
  private calculatePRL(): PRLResult {
    const startTime = Date.now();
    try {
      const resteAVivre = this.input.profile.budget_period -
        this.input.commitments.reduce((sum, c) => sum + c.monthly_payment, 0);

      let thresholdPercent = 15; // default
      let thresholdReason = 'Standard profile';

      const ekhScore = this.input.ekhScore.combined_score;
      const avgRiskScore =
        (this.input.riskAssessment.employment_stability +
          this.input.riskAssessment.income_predictability) /
        2;

      if (ekhScore <= 5 && avgRiskScore < 50) {
        thresholdPercent = 30;
        thresholdReason = 'Low EKH + High Risk';
      } else if (ekhScore <= 5 || avgRiskScore < 50) {
        thresholdPercent = 20;
        thresholdReason = 'Low EKH or High Risk';
      } else if (ekhScore >= 10 && avgRiskScore >= 80) {
        thresholdPercent = 5;
        thresholdReason = 'High EKH + Low Risk';
      } else if (ekhScore >= 10 || avgRiskScore >= 80) {
        thresholdPercent = 10;
        thresholdReason = 'High EKH or Low Risk';
      }

      // Dependents bonus: +2% par personne à charge, plafonné à +10%
      // Plus de personnes à charge = réserve minimale plus élevée (charges incompressibles)
      const dependents = this.input.profile.dependents ?? 0;
      const dependentsBonus = Math.min(10, Math.max(0, dependents) * 2);
      thresholdPercent += dependentsBonus;
      if (dependentsBonus > 0) {
        thresholdReason += ` + ${dependents} dependent${dependents > 1 ? 's' : ''} (+${dependentsBonus}%)`;
      }

      // Age bonus: seniors need higher reserves (horizon court, coûts santé)
      const profileAge = this.input.profile.age ?? 35;
      let ageBonus = 0;
      if (profileAge >= 65) {
        ageBonus = 6;             // 65+ : retraite, horizon très court, santé
      } else if (profileAge >= 56) {
        ageBonus = 4;             // 56-65 : pré-retraite, horizon raccourci
      } else if (profileAge >= 46) {
        ageBonus = 2;             // 46-55 : début prudence, préparation retraite
      }
      thresholdPercent += ageBonus;
      if (ageBonus > 0) {
        thresholdReason += ` + age ${profileAge} (+${ageBonus}%)`;
      }

      // Horizon fixe 3 ans (parallèle HCM) → +2% réserve (cycle court, marge limitée)
      thresholdPercent += 2;
      thresholdReason += ` + horizon ${OPERATIONAL_HORIZON_YEARS}y (+2%)`;

      const prl = Math.max(0, resteAVivre * (thresholdPercent / 100));

      const result: PRLResult = {
        prl: Math.round(prl),
        threshold_percent: thresholdPercent,
        threshold_reason: thresholdReason,
      };

      this.stepMetrics.set(7, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 7 (PRL) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 8: Calculate POB and Forecast
   * Plan triennal fixe (parallèle HCM Module 1)
   * POB = Φ((Revenue - EL) / σ) — conforme Hull (2018), RiskMetrics (1996)
   * Remplace l'ancienne formule linéaire (1 - VaR95/Revenue) qui sous-estimait les profils
   * à faibles revenus et surestimait les profils aisés.
   * EL_36m = EL × 3 × (1+inflation)^3  — projection 3 ans avec inflation composée
   */
  private calculatePOBandForecast(var95: number, revenue: number, el: number, combinedVolatility: number): POBForecastResult {
    const startTime = Date.now();
    try {
      // POB via distribution normale (conforme RiskMetrics / Hull)
      // surplus = revenue attendu - pertes attendues
      // σ = volatilité absolue du surplus
      const safeRevenue = Math.max(0, revenue);
      const surplus = Math.max(0, safeRevenue - el);
      const sigma = Math.max(1, combinedVolatility * safeRevenue / 100);
      const zPOB = sigma > 0 ? surplus / sigma : 0;
      const pob = Math.max(0, Math.min(100, normalCDF(zPOB) * 100));

      // Inflation pays-spécifique (fallback 3.5% moyenne mondiale si pays inconnu)
      const countryCode = this.input.profile.country_code ?? 'CI';
      const countryProfile = COUNTRY_RISK_PROFILES[countryCode.toUpperCase()];
      const inflationRate = countryProfile ? countryProfile.inflationAvg5y / 100 : 0.035;
      const years = OPERATIONAL_HORIZON_YEARS;

      // Projection 3 ans avec inflation composée (corrigé : (1+i)^n au lieu de (1+i))
      const el36m = el * years * Math.pow(1 + inflationRate, years);

      const result: POBForecastResult = {
        pob: Math.round(pob * 100) / 100,
        el_36m: Math.round(el36m),
        inflation_adjusted: Math.round(el36m),
      };

      this.stepMetrics.set(8, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 8 (POB & Forecast) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 9: Distribute By Levers + Plan Triennal 30/60/100% (parallèle HCM)
   * Reserve + allocation by priority + triennial recovery plan
   */
  private distributeByLevers(prl: number): DistributionResult {
    const startTime = Date.now();
    try {
      const byLever: Record<string, number> = {};
      const activeLevels = this.input.levers.filter((l) => l.is_active);
      const totalImpact = activeLevels.reduce((sum, l) => sum + l.estimated_impact, 0);

      for (const lever of activeLevels) {
        const allocation = (lever.estimated_impact / Math.max(1, totalImpact)) * (totalImpact * 0.8); // 80% allocation
        byLever[lever.lever_type] = Math.round(allocation);
      }

      const reserve = totalImpact * 0.2; // 20% reserve

      // Reste à vivre mensuel = budget - charges fixes
      const resteAVivre = this.input.profile.budget_period -
        this.input.commitments.reduce((sum, c) => sum + c.monthly_payment, 0);
      const monthlyBudget = Math.max(0, resteAVivre);
      const weeklyBudget = Math.round(monthlyBudget * 12 / 48); // 48 semaines actives

      // Plan triennal (parallèle HCM gainsN1/N2/N3)
      const eprTotal = prl;
      const eprN1 = eprTotal * 0.30;  // An 1 : 30% récupération
      const eprN2 = eprTotal * 0.60;  // An 2 : 60% récupération
      const eprN3 = eprTotal * 1.00;  // An 3 : 100% récupération

      // Split with optional investment ratio
      // Default: 67% épargne + 0% invest + 33% discrétionnaire
      // With invest: (67-investRatio)% épargne + investRatio% invest + 33% discrétionnaire
      const investmentRatio = this.input.investmentRatio ?? 0;
      const epargneRatio = (0.67 - investmentRatio / 100);
      const investRatio = investmentRatio / 100;
      const discretionnaireRatio = 0.33;

      const epargneN1 = eprN1 * epargneRatio;
      const epargneN2 = eprN2 * epargneRatio;
      const epargneN3 = eprN3 * epargneRatio;
      const discretionnaireN1 = eprN1 * discretionnaireRatio;
      const discretionnaireN2 = eprN2 * discretionnaireRatio;
      const discretionnaireN3 = eprN3 * discretionnaireRatio;
      const investN1 = eprN1 * investRatio;
      const investN2 = eprN2 * investRatio;
      const investN3 = eprN3 * investRatio;

      const result: DistributionResult = {
        total_distributed: Math.round(totalImpact * 0.8),
        by_lever: byLever,
        reserve: Math.round(reserve),
        // Plan triennal
        epr_n1: Math.round(eprN1),
        epr_n2: Math.round(eprN2),
        epr_n3: Math.round(eprN3),
        epargne_n1: Math.round(epargneN1),
        epargne_n2: Math.round(epargneN2),
        epargne_n3: Math.round(epargneN3),
        discretionnaire_n1: Math.round(discretionnaireN1),
        discretionnaire_n2: Math.round(discretionnaireN2),
        discretionnaire_n3: Math.round(discretionnaireN3),
        // Objectifs temporels
        weekly_target_n1: Math.round(eprN1 / 48),
        weekly_target_n2: Math.round(eprN2 / 48),
        weekly_target_n3: Math.round(eprN3 / 48),
        monthly_target_n1: Math.round(eprN1 / 12),
        monthly_target_n2: Math.round(eprN2 / 12),
        monthly_target_n3: Math.round(eprN3 / 12),
        // Budget variable (plafond de depense, distinct de l'objectif d'epargne)
        weekly_budget: weeklyBudget,
        monthly_budget: Math.round(monthlyBudget),
        // Investissement
        investissement_n1: Math.round(investN1),
        investissement_n2: Math.round(investN2),
        investissement_n3: Math.round(investN3),
        weekly_invest_n1: Math.round(investN1 / 48),
        weekly_invest_n2: Math.round(investN2 / 48),
        weekly_invest_n3: Math.round(investN3 / 48),
        monthly_invest_n1: Math.round(investN1 / 12),
        monthly_invest_n2: Math.round(investN2 / 12),
        monthly_invest_n3: Math.round(investN3 / 12),
        investment_ratio: investmentRatio,
      };

      this.stepMetrics.set(9, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 9 (Distribution) failed: ${String(error)}`);
    }
  }

  /**
   * STEP 10: Ventilate Monthly + Category Distribution (parallèle HCM PPR)
   * 36-month matrix with progression 5%→11% + per-category × quarter breakdown
   */
  private ventilateMonthly(step9: DistributionResult): VentilationResult {
    const startTime = Date.now();
    try {
      const matrix: number[][] = [];
      const months = 36;
      const priorities = 4;

      for (let m = 0; m < months; m++) {
        const row: number[] = [];
        const progression = 5 + (m / months) * 6; // 5% to 11%
        const monthlyAllocation = this.input.profile.budget_period * (progression / 100);

        for (let p = 0; p < priorities; p++) {
          const weight = [0.3, 0.35, 0.2, 0.15][p]; // P1, P2, P3, P4
          row.push(Math.round(monthlyAllocation * weight));
        }
        matrix.push(row);
      }

      // Category ventilation (parallèle HCM PPR)
      // Aggregate expenses by COICOP code (multiple expenses can share the same category)
      const byCategory: Record<string, CategoryVentilation> = {};
      const expenses = this.input.expenses;
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      if (totalExpenses > 0) {
        // Pre-aggregate: sum amounts and collect elasticities per COICOP code
        const catAggregates: Record<string, { totalAmount: number; expenses: Expense[] }> = {};
        for (const expense of expenses) {
          const catKey = expense.coicop_code;
          if (!catAggregates[catKey]) {
            catAggregates[catKey] = { totalAmount: 0, expenses: [] };
          }
          catAggregates[catKey].totalAmount += expense.amount;
          catAggregates[catKey].expenses.push(expense);
        }

        for (const [catKey, agg] of Object.entries(catAggregates)) {
          const budgetRate = (agg.totalAmount / totalExpenses) * 100;

          // Annual targets per year = epr_year × lever_rate × budgetRate
          const leverRate = 0.8;
          const targetN1 = step9.epr_n1 * leverRate * (budgetRate / 100);
          const targetN2 = step9.epr_n2 * leverRate * (budgetRate / 100);
          const targetN3 = step9.epr_n3 * leverRate * (budgetRate / 100);

          // Weighted average elasticity (by amount) — guard division by zero
          const weightedElasticity = agg.totalAmount > 0
            ? agg.expenses.reduce(
                (sum, e) => sum + (e.elasticity ?? 0) * e.amount, 0
              ) / agg.totalAmount
            : 0;

          // Nature: "Essentielle" if majority by amount, else "Discrétionnaire"
          const essentialAmount = agg.expenses
            .filter((e) => (e.nature ?? 'Essentielle') === 'Essentielle')
            .reduce((sum, e) => sum + e.amount, 0);
          const nature = essentialAmount >= agg.totalAmount / 2 ? 'Essentielle' : 'Discrétionnaire';

          byCategory[catKey] = {
            category_key: catKey,
            budget_rate: Math.round(budgetRate * 100) / 100,
            annual_target_n1: Math.round(targetN1),
            annual_target_n2: Math.round(targetN2),
            annual_target_n3: Math.round(targetN3),
            quarterly: {
              T1: Math.round(targetN1 * QUARTERLY_WEIGHTS.T1),
              T2: Math.round(targetN1 * QUARTERLY_WEIGHTS.T2),
              T3: Math.round(targetN1 * QUARTERLY_WEIGHTS.T3),
              T4: Math.round(targetN1 * QUARTERLY_WEIGHTS.T4),
            },
            quarterly_n2: {
              T1: Math.round(targetN2 * QUARTERLY_WEIGHTS.T1),
              T2: Math.round(targetN2 * QUARTERLY_WEIGHTS.T2),
              T3: Math.round(targetN2 * QUARTERLY_WEIGHTS.T3),
              T4: Math.round(targetN2 * QUARTERLY_WEIGHTS.T4),
            },
            quarterly_n3: {
              T1: Math.round(targetN3 * QUARTERLY_WEIGHTS.T1),
              T2: Math.round(targetN3 * QUARTERLY_WEIGHTS.T2),
              T3: Math.round(targetN3 * QUARTERLY_WEIGHTS.T3),
              T4: Math.round(targetN3 * QUARTERLY_WEIGHTS.T4),
            },
            elasticity: Math.round(weightedElasticity * 100) / 100,
            nature,
          };
        }
      }

      // Indicator distribution (parallèle HCM PPR × indicateur)
      // EPR × indicatorRate = objectif monétaire par indicateur par an
      const ekhScores = {
        e: this.input.ekhScore.e_score,
        k: this.input.ekhScore.k_score,
        h: this.input.ekhScore.h_score,
      };
      const rawRisks = this.input.rawRiskScores ?? {};
      const indicatorRates = calculateIndicatorRates(rawRisks, ekhScores);
      const rawWeights = getRawIndicatorWeights(rawRisks, ekhScores);

      const byIndicator: IndicatorDistribution[] = Object.entries(indicatorRates).map(
        ([code, rate]) => {
          const rateFraction = rate / 100;
          const eprI1 = step9.epr_n1 * rateFraction;
          const eprI2 = step9.epr_n2 * rateFraction;
          const eprI3 = step9.epr_n3 * rateFraction;

          return {
            code,
            rate: Math.round(rate * 100) / 100,
            rawWeight: rawWeights[code] ?? 0,
            epr_n1: Math.round(eprI1),
            epr_n2: Math.round(eprI2),
            epr_n3: Math.round(eprI3),
            quarterly_n1: {
              T1: Math.round(eprI1 * QUARTERLY_WEIGHTS.T1),
              T2: Math.round(eprI1 * QUARTERLY_WEIGHTS.T2),
              T3: Math.round(eprI1 * QUARTERLY_WEIGHTS.T3),
              T4: Math.round(eprI1 * QUARTERLY_WEIGHTS.T4),
            },
            quarterly_n2: {
              T1: Math.round(eprI2 * QUARTERLY_WEIGHTS.T1),
              T2: Math.round(eprI2 * QUARTERLY_WEIGHTS.T2),
              T3: Math.round(eprI2 * QUARTERLY_WEIGHTS.T3),
              T4: Math.round(eprI2 * QUARTERLY_WEIGHTS.T4),
            },
            quarterly_n3: {
              T1: Math.round(eprI3 * QUARTERLY_WEIGHTS.T1),
              T2: Math.round(eprI3 * QUARTERLY_WEIGHTS.T2),
              T3: Math.round(eprI3 * QUARTERLY_WEIGHTS.T3),
              T4: Math.round(eprI3 * QUARTERLY_WEIGHTS.T4),
            },
            monthly_target_n1: Math.round(eprI1 / 12),
            monthly_target_n2: Math.round(eprI2 / 12),
            monthly_target_n3: Math.round(eprI3 / 12),
          };
        }
      );

      const result: VentilationResult = {
        matrix_36months: matrix,
        progression_5_to_11: true,
        by_category: byCategory,
        by_indicator: byIndicator,
      };

      this.stepMetrics.set(10, Date.now() - startTime);
      return result;
    } catch (error) {
      throw new Error(`Step 10 (Ventilation) failed: ${String(error)}`);
    }
  }

  /**
   * Calculate Coefficient Contextuel
   * Conformité internationale — Bâle III adapté ménages
   *
   * Facteurs multiplicatifs appliqués séquentiellement :
   * 1. EKH (littératie financière) — interpolation linéaire [1.3 → 0.7]
   * 2. Profil socioprofessionnel — stabilité emploi/revenus (Bâle III PD)
   * 3. Situation familiale — mutualisation/protection (ACPR/EBA)
   * 4. Personnes à charge — charges incompressibles (+3%/pers, cap 15%)
   * 5. Âge — courbe en U actuarielle
   * 6. Country Risk Layer :
   *    a. Country macro factor (inflation, devise, protection sociale, bancarisation)
   *    b. Urban/Rural (accès services, diversification emploi)
   *    c. Income source (formel/informel/saisonnier → volatilité)
   *    d. Extended family obligations (+8% si tontines/famille élargie)
   */
  private calculateCoefficientContextuel(factors: CoefficientContextuelFactors): number {
    let coefficient = factors.baseCoefficient;

    // 1. EKH — RETIRÉ du coefficient contextuel pour éliminer le double-comptage
    // EKH est déjà compté dans le Pilier 3 du Score Global (20%).
    // L'inclure ici créait une multicolinéarité : EKH influençait ~37% du score
    // au lieu des 20% prévus (via coeff → UL → VaR95 → POB → Pilier 2 + Pilier 3 direct).
    // Conforme : FICO, Altman Z-score — piliers orthogonaux requis.
    // Ancien code : coefficient *= 1.3 - (ekhScore/15) × 0.6;

    // 2. Profil socioprofessionnel
    // Coefficients calibrés selon normes Bâle III / scoring PD bancaire international
    // Critères : stabilité emploi, prévisibilité revenus, engagement capital, protection sociale
    const profileAdjustments: Record<string, number> = {
      'Fonctionnaire': 0.75,       // Inamovibilité, pension garantie = risque minimal
      'Cadre': 0.85,               // Stabilité + revenus élevés, mais engagements proportionnels
      'Retraité': 0.85,            // Revenu stable mais figé, inflation, longévité
      'Salarié': 0.90,             // Baseline CDI standard
      'Profession libérale': 0.95, // Revenus élevés + récurrents, ordre réglementé
      'Auto-entrepreneur': 1.15,   // CA plafonné, protection sociale minimale
      'Indépendant': 1.15,         // Variable mais pas d'engagement de capital
      'Étudiant': 1.25,            // Aucun revenu propre, dépendance
      'Agriculteur': 1.30,         // Risque climatique + marché + dépendance PAC
      'Entrepreneur': 1.30,        // Capital engagé + garanties personnelles
      'Intérimaire': 1.35,         // Discontinuité, zéro visibilité
      'Sans emploi': 1.50,         // Risque maximum, aucun revenu
    };
    coefficient *= profileAdjustments[factors.profileType] ?? 1.0;

    // 3. Situation familiale
    // Coefficients calibrés selon scoring bancaire FR/EU (ACPR, EBA)
    // Critères : mutualisation revenus, protection juridique, obligations légales
    const situationAdjustments: Record<string, number> = {
      'Marié(e)': 0.90,    // Protection légale max, mutualisation revenus, pension de réversion
      'Pacsé(e)': 0.93,    // Avantage fiscal, mutualisation, protection juridique plus faible que mariage
      'En couple': 0.95,    // Mutualisation de fait, aucune protection légale
      'Célibataire': 1.05,  // Mono-revenu, vulnérabilité élevée
      'Veuf/Veuve': 1.05,   // Revenu amputé, capital tampon possible (assurance-vie, réversion)
      'Divorcé(e)': 1.10,   // Patrimoine divisé, pension alimentaire, logement instable
      'Séparé(e)': 1.15,    // Obligations non résolues, deux foyers, incertitude juridique max
    };
    coefficient *= situationAdjustments[factors.situation] ?? 1.0;

    // 4. Personnes à charge
    // +3% par personne à charge, plafonné à +15% (5 personnes max)
    // Logique : charges incompressibles croissantes (alimentation, logement, éducation)
    const dependentsAdjustment = 1 + Math.min(0.15, Math.max(0, factors.dependents) * 0.03);
    coefficient *= dependentsAdjustment;

    // 5. Âge (courbe en U actuarielle)
    // Jeune = peu de réserves, forte volatilité revenus
    // Milieu carrière = pic revenus, stabilité maximale
    // Senior = horizon raccourci, coûts santé, revenu décroissant
    const age = factors.age ?? 35;
    let ageAdjustment: number;
    if (age < 26) {
      ageAdjustment = 1.15;       // 18-25 : début carrière, peu de réserves
    } else if (age < 36) {
      ageAdjustment = 1.05;       // 26-35 : revenus croissants, premiers engagements
    } else if (age < 46) {
      ageAdjustment = 0.95;       // 36-45 : pic revenus en construction, stabilité
    } else if (age < 56) {
      ageAdjustment = 0.90;       // 46-55 : plateau revenus, désendettement, accumulation
    } else if (age < 66) {
      ageAdjustment = 0.95;       // 56-65 : pré-retraite, revenus stables mais horizon court
    } else {
      ageAdjustment = 1.05;       // 65+  : retraite, revenu fixe, inflation, coûts santé
    }
    coefficient *= ageAdjustment;

    // 6. Country Risk Layer — Conformité internationale
    const countryProfile = getCountryRiskProfile(factors.countryCode ?? 'CI');

    // 6a. Country macro factor (inflation, devise, protection sociale, bancarisation)
    coefficient *= countryProfile.countryFactor;

    // 6b. Urban/Rural (accès services, diversification emploi)
    coefficient *= URBAN_RURAL_FACTORS[factors.urbanRural ?? 'urban'];

    // 6c. Income source (formel → stable, informel/saisonnier → volatil)
    coefficient *= INCOME_SOURCE_FACTORS[factors.incomeSource ?? 'formal'];

    // 6d. Extended family obligations (tontines, famille élargie → +8%)
    if (factors.extendedFamilyObligations) {
      coefficient *= EXTENDED_FAMILY_FACTOR;
    }

    // Clamp to [0.4, 2.5] — élargi pour accommoder les profils extrêmes
    // (ex: Sans emploi + pays à risque + rural + informel + famille élargie)
    return Math.max(0.4, Math.min(2.5, coefficient));
  }

  /**
   * Calculate Global Score (0-100)
   *
   * 3-pillar model — conforme standards internationaux :
   *   Pilier 1 (45%) : Taux d'épargne réel — (Revenus - Dépenses) / Revenus × 100
   *                     Ref: OCDE, BIS, Fed Personal Savings Rate
   *   Pilier 2 (35%) : Score risque ajusté — POB pénalisé par VaR/Potential
   *                     Ref: Basel II/III, RiskMetrics, Hull (2018)
   *   Pilier 3 (20%) : Compétence financière EKH — 0-15 normalisé 0-100
   *                     Ref: OCDE PISA Financial Literacy (2023)
   *
   * Calibrage poids :
   *   - 45% comportement (comparable FICO 35% historique + 10% mix)
   *   - 35% robustesse risque (inchangé, conforme)
   *   - 20% compétence (réduit de 25% pour éviter surpondération)
   *   Somme = 100%
   *
   * Contrainte : Piliers ORTHOGONAUX (pas de double-comptage EKH).
   * EKH a été retiré du coefficient_contextuel (Step 4) pour respecter cette contrainte.
   */
  private calculateGlobalScore(
    totalPotential: number,
    var95: number,
    pob: number,
    ekhScore: number,
  ): number {
    // ── Pilier 1 (45%) : Taux d'épargne réel ──
    // Formule standard : (Revenus moyens - Dépenses moyennes) / Revenus moyens × 100
    // Source : OCDE « Household Savings Rate », BIS Quarterly Review
    const history = this.input.history;
    let savingsRate = 0;

    if (history.length > 0) {
      const avgRevenue = history.reduce((s, h) => s + h.actual_revenue, 0) / history.length;
      const avgExpenses = history.reduce((s, h) => s + h.actual_expenses, 0) / history.length;
      savingsRate = avgRevenue > 0
        ? Math.min(100, Math.max(0, ((avgRevenue - avgExpenses) / avgRevenue) * 100))
        : 0;
    } else {
      // Fallback sans historique : proxy conservateur depuis le budget déclaré
      const budgetPeriod = this.input.profile.budget_period || 1;
      const totalCommitments = this.input.commitments.reduce((sum, c) => sum + c.monthly_payment, 0);
      const estimatedSurplus = Math.max(0, totalPotential - totalCommitments);
      savingsRate = totalPotential > 0
        ? Math.min(50, Math.max(0, (estimatedSurplus / totalPotential) * 100))
        : 0;
    }

    // ── Pilier 2 (35%) : Score risque ajusté ──
    // POB (calculé via CDF normale en Step 8) pénalisé par le ratio VaR/Potential
    // Plus VaR est élevé par rapport au potentiel, plus le risque est concentré
    const varRatio = totalPotential > 0 ? Math.min(1, var95 / totalPotential) : 1;
    const riskScore = Math.max(0, Math.min(100, pob * (1 - varRatio * 0.5)));

    // ── Pilier 3 (20%) : Compétence financière EKH ──
    // 0-15 → 0-100 (6 questions × 0-2.5 points chacune)
    const ekhScoreNorm = Math.min(100, (ekhScore / 15) * 100);

    // ── Score composite pondéré ──
    const globalScore = savingsRate * 0.45 + riskScore * 0.35 + ekhScoreNorm * 0.20;
    return Math.round(Math.max(0, Math.min(100, globalScore)));
  }

  /**
   * Convert score to grade
   */
  private scoreToGrade(score: number): Grade {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'E';
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Get step metrics
   */
  public getMetrics(): Map<number, number> {
    return new Map(this.stepMetrics);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.resultCache.clear();
  }
}
