import React from 'react';
import { Link } from 'react-router-dom';
import { useReportData } from '../_hooks/useReportData';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { StatCard } from '@/modules/module1/components/report/StatCard';
import { SimpleStackedBar } from '@/modules/module1/components/charts/SimpleStackedBar';
import { LineChart, TrendingUp } from 'lucide-react';

export default function Report9() {
  const { data, currency } = useReportData();
  const calc: any = data?.calculatedFields || {};

  if (!data) {
    return (
      <div className="text-center py-24">
        <p className="text-cfo-muted">Aucune donnée de rapport. Revenez à l'application et cliquez sur "Generate Report".</p>
        <Link href="/" className="form-button form-button-primary mt-4 inline-block">Retour</Link>
      </div>
    );
  }

  const gains = [calc.gainsN1 || 0, calc.gainsN2 || 0, calc.gainsN3 || 0];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <LineChart className="w-5 h-5 text-cfo-accent" />
        <h2 className="text-lg font-bold">9 — IPLE Accounts</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Gains N+1" value={formatCurrency(calc?.gainsN1 || 0, currency)} />
        <StatCard title="Gains N+2" value={formatCurrency(calc?.gainsN2 || 0, currency)} />
        <StatCard title="Gains N+3" value={formatCurrency(calc?.gainsN3 || 0, currency)} />
      </div>

      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cfo-accent" /> Cash-Flow (67%) vs Bonuses (33%)</h3>
        <SimpleStackedBar
          groups={[
            { label: 'N+1', segments: [ { label: 'Cash-Flow', value: calc.cashFlowN1 || 0 }, { label: 'Bonuses', value: calc.primesN1 || 0 } ] },
            { label: 'N+2', segments: [ { label: 'Cash-Flow', value: calc.cashFlowN2 || 0 }, { label: 'Bonuses', value: calc.primesN2 || 0 } ] },
            { label: 'N+3', segments: [ { label: 'Cash-Flow', value: calc.cashFlowN3 || 0 }, { label: 'Bonuses', value: calc.primesN3 || 0 } ] },
          ]}
          width={640}
          height={240}
        />
      </div>
    </section>
  );
}
