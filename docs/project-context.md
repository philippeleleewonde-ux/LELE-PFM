# HCM-PORTAL V2 - Project Context

> **Document généré par**: Mary (Business Analyst Agent - BMAD)
> **Date**: 6 Janvier 2026
> **Version**: 1.0.0

---

## 1. Vue d'Ensemble du Projet

### 1.1 Description
**HCM-PORTAL V2** est une plateforme SaaS complète de **Human Capital Management** (Gestion du Capital Humain) et de comptabilité, conçue pour la gestion des données financières d'entreprise avec une architecture modulaire supportant de multiples processus métier.

### 1.2 Informations Clés

| Attribut | Valeur |
|----------|--------|
| **Nom du Projet** | HCM-PORTAL V2 |
| **Type** | Application Web SaaS B2B |
| **Domaine** | HCM / Finance / Comptabilité |
| **Statut** | Production |
| **Marque** | LELE HCM |

### 1.3 Objectifs Métier
- Gestion des employés et équipes
- Analyse des coûts de main-d'œuvre
- Suivi des indicateurs de performance (KPIs)
- Calcul des économies de coûts
- Extraction automatisée de données financières
- Tableaux de bord exécutifs avec insights IA

---

## 2. Stack Technique

### 2.1 Frontend
| Technologie | Version | Rôle |
|-------------|---------|------|
| **React** | 18.3.1 | Framework UI |
| **TypeScript** | 5.8.3 | Typage strict |
| **Vite** | 5.4.19 | Build tool |
| **React Router** | 6.30.1 | Routing |

### 2.2 UI & Styling
| Technologie | Version | Rôle |
|-------------|---------|------|
| **Tailwind CSS** | 3.4.17 | Styling |
| **Radix UI** | Latest | Composants accessibles |
| **Shadcn/ui** | Latest | Design system |
| **Framer Motion** | 12.23.24 | Animations |
| **Lucide React** | 0.462.0 | Icônes |

### 2.3 State Management & Data
| Technologie | Version | Rôle |
|-------------|---------|------|
| **TanStack Query** | 5.83.0 | Server state |
| **React Hook Form** | 7.61.1 | Forms |
| **Zod** | 3.25.76 | Validation |
| **Context API** | Built-in | Client state |

### 2.4 Backend & Database
| Technologie | Version | Rôle |
|-------------|---------|------|
| **Supabase** | 2.76.1 | BaaS (PostgreSQL) |
| **Auth** | Supabase Auth | Authentication |
| **Real-time** | Supabase Subscriptions | Live updates |

### 2.5 Fonctionnalités Avancées
| Technologie | Rôle |
|-------------|------|
| **pdfjs-dist** | Traitement PDF |
| **Tesseract.js** | OCR |
| **Recharts** | Graphiques |
| **XLSX** | Export Excel |
| **Google Generative AI** | Insights IA |
| **Sentry** | Error tracking |

---

## 3. Architecture du Projet

### 3.1 Structure des Dossiers

```
HCM-PORTAL V2/
├── src/
│   ├── app/api/                 # API Routes (DataScanner)
│   ├── components/              # 100 composants UI
│   │   ├── ui/                  # 52 composants Shadcn/Radix
│   │   ├── layout/              # Header, Sidebar, Footer
│   │   ├── dashboard/           # Widgets dashboard
│   │   ├── datascanner-v2/      # Composants extraction
│   │   └── shared/              # Composants partagés
│   ├── modules/                 # 155 fichiers métier
│   │   ├── module1/             # 71 fichiers - Core HCM
│   │   ├── module3/             # 53 fichiers - Cost Savings
│   │   └── datascanner/         # 31 fichiers - Extraction
│   ├── pages/                   # 33 pages
│   ├── hooks/                   # 15 hooks custom
│   ├── lib/                     # 16 utilitaires
│   ├── contexts/                # 6 providers React
│   ├── types/                   # Définitions TypeScript
│   ├── integrations/supabase/   # Client Supabase + types
│   └── styles/                  # CSS global
├── docs/                        # Documentation
├── public/                      # Assets statiques
├── supabase/                    # Config Supabase
└── _bmad/                       # Framework BMAD agents
```

### 3.2 Statistiques du Code

| Catégorie | Fichiers |
|-----------|----------|
| **Total Source** | 351 |
| Composants | 100 |
| Pages | 33 |
| Hooks | 15 |
| Utilitaires | 16 |
| Contexts | 6 |
| Types | 6 |
| **Modules Métier** | 155 |

