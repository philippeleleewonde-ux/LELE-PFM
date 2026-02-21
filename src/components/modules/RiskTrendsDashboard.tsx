// ============================================================================
// MODULE 5 — RPS TRENDS DASHBOARD
// Onglet "Tendances" — 4 zones: KPI Cards, LineChart, Heatmap, Impact Matrix
// Adapted from TrendsDashboard for 6 axes psychosociaux
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  Target,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';
import { useRpsTrendsData } from '@/hooks/useRpsTrendsData';
import { useRpsCampaigns } from '@/hooks/useRpsCampaigns';
import { CampaignTimeline } from '@/components/modules/CampaignTimeline';
import { AXIS_NAMES, QUESTION_AXES } from '@/modules/module5/engine/constants';
import { RPS_QUESTIONS } from '@/modules/module5/data/riskQuestions';

// --- Constants ---------------------------------------------------------------

const AXIS_COLORS: Record<string, string> = {
  axis1: '#ef4444', // red
  axis2: '#f59e0b', // amber
  axis3: '#3b82f6', // blue
  axis4: '#10b981', // green
  axis5: '#8b5cf6', // violet
  axis6: '#ec4899', // pink
};

const GLOBAL_COLOR = '#1a1a2e';
const OBJECTIVE_LINE = 3.5;

// --- Helpers -----------------------------------------------------------------

