import { useMemo } from 'react';
import { useInvestmentStore } from '@/stores/investment-store';
import { useWizardStore } from '@/stores/wizard-store';
import { useEngineStore } from '@/stores/engine-store';
import { PillarAllocation, InvestmentPillar, TippingPoint, AllocationRecommendation } from '@/types/investment';
import { MonteCarloResult } from '@/domain/calculators/monte-carlo-simulator';
import { AllWeatherAnalysis } from '@/domain/calculators/all-weather-engine';
import { getProductsForCountry, filterShariaProducts } from '@/constants/investment-products';
import { ASSET_TO_PILLAR, RISK_ALLOCATION_WEIGHTS } from '@/constants/pillar-mapping';
import { runMonteCarlo } from '@/domain/calculators/monte-carlo-simulator';
import { analyzeAllWeather } from '@/domain/calculators/all-weather-engine';
import { portfolioReturn } from '@/domain/calculators/investment-simulator';

export interface InvestorStrategy {
  pillars: PillarAllocation[];
  totalMonthlyBudget: number;
  weightedReturn: number;
  allWeatherScore: number;
  allWeatherAnalysis: AllWeatherAnalysis;
  monteCarloResult: MonteCarloResult;
  tippingPoint: TippingPoint | null;
  needsRebalance: boolean;
}

export function useInvestorStrategy(): InvestorStrategy | null {
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const country = useWizardStore((s) => s.formData.country);
  const engineOutput = useEngineStore((s) => s.engineOutput);

  return useMemo(() => {
    if (!investorProfile || !engineOutput) return null;

    // 1. Get products for country
    let products = getProductsForCountry(country);
    if (products.length === 0) return null;

    // 2. Filter sharia if needed
    products = filterShariaProducts(products, investorProfile.shariaCompliance);

    // 3. Map products to pillars
    const pillarProducts: Record<InvestmentPillar, typeof products> = {
      croissance: [],
      amortisseur: [],
      refuge: [],
      base_arriere: [],
    };
    products.forEach((p) => {
      const pillar = ASSET_TO_PILLAR[p.asset];
      if (pillar) pillarProducts[pillar].push(p);
    });

    // 4. Get weights for risk profile
    const weights = RISK_ALLOCATION_WEIGHTS[investorProfile.riskTolerance];

    // 5. Monthly budget from engine
    const monthlyBudget = engineOutput.step9.monthly_invest_n1 ||
      (engineOutput.step9.epr_n1 * (investorProfile.investmentRatio || 20) / 100 / 12);

    // 6. Build pillar allocations with top 3 products per pillar
    const allAllocations: AllocationRecommendation[] = [];
    const pillars: PillarAllocation[] = (['croissance', 'amortisseur', 'refuge', 'base_arriere'] as InvestmentPillar[]).map((pillarCode) => {
      const targetPercent = weights[pillarCode];
      const pillarBudget = monthlyBudget * targetPercent / 100;
      const available = pillarProducts[pillarCode]
        .sort((a, b) => b.returnRate - a.returnRate)
        .slice(0, 3);

      const pillarAllocs: AllocationRecommendation[] = available.map((product, idx) => {
        const subWeight = available.length === 1 ? 100 :
          idx === 0 ? 50 : (50 / (available.length - 1));
        const monthlyAmount = pillarBudget * subWeight / 100;
        return {
          product,
          weight: targetPercent * subWeight / 100,
          monthlyAmount,
          projectedReturn12m: monthlyAmount * 12 * product.returnRate / 100,
          projectedReturn36m: monthlyAmount * 36 * product.returnRate / 100 * 1.15,
        };
      });

      allAllocations.push(...pillarAllocs);

      return {
        pillar: pillarCode,
        targetPercent,
        currentPercent: targetPercent, // starts aligned
        products: pillarAllocs,
        drift: 0,
      };
    });

    // 7. Weighted return
    const wReturn = allAllocations.length > 0 ? portfolioReturn(allAllocations) : 5;

    // 8. All-Weather analysis
    const awAnalysis = analyzeAllWeather(allAllocations);

    // 9. Monte Carlo (200 simulations, 10 years)
    const mcResult = runMonteCarlo(allAllocations, monthlyBudget, {
      numSimulations: 200,
      months: 360,
      inflation: 0.02,
    });

    // 10. Tipping point
    let tippingPoint: TippingPoint | null = null;
    const monthlyIncome = engineOutput.step9.monthly_budget + monthlyBudget; // approximate active income
    if (mcResult.median) {
      for (let i = 0; i < mcResult.median.length; i++) {
        const passiveIncome = mcResult.median[i].value * (wReturn / 100) / 12;
        if (passiveIncome >= monthlyIncome) {
          tippingPoint = {
            monthsToReach: i,
            valueAtTipping: mcResult.median[i].value,
            monthlyPassiveIncome: passiveIncome,
          };
          break;
        }
      }
    }

    // 11. Check rebalance need
    const needsRebalance = pillars.some((p) => Math.abs(p.drift) > 5);

    return {
      pillars,
      totalMonthlyBudget: monthlyBudget,
      weightedReturn: wReturn,
      allWeatherScore: awAnalysis.overallScore,
      allWeatherAnalysis: awAnalysis,
      monteCarloResult: mcResult,
      tippingPoint,
      needsRebalance,
    };
  }, [investorProfile, country, engineOutput]);
}
