import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { PF } from '../performance/shared';

export interface HorizontalBarItem {
  label: string;
  value: number;
  color: string;
  maxValue?: number;
}

interface HorizontalBarChartProps {
  data: HorizontalBarItem[];
  barHeight?: number;
  showValues?: boolean;
  formatValue?: (v: number) => string;
  maxValue?: number;
  sorted?: boolean;
}

export function HorizontalBarChart({
  data,
  barHeight = 14,
  showValues = true,
  formatValue,
  maxValue,
  sorted = false,
}: HorizontalBarChartProps) {
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

  const sortedData = useMemo(() => {
    const items = [...data];
    if (sorted) items.sort((a, b) => b.value - a.value);
    return items;
  }, [data, sorted]);

  if (sortedData.length === 0) return null;

  const max = maxValue ?? Math.max(...sortedData.map((d) => d.maxValue ?? d.value));
  if (max === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {sortedData.map((item, i) => {
        const itemMax = item.maxValue ?? max;
        const pct = Math.min(100, (item.value / itemMax) * 100);

        const animWidth = barScale.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', `${pct}%`],
        });

        return (
          <View key={i} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={[styles.barTrack, { height: barHeight }]}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width: animWidth as any,
                    backgroundColor: item.color,
                    height: barHeight,
                  },
                ]}
              />
            </View>
            {showValues && (
              <Text style={[styles.value, { color: item.color }]}>
                {formatValue ? formatValue(item.value) : item.value.toFixed(2)}
              </Text>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
}

export default HorizontalBarChart;

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    width: 80,
  },
  barTrack: {
    flex: 1,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  barFill: {
    borderRadius: 7,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
});
