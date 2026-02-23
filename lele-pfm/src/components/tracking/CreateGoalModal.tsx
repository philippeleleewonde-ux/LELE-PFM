import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { X, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GoalIcon, GOAL_CATEGORIES } from '@/constants/goal-categories';
import { useSavingsGoalStore, AllocationMode } from '@/stores/savings-goal-store';
import { GoalIconSelector } from './GoalIconSelector';
import { AmountInput } from './AmountInput';
import { MiniCalendar } from './MiniCalendar';
import { formatCurrency } from '@/services/format-helpers';

const DATE_LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
}

const ALLOCATION_MODE_KEYS: AllocationMode[] = ['manual', 'fixed', 'deadline', 'percent'];

export function CreateGoalModal({ visible, onClose }: CreateGoalModalProps) {
  const { t, i18n } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const dateLocale = DATE_LOCALES[i18n.language] ?? 'fr-FR';
  const addGoal = useSavingsGoalStore((s) => s.addGoal);
  const translateY = useRef(new Animated.Value(height)).current;

  const [icon, setIcon] = useState<GoalIcon | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [deadlineMode, setDeadlineMode] = useState<'none' | 'date'>('none');
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);

  // Allocation states
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('manual');
  const [fixedAmount, setFixedAmount] = useState(0);
  const [percentAmount, setPercentAmount] = useState(20);

  useEffect(() => {
    if (visible) {
      setIcon(null);
      setName('');
      setTargetAmount(0);
      setDeadlineMode('none');
      setDeadlineDate(null);
      setAllocationMode('manual');
      setFixedAmount(0);
      setPercentAmount(20);

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

  // Compute auto-calculated weekly amount for deadline mode
  const deadlineWeeklyEstimate = (() => {
    if (allocationMode !== 'deadline' || !deadlineDate || targetAmount <= 0) return null;
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksToDeadline = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerWeek));
    return Math.ceil(targetAmount / weeksToDeadline);
  })();

  // Validation
  const baseValid = icon !== null && name.trim().length > 0 && targetAmount > 0 &&
    (deadlineMode !== 'date' || deadlineDate !== null);

  const allocationValid = (() => {
    switch (allocationMode) {
      case 'manual': return true;
      case 'fixed': return fixedAmount > 0;
      case 'deadline': return deadlineMode === 'date' && deadlineDate !== null;
      case 'percent': return percentAmount >= 5 && percentAmount <= 80;
      default: return true;
    }
  })();

  const isValid = baseValid && allocationValid;

  const handleSubmit = useCallback(() => {
    if (!isValid || !icon) return;

    const cat = GOAL_CATEGORIES[icon];
    addGoal({
      name: name.trim(),
      targetAmount,
      deadline: deadlineMode === 'date' && deadlineDate
        ? deadlineDate.toISOString()
        : null,
      icon,
      color: cat.color,
      allocation: {
        mode: allocationMode,
        ...(allocationMode === 'fixed' ? { fixedAmount } : {}),
        ...(allocationMode === 'percent' ? { percentAmount } : {}),
      },
    });

    onClose();
  }, [isValid, icon, name, targetAmount, deadlineMode, deadlineDate, addGoal, onClose, allocationMode, fixedAmount, percentAmount]);

  // Auto-switch deadline mode when user selects allocation deadline
  const handleAllocationModeChange = (mode: AllocationMode) => {
    setAllocationMode(mode);
    if (mode === 'deadline' && deadlineMode === 'none') {
      setDeadlineMode('date');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.95 : 0.88), transform: [{ translateY }] }]}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>{t('goals.newGoal')}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isSmall ? 14 : 20 }]}>
            <Text style={styles.sectionLabel}>{t('goals.categoryLabel')}</Text>
            <GoalIconSelector selected={icon} onSelect={setIcon} />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('goals.projectName')}</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder={t('goals.projectPlaceholder')}
              placeholderTextColor="#52525B"
              returnKeyType="done"
            />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('goals.targetAmount')}</Text>
            <AmountInput value={targetAmount} onChange={setTargetAmount} />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('goals.deadline')}</Text>
            <View style={styles.deadlineRow}>
              <Pressable
                onPress={() => setDeadlineMode('none')}
                style={[styles.deadlineBtn, deadlineMode === 'none' && styles.deadlineBtnActive]}
              >
                <Text style={[styles.deadlineBtnText, deadlineMode === 'none' && styles.deadlineBtnTextActive]}>
                  {t('goals.noDeadline')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDeadlineMode('date')}
                style={[styles.deadlineBtn, deadlineMode === 'date' && styles.deadlineBtnActive]}
              >
                <Text style={[styles.deadlineBtnText, deadlineMode === 'date' && styles.deadlineBtnTextActive]}>
                  {t('goals.chooseDate')}
                </Text>
              </Pressable>
            </View>
            {deadlineMode === 'date' && (
              <View>
                <MiniCalendar selected={deadlineDate} onSelect={setDeadlineDate} />
                {deadlineDate && (
                  <Text style={styles.deadlineDateConfirm}>
                    {deadlineDate.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                )}
              </View>
            )}

            {/* ── Allocation automatique ── */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('goals.autoAllocation')}</Text>
            <View style={styles.allocationRow}>
              {ALLOCATION_MODE_KEYS.map((key) => {
                const active = allocationMode === key;
                const disabled = key === 'deadline' && deadlineMode === 'none';
                return (
                  <Pressable
                    key={key}
                    onPress={() => !disabled && handleAllocationModeChange(key)}
                    style={[
                      styles.allocationBtn,
                      active && styles.allocationBtnActive,
                      disabled && styles.allocationBtnDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.allocationBtnText,
                      active && styles.allocationBtnTextActive,
                      disabled && styles.allocationBtnTextDisabled,
                    ]}>
                      {t(`goals.allocationModes.${key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Conditional allocation config */}
            {allocationMode === 'fixed' && (
              <View style={styles.allocationConfig}>
                <Text style={styles.allocationConfigLabel}>{t('goals.amountPerWeek')}</Text>
                <AmountInput value={fixedAmount} onChange={setFixedAmount} />
              </View>
            )}

            {allocationMode === 'deadline' && (
              <View style={styles.allocationConfig}>
                {deadlineWeeklyEstimate !== null ? (
                  <Text style={styles.allocationInfoText}>
                    {t('goals.autoCalculated', { amount: formatCurrency(deadlineWeeklyEstimate) })}
                  </Text>
                ) : (
                  <Text style={styles.allocationInfoTextDim}>
                    {t('goals.chooseDeadlineToActivate')}
                  </Text>
                )}
              </View>
            )}

            {allocationMode === 'percent' && (
              <View style={styles.allocationConfig}>
                <Text style={styles.allocationConfigLabel}>{t('goals.percentOfSurplus')}</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => setPercentAmount(Math.max(5, percentAmount - 5))}
                    style={styles.stepperBtn}
                  >
                    <Minus size={16} color="#A1A1AA" />
                  </Pressable>
                  <Text style={styles.stepperValue}>{percentAmount}%</Text>
                  <Pressable
                    onPress={() => setPercentAmount(Math.min(80, percentAmount + 5))}
                    style={styles.stepperBtn}
                  >
                    <Plus size={16} color="#A1A1AA" />
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          >
            <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
              {t('goals.createGoal')}
            </Text>
          </Pressable>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  deadlineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deadlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineBtnActive: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34,211,238,0.1)',
  },
  deadlineBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  deadlineBtnTextActive: {
    color: '#22D3EE',
  },
  deadlineDateConfirm: {
    color: '#22D3EE',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  // ── Allocation ──
  allocationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  allocationBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  allocationBtnActive: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167,139,250,0.12)',
  },
  allocationBtnDisabled: {
    opacity: 0.35,
  },
  allocationBtnText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  allocationBtnTextActive: {
    color: '#A78BFA',
  },
  allocationBtnTextDisabled: {
    color: '#52525B',
  },
  allocationConfig: {
    marginTop: 10,
    marginBottom: 4,
  },
  allocationConfigLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  allocationInfoText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  allocationInfoTextDim: {
    color: '#52525B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#A78BFA',
    fontSize: 20,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'center',
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
});
