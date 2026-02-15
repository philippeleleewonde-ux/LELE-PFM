import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_LANGUAGE, isLanguageSupported } from '../config/supported-languages';

/**
 * Détecte la langue préférée de l'utilisateur.
 * Priorité : préférence BDD > navigateur > défaut (fr).
 */
export async function detectUserLanguage(userId: string | undefined): Promise<string> {
  // 1. Tenter de lire la préférence en BDD
  if (userId) {
    try {
      const { data } = await supabase
        .from('ai_user_preferences')
        .select('preferred_language')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.preferred_language && isLanguageSupported(data.preferred_language)) {
        return data.preferred_language;
      }
    } catch {
      // Silently fall through to browser detection
    }
  }

  // 2. Détection via le navigateur
  const browserLang = navigator.language?.split('-')[0];
  if (browserLang && isLanguageSupported(browserLang)) {
    return browserLang;
  }

  // 3. Défaut
  return DEFAULT_LANGUAGE;
}

/**
 * Sauvegarde la langue préférée de l'utilisateur.
 */
export async function saveUserLanguage(userId: string, language: string): Promise<void> {
  await supabase
    .from('ai_user_preferences')
    .upsert(
      { user_id: userId, preferred_language: language, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
}