---

## 4. Modules Métier

### 4.1 Module 1 - Core HCM (71 fichiers)

**Chemin**: `/src/modules/module1/`

**Fonctionnalités**:
- Gestion des employés et équipes
- Configuration des lignes d'activité (Business Lines)
- Analyse des coûts de main-d'œuvre
- Suivi des indicateurs de performance
- Profil entreprise et paramètres PPR

**Structure**:
```
module1/
├── Module1Main.tsx
├── Module1Router.tsx
├── components/          # 19 sous-dossiers
├── lib/                 # 7 services
├── services/
├── hooks/
├── types/
├── pages/
└── utils/
```

**Entités principales**:
- `business_lines` - Lignes d'activité
- `company_profile` - Profil entreprise
- `company_ppr_settings` - Objectifs PPR hebdomadaires
- `employees` - Employés
- `teams` - Équipes

### 4.2 Module 3 - HCM Cost Savings (53 fichiers)

**Chemin**: `/src/modules/module3/`

**Fonctionnalités**:
- Saisie des coûts par indicateur (CostDataEntry)
- Moteur de calcul des performances (CalculationEngine)
- Récapitulatif des performances réalisées
- Centre de performance global
- Reporting des économies de coûts
- Calendrier de suivi des performances
- Distribution des primes

**Pages Principales**:
1. `CostDataEntry.tsx` - Saisie des coûts
2. `DataAlignmentPage.tsx` - Alignement données
3. `CostRecapByEmployeePage.tsx` - Récap par employé
4. `PerformanceRecapPage.tsx` - Récap performances (Moteur)
5. `CostSavingsReportingPage.tsx` - Tableau de bord
6. `PerformanceCenterPage.tsx` - Centre de performance
7. `GlobalPerformanceCenterPage.tsx` - Vue globale
8. `PerformanceCalendarPage.tsx` - Calendrier

**Indicateurs KPI**:
| Code | Indicateur |
|------|------------|
| ABS | Absentéisme |
| QD | Défauts Qualité |
| OA | Accidents de Travail |
| DDP | Écart de Productivité Directe |
| EKH | Écart de Know-How |

**Calcul des Économies**:
```
Économie = Objectif PPR - Coût Réel Saisi
```

### 4.3 Module DataScanner (31 fichiers)

**Chemin**: `/src/modules/datascanner/`

**Fonctionnalités**:
- Upload et traitement de documents
- OCR avec Tesseract.js
- Extraction PDF avec pdfjs-dist
- Traitement par zones (Zone 1 implémentée)
- Validation et regroupement automatique

**API Endpoints**:
```
POST /api/datascanner/jobs/[jobId]/zones/1/validate
POST /api/datascanner/jobs/[jobId]/zones/1/extract
POST /api/datascanner/jobs/[jobId]/zones/1/calculate
POST /api/datascanner/jobs/[jobId]/zones/1/regroup
```

---

## 5. Services & Intégrations

### 5.1 Supabase

**Tables Principales**:
- `companies` - Entreprises (multi-tenant)
- `profiles` - Profils utilisateurs
- `business_lines` - Lignes d'activité
- `employees` - Employés
- `teams` - Équipes
- `company_ppr_settings` - Objectifs PPR
- `company_performance_scores` - Scores calculés
- `module3_cost_entries` - Saisies de coûts

**Sécurité**:
- Row-Level Security (RLS) activé
- Isolation par `company_id`
- Rôles: CEO, Manager, Employee, Banker

### 5.2 Smart Calendar (LaunchDateService)

**Chemin**: `/src/lib/fiscal/LaunchDateService.ts`

**Fonctionnalités**:
- Gestion de la date de lancement plateforme
- Calcul des semaines fiscales
- Verrouillage CASCADE des périodes
- `getLastCompletedWeek()` - Dernière semaine avec données

### 5.3 Performance Data Context

**Chemin**: `/src/modules/module3/contexts/PerformanceDataContext.tsx`

**Rôle**: Partage des données entre pages du module 3 via localStorage

---

## 6. Patterns d'Architecture

### 6.1 State Management

