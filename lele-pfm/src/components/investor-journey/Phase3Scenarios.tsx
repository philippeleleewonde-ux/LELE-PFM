import React, { memo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Shield, Zap, BarChart3, AlertTriangle, Star } from 'lucide-react-native';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { JourneyProgressBar } from '@/components/investor-journey/JourneyProgressBar';
import { StrategyComparisonChart } from '@/components/investor-journey/StrategyComparisonChart';
import { useInvestorJourney } from '@/hooks/useInvestorJourney';
import { InvestmentStrategy, StrategyId } from '@/types/investor-journey';
import { InvestmentPillar } from '@/types/investment';

// ─── Constants ───

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

const STRATEGY_ICONS: Record<StrategyId, typeof Shield> = {
  ultra_safe: Shield,
  safe: Shield,
  balanced: BarChart3,
  growth: TrendingUp,
  aggressive: Zap,
};

const PILLAR_COLORS: Record<InvestmentPillar, string> = {
  base_arriere: '#60A5FA',
  amortisseur: '#A78BFA',
  refuge: '#FBBF24',
  croissance: '#4ADE80',
};

const PILLAR_LABELS: Record<InvestmentPillar, string> = {
  base_arriere: 'Base',
  amortisseur: 'Amort.',
  refuge: 'Refuge',
  croissance: 'Croiss.',
};

const VOLATILITY_LEVELS: { max: number; label: string; color: string }[] = [
  { max: 5, label: 'Tres faible', color: '#4ADE80' },
  { max: 10, label: 'Faible', color: '#86EFAC' },
  { max: 15, label: 'Modere', color: '#FBBF24' },
  { max: 25, label: 'Eleve', color: '#FB923C' },
  { max: Infinity, label: 'Tres eleve', color: '#F87171' },
];

// ─── Helpers ───

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toFixed(0);
}

function getVolatilityBadge(vol: number) {
  return VOLATILITY_LEVELS.find((v) => vol <= v.max) ?? VOLATILITY_LEVELS[VOLATILITY_LEVELS.length - 1];
}

// ─── Strategy Card ───

interface StrategyCardProps {
  strategy: InvestmentStrategy;
  isSelected: boolean;
  onSelect: () => void;
}

