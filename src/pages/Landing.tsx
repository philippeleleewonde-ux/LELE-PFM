import { useAuth } from '@/hooks/useAuth';
import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AwardsBadge } from '@/components/AwardsBadge';
import { trackCTAClick, trackPageView } from '@/lib/utils/analytics';
import { Helmet } from 'react-helmet-async';
// Import statique pour section critique above-the-fold
import HeroSection from '@/components/sections/HeroSection';

// Lazy loading pour sections non-critiques (below-the-fold)
const WhyLeleHCM = lazy(() => import('@/components/sections/WhyLeleHCM'));
const CTATransformation = lazy(() => import('@/components/sections/CTATransformation'));

/**
 * Landing Page - LELE HCM
 *
 * Page d'atterrissage optimisée pour conversion avec :
 * - Performance: Lazy loading sections non-critiques
 * - Analytics: Tracking CTAs et comportements utilisateurs
 * - SEO: Meta tags optimisés
 * - Accessibilité: ARIA labels, navigation clavier
 *
 * Structure:
 * 1. HeroSection (above-fold, chargement immédiat)
 * 2. Awards Trust Bar
 * 3. WhyLeleHCM (lazy loaded)
 * 4. CTATransformation (lazy loaded)
 * 5. Awards Detailed
 * 6. Footer
 */

// Loading fallback pour Suspense
const LoadingSection = () => (
  <div className="container mx-auto px-4 py-20">
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-muted rounded w-1/2 mx-auto" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
);

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    // Redirect si déjà connecté
    if (user) {
      navigate('/profile');
      return;
    }

    // Track page view
    trackPageView('Landing Page');
  }, [user, navigate]);

  // Handler pour tracking des CTAs
  const handleHeroCTAClick = () => {
    trackCTAClick('hero', 'Démarrer gratuitement', '/auth/role-selection');
  };

  const handleCTASectionClick = () => {
    trackCTAClick('cta_section', 'Essai Gratuit - Sans Carte de Crédit', '/auth/role-selection');
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>LELE HCM - Plateforme ESG Primée World Finance Innovation Awards 2025</title>
        <meta
          name="description"
          content="Solution HCM conforme SASB & TCFD. Lauréat World Finance Innovation Awards 2025 pour l'excellence en innovation fintech ESG et finance durable."
        />
        <meta name="keywords" content="HCM, ESG, SASB, TCFD, Finance Durable, Conformité, World Finance, Innovation Fintech" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="LELE HCM - Leader Innovation ESG & Finance Durable" />
        <meta
          property="og:description"
          content="Plateforme primée World Finance 2025. Conformité SASB & TCFD, analytique ESG en temps réel."
        />
        <meta property="og:url" content="https://lele-hcm.com" />
        {/* TODO: Ajouter og:image une fois l'image créée */}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LELE HCM - Plateforme ESG Primée" />
        <meta
          name="twitter:description"
          content="Lauréat World Finance Innovation Awards 2025. Solution HCM conforme SASB & TCFD."
        />
      </Helmet>

      <div className="min-h-screen bg-transparent">
        {/* Section critique above-the-fold - chargement immédiat */}
        <HeroSection onCTAClick={handleHeroCTAClick} />

        {/* Awards Trust Bar - chargement immédiat pour crédibilité */}
        <AwardsBadge variant="trust-bar" />

        {/* Sections below-the-fold - lazy loaded */}
        <Suspense fallback={<LoadingSection />}>
          <WhyLeleHCM />
        </Suspense>

        <Suspense fallback={<LoadingSection />}>
          <CTATransformation onCTAClick={handleCTASectionClick} />
        </Suspense>

        {/* Awards Detailed Section - lazy loaded */}
        <Suspense fallback={<LoadingSection />}>
          <AwardsBadge variant="detailed" />
        </Suspense>

        {/* Footer - fond semi-transparent */}
        <footer className="border-t border-border py-8 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>&copy; 2025 LELE HCM Portal. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
