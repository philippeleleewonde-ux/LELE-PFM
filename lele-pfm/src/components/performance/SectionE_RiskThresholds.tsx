import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CategoryRow } from './CategoryRow';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { PF } from './shared';
import { CategoryItem } from '@/hooks/usePerformanceData';
import { formatPercent } from '@/services/format-helpers';

interface SectionEProps {
  categories: CategoryItem[];
}

export function SectionE_RiskThresholds({ categories }: SectionEProps) {
  const { t } = useTranslation('performance');
  const sorted = [...categories].sort((a, b) => b.budgetRate - a.budgetRate);

  const elasticityBars = useMemo(() => {
    const sortedByElasticity = [...categories].sort((a, b) => b.elasticity - a.elasticity);
    return sortedByElasticity.map((cat) => {
      const value = cat.elasticity;
      let color: string;
      if (value > 0.8) color = PF.red;
      else if (value >= 0.5) color = PF.orange;
      else color = PF.green;
      return {
        label: cat.label,
        value,
        color,
      };
    });
  }, [categories]);

  return (
    <View style={styles.container}>
      {/* Elasticity horizontal bar chart */}
      {elasticityBars.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>{t('riskThresholds.elasticityTitle', { defaultValue: 'Elasticite par categorie' })}</Text>
          <HorizontalBarChart
            data={elasticityBars}
            barHeight={14}
            maxValue={1}
            formatValue={(v) => formatPercent(v * 100, 0)}
          />
        </View>
      )}

      {/* Existing category rows */}
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
  chartSection: {
    gap: 10,
    marginBottom: 16,
  },
  chartTitle: {
    color: PF.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
