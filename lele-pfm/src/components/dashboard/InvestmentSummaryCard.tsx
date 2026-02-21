import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TrendingUp, ArrowUpRight } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { useInvestmentStore } from '@/stores/investment-store';
import { useEngineStore } from '@/stores/engine-store';
import { formatCurrency } from '@/services/format-helpers';
import { portfolioReturn, simulateInvestment } from '@/domain/calculators/investment-simulator';

interface Props {
  onPress?: () => void;
}

export function InvestmentSummaryCard({ onPress }: Props) {
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const totalInvested = useInvestmentStore((s) => s.getTotalInvested)();

  const estimatedReturn = useMemo(() => portfolioReturn(allocations), [allocations]);

  // Compute monthly invest dynamically from EPR × ratio
  const monthlyInvest = useMemo(() => {
    if (!engineOutput || !investorProfile) return 0;
    return engineOutput.step9.epr_n1 * investorProfile.investmentRatio / 100 / 12;
  }, [engineOutput, investorProfile]);

  // Projected returns at 12 months
  const returns12m = useMemo(() => {
    if (monthlyInvest <= 0 || estimatedReturn <= 0) return 0;
    const proj = simulateInvestment(monthlyInvest, estimatedReturn, 0, 12, 0);
    return proj[11]?.returns ?? 0;
  }, [monthlyInvest, estimatedReturn]);

  if (!investorProfile || !engineOutput) return null;

  return (
    <Pressable onPress={onPress}>
      <GlassCard variant="dark" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <TrendingUp size={16} color="#FBBF24" />
          </View>
          <Text style={styles.title}>Portefeuille investissement</Text>
          {onPress && <ArrowUpRight size={16} color="#A1A1AA" />}
        </View>

        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Investi</Text>
            <Text style={styles.statValue}>{formatCurrency(totalInvested)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Rendement estimé</Text>
            <Text style={[styles.statValue, { color: '#4ADE80' }]}>
              {estimatedReturn.toFixed(1)}%/an
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Objectif/mois</Text>
            <Text style={styles.statValue}>{formatCurrency(monthlyInvest)}</Text>
          </View>
        </View>

        {/* Monthly progress bar */}
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(
                  monthlyInvest > 0 ? (totalInvested / monthlyInvest) * 100 : 0,
                  100,
                )}%`,
              },
            ]}
          />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FBBF2420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#E4E4E7', fontSize: 13, fontWeight: '700', flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stat: { alignItems: 'center' },
  statLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: { color: '#E4E4E7', fontSize: 14, fontWeight: '700' },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#FBBF24',
  },
});
