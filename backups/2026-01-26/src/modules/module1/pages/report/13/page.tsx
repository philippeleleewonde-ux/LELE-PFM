import React from 'react';
import { Link } from 'react-router-dom';
import { useReportData } from '../_hooks/useReportData';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { StatCard } from '@/modules/module1/components/report/StatCard';
import { SimplePie } from '@/modules/module1/components/charts/SimplePie';
import { BarChart3 } from 'lucide-react';

export default function Report13() {
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

  const primeDist = [
    { label: 'N+1', value: calc.primesN1 || 0 },
    { label: 'N+2', value: calc.primesN2 || 0 },
    { label: 'N+3', value: calc.primesN3 || 0 },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-cfo-accent" />
        <h2 className="text-lg font-bold">13 — Real-time driving dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Primes totales N+1" value={formatCurrency(calc?.primesN1 || 0, currency)} />
        <StatCard title="Primes totales N+2" value={formatCurrency(calc?.primesN2 || 0, currency)} />
        <StatCard title="Primes totales N+3" value={formatCurrency(calc?.primesN3 || 0, currency)} />
      </div>

      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Répartition des primes sur 3 ans</h3>
        <SimplePie data={primeDist} />
        <p className="text-xs text-cfo-muted mt-3">Visualisation synthétique du plan de primes N+1 → N+3.</p>
      </div>
    </section>
  );
}
