/**
 * FinancialScoreReport — Rapport detaille des 5 leviers du score dynamique
 *
 * Chaque levier affiche ses VRAIS CHIFFRES :
 * - REG : "6 semaines sur 8 avec epargne"
 * - PRE : "Taux d'execution moyen 82%"
 * - SEC : "45 000 FCFA cumules sur 120 000 FCFA d'objectif"
 * - EFF : "85 000 FCFA recus vs 100 000 FCFA prevus"
 * - LIT : "Score EKH 73/100"
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Repeat,
  Target,
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  LucideIcon,
} from 'lucide-react-native';
import { useFinancialScore } from '@/hooks/useFinancialScore';
import type { LeverDetails } from '@/hooks/useFinancialScore';
import { formatCurrency } from '@/services/format-helpers';
import { PF } from './shared';
import RadarChart from '@/components/charts/RadarChart';

// ─── Lever icons ───

const LEVER_ICONS: Record<string, LucideIcon> = {
  REG: Repeat,
  PRE: Target,
  SEC: ShieldCheck,
  EFF: TrendingUp,
  LIT: GraduationCap,
};

// ─── Data-driven key figures builder ───

function buildKeyFigures(code: string, d: LeverDetails, t: (key: string, opts?: any) => string): { label: string; value: string; color: string }[] {
  switch (code) {
    case 'REG': {
      const ewma = d.regEwmaFrequency ?? 0;
      const intensity = d.regSavingsIntensity ?? 0;
      const streak = d.regCurrentStreak ?? 0;
      const streakSc = d.regStreakScore ?? 0;
      const items: { label: string; value: string; color: string }[] = [
        { label: t('reg.ewmaFrequency'), value: `${ewma}/100`, color: ewma >= 70 ? '#4ADE80' : ewma >= 40 ? '#FBBF24' : '#F87171' },
        { label: t('reg.intensity'), value: `${d.regAvgNote ?? 0}/10 → ${intensity}/100`, color: intensity >= 70 ? '#4ADE80' : intensity >= 40 ? '#FBBF24' : '#F87171' },
        { label: t('reg.currentStreak'), value: `${streak} sem. → ${streakSc}/100`, color: streak >= 4 ? '#4ADE80' : streak >= 2 ? '#FBBF24' : '#F87171' },
        { label: t('reg.weeksWithSavings'), value: `${d.regWeeksWithSavings ?? 0} / ${d.regTotalWeeks ?? 0}`, color: '#A1A1AA' },
      ];
      if (d.regHasBeginnerBonus) {
        items.push({ label: t('reg.beginnerBonus'), value: t('reg.beginnerBonusValue'), color: '#60A5FA' });
      }
      return items;
    }
    case 'PRE': {
      const avg = d.preAvgExecution ?? 0;
      const items: { label: string; value: string; color: string }[] = [];
      if (d.preHasBudget && (d.preScoreIncomp !== undefined || d.preScoreSemi !== undefined || d.preScoreDisc !== undefined)) {
        const incompExec = d.preRealizationIncomp !== undefined ? Math.round(d.preRealizationIncomp * 100) : 0;
        const semiExec = d.preRealizationSemi !== undefined ? Math.round(d.preRealizationSemi * 100) : 0;
        const discExec = d.preRealizationDisc !== undefined ? Math.round(d.preRealizationDisc * 100) : 0;
        const sI = d.preScoreIncomp ?? 0;
        const sS = d.preScoreSemi ?? 0;
        const sD = d.preScoreDisc ?? 0;
        items.push(
          { label: `${t('pre.incompressible')} (${Math.round((d.preWeightIncomp ?? 0) * 100)}%)`, value: `${sI}/100 · ${incompExec}%`, color: sI >= 80 ? '#4ADE80' : sI >= 50 ? '#FBBF24' : '#F87171' },
          { label: `${t('pre.semiEssential')} (${Math.round((d.preWeightSemi ?? 0) * 100)}%)`, value: `${sS}/100 · ${semiExec}%`, color: sS >= 80 ? '#4ADE80' : sS >= 50 ? '#FBBF24' : '#F87171' },
          { label: `${t('pre.discretionary')} (${Math.round((d.preWeightDisc ?? 0) * 100)}%)`, value: `${sD}/100 · ${discExec}%`, color: sD >= 80 ? '#4ADE80' : sD >= 50 ? '#FBBF24' : '#F87171' },
          { label: t('pre.globalRealization'), value: `${avg}%`, color: avg <= 100 && avg >= 80 ? '#4ADE80' : '#FB923C' },
        );
        // Volatilite — afficher seulement si penalite active (< 1.0)
        const hasPenalty = (d.prePenaltyIncomp ?? 1) < 0.99 || (d.prePenaltySemi ?? 1) < 0.99 || (d.prePenaltyDisc ?? 1) < 0.99;
        if (hasPenalty) {
          const worstCV = Math.max(d.preCvIncomp ?? 0, d.preCvSemi ?? 0, d.preCvDisc ?? 0);
          const worstPenalty = Math.min(d.prePenaltyIncomp ?? 1, d.prePenaltySemi ?? 1, d.prePenaltyDisc ?? 1);
          items.push({ label: t('pre.maxVolatility'), value: `${Math.round(worstCV * 100)}%`, color: worstCV > 0.20 ? '#F87171' : worstCV > 0.10 ? '#FBBF24' : '#4ADE80' });
          items.push({ label: t('pre.stabilityPenalty'), value: `×${worstPenalty.toFixed(2)}`, color: worstPenalty < 0.90 ? '#F87171' : '#FBBF24' });
        }
      } else {
        items.push({ label: t('pre.budgetPlan'), value: t('pre.notConfigured'), color: '#F87171' });
      }
      if (d.preHasBeginnerBonus) {
        items.push({ label: t('reg.beginnerBonus'), value: t('reg.beginnerBonusValue'), color: '#60A5FA' });
      }
      return items;
    }
    case 'SEC': {
      const objectif = d.secObjectifAnnuel ?? 0;
      if (objectif <= 0) {
        return [
          { label: t('sec.eprObjective'), value: t('sec.notDefined'), color: '#71717A' },
          { label: t('sec.defaultScore'), value: t('sec.defaultScoreRisk'), color: '#FB923C' },
        ];
      }
      const cumul = d.secCumulEconomies ?? 0;
      const prorated = d.secProratedTarget ?? 0;
      const coveragePct = Math.round((d.secCoverageRatio ?? 0) * 100);
      const items: { label: string; value: string; color: string }[] = [
        { label: t('sec.cumulSavings'), value: formatCurrency(cumul), color: '#4ADE80' },
        { label: t('sec.proratedObjective', { planYear: d.secPlanYear ?? 1, quarter: d.secQuarter ?? 1 }), value: formatCurrency(prorated), color: '#60A5FA' },
        { label: t('sec.coverageRatio'), value: `${coveragePct}%`, color: coveragePct >= 100 ? '#4ADE80' : coveragePct >= 70 ? '#FBBF24' : '#F87171' },
        { label: t('sec.annualObjective', { planYear: d.secPlanYear ?? 1 }), value: formatCurrency(objectif), color: '#A1A1AA' },
        { label: t('sec.progress'), value: `S${d.secWeeksElapsed ?? 0} / 48`, color: '#A1A1AA' },
      ];
      if (d.secHasBeginnerBonus) {
        items.push({ label: t('reg.beginnerBonus'), value: t('reg.beginnerBonusValue'), color: '#60A5FA' });
      }
      return items;
    }
    case 'EFF': {
      if (!d.effHasTargets) {
        const hasIncome = (d.effTotalActual8w ?? 0) > 0;
        return [
          { label: t('eff.revenueObjectives'), value: t('eff.notConfigured'), color: '#71717A' },
          { label: t('sec.defaultScore'), value: hasIncome ? t('eff.defaultScoreActive') : t('eff.defaultScoreNeutral'), color: '#A78BFA' },
          { label: t('eff.analysisWindow'), value: `${d.effNbWeeks ?? 0} ${t('eff.weeks')}`, color: '#A1A1AA' },
        ];
      }
      const actual8w = d.effTotalActual8w ?? 0;
      const expected8w = d.effTotalExpected8w ?? 0;
      const globalPct = expected8w > 0 ? Math.round((actual8w / expected8w) * 100) : 0;
      const items: { label: string; value: string; color: string }[] = [
        { label: t('eff.realRevenue', { nbWeeks: d.effNbWeeks ?? 0 }), value: formatCurrency(actual8w), color: '#4ADE80' },
        { label: t('eff.expectedRevenue', { nbWeeks: d.effNbWeeks ?? 0 }), value: formatCurrency(expected8w), color: '#60A5FA' },
        { label: t('pre.globalRealization'), value: `${globalPct}%`, color: globalPct >= 80 ? '#4ADE80' : globalPct >= 50 ? '#FBBF24' : '#F87171' },
      ];
      // Show Fixe/Variable decomposition if both exist
      if (d.effScoreFixe !== undefined && d.effScoreVariable !== undefined) {
        const rFixePct = Math.round((d.effRealizationFixe ?? 0) * 100);
        const rVarPct = Math.round((d.effRealizationVariable ?? 0) * 100);
        items.push(
          { label: t('eff.fixedRevenue', { pct: Math.round((d.effWeightFixe ?? 0) * 100) }), value: `${rFixePct}% → ${d.effScoreFixe}/100`, color: rFixePct >= 90 ? '#4ADE80' : rFixePct >= 70 ? '#FBBF24' : '#F87171' },
          { label: t('eff.variableRevenue', { pct: Math.round((d.effWeightVariable ?? 0) * 100) }), value: `${rVarPct}% → ${d.effScoreVariable}/100`, color: rVarPct >= 80 ? '#4ADE80' : rVarPct >= 50 ? '#FBBF24' : '#F87171' },
        );
      }
      if (d.effHasBeginnerBonus) {
        items.push({ label: t('reg.beginnerBonus'), value: t('reg.beginnerBonusValue'), color: '#60A5FA' });
      }
      return items;
    }
    case 'LIT': {
      const know = d.litKnowledgeScore ?? 0;
      const engage = d.litEngagementScore ?? 0;
      const prog = d.litProgressionScore ?? 0;
      const completed = d.litCompletedCount ?? 0;
      const total = d.litTotalChallenges ?? 48;
      const items: { label: string; value: string; color: string }[] = [
        { label: t('lit.knowledge'), value: `${d.litEkhNorm ?? 0}/100`, color: know >= 60 ? '#4ADE80' : know >= 40 ? '#FBBF24' : '#F87171' },
        { label: t('lit.engagement'), value: `${engage}/100`, color: engage >= 60 ? '#4ADE80' : engage >= 30 ? '#FBBF24' : '#F87171' },
        { label: t('lit.progression'), value: `${completed}/${total} → ${prog}/100`, color: prog >= 50 ? '#4ADE80' : prog >= 25 ? '#FBBF24' : '#F87171' },
      ];
      if (d.litFloorActive) {
        items.push({ label: t('lit.expertFloor'), value: `MIN = ${d.litKnowledgeFloor ?? 0}`, color: '#60A5FA' });
      }
      return items;
    }
    default:
      return [];
  }
}

// ─── Data-driven comment builder ───

function buildComment(code: string, _score: number, d: LeverDetails, t: (key: string, opts?: any) => string): string {
  switch (code) {
    case 'REG': {
      const tw = d.regTotalWeeks ?? 0;
      if (tw === 0) return t('reg.commentNoData');
      const ewma = d.regEwmaFrequency ?? 0;
      const streak = d.regCurrentStreak ?? 0;
      const avgN = d.regAvgNote ?? 0;
      if (ewma >= 80 && streak >= 4 && avgN >= 7)
        return t('reg.commentExcellent', { ewma, streak, avgN });
      if (ewma >= 60)
        return streak < 3
          ? t('reg.commentGoodShortStreak', { ewma, streak })
          : t('reg.commentGoodLowIntensity', { ewma, avgN });
      if (ewma >= 30)
        return t('reg.commentModerate', { ewma });
      return t('reg.commentWeak', { ewma });
    }
    case 'PRE': {
      if (!d.preHasBudget) return t('pre.commentNoBudget');
      const sI = d.preScoreIncomp ?? 0;
      const sS = d.preScoreSemi ?? 0;
      const sD = d.preScoreDisc ?? 0;
      const rI = d.preRealizationIncomp !== undefined ? Math.round(d.preRealizationIncomp * 100) : 0;
      const rS = d.preRealizationSemi !== undefined ? Math.round(d.preRealizationSemi * 100) : 0;
      const rD = d.preRealizationDisc !== undefined ? Math.round(d.preRealizationDisc * 100) : 0;
      const tiers = [
        { name: 'Incompressible', s: sI, r: rI },
        { name: 'Semi-essentiel', s: sS, r: rS },
        { name: 'Discretionnaire', s: sD, r: rD },
      ];
      const allGood = tiers.every((ti) => ti.s >= 80);
      const weakest = tiers.reduce((a, b) => a.s < b.s ? a : b);
      const worstPenalty = Math.min(d.prePenaltyIncomp ?? 1, d.prePenaltySemi ?? 1, d.prePenaltyDisc ?? 1);
      const volSuffix = worstPenalty < 0.95 ? t('pre.volSuffix', { penalty: worstPenalty.toFixed(2) }) : '';
      if (allGood) return t('pre.commentAllGood', { rI, sI, rS, sS, rD, sD, volSuffix });
      if (weakest.name === 'Incompressible') return t('pre.commentWeakIncomp', { rI, sI, volSuffix });
      if (weakest.name === 'Semi-essentiel') return t('pre.commentWeakSemi', { rS, sS, sI, volSuffix });
      return t('pre.commentWeakDisc', { rD, sD, sI, sS, volSuffix });
    }
    case 'SEC': {
      const obj = d.secObjectifAnnuel ?? 0;
      if (obj <= 0) return t('sec.commentNoObjective');
      const cumul = formatCurrency(d.secCumulEconomies ?? 0);
      const prorated = formatCurrency(d.secProratedTarget ?? 0);
      const coveragePct = Math.round((d.secCoverageRatio ?? 0) * 100);
      const weeks = d.secWeeksElapsed ?? 0;
      const ecart = formatCurrency(Math.max(0, (d.secProratedTarget ?? 0) - (d.secCumulEconomies ?? 0)));
      const planYear = d.secPlanYear ?? 1;
      if (coveragePct >= 120) return t('sec.commentExcellent', { cumul, prorated, weeks, coveragePct });
      if (coveragePct >= 100) return t('sec.commentAhead', { cumul, prorated, weeks, coveragePct, planYear });
      if (coveragePct >= 70) return t('sec.commentModerate', { cumul, prorated, weeks, coveragePct, ecart });
      if (coveragePct >= 40) return t('sec.commentBehind', { cumul, prorated, weeks, coveragePct, ecart });
      return t('sec.commentCritical', { cumul, prorated, weeks, coveragePct });
    }
    case 'EFF': {
      if (!d.effHasTargets) {
        const hasIncome = (d.effTotalActual8w ?? 0) > 0;
        return hasIncome ? t('eff.commentNoTargetsWithIncome') : t('eff.commentNoTargetsNoIncome');
      }
      const nbW = d.effNbWeeks ?? 0;
      const actual8w = d.effTotalActual8w ?? 0;
      const expected8w = d.effTotalExpected8w ?? 0;
      const pct = expected8w > 0 ? Math.round((actual8w / expected8w) * 100) : 0;
      const ecart = formatCurrency(Math.abs(actual8w - expected8w));
      const actual = formatCurrency(actual8w);
      const expected = formatCurrency(expected8w);
      // Build Fixe/Variable context
      let typeContext = '';
      if (d.effScoreFixe !== undefined && d.effScoreVariable !== undefined) {
        const rF = Math.round((d.effRealizationFixe ?? 0) * 100);
        const rV = Math.round((d.effRealizationVariable ?? 0) * 100);
        if (rF < 90 && rV >= 80) typeContext = t('eff.typeContextFixeLag');
        else if (rV < 60 && rF >= 90) typeContext = t('eff.typeContextVarLag');
        else if (rF < 90 && rV < 60) typeContext = t('eff.typeContextBothLag');
      }
      if (pct >= 100) return t('eff.commentAbove100', { nbW, actual, expected, pct, typeContext });
      if (pct >= 80) return t('eff.commentAbove80', { nbW, actual, expected, pct, ecart, typeContext });
      if (pct >= 50) return t('eff.commentAbove50', { nbW, actual, expected, pct, ecart, typeContext });
      return t('eff.commentBelow50', { nbW, actual, expected, pct, ecart, typeContext });
    }
    case 'LIT': {
      const know = d.litKnowledgeScore ?? 0;
      const engage = d.litEngagementScore ?? 0;
      const completed = d.litCompletedCount ?? 0;
      const total = d.litTotalChallenges ?? 48;
      if (d.litFloorActive)
        return t('lit.commentFloor', { ekhNorm: d.litEkhNorm ?? 0, completed, total });
      if (know >= 70 && engage >= 60)
        return t('lit.commentGood', { know, engage, completed, total });
      if (know >= 50)
        return t('lit.commentAverage', { know, engage });
      return t('lit.commentWeak', { know, completed, total });
    }
    default:
      return '';
  }
}

// ─── Score level ───

function getScoreLevel(score: number, t: (key: string) => string): { label: string; color: string } {
  if (score >= 80) return { label: t('scoreLevel.excellent'), color: '#4ADE80' };
  if (score >= 60) return { label: t('scoreLevel.good'), color: '#60A5FA' };
  if (score >= 40) return { label: t('scoreLevel.average'), color: '#FBBF24' };
  if (score >= 20) return { label: t('scoreLevel.weak'), color: '#FB923C' };
  return { label: t('scoreLevel.critical'), color: '#F87171' };
}

// ─── Component ───

export function FinancialScoreReport() {
  const { t } = useTranslation('performance');
  const { globalScore, grade, levers } = useFinancialScore();
  const globalLevel = getScoreLevel(globalScore, t);

  const radarData = useMemo(
    () => levers.map((l) => ({ label: l.code, value: l.score, max: 100 })),
    [levers],
  );

  return (
    <View style={styles.container}>
      {/* Global summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('globalScore')}</Text>
          <Text style={[styles.summaryScore, { color: globalLevel.color }]}>
            {globalScore}/100
          </Text>
        </View>
        <View style={styles.summaryBarBg}>
          <View style={[styles.summaryBarFill, { width: `${globalScore}%`, backgroundColor: globalLevel.color }]} />
        </View>
        <Text style={[styles.summaryLevel, { color: globalLevel.color }]}>
          {grade} — {globalLevel.label}
        </Text>
      </View>

      {/* Radar chart — 5 levers overview */}
      {radarData.length >= 3 && (
        <View style={styles.radarWrap}>
          <RadarChart data={radarData} size={200} color={PF.accent} />
        </View>
      )}

      {/* Lever rows */}
      {levers.map((lever) => {
        const Icon = LEVER_ICONS[lever.code];
        const fullName = t(`leverNames.${lever.code}`);
        if (!Icon) return null;

        const keyFigures = buildKeyFigures(lever.code, lever.details, t);
        const comment = buildComment(lever.code, lever.score, lever.details, t);

        return (
          <View key={lever.code} style={styles.leverCard}>
            {/* Header: icon + name + weight + score */}
            <View style={styles.leverHeader}>
              <View style={[styles.leverIconBox, { backgroundColor: lever.color + '20' }]}>
                <Icon size={16} color={lever.color} />
              </View>
              <View style={styles.leverTitleCol}>
                <Text style={styles.leverName}>{fullName}</Text>
                <Text style={styles.leverWeight}>{lever.code} · {Math.round(lever.weight * 100)}%</Text>
              </View>
              <View style={styles.leverScoreCol}>
                <Text style={[styles.leverScoreValue, { color: lever.color }]}>
                  {lever.score}
                </Text>
                <Text style={styles.leverScoreMax}>/100</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.leverBarBg}>
              <View
                style={[
                  styles.leverBarFill,
                  { width: `${Math.min(lever.score, 100)}%`, backgroundColor: lever.color },
                ]}
              />
            </View>

            {/* Key figures — data-driven */}
            <View style={styles.figuresGrid}>
              {keyFigures.map((fig, i) => (
                <View key={i} style={styles.figureRow}>
                  <Text style={styles.figureLabel}>{fig.label}</Text>
                  <Text style={[styles.figureValue, { color: fig.color }]}>{fig.value}</Text>
                </View>
              ))}
            </View>

            {/* Personalized comment with real numbers */}
            <View style={[styles.commentBox, { borderLeftColor: lever.color }]}>
              <Text style={styles.commentText}>{comment}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // Global summary
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PF.border,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryScore: {
    fontSize: 22,
    fontWeight: '900',
  },
  summaryBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  summaryLevel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Radar chart
  radarWrap: {
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 8,
  },

  // Lever card
  leverCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PF.border,
  },
  leverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  leverIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leverTitleCol: {
    flex: 1,
  },
  leverName: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  leverWeight: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  leverScoreCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  leverScoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  leverScoreMax: {
    color: PF.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },

  // Bar
  leverBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  leverBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Key figures
  figuresGrid: {
    gap: 6,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  figureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  figureLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  figureValue: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Comment
  commentBox: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  commentText: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
});
