// ============================================================================
// MODULE 2 — SCORING ENGINE
// Pure computation class — no React, no Supabase
// Source: 9-M2-Centredecalcul-MMS.xls
// Scale: 1=Satisfait Pleinement ... 5=Pas satisfait du tout
// ============================================================================

import type {
  ScoringResult,
  ThemeScore,
  LineParticipation,
  DCScore,
  AdhesionResult,
  ActionRecommendation,
  LineActionPlan,
  PriorityLevel,
} from './types';

import {
  QUESTION_TO_DC,
  QUESTION_ACTION_LABELS,
  QUESTION_THEMES,
  THEME_NAMES,
  DC_NAMES,
  scoreToAlertLevel,
  scoreToAlertLabel,
  participationToAlert,
  m1ScoreToLabel,
} from './constants';

// --- Helpers ----------------------------------------------------------------

/** All Likert question codes (T*Q*) */
const LIKERT_CODES = Object.keys(QUESTION_TO_DC);

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

/** Build ThemeScore from a set of question scores */
function buildThemeScore(
  themeId: string,
  themeName: string,
  questionScores: Record<string, number[]>,
  questionCodes: string[],
): ThemeScore {
  const allScores: number[] = [];
  for (const code of questionCodes) {
    const scores = questionScores[code];
    if (scores) allScores.push(...scores);
  }

  const avgScore = avg(allScores);
  // Per-respondent average: for each respondent, avg their answers for this theme
  // Then classify satisfied (avg <= 2.5) vs dissatisfied (avg > 2.5)
  // But simpler: use individual answer counts
  const satisfiedCount = allScores.filter(s => s <= 2.5).length;
  const dissatisfiedCount = allScores.filter(s => s > 2.5).length;
  const total = satisfiedCount + dissatisfiedCount;
  const satisfactionRate = total > 0 ? (satisfiedCount / total) * 100 : 0;

  return {
    themeId,
    themeName,
    avgScore: Math.round(avgScore * 100) / 100,
    satisfiedCount,
    dissatisfiedCount,
    satisfactionRate: Math.round(satisfactionRate * 10) / 10,
    alertLevel: scoreToAlertLevel(avgScore),
    alertLabel: scoreToAlertLabel(avgScore),
  };
}

