import React from 'react';
import { Link } from 'react-router-dom';
import { useReportData } from '../_hooks/useReportData';
import { StatCard } from '@/modules/module1/components/report/StatCard';
import { SimplePie } from '@/modules/module1/components/charts/SimplePie';
import { DollarSign } from 'lucide-react';

export default function Report10() {
  const { data, riskTotals } = useReportData();
  const calc: any = data?.calculatedFields || {};

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
        <DollarSign className="w-5 h-5 text-cfo-accent" />
        <h2 className="text-lg font-bold">10 — Economic benefit breakdown</h2>
      </div>

      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Distribution par type de risque</h3>
        <SimplePie data={riskTotals.items.map((r) => ({ label: r.name, value: r.value }))} />
        <p className="text-xs text-cfo-muted mt-3">Synthèse visuelle des contributions relatives. Se base uniquement sur les résultats calculés de l'application.</p>
      </div>
    </section>
  );
}
