import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useReportData } from '../_hooks/useReportData';
import { getCurrencySymbol } from '@/modules/module1/utils/formatting';
import { StatCard } from '@/modules/module1/components/report/StatCard';
import { SimpleLine } from '@/modules/module1/components/charts/SimpleLine';
import { Gauge, TrendingUp } from 'lucide-react';

export default function Report8() {
  const { data, currency } = useReportData();
  const sym = getCurrencySymbol(currency);

  const sales = data?.employeeEngagement?.financialHistory?.map((y) => y.sales || 0) || [];
  const spend = data?.employeeEngagement?.financialHistory?.map((y) => y.spending || 0) || [];

  const avgSales = useMemo(() => (sales.length ? sales.reduce((a, b) => a + b, 0) / sales.length : 0), [sales]);
  const avgSpend = useMemo(() => (spend.length ? spend.reduce((a, b) => a + b, 0) / spend.length : 0), [spend]);

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
        <Gauge className="w-5 h-5 text-cfo-accent" />
        <h2 className="text-lg font-bold">8 — Employee Engagement (EE)</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Hours" value={`${(data.calculatedFields?.totalHours || 0).toFixed(0)} h`} />
        <StatCard title="Avg Hours/Person" value={`${(data.calculatedFields?.averageHoursPerPerson || 0).toFixed(0)} h`} />
        <StatCard title="Engagement Score" value={`${(data.calculatedFields?.engagementScore || 0).toFixed(0)}/100`} />
      </div>

      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cfo-accent" /> Financial History</h3>
        <SimpleLine
          series={[
            { label: `Sales (k${sym})`, points: sales },
            { label: `Spending (k${sym})`, points: spend },
          ]}
          width={640}
          height={220}
        />
        <div className="grid grid-cols-2 gap-4 mt-3">
          <StatCard title="Avg Sales" value={`${avgSales.toFixed(1)}k${sym}`} />
          <StatCard title="Avg Spending" value={`${avgSpend.toFixed(1)}k${sym}`} />
        </div>
      </div>
    </section>
  );
}
