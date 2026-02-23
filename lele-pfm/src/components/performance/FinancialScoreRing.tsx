/**
 * FinancialScoreRing — Double cercle SVG
 *
 * Cercle interieur : score global /100 (anime via strokeDashoffset)
 * Anneau exterieur : 5 arcs colores animes en stagger (strokeDashoffset)
 * Legende : 5 pastilles horizontales avec score individuel
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react-native';
import { useFinancialScore } from '@/hooks/useFinancialScore';
import { formatGrade } from '@/services/format-helpers';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── SVG geometry helpers ───

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Arc path length for a circular arc of given angle (degrees) and radius */
function arcLength(angleDeg: number, radius: number): number {
  return (angleDeg / 360) * 2 * Math.PI * radius;
}

// ─── Props ───

interface FinancialScoreRingProps {
  compact?: boolean;
}

// ─── Component ───

export function FinancialScoreRing({ compact = false }: FinancialScoreRingProps) {
  const { t } = useTranslation('performance');
  const { globalScore, grade, levers, weeklyTrend } = useFinancialScore();
  const gradeInfo = formatGrade(grade);

  // ─── Sizes ───
  const svgSize = compact ? 180 : 220;
  const center = svgSize / 2;

  // Inner ring
  const innerRadius = compact ? 50 : 60;
  const innerStroke = compact ? 8 : 10;
  const innerCircumference = 2 * Math.PI * innerRadius;

  // Outer arcs
  const outerRadius = compact ? 76 : 90;
  const outerStroke = compact ? 7 : 8;

  // Arc config: 5 arcs of ~68 degrees each (360/5 = 72, minus 4 degree gap)
  const arcDeg = 68;
  const gapDeg = 4;

  // ─── Animation values ───
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const arcAnimValues = useRef(levers.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Reset all
    animatedProgress.setValue(0);
    arcAnimValues.forEach((a) => a.setValue(0));

    // 1. Animate inner ring (1200ms)
    Animated.timing(animatedProgress, {
      toValue: Math.min(100, Math.max(0, globalScore)),
      duration: 1200,
      useNativeDriver: false,
    }).start(() => {
      // 2. Then stagger outer arcs drawing
      Animated.stagger(
        150,
        arcAnimValues.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
        ),
      ).start();
    });
  }, [globalScore]);

  // Inner ring strokeDashoffset
  const innerDashOffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [innerCircumference, 0],
  });

  // ─── Trend icon ───
  const TrendIcon = weeklyTrend === 'up' ? ChevronUp : weeklyTrend === 'down' ? ChevronDown : Minus;
  const trendColor = weeklyTrend === 'up' ? '#4ADE80' : weeklyTrend === 'down' ? '#F87171' : '#71717A';

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* SVG Double Ring */}
      <View style={{ width: svgSize, height: svgSize, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={svgSize} height={svgSize}>
          {/* Outer arc backgrounds (always visible, dim) */}
          {levers.map((lever, i) => {
            const startAngle = i * (arcDeg + gapDeg);
            const endAngle = startAngle + arcDeg;
            return (
              <Path
                key={`bg-${lever.code}`}
                d={arcPath(center, center, outerRadius, startAngle, endAngle)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={outerStroke}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Outer arc fills — animated via strokeDashoffset */}
          {levers.map((lever, i) => {
            const startAngle = i * (arcDeg + gapDeg);
            const fillDeg = (lever.score / 100) * arcDeg;
            if (fillDeg < 1) return null;
            const endAngle = startAngle + fillDeg;
            const pathLen = arcLength(fillDeg, outerRadius);

            const dashOffset = arcAnimValues[i].interpolate({
              inputRange: [0, 1],
              outputRange: [pathLen, 0],
            });

            return (
              <AnimatedPath
                key={`fill-${lever.code}`}
                d={arcPath(center, center, outerRadius, startAngle, endAngle)}
                stroke={lever.color}
                strokeWidth={outerStroke}
                fill="none"
                strokeLinecap="round"
                opacity={0.85}
                strokeDasharray={`${pathLen} ${pathLen}`}
                strokeDashoffset={dashOffset}
              />
            );
          })}

          {/* Inner ring track */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={innerStroke}
            fill="none"
          />

          {/* Inner ring progress (animated) */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke={gradeInfo.color}
            strokeWidth={innerStroke}
            fill="none"
            strokeDasharray={`${innerCircumference} ${innerCircumference}`}
            strokeDashoffset={innerDashOffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        </Svg>

        {/* Center overlay: score + grade */}
        <View style={[styles.centerOverlay, { width: svgSize, height: svgSize }]}>
          <Text style={[styles.scoreText, compact && styles.scoreTextCompact, { color: gradeInfo.color }]}>
            {globalScore}
          </Text>
          <Text style={[styles.scoreMax, compact && styles.scoreMaxCompact]}>/100</Text>
          <View style={styles.gradeRow}>
            <View style={[styles.gradeBadge, { backgroundColor: gradeInfo.bg }]}>
              <Text style={[styles.gradeText, compact && styles.gradeTextCompact, { color: gradeInfo.color }]}>
                {grade}
              </Text>
            </View>
            <TrendIcon size={compact ? 16 : 18} color={trendColor} />
          </View>
        </View>
      </View>

      {/* Legend — 5 lever pills (always visible) */}
      <View style={styles.legend}>
        {levers.map((lever) => (
          <View key={lever.code} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: lever.color }]} />
            <Text style={styles.legendCode}>{lever.code}</Text>
            <Text style={[styles.legendScore, { color: lever.color }]}>{lever.score}</Text>
          </View>
        ))}
      </View>

      {/* Subtitle */}
      {!compact && (
        <Text style={styles.subtitle}>{t('scoreRing.subtitle')}</Text>
      )}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  containerCompact: {
    paddingVertical: 8,
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '900',
  },
  scoreTextCompact: {
    fontSize: 30,
  },
  scoreMax: {
    fontSize: 14,
    color: '#71717A',
    marginTop: -2,
  },
  scoreMaxCompact: {
    fontSize: 13,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  gradeTextCompact: {
    fontSize: 15,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
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
  legendCode: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '700',
  },
  legendScore: {
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
