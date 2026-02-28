/**
 * AreaFanChart — SVG fan/confidence band chart for Monte Carlo percentiles.
 *
 * Multiple overlapping area bands from widest to narrowest.
 * Median line highlighted. Animated opacity fade-in.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { PF } from '../performance/shared';

export interface FanBand {
  label: string;
  upper: number;
  lower: number;
  color: string;
}

export interface FanDataPoint {
  label: string;
  bands: FanBand[];
  median?: number;
}

interface AreaFanChartProps {
  data: FanDataPoint[];
  height?: number;
  width?: number;
  medianColor?: string;
}

const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

export default function AreaFanChart({
  data,
  height = 180,
  width: explicitWidth,
  medianColor = PF.accent,
}: AreaFanChartProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = React.useState(explicitWidth ?? 300);

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [data]);

  const onLayout = (e: LayoutChangeEvent) => {
    if (!explicitWidth) setContainerWidth(e.nativeEvent.layout.width);
  };

  const svgW = explicitWidth ?? containerWidth;

  const { bands, medianPath, yMin, yMax, yTicks } = useMemo(() => {
    if (!data || data.length < 2) {
      return { bands: [] as { path: string; color: string; opacityVal: number }[], medianPath: '', yMin: 0, yMax: 1, yTicks: [] as number[] };
    }

    const allValues: number[] = [];
    data.forEach((d) => {
      d.bands.forEach((b) => { allValues.push(b.upper, b.lower); });
      if (d.median !== undefined) allValues.push(d.median);
    });

    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const range = rawMax - rawMin || 1;
    const pad = range * 0.1;
    const mn = rawMin - pad;
    const mx = rawMax + pad;

    const plotW = svgW - PAD_L - PAD_R;
    const plotH = height - PAD_T - PAD_B;

    const toX = (i: number) => PAD_L + (i / (data.length - 1)) * plotW;
    const toY = (v: number) => PAD_T + plotH - ((v - mn) / (mx - mn)) * plotH;

    const numBands = data[0]?.bands.length ?? 0;
    const bandPaths: { path: string; color: string; opacityVal: number }[] = [];

    for (let b = 0; b < numBands; b++) {
      const upperPts = data.map((d, i) => `${toX(i)},${toY(d.bands[b]?.upper ?? 0)}`);
      const lowerPts = data.map((d, i) => `${toX(i)},${toY(d.bands[b]?.lower ?? 0)}`).reverse();
      const path = `M${upperPts.join(' L')} L${lowerPts.join(' L')} Z`;
      const opacityVal = 0.15 + (b / Math.max(1, numBands - 1)) * 0.25;
      bandPaths.push({ path, color: data[0].bands[b]?.color ?? PF.blue, opacityVal });
    }

    let mPath = '';
    if (data[0]?.median !== undefined) {
      const pts = data.map((d, i) => `${toX(i)},${toY(d.median ?? 0)}`);
      mPath = `M${pts.join(' L')}`;
    }

    const tickCount = 3;
    const ticks = Array.from({ length: tickCount + 1 }).map(
      (_, i) => mn + ((mx - mn) / tickCount) * i,
    );

    return { bands: bandPaths, medianPath: mPath, yMin: mn, yMax: mx, yTicks: ticks };
  }, [data, svgW, height]);

  if (!data || data.length < 2) return null;

  const plotH = height - PAD_T - PAD_B;

  return (
    <Animated.View style={[styles.container, { opacity }]} onLayout={onLayout}>
      <Svg width={svgW} height={height}>
        <Defs>
          {bands.map((band, i) => (
            <LinearGradient key={`fg-${i}`} id={`fanGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={band.color} stopOpacity={band.opacityVal} />
              <Stop offset="1" stopColor={band.color} stopOpacity={band.opacityVal * 0.5} />
            </LinearGradient>
          ))}
        </Defs>

        {yTicks.map((tick, i) => {
          const y = PAD_T + plotH - ((tick - yMin) / (yMax - yMin)) * plotH;
          return (
            <React.Fragment key={`yt-${i}`}>
              <Line x1={PAD_L} y1={y} x2={svgW - PAD_R} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <SvgText x={PAD_L - 6} y={y + 3} fill={PF.textMuted} fontSize={9} textAnchor="end">
                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : Math.round(tick).toString()}
              </SvgText>
            </React.Fragment>
          );
        })}

        {bands.map((band, i) => (
          <Path key={`band-${i}`} d={band.path} fill={`url(#fanGrad-${i})`} />
        ))}

        {medianPath !== '' && (
          <Path d={medianPath} stroke={medianColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {data.map((d, i) => {
          const shouldShow = data.length <= 12 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 8) === 0;
          if (!shouldShow || !d.label) return null;
          const x = PAD_L + (i / (data.length - 1)) * (svgW - PAD_L - PAD_R);
          return (
            <SvgText key={`xl-${i}`} x={x} y={height - 6} fill={PF.textMuted} fontSize={9} textAnchor="middle">
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

export { AreaFanChart };

const styles = StyleSheet.create({
  container: { width: '100%' },
});
