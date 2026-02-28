import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { YearCard } from './YearCard';
import { PF } from './shared';
import { GroupedBarChart } from '@/components/charts/GroupedBarChart';
import { YearPlan } from '@/hooks/usePerformanceData';

interface SectionBProps {
  plans: YearPlan[];
}

export function SectionB_TriennialPlan({ plans }: SectionBProps) {
  const { t } = useTranslation('performance');

  const chartData = useMemo(() => {
    if (plans.length === 0) return { groups: [], legend: [] };

    const groups = plans.map((plan) => ({
      label: plan.label,
      bars: [
        { label: 'EPR', value: plan.epr, color: PF.accent },
        { label: t('yearCard.boostSavings'), value: plan.epargne, color: PF.green },
        { label: t('yearCard.boostFun'), value: plan.discretionnaire, color: PF.violet },
      ],
    }));

    const legend = [
      { label: 'EPR', color: PF.accent },
      { label: t('yearCard.boostSavings'), color: PF.green },
      { label: t('yearCard.boostFun'), color: PF.violet },
    ];

    return { groups, legend };
  }, [plans, t]);

  return (
    <View style={styles.list}>
      {/* Grouped bar chart overview */}
      {chartData.groups.length > 0 && (
        <View style={styles.chartContainer}>
          <GroupedBarChart
            groups={chartData.groups}
            height={160}
            legend={chartData.legend}
          />
        </View>
      )}

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
  chartContainer: {
    marginBottom: 4,
  },
});
