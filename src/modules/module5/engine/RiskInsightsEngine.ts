// ============================================================================
// MODULE 5 — RISK INSIGHTS ENGINE (Coach Voice)
// Pure computation: generates human, warm, coaching-style insights for RPS
// Adapted from Module 2 InsightsEngine for 6 axes + 6 DR + 18 questions
// ============================================================================

import type { RiskScoringResult } from './types';
import { AXIS_NAMES, DR_NAMES, QUESTION_TO_DR, QUESTION_AXES, QUESTION_ACTION_LABELS } from './constants';
import { RPS_QUESTIONS } from '@/modules/module5/data/riskQuestions';
import type { RpsScoringSnapshot } from '@/modules/module5/services/RiskScoringSnapshotService';

// --- Output types ------------------------------------------------------------

export interface RiskExecutiveSummary {
  globalScore: number;
  globalScoreLabel: string;
  globalDelta: number | null;
  deltaDirection: 'improvement' | 'degradation' | 'stable' | null;
  participationRate: number;
  participationLabel: string;
  enpsScore: number;
  enpsInterpretation: string;
  campaignCount: number;
  bestAxis: { name: string; score: number };
  worstAxis: { name: string; score: number };
  responseCount: number;
  headline: string;
  narrativeBlocks: string[];
}

export interface RiskQuestionInsight {
  code: string;
  text: string;
  score: number;
  scoreLabel: string;
  axisName: string;
  drName: string;
  coachComment: string;
}

export interface RiskInsightAlert {
  type: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  description: string;
}

export interface RiskStrategicQuestion {
  code: string;
  text: string;
  score: number;
  correlation: number;
  axisName: string;
  actionLabel: string;
}

export interface RiskStrategicQuadrant {
  id: 'act' | 'maintain' | 'monitor' | 'celebrate';
  label: string;
  description: string;
  coachAdvice: string;
  questions: RiskStrategicQuestion[];
}

export interface RiskDepartmentInsight {
  name: string;
  responseCount: number;
  participationRate: number;
  globalScore: number;
  globalScoreLabel: string;
  bestAxis: { name: string; score: number };
  worstAxis: { name: string; score: number };
  globalDelta: number | null;
  coachSummary: string;
  mood: 'excellent' | 'good' | 'attention' | 'critical';
}

export interface RiskActionItem {
  code: string;
  actionLabel: string;
  questionText: string;
  score: number;
  urgency: 'urgent' | 'to-improve' | 'ok';
  drName: string;
  axisName: string;
  worstDepartment: string | null;
  coachMessage: string;
}

export interface RiskInsightsResult {
  executiveSummary: RiskExecutiveSummary;
  strengths: RiskQuestionInsight[];
  weaknesses: RiskQuestionInsight[];
  alerts: RiskInsightAlert[];
  strategicMatrix: RiskStrategicQuadrant[];
  departmentInsights: RiskDepartmentInsight[];
  actionPlan: RiskActionItem[];
}

// --- Coach helpers -----------------------------------------------------------

function scoreLabel(score: number): string {
  if (score <= 1.5) return 'Satisfait Pleinement';
  if (score <= 2.5) return 'Satisfait';
  if (score <= 3.5) return 'Satisfait moyennement';
  if (score <= 4.5) return 'Satisfait insuffisamment';
  return 'Pas satisfait du tout';
}

function participationLabel(rate: number): string {
  if (rate >= 70) return 'Excellente';
  if (rate >= 50) return 'Bonne';
  if (rate >= 30) return 'Moyenne';
  if (rate >= 10) return 'Faible';
  return 'Trop faible';
}

function coachEnps(enps: number): string {
  if (enps >= 50) return 'Vos collaborateurs se sentent proteges et soutenus. C\'est un signal fort — preservez cette dynamique.';
  if (enps >= 10) return 'Plus de collaborateurs se sentent en securite que sous pression. C\'est encourageant, continuez.';
  if (enps >= 0) return 'L\'equilibre est fragile entre bien-etre et mal-etre au travail. Un effort cible peut faire basculer la balance.';
  if (enps >= -20) return 'Le mal-etre gagne du terrain. Vos equipes ont besoin de sentir que leur sante mentale compte.';
  return 'Alerte — les risques psychosociaux sont generalises. Chaque jour sans action aggrave la situation.';
}

