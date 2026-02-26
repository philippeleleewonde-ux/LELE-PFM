import React, { useCallback, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GOAL_CATEGORIES, GOAL_ICON_TO_COICOP } from '@/constants/goal-categories';
import { SavingsGoal } from '@/stores/savings-goal-store';
import { formatCurrency } from '@/services/format-helpers';
import { getWeekNumber, getISOYear, formatDateISO } from '@/utils/week-helpers';
import { executeGoalMaturity } from '@/services/goal-maturity-service';

interface GoalMaturityModalProps {
  visible: boolean;
  goal: SavingsGoal;
  onClose: () => void;
}

export function GoalMaturityModal({ visible, goal, onClose }: GoalMaturityModalProps) {
  const { t } = useTranslation('tracking');
  const [error, setError] = useState<string | null>(null);

  const cat = GOAL_CATEGORIES[goal.icon];
  const Icon = cat?.icon;
  const coicopCode = GOAL_ICON_TO_COICOP[goal.icon];
  const totalContributed = goal.contributions.reduce((s, c) => s + c.amount, 0);

  const handleValidate = useCallback(() => {
    const now = new Date();
    setError(null);

    const result = executeGoalMaturity({
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      coicopCode,
      transactionLabel: `${t('maturity.transactionLabel')}: ${goal.name}`,
      transactionNote: t('maturity.transactionNote', { goalName: goal.name }),
      transactionDate: formatDateISO(now),
      weekNumber: getWeekNumber(now),
      year: getISOYear(now),
    });

    if (result.success) {
      onClose();
    } else {
      console.error('[GoalMaturity] Atomic execution failed:', result.error);
      setError(result.error ?? 'Unknown error');
    }
  }, [goal, coicopCode, onClose, t]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Success icon */}
          <View style={styles.iconCircle}>
            <CheckCircle size={36} color="#4ADE80" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('maturity.title')}</Text>
          <Text style={styles.subtitle}>{t('maturity.subtitle')}</Text>

          {/* Goal info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              {Icon && <Icon size={18} color={cat.color} />}
              <Text style={styles.goalName}>{goal.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('goals.targetAmount')}</Text>
              <Text style={styles.infoValue}>{formatCurrency(totalContributed)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('maturity.categoryLabel')}</Text>
              <Text style={styles.infoValue}>{t(`goalCategories.${goal.icon}`)}</Text>
            </View>
          </View>

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={14} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <Pressable onPress={handleValidate} style={styles.validateBtn}>
            <Text style={styles.validateBtnText}>{t('maturity.validateExpense')}</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.postponeBtn}>
            <Text style={styles.postponeBtnText}>{t('maturity.postpone')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74,222,128,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  infoSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalName: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  infoLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '700',
  },
  validateBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  validateBtnText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '800',
  },
  postponeBtn: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postponeBtnText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
