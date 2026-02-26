import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { X, Minus, Plus, Shield, Scale, Rocket, Zap, Sliders, AlertTriangle, ArrowLeft, PiggyBank, Wallet, TrendingDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GoalIcon, GOAL_CATEGORIES } from '@/constants/goal-categories';
import { useSavingsGoalStore, AllocationMode } from '@/stores/savings-goal-store';
import { usePerformanceStore } from '@/stores/performance-store';
import { useWeeklyTracking } from '@/hooks/useWeeklyTracking';
import { useWeeklyAllocation } from '@/hooks/useWeeklyAllocation';
import { GoalIconSelector } from './GoalIconSelector';
import { AmountInput } from './AmountInput';
import { MiniCalendar } from './MiniCalendar';
import { formatCurrency } from '@/services/format-helpers';
import { getCurrentWeek } from '@/utils/week-helpers';
import {
  generateScenarios,
  buildPlanFromScenario,
  SCENARIO_COLORS,
  type ScenarioResult,
  type ScenarioId,
} from '@/domain/calculators/savings-scenario-engine';

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

const LEGACY_ALLOCATION_MODE_KEYS: AllocationMode[] = ['manual', 'fixed', 'deadline', 'percent'];

const SCENARIO_ICONS: Record<ScenarioId, React.ComponentType<any>> = {
  prudent: Shield,
  equilibre: Scale,
  ambitieux: Rocket,
  accelere: Zap,
  custom: Sliders,
};

const RISK_KEYS: Record<string, string> = {
  low: 'scenarios.riskLow',
  medium: 'scenarios.riskMedium',
  high: 'scenarios.riskHigh',
  very_high: 'scenarios.riskVeryHigh',
};

