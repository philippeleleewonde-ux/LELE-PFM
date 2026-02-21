import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IndicatorCard } from './IndicatorCard';
import { PF, FadeInView } from './shared';
import { formatCurrency } from '@/services/format-helpers';
import type { IndicatorDisplayItem } from '@/hooks/usePerformanceData';

interface Props {
  year: 1 | 2 | 3;
  indicators: IndicatorDisplayItem[];
  eprTotal: number;
}

export function SectionIndicators({ year, indicators, eprTotal }: Props) {
  if (indicators.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucun indicateur calculé</Text>
      </View>
    );
  }

  const recoveryPercent = year === 1 ? 30 : year === 2 ? 60 : 100;

  return (
    <View>
      {/* Summary header */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Récupération</Text>
          <Text style={styles.summaryValue}>{recoveryPercent}%</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Potentiel An {year}</Text>
          <Text style={[styles.summaryValue, { color: PF.accent }]}>
            {formatCurrency(eprTotal)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Indicateurs</Text>
          <Text style={styles.summaryValue}>{indicators.length}</Text>
        </View>
      </View>

      {/* Indicator cards */}
      {indicators.map((ind, idx) => (
        <FadeInView key={ind.code} delay={idx * 80}>
          <IndicatorCard indicator={ind} year={year} />
        </FadeInView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryValue: {
    color: PF.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
  },
});
