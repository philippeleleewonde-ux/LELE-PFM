// ============================================================================
// HOOK: useScoringEngine
// Fetches survey responses + business lines, computes ScoringResult
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScoringEngine } from '@/modules/module2/engine/ScoringEngine';
import type { ScoringResult } from '@/modules/module2/engine/types';

interface UseScoringEngineReturn {
  result: ScoringResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useScoringEngine(surveyId: string | null): UseScoringEngineReturn {
  const [result, setResult] = useState<ScoringResult | null>(null);
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
        // 1. Fetch survey responses
        const { data: responses, error: respError } = await supabase
          .from('survey_responses')
          .select('responses')
          .eq('survey_id', surveyId);

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

        // 3. Optionally fetch M1 scores (company_performance_scores.factors)
        let m1Scores: Record<string, number> | undefined;
        const { data: perfScores } = await supabase
          .from('company_performance_scores')
          .select('factors')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (perfScores?.factors) {
          // M1 stores DC importance scores in factors JSON
          const factors = perfScores.factors as Record<string, unknown>;
          if (factors.dcImportance && typeof factors.dcImportance === 'object') {
            m1Scores = factors.dcImportance as Record<string, number>;
          }
        }

        // 4. Compute
        const parsed = responses.map(r => ({
          responses: (r.responses || {}) as Record<string, number | string>,
        }));

        const scoringResult = ScoringEngine.compute(
          parsed,
          (businessLines || []).map(bl => ({
            activity_name: bl.activity_name,
            staff_count: bl.staff_count || 0,
          })),
          m1Scores,
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
