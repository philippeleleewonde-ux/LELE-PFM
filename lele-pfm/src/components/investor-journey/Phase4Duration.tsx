import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, Rocket, Calendar, TrendingUp } from 'lucide-react-native';
import { PF, PerfGlassCard, FadeInView } from '@/components/performance/shared';
import { JourneyProgressBar } from '@/components/investor-journey/JourneyProgressBar';
import { useInvestorJourney } from '@/hooks/useInvestorJourney';
import { StrategyId } from '@/types/investor-journey';

// ─── Constants ───

const QUICK_DURATIONS = [1, 2, 3, 5, 10, 20] as const;

const YEAR_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30] as const;

const STRATEGY_COLORS: Record<StrategyId, string> = {
  ultra_safe: '#A78BFA',
  safe: '#60A5FA',
  balanced: '#FBBF24',
  growth: '#4ADE80',
  aggressive: '#F87171',
};

const STRATEGY_NAMES: Record<StrategyId, string> = {
  ultra_safe: 'Ultra-prudent',
  safe: 'Prudent',
  balanced: 'Equilibre',
  growth: 'Croissance',
  aggressive: 'Agressif',
};

// ─── Helpers ───

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toFixed(0);
}

function formatCurrency(amount: number): string {
  return formatAmount(amount) + ' F';
}

// ─── Year Slider ───

interface YearSliderProps {
  value: number;
  onChange: (years: number) => void;
}

