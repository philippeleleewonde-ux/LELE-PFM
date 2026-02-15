import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

export interface AILimits {
  aiEnabled: boolean;
  aiCallsPerMonth: number;
  advancedAnalytics: boolean;
  customPrompts: boolean;
  predictiveAi: boolean;
  bankingScore: boolean;
  features: string[];
}

export interface AIUsageInfo {
  limits: AILimits;
  creditsRemaining: number;
  planType: string;
  isLoading: boolean;
  /** Whether the user can make at least 1 more AI call this period */
  canMakeCall: boolean;
  /** Decrement credits_remaining by 1 after a successful AI call */
  trackCall: () => Promise<void>;
}

export function useAILimits(): AIUsageInfo {
  const queryClient = useQueryClient();

  // 1. Fetch subscription (plan_type + credits_remaining)
  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_type, credits_remaining, current_period_start, current_period_end')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch AI limits for the plan
  const { data: limits, isLoading } = useQuery({
    queryKey: ['ai-limits', subscription?.plan_type],
    queryFn: async () => {
      const planType = subscription?.plan_type || 'free';

      const { data, error } = await supabase
        .from('subscription_ai_limits')
        .select('*')
        .eq('plan_type', planType)
        .single();

      if (error) throw error;

      return {
        aiEnabled: data.ai_enabled,
        aiCallsPerMonth: data.ai_calls_per_month,
        advancedAnalytics: data.advanced_analytics,
        customPrompts: data.custom_prompts,
        predictiveAi: data.predictive_ai,
        bankingScore: data.banking_score,
        features: data.features as string[],
      } as AILimits;
    },
    enabled: !!subscription,
  });

  const creditsRemaining = subscription?.credits_remaining ?? 0;
  const resolvedLimits = limits || {
    aiEnabled: false,
    aiCallsPerMonth: 0,
    advancedAnalytics: false,
    customPrompts: false,
    predictiveAi: false,
    bankingScore: false,
    features: [],
  };

  const canMakeCall = resolvedLimits.aiEnabled && creditsRemaining > 0;

  // Track a successful AI call by decrementing credits_remaining
  const trackCall = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_subscriptions')
      .update({ credits_remaining: Math.max(0, creditsRemaining - 1) })
      .eq('user_id', user.id);

    // Refresh the subscription query to get updated credits
    queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
  }, [creditsRemaining, queryClient]);

  return {
    limits: resolvedLimits,
    creditsRemaining,
    planType: subscription?.plan_type || 'free',
    isLoading,
    canMakeCall,
    trackCall,
  };
}
