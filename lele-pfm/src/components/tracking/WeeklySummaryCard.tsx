import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Award, PiggyBank, Wallet, TrendingDown, TrendingUp,
  ArrowDownLeft, Target, Zap, Shield, Crosshair, AlertTriangle,
} from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { getGradeColor, getNoteColor, WeeklySavingsResult } from '@/domain/calculators/weekly-savings-engine';
import { usePerformanceStore } from '@/stores/performance-store';
import { useInvestmentStore } from '@/stores/investment-store';
import { useIncomeStore } from '@/stores/income-store';
import { useViewMode } from '@/hooks/useViewMode';
import { useFinancialScore } from '@/hooks/useFinancialScore';
import { useWeeklyAllocation } from '@/hooks/useWeeklyAllocation';
import { getWeekRangeLabel } from '@/utils/week-helpers';
import { GOAL_CATEGORIES, GoalIcon } from '@/constants/goal-categories';

interface WeeklySummaryCardProps {
  week: number;
  year: number;
  weeklyBudget: number;
  weeklyTarget: number;
  weeklySpent: number;
  savings: WeeklySavingsResult;
  planYear: 1 | 2 | 3;
  currentQuarter: 1 | 2 | 3 | 4;
}

export function WeeklySummaryCard({
  week,
  year,
  weeklyBudget,
  weeklyTarget,
  weeklySpent,
  savings,
  planYear,
  currentQuarter,
}: WeeklySummaryCardProps) {
  const saveWeeklyRecord = usePerformanceStore((s) => s.saveWeeklyRecord);
  const addInvestmentRecord = useInvestmentStore((s) => s.addInvestmentRecord);
  const weeklyIncomeActual = useIncomeStore((s) =>
    s.incomes
      .filter((inc) => inc.week_number === week && inc.year === year)
      .reduce((sum, inc) => sum + inc.amount, 0)
  );
  const { isInvestor } = useViewMode();
  const { globalScore: financialScore, levers } = useFinancialScore();
  const allocation = useWeeklyAllocation(week, year, savings);
  const incomeBalance = weeklyIncomeActual - weeklySpent;

  // Ref to capture latest scores without adding to deps
  const financialScoreRef = React.useRef(financialScore);
  financialScoreRef.current = financialScore;
  const leverScoresRef = React.useRef<Record<string, number>>({});
  leverScoresRef.current = levers.reduce((acc, l) => ({ ...acc, [l.code]: l.score }), {} as Record<string, number>);

  // Auto-save weekly record when savings change
  useEffect(() => {
    if (weeklyBudget > 0 && weeklySpent > 0) {
      saveWeeklyRecord({
        week_number: week,
        year,
        weeklyBudget,
        weeklyTarget,
        weeklySpent,
        economies: savings.economies,
        economiesCappees: savings.economiesCappees,
        eprProvision: savings.eprProvision,
        surplus: savings.surplus,
        depassement: savings.depassement,
        note: savings.note,
        grade: savings.grade,
        epargne: savings.epargne,
        investissement: savings.investissement,
        discretionnaire: savings.discretionnaire,
        budgetRespecte: savings.budgetRespecte,
        tauxExecution: savings.tauxExecution,
        financialScore: financialScoreRef.current,
        leverScores: leverScoresRef.current,
      });

      if (isInvestor && savings.investissement > 0) {
        addInvestmentRecord({
          week_number: week,
          year,
          amount: savings.investissement,
          source: 'auto',
        });
      }
    }
  }, [week, year, weeklyBudget, weeklyTarget, weeklySpent, savings, isInvestor]);

  if (weeklyBudget <= 0) return null;

  const hasGoals = allocation.goalAllocations.length > 0;
  const hasImpulse = allocation.impulseTotal > 0;

  return (
    <GlassCard variant="dark" style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Award size={18} color={getGradeColor(savings.grade)} />
        <Text style={styles.title}>Bilan {getWeekRangeLabel(week, year)}</Text>
        <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(savings.grade) + '20', borderColor: getGradeColor(savings.grade) + '40' }]}>
          <Text style={[styles.gradeText, { color: getGradeColor(savings.grade) }]}>
            {savings.grade}
          </Text>
        </View>
      </View>

      {/* ── Note ── */}
      <View style={styles.noteRow}>
        <Text style={styles.noteLabel}>Note</Text>
        <Text style={[styles.noteValue, { color: getNoteColor(savings.note) }]}>
          {savings.note}/10
        </Text>
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(savings.note * 10, 100)}%`,
              backgroundColor: getNoteColor(savings.note),
            },
          ]}
        />
      </View>

      {savings.economies > 0 ? (
        <>
          {/* ── EPR Section ── */}
          <View style={styles.eprSection}>
            <View style={styles.eprRow}>
              <View style={styles.eprItem}>
                <Zap size={13} color="#4ADE80" />
                <Text style={styles.eprLabel}>Economie</Text>
              </View>
              <Text style={[styles.eprValue, { color: '#4ADE80' }]}>
                {formatCurrency(savings.economies)}
              </Text>
            </View>
            <View style={styles.eprRow}>
              <View style={styles.eprItem}>
                <Target size={13} color="#60A5FA" />
                <Text style={styles.eprLabel}>Objectif EPR</Text>
                <View style={styles.calendarBadge}>
                  <Text style={styles.calendarBadgeText}>An{planYear} T{currentQuarter}</Text>
                </View>
              </View>
              <Text style={[styles.eprValue, { color: '#60A5FA' }]}>
                {formatCurrency(savings.weeklyTarget)}
              </Text>
            </View>
            <View style={styles.eprRow}>
              <View style={styles.eprItem}>
                <Shield size={13} color={allocation.eprAtteint ? '#4ADE80' : '#FBBF24'} />
                <Text style={styles.eprLabel}>EPR realise</Text>
              </View>
              <Text style={[styles.eprValue, { color: allocation.eprAtteint ? '#4ADE80' : '#FBBF24' }]}>
                {formatCurrency(allocation.eprProvision)}
                {allocation.surplus > 0 && (
                  <Text style={{ color: '#4ADE80', fontSize: 11 }}> +{formatCurrency(allocation.surplus)}</Text>
                )}
              </Text>
            </View>
          </View>

          {/* ── Cascade d'Allocation ── */}
          <View style={styles.cascadeDivider} />
          <Text style={styles.cascadeTitle}>CASCADE D'ALLOCATION</Text>

          {/* Impulse info banner */}
          {hasImpulse && (
            <View style={styles.impulseBanner}>
              <AlertTriangle size={12} color="#FBBF24" />
              <Text style={styles.impulseBannerText}>
                Sans vos achats impulsifs ({formatCurrency(allocation.impulseTotal)}), vous auriez {formatCurrency(allocation.economiesIfNoImpulse)}
              </Text>
            </View>
          )}

          {/* Goal allocations */}
          {hasGoals && (
            <View style={styles.cascadeSection}>
              {allocation.goalAllocations.map((g) => {
                const goalCat = GOAL_CATEGORIES[g.goalIcon as GoalIcon];
                return (
                  <View key={g.goalId} style={styles.cascadeRow}>
                    <View style={styles.cascadeItem}>
                      <Crosshair size={13} color={g.goalColor} />
                      <Text style={styles.cascadeLabel} numberOfLines={1}>
                        {g.goalName}
                      </Text>
                    </View>
                    <Text style={[styles.cascadeValue, { color: g.goalColor }]}>
                      {formatCurrency(g.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Distribution row */}
          <View style={styles.distributionRow}>
            <View style={styles.stat}>
              <PiggyBank size={14} color="#4ADE80" />
              <Text style={styles.statLabel}>Epargne</Text>
              <Text style={[styles.statValue, { color: '#4ADE80' }]}>
                {formatCurrency(allocation.totalEpargne)}
              </Text>
              {allocation.eprProvision > 0 && allocation.epargne > 0 && (
                <Text style={styles.statDetail}>
                  EPR {formatCurrency(allocation.eprProvision)} + {formatCurrency(allocation.epargne)}
                </Text>
              )}
            </View>
            {isInvestor && allocation.investissement > 0 && (
              <View style={styles.stat}>
                <TrendingUp size={14} color="#FBBF24" />
                <Text style={styles.statLabel}>Investir</Text>
                <Text style={[styles.statValue, { color: '#FBBF24' }]}>
                  {formatCurrency(allocation.investissement)}
                </Text>
              </View>
            )}
            <View style={styles.stat}>
              <Wallet size={14} color="#A78BFA" />
              <Text style={styles.statLabel}>Liberte</Text>
              <Text style={[styles.statValue, { color: hasImpulse ? '#71717A' : '#A78BFA' }]}>
                {formatCurrency(allocation.discretionnaire)}
              </Text>
              {hasImpulse && (
                <>
                  <Text style={styles.impulseDeduct}>
                    -{formatCurrency(allocation.impulseCompensation)}
                  </Text>
                  <Text style={[
                    styles.statValue,
                    { color: allocation.discretionnaireNet > 0 ? '#A78BFA' : '#F87171', fontSize: 12 },
                  ]}>
                    Net: {formatCurrency(allocation.discretionnaireNet)}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Impulse debt warning */}
          {allocation.impulseDebt > 0 && (
            <View style={styles.debtBanner}>
              <AlertTriangle size={12} color="#F87171" />
              <Text style={styles.debtText}>
                Impulsifs non couverts : {formatCurrency(allocation.impulseDebt)}
              </Text>
            </View>
          )}

          {/* Verification total */}
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>Total distribue</Text>
            <Text style={styles.verifyValue}>
              = {formatCurrency(savings.economies)}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.distributionRow}>
          <View style={styles.stat}>
            <TrendingDown size={14} color="#F87171" />
            <Text style={styles.statLabel}>Depassement</Text>
            <Text style={[styles.statValue, { color: '#F87171' }]}>
              {formatCurrency(savings.depassement)}
            </Text>
          </View>
        </View>
      )}

      {/* ── Income info ── */}
      {weeklyIncomeActual > 0 && (
        <View style={styles.incomeSection}>
          <View style={styles.incomeDivider} />
          <View style={styles.incomeRow}>
            <View style={styles.stat}>
              <ArrowDownLeft size={14} color="#4ADE80" />
              <Text style={styles.statLabel}>Rentrees</Text>
              <Text style={[styles.statValue, { color: '#4ADE80' }]}>
                +{formatCurrency(weeklyIncomeActual)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Balance</Text>
              <Text style={[styles.statValue, { color: incomeBalance >= 0 ? '#4ADE80' : '#F87171' }]}>
                {incomeBalance >= 0 ? '+' : ''}{formatCurrency(incomeBalance)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  noteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  noteValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  // ── EPR ──
  eprSection: {
    gap: 6,
    marginBottom: 4,
  },
  eprRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eprItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eprLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarBadge: {
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 4,
  },
  calendarBadgeText: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  eprValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  // ── Cascade ──
  cascadeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10,
  },
  cascadeTitle: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  impulseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,189,35,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.12)',
  },
  impulseBannerText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  cascadeSection: {
    gap: 4,
    marginBottom: 10,
  },
  cascadeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cascadeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cascadeLabel: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  cascadeValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  // ── Distribution ──
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  stat: {
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statDetail: {
    color: '#52525B',
    fontSize: 9,
    fontWeight: '500',
  },
  impulseDeduct: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  // ── Debt banner ──
  debtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(248,113,113,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.15)',
  },
  debtText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  // ── Verify ──
  verifyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  verifyLabel: {
    color: '#3F3F46',
    fontSize: 9,
    fontWeight: '600',
  },
  verifyValue: {
    color: '#52525B',
    fontSize: 9,
    fontWeight: '700',
  },
  // ── Income ──
  incomeSection: {
    marginTop: 8,
  },
  incomeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
});
