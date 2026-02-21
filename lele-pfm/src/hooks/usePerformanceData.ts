/**
 * Transforms EngineOutput into display-ready objects for each performance section.
 */
import { useMemo } from 'react';
import { useEngineStore } from '@/stores/engine-store';
import { EngineOutput, CategoryVentilation, IndicatorDistribution } from '@/types/engine';
import { formatCurrency, formatPercent, formatGrade } from '@/services/format-helpers';
import { COICOP_LABELS } from '@/components/performance/shared';
import { PFM_INDICATORS } from '@/constants/pfm-indicators';

export interface KPIItem {
  key: string;
  label: string;
  tooltip: string;
  value: string;
  rawValue: number;
  alertLevel: 'green' | 'yellow' | 'red' | 'cyan' | 'violet' | 'orange';
  iconName: string;
}

export interface YearPlan {
  year: number;
  label: string;
  recoveryPercent: number;
  epr: number;
  epargne: number;
  discretionnaire: number;
  monthlyTarget: number;
  weeklyTarget: number;
}

export interface VarDistribution {
  ul: number;
  el: number;
  volatility: number;
  zScore: number;
  var95: number;
  coefficientContextuel: number;
  revenueVolatility: number;
  expenseVolatility: number;
}

export interface CategoryItem {
  code: string;
  label: string;
  budgetRate: number;
  elasticity: number;
  nature: string;
  annualTargetN1: number;
  annualTargetN2: number;
  annualTargetN3: number;
  quarterly: { T1: number; T2: number; T3: number; T4: number };
  quarterlyN2: { T1: number; T2: number; T3: number; T4: number };
  quarterlyN3: { T1: number; T2: number; T3: number; T4: number };
}

export interface IndicatorDisplayItem {
  code: string;
  name: string;
  description: string;
  challenge: string;
  icon: string;
  color: string;
  rate: number;          // Poids normalisé (%)
  rawWeight: number;     // Poids brut (0-100)
  eprN1: number;         // Objectif An 1
  eprN2: number;         // Objectif An 2
  eprN3: number;         // Objectif An 3
  quarterlyN1: { T1: number; T2: number; T3: number; T4: number };
  quarterlyN2: { T1: number; T2: number; T3: number; T4: number };
  quarterlyN3: { T1: number; T2: number; T3: number; T4: number };
  monthlyTargetN1: number;
  monthlyTargetN2: number;
  monthlyTargetN3: number;
}

export interface PerformanceData {
  output: EngineOutput;
  kpis: KPIItem[];
  triennialPlan: YearPlan[];
  varDistribution: VarDistribution;
  coherenceRatio: number;
  elRevenue: number;
  elExpense: number;
  pob: number;
  el36m: number;
  inflationAdjusted: number;
  prl: number;
  thresholdPercent: number;
  categories: CategoryItem[];
  indicators: IndicatorDisplayItem[];
  eprByYear: { n1: number; n2: number; n3: number };
}

