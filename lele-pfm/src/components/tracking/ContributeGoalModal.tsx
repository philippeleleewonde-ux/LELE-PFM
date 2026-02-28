import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { X, PartyPopper, Info, Zap, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { addContributionWithAudit } from '@/services/goal-contribution-service';
import { formatCurrency } from '@/services/format-helpers';
import { AmountInput } from './AmountInput';
import { useWeeklyAllocation } from '@/hooks/useWeeklyAllocation';
import { useWeeklyTracking } from '@/hooks/useWeeklyTracking';
import { getCurrentWeek } from '@/utils/week-helpers';
import { SCENARIO_COLORS } from '@/domain/calculators/savings-scenario-engine';

interface ContributeGoalModalProps {
  visible: boolean;
  goalId: string | null;
  goalName: string;
  remaining: number;
  onClose: () => void;
}

export function ContributeGoalModal({ visible, goalId, goalName, remaining, onClose }: ContributeGoalModalProps) {
  const { t } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const goals = useSavingsGoalStore((s) => s.goals);
  const goal = goalId ? goals.find((g) => g.id === goalId) : null;
  const hasPlan = !!goal?.plan;
  const plan = goal?.plan;
  const planColor = plan ? SCENARIO_COLORS[plan.scenarioId] ?? '#60A5FA' : '#60A5FA';
  const hasAutoAllocation = !hasPlan && goal?.allocation && goal.allocation.mode !== 'manual';
  const translateY = useRef(new Animated.Value(height)).current;

  // Get available surplus from allocation waterfall
  const { week, year } = getCurrentWeek();
  const tracking = useWeeklyTracking(week, year);
  const allocation = useWeeklyAllocation(week, year, tracking.savings);
  const availableSurplus = allocation.availableForGoals;

  const [amount, setAmount] = useState(0);
  const [label, setLabel] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount(0);
      setLabel('');
      setShowCongrats(false);

      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  const isOverSurplus = availableSurplus > 0 && amount > availableSurplus;
  const isOverRemaining = amount > remaining;
  const isOverMax = amount > 999_999_999;
  // Hard-block: amount must not exceed surplus (solvability) nor remaining (over-funding) — Bug #5
  const isValid = amount > 0 && label.trim().length > 0 && !isOverSurplus && !isOverRemaining && !isOverMax;

  const handleSubmit = useCallback(() => {
    if (!isValid || !goalId) return;

    // Use audit service — creates contribution + internal transfer transaction (ISA 500)
    addContributionWithAudit(goalId, amount, label.trim(), hasPlan ? 'extra' : 'manual');

    if (amount >= remaining) {
      setShowCongrats(true);
      setTimeout(() => {
        setShowCongrats(false);
        onClose();
      }, 2000);
    } else {
      onClose();
    }
  }, [isValid, goalId, amount, label, remaining, hasPlan, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handleBar} />

          {showCongrats ? (
            <View style={styles.congratsContainer}>
              <PartyPopper size={48} color="#FBBF24" />
              <Text style={styles.congratsTitle}>{t('goals.goalReached')}</Text>
              <Text style={styles.congratsText}>{goalName}</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.title}>
                    {hasPlan ? t('scenarios.extraContribution') : t('goals.contribute')}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {goalName} — {t('goals.remaining', { amount: formatCurrency(Math.max(0, remaining)) })}
                  </Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#A1A1AA" />
                </Pressable>
              </View>

              <View style={[styles.body, { paddingHorizontal: isSmall ? 14 : 20 }]}>
                {/* Plan info banner */}
                {hasPlan && plan && (
                  <View style={[styles.planBanner, { borderColor: planColor + '25' }]}>
                    <Target size={12} color={planColor} />
                    <Text style={[styles.planBannerText, { color: planColor }]}>
                      {t('scenarios.extraContributionInfo')}
                    </Text>
                  </View>
                )}

                {/* Plan summary */}
                {hasPlan && plan && (
                  <View style={styles.planSummaryRow}>
                    <Text style={styles.planSummaryText}>
                      {t('scenarios.planSummary', {
                        plan: formatCurrency(plan.planContributions),
                        extra: formatCurrency(plan.extraContributions),
                        total: formatCurrency(plan.planContributions + plan.extraContributions),
                        target: formatCurrency(goal?.targetAmount ?? 0),
                      })}
                    </Text>
                  </View>
                )}

                {/* Legacy auto-allocation banner */}
                {hasAutoAllocation && (
                  <View style={styles.autoBanner}>
                    <Zap size={12} color="#A78BFA" />
                    <Text style={styles.autoBannerText}>
                      {t('goals.autoAllocationActive')}
                    </Text>
                  </View>
                )}

                {/* Surplus info */}
                {availableSurplus > 0 && (
                  <View style={styles.surplusInfo}>
                    <Info size={12} color="#22D3EE" />
                    <Text style={styles.surplusText}>
                      {t('goals.availableSurplus', { amount: formatCurrency(availableSurplus) })}
                    </Text>
                  </View>
                )}
                {availableSurplus <= 0 && tracking.savings.economies > 0 && (
                  <View style={styles.surplusWarning}>
                    <Info size={12} color="#FBBF24" />
                    <Text style={styles.surplusWarningText}>
                      {t('goals.noSurplusAvailable')}
                    </Text>
                  </View>
                )}

                <Text style={styles.sectionLabel}>{t('addExpense.amount')}</Text>
                <AmountInput value={amount} onChange={setAmount} />

                {/* Over-surplus warning */}
                {isOverSurplus && (
                  <Text style={styles.overSurplusText}>
                    {t('goals.exceedsSurplus', { amount: formatCurrency(availableSurplus) })}
                  </Text>
                )}

                {/* Over-remaining warning */}
                {isOverRemaining && !isOverSurplus && (
                  <Text style={styles.overSurplusText}>
                    {t('goals.exceedsRemaining', { amount: formatCurrency(remaining) })}
                  </Text>
                )}

                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>{t('addExpense.description')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={label}
                  onChangeText={setLabel}
                  placeholder={t('goals.contributePlaceholder')}
                  placeholderTextColor="#52525B"
                  returnKeyType="done"
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={!isValid}
                style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
              >
                <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
                  {hasPlan ? t('scenarios.extraContribution') : t('goals.contribute')}
                </Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#0F1014',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    width: '100%',
    maxWidth: 500,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#71717A',
    fontSize: 13,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 50,
    color: '#FFFFFF',
    fontSize: 15,
  },
  submitBtn: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  submitText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '800',
  },
  submitTextDisabled: {
    color: '#52525B',
  },
  congratsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  congratsTitle: {
    color: '#FBBF24',
    fontSize: 24,
    fontWeight: '900',
  },
  congratsText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  // ── Plan banner ──
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(96,165,250,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  planBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  planSummaryRow: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  planSummaryText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  // ── Legacy auto ──
  autoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(167,139,250,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
  },
  autoBannerText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  surplusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,211,238,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.12)',
  },
  surplusText: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  surplusWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,189,35,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.12)',
  },
  surplusWarningText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  overSurplusText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
});
