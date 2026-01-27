import type { CEODashboardData, HealthScoreData, AIInsight, QuickMetricsData, ModulePreviewData, SubscriptionData } from '@/types/dashboard';

// ============================================================================
// MOCK DATA (À remplacer par vraies API calls Supabase)
// ============================================================================

/**
 * Fetch CEO Dashboard data agrégé
 * TODO: Remplacer par vrai endpoint Supabase `/api/ceo/dashboard`
 */
export const fetchCEODashboard = async (companyId: string): Promise<CEODashboardData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    healthScore: await fetchHealthScore(companyId),
    aiInsights: await fetchAIInsights(companyId),
    quickMetrics: await fetchQuickMetrics(companyId),
    modulesPreviews: await fetchModulesPreviews(companyId),
    subscription: await fetchSubscription(companyId)
  };
};

/**
 * Fetch Health Score global + par module
 */
export const fetchHealthScore = async (companyId: string): Promise<HealthScoreData> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    overall: 78,
    trend: 'up',
    modules: {
      1: { score: 82, trend: 'up', alert: false },
      2: { score: 71, trend: 'down', alert: true }, // Alert: satisfaction en baisse
      3: { score: 85, trend: 'up', alert: false },
      4: { score: 79, trend: 'stable', alert: false }
    }
  };
};

/**
 * Fetch AI Insights (alerts + opportunities)
 */
export const fetchAIInsights = async (companyId: string): Promise<AIInsight[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  return [
    {
      id: 'insight-1',
      type: 'alert',
      priority: 'high',
      title: 'Turnover marketing en hausse (+12% vs Q3)',
      description: 'Le département Marketing montre des signes de turnover accru. 3 départs sur les 2 derniers mois.',
      recommendation: 'Lancer une enquête de satisfaction ciblée sur le département Marketing pour identifier les causes profondes.',
      actions: [
        { label: 'Lancer enquête', type: 'primary', action: 'launch-survey-marketing' },
        { label: 'Voir détails', type: 'secondary', action: 'view-turnover-details' }
      ],
      moduleId: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: 'insight-2',
      type: 'opportunity',
      priority: 'medium',
      title: 'Économies potentielles de 37k€ détectées',
      description: 'Analyse prédictive : optimisation de la masse salariale via flex-time pourrait générer 37k€ d\'économies annuelles.',
      recommendation: 'Simuler un scénario de flex-time pour 30% des employés éligibles.',
      actions: [
        { label: 'Simuler scénario', type: 'primary', action: 'simulate-flex-time' },
        { label: 'Voir analyse', type: 'secondary', action: 'view-cost-analysis' }
      ],
      moduleId: 3,
      createdAt: new Date().toISOString()
    }
  ];
};

/**
 * Fetch Quick Metrics (4 KPIs essentiels)
 */
export const fetchQuickMetrics = async (companyId: string): Promise<QuickMetricsData> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    turnover: {
      label: 'Turnover',
      value: 8.2,
      unit: '%',
      trend: 'down',
      change: '-1.2%',
      good: true // Baisse = bon
    },
    engagement: {
      label: 'Engagement',
      value: 72,
      unit: '%',
      trend: 'up',
      change: '+3%',
      good: true // Hausse = bon
    },
    costPerEmployee: {
      label: 'Coût/Employé',
      value: 4200,
      unit: '€',
      trend: 'down',
      change: '-5%',
      good: true // Baisse = bon
    },
    avgPerformance: {
      label: 'Perf. Moyenne',
      value: 78,
      unit: '%',
      trend: 'stable',
      change: '0%',
      good: true // Stable OK
    }
  };
};

/**
 * Fetch Modules Previews (aperçu 4 modules)
 */
export const fetchModulesPreviews = async (companyId: string): Promise<Record<number, ModulePreviewData>> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  return {
    1: {
      moduleId: 1,
      score: 82,
      trend: 'up',
      alert: false,
      lastUpdate: 'Il y a 2h',
      keyMetric: {
        label: 'Plans actifs',
        value: 12
      }
    },
    2: {
      moduleId: 2,
      score: 71,
      trend: 'down',
      alert: true, // Alerte satisfaction
      lastUpdate: 'Il y a 1h',
      keyMetric: {
        label: 'Taux de réponse',
        value: '68%'
      }
    },
    3: {
      moduleId: 3,
      score: 85,
      trend: 'up',
      alert: false,
      lastUpdate: 'Il y a 3h',
      keyMetric: {
        label: 'Économies YTD',
        value: '142k€'
      }
    },
    4: {
      moduleId: 4,
      score: 79,
      trend: 'stable',
      alert: false,
      lastUpdate: 'Il y a 4h',
      keyMetric: {
        label: 'Cartes actives',
        value: 247
      }
    }
  };
};

/**
 * Fetch Subscription data
 */
export const fetchSubscription = async (companyId: string): Promise<SubscriptionData> => {
  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    plan: 'Pro',
    status: 'active',
    usage: {
      employees: 247,
      limit: 500,
      modules: [1, 2, 3, 4],
      aiCredits: 1200,
      aiLimit: 2000
    }
  };
};

/**
 * Dismiss AI Insight (mark as seen)
 */
export const dismissAIInsight = async (insightId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  // TODO: Backend call pour marquer insight comme vu
};

/**
 * Execute AI Insight action
 */
export const executeAIInsightAction = async (insightId: string, actionId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  // TODO: Backend call pour exécuter l'action
};
