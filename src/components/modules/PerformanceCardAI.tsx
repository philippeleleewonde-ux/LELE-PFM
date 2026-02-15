import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Award, AlertCircle } from 'lucide-react';
import { AIInsightCard } from '@/components/AIInsightCard';
import { useAILimits } from '@/hooks/useAILimits';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface PerformanceCardAIProps {
  userId: string;
  employeeData?: {
    firstName: string;
    lastName: string;
    position?: string;
    department?: string;
    metrics?: Record<string, number>;
  };
  teamName?: string;
}

export function PerformanceCardAI({ userId, employeeData, teamName }: PerformanceCardAIProps) {
  const { limits, canMakeCall, creditsRemaining, trackCall } = useAILimits();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch employee profile from DB if not provided via props
  const { data: profile } = useQuery({
    queryKey: ['employee-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, position, department, full_name')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !employeeData,
  });

  // Resolve employee data: props > DB profile > fallback
  const resolvedEmployee = employeeData || {
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || profile?.full_name || '',
    position: profile?.position || undefined,
    department: profile?.department || undefined,
    metrics: {},
  };

  const { data: card, refetch } = useQuery({
    queryKey: ['ai-performance-card', userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-performance-cards', {
        body: {
          employeeData: {
            id: userId,
            firstName: resolvedEmployee.firstName,
            lastName: resolvedEmployee.lastName,
            position: resolvedEmployee.position,
            department: resolvedEmployee.department,
            metrics: resolvedEmployee.metrics || {},
          },
          teamContext: { teamName: teamName || 'Non spécifié' },
          goals: [],
          history: [],
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleGenerate = async () => {
    if (!canMakeCall) {
      toast({
        title: 'Crédits insuffisants',
        description: creditsRemaining === 0
          ? 'Vous avez épuisé vos crédits IA ce mois-ci.'
          : "L'IA nécessite un plan Silver ou supérieur.",
        variant: 'destructive',
      });
      return;
    }

    if (!resolvedEmployee.firstName && !resolvedEmployee.lastName) {
      toast({
        title: 'Données manquantes',
        description: "Impossible de générer sans informations employé.",
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await refetch();
      await trackCall();
      toast({ title: 'Carte générée', description: 'Performance card IA créée avec succès.' });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de générer la carte.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Performance Card IA
            </CardTitle>
            <div className="flex items-center gap-3">
              {limits.aiEnabled && (
                <Badge variant="outline" className="text-xs">
                  {creditsRemaining} crédit{creditsRemaining !== 1 ? 's' : ''} restant{creditsRemaining !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !canMakeCall}
                className="bg-gradient-to-r from-purple-500 to-blue-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? 'Génération...' : 'Générer'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!canMakeCall && !card && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <span className="text-muted-foreground">
                {creditsRemaining === 0
                  ? 'Crédits IA épuisés pour ce mois. Ils seront renouvelés au prochain cycle.'
                  : "Cette fonctionnalité nécessite un plan Silver ou supérieur."}
              </span>
            </div>
          )}

          {card && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{card.overallScore}/100</div>
                {card.employeeName && (
                  <p className="text-sm text-muted-foreground mt-1">{card.employeeName}</p>
                )}
              </div>
              <div className="space-y-3">
                {card.breakdown && Object.entries(card.breakdown).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{key}</span>
                      <span className="text-sm">{value.score}/100</span>
                    </div>
                    <Progress value={value.score} />
                  </div>
                ))}
              </div>
              {card.aiCoaching && (
                <AIInsightCard
                  title="Coaching IA Personnalisé"
                  insights={Array.isArray(card.aiCoaching) ? card.aiCoaching.join('\n') : card.aiCoaching}
                  type="success"
                />
              )}
            </div>
          )}

          {!card && canMakeCall && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Cliquez sur "Générer" pour créer une performance card IA</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
