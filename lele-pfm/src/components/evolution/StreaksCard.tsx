/**
 * StreaksCard -- Affiche les series actives (budget, epargne, score)
 * et le record personnel de la plus longue serie budget.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Flame, Trophy } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWeeklyEvolution } from '@/hooks/useWeeklyEvolution';

// ─── Streak row config ───

interface StreakRowDef {
  key: string;
  color: string;
  label: (n: number) => string;
  getValue: (streaks: {
    budgetStreak: number;
    savingsStreak: number;
    scoreAbove60Streak: number;
  }) => number;
}

const STREAK_ROWS: StreakRowDef[] = [
  {
    key: 'budget',
    color: '#4ADE80',
    label: (n) => `${n} semaine${n > 1 ? 's' : ''} budget respecte`,
    getValue: (s) => s.budgetStreak,
  },
  {
    key: 'savings',
    color: '#60A5FA',
    label: (n) => `${n} semaine${n > 1 ? 's' : ''} epargne positive`,
    getValue: (s) => s.savingsStreak,
  },
  {
    key: 'score',
    color: '#FBBF24',
    label: (n) => `${n} semaine${n > 1 ? 's' : ''} score > 60`,
    getValue: (s) => s.scoreAbove60Streak,
  },
];

// ─── Component ───

export function StreaksCard() {
  const { streaks, totalWeeks, hasData } = useWeeklyEvolution();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim]);

  // Guard: nothing to show
  if (!hasData || totalWeeks < 2) {
    return null;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <GlassCard variant="dark" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Flame size={18} color="#FB923C" />
          <Text style={styles.headerLabel}>SERIES EN COURS</Text>
        </View>

        {/* Streak rows */}
        <View style={styles.rowsContainer}>
          {STREAK_ROWS.map((row) => {
            const value = row.getValue(streaks);
            const isMuted = value === 0;

            return (
              <View key={row.key} style={styles.streakRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isMuted ? '#71717A' : row.color },
                  ]}
                />
                <Text
                  style={[
                    styles.streakText,
                    isMuted && styles.streakTextMuted,
                  ]}
                >
                  {row.label(value)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Record section */}
        {streaks.bestBudgetStreak > 0 && (
          <View style={styles.recordSection}>
            <View style={styles.recordRow}>
              <Trophy size={14} color="#FFD700" />
              <Text style={styles.recordText}>
                Record : {streaks.bestBudgetStreak} semaine
                {streaks.bestBudgetStreak > 1 ? 's' : ''} (budget)
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
    marginHorizontal: 16,
    marginBottom: 12,
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
    gap: 10,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E4E4E7',
  },
  streakTextMuted: {
    color: '#71717A',
  },
  recordSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
});
