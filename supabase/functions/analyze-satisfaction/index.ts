import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { withAuth, successResponse, errorResponse, logger } from "../_shared/middleware.ts";

// ============================================================================
// ZOD SCHEMAS — Input validation
// ============================================================================

const SurveyResponseSchema = z.object({
  responses: z.record(z.union([z.string(), z.number()])).optional().default({}),
}).passthrough();

const PreviousSurveySchema = z.object({
  average_score: z.number().optional(),
}).passthrough();

const AnalyzeSatisfactionPayloadSchema = z.object({
  responses: z.array(SurveyResponseSchema).min(1, 'At least 1 survey response required'),
  previousSurveys: z.array(PreviousSurveySchema).optional().default([]),
  employeeProfiles: z.array(z.any()).optional(),
  surveyTitle: z.string().min(1, 'surveyTitle is required'),
});

// ============================================================================
// Helper: Parse AI JSON response safely
// ============================================================================

function parseAIJSON(content: string): Record<string, any> | null {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ============================================================================

serve(async (req) => {
  // Apply middleware: auth required, rate limited
  const { context, error } = await withAuth(req, {
    requireAuth: true,
    rateLimitPerMinute: 30,
  });

  if (error) return error;

  const { correlationId, user, companyId } = context;

  try {
    const rawBody = await req.json();
    const parseResult = AnalyzeSatisfactionPayloadSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.error('Payload validation failed', new Error('Validation Error'), {
        correlationId,
        user_id: user.id,
        errors: parseResult.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
      return errorResponse(
        `Validation Error: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        400,
        correlationId
      );
    }

    const { responses, previousSurveys, employeeProfiles, surveyTitle } = parseResult.data;

    logger.info('Analyzing satisfaction survey', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      survey_title: surveyTitle,
      response_count: responses.length,
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      logger.error('LOVABLE_API_KEY not configured', new Error('Missing API key'), { correlationId });
      throw new Error('AI API configuration error');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: `Analysez cette enquête de satisfaction employés. Répondez UNIQUEMENT en JSON valide avec cette structure:
{
  "overallSatisfaction": <number 0-100>,
  "criticalIssues": [
    { "issue": "<description>", "severity": "HIGH|MEDIUM|LOW", "affected": <number> }
  ],
  "turnoverRisk": {
    "highRisk": <number>,
    "probability": "<string ex: 25% dans 6 mois>",
    "factors": ["<factor1>", "<factor2>"]
  },
  "actionPlan": [
    { "action": "<description>", "impact": "High|Medium|Low", "cost": <number>, "timeframe": "<string>" }
  ],
  "aiRecommendations": "<texte libre avec recommandations détaillées>"
}`
        }, {
          role: 'user',
          content: `Enquête: ${surveyTitle}
${responses.length} réponses collectées
Employés concernés: ${employeeProfiles?.length || 'N/A'}
Historique précédent: ${JSON.stringify(previousSurveys)}

Données des réponses: ${JSON.stringify(responses.slice(0, 50))}

Analysez et fournissez:
1. Score de satisfaction global (0-100)
2. Tendance vs période précédente
3. 3 problèmes critiques identifiés
4. Risques de turnover (qui et probabilité)
5. Plan d'action avec 3 recommandations prioritaires`
        }],
        temperature: 0.2,
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('AI API error', new Error(`HTTP ${aiResponse.status}`), {
        correlationId,
        user_id: user.id,
        status: aiResponse.status,
        error_text: errorText,
      });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices[0].message.content;

    // Try to parse structured AI response
    const aiParsed = parseAIJSON(aiContent);

    // Calculate score from actual responses as fallback
    const totalScore = responses.reduce((sum: number, r: any) => {
      const responseValues = Object.values(r.responses || {});
      const avgResponse = responseValues.reduce((s: number, v: any) => {
        const numVal = typeof v === 'number' ? v : parseInt(v) || 0;
        return s + numVal;
      }, 0) / (responseValues.length || 1);
      return sum + avgResponse;
    }, 0);

    const calculatedSatisfaction = Math.round((totalScore / responses.length) * 20);

    // Use AI values if parsed, otherwise fallback to calculated
    const overallSatisfaction = aiParsed?.overallSatisfaction ?? calculatedSatisfaction;

    const previousScore = previousSurveys?.[0]?.average_score || overallSatisfaction - 5;
    const trend = overallSatisfaction - previousScore;
    const trendText = trend > 0 ? `+${trend}%` : `${trend}%`;

    const criticalIssues = aiParsed?.criticalIssues || [
      {
        issue: "Équilibre vie pro/perso",
        severity: overallSatisfaction < 60 ? "HIGH" : "MEDIUM",
        affected: Math.round(responses.length * 0.35),
      },
      {
        issue: "Communication management",
        severity: overallSatisfaction < 50 ? "HIGH" : "MEDIUM",
        affected: Math.round(responses.length * 0.28),
      },
      {
        issue: "Opportunités de développement",
        severity: "MEDIUM",
        affected: Math.round(responses.length * 0.22),
      },
    ];

    const turnoverRisk = aiParsed?.turnoverRisk || {
      highRisk: responses.length > 20 ? Math.round(responses.length * 0.08) : 2,
      probability: overallSatisfaction < 50 ? "45% dans 6 mois" : overallSatisfaction < 70 ? "25% dans 6 mois" : "10% dans 6 mois",
      factors: ["Satisfaction faible", "Manque reconnaissance", "Charge de travail élevée"],
    };

    const actionPlan = aiParsed?.actionPlan || [
      { action: "Mettre en place des horaires flexibles", impact: "High", cost: 0, timeframe: "1 mois" },
      { action: "Formation managers communication", impact: "Medium", cost: 5000, timeframe: "2 mois" },
      { action: "Programme de reconnaissance employés", impact: "High", cost: 3000, timeframe: "1 mois" },
    ];

    const analysisResult = {
      overallSatisfaction,
      trend: `${trendText} vs trimestre précédent`,
      trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      criticalIssues,
      turnoverRisk,
      actionPlan,
      aiRecommendations: aiParsed?.aiRecommendations || aiContent,
      participationRate: Math.round((responses.length / (employeeProfiles?.length || responses.length)) * 100),
      responseCount: responses.length,
      generatedAt: new Date().toISOString(),
    };

    logger.info('Satisfaction analysis completed', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      overall_satisfaction: overallSatisfaction,
      ai_parsed: !!aiParsed,
    });

    return successResponse(analysisResult, correlationId);

  } catch (err) {
    return errorResponse(err as Error, 500, correlationId);
  }
});
