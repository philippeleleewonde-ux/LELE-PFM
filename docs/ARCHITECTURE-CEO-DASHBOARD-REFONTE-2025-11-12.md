# Architecture CEO Dashboard - Refonte Complète 2025-11-12

> **Skill utilisé** : elite-frontend-auditor
> **Objectif** : Transformer le dashboard CEO d'un "menu de restaurant" en "Executive Command Center"

---

## 🔥 VÉRITÉ DURE (Audit du code existant)

### Problèmes identifiés dans `/src/pages/dashboards/CEODashboard.tsx`

❌ **Dashboard générique** : 4 cartes avec des valeurs hardcodées (95%, 12 équipes, +24%)
❌ **Pas de hiérarchie d'information** : Tout au même niveau, pas de priorité visuelle
❌ **Pas de health score global** : CEO ne sait pas en 1 coup d'œil si tout va bien
❌ **Pas d'IA insights** : Aucune recommandation automatique
❌ **Pas de data fetching réel** : Valeurs statiques, pas connectées au backend
❌ **Abonnement mal placé** : Simple bouton dans sidebar, pas visible
❌ **Pas mobile-optimisé** : Layout desktop-first, pas thumb-friendly
❌ **Module 2 (Satisfaction) ignoré** : CEO n'a pas accès selon permissions, mais devrait avoir un aperçu agrégé

### Permissions CEO actuelles (selon `/src/types/modules.ts`)

```typescript
CEO: {
  1: { canRead: true, canWrite: true, canAdmin: true },   // ✅ Performance Plan
  2: { canRead: false, canWrite: false, canAdmin: false }, // ❌ Satisfaction (PROBLÈME)
  3: { canRead: true, canWrite: true, canAdmin: true },   // ✅ Cost Savings
  4: { canRead: true, canWrite: true, canAdmin: true }    // ✅ Performance Card
}
```

**DÉCISION ARCHITECTURE** : CEO doit avoir un **aperçu agrégé** de Module 2 (satisfaction globale) même s'il ne peut pas accéder aux détails individuels.

---

## 🧠 ANALYSE DES CAUSES PROFONDES

### Stratégique
- **Persona CEO mal défini** : Un CEO ne veut pas "accéder aux modules", il veut **prendre des décisions rapides**
- **Pas de vision "Executive Command Center"** : Le dashboard actuel est une liste, pas un centre de contrôle
- **Pas de distinction Information → Insight → Action** : Tout est mélangé

### Technique
- **Architecture plate** : Pas de composition de composants (tout dans 1 fichier de 208 lignes)
- **Pas de data layer** : Aucun hook custom, pas de React Query
- **Pas de type safety** : Valeurs hardcodées, pas de types pour la data
- **Pas d'orchestration modules** : Les 4 modules sont isolés, pas d'agrégation cross-module

### Business Impact
- **Temps avant insight = perte de revenus** : Si CEO met 2 minutes à comprendre un problème RH → décision retardée → impact business
- **Pas de rétention CEO** : Dashboard générique = commodité = churn
- **Pas de wow effect** : LELE HCM a gagné World Finance Awards 2025, l'UI doit le refléter

---

## ⚡ ARCHITECTURE PROPOSÉE : "Executive Command Center"

### Vision cible

```
┌─────────────────────────────────────────────────────────────┐
│  LELE HCM  |  ACME Corp (247 employés)  |  [Pro] [Avatar]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🎯 SANTÉ GLOBALE : 78/100 📈                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🟢 Module 1 - Performance Plan      : 82/100  ↗️    │  │
│  │  🟡 Module 2 - Employee Satisfaction : 71/100  ⚠️    │  │
│  │  🟢 Module 3 - Cost Savings          : 85/100  ↗️    │  │
│  │  🟢 Module 4 - Performance Card      : 79/100  ↗️    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  🤖 LELE IA - INSIGHTS AUTOMATIQUES                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ⚠️ Turnover marketing +12% vs Q3                     │  │
│  │     → Action : [Lancer enquête] [Voir détails]       │  │
│  │  💎 Économies 37k€ détectées (flex-time)             │  │
│  │     → Action : [Simuler scénario]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📊 MÉTRIQUES CLÉS (30J)                                    │
│  Turnover    Engagement    Coût/Emp      Perf Moy          │
│  8.2% ↘️     72% ↗️        4.2k€ ↘️      78% →              │
│                                                              │
│  🎬 ACTIONS RAPIDES                                         │
│  [📄 Export Board] [📊 Reporting] [⚙️ Abonnement]          │
└─────────────────────────────────────────────────────────────┘
```

