// ============================================================================
// MODULE 2 — INSIGHTS IA DASHBOARD (Coach Voice + Modern Design)
// 6 sections: Executive Summary, Forces/Faiblesses, Alertes, Matrice Stratégique,
// Analyse Départements, Plan d'Actions
// Pure frontend — no API calls, deterministic templates from real data
// ============================================================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BrainCircuit, TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle,
  Info, CheckCircle2, ThumbsUp, ThumbsDown, Target, Users, ChevronDown,
  ChevronUp, Sparkles, ArrowRight, Building2, Zap, MessageCircle,
  Shield, Eye, PartyPopper, Flame, HeartPulse, Megaphone,
} from 'lucide-react';
import { useScoringEngine } from '@/hooks/useScoringEngine';
import { useTrendsData } from '@/hooks/useTrendsData';
import { InsightsEngine } from '@/modules/module2/engine/InsightsEngine';
import type { InsightsResult, InsightAlert, StrategicQuadrant, DepartmentInsight } from '@/modules/module2/engine/InsightsEngine';

interface InsightsAIDashboardProps {
  surveyId: string | null;
}

export function InsightsAIDashboard({ surveyId }: InsightsAIDashboardProps) {
  const { result, loading: scoringLoading } = useScoringEngine(surveyId);
  const { latestSnapshot, previousSnapshot, campaignCount, loading: trendsLoading } = useTrendsData(surveyId);

  const insights = useMemo<InsightsResult | null>(() => {
    if (!result) return null;
    return InsightsEngine.generate(result, latestSnapshot, previousSnapshot, campaignCount);
  }, [result, latestSnapshot, previousSnapshot, campaignCount]);

  if (scoringLoading || trendsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#FF4530]/20 animate-pulse" />
          <BrainCircuit className="w-8 h-8 text-[#FF4530] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-muted-foreground font-medium">Votre coach analyse les données...</p>
      </div>
    );
  }

  if (!result || !insights) {
    return (
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-center relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4530]/5 rounded-full blur-3xl pointer-events-none" />
          <BrainCircuit className="w-16 h-16 mx-auto mb-6 text-slate-600" />
          <h3 className="text-xl font-bold text-white mb-2">Insights IA</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Lancez une campagne de satisfaction pour que votre coach puisse analyser les données et vous guider.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Coach Badge */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#FF4530]/10 via-transparent to-transparent border border-[#FF4530]/20 w-fit">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FF4530] animate-pulse" />
          <Sparkles className="w-4 h-4 text-[#FF4530]" />
        </div>
        <span className="text-sm font-medium text-foreground">
          Coach IA — Analyse de {insights.executiveSummary.responseCount} réponses
        </span>
        {campaignCount > 1 && (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
            {campaignCount} campagnes
          </span>
        )}
      </div>

      {/* Section 1: Executive Summary */}
      <SectionExecutiveSummary summary={insights.executiveSummary} />

      {/* Section 2: Top Forces / Faiblesses */}
      <SectionStrengthsWeaknesses
        strengths={insights.strengths}
        weaknesses={insights.weaknesses}
      />

      {/* Section 3: Alerts */}
      {insights.alerts.length > 0 && (
        <SectionAlerts alerts={insights.alerts} />
      )}

      {/* Section 4: Strategic Matrix */}
      <SectionStrategicMatrix quadrants={insights.strategicMatrix} />

      {/* Section 5: Department Analysis */}
      {insights.departmentInsights.length > 0 && (
        <SectionDepartments departments={insights.departmentInsights} />
      )}

      {/* Section 6: Action Plan */}
      <SectionActionPlan actions={insights.actionPlan} />
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  // Scale 1-5 → 0-100%  (1 = best → 100%, 5 = worst → 0%)
  const pct = Math.max(0, Math.min(100, ((5 - score) / 4) * 100));
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color = score <= 2.0 ? '#22c55e'
    : score <= 2.5 ? '#84cc16'
    : score <= 3.0 ? '#f59e0b'
    : score <= 3.5 ? '#f97316'
    : '#ef4444';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-accent" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
    </svg>
  );
}

