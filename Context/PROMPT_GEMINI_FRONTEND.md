# PROMPT GEMINI — Création du Frontend LELE PFM

---

## CONTEXTE DU PROJET

Tu es un développeur senior React Native / Expo spécialisé dans les applications fintech mobile-first. Tu vas créer le frontend complet de **LELE PFM** (Personal Finance Management), une application mobile iOS + Android de gestion de finances personnelles.

Cette application est dérivée d'une plateforme entreprise existante (LELE HCM Portal V3) et transpose sa puissance analytique vers les particuliers. Chaque individu gère son argent avec le même niveau de rigueur qu'une entreprise gère son capital humain.

**Le projet existe déjà partiellement** — le Sprint 0 (infrastructure) est terminé. Tu dois créer les **écrans, composants UI, navigation et interactions** du Sprint 1 au Sprint 10.

---

## STACK TECHNIQUE IMPOSÉE (NE PAS CHANGER)

```
Framework      : React Native 0.76+ avec Expo SDK 52+ (managed workflow)
Langage        : TypeScript 5.4+ (strict mode, zéro @ts-ignore)
Navigation     : Expo Router 4.0+ (file-based routing)
State          : Zustand 5.x
Formulaires    : React Hook Form 7.x + Zod 3.x (validation runtime)
Charts         : Victory Native 41+
Animations     : React Native Reanimated 3.x
Icônes         : Lucide React Native
i18n           : i18next + react-i18next (V1 = français uniquement)
Local DB       : expo-sqlite 14+ (offline-first)
Backend        : Supabase JS 2.x (PostgreSQL + Auth + RLS + Edge Functions)
Auth           : Biométrique (Face ID / Touch ID) + PIN 6 chiffres fallback
Styling        : StyleSheet.create() natif (PAS de Tailwind, PAS de styled-components)
```

---

## LES 10 RÈGLES MÉTIER ABSOLUES

**Ces règles sont NON-NÉGOCIABLES. Elles doivent être respectées dans CHAQUE écran, CHAQUE composant, CHAQUE interaction.**

### Règle 1 — EKH n'est JAMAIS un type budgétaire
EKH (Score de Compétence Financière) est TOUJOURS calculé automatiquement à partir du comportement de l'utilisateur. Il n'apparaît JAMAIS comme un 5ème type de transaction, JAMAIS comme une ligne de budget. C'est un INDICATEUR affiché en lecture seule (jauge, pourcentage).

### Règle 2 — 4 types de transactions UNIQUEMENT
```
1. Dépense Fixe       → Icône cadenas 🔒, couleur BLEUE (#3B82F6)
2. Dépense Variable   → Icône graphe 📊, couleur ORANGE (#F97316)
3. Dépense Imprévue   → Icône alerte ⚠️, couleur ROUGE (#EF4444)
4. Versement Épargne-Dette → Icône tirelire 🐷, couleur VERTE (#22C55E)
```
PAS de 5ème type. Jamais. Nulle part dans l'UI.

### Règle 3 — 8 catégories COICOP ONU (immuables)
```
01. Alimentation et boissons non alcoolisées
02. Transport
03. Logement, eau, électricité, gaz
04. Santé
05. Loisirs et culture
06. Éducation
07. Assurances
08. Autres dépenses
```
Ces catégories sont fixes, standardisées ONU. L'utilisateur ne peut pas les modifier, supprimer ou en ajouter. Il peut seulement ajouter des sous-catégories (N2, N3) sous chaque catégorie.

### Règle 4 — Distribution Waterfall P1→P2→P3→P4
```
P1 = Fonds d'Urgence       (défaut 30%) → couleur BLEUE
P2 = Remboursement Dette    (défaut 35%) → couleur ORANGE
P3 = Investissement         (défaut 20%) → couleur VERTE
P4 = Plaisir                (défaut 15%) → couleur ROSE
```
Les pourcentages sont CONFIGURABLES par l'utilisateur via 4 sliders. La somme doit TOUJOURS être = 100% (±0.01%). **INTERDIT** : tout ratio hardcodé 67/33 ou constante PRIME_RATIO/TRESO_RATIO.

