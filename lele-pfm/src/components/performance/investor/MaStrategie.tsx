import React, { memo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { useInvestorStrategy } from '@/hooks/useInvestorStrategy';
import { PILLAR_CONFIG } from '@/constants/pillar-mapping';
import { PillarAllocation } from '@/types/investment';

function PillarCard({ alloc }: { alloc: PillarAllocation }) {
  const { t } = useTranslation('app');
  const config = PILLAR_CONFIG[alloc.pillar];

  return (
    <PerfGlassCard style={styles.pillarCard}>
      <View style={styles.pillarHeader}>
        <View style={[styles.pillarIcon, { backgroundColor: config.color + '20' }]}>
          <Text style={[styles.pillarEmoji, { color: config.color }]}>
            {alloc.pillar === 'croissance' ? '🚀' :
             alloc.pillar === 'amortisseur' ? '🛡️' :
             alloc.pillar === 'refuge' ? '🏛️' : '🔒'}
          </Text>
        </View>
        <View style={styles.pillarTitleCol}>
          <Text style={[styles.pillarName, { color: config.color }]}>
            {t(config.labelKey)}
          </Text>
          <Text style={styles.pillarDesc}>{t(config.descKey)}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {t('gps.strategie.target')} {alloc.targetPercent}%
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, alloc.currentPercent / alloc.targetPercent * 100)}%`, backgroundColor: config.color },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {t('gps.strategie.current')} {alloc.currentPercent}%
        </Text>
      </View>

      {/* Products */}
      {alloc.products.slice(0, 3).map((rec, idx) => (
        <View key={idx} style={styles.productRow}>
          <Text style={styles.productName} numberOfLines={1}>{rec.product.name}</Text>
          <Text style={[styles.productReturn, { color: config.color }]}>
            {rec.product.returnRate}%
          </Text>
        </View>
      ))}

      {/* Drift badge */}
      {alloc.drift > 5 && (
        <View style={[styles.driftBadge, { borderColor: '#F8717150' }]}>
          <Text style={styles.driftText}>
            {t('gps.strategie.rebalance')} ({t('gps.strategie.drift')} {alloc.drift.toFixed(1)}%)
          </Text>
        </View>
      )}
    </PerfGlassCard>
  );
}

function MaStrategieInner() {
  const { t } = useTranslation('app');
  const strategy = useInvestorStrategy();

  if (!strategy) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('gps.strategie.noStrategy')}</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* All-Weather badge */}
      <PerfGlassCard style={styles.awCard}>
        <Text style={styles.awLabel}>{t('gps.strategie.allWeatherScore')}</Text>
        <Text style={[styles.awScore, { color: strategy.allWeatherScore >= 60 ? PF.green : PF.accent }]}>
          {Math.round(strategy.allWeatherScore)}/100
        </Text>
      </PerfGlassCard>

      {/* 4 Pillar cards */}
      {strategy.pillars.map((alloc) => (
        <PillarCard key={alloc.pillar} alloc={alloc} />
      ))}

      {/* Rebalance button */}
      {strategy.needsRebalance && (
        <Pressable style={styles.rebalanceBtn}>
          <Text style={styles.rebalanceBtnText}>{t('gps.strategie.rebalance')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

export const MaStrategie = memo(MaStrategieInner);

const styles = StyleSheet.create({
  content: { paddingBottom: 24, gap: 12 },
  empty: { padding: 24 },
  emptyText: { color: PF.textSecondary, fontSize: 14, textAlign: 'center' },
  awCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  awLabel: { color: PF.textSecondary, fontSize: 13, fontWeight: '600' },
  awScore: { fontSize: 22, fontWeight: '800' },
  pillarCard: { padding: 14, gap: 10 },
  pillarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pillarIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  pillarEmoji: { fontSize: 18 },
  pillarTitleCol: { flex: 1 },
  pillarName: { fontSize: 14, fontWeight: '700' },
  pillarDesc: { color: PF.textMuted, fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', width: 60 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: 6, borderRadius: 3 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  productName: { color: PF.textSecondary, fontSize: 12, flex: 1, marginRight: 8 },
  productReturn: { fontSize: 12, fontWeight: '700' },
  driftBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#F8717110',
  },
  driftText: { color: '#F87171', fontSize: 10, fontWeight: '600' },
  rebalanceBtn: {
    backgroundColor: PF.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  rebalanceBtnText: { color: '#0F1014', fontSize: 15, fontWeight: '700' },
});
