import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTransactionStore } from '@/stores/transaction-store';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { GOAL_CATEGORIES, type GoalIcon } from '@/constants/goal-categories';
import { formatCurrency } from '@/services/format-helpers';
import { GlassCard } from '@/components/ui/GlassCard';

export function GoalExpensesSection() {
  const { t } = useTranslation('tracking');
  const transactions = useTransactionStore((s) => s.transactions);
  const goals = useSavingsGoalStore((s) => s.goals);

  const goalExpenses = useMemo(() => {
    const expenses = transactions.filter((tx) => tx.isGoalExpense);
    if (expenses.length === 0) return [];

    // Build a map of goalId → goal for quick lookup
    const goalMap = new Map(goals.map((g) => [g.id, g]));

    return expenses.map((tx) => {
      const goal = tx.goalId ? goalMap.get(tx.goalId) : undefined;
      const iconCode: GoalIcon = goal?.icon ?? 'autre';
      const category = GOAL_CATEGORIES[iconCode];
      const GoalIcon = category.icon;

      const d = new Date(tx.transaction_date);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

      return {
        id: tx.id,
        goalName: goal?.name ?? tx.label,
        label: tx.label,
        amount: tx.amount,
        date: dateStr,
        icon: GoalIcon,
        color: category.color,
      };
    });
  }, [transactions, goals]);

  if (goalExpenses.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <ShoppingBag size={14} color="#4ADE80" />
        <Text style={styles.sectionTitle}>{t('goalExpenses.title')}</Text>
      </View>

      <GlassCard variant="dark" style={styles.card}>
        {goalExpenses.map((expense, idx) => {
          const Icon = expense.icon;
          return (
            <React.Fragment key={expense.id}>
              <View style={styles.row}>
                <View style={[styles.iconContainer, { backgroundColor: `${expense.color}20` }]}>
                  <Icon size={16} color={expense.color} />
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text style={styles.goalName} numberOfLines={1}>{expense.goalName}</Text>
                    <Text style={styles.date}>{expense.date}</Text>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text style={styles.label} numberOfLines={1}>{expense.label}</Text>
                    <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
                  </View>
                </View>
              </View>
              {idx < goalExpenses.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </GlassCard>
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
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  goalName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  date: {
    color: '#52525B',
    fontSize: 11,
    fontWeight: '500',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#71717A',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  amount: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
  },
});
