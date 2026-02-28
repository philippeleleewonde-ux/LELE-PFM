import { useMemo, useCallback } from 'react';
import { useInvestmentStore } from '@/stores/investment-store';
import { MISSION_TEMPLATES } from '@/constants/mission-templates';
import { MissionTemplate, MissionRecord } from '@/types/investment';

interface MonthlyMissionResult {
  currentMission: MissionTemplate | null;
  missionStatus: 'pending' | 'completed' | 'skipped';
  completedCount: number;
  totalMissions: number;
  confirmMission: () => void;
  skipCurrentMission: () => void;
  history: MissionRecord[];
}

export function useMonthlyMission(): MonthlyMissionResult {
  const strategyGeneratedAt = useInvestmentStore((s) => s.strategyGeneratedAt);
  const missions = useInvestmentStore((s) => s.missions);
  const completeMission = useInvestmentStore((s) => s.completeMission);
  const skipMission = useInvestmentStore((s) => s.skipMission);
  const setStrategyGeneratedAt = useInvestmentStore((s) => s.setStrategyGeneratedAt);

  const { currentMission, missionStatus, completedCount } = useMemo(() => {
    if (!strategyGeneratedAt) {
      return { currentMission: null, missionStatus: 'pending' as const, completedCount: 0 };
    }

    const start = new Date(strategyGeneratedAt);
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const currentMonthIndex = ((monthsElapsed % 12) + 12) % 12; // always 0-11

    const template = MISSION_TEMPLATES[currentMonthIndex] || MISSION_TEMPLATES[0];

    // Check if already completed/skipped for current month+year
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const existing = missions.find(
      (m) => m.templateId === template.id && m.month === currentMonth && m.year === currentYear,
    );

    const status: 'pending' | 'completed' | 'skipped' = existing?.status ?? 'pending';
    const completed = missions.filter((m) => m.status === 'completed').length;

    return { currentMission: template, missionStatus: status, completedCount: completed };
  }, [strategyGeneratedAt, missions]);

  const confirmMissionCb = useCallback(() => {
    if (currentMission) {
      completeMission(currentMission.id);
      // Auto-set strategyGeneratedAt if not set
      if (!strategyGeneratedAt) {
        setStrategyGeneratedAt(new Date().toISOString());
      }
    }
  }, [currentMission, completeMission, strategyGeneratedAt, setStrategyGeneratedAt]);

  const skipCurrentMissionCb = useCallback(() => {
    if (currentMission) {
      skipMission(currentMission.id);
    }
  }, [currentMission, skipMission]);

  return {
    currentMission,
    missionStatus,
    completedCount,
    totalMissions: 12,
    confirmMission: confirmMissionCb,
    skipCurrentMission: skipCurrentMissionCb,
    history: missions,
  };
}
