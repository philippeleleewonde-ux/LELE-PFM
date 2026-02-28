import React, { useState, memo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { AreaFanChart } from '@/components/charts/AreaFanChart';
import { useInvestorStrategy } from '@/hooks/useInvestorStrategy';
import { useCompoundCurve } from '@/hooks/useCompoundCurve';
import { useInvestmentStore } from '@/stores/investment-store';

const HORIZONS = [10, 20, 30] as const;

function MaCourbeInner() {
  const { t } = useTranslation('app');
  const [horizon, setHorizon] = useState<10 | 20 | 30>(10);
  const strategy = useInvestorStrategy();
  const profile = useInvestmentStore((s) => s.investorProfile);
  const capitalInitial = profile?.capitalInitial ?? 0;

  const { fanData, stats } = useCompoundCurve(
    strategy?.monteCarloResult ?? null,
    capitalInitial,
    strategy?.totalMonthlyBudget ?? 0,
    horizon,
  );

  if (!strategy) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('gps.courbe.noStrategy')}</Text>
      </View>
    );
  }

  const formatAmount = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return Math.round(val).toString();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Horizon pills */}
      <View style={styles.horizonRow}>
        {HORIZONS.map((h) => (
          <Pressable
            key={h}
            onPress={() => setHorizon(h)}
            style={[styles.horizonPill, horizon === h && styles.horizonPillActive]}
          >
            <Text style={[styles.horizonText, horizon === h && styles.horizonTextActive]}>
              {t(`gps.courbe.horizon${h}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chart */}
      {fanData.length > 0 && (
        <PerfGlassCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('gps.courbe.title')}</Text>
          <AreaFanChart data={fanData} height={200} medianColor={PF.green} />
          {strategy.tippingPoint && (
            <View style={styles.tippingBadge}>
              <Text style={styles.tippingText}>
                {t('gps.courbe.tippingPoint')}: {Math.floor(strategy.tippingPoint.monthsToReach / 12)} ans
              </Text>
            </View>
          )}
        </PerfGlassCard>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <PerfGlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>{t('gps.courbe.invested')}</Text>
          <Text style={styles.statValue}>{formatAmount(stats.totalInvested)}</Text>
        </PerfGlassCard>
        <PerfGlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>{t('gps.courbe.interests')}</Text>
          <Text style={[styles.statValue, { color: PF.green }]}>{formatAmount(stats.totalInterest)}</Text>
        </PerfGlassCard>
        <PerfGlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>{t('gps.courbe.total')}</Text>
          <Text style={[styles.statValue, { color: PF.accent }]}>{formatAmount(stats.totalValue)}</Text>
        </PerfGlassCard>
      </View>
    </ScrollView>
  );
}

export const MaCourbe = memo(MaCourbeInner);

const styles = StyleSheet.create({
  content: { paddingBottom: 24, gap: 12 },
  empty: { padding: 24 },
  emptyText: { color: PF.textSecondary, fontSize: 14, textAlign: 'center' },
  horizonRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 4 },
  horizonPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: PF.cardBg,
    borderWidth: 1,
    borderColor: PF.border,
  },
  horizonPillActive: { backgroundColor: '#4ADE8020', borderColor: '#4ADE8060' },
  horizonText: { color: PF.textSecondary, fontSize: 12, fontWeight: '600' },
  horizonTextActive: { color: PF.green },
  chartCard: { padding: 12 },
  chartTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  tippingBadge: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FBBF2420',
    borderWidth: 1,
    borderColor: '#FBBF2450',
  },
  tippingText: { color: PF.accent, fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: 12, alignItems: 'center' },
  statLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 4 },
  statValue: { color: PF.textPrimary, fontSize: 16, fontWeight: '700' },
});
