import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react-native';
import { Transaction } from '@/types';
import { formatCurrency } from '@/services/format-helpers';

interface DailyTransactionRowProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export function DailyTransactionRow({ transaction, onDelete }: DailyTransactionRowProps) {
  const { t } = useTranslation('app');
  const d = new Date(transaction.transaction_date);
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
  const dateLabel = `${t(`days.${dayKeys[d.getDay()]}`)} ${d.getDate()} ${t(`months.${monthKeys[d.getMonth()]}`)}`;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.label} numberOfLines={1}>{transaction.label}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(transaction.amount)}</Text>
        <Pressable onPress={() => onDelete(transaction.id)} style={styles.deleteBtn}>
          <Trash2 size={16} color="#F87171" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  date: {
    color: '#52525B',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amount: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(248,113,113,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
