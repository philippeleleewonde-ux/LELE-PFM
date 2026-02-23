import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { X, Trash2, Edit3, Check, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GOAL_CATEGORIES } from '@/constants/goal-categories';
import { useSavingsGoalStore, SavingsGoal } from '@/stores/savings-goal-store';
import { formatCurrency } from '@/services/format-helpers';

const DATE_LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

interface GoalDetailSheetProps {
  visible: boolean;
  goalId: string | null;
  onClose: () => void;
  onContribute: () => void;
}

export function GoalDetailSheet({ visible, goalId, onClose, onContribute }: GoalDetailSheetProps) {
  const { t, i18n } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const dateLocale = DATE_LOCALES[i18n.language] ?? 'fr-FR';
  const goals = useSavingsGoalStore((s) => s.goals);
  const deleteGoal = useSavingsGoalStore((s) => s.deleteGoal);
  const deleteContribution = useSavingsGoalStore((s) => s.deleteContribution);
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

  if (!goal) return null;

  const cat = GOAL_CATEGORIES[goal.icon];
  const Icon = cat?.icon;
  const totalContributed = goal.contributions.reduce((s, c) => s + c.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - totalContributed);
  const progressPercent = goal.targetAmount > 0
    ? Math.min(100, Math.round((totalContributed / goal.targetAmount) * 100))
    : 0;
  const progressColor = goal.isCompleted ? '#4ADE80' : progressPercent >= 80 ? '#FBBF24' : '#22D3EE';

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

          {/* Completion badge */}
          {goal.isCompleted && (
            <View style={styles.completedBanner}>
              <Check size={16} color="#FBBF24" />
              <Text style={styles.completedBannerText}>{t('goals.goalReached')}</Text>
            </View>
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

          {/* Deadline */}
          {deadlineInfo && (
            <View style={styles.deadlineRow}>
              <Text style={styles.deadlineLabel}>{t('goals.deadline')}</Text>
              <Text style={styles.deadlineValue}>{deadlineInfo}</Text>
            </View>
          )}

          {/* Allocation info */}
          {goal.allocation && goal.allocation.mode !== 'manual' && (
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {goal.contributions.length === 0 ? (
              <Text style={styles.emptyText}>{t('goals.noContributions')}</Text>
            ) : (
              goal.contributions.map((c) => {
                const isAuto = c.source === 'auto';
                return (
                  <View key={c.id} style={styles.contribRow}>
                    <View style={styles.contribLeft}>
                      <View style={styles.contribAmountRow}>
                        <Text style={styles.contribAmount}>+{formatCurrency(c.amount)}</Text>
                        {isAuto && (
                          <View style={styles.autoBadge}>
                            <Text style={styles.autoBadgeText}>AUTO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.contribLabel}>{c.label}</Text>
                      <Text style={styles.contribDate}>
                        {new Date(c.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    {!isAuto && (
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
                <Text style={styles.contributeBtnText}>{t('goals.contribute')}</Text>
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
  completedBanner: {
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
  completedBannerText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
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
  contribAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoBadge: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  autoBadgeText: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historyTitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 10,
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
