import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useWizardStore, IncomeEntry, ExpenseEntry } from '@/stores/wizard-store';
import { WZ, GlassCard, TipBox, FadeInView, neonGlow } from '../shared';

// ─── Income sources with financial metadata ───
// Parallèle HCM : comme les business lines avec type, fréquence, probabilité, croissance
const INCOME_SOURCES = [
  { key: 'salaire', labelKey: 'incomeSource.salaire', icon: '💼', type: 'Fixe' as const, defaultFrequency: 'monthly' as const, defaultProbability: 98, defaultGrowth: 2.5 },
  { key: 'primes', labelKey: 'incomeSource.primes', icon: '🎯', type: 'Variable' as const, defaultFrequency: 'annual' as const, defaultProbability: 70, defaultGrowth: 0 },
  { key: 'locatifs', labelKey: 'incomeSource.locatifs', icon: '🏠', type: 'Fixe' as const, defaultFrequency: 'monthly' as const, defaultProbability: 90, defaultGrowth: 1.7 },
  { key: 'aides', labelKey: 'incomeSource.aides', icon: '🤝', type: 'Fixe' as const, defaultFrequency: 'monthly' as const, defaultProbability: 85, defaultGrowth: 1.0 },
  { key: 'freelance', labelKey: 'incomeSource.freelance', icon: '💻', type: 'Variable' as const, defaultFrequency: 'monthly' as const, defaultProbability: 65, defaultGrowth: 0 },
  { key: 'dividendes', labelKey: 'incomeSource.dividendes', icon: '📈', type: 'Variable' as const, defaultFrequency: 'annual' as const, defaultProbability: 80, defaultGrowth: 3.0 },
  { key: 'pension', labelKey: 'incomeSource.pension', icon: '⚖️', type: 'Fixe' as const, defaultFrequency: 'monthly' as const, defaultProbability: 95, defaultGrowth: 1.0 },
  { key: 'autres_revenus', labelKey: 'incomeSource.autres_revenus', icon: '📦', type: 'Variable' as const, defaultFrequency: 'monthly' as const, defaultProbability: 50, defaultGrowth: 0 },
] as const;

// ─── Certainty levels (chips) ───
const CERTAINTY_LEVELS = [
  { key: 'garanti', labelKey: 'certainty.garanti', probability: 95, color: WZ.green },
  { key: 'probable', labelKey: 'certainty.probable', probability: 70, color: WZ.orange },
  { key: 'incertain', labelKey: 'certainty.incertain', probability: 40, color: '#EF4444' },
] as const;

function getCertaintyKey(probability: number): string {
  if (probability >= 90) return 'garanti';
  if (probability >= 60) return 'probable';
  return 'incertain';
}

// ─── 8 catégories COICOP recalibrées avec defaults ───
const EXPENSE_CATEGORIES = [
  { key: 'logement',     labelKey: 'expenseCategory.logement',     icon: '🏡', coicop: '04', defaultType: 'Fixe' as const,     defaultNature: 'Essentielle' as const,      defaultElasticity: 10 },
  { key: 'alimentation', labelKey: 'expenseCategory.alimentation', icon: '🛒', coicop: '01', defaultType: 'Variable' as const, defaultNature: 'Essentielle' as const,      defaultElasticity: 25 },
  { key: 'transport',    labelKey: 'expenseCategory.transport',    icon: '🚗', coicop: '07', defaultType: 'Variable' as const, defaultNature: 'Essentielle' as const,      defaultElasticity: 35 },
  { key: 'sante',        labelKey: 'expenseCategory.sante',        icon: '🏥', coicop: '06', defaultType: 'Variable' as const, defaultNature: 'Essentielle' as const,      defaultElasticity: 15 },
  { key: 'telecom',      labelKey: 'expenseCategory.telecom',      icon: '📱', coicop: '08', defaultType: 'Fixe' as const,     defaultNature: 'Discrétionnaire' as const,  defaultElasticity: 45 },
  { key: 'education',    labelKey: 'expenseCategory.education',    icon: '📚', coicop: '10', defaultType: 'Fixe' as const,     defaultNature: 'Essentielle' as const,      defaultElasticity: 10 },
  { key: 'loisirs',      labelKey: 'expenseCategory.loisirs',      icon: '🎭', coicop: '09', defaultType: 'Variable' as const, defaultNature: 'Discrétionnaire' as const,  defaultElasticity: 65 },
  { key: 'habillement',  labelKey: 'expenseCategory.habillement',  icon: '👔', coicop: '03', defaultType: 'Variable' as const, defaultNature: 'Discrétionnaire' as const,  defaultElasticity: 70 },
] as const;

