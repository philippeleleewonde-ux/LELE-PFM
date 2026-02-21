import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Minus, Plus } from 'lucide-react-native';
import { useEngineStore } from '@/stores/engine-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { useImpulseStore } from '@/stores/impulse-store';
import { COICOPCode, TransactionType } from '@/types';
import { getWeekNumber, getISOYear, formatDateISO } from '@/utils/week-helpers';
import { CategorySelector } from '@/components/tracking/CategorySelector';
import { ImpulseAnalysis } from '@/hooks/useImpulseCheck';

type SubStep = 'simulation' | 'compensation' | 'confirmation';

const DURATION_PRESETS = [4, 8, 12];
const PERCENT_STEP = 5;

function formatAmount(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

interface ImpactSimulationProps {
  label: string;
  amount: number;
  analysis: ImpulseAnalysis;
  onBack: () => void;
  onClose: () => void;
}

export function ImpactSimulation({ label, amount, analysis, onBack, onClose }: ImpactSimulationProps) {
  const currency = useEngineStore((s) => s.currency) || 'FCFA';
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const setCurrentWeek = useTransactionStore((s) => s.setCurrentWeek);
  const addPurchase = useImpulseStore((s) => s.addPurchase);

  const [subStep, setSubStep] = useState<SubStep>('simulation');
  const [weeks, setWeeks] = useState(8);
  const [customWeeksText, setCustomWeeksText] = useState('');
  const [percents, setPercents] = useState<Record<string, number>>({});
  const [purchaseCategory, setPurchaseCategory] = useState<COICOPCode | null>(null);

  // Only categories with budget > 0 can participate
  const eligibleCategories = useMemo(
    () => analysis.impactByCategory.filter((c) => c.weeklyBudget > 0),
    [analysis.impactByCategory],
  );

  const totalPercent = useMemo(
    () => Object.values(percents).reduce((s, p) => s + p, 0),
    [percents],
  );

  const weeklyCompensation = weeks > 0 ? Math.round(amount / weeks) : 0;
  const isDistributionComplete = totalPercent === 100;

  // Compute the actual weekly reductions from percents (for store & confirmation)
  const reductions = useMemo(() => {
    const result: Record<COICOPCode, number> = {} as Record<COICOPCode, number>;
    for (const [code, pct] of Object.entries(percents)) {
      if (pct > 0) {
        result[code as COICOPCode] = Math.round(weeklyCompensation * pct / 100);
      }
    }
    return result;
  }, [percents, weeklyCompensation]);

  const handlePercentChange = useCallback((code: string, delta: number) => {
    setPercents((prev) => {
      const current = prev[code] ?? 0;
      const newVal = Math.max(0, Math.min(100, current + delta));
      const othersTotal = Object.entries(prev)
        .filter(([k]) => k !== code)
        .reduce((s, [, v]) => s + v, 0);
      // Don't exceed 100% total
      const capped = Math.min(newVal, 100 - othersTotal);
      if (capped <= 0) {
        const next = { ...prev };
        delete next[code];
        return next;
      }
      return { ...prev, [code]: capped };
    });
  }, []);

  const handleDurationSelect = useCallback((w: number) => {
    setWeeks(w);
    setCustomWeeksText('');
  }, []);

  const handleCustomWeeks = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomWeeksText(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0 && num <= 52) {
      setWeeks(num);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!purchaseCategory) return;
    const now = new Date();
    const txWeek = getWeekNumber(now);
    const txYear = getISOYear(now);

    addTransaction({
      profile_id: 'local',
      type: 'Imprévue' as TransactionType,
      category: purchaseCategory,
      label,
      amount,
      payment_method: 'CarteBancaire',
      transaction_date: formatDateISO(now),
      week_number: txWeek,
      year: txYear,
      is_reconciled: false,
      notes: `Anti-impulsif: compense sur ${weeks} semaines`,
    });

    const compensations = Object.entries(reductions)
      .filter(([, v]) => v > 0)
      .map(([code, weeklyReduction]) => ({
        category: code as COICOPCode,
        weeklyReduction,
        totalWeeks: weeks,
        startWeek: txWeek,
        startYear: txYear,
      }));

    addPurchase({
      label,
      amount,
      category: purchaseCategory,
      date: formatDateISO(now),
      week_number: txWeek,
      year: txYear,
      mode: 'control',
      verdict: 'compensated',
      compensations,
    });

    setCurrentWeek(txWeek, txYear);
    onClose();
  }, [purchaseCategory, label, amount, weeks, reductions, addTransaction, addPurchase, setCurrentWeek, onClose]);

  // ── Sub-step B1: Simulation ──
  if (subStep === 'simulation') {
    return (
      <View style={styles.container}>
        <Text style={styles.purchaseLabel} numberOfLines={1}>
          {label} — {formatAmount(amount)} {currency}
        </Text>

        <Text style={styles.heading}>Impact sur ton budget :</Text>
        <Text style={styles.subHeading}>
          "Cet achat equivaut a..."
        </Text>

        {analysis.impactByCategory.map((cat) => {
          const maxBarWidth = 85;
          const maxWeeks = Math.max(...analysis.impactByCategory.map((c) => c.weeksEquivalent), 1);
          const barWidth = Math.min(maxBarWidth, (cat.weeksEquivalent / maxWeeks) * maxBarWidth);
          const Icon = cat.icon;

          return (
            <View key={cat.code} style={styles.impactRow}>
              <View style={styles.impactIconLabel}>
                <Icon size={16} color={cat.color} />
                <Text style={styles.impactLabel} numberOfLines={1}>{cat.label}</Text>
              </View>
              <View style={styles.impactBarContainer}>
                <View style={[styles.impactBar, { width: `${barWidth}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={styles.impactWeeks}>{cat.weeksEquivalent} sem</Text>
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Budget global :</Text>
          <Text style={styles.totalValue}>{analysis.totalWeeksOfBudget} semaines</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ChevronLeft size={16} color="#A1A1AA" />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <Pressable onPress={() => setSubStep('compensation')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Compenser</Text>
            <ChevronRight size={16} color="#0F1014" />
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Sub-step B2: Compensation (percentage-based) ──
  if (subStep === 'compensation') {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Compenser {formatAmount(amount)} {currency}</Text>

        {/* Duration selector */}
        <Text style={styles.sectionLabel}>Sur combien de semaines ?</Text>
        <View style={styles.durationRow}>
          {DURATION_PRESETS.map((w) => (
            <Pressable
              key={w}
              onPress={() => handleDurationSelect(w)}
              style={[styles.durationPill, weeks === w && !customWeeksText && styles.durationPillActive]}
            >
              <Text style={[styles.durationText, weeks === w && !customWeeksText && styles.durationTextActive]}>
                {w}
              </Text>
            </Pressable>
          ))}
          <TextInput
            style={[styles.durationInput, customWeeksText ? styles.durationInputActive : null]}
            value={customWeeksText}
            onChangeText={handleCustomWeeks}
            placeholder="Autre"
            placeholderTextColor="#52525B"
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        {/* Weekly amount info */}
        <View style={styles.weeklyInfoBox}>
          <Text style={styles.weeklyInfoLabel}>Reduction hebdo :</Text>
          <Text style={styles.weeklyInfoValue}>{formatAmount(weeklyCompensation)} {currency}/sem</Text>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
          Repartis les % par categorie :
        </Text>

        {/* Category percentage distribution */}
        {eligibleCategories.map((cat) => {
          const pct = percents[cat.code] ?? 0;
          const catWeeklyReduction = Math.round(weeklyCompensation * pct / 100);
          const maxPct = Math.round(cat.maxReductionPercent);
          const Icon = cat.icon;
          const isOverMax = pct > 0 && catWeeklyReduction > Math.round(cat.weeklyBudget * cat.maxReductionPercent / 100);

          return (
            <View key={cat.code} style={[styles.compRow, pct > 0 && styles.compRowActive]}>
              <View style={styles.compLeft}>
                <Icon size={16} color={cat.color} />
                <View style={styles.compInfo}>
                  <Text style={styles.compLabel} numberOfLines={1}>{cat.label}</Text>
                  <Text style={styles.compBudget}>
                    {formatAmount(cat.weeklyBudget)}/sem
                  </Text>
                </View>
              </View>

              <View style={styles.compRight}>
                {/* Computed weekly FCFA reduction */}
                {pct > 0 && (
                  <Text style={[styles.compAmountResult, isOverMax && { color: '#F87171' }]}>
                    -{formatAmount(catWeeklyReduction)}
                  </Text>
                )}

                {/* -/+ buttons with percent display */}
                <View style={styles.percentControl}>
                  <Pressable
                    onPress={() => handlePercentChange(cat.code, -PERCENT_STEP)}
                    style={[styles.percentBtn, pct <= 0 && styles.percentBtnDisabled]}
                    disabled={pct <= 0}
                  >
                    <Minus size={14} color={pct > 0 ? '#A78BFA' : '#52525B'} />
                  </Pressable>

                  <View style={[styles.percentBadge, pct > 0 && styles.percentBadgeActive]}>
                    <Text style={[styles.percentValue, pct > 0 && styles.percentValueActive]}>
                      {pct}%
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handlePercentChange(cat.code, PERCENT_STEP)}
                    style={[styles.percentBtn, totalPercent >= 100 && pct === (percents[cat.code] ?? 0) && totalPercent >= 100 && styles.percentBtnDisabled]}
                    disabled={totalPercent >= 100 && pct === (percents[cat.code] ?? 0)}
                  >
                    <Plus size={14} color={totalPercent < 100 ? '#A78BFA' : '#52525B'} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {/* Distribution progress (% gauge) */}
        <View style={styles.compProgressContainer}>
          <View style={styles.compProgressTrack}>
            <View
              style={[
                styles.compProgressFill,
                {
                  width: `${Math.min(100, totalPercent)}%`,
                  backgroundColor: isDistributionComplete ? '#4ADE80' : '#A78BFA',
                },
              ]}
            />
          </View>
          <Text style={[styles.compProgressText, isDistributionComplete && { color: '#4ADE80' }]}>
            {isDistributionComplete
              ? `Reparti : 100% — ${formatAmount(weeklyCompensation)} ${currency}/sem`
              : `${totalPercent}% reparti — reste ${100 - totalPercent}%`}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => setSubStep('simulation')} style={styles.backBtn}>
            <ChevronLeft size={16} color="#A1A1AA" />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <Pressable
            onPress={() => setSubStep('confirmation')}
            disabled={!isDistributionComplete}
            style={[styles.primaryBtn, !isDistributionComplete && styles.primaryBtnDisabled]}
          >
            <Text style={[styles.primaryBtnText, !isDistributionComplete && styles.primaryBtnTextDisabled]}>
              Confirmer
            </Text>
            <ChevronRight size={16} color={isDistributionComplete ? '#0F1014' : '#52525B'} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Sub-step B3: Confirmation ──
  const activeReductions = Object.entries(reductions).filter(([, v]) => v > 0);

  return (
    <View style={styles.container}>
      <View style={styles.confirmIcon}>
        <Check size={24} color="#4ADE80" />
      </View>
      <Text style={styles.confirmTitle}>Resume de ta decision</Text>

      <View style={styles.confirmSection}>
        <Text style={styles.confirmLabel}>Achat</Text>
        <Text style={styles.confirmValue}>{label}</Text>
      </View>

      <View style={styles.confirmSection}>
        <Text style={styles.confirmLabel}>Montant</Text>
        <Text style={styles.confirmValue}>{formatAmount(amount)} {currency}</Text>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Imputer sur :</Text>
      <CategorySelector selected={purchaseCategory} onSelect={setPurchaseCategory} />

      <View style={[styles.confirmSection, { marginTop: 16 }]}>
        <Text style={styles.confirmLabel}>Compensations ({weeks} semaines)</Text>
        {activeReductions.map(([code, weeklyAmount]) => {
          const cat = analysis.impactByCategory.find((c) => c.code === code);
          const pct = percents[code] ?? 0;
          return (
            <Text key={code} style={styles.confirmCompLine}>
              {'\u2022'} {cat?.label ?? code} : {pct}% = -{formatAmount(weeklyAmount)}/sem
            </Text>
          );
        })}
        <View style={styles.confirmTotalLine}>
          <Text style={styles.confirmTotalText}>
            Total : -{formatAmount(weeklyCompensation)} {currency}/sem x {weeks} sem = {formatAmount(amount)} {currency}
          </Text>
        </View>
      </View>

      <View style={styles.warningBox}>
        <AlertTriangle size={16} color="#FBBF24" />
        <Text style={styles.warningText}>
          Tes budgets hebdo seront reduits pendant {weeks} semaines.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => setSubStep('compensation')} style={styles.backBtn}>
          <ChevronLeft size={16} color="#A1A1AA" />
          <Text style={styles.backText}>Modifier</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={!purchaseCategory}
          style={[styles.confirmBtn, !purchaseCategory && styles.primaryBtnDisabled]}
        >
          <Text style={[styles.confirmBtnText, !purchaseCategory && styles.primaryBtnTextDisabled]}>
            Valider l'achat
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  purchaseLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subHeading: {
    color: '#71717A',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  // Impact rows (B1)
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  impactIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 110,
  },
  impactLabel: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '600',
  },
  impactBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  impactBar: {
    height: 8,
    borderRadius: 4,
  },
  impactWeeks: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    width: 52,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  totalLabel: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  totalValue: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
  },
  // Duration (B2)
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  durationPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  durationPillActive: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderColor: '#A78BFA',
  },
  durationText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '700',
  },
  durationTextActive: {
    color: '#A78BFA',
  },
  durationInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  durationInputActive: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  // Weekly info box
  weeklyInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  weeklyInfoLabel: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  weeklyInfoValue: {
    color: '#A78BFA',
    fontSize: 15,
    fontWeight: '700',
  },
  // Compensation rows (B2) — percentage-based
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  compRowActive: {
    backgroundColor: 'rgba(167,139,250,0.06)',
    borderColor: 'rgba(167,139,250,0.2)',
  },
  compLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compInfo: {
    flex: 1,
  },
  compLabel: {
    color: '#D4D4D8',
    fontSize: 13,
    fontWeight: '600',
  },
  compBudget: {
    color: '#52525B',
    fontSize: 10,
    marginTop: 1,
  },
  compRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compAmountResult: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '700',
  },
  percentControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBtnDisabled: {
    opacity: 0.4,
  },
  percentBadge: {
    minWidth: 42,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  percentBadgeActive: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderColor: '#A78BFA',
  },
  percentValue: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '800',
  },
  percentValueActive: {
    color: '#A78BFA',
  },
  // Compensation progress
  compProgressContainer: {
    marginTop: 12,
  },
  compProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  compProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  compProgressText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  // Confirmation (B3)
  confirmIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74,222,128,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmSection: {
    marginBottom: 8,
  },
  confirmLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  confirmValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmCompLine: {
    color: '#D4D4D8',
    fontSize: 13,
    marginLeft: 4,
    marginTop: 2,
  },
  confirmTotalLine: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  confirmTotalText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(251,189,35,0.08)',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.2)',
  },
  warningText: {
    color: '#FBBF24',
    fontSize: 13,
    flex: 1,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  backText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#A78BFA',
  },
  primaryBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  primaryBtnText: {
    color: '#0F1014',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtnTextDisabled: {
    color: '#52525B',
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
  },
  confirmBtnText: {
    color: '#0F1014',
    fontSize: 14,
    fontWeight: '800',
  },
});
