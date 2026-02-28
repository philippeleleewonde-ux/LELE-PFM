import { useMemo } from 'react';
import { useAssetStore } from '@/stores/asset-store';
import { useEngineStore } from '@/stores/engine-store';
import { LucideIcon } from 'lucide-react-native';
import { AssetClass, ASSET_CLASSES, ASSET_CLASS_CODES, LIBERTY_OBJECTIVE_MULTIPLIER } from '@/constants/patrimoine-buckets';

export interface AssetClassSummary {
  assetClass: AssetClass;
  totalValue: number;
  estimatedMonthlyIncome: number;
  count: number;
  color: string;
  labelKey: string;
  icon: LucideIcon;
}

export interface PatrimoineAssetsResult {
  byClass: AssetClassSummary[];
  totalAssets: number;
  estimatedMonthlyPassiveIncome: number;
  ratioAssetsToIncome: number;
  libertyTarget: number;
  libertyPercent: number;
  hasAssets: boolean;
}

export function usePatrimoineAssets(): PatrimoineAssetsResult {
  const assets = useAssetStore((s) => s.assets);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const incomeTargets = useEngineStore((s) => s.incomeTargets);

  return useMemo(() => {
    // Aggregate by class
    const byClass: AssetClassSummary[] = ASSET_CLASS_CODES.map((code) => {
      const classAssets = assets.filter((a) => a.assetClass === code);
      const totalValue = classAssets.reduce((sum, a) => sum + a.currentValue, 0);
      const estimatedMonthlyIncome = classAssets.reduce(
        (sum, a) => sum + (a.currentValue * a.annualYieldPercent) / 100 / 12,
        0
      );
      return {
        assetClass: code,
        totalValue,
        estimatedMonthlyIncome,
        count: classAssets.length,
        color: ASSET_CLASSES[code].color,
        labelKey: ASSET_CLASSES[code].labelKey,
        icon: ASSET_CLASSES[code].icon,
      };
    });

    const totalAssets = byClass.reduce((sum, c) => sum + c.totalValue, 0);
    const estimatedMonthlyPassiveIncome = byClass.reduce(
      (sum, c) => sum + c.estimatedMonthlyIncome,
      0
    );

    // Monthly income from engine targets
    let monthlyIncome = 0;
    if (incomeTargets) {
      monthlyIncome = Object.values(incomeTargets).reduce(
        (sum, t) => sum + t.monthlyAmount,
        0
      );
    }

    const ratioAssetsToIncome =
      monthlyIncome > 0 ? totalAssets / (monthlyIncome * 12) : 0;

    // Liberty target: 50x monthly expenses
    const monthlyBudget = engineOutput?.step9?.monthly_budget ?? 0;
    const libertyTarget = LIBERTY_OBJECTIVE_MULTIPLIER * monthlyBudget;
    const libertyPercent =
      libertyTarget > 0 ? Math.min(100, (totalAssets / libertyTarget) * 100) : 0;

    return {
      byClass,
      totalAssets,
      estimatedMonthlyPassiveIncome,
      ratioAssetsToIncome,
      libertyTarget,
      libertyPercent,
      hasAssets: assets.length > 0,
    };
  }, [assets, engineOutput, incomeTargets]);
}
