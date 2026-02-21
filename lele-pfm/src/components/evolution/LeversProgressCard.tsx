/**
 * LeversProgressCard -- Affiche les 5 leviers du score financier
 * avec barres de progression colorees et deltas semaine/semaine.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target, ChevronUp, ChevronDown, Minus } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWeeklyEvolution, LeverEvolution } from '@/hooks/useWeeklyEvolution';

// ─── Delta indicator ───

function DeltaIndicator({ trend, delta }: { trend: LeverEvolution['trend']; delta: number | null }) {
  if (trend === 'up') {
    return (
      <View style={styles.deltaRow}>
        <ChevronUp size={14} color="#4ADE80" />
        {delta !== null && (
          <Text style={[styles.deltaText, { color: '#4ADE80' }]}>+{delta}</Text>
        )}
      </View>
    );
  }
  if (trend === 'down') {
    return (
      <View style={styles.deltaRow}>
        <ChevronDown size={14} color="#F87171" />
        {delta !== null && (
          <Text style={[styles.deltaText, { color: '#F87171' }]}>{delta}</Text>
        )}
      </View>
    );
  }
  return (
    <View style={styles.deltaRow}>
      <Minus size={14} color="#71717A" />
    </View>
  );
}

// ─── Lever row ───

function LeverRow({ lever }: { lever: LeverEvolution }) {
  const barWidth = Math.min(Math.max(lever.current, 0), 100);

  return (
    <View style={styles.leverRow}>
      {/* Code (3 letters) */}
      <Text style={styles.leverCode}>{lever.code}</Text>

      {/* Progress bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${barWidth}%`, backgroundColor: lever.color },
            ]}
          />
        </View>
      </View>

      {/* Score number */}
      <Text style={[styles.leverScore, { color: lever.color }]}>
        {Math.round(lever.current)}
      </Text>

      {/* Delta arrow + value */}
      <DeltaIndicator trend={lever.trend} delta={lever.delta} />
    </View>
  );
}

// ─── Score trend arrow for bottom row ───

function scoreTrendSymbol(delta: number | null): string {
  if (delta === null) return '';
  if (delta > 0) return '\u2191';   // up arrow
  if (delta < 0) return '\u2193';   // down arrow
  return '\u2192';                   // right arrow (stable)
}

function formatDelta(delta: number | null): string {
  if (delta === null) return '';
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

// ─── Component ───

export function LeversProgressCard() {
  const { leversEvolution, currentScore, scoreDelta, hasData } = useWeeklyEvolution();

  if (!hasData) {
    return null;
  }

  return (
    <GlassCard variant="dark" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Target size={18} color="#FBBF24" />
        <Text style={styles.headerLabel}>TES LEVIERS</Text>
      </View>

      {/* Lever rows */}
      <View style={styles.leversContainer}>
        {leversEvolution.map((lever) => (
          <LeverRow key={lever.code} lever={lever} />
        ))}
      </View>

      {/* Bottom summary */}
      <View style={styles.bottomSection}>
        <Text style={styles.bottomText}>
          Score global : {Math.round(currentScore)}/100
          {scoreDelta !== null && (
            ` (${scoreTrendSymbol(scoreDelta)} ${formatDelta(scoreDelta)})`
          )}
        </Text>
      </View>
    </GlassCard>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#71717A',
    textTransform: 'uppercase',
  },
  leversContainer: {
    gap: 10,
  },
  leverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leverCode: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#71717A',
    textTransform: 'uppercase',
  },
  barContainer: {
    flex: 1,
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  leverScore: {
    width: 28,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 44,
    justifyContent: 'flex-end',
    gap: 2,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E4E4E7',
    textAlign: 'center',
  },
});
