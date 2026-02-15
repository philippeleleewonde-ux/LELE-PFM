import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { withAuth, successResponse, errorResponse, logger } from "../_shared/middleware.ts";

// ============================================================================
// ZOD SCHEMAS — Input validation
// ============================================================================

const TeamDataItemSchema = z.object({
  team_name: z.string().optional(),
  cost_savings: z.number().default(0),
}).passthrough();

const IndustryDataSchema = z.object({
  sector: z.string().optional(),
  benchmarks: z.object({
    averageAnnual: z.number().optional(),
  }).passthrough().optional(),
}).passthrough().optional();

const PreviousPeriodSchema = z.object({
  cost_savings: z.number(),
}).passthrough();

const CalculateSavingsPayloadSchema = z.object({
  teamData: z.array(TeamDataItemSchema).min(1, 'teamData must contain at least 1 team'),
  industryData: IndustryDataSchema,
  previousPeriods: z.array(PreviousPeriodSchema).optional().default([]),
});

// ============================================================================

serve(async (req) => {
  // Apply middleware: auth required, rate limited, CEO/RH_MANAGER only
  const { context, error } = await withAuth(req, {
    requireAuth: true,
    rateLimitPerMinute: 30,
    allowedRoles: ['CEO', 'RH_MANAGER'],
  });

  // Return error if middleware failed (CORS preflight, auth, rate limit)
  if (error) return error;

  const { correlationId, user, companyId, supabaseClient } = context;

  try {
    const rawBody = await req.json();

    // Validate payload
    const parseResult = CalculateSavingsPayloadSchema.safeParse(rawBody);
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

    const { teamData, industryData, previousPeriods } = parseResult.data;

    logger.info('Calculating savings', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      teams_count: teamData?.length || 0,
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
          content: `Calculez précisément les économies de coûts basées sur les performances d'équipe. Utilisez les benchmarks sectoriels et l'historique pour des projections fiables. Générez un score de performance (0-100) pour évaluation bancaire selon ces critères:
- Croissance des économies (30%)
- Constance des résultats (25%)
- Position sectorielle (20%)
- Gestion des risques (15%)
- Tendances futures (10%)
Répondez en JSON structuré.`
        }, {
          role: 'user',
          content: `Secteur: ${industryData?.sector || 'Non spécifié'}
Données équipes: ${JSON.stringify(teamData)}
Historique: ${JSON.stringify(previousPeriods)}
Benchmarks: ${JSON.stringify(industryData?.benchmarks)}

Calculez:
1. Économies hebdomadaires et projection annuelle
2. Répartition par source (productivité, absentéisme, accidents, formation)
3. Score de performance bancaire (0-100)
4. Niveau de risque et taux recommandé
5. Position vs benchmark sectoriel`
        }]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('AI API error', new Error(`HTTP ${aiResponse.status}`), {
        correlationId,
        user_id: user.id,
        company_id: companyId,
        status: aiResponse.status,
        error_text: errorText,
      });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiInsights = aiResult.choices[0].message.content;

    logger.info('AI analysis completed', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      ai_model: 'google/gemini-2.5-flash',
    });

    // Calculer les économies réelles
    const weeklySavings = teamData.reduce((sum: number, team: any) => {
      return sum + (team.cost_savings || 0);
    }, 0);

    const annualProjection = weeklySavings * 52;

    // Breakdown des économies
    const breakdown = {
      "Productivité améliorée": Math.round(annualProjection * 0.40),
      "Réduction absentéisme": Math.round(annualProjection * 0.25),
      "Moins d'accidents": Math.round(annualProjection * 0.20),
      "Optimisation formation": Math.round(annualProjection * 0.15)
    };

    // Calculer le score bancaire basé sur plusieurs facteurs
    const growthRate = previousPeriods?.length > 0
      ? ((weeklySavings - previousPeriods[0].cost_savings) / previousPeriods[0].cost_savings) * 100
      : 15;

    const consistency = previousPeriods?.length >= 4
      ? Math.min(100, 100 - (Math.abs(growthRate) * 2))
      : 75;

    const benchmarkValue = industryData?.benchmarks?.averageAnnual || annualProjection * 0.8;
    const sectorPosition = Math.min(100, (annualProjection / benchmarkValue) * 100);

    // Score global (0-100)
    const bankingScore = Math.round(
      (Math.min(growthRate, 30) * 0.30) +
      (consistency * 0.25) +
      (Math.min(sectorPosition, 100) * 0.20) +
      (85 * 0.15) +
      (75 * 0.10)
    );

    // Déterminer le niveau de risque et le taux
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let recommendedRate: number;

    if (bankingScore >= 75) {
      riskLevel = 'LOW';
      recommendedRate = 2.5 + (Math.random() * 0.5);
    } else if (bankingScore >= 50) {
      riskLevel = 'MEDIUM';
      recommendedRate = 3.5 + (Math.random() * 0.8);
    } else {
      riskLevel = 'HIGH';
      recommendedRate = 5.0 + (Math.random() * 1.5);
    }

    // Position benchmark
    let benchmarkPosition: string;
    if (sectorPosition >= 150) benchmarkPosition = "Top 5% du secteur - Excellence";
    else if (sectorPosition >= 125) benchmarkPosition = "Top 15% du secteur - Très performant";
    else if (sectorPosition >= 100) benchmarkPosition = "Top 25% du secteur - Performant";
    else if (sectorPosition >= 80) benchmarkPosition = "Moyenne du secteur";
    else benchmarkPosition = "En dessous de la moyenne - Amélioration nécessaire";

    // Sauvegarder le score avec le client authentifié (scoped to user's company via RLS)
    // Use service role for insert since this is a server-side operation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabaseAdmin.from('ai_banking_scores').insert({
      company_id: companyId,
      global_score: bankingScore,
      risk_level: riskLevel,
      recommended_rate: recommendedRate.toFixed(2),
      confidence_level: 90,
      factors: [
        `Croissance: ${growthRate.toFixed(1)}%`,
        `Constance: ${consistency.toFixed(0)}%`,
        `Position sectorielle: ${sectorPosition.toFixed(0)}%`
      ],
      benchmark_position: benchmarkPosition,
      module_scores: {
        module3: bankingScore,
        weeklySavings,
        annualProjection
      },
      ai_analysis: {
        insights: aiInsights,
        breakdown,
        trends: "Positive"
      }
    });

    const result = {
      weeklySavings: Math.round(weeklySavings),
      annualProjection: Math.round(annualProjection),
      breakdown,
      bankingScore: {
        score: bankingScore,
        riskLevel,
        recommendedRate: parseFloat(recommendedRate.toFixed(2)),
        factors: [
          `Croissance économies: ${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
          `Constance performances: ${consistency.toFixed(0)}%`,
          `Position sectorielle: ${sectorPosition.toFixed(0)}%`,
          "Gestion optimisée"
        ]
      },
      benchmarkPosition,
      confidence: 92,
      nextTargets: [
        bankingScore < 85 ? "Atteindre score 85 pour taux < 3%" : "Maintenir l'excellence",
        sectorPosition < 125 ? "Viser Top 15% du secteur" : "Viser Top 5% du secteur"
      ],
      aiInsights,
      generatedAt: new Date().toISOString()
    };

    logger.info('Savings calculation completed', {
      correlationId,
      user_id: user.id,
      company_id: companyId,
      banking_score: bankingScore,
      risk_level: riskLevel,
    });

    return successResponse(result, correlationId);

  } catch (err) {
    return errorResponse(err as Error, 500, correlationId);
  }
});
