import { useEffect } from 'react';

// Fonction debounce personnalisée avec méthode cancel
const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunction = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunction;
};

/**
 * Hook de sauvegarde automatique dans localStorage
 * Performance optimisée avec debounce
 */
export const useAutoSave = <T = unknown>(
  watchedData: T,
  storageKey: string,
  delay: number = 1000
) => {
  useEffect(() => {
    // Fonction de sauvegarde avec debounce pour éviter trop d'écritures
    const debouncedSave = debounce((data: T) => {
      try {
        if (data && Object.keys(data).length > 0) {
          localStorage.setItem(storageKey, JSON.stringify({
            data,
            timestamp: Date.now(),
            version: '1.0'
          }));
        }
      } catch (error) {
        }
    }, delay);

    if (watchedData) {
      debouncedSave(watchedData);
    }

    // Cleanup du debounce
    return () => {
      debouncedSave.cancel();
    };
  }, [watchedData, storageKey, delay]);
};

/**
 * Récupération des données sauvegardées
 */
export const getSavedData = (storageKey: string) => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Vérifier que les données ne sont pas trop anciennes (24h max)
      const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
      if (isRecent && parsed.data) {
        return parsed.data;
      }
    }
  } catch (error) {
    }
  return null;
};

/**
 * Nettoyage des données sauvegardées
 */
export const clearSavedData = (storageKey: string) => {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    }
};
