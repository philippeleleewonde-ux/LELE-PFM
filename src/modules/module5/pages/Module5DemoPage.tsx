import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, TrendingUp, BarChart3, Sparkles, Play, ClipboardList,
  Target, ArrowLeft, AlertTriangle, Loader2, Trash2, CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { RiskScoringDashboard } from '@/components/modules/RiskScoringDashboard';
import { RiskTrendsDashboard } from '@/components/modules/RiskTrendsDashboard';
import { RiskInsightsAIDashboard } from '@/components/modules/RiskInsightsAIDashboard';
import { CampaignTimeline } from '@/components/modules/CampaignTimeline';
import { useRpsCampaigns } from '@/hooks/useRpsCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { RPSDemoDataGenerator } from '@/modules/module5/services/DemoDataGenerator';
import { RiskScoringEngine } from '@/modules/module5/engine/RiskScoringEngine';
import { RiskScoringSnapshotService } from '@/modules/module5/services/RiskScoringSnapshotService';
import PsychosocialSurvey from '@/pages/modules/PsychosocialSurvey';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// MODULE 5 — DEMO PAGE
// Creates 3 demo campaigns with dates + scoring snapshots for full trends demo
// ============================================================================

const DEMO_CAMPAIGNS = [
  {
    label: 'S1 2025',
    title: '[DEMO] Enquête RPS S1 2025',
    start_date: '2025-01-15',
    end_date: '2025-03-15',
    mean: 2.8,
    stdDev: 1.0,
    participationRate: 0.85,
  },
  {
    label: 'S2 2025',
    title: '[DEMO] Enquête RPS S2 2025',
    start_date: '2025-06-01',
    end_date: '2025-07-31',
    mean: 2.3,
    stdDev: 0.9,
    participationRate: 0.92,
  },
  {
    label: 'S1 2026',
    title: '[DEMO] Enquête RPS S1 2026',
    start_date: '2026-01-15',
    end_date: '2026-02-28',
    mean: 2.5,
    stdDev: 1.1,
    participationRate: 0.78,
  },
];