### Règle 5 — capRealToPrevu : Math.min(réalisé, prévu)
Dans tout affichage de comparaison budget vs réel, le réalisé ne dépasse JAMAIS le prévu visuellement. Si quelqu'un dépense plus que prévu, on affiche le prévu comme cap.

### Règle 6 — Granularité HEBDOMADAIRE (Kakeibo)
L'unité de temps est la SEMAINE (52 semaines/an), PAS le mois. Méthode Kakeibo japonaise. Les transactions sont saisies par semaine, les performances sont calculées par semaine, le calendrier affiche des semaines.

### Règle 7 — Score /10 avec pondération fixe
```
Score = (EKH/100 × 4) + (completion% × 3) + (budget_respect% × 2) + (variation_EPR% × 1)
```
Grades avec couleurs :
```
A+ (9.0-10.0) → Or 🌟      #FFD700
A  (8.0-8.9)  → Bleu foncé ⭐ #1E40AF
B  (7.0-7.9)  → Vert ✓      #16A34A
C  (6.0-6.9)  → Orange ◐    #EA580C
D  (5.0-5.9)  → Orange foncé ▼ #C2410C
E  (0.0-4.9)  → Rouge ✗     #DC2626
```

### Règle 8 — Formule flexibilité : (F1+F2+F3)/63 × 100
F1 = Fréquence (0-21), F2 = Modifiabilité (0-21), F3 = Substituabilité (0-21). Afficher comme jauge 0-100% avec couleurs : Rouge <33%, Jaune 33-66%, Vert >66%.

### Règle 9 — 3 dimensions orthogonales (QUOI × OÙ × COMMENT)
```
QUOI    = 4 types de transactions (Fixe/Variable/Imprévue/Épargne-Dette)
OÙ      = 8 catégories COICOP (01-08)
COMMENT = 2 natures (Essentielle / Discrétionnaire)
```
Ces 3 dimensions sont indépendantes. L'UI doit permettre de filtrer selon chacune. Un heatmap QUOI×OÙ et un stacked bar par COMMENT sont requis dans les reportings.

### Règle 10 — EPR (Économies Potentiellement Réalisables)
```
EPR = montant × (1 - taux_incompressibilité/100) × (score_flexibilité/100)
```
Chaque transaction affiche son EPR calculé. Le total EPR est distribué selon le waterfall P1→P4.

---

## DESIGN SYSTEM

### Palette de couleurs

```typescript
const colors = {
  light: {
    primary: '#3B82F6',      // Bleu — actions principales
    secondary: '#8B5CF6',    // Violet — accents
    success: '#22C55E',      // Vert — positif, épargne
    warning: '#F97316',      // Orange — attention
    danger: '#EF4444',       // Rouge — négatif, risque
    info: '#06B6D4',         // Cyan — information
    background: '#FFFFFF',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    // Types de transactions
    typeFixe: '#3B82F6',
    typeVariable: '#F97316',
    typeImprevue: '#EF4444',
    typeEpargneDette: '#22C55E',
    // Waterfall
    waterfallP1: '#3B82F6',
    waterfallP2: '#F97316',
    waterfallP3: '#22C55E',
    waterfallP4: '#EC4899',
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#A78BFA',
    success: '#4ADE80',
    warning: '#FB923C',
    danger: '#F87171',
    info: '#22D3EE',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#475569',
    typeFixe: '#60A5FA',
    typeVariable: '#FB923C',
    typeImprevue: '#F87171',
    typeEpargneDette: '#4ADE80',
    waterfallP1: '#60A5FA',
    waterfallP2: '#FB923C',
    waterfallP3: '#4ADE80',
    waterfallP4: '#F472B6',
  },
};
```

### Typographie
```typescript
const typography = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  kpi: { fontSize: 32, fontWeight: '800', lineHeight: 38 },
};
```

### Spacing & Layout
```typescript
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const borderRadius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
```