### Hiérarchie d'information (Executive Pyramid)

```
        1s → Health Score (78/100)
              │
        10s → AI Insights (2 alerts)
              │
        30s → Quick Metrics (4 KPIs)
              │
        1min → Module Previews (4 modules)
              │
      5-10min → Deep Dive (pages modules)
```

---

## 📂 STRUCTURE DE FICHIERS (Nouvelle architecture)

```
/src
  /pages
    /dashboards
      /CEODashboard.tsx                 → Page principale (orchestrateur)

  /components
    /dashboard
      /ceo
        /HealthScoreCard.tsx            → Score santé global 78/100
        /AIInsightsPanel.tsx            → Panel insights IA
        /AIInsightCard.tsx              → Carte insight individuelle
        /QuickMetrics.tsx               → 4 métriques clés (grid)
        /ModuleQuickView.tsx            → Preview module (réutilisable)
        /QuickActionsBar.tsx            → Actions rapides (export, etc.)

    /subscription
      /SubscriptionBadge.tsx            → Badge [Pro] dans header
      /SubscriptionModal.tsx            → Modal gestion abonnement

    /reporting
      /QuickExportButton.tsx            → Export rapide PDF/Excel
      /ReportingModal.tsx               → Modal reporting avancé

  /hooks
    /dashboard
      /useCEODashboard.ts               → Hook principal (data fetching)
      /useHealthScore.ts                → Fetch health score
      /useAIInsights.ts                 → Fetch AI insights
      /useQuickMetrics.ts               → Fetch quick metrics
      /useModulesPreviews.ts            → Fetch aperçus modules

  /types
    /dashboard.ts                       → Types CEO dashboard
    /ai-insights.ts                     → Types AI insights

  /lib
    /api
      /ceo-dashboard.ts                 → API calls CEO dashboard
```

---

## 🎨 COMPOSANTS DÉTAILLÉS

### 1. HealthScoreCard.tsx

**Rôle** : Afficher le score santé global de l'entreprise (agrégation 4 modules)

```typescript
interface HealthScoreData {
  overall: number;           // 0-100
  trend: 'up' | 'down' | 'stable';
  modules: {
    module1: { score: number; trend: 'up' | 'down' | 'stable'; alert: boolean };
    module2: { score: number; trend: 'up' | 'down' | 'stable'; alert: boolean };
    module3: { score: number; trend: 'up' | 'down' | 'stable'; alert: boolean };
    module4: { score: number; trend: 'up' | 'down' | 'stable'; alert: boolean };
  };
}

<HealthScoreCard
  data={healthScore}
  loading={isLoading}
/>
```

**UI** :
- Gros chiffre 78/100 centré
- Progress bar circulaire (Chart.js ou Recharts)
- 4 sous-scores modules avec icônes
- Couleurs : 🟢 vert (>75), 🟡 jaune (60-75), 🔴 rouge (<60)

---

### 2. AIInsightsPanel.tsx

**Rôle** : Afficher 2-3 insights IA prioritaires (alerts + opportunities)

```typescript
interface AIInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'info';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  actions: AIInsightAction[];
  moduleId?: ModuleNumber;
}

interface AIInsightAction {
  label: string;
  type: 'primary' | 'secondary';
  onClick: () => void;
}

<AIInsightsPanel
  insights={aiInsights}
  onDismiss={(id) => dismissInsight(id)}
/>
```

**UI** :
- Carte par insight
- Icône selon type (⚠️ alert, 💎 opportunity, ℹ️ info)
- Actions CTA (boutons)
- Dismissible (croix en haut à droite)

---

### 3. QuickMetrics.tsx

**Rôle** : Afficher 4 KPIs essentiels CEO (30 derniers jours)

