import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { detectUserLanguage, saveUserLanguage } from '../services/language-detector';
import { DEFAULT_LANGUAGE } from '../config/supported-languages';

/**
 * Hook pour gérer la langue de LELE AI.
 * Détecte automatiquement et permet le changement manuel.
 */
export function useAILanguage() {
  const { user } = useAuth();
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      setIsDetecting(true);
      const detected = await detectUserLanguage(user?.id);
      if (!cancelled) {
        setLanguageState(detected);
        setIsDetecting(false);
      }
    }

    detect();
    return () => { cancelled = true; };
  }, [user?.id]);

  const setLanguage = useCallback(async (lang: string) => {
    setLanguageState(lang);
    if (user?.id) {
      await saveUserLanguage(user.id, lang);
    }
  }, [user?.id]);

  return { language, setLanguage, isDetecting };
}
