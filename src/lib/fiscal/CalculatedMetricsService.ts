/**
 * ============================================
 * CalculatedMetricsService - Service de Métriques Calculées
 * ============================================
 *
 * Gère la sauvegarde et la récupération des métriques calculées entre modules.
 * Permet à Module 1 de sauvegarder ses calculs et à Module 3 de les lire.
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export type MetricType =
  | 'priority_actions'
  | 'gains'
  | 'prl'
  | 'var'
  | 'el'
  | 'ul'
  | 'indicator_rate'
  | 'budget_allocation'
  | 'staff_distribution'
  | 'custom';

export type Indicator =
  | 'absenteeism'
  | 'productivity'
  | 'quality'
  | 'accidents'
  | 'knowhow'
  | 'all';

export interface CalculatedMetric {
  id?: string;
  companyId: string;
  metricType: MetricType;
  sourceModule: string;
  fiscalYear: number;
  fiscalPeriod: string;
  yearOffset: number;
  businessLine?: string;
  businessLineId?: string;
  indicator?: Indicator | string;
  valueTotal?: number;
  valuePerPerson?: number;
  valueRate?: number;
  staffCount?: number;
  budgetRate?: number;
  metadata?: Record<string, unknown>;
  calculatedAt?: Date;
  calculationVersion?: string;
}

export interface PriorityActionDistribution {
  businessLine: string;
  staffCount: number;
  budgetRate: number;
  distributions: {
    indicator: string;
    perLine: number;
    perPerson: number;
  }[];
}

export interface SaveMetricsResult {
  success: boolean;
  count: number;
  error?: string;
}

// ============================================
// CALCULATED METRICS SERVICE
// ============================================

export class CalculatedMetricsService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // =====================
  // SAUVEGARDE DES MÉTRIQUES
  // =====================

  /**
   * Sauvegarde les Priority Actions (PPR par personne par indicateur)
   * Appelé depuis Module 1 après calcul
   */
  async savePriorityActions(
    yearOffset: number,
    data: PriorityActionDistribution[]
  ): Promise<SaveMetricsResult> {
    try {
      const fiscalYear = new Date().getFullYear() + yearOffset;
      const records: Array<Record<string, unknown>> = [];

      for (const bl of data) {
        for (const dist of bl.distributions) {
          records.push({
            company_id: this.companyId,
            metric_type: 'priority_actions',
            source_module: 'module1',
            fiscal_year: fiscalYear,
            fiscal_period: 'ANNUAL',
            year_offset: yearOffset,
            business_line: bl.businessLine,
            indicator: dist.indicator,
            value_total: dist.perLine,
            value_per_person: dist.perPerson,
            staff_count: bl.staffCount,
            budget_rate: bl.budgetRate,
            calculated_at: new Date().toISOString(),
            calculation_version: 'v1.0',
          });
        }
      }

      if (records.length === 0) {
        return { success: true, count: 0 };
      }

      const { error } = await supabase
        .from('calculated_metrics')
        .upsert(records, {
          onConflict: 'company_id,metric_type,fiscal_year,fiscal_period,business_line,indicator',
        });

      if (error) throw error;

      return { success: true, count: records.length };
    } catch (error) {
      console.error('Error saving priority actions:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sauvegarde les gains annuels (N+1, N+2, N+3)
   */
  async saveGains(
    gainsN1: number,
    gainsN2: number,
    gainsN3: number
  ): Promise<SaveMetricsResult> {
    try {
      const currentYear = new Date().getFullYear();

      const records = [
        {
          company_id: this.companyId,
          metric_type: 'gains',
          source_module: 'module1',
          fiscal_year: currentYear + 1,
          fiscal_period: 'ANNUAL',
          year_offset: 1,
          indicator: 'all',
          value_total: gainsN1,
          calculated_at: new Date().toISOString(),
        },
        {
          company_id: this.companyId,
          metric_type: 'gains',
          source_module: 'module1',
          fiscal_year: currentYear + 2,
          fiscal_period: 'ANNUAL',
          year_offset: 2,
          indicator: 'all',
          value_total: gainsN2,
          calculated_at: new Date().toISOString(),
        },
        {
          company_id: this.companyId,
          metric_type: 'gains',
          source_module: 'module1',
          fiscal_year: currentYear + 3,
          fiscal_period: 'ANNUAL',
          year_offset: 3,
          indicator: 'all',
          value_total: gainsN3,
          calculated_at: new Date().toISOString(),
        },
      ];

      const { error } = await supabase
        .from('calculated_metrics')
        .upsert(records, {
          onConflict: 'company_id,metric_type,fiscal_year,fiscal_period,business_line,indicator',
        });

      if (error) throw error;

      return { success: true, count: 3 };
    } catch (error) {
      console.error('Error saving gains:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sauvegarde les taux d'indicateurs
   */
  async saveIndicatorRates(rates: Record<Indicator, number>): Promise<SaveMetricsResult> {
    try {
      const currentYear = new Date().getFullYear();
      const records = Object.entries(rates).map(([indicator, rate]) => ({
        company_id: this.companyId,
        metric_type: 'indicator_rate',
        source_module: 'module1',
        fiscal_year: currentYear,
        fiscal_period: 'ANNUAL',
        year_offset: 0,
        indicator,
        value_rate: rate,
        calculated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('calculated_metrics')
        .upsert(records, {
          onConflict: 'company_id,metric_type,fiscal_year,fiscal_period,business_line,indicator',
        });

      if (error) throw error;

      return { success: true, count: records.length };
    } catch (error) {
      console.error('Error saving indicator rates:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =====================
  // LECTURE DES MÉTRIQUES
  // =====================

  /**
   * Récupère les Priority Actions pour une année donnée
   * Utilisé par Module 3 pour obtenir les PPR par personne
   */
  async getPriorityActions(yearOffset: number = 1): Promise<PriorityActionDistribution[]> {
    try {
      const fiscalYear = new Date().getFullYear() + yearOffset;

      const { data, error } = await supabase
        .from('calculated_metrics')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('metric_type', 'priority_actions')
        .eq('fiscal_year', fiscalYear)
        .order('business_line', { ascending: true })
        .order('indicator', { ascending: true });

      if (error) throw error;

      // Regrouper par business line
      const groupedByBL = new Map<string, PriorityActionDistribution>();

      for (const row of data || []) {
        const blName = row.business_line || '';

        if (!groupedByBL.has(blName)) {
          groupedByBL.set(blName, {
            businessLine: blName,
            staffCount: row.staff_count || 0,
            budgetRate: row.budget_rate || 0,
            distributions: [],
          });
        }

        groupedByBL.get(blName)!.distributions.push({
          indicator: row.indicator || '',
          perLine: row.value_total || 0,
          perPerson: row.value_per_person || 0,
        });
      }

      return Array.from(groupedByBL.values());
    } catch (error) {
      console.error('Error getting priority actions:', error);
      return [];
    }
  }

  /**
   * Récupère le PPR par personne pour un indicateur et une business line spécifiques
   * Utilisé par Module 3 pour le calcul PPR PREVUES
   */
  async getPPRPerPerson(
    businessLineName: string,
    indicator: string,
    yearOffset: number = 1
  ): Promise<number> {
    try {
      const fiscalYear = new Date().getFullYear() + yearOffset;

      const { data, error } = await supabase
        .from('calculated_metrics')
        .select('value_per_person')
        .eq('company_id', this.companyId)
        .eq('metric_type', 'priority_actions')
        .eq('fiscal_year', fiscalYear)
        .ilike('business_line', businessLineName)
        .eq('indicator', indicator)
        .single();

      if (error || !data) {
        return 0;
      }

      return data.value_per_person || 0;
    } catch (error) {
      console.error('Error getting PPR per person:', error);
      return 0;
    }
  }

  /**
   * Récupère les gains pour une année
   */
  async getGains(yearOffset: number = 1): Promise<number> {
    try {
      const fiscalYear = new Date().getFullYear() + yearOffset;

      const { data, error } = await supabase
        .from('calculated_metrics')
        .select('value_total')
        .eq('company_id', this.companyId)
        .eq('metric_type', 'gains')
        .eq('fiscal_year', fiscalYear)
        .single();

      if (error || !data) return 0;

      return data.value_total || 0;
    } catch (error) {
      console.error('Error getting gains:', error);
      return 0;
    }
  }

  /**
   * Récupère les taux d'indicateurs
   */
  async getIndicatorRates(): Promise<Record<Indicator, number>> {
    try {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('calculated_metrics')
        .select('indicator, value_rate')
        .eq('company_id', this.companyId)
        .eq('metric_type', 'indicator_rate')
        .eq('fiscal_year', currentYear);

      if (error) throw error;

      const rates: Record<string, number> = {};
      for (const row of data || []) {
        if (row.indicator) {
          rates[row.indicator] = row.value_rate || 0;
        }
      }

      return rates as Record<Indicator, number>;
    } catch (error) {
      console.error('Error getting indicator rates:', error);
      return {} as Record<Indicator, number>;
    }
  }

  // =====================
  // UTILITAIRES
  // =====================

  /**
   * Supprime toutes les métriques d'un type pour une année
   */
  async clearMetrics(metricType: MetricType, yearOffset?: number): Promise<boolean> {
    try {
      let query = supabase
        .from('calculated_metrics')
        .delete()
        .eq('company_id', this.companyId)
        .eq('metric_type', metricType);

      if (yearOffset !== undefined) {
        query = query.eq('year_offset', yearOffset);
      }

      const { error } = await query;
      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error clearing metrics:', error);
      return false;
    }
  }

  /**
   * Vérifie si des métriques existent pour une année
   */
  async hasMetrics(metricType: MetricType, yearOffset: number = 1): Promise<boolean> {
    try {
      const fiscalYear = new Date().getFullYear() + yearOffset;

      const { count, error } = await supabase
        .from('calculated_metrics')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', this.companyId)
        .eq('metric_type', metricType)
        .eq('fiscal_year', fiscalYear);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking metrics:', error);
      return false;
    }
  }

  /**
   * Récupère la date du dernier calcul
   */
  async getLastCalculationDate(metricType: MetricType): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('calculated_metrics')
        .select('calculated_at')
        .eq('company_id', this.companyId)
        .eq('metric_type', metricType)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return new Date(data.calculated_at);
    } catch (error) {
      console.error('Error getting last calculation date:', error);
      return null;
    }
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createMetricsService(companyId: string): CalculatedMetricsService {
  return new CalculatedMetricsService(companyId);
}