```typescript
interface QuickMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  change?: string;        // "+12%" ou "-5%"
  good: boolean;          // trend up = good ou bad selon métrique
}

interface QuickMetricsData {
  turnover: QuickMetric;
  engagement: QuickMetric;
  costPerEmployee: QuickMetric;
  avgPerformance: QuickMetric;
}

<QuickMetrics data={metrics} />
```

**Métriques** :
1. **Turnover** : 8.2% (↘️ bon si baisse)
2. **Engagement** : 72% (↗️ bon si hausse)
3. **Coût/Employé** : 4.2k€ (↘️ bon si baisse)
4. **Performance Moy** : 78% (→ stable)

**UI** : Grid 2x2 (mobile) ou 1x4 (desktop)

---

### 4. ModuleQuickView.tsx

**Rôle** : Preview d'un module (réutilisable pour les 4 modules)

```typescript
interface ModulePreviewData {
  moduleId: ModuleNumber;
  score: number;              // 0-100
  trend: 'up' | 'down' | 'stable';
  alert: boolean;
  lastUpdate: string;         // "Il y a 2h"
  keyMetric?: {               // Métrique clé custom par module
    label: string;
    value: string | number;
  };
}

<ModuleQuickView
  data={modulePreview}
  onClick={() => navigate(`/modules/module${moduleId}`)}
/>
```

**UI** :
- Score (82/100)
- Tendance (↗️ ↘️ →)
- Alerte si problème (⚠️ badge rouge)
- Métrique clé (ex: "12 plans en cours" pour Module 1)
- Hover effect + cursor pointer
- Click → navigate vers page module

---

### 5. QuickActionsBar.tsx

**Rôle** : Barre d'actions rapides (export, reporting, abonnement)

```typescript
<QuickActionsBar>
  <QuickExportButton formats={['PDF', 'Excel', 'PowerPoint']} />
  <Button onClick={() => openReportingModal()}>📊 Reporting</Button>
  <Button onClick={() => openSubscriptionModal()}>⚙️ Abonnement</Button>
</QuickActionsBar>
```

**UI** : Flex row avec gap-4, responsive (stack vertical sur mobile)

---

### 6. SubscriptionBadge.tsx (Header)

**Rôle** : Badge abonnement toujours visible dans header

```typescript
interface SubscriptionData {
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'active' | 'trial' | 'expired';
  daysRemaining?: number;     // Si trial
  usage: {
    employees: number;
    limit: number;
    modules: ModuleNumber[];
    aiCredits: number;
    aiLimit: number;
  };
}

<SubscriptionBadge
  subscription={subscription}
  onClick={() => openSubscriptionModal()}
/>
```

**UI** :
- Badge pill `[Pro]` avec couleur selon plan
- Si trial : afficher "7 jours restants"
- Hover → tooltip avec usage
- Click → ouvre modal

---

## 🔧 HOOKS DATA FETCHING

### useCEODashboard.ts (Hook principal)

```typescript
export const useCEODashboard = () => {
  const { user } = useAuth();

  // Fetch parallèle de toutes les données CEO
  const { data: healthScore, isLoading: loadingHealth } = useQuery({
    queryKey: ['ceo', 'health-score', user?.company_id],
    queryFn: () => fetchHealthScore(user?.company_id),
    refetchInterval: 60000, // Refresh toutes les 60s
    staleTime: 30000
  });

  const { data: aiInsights, isLoading: loadingAI } = useQuery({
    queryKey: ['ceo', 'ai-insights', user?.company_id],
    queryFn: () => fetchAIInsights(user?.company_id),
    refetchInterval: 60000
  });

  const { data: quickMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['ceo', 'quick-metrics', user?.company_id],
    queryFn: () => fetchQuickMetrics(user?.company_id),
    refetchInterval: 60000
  });

  const { data: modulesPreviews, isLoading: loadingModules } = useQuery({
    queryKey: ['ceo', 'modules-previews', user?.company_id],
    queryFn: () => fetchModulesPreviews(user?.company_id),
    refetchInterval: 60000
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.company_id],
    queryFn: () => fetchSubscription(user?.company_id)
  });

  const isLoading = loadingHealth || loadingAI || loadingMetrics || loadingModules;

  return {
    healthScore,
    aiInsights,
    quickMetrics,
    modulesPreviews,
    subscription,
    isLoading
  };
};
```

