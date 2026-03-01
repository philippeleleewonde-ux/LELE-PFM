/**
 * useInvestmentAdvisory — LELE PFM
 *
 * Generates and manages advisory messages by crossing check-ins,
 * strategies, and procedure progress data.
 */

import { useMemo } from 'react';
import { useJourneyStore } from '@/stores/journey-store';
import { generateAdvisories } from '@/services/investment-advisor';
import { usePerformanceStore } from '@/stores/performance-store';
import { AdvisoryMessage } from '@/types/investor-journey';

export function useInvestmentAdvisory() {
  const checkIns = useJourneyStore((s) => s.checkIns);
  const selectedAssets = useJourneyStore((s) => s.selectedAssets);
  const activeStrategies = useJourneyStore((s) => s.activeStrategies);
  const chosenStrategyId = useJourneyStore((s) => s.chosenStrategyId);
  const duration = useJourneyStore((s) => s.investmentDuration);
  const procedureProgress = useJourneyStore((s) => s.procedureProgress);
  const advisoryMessages = useJourneyStore((s) => s.advisoryMessages);
  const journeyStartedAt = useJourneyStore((s) => s.journeyStartedAt);
  const addAdvisoryMessage = useJourneyStore((s) => s.addAdvisoryMessage);
  const dismissAdvisory = useJourneyStore((s) => s.dismissAdvisory);

  // Get latest weekly surplus from performance store
  const records = usePerformanceStore((s) => s.records);
  const latestSurplus = useMemo(() => {
    if (records.length === 0) return 0;
    const sorted = [...records].sort((a, b) => b.year * 100 + b.week_number - (a.year * 100 + a.week_number));
    return sorted[0]?.economies ?? 0;
  }, [records]);

  const chosenStrategy = useMemo(() => {
    if (!chosenStrategyId) return null;
    return activeStrategies.find((s) => s.id === chosenStrategyId) ?? null;
  }, [chosenStrategyId, activeStrategies]);

  // Generate new advisories based on current state
  const generatedAdvisories = useMemo((): AdvisoryMessage[] => {
    if (!chosenStrategy || selectedAssets.length === 0) return [];

    return generateAdvisories({
      checkIns,
      selectedAssets: selectedAssets.filter(
        (a) => a.status === 'accepted' || a.status === 'custom',
      ),
      chosenStrategy,
      duration,
      procedureProgress,
      weeklySurplus: latestSurplus,
      journeyStartedAt,
    });
  }, [checkIns, selectedAssets, chosenStrategy, duration, procedureProgress, latestSurplus, journeyStartedAt]);

  // Combine stored + generated advisories, dedup by type+relatedAssetId
  const allAdvisories = useMemo(() => {
    const stored = advisoryMessages.filter((m) => !m.dismissed);
    const seenKeys = new Set(stored.map((m) => `${m.type}_${m.relatedAssetId ?? ''}`));

    const unique = generatedAdvisories.filter((m) => {
      const key = `${m.type}_${m.relatedAssetId ?? ''}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    return [...stored, ...unique];
  }, [advisoryMessages, generatedAdvisories]);

  const pendingCount = allAdvisories.filter((m) => !m.dismissed).length;

  const urgentAdvisories = allAdvisories.filter((m) => m.severity === 'urgent');
  const warningAdvisories = allAdvisories.filter((m) => m.severity === 'warning');
  const infoAdvisories = allAdvisories.filter((m) => m.severity === 'info' || m.severity === 'success');

  return {
    allAdvisories,
    urgentAdvisories,
    warningAdvisories,
    infoAdvisories,
    pendingCount,
    addAdvisoryMessage,
    dismissAdvisory,
  };
}
