import React, { useState, memo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useInvestmentStore } from '@/stores/investment-store';
import { useEngineStore } from '@/stores/engine-store';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { MaCourbe } from './MaCourbe';
import { MaStrategie } from './MaStrategie';
import { MaMission } from './MaMission';
import { MonSimulateur } from './MonSimulateur';

const TABS = ['courbe', 'strategie', 'mission', 'simulateur'] as const;

function InvestorGPSInner() {
  const { t } = useTranslation('app');
  const [activeTab, setActiveTab] = useState(0);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const engineOutput = useEngineStore((s) => s.engineOutput);

  // Gate: no engine output
  if (!engineOutput) {
    return (
      <View style={styles.emptyContainer}>
        <PerfGlassCard>
          <Text style={styles.emptyTitle}>{t('gps.completeDiagnosis')}</Text>
        </PerfGlassCard>
      </View>
    );
  }

  // Gate: no profile or incomplete
  if (!investorProfile) {
    return (
      <View style={styles.emptyContainer}>
        <PerfGlassCard>
          <Text style={styles.emptyTitle}>{t('gps.completeProfile')}</Text>
        </PerfGlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Horizontal pills */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
        {TABS.map((tab, idx) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(idx)}
            style={[
              styles.pill,
              activeTab === idx && styles.pillActive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                activeTab === idx && styles.pillTextActive,
              ]}
            >
              {t(`gps.tabs.${tab}`)}
            </Text>
          </Pressable>
        ))}
        </ScrollView>
      </View>

      {/* Active sub-screen */}
      <View style={styles.screenContainer}>
        {activeTab === 0 && <MaCourbe />}
        {activeTab === 1 && <MaStrategie />}
        {activeTab === 2 && <MaMission />}
        {activeTab === 3 && <MonSimulateur />}
      </View>
    </View>
  );
}

export const InvestorGPS = memo(InvestorGPSInner);

const styles = StyleSheet.create({
  container: { flex: 1 },
  pillsWrapper: { flexGrow: 0, flexShrink: 0 },
  emptyContainer: { padding: 16 },
  emptyTitle: {
    color: PF.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 24,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PF.cardBg,
    borderWidth: 1,
    borderColor: PF.border,
  },
  pillActive: {
    backgroundColor: PF.accent,
    borderColor: PF.accent,
  },
  pillText: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#0F1014',
  },
  screenContainer: {
    flex: 1,
  },
});
