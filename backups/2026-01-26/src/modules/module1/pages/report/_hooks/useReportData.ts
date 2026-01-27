import { useEffect, useState, useMemo } from 'react';
import type { FormData, Currency } from '@/modules/module1/types';
import { UserStorage } from '../../../utils/userStorage';

export interface StoredPayload {
  formData: FormData;
  generatedAt: string;
  reportType: 'summary' | 'detailed' | 'analysis';
}

export function useReportData() {
  const [payload, setPayload] = useState<StoredPayload | null>(null);

  useEffect(() => {
    try {
      const raw = UserStorage.getItem('cfo_report_data');
      if (raw) setPayload(JSON.parse(raw));
    } catch (e) {
      // noop; handled by UI
      console.error('useReportData: failed to parse payload', e);
    }
  }, []);

  const data = payload?.formData;
  const currency = (data?.selectedCurrency || 'EUR') as Currency;

  const riskTotals = useMemo(() => {
    const rc = data?.riskData?.riskCategories;
    if (!rc) return { total: 0, items: [] as { name: string; value: number; pct: number }[] };
    const entries = Object.entries(rc);
    const total = entries.reduce((s, [, v]) => s + (Number(v) || 0), 0);
    const names: Record<string, string> = {
      operationalRisk: 'Operational',
      creditRisk: 'Credit',
      marketRisk: 'Market',
      liquidityRisk: 'Liquidity',
      reputationalRisk: 'Reputational',
      strategicRisk: 'Strategic',
    };
    const items = entries.map(([k, v]) => ({ name: names[k] || k, value: Number(v) || 0, pct: total ? ((Number(v) || 0) / total) * 100 : 0 }));
    return { total, items };
  }, [data]);

  return { payload, data, currency, riskTotals };
}
