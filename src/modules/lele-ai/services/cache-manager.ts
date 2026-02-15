import { supabase } from '@/integrations/supabase/client';

/**
 * Gestion du cache des réponses IA.
 * Réduit les appels API Gemini en cachant les réponses identiques.
 */

/** Génère une clé de cache déterministe */
export function buildCacheKey(params: {
  prompt: string;
  role: string | null;
  moduleContext: string | null;
  companyId: string | null;
  language: string;
}): string {
  const normalized = JSON.stringify({
    p: params.prompt.trim().toLowerCase().slice(0, 200),
    r: params.role,
    m: params.moduleContext,
    c: params.companyId,
    l: params.language,
  });
  return hashString(normalized);
}

/** Recherche une réponse en cache */
export async function getCachedResponse(cacheKey: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('ai_response_cache')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    return data?.response ?? null;
  } catch {
    return null;
  }
}

/** Stocke une réponse en cache */
export async function setCachedResponse(params: {
  cacheKey: string;
  response: string;
  companyId: string | null;
  role: string | null;
  moduleContext: string | null;
  language: string;
  tokensUsed: number;
  ttlMinutes?: number;
}): Promise<void> {
  const ttl = params.ttlMinutes ?? 60; // 1h par défaut
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

  try {
    await supabase.from('ai_response_cache').upsert(
      {
        cache_key: params.cacheKey,
        response: params.response,
        company_id: params.companyId,
        role: params.role,
        module_context: params.moduleContext,
        language: params.language,
        tokens_used: params.tokensUsed,
        expires_at: expiresAt,
      },
      { onConflict: 'cache_key' }
    );
  } catch {
    // Cache write failure is non-critical
  }
}

/** Nettoie les entrées de cache expirées */
export async function cleanExpiredCache(): Promise<void> {
  try {
    await supabase
      .from('ai_response_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch {
    // Non-critical
  }
}

/** Hash simple pour les clés de cache (djb2) */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
