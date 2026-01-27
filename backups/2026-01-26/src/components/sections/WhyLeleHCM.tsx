import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, BarChart3, Shield } from 'lucide-react';
import { memo } from 'react';

/**
 * WhyLeleHCM Section Component
 *
 * Section présentant les 4 différenciateurs clés de LELE HCM :
 * - Lauréat World Finance 2025
 * - Conformité SASB & TCFD
 * - Analytique ESG en Temps Réel
 * - Finance Durable Intégrée
 *
 * Performance : Memoized, lazy loaded
 */

const WhyLeleHCM = memo(() => {
  const differentiators = [
    {
      icon: TrendingUp,
      title: "Lauréat World Finance 2025",
      description: "Reconnaissance mondiale en innovation fintech ESG et finance durable"
    },
    {
      icon: Shield,
      title: "Conformité SASB & TCFD",
      description: "Aligné sur les normes internationales pour un reporting transparent"
    },
    {
      icon: BarChart3,
      title: "Analytique ESG en Temps Réel",
      description: "Données actionables instantanées pour une gestion proactive des risques"
    },
    {
      icon: Users,
      title: "Finance Durable Intégrée",
      description: "ESG au cœur de vos flux comptables quotidiens et décisions RH"
    }
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pourquoi LELE HCM ?</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Une plateforme primée qui fusionne innovation ESG, conformité réglementaire
          et excellence opérationnelle pour transformer votre gestion du capital humain.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {differentiators.map((item, index) => (
          <Card key={index} className="border-border bg-card hover:shadow-glow transition-smooth text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
});

WhyLeleHCM.displayName = 'WhyLeleHCM';

export default WhyLeleHCM;