interface Step2FlowsProps {
  isActive: boolean;
}

export default function Step2Flows({ isActive }: Step2FlowsProps) {
  const { t } = useTranslation('wizard');
  const { formData, updateFormData } = useWizardStore();
  const { incomes, expenses } = formData;
  const currency = formData.currency || 'FCFA';

  // ─── Income handlers ───
  const getIncomeEntry = useCallback(
    (key: string): IncomeEntry => {
      const source = INCOME_SOURCES.find((s) => s.key === key)!;
      return (
        incomes[key] || {
          amount: 0,
          frequency: source.defaultFrequency,
          probability: source.defaultProbability,
          growthRate: source.defaultGrowth,
          type: source.type,
        }
      );
    },
    [incomes],
  );

  const updateIncome = useCallback(
    (key: string, updates: Partial<IncomeEntry>) => {
      const current = getIncomeEntry(key);
      updateFormData({
        incomes: { ...incomes, [key]: { ...current, ...updates } },
      });
    },
    [incomes, getIncomeEntry, updateFormData],
  );

  const handleAmountChange = useCallback(
    (key: string, value: string) => {
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      updateIncome(key, { amount: numericValue });
    },
    [updateIncome],
  );

  // ─── Expense handlers (enrichi ExpenseEntry) ───
  const getExpenseEntry = useCallback(
    (key: string): ExpenseEntry => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.key === key)!;
      return (
        expenses[key] || {
          amount: 0,
          frequency: 'monthly',
          type: cat.defaultType,
          nature: cat.defaultNature,
          elasticity: cat.defaultElasticity,
        }
      );
    },
    [expenses],
  );

  const updateExpense = useCallback(
    (key: string, updates: Partial<ExpenseEntry>) => {
      const current = getExpenseEntry(key);
      updateFormData({
        expenses: { ...expenses, [key]: { ...current, ...updates } },
      });
    },
    [expenses, getExpenseEntry, updateFormData],
  );

  const handleExpenseChange = useCallback(
    (key: string, value: string) => {
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      updateExpense(key, { amount: numericValue });
    },
    [updateExpense],
  );

  // ─── Totals (monthly equivalent) ───
  const { totalFixed, totalVariable, totalIncomes } = useMemo(() => {
    let fixed = 0;
    let variable = 0;
    for (const source of INCOME_SOURCES) {
      const entry = incomes[source.key];
      if (!entry || entry.amount <= 0) continue;
      const monthly = entry.frequency === 'annual' ? entry.amount / 12 : entry.amount;
      if (entry.type === 'Fixe') {
        fixed += monthly;
      } else {
        variable += monthly;
      }
    }
    return { totalFixed: fixed, totalVariable: variable, totalIncomes: fixed + variable };
  }, [incomes]);

  const { totalExpenses, totalEssentielles, totalDiscretionnaires } = useMemo(() => {
    let total = 0;
    let essentielles = 0;
    let discretionnaires = 0;
    for (const cat of EXPENSE_CATEGORIES) {
      const entry = expenses[cat.key];
      if (!entry || typeof entry === 'number') {
        const val = typeof entry === 'number' ? entry : 0;
        total += val;
        continue;
      }
      const monthly = entry.frequency === 'annual' ? entry.amount / 12 : entry.amount;
      total += monthly;
      if (entry.nature === 'Essentielle') {
        essentielles += monthly;
      } else {
        discretionnaires += monthly;
      }
    }
    return { totalExpenses: total, totalEssentielles: essentielles, totalDiscretionnaires: discretionnaires };
  }, [expenses]);

  const remaining = totalIncomes - totalExpenses;
  const isDeficit = remaining < 0;

  // ─── Display helpers ───
  const displayAmount = (key: string): string => {
    const entry = incomes[key];
    if (!entry || entry.amount === 0) return '';
    return String(entry.amount);
  };

  const displayExpense = (key: string): string => {
    const entry = expenses[key];
    if (!entry) return '';
    const val = typeof entry === 'number' ? entry : entry.amount;
    if (val === 0) return '';
    return String(val);
  };

  const formatCurrency = (amount: number): string => {
    return Math.round(amount).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ─── REVENUS Section ─── */}
      <FadeInView active={isActive} delay={100}>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <Text style={styles.sectionIcon}>💰</Text>
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={[styles.sectionTitle, { color: WZ.green, ...neonGlow(WZ.green) }]}>{t('step2.incomeTitle')}</Text>
              <Text style={styles.sectionSubtitle}>{t('step2.incomeSubtitle')}</Text>
            </View>
          </View>

          {INCOME_SOURCES.map((source) => {
            const entry = getIncomeEntry(source.key);
            const hasAmount = entry.amount > 0;
            const certaintyKey = getCertaintyKey(entry.probability);

            return (
              <View key={source.key}>
                {/* Main row: icon + label + amount */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldLabelContainer}>
                    <Text style={styles.fieldIcon}>{source.icon}</Text>
                    <View style={styles.fieldLabelGroup}>
                      <Text style={styles.fieldLabel}>{t('step2.incomeSources.' + source.key)}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: source.type === 'Fixe' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)' }]}>
                        <Text style={[styles.typeBadgeText, { color: source.type === 'Fixe' ? WZ.green : WZ.orange }]}>
                          {t('step2.types.' + source.type)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={displayAmount(source.key)}
                      onChangeText={(val) => handleAmountChange(source.key, val)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={WZ.textMuted}
                      returnKeyType="done"
                    />
                    <Text style={styles.currencyLabel}>{currency}</Text>
                  </View>
                </View>

                {/* Detail row: frequency + certainty + growth (visible when amount > 0) */}
                {hasAmount && (
                  <View style={styles.detailRow}>
                    {/* Frequency toggle */}
                    <View style={styles.detailGroup}>
                      <Text style={styles.detailLabel}>{t('step2.frequency')}</Text>
                      <View style={styles.toggleRow}>
                        {(['monthly', 'annual'] as const).map((freq) => {
                          const isSelected = entry.frequency === freq;
                          return (
                            <Pressable
                              key={freq}
                              onPress={() => updateIncome(source.key, { frequency: freq })}
                              style={[styles.toggleChip, isSelected && styles.toggleChipSelected]}
                            >
                              <Text style={[styles.toggleText, isSelected && styles.toggleTextSelected]}>
                                {freq === 'monthly' ? t('step2.monthly') : t('step2.annual')}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Certainty chips */}
                    <View style={styles.detailGroup}>
                      <Text style={styles.detailLabel}>{t('step2.certainty')}</Text>
                      <View style={styles.toggleRow}>
                        {CERTAINTY_LEVELS.map((level) => {
                          const isSelected = certaintyKey === level.key;
                          return (
                            <Pressable
                              key={level.key}
                              onPress={() => updateIncome(source.key, { probability: level.probability })}
                              style={[
                                styles.toggleChip,
                                isSelected && { backgroundColor: level.color + '22', borderColor: level.color },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.toggleText,
                                  isSelected && { color: level.color, fontWeight: '700' },
                                ]}
                              >
                                {t('step2.certaintyLevels.' + level.key)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Growth rate */}
                    <View style={styles.detailGroup}>
                      <Text style={styles.detailLabel}>{t('step2.growth')}</Text>
                      <View style={styles.growthRow}>
                        <Text style={styles.growthPlus}>+</Text>
                        <TextInput
                          style={styles.growthInput}
                          value={String(entry.growthRate)}
                          onChangeText={(val) => {
                            const num = val === '' ? 0 : parseFloat(val) || 0;
                            updateIncome(source.key, { growthRate: num });
                          }}
                          keyboardType="numeric"
                          returnKeyType="done"
                        />
                        <Text style={styles.growthSuffix}>{t('step2.perYear')}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Subtotals: Fixe + Variable */}
          <View style={[styles.subtotalRow, { borderTopColor: 'rgba(34,197,94,0.2)' }]}>
            <View style={styles.subtotalGroup}>
              <Text style={[styles.subtotalLabel, { color: WZ.green }]}>{t('step2.fixed')}</Text>
              <Text style={[styles.subtotalValue, { color: WZ.greenLight, ...neonGlow(WZ.greenLight) }]}>
                {formatCurrency(totalFixed)}
              </Text>
            </View>
            <View style={styles.subtotalDivider} />
            <View style={styles.subtotalGroup}>
              <Text style={[styles.subtotalLabel, { color: WZ.orange }]}>{t('step2.variable')}</Text>
              <Text style={[styles.subtotalValue, { color: WZ.orangeLight, ...neonGlow(WZ.orangeLight) }]}>
                {formatCurrency(totalVariable)}
              </Text>
            </View>
            <View style={styles.subtotalDivider} />
            <View style={styles.subtotalGroup}>
              <Text style={[styles.subtotalLabel, { color: WZ.textSecondary }]}>{t('step2.totalPerMonth')}</Text>
              <Text style={[styles.subtotalValue, { color: WZ.textPrimary }]}>
                {formatCurrency(totalIncomes)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </FadeInView>

      {/* ─── DÉPENSES Section (enrichi : badges Type/Nature + slider Élasticité) ─── */}
      <FadeInView active={isActive} delay={300}>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
              <Text style={styles.sectionIcon}>🧾</Text>
            </View>
            <View style={styles.sectionTitleGroup}>
              <Text style={[styles.sectionTitle, { color: WZ.orange, ...neonGlow(WZ.orange) }]}>{t('step2.expenseTitle')}</Text>
              <Text style={styles.sectionSubtitle}>{t('step2.expenseSubtitle')}</Text>
            </View>
          </View>

          {EXPENSE_CATEGORIES.map((category) => {
            const entry = getExpenseEntry(category.key);
            const hasAmount = entry.amount > 0;
            const budgetPct = totalExpenses > 0
              ? ((entry.frequency === 'annual' ? entry.amount / 12 : entry.amount) / totalExpenses * 100)
              : 0;

            return (
              <View key={category.key}>
                {/* Main row: icon + label + badges + amount */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldLabelContainer}>
                    <Text style={styles.fieldIcon}>{category.icon}</Text>
                    <View style={styles.fieldLabelGroup}>
                      <Text style={styles.fieldLabel}>{t('step2.expenseCategories.' + category.key)}</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.typeBadge, { backgroundColor: entry.type === 'Fixe' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)' }]}>
                          <Text style={[styles.typeBadgeText, { color: entry.type === 'Fixe' ? WZ.green : WZ.orange }]}>
                            {t('step2.types.' + entry.type)}
                          </Text>
                        </View>
                        <View style={[styles.typeBadge, { backgroundColor: entry.nature === 'Essentielle' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)' }]}>
                          <Text style={[styles.typeBadgeText, { color: entry.nature === 'Essentielle' ? '#3B82F6' : '#A855F7' }]}>
                            {entry.nature === 'Essentielle' ? t('step2.essentialShort') : t('step2.discretionaryShort')}
                          </Text>
                        </View>
                        {hasAmount && (
                          <Text style={styles.budgetPctText}>{budgetPct.toFixed(0)}%</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={displayExpense(category.key)}
                      onChangeText={(val) => handleExpenseChange(category.key, val)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={WZ.textMuted}
                      returnKeyType="done"
                    />
                    <Text style={styles.currencyLabel}>{currency}</Text>
                  </View>
                </View>

                {/* Detail row: frequency + elasticity slider (visible when amount > 0) */}
                {hasAmount && (
                  <View style={[styles.detailRow, { borderLeftColor: 'rgba(249,115,22,0.15)' }]}>
                    {/* Frequency toggle */}
                    <View style={styles.detailGroup}>
                      <Text style={styles.detailLabel}>{t('step2.frequency')}</Text>
                      <View style={styles.toggleRow}>
                        {(['monthly', 'annual'] as const).map((freq) => {
                          const isSelected = entry.frequency === freq;
                          return (
                            <Pressable
                              key={freq}
                              onPress={() => updateExpense(category.key, { frequency: freq })}
                              style={[styles.toggleChip, isSelected && styles.toggleChipSelected]}
                            >
                              <Text style={[styles.toggleText, isSelected && styles.toggleTextSelected]}>
                                {freq === 'monthly' ? t('step2.monthly') : t('step2.annual')}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Elasticity display */}
                    <View style={styles.detailGroup}>
                      <Text style={styles.detailLabel}>{t('step2.compressionPotential')}</Text>
                      <View style={styles.elasticityRow}>
                        <View style={styles.elasticityBarBg}>
                          <View style={[styles.elasticityBarFill, { width: `${entry.elasticity}%` }]} />
                        </View>
                        <Text style={styles.elasticityValue}>{entry.elasticity}%</Text>
                      </View>
                      <View style={styles.toggleRow}>
                        {[0, 10, 25, 45, 65, 80].map((val) => (
                          <Pressable
                            key={val}
                            onPress={() => updateExpense(category.key, { elasticity: val })}
                            style={[styles.toggleChip, entry.elasticity === val && styles.toggleChipSelected]}
                          >
                            <Text style={[styles.toggleText, entry.elasticity === val && styles.toggleTextSelected]}>
                              {val}%
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Subtotals: Essentielles | Discrétionnaires | Total */}
          <View style={[styles.subtotalRow, { borderTopColor: 'rgba(249,115,22,0.2)' }]}>
            <View style={styles.subtotalGroup}>
              <Text style={[styles.subtotalLabel, { color: '#3B82F6' }]}>{t('step2.essential')}</Text>
              <Text style={[styles.subtotalValue, { color: '#60A5FA' }]}>
                {formatCurrency(totalEssentielles)}
              </Text>
            </View>
            <View style={styles.subtotalDivider} />
            <View style={styles.subtotalGroup}>
              <Text style={[styles.subtotalLabel, { color: '#A855F7' }]}>{t('step2.discretionary')}</Text>
              <Text style={[styles.subtotalValue, { color: '#C084FC' }]}>
                {formatCurrency(totalDiscretionnaires)}
              </Text>
            </View>
            <View style={styles.subtotalDivider} />
            <View style={styles.subtotalGroup}>
              <Text style={[styles.subtotalLabel, { color: WZ.orange }]}>{t('step2.totalPerMonth')}</Text>
              <Text style={[styles.subtotalValue, { color: WZ.orangeLight, ...neonGlow(WZ.orangeLight) }]}>
                {formatCurrency(totalExpenses)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </FadeInView>

      {/* ─── Summary Bar ─── */}
      <FadeInView active={isActive} delay={500}>
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('step2.fixedIncome')}</Text>
              <Text style={[styles.summaryAmount, { color: WZ.greenLight }]}>
                {formatCurrency(totalFixed)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('step2.variableIncome')}</Text>
              <Text style={[styles.summaryAmount, { color: WZ.orange }]}>
                {formatCurrency(totalVariable)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('step2.expenses')}</Text>
              <Text style={[styles.summaryAmount, { color: WZ.orangeLight }]}>
                {formatCurrency(totalExpenses)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {isDeficit ? t('step2.deficit') : t('step2.remaining')}
              </Text>
              <Text
                style={[
                  styles.summaryAmount,
                  { color: isDeficit ? '#EF4444' : WZ.accent },
                ]}
              >
                {isDeficit ? '- ' : '+ '}
                {formatCurrency(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        </GlassCard>
      </FadeInView>

      {/* ─── Tip ─── */}
      <FadeInView active={isActive} delay={650}>
        <TipBox
          text={t('step2.tip')}
          style={styles.tipBox}
        />
      </FadeInView>
    </ScrollView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
  },

  // ─── Section Cards ───
  sectionCard: {
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionTitleGroup: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: WZ.textMuted,
  },

  // ─── Field Row ───
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  fieldLabelGroup: {
    gap: 3,
  },
  fieldIcon: {
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: WZ.textPrimary,
    fontWeight: '500',
  },

  // ─── Type badge (Fixe/Variable) ───
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── Input ───
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    width: 120,
    height: 42,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: WZ.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    color: WZ.textPrimary,
    textAlign: 'right',
  },
  currencyLabel: {
    fontSize: 11,
    color: WZ.textMuted,
    fontWeight: '600',
    width: 36,
  },

  // ─── Detail Row (expandable when amount > 0) ───
  detailRow: {
    backgroundColor: 'rgba(251,189,35,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(251,189,35,0.15)',
  },
  detailGroup: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: WZ.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WZ.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  toggleChipSelected: {
    backgroundColor: 'rgba(251,189,35,0.12)',
    borderColor: WZ.accent,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: WZ.textMuted,
  },
  toggleTextSelected: {
    color: WZ.accent,
    fontWeight: '700',
  },

  // ─── Growth rate ───
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthPlus: {
    fontSize: 14,
    fontWeight: '700',
    color: WZ.textMuted,
  },
  growthInput: {
    width: 50,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: WZ.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '600',
    color: WZ.accent,
    textAlign: 'center',
  },
  growthSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: WZ.textMuted,
  },

  // ─── Subtotal ───
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  subtotalGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  subtotalDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subtotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '800',
  },

  // ─── Summary Card ───
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: WZ.border,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: WZ.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ─── Badge row (Type + Nature side by side) ───
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  budgetPctText: {
    fontSize: 10,
    fontWeight: '700',
    color: WZ.textMuted,
    marginLeft: 2,
  },

  // ─── Elasticity bar ───
  elasticityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  elasticityBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  elasticityBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: WZ.orange,
  },
  elasticityValue: {
    fontSize: 12,
    fontWeight: '700',
    color: WZ.orange,
    width: 36,
    textAlign: 'right',
  },

  // ─── Tip ───
  tipBox: {
    marginTop: 4,
  },
});
