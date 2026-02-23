import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, type Language } from '@/stores/app.store';

export function useLanguageSwitch() {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setLanguageSet = useAppStore((s) => s.setLanguageSet);

  const changeAppLanguage = useCallback(
    async (lang: Language) => {
      await i18n.changeLanguage(lang);
      setLanguage(lang);
      setLanguageSet(true);
    },
    [i18n, setLanguage, setLanguageSet],
  );

  return { language, changeAppLanguage };
}
