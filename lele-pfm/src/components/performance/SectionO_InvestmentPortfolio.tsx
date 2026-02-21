import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { useEngineStore } from '@/stores/engine-store';
import { formatCurrency } from '@/services/format-helpers';
import {
  portfolioReturn,
  simulateInvestment,
  compareStrategies,
} from '@/domain/calculators/investment-simulator';

export function SectionO_InvestmentPortfolio() {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const totalInvested = useInvestmentStore((s) => s.getTotalInvested)();
  const engineOutput = useEngineStore((s) => s.engineOutput);

  const annualReturn = useMemo(() => portfolioReturn(allocations), [allocations]);

  // Compute monthly invest dynamically from EPR × ratio (not step9.monthly_invest_n1 which may be 0)
  const monthlyInvestCalc = useMemo(() => {
    if (!engineOutput || !investorProfile) return 0;
    return engineOutput.step9.epr_n1 * investorProfile.investmentRatio / 100 / 12;
  }, [engineOutput, investorProfile]);

  const projection = useMemo(() => {
    if (monthlyInvestCalc <= 0 || annualReturn <= 0) return null;
    const inflation = 3;
    const p36 = simulateInvestment(monthlyInvestCalc, annualReturn, 0, 36, inflation);
    const comparison = compareStrategies(monthlyInvestCalc, 3, annualReturn, inflation);
    return { p36, comparison };
  }, [monthlyInvestCalc, annualReturn]);

  if (!investorProfile || !engineOutput) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          Configurez votre profil investisseur dans les réglages pour voir cette section.
        </Text>
      </PerfGlassCard>
    );
  }

  const last = projection?.p36[35];
  const ratioPercent = investorProfile.investmentRatio;

  return (
    <View style={styles.container}>
      {/* Educational intro banner */}
      <PerfGlassCard style={[styles.section, styles.introBanner]}>
        <Text style={styles.introTitle}>Comment lire cette section ?</Text>
        <Text style={styles.introText}>
          En analysant vos revenus et depenses, l'application estime que vous pourriez investir{' '}
          <Text style={styles.introHighlight}>{formatCurrency(Math.round(monthlyInvestCalc))}/mois</Text>.
          {'\n'}Les chiffres ci-dessous simulent ce qui se passerait si vous le faisiez pendant 3 ans.
        </Text>
        <View style={styles.introDetailRow}>
          <Text style={styles.introDetail}>
            {ratioPercent}% de votre epargne dedie a l'investissement
          </Text>
        </View>
      </PerfGlassCard>

      {/* Current allocation */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Ou est place votre argent ?</Text>
        <Text style={styles.sectionHint}>Les produits dans lesquels vous investissez et leur rendement annuel.</Text>
        {allocations.length > 0 ? (
          <View style={styles.allocList}>
            {allocations.map((a) => (
              <View key={a.product.code} style={styles.allocRow}>
                <View style={[styles.allocDot, { backgroundColor: getAllocColor(a.product.riskLevel) }]} />
                <Text style={styles.allocName} numberOfLines={1}>{a.product.name}</Text>
                <Text style={styles.allocReturn}>{a.product.returnRate}%</Text>
                <Text style={styles.allocWeight}>{a.weight}%</Text>
              </View>
            ))}
            <View style={styles.allocSummary}>
              <Text style={styles.summaryLabel}>Gain moyen attendu</Text>
              <Text style={[styles.summaryValue, { color: PF.green }]}>
                {annualReturn.toFixed(1)}%/an
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Aucune allocation calculee</Text>
        )}
      </PerfGlassCard>

      {/* 36-month projection */}
      {last && (
        <PerfGlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Projection sur 3 ans</Text>
          <Text style={styles.sectionHint}>
            Simulation : si vous investissez {formatCurrency(Math.round(monthlyInvestCalc))}/mois
            pendant 36 mois a {annualReturn.toFixed(1)}%/an.
          </Text>
          <View style={styles.projGrid}>
            <View style={styles.projItem}>
              <Text style={styles.projLabel}>Votre argent place</Text>
              <Text style={styles.projValue}>{formatCurrency(last.invested)}</Text>
              <Text style={styles.projHint}>
                {formatCurrency(Math.round(monthlyInvestCalc))}/mois x 36 mois
              </Text>
            </View>
            <View style={styles.projItem}>
              <Text style={styles.projLabel}>Gains generes</Text>
              <Text style={[styles.projValue, { color: PF.green }]}>+{formatCurrency(last.returns)}</Text>
              <Text style={styles.projHint}>
                Ce que votre placement vous rapporte en plus
              </Text>
            </View>
            <View style={styles.projItem}>
              <Text style={styles.projLabel}>Total dans 3 ans</Text>
              <Text style={[styles.projValue, { color: PF.accent }]}>{formatCurrency(last.total)}</Text>
              <Text style={styles.projHint}>
                Votre argent + les gains cumules
              </Text>
            </View>
            <View style={styles.projItem}>
              <Text style={styles.projLabel}>Valeur reelle</Text>
              <Text style={styles.projValue}>{formatCurrency(last.inflationAdjusted)}</Text>
              <Text style={styles.projHint}>
                Pouvoir d'achat reel (les prix augmentent de ~3%/an)
              </Text>
            </View>
          </View>
        </PerfGlassCard>
      )}

      {/* Comparison */}
      {projection?.comparison && (
        <PerfGlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Investir vs. laisser dormir son argent</Text>
          <Text style={styles.sectionHint}>
            Comparaison : que se passe-t-il si vous placez la meme somme sur un livret epargne classique ?
          </Text>
          <View style={styles.compRow}>
            <View style={styles.compItem}>
              <Text style={styles.compLabel}>Epargne classique</Text>
              <Text style={styles.compValue}>{formatCurrency(projection.comparison.savings36m)}</Text>
              <Text style={styles.compHint}>Livret a ~3%/an</Text>
            </View>
            <View style={styles.compItem}>
              <Text style={styles.compLabel}>Investissement</Text>
              <Text style={[styles.compValue, { color: PF.green }]}>
                {formatCurrency(projection.comparison.investment36m)}
              </Text>
              <Text style={styles.compHint}>Votre portefeuille</Text>
            </View>
          </View>
          <Text style={[styles.compDelta, { color: projection.comparison.delta > 0 ? PF.green : PF.red }]}>
            {projection.comparison.delta > 0 ? '+' : ''}
            {formatCurrency(projection.comparison.delta)} ({projection.comparison.deltaPercent}%)
          </Text>
          <Text style={styles.compExplain}>
            {projection.comparison.delta > 0
              ? 'En investissant, vous gagnez plus qu\'en laissant votre argent sur un simple livret.'
              : 'Avec ce portefeuille, un livret classique serait plus avantageux.'}
          </Text>
        </PerfGlassCard>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        Simulation indicative basee sur vos donnees. Les rendements passes ne garantissent pas les rendements futurs. Consultez un conseiller avant d'investir.
      </Text>
    </View>
  );
}

function getAllocColor(riskLevel: number): string {
  switch (riskLevel) {
    case 1: return '#4ADE80';
    case 2: return '#60A5FA';
    case 3: return '#FBBF24';
    case 4: return '#FB923C';
    case 5: return '#F87171';
    default: return '#A1A1AA';
  }
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sectionHint: { color: PF.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 12 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },

  // Intro banner
  introBanner: { borderColor: PF.accent + '30', borderWidth: 1 },
  introTitle: { color: PF.accent, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  introText: { color: PF.textSecondary, fontSize: 12, lineHeight: 18 },
  introHighlight: { color: PF.accent, fontWeight: '800' },
  introDetailRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PF.border,
  },
  introDetail: { color: PF.textMuted, fontSize: 11, fontStyle: 'italic' },

  // Allocation
  allocList: { gap: 6 },
  allocRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allocDot: { width: 8, height: 8, borderRadius: 4 },
  allocName: { color: PF.textSecondary, fontSize: 12, flex: 1 },
  allocReturn: { color: PF.textMuted, fontSize: 11, minWidth: 32, textAlign: 'right' },
  allocWeight: { color: PF.textPrimary, fontSize: 12, fontWeight: '700', minWidth: 30, textAlign: 'right' },
  allocSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: PF.border, paddingTop: 8, marginTop: 6,
  },
  summaryLabel: { color: PF.textMuted, fontSize: 12 },
  summaryValue: { fontSize: 14, fontWeight: '800' },

  // Projection
  projGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  projItem: { width: '47%', marginBottom: 4 },
  projLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  projValue: { color: PF.textPrimary, fontSize: 14, fontWeight: '700' },
  projHint: { color: PF.textMuted, fontSize: 9, lineHeight: 13, marginTop: 2 },

  // Comparison
  compRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  compItem: { alignItems: 'center' },
  compLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  compValue: { color: PF.textPrimary, fontSize: 14, fontWeight: '700' },
  compHint: { color: PF.textMuted, fontSize: 9, marginTop: 2 },
  compDelta: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  compExplain: { color: PF.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16, fontStyle: 'italic' },

  // Disclaimer
  disclaimer: { color: PF.textMuted, fontSize: 9, textAlign: 'center', lineHeight: 14, paddingHorizontal: 8 },
});
