// ============================================================================
// MODULE 5 — RPS SCORING SNAPSHOT SERVICE
// Persists RPS scoring results for trends/evolution tracking
// Adapted from Module 2 ScoringSnapshotService for 6 axes + 6 DR
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { RiskScoringResult } from '@/modules/module5/engine/types';

export interface RpsScoringSnapshot {
  id: string;
  survey_id: string;
  company_id: string;
  computed_at: string;
  global_score: number;
  axis_scores: Record<string, number>;  // axis1..axis6
  dr_scores: Record<string, number>;    // DR1..DR6
  by_department: Array<{
    name: string;
    globalScore: number;
    axisScores: Record<string, number>;
    responseCount: number;
    participationRate: number;
  }>;
  participation_rate: number;
  response_count: number;
  enps_score: number;
  question_correlations: Record<string, number>;
}

export class RiskScoringSnapshotService {
  /**
   * Save or update an RPS scoring snapshot for a survey.
   * Uses upsert on survey_id to avoid duplicates.
   */
  static async save(
    surveyId: string,
    companyId: string,
    result: RiskScoringResult,
    rawResponses?: Array<{ responses: Record<string, number | string> }>,
  ): Promise<void> {
    // Map axis scores
    const axisScores: Record<string, number> = {};
    for (const axis of result.axes) {
      axisScores[axis.axisId] = axis.avgScore;
    }

    // Map DR scores
    const drScores: Record<string, number> = {};
    for (const dr of result.globalDR) {
      drScores[dr.drId] = dr.avgScore;
    }

    // Map by department (using lineAxes)
    const byDepartment = Object.entries(result.lineAxes).map(([lineName, axes]) => {
      const lineScores: Record<string, number> = {};
      let total = 0;
      let count = 0;
      for (const a of axes) {
        lineScores[a.axisId] = a.avgScore;
        total += a.avgScore;
        count++;
      }
      const lineParticipation = result.participation.byLine.find(p => p.lineName === lineName);
      return {
        name: lineName,
        globalScore: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
        axisScores: lineScores,
        responseCount: lineParticipation?.participants || 0,
        participationRate: lineParticipation?.rate || 0,
      };
    });

    // Calculate eNPS
    const enpsScore = RiskScoringSnapshotService.calculateENPS(result);

    // Calculate question correlations
    const questionCorrelations = rawResponses
      ? RiskScoringSnapshotService.calculateCorrelations(rawResponses)
      : {};

    const payload = {
      survey_id: surveyId,
      company_id: companyId,
      computed_at: new Date().toISOString(),
      global_score: result.globalScore.avgScore,
      axis_scores: axisScores,
      dr_scores: drScores,
      by_department: byDepartment,
      participation_rate: result.participation.global.rate,
      response_count: result.responseCount,
      enps_score: enpsScore,
      question_correlations: questionCorrelations,
    };

    const { error } = await (supabase
      .from('rps_scoring_snapshots' as any)
      .upsert(payload, { onConflict: 'survey_id' }) as any);

    if (error) {
      console.error('Failed to save RPS scoring snapshot:', error);
    }
  }

  /**
   * Get all RPS snapshots for a company, ordered chronologically
   */
  static async getAll(companyId: string): Promise<RpsScoringSnapshot[]> {
    const { data, error } = await (supabase
      .from('rps_scoring_snapshots' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('computed_at', { ascending: true }) as any);

    if (error) {
      console.error('Failed to fetch RPS scoring snapshots:', error);
      return [];
    }

    return (data || []) as RpsScoringSnapshot[];
  }

  /**
   * Get the latest RPS snapshot for a company
   */
  static async getLatest(companyId: string): Promise<RpsScoringSnapshot | null> {
    const { data, error } = await (supabase
      .from('rps_scoring_snapshots' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle() as any);

    if (error) {
      console.error('Failed to fetch latest RPS snapshot:', error);
      return null;
    }

    return (data as RpsScoringSnapshot) || null;
  }

  /**
   * Calculate eNPS from RPS scoring result.
   * Promoters: satisfied (score ≤ 2.5), Detractors: dissatisfied (score > 2.5)
   */
  private static calculateENPS(result: RiskScoringResult): number {
    const total = result.globalScore.satisfiedCount + result.globalScore.dissatisfiedCount;
    if (total === 0) return 0;

    const promoterRate = (result.globalScore.satisfiedCount / total) * 100;
    const detractorRate = (result.globalScore.dissatisfiedCount / total) * 100;

    return Math.round(promoterRate - detractorRate);
  }

  /**
   * Calculate Pearson correlation between each question score and the global average.
   */
  private static calculateCorrelations(
    rawResponses: Array<{ responses: Record<string, number | string> }>,
  ): Record<string, number> {
    const LIKERT_CODES = [
      'A1Q1', 'A1Q2', 'A1Q3', 'A1Q4',
      'A2Q5', 'A2Q6',
      'A3Q7', 'A3Q8', 'A3Q9', 'A3Q10',
      'A4Q11', 'A4Q12', 'A4Q13', 'A4Q14', 'A4Q15',
      'A5Q16',
      'A6Q17', 'A6Q18',
    ];

    // Per-respondent global average
    const respondentGlobals: number[] = rawResponses.map(r => {
      const scores: number[] = [];
      for (const code of LIKERT_CODES) {
        const val = r.responses[code];
        if (typeof val === 'number' && val >= 1 && val <= 5) {
          scores.push(val);
        }
      }
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });

    const correlations: Record<string, number> = {};

    for (const code of LIKERT_CODES) {
      const questionScores: number[] = rawResponses.map(r => {
        const val = r.responses[code];
        return typeof val === 'number' && val >= 1 && val <= 5 ? val : 0;
      });

      const validPairs = questionScores
        .map((q, i) => ({ q, g: respondentGlobals[i] }))
        .filter(p => p.q > 0 && p.g > 0);

      if (validPairs.length < 3) {
        correlations[code] = 0;
        continue;
      }

      const qArr = validPairs.map(p => p.q);
      const gArr = validPairs.map(p => p.g);
      correlations[code] = Math.abs(RiskScoringSnapshotService.pearson(qArr, gArr));
    }

    return correlations;
  }

  private static pearson(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) return 0;
    return numerator / denominator;
  }
}
