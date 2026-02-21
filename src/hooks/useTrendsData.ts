// ============================================================================
// HOOK: useTrendsData
// Fetches all scoring snapshots for the company and computes trend deltas
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { ScoringSnapshotService, type ScoringSnapshot } from '@/modules/module2/services/ScoringSnapshotService';

interface TrendDeltas {
  globalScore: number | null;
  themes: Record<string, number>;
  participation: number | null;
  enps: number | null;
  byDepartment: Record<string, {
    globalScore: number;
    themes: Record<string, number>;
  }>;
}

interface UseTrendsDataReturn {
  snapshots: ScoringSnapshot[];
  loading: boolean;
  error: string | null;
  latestSnapshot: ScoringSnapshot | null;
  previousSnapshot: ScoringSnapshot | null;
  deltas: TrendDeltas | null;
  campaignCount: number;
  getSparklineData: (metric: 'global' | 'participation' | 'enps' | string) => Array<{ value: number }>;
  refetch: () => void;
}

export function useTrendsData(selectedSurveyId?: string | null): UseTrendsDataReturn {
  const { companyId } = useCompany();
  const [snapshots, setSnapshots] = useState<ScoringSnapshot[]>([]);
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
        const data = await ScoringSnapshotService.getAll(companyId!);
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

  // When a specific campaign is selected, use it as the "current" snapshot
  // and the one before it as the "previous" for delta computation.
  // Otherwise, default to latest.
  const selectedIndex = selectedSurveyId
    ? snapshots.findIndex(s => s.survey_id === selectedSurveyId)
    : -1;

  const latestSnapshot = selectedIndex >= 0
    ? snapshots[selectedIndex]
    : (snapshots.length > 0 ? snapshots[snapshots.length - 1] : null);

  const previousSnapshot = selectedIndex >= 0
    ? (selectedIndex > 0 ? snapshots[selectedIndex - 1] : null)
    : (snapshots.length > 1 ? snapshots[snapshots.length - 2] : null);

  // Compute deltas between latest and previous
  const deltas: TrendDeltas | null = latestSnapshot && previousSnapshot
    ? {
        globalScore: round(latestSnapshot.global_score - previousSnapshot.global_score),
        themes: computeThemeDeltas(latestSnapshot.theme_scores, previousSnapshot.theme_scores),
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
        // Theme or DC key
        if (s.theme_scores && s.theme_scores[metric] !== undefined) {
          return { value: s.theme_scores[metric] };
        }
        if (s.dc_scores && s.dc_scores[metric] !== undefined) {
          return { value: s.dc_scores[metric] };
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

function computeThemeDeltas(
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
  currentDepts: ScoringSnapshot['by_department'],
  previousDepts: ScoringSnapshot['by_department'],
): Record<string, { globalScore: number; themes: Record<string, number> }> {
  const result: Record<string, { globalScore: number; themes: Record<string, number> }> = {};

  for (const dept of currentDepts) {
    const prev = previousDepts.find(d => d.name === dept.name);
    if (prev) {
      const themeDeltas: Record<string, number> = {};
      for (const key of Object.keys(dept.themeScores)) {
        themeDeltas[key] = round((dept.themeScores[key] || 0) - (prev.themeScores[key] || 0));
      }
      result[dept.name] = {
        globalScore: round(dept.globalScore - prev.globalScore),
        themes: themeDeltas,
      };
    }
  }

  return result;
}
