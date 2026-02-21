// ============================================================================
// MODULE 2 — SCORING DASHBOARD
// Onglet "Moteur de Scoring" — Tableaux de reporting quantitatif & qualitatif
// + Graphiques d'analyse psychologique (Recharts)
// Source: 9-M2-Centredecalcul-MMS.xls
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useScoringEngine } from '@/hooks/useScoringEngine';
import { useCompany } from '@/contexts/CompanyContext';
import { ScoringSnapshotService } from '@/modules/module2/services/ScoringSnapshotService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Users,
  BarChart3,
  Target,
  ClipboardList,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
} from 'recharts';
import type {
  AlertLevel,
  ThemeScore,
  LineParticipation,
  DCScore,
  AdhesionResult,
  ActionRecommendation,
} from '@/modules/module2/engine/types';
import { DC_NAMES } from '@/modules/module2/engine/constants';

// --- Props ------------------------------------------------------------------

interface ScoringDashboardProps {
  surveyId: string | null;
}

// --- Alert helpers ----------------------------------------------------------

function alertColor(level: AlertLevel): string {
  if (level === 1) return 'text-emerald-600 dark:text-emerald-400';
  if (level === 2) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function alertBg(level: AlertLevel): string {
  if (level === 1) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (level === 2) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-red-50 dark:bg-red-950/30';
}

function AlertIcon({ level }: { level: AlertLevel }) {
  if (level === 1) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (level === 2) return <AlertCircle className="w-4 h-4 text-amber-500" />;
  return <AlertTriangle className="w-4 h-4 text-red-500" />;
}

function urgencyBadge(urgency: ActionRecommendation['urgency']) {
  if (urgency === 'urgent') return <Badge className="text-xs bg-red-500 hover:bg-red-600 text-white border-0">Urgent</Badge>;
  if (urgency === 'to-improve') return <Badge className="text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">À améliorer</Badge>;
  return <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0">OK</Badge>;
}

function alertBadge(_level: AlertLevel, label: string) {
  if (label === 'Satisfait Pleinement') return <Badge className="text-xs bg-blue-500 hover:bg-blue-600 text-white border-0">{label}</Badge>;
  if (label === 'Satisfait') return <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0">{label}</Badge>;
  if (label === 'Satisfait moyennement') return <Badge className="text-xs bg-amber-400 hover:bg-amber-500 text-white border-0">{label}</Badge>;
  if (label === 'Satisfait insuffisamment') return <Badge className="text-xs bg-orange-600 hover:bg-orange-700 text-white border-0">{label}</Badge>;
  return <Badge className="text-xs bg-red-500 hover:bg-red-600 text-white border-0">{label}</Badge>;
}

function participationBadge(level: AlertLevel, label: string) {
  if (level === 1) return <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0">{label}</Badge>;
  if (level === 2) return <Badge className="text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">{label}</Badge>;
  return <Badge className="text-xs bg-red-500 hover:bg-red-600 text-white border-0">{label}</Badge>;
}

function priorityBadge(priority: string) {
  if (priority === 'PRIORITE FORTE') return <Badge className="text-xs bg-red-500 hover:bg-red-600 text-white border-0">Priorité forte</Badge>;
  if (priority === 'PRIORITE MOYENNE') return <Badge className="text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">Priorité moyenne</Badge>;
  return <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0">Priorité faible</Badge>;
}

// --- Chart color helpers ----------------------------------------------------

function scoreToColor(score: number): string {
  if (score <= 1.5) return '#3b82f6';  // blue
  if (score <= 2.5) return '#10b981';  // emerald
  if (score <= 3.5) return '#f59e0b';  // amber
  if (score <= 4.5) return '#ea580c';  // orange
  return '#ef4444';                     // red
}

function rateToColor(rate: number): string {
  if (rate >= 50) return '#10b981';
  if (rate >= 30) return '#22c55e';
  if (rate >= 20) return '#f59e0b';
  if (rate >= 10) return '#ea580c';
  return '#ef4444';
}

// --- Collapsible section ----------------------------------------------------

function Section({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center gap-3 text-base">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

// --- Accordion for lines ----------------------------------------------------

function LineAccordion({
  lineName,
  children,
}: {
  lineName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-2 text-sm font-medium hover:bg-accent/50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {lineName}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// --- Theme table (reusable) -------------------------------------------------

function ThemeTable({ themes, globalRow }: { themes: ThemeScore[]; globalRow?: ThemeScore }) {
  const rows = globalRow ? [globalRow, ...themes] : themes;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Thème</TableHead>
          <TableHead className="text-center">Score moyen</TableHead>
          <TableHead className="text-center">Taux satisfaction</TableHead>
          <TableHead className="text-center">Taux insatisfaction</TableHead>
          <TableHead className="text-center">Alerte</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(t => (
          <TableRow
            key={t.themeId}
            className={t.themeId === 'global' ? 'font-semibold bg-muted/50' : ''}
          >
            <TableCell>{t.themeName}</TableCell>
            <TableCell className="text-center">
              <span className={alertColor(t.alertLevel)}>{t.avgScore.toFixed(2)}</span>
            </TableCell>
            <TableCell className="text-center text-emerald-600 dark:text-emerald-400">
              {t.satisfactionRate.toFixed(1)}%
            </TableCell>
            <TableCell className="text-center text-red-600 dark:text-red-400">
              {(100 - t.satisfactionRate).toFixed(1)}%
            </TableCell>
            <TableCell className="text-center">
              {alertBadge(t.alertLevel, t.alertLabel)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// =============================================================================
// CHART COMPONENTS
// =============================================================================

// --- Chart A: Horizontal Bar — Participation par Ligne ----------------------

function ParticipationBarChart({ data }: { data: LineParticipation[] }) {
  const sorted = [...data].sort((a, b) => a.rate - b.rate);
  const chartData = sorted.map(d => ({
    name: d.lineName.length > 20 ? d.lineName.slice(0, 18) + '…' : d.lineName,
    fullName: d.lineName,
    rate: d.rate,
    participants: d.participants,
    total: d.totalWorkforce,
  }));

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Taux de participation par département
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              formatter={(value: number, _name: string, props: any) => [`${value}% (${props.payload.participants}/${props.payload.total})`, 'Participation']}
              labelFormatter={(label) => label}
            />
            <ReferenceLine x={50} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={2} label={{ value: 'Seuil 50%', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
            <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={20}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={rateToColor(entry.rate)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// --- Chart B: Radar — Profil Psychologique (4 thèmes) ----------------------

const THEME_PSYCHO_LABELS: Record<string, string> = {
  'Votre Entreprise': 'Appartenance',
  'Votre Travail': 'Charge mentale',
  'Vos Relations': 'Sécurité psychologique',
  'Votre Avenir': 'Projection carrière',
};

function PsychologicalRadarChart({ themes, lineThemes }: { themes: ThemeScore[]; lineThemes: Record<string, ThemeScore[]> }) {
  // Global data — invert scale so higher = better (5 - score gives satisfaction direction)
  const radarData = themes.map(t => ({
    theme: THEME_PSYCHO_LABELS[t.themeName] || t.themeName,
    global: Math.round((5 - t.avgScore) * 100) / 100,
    satisfaction: t.satisfactionRate,
  }));

  // Add line overlays (top 3 lines)
  const lineNames = Object.keys(lineThemes).slice(0, 3);
  const OVERLAY_COLORS = ['#06b6d4', '#a855f7', '#f43f5e'];

  for (const lineName of lineNames) {
    const lt = lineThemes[lineName];
    lt.forEach((t, i) => {
      if (radarData[i]) {
        (radarData[i] as any)[lineName] = Math.round((5 - t.avgScore) * 100) / 100;
      }
    });
  }

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Profil psychologique — 4 dimensions du bien-être
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.15)" />
              <PolarAngleAxis
                dataKey="theme"
                tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 4]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name="Global"
                dataKey="global"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              {lineNames.map((lineName, i) => (
                <Radar
                  key={lineName}
                  name={lineName}
                  dataKey={lineName}
                  stroke={OVERLAY_COLORS[i]}
                  fill={OVERLAY_COLORS[i]}
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              ))}
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(value: number) => [`${value.toFixed(2)} / 4`, 'Score bien-être']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Global
          </span>
          {lineNames.map((name, i) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: OVERLAY_COLORS[i] }} /> {name}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Échelle inversée : plus la zone est étendue, meilleur est le bien-être
        </p>
      </CardContent>
    </Card>
  );
}

// --- Chart B2: Donut — Satisfaction vs Insatisfaction -----------------------

function SatisfactionDonut({ globalSatisfaction }: { globalSatisfaction: ThemeScore }) {
  const satRate = globalSatisfaction.satisfactionRate;
  const insatRate = Math.round((100 - satRate) * 10) / 10;

  const data = [
    { name: 'Satisfaits', value: satRate, color: '#10b981' },
    { name: 'Insatisfaits', value: insatRate, color: '#ef4444' },
  ];

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Polarisation satisfaction / insatisfaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold text-emerald-400">{satRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Satisfaits (score ≤ 2.5)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">{insatRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Insatisfaits (score &gt; 2.5)</div>
            </div>
            <div className="pt-1 border-t border-white/10">
              <div className="text-lg font-semibold" style={{ color: scoreToColor(globalSatisfaction.avgScore) }}>
                {globalSatisfaction.avgScore.toFixed(2)} / 5
              </div>
              <div className="text-xs text-muted-foreground">Score moyen global</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Chart C: Heatmap — Souffrances par Département × Thème ----------------

function SufferingHeatmap({ lineThemes }: { lineThemes: Record<string, ThemeScore[]> }) {
  const themeLabels = ['Appartenance', 'Charge mentale', 'Sécurité psycho.', 'Projection carrière'];
  const lines = Object.entries(lineThemes);

  function cellColor(score: number): string {
    if (score <= 1.5) return '#3b82f6';
    if (score <= 2.0) return '#10b981';
    if (score <= 2.5) return '#22c55e';
    if (score <= 3.0) return '#f59e0b';
    if (score <= 3.5) return '#ea580c';
    if (score <= 4.0) return '#ef4444';
    return '#dc2626';
  }

  function cellTextColor(score: number): string {
    return score <= 2.5 ? '#ffffff' : '#ffffff';
  }

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Carte des souffrances — Département × Dimension psychologique
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground font-medium text-xs">Département</th>
                {themeLabels.map(label => (
                  <th key={label} className="text-center p-2 text-muted-foreground font-medium text-xs">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map(([lineName, themes]) => (
                <tr key={lineName}>
                  <td className="p-2 text-xs font-medium max-w-[140px] truncate">{lineName}</td>
                  {themes.map((t, i) => (
                    <td key={i} className="p-1 text-center">
                      <div
                        className="rounded-md py-2 px-1 font-bold text-xs transition-all hover:scale-105"
                        style={{
                          backgroundColor: cellColor(t.avgScore),
                          color: cellTextColor(t.avgScore),
                          opacity: 0.9,
                        }}
                      >
                        {t.avgScore.toFixed(2)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground">
          <span>Bien-être</span>
          <div className="flex gap-0.5">
            {['#3b82f6', '#10b981', '#22c55e', '#f59e0b', '#ea580c', '#ef4444'].map(c => (
              <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span>Souffrance</span>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Chart D: Scatter/Bubble — Matrice Souffrance × Impact -----------------

function PriorityBubbleChart({ adhesion }: { adhesion: AdhesionResult[] }) {
  const data = adhesion.map(a => ({
    x: a.mssScore,
    y: a.m1Score,
    z: 200,
    name: `${a.dcId} — ${a.dcName}`,
    shortName: a.dcId,
    priority: a.priority,
  }));

  function priorityColor(p: string): string {
    if (p === 'PRIORITE FORTE') return '#ef4444';
    if (p === 'PRIORITE MOYENNE') return '#f59e0b';
    return '#10b981';
  }

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Matrice de priorisation — Satisfaction × Importance stratégique
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ left: 10, right: 30, top: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Satisfaction (MSS)"
              domain={[1, 5]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: '← Satisfait    Insatisfait →', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Importance M1"
              domain={[1, 5]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Importance ↑', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
            />
            <ZAxis type="number" dataKey="z" range={[300, 500]} />
            {/* Quadrant lines */}
            <ReferenceLine x={2.5} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
            <ReferenceLine y={3} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              formatter={(_value: any, name: string) => {
                if (name === 'Satisfaction (MSS)') return [(_value as number).toFixed(2), 'Score MSS'];
                if (name === 'Importance M1') return [(_value as number).toFixed(2), 'Importance'];
                return [_value, name];
              }}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.name || ''}
            />
            <Scatter data={data} shape="circle">
              {data.map((entry, i) => (
                <Cell key={i} fill={priorityColor(entry.priority)} fillOpacity={0.8} stroke={priorityColor(entry.priority)} strokeWidth={2} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {/* Labels over chart */}
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
          {data.map((d, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: priorityColor(d.priority) }} />
              {d.shortName}
            </span>
          ))}
        </div>
        {/* Quadrant legend */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground max-w-md mx-auto">
          <div className="text-center p-1.5 rounded bg-red-500/10 border border-red-500/20">
            ↗ Insatisfait + Important = <span className="text-red-400 font-semibold">PRIORITÉ FORTE</span>
          </div>
          <div className="text-center p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            ↙ Satisfait + Modéré = <span className="text-emerald-400 font-semibold">PRIORITÉ FAIBLE</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Chart E: Urgency Summary Bar — Actions par DC -------------------------

function ActionUrgencyChart({ actionPlans }: { actionPlans: Array<{ lineName: string; recommendations: ActionRecommendation[] }> }) {
  // Aggregate urgency counts across all lines, by DC
  const dcAgg: Record<string, { urgent: number; improve: number; ok: number }> = {};
  for (const plan of actionPlans) {
    for (const rec of plan.recommendations) {
      if (!dcAgg[rec.dcId]) dcAgg[rec.dcId] = { urgent: 0, improve: 0, ok: 0 };
      if (rec.urgency === 'urgent') dcAgg[rec.dcId].urgent++;
      else if (rec.urgency === 'to-improve') dcAgg[rec.dcId].improve++;
      else dcAgg[rec.dcId].ok++;
    }
  }

  const chartData = Object.entries(dcAgg).map(([dcId, counts]) => ({
    name: dcId,
    fullName: DC_NAMES[dcId] || dcId,
    urgent: counts.urgent,
    improve: counts.improve,
    ok: counts.ok,
  }));

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Répartition des urgences par Domaine Clé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ left: 0, right: 20, top: 5, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="fullName" tick={{ fill: '#cbd5e1', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={80} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || _label}
            />
            <Bar dataKey="urgent" name="Urgent" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
            <Bar dataKey="improve" name="À améliorer" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="ok" name="OK" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Urgent</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> À améliorer</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> OK</span>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main component ---------------------------------------------------------

export function ScoringDashboard({ surveyId }: ScoringDashboardProps) {
  const { result, loading, error } = useScoringEngine(surveyId);
  const { companyId } = useCompany();
  const savedRef = useRef<string | null>(null);

  // Auto-save scoring snapshot when results are computed
  useEffect(() => {
    if (result && surveyId && companyId && savedRef.current !== surveyId) {
      savedRef.current = surveyId;
      ScoringSnapshotService.save(surveyId, companyId, result).catch(err => {
        console.error('Snapshot save failed:', err);
      });
    }
  }, [result, surveyId, companyId]);

  if (!surveyId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Sélectionnez un questionnaire pour voir le moteur de scoring</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-70" />
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Réponses</div>
          <div className="text-2xl font-bold">{result.responseCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Participation</div>
          <div className={`text-2xl font-bold ${alertColor(result.participation.global.alertLevel)}`}>
            {result.participation.global.rate.toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Score global</div>
          <div className={`text-2xl font-bold ${alertColor(result.globalSatisfaction.alertLevel)}`}>
            {result.globalSatisfaction.avgScore.toFixed(2)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Satisfaction</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {result.globalSatisfaction.satisfactionRate.toFixed(1)}%
          </div>
        </Card>
      </div>

      {/* ================================================================
          SECTION A — Participation
      ================================================================ */}
      <Section
        title="A — Participation (rapport quantitatif)"
        icon={<Users className="w-4 h-4" />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ligne d'activité</TableHead>
              <TableHead className="text-center">Effectif</TableHead>
              <TableHead className="text-center">Participants</TableHead>
              <TableHead className="text-center">Taux</TableHead>
              <TableHead className="text-center">Alerte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="font-semibold bg-muted/50">
              <TableCell>Global</TableCell>
              <TableCell className="text-center">{result.participation.global.totalWorkforce}</TableCell>
              <TableCell className="text-center">{result.participation.global.participants}</TableCell>
              <TableCell className="text-center">
                <span className={alertColor(result.participation.global.alertLevel)}>
                  {result.participation.global.rate.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-center">
                {participationBadge(result.participation.global.alertLevel, result.participation.global.label)}
              </TableCell>
            </TableRow>
            {result.participation.byLine.map(lp => (
              <TableRow key={lp.lineName}>
                <TableCell>{lp.lineName}</TableCell>
                <TableCell className="text-center">{lp.totalWorkforce}</TableCell>
                <TableCell className="text-center">{lp.participants}</TableCell>
                <TableCell className="text-center">
                  <span className={alertColor(lp.alertLevel)}>{lp.rate.toFixed(1)}%</span>
                </TableCell>
                <TableCell className="text-center">
                  {participationBadge(lp.alertLevel, lp.label)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 📊 Chart: Horizontal bar participation */}
        <ParticipationBarChart data={result.participation.byLine} />
      </Section>

      {/* ================================================================
          SECTION B — Satisfaction Globale
      ================================================================ */}
      <Section
        title="B — Satisfaction Globale (rapport quantitatif)"
        icon={<BarChart3 className="w-4 h-4" />}
      >
        <ThemeTable themes={result.themes} globalRow={result.globalSatisfaction} />

        {/* 📊 Charts: Radar psychologique + Donut polarisation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <PsychologicalRadarChart themes={result.themes} lineThemes={result.lineThemes} />
          <SatisfactionDonut globalSatisfaction={result.globalSatisfaction} />
        </div>
      </Section>

      {/* ================================================================
          SECTION C — Satisfaction par Ligne
      ================================================================ */}
      <Section
        title="C — Satisfaction par Ligne d'Activité"
        icon={<BarChart3 className="w-4 h-4" />}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {Object.entries(result.lineThemes).map(([lineName, themes]) => (
            <LineAccordion key={lineName} lineName={lineName}>
              <ThemeTable themes={themes} />
            </LineAccordion>
          ))}
        </div>

        {/* 📊 Chart: Heatmap souffrances */}
        <SufferingHeatmap lineThemes={result.lineThemes} />
      </Section>

      {/* ================================================================
          SECTION D — Domaines Clés & Priorités
      ================================================================ */}
      <Section
        title="D — Domaines Clés & Priorités (rapport qualitatif)"
        icon={<Target className="w-4 h-4" />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domaine Clé</TableHead>
              <TableHead className="text-center">Score moyen</TableHead>
              <TableHead className="text-center">Satisfaction</TableHead>
              <TableHead className="text-center">Importance M1</TableHead>
              <TableHead className="text-center">Priorité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.adhesion.global.map(a => (
              <TableRow key={a.dcId}>
                <TableCell>
                  <span className="font-medium">{a.dcId}</span>
                  <span className="text-muted-foreground ml-2 text-sm">— {a.dcName}</span>
                </TableCell>
                <TableCell className="text-center">{a.mssScore.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <span className={alertColor(
                    a.mssScore <= 2 ? 1 : a.mssScore <= 3 ? 2 : 3
                  )}>
                    {a.satisfactionLabel}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm">{a.importanceLabel}</span>
                </TableCell>
                <TableCell className="text-center">
                  {priorityBadge(a.priority)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 📊 Chart: Bubble matrice priorisation */}
        <PriorityBubbleChart adhesion={result.adhesion.global} />
      </Section>

      {/* ================================================================
          SECTION E — Plan d'Actions par Ligne
      ================================================================ */}
      <Section
        title="E — Plan d'Actions par Ligne (rapport qualitatif)"
        icon={<ClipboardList className="w-4 h-4" />}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {result.actionPlans.map(plan => (
            <LineAccordion key={plan.lineName} lineName={plan.lineName}>
              <div className="space-y-4">
                {Object.entries(plan.recommendationsByDC).map(([dcId, recs]) => {
                  if (recs.length === 0) return null;
                  return (
                    <div key={dcId}>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <span className="text-muted-foreground">{dcId}</span>
                        — {DC_NAMES[dcId]}
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Code</TableHead>
                            <TableHead>Recommandation</TableHead>
                            <TableHead className="text-center w-24">Score</TableHead>
                            <TableHead className="text-center w-28">Urgence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recs.map(rec => (
                            <TableRow key={rec.questionCode} className={alertBg(
                              rec.urgency === 'urgent' ? 3 : rec.urgency === 'to-improve' ? 2 : 1
                            )}>
                              <TableCell className="text-xs text-muted-foreground font-mono">
                                {rec.questionCode}
                              </TableCell>
                              <TableCell className="text-sm">{rec.actionLabel}</TableCell>
                              <TableCell className="text-center font-medium">
                                {rec.avgScore.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                {urgencyBadge(rec.urgency)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            </LineAccordion>
          ))}
        </div>

        {/* 📊 Chart: Urgency stacked bars */}
        <ActionUrgencyChart actionPlans={result.actionPlans} />
      </Section>
    </div>
  );
}
