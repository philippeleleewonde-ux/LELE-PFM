import type { SupportedLanguage } from '../types/lele-ai.types';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

export const DEFAULT_LANGUAGE = 'fr';

export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang?.nativeName ?? code;
}
