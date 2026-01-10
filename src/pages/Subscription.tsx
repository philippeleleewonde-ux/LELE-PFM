import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Zap, Check, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Subscription {
  plan_type: string;
  credits_remaining: number;
  status: string;
  current_period_end: string | null;
}

const Subscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSubscription(data);
      }
    };

    fetchSubscription();
  }, [user]);

  const plans = [
    {
      name: 'Free',
      price: '0€',
      credits: 100,
      modules: 'Aucun',
      aiEnabled: false,
      aiCalls: 0,
      features: [
        'Accès limité à l\'interface',
        'Support communautaire',
        'Rapports basiques'
      ],
      aiFeatures: []
    },
    {
      name: 'Basic',
      price: '49€',
      credits: 500,
      modules: 'Module 2 & 4',
      aiEnabled: false,
      aiCalls: 0,
      features: [
        '2 Modules inclus (Satisfaction & Performance)',
        'Support par email',
        'Rapports standards'
      ],
      aiFeatures: []
    },
    {
      name: 'Silver',
      price: '149€',
      credits: 2000,
      modules: 'Modules 1, 2 & 4',
      aiEnabled: true,
      aiCalls: 100,
      features: [
        '3 Modules inclus',
        'Support prioritaire',
        'Rapports avancés',
        'API Access'
      ],
      aiFeatures: [
        'Recommandations IA de base',
        'Analyse de tendances',
        'Suggestions d\'amélioration',
        '100 appels IA/mois'
      ],
      popular: true
    },
    {
      name: 'Gold',
      price: '299€',
      credits: 5000,
      modules: 'Tous les modules',
      aiEnabled: true,
      aiCalls: 1000,
      features: [
        'Tous les modules (1, 2, 3, 4)',
        'Support dédié',
        'Rapports personnalisés',
        'SLA garanti',
        'Accès banquier délégué'
      ],
      aiFeatures: [
        'IA prédictive complète 3 ans',
        'Analyses sectorielles avancées',
        'Coaching personnalisé IA',
        'Score bancaire automatique',
        'Benchmarking IA',
        '1000 appels IA/mois',
        'Prédictions de turnover',
        'Calculs d\'économies avancés'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      credits: 'Illimité',
      modules: 'Tous + Personnalisés',
      aiEnabled: true,
      aiCalls: -1,
      features: [
        'Configuration personnalisée',
        'Support 24/7 dédié',
        'Formation sur site',
        'Intégration sur mesure',
        'Consultants dédiés'
      ],
      aiFeatures: [
        'IA illimitée',
        'Modèles IA personnalisés',
        'Analyses prédictives avancées',
        'Intégration IA custom',
        'Support IA dédié',
        'Priorité sur nouvelles features IA'
      ]
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Abonnement</h1>
          <p className="text-muted-foreground text-lg">
            Choisissez le plan adapté à vos besoins avec IA intégrée
          </p>
        </div>

        {/* Current Subscription */}
        {subscription && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle>Abonnement Actuel</CardTitle>
                    <CardDescription className="capitalize">Plan {subscription.plan_type}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                      {subscription.credits_remaining}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">crédits restants</div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Choisir un Plan</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`border-border bg-card ${plan.popular ? 'shadow-glow border-primary ring-2 ring-primary/20' : ''}`}
              >
                <CardHeader>
                  {plan.popular && (
                    <Badge className="mb-2 w-fit bg-gradient-to-r from-purple-500 to-blue-500">
                      <Sparkles className="w-3 h-3 mr-1" />
                      POPULAIRE
                    </Badge>
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold mt-4 gradient-primary bg-clip-text text-transparent">
                    {plan.price}
                  </div>
                  <CardDescription>
                    {typeof plan.credits === 'number' ? `${plan.credits} crédits/mois` : plan.credits}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground">Modules:</div>
                    <div className="text-sm font-medium">{plan.modules}</div>
                  </div>

                  {/* Standard Features */}
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-2">Fonctionnalités:</div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Features */}
                  {plan.aiEnabled ? (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <div className="text-sm font-semibold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                          IA Incluse:
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {plan.aiFeatures.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <X className="w-4 h-4" />
                        <span className="text-xs">Pas d'IA incluse</span>
                      </div>
                    </div>
                  )}

                  <Button
                    className={`w-full mt-4 ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {subscription?.plan_type === plan.name.toLowerCase() ? 'Plan actuel' : 'Choisir ce plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Benefits Section */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Pourquoi choisir un plan avec IA ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-purple-600">Plans Silver & Gold</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>Prédictions précises sur 3 ans pour planifier votre croissance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>Analyse automatique de satisfaction avec prédictions de turnover</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>Score bancaire automatique pour obtenir les meilleurs taux</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>Coaching personnalisé pour chaque employé</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-blue-600">Avantages Concrets</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Économisez jusqu'à 15 heures/mois d'analyse manuelle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Identifiez les risques avant qu'ils ne deviennent des problèmes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Recommandations actionnables basées sur vos données réelles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>ROI mesuré : clients voient 25%+ d'amélioration en 6 mois</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Subscription;
