import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { PF } from '../performance/shared';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;

  let currentAngle = 0;
  const arcs = data.map((slice) => {
    const sliceAngle = (slice.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += sliceAngle;
    // Prevent full circle edge case
    const endAngle = Math.min(currentAngle, startAngle + 359.99);
    return { ...slice, startAngle, endAngle };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {arcs.map((arc, i) => (
            <Path
              key={i}
              d={arcPath(cx, cy, radius, arc.startAngle, arc.endAngle)}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </G>
      </Svg>
      {(centerLabel || centerValue) && (
        <View style={[styles.center, { width: size, height: size }]}>
          {centerValue && <Text style={styles.centerValue}>{centerValue}</Text>}
          {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        </View>
      )}
      {/* Legend */}
      <View style={styles.legend}>
        {data.map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{d.label}</Text>
            <Text style={styles.legendValue}>{Math.round((d.value / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    color: PF.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  centerLabel: {
    color: PF.textMuted,
    fontSize: 11,
  },
  legend: {
    gap: 6,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    color: PF.textSecondary,
    fontSize: 12,
  },
  legendValue: {
    color: PF.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