### Composants UI réutilisables à créer
```
<KPICard title value trend color icon />          — Carte KPI avec valeur, tendance, icône
<GradeBadge grade size />                         — Badge A+ à E avec couleur
<TransactionTypeBadge type />                     — Badge coloré (Fixe/Variable/Imprévue/Épargne-Dette)
<COICOPIcon code size />                          — Icône par catégorie COICOP
<FlexibilityGauge score />                        — Jauge 0-100% (rouge/jaune/vert)
<WaterfallBar p1 p2 p3 p4 total />               — Barre waterfall séquentielle
<WeekSelector currentWeek onSelect />             — Sélecteur de semaine (←/→)
<ScoreCircle score grade />                       — Cercle score /10 avec grade
<CurrencyText amount devise />                    — Texte monétaire formaté (centimes → affichage)
<EmptyState icon title description action />      — État vide avec CTA
<LoadingSkeleton type />                          — Skeleton loading
<BottomSheet title children />                    — Bottom sheet modal
<FilterChip label selected onToggle />            — Chip de filtre
<ProgressBar value max color />                   — Barre de progression
```

---

## ARCHITECTURE DE NAVIGATION (Expo Router)

```
src/app/
├── _layout.tsx                    # Root: SafeArea + ThemeProvider + i18n + AuthGuard
├── (auth)/
│   ├── _layout.tsx                # Layout auth (sans tabs)
│   ├── login.tsx                  # Écran login (email/magic link)
│   ├── biometric.tsx              # Challenge biométrique
│   └── pin.tsx                    # Saisie PIN 6 chiffres
│
├── (tabs)/
│   ├── _layout.tsx                # Bottom Tab Navigator (4 onglets)
│   ├── index.tsx                  # TAB 1: Dashboard
│   ├── transactions.tsx           # TAB 2: Transactions
│   ├── performance.tsx            # TAB 3: Performance
│   └── settings.tsx               # TAB 4: Paramètres
│
├── (screens)/
│   ├── profile/
│   │   ├── edit.tsx               # Édition profil financier (12 profils)
│   │   ├── revenues.tsx           # Gestion des revenus (max 8 sources)
│   │   ├── expenses.tsx           # Gestion des dépenses COICOP
│   │   └── risk.tsx               # Évaluation des risques (6 domaines)
│   │
│   ├── transactions/
│   │   ├── wizard.tsx             # Assistant 3 étapes (COICOP → Type → Détails)
│   │   ├── detail.tsx             # Détail d'une transaction
│   │   └── journal.tsx            # Journal des transactions (tableau filtrable)
│   │
│   ├── performance/
│   │   ├── weekly-report.tsx      # Rapport hebdomadaire (bulletin)
│   │   ├── waterfall.tsx          # Distribution waterfall P1→P4
│   │   ├── center.tsx             # Centre de performance global
│   │   └── calendar.tsx           # Calendrier 3 niveaux (Années→Mois→Semaines)
│   │
│   ├── reporting/
│   │   ├── dashboard-full.tsx     # Dashboard complet (6 KPI + radar 5D)
│   │   ├── plan-3years.tsx        # Plan d'optimisation 3 ans
│   │   ├── savings-by-lever.tsx   # Épargne par levier
│   │   ├── ventilation.tsx        # Ventilation économique (matrice)
│   │   ├── losses.tsx             # Évolution des pertes
│   │   ├── detailed-plan.tsx      # Plan détaillé 36 mois
│   │   ├── savings-calendar.tsx   # Calendrier d'épargne
│   │   ├── priority-actions.tsx   # Actions prioritaires
│   │   └── global-report.tsx      # Rapport global (PDF exportable)
│   │
│   ├── config/
│   │   ├── coicop.tsx             # Configuration COICOP N1/N2/N3
│   │   ├── flexibility.tsx        # Paramètres flexibilité F1/F2/F3
│   │   ├── waterfall-config.tsx   # Configuration distribution P1→P4
│   │   └── overview.tsx           # Vue d'ensemble (lecture seule)
│   │
│   └── settings/
│       ├── notifications.tsx      # Préférences notifications
│       ├── export.tsx             # Export PDF/CSV/iCal
│       ├── currency.tsx           # Sélection devise
│       ├── theme.tsx              # Thème clair/sombre
│       └── about.tsx              # À propos
```

---

## ÉCRANS DÉTAILLÉS — SPÉCIFICATIONS UI

### ÉCRAN 1 : Dashboard (Tab principale)

