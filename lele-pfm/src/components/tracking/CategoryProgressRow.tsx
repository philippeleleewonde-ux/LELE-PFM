import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBasket,
  Shirt,
  Home,
  HeartPulse,
  Car,
  Phone,
  Film,
  BookOpen,
} from 'lucide-react-native';
import { COICOPCode } from '@/types';
import { formatCurrency } from '@/services/format-helpers';
import { CategoryTracking } from '@/hooks/useWeeklyTracking';

const ICON_MAP: Record<string, typeof ShoppingBasket> = {
  'shopping-basket': ShoppingBasket,
  'shirt': Shirt,
  'home': Home,
  'heart-pulse': HeartPulse,
  'car': Car,
  'phone': Phone,
  'film': Film,
  'book': BookOpen,
};

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

interface CategoryProgressRowProps {
  category: CategoryTracking;
  onPress: () => void;
}

export function CategoryProgressRow({ category, onPress }: CategoryProgressRowProps) {
  const { t } = useTranslation('tracking');
  const Icon = ICON_MAP[category.icon] || ShoppingBasket;
  const color = COLOR_MAP[category.code] || '#A1A1AA';

  const barPercent = Math.min(category.progressPercent, 100);
  const barColor = category.progressPercent > 100
    ? '#F87171'
    : category.progressPercent > 80
    ? '#FBBF24'
    : color;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.label} numberOfLines={1}>{category.label}</Text>
          <Text style={styles.amounts}>
            <Text style={{ color: barColor, fontWeight: '700' }}>
              {formatCurrency(category.weeklySpent)}
            </Text>
            <Text style={{ color: '#52525B' }}> / {formatCurrency(category.weeklyBudget)}</Text>
          </Text>
        </View>

        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${barPercent}%`, backgroundColor: barColor }]} />
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.natureBadge, {
            backgroundColor: category.nature === 'Essentielle'
              ? 'rgba(248,113,113,0.15)'
              : 'rgba(99,102,241,0.15)',
          }]}>
            <Text style={[styles.natureText, {
              color: category.nature === 'Essentielle' ? '#F87171' : '#818CF8',
            }]}>
              {category.nature === 'Essentielle' ? t('category.essential') : t('category.discretionary')}
            </Text>
          </View>
          {category.weeklyTarget > 0 && (
            <Text style={styles.targetHint}>
              Obj. {formatCurrency(category.weeklyTarget)}
            </Text>
          )}
          <Text style={[styles.percent, { color: barColor }]}>
            {category.progressPercent}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  amounts: {
    fontSize: 12,
  },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  natureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  natureText: {
    fontSize: 10,
    fontWeight: '600',
  },
  targetHint: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '600',
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
  },
});
