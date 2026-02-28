/**
 * StackedBarChart — Horizontal stacked bars with legend and animations.
 *
 * Each row has a label, a stacked bar (segments side by side), and optional total.
 * Supports both horizontal (default) and vertical orientation.
 * Animated opacity fade-in on mount.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { PF } from '../performance/shared';

export interface StackedBarSegment {
  label: string;
  value: number;
  color: string;
}

export interface StackedBarItem {
  label: string;
  segments: StackedBarSegment[];
}

interface StackedBarChartProps {
  data: StackedBarItem[];
  height?: number;
  barHeight?: number;
  showLegend?: boolean;
  horizontal?: boolean;
  formatValue?: (v: number) => string;
  showValues?: boolean;
}

export function StackedBarChart({
  data,
  height,
  barHeight = 20,
  showLegend = true,
  horizontal = true,
  formatValue,
  showValues = false,
}: StackedBarChartProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const barScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    barScale.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(barScale, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]).start();
  }, [data]);

  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map((d) => d.segments.reduce((s, seg) => s + seg.value, 0)));
  if (maxTotal === 0) return null;

  // Collect unique legend items
  const legendMap = new Map<string, string>();
  data.forEach((d) =>
    d.segments.forEach((seg) => {
      if (!legendMap.has(seg.label)) legendMap.set(seg.label, seg.color);
    }),
  );

  if (horizontal) {
    return (
      <Animated.View style={[styles.container, { opacity }, height ? { height } : undefined]}>
        {data.map((item, i) => {
          const total = item.segments.reduce((s, seg) => s + seg.value, 0);
          return (
            <View key={i} style={styles.row}>
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={[styles.barTrack, { height: barHeight }]}>
                {item.segments.map((seg, j) => {
                  const pct = (seg.value / maxTotal) * 100;
                  if (pct <= 0) return null;

                  const animWidth = barScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${pct}%`],
                  });

                  return (
                    <Animated.View
                      key={j}
                      style={[
                        styles.barSegment,
                        {
                          width: animWidth as any,
                          backgroundColor: seg.color,
                          height: barHeight,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              {(formatValue || showValues) && (
                <Text style={styles.value}>
                  {formatValue ? formatValue(total) : total.toFixed(0)}
                </Text>
              )}
            </View>
          );
        })}

        {showLegend && legendMap.size > 0 && (
          <View style={styles.legend}>
            {Array.from(legendMap.entries()).map(([label, color]) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    );
  }

  // Vertical stacked bars using SVG
  const svgWidth = Math.max(200, data.length * 50 + 40);
  const svgHeight = height ?? 180;
  const padding = { top: 16, bottom: 30, left: 10, right: 10 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;
  const barW = Math.min(30, (chartW / data.length) * 0.6);
  const groupW = chartW / data.length;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Svg width={svgWidth} height={svgHeight}>
        {/* Baseline */}
        <Line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {data.map((item, i) => {
          let yOffset = 0;
          const cx = padding.left + i * groupW + groupW / 2;
          return (
            <React.Fragment key={i}>
              {item.segments.map((seg, j) => {
                const segH = (seg.value / maxTotal) * chartH;
                const y = padding.top + chartH - yOffset - segH;
                yOffset += segH;
                return (
                  <Rect
                    key={j}
                    x={cx - barW / 2}
                    y={y}
                    width={barW}
                    height={segH}
                    fill={seg.color}
                    rx={j === item.segments.length - 1 ? 2 : 0}
                    opacity={0.85}
                  />
                );
              })}
              <SvgText
                x={cx}
                y={padding.top + chartH + 16}
                fill={PF.textSecondary}
                fontSize={10}
                fontWeight="600"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {showLegend && legendMap.size > 0 && (
        <View style={styles.legend}>
          {Array.from(legendMap.entries()).map(([label, color]) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export default StackedBarChart;

const styles = StyleSheet.create({
  container: {
    gap: 8,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  label: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 44,
  },
  barTrack: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  barSegment: {
    borderRadius: 0,
  },
  value: {
    color: PF.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
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
  legendText: {
    color: PF.textMuted,
    fontSize: 10,
  },
});
