import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryRow } from './CategoryRow';
import { CategoryItem } from '@/hooks/usePerformanceData';

interface SectionEProps {
  categories: CategoryItem[];
}

export function SectionE_RiskThresholds({ categories }: SectionEProps) {
  const sorted = [...categories].sort((a, b) => b.budgetRate - a.budgetRate);

  return (
    <View style={styles.container}>
      {sorted.map((cat) => (
        <CategoryRow
          key={cat.code}
          code={cat.code}
          label={cat.label}
          budgetRate={cat.budgetRate}
          elasticity={cat.elasticity}
          nature={cat.nature}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
});
