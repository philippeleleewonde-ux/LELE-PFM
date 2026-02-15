import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { withAuth, successResponse, errorResponse, logger } from "../_shared/middleware.ts";

// ============================================================================
// ZOD SCHEMAS — Input validation
// ============================================================================

const EmployeeDataSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'employeeData.firstName is required'),
  lastName: z.string().min(1, 'employeeData.lastName is required'),
  position: z.string().optional(),
  department: z.string().optional(),
  metrics: z.record(z.number()).optional().default({}),
}).passthrough();

const TeamContextSchema = z.object({
  teamName: z.string().optional(),
}).passthrough().optional();

const GoalSchema = z.object({
  description: z.string().optional(),
}).passthrough();

const GenerateCardPayloadSchema = z.object({
  employeeData: EmployeeDataSchema,
  teamContext: TeamContextSchema,
  goals: z.array(GoalSchema).optional().default([]),
  history: z.array(z.any()).optional().default([]),
});

// ============================================================================
// Helper: Parse AI JSON response safely
// ============================================================================

function parseAIJSON(content: string): Record<string, any> | null {
  try {
    // Try direct JSON parse
    return JSON.parse(content);
  } catch {
    // Try extracting JSON from markdown code blocks
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
    const parseResult = GenerateCardPayloadSchema.safeParse(rawBody);

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

    const { employeeData, teamContext, goals, history } = parseResult.data;

    logger.info('Generating performance card', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      employee_id: employeeData.id,
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
          content: `Créez une performance card détaillée et personnalisée. Répondez UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "Productivité": { "score": <number>, "trend": "up|down|stable", "comment": "<string>" },
    "Collaboration": { "score": <number>, "trend": "up|down|stable", "comment": "<string>" },
    "Innovation": { "score": <number>, "trend": "up|down|stable", "comment": "<string>" },
    "Leadership": { "score": <number>, "trend": "up|down|stable", "comment": "<string>" }
  },
  "aiCoaching": ["<conseil 1>", "<conseil 2>", "<conseil 3>"],
  "nextMilestones": [{ "goal": "<string>", "deadline": "<YYYY-MM-DD>", "priority": "high|medium|low" }],
  "careerPath": "<recommandation carrière>",
  "talentScore": <number 0-100>
}`
        }, {
          role: 'user',
          content: `Employé: ${employeeData.firstName} ${employeeData.lastName}
Poste: ${employeeData.position || 'Non spécifié'}
Département: ${employeeData.department || 'Non spécifié'}
Équipe: ${teamContext?.teamName || 'Non spécifié'}

Performances actuelles: ${JSON.stringify(employeeData.metrics || {})}
Objectifs en cours: ${JSON.stringify(goals || [])}
Historique: ${JSON.stringify(history || [])}

Analysez et générez une performance card complète et motivante.`
        }],
        temperature: 0.3,
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

    // Use AI-parsed values if available, otherwise calculate fallbacks
    const metrics = employeeData.metrics || {};
    const fallbackBase = 75;

    const breakdown = aiParsed?.breakdown || {
      "Productivité": {
        score: metrics.productivity || fallbackBase + 5,
        trend: "stable",
        comment: "Performance stable",
      },
      "Collaboration": {
        score: metrics.collaboration || fallbackBase,
        trend: "stable",
        comment: "Collaboration correcte",
      },
      "Innovation": {
        score: metrics.innovation || fallbackBase + 3,
        trend: "stable",
        comment: "Potentiel d'innovation",
      },
      "Leadership": {
        score: metrics.leadership || fallbackBase - 5,
        trend: "stable",
        comment: "En développement",
      },
    };

    const overallScore = aiParsed?.overallScore || Math.round(
      Object.values(breakdown).reduce((sum: number, item: any) => sum + (item.score || 0), 0) / Object.keys(breakdown).length
    );

    const aiCoaching = aiParsed?.aiCoaching || [
      "Développer les compétences de collaboration en équipe",
      "Se former sur les techniques de leadership situationnel",
      "Chercher des opportunités d'innovation dans les projets courants",
    ];

    const nextMilestones = aiParsed?.nextMilestones || [
      {
        goal: "Améliorer la collaboration en équipe",
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "high",
      },
      {
        goal: "Compléter une formation de leadership",
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "medium",
      },
    ];

    const talentScore = aiParsed?.talentScore || Math.min(100, overallScore + 5);
    const careerPath = aiParsed?.careerPath || "Continuer à développer les compétences actuelles";

    const result = {
      employeeId: employeeData.id,
      employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
      overallScore,
      breakdown,
      aiCoaching,
      nextMilestones,
      careerPath,
      talentScore,
      aiInsights: aiContent,
      strengths: Object.entries(breakdown)
        .filter(([_, v]: [string, any]) => (v.score || 0) >= 80)
        .map(([k]) => k),
      developmentAreas: Object.entries(breakdown)
        .filter(([_, v]: [string, any]) => (v.score || 0) < 75)
        .map(([k]) => k),
      generatedAt: new Date().toISOString(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    };

    logger.info('Performance card generated', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      overall_score: overallScore,
      ai_parsed: !!aiParsed,
    });

    return successResponse(result, correlationId);

  } catch (err) {
    return errorResponse(err as Error, 500, correlationId);
  }
});
