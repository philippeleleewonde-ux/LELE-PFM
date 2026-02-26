import { useMemo } from 'react';
import { useImpulseStore, DetailedCompensation } from '@/stores/impulse-store';

export interface PurchaseGroup {
  purchaseId: string;
  label: string;
  amount: number;
  compensations: DetailedCompensation[];
  totalWeeklyReduction: number;
  maxTotalWeeks: number;
  currentWeekIndex: number;
}

export interface CompensationSummary {
  entries: DetailedCompensation[];
  totalWeeklyReduction: number;
  activePurchaseCount: number;
  hasActiveCompensations: boolean;
  byPurchase: PurchaseGroup[];
}

export function useActiveCompensations(week: number, year: number): CompensationSummary {
  const purchases = useImpulseStore((s) => s.purchases);
  const getDetailedCompensations = useImpulseStore((s) => s.getDetailedCompensations);

  return useMemo(() => {
    const entries = getDetailedCompensations(week, year);

    if (entries.length === 0) {
      return {
        entries: [],
        totalWeeklyReduction: 0,
        activePurchaseCount: 0,
        hasActiveCompensations: false,
        byPurchase: [],
      };
    }

    // Group by purchaseId
    const grouped = new Map<string, DetailedCompensation[]>();
    for (const entry of entries) {
      const existing = grouped.get(entry.purchaseId);
      if (existing) {
        existing.push(entry);
      } else {
        grouped.set(entry.purchaseId, [entry]);
      }
    }

    const byPurchase: PurchaseGroup[] = [];
    for (const [purchaseId, comps] of grouped) {
      const first = comps[0];
      byPurchase.push({
        purchaseId,
        label: first.purchaseLabel,
        amount: first.purchaseAmount,
        compensations: comps,
        totalWeeklyReduction: comps.reduce((s, c) => s + c.weeklyReduction, 0),
        maxTotalWeeks: Math.max(...comps.map((c) => c.totalWeeks)),
        currentWeekIndex: first.currentWeekIndex,
      });
    }

    const totalWeeklyReduction = entries.reduce((s, c) => s + c.weeklyReduction, 0);

    return {
      entries,
      totalWeeklyReduction,
      activePurchaseCount: byPurchase.length,
      hasActiveCompensations: true,
      byPurchase,
    };
  }, [purchases, week, year]);
}
