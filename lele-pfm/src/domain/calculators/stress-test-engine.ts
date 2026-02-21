/**
 * Stress Test Engine — LELE PFM
 *
 * Simulates portfolio behavior during historical crises.
 * Pure functions, no side effects.
 */

import { AllocationRecommendation } from '@/types/investment';
import {
  HISTORICAL_CRISES,
  HistoricalCrisis,
  ASSET_CLASS_LABELS,
} from '@/domain/models/historical-scenarios';
import type { AssetClass } from '@/types/investment';

export interface StressTestResult {
  crisis: HistoricalCrisis;
  portfolioMaxDrawdown: number;
  portfolioRecoveryMonths: number;
  portfolioTotalReturn: number;
  worstAsset: { name: string; drawdown: number };
  bestAsset: { name: string; totalReturn: number };
  verdict: 'survives' | 'damaged' | 'critical';
  verdictText: string;
  monthlyPath: number[];
}

/**
 * Stress-test a portfolio against one or all historical crises.
 * Returns results for each tested crisis.
 */
export function stressTestPortfolio(
  allocations: AllocationRecommendation[],
  crisisId?: string,
): StressTestResult[] {
  if (allocations.length === 0) return [];

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return [];

  const crises = crisisId
    ? HISTORICAL_CRISES.filter((c) => c.id === crisisId)
    : HISTORICAL_CRISES;

  return crises.map((crisis) => testOneCrisis(allocations, totalWeight, crisis));
}

function testOneCrisis(
  allocations: AllocationRecommendation[],
  totalWeight: number,
  crisis: HistoricalCrisis,
): StressTestResult {
  // Weighted averages across allocations
  let portfolioMaxDrawdown = 0;
  let portfolioRecoveryMonths = 0;
  let portfolioTotalReturn = 0;

  // Track worst and best individual assets
  let worstAsset = { name: '', drawdown: 0 };
  let bestAsset = { name: '', totalReturn: -Infinity };

  for (const alloc of allocations) {
    const asset = alloc.product.asset as AssetClass;
    const impact = crisis.assetImpacts[asset];
    if (!impact) continue;

    const w = alloc.weight / totalWeight;

    portfolioMaxDrawdown += impact.maxDrawdown * w;
    portfolioRecoveryMonths += impact.recoveryMonths * w;
    portfolioTotalReturn += impact.totalReturn * w;

    const label = ASSET_CLASS_LABELS[asset] ?? asset;

    if (impact.maxDrawdown < worstAsset.drawdown) {
      worstAsset = { name: label, drawdown: impact.maxDrawdown };
    }
    if (impact.totalReturn > bestAsset.totalReturn) {
      bestAsset = { name: label, totalReturn: impact.totalReturn };
    }
  }

  // Fallback if no assets matched
  if (bestAsset.totalReturn === -Infinity) {
    bestAsset = { name: '-', totalReturn: 0 };
  }

  // Generate monthly path: start at 100
  const monthlyPath = generateMonthlyPath(crisis, portfolioMaxDrawdown, portfolioTotalReturn);

  // Verdict thresholds
  let verdict: StressTestResult['verdict'];
  let verdictText: string;

  if (portfolioMaxDrawdown > -15) {
    verdict = 'survives';
    verdictText =
      'Votre portefeuille resiste bien a ce scenario. La perte maximale reste contenue et la recuperation est rapide.';
  } else if (portfolioMaxDrawdown >= -35) {
    verdict = 'damaged';
    verdictText =
      'Votre portefeuille subit des pertes significatives mais recuperables. Envisagez de renforcer les actifs defensifs.';
  } else {
    verdict = 'critical';
    verdictText =
      'Votre portefeuille est severement touche. Une diversification vers des actifs refuges (or, obligations) est recommandee.';
  }

  return {
    crisis,
    portfolioMaxDrawdown,
    portfolioRecoveryMonths,
    portfolioTotalReturn,
    worstAsset,
    bestAsset,
    verdict,
    verdictText,
    monthlyPath,
  };
}

/**
 * Build a simplified monthly path array (base 100).
 * Phase "Chute": linear 100 -> bottom
 * Phase "Creux": flat at bottom
 * Phase "Recuperation": linear bottom -> final
 */
function generateMonthlyPath(
  crisis: HistoricalCrisis,
  maxDrawdown: number,
  totalReturn: number,
): number[] {
  const path: number[] = [];
  const bottom = 100 + maxDrawdown;
  const final = 100 + totalReturn;

  for (const phase of crisis.phases) {
    const months = phase.endMonth - phase.startMonth + 1;

    if (phase.name === 'Chute') {
      for (let i = 0; i < months; i++) {
        const t = months > 1 ? i / (months - 1) : 1;
        path.push(100 + (bottom - 100) * t);
      }
    } else if (phase.name === 'Creux') {
      for (let i = 0; i < months; i++) {
        path.push(bottom);
      }
    } else {
      // Recuperation
      for (let i = 0; i < months; i++) {
        const t = months > 1 ? i / (months - 1) : 1;
        path.push(bottom + (final - bottom) * t);
      }
    }
  }

  return path;
}