export default function Module5DemoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [demoSurveyIds, setDemoSurveyIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [activeTab, setActiveTab] = useState('surveys');
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedScoringCampaignId, setSelectedScoringCampaignId] = useState<string | null>(null);
  const { campaigns, refetch: refetchCampaigns } = useRpsCampaigns(false);

  // Check for existing demo surveys
  useEffect(() => {
    async function fetchDemoSurveys() {
      const { data } = await (supabase
        .from('rps_surveys' as any)
        .select('id')
        .like('title', '[DEMO]%')
        .order('created_at', { ascending: false }) as any);
      if (data && data.length > 0) {
        setDemoSurveyIds(data.map((s: any) => s.id));
        setCampaignCount(data.length);
        let totalResponses = 0;
        for (const s of data) {
          const { count } = await (supabase
            .from('rps_survey_responses' as any)
            .select('id', { count: 'exact', head: true })
            .eq('survey_id', s.id) as any);
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
          description: 'Veuillez d\'abord configurer vos lignes d\'activité dans le Module 3.',
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

      // 2. Delete existing demo data
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
        const { data: newSurvey, error: surveyError } = await (supabase
          .from('rps_surveys' as any)
          .insert({
            title: campaign.title,
            company_id: companyId,
            created_by: user.user?.id,
            status: 'active',
            start_date: campaign.start_date,
            end_date: campaign.end_date,
          } as any)
          .select('id')
          .single() as any);

        if (surveyError) throw new Error(surveyError.message);
        const surveyId = newSurvey!.id;
        newIds.push(surveyId);

        // Generate responses with campaign-specific distribution
        const demoResponses = RPSDemoDataGenerator.generate(blMapped, {
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
          const { error: insertError } = await (supabase
            .from('rps_survey_responses' as any)
            .insert(batch as any) as any);
          if (insertError) throw new Error(insertError.message);
        }

        totalResponses += demoResponses.length;

        // Compute scoring and save snapshot
        const scoringResult = RiskScoringEngine.compute(demoResponses, blMapped);
        await RiskScoringSnapshotService.save(surveyId, companyId, scoringResult, demoResponses);
      }

      // 5. Update state
      setDemoSurveyIds(newIds);
      setCampaignCount(newIds.length);
      setGeneratedCount(totalResponses);
      setSelectedScoringCampaignId(newIds[newIds.length - 1]);
      setActiveTab('trends');
      refetchCampaigns();

      toast({
        title: '3 campagnes DEMO RPS générées',
        description: `${totalResponses} réponses créées sur ${DEMO_CAMPAIGNS.length} campagnes (S1 2025, S2 2025, S1 2026).`,
      });
    } catch (err) {
      console.error('RPS Demo generation error:', err);
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la génération',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  /** Deletes ALL demo RPS surveys, responses, and snapshots (via CASCADE) */
  const deleteAllDemoData = async () => {
    const { data: demoSurveys } = await (supabase
      .from('rps_surveys' as any)
      .select('id')
      .like('title', '[DEMO]%') as any);

    if (!demoSurveys || demoSurveys.length === 0) return;

    for (const s of demoSurveys) {
      await (supabase
        .from('rps_survey_responses' as any)
        .delete()
        .eq('survey_id', s.id) as any);

      await (supabase
        .from('rps_surveys' as any)
        .delete()
        .eq('id', s.id) as any);
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
      refetchCampaigns();

      toast({
        title: 'Données supprimées',
        description: 'Toutes les campagnes RPS de démonstration ont été supprimées.',
      });
    } catch (err) {
      console.error('RPS Demo delete error:', err);
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const latestDemoId = demoSurveyIds.length > 0 ? demoSurveyIds[0] : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <CEOSidebar />
      <main className="flex-1 overflow-y-auto relative">
        {showSurvey ? (
          <PsychosocialSurvey onBack={() => setShowSurvey(false)} bypassAccessKey />
        ) : (
          <>
            {/* Top Bar */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                  <SidebarToggle />
                  <h2 className="hidden sm:block text-lg font-bold text-foreground">
                    Risques Psychosociaux
                  </h2>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div className="container mx-auto p-6 space-y-6">
              {/* DEMO Banner */}
              <div className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4 flex items-center gap-4 shadow-lg">
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
                    onClick={() => navigate('/modules/psychosocial-risks')}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="p-4 rounded-lg bg-violet-500/10">
                    <BrainCircuit className="h-8 w-8 text-violet-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Risques Psychosociaux — DEMO</h1>
                    <p className="text-muted-foreground">Évaluation et prévention des risques psychosociaux</p>
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
                    <div className="text-2xl font-bold text-violet-500">{campaignCount}</div>
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
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/5 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-start gap-5 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/20 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-7 h-7 text-[#7c3aed]" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                              Enquête Risques Psychosociaux
                            </h3>
                            <p className="text-slate-400 text-sm">
                              21 questions • 6 axes psychosociaux • Durée estimée : 3–5 minutes
                            </p>
                          </div>
                        </div>

                        <p className="text-slate-300 mb-4 max-w-2xl">
                          Évaluez les risques psychosociaux à travers 6 dimensions clés :
                          exigences du travail, exigences émotionnelles, autonomie,
                          rapports sociaux, conflits de valeurs et insécurité.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-8">
                          {[
                            { label: 'Exigences travail', count: 4 },
                            { label: 'Exigences émotionnelles', count: 2 },
                            { label: 'Autonomie', count: 4 },
                            { label: 'Rapports sociaux', count: 5 },
                            { label: 'Conflits valeurs', count: 1 },
                            { label: 'Insécurité', count: 2 },
                          ].map((axis) => (
                            <span
                              key={axis.label}
                              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-slate-300 border border-white/10"
                            >
                              {axis.label} ({axis.count}q)
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <Button
                            onClick={() => setShowSurvey(true)}
                            className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#7c3aed]/30 transition-all hover:translate-x-0.5"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Commencer l'enquête
                          </Button>

                          <Button
                            onClick={handleGenerateDemo}
                            disabled={generating}
                            className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#7c3aed]/30 transition-all hover:translate-x-0.5"
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
                  <RiskTrendsDashboard />
                </TabsContent>

                {/* ---- ONGLET INSIGHTS IA ---- */}
                <TabsContent value="ai-insights" className="space-y-6">
                  <RiskInsightsAIDashboard surveyId={latestDemoId} />
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
                    <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg px-4 py-2 text-sm text-violet-700 dark:text-violet-300">
                      <span>
                        Résultats affichés pour la campagne :{' '}
                        <strong>
                          {campaigns.find(c => c.id === selectedScoringCampaignId)?.title?.replace('[DEMO] ', '') || 'Sélectionnée'}
                        </strong>
                      </span>
                      <button
                        onClick={() => setSelectedScoringCampaignId(null)}
                        className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                      >
                        Voir la dernière campagne
                      </button>
                    </div>
                  )}

                  <RiskScoringDashboard surveyId={selectedScoringCampaignId || latestDemoId} />
                </TabsContent>
              </Tabs>

              {/* Delete button */}
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
