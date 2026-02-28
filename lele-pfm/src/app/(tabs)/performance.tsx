import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { BarChart3, Radar, PieChart, Target, Briefcase } from 'lucide-react-native';

import { usePerformanceData } from '../../hooks/usePerformanceData';
import { PF } from '../../components/performance/shared';
import { usePerformanceStore } from '../../stores/performance-store';
import { useViewMode } from '../../hooks/useViewMode';
import { SwipeableTabs, TabConfig } from '../../components/performance/SwipeableTabs';
import { ScoreTab } from '../../components/performance/tabs/ScoreTab';
import { AnalyseTab } from '../../components/performance/tabs/AnalyseTab';
import { StrategieTab } from '../../components/performance/tabs/StrategieTab';
import { InvestisseurTab } from '../../components/performance/tabs/InvestisseurTab';

export default function PerformanceScreen() {
  const { t } = useTranslation('app');
  const router = useRouter();
  const data = usePerformanceData();
  const { showSection, isInvestor } = useViewMode();
  const hasWeeklyData = usePerformanceStore((s) => s.records.length > 0);

  const visibleTabs = useMemo(() => {
    const baseTabs: TabConfig[] = [
      { key: 'score', label: t('performance.tabs.score'), icon: Radar, iconColor: PF.accent },
      { key: 'analyse', label: t('performance.tabs.analyse'), icon: PieChart, iconColor: PF.blue },
      { key: 'strategie', label: t('performance.tabs.strategie'), icon: Target, iconColor: PF.green },
    ];
    if (isInvestor) {
      baseTabs.push({
        key: 'investisseur',
        label: t('performance.tabs.investisseur'),
        icon: Briefcase,
        iconColor: PF.gold,
      });
    }
    return baseTabs;
  }, [isInvestor, t]);

  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <BarChart3 size={48} color={PF.textMuted} />
          <Text style={styles.emptyTitle}>{t('performance.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('performance.emptyMessage')}</Text>
          <Pressable style={styles.ctaButton} onPress={() => router.push('/setup-wizard')}>
            <Text style={styles.ctaText}>{t('performance.emptyButton')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const tabChildren = [
    <ScoreTab key="score" data={data} hasWeeklyData={hasWeeklyData} />,
    <AnalyseTab key="analyse" data={data} showSection={showSection} />,
    <StrategieTab key="strategie" data={data} showSection={showSection} />,
  ];

  if (isInvestor) {
    tabChildren.push(<InvestisseurTab key="investisseur" />);
  }

  return (
    <View style={styles.container}>
      {/* Background Spotlights */}
      <View style={styles.spotlights}>
        <View style={[styles.spot, { top: -60, left: -80, backgroundColor: 'rgba(217,161,27,0.08)' }]} />
        <View style={[styles.spot, { top: 300, right: -100, backgroundColor: 'rgba(251,189,35,0.06)' }]} />
        <View style={[styles.spot, { bottom: -40, left: 50, backgroundColor: 'rgba(74,222,128,0.04)' }]} />
      </View>

      <SwipeableTabs tabs={visibleTabs} initialTab={0}>
        {tabChildren}
      </SwipeableTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PF.darkBg,
  },
  spotlights: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  spot: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: PF.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 16,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: PF.cardBg,
  },
  emptyTitle: {
    color: PF.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: PF.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaText: {
    color: PF.darkBg,
    fontSize: 14,
    fontWeight: '700',
  },
});
