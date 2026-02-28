import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import { ProgressBar } from '../charts/ProgressBar';
import { StackedBarChart } from '../charts/StackedBarChart';
import { PerfGlassCard, PF } from './shared';
import { formatCurrency } from '@/services/format-helpers';

interface SectionGProps {
  eprN1: number;
  eprN2: number;
  eprN3: number;
  monthlyTargetN1: number;
  monthlyTargetN2: number;
  monthlyTargetN3: number;
  weeklyTargetN1: number;
  weeklyTargetN2: number;
  weeklyTargetN3: number;
}

const QUARTER_WEIGHTS = [
  { label: 'T1', pct: 20 },
  { label: 'T2', pct: 23 },
  { label: 'T3', pct: 27 },
  { label: 'T4', pct: 30 },
];

interface DrillLevel {
  yearIndex: number | null;
  quarterIndex: number | null;
  monthIndex: number | null;
}

export function SectionG_DrivingDashboard(props: SectionGProps) {
  const { t } = useTranslation('performance');
  const [drill, setDrill] = useState<DrillLevel>({
    yearIndex: null,
    quarterIndex: null,
    monthIndex: null,
  });

  const years = [
    { label: t('drivingDashboard.year', { n: 1 }), epr: props.eprN1, color: PF.cyan },
    { label: t('drivingDashboard.year', { n: 2 }), epr: props.eprN2, color: PF.blue },
    { label: t('drivingDashboard.year', { n: 3 }), epr: props.eprN3, color: PF.green },
  ];

  const selectedYear = drill.yearIndex !== null ? years[drill.yearIndex] : null;
  const selectedQuarter = drill.quarterIndex !== null ? QUARTER_WEIGHTS[drill.quarterIndex] : null;

  // Montants calculés depuis la distribution progressive trimestrielle
  const quarterAmount = selectedYear && selectedQuarter
    ? selectedYear.epr * selectedQuarter.pct / 100
    : 0;
  const monthlyAmount = quarterAmount / 3;
  const weeklyAmount = monthlyAmount / 4;

  // Labels mois : Mois 1-12 selon le trimestre
  const getMonthLabel = (qi: number, mi: number) => t('drivingDashboard.monthLabel', { n: qi * 3 + mi + 1 });

  const quarterColors = [
    PF.accent + 'FF',      // T1 — full
    PF.accent + 'CC',      // T2 — 80%
    PF.accent + '99',      // T3 — 60%
    PF.accent + '66',      // T4 — 40%
  ];

  const eprStackedData = useMemo(() => {
    return years.map((yr) => ({
      label: yr.label,
      segments: QUARTER_WEIGHTS.map((q, qi) => ({
        label: q.label,
        value: yr.epr * q.pct / 100,
        color: quarterColors[qi],
      })),
    }));
  }, [props.eprN1, props.eprN2, props.eprN3, t]);

  return (
    <View style={styles.container}>
      {/* EPR quarterly breakdown chart */}
      {eprStackedData.length > 0 && (
        <PerfGlassCard style={styles.overviewChart}>
          <Text style={styles.sectionTitle}>
            {t('drivingDashboard.quarterBreakdown', { defaultValue: 'Repartition trimestrielle' })}
          </Text>
          <StackedBarChart
            data={eprStackedData}
            barHeight={18}
            showLegend
            formatValue={(v) => formatCurrency(v)}
          />
        </PerfGlassCard>
      )}

      {/* ──── Niveau 1 : Annuel ──── */}
      {years.map((year, idx) => {
        const isActive = drill.yearIndex === idx;
        return (
          <Pressable
            key={idx}
            onPress={() =>
              setDrill(isActive
                ? { yearIndex: null, quarterIndex: null, monthIndex: null }
                : { yearIndex: idx, quarterIndex: null, monthIndex: null }
              )
            }
          >
            <PerfGlassCard style={[styles.yearRow, isActive && styles.yearRowActive]}>
              <View style={styles.yearHeader}>
                <Text style={[styles.yearLabel, { color: year.color }]}>{year.label}</Text>
                <Text style={styles.yearEpr}>{formatCurrency(year.epr)}</Text>
                {isActive
                  ? <ChevronDown size={16} color={year.color} />
                  : <ChevronRight size={16} color={PF.textMuted} />
                }
              </View>
              <ProgressBar progress={((idx + 1) / 3) * 100} color={year.color} height={4} />
            </PerfGlassCard>
          </Pressable>
        );
      })}

      {/* ──── Niveau 2 : Trimestriel ──── */}
      {selectedYear && (
        <PerfGlassCard style={styles.quarterCard}>
          <Text style={styles.sectionTitle}>{t('drivingDashboard.quarters', { yearLabel: selectedYear.label })}</Text>
          {QUARTER_WEIGHTS.map((q, qi) => {
            const isActive = drill.quarterIndex === qi;
            return (
              <Pressable
                key={qi}
                onPress={() =>
                  setDrill(isActive
                    ? { ...drill, quarterIndex: null, monthIndex: null }
                    : { ...drill, quarterIndex: qi, monthIndex: null }
                  )
                }
              >
                <View style={[styles.quarterRow, isActive && styles.quarterRowActive]}>
                  <Text style={styles.quarterLabel}>{q.label}</Text>
                  <Text style={styles.quarterPct}>{q.pct}%</Text>
                  <View style={{ flex: 1 }}>
                    <ProgressBar progress={q.pct * 3.33} color={selectedYear.color} height={4} />
                  </View>
                  <Text style={styles.quarterValue}>
                    {formatCurrency(selectedYear.epr * q.pct / 100)}
                  </Text>
                  {isActive
                    ? <ChevronDown size={14} color={selectedYear.color} />
                    : <ChevronRight size={14} color={PF.textMuted} />
                  }
                </View>
              </Pressable>
            );
          })}
        </PerfGlassCard>
      )}

      {/* ──── Niveau 3 : Mensuel (3 mois du trimestre) ──── */}
      {selectedYear && selectedQuarter && (
        <PerfGlassCard style={styles.monthlyCard}>
          <Text style={styles.sectionTitle}>
            {t('drivingDashboard.months', { quarterLabel: selectedQuarter.label, amount: formatCurrency(quarterAmount) })}
          </Text>
          {[0, 1, 2].map((mi) => {
            const isActive = drill.monthIndex === mi;
            return (
              <Pressable
                key={mi}
                onPress={() =>
                  setDrill(isActive
                    ? { ...drill, monthIndex: null }
                    : { ...drill, monthIndex: mi }
                  )
                }
              >
                <View style={[styles.monthRow, isActive && styles.monthRowActive]}>
                  <Text style={styles.monthLabel}>
                    {getMonthLabel(drill.quarterIndex!, mi)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <ProgressBar progress={33.3} color={selectedYear.color} height={3} />
                  </View>
                  <Text style={[styles.monthValue, { color: selectedYear.color }]}>
                    {formatCurrency(monthlyAmount)}
                  </Text>
                  {isActive
                    ? <ChevronDown size={14} color={selectedYear.color} />
                    : <ChevronRight size={14} color={PF.textMuted} />
                  }
                </View>
              </Pressable>
            );
          })}
        </PerfGlassCard>
      )}

      {/* ──── Niveau 4 : Hebdomadaire (4 semaines du mois) ──── */}
      {selectedYear && drill.monthIndex !== null && (
        <PerfGlassCard style={styles.weeklyCard}>
          <Text style={styles.sectionTitle}>
            {t('drivingDashboard.weeks', { monthLabel: getMonthLabel(drill.quarterIndex!, drill.monthIndex) })}
          </Text>
          {[1, 2, 3, 4].map((w) => (
            <View key={w} style={styles.weekRow}>
              <View style={[styles.weekDot, { backgroundColor: selectedYear.color }]} />
              <Text style={styles.weekLabel}>{t('drivingDashboard.weekLabel', { n: w })}</Text>
              <View style={{ flex: 1 }}>
                <ProgressBar progress={25} color={selectedYear.color} height={3} />
              </View>
              <Text style={[styles.weekValue, { color: selectedYear.color }]}>
                {formatCurrency(weeklyAmount)}
              </Text>
            </View>
          ))}
          <View style={styles.weekSummary}>
            <Text style={styles.weekSummaryText}>
              {t('drivingDashboard.weekSummary', { weekly: formatCurrency(weeklyAmount), monthly: formatCurrency(monthlyAmount) })}
            </Text>
          </View>
        </PerfGlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  overviewChart: {
    gap: 12,
    marginBottom: 4,
  },

  /* ── Niveau 1 : Annuel ── */
  yearRow: {
    gap: 8,
    padding: 14,
  },
  yearRowActive: {
    borderColor: PF.accent + '40',
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  yearLabel: {
    fontSize: 15,
    fontWeight: '700',
    width: 50,
  },
  yearEpr: {
    flex: 1,
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  /* ── Niveau 2 : Trimestriel ── */
  quarterCard: {
    gap: 10,
    marginLeft: 16,
  },
  quarterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  quarterRowActive: {
    backgroundColor: 'rgba(251,189,35,0.05)',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  quarterLabel: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    width: 28,
  },
  quarterPct: {
    color: PF.textMuted,
    fontSize: 11,
    width: 30,
  },
  quarterValue: {
    color: PF.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },

  /* ── Niveau 3 : Mensuel ── */
  monthlyCard: {
    gap: 8,
    marginLeft: 32,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  monthRowActive: {
    backgroundColor: 'rgba(251,189,35,0.05)',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  monthLabel: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    width: 56,
  },
  monthValue: {
    fontSize: 13,
    fontWeight: '700',
    width: 80,
    textAlign: 'right',
  },

  /* ── Niveau 4 : Hebdomadaire ── */
  weeklyCard: {
    gap: 6,
    marginLeft: 48,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 46,
  },
  weekValue: {
    fontSize: 12,
    fontWeight: '700',
    width: 80,
    textAlign: 'right',
  },
  weekSummary: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PF.border,
    alignItems: 'center',
  },
  weekSummaryText: {
    color: PF.textMuted,
    fontSize: 11,
  },

  /* ── Commun ── */
  sectionTitle: {
    color: PF.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
