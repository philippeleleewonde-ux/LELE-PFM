import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  PiggyBank,
  Target,
  Shield,
  TrendingUp,
  GraduationCap,
  HelpCircle,
} from 'lucide-react-native';
import { PerfGlassCard, PF } from './shared';
import { formatCurrency } from '@/services/format-helpers';
import type { IndicatorDisplayItem } from '@/hooks/usePerformanceData';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  PiggyBank,
  Target,
  Shield,
  TrendingUp,
  GraduationCap,
  HelpCircle,
};

interface Props {
  indicator: IndicatorDisplayItem;
  year: 1 | 2 | 3;
}

export function IndicatorCard({ indicator, year }: Props) {
  const Icon = ICON_MAP[indicator.icon] ?? HelpCircle;
  const epr = year === 1 ? indicator.eprN1 : year === 2 ? indicator.eprN2 : indicator.eprN3;
  const monthly = year === 1 ? indicator.monthlyTargetN1 : year === 2 ? indicator.monthlyTargetN2 : indicator.monthlyTargetN3;
  const quarterly = year === 1 ? indicator.quarterlyN1 : year === 2 ? indicator.quarterlyN2 : indicator.quarterlyN3;

  return (
    <PerfGlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: indicator.color + '20' }]}>
          <Icon size={20} color={indicator.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{indicator.name}</Text>
          <Text style={styles.description}>{indicator.challenge}</Text>
        </View>
        <View style={[styles.rateBadge, { backgroundColor: indicator.color + '20' }]}>
          <Text style={[styles.rateText, { color: indicator.color }]}>
            {indicator.rate.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Objectif annuel */}
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Objectif An {year}</Text>
        <Text style={[styles.targetValue, { color: indicator.color }]}>
          {formatCurrency(epr)}
        </Text>
      </View>

      {/* Objectif mensuel */}
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Par mois</Text>
        <Text style={styles.monthlyValue}>{formatCurrency(monthly)}</Text>
      </View>

      {/* Barres trimestrielles */}
      <View style={styles.quarterlyContainer}>
        <Text style={styles.quarterlyTitle}>Répartition trimestrielle</Text>
        <View style={styles.quarterlyRow}>
          {(['T1', 'T2', 'T3', 'T4'] as const).map((q, i) => {
            const val = quarterly[q];
            const maxVal = quarterly.T4 || 1;
            const barHeight = Math.max(8, (val / maxVal) * 48);
            const pct = [20, 23, 27, 30][i];
            return (
              <View key={q} style={styles.quarterlyItem}>
                <Text style={styles.quarterlyValue}>{formatCurrency(val)}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: indicator.color,
                        opacity: 0.3 + (i * 0.2),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.quarterlyLabel}>{q}</Text>
                <Text style={styles.quarterlyPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Poids brut */}
      <View style={styles.weightRow}>
        <Text style={styles.weightLabel}>Besoin d'amélioration</Text>
        <View style={styles.weightBar}>
          <View
            style={[
              styles.weightFill,
              {
                width: `${Math.min(100, indicator.rawWeight)}%`,
                backgroundColor: indicator.color,
              },
            ]}
          />
        </View>
        <Text style={styles.weightValue}>{indicator.rawWeight}/100</Text>
      </View>
    </PerfGlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: PF.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: PF.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '800',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  targetLabel: {
    color: PF.textSecondary,
    fontSize: 13,
  },
  targetValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  monthlyValue: {
    color: PF.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  quarterlyContainer: {
    marginTop: 12,
  },
  quarterlyTitle: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quarterlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
  },
  quarterlyItem: {
    alignItems: 'center',
    flex: 1,
  },
  quarterlyValue: {
    color: PF.textSecondary,
    fontSize: 10,
    marginBottom: 4,
  },
  barContainer: {
    justifyContent: 'flex-end',
    height: 48,
  },
  bar: {
    width: 24,
    borderRadius: 4,
  },
  quarterlyLabel: {
    color: PF.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  quarterlyPct: {
    color: PF.textMuted,
    fontSize: 9,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PF.border,
  },
  weightLabel: {
    color: PF.textMuted,
    fontSize: 11,
    width: 100,
  },
  weightBar: {
    flex: 1,
    height: 4,
    backgroundColor: PF.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    borderRadius: 2,
  },
  weightValue: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    width: 42,
    textAlign: 'right',
  },
});
