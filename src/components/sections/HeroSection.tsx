import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeLogo } from '@/components/ThemeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ParticleToggle } from '@/components/ui/ParticleToggle';
import { AwardsBadge } from '@/components/AwardsBadge';
import { memo } from 'react';

/**
 * HeroSection Component
 *
 * Section critique above-the-fold contenant :
 * - Header avec logo et navigation
 * - Awards badge pour crédibilité immédiate
 * - Value proposition principale
 * - CTA primaire vers inscription
 *
 * Performance : Memoized pour éviter re-renders inutiles
 */

interface HeroSectionProps {
  onCTAClick?: () => void;
}

const HeroSection = memo(({ onCTAClick }: HeroSectionProps) => {
  return (
    <>
      {/* Header - fond semi-transparent pour voir les particules */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <ThemeLogo className="h-14" />
          </div>
          <div className="flex gap-4 items-center">
            <ParticleToggle />
            <ThemeToggle />
            <Link to="/auth/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/auth/role-selection">
              <Button className="gradient-primary shadow-elegant">Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        {/* Awards Badge - Hero Variant */}
        <div className="flex justify-center mb-6">
          <AwardsBadge variant="hero" />
        </div>

        <div className="flex justify-center mb-8">
          <ThemeLogo className="h-64 md:h-80 lg:h-96 max-w-full" />
        </div>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Solution complète pour la gestion du capital humain et l'analyse financière.
          Optimisez vos opérations avec nos modules spécialisés.
        </p>

        <div className="flex justify-center">
          <Link to="/auth/role-selection">
            <Button
              size="lg"
              className="gradient-primary shadow-elegant text-lg px-8"
              onClick={onCTAClick}
            >
              Démarrer gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
