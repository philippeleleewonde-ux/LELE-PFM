import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { X, Trash2, Check, Zap, Shield, Scale, Rocket, Sliders, Pause, Play, BarChart3, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GOAL_CATEGORIES } from '@/constants/goal-categories';
import { useSavingsGoalStore, SavingsGoal } from '@/stores/savings-goal-store';
import { formatCurrency } from '@/services/format-helpers';
import { getWeekNumber, getISOYear } from '@/utils/week-helpers';
import { SCENARIO_COLORS, type ScenarioId } from '@/domain/calculators/savings-scenario-engine';
const DATE_LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

const SCENARIO_ICONS: Record<ScenarioId, React.ComponentType<any>> = {
  prudent: Shield,
  equilibre: Scale,
  ambitieux: Rocket,
  accelere: Zap,
  custom: Sliders,
};

interface GoalDetailSheetProps {
  visible: boolean;
  goalId: string | null;
  onClose: () => void;
  onContribute: () => void;
  onValidateExpense: () => void;
}

export function GoalDetailSheet({ visible, goalId, onClose, onContribute, onValidateExpense }: GoalDetailSheetProps) {
  const { t, i18n } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const dateLocale = DATE_LOCALES[i18n.language] ?? 'fr-FR';
  const goals = useSavingsGoalStore((s) => s.goals);
  const deleteGoal = useSavingsGoalStore((s) => s.deleteGoal);
  const deleteContribution = useSavingsGoalStore((s) => s.deleteContribution);
  const updatePlanStatus = useSavingsGoalStore((s) => s.updatePlanStatus);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const goal = goals.find((g) => g.id === goalId) ?? null;

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (goalId) {
      deleteGoal(goalId);
      setConfirmDelete(false);
      onClose();
    }
  }, [confirmDelete, goalId, deleteGoal, onClose]);

  const handleDeleteContribution = useCallback((contribId: string) => {
    if (goalId) {
      deleteContribution(goalId, contribId);
    }
  }, [goalId, deleteContribution]);

  const handleClose = useCallback(() => {
    setConfirmDelete(false);
    onClose();
  }, [onClose]);

  const handleTogglePause = useCallback(() => {
    if (!goalId || !goal?.plan) return;
    const newStatus = goal.plan.status === 'active' ? 'paused' : 'active';
    updatePlanStatus(goalId, newStatus);
  }, [goalId, goal, updatePlanStatus]);

  if (!goal) return null;

  const cat = GOAL_CATEGORIES[goal.icon];
  const Icon = cat?.icon;
  const totalContributed = goal.contributions.reduce((s, c) => s + c.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - totalContributed);
  const progressPercent = goal.targetAmount > 0
    ? Math.min(100, Math.round((totalContributed / goal.targetAmount) * 100))
    : 0;
  const progressColor = goal.isCompleted ? '#4ADE80' : progressPercent >= 80 ? '#FBBF24' : '#22D3EE';

  // Plan tracking
  const hasPlan = !!goal.plan;
  const plan = goal.plan;
  const planColor = plan ? SCENARIO_COLORS[plan.scenarioId] ?? '#60A5FA' : '#60A5FA';
  const ScenarioIcon = plan ? SCENARIO_ICONS[plan.scenarioId] : null;
  const adherenceRate = plan && plan.weeksExecuted > 0
    ? Math.min(100, Math.round((plan.planContributions / (plan.weeklyAmount * plan.weeksExecuted)) * 100))
    : 0;
  const adherenceColor = adherenceRate >= 90 ? '#4ADE80' : adherenceRate >= 70 ? '#FBBF24' : '#F87171';

  // Deadline info
  let deadlineInfo: string | null = null;
  if (goal.deadline) {
    const dl = new Date(goal.deadline);
    deadlineInfo = dl.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
    if (!goal.isCompleted) {
      const daysLeft = Math.ceil((dl.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      deadlineInfo += daysLeft > 0 ? ` (${t('goals.daysRemaining', { days: daysLeft })})` : ` (${t('goals.overdue')})`;
    }
  }

  // Source badge helper
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'plan': return { text: t('scenarios.planTag'), bg: planColor + '15', color: planColor };
      case 'extra': return { text: t('scenarios.extraTag'), bg: 'rgba(74,222,128,0.15)', color: '#4ADE80' };
      case 'auto': return { text: 'AUTO', bg: 'rgba(167,139,250,0.15)', color: '#A78BFA' };
      default: return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.95 : 0.85), paddingHorizontal: isSmall ? 14 : 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {Icon && <Icon size={22} color={goal.isCompleted ? '#FBBF24' : cat.color} />}
              <Text style={styles.headerTitle} numberOfLines={1}>{goal.name}</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          {/* Completion badge — contextual */}
          {goal.isCompleted && goal.expenseValidated && (
            <View style={styles.validatedBanner}>
              <CheckCircle size={16} color="#4ADE80" />
              <Text style={styles.validatedBannerText}>{t('maturity.expenseValidated')}</Text>
            </View>
          )}
          {goal.isCompleted && !goal.expenseValidated && (
            <Pressable onPress={onValidateExpense} style={styles.pendingBanner}>
              <Check size={16} color="#FBBF24" />
              <Text style={styles.pendingBannerText}>{t('goals.goalReached')}</Text>
              <View style={styles.pendingBannerCTA}>
                <Text style={styles.pendingBannerCTAText}>{t('maturity.validateCTA')}</Text>
              </View>
            </Pressable>
          )}

          {/* Progress section */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: progressColor }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressValue}>{formatCurrency(totalContributed)}</Text>
              <Text style={styles.progressTarget}>/ {formatCurrency(goal.targetAmount)}</Text>
              <Text style={[styles.progressPercent, { color: progressColor }]}>{progressPercent}%</Text>
            </View>
            {!goal.isCompleted && (
              <Text style={styles.remainingText}>{t('goals.remaining', { amount: formatCurrency(remaining) })}</Text>
            )}
          </View>

          {/* ── Full scrollable content ── */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Deadline */}
            {deadlineInfo && (
              <View style={styles.deadlineRow}>
                <Text style={styles.deadlineLabel}>{t('goals.deadline')}</Text>
                <Text style={styles.deadlineValue}>{deadlineInfo}</Text>
              </View>
            )}

            {/* Plan tracking section */}
            {hasPlan && plan && (
              <View style={[styles.planSection, { borderColor: planColor + '30' }]}>
                <View style={styles.planHeader}>
                  {ScenarioIcon && <ScenarioIcon size={14} color={planColor} />}
                  <Text style={[styles.planTitle, { color: planColor }]}>{t('scenarios.planTracking')}</Text>
                  <View style={[styles.planStatusBadge, { backgroundColor: plan.status === 'active' ? planColor + '20' : 'rgba(113,113,122,0.2)' }]}>
                    <Text style={[styles.planStatusText, { color: plan.status === 'active' ? planColor : '#71717A' }]}>
                      {plan.status === 'active' ? t('scenarios.planActive') : plan.status === 'paused' ? t('scenarios.planPaused') : t('scenarios.planCompleted')}
                    </Text>
                  </View>
                </View>

                {/* Scenario badge + reference */}
                <View style={styles.planBadgeRow}>
                  <View style={[styles.scenarioBadge, { backgroundColor: planColor + '15' }]}>
                    <Text style={[styles.scenarioBadgeText, { color: planColor }]}>
                      {t(`scenarios.${plan.scenarioId}`)}
                    </Text>
                  </View>
                  <Text style={styles.planRef}>{t(`scenarios.${plan.scenarioId === 'prudent' ? 'sinkingFund' : plan.scenarioId === 'equilibre' ? 'ldi' : plan.scenarioId === 'ambitieux' ? 'gbi' : plan.scenarioId === 'accelere' ? 'dca' : 'custom'}`)}</Text>
                </View>

                {/* Engagement */}
                <Text style={styles.planDetail}>
                  {t('scenarios.weeklyCommitment', { amount: formatCurrency(plan.weeklyAmount) })}
                </Text>

                {/* Weeks progress */}
                <View style={styles.planWeeksRow}>
                  <Text style={styles.planWeeksLabel}>
                    {t('scenarios.weeksExecuted', { executed: plan.weeksExecuted, total: plan.estimatedWeeks })}
                  </Text>
                  <View style={styles.planWeeksBarBg}>
                    <View style={[
                      styles.planWeeksBarFill,
                      {
                        width: `${plan.estimatedWeeks > 0 ? Math.min(100, (plan.weeksExecuted / plan.estimatedWeeks) * 100) : 0}%`,
                        backgroundColor: planColor,
                      },
                    ]} />
                  </View>
                </View>

                {/* Plan vs Extra */}
                <View style={styles.planContribRow}>
                  <View style={styles.planContribItem}>
                    <Text style={styles.planContribLabel}>{t('scenarios.planContributions')}</Text>
                    <Text style={[styles.planContribValue, { color: planColor }]}>{formatCurrency(plan.planContributions)}</Text>
                  </View>
                  <View style={styles.planContribItem}>
                    <Text style={styles.planContribLabel}>{t('scenarios.extraContributions')}</Text>
                    <Text style={[styles.planContribValue, { color: '#4ADE80' }]}>{formatCurrency(plan.extraContributions)}</Text>
                  </View>
                </View>

                {/* Adherence rate */}
                {plan.weeksExecuted > 0 && (
                  <View style={styles.adherenceRow}>
                    <Text style={styles.adherenceLabel}>{t('scenarios.adherenceRate')}</Text>
                    <View style={[styles.adherenceBadge, { backgroundColor: adherenceColor + '20' }]}>
                      <Text style={[styles.adherenceValue, { color: adherenceColor }]}>{adherenceRate}%</Text>
                    </View>
                  </View>
                )}

                {/* Feasibility */}
                <Text style={styles.planFeasibility}>
                  {t('scenarios.originalFeasibility')}: {plan.feasibilityScore}/100
                </Text>

                {/* Pause/Resume buttons */}
                {!goal.isCompleted && plan.status !== 'completed' && (
                  <Pressable onPress={handleTogglePause} style={[styles.pauseBtn, { borderColor: plan.status === 'active' ? '#FBBF24' + '40' : planColor + '40' }]}>
                    {plan.status === 'active' ? (
                      <>
                        <Pause size={12} color="#FBBF24" />
                        <Text style={[styles.pauseBtnText, { color: '#FBBF24' }]}>{t('scenarios.pausePlan')}</Text>
                      </>
                    ) : (
                      <>
                        <Play size={12} color={planColor} />
                        <Text style={[styles.pauseBtnText, { color: planColor }]}>{t('scenarios.resumePlan')}</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            )}

            {/* Weekly progression chart */}
            <WeeklyProgressionChart goal={goal} planColor={planColor} hasPlan={hasPlan} />

            {/* Legacy allocation info (non-plan) */}
            {!hasPlan && goal.allocation && goal.allocation.mode !== 'manual' && (
              <View style={styles.allocationRow}>
                <Zap size={14} color="#A78BFA" />
                <View style={styles.allocationInfo}>
                  <Text style={styles.allocationLabel}>{t('goals.autoAllocationLabel')}</Text>
                  <Text style={styles.allocationDesc}>
                    {goal.allocation.mode === 'fixed' && t('goals.fixedPerWeek', { amount: formatCurrency(goal.allocation.fixedAmount ?? 0) })}
                    {goal.allocation.mode === 'deadline' && t('goals.autoCalcDeadline')}
                    {goal.allocation.mode === 'percent' && t('goals.percentSurplusWeekly', { percent: goal.allocation.percentAmount ?? 0 })}
                  </Text>
                </View>
              </View>
            )}

            {/* Contributions history */}
            <Text style={styles.historyTitle}>{t('goals.contributionHistory')}</Text>
            {goal.contributions.length === 0 ? (
              <Text style={styles.emptyText}>{t('goals.noContributions')}</Text>
            ) : (
              goal.contributions.map((c) => {
                const badge = getSourceBadge(c.source);
                const isDeletable = c.source === 'manual' || c.source === 'extra';
                return (
                  <View key={c.id} style={styles.contribRow}>
                    <View style={styles.contribLeft}>
                      <View style={styles.contribAmountRow}>
                        <Text style={styles.contribAmount}>+{formatCurrency(c.amount)}</Text>
                        {badge && (
                          <View style={[styles.sourceBadge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.sourceBadgeText, { color: badge.color }]}>{badge.text}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.contribLabel}>{c.label}</Text>
                      <Text style={styles.contribDate}>
                        {new Date(c.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    {isDeletable && (
                      <Pressable
                        onPress={() => handleDeleteContribution(c.id)}
                        style={styles.contribDeleteBtn}
                      >
                        <Trash2 size={14} color="#F87171" />
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Bottom actions */}
          <View style={styles.actions}>
            {!goal.isCompleted && (
              <Pressable onPress={onContribute} style={styles.contributeBtn}>
                <Text style={styles.contributeBtnText}>
                  {hasPlan ? t('scenarios.extraContribution') : t('goals.contribute')}
                </Text>
              </Pressable>
            )}
            {goal.isCompleted && !goal.expenseValidated && (
              <Pressable onPress={onValidateExpense} style={styles.validateExpenseBtn}>
                <Text style={styles.validateExpenseBtnText}>{t('maturity.validateExpense')}</Text>
              </Pressable>
            )}
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Trash2 size={16} color="#F87171" />
              <Text style={styles.deleteBtnText}>
                {confirmDelete ? t('goals.confirmDeletion') : t('goals.deleteGoal')}
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ── Weekly progression sub-component ──

interface WeeklyProgressionChartProps {
  goal: SavingsGoal;
  planColor: string;
  hasPlan: boolean;
}

function WeeklyProgressionChart({ goal, planColor, hasPlan }: WeeklyProgressionChartProps) {
  const { t } = useTranslation('tracking');

  // Group contributions by ISO week, compute cumulative total
  const weeklyData = useMemo(() => {
    const weekMap = new Map<string, { week: number; year: number; plan: number; extra: number; manual: number; auto: number; total: number }>();

    for (const c of goal.contributions) {
      const d = new Date(c.date);
      const w = getWeekNumber(d);
      const y = getISOYear(d);
      const key = `${y}-${w}`;
      const entry = weekMap.get(key) ?? { week: w, year: y, plan: 0, extra: 0, manual: 0, auto: 0, total: 0 };
      entry[c.source as 'plan' | 'extra' | 'manual' | 'auto'] += c.amount;
      entry.total += c.amount;
      weekMap.set(key, entry);
    }

    // Sort by year then week
    const sorted = Array.from(weekMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week - b.week;
    });

    // Compute cumulative
    let cumul = 0;
    return sorted.map((entry) => {
      cumul += entry.total;
      return { ...entry, cumulative: cumul };
    });
  }, [goal.contributions]);

  // Show empty state for plan goals with no contributions yet
  if (weeklyData.length === 0) {
    if (!hasPlan) return null;
    return (
      <View style={progressStyles.container}>
        <View style={progressStyles.header}>
          <BarChart3 size={12} color="#22D3EE" />
          <Text style={progressStyles.title}>{t('scenarios.weeklyEvolution')}</Text>
        </View>
        <Text style={progressStyles.emptyText}>{t('goals.noContributions')}</Text>
        <View style={progressStyles.cumulRow}>
          <View style={progressStyles.cumulBarBg}>
            <View style={[progressStyles.cumulBarFill, { width: '0%', backgroundColor: '#22D3EE' }]} />
          </View>
          <Text style={progressStyles.cumulTotal}>
            {formatCurrency(0)} / {formatCurrency(goal.targetAmount)}
          </Text>
        </View>
      </View>
    );
  }

  const maxWeekly = Math.max(...weeklyData.map((d) => d.total));
  const target = goal.targetAmount;

  // Show last 8 weeks max for readability
  const displayData = weeklyData.slice(-8);

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.header}>
        <BarChart3 size={12} color="#22D3EE" />
        <Text style={progressStyles.title}>{t('scenarios.weeklyEvolution')}</Text>
      </View>

      {/* Bar chart */}
      <View style={progressStyles.chartContainer}>
        {displayData.map((entry, idx) => {
          const barHeight = maxWeekly > 0 ? Math.max(4, (entry.total / maxWeekly) * 60) : 4;
          const cumulPercent = target > 0 ? Math.min(100, Math.round((entry.cumulative / target) * 100)) : 0;
          const hasPlanSource = entry.plan > 0;
          const barColor = hasPlanSource ? planColor : '#22D3EE';

          return (
            <View key={`${entry.year}-${entry.week}`} style={progressStyles.barColumn}>
              {/* Cumulative percent on top */}
              <Text style={progressStyles.cumulText}>{cumulPercent}%</Text>
              {/* Bar with source colors */}
              <View style={progressStyles.barWrapper}>
                {entry.plan > 0 && (
                  <View style={[progressStyles.barSegment, { height: maxWeekly > 0 ? Math.max(2, (entry.plan / maxWeekly) * 60) : 2, backgroundColor: planColor }]} />
                )}
                {entry.extra > 0 && (
                  <View style={[progressStyles.barSegment, { height: maxWeekly > 0 ? Math.max(2, (entry.extra / maxWeekly) * 60) : 2, backgroundColor: '#4ADE80' }]} />
                )}
                {(entry.manual + entry.auto) > 0 && (
                  <View style={[progressStyles.barSegment, { height: maxWeekly > 0 ? Math.max(2, ((entry.manual + entry.auto) / maxWeekly) * 60) : 2, backgroundColor: '#22D3EE' }]} />
                )}
              </View>
              {/* Week label */}
              <Text style={progressStyles.weekLabel}>S{entry.week}</Text>
              {/* Amount */}
              <Text style={progressStyles.amountLabel}>{formatCurrency(entry.total)}</Text>
            </View>
          );
        })}
      </View>

      {/* Cumulative progress line */}
      <View style={progressStyles.cumulRow}>
        <View style={progressStyles.cumulBarBg}>
          <View
            style={[
              progressStyles.cumulBarFill,
              {
                width: `${target > 0 ? Math.min(100, (weeklyData[weeklyData.length - 1].cumulative / target) * 100) : 0}%`,
                backgroundColor: goal.isCompleted ? '#4ADE80' : '#22D3EE',
              },
            ]}
          />
        </View>
        <Text style={progressStyles.cumulTotal}>
          {formatCurrency(weeklyData[weeklyData.length - 1].cumulative)} / {formatCurrency(target)}
        </Text>
      </View>

      {/* Legend */}
      {goal.plan && (
        <View style={progressStyles.legendRow}>
          <View style={progressStyles.legendItem}>
            <View style={[progressStyles.legendDot, { backgroundColor: planColor }]} />
            <Text style={progressStyles.legendText}>{t('scenarios.planTag')}</Text>
          </View>
          <View style={progressStyles.legendItem}>
            <View style={[progressStyles.legendDot, { backgroundColor: '#4ADE80' }]} />
            <Text style={progressStyles.legendText}>{t('scenarios.extraTag')}</Text>
          </View>
          <View style={progressStyles.legendItem}>
            <View style={[progressStyles.legendDot, { backgroundColor: '#22D3EE' }]} />
            <Text style={progressStyles.legendText}>{t('goals.contribute')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  title: {
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 90,
    marginBottom: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  cumulText: {
    color: '#71717A',
    fontSize: 8,
    fontWeight: '700',
  },
  barWrapper: {
    width: 14,
    gap: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barSegment: {
    width: 14,
    borderRadius: 3,
  },
  weekLabel: {
    color: '#52525B',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  amountLabel: {
    color: '#71717A',
    fontSize: 7,
    fontWeight: '600',
  },
  cumulRow: {
    gap: 4,
  },
  cumulBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cumulBarFill: {
    height: 4,
    borderRadius: 2,
  },
  cumulTotal: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#52525B',
    fontSize: 8,
    fontWeight: '600',
  },
  emptyText: {
    color: '#52525B',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#0F1014',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxWidth: 600,
    paddingTop: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  validatedBannerText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,189,35,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.25)',
  },
  pendingBannerText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  pendingBannerCTA: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBannerCTAText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
  validateExpenseBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateExpenseBtnText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  progressTarget: {
    color: '#71717A',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  remainingText: {
    color: '#52525B',
    fontSize: 12,
    marginTop: 4,
  },
  deadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  deadlineLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  deadlineValue: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
  },
  // ── Plan section ──
  planSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 8,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  planStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scenarioBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scenarioBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planRef: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  planDetail: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  planWeeksRow: {
    gap: 4,
  },
  planWeeksLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  planWeeksBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  planWeeksBarFill: {
    height: 4,
    borderRadius: 2,
  },
  planContribRow: {
    flexDirection: 'row',
    gap: 16,
  },
  planContribItem: {
    flex: 1,
    gap: 2,
  },
  planContribLabel: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '600',
  },
  planContribValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adherenceLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  adherenceBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adherenceValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  planFeasibility: {
    color: '#3F3F46',
    fontSize: 10,
    fontWeight: '600',
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pauseBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // ── Legacy allocation ──
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(167,139,250,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
  },
  allocationInfo: {
    flex: 1,
  },
  allocationLabel: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
  },
  allocationDesc: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  // ── Contributions ──
  contribAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  historyTitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyText: {
    color: '#52525B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  contribRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  contribLeft: {
    flex: 1,
    gap: 2,
  },
  contribAmount: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '700',
  },
  contribLabel: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '500',
  },
  contribDate: {
    color: '#52525B',
    fontSize: 11,
  },
  contribDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(248,113,113,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actions: {
    gap: 10,
    marginTop: 10,
  },
  contributeBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributeBtnText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.15)',
  },
  deleteBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
});
