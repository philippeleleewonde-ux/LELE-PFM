import React from 'react';
import { Link } from 'react-router-dom';
import { useReportData } from '../_hooks/useReportData';
import { formatCurrency, getCurrencySymbol } from '@/modules/module1/utils/formatting';
import { StatCard } from '@/modules/module1/components/report/StatCard';
import { SimplePie } from '@/modules/module1/components/charts/SimplePie';
import { Shield, Activity } from 'lucide-react';

export default function Report7() {
  const { data, currency, riskTotals, payload } = useReportData();
  const calc: any = data?.calculatedFields || {};
  const sym = getCurrencySymbol(currency);

  if (!data) {
    return (
      <div className="text-center py-24">
        <p className="text-cfo-muted">Aucune donnée de rapport. Revenez à l'application et cliquez sur "Generate Report".</p>
        <Link href="/" className="form-button form-button-primary mt-4 inline-block">Retour</Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-cfo-accent" />
        <h2 className="text-lg font-bold">7 — Programming data of potentially recoverable loss accounts (PRL)</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="VaR (historique + UL)" value={formatCurrency(calc?.var || 0, currency)} />
        <StatCard title="PRL (95% de VaR)" value={formatCurrency(calc?.prlAmount || calc?.prl || 0, currency)} />
        <StatCard title="Historic Risk Appetite" value={formatCurrency(calc?.historicRiskAppetite || 0, currency)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-cfo-accent" /> Risk Distribution</h3>
          <SimplePie data={riskTotals.items.map((r) => ({ label: r.name, value: r.value }))} />
          <p className="text-xs text-cfo-muted mt-3">Total: {`${riskTotals.total.toFixed(1)}k${sym}`}</p>
        </div>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-cfo-accent" /> Key Inputs</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatCard title="Unexpected Loss (UL)" value={`${(data.riskData?.totalUL || 0).toFixed(1)}k${sym}`} />
            <StatCard title="Years of Collection" value={`${data.riskData?.yearsOfCollection || 0} yrs`} />
          </div>
        </div>
      </div>
    </section>
  );
}
