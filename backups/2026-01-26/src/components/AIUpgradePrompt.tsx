import { Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface AIUpgradePromptProps {
  feature: string;
  description: string;
  requiredPlan?: 'silver' | 'gold';
  className?: string;
}

export function AIUpgradePrompt({ 
  feature, 
  description, 
  requiredPlan = 'silver',
  className = '' 
}: AIUpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <Card className={`bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Fonctionnalité IA Premium</CardTitle>
            <CardDescription className="text-base">{feature}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Inclus dans le plan {requiredPlan === 'silver' ? 'Silver' : 'Gold'} :</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {requiredPlan === 'silver' ? (
              <>
                <li>• Recommandations IA de base</li>
                <li>• Analyse de tendances</li>
                <li>• 100 appels IA/mois</li>
              </>
            ) : (
              <>
                <li>• IA prédictive complète</li>
                <li>• Analyses sectorielles avancées</li>
                <li>• Score bancaire automatique</li>
                <li>• 1000 appels IA/mois</li>
              </>
            )}
          </ul>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          onClick={() => navigate('/subscription')}
        >
          Passer au plan {requiredPlan === 'silver' ? 'Silver' : 'Gold'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
