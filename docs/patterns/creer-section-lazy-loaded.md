---
type: pattern
personas: [dev]
tags: [code, react, typescript, lazy-loading, components, how-to]
related: [adr-002, arch-001]
date: 2025-11-12
author: Claude (via lele-hcm-knowledge-base skill)
status: published
---

# Pattern : Créer une Section Lazy-Loaded pour Landing Page

## Description
Pattern réutilisable pour créer une section de landing page optimisée avec lazy loading, memoization et TypeScript strict. Utilisé pour toutes les sections below-the-fold de LELE HCM.

## Use case
Utiliser ce pattern quand :
- Vous ajoutez une nouvelle section à une landing page
- La section n'est pas critique above-the-fold
- Vous voulez optimiser le bundle initial
- La section contient du contenu lourd (images, composants complexes)

**Ne PAS utiliser pour** :
- Sections above-the-fold critiques (HeroSection, Header)
- Composants ultra-légers (<5KB)
- Composants requis immédiatement au chargement

## Architecture globale

```
Landing Page
├── Above-the-fold (static imports)
│   ├── Header
│   └── HeroSection
│
└── Below-the-fold (lazy imports)
    ├── <Suspense fallback={<LoadingSection />}>
    │   └── Section1 (lazy)
    ├── <Suspense>
    │   └── Section2 (lazy)
    └── <Suspense>
        └── Section3 (lazy)
```

## Étape par étape

### Étape 1 : Créer le composant section

**Localisation** : `/src/components/sections/`

**Nom du fichier** : `NomSection.tsx` (PascalCase)

**Code template** :
```tsx
// src/components/sections/MaSection.tsx
import { memo } from 'react';

/**
 * MaSection Component
 *
 * Description concise de ce que fait la section.
 * - Fonctionnalité 1
 * - Fonctionnalité 2
 *
 * Performance : Memoized, lazy loaded
 */

interface MaSectionProps {
  title?: string;
  onActionClick?: () => void;
  // Autres props
}

const MaSection = memo(({ title, onActionClick }: MaSectionProps) => {
  return (
    <section className="container mx-auto px-4 py-20">
      {/* Contenu de la section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          {title || 'Titre par défaut'}
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Description de la section
        </p>
      </div>

      {/* Contenu principal */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Items de la section */}
      </div>

      {/* CTA optionnel */}
      {onActionClick && (
        <div className="flex justify-center mt-12">
          <button onClick={onActionClick}>
            Action
          </button>
        </div>
      )}
    </section>
  );
});

// Nécessaire pour React DevTools
MaSection.displayName = 'MaSection';

export default MaSection;
```

**Points clés** :
- ✅ `memo()` wrapper pour éviter re-renders inutiles
- ✅ Interface TypeScript pour les props
- ✅ `displayName` pour debugging
- ✅ `export default` (requis pour React.lazy())
- ✅ Classes Tailwind responsive (`md:`, `lg:`)
- ✅ Commentaire JSDoc pour documentation

### Étape 2 : Créer le composant dans la page parent

**Localisation** : `/src/pages/Landing.tsx` (ou autre page)

**Code** :
```tsx
// src/pages/Landing.tsx
import { lazy, Suspense } from 'react';

// ✅ Import statique pour sections critiques
import HeroSection from '@/components/sections/HeroSection';

// ✅ Lazy import pour sections non-critiques
const MaSection = lazy(() => import('@/components/sections/MaSection'));
const AutreSection = lazy(() => import('@/components/sections/AutreSection'));

// ✅ Loading fallback réutilisable
const LoadingSection = () => (
  <div className="container mx-auto px-4 py-20">
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-muted rounded w-1/2 mx-auto" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
);

const Landing = () => {
  const handleActionClick = () => {
    // Tracking analytics par exemple
    console.log('Action clicked');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Above-the-fold : chargement immédiat */}
      <HeroSection />

      {/* Below-the-fold : lazy loaded */}
      <Suspense fallback={<LoadingSection />}>
        <MaSection
          title="Mon Titre Custom"
          onActionClick={handleActionClick}
        />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <AutreSection />
      </Suspense>
    </div>
  );
};

export default Landing;
```

