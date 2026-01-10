/**
 * ============================================
 * PERFORMANCE CACHE SERVICE
 * ============================================
 *
 * Service pour gérer le cache des performances calculées.
 * Permet un affichage instantané des résultats sans recalcul.
 *
 * Stratégie:
 * 1. LECTURE: Tenter de lire depuis le cache
 * 2. FALLBACK: Si cache vide/expiré, calculer et sauvegarder
 * 3. ÉCRITURE: Sauvegarder après chaque calcul complet
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface PerformanceCacheEntry {
  id?: string;
  company_id: string;
  employee_id: string;
  business_line_id: string;
  indicator_key: 'abs' | 'qd' | 'oa' | 'ddp' | 'ekh';

  // Valeurs calculées
  ppr_prevues: number;
  economies_realisees: number;
  pertes_constatees: number;
  temps_calcul: number;
  frais_collectes: number;
  score_financier: number;

  // Primes
  prev_prime: number;
  prev_treso: number;
  real_prime: number;
  real_treso: number;

  // Pourcentages
  contribution_pct: number;
  pertes_pct: number;

  // Métadonnées
  fiscal_week: number;
  fiscal_year: number;
  calculated_at?: string;
}

export interface PerformanceTotalsCache {
  id?: string;
  company_id: string;
  business_line_id: string | null; // null = GRAND TOTAL
  indicator_key: 'abs' | 'qd' | 'oa' | 'ddp' | 'ekh' | 'all';

  // Totaux
  total_ppr_prevues: number;
  total_economies: number;
  total_pertes: number;
  total_prev_prime: number;
  total_prev_treso: number;
  total_real_prime: number;
  total_real_treso: number;

  // Stats
  employee_count: number;
  contribution_pct: number;

  // Métadonnées
  fiscal_week: number;
  fiscal_year: number;
  calculated_at?: string;
}

export interface CacheStatus {
  exists: boolean;
  isStale: boolean;
  lastCalculated: Date | null;
  entryCount: number;
}

// ============================================
// SERVICE
// ============================================

export class PerformanceCacheService {
  private companyId: string;
  private cacheMaxAgeMinutes: number = 60; // Cache valide 1 heure

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Vérifie si le cache existe et est valide pour la semaine fiscale donnée
   */
  async getCacheStatus(fiscalWeek: number, fiscalYear: number): Promise<CacheStatus> {
    try {
      const { data, error } = await supabase
        .from('module3_performance_cache')
        .select('calculated_at')
        .eq('company_id', this.companyId)
        .eq('fiscal_week', fiscalWeek)
        .eq('fiscal_year', fiscalYear)
        .order('calculated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error checking cache status:', error);
        return { exists: false, isStale: true, lastCalculated: null, entryCount: 0 };
      }

      if (!data || data.length === 0) {
        return { exists: false, isStale: true, lastCalculated: null, entryCount: 0 };
      }

      const lastCalculated = new Date(data[0].calculated_at);
      const now = new Date();
      const ageMinutes = (now.getTime() - lastCalculated.getTime()) / (1000 * 60);
      const isStale = ageMinutes > this.cacheMaxAgeMinutes;

      // Compter le nombre d'entrées
      const { count } = await supabase
        .from('module3_performance_cache')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', this.companyId)
        .eq('fiscal_week', fiscalWeek)
        .eq('fiscal_year', fiscalYear);

      return {
        exists: true,
        isStale,
        lastCalculated,
        entryCount: count || 0
      };
    } catch (err) {
      console.error('Error in getCacheStatus:', err);
      return { exists: false, isStale: true, lastCalculated: null, entryCount: 0 };
    }
  }

  /**
   * Récupère les performances depuis le cache
   */
  async getFromCache(fiscalWeek: number, fiscalYear: number): Promise<PerformanceCacheEntry[] | null> {
    try {
      const { data, error } = await supabase
        .from('module3_performance_cache')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('fiscal_week', fiscalWeek)
        .eq('fiscal_year', fiscalYear);

      if (error) {
        console.warn('Error reading from cache:', error);
        return null;
      }

      return data as PerformanceCacheEntry[];
    } catch (err) {
      console.error('Error in getFromCache:', err);
      return null;
    }
  }

  /**
   * Récupère les totaux depuis le cache
   */
  async getTotalsFromCache(fiscalWeek: number, fiscalYear: number): Promise<PerformanceTotalsCache[] | null> {
    try {
      const { data, error } = await supabase
        .from('module3_performance_totals_cache')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('fiscal_week', fiscalWeek)
        .eq('fiscal_year', fiscalYear);

      if (error) {
        console.warn('Error reading totals from cache:', error);
        return null;
      }

      return data as PerformanceTotalsCache[];
    } catch (err) {
      console.error('Error in getTotalsFromCache:', err);
      return null;
    }
  }

  /**
   * Sauvegarde les performances dans le cache (upsert)
   */
  async saveToCache(entries: PerformanceCacheEntry[]): Promise<boolean> {
    if (!entries || entries.length === 0) {
      return true;
    }

    try {
      // Utiliser upsert pour éviter les doublons
      const { error } = await supabase
        .from('module3_performance_cache')
        .upsert(
          entries.map(e => ({
            ...e,
            company_id: this.companyId,
            calculated_at: new Date().toISOString()
          })),
          {
            onConflict: 'company_id,employee_id,indicator_key,fiscal_week,fiscal_year'
          }
        );

      if (error) {
        console.error('Error saving to cache:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in saveToCache:', err);
      return false;
    }
  }

  /**
   * Sauvegarde les totaux dans le cache (upsert)
   */
  async saveTotalsToCache(totals: PerformanceTotalsCache[]): Promise<boolean> {
    if (!totals || totals.length === 0) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('module3_performance_totals_cache')
        .upsert(
          totals.map(t => ({
            ...t,
            company_id: this.companyId,
            calculated_at: new Date().toISOString()
          })),
          {
            onConflict: 'company_id,business_line_id,indicator_key,fiscal_week,fiscal_year'
          }
        );

      if (error) {
        console.error('Error saving totals to cache:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in saveTotalsToCache:', err);
      return false;
    }
  }

  /**
   * Invalide le cache pour une semaine fiscale
   * (à appeler quand des données sont modifiées)
   */
  async invalidateCache(fiscalWeek: number, fiscalYear: number): Promise<boolean> {
    try {
      // Supprimer les entrées de performance
      await supabase
        .from('module3_performance_cache')
        .delete()
        .eq('company_id', this.companyId)
        .eq('fiscal_week', fiscalWeek)
        .eq('fiscal_year', fiscalYear);

      // Supprimer les totaux
      await supabase
        .from('module3_performance_totals_cache')
        .delete()
        .eq('company_id', this.companyId)
        .eq('fiscal_week', fiscalWeek)
        .eq('fiscal_year', fiscalYear);

      return true;
    } catch (err) {
      console.error('Error invalidating cache:', err);
      return false;
    }
  }

  /**
   * Invalide tout le cache de la company
   */
  async invalidateAllCache(): Promise<boolean> {
    try {
      await supabase
        .from('module3_performance_cache')
        .delete()
        .eq('company_id', this.companyId);

      await supabase
        .from('module3_performance_totals_cache')
        .delete()
        .eq('company_id', this.companyId);

      return true;
    } catch (err) {
      console.error('Error invalidating all cache:', err);
      return false;
    }
  }
}

// Factory function
export function createPerformanceCacheService(companyId: string): PerformanceCacheService {
  return new PerformanceCacheService(companyId);
}
