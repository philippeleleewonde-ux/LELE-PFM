# 🎨 LELE HCM Design System

**Version**: 1.0
**Date**: 2025-11-09
**Statut**: Production-ready

---

## Table des Matières

1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Dark Mode](#dark-mode)
7. [Usage Examples](#usage-examples)
8. [Accessibility](#accessibility)

---

## Brand Identity

### Logo Colors (Official)

Couleurs extraites des logos officiels LELE HCM :

| Couleur | Hex | RGB | Usage |
|---------|-----|-----|-------|
| **Cyan** (Primary) | `#5DD3F3` | `rgb(93, 211, 243)` | Logo principal, CTA, accents |
| **Navy** (Secondary) | `#0A2F4F` | `rgb(10, 47, 79)` | Logo sur fond blanc, texte, sidebar |
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Logo inversé, backgrounds |
| **Black** | `#000000` | `rgb(0, 0, 0)` | Fonds sombres |

### Brand Personality

- **Professionnel** : Navy inspire confiance et sérieux
- **Moderne** : Cyan apporte dynamisme et innovation
- **Premium** : Palette sobre et élégante
- **ESG-oriented** : Couleurs naturelles et rassurantes

---

## Color Palette

### Light Mode

#### Primary Colors
```css
/* Cyan - Actions principales (CTA, liens, focus) */
--primary: hsl(195 100% 65%)         /* #5DD3F3 */
--primary-foreground: hsl(10 47 79)  /* Navy sur cyan */

/* Navy - Actions secondaires (boutons secondaires, headers) */
--secondary: hsl(10 47 79)           /* #0A2F4F */
--secondary-foreground: hsl(0 0% 100%) /* White sur navy */
```

#### Semantic Colors
```css
/* Backgrounds */
--background: hsl(0 0% 100%)         /* Pure white */
--card: hsl(0 0% 100%)
--popover: hsl(0 0% 100%)

/* Text */
--foreground: hsl(10 47 79)          /* Navy text */
--muted-foreground: hsl(210 20% 40%) /* Gray text */

/* Borders & Inputs */
--border: hsl(210 20% 85%)
--input: hsl(210 20% 85%)
--ring: hsl(195 100% 65%)            /* Cyan focus ring */

/* Status */
--destructive: hsl(0 72% 51%)        /* Red errors */
--accent: hsl(195 100% 75%)          /* Light cyan hover */
```

#### Sidebar (Dark Navy)
```css
--sidebar-background: hsl(10 47 79)  /* Navy */
--sidebar-foreground: hsl(0 0% 100%) /* White text */
--sidebar-primary: hsl(195 100% 65%) /* Cyan active */
```

### Dark Mode

#### Primary Colors
```css
/* Cyan - Reste vibrant en mode sombre */
--primary: hsl(195 100% 65%)         /* #5DD3F3 */
--primary-foreground: hsl(210 50% 10%) /* Dark navy */

/* Light Navy - Plus doux pour le mode sombre */
--secondary: hsl(15 60 100%)
--secondary-foreground: hsl(210 20% 95%)
```

#### Semantic Colors
```css
/* Backgrounds */
--background: hsl(210 50% 8%)        /* Very dark navy */
--card: hsl(210 45% 12%)
--popover: hsl(210 45% 12%)

/* Text */
--foreground: hsl(210 20% 95%)       /* Light gray */
--muted-foreground: hsl(210 20% 65%)

/* Borders & Inputs */
--border: hsl(210 40% 18%)
--input: hsl(210 40% 18%)
--ring: hsl(195 100% 65%)            /* Cyan focus */

/* Status */
--destructive: hsl(0 62.8% 30.6%)    /* Darker red */
--accent: hsl(195 100% 75%)          /* Bright cyan */
```

### Tailwind Usage

```tsx
// Brand colors
<Button className="bg-brand-cyan text-brand-navy">Action</Button>
<div className="border-brand-navy text-brand-cyan">Content</div>

// Semantic colors (adapt automatically to light/dark mode)
<Button className="bg-primary text-primary-foreground">Primary CTA</Button>
<Button className="bg-secondary text-secondary-foreground">Secondary</Button>
<Card className="bg-card text-card-foreground border-border">...</Card>
```

### Chart Colors

Pour les graphiques et data visualization :

```tsx
// Utilisez les variables --chart-1 à --chart-5
const CHART_COLORS = {
  cyan: 'hsl(var(--chart-1))',      // Cyan
  navy: 'hsl(var(--chart-2))',      // Navy
  lightCyan: 'hsl(var(--chart-3))', // Light cyan
  lightNavy: 'hsl(var(--chart-4))', // Light navy
  gray: 'hsl(var(--chart-5))',      // Gray
};
```

---

## Typography

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-heading: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, captions |
| `text-sm` | 14px | Secondary text |
| `text-base` | 16px | Body text (default) |
| `text-lg` | 18px | Emphasized text |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Card titles |
| `text-3xl` | 30px | Page headers |
| `text-4xl` | 36px | Hero titles |
| `text-5xl` | 48px | Landing page heroes |

### Font Weights

```tsx
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>
```

### Headings

```tsx
// Tous les headings utilisent --font-heading et text-brand-navy (mode clair)
<h1 className="text-4xl font-semibold">Main Page Title</h1>
<h2 className="text-3xl font-semibold">Section Title</h2>
<h3 className="text-2xl font-semibold">Subsection Title</h3>
```

---

## Spacing & Layout

### Spacing Scale (Tailwind)

```tsx
// Padding & Margin
<div className="p-0">0px</div>
<div className="p-1">4px</div>
<div className="p-2">8px</div>
<div className="p-3">12px</div>
<div className="p-4">16px</div>
<div className="p-6">24px</div>
<div className="p-8">32px</div>
<div className="p-12">48px</div>
<div className="p-16">64px</div>
<div className="p-20">80px</div>
```

### Border Radius

```css
--radius: 0.5rem (8px)
```

```tsx
<div className="rounded-sm">4px (--radius - 4px)</div>
<div className="rounded-md">6px (--radius - 2px)</div>
<div className="rounded-lg">8px (--radius)</div>
<div className="rounded-xl">12px</div>
<div className="rounded-full">50%</div>
```

### Shadows

```tsx
// Light mode
<Card className="shadow-sm">Small shadow</Card>
<Card className="shadow">Default shadow</Card>
<Card className="shadow-md">Medium shadow</Card>
<Card className="shadow-lg">Large shadow</Card>
<Card className="shadow-elegant">Elegant shadow (custom)</Card>

// Glow effect (for brand elements)
<Button className="shadow-glow">Glow effect</Button>
```

---

## Components

### Buttons

#### Primary (Cyan)
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>
```

#### Secondary (Navy)
```tsx
<Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
  Secondary Action
</Button>
```

#### Outline
```tsx
<Button variant="outline" className="border-brand-cyan text-brand-cyan">
  Outline
</Button>
```

### Cards

```tsx
<Card className="bg-card border-border">
  <CardHeader>
    <CardTitle className="text-2xl text-brand-navy">Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-foreground">Card content...</p>
  </CardContent>
</Card>
```

### Inputs

```tsx
<Input
  className="border-input ring-offset-background focus:ring-ring"
  placeholder="Enter text..."
/>
```

### Badges

```tsx
// Status badges
<Badge className="bg-brand-cyan text-brand-navy">Active</Badge>
<Badge className="bg-brand-navy text-white">CEO</Badge>
<Badge variant="outline" className="border-brand-cyan text-brand-cyan">
  New
</Badge>
```

---

## Dark Mode

### Activation

Le thème est géré par le hook `useTheme` :

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {actualTheme}</p>

      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

### ThemeToggle Component

```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

// Ajouter dans header/nav
<ThemeToggle />
```

### Design Principles (Dark Mode)

1. **Cyan reste vibrant** : `hsl(195 100% 65%)` identique en light et dark
2. **Navy devient très sombre** : `hsl(210 50% 8%)` pour le background
3. **Contraste élevé** : Text blanc `hsl(210 20% 95%)` sur dark navy
4. **Shadows plus intenses** : Opacity augmentée pour visibilité

---

## Usage Examples

### Landing Page Hero

```tsx
<section className="bg-gradient-primary py-20">
  <div className="container">
    <h1 className="text-5xl font-bold text-white">
      LELE HCM Portal
    </h1>
    <p className="text-xl text-white/90 mt-4">
      Internal Loss Mitigation & Carrying Value Accounts
    </p>
    <Button className="mt-8 bg-white text-brand-navy hover:bg-white/90 shadow-glow">
      Commencer
    </Button>
  </div>
</section>
```

### Dashboard Card

```tsx
<Card className="bg-card border-border shadow-elegant">
  <CardHeader>
    <CardTitle className="text-2xl text-brand-navy dark:text-brand-cyan">
      Performance Globale
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-bold text-brand-cyan">95%</div>
    <p className="text-muted-foreground mt-2">Objectifs atteints ce mois</p>
  </CardContent>
</Card>
```

### Sidebar Navigation

```tsx
<aside className="bg-sidebar-background text-sidebar-foreground">
  <nav>
    <a
      href="/dashboard"
      className="flex items-center gap-3 px-4 py-3 hover:bg-sidebar-accent"
    >
      <Home className="h-5 w-5" />
      <span>Dashboard</span>
    </a>
    <a
      href="/performance"
      className="flex items-center gap-3 px-4 py-3 bg-sidebar-primary text-sidebar-primary-foreground"
    >
      <TrendingUp className="h-5 w-5" />
      <span>Performance</span>
    </a>
  </nav>
</aside>
```

### Alert/Toast

```tsx
// Success
<Alert className="border-brand-cyan bg-brand-cyan/10">
  <CheckCircle className="h-4 w-4 text-brand-cyan" />
  <AlertTitle className="text-brand-cyan">Succès</AlertTitle>
  <AlertDescription>Action complétée avec succès.</AlertDescription>
</Alert>

// Error
<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Erreur</AlertTitle>
  <AlertDescription>Une erreur est survenue.</AlertDescription>
</Alert>
```

---

## Accessibility

### Color Contrast

Tous les textes respectent **WCAG 2.1 Level AA** :

- Navy (#0A2F4F) sur blanc : Ratio **14.7:1** ✅
- Cyan (#5DD3F3) sur navy : Ratio **7.2:1** ✅
- Blanc sur cyan : Ratio **1.6:1** ⚠️ (utiliser navy sur cyan)

### Focus States

Tous les éléments interactifs ont un **ring cyan visible** :

```tsx
<Button className="focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Accessible Button
</Button>
```

### Keyboard Navigation

- ✅ Tab order logique
- ✅ Escape ferme les modals/dropdowns
- ✅ Arrow keys pour navigation dans menus

### Screen Readers

```tsx
// ARIA labels
<Button aria-label="Basculer le thème">
  <Moon className="h-5 w-5" />
</Button>

// ARIA live regions pour notifications
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

---

## Files Reference

### Design Tokens
- [src/styles/design-tokens.css](src/styles/design-tokens.css) - Toutes les variables CSS
- [src/index.css](src/index.css) - Import Tailwind + custom styles
- [tailwind.config.ts](tailwind.config.ts) - Configuration Tailwind

### Theme Management
- [src/hooks/useTheme.tsx](src/hooks/useTheme.tsx) - Hook pour gestion du thème
- [src/components/ThemeToggle.tsx](src/components/ThemeToggle.tsx) - Bouton toggle

---

## Changelog

### Version 1.0 (2025-11-09)
- ✅ Couleurs LELE HCM brand (Cyan + Navy) intégrées
- ✅ Support Light & Dark mode complet
- ✅ Design tokens CSS créés
- ✅ Tailwind config étendu avec couleurs brand
- ✅ Documentation complète
- ✅ Exemples d'usage pour tous les composants

---

## Next Steps

### Phase 2 (Optionnel)
- [ ] Storybook pour documentation interactive
- [ ] Figma design tokens sync
- [ ] Animation library (Framer Motion)
- [ ] Component playground

---

**Maintenu par** : LELE HCM Portal Team
**Contact** : design@lele-hcm.com
**License** : Internal Use Only