function MoodBadge({ mood }: { mood: DepartmentInsight['mood'] }) {
  const config = {
    excellent: { label: 'Excellent', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', icon: PartyPopper },
    good: { label: 'Bon', bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', icon: ThumbsUp },
    attention: { label: 'Attention', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', icon: Eye },
    critical: { label: 'Critique', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', icon: Flame },
  };

  const c = config[mood];
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;

  const isImprovement = delta <= -0.1;
  const isDegradation = delta >= 0.1;

  if (!isImprovement && !isDegradation) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
        <Minus className="w-3 h-3" /> Stable
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
      isImprovement
        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40'
        : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40'
    }`}>
      {isImprovement ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}
    </span>
  );
}

function CoachBubble({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`relative rounded-2xl p-4 text-sm leading-relaxed ${
      accent
        ? 'bg-gradient-to-br from-[#FF4530]/5 via-orange-50/50 to-amber-50/30 dark:from-[#FF4530]/10 dark:via-orange-950/20 dark:to-amber-950/10 border border-[#FF4530]/15'
        : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/40'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          accent ? 'bg-[#FF4530]/10' : 'bg-slate-200 dark:bg-slate-700'
        }`}>
          <MessageCircle className={`w-4 h-4 ${accent ? 'text-[#FF4530]' : 'text-slate-500'}`} />
        </div>
        <div className="flex-1 text-foreground/85 space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SECTION 1 — SYNTHÈSE EXÉCUTIVE
// =============================================================================

function SectionExecutiveSummary({ summary }: { summary: InsightsResult['executiveSummary'] }) {
  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      {/* Hero gradient header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pb-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4530]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF4530]/20 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-[#FF4530]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Synthese Executive</h3>
              <p className="text-xs text-slate-400">Votre coach vous parle</p>
            </div>
          </div>

          {/* Headline — big, impactful */}
          <p className="text-xl md:text-2xl font-bold text-white/95 leading-tight mb-6 max-w-2xl">
            {summary.headline}
          </p>

          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Score Global */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <div className="relative flex items-center justify-center">
                  <ScoreRing score={summary.globalScore} size={48} />
                  <span className="absolute text-[10px] font-bold text-white">
                    {summary.globalScore.toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-1">Score Global</p>
              <p className="text-2xl font-black text-white">{summary.globalScore.toFixed(1)}<span className="text-sm text-slate-400 font-normal">/5</span></p>
              <div className="mt-1">
                {summary.globalDelta !== null && (
                  <span className={`text-xs font-semibold ${
                    summary.deltaDirection === 'improvement' ? 'text-emerald-400' :
                    summary.deltaDirection === 'degradation' ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    {summary.deltaDirection === 'improvement' ? '↓' : summary.deltaDirection === 'degradation' ? '↑' : '→'} {summary.globalDelta > 0 ? '+' : ''}{summary.globalDelta.toFixed(1)} pts
                  </span>
                )}
              </div>
            </div>

            {/* Participation */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Participation</p>
              <p className="text-2xl font-black text-white">{summary.participationRate.toFixed(0)}<span className="text-sm text-slate-400 font-normal">%</span></p>
              <p className={`text-xs font-medium mt-1 ${
                summary.participationRate >= 70 ? 'text-emerald-400' :
                summary.participationRate >= 50 ? 'text-sky-400' :
                summary.participationRate >= 30 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {summary.participationLabel}
              </p>
            </div>

            {/* eNPS */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">eNPS</p>
              <p className={`text-2xl font-black ${
                summary.enpsScore >= 10 ? 'text-emerald-400' :
                summary.enpsScore >= 0 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {summary.enpsScore > 0 ? '+' : ''}{summary.enpsScore}
              </p>
              <p className="text-xs text-slate-500 mt-1 truncate">{summary.responseCount} reponses</p>
            </div>

            {/* Campagnes */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Campagnes</p>
              <p className="text-2xl font-black text-white">{summary.campaignCount}</p>
              <p className="text-xs text-slate-500 mt-1">
                {summary.bestTheme.name.split(' ')[0]} ✓
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coach narrative */}
      <CardContent className="pt-6 pb-5 space-y-4">
        <CoachBubble accent>
          {summary.narrativeBlocks.map((block, i) => (
            <p key={i}>{block}</p>
          ))}
        </CoachBubble>

        {/* Best / Worst theme pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ThumbsUp className="w-3 h-3" />
            Meilleur : {summary.bestTheme.name} ({summary.bestTheme.score.toFixed(1)})
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-3 h-3" />
            A surveiller : {summary.worstTheme.name} ({summary.worstTheme.score.toFixed(1)})
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SECTION 2 — FORCES & FAIBLESSES
// =============================================================================

function SectionStrengthsWeaknesses({
  strengths,
  weaknesses,
}: {
  strengths: InsightsResult['strengths'];
  weaknesses: InsightsResult['weaknesses'];
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Strengths */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
            </div>
            <CardTitle className="text-base">Top 3 Points Forts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {strengths.map((q, i) => (
            <div key={q.code} className="group relative p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-950/20 dark:to-transparent border border-emerald-100 dark:border-emerald-900/40 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      {q.score.toFixed(1)}/5
                    </span>
                    <span className="text-xs text-muted-foreground">{q.themeName}</span>
                    <span className="text-xs text-muted-foreground opacity-50">|</span>
                    <span className="text-xs text-muted-foreground">{q.dcName}</span>
                  </div>
                  {/* Coach comment */}
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 mt-2 italic">
                    {q.coachComment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <ThumbsDown className="w-4 h-4 text-red-600" />
            </div>
            <CardTitle className="text-base">Top 3 Points Faibles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {weaknesses.map((q, i) => (
            <div key={q.code} className="group relative p-4 rounded-xl bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-950/20 dark:to-transparent border border-red-100 dark:border-red-900/40 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                      {q.score.toFixed(1)}/5
                    </span>
                    <span className="text-xs text-muted-foreground">{q.themeName}</span>
                    <span className="text-xs text-muted-foreground opacity-50">|</span>
                    <span className="text-xs text-muted-foreground">{q.dcName}</span>
                  </div>
                  {/* Coach comment */}
                  <p className="text-xs text-red-700/80 dark:text-red-400/70 mt-2 italic">
                    {q.coachComment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// SECTION 3 — ALERTES & POINTS DE VIGILANCE
// =============================================================================

function SectionAlerts({ alerts }: { alerts: InsightAlert[] }) {
  const config = {
    critical: {
      icon: <Flame className="w-5 h-5" />,
      bg: 'bg-gradient-to-r from-red-50 to-red-50/30 dark:from-red-950/30 dark:to-red-950/10',
      border: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/50 text-red-600',
      title: 'text-red-800 dark:text-red-300',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bg: 'bg-gradient-to-r from-amber-50 to-amber-50/30 dark:from-amber-950/30 dark:to-amber-950/10',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600',
      title: 'text-amber-800 dark:text-amber-300',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bg: 'bg-gradient-to-r from-blue-50 to-blue-50/30 dark:from-blue-950/30 dark:to-blue-950/10',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600',
      title: 'text-blue-800 dark:text-blue-300',
    },
    positive: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      bg: 'bg-gradient-to-r from-emerald-50 to-emerald-50/30 dark:from-emerald-950/30 dark:to-emerald-950/10',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600',
      title: 'text-emerald-800 dark:text-emerald-300',
    },
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-amber-400 via-red-400 to-amber-400" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-amber-600" />
          </div>
          <CardTitle className="text-base">Alertes & Points de Vigilance</CardTitle>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold">
            {alerts.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, i) => {
          const c = config[alert.type];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border ${c.border} ${c.bg} transition-all hover:shadow-sm`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                {c.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${c.title}`}>{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SECTION 4 — MATRICE PRIORITÉS STRATÉGIQUES
// =============================================================================

function SectionStrategicMatrix({ quadrants }: { quadrants: StrategicQuadrant[] }) {
  // Only show quadrants that have at least 1 question
  const visibleQuadrants = quadrants.filter(q => q.questions.length > 0);
  // Auto-expand the first visible quadrant
  const [expandedQuadrant, setExpandedQuadrant] = useState<string | null>(
    visibleQuadrants[0]?.id ?? null,
  );

  const colorMap: Record<string, {
    gradient: string; border: string; badge: string; iconBg: string;
    icon: React.ReactNode; headerBg: string;
  }> = {
    act: {
      gradient: 'from-red-500 to-orange-500',
      border: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      icon: <Zap className="w-5 h-5 text-red-600" />,
      headerBg: 'bg-gradient-to-r from-red-50 to-orange-50/50 dark:from-red-950/30 dark:to-orange-950/10',
    },
    maintain: {
      gradient: 'from-blue-500 to-cyan-500',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      headerBg: 'bg-gradient-to-r from-blue-50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/10',
    },
    monitor: {
      gradient: 'from-amber-500 to-yellow-500',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      icon: <Eye className="w-5 h-5 text-amber-600" />,
      headerBg: 'bg-gradient-to-r from-amber-50 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/10',
    },
    celebrate: {
      gradient: 'from-emerald-500 to-green-500',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      icon: <PartyPopper className="w-5 h-5 text-emerald-600" />,
      headerBg: 'bg-gradient-to-r from-emerald-50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/10',
    },
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-[#FF4530] via-blue-500 to-emerald-500" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4530]/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#FF4530]" />
          </div>
          <div>
            <CardTitle className="text-base">Matrice Priorites Strategiques</CardTitle>
            <p className="text-xs text-muted-foreground">
              Score × Impact sur la satisfaction globale
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleQuadrants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune donnee de correlation disponible. Les priorites strategiques apparaitront apres 2 campagnes.
          </p>
        ) : (
          visibleQuadrants.map(q => {
            const c = colorMap[q.id];
            const isExpanded = expandedQuadrant === q.id;

            return (
              <div key={q.id} className={`rounded-xl border ${c.border} overflow-hidden transition-all ${isExpanded ? 'shadow-md' : ''}`}>
                <button
                  onClick={() => setExpandedQuadrant(isExpanded ? null : q.id)}
                  className={`w-full flex items-center justify-between p-4 ${c.headerBg} hover:opacity-90 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                      {c.icon}
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold block">{q.label}</span>
                      <span className="text-xs text-muted-foreground">{q.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>
                      {q.questions.length}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-3 bg-background/50">
                    {/* Coach advice */}
                    <CoachBubble>
                      <p className="italic">{q.coachAdvice}</p>
                    </CoachBubble>

                    <div className="space-y-2 mt-3">
                      {q.questions.map(sq => (
                        <div key={sq.code} className="flex items-center justify-between text-sm p-3 rounded-lg bg-accent/40 hover:bg-accent/60 transition-colors">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-medium truncate">{sq.actionLabel || sq.text}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{sq.themeName}</p>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
                              <div className={`text-sm font-black ${sq.score >= 3.5 ? 'text-red-600' : sq.score >= 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {sq.score.toFixed(1)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Impact</div>
                              <div className={`text-sm font-black ${sq.correlation >= 0.7 ? 'text-red-600' : sq.correlation >= 0.5 ? 'text-amber-600' : 'text-gray-400'}`}>
                                {sq.correlation.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SECTION 5 — ANALYSE PAR DÉPARTEMENT
// =============================================================================

function SectionDepartments({ departments }: { departments: InsightsResult['departmentInsights'] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? departments : departments.slice(0, 4);

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-[#FF4530] to-violet-500" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4530]/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#FF4530]" />
          </div>
          <CardTitle className="text-base">Analyse par Departement</CardTitle>
          <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
            {departments.length} equipes
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {visible.map(dept => (
          <div key={dept.name} className="rounded-xl border bg-gradient-to-r from-accent/40 to-transparent p-5 hover:shadow-md transition-all">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{dept.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {dept.responseCount} reponses • {dept.participationRate.toFixed(0)}% participation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DeltaBadge delta={dept.globalDelta} />
                <MoodBadge mood={dept.mood} />
              </div>
            </div>

            {/* Score + themes */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2.5 rounded-lg bg-background/80 border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Score</p>
                <p className={`text-lg font-black ${
                  dept.globalScore <= 2.5 ? 'text-emerald-600' :
                  dept.globalScore <= 3.5 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {dept.globalScore.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">/5</span>
                </p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Point fort</p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">{dept.bestTheme.name}</p>
                <p className="text-[10px] text-emerald-600/70">{dept.bestTheme.score.toFixed(1)}</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wider mb-0.5">Vigilance</p>
                <p className="text-xs font-bold text-red-700 dark:text-red-300 truncate">{dept.worstTheme.name}</p>
                <p className="text-[10px] text-red-600/70">{dept.worstTheme.score.toFixed(1)}</p>
              </div>
            </div>

            {/* Coach summary */}
            <CoachBubble>
              <p>{dept.coachSummary}</p>
            </CoachBubble>
          </div>
        ))}

        {departments.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#FF4530] hover:text-[#ff5745] py-3 rounded-xl border border-dashed border-[#FF4530]/30 hover:border-[#FF4530]/60 hover:bg-[#FF4530]/5 transition-all"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Voir les {departments.length} departements
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SECTION 6 — PLAN D'ACTIONS RECOMMANDÉ
// =============================================================================

function SectionActionPlan({ actions }: { actions: InsightsResult['actionPlan'] }) {
  const [showOk, setShowOk] = useState(false);

  const urgent = actions.filter(a => a.urgency === 'urgent');
  const toImprove = actions.filter(a => a.urgency === 'to-improve');
  const ok = actions.filter(a => a.urgency === 'ok');

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF4530]/10 flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-[#FF4530]" />
          </div>
          <div>
            <CardTitle className="text-base">Plan d'Actions Recommande</CardTitle>
            <p className="text-xs text-muted-foreground">
              {actions.length} actions priorisees par urgence
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Urgent */}
        {urgent.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30 animate-pulse" />
              <span className="text-sm font-bold text-red-700 dark:text-red-400">
                Urgent — Agir maintenant
              </span>
              <span className="text-xs text-muted-foreground">({urgent.length})</span>
            </div>
            <div className="space-y-2">
              {urgent.map(a => (
                <ActionRow key={a.code} action={a} variant="urgent" />
              ))}
            </div>
          </div>
        )}

        {/* To improve */}
        {toImprove.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                A ameliorer — Score {'>'} 3.0
              </span>
              <span className="text-xs text-muted-foreground">({toImprove.length})</span>
            </div>
            <div className="space-y-2">
              {toImprove.map(a => (
                <ActionRow key={a.code} action={a} variant="improve" />
              ))}
            </div>
          </div>
        )}

        {/* OK */}
        {ok.length > 0 && (
          <div>
            <button
              onClick={() => setShowOk(!showOk)}
              className="flex items-center gap-2.5 mb-3 group"
            >
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                Maintenir — Bonne dynamique
              </span>
              <span className="text-xs text-muted-foreground">({ok.length})</span>
              {showOk ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showOk && (
              <div className="space-y-2">
                {ok.map(a => (
                  <ActionRow key={a.code} action={a} variant="ok" />
                ))}
              </div>
            )}
          </div>
        )}

        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune action disponible. Lancez une campagne pour generer le plan d'actions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ActionRow({ action, variant }: { action: InsightsResult['actionPlan'][0]; variant: 'urgent' | 'improve' | 'ok' }) {
  const borderClass = {
    urgent: 'border-red-200 dark:border-red-900 bg-gradient-to-r from-red-50/60 to-transparent dark:from-red-950/15 dark:to-transparent',
    improve: 'border-amber-200 dark:border-amber-900 bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/15 dark:to-transparent',
    ok: 'border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50/60 to-transparent dark:from-emerald-950/15 dark:to-transparent',
  };

  return (
    <div className={`p-4 rounded-xl border ${borderClass[variant]} hover:shadow-sm transition-all`}>
      <div className="flex items-start gap-3">
        <ArrowRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
          variant === 'urgent' ? 'text-red-500' : variant === 'improve' ? 'text-amber-500' : 'text-emerald-500'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{action.actionLabel}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{action.dcName}</span>
            <span className="text-xs text-muted-foreground opacity-40">|</span>
            <span className="text-xs text-muted-foreground">{action.themeName}</span>
            {action.worstDepartment && (
              <>
                <span className="text-xs text-muted-foreground opacity-40">|</span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Priorite : {action.worstDepartment}
                </span>
              </>
            )}
          </div>
          {/* Coach message */}
          <p className="text-xs text-muted-foreground/80 mt-2 italic">
            {action.coachMessage}
          </p>
        </div>
        <span className={`text-sm font-black flex-shrink-0 px-2 py-0.5 rounded-lg ${
          action.score >= 4 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
          action.score >= 3 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
          'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
        }`}>
          {action.score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
