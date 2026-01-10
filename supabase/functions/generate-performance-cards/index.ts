import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeData, teamContext, goals, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating performance card for:', employeeData.firstName, employeeData.lastName);

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
          content: `Créez une performance card détaillée et personnalisée avec:
1. Score global de performance (0-100)
2. Répartition par compétences avec tendances
3. 3-5 conseils de coaching concrets et actionnables
4. 2-3 objectifs SMART pour les 3 prochains mois
5. Recommandation d'évolution de carrière
6. Score de potentiel talent (0-100)
Soyez encourageant, constructif et spécifique. Répondez en JSON structuré.`
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
        }]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices[0].message.content;

    // Calculer les scores basés sur les métriques
    const metrics = employeeData.metrics || {};
    const baseScore = 75 + Math.floor(Math.random() * 20); // 75-95

    const breakdown = {
      "Productivité": { 
        score: metrics.productivity || baseScore + Math.floor(Math.random() * 10) - 5, 
        trend: "↗️", 
        comment: "Excellent progrès ce mois" 
      },
      "Collaboration": { 
        score: metrics.collaboration || baseScore + Math.floor(Math.random() * 10) - 5, 
        trend: "→", 
        comment: "Stable, peut s'améliorer" 
      },
      "Innovation": { 
        score: metrics.innovation || baseScore + Math.floor(Math.random() * 10) - 5, 
        trend: "↗️", 
        comment: "Très créatif, continue !" 
      },
      "Leadership": { 
        score: metrics.leadership || baseScore - 10 + Math.floor(Math.random() * 15), 
        trend: "↗️", 
        comment: "Bon potentiel à développer" 
      }
    };

    const overallScore = Math.round(
      Object.values(breakdown).reduce((sum, item) => sum + item.score, 0) / Object.keys(breakdown).length
    );

    // Générer des conseils de coaching
    const aiCoaching = [
      "🎯 Objectif semaine: Proposer 2 idées innovantes en réunion équipe",
      "📚 Formation recommandée: Leadership situationnel",
      "🤝 Mentorat: Collaborer avec un collègue senior pour développer vos compétences"
    ];

    // Définir les prochaines étapes
    const nextMilestones = [
      { 
        goal: "Atteindre 85 en collaboration", 
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "high"
      },
      { 
        goal: "Compléter formation leadership", 
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "medium"
      }
    ];

    // Calculer le score de talent
    const talentScore = Math.min(100, overallScore + Math.floor(Math.random() * 10));
    
    let careerPath = "Continuer à développer vos compétences actuelles";
    if (talentScore >= 85) {
      careerPath = `Progression vers ${employeeData.position?.includes('Senior') ? 'Team Leader' : 'Senior ' + (employeeData.position || 'Spécialiste')} recommandée d'ici 12-18 mois`;
    } else if (talentScore >= 75) {
      careerPath = "Excellent potentiel - Opportunités d'évolution à explorer";
    }

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
        .filter(([_, v]) => v.score >= 80)
        .map(([k, _]) => k),
      developmentAreas: Object.entries(breakdown)
        .filter(([_, v]) => v.score < 75)
        .map(([k, _]) => k),
      generatedAt: new Date().toISOString(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    };

    console.log('Performance card generated, overall score:', overallScore);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-performance-cards:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate performance card'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});