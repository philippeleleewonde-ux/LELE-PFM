import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import { analyzePortfolioKelly, PositionSizeResult } from '@/domain/calculators/kelly-criterion';

function getStatusColor(status: PositionSizeResult['status']): string {
  switch (status) {
    case 'optimal': return PF.green;
    case 'overweight': return PF.orangeDark;
    case 'underweight': return PF.blue;
  }
}

function getStatusLabel(status: PositionSizeResult['status']): string {
  switch (status) {
    case 'optimal': return '\u2713 Optimal';
    case 'overweight': return '\u2191 Surpondere';
    case 'underweight': return '\u2193 Sous-pondere';
  }
}

export function SectionQ_KellyCriterion() {
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const positions = useMemo(() => {
    if (allocations.length === 0) return [];
    return analyzePortfolioKelly(allocations);
  }, [allocations]);

  if (!investorProfile || positions.length === 0) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          Configurez votre profil investisseur et vos allocations pour voir le dimensionnement Kelly.
        </Text>
      </PerfGlassCard>
    );
  }

  const maxKelly = Math.max(...positions.map((p) => p.kellyOptimal));
  const optimalCount = positions.filter((p) => p.status === 'optimal').length;

  return (
    <View style={styles.container}>
      {/* Position sizing table */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Dimensionnement par position</Text>
        <View style={styles.positionList}>
          {positions.map((pos) => {
            const statusColor = getStatusColor(pos.status);
            const barMax = Math.max(pos.currentWeight, pos.kellyOptimal, 1);
            const currentBarWidth = (pos.currentWeight / barMax) * 100;
            const kellyBarWidth = (pos.kellyOptimal / barMax) * 100;

            return (
              <View key={pos.productCode} style={styles.positionRow}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionName} numberOfLines={1}>{pos.assetName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {getStatusLabel(pos.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.weightsRow}>
                  <Text style={styles.weightLabel}>
                    {pos.currentWeight}%
                  </Text>
                  <Text style={styles.arrow}>{'\u2192'}</Text>
                  <Text style={[styles.weightValue, { color: statusColor }]}>
                    {pos.kellyOptimal}%
                  </Text>
                  {pos.delta !== 0 && (
                    <Text style={[styles.deltaText, { color: pos.delta > 0 ? PF.orangeDark : PF.blue }]}>
                      ({pos.delta > 0 ? '+' : ''}{pos.delta})
                    </Text>
                  )}
                </View>

                {/* Comparison bars */}
                <View style={styles.barContainer}>
                  <View style={styles.barRow}>
                    <Text style={styles.barLabel}>Actuel</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${currentBarWidth}%`, backgroundColor: PF.textMuted }]} />
                    </View>
                  </View>
                  <View style={styles.barRow}>
                    <Text style={styles.barLabel}>Kelly</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${kellyBarWidth}%`, backgroundColor: statusColor }]} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Kelly max/position</Text>
              <Text style={[styles.summaryValue, { color: PF.accent }]}>{maxKelly}%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Positions optimales</Text>
              <Text style={[styles.summaryValue, { color: PF.green }]}>
                {optimalCount}/{positions.length}
              </Text>
            </View>
          </View>
        </View>
      </PerfGlassCard>

      {/* Explanation card */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.infoText}>
          Le critere de Kelly calcule la taille optimale de chaque position
          pour maximiser la croissance a long terme sans risque de ruine.
          Le demi-Kelly est recommande pour plus de securite.
        </Text>
      </PerfGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  sectionTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: PF.textMuted, fontSize: 13, textAlign: 'center' },
  positionList: { gap: 12 },
  positionRow: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  positionName: { color: PF.textSecondary, fontSize: 12, flex: 1, marginRight: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  weightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  weightLabel: { color: PF.textMuted, fontSize: 13, fontWeight: '600' },
  arrow: { color: PF.textMuted, fontSize: 12 },
  weightValue: { fontSize: 13, fontWeight: '800' },
  deltaText: { fontSize: 11, fontWeight: '600' },
  barContainer: { gap: 3 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { color: PF.textMuted, fontSize: 9, fontWeight: '600', width: 36, textTransform: 'uppercase' },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  barFill: { height: 4, borderRadius: 2 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: PF.border,
    paddingTop: 10,
    marginTop: 2,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  infoText: { color: PF.textSecondary, fontSize: 12, lineHeight: 18 },
});
