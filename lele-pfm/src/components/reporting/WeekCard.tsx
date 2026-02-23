import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getGradeColor, getNoteColor } from '@/domain/calculators/weekly-savings-engine';
import { WeekCalendarEntry } from '@/hooks/usePerformanceCalendar';
import { getWeekLabel } from '@/utils/week-helpers';
import { formatCurrency } from '@/services/format-helpers';

interface WeekCardProps {
  entry: WeekCalendarEntry;
  isCurrentWeek: boolean;
  onPress: (entry: WeekCalendarEntry) => void;
}

function getCardColors(entry: WeekCalendarEntry) {
  if (!entry.hasTransactions) {
    return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' };
  }
  const gradeColor = getGradeColor(entry.savings.grade);
  return {
    bg: `${gradeColor}14`,
    border: `${gradeColor}4D`,
  };
}

export function WeekCard({ entry, isCurrentWeek, onPress }: WeekCardProps) {
  const { t } = useTranslation('tracking');
  const { week, year, budget, spent, savings, hasTransactions } = entry;
  const colors = getCardColors(entry);

  // Only render weeks with data — empty weeks are filtered at the calendar level
  if (!hasTransactions) return null;

  const gradeColor = getGradeColor(savings.grade);
  const progressPercent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <Pressable
      onPress={() => onPress(entry)}
      style={[
        styles.card,
        {
          backgroundColor: colors.bg,
          borderColor: isCurrentWeek ? '#FBBF24' : colors.border,
          borderWidth: isCurrentWeek ? 2 : 1,
        },
      ]}
    >
      {/* Top Row */}
      <View style={styles.topRow}>
        {/* Left: Week number + date range */}
        <View style={styles.leftCol}>
          <Text style={styles.weekNum}>S{week}</Text>
          <Text style={styles.dateRange}>{getWeekLabel(week, year)}</Text>
        </View>

        {/* Right: Grade badge */}
        <View style={[styles.gradeBadge, { backgroundColor: `${gradeColor}20` }]}>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{savings.grade}</Text>
          <Text style={[styles.noteText, { color: getNoteColor(savings.note) }]}>
            {savings.note}/10
          </Text>
          <Text style={styles.ecoText}>+{formatCurrency(savings.economies)}</Text>
        </View>
      </View>

      {/* Bottom: Progress bar + budget info */}
      <View style={styles.bottomSection}>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent > 100 ? '#F87171' : gradeColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressPct}>{progressPercent}%</Text>
        </View>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>{t('reporting.budget')}: {formatCurrency(budget)}</Text>
          <Text style={styles.spentLabel}>{t('reporting.expenseShort')}: {formatCurrency(spent)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 130,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  weekNum: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  dateRange: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
  },
  gradeBadge: {
    width: 90,
    height: 80,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  gradeText: {
    fontSize: 20,
    fontWeight: '900',
  },
  noteText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ecoText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSection: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressPct: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '500',
  },
  spentLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '500',
  },
});
