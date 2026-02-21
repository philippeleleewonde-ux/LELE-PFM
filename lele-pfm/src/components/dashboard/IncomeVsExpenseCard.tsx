import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { useIncomeStore } from '@/stores/income-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { getCurrentWeek } from '@/utils/week-helpers';

export function IncomeVsExpenseCard() {
  const router = useRouter();
  const { week, year } = getCurrentWeek();
  const incomeTotal = useIncomeStore((s) => s.getWeekTotal(week, year));
  const expenseTotal = useTransactionStore((s) => s.getWeekTotal(week, year));
  const balance = incomeTotal - expenseTotal;

  // Don't show if no data at all
  if (incomeTotal === 0 && expenseTotal === 0) return null;

  return (
    <Pressable onPress={() => router.push('/(tabs)/transactions')}>
      <GlassCard variant="dark" style={styles.card}>
        <View style={styles.columns}>
          {/* Income column */}
          <View style={styles.column}>
            <View style={styles.iconRow}>
              <ArrowDownLeft size={14} color="#4ADE80" />
              <Text style={styles.columnLabel}>Rentrees</Text>
            </View>
            <Text style={[styles.columnValue, { color: '#4ADE80' }]}>
              +{formatCurrency(incomeTotal)}
            </Text>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Expense column */}
          <View style={styles.column}>
            <View style={styles.iconRow}>
              <ArrowUpRight size={14} color="#FBBF24" />
              <Text style={styles.columnLabel}>Depenses</Text>
            </View>
            <Text style={[styles.columnValue, { color: '#FBBF24' }]}>
              -{formatCurrency(expenseTotal)}
            </Text>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Solde net</Text>
            <Text style={[styles.balanceValue, { color: balance >= 0 ? '#4ADE80' : '#F87171' }]}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  columnLabel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  balanceRow: {
    marginTop: 10,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
