import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { InvestmentStrategy, StrategyId } from '@/types/investor-journey';

// ─── Strategy Colors ───

const STRATEGY_COLORS: Record<StrategyId, string> = {
  ultra_safe: '#A78BFA',
  safe: '#60A5FA',
  balanced: '#FBBF24',
  growth: '#4ADE80',
  aggressive: '#F87171',
};

const STRATEGY_LABELS: Record<StrategyId, string> = {
  ultra_safe: 'Ultra-prudent',
  safe: 'Prudent',
  balanced: 'Equilibre',
  growth: 'Croissance',
  aggressive: 'Agressif',
};

// ─── Props ───

interface StrategyComparisonChartProps {
  strategies: InvestmentStrategy[];
  durationMonths: number;
  highlightedId?: StrategyId;
}

// ─── Helpers ───

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toFixed(0);
}

// ─── Chart Constants ───

const CHART_WIDTH = 320;
const CHART_HEIGHT = 180;
const PADDING_LEFT = 48;
const PADDING_RIGHT = 12;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 28;
const PLOT_W = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_H = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

// Number of sampled points for the chart lines
const SAMPLE_COUNT = 24;

function StrategyComparisonChartInner({
  strategies,
  durationMonths,
  highlightedId,
}: StrategyComparisonChartProps) {
  if (strategies.length === 0 || durationMonths <= 0) {
    return null;
  }

  // Determine global min/max across all strategies
  let globalMin = Infinity;
  let globalMax = -Infinity;
  for (const s of strategies) {
    for (const p of s.projections) {
      if (p.value < globalMin) globalMin = p.value;
      if (p.value > globalMax) globalMax = p.value;
    }
  }

  // Add 5% padding top/bottom
  const valueRange = globalMax - globalMin || 1;
  const yMin = Math.max(0, globalMin - valueRange * 0.05);
  const yMax = globalMax + valueRange * 0.05;
  const yRange = yMax - yMin || 1;

  // Sample evenly spaced points from projections
  const sampleProjection = (projections: { month: number; value: number }[]) => {
    if (projections.length === 0) return [];
    const points: { x: number; y: number }[] = [];
    const step = Math.max(1, Math.floor(projections.length / SAMPLE_COUNT));

    for (let i = 0; i < projections.length; i += step) {
      const p = projections[i];
      const x = PADDING_LEFT + (p.month / durationMonths) * PLOT_W;
      const y = PADDING_TOP + PLOT_H - ((p.value - yMin) / yRange) * PLOT_H;
      points.push({ x, y });
    }

    // Always include the last point
    const last = projections[projections.length - 1];
    const lastX = PADDING_LEFT + (last.month / durationMonths) * PLOT_W;
    const lastY = PADDING_TOP + PLOT_H - ((last.value - yMin) / yRange) * PLOT_H;
    if (points.length === 0 || points[points.length - 1].x !== lastX) {
      points.push({ x: lastX, y: lastY });
    }

    return points;
  };

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + (yRange * i) / 4;
    return {
      label: formatAmount(val),
      y: PADDING_TOP + PLOT_H - (i / 4) * PLOT_H,
    };
  });

  // X-axis labels
  const xLabels: { label: string; x: number }[] = [];
  const yearCount = Math.ceil(durationMonths / 12);
  const xStep = yearCount <= 5 ? 1 : yearCount <= 15 ? 2 : 5;
  for (let yr = 0; yr <= yearCount; yr += xStep) {
    const month = yr * 12;
    if (month <= durationMonths) {
      xLabels.push({
        label: `${yr}a`,
        x: PADDING_LEFT + (month / durationMonths) * PLOT_W,
      });
    }
  }

  return (
    <PerfGlassCard style={styles.card}>
      <Text style={styles.title}>Comparaison des strategies</Text>

      {/* Chart area */}
      <View style={styles.chartContainer}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <View
            key={`grid-${i}`}
            style={[
              styles.gridLine,
              { top: tick.y, left: PADDING_LEFT, width: PLOT_W },
            ]}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <Text
            key={`ylabel-${i}`}
            style={[styles.axisLabel, { top: tick.y - 6, left: 0, width: PADDING_LEFT - 4, textAlign: 'right' }]}
          >
            {tick.label}
          </Text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((lbl, i) => (
          <Text
            key={`xlabel-${i}`}
            style={[
              styles.axisLabel,
              { top: PADDING_TOP + PLOT_H + 8, left: lbl.x - 12, width: 24, textAlign: 'center' },
            ]}
          >
            {lbl.label}
          </Text>
        ))}

        {/* Strategy lines */}
        {strategies.map((strategy) => {
          const points = sampleProjection(strategy.projections);
          const color = STRATEGY_COLORS[strategy.id] ?? PF.textMuted;
          const isHighlighted = highlightedId === strategy.id;
          const opacity = highlightedId
            ? isHighlighted ? 1 : 0.25
            : 1;

          return (
            <View key={strategy.id} style={{ position: 'absolute', opacity }}>
              {/* Line segments */}
              {points.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = points[idx - 1];
                const dx = pt.x - prev.x;
                const dy = pt.y - prev.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                return (
                  <View
                    key={`line-${strategy.id}-${idx}`}
                    style={[
                      styles.lineSegment,
                      {
                        left: prev.x,
                        top: prev.y - 1,
                        width: length,
                        height: isHighlighted ? 3 : 2,
                        backgroundColor: color,
                        transform: [{ rotate: `${angle}deg` }],
                        transformOrigin: 'left center',
                      },
                    ]}
                  />
                );
              })}

              {/* End point dot */}
              {points.length > 0 && (
                <View
                  style={[
                    styles.endDot,
                    {
                      left: points[points.length - 1].x - 4,
                      top: points[points.length - 1].y - 4,
                      backgroundColor: color,
                      width: isHighlighted ? 10 : 8,
                      height: isHighlighted ? 10 : 8,
                      borderRadius: isHighlighted ? 5 : 4,
                      marginLeft: isHighlighted ? -1 : 0,
                      marginTop: isHighlighted ? -1 : 0,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {strategies.map((strategy) => (
          <View key={strategy.id} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: STRATEGY_COLORS[strategy.id] ?? PF.textMuted },
              ]}
            />
            <Text
              style={[
                styles.legendLabel,
                highlightedId === strategy.id && { color: PF.textPrimary, fontWeight: '700' },
              ]}
            >
              {STRATEGY_LABELS[strategy.id]}
            </Text>
          </View>
        ))}
      </View>
    </PerfGlassCard>
  );
}

export const StrategyComparisonChart = memo(StrategyComparisonChartInner);

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
  title: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  chartContainer: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    alignSelf: 'center',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  axisLabel: {
    position: 'absolute',
    color: PF.textMuted,
    fontSize: 9,
    fontWeight: '500',
  },
  lineSegment: {
    position: 'absolute',
    borderRadius: 1,
  },
  endDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: PF.darkBg,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: PF.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
});
