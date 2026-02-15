import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, BarChart3, Sparkles, Play, ClipboardList,
  Target, ArrowLeft, AlertTriangle, Loader2, Trash2, CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { SatisfactionAIAnalysis } from '@/components/modules/SatisfactionAIAnalysis';
import { InsightsAIDashboard } from '@/components/modules/InsightsAIDashboard';
import { ScoringDashboard } from '@/components/modules/ScoringDashboard';
import { TrendsDashboard } from '@/components/modules/TrendsDashboard';
import { MODULE_CONFIGS } from '@/types/modules';
import { supabase } from '@/integrations/supabase/client';
import { CampaignTimeline } from '@/components/modules/CampaignTimeline';
import { useCampaigns } from '@/hooks/useCampaigns';
import { DemoDataGenerator } from '@/modules/module2/services/DemoDataGenerator';
import { ScoringEngine } from '@/modules/module2/engine/ScoringEngine';
import { ScoringSnapshotService } from '@/modules/module2/services/ScoringSnapshotService';
import SatisfactionSurvey from '@/pages/modules/SatisfactionSurvey';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// MODULE 2 — DEMO PAGE
// Creates 3 demo campaigns with dates + scoring snapshots for full trends demo
// ============================================================================

// 3 demo campaigns with different score distributions
const DEMO_CAMPAIGNS = [
  {
    label: 'S1 2025',
    title: '[DEMO] Enquête Satisfaction S1 2025',
    start_date: '2025-01-15',
    end_date: '2025-03-15',
    mean: 2.8,   // Moderately satisfied
    stdDev: 1.0,
    participationRate: 0.85,
  },
  {
    label: 'S2 2025',
    title: '[DEMO] Enquête Satisfaction S2 2025',
    start_date: '2025-06-01',
    end_date: '2025-07-31',
    mean: 2.3,   // Improved (lower = better on 1-5 scale)
    stdDev: 0.9,
    participationRate: 0.92,
  },
  {
    label: 'S1 2026',
    title: '[DEMO] Enquête Satisfaction S1 2026',
    start_date: '2026-01-15',
    end_date: '2026-02-28',
    mean: 2.5,   // Slight regression on some themes
    stdDev: 1.1,
    participationRate: 0.78,
  },
];

