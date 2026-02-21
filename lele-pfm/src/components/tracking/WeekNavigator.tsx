import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getWeekRangeLabel } from '@/utils/week-helpers';

interface WeekNavigatorProps {
  week: number;
  year: number;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekNavigator({ week, year, isCurrentWeek, onPrev, onNext }: WeekNavigatorProps) {
  const rangeLabel = getWeekRangeLabel(week, year);

  return (
    <View style={styles.container}>
      <Pressable onPress={onPrev} style={styles.arrow}>
        <ChevronLeft size={24} color="#A1A1AA" />
      </Pressable>

      <View style={styles.center}>
        <Text style={[styles.dateRange, isCurrentWeek && styles.dateRangeCurrent]}>
          {rangeLabel}
        </Text>
        <Text style={styles.weekContext}>S{week} {isCurrentWeek ? '· cette semaine' : ''}</Text>
      </View>

      <Pressable onPress={onNext} style={styles.arrow}>
        <ChevronRight size={24} color="#A1A1AA" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  center: {
    alignItems: 'center',
  },
  dateRange: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dateRangeCurrent: {
    color: '#FBBF24',
  },
  weekContext: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
