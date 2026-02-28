/**
 * SectionEvolution — Wrapper that aggregates the 6 evolution sub-components
 * into a single vertical layout for the Performance tab.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWeeklyEvolution } from '@/hooks/useWeeklyEvolution';
import { useFinancialScore } from '@/hooks/useFinancialScore';
import { usePerformanceStore } from '@/stores/performance-store';
import MiniLineChart from '@/components/charts/MiniLineChart';
import { PF } from './shared';

import { EvolutionCard } from '@/components/evolution/EvolutionCard';
import { StreaksCard } from '@/components/evolution/StreaksCard';
import { MonthlyBilanCard } from '@/components/evolution/MonthlyBilanCard';
import { LeversProgressCard } from '@/components/evolution/LeversProgressCard';
import { PersonalRecordsCard } from '@/components/evolution/PersonalRecordsCard';
import { IndicatorStoryCard } from '@/components/evolution/IndicatorStoryCard';

export function SectionEvolution() {
  const evolution = useWeeklyEvolution();
  const { levers } = useFinancialScore();
  const allRecords = usePerformanceStore((s) => s.records);

  const scoreChartData = useMemo(() => {
    const sorted = [...allRecords]
      .sort((a, b) => a.year - b.year || a.week_number - b.week_number)
      .slice(-8);
    return sorted.map((r) => ({
      label: `S${r.week_number}`,
      value: r.financialScore ?? 0,
    }));
  }, [allRecords]);

  if (!evolution.hasData) return null;

  return (
    <View style={styles.container}>
      {/* Score evolution line chart — last 8 weeks */}
      {scoreChartData.length >= 2 && (
        <View style={styles.chartWrap}>
          <Text style={styles.chartTitle}>Score financier</Text>
          <MiniLineChart
            data={scoreChartData}
            height={150}
            color={PF.accent}
            showArea
            showDots
            yMin={0}
            yMax={100}
          />
        </View>
      )}

      <EvolutionCard />
      <StreaksCard />
      <MonthlyBilanCard />
      <LeversProgressCard />
      <PersonalRecordsCard />

      {/* One IndicatorStoryCard per lever */}
      <View style={styles.leversSection}>
        {levers.map((lever) => {
          const evo = evolution.leversEvolution.find((e) => e.code === lever.code);
          if (!evo) return null;

          const bestRecord = evolution.records.bestLeverScores[lever.code] ?? undefined;
          const streakValue = lever.code === 'REG' ? evolution.streaks.savingsStreak : undefined;

          return (
            <IndicatorStoryCard
              key={lever.code}
              lever={lever}
              evolution={evo}
              bestRecord={bestRecord}
              streakValue={streakValue}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  chartWrap: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PF.border,
  },
  chartTitle: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 12,
  },
  leversSection: {
    gap: 12,
    marginTop: 4,
  },
});
