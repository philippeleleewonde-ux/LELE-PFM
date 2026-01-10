import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AILimits {
  aiEnabled: boolean;
  aiCallsPerMonth: number;
  advancedAnalytics: boolean;
  customPrompts: boolean;
  predictiveAi: boolean;
  bankingScore: boolean;
  features: string[];
}

export function useAILimits() {
  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

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

  return {
    limits: limits || {
      aiEnabled: false,
      aiCallsPerMonth: 0,
      advancedAnalytics: false,
      customPrompts: false,
      predictiveAi: false,
      bankingScore: false,
      features: [],
    },
    isLoading,
    planType: subscription?.plan_type || 'free',
  };
}
