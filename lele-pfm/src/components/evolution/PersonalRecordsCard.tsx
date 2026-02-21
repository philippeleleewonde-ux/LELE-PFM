/**
 * PersonalRecordsCard -- Affiche les records personnels (meilleur score,
 * meilleure epargne, meilleure note, plus longue serie budget) et le
 * prochain palier de score a atteindre.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Trophy, Star, PiggyBank, Award, Target } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { useWeeklyEvolution } from '@/hooks/useWeeklyEvolution';

// ─── Record row config ───

interface RecordRowDef {
  key: string;
  icon: React.ElementType;
  color: string;
  getLabel: () => string;
  getValue: (
    records: ReturnType<typeof useWeeklyEvolution>['records'],
    streaks: ReturnType<typeof useWeeklyEvolution>['streaks'],
  ) => string | null;
}

const RECORD_ROWS: RecordRowDef[] = [
  {
    key: 'bestScore',
    icon: Star,
    color: '#FFD700',
    getLabel: () => 'Meilleur score',
    getValue: (records) =>
      records.bestScore
        ? `${Math.round(records.bestScore.value)} (Sem. ${records.bestScore.week})`
        : null,
  },
  {
    key: 'bestSavings',
    icon: PiggyBank,
    color: '#4ADE80',
    getLabel: () => 'Meilleure epargne',
    getValue: (records) =>
      records.bestSavings
        ? `${formatCurrency(records.bestSavings.value)} (S.${records.bestSavings.week})`
        : null,
  },
  {
    key: 'bestNote',
    icon: Award,
    color: '#FFD700',
    getLabel: () => 'Meilleure note',
    getValue: (records) =>
      records.bestNote
        ? `${records.bestNote.value}/10 (S.${records.bestNote.week})`
        : null,
  },
  {
    key: 'bestBudgetStreak',
    icon: Trophy,
    color: '#4ADE80',
    getLabel: () => 'Plus longue serie',
    getValue: (_records, streaks) =>
      streaks.bestBudgetStreak > 0
        ? `${streaks.bestBudgetStreak} semaine${streaks.bestBudgetStreak > 1 ? 's' : ''}`
        : null,
  },
];

// ─── Component ───

export function PersonalRecordsCard() {
  const { records, streaks, hasData } = useWeeklyEvolution();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim]);

  if (!hasData) {
    return null;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <GlassCard variant="dark" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Trophy size={18} color="#FFD700" />
          <Text style={styles.headerLabel}>RECORDS PERSONNELS</Text>
        </View>

        {/* Record rows */}
        <View style={styles.rowsContainer}>
          {RECORD_ROWS.map((row) => {
            const Icon = row.icon;
            const valueStr = row.getValue(records, streaks);

            if (!valueStr) return null;

            return (
              <View key={row.key} style={styles.recordRow}>
                <View style={[styles.iconBox, { backgroundColor: row.color + '20' }]}>
                  <Icon size={16} color={row.color} />
                </View>
                <View style={styles.recordContent}>
                  <Text style={styles.recordLabel}>{row.getLabel()}</Text>
                  <Text style={[styles.recordValue, { color: row.color }]}>
                    {valueStr}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Next milestone section */}
        {records.nextScoreMilestone > 0 && (
          <View style={styles.milestoneSection}>
            <View style={styles.milestoneRow}>
              <Target size={15} color="#22D3EE" />
              <Text style={styles.milestoneText}>
                Prochain palier : Score {records.nextScoreMilestone}
              </Text>
            </View>
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  card: {
    // No outer margins — placed inside a CollapsibleSection
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#71717A',
    textTransform: 'uppercase',
  },
  rowsContainer: {
    gap: 12,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E4E4E7',
  },
  recordValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  milestoneSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(34, 211, 238, 0.3)',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22D3EE',
  },
});
