import { useLocation } from 'react-router-dom';
import type { AIPageContext } from '../types/lele-ai.types';

/**
 * Détecte le module actif à partir de la route courante.
 */
export function detectModuleFromPath(pathname: string): string | null {
  if (pathname.startsWith('/modules/module1')) return 'module1';
  if (pathname.startsWith('/modules/module2')) return 'module2';
  if (pathname.startsWith('/modules/module3')) return 'module3';
  if (pathname.startsWith('/modules/module4')) return 'module4';
  if (pathname.startsWith('/modules/datascanner')) return 'datascanner';
  if (pathname.startsWith('/ai-assistant')) return 'ai-assistant';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/company-profile')) return 'company-profile';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/subscription')) return 'subscription';
  if (pathname.startsWith('/banker')) return 'banker';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/settings')) return 'settings';
  return null;
}

/**
 * Construit le contexte de page complet.
 */
export function buildPageContext(params: {
  pathname: string;
  companyId: string | null;
  visibleData?: Record<string, unknown> | null;
}): AIPageContext {
  return {
    currentPage: params.pathname,
    currentModule: detectModuleFromPath(params.pathname),
    visibleData: params.visibleData ?? null,
    companyId: params.companyId,
  };
}

/**
 * Résume les données visibles pour les injecter dans le prompt.
 * Tronque les données trop volumineuses pour économiser les tokens.
 */
export function summarizeVisibleData(
  data: Record<string, unknown> | null,
  maxTokenEstimate: number = 500
): Record<string, unknown> | null {
  if (!data) return null;

  const serialized = JSON.stringify(data);
  // Estimation grossière : 1 token ≈ 4 caractères
  if (serialized.length <= maxTokenEstimate * 4) {
    return data;
  }

  // Tronquer en gardant les clés de premier niveau avec leurs types
  const summary: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      summary[key] = `[Array: ${value.length} éléments]`;
    } else if (typeof value === 'object' && value !== null) {
      summary[key] = `{Object: ${Object.keys(value).length} clés}`;
    } else {
      summary[key] = value;
    }
  }
  return summary;
}