/** Build DC scores from question scores */
function buildDCScores(questionScores: Record<string, number[]>): DCScore[] {
  const dcIds = ['DC1', 'DC2', 'DC3', 'DC4', 'DC5', 'DC6'];

  return dcIds.map(dcId => {
    const codes = Object.entries(QUESTION_TO_DC)
      .filter(([, dc]) => dc === dcId)
      .map(([code]) => code);

    const allScores: number[] = [];
    for (const code of codes) {
      const scores = questionScores[code];
      if (scores) allScores.push(...scores);
    }

    const avgScore = avg(allScores);

    return {
      dcId,
      dcName: DC_NAMES[dcId],
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
        dcId: QUESTION_TO_DC[code],
        urgency: (avgScore >= 4 ? 'urgent' : avgScore >= 3 ? 'to-improve' : 'ok') as ActionRecommendation['urgency'],
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);
}

// --- Main Engine ------------------------------------------------------------

export class ScoringEngine {
  static compute(
    responses: Array<{ responses: Record<string, number | string> }>,
    businessLines: Array<{ activity_name: string; staff_count: number }>,
    m1Scores?: Record<string, number>,
  ): ScoringResult {
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

    // Global question scores: code → number[]
    const globalQScores: Record<string, number[]> = {};
    for (const p of parsed) {
      for (const [code, val] of Object.entries(p.scores)) {
        if (!globalQScores[code]) globalQScores[code] = [];
        globalQScores[code].push(val);
      }
    }

    // Per-line question scores
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
    // THEME SCORES (global + per line)
    // ========================================================================
    const themeIds = ['theme1', 'theme2', 'theme3', 'theme4'];

    const themes: ThemeScore[] = themeIds.map(tid => {
      const codes = Object.entries(QUESTION_THEMES)
        .filter(([, t]) => t === tid)
        .map(([c]) => c);
      return buildThemeScore(tid, THEME_NAMES[tid], globalQScores, codes);
    });

    // Global satisfaction = average across all themes
    const allLikertScores = Object.values(globalQScores).flat();
    const globalAvg = avg(allLikertScores);
    const globalSatisfied = allLikertScores.filter(s => s <= 2.5).length;
    const globalDissatisfied = allLikertScores.filter(s => s > 2.5).length;
    const globalTotal = globalSatisfied + globalDissatisfied;

    const globalSatisfaction: ThemeScore = {
      themeId: 'global',
      themeName: 'Satisfaction Globale',
      avgScore: Math.round(globalAvg * 100) / 100,
      satisfiedCount: globalSatisfied,
      dissatisfiedCount: globalDissatisfied,
      satisfactionRate: globalTotal > 0
        ? Math.round((globalSatisfied / globalTotal) * 1000) / 10
        : 0,
      alertLevel: scoreToAlertLevel(globalAvg),
      alertLabel: scoreToAlertLabel(globalAvg),
    };

    // Per-line themes
    const lineThemes: Record<string, ThemeScore[]> = {};
    for (const [lineName, qs] of Object.entries(lineQScores)) {
      lineThemes[lineName] = themeIds.map(tid => {
        const codes = Object.entries(QUESTION_THEMES)
          .filter(([, t]) => t === tid)
          .map(([c]) => c);
        return buildThemeScore(tid, THEME_NAMES[tid], qs, codes);
      });
    }

    // ========================================================================
    // DC SCORES (global + per line)
    // ========================================================================
    const globalDC = buildDCScores(globalQScores);

    const lineDC: Record<string, DCScore[]> = {};
    for (const [lineName, qs] of Object.entries(lineQScores)) {
      lineDC[lineName] = buildDCScores(qs);
    }

    // ========================================================================
    // ADHESION ANALYSIS (M1 importance × M2 satisfaction)
    // ========================================================================
    const dcIds = ['DC1', 'DC2', 'DC3', 'DC4', 'DC5', 'DC6'];

    function buildAdhesion(dcScores: DCScore[]): AdhesionResult[] {
      return dcScores.map(dc => {
        const m1 = m1Scores?.[dc.dcId] ?? 3;
        const moyenne = (m1 + dc.avgScore) / 2;
        // Priority: 3 levels based on MSS score × M1 importance
        const priority: PriorityLevel =
          dc.avgScore >= 3 && m1 >= 3 ? 'PRIORITE FORTE' :
          dc.avgScore >= 2.5 || m1 >= 3 ? 'PRIORITE MOYENNE' :
          'PRIORITE FAIBLE';
        return {
          dcId: dc.dcId,
          dcName: dc.dcName,
          m1Score: m1,
          mssScore: dc.avgScore,
          moyenne: Math.round(moyenne * 100) / 100,
          priority,
          importanceLabel: m1ScoreToLabel(m1),
          satisfactionLabel: dc.satisfactionLabel,
        } as AdhesionResult;
      });
    }

    const globalAdhesion = buildAdhesion(globalDC);
    const byLineAdhesion: Record<string, AdhesionResult[]> = {};
    for (const [lineName, dcs] of Object.entries(lineDC)) {
      byLineAdhesion[lineName] = buildAdhesion(dcs);
    }

    // ========================================================================
    // ACTION PLANS (per line)
    // ========================================================================
    const actionPlans: LineActionPlan[] = Object.entries(lineQScores).map(([lineName, qs]) => {
      const recs = buildRecommendations(qs);
      const recsByDC: Record<string, ActionRecommendation[]> = {};
      for (const dcId of dcIds) {
        recsByDC[dcId] = recs.filter(r => r.dcId === dcId);
      }
      return {
        lineName,
        dcPriorities: byLineAdhesion[lineName] || [],
        recommendations: recs,
        recommendationsByDC: recsByDC,
      };
    });

    return {
      participation: {
        global: globalParticipation,
        byLine: lineParticipations,
      },
      globalSatisfaction,
      themes,
      lineThemes,
      globalDC,
      lineDC,
      adhesion: {
        global: globalAdhesion,
        byLine: byLineAdhesion,
      },
      actionPlans,
      responseCount,
      surveyId: '',
    };
  }
}
