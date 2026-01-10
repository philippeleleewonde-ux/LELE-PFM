import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AIInsightCard } from '@/components/AIInsightCard';
import { AIUpgradePrompt } from '@/components/AIUpgradePrompt';
import { useAILimits } from '@/hooks/useAILimits';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface SatisfactionAIAnalysisProps {
  surveyId: string;
}

// ✅ Types pour l'analyse IA
interface AIIssue {
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
}

interface AIAction {
  title: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  timeline: string;
  expectedImpact: string;
}

interface AIAnalysisResult {
  criticalIssues: AIIssue[];
  actionPlan: AIAction[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  satisfactionScore: number;
  insights: string[];
}

export function SatisfactionAIAnalysis({ surveyId }: SatisfactionAIAnalysisProps) {
  const { limits } = useAILimits();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: survey } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: responses } = useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId);

      if (error) throw error;
      return data;
    },
  });

  const { data: analysis, isLoading, refetch } = useQuery<AIAnalysisResult | null>({
    queryKey: ['ai-satisfaction-analysis', surveyId],
    queryFn: async () => {
      if (!limits.aiEnabled) return null;

      const { data, error } = await supabase.functions.invoke<AIAnalysisResult>('analyze-satisfaction', {
        body: {
          responses: responses || [],
          previousSurveys: [],
          employeeProfiles: [],
          surveyTitle: survey?.title || 'Enquête de satisfaction'
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleAnalyze = async () => {
    if (!limits.aiEnabled) {
      toast({
        title: "Fonctionnalité Premium",
        description: "L'analyse IA nécessite un plan Silver ou supérieur.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      await refetch();
      toast({
        title: "Analyse terminée",
        description: "L'analyse IA de satisfaction a été générée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer l'analyse.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!limits.aiEnabled) {
    return (
      <AIUpgradePrompt
        feature="Analyse IA de Satisfaction"
        description="Obtenez des insights détaillés sur la satisfaction de vos employés avec l'analyse de sentiment IA et les prédictions de turnover."
        requiredPlan="silver"
      />
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-orange-500';
      case 'LOW': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Analyse IA de Satisfaction
              </CardTitle>
              <CardDescription>
                Insights automatiques sur {responses?.length || 0} réponses
              </CardDescription>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isLoading || !responses || responses.length === 0}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isAnalyzing ? 'Analyse en cours...' : 'Analyser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Score global et tendance */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Satisfaction Globale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-4">
                      <div className="text-5xl font-bold text-primary">
                        {analysis.overallSatisfaction}
                        <span className="text-2xl text-muted-foreground">/100</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {getTrendIcon(analysis.trendDirection)}
                        <span className="text-sm text-muted-foreground">
                          {analysis.trend}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Taux de Participation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-bold text-primary">
                      {analysis.participationRate}
                      <span className="text-2xl text-muted-foreground">%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {analysis.responseCount} réponses collectées
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Problèmes critiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Problèmes Identifiés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.criticalIssues.map((issue: AIIssue, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(issue.severity)}`} />
                          <div>
                            <p className="font-medium">{issue.issue}</p>
                            <p className="text-sm text-muted-foreground">
                              {issue.affected} employés concernés
                            </p>
                          </div>
                        </div>
                        <Badge variant={issue.severity === 'HIGH' ? 'destructive' : 'outline'}>
                          {issue.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risque de turnover */}
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Risque de Turnover
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Employés à risque élevé:</span>
                    <span className="text-2xl font-bold text-red-600">
                      {analysis.turnoverRisk.highRisk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Probabilité:</span>
                    <span className="font-medium text-red-600">
                      {analysis.turnoverRisk.probability}
                    </span>
                  </div>
                  {analysis.turnoverRisk.factors && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Facteurs de risque:</p>
                      <ul className="space-y-1">
                        {analysis.turnoverRisk.factors.map((factor: string, index: number) => (
                          <li key={index} className="text-sm">• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plan d'action */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Plan d'Action Recommandé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.actionPlan.map((action: AIAction, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{action.action}</h4>
                          <Badge variant="outline" className="ml-2">
                            Impact {action.impact}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Coût: {action.cost.toLocaleString('fr-FR')} €</span>
                          <span>Délai: {action.timeframe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommandations IA */}
              {analysis.aiRecommendations && (
                <AIInsightCard
                  title="Recommandations IA"
                  description="Analyse détaillée et suggestions personnalisées"
                  insights={analysis.aiRecommendations}
                  type="info"
                />
              )}
            </div>
          )}

          {!analysis && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cliquez sur "Analyser" pour générer une analyse IA complète</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
