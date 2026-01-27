import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FormData, Currency } from '@/modules/module1/types';
import { formatCurrency, getCurrencySymbol } from '@/modules/module1/utils/formatting';
import { BarChart3, ArrowLeft, FileDown, LayoutGrid, Activity, Gauge, LineChart, TrendingUp, Target, Shield, DollarSign } from 'lucide-react';

interface StoredPayload {
  formData: FormData;
  generatedAt: string;
  reportType: 'summary' | 'detailed' | 'analysis';
}

function StatCard({ title, value, subtitle, accent = 'text-cfo-accent' }: { title: string; value: React.ReactNode; subtitle?: string; accent?: string }) {
  return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700 shadow-inner">
      <p className="text-sm text-cfo-muted mb-1">{title}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  );
}

function ProgressBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{percent.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded">
        <div className="h-2 bg-cfo-accent rounded" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

export default function ReportPage() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState<StoredPayload | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('cfo_report_data');
      if (raw) {
        setPayload(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Unable to load report data', e);
    }
  }, []);

  const data = payload?.formData;
  const calc = data?.calculatedFields as any;
  const currency = (data?.selectedCurrency || 'EUR') as Currency;
  const sym = getCurrencySymbol(currency);

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

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-cfo text-cfo-text px-6 py-10 flex flex-col items-center justify-center">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-extrabold mb-3">No report data</h1>
          <p className="text-cfo-muted mb-6">Générez d'abord un rapport depuis l'application, puis revenez ici.</p>
          <Link href="/" className="form-button form-button-primary inline-flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'application</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cfo text-cfo-text">
      {/* Header */}
      <div className="border-b border-cfo-border bg-cfo-card/60 backdrop-blur">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-cfo-accent">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Financial & Analytics Report</h1>
              <p className="text-xs text-cfo-muted">Generated at {new Date(payload!.generatedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="form-button form-button-secondary inline-flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </Link>
            <button
              className="form-button form-button-primary inline-flex items-center space-x-2"
              onClick={() => window.print()}
              title="Export PDF via l'impression du navigateur"
            >
              <FileDown className="w-4 h-4" />
              <span>Exporter (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Side Nav */}
        <nav className="lg:col-span-1 space-y-2 sticky top-4 self-start hidden lg:block">
          {[
            { id: 's7', label: '7 — PRL' },
            { id: 's8', label: '8 — EE' },
            { id: 's9', label: '9 — IPLE' },
            { id: 's10', label: '10 — Economic breakdown' },
            { id: 's11', label: '11 — Threshold' },
            { id: 's12', label: '12 — 3-year plan' },
            { id: 's13', label: '13 — Dashboard' },
          ].map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block px-3 py-2 rounded-md bg-gray-900/40 border border-gray-700 text-sm hover:border-cfo-accent">
              {s.label}
            </a>
          ))}
        </nav>

        {/* Sections */}
        <div className="lg:col-span-4 space-y-10">
          {/* Section 7 */}
          <section id="s7" className="space-y-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-cfo-accent" />
              <h2 className="text-lg font-bold">7 — Programming data of potentially recoverable loss accounts (PRL)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="VaR (historique + UL)" value={formatCurrency(calc?.var || 0, currency)} accent="text-yellow-300" />
              <StatCard title="PRL (95% de VaR)" value={formatCurrency(calc?.prlAmount || calc?.prl || 0, currency)} accent="text-blue-300" />
              <StatCard title="Historic Risk Appetite" value={formatCurrency(calc?.historicRiskAppetite || 0, currency)} accent="text-purple-300" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-cfo-accent" /> Risk Distribution</h3>
                <div className="space-y-2">
                  {riskTotals.items.map((r) => (
                    <ProgressBar key={r.name} label={r.name} percent={r.pct} />
                  ))}
                </div>
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

          {/* Section 8 */}
          <section id="s8" className="space-y-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cfo-accent" />
              <h2 className="text-lg font-bold">8 — Employee Engagement (EE)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total Hours" value={`${calc?.totalHours || 0} h`} />
              <StatCard title="Avg Hours/Person" value={`${calc?.averageHoursPerPerson || 0} h`} />
              <StatCard title="Engagement Score" value={`${calc?.engagementScore || 0}/100`} />
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cfo-accent" /> Financial History (last {data.employeeEngagement.financialHistory.length} periods)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.employeeEngagement.financialHistory.map((y, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <p className="text-xs text-cfo-muted mb-2">{y.year}</p>
                    <p className="text-green-300 text-sm">Sales: {`${y.sales.toFixed(1)}k${sym}`}</p>
                    <p className="text-red-300 text-sm">Spending: {`${y.spending.toFixed(1)}k${sym}`}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section id="s9" className="space-y-4">
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-cfo-accent" />
              <h2 className="text-lg font-bold">9 — IPLE Accounts</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Gains N+1" value={formatCurrency(calc?.gainsN1 || 0, currency)} />
              <StatCard title="Gains N+2" value={formatCurrency(calc?.gainsN2 || 0, currency)} />
              <StatCard title="Gains N+3" value={formatCurrency(calc?.gainsN3 || 0, currency)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Cash-Flow N+1 (67%)" value={formatCurrency(calc?.cashFlowN1 || 0, currency)} accent="text-green-300" />
              <StatCard title="Cash-Flow N+2 (67%)" value={formatCurrency(calc?.cashFlowN2 || 0, currency)} accent="text-green-300" />
              <StatCard title="Cash-Flow N+3 (67%)" value={formatCurrency(calc?.cashFlowN3 || 0, currency)} accent="text-green-300" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Bonuses N+1 (33%)" value={formatCurrency(calc?.primesN1 || 0, currency)} accent="text-blue-300" />
              <StatCard title="Bonuses N+2 (33%)" value={formatCurrency(calc?.primesN2 || 0, currency)} accent="text-blue-300" />
              <StatCard title="Bonuses N+3 (33%)" value={formatCurrency(calc?.primesN3 || 0, currency)} accent="text-blue-300" />
            </div>
          </section>

          {/* Section 10 */}
          <section id="s10" className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cfo-accent" />
              <h2 className="text-lg font-bold">10 — Economic benefit breakdown</h2>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700">
              <p className="text-sm text-cfo-muted mb-3">Synthèse des bénéfices programmés par type de risque. Pour le détail par ligne d’activité et par indicateur, référez-vous aux pages de l’application.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {riskTotals.items.map((r) => (
                  <div key={r.name} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <p className="text-sm font-medium mb-2">{r.name}</p>
                    <ProgressBar label={`Part dans l'exposition`} percent={r.pct} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section id="s11" className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cfo-accent" />
              <h2 className="text-lg font-bold">11 — Risk Appetite Threshold Breakdown</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Historic Threshold (Total)" value={formatCurrency(calc?.totalSeuilHistorique || 0, currency)} />
              <StatCard title="Expected Loss (Historic)" value={formatCurrency(calc?.totalELHistorique || 0, currency)} />
              <StatCard title="Forecast Expected Loss" value={formatCurrency(calc?.forecastEL || 0, currency)} />
            </div>
          </section>

          {/* Section 12 */}
          <section id="s12" className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cfo-accent" />
              <h2 className="text-lg font-bold">12 — 3-Year Plan — Bonus breakdowns</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Quarterly N+1" value={formatCurrency(calc?.quarterlyBonusN1 || 0, currency)} />
              <StatCard title="Quarterly N+2" value={formatCurrency(calc?.quarterlyBonusN2 || 0, currency)} />
              <StatCard title="Quarterly N+3" value={formatCurrency(calc?.quarterlyBonusN3 || 0, currency)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Monthly N+1" value={formatCurrency(calc?.monthlyBonusN1 || 0, currency)} />
              <StatCard title="Monthly N+2" value={formatCurrency(calc?.monthlyBonusN2 || 0, currency)} />
              <StatCard title="Monthly N+3" value={formatCurrency(calc?.monthlyBonusN3 || 0, currency)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Weekly N+1" value={formatCurrency(calc?.weeklyBonusN1 || 0, currency)} />
              <StatCard title="Weekly N+2" value={formatCurrency(calc?.weeklyBonusN2 || 0, currency)} />
              <StatCard title="Weekly N+3" value={formatCurrency(calc?.weeklyBonusN3 || 0, currency)} />
            </div>
          </section>

          {/* Section 13 */}
          <section id="s13" className="space-y-4">
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
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-cfo-accent" /> Insights</h3>
              <ul className="list-disc list-inside text-sm text-cfo-muted space-y-1">
                <li>Renforcez l'engagement (EE) pour accroître {`l'`}effet de levier IPLE et augmenter Cash-Flow (67%).</li>
                <li>Réduisez les catégories de risque dominantes (top 2) pour faire baisser la VaR et améliorer le PRL.</li>
                <li>Optimisez la répartition trimestrielle/mois/semaine pour lisser les sorties de primes.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
