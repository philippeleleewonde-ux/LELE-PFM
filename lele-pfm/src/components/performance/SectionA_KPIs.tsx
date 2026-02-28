import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TrendingUp,
  AlertTriangle,
  Shield,
  History,
  Wallet,
  Calendar,
} from 'lucide-react-native';
import { KPICard } from './KPICard';
import { KPIItem } from '@/hooks/usePerformanceData';
import { MiniSparkline } from '../charts/MiniSparkline';
import { usePerformanceStore } from '@/stores/performance-store';
import { PF } from './shared';

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  AlertTriangle,
  Shield,
  History,
  Wallet,
  Calendar,
};

const ALERT_COLORS: Record<string, string> = {
  green: PF.green,
  yellow: PF.yellow,
  red: PF.red,
  cyan: PF.cyan,
  violet: PF.violet,
  orange: PF.orange,
};

/** Map KPI key → field extractor from WeeklyRecord */
function getSparklineValue(key: string, record: any): number | null {
  switch (key) {
    case 'potential': return record.weeklyBudget ?? null;
    case 'el': return record.weeklySpent ?? null;
    case 'var95': return record.depassement ?? null;
    case 'historical': return record.tauxExecution ?? null;
    case 'prl': return record.economies ?? null;
    case 'el36m': return record.financialScore ?? null;
    default: return null;
  }
}

interface SectionAProps {
  kpis: KPIItem[];
}

export function SectionA_KPIs({ kpis }: SectionAProps) {
  const records = usePerformanceStore((s) => s.records);

  const sparklineData = useMemo(() => {
    const sorted = [...records]
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week_number - b.week_number;
      })
      .slice(-8);

    const result: Record<string, number[]> = {};
    for (const kpi of kpis) {
      const values: number[] = [];
      for (const rec of sorted) {
        const v = getSparklineValue(kpi.key, rec);
        if (v !== null) values.push(v);
      }
      result[kpi.key] = values;
    }
    return result;
  }, [records, kpis]);

  return (
    <View style={styles.grid}>
      {kpis.map((kpi) => {
        const data = sparklineData[kpi.key] || [];
        return (
          <View key={kpi.key} style={styles.cell}>
            <KPICard
              icon={ICON_MAP[kpi.iconName] || TrendingUp}
              label={kpi.label}
              value={kpi.value}
              alertLevel={kpi.alertLevel}
              tooltip={kpi.tooltip}
            />
            {data.length >= 2 && (
              <View style={styles.sparklineBox}>
                <MiniSparkline
                  data={data}
                  width={80}
                  height={24}
                  color={ALERT_COLORS[kpi.alertLevel] || PF.accent}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '47%' as any,
    flexGrow: 1,
  },
  sparklineBox: {
    alignItems: 'flex-end',
    paddingRight: 14,
    paddingBottom: 10,
    marginTop: -4,
  },
});
