import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { AIInsightCard } from '@/components/AIInsightCard';
import { AIUpgradePrompt } from '@/components/AIUpgradePrompt';
import { useAILimits } from '@/hooks/useAILimits';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface AIPredictionsProps {
  companyId: string;
}

export function AIPredictions({ companyId }: AIPredictionsProps) {
  const { limits, canMakeCall, creditsRemaining, trackCall } = useAILimits();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch company data and indicators
  const { data: companyData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: indicators } = useQuery({
    queryKey: ['performance-indicators', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_indicators')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: prediction, isLoading, refetch } = useQuery({
    queryKey: ['ai-predictions', companyId],
    queryFn: async () => {
      if (!limits.predictiveAi) return null;

      const { data, error } = await supabase.functions.invoke('analyze-performance-secure', {
        body: {
          indicators: indicators || [],
          companyData: companyData || {},
          industryBenchmarks: {
            averageSavings: 250000,
            topPerformers: 500000
          }
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: false, // Manual trigger
  });

  const handleAnalyze = async () => {
    if (!canMakeCall) {
      toast({
        title: 'Crédits insuffisants',
        description: creditsRemaining === 0
          ? 'Crédits IA épuisés pour ce mois.'
          : "Les prédictions IA nécessitent un plan Silver ou supérieur.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      await refetch();
      await trackCall();
      toast({
        title: "Analyse terminée",
        description: "Les prédictions IA ont été générées avec succès.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de générer les prédictions.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!limits.predictiveAi) {
    return (
      <AIUpgradePrompt
        feature="Prédictions IA sur 3 ans"
        description="Obtenez des prédictions précises d'économies basées sur l'intelligence artificielle et l'analyse de vos performances actuelles."
        requiredPlan="silver"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Prédictions IA - 3 ans
              </CardTitle>
              <CardDescription>
                Analyses prédictives basées sur vos performances actuelles
              </CardDescription>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isLoading || !canMakeCall}
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
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {prediction && (
            <div className="space-y-6">
              {/* Prédictions par année */}
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map(year => {
                  const yearData = prediction.predictions[`year${year}`];
                  return (
                    <Card key={year} className="bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                      <CardHeader>
                        <CardTitle className="text-lg">Année {year}</CardTitle>
                        <CardDescription>
                          Confiance: {yearData.confidence}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-primary">
                            {yearData.savings.toLocaleString('fr-FR')} €
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {Object.entries(yearData.breakdown).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key}:</span>
                                <span className="font-medium">{(value as number).toLocaleString('fr-FR')} €</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Actions critiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    Actions Prioritaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {prediction.criticalActions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Insights IA */}
              <AIInsightCard
                title="Analyse IA Détaillée"
                description={prediction.benchmarkPosition}
                insights={prediction.aiInsights}
                type="info"
                confidence={prediction.predictions.year1.confidence}
              />

              {/* Facteurs de risque */}
              {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-5 h-5" />
                      Facteurs de Risque
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {prediction.riskFactors.map((risk: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!prediction && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cliquez sur "Analyser" pour générer des prédictions IA</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
