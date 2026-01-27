import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, DollarSign } from 'lucide-react';
import { AIInsightCard } from '@/components/AIInsightCard';
import { AIUpgradePrompt } from '@/components/AIUpgradePrompt';
import { useAILimits } from '@/hooks/useAILimits';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface SavingsAICalculatorProps {
  companyId: string;
}

export function SavingsAICalculator({ companyId }: SavingsAICalculatorProps) {
  const { limits } = useAILimits();
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: teamData } = useQuery({
    queryKey: ['team-performance', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_performance')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data;
    },
  });

  const { data: calculation, refetch } = useQuery({
    queryKey: ['ai-savings-calculation', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-savings', {
        body: {
          teamData: teamData || [],
          industryData: { sector: 'Technology', benchmarks: { averageAnnual: 800000 } },
          previousPeriods: [],
          companyId
        }
      });
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleCalculate = async () => {
    if (!limits.bankingScore) {
      toast({
        title: "Fonctionnalité Premium",
        description: "Le calcul IA et score bancaire nécessitent le plan Gold.",
        variant: "destructive",
      });
      return;
    }
    setIsCalculating(true);
    try {
      await refetch();
      toast({ title: "Calcul terminé", description: "Score bancaire généré avec succès." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de calculer.", variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  if (!limits.bankingScore) {
    return <AIUpgradePrompt feature="Calculs IA & Score Bancaire" description="Score automatique pour obtenir les meilleurs taux" requiredPlan="gold" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Calculs IA d'Économies
            </CardTitle>
            <Button onClick={handleCalculate} disabled={isCalculating} className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Sparkles className="w-4 h-4 mr-2" />
              {isCalculating ? 'Calcul...' : 'Calculer'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calculation && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardHeader><CardTitle className="text-lg">Économies Annuelles</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{calculation.annualProjection.toLocaleString('fr-FR')} €</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  <CardHeader><CardTitle className="text-lg">Score Bancaire</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-primary">{calculation.bankingScore.score}/100</div>
                      <Badge className={calculation.bankingScore.riskLevel === 'LOW' ? 'bg-green-500' : 'bg-orange-500'}>
                        {calculation.bankingScore.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Taux recommandé: {calculation.bankingScore.recommendedRate}%</p>
                  </CardContent>
                </Card>
              </div>
              <AIInsightCard title="Analyse Détaillée" insights={calculation.aiInsights} type="success" confidence={calculation.confidence} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
