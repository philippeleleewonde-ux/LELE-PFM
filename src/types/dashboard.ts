import { ModuleNumber } from './modules';

// ============================================================================
// HEALTH SCORE
// ============================================================================

export interface HealthScoreData {
  overall: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  modules: Record<ModuleNumber, ModuleHealthScore>;
}

export interface ModuleHealthScore {
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  alert: boolean;
}

// ============================================================================
// AI INSIGHTS
// ============================================================================

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
  action: string; // Action ID pour backend tracking
}

// ============================================================================
// QUICK METRICS
// ============================================================================

export interface QuickMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  change?: string; // "+12%" ou "-5%"
  good: boolean; // trend up = good ou bad selon métrique
}

export interface QuickMetricsData {
  turnover: QuickMetric;
  engagement: QuickMetric;
  costPerEmployee: QuickMetric;
  avgPerformance: QuickMetric;
}

// ============================================================================
// MODULE PREVIEW
// ============================================================================

export interface ModulePreviewData {
  moduleId: ModuleNumber;
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  alert: boolean;
  lastUpdate: string; // "Il y a 2h"
  keyMetric?: {
    label: string;
    value: string | number;
  };
}

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export interface SubscriptionData {
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'active' | 'trial' | 'expired';
  daysRemaining?: number; // Si trial
  usage: {
    employees: number;
    limit: number;
    modules: ModuleNumber[];
    aiCredits: number;
    aiLimit: number;
  };
}

// ============================================================================
// CEO DASHBOARD (Agrégation complète)
// ============================================================================

export interface CEODashboardData {
  healthScore: HealthScoreData;
  aiInsights: AIInsight[];
  quickMetrics: QuickMetricsData;
  modulesPreviews: Record<ModuleNumber, ModulePreviewData>;
  subscription: SubscriptionData;
}
