/**
 * RadarChart — SVG polygon-based spider/radar chart
 *
 * Draws concentric grid polygons, fills the data area,
 * and labels each vertex. Animated opacity fade-in on mount.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import { PF } from '../performance/shared';

interface RadarDataPoint {
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  color?: string;
  fillOpacity?: number;
  gridLevels?: number;
}

function getPolygonPoint(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  total: number,
): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function polygonPoints(cx: number, cy: number, radius: number, count: number): string {
  return Array.from({ length: count })
    .map((_, i) => {
      const pt = getPolygonPoint(cx, cy, radius, i, count);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

export default function RadarChart({
  data,
  size = 220,
  color = PF.accent,
  fillOpacity = 0.25,
  gridLevels = 4,
}: RadarChartProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [data]);

  const n = data.length;
  if (n < 3) return null;

  const padding = 32;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = (size - padding * 2) / 2;

  // Grid polygons
  const grids = Array.from({ length: gridLevels }).map((_, i) => {
    const r = (maxRadius / gridLevels) * (i + 1);
    return polygonPoints(cx, cy, r, n);
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const ratio = d.max > 0 ? Math.min(1, Math.max(0, d.value / d.max)) : 0;
    const pt = getPolygonPoint(cx, cy, maxRadius * ratio, i, n);
    return pt;
  });
  const dataPolygon = dataPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  // Label positions (slightly beyond max radius)
  const labelRadius = maxRadius + 18;
  const labelPositions = data.map((_, i) => getPolygonPoint(cx, cy, labelRadius, i, n));

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Svg width={size} height={size}>
        {/* Grid lines from center to vertices */}
        {data.map((_, i) => {
          const pt = getPolygonPoint(cx, cy, maxRadius, i, n);
          return (
            <Line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          );
        })}

        {/* Concentric grid polygons */}
        {grids.map((pts, i) => (
          <Polygon
            key={`grid-${i}`}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Data fill */}
        <Polygon
          points={dataPolygon}
          fill={color}
          fillOpacity={fillOpacity}
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.8}
        />

        {/* Data point dots */}
        {dataPoints.map((pt, i) => (
          <Circle
            key={`dot-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={3.5}
            fill={color}
          />
        ))}

        {/* Labels */}
        {labelPositions.map((pt, i) => {
          const isLeft = pt.x < cx - 5;
          const isRight = pt.x > cx + 5;
          const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';
          return (
            <SvgText
              key={`label-${i}`}
              x={pt.x}
              y={pt.y + 4}
              fill={PF.textSecondary}
              fontSize={10}
              fontWeight="600"
              textAnchor={anchor}
            >
              {data[i].label}
            </SvgText>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
