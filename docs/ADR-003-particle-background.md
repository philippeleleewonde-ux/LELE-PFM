# ADR-003: Système de Background Dynamique avec Particules

**Date**: 2026-01-29
**Statut**: Accepté
**Version**: 3.1.0

## Contexte

LELE HCM nécessite un background animé moderne et professionnel pour renforcer l'identité visuelle de la plateforme. Ce background doit:
- Être visible sur toutes les pages (landing, auth, dashboard)
- Supporter les modes dark et light
- Ne pas impacter la lisibilité du contenu
- Respecter les préférences utilisateur (reduced motion)
- Permettre à l'utilisateur de désactiver l'animation

## Décision

### Architecture en Couches (Layer System)

```
┌─────────────────────────────────────┐
│  z-index: 1  │  #root (React App)   │  ← Contenu interactif
├─────────────────────────────────────┤
│  z-index: 0  │  #particle-bg        │  ← Canvas transparent
├─────────────────────────────────────┤
│  Background  │  html (theme color)  │  ← Couleur de fond
└─────────────────────────────────────┘
```

### Transparence Sélective

| Élément | Background | Raison |
|---------|------------|--------|
| `html` | Couleur du thème | Base visible |
| `body` | Transparent | Voir canvas |
| `#root` | Transparent | Voir canvas |
| `.min-h-screen` | Transparent | Voir canvas |
| `Card`, `Table` | Opaque (95%) + blur | Lisibilité contenu |

### Module TypeScript

Structure du module `/src/lib/particles/`:

```
particles/
├── index.ts           # Exports publics
├── config.ts          # Configuration centralisée
└── ParticleEngine.ts  # Moteur d'animation
```

### Configuration

```typescript
// config.ts
export const PARTICLE_CONFIG = {
  density: 12000,        // pixels² par particule
  maxParticles: 100,     // limite pour performance
  speed: 0.5,            // vitesse de déplacement
  connectionDistance: 120,// distance de connexion
  minSize: 1.5,
  maxSize: 4,
};
```

### Couleurs par Thème

| Mode | Particules | Lignes |
|------|------------|--------|
| Dark | Cyan `rgba(93, 211, 243, 0.9)` | Cyan `rgba(93, 211, 243, 0.25)` |
| Light | Navy `rgba(10, 47, 79, 0.7)` | Navy `rgba(10, 47, 79, 0.15)` |

## Alternatives Considérées

### 1. Composant React avec useCanvas
- ❌ Re-renders inutiles
- ❌ Problèmes de cache Vite/HMR
- ❌ Hydration issues

### 2. Script inline dans index.html
- ✅ Chargement immédiat
- ❌ Pas de TypeScript
- ❌ Difficile à maintenir

### 3. Module TypeScript externe (CHOISI)
- ✅ TypeScript + IDE support
- ✅ Configuration centralisée
- ✅ Testable
- ✅ Toggle utilisateur

## Conséquences

### Positives
- Background visible sur toutes les pages
- Support dark/light mode automatique
- Toggle utilisateur pour accessibilité
- Performance optimisée (canvas transparent, clearRect)
- Configuration externalisée

### Négatives
- Complexité légèrement accrue (module dédié)
- Dépendance au localStorage pour préférences

## Implémentation

### 1. Initialisation (main.tsx)
```typescript
import { initParticleBackground } from './lib/particles';
initParticleBackground();
```

### 2. Toggle UI (HeroSection.tsx)
```tsx
<ParticleToggle />
```

### 3. Cards lisibles
```tsx
<Card className="bg-card/95 backdrop-blur-sm">
```

## Tests

- [x] Dark mode: particules cyan visibles
- [x] Light mode: particules navy visibles
- [x] Cards opaques pour lisibilité
- [x] Toggle on/off fonctionne
- [x] prefers-reduced-motion respecté
- [x] Resize window gère correctement

## Références

- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