export default function Module2DemoPage() {
  const navigate = useNavigate();
  const module = MODULE_CONFIGS[2];
  const { toast } = useToast();

  const [demoSurveyIds, setDemoSurveyIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [activeTab, setActiveTab] = useState('surveys');
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedScoringCampaignId, setSelectedScoringCampaignId] = useState<string | null>(null);
  const { campaigns, refetch: refetchCampaigns } = useCampaigns(false);

  // Check for existing demo surveys
  useEffect(() => {
    async function fetchDemoSurveys() {
      const { data } = await supabase
        .from('surveys')
        .select('id')
        .like('title', '[DEMO]%')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setDemoSurveyIds(data.map(s => s.id));
        setCampaignCount(data.length);
        // Count total responses across all demo surveys
        let totalResponses = 0;
        for (const s of data) {
          const { count } = await supabase
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
            .eq('survey_id', s.id);
          totalResponses += (count || 0);
        }
        setGeneratedCount(totalResponses);
      }
    }
    fetchDemoSurveys();
  }, []);

  const handleGenerateDemo = async () => {
    setGenerating(true);
    try {
      // 1. Fetch active business lines
      const { data: businessLines, error: blError } = await supabase
        .from('business_lines')
        .select('activity_name, staff_count')
        .eq('is_active', true);

      if (blError) throw new Error(blError.message);
      if (!businessLines || businessLines.length === 0) {
        toast({
          title: 'Aucune ligne d\'activité',
          description: 'Veuillez d\'abord configurer vos lignes d\'activité dans le Module 3 (HCM Cost Savings).',
          variant: 'destructive',
        });
        setGenerating(false);
        return;
      }

      const totalStaff = businessLines.reduce((sum, bl) => sum + (bl.staff_count || 0), 0);
      if (totalStaff === 0) {
        toast({
          title: 'Effectifs à zéro',
          description: 'Les lignes d\'activité n\'ont pas d\'effectifs renseignés.',
          variant: 'destructive',
        });
        setGenerating(false);
        return;
      }

      // 2. Delete any existing demo data first
      await deleteAllDemoData();

      // 3. Get user + company
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.user?.id || '')
        .single();

      const companyId = profile?.company_id || '';
      const blMapped = businessLines.map(bl => ({
        activity_name: bl.activity_name,
        staff_count: bl.staff_count || 0,
      }));

      // 4. Create 3 campaigns sequentially
      const newIds: string[] = [];
      let totalResponses = 0;

      for (const campaign of DEMO_CAMPAIGNS) {
        // Create survey with dates
        const accessCode = `DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}`;
        const { data: newSurvey, error: surveyError } = await supabase
          .from('surveys')
          .insert({
            title: campaign.title,
            description: `Données de démonstration — ${campaign.label}`,
            access_code: accessCode,
            company_id: companyId,
            created_by: user.user?.id,
            is_active: true,
            is_anonymous: true,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
          })
          .select('id')
          .single();

        if (surveyError) throw new Error(surveyError.message);
        const surveyId = newSurvey!.id;
        newIds.push(surveyId);

        // Generate responses with campaign-specific distribution
        const demoResponses = DemoDataGenerator.generate(blMapped, {
          mean: campaign.mean,
          stdDev: campaign.stdDev,
          participationRate: campaign.participationRate,
        });

        // Insert responses in batches
        const batchSize = 100;
        for (let i = 0; i < demoResponses.length; i += batchSize) {
          const batch = demoResponses.slice(i, i + batchSize).map(r => ({
            survey_id: surveyId,
            responses: r.responses as unknown as Record<string, unknown>,
          }));
          const { error: insertError } = await supabase
            .from('survey_responses')
            .insert(batch);
          if (insertError) throw new Error(insertError.message);
        }

        totalResponses += demoResponses.length;

        // Compute scoring and save snapshot
        const scoringResult = ScoringEngine.compute(demoResponses, blMapped);
        await ScoringSnapshotService.save(
          surveyId,
          companyId,
          scoringResult,
          demoResponses,
        );
      }

      // 5. Update state
      setDemoSurveyIds(newIds);
      setCampaignCount(newIds.length);
      setGeneratedCount(totalResponses);
      setSelectedScoringCampaignId(newIds[newIds.length - 1]); // Select latest
      setActiveTab('trends');
      refetchCampaigns();

      toast({
        title: '3 campagnes DEMO générées',
        description: `${totalResponses} réponses créées sur ${DEMO_CAMPAIGNS.length} campagnes (S1 2025, S2 2025, S1 2026).`,
      });
    } catch (err) {
      console.error('Demo generation error:', err);
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la génération',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  /** Deletes ALL demo surveys, responses, and snapshots (via CASCADE) */
  const deleteAllDemoData = async () => {
    // Fetch all demo survey IDs for this company
    const { data: demoSurveys } = await supabase
      .from('surveys')
      .select('id')
      .like('title', '[DEMO]%');

    if (!demoSurveys || demoSurveys.length === 0) return;

    for (const s of demoSurveys) {
      // Delete responses first (explicit, even though CASCADE would handle it)
      await supabase
        .from('survey_responses')
        .delete()
        .eq('survey_id', s.id);

      // Delete the survey — cascades to survey_scoring_snapshots + survey_access_keys
      await supabase
        .from('surveys')
        .delete()
        .eq('id', s.id);
    }
  };

  const handleDeleteDemo = async () => {
    setDeleting(true);
    try {
      await deleteAllDemoData();

      setDemoSurveyIds([]);
      setCampaignCount(0);
      setGeneratedCount(0);
      setActiveTab('surveys');

      toast({
        title: 'Données supprimées',
        description: 'Toutes les campagnes de démonstration ont été supprimées (surveys, réponses, snapshots). Vous pouvez relancer une démonstration.',
      });
    } catch (err) {
      console.error('Demo delete error:', err);
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Latest demo survey ID (for AI insights + Scoring)
  const latestDemoId = demoSurveyIds.length > 0 ? demoSurveyIds[0] : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <CEOSidebar />
      <main className="flex-1 overflow-y-auto relative">
        {showSurvey ? (
          <SatisfactionSurvey onBack={() => setShowSurvey(false)} />
        ) : (
          <>
            {/* Top Bar */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                  <SidebarToggle />
                  <h2 className="hidden sm:block text-lg font-bold text-foreground">
                    {module.name}
                  </h2>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div className="container mx-auto p-6 space-y-6">
              {/* DEMO Banner */}
              <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-4 shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm uppercase tracking-wider">
                    Mode Démonstration
                  </p>
                  <p className="text-white/80 text-sm">
                    Les données affichées sont générées aléatoirement à partir de vos effectifs réels.
                    3 campagnes simulées (S1 2025, S2 2025, S1 2026) avec des distributions de scores différentes.
                  </p>
                </div>
              </div>

              {/* Header + Back */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/modules/module2')}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: module.accentColor }}
                  >
                    <Users className="h-8 w-8" style={{ color: module.color }} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{module.name} — DEMO</h1>
                    <p className="text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Campagnes DEMO</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{campaignCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {campaignCount > 0 ? 'S1 2025, S2 2025, S1 2026' : 'Aucune campagne'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Réponses Générées</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{generatedCount}</div>
                    <p className="text-xs text-muted-foreground">réponses sur {campaignCount} campagnes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tendances</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaignCount >= 2 ? 'Actives' : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {campaignCount >= 2 ? `${campaignCount} snapshots, deltas calculés` : 'Lancez la démo'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="surveys">Questionnaires</TabsTrigger>
                  <TabsTrigger value="trends">Tendances</TabsTrigger>
                  <TabsTrigger value="ai-insights">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Insights IA
                  </TabsTrigger>
                  <TabsTrigger value="scoring">
                    <Target className="w-4 h-4 mr-2" />
                    Moteur de Scoring
                  </TabsTrigger>
                </TabsList>

                {/* ---- ONGLET QUESTIONNAIRES ---- */}
                <TabsContent value="surveys" className="space-y-6">
                  <Card className="overflow-hidden border-0 shadow-xl">
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4530]/5 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-start gap-5 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-[#FF4530]/20 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-7 h-7 text-[#FF4530]" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                              Enquête de Satisfaction des Employés
                            </h3>
                            <p className="text-slate-400 text-sm">
                              33 questions • 4 thèmes • Durée estimée : 5–8 minutes
                            </p>
                          </div>
                        </div>

                        <p className="text-slate-300 mb-4 max-w-2xl">
                          Évaluez la satisfaction de vos collaborateurs à travers 4 dimensions clés :
                          image de l'entreprise, conditions de travail, relations professionnelles
                          et perspectives d'avenir.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-8">
                          {[
                            { label: 'Votre Entreprise', count: 8 },
                            { label: 'Votre Travail', count: 10 },
                            { label: 'Vos Relations', count: 7 },
                            { label: 'Votre Avenir', count: 5 },
                          ].map((theme) => (
                            <span
                              key={theme.label}
                              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-slate-300 border border-white/10"
                            >
                              {theme.label} ({theme.count}q)
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <Button
                            onClick={() => setShowSurvey(true)}
                            className="bg-[#FF4530] hover:bg-[#ff5745] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#FF4530]/30 transition-all hover:translate-x-0.5"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Commencer l'enquête
                          </Button>

                          <Button
                            onClick={handleGenerateDemo}
                            disabled={generating}
                            className="bg-[#FF4530] hover:bg-[#ff5745] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#FF4530]/30 transition-all hover:translate-x-0.5"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Génération 3 campagnes...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Lancer la démonstration
                              </>
                            )}
                          </Button>
                          <span className="text-slate-500 text-xs">
                            Génère 3 campagnes avec des scores différents + timeline
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* ---- ONGLET TENDANCES ---- */}
                <TabsContent value="trends" className="space-y-6">
                  <TrendsDashboard />
                </TabsContent>

                {/* ---- ONGLET INSIGHTS IA ---- */}
                <TabsContent value="ai-insights" className="space-y-6">
                  <InsightsAIDashboard surveyId={latestDemoId} />

                  {/* Analyse IA Premium (Gemini) */}
                  {latestDemoId && (
                    <SatisfactionAIAnalysis surveyId={latestDemoId} />
                  )}
                </TabsContent>

                {/* ---- ONGLET MOTEUR DE SCORING ---- */}
                <TabsContent value="scoring" className="space-y-6">
                  {/* Campaign timeline — select period */}
                  {campaigns.length > 0 && (
                    <CampaignTimeline
                      campaigns={campaigns}
                      selectedCampaignId={selectedScoringCampaignId}
                      onSelectCampaign={(id) =>
                        setSelectedScoringCampaignId(prev => prev === id ? null : id)
                      }
                    />
                  )}

                  {/* Info bar when a specific campaign is selected */}
                  {selectedScoringCampaignId && (
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 text-sm text-blue-700 dark:text-blue-300">
                      <span>
                        Résultats affichés pour la campagne :{' '}
                        <strong>
                          {campaigns.find(c => c.id === selectedScoringCampaignId)?.title?.replace('[DEMO] ', '') || 'Sélectionnée'}
                        </strong>
                      </span>
                      <button
                        onClick={() => setSelectedScoringCampaignId(null)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Voir la dernière campagne
                      </button>
                    </div>
                  )}

                  <ScoringDashboard surveyId={selectedScoringCampaignId || latestDemoId} />
                </TabsContent>
              </Tabs>

              {/* Bouton supprimer toutes les données démo — visible en bas de page */}
              {generatedCount > 0 && (
                <div className="flex justify-center pt-4 pb-8">
                  <Button
                    onClick={handleDeleteDemo}
                    disabled={deleting}
                    variant="outline"
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 px-8 py-3 rounded-full font-medium"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Suppression en cours...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer toutes les données démo ({campaignCount} campagnes)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
