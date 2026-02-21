import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];
const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

interface MiniCalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date; // defaults to today
}

export function MiniCalendar({ selected, onSelect, minDate }: MiniCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ?? today;

  const [viewMonth, setViewMonth] = useState(
    selected ? selected.getMonth() : today.getMonth(),
  );
  const [viewYear, setViewYear] = useState(
    selected ? selected.getFullYear() : today.getFullYear(),
  );

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    // Monday = 0, Sunday = 6
    let startDay = first.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to fill last row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewMonth, viewYear]);

  const goBack = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goForward = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const canGoBack = viewYear > min.getFullYear() ||
    (viewYear === min.getFullYear() && viewMonth > min.getMonth());

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === viewMonth &&
      selected.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  };

  const handleSelect = (day: number) => {
    if (isPast(day)) return;
    onSelect(new Date(viewYear, viewMonth, day));
  };

  return (
    <View style={styles.container}>
      {/* Month nav */}
      <View style={styles.navRow}>
        <Pressable
          onPress={goBack}
          disabled={!canGoBack}
          style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
        >
          <ChevronLeft size={18} color={canGoBack ? '#E4E4E7' : '#3F3F46'} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={goForward} style={styles.navBtn}>
          <ChevronRight size={18} color="#E4E4E7" />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {days.map((day, i) => {
          if (day === null) {
            return <View key={`e-${i}`} style={styles.dayCell} />;
          }
          const past = isPast(day);
          const sel = isSelected(day);
          const tod = isToday(day);

          return (
            <Pressable
              key={`d-${day}`}
              onPress={() => handleSelect(day)}
              disabled={past}
              style={[
                styles.dayCell,
                sel && styles.dayCellSelected,
                tod && !sel && styles.dayCellToday,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  past && styles.dayTextPast,
                  sel && styles.dayTextSelected,
                  tod && !sel && styles.dayTextToday,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginTop: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  monthLabel: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    color: '#52525B',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 40,
  },
  dayCellSelected: {
    backgroundColor: '#22D3EE',
    borderRadius: 12,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)',
    borderRadius: 12,
  },
  dayText: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextPast: {
    color: '#3F3F46',
  },
  dayTextSelected: {
    color: '#0F1014',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#22D3EE',
    fontWeight: '700',
  },
});
