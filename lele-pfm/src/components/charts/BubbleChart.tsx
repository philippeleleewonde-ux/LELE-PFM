/**
 * BubbleChart — SVG scatter/bubble chart with variable-size circles.
 *
 * Quadrant grid lines, axis labels, bubble labels.
 * Animated opacity fade-in on mount.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { PF } from '../performance/shared';

export interface BubbleDataPoint {
  label: string;
  x: number;
  y: number;
  size: number;
  color?: string;
}

interface BubbleChartProps {
  data: BubbleDataPoint[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  showQuadrants?: boolean;
}

const PAD = { top: 16, bottom: 32, left: 36, right: 16 };

export default function BubbleChart({
  data,
  width = 280,
  height = 220,
  xLabel = '',
  yLabel = '',
  showQuadrants = true,
}: BubbleChartProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [data]);

  const { bubbles, xMid, yMid } = useMemo(() => {
    if (!data || data.length === 0) {
      return { bubbles: [] as any[], xMid: 0, yMid: 0 };
    }

    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const sizes = data.map((d) => d.size);

    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const maxSize = Math.max(...sizes, 1);

    const xRng = xMax - xMin || 1;
    const yRng = yMax - yMin || 1;
    const xPad = xRng * 0.15;
    const yPad = yRng * 0.15;

    const plotW = width - PAD.left - PAD.right;
    const plotH = height - PAD.top - PAD.bottom;

    const toX = (v: number) => PAD.left + ((v - (xMin - xPad)) / (xRng + 2 * xPad)) * plotW;
    const toY = (v: number) => PAD.top + plotH - ((v - (yMin - yPad)) / (yRng + 2 * yPad)) * plotH;

    const mapped = data.map((d) => ({
      ...d,
      cx: toX(d.x),
      cy: toY(d.y),
      r: 6 + (d.size / maxSize) * 18,
      bubbleColor: d.color ?? PF.accent,
    }));

    return {
      bubbles: mapped,
      xMid: toX((xMin + xMax) / 2),
      yMid: toY((yMin + yMax) / 2),
    };
  }, [data, width, height]);

  if (!data || data.length === 0) return null;

  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Svg width={width} height={height}>
        <Rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="rgba(255,255,255,0.02)" rx={4} />

        {showQuadrants && (
          <>
            <Line x1={xMid} y1={PAD.top} x2={xMid} y2={PAD.top + plotH} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4,3" />
            <Line x1={PAD.left} y1={yMid} x2={PAD.left + plotW} y2={yMid} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4,3" />
          </>
        )}

        {bubbles.map((b: any, i: number) => (
          <React.Fragment key={i}>
            <Circle cx={b.cx} cy={b.cy} r={b.r} fill={b.bubbleColor} fillOpacity={0.35} />
            <Circle cx={b.cx} cy={b.cy} r={b.r} fill="none" stroke={b.bubbleColor} strokeWidth={1.5} strokeOpacity={0.7} />
            <SvgText x={b.cx} y={b.cy - b.r - 4} fill={PF.textSecondary} fontSize={8} fontWeight="600" textAnchor="middle">
              {b.label}
            </SvgText>
          </React.Fragment>
        ))}

        {xLabel ? (
          <SvgText x={PAD.left + plotW / 2} y={height - 4} fill={PF.textMuted} fontSize={10} fontWeight="600" textAnchor="middle">
            {xLabel}
          </SvgText>
        ) : null}

        {yLabel ? (
          <SvgText x={10} y={PAD.top + plotH / 2} fill={PF.textMuted} fontSize={10} fontWeight="600" textAnchor="middle" rotation={-90} originX={10} originY={PAD.top + plotH / 2}>
            {yLabel}
          </SvgText>
        ) : null}
      </Svg>
    </Animated.View>
  );
}

export { BubbleChart };

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});
