import React from 'react';
import { View, StyleSheet } from 'react-native';
import { YearCard } from './YearCard';
import { YearPlan } from '@/hooks/usePerformanceData';

interface SectionBProps {
  plans: YearPlan[];
}

export function SectionB_TriennialPlan({ plans }: SectionBProps) {
  return (
    <View style={styles.list}>
      {plans.map((plan) => (
        <YearCard key={`year-${plan.year}`} plan={plan} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
});
