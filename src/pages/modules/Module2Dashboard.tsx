import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, BarChart3, Sparkles, Play, ClipboardList, Target, ArrowLeft, CalendarPlus } from 'lucide-react';
import { MODULE_CONFIGS } from '@/types/modules';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SatisfactionAIAnalysis } from '@/components/modules/SatisfactionAIAnalysis';
import { InsightsAIDashboard } from '@/components/modules/InsightsAIDashboard';
import { ScoringDashboard } from '@/components/modules/ScoringDashboard';
import { TrendsDashboard } from '@/components/modules/TrendsDashboard';
import { CampaignCreateModal } from '@/components/modules/CampaignCreateModal';
import { CampaignTimeline } from '@/components/modules/CampaignTimeline';
import { useCampaigns } from '@/hooks/useCampaigns';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import SatisfactionSurvey from './SatisfactionSurvey';
import { supabase } from '@/integrations/supabase/client';

export default function Module2Dashboard() {
  const module = MODULE_CONFIGS[2];
  const { canAdmin } = useModuleAccess(2);
  const navigate = useNavigate();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [totalWorkforce, setTotalWorkforce] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [activeSurveyCount, setActiveSurveyCount] = useState(0);
  const [globalScore, setGlobalScore] = useState<string>('—');
  const [selectedScoringCampaignId, setSelectedScoringCampaignId] = useState<string | null>(null);
  const { campaigns, hasActiveCampaign, refetch: refetchCampaigns } = useCampaigns();

  // Auto-select the most recent non-demo survey + fetch dynamic stats
  useEffect(() => {
    async function fetchData() {
      // Fetch latest non-demo survey
      const { data: survey } = await supabase
        .from('surveys')
        .select('id')
        .not('title', 'like', '[DEMO]%')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (survey) {
        setSelectedSurveyId(survey.id);
        // Count responses for this survey
        const { count } = await supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('survey_id', survey.id);
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

      // Count active surveys (non-demo)
      const { count: surveyCount } = await supabase
        .from('surveys')
        .select('id', { count: 'exact', head: true })
        .not('title', 'like', '[DEMO]%')
        .eq('is_active', true);
      setActiveSurveyCount(surveyCount || 0);
    }
    fetchData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <CEOSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {showSurvey ? (
          /* ================================================================
             MODE QUESTIONNAIRE — Le survey prend tout le contenu principal
          ================================================================ */
          <SatisfactionSurvey onBack={() => setShowSurvey(false)} />
        ) : (
          /* ================================================================
             MODE DASHBOARD — Header + Stats + Tabs
          ================================================================ */
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
                    <h1 className="text-3xl font-bold">{module.name}</h1>
                    <p className="text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                {canAdmin && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowCampaignModal(true)}
                      style={{ backgroundColor: module.color }}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Nouvelle campagne
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSurvey(true)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Questionnaire
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Stats — Dynamic */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Satisfaction Globale</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{globalScore}</div>
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
                    <Users className="h-4 w-4 text-muted-foreground" />
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
                        {/* Subtle glow */}
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

                          <div className="flex items-center gap-4">
                            <Button
                              onClick={() => setShowSurvey(true)}
                              className="bg-[#FF4530] hover:bg-[#ff5745] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#FF4530]/30 transition-all hover:translate-x-0.5"
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
                    <TrendsDashboard />
                  </TabsContent>

                  {/* ---- ONGLET INSIGHTS IA ---- */}
                  <TabsContent value="ai-insights" className="space-y-6">
                    <InsightsAIDashboard surveyId={selectedSurveyId} />

                    {/* Analyse IA Premium (Gemini) */}
                    {selectedSurveyId && (
                      <SatisfactionAIAnalysis surveyId={selectedSurveyId} />
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
                            {campaigns.find(c => c.id === selectedScoringCampaignId)?.title || 'Sélectionnée'}
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

                    <ScoringDashboard surveyId={selectedScoringCampaignId || selectedSurveyId} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </main>

        {/* Campaign Create Modal */}
        <CampaignCreateModal
          open={showCampaignModal}
          onOpenChange={setShowCampaignModal}
          onCreated={(surveyId) => {
            setSelectedSurveyId(surveyId);
            refetchCampaigns();
          }}
          hasActiveCampaign={hasActiveCampaign}
        />
      </div>
  );
}
