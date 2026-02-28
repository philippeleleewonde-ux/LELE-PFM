/**
 * GroupedBarChart — SVG grouped bar chart
 *
 * Renders groups of bars side by side. Each group has multiple bars
 * with different colors. Includes x-axis labels and optional value labels.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { PF } from '../performance/shared';

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface GroupedBarGroup {
  label: string;
  bars: BarItem[];
}

export interface GroupedBarChartProps {
  groups: GroupedBarGroup[];
  width?: number;
  height?: number;
  showValues?: boolean;
  showLegend?: boolean;
  legend?: { label: string; color: string }[];
}

export function GroupedBarChart({
  groups,
  width = 300,
  height = 180,
  showValues = true,
  legend,
}: GroupedBarChartProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [groups]);

  if (groups.length === 0) return null;

  const padding = { top: 20, bottom: 30, left: 10, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxBarsPerGroup = Math.max(...groups.map((g) => g.bars.length));
  const allValues = groups.flatMap((g) => g.bars.map((b) => b.value));
  const maxVal = Math.max(...allValues, 1);

  const groupWidth = chartW / groups.length;
  const barGap = 2;
  const groupPadding = 8;
  const barWidth = Math.max(
    4,
    (groupWidth - groupPadding * 2 - barGap * (maxBarsPerGroup - 1)) / maxBarsPerGroup,
  );

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Svg width={width} height={height}>
        {/* Baseline */}
        <Line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {groups.map((group, gi) => {
          const groupX = padding.left + gi * groupWidth;
          return (
            <React.Fragment key={gi}>
              {group.bars.map((bar, bi) => {
                const barH = (bar.value / maxVal) * chartH;
                const x = groupX + groupPadding + bi * (barWidth + barGap);
                const y = padding.top + chartH - barH;
                return (
                  <React.Fragment key={bi}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx={2}
                      fill={bar.color}
                      opacity={0.85}
                    />
                    {showValues && barH > 12 && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={y - 4}
                        fill={PF.textSecondary}
                        fontSize={8}
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {bar.value >= 1000
                          ? `${(bar.value / 1000).toFixed(0)}k`
                          : bar.value.toFixed(0)}
                      </SvgText>
                    )}
                  </React.Fragment>
                );
              })}
              {/* Group label */}
              <SvgText
                x={groupX + groupWidth / 2}
                y={padding.top + chartH + 16}
                fill={PF.textSecondary}
                fontSize={11}
                fontWeight="600"
                textAnchor="middle"
              >
                {group.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legend */}
      {legend && legend.length > 0 && (
        <View style={styles.legend}>
          {legend.map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
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
    color: PF.textSecondary,
    fontSize: 10,
  },
});

export default GroupedBarChart;