export function usePerformanceData(): PerformanceData | null {
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const currency = useEngineStore((s) => s.currency);

  return useMemo(() => {
    if (!engineOutput) return null;
    const o = engineOutput;

    // KPIs (Section A)
    const kpis: KPIItem[] = [
      {
        key: 'potential',
        label: 'Coûts invisibles',
        tooltip: 'Ce que ta gestion te coûte sans que tu le voies.',
        value: formatCurrency(o.step1.total_potential),
        rawValue: o.step1.total_potential,
        alertLevel: 'green',
        iconName: 'TrendingUp',
      },
      {
        key: 'el',
        label: 'Coûts visibles',
        tooltip: 'Ce que ta gestion te coûte de manière évidente.',
        value: formatCurrency(o.step2.total_el),
        rawValue: o.step2.total_el,
        alertLevel: 'red',
        iconName: 'AlertTriangle',
      },
      {
        key: 'var95',
        label: 'Coût maximum',
        tooltip: 'Le maximum que ta gestion peut te coûter.',
        value: formatCurrency(o.step6.var95),
        rawValue: o.step6.var95,
        alertLevel: 'yellow',
        iconName: 'Shield',
      },
      {
        key: 'historical',
        label: 'Coûts tolérés',
        tooltip: 'Ce que tu as accepté de payer jusqu\'ici.',
        value: formatCurrency(o.step5.percentile_5),
        rawValue: o.step5.percentile_5,
        alertLevel: 'orange',
        iconName: 'History',
      },
      {
        key: 'prl',
        label: 'Cashback invisible',
        tooltip: 'L\'argent caché dans tes dépenses, récupérable.',
        value: formatCurrency(o.step7.prl),
        rawValue: o.step7.prl,
        alertLevel: 'violet',
        iconName: 'Wallet',
      },
      {
        key: 'el36m',
        label: 'Coûts projetés sur 3 ans',
        tooltip: 'Ce que ça va te coûter si rien ne change.',
        value: formatCurrency(o.step8.el_36m),
        rawValue: o.step8.el_36m,
        alertLevel: 'cyan',
        iconName: 'Calendar',
      },
    ];

    // Triennial Plan (Section B)
    const triennialPlan: YearPlan[] = [
      {
        year: 1,
        label: 'An 1',
        recoveryPercent: 30,
        epr: o.step9.epr_n1,
        epargne: o.step9.epargne_n1,
        discretionnaire: o.step9.discretionnaire_n1,
        monthlyTarget: o.step9.monthly_target_n1,
        weeklyTarget: o.step9.weekly_target_n1,
      },
      {
        year: 2,
        label: 'An 2',
        recoveryPercent: 60,
        epr: o.step9.epr_n2,
        epargne: o.step9.epargne_n2,
        discretionnaire: o.step9.discretionnaire_n2,
        monthlyTarget: o.step9.monthly_target_n2,
        weeklyTarget: o.step9.weekly_target_n2,
      },
      {
        year: 3,
        label: 'An 3',
        recoveryPercent: 100,
        epr: o.step9.epr_n3,
        epargne: o.step9.epargne_n3,
        discretionnaire: o.step9.discretionnaire_n3,
        monthlyTarget: o.step9.monthly_target_n3,
        weeklyTarget: o.step9.weekly_target_n3,
      },
    ];

    // VaR Distribution (Section C)
    const varDistribution: VarDistribution = {
      ul: o.step6.formula_breakdown.ul,
      el: o.step6.formula_breakdown.el,
      volatility: o.step6.formula_breakdown.volatility,
      zScore: o.step6.formula_breakdown.z_score,
      var95: o.step6.var95,
      coefficientContextuel: o.step4.coefficient_contextuel,
      revenueVolatility: o.step3.revenue_volatility,
      expenseVolatility: o.step3.expense_volatility,
    };

    // Categories (Sections D, E, H-J)
    const catEntries = Object.entries(o.step10.by_category);
    const categories: CategoryItem[] = catEntries.map(([code, cat]) => ({
      code,
      label: COICOP_LABELS[code] || `Cat. ${code}`,
      budgetRate: cat.budget_rate,
      elasticity: cat.elasticity,
      nature: cat.nature,
      annualTargetN1: cat.annual_target_n1,
      annualTargetN2: cat.annual_target_n2,
      annualTargetN3: cat.annual_target_n3,
      quarterly: cat.quarterly,
      quarterlyN2: cat.quarterly_n2,
      quarterlyN3: cat.quarterly_n3,
    }));

    // Indicators (5 indicateurs PFM — parallèle HCM)
    const rawIndicators = o.step10.by_indicator ?? [];
    const indicators: IndicatorDisplayItem[] = rawIndicators.map((ind) => {
      const def = PFM_INDICATORS.find((p) => p.code === ind.code);
      return {
        code: ind.code,
        name: def?.name ?? ind.code,
        description: def?.description ?? '',
        challenge: def?.challenge ?? '',
        icon: def?.icon ?? 'HelpCircle',
        color: def?.color ?? '#FFFFFF',
        rate: ind.rate,
        rawWeight: ind.rawWeight,
        eprN1: ind.epr_n1,
        eprN2: ind.epr_n2,
        eprN3: ind.epr_n3,
        quarterlyN1: ind.quarterly_n1,
        quarterlyN2: ind.quarterly_n2,
        quarterlyN3: ind.quarterly_n3,
        monthlyTargetN1: ind.monthly_target_n1,
        monthlyTargetN2: ind.monthly_target_n2,
        monthlyTargetN3: ind.monthly_target_n3,
      };
    });

    return {
      output: o,
      kpis,
      triennialPlan,
      varDistribution,
      coherenceRatio: o.step2.coherence_ratio,
      elRevenue: o.step2.el_revenue,
      elExpense: o.step2.el_expense,
      pob: o.step8.pob,
      el36m: o.step8.el_36m,
      inflationAdjusted: o.step8.inflation_adjusted,
      prl: o.step7.prl,
      thresholdPercent: o.step7.threshold_percent,
      categories,
      indicators,
      eprByYear: { n1: o.step9.epr_n1, n2: o.step9.epr_n2, n3: o.step9.epr_n3 },
    };
  }, [engineOutput, currency]);
}