### API Endpoints requis (Backend)

```
GET /api/ceo/dashboard?company_id=xxx

Response:
{
  "healthScore": {
    "overall": 78,
    "trend": "up",
    "modules": {
      "module1": { "score": 82, "trend": "up", "alert": false },
      "module2": { "score": 71, "trend": "down", "alert": true },
      "module3": { "score": 85, "trend": "up", "alert": false },
      "module4": { "score": 79, "trend": "stable", "alert": false }
    }
  },
  "aiInsights": [
    {
      "id": "insight-1",
      "type": "alert",
      "priority": "high",
      "title": "Turnover marketing en hausse (+12% vs Q3)",
      "description": "Le département Marketing montre des signes de turnover accru",
      "recommendation": "Lancer une enquête de satisfaction ciblée",
      "actions": [
        { "label": "Lancer enquête", "type": "primary" },
        { "label": "Voir détails", "type": "secondary" }
      ],
      "moduleId": 2
    }
  ],
  "quickMetrics": {
    "turnover": { "value": 8.2, "unit": "%", "trend": "down", "change": "-1.2%", "good": true },
    "engagement": { "value": 72, "unit": "%", "trend": "up", "change": "+3%", "good": true },
    "costPerEmployee": { "value": 4200, "unit": "€", "trend": "down", "change": "-5%", "good": true },
    "avgPerformance": { "value": 78, "unit": "%", "trend": "stable", "change": "0%", "good": true }
  },
  "modulesPreviews": {
    "module1": {
      "score": 82,
      "trend": "up",
      "alert": false,
      "lastUpdate": "Il y a 2h",
      "keyMetric": { "label": "Plans actifs", "value": 12 }
    },
    // ... modules 2, 3, 4
  },
  "subscription": {
    "plan": "Pro",
    "status": "active",
    "usage": {
      "employees": 247,
      "limit": 500,
      "modules": [1, 2, 3, 4],
      "aiCredits": 1200,
      "aiLimit": 2000
    }
  }
}
```

---

## 📊 TYPES TYPESCRIPT

### /src/types/dashboard.ts

```typescript
import { ModuleNumber } from './modules';

export interface HealthScoreData {
  overall: number;
  trend: 'up' | 'down' | 'stable';
  modules: Record<ModuleNumber, ModuleHealthScore>;
}

export interface ModuleHealthScore {
  score: number;
  trend: 'up' | 'down' | 'stable';
  alert: boolean;
}

export interface AIInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'info';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  actions: AIInsightAction[];
  moduleId?: ModuleNumber;
  createdAt: string;
}

export interface AIInsightAction {
  label: string;
  type: 'primary' | 'secondary';
  action: string;  // Action ID pour backend tracking
}

export interface QuickMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  change?: string;
  good: boolean;
}

export interface QuickMetricsData {
  turnover: QuickMetric;
  engagement: QuickMetric;
  costPerEmployee: QuickMetric;
  avgPerformance: QuickMetric;
}

export interface ModulePreviewData {
  moduleId: ModuleNumber;
  score: number;
  trend: 'up' | 'down' | 'stable';
  alert: boolean;
  lastUpdate: string;
  keyMetric?: {
    label: string;
    value: string | number;
  };
}

export interface SubscriptionData {
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'active' | 'trial' | 'expired';
  daysRemaining?: number;
  usage: {
    employees: number;
    limit: number;
    modules: ModuleNumber[];
    aiCredits: number;
    aiLimit: number;
  };
}

export interface CEODashboardData {
  healthScore: HealthScoreData;
  aiInsights: AIInsight[];
  quickMetrics: QuickMetricsData;
  modulesPreviews: Record<ModuleNumber, ModulePreviewData>;
  subscription: SubscriptionData;
}
```

---

## 🎯 INTÉGRATION DES ÉLÉMENTS

### 1. Intégration des 4 Modules

**Principe** : Progressive Disclosure

**Niveau 1 - Dashboard CEO** : Preview cards (score + trend + 1 métrique clé)
**Niveau 2 - Page module** : Vue détaillée complète

