import { useMemo } from 'react';
import { useEngineStore } from '@/stores/engine-store';
import { useSavingsWallet } from '@/hooks/useSavingsWallet';
import { COICOPCode, Nature } from '@/types';
import {
  ShoppingBasket,
  Shirt,
  Home,
  HeartPulse,
  Car,
  Phone,
  Film,
  BookOpen,
} from 'lucide-react-native';

const CATEGORY_META: Record<COICOPCode, { labelKey: string; icon: typeof ShoppingBasket; color: string; nature: Nature }> = {
  '01': { labelKey: 'food', icon: ShoppingBasket, color: '#4ADE80', nature: 'Essentielle' },
  '02': { labelKey: 'clothing', icon: Shirt, color: '#F472B6', nature: 'Essentielle' },
  '03': { labelKey: 'housing', icon: Home, color: '#60A5FA', nature: 'Essentielle' },
  '04': { labelKey: 'health', icon: HeartPulse, color: '#F87171', nature: 'Essentielle' },
  '05': { labelKey: 'transport', icon: Car, color: '#FBBF24', nature: 'Discretionnaire' },
  '06': { labelKey: 'telecom', icon: Phone, color: '#A78BFA', nature: 'Discretionnaire' },
  '07': { labelKey: 'leisure', icon: Film, color: '#FB923C', nature: 'Discretionnaire' },
  '08': { labelKey: 'education', icon: BookOpen, color: '#34D399', nature: 'Discretionnaire' },
};

const COICOP_CODES: COICOPCode[] = ['01', '02', '03', '04', '05', '06', '07', '08'];

export interface CategoryImpact {
  code: COICOPCode;
  labelKey: string;
  icon: typeof ShoppingBasket;
  color: string;
  weeklyBudget: number;
  weeksEquivalent: number;
  nature: Nature;
  maxReductionPercent: number;
}

export interface ImpulseAnalysis {
  // Mode A — Wealth
  totalSavings: number;
  canAfford5x: boolean;
  canAfford10x: boolean;
  needed5x: number;
  needed10x: number;
  weeksToReach5x: number | null;
  weeksToReach10x: number | null;
  avgWeeklySavings: number;

  // Mode B — Impact
  impactByCategory: CategoryImpact[];
  totalWeeksOfBudget: number;
  weeklyBudget: number;
}

export function useImpulseCheck(price: number): ImpulseAnalysis {
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const wallet = useSavingsWallet();

  return useMemo(() => {
    const totalSavings = wallet.allTimeNet;
    const nbWeeks = wallet.nbSemainesTotal;
    const avgWeeklySavings = nbWeeks > 0 ? Math.round(totalSavings / nbWeeks) : 0;

    // Mode A — Wealth check
    const canAfford5x = totalSavings >= price * 5;
    const canAfford10x = totalSavings >= price * 10;
    const needed5x = Math.max(0, price * 5 - totalSavings);
    const needed10x = Math.max(0, price * 10 - totalSavings);
    const weeksToReach5x = avgWeeklySavings > 0 ? Math.ceil(needed5x / avgWeeklySavings) : null;
    const weeksToReach10x = avgWeeklySavings > 0 ? Math.ceil(needed10x / avgWeeklySavings) : null;

    // Mode B — Impact simulation
    const weeklyBudget = engineOutput?.step9?.weekly_budget ?? 0;
    const totalWeeksOfBudget = weeklyBudget > 0 ? Math.round((price / weeklyBudget) * 10) / 10 : 0;

    const categoryVentilation = engineOutput?.step10?.by_category;

    const impactByCategory: CategoryImpact[] = COICOP_CODES.map((code) => {
      const meta = CATEGORY_META[code];
      const catVentilation = categoryVentilation?.[code];
      const budgetRate = catVentilation?.budget_rate ?? 0;
      const catWeeklyBudget = Math.round(weeklyBudget * budgetRate / 100);
      const weeksEquivalent = catWeeklyBudget > 0
        ? Math.round((price / catWeeklyBudget) * 10) / 10
        : 0;
      const elasticity = catVentilation?.elasticity ?? 0;
      // maxReductionPercent: essentials cap at elasticity%, discretionary up to 80%
      const maxReductionPercent = meta.nature === 'Essentielle'
        ? Math.min(Math.abs(elasticity), 30)
        : Math.min(Math.abs(elasticity) + 20, 80);

      return {
        code,
        labelKey: meta.labelKey,
        icon: meta.icon,
        color: meta.color,
        weeklyBudget: catWeeklyBudget,
        weeksEquivalent,
        nature: meta.nature,
        maxReductionPercent,
      };
    }).sort((a, b) => a.weeksEquivalent - b.weeksEquivalent);

    return {
      totalSavings,
      canAfford5x,
      canAfford10x,
      needed5x,
      needed10x,
      weeksToReach5x,
      weeksToReach10x,
      avgWeeklySavings,
      impactByCategory,
      totalWeeksOfBudget,
      weeklyBudget,
    };
  }, [price, engineOutput, wallet]);
}
