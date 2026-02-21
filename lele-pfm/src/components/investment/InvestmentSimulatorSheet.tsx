import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { X, TrendingUp, PiggyBank, ArrowRight } from 'lucide-react-native';
import { useInvestmentStore } from '@/stores/investment-store';
import { useEngineStore } from '@/stores/engine-store';
import { formatCurrency } from '@/services/format-helpers';
import {
  simulateInvestment,
  portfolioReturn,
  compareStrategies,
} from '@/domain/calculators/investment-simulator';
import { PF } from '@/components/performance/shared';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function InvestmentSimulatorSheet({ visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const [horizon, setHorizon] = useState(36);

  const annualReturn = useMemo(() => portfolioReturn(allocations), [allocations]);

  // Compute monthly invest dynamically from EPR × ratio
  const monthlyAmount = useMemo(() => {
    if (!engineOutput || !investorProfile) return 0;
    return engineOutput.step9.epr_n1 * investorProfile.investmentRatio / 100 / 12;
  }, [engineOutput, investorProfile]);
  const savingsRate = 3; // default savings account rate
  const inflation = 3; // default inflation

  const projections = useMemo(() => {
    if (monthlyAmount <= 0 || annualReturn <= 0) return [];
    return simulateInvestment(monthlyAmount, annualReturn, 0, horizon, inflation);
  }, [monthlyAmount, annualReturn, horizon, inflation]);

  const comparison = useMemo(() => {
    if (monthlyAmount <= 0) return null;
    return compareStrategies(monthlyAmount, savingsRate, annualReturn, inflation);
  }, [monthlyAmount, savingsRate, annualReturn, inflation]);

  const lastProjection = projections[projections.length - 1];

  // Sample points for simple chart (every 6 months)
  const chartPoints = projections.filter((p) => p.month % 6 === 0 || p.month === horizon);

  if (!investorProfile || !engineOutput) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.95 : 0.9) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Simulateur investissement</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color={PF.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={[styles.scroll, { paddingHorizontal: isSmall ? 14 : 20 }]} showsVerticalScrollIndicator={false}>
            {/* Montant mensuel */}
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Investissement mensuel</Text>
              <Text style={[styles.infoValue, isSmall && { fontSize: 22 }]}>{formatCurrency(monthlyAmount)}</Text>
            </View>

            {/* Horizon selector */}
            <View style={styles.horizonRow}>
              {[12, 24, 36].map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setHorizon(h)}
                  style={[styles.horizonPill, horizon === h && styles.horizonPillActive]}
                >
                  <Text style={[styles.horizonText, horizon === h && styles.horizonTextActive]}>
                    {h} mois
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Projection results */}
            {lastProjection && (
              <View style={styles.resultsCard}>
                <Text style={styles.resultsTitle}>Projection à {horizon} mois</Text>
                <View style={styles.resultsRow}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Capital investi</Text>
                    <Text style={styles.resultValue}>{formatCurrency(lastProjection.invested)}</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Rendements</Text>
                    <Text style={[styles.resultValue, { color: '#4ADE80' }]}>
                      +{formatCurrency(lastProjection.returns)}
                    </Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Total</Text>
                    <Text style={[styles.resultValue, { color: '#FBBF24' }]}>
                      {formatCurrency(lastProjection.total)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.inflationNote}>
                  Ajusté inflation : {formatCurrency(lastProjection.inflationAdjusted)}
                </Text>
              </View>
            )}

            {/* Simple text-based chart */}
            {chartPoints.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Évolution du capital</Text>
                {chartPoints.map((p) => {
                  const maxTotal = chartPoints[chartPoints.length - 1]?.total ?? 1;
                  const barWidth = (p.total / maxTotal) * 100;
                  return (
                    <View key={p.month} style={styles.chartRow}>
                      <Text style={[styles.chartMonth, isSmall && { width: 24 }]}>M{p.month}</Text>
                      <View style={styles.chartBarBg}>
                        <View style={[styles.chartBarInvested, { width: `${(p.invested / maxTotal) * 100}%` }]} />
                        <View style={[styles.chartBarReturns, { width: `${(p.returns / maxTotal) * 100}%` }]} />
                      </View>
                      <Text style={[styles.chartValue, isSmall && { width: 60, fontSize: 9 }]}>{formatCurrency(p.total)}</Text>
                    </View>
                  );
                })}
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
                    <Text style={styles.legendText}>Investi</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} />
                    <Text style={styles.legendText}>Rendements</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Comparison */}
            {comparison && (
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>Épargne simple vs Investissement</Text>
                <View style={styles.comparisonRow}>
                  <View style={styles.compItem}>
                    <PiggyBank size={16} color="#A78BFA" />
                    <Text style={styles.compLabel}>Livret</Text>
                    <Text style={styles.compValue}>{formatCurrency(comparison.savings36m)}</Text>
                  </View>
                  <ArrowRight size={16} color="#52525B" />
                  <View style={styles.compItem}>
                    <TrendingUp size={16} color="#4ADE80" />
                    <Text style={styles.compLabel}>Investi</Text>
                    <Text style={[styles.compValue, { color: '#4ADE80' }]}>
                      {formatCurrency(comparison.investment36m)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.compDelta, { color: comparison.delta > 0 ? '#4ADE80' : '#F87171' }]}>
                  {comparison.delta > 0 ? '+' : ''}{formatCurrency(comparison.delta)} ({comparison.deltaPercent}%)
                </Text>
              </View>
            )}

            {/* Allocations */}
            {allocations.length > 0 && (
              <View style={styles.allocCard}>
                <Text style={styles.allocTitle}>Allocation recommandée</Text>
                {allocations.map((a) => (
                  <View key={a.product.code} style={styles.allocRow}>
                    <View style={styles.allocLeft}>
                      <View style={[styles.allocDot, { backgroundColor: getAllocColor(a.product.riskLevel) }]} />
                      <Text style={styles.allocName} numberOfLines={1}>{a.product.name}</Text>
                    </View>
                    <View style={styles.allocRight}>
                      <Text style={styles.allocWeight}>{a.weight}%</Text>
                      <Text style={styles.allocAmount}>{formatCurrency(a.monthlyAmount)}/m</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PF.darkBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: PF.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  title: { color: PF.textPrimary, fontSize: 17, fontWeight: '700' },
  scroll: { paddingBottom: 40 },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  infoLabel: { color: PF.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { color: PF.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 4 },
  horizonRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 14 },
  horizonPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: PF.border, backgroundColor: PF.cardBg,
  },
  horizonPillActive: { borderColor: '#FBBF2460', backgroundColor: '#FBBF2410' },
  horizonText: { color: PF.textMuted, fontSize: 13, fontWeight: '600' },
  horizonTextActive: { color: '#FBBF24' },
  resultsCard: {
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: PF.border, backgroundColor: PF.cardBg,
    marginBottom: 12,
  },
  resultsTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultItem: { alignItems: 'center', flex: 1 },
  resultLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  resultValue: { color: PF.textPrimary, fontSize: 15, fontWeight: '700' },
  inflationNote: { color: PF.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  chartCard: {
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: PF.border, backgroundColor: PF.cardBg,
    marginBottom: 12,
  },
  chartTitle: { color: PF.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  chartMonth: { color: PF.textMuted, fontSize: 10, fontWeight: '600', width: 30 },
  chartBarBg: {
    flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row', overflow: 'hidden', marginRight: 8,
  },
  chartBarInvested: { height: '100%', backgroundColor: '#60A5FA' },
  chartBarReturns: { height: '100%', backgroundColor: '#4ADE80' },
  chartValue: { color: PF.textSecondary, fontSize: 10, fontWeight: '600', width: 80, textAlign: 'right' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: PF.textMuted, fontSize: 10 },
  comparisonCard: {
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: PF.border, backgroundColor: PF.cardBg,
    marginBottom: 12, alignItems: 'center',
  },
  comparisonTitle: { color: PF.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compItem: { alignItems: 'center', gap: 4 },
  compLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600' },
  compValue: { color: PF.textPrimary, fontSize: 14, fontWeight: '700' },
  compDelta: { fontSize: 14, fontWeight: '800', marginTop: 8 },
  allocCard: {
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: PF.border, backgroundColor: PF.cardBg,
    marginBottom: 40,
  },
  allocTitle: { color: PF.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  allocRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  allocLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  allocDot: { width: 8, height: 8, borderRadius: 4 },
  allocName: { color: PF.textSecondary, fontSize: 12, flex: 1 },
  allocRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  allocWeight: { color: PF.textPrimary, fontSize: 12, fontWeight: '700', width: 30, textAlign: 'right' },
  allocAmount: { color: PF.textMuted, fontSize: 10, width: 70, textAlign: 'right' },
});
