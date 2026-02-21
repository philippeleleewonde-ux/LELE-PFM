import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, TrendingUp, BarChart3, Sparkles, Play, ClipboardList, Target, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskScoringDashboard } from '@/components/modules/RiskScoringDashboard';
import { RiskTrendsDashboard } from '@/components/modules/RiskTrendsDashboard';
import { RiskInsightsAIDashboard } from '@/components/modules/RiskInsightsAIDashboard';
import { CampaignTimeline } from '@/components/modules/CampaignTimeline';
import { useRpsCampaigns } from '@/hooks/useRpsCampaigns';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import PsychosocialSurvey from './PsychosocialSurvey';
import { supabase } from '@/integrations/supabase/client';

export default function Module5Dashboard() {
  const navigate = useNavigate();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [selectedScoringCampaignId, setSelectedScoringCampaignId] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [totalWorkforce, setTotalWorkforce] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [activeSurveyCount, setActiveSurveyCount] = useState(0);
  const { campaigns } = useRpsCampaigns();

  // Auto-select the most recent non-demo survey + fetch dynamic stats
  useEffect(() => {
    async function fetchData() {
      // Fetch latest non-demo RPS survey
      const { data: survey } = await (supabase
        .from('rps_surveys' as any)
        .select('id')
        .not('title', 'like', '[DEMO]%')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any);

      if (survey) {
        setSelectedSurveyId(survey.id);
        const { count } = await (supabase
          .from('rps_survey_responses' as any)
          .select('id', { count: 'exact', head: true })
          .eq('survey_id', survey.id) as any);
        setResponseCount(count || 0);
      }

      // Fetch total workforce from business_lines
      const { data: businessLines } = await supabase
        .from('business_lines')
        .select('staff_count')
        .eq('is_active', true);
      if (businessLines) {
        setTotalWorkforce(businessLines.reduce((sum, bl) => sum + (bl.staff_count || 0), 0));
      }

      // Count active RPS surveys (non-demo)
      const { count: surveyCount } = await (supabase
        .from('rps_surveys' as any)
        .select('id', { count: 'exact', head: true })
        .not('title', 'like', '[DEMO]%')
        .eq('status', 'active') as any);
      setActiveSurveyCount(surveyCount || 0);
    }
    fetchData();
  }, []);

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
                    <h1 className="text-3xl font-bold">Risques Psychosociaux</h1>
                    <p className="text-muted-foreground">Évaluation et prévention des risques psychosociaux</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowSurvey(true)}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Lancer le questionnaire
                </Button>
              </div>

              {/* Quick Stats — Dynamic */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Score Global RPS</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">—</div>
                    <p className="text-xs text-muted-foreground">score moyen du Moteur de Scoring</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taux de Participation</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalWorkforce > 0
                        ? `${Math.round((responseCount / totalWorkforce) * 100)}%`
                        : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {responseCount} réponses sur {totalWorkforce} effectifs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Questionnaires Actifs</CardTitle>
                    <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeSurveyCount}</div>
                    <p className="text-xs text-muted-foreground">en cours</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="surveys" className="space-y-6">
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

                        <div className="flex items-center gap-4">
                          <Button
                            onClick={() => setShowSurvey(true)}
                            className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#7c3aed]/30 transition-all hover:translate-x-0.5"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Démarrer le questionnaire
                          </Button>
                          <span className="text-slate-500 text-xs">100% anonyme & confidentiel</span>
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
                  <RiskInsightsAIDashboard surveyId={selectedSurveyId} />
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
                          {campaigns.find(c => c.id === selectedScoringCampaignId)?.title || 'Sélectionnée'}
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

                  <RiskScoringDashboard surveyId={selectedScoringCampaignId || selectedSurveyId} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
