import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { ShoppingBasket, Shirt, Home, HeartPulse, Car, Phone, Film, BookOpen } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Transaction, COICOPCode } from '@/types/database';
import { formatCurrency } from '@/services/format-helpers';

const COLOR_MAP: Record<COICOPCode, string> = {
  '01': '#4ADE80',
  '02': '#F472B6',
  '03': '#60A5FA',
  '04': '#F87171',
  '05': '#FBBF24',
  '06': '#A78BFA',
  '07': '#FB923C',
  '08': '#34D399',
};

const ICON_MAP: Record<COICOPCode, typeof ShoppingBasket> = {
  '01': ShoppingBasket,
  '02': Shirt,
  '03': Home,
  '04': HeartPulse,
  '05': Car,
  '06': Phone,
  '07': Film,
  '08': BookOpen,
};

const SHORT_LABELS: Record<COICOPCode, string> = {
  '01': 'Alimentation',
  '02': 'Vêtements',
  '03': 'Logement',
  '04': 'Santé',
  '05': 'Transport',
  '06': 'Télécom',
  '07': 'Loisirs',
  '08': 'Éducation',
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  if (!transactions || transactions.length === 0) return null;

  return (
    <View style={[styles.wrapper, { paddingHorizontal: isSmall ? 16 : 24 }]}>
      <Text style={styles.sectionLabel}>Transactions récentes</Text>

      <GlassCard variant="dark">
        {transactions.map((tx, idx) => {
          const color = COLOR_MAP[tx.category] || '#A1A1AA';
          const Icon = ICON_MAP[tx.category] || ShoppingBasket;
          const catLabel = SHORT_LABELS[tx.category] || tx.category;
          const isLast = idx === transactions.length - 1;

          return (
            <View key={tx.id}>
              <View style={styles.row}>
                {/* Category icon */}
                <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                  <Icon size={isSmall ? 16 : 18} color={color} />
                </View>

                {/* Label + category + date */}
                <View style={styles.info}>
                  <Text style={[styles.txLabel, isSmall && { fontSize: 13 }]} numberOfLines={1}>
                    {tx.label}
                  </Text>
                  <Text style={styles.txMeta}>
                    <Text style={[styles.categoryTag, { color }]}>{catLabel}</Text>
                    <Text style={styles.metaDot}> · </Text>
                    {formatShortDate(tx.transaction_date)}
                  </Text>
                </View>

                {/* Amount */}
                <Text style={[styles.amount, isSmall && { fontSize: 14 }]}>
                  -{formatCurrency(tx.amount)}
                </Text>
              </View>

              {!isLast && <View style={styles.separator} />}
            </View>
          );
        })}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  txLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  txMeta: {
    color: '#71717A',
    fontSize: 11,
  },
  categoryTag: {
    fontWeight: '600',
    fontSize: 11,
  },
  metaDot: {
    color: '#3F3F46',
  },
  amount: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 50,
  },
});
