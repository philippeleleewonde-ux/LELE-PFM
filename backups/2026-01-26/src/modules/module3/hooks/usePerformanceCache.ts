/**
 * ============================================
 * USE PERFORMANCE CACHE HOOK
 * ============================================
 *
 * Hook React pour gérer le cache des performances.
 * Fournit une interface simple pour lire/écrire le cache.
 *
 * Usage:
 * const { cachedData, isFromCache, saveToCache, invalidate } = usePerformanceCache(companyId, fiscalWeek, fiscalYear);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createPerformanceCacheService,
  PerformanceCacheEntry,
  PerformanceTotalsCache,
  CacheStatus
} from '../services/PerformanceCacheService';

interface UsePerformanceCacheReturn {
  // État
  isLoading: boolean;
  isFromCache: boolean;
  cacheStatus: CacheStatus | null;

  // Données
  cachedPerformances: PerformanceCacheEntry[] | null;
  cachedTotals: PerformanceTotalsCache[] | null;

  // Actions
  loadFromCache: () => Promise<boolean>;
  savePerformances: (entries: PerformanceCacheEntry[]) => Promise<boolean>;
  saveTotals: (totals: PerformanceTotalsCache[]) => Promise<boolean>;
  invalidateCache: () => Promise<boolean>;
  invalidateAllCache: () => Promise<boolean>;
}

export function usePerformanceCache(
  companyId: string | undefined,
  fiscalWeek: number,
  fiscalYear: number
): UsePerformanceCacheReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [cachedPerformances, setCachedPerformances] = useState<PerformanceCacheEntry[] | null>(null);
  const [cachedTotals, setCachedTotals] = useState<PerformanceTotalsCache[] | null>(null);

  // Référence au service pour éviter les recréations
  const serviceRef = useRef<ReturnType<typeof createPerformanceCacheService> | null>(null);

  // Initialiser le service quand companyId change
  useEffect(() => {
    if (companyId) {
      serviceRef.current = createPerformanceCacheService(companyId);
    } else {
      serviceRef.current = null;
    }
  }, [companyId]);

  // Vérifier le statut du cache au montage
  useEffect(() => {
    const checkStatus = async () => {
      if (!serviceRef.current || !companyId) return;

      try {
        const status = await serviceRef.current.getCacheStatus(fiscalWeek, fiscalYear);
        setCacheStatus(status);
      } catch (err) {
        console.warn('Error checking cache status:', err);
      }
    };

    checkStatus();
  }, [companyId, fiscalWeek, fiscalYear]);

  /**
   * Charge les données depuis le cache
   */
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current) return false;

    setIsLoading(true);
    try {
      // Vérifier le statut
      const status = await serviceRef.current.getCacheStatus(fiscalWeek, fiscalYear);
      setCacheStatus(status);

      if (!status.exists || status.isStale) {
        setIsFromCache(false);
        setCachedPerformances(null);
        setCachedTotals(null);
        return false;
      }

      // Charger les données
      const [performances, totals] = await Promise.all([
        serviceRef.current.getFromCache(fiscalWeek, fiscalYear),
        serviceRef.current.getTotalsFromCache(fiscalWeek, fiscalYear)
      ]);

      if (performances && performances.length > 0) {
        setCachedPerformances(performances);
        setCachedTotals(totals);
        setIsFromCache(true);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error loading from cache:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fiscalWeek, fiscalYear]);

  /**
   * Sauvegarde les performances dans le cache
   */
  const savePerformances = useCallback(async (entries: PerformanceCacheEntry[]): Promise<boolean> => {
    if (!serviceRef.current) return false;

    try {
      const success = await serviceRef.current.saveToCache(entries);
      if (success) {
        setCachedPerformances(entries);
        // Mettre à jour le statut
        const status = await serviceRef.current.getCacheStatus(fiscalWeek, fiscalYear);
        setCacheStatus(status);
      }
      return success;
    } catch (err) {
      console.error('Error saving performances to cache:', err);
      return false;
    }
  }, [fiscalWeek, fiscalYear]);

  /**
   * Sauvegarde les totaux dans le cache
   */
  const saveTotals = useCallback(async (totals: PerformanceTotalsCache[]): Promise<boolean> => {
    if (!serviceRef.current) return false;

    try {
      const success = await serviceRef.current.saveTotalsToCache(totals);
      if (success) {
        setCachedTotals(totals);
      }
      return success;
    } catch (err) {
      console.error('Error saving totals to cache:', err);
      return false;
    }
  }, []);

  /**
   * Invalide le cache pour la semaine courante
   */
  const invalidateCache = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current) return false;

    try {
      const success = await serviceRef.current.invalidateCache(fiscalWeek, fiscalYear);
      if (success) {
        setCachedPerformances(null);
        setCachedTotals(null);
        setIsFromCache(false);
        setCacheStatus({ exists: false, isStale: true, lastCalculated: null, entryCount: 0 });
      }
      return success;
    } catch (err) {
      console.error('Error invalidating cache:', err);
      return false;
    }
  }, [fiscalWeek, fiscalYear]);

  /**
   * Invalide tout le cache de la company
   */
  const invalidateAllCache = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current) return false;

    try {
      const success = await serviceRef.current.invalidateAllCache();
      if (success) {
        setCachedPerformances(null);
        setCachedTotals(null);
        setIsFromCache(false);
        setCacheStatus({ exists: false, isStale: true, lastCalculated: null, entryCount: 0 });
      }
      return success;
    } catch (err) {
      console.error('Error invalidating all cache:', err);
      return false;
    }
  }, []);

  return {
    isLoading,
    isFromCache,
    cacheStatus,
    cachedPerformances,
    cachedTotals,
    loadFromCache,
    savePerformances,
    saveTotals,
    invalidateCache,
    invalidateAllCache
  };
}