```
┌──────────────────────────────────┐
│ LELE PFM          🔔  👤         │ ← Header avec nom + notifications
├──────────────────────────────────┤
│                                  │
│  Semaine 07 · 10-16 fév 2026    │ ← WeekSelector (←/→)
│                                  │
│  ┌──────────┐  ┌──────────┐     │
│  │ Reste à  │  │   EKH    │     │
│  │ vivre    │  │  3.8/5   │     │ ← 6 KPICards (2×3 grid)
│  │ 847€/sem │  │  ████░░  │     │
│  │ ↑ +12%   │  │          │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │  Risque  │  │ VaR 95%  │     │
│  │  Modéré  │  │ 2,340€   │     │
│  │  ⬟ 3D   │  │  vs 28%  │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │ Épargne  │  │  Score   │     │
│  │ cumulée  │  │   7.8    │     │
│  │ 4,520€   │  │    B     │     │
│  │ ███░░░░  │  │  vert    │     │
│  └──────────┘  └──────────┘     │
│                                  │
│  ── Actions rapides ──           │
│  [+ Transaction]  [Voir rapport] │
│                                  │
├──────────────────────────────────┤
│ 🏠 Dashboard │ 💳 Transactions │ │ ← Bottom tabs
│ 📊 Perform.  │ ⚙️ Paramètres  │ │
└──────────────────────────────────┘
```

**KPICard specs :**
- Carte 1 : Reste-à-vivre — valeur €/semaine, couleur (Vert ≥500€, Orange 200-499€, Rouge <200€), tendance vs semaine précédente
- Carte 2 : EKH — valeur /5.0, barre de progression, couleur (Rouge <2, Orange 2-3, Jaune 3-4, Vert ≥4)
- Carte 3 : Profil de risque — valeur textuelle (Conservative/Modéré/Agressif), mini radar 5D
- Carte 4 : VaR 95% — valeur €/an, % vs reste-à-vivre, alerte si >40%
- Carte 5 : Épargne cumulée 36m — valeur €, barre progression 36 mois
- Carte 6 : Score global — valeur /10 + lettre (A+ à E), tendance 12 semaines

---

### ÉCRAN 2 : Assistant de Transaction (3 étapes)

**Étape 1 — Sélection COICOP :**
```
┌──────────────────────────────────┐
│ ← Nouvelle transaction    ①②③  │
├──────────────────────────────────┤
│                                  │
│  Choisir une catégorie           │
│                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌────┐│
│  │ 🍔  │ │ 🚗  │ │ 🏠  │ │ 🏥 ││
│  │ Ali  │ │Trans│ │Loge │ │Sant││ ← Grid 2×4 de catégories
│  │ ment │ │port │ │ment │ │ é  ││
│  └─────┘ └─────┘ └─────┘ └────┘│
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌────┐│
│  │ 🎭  │ │ 📚  │ │ 🛡️  │ │ 📦 ││
│  │Lois │ │Éduc │ │Assu │ │Autr││
│  │irs  │ │ation│ │rance│ │ es ││
│  └─────┘ └─────┘ └─────┘ └────┘│
└──────────────────────────────────┘
```

**Étape 2 — Type de transaction :**
```
┌──────────────────────────────────┐
│ ← Nouvelle transaction    ①②③  │
├──────────────────────────────────┤
│                                  │
│  Type de transaction             │
│                                  │
│  ┌──────────────────────────┐    │
│  │ 🔒  Dépense Fixe         │    │ ← Sélection exclusive
│  │     Loyer, assurance...   │    │    (radio buttons visuels)
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │ 📊  Dépense Variable     │    │
│  │     Courses, essence...   │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │ ⚠️  Dépense Imprévue     │    │
│  │     Réparation, urgence...│    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │ 🐷  Versement Épargne    │    │
│  │     Épargne, crédit...    │    │
│  └──────────────────────────┘    │
│                                  │
│           [Suivant →]            │
└──────────────────────────────────┘
```

