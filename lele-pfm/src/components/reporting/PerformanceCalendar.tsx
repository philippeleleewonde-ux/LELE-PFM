import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, Eye } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { getCurrentWeek } from '@/utils/week-helpers';
import { usePerformanceCalendar, WeekCalendarEntry, MonthCalendarEntry } from '@/hooks/usePerformanceCalendar';
import { getGradeColor, getNoteColor, MONTH_NAMES_FR } from '@/domain/calculators/weekly-savings-engine';
import { WeekCard } from './WeekCard';
import { WeekReportSheet, PeriodReportSheet } from './PeriodReportSheet';

// ─── Simple FadeIn wrapper (key-based remount triggers fade) ───

function FadeIn({ children, duration = 250, staggerIndex = 0, staggerDelay = 60 }: {
  children: React.ReactNode;
  duration?: number;
  staggerIndex?: number;
  staggerDelay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = staggerIndex * staggerDelay;
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: false }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] } as any}>
      {children}
    </Animated.View>
  );
}

// ─── Main component ───

interface PerformanceCalendarProps {
  initialYear?: number;
}

export function PerformanceCalendar({ initialYear }: PerformanceCalendarProps) {
  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const [selectedYear, setSelectedYear] = useState(initialYear ?? currentYear);
  const currentMonth = new Date().getMonth() + 1; // 1-based
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekCalendarEntry | null>(null);
  const [monthReport, setMonthReport] = useState<MonthCalendarEntry | null>(null);
  const [showYearReport, setShowYearReport] = useState(false);

  const calendarData = usePerformanceCalendar(selectedYear);

  const handleWeekPress = useCallback((entry: WeekCalendarEntry) => {
    if (entry.hasTransactions) {
      setSelectedWeek(entry);
    }
  }, []);

  const handleMonthPress = useCallback((month: MonthCalendarEntry) => {
    if (month.summary.nbSemaines > 0) {
      setMonthReport(month);
    }
  }, []);

  // Navigate months
  const goToPrevMonth = useCallback(() => {
    setSelectedMonth((m) => (m <= 1 ? 12 : m - 1));
    if (selectedMonth === 1) setSelectedYear((y) => y - 1);
  }, [selectedMonth]);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((m) => (m >= 12 ? 1 : m + 1));
    if (selectedMonth === 12) setSelectedYear((y) => y + 1);
  }, [selectedMonth]);

  // Displayed months — only months that have at least one week with data
  const displayedMonths = useMemo(() => {
    const source = showAllMonths
      ? calendarData.months
      : calendarData.months.filter((m) => m.month === selectedMonth);
    // Filter out months with zero data in "all months" mode
    if (showAllMonths) return source.filter((m) => m.summary.nbSemaines > 0);
    return source;
  }, [calendarData.months, selectedMonth, showAllMonths]);

  // Current month data for the summary band
  const currentMonthData = useMemo(() => {
    return calendarData.months.find((m) => m.month === selectedMonth);
  }, [calendarData.months, selectedMonth]);

  if (!calendarData.hasEngine) {
    return (
      <View style={styles.emptyContainer}>
        <Calendar size={40} color="#52525B" />
        <Text style={styles.emptyText}>
          Completez le wizard pour voir votre calendrier de performance.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Year Navigator */}
      <View style={styles.yearNav}>
        <Pressable onPress={() => setSelectedYear(selectedYear - 1)} style={styles.yearNavBtn}>
          <ChevronLeft size={20} color="#A1A1AA" />
        </Pressable>
        <Pressable onPress={() => setShowYearReport(true)}>
          <Text style={styles.yearLabel}>{selectedYear}</Text>
        </Pressable>
        <Pressable onPress={() => setSelectedYear(selectedYear + 1)} style={styles.yearNavBtn}>
          <ChevronRight size={20} color="#A1A1AA" />
        </Pressable>
      </View>

      {/* Year Summary Bar */}
      {calendarData.yearSummary.nbSemaines > 0 && (
        <Pressable onPress={() => setShowYearReport(true)}>
          <GlassCard variant="dark" style={styles.yearSummary}>
            <View style={styles.yearSummaryRow}>
              <View style={styles.yearStatBlock}>
                <Text style={styles.yearStatLabel}>Note moyenne</Text>
                <Text style={[styles.yearStatValue, { color: getNoteColor(calendarData.yearSummary.noteMoyenne) }]}>
                  {calendarData.yearSummary.noteMoyenne}/10
                </Text>
              </View>
              <View style={styles.yearStatBlock}>
                <Text style={styles.yearStatLabel}>Grade</Text>
                <Text style={[styles.yearStatValue, { color: getGradeColor(calendarData.yearSummary.gradeMoyen) }]}>
                  {calendarData.yearSummary.gradeMoyen}
                </Text>
              </View>
              <View style={styles.yearStatBlock}>
                <Text style={styles.yearStatLabel}>Economies</Text>
                <Text style={[styles.yearStatValue, { color: '#4ADE80' }]}>
                  {formatCurrency(calendarData.yearSummary.totalEconomies)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      )}

      {/* Month Slider Navigator */}
      {!showAllMonths && (
        <View style={styles.monthNav}>
          <Pressable onPress={goToPrevMonth} style={styles.monthNavBtn}>
            <ChevronLeft size={18} color="#A1A1AA" />
          </Pressable>
          <Text style={styles.monthNavLabel}>{MONTH_NAMES_FR[selectedMonth - 1]}</Text>
          <Pressable onPress={goToNextMonth} style={styles.monthNavBtn}>
            <ChevronRight size={18} color="#A1A1AA" />
          </Pressable>
        </View>
      )}

      {/* Toggle full year */}
      <Pressable
        onPress={() => setShowAllMonths(!showAllMonths)}
        style={styles.toggleYearBtn}
      >
        <Eye size={14} color="#FBBF24" />
        <Text style={styles.toggleYearText}>
          {showAllMonths ? 'Voir par mois' : "Voir toute l'annee"}
        </Text>
      </Pressable>

      {/* Month Summary Band (single month mode only) */}
      {!showAllMonths && currentMonthData && currentMonthData.summary.nbSemaines > 0 && (
        <Pressable onPress={() => handleMonthPress(currentMonthData)} style={styles.monthBand}>
          <Text style={[styles.monthBandGrade, { color: getGradeColor(currentMonthData.summary.gradeMoyen) }]}>
            {currentMonthData.summary.gradeMoyen}
          </Text>
          <Text style={[styles.monthBandNote, { color: getNoteColor(currentMonthData.summary.noteMoyenne) }]}>
            {currentMonthData.summary.noteMoyenne}/10
          </Text>
          <Text style={styles.monthBandEco}>+{formatCurrency(currentMonthData.summary.totalEconomies)}</Text>
          <Text style={styles.monthBandWeeks}>{currentMonthData.summary.nbSemaines} sem.</Text>
        </Pressable>
      )}

      {/* Month Sections with WeekCards */}
      {displayedMonths.map((month) => (
        <View key={`${selectedYear}-${month.month}`}>
          {/* Month header (only in "all months" mode) */}
          {showAllMonths && (
            <Pressable onPress={() => handleMonthPress(month)} style={styles.monthHeader}>
              <Text style={styles.monthHeaderLabel}>{month.label}</Text>
              {month.summary.nbSemaines > 0 && (
                <View style={styles.monthHeaderBadge}>
                  <Text style={[styles.monthHeaderGrade, { color: getGradeColor(month.summary.gradeMoyen) }]}>
                    {month.summary.gradeMoyen}
                  </Text>
                  <Text style={styles.monthHeaderEco}>+{formatCurrency(month.summary.totalEconomies)}</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Week Cards — only weeks with data */}
          <FadeIn key={`fade-${selectedYear}-${month.month}-${showAllMonths}`} duration={250}>
            <View style={styles.weekList}>
              {month.weeks.filter((w) => w.hasTransactions).length > 0 ? (
                month.weeks.filter((w) => w.hasTransactions).map((weekEntry, idx) => (
                  <FadeIn key={weekEntry.week} staggerIndex={idx} staggerDelay={60}>
                    <WeekCard
                      entry={weekEntry}
                      isCurrentWeek={weekEntry.week === currentWeek && weekEntry.year === currentYear}
                      onPress={handleWeekPress}
                    />
                  </FadeIn>
                ))
              ) : (
                <View style={styles.noDataBanner}>
                  <Text style={styles.noDataText}>Aucune donnee ce mois</Text>
                </View>
              )}
            </View>
          </FadeIn>
        </View>
      ))}

      {/* Week Report Sheet */}
      <WeekReportSheet
        visible={selectedWeek !== null}
        entry={selectedWeek}
        onClose={() => setSelectedWeek(null)}
      />

      {/* Month Report Sheet */}
      <PeriodReportSheet
        visible={monthReport !== null}
        title={monthReport ? monthReport.label : ''}
        subtitle={`${selectedYear}`}
        summary={monthReport?.summary ?? null}
        onClose={() => setMonthReport(null)}
      />

      {/* Year Report Sheet */}
      <PeriodReportSheet
        visible={showYearReport}
        title={`Bilan ${selectedYear}`}
        subtitle="Rapport annuel"
        summary={calendarData.yearSummary.nbSemaines > 0 ? calendarData.yearSummary : null}
        onClose={() => setShowYearReport(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    color: '#71717A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Year nav
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
  },
  yearNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearLabel: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  // Year summary
  yearSummary: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  yearSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  yearStatBlock: {
    alignItems: 'center',
    gap: 4,
  },
  yearStatLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Month slider nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavLabel: {
    color: '#FBBF24',
    fontSize: 18,
    fontWeight: '800',
    minWidth: 100,
    textAlign: 'center',
  },

  // Toggle full year
  toggleYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 8,
  },
  toggleYearText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
  },

  // Month summary band
  monthBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  monthBandGrade: {
    fontSize: 16,
    fontWeight: '900',
  },
  monthBandNote: {
    fontSize: 14,
    fontWeight: '700',
  },
  monthBandEco: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  monthBandWeeks: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
  },

  // Month header (all-months mode)
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 10,
  },
  monthHeaderLabel: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '700',
  },
  monthHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthHeaderGrade: {
    fontSize: 14,
    fontWeight: '800',
  },
  monthHeaderEco: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },

  // Week list
  weekList: {
    gap: 10,
  },

  // No data fallback
  noDataBanner: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noDataText: {
    color: '#52525B',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
