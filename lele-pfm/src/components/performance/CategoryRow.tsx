import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '../charts/ProgressBar';
import { PF, COICOP_COLORS } from './shared';
import { formatPercent } from '@/services/format-helpers';

interface CategoryRowProps {
  code: string;
  label: string;
  budgetRate: number;
  elasticity: number;
  nature: string;
}

export function CategoryRow({ code, label, budgetRate, elasticity, nature }: CategoryRowProps) {
  const { t } = useTranslation('performance');
  const color = COICOP_COLORS[code] || PF.textMuted;
  const isEssential = nature === 'Essentielle';
  const displayNature = isEssential ? t('nature.essential') : t('nature.comfort');

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <Text style={[styles.rate, { color }]}>{formatPercent(budgetRate, 1)}</Text>
      </View>
      <ProgressBar progress={budgetRate} color={color} height={6} />
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: PF.violet + '20' }]}>
          <Text style={[styles.badgeText, { color: PF.violet }]}>
            {t('categoryRow.cashbackPossible', { pct: formatPercent(elasticity, 0) })}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isEssential ? PF.blue + '20' : PF.violet + '20' }]}>
          <Text style={[styles.badgeText, { color: isEssential ? PF.blue : PF.violet }]}>
            {displayNature}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rate: {
    fontSize: 14,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
