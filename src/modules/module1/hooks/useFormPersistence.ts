import { useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

/**
 * useFormPersistence Hook
 * Automatically saves and restores form data from localStorage
 */
export function useFormPersistence<T>(
  key: string,
  data: T,
  onRestore?: (data: T) => void
) {
  // Save data to localStorage (debounced to avoid excessive writes)
  const saveData = useCallback(
    debounce((dataToSave: T) => {
      try {
        const serialized = JSON.stringify(dataToSave);
        localStorage.setItem(key, serialized);
        } catch (error) {
        console.error(`[useFormPersistence] Error saving data:`, error);
      }
    }, 1000), // Debounce 1 second
    [key]
  );

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized) {
        const restored = JSON.parse(serialized) as T;
        onRestore?.(restored);
      }
    } catch (error) {
      console.error(`[useFormPersistence] Error loading data:`, error);
    }
  }, [key, onRestore]);

  // Auto-save whenever data changes
  useEffect(() => {
    if (data) {
      saveData(data);
    }
  }, [data, saveData]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
      } catch (error) {
      console.error(`[useFormPersistence] Error clearing data:`, error);
    }
  }, [key]);

  return { clearSaved };
}

/**
 * Get saved form progress percentage
 */
export function getSavedFormProgress(key: string): number {
  try {
    const serialized = localStorage.getItem(key);
    if (!serialized) return 0;

    const data = JSON.parse(serialized);
    // Simple heuristic: count filled fields
    const fields = Object.values(data).filter(v => v !== null && v !== undefined && v !== '');
    const totalFields = Object.keys(data).length;

    return totalFields > 0 ? Math.round((fields.length / totalFields) * 100) : 0;
  } catch {
    return 0;
  }
}

/**
 * Check if there's saved form data
 */
export function hasSavedFormData(key: string): boolean {
  try {
    const serialized = localStorage.getItem(key);
    return !!serialized;
  } catch {
    return false;
  }
}
