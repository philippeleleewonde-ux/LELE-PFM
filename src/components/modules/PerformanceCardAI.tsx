import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Award } from 'lucide-react';
import { AIInsightCard } from '@/components/AIInsightCard';
import { useAILimits } from '@/hooks/useAILimits';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export function PerformanceCardAI({ userId }: { userId: string }) {
  const { limits } = useAILimits();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: card, refetch } = useQuery({
    queryKey: ['ai-performance-card', userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-performance-cards', {
        body: {
          employeeData: { id: userId, firstName: 'John', lastName: 'Doe', position: 'Manager', metrics: {} },
          teamContext: { teamName: 'Sales' },
          goals: [],
          history: []
        }
      });
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await refetch();
      toast({ title: "Carte générée", description: "Performance card IA créée avec succès." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de générer.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" />Performance Card IA</CardTitle>
            <Button onClick={handleGenerate} disabled={isGenerating || !limits.aiEnabled} className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Sparkles className="w-4 h-4 mr-2" />{isGenerating ? 'Génération...' : 'Générer'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {card && (
            <div className="space-y-6">
              <div className="text-center"><div className="text-5xl font-bold text-primary">{card.overallScore}/100</div></div>
              <div className="space-y-3">
                {Object.entries(card.breakdown).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1"><span className="text-sm font-medium">{key}</span><span className="text-sm">{value.score}/100</span></div>
                    <Progress value={value.score} />
                  </div>
                ))}
              </div>
              <AIInsightCard title="Coaching IA Personnalisé" insights={card.aiCoaching.join('\n')} type="success" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
