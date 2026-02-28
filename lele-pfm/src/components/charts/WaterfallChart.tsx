/**
 * WaterfallChart — SVG cascade/waterfall chart
 *
 * Floating bars connected by dashed lines.
 * Green for increases, red for decreases, accent for totals.
 * Animated bars growing from zero height on mount.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { PF } from '../performance/shared';

interface WaterfallDataPoint {
  label: string;
  value: number;
  type: 'increase' | 'decrease' | 'total';
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[];
  width?: number;
  height?: number;
}

const BAR_COLORS = {
  increase: PF.green,
  decrease: PF.red,
  total: PF.accent,
} as const;

export default function WaterfallChart({
  data,
  width = 300,
  height = 180,
}: WaterfallChartProps) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [data]);

  if (!data || data.length === 0) return null;

  const padTop = 24;
  const padBottom = 36;
  const padLeft = 8;
  const padRight = 8;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Compute running totals and bar positions
  const bars: {
    label: string;
    type: 'increase' | 'decrease' | 'total';
    value: number;
    startY: number; // top of bar in data coords
    endY: number; // bottom of bar in data coords
  }[] = [];

  let running = 0;
  for (const d of data) {
    if (d.type === 'total') {
      bars.push({ label: d.label, type: d.type, value: d.value, startY: 0, endY: d.value });
      running = d.value;
    } else if (d.type === 'increase') {
      const prev = running;
      running += d.value;
      bars.push({ label: d.label, type: d.type, value: d.value, startY: prev, endY: running });
    } else {
      const prev = running;
      running -= d.value;
      bars.push({ label: d.label, type: d.type, value: d.value, startY: running, endY: prev });
    }
  }

  // Find value range
  const allValues = bars.flatMap((b) => [b.startY, b.endY]);
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(0, ...allValues);
  const range = maxVal - minVal || 1;

  // Map value to Y pixel coordinate (inverted: higher value = lower y)
  const toY = (v: number) => padTop + plotH - ((v - minVal) / range) * plotH;

  const barGap = 4;
  const barWidth = Math.max(12, (plotW - barGap * (bars.length - 1)) / bars.length);

  return (
    <Animated.View style={[styles.container, { opacity: animProgress }]}>
      <Svg width={width} height={height}>
        {/* Zero line */}
        <Line
          x1={padLeft}
          y1={toY(0)}
          x2={width - padRight}
          y2={toY(0)}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />

        {bars.map((bar, i) => {
          const x = padLeft + i * (barWidth + barGap);
          const topPx = toY(bar.endY);
          const bottomPx = toY(bar.startY);
          const barH = Math.max(1, bottomPx - topPx);
          const color = BAR_COLORS[bar.type];

          // Connector line to next bar
          const hasNext = i < bars.length - 1;
          const nextX = padLeft + (i + 1) * (barWidth + barGap);
          const connectorY = bar.type === 'decrease' ? toY(bar.startY) : toY(bar.endY);

          // Value label
          const isPositive = bar.type === 'increase' || bar.type === 'total';
          const labelY = isPositive ? topPx - 4 : bottomPx + 12;
          const prefix = bar.type === 'increase' ? '+' : bar.type === 'decrease' ? '-' : '';
          const displayVal = `${prefix}${Math.round(bar.value)}`;

          return (
            <React.Fragment key={i}>
              {/* Bar */}
              <Rect
                x={x}
                y={topPx}
                width={barWidth}
                height={barH}
                rx={3}
                fill={color}
                fillOpacity={0.85}
              />

              {/* Connector dashed line */}
              {hasNext && (
                <Line
                  x1={x + barWidth}
                  y1={connectorY}
                  x2={nextX}
                  y2={connectorY}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                  strokeDasharray="3,2"
                />
              )}

              {/* Value label */}
              <SvgText
                x={x + barWidth / 2}
                y={labelY}
                fill={color}
                fontSize={9}
                fontWeight="700"
                textAnchor="middle"
              >
                {displayVal}
              </SvgText>

              {/* Bottom label */}
              <SvgText
                x={x + barWidth / 2}
                y={height - padBottom + 14}
                fill={PF.textMuted}
                fontSize={8}
                fontWeight="600"
                textAnchor="middle"
              >
                {bar.label}
              </SvgText>
            </React.Fragment>
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
