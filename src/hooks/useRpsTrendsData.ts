// ============================================================================
// HOOK: useRpsTrendsData
// Fetches all RPS scoring snapshots for the company and computes trend deltas
// Adapted from useTrendsData for Module 5 (6 axes instead of 4 themes)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { RiskScoringSnapshotService, type RpsScoringSnapshot } from '@/modules/module5/services/RiskScoringSnapshotService';

interface RpsTrendDeltas {
  globalScore: number | null;
  axes: Record<string, number>;       // axis1..axis6 deltas
  participation: number | null;
  enps: number | null;
  byDepartment: Record<string, {
    globalScore: number;
    axes: Record<string, number>;
  }>;
}

interface UseRpsTrendsDataReturn {
  snapshots: RpsScoringSnapshot[];
  loading: boolean;
  error: string | null;
  latestSnapshot: RpsScoringSnapshot | null;
  previousSnapshot: RpsScoringSnapshot | null;
  deltas: RpsTrendDeltas | null;
  campaignCount: number;
  getSparklineData: (metric: 'global' | 'participation' | 'enps' | string) => Array<{ value: number }>;
  refetch: () => void;
}

export function useRpsTrendsData(selectedSurveyId?: string | null): UseRpsTrendsDataReturn {
  const { companyId } = useCompany();
  const [snapshots, setSnapshots] = useState<RpsScoringSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setSnapshots([]);
      return;
    }

    let cancelled = false;

    async function fetchSnapshots() {
      setLoading(true);
      setError(null);

      try {
        const data = await RiskScoringSnapshotService.getAll(companyId!);
        if (!cancelled) {
          setSnapshots(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      }
    }

    fetchSnapshots();

    return () => { cancelled = true; };
  }, [companyId, trigger]);

  // Selected campaign or latest
  const selectedIndex = selectedSurveyId
    ? snapshots.findIndex(s => s.survey_id === selectedSurveyId)
    : -1;

  const latestSnapshot = selectedIndex >= 0
    ? snapshots[selectedIndex]
    : (snapshots.length > 0 ? snapshots[snapshots.length - 1] : null);

  const previousSnapshot = selectedIndex >= 0
    ? (selectedIndex > 0 ? snapshots[selectedIndex - 1] : null)
    : (snapshots.length > 1 ? snapshots[snapshots.length - 2] : null);

  // Compute deltas
  const deltas: RpsTrendDeltas | null = latestSnapshot && previousSnapshot
    ? {
        globalScore: round(latestSnapshot.global_score - previousSnapshot.global_score),
        axes: computeAxisDeltas(latestSnapshot.axis_scores, previousSnapshot.axis_scores),
        participation: round(latestSnapshot.participation_rate - previousSnapshot.participation_rate),
        enps: round(latestSnapshot.enps_score - previousSnapshot.enps_score),
        byDepartment: computeDepartmentDeltas(
          latestSnapshot.by_department,
          previousSnapshot.by_department,
        ),
      }
    : null;

  const getSparklineData = useCallback(
    (metric: string): Array<{ value: number }> => {
      return snapshots.map(s => {
        if (metric === 'global') return { value: s.global_score };
        if (metric === 'participation') return { value: s.participation_rate };
        if (metric === 'enps') return { value: s.enps_score };
        if (s.axis_scores && s.axis_scores[metric] !== undefined) {
          return { value: s.axis_scores[metric] };
        }
        if (s.dr_scores && s.dr_scores[metric] !== undefined) {
          return { value: s.dr_scores[metric] };
        }
        return { value: 0 };
      });
    },
    [snapshots],
  );

  return {
    snapshots,
    loading,
    error,
    latestSnapshot,
    previousSnapshot,
    deltas,
    campaignCount: snapshots.length,
    getSparklineData,
    refetch: () => setTrigger(t => t + 1),
  };
}

// --- Helpers -----------------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeAxisDeltas(
  current: Record<string, number>,
  previous: Record<string, number>,
): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const key of Object.keys(current)) {
    deltas[key] = round((current[key] || 0) - (previous[key] || 0));
  }
  return deltas;
}

function computeDepartmentDeltas(
  currentDepts: RpsScoringSnapshot['by_department'],
  previousDepts: RpsScoringSnapshot['by_department'],
): Record<string, { globalScore: number; axes: Record<string, number> }> {
  const result: Record<string, { globalScore: number; axes: Record<string, number> }> = {};

  for (const dept of currentDepts) {
    const prev = previousDepts.find(d => d.name === dept.name);
    if (prev) {
      const axisDeltas: Record<string, number> = {};
      for (const key of Object.keys(dept.axisScores)) {
        axisDeltas[key] = round((dept.axisScores[key] || 0) - (prev.axisScores[key] || 0));
      }
      result[dept.name] = {
        globalScore: round(dept.globalScore - prev.globalScore),
        axes: axisDeltas,
      };
    }
  }

  return result;
}
