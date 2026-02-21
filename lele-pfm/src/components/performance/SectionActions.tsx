import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '../charts/ProgressBar';
import { PerfGlassCard, PF, COICOP_LABELS, COICOP_COLORS } from './shared';
import { CategoryItem } from '@/hooks/usePerformanceData';
import { formatCurrency, formatPercent } from '@/services/format-helpers';

interface SectionActionsProps {
  year: 1 | 2 | 3;
  categories: CategoryItem[];
}

export function SectionActions({ year, categories }: SectionActionsProps) {
  // Only show categories with elasticity > 0 (compression potential)
  const actionable = categories
    .filter((cat) => cat.elasticity > 0)
    .sort((a, b) => b.elasticity - a.elasticity);

  if (actionable.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucune action à faire pour le moment</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {actionable.map((cat) => {
        const color = COICOP_COLORS[cat.code] || PF.textMuted;
        const isEssential = cat.nature === 'Essentielle';
        const annualTarget = year === 1
          ? cat.annualTargetN1
          : year === 2
          ? cat.annualTargetN2
          : cat.annualTargetN3;

        const q = year === 1 ? cat.quarterly : year === 2 ? cat.quarterlyN2 : cat.quarterlyN3;
        const quarterlyData = [
          { label: 'T1', value: q.T1, pct: 20 },
          { label: 'T2', value: q.T2, pct: 23 },
          { label: 'T3', value: q.T3, pct: 27 },
          { label: 'T4', value: q.T4, pct: 30 },
        ];

        return (
          <PerfGlassCard key={cat.code} style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.catLabel} numberOfLines={1}>{cat.label}</Text>
              <View style={[styles.natureBadge, { backgroundColor: isEssential ? PF.blue + '20' : PF.violet + '20' }]}>
                <Text style={[styles.natureText, { color: isEssential ? PF.blue : PF.violet }]}>
                  {isEssential ? 'Indispensable' : 'Confort'}
                </Text>
              </View>
            </View>

            {/* Budget rate + elasticity */}
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Budget</Text>
                <Text style={[styles.metricValue, { color }]}>{formatPercent(cat.budgetRate, 1)}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Marge de manœuvre</Text>
                <Text style={[styles.metricValue, { color: PF.violet }]}>{formatPercent(cat.elasticity, 0)}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Objectif An {year}</Text>
                <Text style={[styles.metricValue, { color: PF.accent }]}>{formatCurrency(annualTarget)}</Text>
              </View>
            </View>

            {/* Quarterly bars */}
            <View style={styles.quarterSection}>
              {quarterlyData.map((q) => (
                <View key={q.label} style={styles.quarterRow}>
                  <Text style={styles.quarterLabel}>{q.label}</Text>
                  <View style={{ flex: 1 }}>
                    <ProgressBar progress={q.pct * 3.33} color={color} height={5} />
                  </View>
                  <Text style={styles.quarterValue}>{formatCurrency(q.value)}</Text>
                </View>
              ))}
            </View>
          </PerfGlassCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
  },
  card: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catLabel: {
    flex: 1,
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  natureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  natureText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    color: PF.textMuted,
    fontSize: 10,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  quarterSection: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PF.border,
  },
  quarterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quarterLabel: {
    color: PF.textMuted,
    fontSize: 11,
    width: 24,
  },
  quarterValue: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    width: 70,
    textAlign: 'right',
  },
});
