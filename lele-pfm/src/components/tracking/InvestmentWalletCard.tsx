import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TrendingUp, PieChart, Calculator } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { useInvestmentStore } from '@/stores/investment-store';
import { useEngineStore } from '@/stores/engine-store';
import { formatCurrency } from '@/services/format-helpers';
import { portfolioReturn, simulateInvestment } from '@/domain/calculators/investment-simulator';
import { InvestmentSimulatorSheet } from '@/components/investment/InvestmentSimulatorSheet';

export function InvestmentWalletCard() {
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const allocations = useInvestmentStore((s) => s.allocations);
  const totalInvested = useInvestmentStore((s) => s.getTotalInvested)();
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const [showSimulator, setShowSimulator] = useState(false);

  const annualReturn = useMemo(() => portfolioReturn(allocations), [allocations]);

  // Compute monthly invest dynamically from EPR × ratio
  const monthlyInvest = useMemo(() => {
    if (!engineOutput || !investorProfile) return 0;
    return engineOutput.step9.epr_n1 * investorProfile.investmentRatio / 100 / 12;
  }, [engineOutput, investorProfile]);

  const projections = useMemo(() => {
    if (monthlyInvest <= 0 || annualReturn <= 0) return null;
    return {
      p12: simulateInvestment(monthlyInvest, annualReturn, 0, 12, 0),
      p36: simulateInvestment(monthlyInvest, annualReturn, 0, 36, 0),
    };
  }, [monthlyInvest, annualReturn]);

  if (!investorProfile || !engineOutput) return null;
  const returns12m = projections?.p12[11]?.returns ?? 0;
  const returns36m = projections?.p36[35]?.returns ?? 0;

  // Allocation breakdown for mini pie
  const topAllocations = allocations.slice(0, 3);

  return (
    <>
      <GlassCard variant="dark" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <TrendingUp size={16} color="#FBBF24" />
          </View>
          <Text style={styles.title}>Mon portefeuille</Text>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.mainStat}>
            <Text style={styles.mainLabel}>Capital investi</Text>
            <Text style={styles.mainValue}>{formatCurrency(totalInvested)}</Text>
          </View>
          <View style={styles.mainStat}>
            <Text style={styles.mainLabel}>Rendement</Text>
            <Text style={[styles.mainValue, { color: '#4ADE80' }]}>
              {annualReturn.toFixed(1)}%/an
            </Text>
          </View>
        </View>

        <View style={styles.projRow}>
          <View style={styles.projItem}>
            <Text style={styles.projLabel}>+12 mois</Text>
            <Text style={[styles.projValue, { color: '#4ADE80' }]}>
              +{formatCurrency(returns12m)}
            </Text>
          </View>
          <View style={styles.projItem}>
            <Text style={styles.projLabel}>+36 mois</Text>
            <Text style={[styles.projValue, { color: '#22D3EE' }]}>
              +{formatCurrency(returns36m)}
            </Text>
          </View>
        </View>

        {/* Mini allocation breakdown */}
        {topAllocations.length > 0 && (
          <View style={styles.allocRow}>
            {topAllocations.map((a) => (
              <View key={a.product.code} style={styles.allocItem}>
                <View style={[styles.allocDot, { backgroundColor: getAllocColor(a.product.riskLevel) }]} />
                <Text style={styles.allocName} numberOfLines={1}>{a.product.name}</Text>
                <Text style={styles.allocWeight}>{a.weight}%</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={() => setShowSimulator(true)} style={styles.simButton}>
          <Calculator size={14} color="#FBBF24" />
          <Text style={styles.simText}>Simuler</Text>
        </Pressable>
      </GlassCard>

      <InvestmentSimulatorSheet
        visible={showSimulator}
        onClose={() => setShowSimulator(false)}
      />
    </>
  );
}

function getAllocColor(riskLevel: number): string {
  switch (riskLevel) {
    case 1: return '#4ADE80';
    case 2: return '#60A5FA';
    case 3: return '#FBBF24';
    case 4: return '#FB923C';
    case 5: return '#F87171';
    default: return '#A1A1AA';
  }
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#FBBF2420', justifyContent: 'center', alignItems: 'center',
  },
  title: { color: '#E4E4E7', fontSize: 14, fontWeight: '700', flex: 1 },
  mainRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  mainStat: { alignItems: 'center' },
  mainLabel: { color: '#71717A', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  mainValue: { color: '#E4E4E7', fontSize: 16, fontWeight: '800' },
  projRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  projItem: { alignItems: 'center' },
  projLabel: { color: '#52525B', fontSize: 10, fontWeight: '600' },
  projValue: { fontSize: 13, fontWeight: '700' },
  allocRow: { gap: 4, marginBottom: 10 },
  allocItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  allocDot: { width: 6, height: 6, borderRadius: 3 },
  allocName: { color: '#A1A1AA', fontSize: 11, flex: 1 },
  allocWeight: { color: '#E4E4E7', fontSize: 11, fontWeight: '700' },
  simButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(251,189,35,0.2)', backgroundColor: 'rgba(251,189,35,0.05)',
  },
  simText: { color: '#FBBF24', fontSize: 13, fontWeight: '600' },
});