**Étape 3 — Détails :**
```
Champs :
- Date (WeekCalendarSelector, semaine courante par défaut)
- Montant (€, clavier numérique, validation >0)
- Description (texte, autocomplete depuis historique)
- Moyen de paiement (4 icônes : 💳 Carte, 💵 Espèces, 🔄 Virement, 📋 Prélèvement)
- Nature (toggle : Essentielle / Discrétionnaire)
- Notes (optionnel, textarea)
- Bouton [Enregistrer] — sauvegarde locale SQLite + sync Supabase
```

---

### ÉCRAN 3 : Journal des Transactions

```
┌──────────────────────────────────┐
│ Journal          🔍  ≡ Filtres  │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Total: 1,247€  │ 23 tx │ 6│ │ ← 4 stat cards en haut
│ │ Postes: 6/8     │ Solde: 553€│ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Lun 10 fév                       │
│ ┌──────────────────────────────┐ │
│ │ 🍔 Courses Carrefour   -67€ │ │ ← Chaque ligne = 1 transaction
│ │ Variable · Essentielle · 💳  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 🚗 Essence              -45€ │ │
│ │ Variable · Essentielle · 💳  │ │
│ └──────────────────────────────┘ │
│ Mar 11 fév                       │
│ ┌──────────────────────────────┐ │
│ │ 🐷 Virement épargne    +200€ │ │ ← Vert pour Épargne-Dette
│ │ Épargne-Dette · 🔄            │ │
│ └──────────────────────────────┘ │
│                                  │
│     [+ Nouvelle transaction]     │ ← FAB button
└──────────────────────────────────┘
```

**Filtres disponibles (bottom sheet) :**
- Par COICOP (8 checkboxes, compteur "3/8")
- Par Type (4 checkboxes colorés)
- Par Nature (radio : Toutes / Essentielle / Discrétionnaire)
- Par Moyen de paiement (4 checkboxes)
- Recherche texte (description)

---

### ÉCRAN 4 : Waterfall Distribution

```
┌──────────────────────────────────┐
│ ← Distribution Waterfall         │
├──────────────────────────────────┤
│                                  │
│  EPR Total : 342€               │
│                                  │
│  ┌────────────────────────────┐  │
│  │████████████████████████████│  │ ← Barre waterfall
│  │ P1:103€ │P2:120€│P3:68€│P4│  │    4 segments colorés
│  │  30%    │ 35%   │ 20%  │15│  │
│  └────────────────────────────┘  │
│                                  │
│  Configuration                   │
│  ┌────────────────────────────┐  │
│  │ P1 Urgence        ████ 30%│  │ ← 4 sliders
│  │ P2 Dette          █████35%│  │    La somme DOIT = 100%
│  │ P3 Investissement ███  20%│  │
│  │ P4 Plaisir        ██   15%│  │
│  │                            │  │
│  │ Total: 100% ✓              │  │ ← Validation en temps réel
│  └────────────────────────────┘  │
│                                  │
│  Détail par priorité             │
│  P1 Fonds d'Urgence    103,00€  │
│  P2 Remboursement      119,70€  │
│  P3 Investissement      68,40€  │
│  P4 Plaisir             51,30€  │
│  ─────────────────────────────   │
│  Total distribué       342,40€  │
│                                  │
│        [Valider distribution]    │
└──────────────────────────────────┘
```

---

### ÉCRAN 5 : Centre de Performance