function coachParticipation(rate: number): string {
  if (rate >= 70) return 'Vos collaborateurs osent parler de leurs conditions de travail. C\'est un signe de confiance precieux.';
  if (rate >= 50) return 'Une bonne partie de vos equipes s\'est exprimee sur les risques psychosociaux. Continuez a liberer la parole.';
  if (rate >= 30) return 'Moins d\'un collaborateur sur deux a repondu. Sur un sujet aussi sensible, le silence est un message en soi.';
  return 'Tres peu de collaborateurs ont repondu. Avant d\'analyser les risques, interrogez-vous sur les raisons de ce silence.';
}

function coachStrength(score: number): string {
  if (score <= 1.5) return 'C\'est un pilier de bien-etre dans votre organisation. Capitalisez dessus.';
  if (score <= 2.0) return 'Bravo — vos equipes se sentent bien sur ce point. Continuez a proteger cet acquis.';
  return 'C\'est positif, continuez a consolider ce facteur de protection.';
}

function coachWeakness(score: number): string {
  if (score >= 4.0) return 'Ce risque est majeur. Vos collaborateurs souffrent — il faut agir vite et fort.';
  if (score >= 3.5) return 'Vos equipes vous envoient un signal d\'alerte clair. C\'est le moment de reagir.';
  return 'Un facteur de risque a surveiller de pres.';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getQuestionText(code: string): string {
  const q = RPS_QUESTIONS.find(sq => sq.code === code);
  return q?.question || code;
}

// --- Main Engine -------------------------------------------------------------

export class RiskInsightsEngine {
  static generate(
    result: RiskScoringResult,
    latestSnapshot: RpsScoringSnapshot | null,
    previousSnapshot: RpsScoringSnapshot | null,
    campaignCount: number,
  ): RiskInsightsResult {
    const globalDelta = latestSnapshot && previousSnapshot
      ? round2(latestSnapshot.global_score - previousSnapshot.global_score)
      : null;

    const sortedAxes = [...result.axes].sort((a, b) => a.avgScore - b.avgScore);
    const bestAxis = sortedAxes[0];
    const worstAxis = sortedAxes[sortedAxes.length - 1];
    const enps = latestSnapshot?.enps_score ?? 0;

    // --- 1. Executive Summary ------------------------------------------------
    const executiveSummary: RiskExecutiveSummary = {
      globalScore: result.globalScore.avgScore,
      globalScoreLabel: scoreLabel(result.globalScore.avgScore),
      globalDelta,
      deltaDirection: globalDelta === null ? null
        : globalDelta <= -0.3 ? 'improvement'
        : globalDelta >= 0.3 ? 'degradation'
        : 'stable',
      participationRate: result.participation.global.rate,
      participationLabel: participationLabel(result.participation.global.rate),
      enpsScore: enps,
      enpsInterpretation: coachEnps(enps),
      campaignCount,
      bestAxis: { name: bestAxis.axisName, score: bestAxis.avgScore },
      worstAxis: { name: worstAxis.axisName, score: worstAxis.avgScore },
      responseCount: result.responseCount,
      headline: RiskInsightsEngine.buildHeadline(result.globalScore.avgScore, globalDelta),
      narrativeBlocks: RiskInsightsEngine.buildNarrativeBlocks(
        result, enps, globalDelta, campaignCount, bestAxis, worstAxis,
      ),
    };

    // --- 2. Strengths / Weaknesses -------------------------------------------
    const allQuestionScores = RiskInsightsEngine.getAllQuestionScores(result);
    const sorted = [...allQuestionScores].sort((a, b) => a.score - b.score);

    const strengths: RiskQuestionInsight[] = sorted.slice(0, 3).map(q => ({
      code: q.code,
      text: q.text,
      score: q.score,
      scoreLabel: scoreLabel(q.score),
      axisName: AXIS_NAMES[QUESTION_AXES[q.code]] || '',
      drName: DR_NAMES[QUESTION_TO_DR[q.code]] || '',
      coachComment: coachStrength(q.score),
    }));

    const weaknesses: RiskQuestionInsight[] = sorted.slice(-3).reverse().map(q => ({
      code: q.code,
      text: q.text,
      score: q.score,
      scoreLabel: scoreLabel(q.score),
      axisName: AXIS_NAMES[QUESTION_AXES[q.code]] || '',
      drName: DR_NAMES[QUESTION_TO_DR[q.code]] || '',
      coachComment: coachWeakness(q.score),
    }));

    // --- 3. Alerts -----------------------------------------------------------
    const alerts = RiskInsightsEngine.generateAlerts(result, latestSnapshot, previousSnapshot);

    // --- 4. Strategic Matrix -------------------------------------------------
    const correlations = latestSnapshot?.question_correlations || {};
    const strategicMatrix = RiskInsightsEngine.buildStrategicMatrix(allQuestionScores, correlations);

    // --- 5. Department Insights ----------------------------------------------
    const departmentInsights = RiskInsightsEngine.buildDepartmentInsights(
      result, latestSnapshot, previousSnapshot,
    );

    // --- 6. Action Plan ------------------------------------------------------
    const actionPlan = RiskInsightsEngine.buildActionPlan(result);

    return { executiveSummary, strengths, weaknesses, alerts, strategicMatrix, departmentInsights, actionPlan };
  }

  // ---------------------------------------------------------------------------

  private static buildHeadline(score: number, delta: number | null): string {
    if (delta !== null && delta <= -0.5) return 'Les risques reculent — vos actions de prevention portent leurs fruits';
    if (delta !== null && delta <= -0.3) return 'Bonne dynamique — le bien-etre au travail progresse';
    if (delta !== null && delta >= 0.5) return 'Alerte — les risques psychosociaux s\'aggravent fortement';
    if (delta !== null && delta >= 0.3) return 'Vigilance — un recul du bien-etre est observe';
    if (score <= 2.0) return 'Bravo — vos equipes se sentent bien au travail';
    if (score <= 2.5) return 'Les fondations du bien-etre sont solides — continuez';
    if (score <= 3.0) return 'Des signaux de mal-etre emergent — vos equipes attendent des gestes';
    if (score <= 3.5) return 'Vos equipes expriment un mal-etre reel — il faut agir';
    return 'Situation critique — les risques psychosociaux menacent la sante de vos equipes';
  }

  private static buildNarrativeBlocks(
    result: RiskScoringResult,
    enps: number,
    globalDelta: number | null,
    campaignCount: number,
    bestAxis: { axisName: string; avgScore: number },
    worstAxis: { axisName: string; avgScore: number },
  ): string[] {
    const blocks: string[] = [];
    const s = result.globalScore.avgScore;

    // Block 1: Score + verdict
    if (s <= 2.5) {
      blocks.push(`Avec un score global de ${s.toFixed(1)}/5, le niveau de risque psychosocial est contenu. Vos collaborateurs se sentent globalement proteges. C'est une base solide pour aller plus loin.`);
    } else if (s <= 3.5) {
      blocks.push(`Le score global de ${s.toFixed(1)}/5 traduit un mal-etre latent. Vos equipes ne sont pas en rupture, mais elles vous disent que quelque chose ne va pas. Ecoutez ce signal.`);
    } else {
      blocks.push(`Avec un score de ${s.toFixed(1)}/5, les risques psychosociaux sont a un niveau preoccupant. Vos collaborateurs souffrent. Chaque jour sans action aggrave la situation.`);
    }

    // Block 2: Delta trend
    if (globalDelta !== null && campaignCount > 1) {
      if (globalDelta <= -0.3) {
        blocks.push(`Les actions de prevention investies depuis la derniere campagne portent leurs fruits : ${Math.abs(globalDelta).toFixed(1)} points d'amelioration. Continuez, c'est la bonne direction.`);
      } else if (globalDelta >= 0.3) {
        blocks.push(`Attention : les risques se sont aggraves de ${globalDelta.toFixed(1)} points depuis la derniere campagne. Ce n'est pas une fatalite, mais c'est un signal fort qu'il ne faut pas ignorer.`);
      } else {
        blocks.push(`Les risques sont stables par rapport a la derniere campagne. C'est le moment de passer a l'offensive sur la prevention.`);
      }
    }

    // Block 3: Participation
    blocks.push(coachParticipation(result.participation.global.rate));

    // Block 4: Best & Worst axes
    if (bestAxis.avgScore <= 2.5) {
      blocks.push(`Votre facteur de protection : « ${bestAxis.axisName} » (${bestAxis.avgScore.toFixed(1)}/5). C'est un acquis precieux — protegez-le et communiquez dessus.`);
    } else {
      blocks.push(`L'axe « ${bestAxis.axisName} » est le mieux percu (${bestAxis.avgScore.toFixed(1)}/5), meme s'il reste des marges d'amelioration.`);
    }

    if (worstAxis.avgScore >= 3.5) {
      blocks.push(`L'axe « ${worstAxis.axisName} » (${worstAxis.avgScore.toFixed(1)}/5) concentre les souffrances. C'est votre priorite absolue : vos equipes ont besoin d'un signal fort et immediat.`);
    } else if (worstAxis.avgScore >= 3.0) {
      blocks.push(`L'axe « ${worstAxis.axisName} » (${worstAxis.avgScore.toFixed(1)}/5) merite votre attention. Un effort cible de prevention peut faire une vraie difference.`);
    }

    // Block 5: eNPS
    blocks.push(coachEnps(enps));

    return blocks;
  }

  private static getAllQuestionScores(
    result: RiskScoringResult,
  ): Array<{ code: string; text: string; score: number }> {
    const globalPlan = result.actionPlans.find(p => p.lineName === 'Global')
      || result.actionPlans[0];

    if (!globalPlan) return [];

    return globalPlan.recommendations.map(rec => ({
      code: rec.questionCode,
      text: getQuestionText(rec.questionCode),
      score: rec.avgScore,
    }));
  }

  private static generateAlerts(
    result: RiskScoringResult,
    latest: RpsScoringSnapshot | null,
    previous: RpsScoringSnapshot | null,
  ): RiskInsightAlert[] {
    const alerts: RiskInsightAlert[] = [];

    // Axis degradation / improvement
    if (latest && previous) {
      for (const axisId of Object.keys(latest.axis_scores)) {
        const delta = (latest.axis_scores[axisId] || 0) - (previous.axis_scores[axisId] || 0);
        const name = AXIS_NAMES[axisId] || axisId;
        if (delta >= 0.5) {
          alerts.push({
            type: 'critical',
            title: `${name} — risque en forte hausse`,
            description: `Les risques sur « ${name} » se sont aggraves de ${delta.toFixed(1)} pts. Vos equipes souffrent davantage — ne laissez pas ce sujet sans reponse.`,
          });
        } else if (delta <= -0.5) {
          alerts.push({
            type: 'positive',
            title: `${name} — belle amelioration`,
            description: `Bravo ! L'axe « ${name} » s'est ameliore de ${Math.abs(delta).toFixed(1)} pts. Vos efforts de prevention portent leurs fruits.`,
          });
        }
      }
    }

    // Critical scores
    for (const axis of result.axes) {
      if (axis.avgScore >= 3.5) {
        alerts.push({
          type: 'critical',
          title: `${axis.axisName} — risque majeur`,
          description: `Le score de ${axis.avgScore.toFixed(1)}/5 sur « ${axis.axisName} » traduit une souffrance reelle. La sante de vos collaborateurs est en jeu.`,
        });
      }
    }

    // Low participation
    for (const line of result.participation.byLine) {
      if (line.rate < 50 && line.lineName !== 'Global') {
        alerts.push({
          type: 'warning',
          title: `${line.lineName} — faible participation`,
          description: `Seulement ${line.rate.toFixed(0)}% de l'equipe ${line.lineName} a repondu (${line.participants}/${line.totalWorkforce}). Sur un sujet aussi sensible, le silence merite attention.`,
        });
      }
    }

    // Inter-department gaps
    if (latest && latest.by_department.length > 1) {
      for (const axisId of Object.keys(AXIS_NAMES)) {
        const deptScores = latest.by_department
          .filter(d => d.axisScores[axisId] !== undefined)
          .map(d => ({ name: d.name, score: d.axisScores[axisId] }));

        if (deptScores.length >= 2) {
          const sortedDepts = [...deptScores].sort((a, b) => a.score - b.score);
          const gap = sortedDepts[sortedDepts.length - 1].score - sortedDepts[0].score;
          if (gap > 1.5) {
            alerts.push({
              type: 'info',
              title: `Ecart sur « ${AXIS_NAMES[axisId]} »`,
              description: `${gap.toFixed(1)} pts d'ecart entre ${sortedDepts[0].name} et ${sortedDepts[sortedDepts.length - 1].name}. Toutes les equipes ne vivent pas les memes risques.`,
            });
          }
        }
      }
    }

    // eNPS
    if (latest && latest.enps_score < 0) {
      alerts.push({
        type: 'critical',
        title: 'eNPS negatif — le mal-etre domine',
        description: `Avec un eNPS de ${latest.enps_score}, les collaborateurs en souffrance sont plus nombreux que ceux qui se sentent bien. C'est un signal d'urgence.`,
      });
    }

    const order = { critical: 0, warning: 1, info: 2, positive: 3 };
    alerts.sort((a, b) => order[a.type] - order[b.type]);

    return alerts;
  }

  private static buildStrategicMatrix(
    questionScores: Array<{ code: string; text: string; score: number }>,
    correlations: Record<string, number>,
  ): RiskStrategicQuadrant[] {
    const quadrants: RiskStrategicQuadrant[] = [
      {
        id: 'act', label: 'Agir maintenant',
        description: 'Fort impact, risque eleve',
        coachAdvice: 'Ce sont vos urgences. Chaque amelioration ici reduit directement la souffrance de vos equipes.',
        questions: [],
      },
      {
        id: 'maintain', label: 'Proteger ces acquis',
        description: 'Fort impact, risque faible',
        coachAdvice: 'Ces points sont vos remparts. Ne les negligez pas — un recul ici aurait des consequences lourdes.',
        questions: [],
      },
      {
        id: 'monitor', label: 'Garder un oeil',
        description: 'Impact modere, risque eleve',
        coachAdvice: 'Impact limite sur le score global, mais ne les oubliez pas. La prevention commence ici.',
        questions: [],
      },
      {
        id: 'celebrate', label: 'Celebrer et communiquer',
        description: 'Impact modere, risque faible',
        coachAdvice: 'Bravo — ces facteurs de protection sont acquis ! Faites-le savoir a vos equipes.',
        questions: [],
      },
    ];

    for (const q of questionScores) {
      const corr = correlations[q.code] || 0;
      const entry: RiskStrategicQuestion = {
        code: q.code,
        text: q.text,
        score: q.score,
        correlation: round2(corr),
        axisName: AXIS_NAMES[QUESTION_AXES[q.code]] || '',
        actionLabel: QUESTION_ACTION_LABELS[q.code] || '',
      };

      if (q.score >= 3.0 && corr >= 0.5) quadrants[0].questions.push(entry);
      else if (q.score < 3.0 && corr >= 0.5) quadrants[1].questions.push(entry);
      else if (q.score >= 3.0 && corr < 0.5) quadrants[2].questions.push(entry);
      else quadrants[3].questions.push(entry);
    }

    quadrants[0].questions.sort((a, b) => b.score - a.score);
    quadrants[1].questions.sort((a, b) => b.correlation - a.correlation);
    quadrants[2].questions.sort((a, b) => b.score - a.score);
    quadrants[3].questions.sort((a, b) => a.score - b.score);

    return quadrants;
  }

  private static buildDepartmentInsights(
    result: RiskScoringResult,
    latest: RpsScoringSnapshot | null,
    previous: RpsScoringSnapshot | null,
  ): RiskDepartmentInsight[] {
    if (!latest) return [];

    return latest.by_department.map(dept => {
      const axes = Object.entries(dept.axisScores)
        .map(([id, score]) => ({ id, name: AXIS_NAMES[id] || id, score }))
        .sort((a, b) => a.score - b.score);

      const best = axes[0];
      const worst = axes[axes.length - 1];
      const prevDept = previous?.by_department.find(d => d.name === dept.name);
      const delta = prevDept ? round2(dept.globalScore - prevDept.globalScore) : null;

      const mood: RiskDepartmentInsight['mood'] =
        dept.globalScore <= 2.0 ? 'excellent'
        : dept.globalScore <= 2.8 ? 'good'
        : dept.globalScore <= 3.5 ? 'attention'
        : 'critical';

      const parts: string[] = [];

      if (dept.participationRate >= 70) {
        parts.push(`L'equipe ${dept.name} ose parler : ${dept.participationRate.toFixed(0)}% ont repondu.`);
      } else if (dept.participationRate >= 50) {
        parts.push(`${dept.participationRate.toFixed(0)}% de l'equipe ${dept.name} s'est exprimee.`);
      } else {
        parts.push(`Seulement ${dept.participationRate.toFixed(0)}% de l'equipe ${dept.name} a repondu — sur ce sujet sensible, le silence est parlant.`);
      }

      if (delta !== null && delta <= -0.3) {
        parts.push(`Bonne nouvelle : les risques reculent (${Math.abs(delta).toFixed(1)} pts d'amelioration).`);
      } else if (delta !== null && delta >= 0.3) {
        parts.push(`Attention : les risques augmentent de ${delta.toFixed(1)} pts. Un echange avec l'equipe est urgent.`);
      }

      if (best && best.score <= 2.5) {
        parts.push(`Facteur de protection : « ${best.name} » (${best.score.toFixed(1)}/5) — c'est un vrai atout pour cette equipe.`);
      }

      if (worst && worst.score >= 3.0) {
        parts.push(`Facteur de risque : « ${worst.name} » (${worst.score.toFixed(1)}/5) — c'est la ou la prevention doit se concentrer.`);
      }

      return {
        name: dept.name,
        responseCount: dept.responseCount,
        participationRate: dept.participationRate,
        globalScore: dept.globalScore,
        globalScoreLabel: scoreLabel(dept.globalScore),
        bestAxis: best ? { name: best.name, score: best.score } : { name: '-', score: 0 },
        worstAxis: worst ? { name: worst.name, score: worst.score } : { name: '-', score: 0 },
        globalDelta: delta,
        coachSummary: parts.join(' '),
        mood,
      };
    }).sort((a, b) => b.globalScore - a.globalScore);
  }

  private static buildActionPlan(result: RiskScoringResult): RiskActionItem[] {
    const globalPlan = result.actionPlans.find(p => p.lineName === 'Global')
      || result.actionPlans[0];
    if (!globalPlan) return [];

    const worstDeptByQuestion: Record<string, string> = {};
    for (const plan of result.actionPlans) {
      if (plan.lineName === 'Global') continue;
      for (const rec of plan.recommendations) {
        const existing = worstDeptByQuestion[rec.questionCode];
        if (!existing) {
          worstDeptByQuestion[rec.questionCode] = plan.lineName;
        } else {
          const existingPlan = result.actionPlans.find(p => p.lineName === existing);
          const existingRec = existingPlan?.recommendations.find(r => r.questionCode === rec.questionCode);
          if (existingRec && rec.avgScore > existingRec.avgScore) {
            worstDeptByQuestion[rec.questionCode] = plan.lineName;
          }
        }
      }
    }

    return globalPlan.recommendations
      .map(rec => {
        const score = rec.avgScore;
        let coachMessage = '';
        if (score >= 4.0) {
          coachMessage = 'Ce risque est majeur. Vos collaborateurs souffrent — il faut agir vite et fort.';
        } else if (score >= 3.5) {
          coachMessage = 'Vos equipes vous envoient un signal d\'alerte. C\'est le moment de mettre en place des actions de prevention.';
        } else if (score >= 3.0) {
          coachMessage = 'Un facteur de risque a surveiller — la prevention commence maintenant.';
        } else {
          coachMessage = 'Bonne dynamique — continuez a proteger vos equipes sur ce point.';
        }

        return {
          code: rec.questionCode,
          actionLabel: rec.actionLabel,
          questionText: getQuestionText(rec.questionCode),
          score,
          urgency: rec.urgency,
          drName: DR_NAMES[rec.drId] || rec.drId,
          axisName: AXIS_NAMES[QUESTION_AXES[rec.questionCode]] || '',
          worstDepartment: worstDeptByQuestion[rec.questionCode] || null,
          coachMessage,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
