/**
 * MiniSparkline — Compact SVG polyline sparkline for inline KPI cards
 *
 * Pure sparkline: no axes, no labels, optional dots at all data points.
 * Subtle gradient fill below the line. Animated opacity fade-in on mount.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { PF } from '../performance/shared';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  strokeWidth?: number;
}

export default function MiniSparkline({
  data,
  width = 80,
  height = 24,
  color = PF.accent,
  showDots = false,
  strokeWidth = 1.5,
}: MiniSparklineProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [data]);

  if (!data || data.length < 2) return null;

  const padX = showDots ? 3 : 2;
  const padY = 2;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * plotW;
    const y = padY + plotH - ((v - minVal) / range) * plotH;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Gradient fill area: line points + bottom-right + bottom-left
  const fillPoints = [
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${height}`,
    `${points[0].x},${height}`,
  ].join(' ');

  const gradientId = `sparkGrad-${color.replace('#', '')}`;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.25} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Gradient fill below line */}
        <Polygon points={fillPoints} fill={`url(#${gradientId})`} />

        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Optional dots at all data points */}
        {showDots &&
          points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
          ))}
      </Svg>
    </Animated.View>
  );
}

// Backward-compatible named export
export { MiniSparkline };

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
