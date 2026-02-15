import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { AIPageContext } from '../types/lele-ai.types';
import type { UserRole } from '@/types/roles';
import { buildPageContext } from '../services/context-collector';

interface UseAIContextReturn {
  pageContext: AIPageContext;
  userRole: UserRole | null;
  userName: string;
  userId: string | undefined;
  companyId: string | null;
  companyName: string | null;
}

/**
 * Hook qui collecte tout le contexte nécessaire à LELE AI.
 * Détecte : page active, rôle, nom, entreprise.
 */
export function useAIContext(visibleData?: Record<string, unknown> | null): UseAIContextReturn {
  const location = useLocation();
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);

  const metadata = user?.user_metadata;
  const userName = metadata?.full_name ?? metadata?.first_name ?? 'Utilisateur';
  const companyId = (metadata?.company_id as string) ?? null;
  const companyName = (metadata?.company_name as string) ?? null;

  const pageContext = useMemo(
    () => buildPageContext({
      pathname: location.pathname,
      companyId,
      visibleData,
    }),
    [location.pathname, companyId, visibleData]
  );

  return {
    pageContext,
    userRole: role,
    userName,
    userId: user?.id,
    companyId,
    companyName,
  };
}
