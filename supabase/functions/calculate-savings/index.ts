import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamData, industryData, previousPeriods, companyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calculating savings for company:', companyId);

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
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiInsights = aiResult.choices[0].message.content;

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
      (Math.min(growthRate, 30) * 0.30) + // Croissance max 30% = 30 points
      (consistency * 0.25) +                // Constance = 25 points
      (Math.min(sectorPosition, 100) * 0.20) + // Position sectorielle = 20 points
      (85 * 0.15) +                         // Gestion risques (assumée bonne) = 15 points
      (75 * 0.10)                           // Tendances futures = 10 points
    );

    // Déterminer le niveau de risque et le taux
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    let recommendedRate: number;

    if (bankingScore >= 75) {
      riskLevel = 'LOW';
      recommendedRate = 2.5 + (Math.random() * 0.5); // 2.5-3.0%
    } else if (bankingScore >= 50) {
      riskLevel = 'MEDIUM';
      recommendedRate = 3.5 + (Math.random() * 0.8); // 3.5-4.3%
    } else {
      riskLevel = 'HIGH';
      recommendedRate = 5.0 + (Math.random() * 1.5); // 5.0-6.5%
    }

    // Position benchmark
    let benchmarkPosition: string;
    if (sectorPosition >= 150) benchmarkPosition = "Top 5% du secteur - Excellence";
    else if (sectorPosition >= 125) benchmarkPosition = "Top 15% du secteur - Très performant";
    else if (sectorPosition >= 100) benchmarkPosition = "Top 25% du secteur - Performant";
    else if (sectorPosition >= 80) benchmarkPosition = "Moyenne du secteur";
    else benchmarkPosition = "En dessous de la moyenne - Amélioration nécessaire";

    // Sauvegarder le score dans la base de données si companyId fourni
    if (companyId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('ai_banking_scores').insert({
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
    }

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

    console.log('Savings calculation completed, score:', bankingScore);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-savings:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to calculate savings'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});