```
┌──────────────────────────────────┐
│ Performance    ← Février 2026 → │
├──────────────────────────────────┤
│ ┌──────┐┌──────┐┌──────┐┌─────┐│
│ │1,247€││ 23tx ││ 6/8  ││553€ ││ ← 4 stat cards
│ │Dépens││Trans ││Postes││Solde││
│ └──────┘└──────┘└──────┘└─────┘│
├──────────────────────────────────┤
│ Sem│Budget│Dépens│ EPR │P1→│P2→│ ← Tableau 9 colonnes
│ 05 │ 450€ │ 380€ │ 42€│13€│15€│    (scroll horizontal)
│ 06 │ 450€ │ 420€ │ 38€│11€│13€│
│ 07 │ 450€ │ 347€ │ 52€│16€│18€│
│ 08 │ 450€ │  —   │  — │ — │ — │ ← Semaine en cours (partielle)
├──────────────────────────────────┤
│ Total mois    │ 1,147€ │ 132€  │ ← Ligne 1: Dépenses
│               │  EPR   │ Dist  │ ← Ligne 2: EPR
│ P1│ P2 │ P3 │ P4 │ EKH: 72%   │ ← Ligne 3: P1→P4 + EKH (jauge)
├──────────────────────────────────┤
│ Waterfall mensuel                │
│ ┌────────────────────────────┐   │
│ │████████████████████████████│   │ ← Barre waterfall agrégée
│ └────────────────────────────┘   │
│                                  │
│ Top 5 postes COICOP              │
│ 1. 🍔 Alimentation    280€ EPR  │
│ 2. 🚗 Transport       145€      │
│ 3. 🎭 Loisirs          95€      │
│ 4. 🏠 Logement (fixe)   0€      │
│ 5. 📦 Autres            32€     │
│                                  │
│ [Exporter rapport mensuel]       │
└──────────────────────────────────┘
```

---

### ÉCRAN 6 : Calendrier Performance (3 niveaux drill-down)

**Niveau 1 — Années :**
```
[2022] [2023] [2024] [2025] [2026]  ← Scroll horizontal
```

**Niveau 2 — Mois (tap sur 2026) :**
```
┌─────────────────────────────────┐
│ ← 2026                          │ ← Breadcrumb
├────────┬────────┬────────┬──────┤
│  Jan   │  Fév   │  Mars  │ Avr  │
│  B 7.2 │  A 8.1 │   —    │  —   │ ← Grade + score
│  vert  │  bleu  │  gris  │ gris │
├────────┼────────┼────────┼──────┤
│  Mai   │  Juin  │  Juil  │ Août │
│   —    │   —    │   —    │  —   │
├────────┼────────┼────────┼──────┤
│  Sep   │  Oct   │  Nov   │ Déc  │
│   —    │   —    │   —    │  —   │
└────────┴────────┴────────┴──────┘
```

**Niveau 3 — Semaines (tap sur Février) :**
```
┌─────────────────────────────────┐
│ ← 2026 > Février                │ ← Breadcrumb cliquable
├────────┬────────┬────────┬──────┤
│ Sem 05 │ Sem 06 │ Sem 07 │Sem 08│
│ 🔒     │ 🔒     │ 🔓     │ 🔓   │ ← Lock/unlock icon
│ 27 jan │ 3 fév  │ 10 fév │17 fé│
│  87%   │  92%   │  78%   │  —  │
│  A     │  A+    │  B     │  —  │ ← Grade badge
│ ✓      │ ✓      │ ⚠️     │     │ ← Waterfall validation
├────────┴────────┴────────┴──────┤
│ Sem 09 │                        │
│ 🔓     │                        │
│ 24 fév │                        │
│   —    │                        │
└────────┘                        │
```

**WeekCell (120×120px) :**
```
┌─────────────┐
│ 🔒          │  Lock/Unlock
│   Sem 07    │  Numéro semaine
│  10-16 fév  │  Dates
│    87%      │  Score EPR% ou Grade
│     A       │  Grade badge coloré
│         ✓   │  Waterfall validation
└─────────────┘
Couleurs de fond par grade :
A+/A → vert clair, B → bleu clair, C → jaune clair, D → orange clair, E → rouge clair, — → gris
```

---

### ÉCRAN 7 : Profil Financier

**12 types de profils :**
```
Salarié, Freelance, Entrepreneur, Retraité, Étudiant, Fonctionnaire,
Intérimaire, Artisan, Agriculteur, Profession Libérale, Cadre Dirigeant, Sans Emploi
```

**Formulaire :**
- Type de profil (picker 12 options)
- Situation familiale (Célibataire, Marié, PACS, Divorcé, Veuf)
- Nombre de personnes à charge (0-10, stepper)
- Pays (France par défaut, picker 48 pays)
- Devise (EUR par défaut, picker 48 devises)
- Âge (number input)
- Horizon de planification (picker : 1, 3, 5, 10, 20, 30 ans)

---

### ÉCRAN 8 : Configuration Flexibilité (F1/F2/F3)

