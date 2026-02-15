// ============================================================================
// MODULE 2 — SCORING SNAPSHOT SERVICE
// Persists scoring results for trends/evolution tracking
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { ScoringResult } from '@/modules/module2/engine/types';

export interface ScoringSnapshot {
  id: string;
  survey_id: string;
  company_id: string;
  computed_at: string;
  global_score: number;
  theme_scores: Record<string, number>;
  dc_scores: Record<string, number>;
  by_department: Array<{
    name: string;
    globalScore: number;
    themeScores: Record<string, number>;
    responseCount: number;
    participationRate: number;
  }>;
  participation_rate: number;
  response_count: number;
  enps_score: number;
  question_correlations: Record<string, number>;
}

export class ScoringSnapshotService {
  /**
   * Save or update a scoring snapshot for a survey.
   * Uses upsert on survey_id to avoid duplicates.
   */
  static async save(
    surveyId: string,
    companyId: string,
    result: ScoringResult,
    rawResponses?: Array<{ responses: Record<string, number | string> }>,
  ): Promise<void> {
    // Map theme scores
    const themeScores: Record<string, number> = {};
    for (const theme of result.themes) {
      themeScores[theme.themeId] = theme.avgScore;
    }

    // Map DC scores
    const dcScores: Record<string, number> = {};
    for (const dc of result.globalDC) {
      dcScores[dc.dcId] = dc.avgScore;
    }

    // Map by department
    const byDepartment = Object.entries(result.lineThemes).map(([lineName, themes]) => {
      const lineScores: Record<string, number> = {};
      let total = 0;
      let count = 0;
      for (const t of themes) {
        lineScores[t.themeId] = t.avgScore;
        total += t.avgScore;
        count++;
      }
      const lineParticipation = result.participation.byLine.find(p => p.lineName === lineName);
      return {
        name: lineName,
        globalScore: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
        themeScores: lineScores,
        responseCount: lineParticipation?.participants || 0,
        participationRate: lineParticipation?.rate || 0,
      };
    });

    // Calculate eNPS: % promoters (scores 1-2) minus % detractors (scores 4-5)
    const enpsScore = ScoringSnapshotService.calculateENPS(result);

    // Calculate question correlations with global score
    const questionCorrelations = rawResponses
      ? ScoringSnapshotService.calculateCorrelations(rawResponses)
      : {};

    const payload = {
      survey_id: surveyId,
      company_id: companyId,
      computed_at: new Date().toISOString(),
      global_score: result.globalSatisfaction.avgScore,
      theme_scores: themeScores,
      dc_scores: dcScores,
      by_department: byDepartment,
      participation_rate: result.participation.global.rate,
      response_count: result.responseCount,
      enps_score: enpsScore,
      question_correlations: questionCorrelations,
    };

    // Upsert by survey_id
    const { error } = await (supabase
      .from('survey_scoring_snapshots' as any)
      .upsert(payload, { onConflict: 'survey_id' }) as any);

    if (error) {
      console.error('Failed to save scoring snapshot:', error);
    }
  }

  /**
   * Get all snapshots for a company, ordered by computed_at ASC (chronological)
   */
  static async getAll(companyId: string): Promise<ScoringSnapshot[]> {
    const { data, error } = await (supabase
      .from('survey_scoring_snapshots' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('computed_at', { ascending: true }) as any);

    if (error) {
      console.error('Failed to fetch scoring snapshots:', error);
      return [];
    }

    return (data || []) as ScoringSnapshot[];
  }

  /**
   * Get the latest snapshot for a company
   */
  static async getLatest(companyId: string): Promise<ScoringSnapshot | null> {
    const { data, error } = await (supabase
      .from('survey_scoring_snapshots' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle() as any);

    if (error) {
      console.error('Failed to fetch latest snapshot:', error);
      return null;
    }

    return (data as ScoringSnapshot) || null;
  }

  /**
   * Get snapshot for a specific survey
   */
  static async getForSurvey(surveyId: string): Promise<ScoringSnapshot | null> {
    const { data, error } = await (supabase
      .from('survey_scoring_snapshots' as any)
      .select('*')
      .eq('survey_id', surveyId)
      .maybeSingle() as any);

    if (error) {
      console.error('Failed to fetch survey snapshot:', error);
      return null;
    }

    return (data as ScoringSnapshot) || null;
  }

  /**
   * Calculate eNPS from scoring result.
   * Scale: 1=Satisfait Pleinement, 5=Pas satisfait du tout
   * Promoters: scores 1-2 (satisfied)
   * Detractors: scores 4-5 (dissatisfied)
   * eNPS = %Promoters - %Detractors, range [-100, +100]
   */
  private static calculateENPS(result: ScoringResult): number {
    const total = result.globalSatisfaction.satisfiedCount + result.globalSatisfaction.dissatisfiedCount;
    if (total === 0) return 0;

    const promoterRate = (result.globalSatisfaction.satisfiedCount / total) * 100;
    const detractorRate = (result.globalSatisfaction.dissatisfiedCount / total) * 100;

    return Math.round(promoterRate - detractorRate);
  }

  /**
   * Calculate Pearson correlation between each question score and the global average score.
   * Returns a map of questionCode → correlation coefficient (0 to 1).
   */
  private static calculateCorrelations(
    rawResponses: Array<{ responses: Record<string, number | string> }>,
  ): Record<string, number> {
    const LIKERT_CODES = [
      'T1Q1','T1Q2','T1Q3','T1Q4','T1Q5','T1Q6','T1Q7','T1Q8',
      'T2Q9','T2Q10','T2Q11','T2Q12','T2Q13','T2Q14','T2Q15','T2Q16','T2Q17','T2Q18',
      'T3Q19','T3Q20','T3Q21','T3Q22','T3Q23','T3Q24','T3Q25',
      'T4Q26','T4Q27','T4Q28','T4Q29','T4Q30',
    ];

    // Calculate per-respondent global average
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

      // Only compute if we have valid data
      const validPairs = questionScores
        .map((q, i) => ({ q, g: respondentGlobals[i] }))
        .filter(p => p.q > 0 && p.g > 0);

      if (validPairs.length < 3) {
        correlations[code] = 0;
        continue;
      }

      const qArr = validPairs.map(p => p.q);
      const gArr = validPairs.map(p => p.g);
      correlations[code] = Math.abs(ScoringSnapshotService.pearson(qArr, gArr));
    }

    return correlations;
  }

  /**
   * Pearson correlation coefficient between two arrays
   */
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
