import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { useWeeklyEvolution } from '@/hooks/useWeeklyEvolution';

export function MonthlyBilanCard() {
  const { t } = useTranslation('app');
  const { monthly } = useWeeklyEvolution();

  if (monthly.monthWeeksCount === 0) return null;

  const {
    monthLabel,
    monthAvgScore,
    prevMonthLabel,
    prevMonthAvgScore,
    monthTotalSavings,
    monthBudgetRespectRate,
    monthWeeksCount,
    monthTrend,
    monthScoreDelta,
  } = monthly;

  // Budget respect: count weeks with budget respected
  const budgetRespectWeeks = Math.round((monthBudgetRespectRate / 100) * monthWeeksCount);

  // Comparison text for score
  const comparisonText =
    prevMonthAvgScore !== null
      ? `(vs ${prevMonthLabel}: ${prevMonthAvgScore} ${monthAvgScore !== null && monthAvgScore >= prevMonthAvgScore ? '\u2191' : '\u2193'})`
      : null;

  // Trend config
  const trendConfig = {
    up: { Icon: TrendingUp, color: '#4ADE80', text: t('evolution.trendProgressUp') },
    down: { Icon: TrendingDown, color: '#F87171', text: t('evolution.trendProgressDown') },
    stable: { Icon: Minus, color: '#A1A1AA', text: t('evolution.trendStable') },
  };
  const trend = trendConfig[monthTrend];

  // Delta text
  const deltaText =
    monthScoreDelta !== null && monthScoreDelta !== 0
      ? monthScoreDelta > 0
        ? t('evolution.gainedPoints', { delta: monthScoreDelta })
        : t('evolution.lostPoints', { delta: monthScoreDelta })
      : null;

  const deltaColor = monthScoreDelta !== null && monthScoreDelta > 0 ? '#4ADE80' : '#F87171';

  return (
    <GlassCard variant="dark" style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <CalendarDays size={18} color="#FBBF24" />
        <Text style={styles.headerTitle}>{t('evolution.bilanHeader', { month: monthLabel.toUpperCase() })}</Text>
      </View>

      {/* ── Metric rows ── */}
      <View style={styles.metricsContainer}>
        {/* Score moyen */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('evolution.avgScore')}</Text>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>
              {monthAvgScore !== null ? monthAvgScore : '--'}
            </Text>
            {comparisonText && (
              <Text style={styles.metricComparison}>{comparisonText}</Text>
            )}
          </View>
        </View>

        {/* Epargne totale */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('evolution.totalSavings')}</Text>
          <Text
            style={[
              styles.metricValue,
              { color: monthTotalSavings >= 0 ? '#4ADE80' : '#F87171' },
            ]}
          >
            {formatCurrency(monthTotalSavings)}
          </Text>
        </View>

        {/* Budget respecte */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('evolution.budgetRespected')}</Text>
          <Text style={styles.metricValue}>
            {t('evolution.weeksCount', { count: budgetRespectWeeks, total: monthWeeksCount, percent: monthBudgetRespectRate })}
          </Text>
        </View>

        {/* Tendance */}
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('evolution.trend')}</Text>
          <View style={styles.trendRow}>
            <trend.Icon size={14} color={trend.color} />
            <Text style={[styles.trendText, { color: trend.color }]}>
              {trend.text}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Delta footer ── */}
      {deltaText && (
        <View style={styles.deltaContainer}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {deltaText}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

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
  headerTitle: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metricsContainer: {
    gap: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '700',
  },
  metricComparison: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '500',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deltaContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