Pour chaque catégorie COICOP N2, afficher :
```
┌────────────────────────────────────┐
│ 01.1 Produits alimentaires         │
├────────────────────────────────────┤
│ F1 Fréquence        ████████░░  16│ ← Slider 0-21
│ F2 Modifiabilité    ██████░░░░  12│ ← Slider 0-21
│ F3 Substituabilité  ████████░░  15│ ← Slider 0-21
│                                    │
│ Score: (16+12+15)/63 = 68.3%      │ ← Calcul en temps réel
│ ┌──────────────────────────────┐   │
│ │████████████████████░░░░░░░░░│   │ ← Jauge (vert car >66%)
│ └──────────────────────────────┘   │
│                                    │
│ Taux d'incompressibilité: 45%     │ ← Slider 0-100%
│ Type: [Fixe ○] [Variable ●]       │
│ Nature: [Essentielle ●] [Discr ○] │
└────────────────────────────────────┘
```

---

## ÉCRANS DE REPORTING (Pages 7-15)

### Page 7 — Dashboard complet (6 KPI + Radar 5D)
- 6 KPICards (voir Dashboard ci-dessus)
- Radar 5D : Stabilité revenus, Maîtrise budgétaire, Compétence financière, Capacité épargne, Couverture risque
- Chaque axe 0-100%

### Page 8 — Plan d'optimisation 3 ans
- Timeline horizontale : An 1 (5-8%) → An 2 (8-10%) → An 3 (10-11%)
- Cascade par année avec progression
- Bouton simulation "Et si..."

### Page 9 — Épargne par levier
- 5 cartes (1 par levier actif) avec montant EPR, courbe progression 36m

### Page 10 — Ventilation économique
- Matrice : 5 leviers × 8 COICOP × 36 mois (onglets pour naviguer)

### Page 11 — Évolution des pertes
- 3 sections : Historique, Projeté, Marges VaR/PRL

### Page 12 — Plan détaillé 36 mois
- Hiérarchie 3 niveaux : Leviers → Postes → Mensuel
- 36 cellules avec annotations

### Page 13 — Calendrier d'épargne
- Calendrier 36 mois, progression 5%→11%
- Export iCal, export PDF

### Page 14 — Actions prioritaires
- Sélecteur année (1/2/3), top 10 actions par année
- Effort (1-5 étoiles), impact, statut, dates

### Page 15 — Rapport global
- 9 sections + Résumé exécutif
- Radar 5D complet
- Score /100 + Grade
- Export PDF

---

## INTERACTIONS MOBILE

### Touch
- **Tap** : Sélection (44×44px minimum touch target WCAG)
- **Long press** : Menu contextuel (1 sec) — lock/unlock semaine, supprimer transaction
- **Swipe gauche** : Supprimer (avec confirmation)
- **Swipe droite** : Éditer
- **Pull-to-refresh** : Sync avec Supabase

### Animations (React Native Reanimated)
- Transitions entre niveaux calendrier : 300ms, scale/fade
- Ouverture bottom sheet : spring animation
- KPI cards : fadeInUp au chargement (staggered 100ms)
- Waterfall bars : animateWidth de 0% à valeur en 500ms
- Grade badge : pulse sur changement de grade
- Respecter `prefers-reduced-motion`

### Haptic Feedback
- Validation transaction : vibration succès
- Lock/Unlock semaine : vibration légère
- Erreur : vibration erreur

---

## ACCESSIBILITÉ (WCAG 2.1 Level AA)

- Contraste minimum 4.5:1 (texte normal), 3:1 (texte large)
- Tous les éléments interactifs : aria-label en français
- VoiceOver (iOS) / TalkBack (Android) : 100% navigable
- Support text scaling 100%-200%
- Focus indicators visibles
- Pas d'information transmise uniquement par la couleur (toujours icône + texte)

---

## OFFLINE-FIRST

- Toute saisie de transaction fonctionne SANS internet
- Données stockées localement (expo-sqlite)
- Sync automatique au retour de connexion
- Indicateur de statut sync dans le header : 🟢 En ligne / 🟡 Sync en cours / 🔴 Hors ligne
- Toast "Données synchronisées" après sync réussie

---

