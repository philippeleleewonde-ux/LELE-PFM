import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react-native';

interface WeeklyProgressCardProps {
  weeklyBudget: number;
  weeklyTarget: number;
  weeklySpent: number;
  weeklyRemaining: number;
  progressPercent: number;
  projectedWeekTotal: number;
  isOnTrack: boolean;
  planYear: 1 | 2 | 3;
  currentQuarter: 1 | 2 | 3 | 4;
}

export function WeeklyProgressCard({
  weeklyBudget,
  weeklyTarget,
  weeklySpent,
  weeklyRemaining,
  progressPercent,
  projectedWeekTotal,
  isOnTrack,
  planYear,
  currentQuarter,
}: WeeklyProgressCardProps) {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  const barColor = progressPercent > 100
    ? '#F87171'
    : progressPercent > 80
    ? '#FBBF24'
    : '#4ADE80';

  const barWidth = Math.min(progressPercent, 100);

  // Economies reelles = Budget - Depense (si positif)
  const actualSavings = Math.max(0, weeklyBudget - weeklySpent);
  const savingsOnTrack = actualSavings >= weeklyTarget;

  return (
    <GlassCard variant="dark" style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Depense</Text>
          <Text style={[styles.spent, { color: barColor }, isSmall && { fontSize: 20 }]}>
            {formatCurrency(weeklySpent)}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.label}>Plafond</Text>
          <Text style={[styles.budgetValue, isSmall && { fontSize: 15 }]}>{formatCurrency(weeklyBudget)}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.remainingRow}>
          <Text style={styles.remainingLabel}>Restant : </Text>
          <Text style={[styles.remainingValue, { color: weeklyRemaining > 0 ? '#4ADE80' : '#F87171' }]}>
            {formatCurrency(weeklyRemaining)}
          </Text>
        </View>

        <View style={styles.projectionRow}>
          {isOnTrack ? (
            <TrendingDown size={14} color="#4ADE80" />
          ) : (
            <TrendingUp size={14} color="#F87171" />
          )}
          <Text style={[styles.projectionText, { color: isOnTrack ? '#4ADE80' : '#F87171' }]}>
            {formatCurrency(projectedWeekTotal)} projete
          </Text>
        </View>
      </View>

      {/* Savings section */}
      {weeklyTarget > 0 && (
        <View style={styles.savingsRow}>
          <View style={styles.savingsDivider} />
          <View style={styles.savingsContent}>
            <PiggyBank size={16} color="#FBBF24" />
            <View style={styles.savingsColumns}>
              <View style={styles.savingsCol}>
                <Text style={styles.savingsColLabel}>Economise</Text>
                <Text style={[styles.savingsColValue, { color: savingsOnTrack ? '#4ADE80' : '#FBBF24' }]}>
                  {formatCurrency(actualSavings)}
                </Text>
              </View>
              <View style={[styles.savingsCol, styles.savingsColRight]}>
                <Text style={styles.savingsColLabel}>Objectif EPR (An{planYear} T{currentQuarter})</Text>
                <Text style={styles.savingsTargetValue}>{formatCurrency(weeklyTarget)}</Text>
              </View>
            </View>
          </View>
          {/* Savings progress bar — uncapped to show bonus above target */}
          <View style={styles.savingsBarBg}>
            <View
              style={[
                styles.savingsBarFill,
                {
                  width: `${Math.min(weeklyTarget > 0 ? (actualSavings / weeklyTarget) * 100 : 0, 100)}%`,
                  backgroundColor: savingsOnTrack ? '#4ADE80' : '#FBBF24',
                },
              ]}
            />
          </View>
          {/* EPR status label */}
          {actualSavings > 0 && (
            <Text style={[styles.eprStatusText, { color: savingsOnTrack ? '#4ADE80' : '#A1A1AA' }]}>
              {savingsOnTrack
                ? `EPR atteint${actualSavings > weeklyTarget ? ` (+${formatCurrency(actualSavings - weeklyTarget)} bonus)` : ''}`
                : `EPR : ${Math.round((actualSavings / weeklyTarget) * 100)}%`
              }
            </Text>
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  label: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  spent: {
    fontSize: 24,
    fontWeight: '800',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  budgetValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  barBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainingLabel: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  remainingValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  savingsRow: {
    marginTop: 8,
  },
  savingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savingsColumns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  savingsCol: {
    flex: 1,
    flexShrink: 1,
  },
  savingsColRight: {
    alignItems: 'flex-end',
  },
  savingsColLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  savingsColValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  savingsTargetValue: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '600',
  },
  savingsBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  savingsBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  eprStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
});
