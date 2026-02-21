import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target } from 'lucide-react-native';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { SavingsGoalCard } from './SavingsGoalCard';
import type { SavingsGoal } from '@/stores/savings-goal-store';

interface SavingsGoalsSectionProps {
  onGoalPress: (goal: SavingsGoal) => void;
  onContribute: (goal: SavingsGoal) => void;
}

export function SavingsGoalsSection({ onGoalPress, onContribute }: SavingsGoalsSectionProps) {
  const { activeGoals, completedGoals } = useSavingsGoals();

  const allGoals = [...activeGoals, ...completedGoals];

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Target size={14} color="#22D3EE" />
        <Text style={styles.sectionTitle}>MES OBJECTIFS</Text>
      </View>

      {allGoals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Target size={32} color="#52525B" />
          <Text style={styles.emptyTitle}>Aucun objectif</Text>
          <Text style={styles.emptyText}>
            Definissez votre premier objectif via le bouton +
          </Text>
        </View>
      ) : (
        <>
          {allGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onPress={() => onGoalPress(goal)}
              onContribute={() => onContribute(goal)}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#71717A',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: '#52525B',
    fontSize: 13,
    textAlign: 'center',
  },
});
