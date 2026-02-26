import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ChevronRight, Check, CheckCircle, Zap, Shield, Scale, Rocket, Sliders, Pause } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GOAL_CATEGORIES } from '@/constants/goal-categories';
import { SavingsGoal } from '@/stores/savings-goal-store';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { getWeekNumber, getISOYear } from '@/utils/week-helpers';
import { SCENARIO_COLORS, type ScenarioId } from '@/domain/calculators/savings-scenario-engine';

const SCENARIO_ICONS: Record<ScenarioId, React.ComponentType<any>> = {
  prudent: Shield,
  equilibre: Scale,
  ambitieux: Rocket,
  accelere: Zap,
  custom: Sliders,
};

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onPress: () => void;
  onContribute: () => void;
}

export function SavingsGoalCard({ goal, onPress, onContribute }: SavingsGoalCardProps) {
  const { t } = useTranslation('tracking');
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  const cat = GOAL_CATEGORIES[goal.icon];
  const Icon = cat?.icon;
  const totalContributed = goal.contributions.reduce((s, c) => s + c.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - totalContributed);
  const progressPercent = goal.targetAmount > 0
    ? Math.min(100, Math.round((totalContributed / goal.targetAmount) * 100))
    : 0;

  // Progress bar color: cyan normal, gold >80%, green if complete
  const progressColor = goal.isCompleted ? '#4ADE80' : progressPercent >= 80 ? '#FBBF24' : '#22D3EE';

  // Plan info
  const hasPlan = !!goal.plan;
  const plan = goal.plan;
  const planColor = plan ? SCENARIO_COLORS[plan.scenarioId] ?? '#60A5FA' : '#60A5FA';
  const ScenarioIcon = plan ? SCENARIO_ICONS[plan.scenarioId] : null;
  const isPaused = plan?.status === 'paused';
  const adherenceRate = plan && plan.weeksExecuted > 0
    ? Math.min(100, Math.round((plan.planContributions / (plan.weeklyAmount * plan.weeksExecuted)) * 100))
    : 0;
  const adherenceColor = adherenceRate >= 90 ? '#4ADE80' : adherenceRate >= 70 ? '#FBBF24' : '#F87171';

  // Deadline calculation
  let deadlineBadge: string | null = null;
  let isOverdue = false;
  if (goal.deadline && !goal.isCompleted) {
    const daysLeft = Math.ceil(
      (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft > 0) {
      deadlineBadge = t('reporting.daysRemaining', { days: daysLeft });
    } else {
      deadlineBadge = t('reporting.deadlineExceeded');
      isOverdue = true;
    }
  }

  // This week contributions
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = getISOYear(now);
  const thisWeekContribs = goal.contributions.filter((c) => {
    const d = new Date(c.date);
    return getWeekNumber(d) === currentWeek && getISOYear(d) === currentYear;
  });
  const thisWeekTotal = thisWeekContribs.reduce((s, c) => s + c.amount, 0);
  const thisWeekPlan = thisWeekContribs.filter((c) => c.source === 'plan').reduce((s, c) => s + c.amount, 0);
  const thisWeekExtra = thisWeekContribs.filter((c) => c.source === 'extra').reduce((s, c) => s + c.amount, 0);
  const thisWeekAuto = thisWeekContribs.filter((c) => c.source === 'auto').reduce((s, c) => s + c.amount, 0);

  // Last contribution
  const lastContrib = goal.contributions.length > 0 ? goal.contributions[0] : null;

  return (
    <Pressable onPress={onPress}>
      <GlassCard
        variant="dark"
        style={[
          styles.card,
          goal.isCompleted && styles.cardCompleted,
          isPaused && styles.cardPaused,
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {Icon && <Icon size={18} color={goal.isCompleted ? '#FBBF24' : cat.color} />}
            <Text style={[styles.goalName, isSmall && { fontSize: 14 }, isPaused && { opacity: 0.6 }]} numberOfLines={1}>
              {goal.name}
            </Text>
          </View>
          {goal.isCompleted ? (
            <View style={styles.checkBadge}>
              <Check size={14} color="#4ADE80" />
            </View>
          ) : isPaused ? (
            <View style={styles.pauseBadge}>
              <Pause size={12} color="#71717A" />
            </View>
          ) : (
            <ChevronRight size={16} color="#52525B" />
          )}
        </View>

        {/* Plan badge (replaces old allocation badge) */}
        {hasPlan && plan && !goal.isCompleted && (
          <View style={[styles.planBadge, { backgroundColor: planColor + '12', borderColor: planColor + '30' }]}>
            {ScenarioIcon && <ScenarioIcon size={11} color={planColor} />}
            <Text style={[styles.planBadgeText, { color: planColor }]}>
              {t(`scenarios.${plan.scenarioId}`)} | {formatCurrency(plan.weeklyAmount)}{t('scenarios.perWeek')}
            </Text>
            {isPaused && (
              <View style={styles.pauseTag}>
                <Text style={styles.pauseTagText}>PAUSE</Text>
              </View>
            )}
          </View>
        )}

        {/* Legacy allocation badge */}
        {!hasPlan && !goal.isCompleted && goal.allocation && goal.allocation.mode !== 'manual' && (
          <View style={styles.allocationBadge}>
            <Zap size={11} color="#A78BFA" />
            <Text style={styles.allocationBadgeText}>
              {goal.allocation.mode === 'fixed' && formatCurrency(goal.allocation.fixedAmount ?? 0) + t('reporting.perWeek')}
              {goal.allocation.mode === 'deadline' && t('reporting.autoDeadline')}
              {goal.allocation.mode === 'percent' && (goal.allocation.percentAmount ?? 0) + t('reporting.surplusPercent')}
            </Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: progressColor },
            ]}
          />
        </View>

        {/* Amounts row */}
        <View style={styles.amountsRow}>
          <Text style={[styles.amountText, isSmall && { fontSize: 12 }]}>
            {formatCurrency(totalContributed)}
            <Text style={styles.amountSep}> / </Text>
            {formatCurrency(goal.targetAmount)}
          </Text>
          <Text style={[styles.percentText, { color: progressColor }]}>
            {progressPercent}%
          </Text>
        </View>

        {/* Plan adherence mini bar */}
        {hasPlan && plan && plan.weeksExecuted > 0 && !goal.isCompleted && (
          <View style={styles.adherenceRow}>
            <View style={styles.adherenceBarBg}>
              <View style={[styles.adherenceBarFill, { width: `${adherenceRate}%`, backgroundColor: adherenceColor }]} />
            </View>
            <Text style={[styles.adherenceText, { color: adherenceColor }]}>{adherenceRate}%</Text>
          </View>
        )}

        {/* This week badge */}
        {thisWeekTotal > 0 && !goal.isCompleted && (
          <View style={styles.thisWeekBadge}>
            {hasPlan ? (
              <Text style={styles.thisWeekText}>
                {thisWeekPlan > 0 && `+${formatCurrency(thisWeekPlan)} ${t('scenarios.planTag').toLowerCase()}`}
                {thisWeekPlan > 0 && thisWeekExtra > 0 && ' + '}
                {thisWeekExtra > 0 && `${formatCurrency(thisWeekExtra)} ${t('scenarios.extraTag').toLowerCase()}`}
                {thisWeekPlan === 0 && thisWeekExtra === 0 && `+${formatCurrency(thisWeekTotal)} ${t('goals.thisWeek')}`}
              </Text>
            ) : (
              <>
                <Text style={styles.thisWeekText}>
                  +{formatCurrency(thisWeekTotal)} {t('goals.thisWeek')}
                </Text>
                {thisWeekAuto > 0 && (
                  <View style={styles.autoTag}>
                    <Zap size={9} color="#A78BFA" />
                    <Text style={styles.autoTagText}>AUTO</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Completed badge — differentiated */}
        {goal.isCompleted && goal.expenseValidated && (
          <View style={styles.validatedBadge}>
            <CheckCircle size={12} color="#4ADE80" />
            <Text style={styles.validatedText}>{t('maturity.expenseValidated')}</Text>
          </View>
        )}
        {goal.isCompleted && !goal.expenseValidated && (
          <View style={styles.pendingValidationBadge}>
            <Check size={12} color="#FBBF24" />
            <Text style={styles.pendingValidationText}>{t('maturity.pendingValidation')}</Text>
          </View>
        )}

        {/* Deadline badge */}
        {deadlineBadge && !goal.isCompleted && (
          <View style={styles.deadlineBadge}>
            <Text style={[
              styles.deadlineText,
              isOverdue && { color: '#F87171' },
            ]}>
              {deadlineBadge}
            </Text>
          </View>
        )}

        {/* Last contribution */}
        {lastContrib && (
          <Text style={styles.lastContrib}>
            {t('reporting.lastContribution', { amount: formatCurrency(lastContrib.amount), date: new Date(lastContrib.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) })}
          </Text>
        )}

        {/* Contribute / Validate button */}
        {!goal.isCompleted && (
          <Pressable onPress={onContribute} style={styles.contributeBtn}>
            <Text style={styles.contributeBtnText}>
              {hasPlan ? t('scenarios.extraContribution') : t('reporting.contributeBtn')}
            </Text>
          </Pressable>
        )}
        {goal.isCompleted && !goal.expenseValidated && (
          <Pressable onPress={onPress} style={styles.validateBtn}>
            <Text style={styles.validateBtnText}>{t('maturity.validateCTA')}</Text>
          </Pressable>
        )}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  cardCompleted: {
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.3)',
  },
  cardPaused: {
    opacity: 0.75,
  },
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
    flex: 1,
  },
  goalName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(113,113,122,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Plan badge ──
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pauseTag: {
    backgroundColor: 'rgba(113,113,122,0.2)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  pauseTagText: {
    color: '#71717A',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // ── Legacy allocation badge ──
  allocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  allocationBadgeText: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amountText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  amountSep: {
    color: '#52525B',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // ── Adherence mini bar ──
  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adherenceBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  adherenceBarFill: {
    height: 3,
    borderRadius: 2,
  },
  adherenceText: {
    fontSize: 10,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  validatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  validatedText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingValidationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,189,35,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pendingValidationText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  deadlineBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  deadlineText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  thisWeekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  thisWeekText: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '700',
  },
  autoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  autoTagText: {
    color: '#A78BFA',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lastContrib: {
    color: '#52525B',
    fontSize: 11,
    marginTop: 6,
  },
  contributeBtn: {
    marginTop: 10,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(34,211,238,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributeBtnText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  validateBtn: {
    marginTop: 10,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtnText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
});
