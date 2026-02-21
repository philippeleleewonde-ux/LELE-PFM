/**
 * SectionEvolution — Wrapper that aggregates the 6 evolution sub-components
 * into a single vertical layout for the Performance tab.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useWeeklyEvolution } from '@/hooks/useWeeklyEvolution';
import { useFinancialScore } from '@/hooks/useFinancialScore';

import { EvolutionCard } from '@/components/evolution/EvolutionCard';
import { StreaksCard } from '@/components/evolution/StreaksCard';
import { MonthlyBilanCard } from '@/components/evolution/MonthlyBilanCard';
import { LeversProgressCard } from '@/components/evolution/LeversProgressCard';
import { PersonalRecordsCard } from '@/components/evolution/PersonalRecordsCard';
import { IndicatorStoryCard } from '@/components/evolution/IndicatorStoryCard';

export function SectionEvolution() {
  const evolution = useWeeklyEvolution();
  const { levers } = useFinancialScore();

  if (!evolution.hasData) return null;

  return (
    <View style={styles.container}>
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
  leversSection: {
    gap: 12,
    marginTop: 4,
  },
});