function DeltaIndicator({ value, inverted = false, suffix = '' }: { value: number | null; inverted?: boolean; suffix?: string }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;

  const isPositive = inverted ? value < 0 : value > 0;
  const isNeutral = Math.abs(value) < 0.05;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" /> 0{suffix}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

function MiniSparkline({ data, color = '#3b82f6' }: { data: Array<{ value: number }>; color?: string }) {
  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width={80} height={30}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ragColor(score: number, type: 'global' | 'participation' | 'enps'): string {
  if (type === 'global') {
    if (score <= 2.5) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    if (score <= 3.5) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  }
  if (type === 'participation') {
    if (score >= 70) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  }
  if (score >= 10) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
  if (score >= 0) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
}

function heatmapCellClass(delta: number): string {
  if (delta <= -0.3) return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
  if (delta >= 0.3) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
}

function heatmapLabel(delta: number): string {
  if (delta <= -0.3) return 'Amélioration';
  if (delta >= 0.3) return 'Dégradation';
  return 'Stable';
}

// --- Question lookup ---------------------------------------------------------

function getQuestionText(code: string): string {
  const q = (RPS_QUESTIONS as Array<{ code: string; question: string }>).find(q => q.code === code);
  return q ? q.question : code;
}

function getQuestionAxis(code: string): string {
  return QUESTION_AXES[code] || 'axis1';
}

// --- Custom Tooltip ----------------------------------------------------------

function RpsTrendsTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RiskTrendsDashboard() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const { campaigns, loading: campaignsLoading } = useRpsCampaigns(false);
  const {
    snapshots,
    loading,
    latestSnapshot,
    previousSnapshot,
    deltas,
    campaignCount,
    getSparklineData,
  } = useRpsTrendsData(selectedCampaignId);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="pt-6"><Skeleton className="h-[350px] w-full" /></CardContent></Card>
      </div>
    );
  }

  // --- Empty state ---
  if (campaignCount === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée de tendance</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Les tendances seront disponibles lorsque le Moteur de Scoring aura calculé
            les résultats d'au moins une campagne RPS.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Rendez-vous dans l'onglet "Moteur de Scoring" pour lancer un calcul.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasTrends = campaignCount >= 2;

  // --- Build chart data ---
  const chartData = snapshots.map((s, idx) => {
    const date = new Date(s.computed_at);
    const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    return {
      name: `Campagne ${idx + 1} (${label})`,
      global: s.global_score,
      axis1: s.axis_scores?.axis1 || 0,
      axis2: s.axis_scores?.axis2 || 0,
      axis3: s.axis_scores?.axis3 || 0,
      axis4: s.axis_scores?.axis4 || 0,
      axis5: s.axis_scores?.axis5 || 0,
      axis6: s.axis_scores?.axis6 || 0,
    };
  });

  // --- Scatter data for impact matrix ---
  const scatterData: Array<{
    x: number; y: number; code: string; question: string; axis: string; color: string;
  }> = [];

  if (latestSnapshot?.question_correlations) {
    for (const [code, correlation] of Object.entries(latestSnapshot.question_correlations)) {
      if (correlation === 0) continue;
      const axis = getQuestionAxis(code);
      const axisScore = latestSnapshot.axis_scores?.[axis] || 3;
      const questionScore = axisScore + (correlation - 0.5) * 0.5;

      scatterData.push({
        x: Math.max(1, Math.min(5, questionScore)),
        y: correlation,
        code,
        question: getQuestionText(code),
        axis,
        color: AXIS_COLORS[axis] || '#666',
      });
    }
  }

  // --- Alerts ---
  const alerts: Array<{ type: 'error' | 'warning' | 'info'; message: string }> = [];

  if (deltas && latestSnapshot) {
    for (const [axisId, delta] of Object.entries(deltas.axes)) {
      if (delta >= 0.5) {
        alerts.push({
          type: 'error',
          message: `Dégradation : "${AXIS_NAMES[axisId]}" a augmenté de +${delta.toFixed(1)} pts`,
        });
      }
    }

    if (latestSnapshot.axis_scores) {
      for (const [axisId, score] of Object.entries(latestSnapshot.axis_scores)) {
        if (score >= 3.5) {
          alerts.push({
            type: 'error',
            message: `Score critique : "${AXIS_NAMES[axisId]}" à ${score.toFixed(1)}/5 (seuil : 3.5)`,
          });
        }
      }
    }

    if (latestSnapshot.by_department) {
      for (const dept of latestSnapshot.by_department) {
        if (dept.participationRate > 0 && dept.participationRate < 50) {
          alerts.push({
            type: 'warning',
            message: `Participation faible : "${dept.name}" à ${dept.participationRate.toFixed(0)}%`,
          });
        }
      }
    }

    if (latestSnapshot.by_department && latestSnapshot.by_department.length >= 2) {
      for (const axisId of Object.keys(AXIS_NAMES)) {
        const scores = latestSnapshot.by_department
          .map(d => d.axisScores[axisId])
          .filter(s => s !== undefined && s > 0);
        if (scores.length >= 2) {
          const gap = Math.max(...scores) - Math.min(...scores);
          if (gap > 1.5) {
            alerts.push({
              type: 'info',
              message: `Écart inter-départements de ${gap.toFixed(1)} pts sur "${AXIS_NAMES[axisId]}"`,
            });
          }
        }
      }
    }
  }

  // --- Heatmap data ---
  const heatmapDepts = latestSnapshot?.by_department || [];

  return (
    <div className="space-y-6">

      {/* ================================================================== */}
      {/* ZONE 0 — Campaign Timeline                                         */}
      {/* ================================================================== */}
      {!campaignsLoading && campaigns.length > 0 && (
        <CampaignTimeline
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          onSelectCampaign={(id) => setSelectedCampaignId(prev => prev === id ? null : id)}
        />
      )}

      {/* Selected campaign info */}
      {selectedCampaignId && latestSnapshot && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 rounded-lg px-4 py-2">
          <Info className="w-4 h-4" />
          <span>
            Résultats affichés pour la campagne sélectionnée
            {previousSnapshot && ' (comparaison avec la campagne précédente)'}
            {' — '}
            <button
              className="text-violet-500 hover:underline font-medium"
              onClick={() => setSelectedCampaignId(null)}
            >
              Voir la dernière campagne
            </button>
          </span>
        </div>
      )}

      {/* ================================================================== */}
      {/* ZONE 1 — KPI Cards                                                 */}
      {/* ================================================================== */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`border ${latestSnapshot ? ragColor(latestSnapshot.global_score, 'global') : ''}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Global RPS</span>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold">
                {latestSnapshot ? latestSnapshot.global_score.toFixed(1) : '—'}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/5</span>
            </div>
            <div className="flex items-center justify-between">
              <DeltaIndicator value={deltas?.globalScore ?? null} inverted />
              <MiniSparkline data={getSparklineData('global')} color={GLOBAL_COLOR} />
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${latestSnapshot ? ragColor(latestSnapshot.participation_rate, 'participation') : ''}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Participation</span>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold">
                {latestSnapshot ? `${latestSnapshot.participation_rate.toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <DeltaIndicator value={deltas?.participation ?? null} suffix="%" />
              <MiniSparkline data={getSparklineData('participation')} color="#3b82f6" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${latestSnapshot ? ragColor(latestSnapshot.enps_score, 'enps') : ''}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">eNPS</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold">
                {latestSnapshot ? (latestSnapshot.enps_score > 0 ? '+' : '') + latestSnapshot.enps_score : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <DeltaIndicator value={deltas?.enps ?? null} />
              <MiniSparkline data={getSparklineData('enps')} color="#10b981" />
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Campagnes</span>
              <LineChartIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold">{campaignCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {latestSnapshot
                ? `Dernière : ${new Date(latestSnapshot.computed_at).toLocaleDateString('fr-FR')}`
                : 'Aucune campagne'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* ZONE 2 — Evolution LineChart                                        */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Évolution des risques psychosociaux
          </CardTitle>
          <CardDescription>
            Score moyen par axe sur {campaignCount} campagne{campaignCount > 1 ? 's' : ''} •
            Échelle : 1 (Satisfait Pleinement) → 5 (Pas satisfait du tout) •
            Seuil d'alerte : ≥ {OBJECTIVE_LINE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length >= 1 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  domain={[1, 5]}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip content={<RpsTrendsTooltip />} />
                <Legend />
                <ReferenceLine
                  y={OBJECTIVE_LINE}
                  stroke="#9ca3af"
                  strokeDasharray="6 4"
                  label={{ value: `Seuil ${OBJECTIVE_LINE}`, position: 'right', style: { fontSize: 10, fill: '#9ca3af' } }}
                />
                <Line
                  type="monotone"
                  dataKey="global"
                  name="Score Global"
                  stroke={GLOBAL_COLOR}
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
                {Object.entries(AXIS_NAMES).map(([axisId, axisName]) => (
                  <Line
                    key={axisId}
                    type="monotone"
                    dataKey={axisId}
                    name={axisName}
                    stroke={AXIS_COLORS[axisId]}
                    strokeWidth={1.5}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Pas assez de données pour afficher un graphique</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* ZONE 3 — Heatmap Départements × Axes                               */}
      {/* ================================================================== */}
      {hasTrends && heatmapDepts.length > 0 && deltas?.byDepartment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Évolution par département
            </CardTitle>
            <CardDescription>
              Delta vs campagne précédente • Vert = amélioration • Rouge = dégradation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Département</th>
                    {Object.values(AXIS_NAMES).map(name => (
                      <th key={name} className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">{name}</th>
                    ))}
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Global</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapDepts
                    .sort((a, b) => b.globalScore - a.globalScore)
                    .map(dept => {
                      const deptDeltas = deltas.byDepartment[dept.name];
                      return (
                        <tr key={dept.name} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{dept.name}</td>
                          {Object.keys(AXIS_NAMES).map(axisId => {
                            const delta = deptDeltas?.axes[axisId] ?? 0;
                            return (
                              <td key={axisId} className="text-center py-2 px-1">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${heatmapCellClass(delta)}`}>
                                  {heatmapLabel(delta)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="text-center py-2 px-1">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${heatmapCellClass(deptDeltas?.globalScore ?? 0)}`}>
                              {heatmapLabel(deptDeltas?.globalScore ?? 0)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================== */}
      {/* ZONE 4 — Impact/Score Matrix (Scatter Plot)                         */}
      {/* ================================================================== */}
      {scatterData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Matrice Impact / Score
            </CardTitle>
            <CardDescription>
              Chaque point = un indicateur RPS • X = score moyen • Y = impact sur le score global (corrélation)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute top-2 left-16 text-[10px] font-medium text-red-500/70 uppercase tracking-wider z-10">
                Agir ici
              </div>
              <div className="absolute top-2 right-8 text-[10px] font-medium text-amber-500/70 uppercase tracking-wider z-10">
                Maintenir
              </div>
              <div className="absolute bottom-12 left-16 text-[10px] font-medium text-gray-400 uppercase tracking-wider z-10">
                Surveiller
              </div>
              <div className="absolute bottom-12 right-8 text-[10px] font-medium text-green-500/70 uppercase tracking-wider z-10">
                Célébrer
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 20, right: 30, left: 5, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number" dataKey="x" domain={[1, 5]} name="Score"
                    tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Score (1=bon, 5=mauvais)', position: 'bottom', style: { fontSize: 10 } }}
                  />
                  <YAxis
                    type="number" dataKey="y" domain={[0, 1]} name="Impact"
                    tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Impact (corrélation)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                  />
                  <ZAxis range={[60, 120]} />
                  <ReferenceLine x={3} stroke="#9ca3af" strokeDasharray="4 4" />
                  <ReferenceLine y={0.5} stroke="#9ca3af" strokeDasharray="4 4" />
                  <Tooltip
                    content={({ payload }: any) => {
                      if (!payload || payload.length === 0) return null;
                      const d = payload[0]?.payload;
                      if (!d) return null;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm max-w-xs">
                          <p className="font-medium mb-1">{d.code}</p>
                          <p className="text-muted-foreground text-xs mb-2">{d.question}</p>
                          <div className="flex gap-4 text-xs">
                            <span>Score: <strong>{d.x.toFixed(2)}</strong></span>
                            <span>Impact: <strong>{d.y.toFixed(2)}</strong></span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.7} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {Object.entries(AXIS_NAMES).map(([axisId, axisName]) => (
                <div key={axisId} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: AXIS_COLORS[axisId] }} />
                  {axisName}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================== */}
      {/* ALERTS — Points d'attention                                        */}
      {/* ================================================================== */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Points d'attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                    alert.type === 'error'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                      : alert.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {alert.type === 'error' && <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  {alert.type === 'warning' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  {alert.type === 'info' && <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info when only 1 campaign */}
      {!hasTrends && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              La heatmap et les deltas de tendance seront disponibles après
              <strong> 2 campagnes</strong> RPS.
            </p>
            <p className="text-xs mt-1">
              Actuellement : {campaignCount} campagne enregistrée.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
