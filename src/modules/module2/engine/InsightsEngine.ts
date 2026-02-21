// ============================================================================
// MODULE 2 — INSIGHTS ENGINE (Coach Voice)
// Pure computation: generates human, warm, coaching-style insights
// Tone: Like a coach talking to their players after the game
// No API calls — deterministic templates fed by real data
// ============================================================================

import type { ScoringResult } from './types';
import { THEME_NAMES, DC_NAMES, QUESTION_TO_DC, QUESTION_THEMES, QUESTION_ACTION_LABELS } from './constants';
import { SURVEY_QUESTIONS } from '@/modules/module2/data/surveyQuestions';
import type { ScoringSnapshot } from '@/modules/module2/services/ScoringSnapshotService';

// --- Output types ------------------------------------------------------------

export interface ExecutiveSummary {
  globalScore: number;
  globalScoreLabel: string;
  globalDelta: number | null;
  deltaDirection: 'improvement' | 'degradation' | 'stable' | null;
  participationRate: number;
  participationLabel: string;
  enpsScore: number;
  enpsInterpretation: string;
  campaignCount: number;
  bestTheme: { name: string; score: number };
  worstTheme: { name: string; score: number };
  responseCount: number;
  headline: string;
  narrativeBlocks: string[];
}

export interface QuestionInsight {
  code: string;
  text: string;
  score: number;
  scoreLabel: string;
  themeName: string;
  dcName: string;
  coachComment: string;
}

export interface InsightAlert {
  type: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  description: string;
}

export interface StrategicQuestion {
  code: string;
  text: string;
  score: number;
  correlation: number;
  themeName: string;
  actionLabel: string;
}

export interface StrategicQuadrant {
  id: 'act' | 'maintain' | 'monitor' | 'celebrate';
  label: string;
  description: string;
  coachAdvice: string;
  questions: StrategicQuestion[];
}

export interface DepartmentInsight {
  name: string;
  responseCount: number;
  participationRate: number;
  globalScore: number;
  globalScoreLabel: string;
  bestTheme: { name: string; score: number };
  worstTheme: { name: string; score: number };
  globalDelta: number | null;
  coachSummary: string;
  mood: 'excellent' | 'good' | 'attention' | 'critical';
}

export interface ActionItem {
  code: string;
  actionLabel: string;
  questionText: string;
  score: number;
  urgency: 'urgent' | 'to-improve' | 'ok';
  dcName: string;
  themeName: string;
  worstDepartment: string | null;
  coachMessage: string;
}