**Points clés** :
- ✅ Lazy import avec `lazy(() => import())`
- ✅ Chaque section wrappée dans son propre `<Suspense>`
- ✅ Fallback cohérent (LoadingSection réutilisé)
- ✅ Props passées normalement
- ✅ Handlers d'événements définis dans le parent

### Étape 3 : Optimiser le loading fallback (optionnel)

**Version basique** (actuelle) :
```tsx
const LoadingSection = () => (
  <div className="container mx-auto px-4 py-20">
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-muted rounded w-1/2 mx-auto" />
      <div className="h-24 bg-muted rounded" />
    </div>
  </div>
);
```

**Version skeleton avancée** (recommandée) :
```tsx
// src/components/LoadingSkeleton.tsx
export const SectionSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="container mx-auto px-4 py-20 animate-pulse">
    {/* Titre skeleton */}
    <div className="h-12 bg-muted rounded w-1/2 mx-auto mb-8" />

    {/* Description skeleton */}
    <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-12" />

    {/* Grid skeleton */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-48 bg-muted rounded" />
      ))}
    </div>
  </div>
);
```

Usage :
```tsx
<Suspense fallback={<SectionSkeleton rows={4} />}>
  <MaSection />
</Suspense>
```

## Exemples complets tirés du projet

### Exemple 1 : WhyLeleHCM (4 cartes différenciateurs)

**Fichier** : `src/components/sections/WhyLeleHCM.tsx`

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, BarChart3, Shield } from 'lucide-react';
import { memo } from 'react';

