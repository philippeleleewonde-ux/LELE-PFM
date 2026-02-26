import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { INCOME_CATEGORIES } from '@/constants/income-categories';
import { formatCurrency } from '@/services/format-helpers';
import { IncomeSourceTracking } from '@/hooks/useWeeklyIncome';

interface IncomeProgressRowProps {
  source: IncomeSourceTracking;
  onPress: () => void;
}

export function IncomeProgressRow({ source, onPress }: IncomeProgressRowProps) {
  const { t } = useTranslation('tracking');
  const config = INCOME_CATEGORIES[source.code];
  const Icon = config.icon;
  const color = config.color;

  // For income: more = better, so green when >= expected
  const barPercent = Math.min(source.progressPercent, 100);
  const barColor = source.progressPercent >= 100
    ? '#4ADE80'
    : source.progressPercent >= 60
    ? '#FBBF24'
    : '#F87171';

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.label} numberOfLines={1}>{t(source.label)}</Text>
          <Text style={styles.amounts}>
            <Text style={{ color: '#4ADE80', fontWeight: '700' }}>
              +{formatCurrency(source.weeklyActual)}
            </Text>
            {source.weeklyExpected > 0 && (
              <Text style={{ color: '#52525B' }}> / {formatCurrency(source.weeklyExpected)}</Text>
            )}
          </Text>
        </View>

        {source.weeklyExpected > 0 && (
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${barPercent}%`, backgroundColor: barColor }]} />
          </View>
        )}

        <View style={styles.bottomRow}>
          <View style={[styles.typeBadge, {
            backgroundColor: config.type === 'Fixe'
              ? 'rgba(96,165,250,0.15)'
              : 'rgba(251,191,36,0.15)',
          }]}>
            <Text style={[styles.typeText, {
              color: config.type === 'Fixe' ? '#60A5FA' : '#FBBF24',
            }]}>
              {t(`types.${config.type}`)}
            </Text>
          </View>
          {source.weeklyExpected > 0 && (
            <Text style={[styles.percent, { color: barColor }]}>
              {source.progressPercent}%
            </Text>
          )}
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
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
  },
});
