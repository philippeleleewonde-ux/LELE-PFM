import React, { useState, useRef, memo } from 'react';
import { View, Text, ScrollView, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import MiniLineChart from '@/components/charts/MiniLineChart';
import { useInvestorStrategy } from '@/hooks/useInvestorStrategy';
import { simulateInvestment } from '@/domain/calculators/investment-simulator';
import { useEngineStore } from '@/stores/engine-store';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  color: string;
  suffix?: string;
  onChange: (val: number) => void;
}

function CustomSlider({ label, value, min, max, step, color, suffix = '', onChange }: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(200);
  const fraction = (value - min) / (max - min);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // handled in move
      },
      onPanResponderMove: (_evt, gs) => {
        const touchX = gs.moveX;
        // Need offset from track start - approximate
        const raw = touchX / trackWidth;
        const clamped = Math.min(1, Math.max(0, raw));
        const stepped = Math.round((min + clamped * (max - min)) / step) * step;
        onChange(Math.min(max, Math.max(min, stepped)));
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={[sliderStyles.value, { color }]}>{value}{suffix}</Text>
      </View>
      <View
        style={sliderStyles.track}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <View style={[sliderStyles.fill, { width: `${fraction * 100}%`, backgroundColor: color }]} />
        <View
          style={[
            sliderStyles.thumb,
            { left: `${fraction * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: PF.textSecondary, fontSize: 12, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  fill: { height: 6, borderRadius: 3, position: 'absolute', left: 0, top: 0 },
  thumb: {
    position: 'absolute',
    top: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
  },
});

function MonSimulateurInner() {
  const { t } = useTranslation('app');
  const strategy = useInvestorStrategy();
  const currency = useEngineStore((s) => s.currency);

  const defaultMonthly = strategy?.totalMonthlyBudget ?? 50000;
  const defaultReturn = strategy?.weightedReturn ?? 8;

  // Adaptive slider range based on budget magnitude
  const sliderStep = defaultMonthly < 1000 ? 50 : defaultMonthly < 10000 ? 500 : 5000;
  const sliderMin = sliderStep;
  const sliderMax = Math.max(Math.round(defaultMonthly * 10 / sliderStep) * sliderStep, sliderStep * 100);

  const [monthly, setMonthly] = useState(Math.max(sliderMin, Math.round(defaultMonthly / sliderStep) * sliderStep));
  const [years, setYears] = useState(10);
  const [returnRate, setReturnRate] = useState(Math.round(defaultReturn * 10) / 10);

  const months = years * 12;

  // Savings only projection
  const savingsData = Array.from({ length: Math.min(months, 60) }, (_, i) => {
    const m = Math.round((i / 59) * (months - 1));
    return { label: m % 12 === 0 ? `${Math.floor(m / 12)}a` : '', value: monthly * (m + 1) };
  });

  // Strategy projection
  const projection = simulateInvestment(monthly, returnRate, 5, months, 2);
  const strategyData = Array.from({ length: Math.min(months, 60) }, (_, i) => {
    const m = Math.round((i / 59) * (months - 1));
    const point = projection[Math.min(m, projection.length - 1)];
    return { label: m % 12 === 0 ? `${Math.floor(m / 12)}a` : '', value: point?.total ?? 0 };
  });

  const savingsTotal = monthly * months;
  const strategyTotal = projection[projection.length - 1]?.total ?? savingsTotal;
  const delta = Math.max(0, strategyTotal - savingsTotal);

  const formatAmount = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return Math.round(val).toString();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Sliders */}
      <PerfGlassCard style={styles.slidersCard}>
        <CustomSlider
          label={t('gps.simulateur.monthlyAmount')}
          value={monthly}
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          color={PF.accent}
          suffix={` ${currency}`}
          onChange={setMonthly}
        />
        <CustomSlider
          label={t('gps.simulateur.duration')}
          value={years}
          min={1}
          max={30}
          step={1}
          color={PF.blue}
          suffix=" ans"
          onChange={setYears}
        />
        <CustomSlider
          label={t('gps.simulateur.return')}
          value={returnRate}
          min={1}
          max={20}
          step={0.5}
          color={PF.green}
          suffix="%"
          onChange={setReturnRate}
        />
      </PerfGlassCard>

      {/* Comparison cards */}
      <View style={styles.compRow}>
        <PerfGlassCard style={styles.compCard}>
          <Text style={styles.compLabel}>{t('gps.simulateur.savingsOnly')}</Text>
          <Text style={styles.compValue}>{formatAmount(savingsTotal)}</Text>
        </PerfGlassCard>
        <PerfGlassCard style={styles.compCard}>
          <Text style={styles.compLabel}>{t('gps.simulateur.strategy')}</Text>
          <Text style={[styles.compValue, { color: PF.green }]}>{formatAmount(strategyTotal)}</Text>
        </PerfGlassCard>
      </View>

      {/* Delta card */}
      <PerfGlassCard style={styles.deltaCard}>
        <Text style={styles.deltaLabel}>{t('gps.simulateur.opportunityCost')}</Text>
        <Text style={styles.deltaValue}>+{formatAmount(delta)} {currency}</Text>
      </PerfGlassCard>

      {/* Chart */}
      <PerfGlassCard style={styles.chartCard}>
        <View style={{ marginBottom: 4 }}>
          <MiniLineChart data={strategyData} color={PF.green} height={140} showArea showDots={false} />
        </View>
        <View style={{ marginTop: -8 }}>
          <MiniLineChart data={savingsData} color={PF.textMuted} height={140} showArea={false} showDots={false} strokeWidth={1.5} />
        </View>
      </PerfGlassCard>
    </ScrollView>
  );
}

export const MonSimulateur = memo(MonSimulateurInner);

const styles = StyleSheet.create({
  content: { paddingBottom: 24, gap: 12 },
  slidersCard: { padding: 16, gap: 20 },
  compRow: { flexDirection: 'row', gap: 8 },
  compCard: { flex: 1, padding: 14, alignItems: 'center' },
  compLabel: { color: PF.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  compValue: { color: PF.textPrimary, fontSize: 18, fontWeight: '800' },
  deltaCard: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ADE8040',
    backgroundColor: '#4ADE8008',
  },
  deltaLabel: { color: PF.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  deltaValue: { color: PF.green, fontSize: 22, fontWeight: '800' },
  chartCard: { padding: 12 },
});
