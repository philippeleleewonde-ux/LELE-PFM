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
import { X, PartyPopper, Info } from 'lucide-react-native';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { formatCurrency } from '@/services/format-helpers';
import { AmountInput } from './AmountInput';
import { useWeeklyAllocation } from '@/hooks/useWeeklyAllocation';
import { useWeeklyTracking } from '@/hooks/useWeeklyTracking';
import { getCurrentWeek } from '@/utils/week-helpers';

interface ContributeGoalModalProps {
  visible: boolean;
  goalId: string | null;
  goalName: string;
  remaining: number;
  onClose: () => void;
}

export function ContributeGoalModal({ visible, goalId, goalName, remaining, onClose }: ContributeGoalModalProps) {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const addContribution = useSavingsGoalStore((s) => s.addContribution);
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
  const isValid = amount > 0 && label.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!isValid || !goalId) return;

    addContribution(goalId, amount, label.trim());

    if (amount >= remaining) {
      setShowCongrats(true);
      setTimeout(() => {
        setShowCongrats(false);
        onClose();
      }, 2000);
    } else {
      onClose();
    }
  }, [isValid, goalId, amount, label, remaining, addContribution, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handleBar} />

          {showCongrats ? (
            <View style={styles.congratsContainer}>
              <PartyPopper size={48} color="#FBBF24" />
              <Text style={styles.congratsTitle}>Objectif atteint !</Text>
              <Text style={styles.congratsText}>{goalName}</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.title}>Contribuer</Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {goalName} — Reste {formatCurrency(Math.max(0, remaining))}
                  </Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#A1A1AA" />
                </Pressable>
              </View>

              <View style={[styles.body, { paddingHorizontal: isSmall ? 14 : 20 }]}>
                {/* Surplus info */}
                {availableSurplus > 0 && (
                  <View style={styles.surplusInfo}>
                    <Info size={12} color="#22D3EE" />
                    <Text style={styles.surplusText}>
                      Surplus disponible : {formatCurrency(availableSurplus)}
                    </Text>
                  </View>
                )}
                {availableSurplus <= 0 && tracking.savings.economies > 0 && (
                  <View style={styles.surplusWarning}>
                    <Info size={12} color="#FBBF24" />
                    <Text style={styles.surplusWarningText}>
                      Pas de surplus disponible cette semaine
                    </Text>
                  </View>
                )}

                <Text style={styles.sectionLabel}>Montant</Text>
                <AmountInput value={amount} onChange={setAmount} />

                {/* Over-surplus warning */}
                {isOverSurplus && (
                  <Text style={styles.overSurplusText}>
                    Depasse le surplus disponible ({formatCurrency(availableSurplus)})
                  </Text>
                )}

                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Ex: Salaire Mars, Bonus..."
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
                  Contribuer
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
