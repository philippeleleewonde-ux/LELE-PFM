// ============================================================================
// MODULE 5 — RPS SCORING ENGINE
// Pure computation class — no React, no Supabase
// Source: M5-Psychosocial_risks_V_2021.html
// Scale: 1=Satisfait Pleinement ... 5=Pas satisfait du tout
// ============================================================================

import type {
  RiskScoringResult,
  AxisScore,
  LineParticipation,
  DRScore,
  DRPriority,
  ActionRecommendation,
  LineActionPlan,
  PriorityLevel,
} from './types';

import {
  QUESTION_TO_DR,
  QUESTION_ACTION_LABELS,
  QUESTION_AXES,
  AXIS_NAMES,
  DR_NAMES,
  scoreToAlertLevel,
  scoreToAlertLabel,
  participationToAlert,
} from './constants';

// --- Helpers ----------------------------------------------------------------

/** All Likert question codes (A*Q*) */
const LIKERT_CODES = Object.keys(QUESTION_TO_DR);

/** Extract only Likert scores from a response object */
function extractLikertScores(resp: Record<string, number | string>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const code of LIKERT_CODES) {
    const val = resp[code];
    if (typeof val === 'number' && val >= 1 && val <= 5) {
      out[code] = val;
    }
  }
  return out;
}

/** Average of an array of numbers */
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Build AxisScore from a set of question scores */
function buildAxisScore(
  axisId: string,
  axisName: string,
  questionScores: Record<string, number[]>,
  questionCodes: string[],
): AxisScore {
  const allScores: number[] = [];
  for (const code of questionCodes) {
    const scores = questionScores[code];
    if (scores) allScores.push(...scores);
  }

  const avgScore = avg(allScores);
  const satisfiedCount = allScores.filter(s => s <= 2.5).length;
  const dissatisfiedCount = allScores.filter(s => s > 2.5).length;
  const total = satisfiedCount + dissatisfiedCount;
  const satisfactionRate = total > 0 ? (satisfiedCount / total) * 100 : 0;

  return {
    axisId,
    axisName,
    avgScore: Math.round(avgScore * 100) / 100,
    satisfiedCount,
    dissatisfiedCount,
    satisfactionRate: Math.round(satisfactionRate * 10) / 10,
    alertLevel: scoreToAlertLevel(avgScore),
    alertLabel: scoreToAlertLabel(avgScore),
  };
}

/** Build DR scores from question scores */
function buildDRScores(questionScores: Record<string, number[]>): DRScore[] {
  const drIds = ['DR1', 'DR2', 'DR3', 'DR4', 'DR5', 'DR6'];

  return drIds.map(drId => {
    const codes = Object.entries(QUESTION_TO_DR)
      .filter(([, dr]) => dr === drId)
      .map(([code]) => code);

    const allScores: number[] = [];
    for (const code of codes) {
      const scores = questionScores[code];
      if (scores) allScores.push(...scores);
    }

    const avgScore = avg(allScores);

    return {
      drId,
      drName: DR_NAMES[drId],
      avgScore: Math.round(avgScore * 100) / 100,
      satisfactionLabel: scoreToAlertLabel(avgScore),
    };
  });
}