```typescript
// Dashboard CEO
<ModuleQuickView
  data={{
    moduleId: 1,
    score: 82,
    trend: 'up',
    alert: false,
    lastUpdate: "Il y a 2h",
    keyMetric: { label: "Plans actifs", value: 12 }
  }}
  onClick={() => navigate('/modules/module1')}
/>
```

**Spécificité Module 2 (Satisfaction)** :
- CEO n'a pas `canRead` selon permissions actuelles
- **Solution** : Afficher score agrégé (71/100) mais désactiver click
- Message : "Voir RH Manager pour détails" si click

---

### 2. Intégration Abonnement

**Principe** : Infrastructure, pas module

**Où ?**
1. **Badge header** (toujours visible) : `<SubscriptionBadge />`
2. **Modal centralisée** : `<SubscriptionModal />` (accessible via badge ou Quick Actions)
3. **Soft paywall** : Si limite atteinte, prompt upgrade au lieu de bloquer

**Exemple soft paywall** :
```typescript
if (employees > subscription.usage.limit) {
  return (
    <UpgradePrompt
      reason="employee-limit"
      current={employees}
      limit={subscription.usage.limit}
      onUpgrade={() => navigate('/subscription/upgrade')}
    />
  );
}
```

---

### 3. Intégration IA (LELE HCM-IA)

**Principe** : Couche transversale, pas module isolé

**Où ?**
1. **Dashboard CEO** : `<AIInsightsPanel />` (priorité haute)
2. **Dans chaque module** : Insights contextualisés
3. **Chatbot flottant** : `<AIChatbot />` accessible partout (bottom-right)
4. **Génération rapports** : `<AIReportGenerator />`

**Exemple insights par module** :
```typescript
// Module 1 (Performance Plan)
<AIModuleInsights moduleId={1}>
  "3 collaborateurs risquent de ne pas atteindre objectifs Q4"
  → Action : [Coaching individuel]
</AIModuleInsights>

// Module 2 (Satisfaction)
<AIModuleInsights moduleId={2}>
  "Baisse satisfaction IT (-8 points en 2 mois)"
  → Action : [Focus group IT]
</AIModuleInsights>
```

---

### 4. Intégration Reporting

**Principe** : Cross-modules, pas module isolé

**Où ?**
1. **Quick Actions Bar** (Dashboard CEO) : `<QuickExportButton />`
2. **Modal détaillée** : `<ReportingModal />` (sélection modules, période, format)
3. **Dans chaque module** : `<ModuleReportButton />` (export module seul)
4. **Scheduled reports** : Paramétrage envoi automatique (bonus)

**Exemple export rapide** :
```typescript
<QuickExportButton
  formats={['PDF', 'Excel', 'PowerPoint']}
  templates={[
    'Executive Summary (Board)',
    'Monthly Report',
    'Custom Report'
  ]}
  onExport={(format, template) => generateReport(format, template)}
/>
```

---

## 📱 RESPONSIVE DESIGN (Mobile-First)

### Breakpoints

```css
/* Mobile: < 768px */
- Stack vertical
- HealthScore: full width
- AIInsights: full width, scroll horizontal si > 1 insight
- QuickMetrics: grid 2x2
- ModulePreviews: stack vertical

/* Tablet: 768px - 1024px */
- HealthScore + AIInsights: 60/40
- QuickMetrics: grid 1x4
- ModulePreviews: grid 2x2

/* Desktop: > 1024px */
- HealthScore + AIInsights: 50/50
- QuickMetrics: grid 1x4
- ModulePreviews: grid 2x2 ou 1x4 selon espace
```

### Thumb-Friendly (Mobile)

- Boutons CTA: hauteur min 44px (Apple guidelines)
- Espacement touch targets: min 8px
- Textes: min 16px (éviter zoom auto iOS)
- Actions swipe: dismissible insights avec swipe left

---

## ⚡ PERFORMANCE

### Optimisations

1. **Lazy Loading** :
```typescript
const AIInsightsPanel = lazy(() => import('@/components/dashboard/ceo/AIInsightsPanel'));
const ReportingModal = lazy(() => import('@/components/reporting/ReportingModal'));
```

2. **React Query** :
- Stale time: 30s
- Refetch interval: 60s
- Cache time: 5min

