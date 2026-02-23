import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useWizardStore, FinancialHistoryEntry } from '@/stores/wizard-store';
import { WZ, GlassCard, TipBox, FadeInView, neonGlow } from '../shared';

// ─── Engagement Levels ───

interface EngagementOption {
  key: string;
  icon: string;
}

const ENGAGEMENT_LEVELS: EngagementOption[] = [
  { key: 'beginner', icon: '🌱' },
  { key: 'curious', icon: '🔍' },
  { key: 'active', icon: '📊' },
  { key: 'expert', icon: '🏆' },
];

// ─── Step3History Component ───

interface Step3HistoryProps {
  isActive: boolean;
}

export default function Step3History({ isActive }: Step3HistoryProps) {
  const { t } = useTranslation('wizard');
  const { formData, updateFormData } = useWizardStore();

  // ─── Auto-fill from Step 2 income/expenses ───
  const autoFilledValuesRef = useRef<{ income: number; expenses: number } | null>(null);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Compute annual totals from Step 2 data (handles backward-compat raw numbers)
    const totalAnnualIncome = Object.values(formData.incomes).reduce(
      (sum, entry: any) => {
        if (typeof entry === 'number') return sum + entry * 12;
        const amt = entry?.amount ?? 0;
        const annual = entry?.frequency === 'annual' ? amt : amt * 12;
        return sum + (isNaN(annual) ? 0 : annual);
      },
      0
    );

    const totalAnnualExpenses = Object.values(formData.expenses).reduce(
      (sum, entry: any) => {
        if (typeof entry === 'number') return sum + entry * 12;
        const amt = entry?.amount ?? 0;
        const annual = entry?.frequency === 'annual' ? amt : amt * 12;
        return sum + (isNaN(annual) ? 0 : annual);
      },
      0
    );

    // Nothing to auto-fill
    if (totalAnnualIncome === 0 && totalAnnualExpenses === 0) return;

    const roundedIncome = Math.round(totalAnnualIncome);
    const roundedExpenses = Math.round(totalAnnualExpenses);

    // Check if history is untouched (all zeros) or still matches previous auto-fill
    const allZero = formData.history.every((h) => h.income === 0 && h.expenses === 0);
    const prev = autoFilledValuesRef.current;
    const stillAutoFilled = prev && formData.history.every(
      (h) => h.income === prev.income && h.expenses === prev.expenses
    );

    if (!allZero && !stillAutoFilled) return; // User manually edited — don't overwrite

    // Skip if values haven't changed since last auto-fill
    if (prev && prev.income === roundedIncome && prev.expenses === roundedExpenses) return;

    // Pre-fill all 5 years with the computed annual values
    const updatedHistory = formData.history.map((h) => ({
      ...h,
      income: roundedIncome,
      expenses: roundedExpenses,
    }));

    updateFormData({ history: updatedHistory });
    autoFilledValuesRef.current = { income: roundedIncome, expenses: roundedExpenses };
    setWasAutoFilled(true);
  }, [isActive, formData.incomes, formData.expenses, formData.history, updateFormData]);

  // ─── Trend analysis (real-time) ───
  const trendAnalysis = useMemo(() => {
    const hist = formData.history;
    const filledEntries = hist.filter((h) => h.income > 0 || h.expenses > 0);
    if (filledEntries.length < 2) return null;

    // Average revenue growth rate
    const revGrowths: number[] = [];
    const expGrowths: number[] = [];
    const ratios: number[] = [];

    for (let i = 0; i < hist.length - 1; i++) {
      if (hist[i].income > 0 && hist[i + 1].income > 0) {
        revGrowths.push(((hist[i + 1].income - hist[i].income) / hist[i].income) * 100);
      }
      if (hist[i].expenses > 0 && hist[i + 1].expenses > 0) {
        expGrowths.push(((hist[i + 1].expenses - hist[i].expenses) / hist[i].expenses) * 100);
      }
    }

    for (const h of hist) {
      if (h.income > 0) {
        ratios.push((h.expenses / h.income) * 100);
      }
    }

    const avgRevGrowth = revGrowths.length > 0
      ? revGrowths.reduce((a, b) => a + b, 0) / revGrowths.length : 0;
    const avgExpGrowth = expGrowths.length > 0
      ? expGrowths.reduce((a, b) => a + b, 0) / expGrowths.length : 0;
    const coherenceRatio = ratios.length > 0
      ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;

    return { avgRevGrowth, avgExpGrowth, coherenceRatio };
  }, [formData.history]);

  const updateHistoryField = useCallback(
    (index: number, field: 'income' | 'expenses', value: string) => {
      const numValue = value === '' ? 0 : parseFloat(value) || 0;
      const updatedHistory = formData.history.map(
        (entry: FinancialHistoryEntry, i: number) =>
          i === index ? { ...entry, [field]: numValue } : entry
      );
      updateFormData({ history: updatedHistory });
    },
    [formData.history, updateFormData]
  );

  const selectEngagement = useCallback(
    (level: string) => {
      updateFormData({ engagementLevel: level });
    },
    [updateFormData]
  );

  const getDisplayValue = (val: number): string => {
    return val === 0 ? '' : String(val);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ─── Financial History Section ─── */}
      <FadeInView active={isActive} delay={0}>
        <Text style={styles.sectionTitle}>{t('step3.title')}</Text>
        <Text style={styles.sectionSubtitle}>
          {t('step3.subtitle')}
        </Text>
      </FadeInView>

      {wasAutoFilled && (
        <FadeInView active={isActive} delay={50}>
          <View style={styles.autoFillBanner}>
            <Text style={styles.autoFillIcon}>📋</Text>
            <Text style={styles.autoFillText}>
              {t('step3.autoFillBanner')}
            </Text>
          </View>
        </FadeInView>
      )}

      <FadeInView active={isActive} delay={150}>
        <GlassCard style={styles.historyCard}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerLabel, styles.yearHeader]}>{t('step3.yearHeader')}</Text>
            <Text style={[styles.headerLabel, styles.fieldHeader]}>{t('step3.incomeHeader')}</Text>
            <Text style={[styles.headerLabel, styles.fieldHeader]}>{t('step3.expensesHeader')}</Text>
          </View>

          {/* Year rows */}
          {formData.history.map((entry: FinancialHistoryEntry, index: number) => (
            <View key={entry.year} style={styles.yearRow}>
              <View style={styles.yearLabelContainer}>
                <Text style={styles.yearLabel}>{entry.year}</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={WZ.textMuted}
                  value={getDisplayValue(entry.income)}
                  onChangeText={(text) => updateHistoryField(index, 'income', text)}
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={WZ.textMuted}
                  value={getDisplayValue(entry.expenses)}
                  onChangeText={(text) => updateHistoryField(index, 'expenses', text)}
                />
              </View>
            </View>
          ))}
        </GlassCard>
      </FadeInView>

      {/* ─── Trend Analysis Block ─── */}
      {trendAnalysis && (
        <FadeInView active={isActive} delay={250}>
          <GlassCard style={styles.trendCard}>
            <Text style={styles.trendTitle}>{t('step3.trendTitle')}</Text>
            <View style={styles.trendGrid}>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>{t('step3.revenueGrowth')}</Text>
                <Text style={[
                  styles.trendValue,
                  { color: trendAnalysis.avgRevGrowth >= 0 ? WZ.green : '#EF4444' },
                ]}>
                  {trendAnalysis.avgRevGrowth >= 0 ? '+' : ''}{trendAnalysis.avgRevGrowth.toFixed(1)}%/an
                </Text>
              </View>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>{t('step3.expenseGrowth')}</Text>
                <Text style={[
                  styles.trendValue,
                  { color: trendAnalysis.avgExpGrowth <= 0 ? WZ.green : WZ.orange },
                ]}>
                  {trendAnalysis.avgExpGrowth >= 0 ? '+' : ''}{trendAnalysis.avgExpGrowth.toFixed(1)}%/an
                </Text>
              </View>
              <View style={styles.trendItemFull}>
                <Text style={styles.trendLabel}>{t('step3.expenseToIncomeRatio')}</Text>
                <View style={styles.trendRatioRow}>
                  <Text style={[
                    styles.trendRatioValue,
                    {
                      color: trendAnalysis.coherenceRatio < 85
                        ? WZ.green
                        : trendAnalysis.coherenceRatio <= 100
                          ? WZ.orange
                          : '#EF4444',
                    },
                  ]}>
                    {trendAnalysis.coherenceRatio.toFixed(1)}%
                  </Text>
                  <View style={[
                    styles.trendIndicator,
                    {
                      backgroundColor: trendAnalysis.coherenceRatio < 85
                        ? 'rgba(34,197,94,0.2)'
                        : trendAnalysis.coherenceRatio <= 100
                          ? 'rgba(249,115,22,0.2)'
                          : 'rgba(239,68,68,0.2)',
                    },
                  ]}>
                    <Text style={[
                      styles.trendIndicatorText,
                      {
                        color: trendAnalysis.coherenceRatio < 85
                          ? WZ.green
                          : trendAnalysis.coherenceRatio <= 100
                            ? WZ.orange
                            : '#EF4444',
                      },
                    ]}>
                      {trendAnalysis.coherenceRatio < 85
                        ? t('step3.healthy')
                        : trendAnalysis.coherenceRatio <= 100
                          ? t('step3.caution')
                          : t('step3.critical')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>
        </FadeInView>
      )}

      <FadeInView active={isActive} delay={300}>
        <TipBox
          text={t('step3.tip')}
          style={styles.tipBox}
        />
      </FadeInView>

      {/* ─── Engagement Level Section ─── */}
      <FadeInView active={isActive} delay={400}>
        <Text style={[styles.sectionTitle, styles.engagementTitle]}>
          {t('step3.engagementTitle')}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {t('step3.engagementSubtitle')}
        </Text>
      </FadeInView>

      <FadeInView active={isActive} delay={500}>
        <View style={styles.engagementGrid}>
          {ENGAGEMENT_LEVELS.map((level) => {
            const isSelected = formData.engagementLevel === level.key;
            return (
              <Pressable
                key={level.key}
                onPress={() => selectEngagement(level.key)}
                style={({ pressed }) => [
                  styles.engagementCard,
                  isSelected && styles.engagementCardSelected,
                  pressed && styles.engagementCardPressed,
                ]}
              >
                <Text style={styles.engagementIcon}>{level.icon}</Text>
                <Text
                  style={[
                    styles.engagementLabel,
                    isSelected && styles.engagementLabelSelected,
                  ]}
                >
                  {t('step3.engagementLevels.' + level.key)}
                </Text>
                <Text
                  style={[
                    styles.engagementDesc,
                    isSelected && styles.engagementDescSelected,
                  ]}
                >
                  {t('step3.engagementLevels.' + level.key + 'Desc')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FadeInView>

      {/* Bottom spacer for scroll padding */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Section headers
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: WZ.textPrimary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: WZ.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },

  // Auto-fill banner
  autoFillBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  autoFillIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  autoFillText: {
    fontSize: 13,
    color: '#93C5FD',
    lineHeight: 19,
    flex: 1,
  },

  // History card
  historyCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: WZ.cardBorder,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: WZ.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearHeader: {
    width: 60,
  },
  fieldHeader: {
    flex: 1,
    textAlign: 'center',
  },

  // Year rows
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  yearLabelContainer: {
    width: 60,
    justifyContent: 'center',
  },
  yearLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: WZ.accent,
    ...neonGlow(WZ.accent),
  },
  inputContainer: {
    flex: 1,
  },
  numericInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: WZ.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: WZ.textPrimary,
    textAlign: 'center',
  },

  // Tip box
  tipBox: {
    marginTop: 16,
  },

  // Trend analysis
  trendCard: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: WZ.accent,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trendItem: {
    flex: 1,
    minWidth: '45%' as any,
    gap: 4,
  },
  trendItemFull: {
    width: '100%',
    gap: 4,
    marginTop: 4,
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: WZ.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  trendRatioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendRatioValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  trendIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Engagement section
  engagementTitle: {
    marginTop: 32,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  engagementCard: {
    width: '47%' as any,
    flexGrow: 1,
    flexBasis: '45%' as any,
    backgroundColor: WZ.cardBg,
    borderWidth: 1.5,
    borderColor: WZ.cardBorder,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  engagementCardSelected: {
    borderColor: WZ.accent,
    backgroundColor: 'rgba(251,189,35,0.08)',
  },
  engagementCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  engagementIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  engagementLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: WZ.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  engagementLabelSelected: {
    color: WZ.accent,
    ...neonGlow(WZ.accent),
  },
  engagementDesc: {
    fontSize: 12,
    color: WZ.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  engagementDescSelected: {
    color: WZ.accentMid,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 20,
  },
});