function YearSlider({ value, onChange }: YearSliderProps) {
  return (
    <View style={sliderStyles.container}>
      <Text style={sliderStyles.label}>Ajustement fin (annees)</Text>
      <View style={sliderStyles.track}>
        {YEAR_STEPS.map((yr) => {
          const isSelected = yr === value;
          const isPast = yr < value;
          return (
            <Pressable
              key={yr}
              onPress={() => onChange(yr)}
              style={[
                sliderStyles.tick,
                isPast && sliderStyles.tickPast,
                isSelected && sliderStyles.tickSelected,
              ]}
            >
              <Text
                style={[
                  sliderStyles.tickLabel,
                  isSelected && sliderStyles.tickLabelSelected,
                ]}
              >
                {yr}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  track: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tick: {
    width: 42,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: PF.border,
  },
  tickPast: {
    backgroundColor: PF.green + '10',
    borderColor: PF.green + '30',
  },
  tickSelected: {
    backgroundColor: PF.accent + '25',
    borderColor: PF.accent,
    borderWidth: 2,
  },
  tickLabel: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tickLabelSelected: {
    color: PF.accent,
    fontWeight: '800',
  },
});

// ─── Month Selector ───

interface MonthSelectorProps {
  value: number; // 0-11
  onChange: (month: number) => void;
}

function MonthSelector({ value, onChange }: MonthSelectorProps) {
  return (
    <View style={monthStyles.container}>
      <Text style={monthStyles.label}>Mois supplementaires</Text>
      <View style={monthStyles.row}>
        {Array.from({ length: 12 }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            style={[
              monthStyles.pill,
              i === value && monthStyles.pillActive,
            ]}
          >
            <Text
              style={[
                monthStyles.pillText,
                i === value && monthStyles.pillTextActive,
              ]}
            >
              +{i}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const monthStyles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    width: 38,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: PF.border,
  },
  pillActive: {
    backgroundColor: PF.accent + '20',
    borderColor: PF.accent + '60',
  },
  pillText: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  pillTextActive: {
    color: PF.accent,
    fontWeight: '700',
  },
});

// ─── Summary Card ───

interface SummaryCardProps {
  strategyName: string;
  strategyColor: string;
  finalValue: number;
  totalReturns: number;
  monthlyContribution: number;
  cagr: number;
  durationMonths: number;
}

function SummaryCard({
  strategyName,
  strategyColor,
  finalValue,
  totalReturns,
  monthlyContribution,
  cagr,
  durationMonths,
}: SummaryCardProps) {
  const years = Math.floor(durationMonths / 12);
  const months = durationMonths % 12;
  const durationLabel = months > 0 ? `${years} ans ${months} mois` : `${years} ans`;

  return (
    <PerfGlassCard style={summaryStyles.card}>
      <View style={summaryStyles.headerRow}>
        <TrendingUp size={18} color={strategyColor} />
        <Text style={[summaryStyles.strategyName, { color: strategyColor }]}>
          {strategyName}
        </Text>
        <View style={[summaryStyles.durationBadge, { borderColor: PF.accent + '40' }]}>
          <Clock size={10} color={PF.accent} />
          <Text style={summaryStyles.durationText}>{durationLabel}</Text>
        </View>
      </View>

      <View style={summaryStyles.grid}>
        <View style={summaryStyles.gridItem}>
          <Text style={summaryStyles.gridLabel}>Valeur finale</Text>
          <Text style={[summaryStyles.gridValue, { color: PF.accent }]}>
            {formatCurrency(finalValue)}
          </Text>
        </View>
        <View style={summaryStyles.gridItem}>
          <Text style={summaryStyles.gridLabel}>Gains totaux</Text>
          <Text style={[summaryStyles.gridValue, { color: PF.green }]}>
            +{formatCurrency(totalReturns)}
          </Text>
        </View>
        <View style={summaryStyles.gridItem}>
          <Text style={summaryStyles.gridLabel}>Contribution mensuelle</Text>
          <Text style={summaryStyles.gridValue}>{formatCurrency(monthlyContribution)}</Text>
        </View>
        <View style={summaryStyles.gridItem}>
          <Text style={summaryStyles.gridLabel}>CAGR</Text>
          <Text style={summaryStyles.gridValue}>{cagr.toFixed(1)}%</Text>
        </View>
      </View>
    </PerfGlassCard>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    padding: 16,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  strategyName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  durationText: {
    color: PF.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '46%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gridLabel: {
    color: PF.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 3,
  },
  gridValue: {
    color: PF.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});

// ─── Main Component ───

interface Phase4DurationProps {
  onLaunch: () => void;
}

function Phase4DurationInner({ onLaunch }: Phase4DurationProps) {
  const { t } = useTranslation('app');
  const {
    chosenStrategyId,
    activeStrategies,
    investmentDuration,
    monthlyBudget,
    updateDuration,
    launchJourney,
  } = useInvestorJourney();

  const [selectedYears, setSelectedYears] = useState(5);
  const [extraMonths, setExtraMonths] = useState(0);

  // Pulse animation for the CTA button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Initialize from existing duration if present
  useEffect(() => {
    if (investmentDuration) {
      const totalMonths = investmentDuration.months;
      setSelectedYears(Math.floor(totalMonths / 12) || 1);
      setExtraMonths(totalMonths % 12);
    }
  }, []);

  // Update duration when user changes selection
  const totalMonths = selectedYears * 12 + extraMonths;

  useEffect(() => {
    if (totalMonths > 0) {
      updateDuration(totalMonths);
    }
  }, [totalMonths]);

  // Get the chosen strategy (with updated projections)
  const chosenStrategy = activeStrategies.find((s) => s.id === chosenStrategyId);
  const strategyColor = chosenStrategyId ? STRATEGY_COLORS[chosenStrategyId] : PF.accent;
  const strategyName = chosenStrategyId ? STRATEGY_NAMES[chosenStrategyId] : '';

  const handleQuickSelect = useCallback((years: number) => {
    setSelectedYears(years);
    setExtraMonths(0);
  }, []);

  const handleLaunch = useCallback(() => {
    if (chosenStrategyId) {
      launchJourney(chosenStrategyId);
      onLaunch();
    }
  }, [chosenStrategyId, launchJourney, onLaunch]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress bar */}
      <JourneyProgressBar currentPhase="duration" />

      {/* Header */}
      <Text style={styles.header}>Definissez votre horizon</Text>
      <Text style={styles.subtitle}>
        Plus l'horizon est long, plus les interets composes travaillent pour vous
      </Text>

      {/* Quick-select pills */}
      <View style={styles.quickRow}>
        {QUICK_DURATIONS.map((yr) => {
          const isActive = selectedYears === yr && extraMonths === 0;
          return (
            <Pressable
              key={yr}
              onPress={() => handleQuickSelect(yr)}
              style={[styles.quickPill, isActive && styles.quickPillActive]}
            >
              <Text style={[styles.quickText, isActive && styles.quickTextActive]}>
                {yr} an{yr > 1 ? 's' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom picker */}
      <PerfGlassCard style={styles.pickerCard}>
        <View style={styles.pickerHeader}>
          <Calendar size={16} color={PF.accent} />
          <Text style={styles.pickerTitle}>Personnaliser</Text>
        </View>

        <YearSlider value={selectedYears} onChange={setSelectedYears} />
        <MonthSelector value={extraMonths} onChange={setExtraMonths} />

        {/* Duration display */}
        <View style={styles.durationDisplay}>
          <Text style={styles.durationNumber}>{totalMonths}</Text>
          <Text style={styles.durationUnit}>mois</Text>
          <Text style={styles.durationEquals}>
            = {selectedYears} an{selectedYears > 1 ? 's' : ''}
            {extraMonths > 0 ? ` ${extraMonths} mois` : ''}
          </Text>
        </View>
      </PerfGlassCard>

      {/* Live projection summary */}
      {chosenStrategy && (
        <FadeInView delay={200}>
          <SummaryCard
            strategyName={strategyName}
            strategyColor={strategyColor}
            finalValue={chosenStrategy.finalValue}
            totalReturns={chosenStrategy.totalReturns}
            monthlyContribution={monthlyBudget}
            cagr={chosenStrategy.cagr}
            durationMonths={totalMonths}
          />
        </FadeInView>
      )}

      {/* CTA button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: 24 }}>
        <Pressable
          onPress={handleLaunch}
          disabled={!chosenStrategyId || totalMonths <= 0}
          style={[
            styles.ctaButton,
            (!chosenStrategyId || totalMonths <= 0) && styles.ctaDisabled,
          ]}
        >
          <Rocket size={20} color="#0F1014" />
          <Text style={styles.ctaText}>Valider et lancer mon parcours</Text>
        </Pressable>
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export const Phase4Duration = memo(Phase4DurationInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PF.darkBg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    color: PF.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    color: PF.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: PF.cardBg,
    borderWidth: 1,
    borderColor: PF.border,
  },
  quickPillActive: {
    backgroundColor: PF.accent + '20',
    borderColor: PF.accent,
    borderWidth: 2,
  },
  quickText: {
    color: PF.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickTextActive: {
    color: PF.accent,
    fontWeight: '800',
  },
  pickerCard: {
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 6,
  },
  durationNumber: {
    color: PF.accent,
    fontSize: 28,
    fontWeight: '800',
  },
  durationUnit: {
    color: PF.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  durationEquals: {
    color: PF.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PF.accent,
    paddingVertical: 18,
    borderRadius: 16,
  },
  ctaDisabled: {
    backgroundColor: PF.textMuted,
    opacity: 0.5,
  },
  ctaText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '800',
  },
});
