import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ChevronRight, Check, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GOAL_CATEGORIES } from '@/constants/goal-categories';
import { SavingsGoal } from '@/stores/savings-goal-store';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';

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

  // Last contribution
  const lastContrib = goal.contributions.length > 0 ? goal.contributions[0] : null;

  return (
    <Pressable onPress={onPress}>
      <GlassCard
        variant="dark"
        style={[
          styles.card,
          goal.isCompleted && styles.cardCompleted,
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {Icon && <Icon size={18} color={goal.isCompleted ? '#FBBF24' : cat.color} />}
            <Text style={[styles.goalName, isSmall && { fontSize: 14 }]} numberOfLines={1}>
              {goal.name}
            </Text>
          </View>
          {goal.isCompleted ? (
            <View style={styles.checkBadge}>
              <Check size={14} color="#4ADE80" />
            </View>
          ) : (
            <ChevronRight size={16} color="#52525B" />
          )}
        </View>

        {/* Allocation badge */}
        {!goal.isCompleted && goal.allocation && goal.allocation.mode !== 'manual' && (
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

        {/* Completed badge */}
        {goal.isCompleted && (
          <View style={styles.completedBadge}>
            <Check size={12} color="#FBBF24" />
            <Text style={styles.completedText}>{t('reporting.goalReached')}</Text>
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

        {/* Contribute button */}
        {!goal.isCompleted && (
          <Pressable onPress={onContribute} style={styles.contributeBtn}>
            <Text style={styles.contributeBtnText}>{t('reporting.contributeBtn')}</Text>
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
  completedBadge: {
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
  completedText: {
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
});