export function CreateGoalModal({ visible, onClose }: CreateGoalModalProps) {
  const { t, i18n } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const dateLocale = DATE_LOCALES[i18n.language] ?? 'fr-FR';
  const addGoal = useSavingsGoalStore((s) => s.addGoal);
  const setPlan = useSavingsGoalStore((s) => s.setPlan);
  const records = usePerformanceStore((s) => s.records);
  const { week: curWeek, year: curYear } = getCurrentWeek();
  const weeklyTracking = useWeeklyTracking(curWeek, curYear);
  const currentAllocation = useWeeklyAllocation(curWeek, curYear, weeklyTracking.savings);
  const translateY = useRef(new Animated.Value(height)).current;

  const [icon, setIcon] = useState<GoalIcon | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [deadlineMode, setDeadlineMode] = useState<'none' | 'date'>('none');
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);

  // Allocation mode: 'scenarios' (new default) or 'classic' (legacy)
  const [allocationView, setAllocationView] = useState<'scenarios' | 'classic'>('scenarios');

  // Classic allocation states
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('manual');
  const [fixedAmount, setFixedAmount] = useState(0);
  const [percentAmount, setPercentAmount] = useState(20);

  // Scenario states
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null);
  const [customWeeklyAmount, setCustomWeeklyAmount] = useState(0);

  useEffect(() => {
    if (visible) {
      setIcon(null);
      setName('');
      setTargetAmount(0);
      setDeadlineMode('none');
      setDeadlineDate(null);
      setAllocationView('scenarios');
      setAllocationMode('manual');
      setFixedAmount(0);
      setPercentAmount(20);
      setSelectedScenario(null);
      setCustomWeeklyAmount(0);

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

  // Generate scenarios from historical surplus
  const scenarioOutput = useMemo(() => {
    if (targetAmount <= 0) return null;

    const historicalSurplus = records
      .filter((r) => (r.surplus ?? 0) > 0)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.week_number - a.week_number;
      })
      .slice(0, 12) // Last 12 weeks max
      .map((r) => r.surplus ?? 0);

    const totalContributed = 0; // New goal, nothing contributed yet
    const { week, year } = getCurrentWeek();

    return generateScenarios({
      remainingAmount: targetAmount,
      historicalSurplus,
      currentWeek: week,
      currentYear: year,
      customWeeklyAmount: customWeeklyAmount > 0 ? customWeeklyAmount : undefined,
    });
  }, [targetAmount, records, customWeeklyAmount]);

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
    if (allocationView === 'scenarios') {
      return selectedScenario !== null;
    }
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

    if (allocationView === 'scenarios' && selectedScenario && scenarioOutput) {
      const scenario = scenarioOutput.scenarios.find((s) => s.id === selectedScenario);
      if (!scenario) return;

      const { week, year } = getCurrentWeek();
      const plan = buildPlanFromScenario(scenario, targetAmount, week, year);

      // Create goal with plan allocation mode — deadline comes from scenario
      addGoal({
        name: name.trim(),
        targetAmount,
        deadline: scenario.estimatedEndDate
          ? new Date(scenario.estimatedEndDate + 'T00:00:00').toISOString()
          : null,
        icon,
        color: cat.color,
        allocation: { mode: 'plan' },
        plan,
      });
    } else {
      // Classic mode
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
        plan: null,
      });
    }

    onClose();
  }, [isValid, icon, name, targetAmount, deadlineMode, deadlineDate, addGoal, onClose, allocationView, selectedScenario, scenarioOutput, allocationMode, fixedAmount, percentAmount]);

  // Auto-switch deadline mode when user selects allocation deadline
  const handleAllocationModeChange = (mode: AllocationMode) => {
    setAllocationMode(mode);
    if (mode === 'deadline' && deadlineMode === 'none') {
      setDeadlineMode('date');
    }
  };

  const renderScenarioCard = (scenario: ScenarioResult) => {
    const isSelected = selectedScenario === scenario.id;
    const color = SCENARIO_COLORS[scenario.id];
    const IconComp = SCENARIO_ICONS[scenario.id];
    const isCustom = scenario.id === 'custom';

    // Budget impact simulation
    const weeklyAmount = isCustom ? customWeeklyAmount : scenario.weeklyAmount;
    const currentEconomies = currentAllocation.economies;
    const currentSurplus = currentAllocation.surplus;
    const impactSurplusAfter = Math.max(0, currentEconomies - weeklyAmount - currentAllocation.eprProvision);
    const impactEpargne = Math.round(impactSurplusAfter * 0.67);
    const impactLiberte = Math.round(impactSurplusAfter * 0.33);

    return (
      <Pressable
        key={scenario.id}
        onPress={() => setSelectedScenario(scenario.id)}
        style={[
          styles.scenarioCard,
          isSelected && { borderColor: color, backgroundColor: color + '12' },
        ]}
      >
        <View style={styles.scenarioHeader}>
          <IconComp size={16} color={color} />
          <Text style={[styles.scenarioName, { color: isSelected ? color : '#E4E4E7' }]}>
            {t(scenario.labelKey)}
          </Text>
          {!isCustom && (
            <Text style={styles.scenarioRef}>{t(scenario.referenceKey)}</Text>
          )}
        </View>

        {isCustom ? (
          <View style={styles.customInputRow}>
            <AmountInput value={customWeeklyAmount} onChange={setCustomWeeklyAmount} />
            {scenario.estimatedEndDate && customWeeklyAmount > 0 && (
              <Text style={styles.scenarioEndDate}>
                {t('scenarios.estimatedEndDate')} : {new Date(scenario.estimatedEndDate + 'T00:00:00').toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>
        ) : (
          <>
            <Text style={[styles.scenarioAmount, { color }]}>
              {formatCurrency(scenario.weeklyAmount)}{t('scenarios.perWeek')}
              <Text style={styles.scenarioDuration}>
                {'  '}{t('scenarios.estimatedDuration', { weeks: scenario.estimatedWeeks })}
              </Text>
            </Text>

            {/* Estimated end date */}
            {scenario.estimatedEndDate && (
              <Text style={styles.scenarioEndDate}>
                {t('scenarios.estimatedEndDate')} : {new Date(scenario.estimatedEndDate + 'T00:00:00').toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            )}

            {/* Feasibility bar */}
            <View style={styles.feasibilityRow}>
              <View style={styles.feasibilityBarBg}>
                <View
                  style={[
                    styles.feasibilityBarFill,
                    {
                      width: `${scenario.feasibilityScore}%`,
                      backgroundColor: scenario.feasibilityScore >= 70 ? '#4ADE80'
                        : scenario.feasibilityScore >= 40 ? '#FBBF24'
                        : '#F87171',
                    },
                  ]}
                />
              </View>
              <Text style={styles.feasibilityText}>
                {t('scenarios.feasibility')}: {scenario.feasibilityScore}
              </Text>
            </View>

            <Text style={styles.scenarioRisk}>
              {t('scenarios.risk')}: {t(RISK_KEYS[scenario.riskLevel])}
            </Text>
          </>
        )}

        {/* Budget impact preview */}
        {weeklyAmount > 0 && currentEconomies > 0 && (
          <View style={styles.impactSection}>
            <Text style={styles.impactTitle}>{t('scenarios.weeklyImpact')}</Text>
            <View style={styles.impactRow}>
              <View style={styles.impactItem}>
                <TrendingDown size={10} color={color} />
                <Text style={styles.impactLabel}>{t('scenarios.planDeduction')}</Text>
                <Text style={[styles.impactValue, { color }]}>-{formatCurrency(Math.min(weeklyAmount, currentEconomies))}</Text>
              </View>
              <View style={styles.impactItem}>
                <PiggyBank size={10} color="#4ADE80" />
                <Text style={styles.impactLabel}>{t('summary.savingsPocket')}</Text>
                <Text style={[styles.impactValue, { color: '#4ADE80' }]}>{formatCurrency(impactEpargne)}</Text>
              </View>
              <View style={styles.impactItem}>
                <Wallet size={10} color="#A78BFA" />
                <Text style={styles.impactLabel}>{t('summary.freedomPocket')}</Text>
                <Text style={[styles.impactValue, { color: '#A78BFA' }]}>{formatCurrency(impactLiberte)}</Text>
              </View>
            </View>
            {weeklyAmount > currentEconomies && (
              <Text style={styles.impactWarning}>
                {t('scenarios.exceedsEconomies')}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    );
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

            {allocationView !== 'scenarios' && (
              <>
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
              </>
            )}

            {/* ── Allocation section ── */}
            {allocationView === 'scenarios' ? (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('scenarios.title')}</Text>

                {/* Beginner notice */}
                {scenarioOutput && !scenarioOutput.hasEnoughData && (
                  <View style={styles.beginnerBanner}>
                    <AlertTriangle size={12} color="#FBBF24" />
                    <Text style={styles.beginnerBannerText}>{t('scenarios.beginnerNotice')}</Text>
                  </View>
                )}

                {/* Scenario cards */}
                {targetAmount > 0 && scenarioOutput ? (
                  <>
                    {scenarioOutput.scenarios.map(renderScenarioCard)}

                    {/* Surplus stats */}
                    {scenarioOutput.hasEnoughData && (
                      <View style={styles.statsRow}>
                        <Text style={styles.statsText}>
                          {t('scenarios.surplusMean')}: {formatCurrency(scenarioOutput.surplusStats.mean)}
                        </Text>
                        <Text style={styles.statsText}>
                          {t('scenarios.cvLabel')}: {scenarioOutput.surplusStats.cv.toFixed(2)}
                        </Text>
                        <Text style={styles.statsText}>
                          {t('scenarios.stability')}: {t(`scenarios.${scenarioOutput.surplusStats.stability}`)}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.scenarioHint}>
                    {t('goals.targetAmount')}...
                  </Text>
                )}

                {/* Classic mode link */}
                <Pressable
                  onPress={() => { setAllocationView('classic'); setSelectedScenario(null); }}
                  style={styles.classicModeLink}
                >
                  <Text style={styles.classicModeLinkText}>{t('scenarios.classicMode')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Classic allocation (legacy) */}
                <View style={styles.classicHeader}>
                  <Pressable
                    onPress={() => { setAllocationView('scenarios'); setAllocationMode('manual'); }}
                    style={styles.backToScenarios}
                  >
                    <ArrowLeft size={14} color="#22D3EE" />
                    <Text style={styles.backToScenariosText}>{t('scenarios.title')}</Text>
                  </Pressable>
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>{t('goals.autoAllocation')}</Text>
                <View style={styles.allocationRow}>
                  {LEGACY_ALLOCATION_MODE_KEYS.map((key) => {
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
              </>
            )}
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          >
            <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
              {allocationView === 'scenarios' && selectedScenario
                ? t('scenarios.validatePlan')
                : t('goals.createGoal')}
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
  // ── Scenario cards ──
  scenarioCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  scenarioName: {
    fontSize: 14,
    fontWeight: '700',
  },
  scenarioRef: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  scenarioAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  scenarioDuration: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '500',
  },
  feasibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  feasibilityBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  feasibilityBarFill: {
    height: 4,
    borderRadius: 2,
  },
  feasibilityText: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  scenarioEndDate: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  scenarioRisk: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '600',
  },
  // ── Budget impact ──
  impactSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  impactTitle: {
    color: '#52525B',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  impactItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  impactLabel: {
    color: '#3F3F46',
    fontSize: 8,
    fontWeight: '600',
  },
  impactValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  impactWarning: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  customInputRow: {
    marginTop: 4,
  },
  scenarioHint: {
    color: '#52525B',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  statsText: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '600',
  },
  beginnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,189,35,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.12)',
  },
  beginnerBannerText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  classicModeLink: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  classicModeLinkText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  classicHeader: {
    marginTop: 16,
  },
  backToScenarios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backToScenariosText: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '600',
  },
  // ── Classic allocation ──
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