export interface InsightsResult {
  executiveSummary: ExecutiveSummary;
  strengths: QuestionInsight[];
  weaknesses: QuestionInsight[];
  alerts: InsightAlert[];
  strategicMatrix: StrategicQuadrant[];
  departmentInsights: DepartmentInsight[];
  actionPlan: ActionItem[];
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

function coachScoreVerdict(score: number): string {
  if (score <= 1.5) return 'Vos collaborateurs expriment une vraie fierté';
  if (score <= 2.5) return 'Bonne dynamique, les fondations sont solides';
  if (score <= 3.5) return 'Un signal a entendre de la part de vos equipes';
  if (score <= 4.5) return 'Vos equipes tirent la sonnette d\'alarme';
  return 'Situation critique — chaque jour compte';
}

function coachEnps(enps: number): string {
  if (enps >= 50) return 'Vos collaborateurs sont vos meilleurs ambassadeurs. Protegez cette dynamique.';
  if (enps >= 10) return 'Vous avez plus d\'ambassadeurs que de detracteurs dans vos rangs. C\'est encourageant.';
  if (enps >= 0) return 'L\'equilibre est fragile entre promoteurs et detracteurs. Un effort cible peut faire basculer la balance.';
  if (enps >= -20) return 'L\'insatisfaction gagne du terrain. Vos equipes ont besoin de sentir que les choses bougent.';
  return 'Alerte — l\'insatisfaction est generalisee. Mobilisez-vous maintenant, chaque geste compte.';
}

function coachParticipation(rate: number): string {
  if (rate >= 70) return 'Vos collaborateurs se sentent ecoutes et prennent la parole. C\'est un signe de confiance precieux.';
  if (rate >= 50) return 'Une bonne partie de vos equipes s\'est exprimee. Continuez a creer les conditions du dialogue.';
  if (rate >= 30) return 'Moins d\'un collaborateur sur deux a repondu. Le silence est aussi un message — cherchez a comprendre pourquoi.';
  return 'Tres peu de collaborateurs ont repondu. Avant d\'analyser les resultats, interrogez-vous sur les raisons de ce silence.';
}

function coachStrength(score: number): string {
  if (score <= 1.5) return 'C\'est un acquis precieux. Capitalisez dessus et partagez cette reussite.';
  if (score <= 2.0) return 'Bravo — vos efforts portent leurs fruits sur ce point.';
  return 'C\'est positif, continuez a consolider.';
}

function coachWeakness(score: number): string {
  if (score >= 4.0) return 'Ce sujet ne peut plus attendre. Vos equipes ont besoin d\'un signal fort et rapide.';
  if (score >= 3.5) return 'Vos collaborateurs vous envoient un signal clair. C\'est le moment de reagir.';
  return 'Un point de vigilance a ne pas laisser sans reponse.';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getQuestionText(code: string): string {
  const q = SURVEY_QUESTIONS.find(sq => sq.code === code);
  return q?.question || code;
}

// --- Main Engine -------------------------------------------------------------

export class InsightsEngine {
  static generate(
    result: ScoringResult,
    latestSnapshot: ScoringSnapshot | null,
    previousSnapshot: ScoringSnapshot | null,
    campaignCount: number,
  ): InsightsResult {
    const globalDelta = latestSnapshot && previousSnapshot
      ? round2(latestSnapshot.global_score - previousSnapshot.global_score)
      : null;

    const sortedThemes = [...result.themes].sort((a, b) => a.avgScore - b.avgScore);
    const bestTheme = sortedThemes[0];
    const worstTheme = sortedThemes[sortedThemes.length - 1];
    const enps = latestSnapshot?.enps_score ?? 0;

    // --- 1. Executive Summary ------------------------------------------------
    const executiveSummary: ExecutiveSummary = {
      globalScore: result.globalSatisfaction.avgScore,
      globalScoreLabel: scoreLabel(result.globalSatisfaction.avgScore),
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
      bestTheme: { name: bestTheme.themeName, score: bestTheme.avgScore },
      worstTheme: { name: worstTheme.themeName, score: worstTheme.avgScore },
      responseCount: result.responseCount,
      headline: InsightsEngine.buildHeadline(result.globalSatisfaction.avgScore, globalDelta),
      narrativeBlocks: InsightsEngine.buildNarrativeBlocks(
        result, enps, globalDelta, campaignCount, bestTheme, worstTheme,
      ),
    };

    // --- 2. Strengths / Weaknesses -------------------------------------------
    const allQuestionScores = InsightsEngine.getAllQuestionScores(result);
    const sorted = [...allQuestionScores].sort((a, b) => a.score - b.score);

    const strengths: QuestionInsight[] = sorted.slice(0, 3).map(q => ({
      code: q.code,
      text: q.text,
      score: q.score,
      scoreLabel: scoreLabel(q.score),
      themeName: THEME_NAMES[QUESTION_THEMES[q.code]] || '',
      dcName: DC_NAMES[QUESTION_TO_DC[q.code]] || '',
      coachComment: coachStrength(q.score),
    }));

    const weaknesses: QuestionInsight[] = sorted.slice(-3).reverse().map(q => ({
      code: q.code,
      text: q.text,
      score: q.score,
      scoreLabel: scoreLabel(q.score),
      themeName: THEME_NAMES[QUESTION_THEMES[q.code]] || '',
      dcName: DC_NAMES[QUESTION_TO_DC[q.code]] || '',
      coachComment: coachWeakness(q.score),
    }));

    // --- 3. Alerts -----------------------------------------------------------
    const alerts = InsightsEngine.generateAlerts(result, latestSnapshot, previousSnapshot);

    // --- 4. Strategic Matrix -------------------------------------------------
    const correlations = latestSnapshot?.question_correlations || {};
    const strategicMatrix = InsightsEngine.buildStrategicMatrix(allQuestionScores, correlations);

    // --- 5. Department Insights ----------------------------------------------
    const departmentInsights = InsightsEngine.buildDepartmentInsights(
      result, latestSnapshot, previousSnapshot,
    );

    // --- 6. Action Plan ------------------------------------------------------
    const actionPlan = InsightsEngine.buildActionPlan(result);

    return { executiveSummary, strengths, weaknesses, alerts, strategicMatrix, departmentInsights, actionPlan };
  }

  // ---------------------------------------------------------------------------

  private static buildHeadline(score: number, delta: number | null): string {
    if (delta !== null && delta <= -0.5) return 'Vos efforts paient — la satisfaction progresse nettement';
    if (delta !== null && delta <= -0.3) return 'Bonne dynamique — la tendance est a l\'amelioration';
    if (delta !== null && delta >= 0.5) return 'Attention — la satisfaction se degrade fortement';
    if (delta !== null && delta >= 0.3) return 'Vigilance — un recul est observe depuis la derniere campagne';
    if (score <= 2.0) return 'Bravo — vos equipes sont globalement satisfaites';
    if (score <= 2.5) return 'Les fondations sont solides — continuez sur cette lancee';
    if (score <= 3.0) return 'Un resultat mitige — vos equipes attendent des signaux';
    if (score <= 3.5) return 'Vos equipes expriment des attentes claires';
    return 'Situation critique — vos collaborateurs ont besoin de vous maintenant';
  }

  private static buildNarrativeBlocks(
    result: ScoringResult,
    enps: number,
    globalDelta: number | null,
    campaignCount: number,
    bestTheme: { themeName: string; avgScore: number },
    worstTheme: { themeName: string; avgScore: number },
  ): string[] {
    const blocks: string[] = [];
    const s = result.globalSatisfaction.avgScore;

    // Block 1: Score + verdict
    if (s <= 2.5) {
      blocks.push(`Avec un score global de ${s.toFixed(1)}/5, vos collaborateurs expriment une satisfaction reelle. C'est une base solide pour aller plus loin.`);
    } else if (s <= 3.5) {
      blocks.push(`Le score global de ${s.toFixed(1)}/5 traduit un ressenti mitige. Vos equipes ne sont pas en rupture, mais elles attendent des gestes concrets.`);
    } else {
      blocks.push(`Avec un score de ${s.toFixed(1)}/5, la satisfaction est au plus bas. Vos collaborateurs vous disent clairement que quelque chose ne va pas. Ecoutez-les.`);
    }

    // Block 2: Delta trend
    if (globalDelta !== null && campaignCount > 1) {
      if (globalDelta <= -0.3) {
        blocks.push(`Les efforts investis depuis la derniere campagne portent leurs fruits : ${Math.abs(globalDelta).toFixed(1)} points d'amelioration. Continuez, c'est la bonne direction.`);
      } else if (globalDelta >= 0.3) {
        blocks.push(`Attention : la satisfaction a recule de ${globalDelta.toFixed(1)} points depuis la derniere campagne. Ce n'est pas une fatalite, mais c'est un signal qu'il ne faut pas ignorer.`);
      } else {
        blocks.push(`La satisfaction est stable par rapport a la derniere campagne. C'est le moment de passer a la vitesse superieure.`);
      }
    }

    // Block 3: Participation
    blocks.push(coachParticipation(result.participation.global.rate));

    // Block 4: Best & Worst themes
    if (bestTheme.avgScore <= 2.5) {
      blocks.push(`Votre point fort : « ${bestTheme.themeName} » (${bestTheme.avgScore.toFixed(1)}/5). C'est un acquis precieux — protegez-le et faites-le savoir a vos equipes.`);
    } else {
      blocks.push(`Le theme « ${bestTheme.themeName} » est le mieux percu (${bestTheme.avgScore.toFixed(1)}/5), meme s'il reste des marges de progression.`);
    }

    if (worstTheme.avgScore >= 3.5) {
      blocks.push(`Le theme « ${worstTheme.themeName} » (${worstTheme.avgScore.toFixed(1)}/5) concentre les insatisfactions. C'est votre priorite numero un : vos equipes attendent un signal fort sur ce sujet.`);
    } else if (worstTheme.avgScore >= 3.0) {
      blocks.push(`Le theme « ${worstTheme.themeName} » (${worstTheme.avgScore.toFixed(1)}/5) merite votre attention. Un effort cible ici peut faire une vraie difference.`);
    }

    // Block 5: eNPS
    blocks.push(coachEnps(enps));

    return blocks;
  }

  private static getAllQuestionScores(
    result: ScoringResult,
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
    result: ScoringResult,
    latest: ScoringSnapshot | null,
    previous: ScoringSnapshot | null,
  ): InsightAlert[] {
    const alerts: InsightAlert[] = [];

    // Theme degradation / improvement
    if (latest && previous) {
      for (const themeId of Object.keys(latest.theme_scores)) {
        const delta = (latest.theme_scores[themeId] || 0) - (previous.theme_scores[themeId] || 0);
        const name = THEME_NAMES[themeId] || themeId;
        if (delta >= 0.5) {
          alerts.push({
            type: 'critical',
            title: `${name} — recul important`,
            description: `Vos equipes expriment une insatisfaction croissante sur « ${name} » (+${delta.toFixed(1)} pts). Ne laissez pas ce sujet sans reponse — c'est le moment d'agir.`,
          });
        } else if (delta <= -0.5) {
          alerts.push({
            type: 'positive',
            title: `${name} — belle progression`,
            description: `Bravo ! Le theme « ${name} » s'est ameliore de ${Math.abs(delta).toFixed(1)} pts. Vos efforts portent leurs fruits — continuez sur cette lancee.`,
          });
        }
      }
    }

    // Critical scores
    for (const theme of result.themes) {
      if (theme.avgScore >= 3.5) {
        alerts.push({
          type: 'critical',
          title: `${theme.themeName} — situation critique`,
          description: `Le score de ${theme.avgScore.toFixed(1)}/5 sur « ${theme.themeName} » traduit une insatisfaction profonde. Vos collaborateurs ont besoin de sentir que ce sujet est pris au serieux.`,
        });
      }
    }

    // Low participation
    for (const line of result.participation.byLine) {
      if (line.rate < 50 && line.lineName !== 'Global') {
        alerts.push({
          type: 'warning',
          title: `${line.lineName} — faible participation`,
          description: `Seulement ${line.rate.toFixed(0)}% de l'equipe ${line.lineName} a repondu (${line.participants}/${line.totalWorkforce}). Le silence est aussi un message — cherchez a comprendre les freins.`,
        });
      }
    }

    // Inter-department gaps
    if (latest && latest.by_department.length > 1) {
      for (const themeId of Object.keys(THEME_NAMES)) {
        const deptScores = latest.by_department
          .filter(d => d.themeScores[themeId] !== undefined)
          .map(d => ({ name: d.name, score: d.themeScores[themeId] }));

        if (deptScores.length >= 2) {
          const sorted = [...deptScores].sort((a, b) => a.score - b.score);
          const gap = sorted[sorted.length - 1].score - sorted[0].score;
          if (gap > 1.5) {
            alerts.push({
              type: 'info',
              title: `Ecart sur « ${THEME_NAMES[themeId]} »`,
              description: `${gap.toFixed(1)} pts d'ecart entre ${sorted[0].name} et ${sorted[sorted.length - 1].name}. Toutes les equipes ne vivent pas la meme realite — une attention particuliere est necessaire.`,
            });
          }
        }
      }
    }

    // eNPS
    if (latest && latest.enps_score < 0) {
      alerts.push({
        type: 'critical',
        title: 'eNPS negatif — l\'insatisfaction domine',
        description: `Avec un eNPS de ${latest.enps_score}, les detracteurs sont plus nombreux que les ambassadeurs. C'est un signal fort : vos equipes ont besoin de retrouver confiance.`,
      });
    }

    const order = { critical: 0, warning: 1, info: 2, positive: 3 };
    alerts.sort((a, b) => order[a.type] - order[b.type]);

    return alerts;
  }

  private static buildStrategicMatrix(
    questionScores: Array<{ code: string; text: string; score: number }>,
    correlations: Record<string, number>,
  ): StrategicQuadrant[] {
    const quadrants: StrategicQuadrant[] = [
      {
        id: 'act', label: 'Agir maintenant',
        description: 'Fort impact sur la satisfaction, score faible',
        coachAdvice: 'Ce sont vos leviers les plus puissants. Chaque amelioration ici se ressentira dans le score global.',
        questions: [],
      },
      {
        id: 'maintain', label: 'Proteger ces acquis',
        description: 'Fort impact sur la satisfaction, bon score',
        coachAdvice: 'Ces points sont vos piliers. Ne les negligez pas — un recul ici aurait un impact fort.',
        questions: [],
      },
      {
        id: 'monitor', label: 'Garder un oeil',
        description: 'Impact modere, score faible',
        coachAdvice: 'Impact limite sur le score global, mais ne les oubliez pas. Un effort ponctuel peut faire la difference.',
        questions: [],
      },
      {
        id: 'celebrate', label: 'Celebrer et communiquer',
        description: 'Impact modere, bon score',
        coachAdvice: 'Bravo — c\'est acquis ! Faites-le savoir a vos equipes pour renforcer la dynamique positive.',
        questions: [],
      },
    ];

    for (const q of questionScores) {
      const corr = correlations[q.code] || 0;
      const entry: StrategicQuestion = {
        code: q.code,
        text: q.text,
        score: q.score,
        correlation: round2(corr),
        themeName: THEME_NAMES[QUESTION_THEMES[q.code]] || '',
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
    result: ScoringResult,
    latest: ScoringSnapshot | null,
    previous: ScoringSnapshot | null,
  ): DepartmentInsight[] {
    if (!latest) return [];

    return latest.by_department.map(dept => {
      const themes = Object.entries(dept.themeScores)
        .map(([id, score]) => ({ id, name: THEME_NAMES[id] || id, score }))
        .sort((a, b) => a.score - b.score);

      const best = themes[0];
      const worst = themes[themes.length - 1];
      const prevDept = previous?.by_department.find(d => d.name === dept.name);
      const delta = prevDept ? round2(dept.globalScore - prevDept.globalScore) : null;

      const mood: DepartmentInsight['mood'] =
        dept.globalScore <= 2.0 ? 'excellent'
        : dept.globalScore <= 2.8 ? 'good'
        : dept.globalScore <= 3.5 ? 'attention'
        : 'critical';

      // Build coach summary
      const parts: string[] = [];

      // Participation comment
      if (dept.participationRate >= 70) {
        parts.push(`L'equipe ${dept.name} vous fait confiance : ${dept.participationRate.toFixed(0)}% ont repondu.`);
      } else if (dept.participationRate >= 50) {
        parts.push(`${dept.participationRate.toFixed(0)}% de l'equipe ${dept.name} s'est exprimee.`);
      } else {
        parts.push(`Seulement ${dept.participationRate.toFixed(0)}% de l'equipe ${dept.name} a repondu — le silence merite attention.`);
      }

      // Score + delta
      if (delta !== null && delta <= -0.3) {
        parts.push(`Bonne nouvelle : la satisfaction progresse (${Math.abs(delta).toFixed(1)} pts d'amelioration).`);
      } else if (delta !== null && delta >= 0.3) {
        parts.push(`Attention : la satisfaction recule de ${delta.toFixed(1)} pts. Un echange avec l'equipe serait bienvenu.`);
      }

      // Best
      if (best && best.score <= 2.5) {
        parts.push(`Point fort : « ${best.name} » (${best.score.toFixed(1)}/5) — c'est un vrai atout de cette equipe.`);
      }

      // Worst
      if (worst && worst.score >= 3.0) {
        parts.push(`Point de vigilance : « ${worst.name} » (${worst.score.toFixed(1)}/5) — c'est la ou vos collaborateurs attendent le plus de progres.`);
      }

      return {
        name: dept.name,
        responseCount: dept.responseCount,
        participationRate: dept.participationRate,
        globalScore: dept.globalScore,
        globalScoreLabel: scoreLabel(dept.globalScore),
        bestTheme: best ? { name: best.name, score: best.score } : { name: '-', score: 0 },
        worstTheme: worst ? { name: worst.name, score: worst.score } : { name: '-', score: 0 },
        globalDelta: delta,
        coachSummary: parts.join(' '),
        mood,
      };
    }).sort((a, b) => b.globalScore - a.globalScore);
  }

  private static buildActionPlan(result: ScoringResult): ActionItem[] {
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
          coachMessage = 'Ce sujet ne peut plus attendre. Vos equipes ont besoin d\'un signal fort et rapide.';
        } else if (score >= 3.5) {
          coachMessage = 'Vos collaborateurs vous envoient un signal clair. C\'est le moment de reagir.';
        } else if (score >= 3.0) {
          coachMessage = 'Un point de vigilance a ne pas laisser sans reponse.';
        } else {
          coachMessage = 'Bonne dynamique — continuez a consolider.';
        }

        return {
          code: rec.questionCode,
          actionLabel: rec.actionLabel,
          questionText: getQuestionText(rec.questionCode),
          score,
          urgency: rec.urgency,
          dcName: DC_NAMES[rec.dcId] || rec.dcId,
          themeName: THEME_NAMES[QUESTION_THEMES[rec.questionCode]] || '',
          worstDepartment: worstDeptByQuestion[rec.questionCode] || null,
          coachMessage,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