const WhyLeleHCM = memo(() => {
  const differentiators = [
    {
      icon: TrendingUp,
      title: "Lauréat World Finance 2025",
      description: "Reconnaissance mondiale en innovation fintech ESG"
    },
    {
      icon: Shield,
      title: "Conformité SASB & TCFD",
      description: "Aligné sur les normes internationales"
    },
    {
      icon: BarChart3,
      title: "Analytique ESG en Temps Réel",
      description: "Données actionables instantanées"
    },
    {
      icon: Users,
      title: "Finance Durable Intégrée",
      description: "ESG au cœur de vos flux comptables"
    }
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Pourquoi LELE HCM ?
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Une plateforme primée qui fusionne innovation ESG et excellence opérationnelle.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {differentiators.map((item, index) => (
          <Card
            key={index}
            className="border-border bg-card hover:shadow-glow transition-smooth text-center"
          >
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
```

**Usage dans Landing.tsx** :
```tsx
const WhyLeleHCM = lazy(() => import('@/components/sections/WhyLeleHCM'));

// Dans le JSX
<Suspense fallback={<LoadingSection />}>
  <WhyLeleHCM />
</Suspense>
```

### Exemple 2 : CTATransformation (CTA avec trust badges)

**Fichier** : `src/components/sections/CTATransformation.tsx`

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, HeadphonesIcon, CheckCircle2 } from 'lucide-react';
import { memo } from 'react';

interface CTATransformationProps {
  onCTAClick?: () => void;
}

const CTATransformation = memo(({ onCTAClick }: CTATransformationProps) => {
  const trustBadges = [
    {
      icon: Clock,
      title: "Configuration Rapide",
      description: "Déployez en 5 minutes"
    },
    {
      icon: HeadphonesIcon,
      title: "Support Dédié",
      description: "Équipe d'experts disponible"
    },
    {
      icon: CheckCircle2,
      title: "Conformité Garantie",
      description: "Alignement SASB & TCFD"
    }
  ];

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 -z-10" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Plateforme Primée World Finance 2025
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Commencez Votre Transformation ESG Aujourd'hui
            </h2>

            <Link to="/auth/role-selection">
              <Button
                size="lg"
                className="gradient-primary shadow-elegant text-lg px-10 py-6 mb-4"
                onClick={onCTAClick}
              >
                Essai Gratuit - Sans Carte de Crédit
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {trustBadges.map((badge, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border"
              >
                <badge.icon className="h-6 w-6 text-primary" />
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
```

**Usage dans Landing.tsx** :
```tsx
const CTATransformation = lazy(() => import('@/components/sections/CTATransformation'));

const Landing = () => {
  const handleCTAClick = () => {
    trackCTAClick('cta_section', 'Essai Gratuit', '/auth/role-selection');
  };

  return (
    <Suspense fallback={<LoadingSection />}>
      <CTATransformation onCTAClick={handleCTAClick} />
    </Suspense>
  );
};
```

## Variations du pattern

### Variante A : Section avec données async
Si votre section doit fetcher des données :

```tsx
import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';

const MaSectionAvecData = memo(() => {
  const { data, isLoading } = useQuery({
    queryKey: ['section-data'],
    queryFn: fetchSectionData
  });

  if (isLoading) {
    return <div className="py-20 text-center">Chargement...</div>;
  }

  return (
    <section className="container mx-auto px-4 py-20">
      {/* Render avec data */}
    </section>
  );
});
```

### Variante B : Section avec animations
Avec Framer Motion pour micro-interactions :

```tsx
import { memo } from 'react';
import { motion } from 'framer-motion';

const MaSectionAnimee = memo(() => {
  return (
    <motion.section
      className="container mx-auto px-4 py-20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Contenu */}
    </motion.section>
  );
});
```

### Variante C : Section conditionnelle
Lazy load seulement si une condition est remplie :

```tsx
const Landing = () => {
  const { user } = useAuth();

  return (
    <>
      <HeroSection />

      {!user && (
        <Suspense fallback={<LoadingSection />}>
          <SectionPourVisiteurs />
        </Suspense>
      )}

      {user && (
        <Suspense fallback={<LoadingSection />}>
          <SectionPourUtilisateurs />
        </Suspense>
      )}
    </>
  );
};
```

## Bonnes pratiques

### ✅ À FAIRE
- **Memoiser TOUS les composants sections** avec `React.memo()`
- **Définir displayName** pour debugging React DevTools
- **TypeScript strict** : Interfaces pour toutes les props
- **Export default** (requis pour React.lazy())
- **Responsive design** : Classes Tailwind `md:`, `lg:`, `xl:`
- **Semantic HTML** : `<section>`, `<header>`, `<nav>`, etc.
- **Suspense individuel** : Un `<Suspense>` par section
- **Loading fallback cohérent** : Même style partout

### ❌ À ÉVITER
- **Ne PAS lazy load above-the-fold** : Retarde FCP
- **Ne PAS oublier memo()** : Perte de performance
- **Ne PAS partager un Suspense** pour toutes les sections : Si une fail, toutes fail
- **Ne PAS utiliser `export { MaSection }`** : React.lazy() nécessite default export
- **Ne PAS fetcher dans le composant sans React Query** : Cache et déduplication manquants
- **Ne PAS oublier les props TypeScript** : Erreurs runtime évitables

## Pièges courants

### Piège 1 : Oubli du `export default`
```tsx
// ❌ INCORRECT - React.lazy() ne peut pas importer
export const MaSection = memo(() => {/* ... */});

// ✅ CORRECT
const MaSection = memo(() => {/* ... */});
export default MaSection;
```

### Piège 2 : Suspense sans fallback
```tsx
// ❌ INCORRECT - Erreur si pas de fallback
<Suspense>
  <MaSection />
</Suspense>

// ✅ CORRECT
<Suspense fallback={<LoadingSection />}>
  <MaSection />
</Suspense>
```

### Piège 3 : Props non typées
```tsx
// ❌ INCORRECT - any implicit
const MaSection = memo((props) => {
  return <div>{props.title}</div>;
});

// ✅ CORRECT
interface MaSectionProps {
  title: string;
}

const MaSection = memo(({ title }: MaSectionProps) => {
  return <div>{title}</div>;
});
```

## Performance

### Impact du pattern
- **Bundle initial** : Réduit de ~30-60% selon le nombre de sections lazy loaded
- **TTI (Time to Interactive)** : Amélioration de ~40-50%
- **FCP (First Contentful Paint)** : Amélioration de ~20-30%
- **Overhead** : +50KB pour React.lazy() runtime (négligeable)

### Quand mesurer
```bash
# Lighthouse audit
npx lighthouse http://localhost:8081 --view

# Ou dans Chrome DevTools
# Lighthouse tab > Analyze page load
```

### Métriques cibles
- Performance score : > 90
- FCP : < 1.5s
- TTI : < 3s
- Bundle initial : < 500KB gzipped

## Tests

### Test unitaire basique
```tsx
// src/components/sections/__tests__/MaSection.test.tsx
import { render, screen } from '@testing-library/react';
import MaSection from '../MaSection';

describe('MaSection', () => {
  it('renders with default title', () => {
    render(<MaSection />);
    expect(screen.getByText(/titre par défaut/i)).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<MaSection title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('calls onActionClick when button clicked', () => {
    const mockClick = vi.fn();
    render(<MaSection onActionClick={mockClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test de lazy loading
```tsx
// src/pages/__tests__/Landing.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from '../Landing';

describe('Landing - Lazy Loading', () => {
  it('shows loading fallback before section loads', async () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // HeroSection charge immédiatement
    expect(screen.getByText(/LELE HCM/i)).toBeInTheDocument();

    // Sections lazy loaded chargent après
    await waitFor(() => {
      expect(screen.getByText(/Pourquoi LELE HCM/i)).toBeInTheDocument();
    });
  });
});
```

## Checklist de création

Avant de considérer une section comme terminée :

- [ ] Composant créé dans `/src/components/sections/`
- [ ] Memoized avec `React.memo()`
- [ ] Props TypeScript définies
- [ ] displayName défini
- [ ] Export default présent
- [ ] Responsive (classes Tailwind md:, lg:)
- [ ] Lazy imported dans la page parent
- [ ] Wrappé dans `<Suspense>` avec fallback
- [ ] Testable (tests unitaires écrits)
- [ ] Performance vérifiée (Lighthouse si critique)
- [ ] Documenté (commentaire JSDoc en haut du fichier)

## Liens connexes

### Documentation
- [React.lazy() - React Docs](https://react.dev/reference/react/lazy)
- [Suspense - React Docs](https://react.dev/reference/react/Suspense)
- [React.memo() - React Docs](https://react.dev/reference/react/memo)
- [Code Splitting - Vite Docs](https://vitejs.dev/guide/features.html#dynamic-import)

### Autres docs LELE HCM
- [ADR-002 : Lazy Loading Landing Page](/docs/adr/ADR-002-lazy-loading-landing-page.md)
- [Architecture : Stack Technique](/docs/architecture/stack-technique.md)

## Pour l'Agent IA

**Réponse courte** :
Pattern en 3 étapes : 1) Créer composant section memoized dans `/src/components/sections/`, 2) Lazy import avec `lazy(() => import())`, 3) Wrapper dans `<Suspense fallback={<Loading />}>`.

**Code minimal** :
```tsx
// Section
const Ma = memo(() => <section>...</section>);
Ma.displayName = 'Ma';
export default Ma;

// Page
const Ma = lazy(() => import('@/components/sections/Ma'));
<Suspense fallback={<Loading />}><Ma /></Suspense>
```

**Actions suggérées** :
1. Créer fichier `/src/components/sections/NomSection.tsx`
2. Copier template avec memo() + TypeScript
3. Lazy import dans page parent
4. Tester avec Lighthouse

**Keywords** : pattern, lazy-loading, react-lazy, suspense, memo, code-splitting, components, sections, performance, how-to

---

*Dernière mise à jour : 2025-11-12*
*Utilisé dans : Landing.tsx (WhyLeleHCM, CTATransformation, AwardsBadge detailed)*