## DONNÉES EXISTANTES (State Stores Zustand)

Les stores suivants existent déjà dans `src/stores/` :
```typescript
// profile-store.ts  → profile: Profile | null
// transaction-store.ts → transactions: Transaction[], currentWeek: number
// engine-store.ts → engineOutput: EngineOutput | null
// performance-store.ts → weeklyPerformance: WeeklyPerformance[]
// auth.store.ts → user, session, isAuthenticated
// app.store.ts → theme, locale, isOnline, syncStatus
```

---

## FORMULES DE CALCUL (pour affichage dans les écrans)

### EPR par transaction
```
EPR = montant × (1 - taux_incompressibilité/100) × (score_flexibilité/100)
```

### Score hebdomadaire /10
```
Score = (EKH/100 × 4) + (completionRate/100 × 3) + (budgetRespect/100 × 2) + (eprVariation/100 × 1)
```

### Flexibilité
```
Score = (F1 + F2 + F3) / 63 × 100
```

### Taux de réduction
```
Taux = (EPR_total / Total_Dépenses) × 100
```

### Note /10 (Page 15)
```
Note = (économies / objectif) × 10
```

---

## CONVENTIONS DE CODE

```typescript
// Fichiers : kebab-case (waterfall-distributor.ts)
// Composants : PascalCase (WaterfallChart.tsx)
// Hooks : use prefix (useTransactions.ts)
// Stores : camelCase + store suffix (transactionStore)
// Screens : PascalCase + Screen suffix (DashboardScreen)
// Constants : SCREAMING_SNAKE (COICOP_CATEGORIES)
// Fonctions : camelCase (calculateEPR, distributeWaterfall)
// Montants : TOUJOURS en centimes (integer), affichage via formatCurrency()
// Dates : ISO 8601 (string), semaines ISO (2026-W07)
```

---

## CE QUI EXISTE DÉJÀ (NE PAS RECRÉER)

```
✅ package.json, tsconfig.json, app.json, babel.config.js
✅ .eslintrc.js, .prettierrc, .gitignore, .editorconfig
✅ src/types/database.ts (16 interfaces)
✅ src/types/engine.ts (types moteur)
✅ src/domain/engine/personal-finance-engine.ts (moteur 10 étapes COMPLET)
✅ src/domain/calculators/ (EPR, Score, Waterfall, Flexibility)
✅ src/domain/validators/business-rules.ts
✅ src/infrastructure/supabase/client.ts + config.ts
✅ src/infrastructure/events/calendar-event-bus.ts
✅ src/stores/ (6 stores Zustand)
✅ src/theme/ (colors, typography)
✅ src/i18n/ (config + fr.json)
✅ src/utils/ (format, constants, errors, validation)
✅ supabase/migrations/ (16 tables SQL)
✅ __tests__/unit/ (4 fichiers de tests)
✅ .github/workflows/ci.yml
```

**CE QUI RESTE À CRÉER : les écrans, composants UI, navigation complète, et interactions.**

---

## SUPABASE

- **Project ID** : ghkywsxyfrrdcxyrxnjj
- **URL** : https://ghkywsxyfrrdcxyrxnjj.supabase.co
- **Anon Key** : à configurer dans .env
- **16 tables** : migrations prêtes dans supabase/migrations/
- **RLS** : activé sur toutes les tables (auth.uid() = user_id)

---

## ORDRE DE DÉVELOPPEMENT RECOMMANDÉ

1. **D'abord** : Composants UI réutilisables (KPICard, GradeBadge, TransactionTypeBadge, etc.)
2. **Ensuite** : Auth (login, biometric, PIN)
3. **Puis** : Dashboard (6 KPI cards avec données mock puis réelles)
4. **Puis** : Transaction wizard (3 étapes)
5. **Puis** : Journal des transactions (liste + filtres)
6. **Puis** : Performance center (tableau 9 colonnes + waterfall)
7. **Puis** : Calendrier (3 niveaux drill-down)
8. **Enfin** : Reporting pages (P7-P15)

---

**IMPORTANT : Avant de coder chaque écran, relis les règles métier concernées. Une erreur sur EKH, les types de transactions, ou le waterfall serait critique.**
