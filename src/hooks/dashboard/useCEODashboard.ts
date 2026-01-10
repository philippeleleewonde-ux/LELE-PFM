import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchHealthScore,
  fetchAIInsights,
  fetchQuickMetrics,
  fetchModulesPreviews,
  fetchSubscription
} from '@/lib/api/ceo-dashboard';
import type {
  HealthScoreData,
  AIInsight,
  QuickMetricsData,
  ModulePreviewData,
  SubscriptionData
} from '@/types/dashboard';

/**
 * Hook principal pour CEO Dashboard
 * Fetch toutes les données nécessaires en parallèle avec React Query
 * Polling automatique toutes les 60s pour refresh
 */
export const useCEODashboard = () => {
  const { user } = useAuth();
  const companyId = user?.company_id || 'default';

  // Health Score global + par module
  const {
    data: healthScore,
    isLoading: loadingHealth,
    error: errorHealth
  } = useQuery<HealthScoreData>({
    queryKey: ['ceo', 'health-score', companyId],
    queryFn: () => fetchHealthScore(companyId),
    refetchInterval: 60000, // Refresh toutes les 60s
    staleTime: 30000, // Data considérée fresh pendant 30s
    enabled: !!companyId
  });

  // AI Insights (alerts + opportunities)
  const {
    data: aiInsights,
    isLoading: loadingAI,
    error: errorAI
  } = useQuery<AIInsight[]>({
    queryKey: ['ceo', 'ai-insights', companyId],
    queryFn: () => fetchAIInsights(companyId),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: !!companyId
  });

  // Quick Metrics (4 KPIs)
  const {
    data: quickMetrics,
    isLoading: loadingMetrics,
    error: errorMetrics
  } = useQuery<QuickMetricsData>({
    queryKey: ['ceo', 'quick-metrics', companyId],
    queryFn: () => fetchQuickMetrics(companyId),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: !!companyId
  });

  // Modules Previews
  const {
    data: modulesPreviews,
    isLoading: loadingModules,
    error: errorModules
  } = useQuery<Record<number, ModulePreviewData>>({
    queryKey: ['ceo', 'modules-previews', companyId],
    queryFn: () => fetchModulesPreviews(companyId),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: !!companyId
  });

  // Subscription
  const {
    data: subscription,
    isLoading: loadingSubscription,
    error: errorSubscription
  } = useQuery<SubscriptionData>({
    queryKey: ['subscription', companyId],
    queryFn: () => fetchSubscription(companyId),
    staleTime: 5 * 60 * 1000, // Subscription change moins souvent, cache 5min
    enabled: !!companyId
  });

  // Agrégation loading state
  const isLoading = loadingHealth || loadingAI || loadingMetrics || loadingModules;
  const hasError = errorHealth || errorAI || errorMetrics || errorModules;

  return {
    // Data
    healthScore,
    aiInsights: aiInsights || [],
    quickMetrics,
    modulesPreviews,
    subscription,

    // Loading states
    isLoading,
    loadingHealth,
    loadingAI,
    loadingMetrics,
    loadingModules,
    loadingSubscription,

    // Errors
    hasError,
    errorHealth,
    errorAI,
    errorMetrics,
    errorModules,
    errorSubscription
  };
};
