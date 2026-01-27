import React from 'react';
import { Link } from 'react-router-dom';
import { useReportData } from '../_hooks/useReportData';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { StatCard } from '@/modules/module1/components/report/StatCard';
import { SimpleStackedBar } from '@/modules/module1/components/charts/SimpleStackedBar';
import { TrendingUp } from 'lucide-react';

export default function Report12() {
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

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-cfo-accent" />
        <h2 className="text-lg font-bold">12 — 3-Year Plan — Bonus breakdowns</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Bonuses N+1 (33%)" value={formatCurrency(calc?.primesN1 || 0, currency)} />
        <StatCard title="Bonuses N+2 (33%)" value={formatCurrency(calc?.primesN2 || 0, currency)} />
        <StatCard title="Bonuses N+3 (33%)" value={formatCurrency(calc?.primesN3 || 0, currency)} />
      </div>

      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Périodisation (montant par période)</h3>
        <SimpleStackedBar
          groups={[
            { label: 'N+1', segments: [ { label: 'Quarterly', value: calc.quarterlyBonusN1 || 0 }, { label: 'Monthly', value: calc.monthlyBonusN1 || 0 }, { label: 'Weekly', value: calc.weeklyBonusN1 || 0 } ] },
            { label: 'N+2', segments: [ { label: 'Quarterly', value: calc.quarterlyBonusN2 || 0 }, { label: 'Monthly', value: calc.monthlyBonusN2 || 0 }, { label: 'Weekly', value: calc.weeklyBonusN2 || 0 } ] },
            { label: 'N+3', segments: [ { label: 'Quarterly', value: calc.quarterlyBonusN3 || 0 }, { label: 'Monthly', value: calc.monthlyBonusN3 || 0 }, { label: 'Weekly', value: calc.weeklyBonusN3 || 0 } ] },
          ]}
          width={640}
          height={240}
        />
        <p className="text-xs text-cfo-muted mt-3">Chaque barre représente le montant unitaire par période (trimestre, mois, semaine) dérivé des primes annuelles.</p>
      </div>
    </section>
  );
}
