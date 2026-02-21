import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { PiggyBank, Wallet, ChevronRight, Banknote } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { useSavingsWallet } from '@/hooks/useSavingsWallet';
import { SavingsDetailSheet } from './SavingsDetailSheet';

export function SavingsWalletCard() {
  const wallet = useSavingsWallet();
  const [showDetail, setShowDetail] = useState(false);
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  if (wallet.nbSemainesTotal === 0) return null;

  const isPositive = wallet.allTimeNet >= 0;

  return (
    <>
      <Pressable onPress={() => setShowDetail(true)}>
        <GlassCard variant="neon" style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <PiggyBank size={20} color="#FBBF24" />
            <Text style={styles.headerTitle}>MA TIRELIRE</Text>
            <ChevronRight size={16} color="#52525B" />
          </View>

          {/* Big Total */}
          <Text style={[styles.bigTotal, { color: isPositive ? '#4ADE80' : '#F87171' }, isSmall && { fontSize: 22 }]}>
            {isPositive ? '+' : ''}{formatCurrency(wallet.allTimeNet)}
          </Text>
          <Text style={styles.bigSubtitle}>
            {isPositive ? 'economises au total' : 'en depassement net'}
          </Text>

          {/* Non depense (real unspent money) */}
          {wallet.allTimeNonDepense > 0 && (
            <View style={[styles.nonDepenseRow, isSmall && { paddingHorizontal: 10 }]}>
              <Banknote size={14} color="#60A5FA" />
              <Text style={styles.nonDepenseLabel}>Argent non depense</Text>
              <Text style={styles.nonDepenseValue}>
                {formatCurrency(wallet.allTimeNonDepense)}
              </Text>
            </View>
          )}

          {/* Distribution Blocks (from capped economies) */}
          {wallet.allTimeEconomies > 0 && (
            <View style={styles.distRow}>
              <View style={styles.distBlock}>
                <PiggyBank size={14} color="#4ADE80" />
                <Text style={styles.distLabel}>EPARGNE</Text>
                <Text style={[styles.distValue, { color: '#4ADE80' }]}>
                  {formatCurrency(wallet.allTimeEpargne)}
                </Text>
                <Text style={styles.distPercent}>67%</Text>
              </View>
              <View style={styles.distBlock}>
                <Wallet size={14} color="#A78BFA" />
                <Text style={styles.distLabel}>PLAISIR</Text>
                <Text style={[styles.distValue, { color: '#A78BFA' }]}>
                  {formatCurrency(wallet.allTimeDiscretionnaire)}
                </Text>
                <Text style={styles.distPercent}>33%</Text>
              </View>
            </View>
          )}

          {/* Detail rows */}
          <View style={styles.detailSection}>
            <View style={styles.detailDivider} />
            <DetailRow label="Cette semaine" value={wallet.currentWeekEconomies} isSmall={isSmall} />
            <DetailRow label="Ce mois" value={wallet.currentMonthEconomies} isSmall={isSmall} />
            <DetailRow label="Cette annee" value={wallet.currentYearEconomies} isSmall={isSmall} />
            <DetailRow label="Depuis le debut" value={wallet.allTimeNet} highlight isSmall={isSmall} />
          </View>
        </GlassCard>
      </Pressable>

      <SavingsDetailSheet
        visible={showDetail}
        wallet={wallet}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}

function DetailRow({ label, value, highlight, isSmall }: { label: string; value: number; highlight?: boolean; isSmall?: boolean }) {
  const color = value >= 0 ? '#4ADE80' : '#F87171';
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, highlight && styles.detailLabelHighlight, isSmall && { fontSize: 12 }]}>{label}</Text>
      <View style={styles.detailRight}>
        <Text style={[styles.detailValue, { color }, highlight && styles.detailValueHighlight, isSmall && { fontSize: 12 }]}>
          {value >= 0 ? '+' : ''}{formatCurrency(value)}
        </Text>
        <ChevronRight size={12} color="#52525B" />
      </View>
    </View>
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
    marginBottom: 16,
  },
  headerTitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  bigTotal: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 2,
  },
  bigSubtitle: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  nonDepenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.15)',
  },
  nonDepenseLabel: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  nonDepenseValue: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '800',
  },
  distRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  distBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  distLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  distValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  distPercent: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '600',
  },
  detailSection: {
    gap: 0,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '500',
  },
  detailLabelHighlight: {
    color: '#E4E4E7',
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
  },
});
