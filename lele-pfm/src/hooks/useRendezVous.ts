/**
 * useRendezVous — LELE PFM
 *
 * Manages check-in scheduling, countdown, streak tracking,
 * and notification planning.
 */

import { useMemo } from 'react';
import { useJourneyStore } from '@/stores/journey-store';
import { RendezVousFrequency } from '@/types/investor-journey';

const FREQUENCY_DAYS: Record<RendezVousFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
};

export interface RendezVousState {
  nextDate: Date | null;
  daysUntilNext: number;
  hoursUntilNext: number;
  isOverdue: boolean;
  streak: number;
  completionRate: number;
  totalScheduled: number;
  totalCompleted: number;
  totalMissed: number;
}

export function useRendezVous(): RendezVousState {
  const config = useJourneyStore((s) => s.rendezVousConfig);
  const checkIns = useJourneyStore((s) => s.checkIns);
  const lastCheckInAt = useJourneyStore((s) => s.lastCheckInAt);
  const journeyStartedAt = useJourneyStore((s) => s.journeyStartedAt);

  return useMemo(() => {
    const now = new Date();

    if (!config.enabled || !journeyStartedAt) {
      return {
        nextDate: null,
        daysUntilNext: 0,
        hoursUntilNext: 0,
        isOverdue: false,
        streak: 0,
        completionRate: 0,
        totalScheduled: 0,
        totalCompleted: 0,
        totalMissed: 0,
      };
    }

    // Calculate next check-in date
    const intervalDays = FREQUENCY_DAYS[config.frequency];
    let nextDate: Date;

    if (lastCheckInAt) {
      const lastDate = new Date(lastCheckInAt);
      nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);

      // Adjust to configured day of week
      const targetDay = config.dayOfWeek;
      while (nextDate.getDay() !== targetDay) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else {
      // First check-in: next configured day from now
      nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + intervalDays);
      const targetDay = config.dayOfWeek;
      while (nextDate.getDay() !== targetDay) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    }

    const diffMs = nextDate.getTime() - now.getTime();
    const daysUntilNext = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hoursUntilNext = Math.ceil(diffMs / (1000 * 60 * 60));
    const isOverdue = diffMs < 0;

    // Calculate streak (consecutive non-missed from latest)
    let streak = 0;
    for (let i = checkIns.length - 1; i >= 0; i--) {
      if (checkIns[i].status === 'completed') {
        streak++;
      } else {
        break;
      }
    }

    // Stats
    const totalCompleted = checkIns.filter((c) => c.status === 'completed').length;
    const totalMissed = checkIns.filter((c) => c.status === 'missed').length;
    const totalScheduled = checkIns.length;
    const completionRate = totalScheduled > 0
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 100;

    return {
      nextDate,
      daysUntilNext: Math.max(0, daysUntilNext),
      hoursUntilNext: Math.max(0, hoursUntilNext),
      isOverdue,
      streak,
      completionRate,
      totalScheduled,
      totalCompleted,
      totalMissed,
    };
  }, [config, checkIns, lastCheckInAt, journeyStartedAt]);
}