/** Build action recommendations from question scores */
function buildRecommendations(questionScores: Record<string, number[]>): ActionRecommendation[] {
  return LIKERT_CODES
    .map(code => {
      const scores = questionScores[code] || [];
      const avgScore = avg(scores);
      return {
        questionCode: code,
        actionLabel: QUESTION_ACTION_LABELS[code] || code,
        avgScore: Math.round(avgScore * 100) / 100,
        drId: QUESTION_TO_DR[code],
        urgency: (avgScore >= 4 ? 'urgent' : avgScore >= 3 ? 'to-improve' : 'ok') as ActionRecommendation['urgency'],
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);
}

// --- Main Engine ------------------------------------------------------------

export class RiskScoringEngine {
  static compute(
    responses: Array<{ responses: Record<string, number | string> }>,
    businessLines: Array<{ activity_name: string; staff_count: number }>,
  ): RiskScoringResult {
    const responseCount = responses.length;

    // 1. Separate demographics & Likert scores per response
    const parsed = responses.map(r => ({
      line: (r.responses['D1'] as string) || 'Non spécifié',
      scores: extractLikertScores(r.responses),
    }));

    // 2. Group by line
    const byLine: Record<string, Array<Record<string, number>>> = {};
    for (const p of parsed) {
      if (!byLine[p.line]) byLine[p.line] = [];
      byLine[p.line].push(p.scores);
    }

    // 3. Build workforce map from business_lines
    const workforceMap: Record<string, number> = {};
    for (const bl of businessLines) {
      workforceMap[bl.activity_name] = bl.staff_count;
    }
    const totalWorkforce = businessLines.reduce((s, bl) => s + bl.staff_count, 0);

    // ========================================================================
    // PARTICIPATION
    // ========================================================================
    const lineParticipations: LineParticipation[] = Object.entries(byLine).map(([lineName, lineResponses]) => {
      const total = workforceMap[lineName] || lineResponses.length;
      const participants = lineResponses.length;
      const rate = total > 0 ? (participants / total) * 100 : 0;
      const alert = participationToAlert(rate);
      return {
        lineName,
        participants,
        totalWorkforce: total,
        rate: Math.round(rate * 10) / 10,
        alertLevel: alert.level,
        label: alert.label,
      };
    });

    const globalParticipationRate = totalWorkforce > 0
      ? (responseCount / totalWorkforce) * 100
      : 0;
    const globalAlert = participationToAlert(globalParticipationRate);
    const globalParticipation: LineParticipation = {
      lineName: 'Global',
      participants: responseCount,
      totalWorkforce: totalWorkforce || responseCount,
      rate: Math.round(globalParticipationRate * 10) / 10,
      alertLevel: globalAlert.level,
      label: globalAlert.label,
    };

    // ========================================================================
    // QUESTION SCORES (global + per line)
    // ========================================================================

    const globalQScores: Record<string, number[]> = {};
    for (const p of parsed) {
      for (const [code, val] of Object.entries(p.scores)) {
        if (!globalQScores[code]) globalQScores[code] = [];
        globalQScores[code].push(val);
      }
    }

    const lineQScores: Record<string, Record<string, number[]>> = {};
    for (const [lineName, lineResponses] of Object.entries(byLine)) {
      lineQScores[lineName] = {};
      for (const resp of lineResponses) {
        for (const [code, val] of Object.entries(resp)) {
          if (!lineQScores[lineName][code]) lineQScores[lineName][code] = [];
          lineQScores[lineName][code].push(val);
        }
      }
    }

    // ========================================================================
    // AXIS SCORES (global + per line)
    // ========================================================================
    const axisIds = ['axis1', 'axis2', 'axis3', 'axis4', 'axis5', 'axis6'];

    const axes: AxisScore[] = axisIds.map(aid => {
      const codes = Object.entries(QUESTION_AXES)
        .filter(([, a]) => a === aid)
        .map(([c]) => c);
      return buildAxisScore(aid, AXIS_NAMES[aid], globalQScores, codes);
    });

    // Global score = average across all axes
    const allLikertScores = Object.values(globalQScores).flat();
    const globalAvg = avg(allLikertScores);
    const globalSatisfied = allLikertScores.filter(s => s <= 2.5).length;
    const globalDissatisfied = allLikertScores.filter(s => s > 2.5).length;
    const globalTotal = globalSatisfied + globalDissatisfied;

    const globalScore: AxisScore = {
      axisId: 'global',
      axisName: 'Score Global RPS',
      avgScore: Math.round(globalAvg * 100) / 100,
      satisfiedCount: globalSatisfied,
      dissatisfiedCount: globalDissatisfied,
      satisfactionRate: globalTotal > 0
        ? Math.round((globalSatisfied / globalTotal) * 1000) / 10
        : 0,
      alertLevel: scoreToAlertLevel(globalAvg),
      alertLabel: scoreToAlertLabel(globalAvg),
    };

    // Per-line axes
    const lineAxes: Record<string, AxisScore[]> = {};
    for (const [lineName, qs] of Object.entries(lineQScores)) {
      lineAxes[lineName] = axisIds.map(aid => {
        const codes = Object.entries(QUESTION_AXES)
          .filter(([, a]) => a === aid)
          .map(([c]) => c);
        return buildAxisScore(aid, AXIS_NAMES[aid], qs, codes);
      });
    }

    // ========================================================================
    // DR SCORES (global + per line)
    // ========================================================================
    const globalDR = buildDRScores(globalQScores);

    const lineDR: Record<string, DRScore[]> = {};
    for (const [lineName, qs] of Object.entries(lineQScores)) {
      lineDR[lineName] = buildDRScores(qs);
    }

    // ========================================================================
    // DR PRIORITIES (no M1 cross-reference for RPS)
    // ========================================================================
    const drIds = ['DR1', 'DR2', 'DR3', 'DR4', 'DR5', 'DR6'];

    function buildDRPriorities(drScores: DRScore[]): DRPriority[] {
      return drScores.map(dr => {
        const priority: PriorityLevel =
          dr.avgScore >= 3.5 ? 'PRIORITE FORTE' :
          dr.avgScore >= 2.5 ? 'PRIORITE MOYENNE' :
          'PRIORITE FAIBLE';
        return {
          drId: dr.drId,
          drName: dr.drName,
          avgScore: dr.avgScore,
          priority,
          satisfactionLabel: dr.satisfactionLabel,
        };
      });
    }

    const globalDRPriorities = buildDRPriorities(globalDR);
    const byLineDRPriorities: Record<string, DRPriority[]> = {};
    for (const [lineName, drs] of Object.entries(lineDR)) {
      byLineDRPriorities[lineName] = buildDRPriorities(drs);
    }

    // ========================================================================
    // ACTION PLANS (per line)
    // ========================================================================
    const actionPlans: LineActionPlan[] = Object.entries(lineQScores).map(([lineName, qs]) => {
      const recs = buildRecommendations(qs);
      const recsByDR: Record<string, ActionRecommendation[]> = {};
      for (const drId of drIds) {
        recsByDR[drId] = recs.filter(r => r.drId === drId);
      }
      return {
        lineName,
        drPriorities: byLineDRPriorities[lineName] || [],
        recommendations: recs,
        recommendationsByDR: recsByDR,
      };
    });

    return {
      participation: {
        global: globalParticipation,
        byLine: lineParticipations,
      },
      globalScore,
      axes,
      lineAxes,
      globalDR,
      lineDR,
      drPriorities: {
        global: globalDRPriorities,
        byLine: byLineDRPriorities,
      },
      actionPlans,
      responseCount,
      surveyId: '',
    };
  }
}
