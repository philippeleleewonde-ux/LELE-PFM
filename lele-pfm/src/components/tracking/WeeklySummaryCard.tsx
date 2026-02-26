import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
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
import { addAutoContributionsWithAudit } from '@/services/goal-contribution-service';
import { useViewMode } from '@/hooks/useViewMode';
import { useFinancialScore } from '@/hooks/useFinancialScore';
import { useWeeklyAllocation } from '@/hooks/useWeeklyAllocation';
import { useActiveCompensations } from '@/hooks/useActiveCompensations';
import { getCurrentWeek, getWeekRangeLabel } from '@/utils/week-helpers';
import { GOAL_CATEGORIES, GoalIcon } from '@/constants/goal-categories';
import { SCENARIO_COLORS } from '@/domain/calculators/savings-scenario-engine';

interface WeeklySummaryCardProps {
  week: number;
  year: number;
  weeklyBudget: number;
  weeklyTarget: number;
  weeklySpent: number;
  savings: WeeklySavingsResult;
  planYear: 1 | 2 | 3;
  currentQuarter: 1 | 2 | 3 | 4;
  catchUpBanner?: string | null;
  /** Total engaged by active savings plans (Sinking Fund) */
  planCommitment?: number;
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
  catchUpBanner,
  planCommitment = 0,
}: WeeklySummaryCardProps) {
  const { t } = useTranslation('tracking');
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

  // Auto-save weekly record when savings or allocation change
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
        // Waterfall real values (Bug #4 fix — these override engine theoretical values)
        waterfallEpargne: allocation.epargne,
        waterfallDiscretionnaire: allocation.discretionnaire,
        waterfallTotalEpargne: allocation.totalEpargne,
        waterfallGoalAllocations: allocation.totalGoals,
        waterfallPlanAllocations: allocation.totalPendingPlan,
        _schemaVersion: 1,
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
  }, [week, year, weeklyBudget, weeklyTarget, weeklySpent, savings, isInvestor, allocation]);

  // ── Auto-allocation side-effect (legacy only — plan provisioning moved to usePlanProvisioning) ──
  const autoAllocatedRef = useRef<string>('');
  const [autoAllocBanner, setAutoAllocBanner] = useState(false);

  // Legacy auto-allocations (fixed/deadline/percent modes — NOT plan)
  useEffect(() => {
    const { week: currentW, year: currentY } = getCurrentWeek();
    const isRealWeek = week === currentW && year === currentY;
    if (!isRealWeek) return;
    if (savings.economies <= 0) return;

    const pending = allocation.pendingAutoAllocations.filter(
      (p) => !p.alreadyDone && p.allocatedAmount > 0
    );
    if (pending.length === 0) return;

    const weekTag = `${week}-${year}`;
    if (autoAllocatedRef.current === weekTag) return;
    autoAllocatedRef.current = weekTag;

    // Use audit service — creates contributions + internal transfer transactions (ISA 500)
    addAutoContributionsWithAudit(
      pending.map((p) => ({
        goalId: p.goalId,
        amount: p.allocatedAmount,
        weekKey: p.weekKey,
      }))
    );

    setAutoAllocBanner(true);
    setTimeout(() => setAutoAllocBanner(false), 4000);
  }, [week, year, savings.economies, allocation.pendingAutoAllocations]);

  if (weeklyBudget <= 0) return null;

  const compensationSummary = useActiveCompensations(week, year);

  const hasGoals = allocation.goalAllocations.length > 0;
  const hasPlanAllocations = allocation.planAllocations.length > 0;
  const hasImpulse = allocation.impulseTotal > 0;
  const hasOngoingCompensation = compensationSummary.hasActiveCompensations && !hasImpulse;
  const pendingAutoCount = allocation.pendingAutoAllocations.filter((p) => p.alreadyDone).length
    || allocation.pendingAutoAllocations.filter((p) => !p.alreadyDone).length;
  const totalPendingAutoAmount = allocation.pendingAutoAllocations.reduce((s, p) => s + p.allocatedAmount, 0)
    + allocation.planAllocations.reduce((s, p) => s + p.actualAllocated, 0);

  return (
    <GlassCard variant="dark" style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Award size={18} color={getGradeColor(savings.grade)} />
        <Text style={styles.title}>{t('summary.assessment')} {getWeekRangeLabel(week, year)}</Text>
        <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(savings.grade) + '20', borderColor: getGradeColor(savings.grade) + '40' }]}>
          <Text style={[styles.gradeText, { color: getGradeColor(savings.grade) }]}>
            {savings.grade}
          </Text>
        </View>
      </View>

      {/* ── Catch-up banner (Sinking Fund retroactive) ── */}
      {catchUpBanner && (
        <View style={styles.catchUpBanner}>
          <Shield size={12} color="#22D3EE" />
          <Text style={styles.catchUpBannerText}>{catchUpBanner}</Text>
        </View>
      )}

      {/* ── Auto-allocation banner ── */}
      {autoAllocBanner && totalPendingAutoAmount > 0 && (
        <View style={styles.autoAllocBanner}>
          <Zap size={12} color="#4ADE80" />
          <Text style={styles.autoAllocBannerText}>
            {t('goals.autoAllocated', { count: pendingAutoCount, amount: formatCurrency(totalPendingAutoAmount) })}
          </Text>
        </View>
      )}

      {/* ── Note ── */}
      <View style={styles.noteRow}>
        <Text style={styles.noteLabel}>{t('summary.note')}</Text>
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
                <Text style={styles.eprLabel}>{t('summary.savings')}</Text>
              </View>
              <Text style={[styles.eprValue, { color: '#4ADE80' }]}>
                {formatCurrency(savings.economies)}
              </Text>
            </View>
            <View style={styles.eprRow}>
              <View style={styles.eprItem}>
                <Target size={13} color="#60A5FA" />
                <Text style={styles.eprLabel}>{t('summary.eprTarget')}</Text>
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
                <Text style={styles.eprLabel}>{t('summary.eprRealized')}</Text>
              </View>
              <View style={styles.eprValueCol}>
                <Text style={[styles.eprValue, { color: allocation.eprAtteint ? '#4ADE80' : '#FBBF24' }]}>
                  {formatCurrency(allocation.eprProvision)}
                  {allocation.surplus > 0 && planCommitment <= 0 && (
                    <Text style={{ color: '#4ADE80', fontSize: 11 }}> +{formatCurrency(allocation.surplus)}</Text>
                  )}
                  {allocation.surplus > 0 && planCommitment > 0 && (
                    <Text style={{ color: '#4ADE80', fontSize: 11 }}> +{formatCurrency(Math.max(0, allocation.surplus - allocation.totalPendingPlan))} {t('scenarios.libre')}</Text>
                  )}
                </Text>
                {allocation.surplus > 0 && planCommitment > 0 && allocation.totalPendingPlan > 0 && (
                  <Text style={styles.planEngagedText}>
                    ({formatCurrency(allocation.totalPendingPlan)} {t('scenarios.planDeduction')})
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ── Cascade d'Allocation ── */}
          <View style={styles.cascadeDivider} />
          <Text style={styles.cascadeTitle}>{t('summary.allocationCascade')}</Text>

          {/* Impulse info banner */}
          {hasImpulse && (
            <View style={styles.impulseBanner}>
              <AlertTriangle size={12} color="#FBBF24" />
              <Text style={styles.impulseBannerText}>
                {t('summary.impulseMessage')} ({formatCurrency(allocation.impulseTotal)}), {t('summary.impulseExtra')} {formatCurrency(allocation.economiesIfNoImpulse)}
              </Text>
            </View>
          )}

          {/* Ongoing compensation banner (not the purchase week) */}
          {hasOngoingCompensation && (
            <View style={styles.compensationBanner}>
              <Shield size={12} color="#A78BFA" />
              <Text style={styles.compensationBannerText}>
                {t('compensation.summaryBanner', { amount: formatCurrency(compensationSummary.totalWeeklyReduction) })} ({compensationSummary.activePurchaseCount} {compensationSummary.activePurchaseCount > 1 ? 'achats' : 'achat'})
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

          {/* Plan allocations (both pending and already-done) */}
          {hasPlanAllocations && (
            <View style={styles.cascadeSection}>
              {allocation.planAllocations.map((pa) => {
                const color = SCENARIO_COLORS[pa.scenarioId] ?? '#60A5FA';
                return (
                  <View key={pa.goalId} style={styles.cascadeRow}>
                    <View style={styles.cascadeItem}>
                      <Target size={13} color={pa.alreadyDone ? color : color + '80'} />
                      <Text style={styles.cascadeLabel} numberOfLines={1}>
                        {pa.goalName}
                      </Text>
                      <View style={[styles.planTag, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.planTagText, { color }]}>{t('scenarios.planTag')}</Text>
                      </View>
                      {pa.alreadyDone && (
                        <View style={styles.doneBadge}>
                          <Text style={styles.doneBadgeText}>OK</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.cascadeValue,
                      { color: pa.isPartial ? '#FBBF24' : color },
                    ]}>
                      {formatCurrency(pa.actualAllocated)}
                      {pa.isPartial && (
                        <Text style={{ color: '#71717A', fontSize: 10 }}>
                          /{formatCurrency(pa.planWeeklyAmount)}
                        </Text>
                      )}
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
              <Text style={styles.statLabel}>{t('summary.savingsPocket')}</Text>
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
                <Text style={styles.statLabel}>{t('summary.investPocket')}</Text>
                <Text style={[styles.statValue, { color: '#FBBF24' }]}>
                  {formatCurrency(allocation.investissement)}
                </Text>
              </View>
            )}
            <View style={styles.stat}>
              <Wallet size={14} color="#A78BFA" />
              <Text style={styles.statLabel}>{t('summary.freedomPocket')}</Text>
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
              {hasOngoingCompensation && (
                <Text style={styles.compensationNote}>
                  ({t('compensation.budgetReduced', { amount: formatCurrency(compensationSummary.totalWeeklyReduction) })})
                </Text>
              )}
            </View>
          </View>

          {/* Impulse debt warning */}
          {allocation.impulseDebt > 0 && (
            <View style={styles.debtBanner}>
              <AlertTriangle size={12} color="#F87171" />
              <Text style={styles.debtText}>
                {t('summary.impulseUncovered')} : {formatCurrency(allocation.impulseDebt)}
              </Text>
            </View>
          )}

          {/* Verification total */}
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>{t('summary.totalDistributed')}</Text>
            <Text style={styles.verifyValue}>
              = {formatCurrency(savings.economies)}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.distributionRow}>
          <View style={styles.stat}>
            <TrendingDown size={14} color="#F87171" />
            <Text style={styles.statLabel}>{t('summary.overspend')}</Text>
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
              <Text style={styles.statLabel}>{t('summary.income')}</Text>
              <Text style={[styles.statValue, { color: '#4ADE80' }]}>
                +{formatCurrency(weeklyIncomeActual)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('summary.balance')}</Text>
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
  eprValueCol: {
    alignItems: 'flex-end',
  },
  planEngagedText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
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
  planTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 4,
  },
  planTagText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doneBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  doneBadgeText: {
    color: '#4ADE80',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
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
  compensationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(167,139,250,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
  },
  compensationBannerText: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  compensationNote: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
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
  // ── Auto-allocation banner ──
  autoAllocBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74,222,128,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  autoAllocBannerText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  // ── Catch-up banner ──
  catchUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,211,238,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.15)',
  },
  catchUpBannerText: {
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
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