function StrategyCard({ strategy, isSelected, onSelect }: StrategyCardProps) {
  const color = STRATEGY_COLORS[strategy.id];
  const Icon = STRATEGY_ICONS[strategy.id];
  const volBadge = getVolatilityBadge(strategy.weightedVolatility);

  return (
    <Pressable onPress={onSelect}>
      <PerfGlassCard
        style={[
          cardStyles.card,
          isSelected && { borderColor: color + '80', borderWidth: 2 },
        ]}
      >
        {/* Header row */}
        <View style={cardStyles.headerRow}>
          <View style={[cardStyles.iconBox, { backgroundColor: color + '20' }]}>
            <Icon size={18} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cardStyles.name, { color }]}>
              {strategy.displayName || STRATEGY_NAMES[strategy.id]}
            </Text>
          </View>
          {strategy.isRecommended && !isSelected && (
            <View style={[cardStyles.recommendedBadge]}>
              <Star size={10} color="#FBBF24" />
              <Text style={cardStyles.recommendedText}>Recommande</Text>
            </View>
          )}
          {isSelected && (
            <View style={[cardStyles.selectedBadge, { backgroundColor: color + '25', borderColor: color + '50' }]}>
              <Text style={[cardStyles.selectedText, { color }]}>Selectionne</Text>
            </View>
          )}
        </View>

        {/* Pillar weight bar */}
        <View style={cardStyles.pillarBar}>
          {strategy.pillarWeights
            .filter((pw) => pw.weight > 0)
            .map((pw) => (
              <View
                key={pw.pillar}
                style={[
                  cardStyles.pillarSegment,
                  {
                    flex: pw.weight,
                    backgroundColor: PILLAR_COLORS[pw.pillar],
                  },
                ]}
              />
            ))}
        </View>

        {/* Pillar labels */}
        <View style={cardStyles.pillarLabelRow}>
          {strategy.pillarWeights
            .filter((pw) => pw.weight > 0)
            .map((pw) => (
              <Text key={pw.pillar} style={[cardStyles.pillarLabel, { color: PILLAR_COLORS[pw.pillar] }]}>
                {PILLAR_LABELS[pw.pillar]} {pw.weight}%
              </Text>
            ))}
        </View>

        {/* Metrics grid */}
        <View style={cardStyles.metricsGrid}>
          <View style={cardStyles.metricItem}>
            <Text style={cardStyles.metricLabel}>Rendement annuel</Text>
            <Text style={[cardStyles.metricValue, { color: PF.green }]}>
              {strategy.weightedReturnRate.toFixed(1)}%
            </Text>
          </View>
          <View style={cardStyles.metricItem}>
            <Text style={cardStyles.metricLabel}>Valeur finale</Text>
            <Text style={[cardStyles.metricValue, { color: PF.accent }]}>
              {formatAmount(strategy.finalValue)} F
            </Text>
          </View>
          <View style={cardStyles.metricItem}>
            <Text style={cardStyles.metricLabel}>Gains totaux</Text>
            <Text style={[cardStyles.metricValue, { color: PF.green }]}>
              +{formatAmount(strategy.totalReturns)} F
            </Text>
          </View>
          <View style={cardStyles.metricItem}>
            <Text style={cardStyles.metricLabel}>CAGR</Text>
            <Text style={cardStyles.metricValue}>
              {strategy.cagr.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Volatility badge */}
        <View style={cardStyles.volRow}>
          <AlertTriangle size={12} color={volBadge.color} />
          <View style={[cardStyles.volBadge, { backgroundColor: volBadge.color + '20', borderColor: volBadge.color + '40' }]}>
            <Text style={[cardStyles.volText, { color: volBadge.color }]}>
              Risque: {volBadge.label} ({strategy.weightedVolatility.toFixed(1)}%)
            </Text>
          </View>
        </View>
      </PerfGlassCard>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  recommendedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#FBBF2420',
    borderWidth: 1,
    borderColor: '#FBBF2450',
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FBBF24',
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillarBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 6,
  },
  pillarSegment: {
    borderRadius: 4,
  },
  pillarLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pillarLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metricItem: {
    width: '46%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  metricLabel: {
    color: PF.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    color: PF.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  volRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  volText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

// ─── Comparison Table ───

function ComparisonTable({ strategies }: { strategies: InvestmentStrategy[] }) {
  const rows: { label: string; key: 'weightedReturnRate' | 'finalValue' | 'totalReturns' | 'cagr' }[] = [
    { label: 'Rendement %', key: 'weightedReturnRate' },
    { label: 'Valeur finale', key: 'finalValue' },
    { label: 'Gains', key: 'totalReturns' },
    { label: 'CAGR %', key: 'cagr' },
  ];

  return (
    <PerfGlassCard style={tableStyles.card}>
      <Text style={tableStyles.title}>Comparaison detaillee</Text>

      {/* Header row */}
      <View style={tableStyles.row}>
        <View style={tableStyles.labelCell} />
        {strategies.map((s) => (
          <View key={s.id} style={tableStyles.valueCell}>
            <View style={[tableStyles.headerDot, { backgroundColor: STRATEGY_COLORS[s.id] }]} />
            <Text style={[tableStyles.headerText, { color: STRATEGY_COLORS[s.id] }]} numberOfLines={1}>
              {(s.displayName || STRATEGY_NAMES[s.id]).slice(0, 8)}
            </Text>
          </View>
        ))}
      </View>

      {/* Data rows */}
      {rows.map((row, rowIdx) => (
        <View
          key={row.key}
          style={[tableStyles.row, rowIdx % 2 === 0 && tableStyles.rowAlt]}
        >
          <View style={tableStyles.labelCell}>
            <Text style={tableStyles.rowLabel}>{row.label}</Text>
          </View>
          {strategies.map((s) => {
            const val = s[row.key];
            let display: string;
            if (row.key === 'finalValue' || row.key === 'totalReturns') {
              display = formatAmount(val);
            } else {
              display = val.toFixed(1) + '%';
            }
            return (
              <View key={s.id} style={tableStyles.valueCell}>
                <Text style={tableStyles.cellValue}>{display}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </PerfGlassCard>
  );
}

const tableStyles = StyleSheet.create({
  card: {
    padding: 14,
  },
  title: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowAlt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 6,
  },
  labelCell: {
    width: 80,
    paddingLeft: 4,
  },
  valueCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerText: {
    fontSize: 8,
    fontWeight: '700',
  },
  rowLabel: {
    color: PF.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  cellValue: {
    color: PF.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
});

// ─── Main Component ───

interface Phase3ScenariosProps {
  onNext: () => void;
}

function Phase3ScenariosInner({ onNext }: Phase3ScenariosProps) {
  const { t } = useTranslation('app');
  const {
    activeStrategies,
    chosenStrategyId,
    chooseStrategy,
    generateAllStrategies,
    investmentDuration,
  } = useInvestorJourney();

  // Generate strategies on mount if not yet generated
  useEffect(() => {
    if (activeStrategies.length === 0) {
      generateAllStrategies();
    }
  }, []);

  // Auto-select recommended strategy if none chosen yet
  useEffect(() => {
    if (!chosenStrategyId && activeStrategies.length > 0) {
      const recommended = activeStrategies.find((s) => s.isRecommended);
      if (recommended) {
        chooseStrategy(recommended.id);
      }
    }
  }, [activeStrategies, chosenStrategyId, chooseStrategy]);

  const durationMonths = investmentDuration?.months ?? 60;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress bar */}
      <JourneyProgressBar currentPhase="scenarios" />

      {/* Header */}
      <Text style={styles.header}>Choisissez votre strategie</Text>
      <Text style={styles.subtitle}>
        5 strategies adaptees a votre profil et vos actifs selectionnes
      </Text>

      {/* Strategy cards */}
      {activeStrategies.map((strategy) => (
        <StrategyCard
          key={strategy.id}
          strategy={strategy}
          isSelected={chosenStrategyId === strategy.id}
          onSelect={() => chooseStrategy(strategy.id)}
        />
      ))}

      {/* Comparison chart */}
      {activeStrategies.length > 0 && (
        <StrategyComparisonChart
          strategies={activeStrategies}
          durationMonths={durationMonths}
          highlightedId={chosenStrategyId ?? undefined}
        />
      )}

      {/* Comparison table */}
      {activeStrategies.length > 0 && (
        <ComparisonTable strategies={activeStrategies} />
      )}

      {/* CTA */}
      <Pressable
        onPress={onNext}
        disabled={!chosenStrategyId}
        style={[
          styles.ctaButton,
          !chosenStrategyId && styles.ctaDisabled,
        ]}
      >
        <Text style={[styles.ctaText, !chosenStrategyId && styles.ctaTextDisabled]}>
          Choisir mon horizon
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export const Phase3Scenarios = memo(Phase3ScenariosInner);

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
  ctaButton: {
    backgroundColor: PF.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
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
  ctaTextDisabled: {
    color: PF.textSecondary,
  },
});