3. **Memoization** :
```typescript
const memoizedHealthScore = useMemo(() => calculateHealthScore(modules), [modules]);
```

4. **Virtualization** : Si > 10 insights IA, utiliser `react-window`

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1 : Types & Hooks (2h)
- [ ] Créer `/src/types/dashboard.ts` avec tous les types
- [ ] Créer `/src/hooks/dashboard/useCEODashboard.ts`
- [ ] Créer `/src/lib/api/ceo-dashboard.ts` (API calls)

### Phase 2 : Composants Core (4h)
- [ ] `HealthScoreCard.tsx` (avec Chart.js ou Recharts)
- [ ] `AIInsightsPanel.tsx` + `AIInsightCard.tsx`
- [ ] `QuickMetrics.tsx`
- [ ] `ModuleQuickView.tsx`

### Phase 3 : Composants Secondaires (2h)
- [ ] `QuickActionsBar.tsx`
- [ ] `SubscriptionBadge.tsx`
- [ ] `QuickExportButton.tsx`

### Phase 4 : Refactoring Dashboard (2h)
- [ ] Refactorer `/src/pages/dashboards/CEODashboard.tsx`
- [ ] Intégrer tous les composants
- [ ] Tester responsive mobile/tablet/desktop

### Phase 5 : Backend API (4h - si nécessaire)
- [ ] Créer endpoint `/api/ceo/dashboard`
- [ ] Implémenter calcul health score
- [ ] Implémenter génération AI insights (mock ou vrai IA)

### Phase 6 : Tests & Docs (2h)
- [ ] Tests unitaires composants critiques
- [ ] Documentation technique
- [ ] Screenshots avant/après

**Total estimé : 16h (2 jours)**

---

## 🎯 MÉTRIQUES DE SUCCÈS

### UX/Performance
| Métrique | Avant | Après | Target |
|----------|-------|-------|--------|
| Time to Insight | 2min | 10s | <30s |
| Clicks to Action | 3-5 | 1-2 | <2 |
| Mobile Usability | 60/100 | 90/100 | >85 |
| Page Load Time | 2s | 1s | <1.5s |

### Business
| Métrique | Target |
|----------|--------|
| CEO Daily Active Usage | >80% |
| Time in Dashboard | +150% |
| Actions Taken from AI Insights | >30% |
| Feature Discovery (modules) | >90% |

---

## 🚀 NEXT STEPS

### Immediate (Aujourd'hui)
1. **Valider architecture** avec équipe
2. **Créer types** (`/src/types/dashboard.ts`)
3. **Créer hook principal** (`useCEODashboard.ts`)
4. **Commencer HealthScoreCard**

### Short-term (Cette semaine)
5. Implémenter tous les composants core
6. Refactorer CEODashboard.tsx
7. Tester responsive

### Mid-term (Prochaine sprint)
8. Créer endpoint backend `/api/ceo/dashboard`
9. Brancher vraies données
10. Tests utilisateurs avec 3 CEOs

---

## 🤖 POUR L'AGENT IA

**Réponse courte** :
Refonte CEO Dashboard de "menu restaurant" vers "Executive Command Center". Architecture: HealthScore global, AI Insights, Quick Metrics, Module Previews. 8 composants nouveaux, hook useCEODashboard avec React Query, polling 60s, mobile-first. Abonnement = badge header. IA = couche transversale. Reporting = cross-modules. 16h implémentation.

**Fichiers à créer** :
- Types: dashboard.ts
- Hooks: useCEODashboard.ts + 4 hooks spécifiques
- Composants: HealthScoreCard, AIInsightsPanel, QuickMetrics, ModuleQuickView, QuickActionsBar, SubscriptionBadge, QuickExportButton
- Refactoring: CEODashboard.tsx

**Keywords** : ceo-dashboard, executive-command-center, health-score, ai-insights, progressive-disclosure, mobile-first, react-query, performance, world-finance-awards

---

**Créé le** : 2025-11-12
**Version** : 1.0.0
**Statut** : ✅ Architecture documentée - Prêt pour implémentation
**Skill** : elite-frontend-auditor
**Temps estimé implémentation** : 16h (2 jours)
