/**
 * MiniLineChart — SVG polyline chart with optional area fill and dot markers.
 *
 * Auto-computes Y range, supports smooth Catmull-Rom interpolation,
 * optional gradient area, animated opacity on mount.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Polyline,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polygon,
  Path,
} from 'react-native-svg';
import { PF } from '../performance/shared';

interface DataPoint {
  label?: string;
  value: number;
}

interface MiniLineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  width?: number;
  showArea?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  smooth?: boolean;
  strokeWidth?: number;
  yMin?: number;
  yMax?: number;
}

const PADDING_LEFT = 36;
const PADDING_RIGHT = 12;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 28;

/** Catmull-Rom to cubic bezier path */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function MiniLineChart({
  data,
  color = PF.accent,
  height = 160,
  width: explicitWidth,
  showArea = false,
  showDots = true,
  showLabels = true,
  smooth = true,
  strokeWidth = 2,
  yMin: explicitYMin,
  yMax: explicitYMax,
}: MiniLineChartProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = React.useState(explicitWidth ?? 300);

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [data]);

  const onLayout = (e: LayoutChangeEvent) => {
    if (!explicitWidth) setContainerWidth(e.nativeEvent.layout.width);
  };

  const svgW = explicitWidth ?? containerWidth;

  const { points, yMin, yMax, yTicks } = useMemo(() => {
    if (data.length === 0) return { points: [], yMin: 0, yMax: 1, yTicks: [] as number[] };

    const values = data.map((d) => d.value);
    const rawMin = explicitYMin ?? Math.min(...values);
    const rawMax = explicitYMax ?? Math.max(...values);
    const range = rawMax - rawMin || 1;
    const pad = range * 0.1;
    const mn = explicitYMin ?? rawMin - pad;
    const mx = explicitYMax ?? rawMax + pad;

    const plotW = svgW - PADDING_LEFT - PADDING_RIGHT;
    const plotH = height - PADDING_TOP - PADDING_BOTTOM;

    const pts = data.map((d, i) => ({
      x: PADDING_LEFT + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2),
      y: PADDING_TOP + plotH - ((d.value - mn) / (mx - mn)) * plotH,
    }));

    // 3-4 Y ticks
    const tickCount = 3;
    const ticks = Array.from({ length: tickCount + 1 }).map(
      (_, i) => mn + ((mx - mn) / tickCount) * i,
    );

    return { points: pts, yMin: mn, yMax: mx, yTicks: ticks };
  }, [data, svgW, height, explicitYMin, explicitYMax]);

  if (data.length === 0) return null;

  const plotH = height - PADDING_TOP - PADDING_BOTTOM;
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Area polygon (line + bottom closure)
  const areaPolygon = [
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${PADDING_TOP + plotH}`,
    `${points[0].x},${PADDING_TOP + plotH}`,
  ].join(' ');

  // Smooth area path
  const smoothAreaPath = smooth && points.length >= 3
    ? `${smoothPath(points)} L${points[points.length - 1].x},${PADDING_TOP + plotH} L${points[0].x},${PADDING_TOP + plotH} Z`
    : '';

  return (
    <Animated.View style={[styles.container, { opacity }]} onLayout={onLayout}>
      <Svg width={svgW} height={height}>
        <Defs>
          <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={0.02} />
          </SvgLinearGradient>
        </Defs>

        {/* Y grid lines + tick labels */}
        {yTicks.map((tick, i) => {
          const y = PADDING_TOP + plotH - ((tick - yMin) / (yMax - yMin)) * plotH;
          return (
            <React.Fragment key={`ytick-${i}`}>
              <Line
                x1={PADDING_LEFT}
                y1={y}
                x2={svgW - PADDING_RIGHT}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <SvgText
                x={PADDING_LEFT - 6}
                y={y + 3}
                fill={PF.textMuted}
                fontSize={9}
                textAnchor="end"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : Math.round(tick).toString()}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        {showArea && points.length >= 2 && (
          smooth && points.length >= 3 ? (
            <Path d={smoothAreaPath} fill="url(#areaGrad)" />
          ) : (
            <Polygon points={areaPolygon} fill="url(#areaGrad)" />
          )
        )}

        {/* Line */}
        {smooth && points.length >= 3 ? (
          <Path
            d={smoothPath(points)}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <Polyline
            points={polylinePoints}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots */}
        {showDots &&
          points.map((p, i) => (
            <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3.5} fill={color} />
          ))}

        {/* X-axis labels */}
        {showLabels &&
          data.map((d, i) => {
            if (!d.label) return null;
            // Skip some labels if too many
            const shouldShow =
              data.length <= 10 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 8) === 0;
            if (!shouldShow) return null;
            return (
              <SvgText
                key={`label-${i}`}
                x={points[i].x}
                y={height - 6}
                fill={PF.textMuted}
                fontSize={9}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            );
          })}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
