import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useBankerAccess(companyId: string, moduleNumber: 1 | 3) {
  const { user } = useAuth();

  const { data: bankerAccess, isLoading } = useQuery({
    queryKey: ['banker-access', user?.id, companyId, moduleNumber],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('banker_access_grants')
        .select('*')
        .eq('banker_user_id', user.id)
        .eq('company_id', companyId)
        .eq('module_number', moduleNumber)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching banker access:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id && !!companyId,
  });

  const isExpired = bankerAccess?.expires_at 
    ? new Date(bankerAccess.expires_at) < new Date() 
    : false;

  return {
    hasAccess: !!bankerAccess && !isExpired,
    grant: bankerAccess,
    isExpired,
    isLoading,
  };
}

export function useBankerCompanies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['banker-companies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: grants, error } = await supabase
        .from('banker_access_grants')
        .select(`
          *,
          companies (
            id,
            name,
            industry,
            employees_count
          )
        `)
        .eq('banker_user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching banker companies:', error);
        return [];
      }

      return grants || [];
    },
    enabled: !!user?.id,
  });
}
