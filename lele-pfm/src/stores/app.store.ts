import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'auto';
export type Language = 'fr' | 'en' | 'es' | 'pt';
export type ViewMode = 'simple' | 'expert' | 'investor';

interface AppState {
  theme: Theme;
  language: Language;
  isOnboarded: boolean;
  isSetupComplete: boolean;
  isLanguageSet: boolean;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  viewMode: ViewMode;

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguageSet: (set: boolean) => void;
  setLanguage: (language: Language) => void;
  setOnboarded: (onboarded: boolean) => void;
  setSetupComplete: (complete: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  resetAppSettings: () => void;
}

const initialState = {
  theme: 'auto' as Theme,
  language: 'fr' as Language,
  isOnboarded: false,
  isSetupComplete: false,
  isLanguageSet: false,
  biometricEnabled: false,
  notificationsEnabled: true,
  viewMode: 'simple' as ViewMode,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setLanguageSet: (isSet) => set({ isLanguageSet: isSet }),

      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

      setSetupComplete: (complete) => set({ isSetupComplete: complete }),

      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setViewMode: (mode) => set({ viewMode: mode }),

      resetAppSettings: () => set(initialState),
    }),
    {
      name: 'lele-pfm-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        isSetupComplete: state.isSetupComplete,
        isLanguageSet: state.isLanguageSet,
        theme: state.theme,
        language: state.language,
        biometricEnabled: state.biometricEnabled,
        notificationsEnabled: state.notificationsEnabled,
        viewMode: state.viewMode,
      }),
    }
  )
);
