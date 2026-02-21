// ============================================================================
// HOOK: useRiskScoringEngine
// Fetches RPS survey responses + business lines, computes RiskScoringResult
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RiskScoringEngine } from '@/modules/module5/engine/RiskScoringEngine';
import type { RiskScoringResult } from '@/modules/module5/engine/types';

interface UseRiskScoringEngineReturn {
  result: RiskScoringResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRiskScoringEngine(surveyId: string | null): UseRiskScoringEngineReturn {
  const [result, setResult] = useState<RiskScoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!surveyId) {
      setResult(null);
      return;
    }

    let cancelled = false;

    async function compute() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch RPS survey responses
        const { data: responses, error: respError } = await supabase
          .from('rps_survey_responses' as any)
          .select('responses')
          .eq('survey_id', surveyId) as any;

        if (respError) throw new Error(respError.message);
        if (!responses || responses.length === 0) {
          if (!cancelled) {
            setResult(null);
            setError('Aucune réponse trouvée pour ce questionnaire');
            setLoading(false);
          }
          return;
        }

        // 2. Fetch business lines (for workforce/effectifs)
        const { data: businessLines, error: blError } = await supabase
          .from('business_lines')
          .select('activity_name, staff_count')
          .eq('is_active', true);

        if (blError) throw new Error(blError.message);

        // 3. Compute (no M1 cross-reference for RPS)
        const parsed = responses.map((r: any) => ({
          responses: (r.responses || {}) as Record<string, number | string>,
        }));

        const scoringResult = RiskScoringEngine.compute(
          parsed,
          (businessLines || []).map(bl => ({
            activity_name: bl.activity_name,
            staff_count: bl.staff_count || 0,
          })),
        );

        scoringResult.surveyId = surveyId;

        if (!cancelled) {
          setResult(scoringResult);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      }
    }

    compute();

    return () => {
      cancelled = true;
    };
  }, [surveyId, trigger]);

  return {
    result,
    loading,
    error,
    refetch: () => setTrigger(t => t + 1),
  };
}