```
┌─────────────────────────────────────────┐
│          React Context API              │
├─────────────────────────────────────────┤
│ AuthContext    │ CompanyContext         │
│ ThemeContext   │ SidebarContext         │
│ PerformanceDataContext                  │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│         TanStack React Query            │
│    (Server State + Caching)             │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│           Supabase Client               │
│    (PostgreSQL + Real-time)             │
└─────────────────────────────────────────┘
```

### 6.2 Structure Module Standard

```
moduleX/
├── ModuleXMain.tsx        # Entry point
├── ModuleXRouter.tsx      # Routes
├── components/            # UI spécifique
├── hooks/                 # Hooks custom
├── lib/                   # Services & utils
├── pages/                 # Pages du module
├── services/              # API integration
├── types/                 # TypeScript types
└── utils/                 # Helpers
```

### 6.3 Flux de Données Module 3

```
CostDataEntry (Saisie)
       │
       ▼ (module3_cost_entries)
PerformanceRecapPage (Moteur de Calcul)
       │
       ▼ (localStorage)
┌──────┴──────┐
│             │
▼             ▼
CostSavingsReporting    GlobalPerformanceCenter
       │
       ▼
PerformanceCalendarPage
```

---

## 7. Configuration & Build

### 7.1 Vite Configuration

**Optimisations**:
- Manual chunk splitting (7 vendors)
- PDF.js et Tesseract Web Workers
- esbuild minification
- Port: 8080

**Chunks**:
- `vendor-react`
- `vendor-ui`
- `vendor-query`
- `vendor-supabase`
- `vendor-forms`
- `vendor-charts`
- `vendor-utils`

### 7.2 TypeScript

- **Mode Strict**: Activé
- **No Implicit Any**: Activé
- **Path Alias**: `@/*` → `./src/*`

### 7.3 Tailwind

**Thème Custom**:
- Couleurs HCM (cyan, navy)
- Couleurs sidebar
- Couleurs charts
- Animations custom

---

## 8. Rôles Utilisateurs

| Rôle | Accès |
|------|-------|
| **CEO** | Dashboard complet, tous modules |
| **Manager** | Module 1, Module 3 |
| **Employee** | Vue limitée |
| **Banker** | Module Banker spécifique |

---

## 9. Conventions de Développement

### 9.1 Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `CostDataEntry.tsx` |
| Hooks | camelCase + use | `usePerformanceData.ts` |
| Services | camelCase | `launchDateService.ts` |
| Types | PascalCase | `WeekData` |
| Constantes | SCREAMING_SNAKE | `CURRENCY_CONFIG` |

### 9.2 Structure Fichier Composant

```tsx
// 1. Imports
import React from 'react';
import { ... } from '@/components/ui';

// 2. Types
interface Props { ... }

// 3. Constantes
const THRESHOLD = 95;

// 4. Composant
export const MyComponent = ({ ... }: Props) => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
};
```

### 9.3 Git Workflow

- Branches: `feature/`, `fix/`, `refactor/`
- Commits: Convention conventionnelle
- PR: Review obligatoire

---

## 10. Points d'Extension

### 10.1 Ajouter un Module

1. Créer `/src/modules/moduleX/`
2. Suivre la structure standard
3. Ajouter les routes dans `App.tsx`
4. Créer les types dans `/types/modules.ts`

### 10.2 Ajouter un Indicateur KPI

1. Ajouter dans `INDICATOR_CONFIGS` (Module 3)
2. Mettre à jour `company_ppr_settings` (Supabase)
3. Ajouter dans `CostDataEntry`
4. Mettre à jour le moteur de calcul

### 10.3 Ajouter une Page

1. Créer le fichier dans `/pages/` ou `/modules/moduleX/pages/`
2. Ajouter la route
3. Créer les composants nécessaires

---

## 11. Dépendances Critiques

| Package | Usage | Criticité |
|---------|-------|-----------|
| `@supabase/supabase-js` | Backend | Haute |
| `@tanstack/react-query` | Data fetching | Haute |
| `react-router-dom` | Navigation | Haute |
| `react-hook-form` + `zod` | Forms | Moyenne |
| `recharts` | Graphiques | Moyenne |
| `framer-motion` | Animations | Basse |

---

## 12. Contacts & Ressources

### Documentation
- `/docs/` - Documentation projet
- `/_bmad/docs/` - Documentation BMAD

### Environnements
- **Dev**: `localhost:8080`
- **Prod**: Supabase hosted

---

*Document maintenu par l'équipe BMAD. Dernière mise à jour: 6 Janvier 2026*
