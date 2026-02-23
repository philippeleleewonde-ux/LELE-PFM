import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { useWeeklyEvolution } from '@/hooks/useWeeklyEvolution';

// ---------- Component ----------

export function EvolutionCard() {
  const { t } = useTranslation('app');
  const evolution = useWeeklyEvolution();

  // Derived values from hook data
  const weekRangeLabel = `S${evolution.currentWeek} / ${evolution.currentYear}`;
  const noteDelta = evolution.previousNote !== null
    ? evolution.currentNote - evolution.previousNote
    : 0;

  // Fade-in animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (evolution.hasData) {
      opacity.setValue(0);
      translateY.setValue(16);

      const anim = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]);
      anim.start();
      return () => anim.stop();
    }
  }, [evolution.hasData]);

  if (!evolution.hasData) return null;

  const noPrevious = evolution.previousScore === null;

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY }] } as any,
      ]}
    >
      <GlassCard variant="dark" style={styles.card}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TrendingUp size={16} color="#A1A1AA" />
          <Text style={styles.headerLabel}>EVOLUTION</Text>
          <Text style={styles.weekRange}>{weekRangeLabel}</Text>
        </View>

        {noPrevious ? (
          /* ── First week — no comparison ── */
          <View style={styles.emptyState}>
            <Minus size={16} color="#52525B" />
            <Text style={styles.emptyText}>
              {t('evolution.firstWeek')}
            </Text>
          </View>
        ) : (
          <>
            {/* ── Score row ── */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('evolution.score')}</Text>
              <View style={styles.rowRight}>
                <Text style={styles.previousValue}>
                  {evolution.previousScore}
                </Text>
                <ArrowIcon delta={evolution.scoreDelta ?? 0} />
                <Text style={[styles.currentValue, { color: '#E4E4E7' }]}>
                  {evolution.currentScore}
                </Text>
                <DeltaBadge
                  value={evolution.scoreDelta ?? 0}
                  suffix=""
                  isPercent={false}
                />
              </View>
            </View>

            {/* ── Note row ── */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('evolution.note')}</Text>
              <View style={styles.rowRight}>
                <Text style={styles.previousValue}>
                  {evolution.previousNote}/10
                </Text>
                <ArrowIcon delta={noteDelta} />
                <Text style={[styles.currentValue, { color: '#E4E4E7' }]}>
                  {evolution.currentNote}/10
                </Text>
                <DeltaBadge
                  value={noteDelta}
                  suffix=""
                  isPercent={false}
                />
              </View>
            </View>

            {/* ── Epargne row ── */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('evolution.savings')}</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.currentValue, { color: '#E4E4E7' }]}>
                  {formatCurrency(evolution.currentEcon)}
                </Text>
                <DeltaBadge
                  value={evolution.econDeltaPercent ?? 0}
                  suffix="%"
                  isPercent={true}
                />
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider} />

            {/* ── Best lever ── */}
            {evolution.bestImprovedLever && (evolution.bestImprovedLever.delta ?? 0) > 0 && (
              <View style={styles.leverRow}>
                <ArrowUpRight size={13} color={evolution.bestImprovedLever.color} />
                <Text
                  style={[styles.leverText, { color: evolution.bestImprovedLever.color }]}
                  numberOfLines={1}
                >
                  {t('evolution.bestProgression', { label: evolution.bestImprovedLever.label, delta: evolution.bestImprovedLever.delta })}
                </Text>
              </View>
            )}

            {/* ── Worst lever ── */}
            {evolution.worstLever && (evolution.worstLever.delta ?? 0) < 0 && (
              <View style={styles.leverRow}>
                <ArrowDownRight size={13} color="#F87171" />
                <Text
                  style={[styles.leverText, { color: '#F87171' }]}
                  numberOfLines={1}
                >
                  {t('evolution.toWatch', { label: evolution.worstLever.label, delta: evolution.worstLever.delta })}
                </Text>
              </View>
            )}
          </>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// ---------- Sub-components ----------

function ArrowIcon({ delta }: { delta: number }) {
  if (delta > 0) return <ArrowUpRight size={14} color="#4ADE80" />;
  if (delta < 0) return <ArrowDownRight size={14} color="#F87171" />;
  return <Minus size={12} color="#52525B" />;
}

function DeltaBadge({
  value,
  suffix,
  isPercent,
}: {
  value: number;
  suffix: string;
  isPercent: boolean;
}) {
  if (value === 0) return null;

  const isPositive = value > 0;
  const color = isPositive ? '#4ADE80' : '#F87171';
  const bgColor = isPositive
    ? 'rgba(74,222,128,0.12)'
    : 'rgba(248,113,113,0.12)';
  const sign = isPositive ? '+' : '';
  const display = isPercent
    ? `${sign}${Math.round(value)}${suffix}`
    : `${sign}${value}${suffix}`;

  return (
    <View style={[styles.deltaBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.deltaBadgeText, { color }]}>{display}</Text>
    </View>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerLabel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  weekRange: {
    color: '#52525B',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  // Empty state
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  emptyText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // Data rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  rowLabel: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previousValue: {
    color: '#52525B',
    fontSize: 13,
    fontWeight: '500',
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Delta badge
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  deltaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
  },
  // Lever rows
  leverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  leverText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
