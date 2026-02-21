/**
 * IndicatorStoryCard — Reusable card that tells the story of ONE financial indicator.
 *
 * Adapts its breakdown content based on the lever code (REG, PRE, SEC, EFF, LIT).
 * Dark neon theme, no reanimated.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ChevronUp,
  ChevronDown,
  Minus,
  Lightbulb,
  TrendingUp,
} from 'lucide-react-native';
import { formatCurrency } from '@/services/format-helpers';
import { LeverScore } from '@/hooks/useFinancialScore';
import { LeverEvolution } from '@/hooks/useWeeklyEvolution';

// ─── Props ───

interface IndicatorStoryCardProps {
  lever: LeverScore;
  evolution: LeverEvolution;
  bestRecord?: { value: number; week: number; year: number };
  streakValue?: number;
}

// ─── Advice map ───

const ADVICE: Record<string, string> = {
  REG: 'Continue a epargner chaque semaine pour maintenir ta serie',
  PRE: "Vise un taux d'execution entre 85% et 95% de ton budget",
  SEC: "Chaque euro epargne te rapproche de ton objectif annuel",
  EFF: 'Diversifie tes sources de revenus pour stabiliser ton score',
  LIT: 'Complete tes defis hebdomadaires pour progresser',
};

// ─── Component ───

export function IndicatorStoryCard({
  lever,
  evolution,
  bestRecord,
  streakValue,
}: IndicatorStoryCardProps) {
  const { code, label, score, color, details } = lever;

  // ── Trend icon ──
  const TrendIcon =
    evolution.trend === 'up'
      ? ChevronUp
      : evolution.trend === 'down'
        ? ChevronDown
        : Minus;
  const trendColor =
    evolution.trend === 'up'
      ? '#4ADE80'
      : evolution.trend === 'down'
        ? '#F87171'
        : '#71717A';

  // ── Progress ratio ──
  const progressRatio = Math.max(0, Math.min(1, score / 100));

  return (
    <View style={styles.container}>
      {/* ═══ 1. Header row ═══ */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.headerLabel}>{label.toUpperCase()}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.scoreText, { color }]}>{score}</Text>
          <Text style={styles.scoreSuffix}>/100</Text>
          <TrendIcon size={16} color={trendColor} />
          {evolution.delta !== null && (
            <Text style={[styles.deltaText, { color: trendColor }]}>
              {evolution.delta > 0 ? '+' : ''}
              {evolution.delta}
            </Text>
          )}
        </View>
      </View>

      {/* ═══ 2. Progress bar ═══ */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: `${Math.round(progressRatio * 100)}%`,
            },
          ]}
        />
      </View>

      {/* ═══ 3. Breakdown section (per lever) ═══ */}
      <View style={styles.breakdownSection}>
        {code === 'REG' && <BreakdownREG details={details} streakValue={streakValue} />}
        {code === 'PRE' && <BreakdownPRE details={details} />}
        {code === 'SEC' && <BreakdownSEC details={details} />}
        {code === 'EFF' && <BreakdownEFF details={details} />}
        {code === 'LIT' && <BreakdownLIT details={details} />}
      </View>

      {/* ═══ 4. Trend text ═══ */}
      <View style={styles.trendSection}>
        {evolution.trend === 'up' && (
          <View style={styles.trendRow}>
            <TrendingUp size={14} color="#4ADE80" />
            <Text style={[styles.trendText, { color: '#4ADE80' }]}>
              En hausse depuis la derniere semaine
            </Text>
          </View>
        )}
        {evolution.trend === 'down' && (
          <View style={styles.trendRow}>
            <Text style={[styles.trendText, { color: '#FB923C' }]}>
              En baisse {'\u2014'} reste concentre
            </Text>
          </View>
        )}
        {evolution.trend === 'stable' && (
          <View style={styles.trendRow}>
            <Text style={[styles.trendText, { color: '#71717A' }]}>Stable</Text>
          </View>
        )}
      </View>

      {/* ═══ 5. Advice text ═══ */}
      <View style={styles.adviceRow}>
        <Lightbulb size={13} color="#71717A" />
        <Text style={styles.adviceText}>{ADVICE[code]}</Text>
      </View>

      {/* ═══ 6. Record line ═══ */}
      {bestRecord && (
        <View style={styles.recordRow}>
          <Text style={styles.recordText}>
            Record : {bestRecord.value} (Sem. {bestRecord.week})
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Breakdown: REG ───

function BreakdownREG({
  details,
  streakValue,
}: {
  details: LeverScore['details'];
  streakValue?: number;
}) {
  const ewma = details.regEwmaFrequency ?? 0;
  const avgNote = details.regAvgNote ?? 0;
  const streak = details.regCurrentStreak ?? streakValue ?? 0;
  return (
    <>
      <Text style={styles.breakdownSubLabel}>Frequence EWMA</Text>
      <View style={styles.miniBarRow}>
        <View style={styles.miniBarTrack}>
          <View style={[styles.miniBarFill, { backgroundColor: '#4ADE80', width: `${Math.min(100, ewma)}%` }]} />
        </View>
        <Text style={styles.miniBarScore}>{ewma}</Text>
      </View>
      <Text style={styles.breakdownSubLabel}>Intensite (note {avgNote}/10)</Text>
      <View style={styles.miniBarRow}>
        <View style={styles.miniBarTrack}>
          <View style={[styles.miniBarFill, { backgroundColor: '#60A5FA', width: `${Math.min(100, details.regSavingsIntensity ?? 0)}%` }]} />
        </View>
        <Text style={styles.miniBarScore}>{details.regSavingsIntensity ?? 0}</Text>
      </View>
      {streak > 0 && (
        <Text style={[styles.breakdownLine, { color: '#4ADE80' }]}>
          Serie en cours : {streak} semaines
        </Text>
      )}
      <Text style={[styles.breakdownLine, { color: '#71717A' }]}>
        {details.regWeeksWithSavings ?? 0}/{details.regTotalWeeks ?? 0} semaines avec epargne
      </Text>
      {details.regHasBeginnerBonus && (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusBadgeText}>Bonus debutant +15</Text>
        </View>
      )}
    </>
  );
}

// ─── Breakdown: PRE (audit-grade) ───

function BreakdownPRE({ details }: { details: LeverScore['details'] }) {
  const hasDecomp = details.preScoreIncomp !== undefined
    || details.preScoreSemi !== undefined
    || details.preScoreDisc !== undefined;
  const incompPct = details.preRealizationIncomp !== undefined
    ? Math.round(details.preRealizationIncomp * 100) : 0;
  const semiPct = details.preRealizationSemi !== undefined
    ? Math.round(details.preRealizationSemi * 100) : 0;
  const discPct = details.preRealizationDisc !== undefined
    ? Math.round(details.preRealizationDisc * 100) : 0;

  return (
    <>
      {hasDecomp ? (
        <>
          {/* Incompressible */}
          <Text style={styles.breakdownSubLabel}>Incompressible (Alim, Logt, Sante)</Text>
          <View style={styles.miniBarRow}>
            <View style={styles.miniBarTrack}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    backgroundColor: '#F87171',
                    width: `${Math.min(100, details.preScoreIncomp ?? 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.miniBarScore}>{details.preScoreIncomp ?? 0}</Text>
          </View>
          <Text style={[styles.breakdownLine, { fontSize: 11 }]}>
            Execution : {incompPct}% ({formatCurrency(details.preTotalSpentIncomp8w ?? 0)} / {formatCurrency(details.preTotalBudgetIncomp8w ?? 0)})
          </Text>

          {/* Semi-essentiel */}
          <Text style={[styles.breakdownSubLabel, { marginTop: 8 }]}>
            Semi-essentiel (Transp, Telecom, Educ)
          </Text>
          <View style={styles.miniBarRow}>
            <View style={styles.miniBarTrack}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    backgroundColor: '#60A5FA',
                    width: `${Math.min(100, details.preScoreSemi ?? 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.miniBarScore}>{details.preScoreSemi ?? 0}</Text>
          </View>
          <Text style={[styles.breakdownLine, { fontSize: 11 }]}>
            Execution : {semiPct}% ({formatCurrency(details.preTotalSpentSemi8w ?? 0)} / {formatCurrency(details.preTotalBudgetSemi8w ?? 0)})
          </Text>

          {/* Discretionnaire */}
          <Text style={[styles.breakdownSubLabel, { marginTop: 8 }]}>
            Discretionnaire (Vetements, Loisirs)
          </Text>
          <View style={styles.miniBarRow}>
            <View style={styles.miniBarTrack}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    backgroundColor: '#A78BFA',
                    width: `${Math.min(100, details.preScoreDisc ?? 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.miniBarScore}>{details.preScoreDisc ?? 0}</Text>
          </View>
          <Text style={[styles.breakdownLine, { fontSize: 11 }]}>
            Execution : {discPct}% ({formatCurrency(details.preTotalSpentDisc8w ?? 0)} / {formatCurrency(details.preTotalBudgetDisc8w ?? 0)})
          </Text>

          {/* Global */}
          <Text style={[styles.breakdownLine, { marginTop: 8 }]}>
            Taux global : {details.preAvgExecution ?? 0}%
          </Text>
          {/* Volatilite */}
          {(() => {
            const worstP = Math.min(details.prePenaltyIncomp ?? 1, details.prePenaltySemi ?? 1, details.prePenaltyDisc ?? 1);
            if (worstP >= 0.99) return null;
            const worstCV = Math.max(details.preCvIncomp ?? 0, details.preCvSemi ?? 0, details.preCvDisc ?? 0);
            return (
              <View style={[styles.bonusBadge, { backgroundColor: 'rgba(248,113,113,0.15)', marginTop: 6 }]}>
                <Text style={[styles.bonusBadgeText, { color: '#F87171' }]}>
                  Volatilite {Math.round(worstCV * 100)}% — penalite x{worstP.toFixed(2)}
                </Text>
              </View>
            );
          })()}
        </>
      ) : (
        <>
          <Text style={styles.breakdownLine}>
            Taux d'execution moyen : {details.preAvgExecution ?? 0}%
          </Text>
        </>
      )}
      {details.preHasBeginnerBonus && (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusBadgeText}>Bonus debutant +15</Text>
        </View>
      )}
      {!details.preHasBudget && (
        <Text style={[styles.breakdownLine, { color: '#F87171', marginTop: 4 }]}>
          Aucun plan configure {'\u2014'} score a 0
        </Text>
      )}
    </>
  );
}

// ─── Breakdown: SEC ───

function BreakdownSEC({ details }: { details: LeverScore['details'] }) {
  const ratio = details.secCoverageRatio ?? 0;
  const ratioPercent = Math.round(ratio * 100);

  let zoneBg: string;
  let zoneTextColor: string;
  let zoneLabel: string;

  if (ratio >= 1.0) {
    zoneBg = 'rgba(74,222,128,0.15)';
    zoneTextColor = '#4ADE80';
    zoneLabel = 'Zone verte';
  } else if (ratio >= 0.70) {
    zoneBg = 'rgba(253,186,116,0.15)';
    zoneTextColor = '#FDBA74';
    zoneLabel = 'Zone jaune';
  } else {
    zoneBg = 'rgba(248,113,113,0.15)';
    zoneTextColor = '#F87171';
    zoneLabel = 'Zone rouge';
  }

  return (
    <>
      <Text style={styles.breakdownLine}>
        Objectif prorata : {formatCurrency(details.secProratedTarget ?? 0)}
      </Text>
      <Text style={styles.breakdownLine}>
        Epargne cumulee : {formatCurrency(details.secCumulEconomies ?? 0)}
      </Text>
      <Text style={styles.breakdownLine}>
        Ratio de couverture : {ratioPercent}%
      </Text>
      <View style={[styles.zoneBadge, { backgroundColor: zoneBg }]}>
        <Text style={[styles.zoneBadgeText, { color: zoneTextColor }]}>
          {zoneLabel}
        </Text>
      </View>
      <Text style={[styles.breakdownLine, { color: '#71717A', marginTop: 6 }]}>
        An{details.secPlanYear ?? 1} T{details.secQuarter ?? 1} {'\u2014'} Semaine{' '}
        {details.secWeeksElapsed ?? 0}/48
      </Text>
    </>
  );
}

// ─── Breakdown: EFF ───

function BreakdownEFF({ details }: { details: LeverScore['details'] }) {
  const fixePercent = Math.round((details.effRealizationFixe ?? 0) * 100);
  const variablePercent = Math.round((details.effRealizationVariable ?? 0) * 100);

  return (
    <>
      {/* Revenus Fixes */}
      <Text style={styles.breakdownSubLabel}>Revenus Fixes</Text>
      <View style={styles.miniBarRow}>
        <View style={styles.miniBarTrack}>
          <View
            style={[
              styles.miniBarFill,
              {
                backgroundColor: '#60A5FA',
                width: `${Math.min(100, fixePercent)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.miniBarScore}>{details.effScoreFixe ?? 0}</Text>
      </View>

      {/* Revenus Variables */}
      <Text style={[styles.breakdownSubLabel, { marginTop: 8 }]}>
        Revenus Variables
      </Text>
      <View style={styles.miniBarRow}>
        <View style={styles.miniBarTrack}>
          <View
            style={[
              styles.miniBarFill,
              {
                backgroundColor: '#A78BFA',
                width: `${Math.min(100, variablePercent)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.miniBarScore}>{details.effScoreVariable ?? 0}</Text>
      </View>

      {/* 8 weeks summary */}
      <Text style={[styles.breakdownLine, { marginTop: 8 }]}>
        8 dernieres semaines : Recu{' '}
        {formatCurrency(details.effTotalActual8w ?? 0)} / Attendu{' '}
        {formatCurrency(details.effTotalExpected8w ?? 0)}
      </Text>

      {/* Beginner bonus */}
      {details.effHasBeginnerBonus && (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusBadgeText}>Bonus debutant +15</Text>
        </View>
      )}
    </>
  );
}

// ─── Breakdown: LIT ───

function BreakdownLIT({ details }: { details: LeverScore['details'] }) {
  return (
    <>
      <Text style={styles.breakdownSubLabel}>Connaissances EKH (60%)</Text>
      <View style={styles.miniBarRow}>
        <View style={styles.miniBarTrack}>
          <View style={[styles.miniBarFill, { backgroundColor: '#FBBF24', width: `${Math.min(100, details.litEkhNorm ?? 0)}%` }]} />
        </View>
        <Text style={styles.miniBarScore}>{details.litEkhNorm ?? 0}</Text>
      </View>
      <Text style={[styles.breakdownSubLabel, { marginTop: 8 }]}>Engagement defis (25%)</Text>
      <View style={styles.miniBarRow}>
        <View style={styles.miniBarTrack}>
          <View style={[styles.miniBarFill, { backgroundColor: '#FB923C', width: `${Math.min(100, details.litChallengeScore ?? 0)}%` }]} />
        </View>
        <Text style={styles.miniBarScore}>{details.litChallengeScore ?? 0}</Text>
      </View>
      <Text style={[styles.breakdownLine, { marginTop: 8 }]}>
        Curriculum : {details.litCompletedCount ?? 0}/{details.litTotalChallenges ?? 48} defis completes
      </Text>
      {details.litFloorActive && (
        <View style={[styles.bonusBadge, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
          <Text style={[styles.bonusBadgeText, { color: '#60A5FA' }]}>
            Plancher expert : {details.litKnowledgeFloor ?? 0}/100
          </Text>
        </View>
      )}
    </>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerLabel: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreSuffix: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Progress bar
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },

  // Breakdown
  breakdownSection: {
    paddingTop: 4,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  breakdownLine: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 4,
  },
  breakdownSubLabel: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Mini bar (EFF)
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  miniBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: 6,
    borderRadius: 3,
  },
  miniBarScore: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },

  // Badges
  bonusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,222,128,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  bonusBadgeText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
  },
  zoneBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  zoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Trend
  trendSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Advice
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  adviceText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },

  // Record
  recordRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  recordText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
});
