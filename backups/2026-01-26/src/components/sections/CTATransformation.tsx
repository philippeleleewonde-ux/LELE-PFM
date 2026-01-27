import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, HeadphonesIcon, CheckCircle2 } from 'lucide-react';
import { memo } from 'react';

/**
 * CTATransformation Section Component
 *
 * Section Call-to-Action principale pour conversion
 * - Badge crédibilité (World Finance)
 * - Message de transformation ESG
 * - CTA principal "Essai Gratuit"
 * - 3 trust badges (Configuration, Support, Conformité)
 *
 * Performance : Memoized, lazy loaded
 */

interface CTATransformationProps {
  onCTAClick?: () => void;
}

const CTATransformation = memo(({ onCTAClick }: CTATransformationProps) => {
  const trustBadges = [
    {
      icon: Clock,
      title: "Configuration Rapide",
      description: "Déployez en 5 minutes et commencez à générer des rapports ESG immédiatement"
    },
    {
      icon: HeadphonesIcon,
      title: "Support Dédié",
      description: "Équipe d'experts disponible pour vous accompagner à chaque étape"
    },
    {
      icon: CheckCircle2,
      title: "Conformité Garantie",
      description: "Alignement SASB & TCFD pour une conformité réglementaire totale"
    }
  ];

  return (
    <section className="relative overflow-hidden py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 -z-10" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Plateforme Primée World Finance 2025</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Commencez Votre Transformation ESG Aujourd'hui
            </h2>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez les organisations pionnières qui utilisent LELE HCM pour exceller
              en conformité ESG, finance durable et excellence opérationnelle.
            </p>

            {/* Primary CTA Button */}
            <Link to="/auth/role-selection">
              <Button
                size="lg"
                className="gradient-primary shadow-elegant text-lg px-10 py-6 mb-4"
                onClick={onCTAClick}
              >
                Essai Gratuit - Sans Carte de Crédit
              </Button>
            </Link>

            <p className="text-sm text-muted-foreground">
              Configuration en 5 minutes · Support dédié inclus
            </p>
          </div>

          {/* Trust Badges - 3 Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                <div className="flex-shrink-0">
                  <badge.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{badge.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

CTATransformation.displayName = 'CTATransformation';

export default CTATransformation;
