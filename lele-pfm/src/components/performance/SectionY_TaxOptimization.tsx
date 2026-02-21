import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import {
  TAX_REGIMES,
  analyzePortfolioTax,
  AssetTaxProfile,
  TaxStrategy,
} from '@/domain/calculators/tax-optimization-engine';

export function SectionY_TaxOptimization() {
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const [selectedRegimeIndex, setSelectedRegimeIndex] = useState(0);

  const regime = TAX_REGIMES[selectedRegimeIndex];

  const result = useMemo(() => {
    if (!investorProfile || allocations.length === 0) return null;
    return analyzePortfolioTax(allocations, regime.id);
  }, [allocations, regime, investorProfile]);

  if (!investorProfile) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          Configurez votre profil investisseur dans les r{'\u00e9'}glages pour voir l'analyse fiscale.
        </Text>
      </PerfGlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Regime selector pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {TAX_REGIMES.map((r, i) => (
          <Pressable
            key={r.id}
            onPress={() => setSelectedRegimeIndex(i)}
            style={[
              styles.pill,
              i === selectedRegimeIndex && styles.pillActive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                i === selectedRegimeIndex && styles.pillTextActive,
              ]}
            >
              {r.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {result && (
        <>
          {/* Tax efficiency score */}
          <PerfGlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Efficacit{'\u00e9'} fiscale</Text>
            <Text
              style={[
                styles.scoreValue,
                { color: getScoreColor(result.taxEfficiencyScore) },
              ]}
            >
              {result.taxEfficiencyScore}% d'efficacit{'\u00e9'} fiscale
            </Text>
            <Text style={styles.scoreSub}>
              Rendement brut {result.portfolioGrossReturn.toFixed(2)}% {'\u2192'} net{' '}
              {result.portfolioNetReturn.toFixed(2)}% (perte fiscale: {result.portfolioTaxDrag.toFixed(2)}%)
            </Text>
            <Text style={styles.verdict}>{result.verdict}</Text>
          </PerfGlassCard>

          {/* Per-asset breakdown */}
          {result.assetProfiles.length > 0 && (
            <PerfGlassCard style={styles.section}>
              <Text style={styles.sectionTitle}>D{'\u00e9'}tail par actif</Text>
              <View style={styles.assetList}>
                {result.assetProfiles.map((p) => (
                  <AssetRow key={p.asset} profile={p} />
                ))}
              </View>
            </PerfGlassCard>
          )}

          {/* Strategies */}
          {result.strategies.filter((s) => s.applicable).length > 0 && (
            <PerfGlassCard style={styles.section}>
              <Text style={styles.sectionTitle}>Strat{'\u00e9'}gies d'optimisation</Text>
              <View style={styles.stratList}>
                {result.strategies
                  .filter((s) => s.applicable)
                  .map((s) => (
                    <StrategyRow key={s.id} strategy={s} />
                  ))}
              </View>
            </PerfGlassCard>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Estimations indicatives, consultez un conseiller fiscal pour votre situation personnelle.
          </Text>
        </>
      )}
    </View>
  );
}

// ─── Sub-components ───

function AssetRow({ profile }: { profile: AssetTaxProfile }) {
  const barWidth = Math.max(0, Math.min(100, profile.taxEfficiency));
  return (
    <View style={styles.assetRow}>
      <View style={styles.assetHeader}>
        <Text style={styles.assetName} numberOfLines={1}>
          {profile.assetName}
        </Text>
        <Text style={styles.assetReturn}>
          <Text style={{ color: PF.textSecondary }}>
            {profile.grossReturn.toFixed(1)}%
          </Text>
          <Text style={{ color: PF.textMuted }}> {'\u2192'} </Text>
          <Text style={{ color: getScoreColor(profile.taxEfficiency) }}>
            {profile.netReturn.toFixed(2)}%
          </Text>
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${barWidth}%`,
              backgroundColor: getScoreColor(profile.taxEfficiency),
            },
          ]}
        />
      </View>
      <Text style={styles.assetTip}>{profile.optimizationTip}</Text>
    </View>
  );
}

function StrategyRow({ strategy }: { strategy: TaxStrategy }) {
  const diffColor =
    strategy.difficulty === 'easy'
      ? PF.green
      : strategy.difficulty === 'moderate'
        ? PF.orange
        : PF.red;
  const diffLabel =
    strategy.difficulty === 'easy'
      ? 'Facile'
      : strategy.difficulty === 'moderate'
        ? 'Mod\u00e9r\u00e9'
        : 'Avanc\u00e9';

  return (
    <View style={styles.stratRow}>
      <View style={styles.stratHeader}>
        <Text style={styles.stratTitle} numberOfLines={2}>
          {strategy.title}
        </Text>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '25' }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
        </View>
      </View>
      <Text style={styles.stratDesc}>{strategy.description}</Text>
      <Text style={[styles.stratSaving, { color: PF.green }]}>
        {'\u00c9'}conomie potentielle : ~{strategy.potentialSaving}%/an
      </Text>
    </View>
  );
}

// ─── Helpers ───

function getScoreColor(score: number): string {
  if (score >= 80) return PF.green;
  if (score >= 60) return PF.orange;
  return PF.red;
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },

  // Pills
  pillsRow: { gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: PF.cardBg,
  },
  pillActive: {
    backgroundColor: PF.gold + '25',
    borderColor: PF.gold,
  },
  pillText: { color: PF.textSecondary, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: PF.gold, fontWeight: '700' },

  // Score
  section: { marginBottom: 0 },
  sectionTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  scoreValue: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  scoreSub: {
    color: PF.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  verdict: {
    color: PF.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },

  // Assets
  assetList: { gap: 12 },
  assetRow: { gap: 4 },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetName: { color: PF.textPrimary, fontSize: 12, fontWeight: '600', flex: 1 },
  assetReturn: { fontSize: 11 },
  barTrack: {
    height: 4,
    backgroundColor: PF.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2 },
  assetTip: { color: PF.textMuted, fontSize: 10, lineHeight: 14 },

  // Strategies
  stratList: { gap: 14 },
  stratRow: { gap: 4 },
  stratHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  stratTitle: { color: PF.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  diffText: { fontSize: 10, fontWeight: '700' },
  stratDesc: { color: PF.textSecondary, fontSize: 11, lineHeight: 16 },
  stratSaving: { fontSize: 11, fontWeight: '700' },

  // Disclaimer
  disclaimer: {
    color: PF.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 8,
  },
});
