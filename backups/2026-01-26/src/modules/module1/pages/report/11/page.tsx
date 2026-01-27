import React from 'react';
import { Link } from 'react-router-dom';
import { useReportData } from '../_hooks/useReportData';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { StatCard } from '@/modules/module1/components/report/StatCard';
import { SimplePie } from '@/modules/module1/components/charts/SimplePie';
import { Target } from 'lucide-react';

export default function Report11() {
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

  const parts = [
    { label: 'EL Historic', value: calc.totalELHistorique || 0 },
    { label: 'Forecast EL', value: calc.forecastEL || 0 },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-cfo-accent" />
        <h2 className="text-lg font-bold">11 — Risk Appetite Threshold Breakdown</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Historic Threshold (Total)" value={formatCurrency(calc?.totalSeuilHistorique || 0, currency)} />
        <StatCard title="Expected Loss (Historic)" value={formatCurrency(calc?.totalELHistorique || 0, currency)} />
        <StatCard title="Forecast Expected Loss" value={formatCurrency(calc?.forecastEL || 0, currency)} />
      </div>

      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Répartition EL (Historique vs Prévisionnel)</h3>
        <SimplePie data={parts} />
      </div>
    </section>
  );
}
