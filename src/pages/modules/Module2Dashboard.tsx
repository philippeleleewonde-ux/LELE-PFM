import { ModuleAccess } from '@/components/ModuleAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, TrendingUp, BarChart3, Sparkles } from 'lucide-react';
import { MODULE_CONFIGS } from '@/types/modules';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SatisfactionAIAnalysis } from '@/components/modules/SatisfactionAIAnalysis';

import { useState } from 'react';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';

export default function Module2Dashboard() {
  const module = MODULE_CONFIGS[2];
  const { canAdmin } = useModuleAccess(2);
  const [selectedSurveyId] = useState<string | null>(null);

  return (
    <ModuleAccess moduleNumber={2} requiredPermissions={['read']}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <CEOSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
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
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                <Button style={{ backgroundColor: module.color }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau questionnaire
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction Globale</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7.8/10</div>
                  <p className="text-xs text-muted-foreground">+0.5 vs dernier sondage</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Participation</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">142 réponses sur 167</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Questionnaires Actifs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">en cours</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs avec IA */}
            <Tabs defaultValue="surveys" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="surveys">Questionnaires</TabsTrigger>
                <TabsTrigger value="trends">Tendances</TabsTrigger>
                <TabsTrigger value="ai-insights">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Insights IA
                </TabsTrigger>
              </TabsList>

              <TabsContent value="surveys" className="space-y-6">
                <div className="text-center py-10 text-muted-foreground">
                  <p>Module en cours de refonte.</p>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analyses & Tendances</CardTitle>
                    <CardDescription>Évolution de la satisfaction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { category: 'Ambiance de travail', score: 8.2, trend: '+0.8' },
                        { category: 'Équilibre vie pro/perso', score: 7.5, trend: '+0.3' },
                        { category: 'Management', score: 7.8, trend: '+0.6' },
                        { category: 'Reconnaissance', score: 6.9, trend: '-0.2' }
                      ].map((item) => (
                        <div key={item.category} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                          <span className="font-medium">{item.category}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {item.trend}
                            </span>
                            <span className="font-bold text-lg">{item.score}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-insights" className="space-y-6">
                {selectedSurveyId ? (
                  <SatisfactionAIAnalysis surveyId={selectedSurveyId} />
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Sélectionnez un questionnaire pour voir l'analyse IA</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ModuleAccess>
  );
}
