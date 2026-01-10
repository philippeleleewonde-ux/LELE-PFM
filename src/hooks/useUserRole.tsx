import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/roles';

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) {
        // Si pas de userId, on arrête le loading mais on garde role à null
        // Cela permet au composant parent de gérer la redirection si nécessaire
        setLoading(false);
        setRole(null);
        return;
      }

      try {
        // Try RPC function first (preferred method)
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_role');

        if (!rpcError && rpcData) {
          setRole(rpcData as UserRole);
          setLoading(false);
          return;
        }

        // Fallback to direct query if RPC fails
        const { data: queryData, error: queryError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (queryError) {
          console.error('Error fetching user role:', queryError);
          throw queryError;
        }

        if (queryData?.role) {
          setRole(queryData.role as UserRole);
          setLoading(false);
          return;
        }

        // No role found
        setRole(null);
      } catch (error) {
        console.error('Fatal error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  return { role, loading };
};
