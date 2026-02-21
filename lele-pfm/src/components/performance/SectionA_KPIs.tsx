import React from 'react';
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

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  AlertTriangle,
  Shield,
  History,
  Wallet,
  Calendar,
};

interface SectionAProps {
  kpis: KPIItem[];
}

export function SectionA_KPIs({ kpis }: SectionAProps) {
  return (
    <View style={styles.grid}>
      {kpis.map((kpi) => (
        <View key={kpi.key} style={styles.cell}>
          <KPICard
            icon={ICON_MAP[kpi.iconName] || TrendingUp}
            label={kpi.label}
            value={kpi.value}
            alertLevel={kpi.alertLevel}
            tooltip={kpi.tooltip}
          />
        </View>
      ))}
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
});
