import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { ArrowDownLeft, TrendingUp, TrendingDown } from 'lucide-react-native';

interface WeeklyIncomeCardProps {
  totalActual: number;
  totalExpected: number;
  progressPercent: number;
  isOnTrack: boolean;
}

export function WeeklyIncomeCard({
  totalActual,
  totalExpected,
  progressPercent,
  isOnTrack,
}: WeeklyIncomeCardProps) {
  const { t } = useTranslation('tracking');
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  const barColor = progressPercent >= 100
    ? '#4ADE80'
    : progressPercent >= 60
    ? '#FBBF24'
    : '#F87171';

  const barWidth = Math.min(progressPercent, 100);

  return (
    <GlassCard variant="dark" style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>{t('incomeCard.received')}</Text>
          <Text style={[styles.received, { color: '#4ADE80' }, isSmall && { fontSize: 20 }]}>
            +{formatCurrency(totalActual)}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.label}>{t('incomeCard.expected')}</Text>
          <Text style={[styles.expectedValue, isSmall && { fontSize: 15 }]}>
            {formatCurrency(totalExpected)}
          </Text>
        </View>
      </View>

      {totalExpected > 0 && (
        <>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.statusRow}>
              <ArrowDownLeft size={14} color="#4ADE80" />
              <Text style={styles.statusText}>
                {t('incomeCard.percentReceived', { percent: progressPercent })}
              </Text>
            </View>

            <View style={styles.projectionRow}>
              {isOnTrack ? (
                <TrendingUp size={14} color="#4ADE80" />
              ) : (
                <TrendingDown size={14} color="#F87171" />
              )}
              <Text style={[styles.projectionText, { color: isOnTrack ? '#4ADE80' : '#F87171' }]}>
                {isOnTrack ? t('incomeCard.onTrack') : t('incomeCard.behind')}
              </Text>
            </View>
          </View>
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  label: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  received: {
    fontSize: 24,
    fontWeight: '800',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  expectedValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  barBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
