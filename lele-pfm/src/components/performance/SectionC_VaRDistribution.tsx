import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DonutChart } from '../charts/DonutChart';
import { PerfGlassCard, PF } from './shared';
import { VarDistribution } from '@/hooks/usePerformanceData';
import { formatCurrency, formatPercent } from '@/services/format-helpers';

interface SectionCProps {
  data: VarDistribution;
}

export function SectionC_VaRDistribution({ data }: SectionCProps) {
  const donutData = [
    { label: 'Coûts invisibles', value: Math.abs(data.ul), color: PF.orange },
    { label: 'Coûts visibles', value: Math.abs(data.el), color: PF.red },
    { label: 'Variation', value: Math.abs(data.volatility) * 100, color: PF.violet },
  ];

  return (
    <View style={styles.container}>
      {/* Donut */}
      <DonutChart
        data={donutData}
        size={150}
        strokeWidth={18}
        centerValue={formatCurrency(data.var95)}
        centerLabel="Coût max."
      />

      {/* Summary card */}
      <PerfGlassCard style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Votre coût maximum</Text>
        <Text style={[styles.summaryValue, { color: PF.yellow }]}>
          {formatCurrency(data.var95)}
        </Text>
        <Text style={styles.summaryHint}>
          C'est le montant maximum que votre gestion peut vous coûter.
        </Text>
      </PerfGlassCard>

      {/* Context info */}
      <View style={styles.infoRow}>
        <PerfGlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>Ajustement personnel</Text>
          <Text style={[styles.infoValue, { color: PF.accent }]}>{data.coefficientContextuel.toFixed(2)}</Text>
        </PerfGlassCard>
        <PerfGlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>Variation revenus</Text>
          <Text style={[styles.infoValue, { color: PF.green }]}>{formatPercent(data.revenueVolatility)}</Text>
        </PerfGlassCard>
        <PerfGlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>Variation dépenses</Text>
          <Text style={[styles.infoValue, { color: PF.orange }]}>{formatPercent(data.expenseVolatility)}</Text>
        </PerfGlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summaryCard: {
    gap: 8,
    alignItems: 'center',
  },
  summaryTitle: {
    color: PF.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryHint: {
    color: PF.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 12,
  },
  infoLabel: {
    color: PF.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
