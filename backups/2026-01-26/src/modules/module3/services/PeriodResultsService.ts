/**
 * ============================================
 * PERIOD RESULTS SERVICE
 * ============================================
 *
 * Service pour gérer les résultats de période validés.
 * Permet de sauvegarder, récupérer et verrouiller les données.
 *
 * Workflow:
 * 1. SAISIE → données modifiables
 * 2. VALIDATION → calcul unique + sauvegarde + verrouillage
 * 3. CONSULTATION → lecture seule depuis DB
 */

import { supabase } from '@/integrations/supabase/client';
import type { IndicatorPerformance, BusinessLinePerformance, GrandTotals } from '@/contexts/PerformanceDataContext';

// ============================================
// TYPES
// ============================================

export interface PeriodResult {
  id?: string;
  company_id: string;

  // Période
  period_type: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  fiscal_week?: number;
  fiscal_month?: number;
  fiscal_quarter?: number;
  fiscal_year: number;
  period_start: string; // ISO date
  period_end: string;   // ISO date

  // Données calculées
  indicators_data: IndicatorPerformance[];
  business_lines_data: BusinessLinePerformance[];
  grand_totals: GrandTotals;
  employee_details?: EmployeeDetail[];

  // Métadonnées
  employee_count: number;
  business_line_count: number;
  currency: string;

  // Verrouillage
  is_locked: boolean;
  locked_at?: string;
  locked_by?: string;
  unlock_reason?: string;

  // Audit
  calculated_at?: string;
  calculated_by?: string;
}

export interface EmployeeDetail {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  indicators: Record<string, {
    pprPrevues: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
  }>;
  totals: {
    totalPPR: number;
    totalEconomies: number;
    totalPrevPrime: number;
    totalPrevTreso: number;
    totalRealPrime: number;
    totalRealTreso: number;
    contributionPct: number;
  };
}

export interface PeriodResultStatus {
  exists: boolean;
  isLocked: boolean;
  calculatedAt: Date | null;
  lockedAt: Date | null;
}

// ============================================
// SERVICE CLASS
// ============================================

export class PeriodResultsService {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // ============================================
  // LECTURE
  // ============================================

  /**
   * Vérifie si une période a déjà été validée
   */
  async getPeriodStatus(
    fiscalWeek: number,
    fiscalYear: number
  ): Promise<PeriodResultStatus> {
    try {
      const { data, error } = await supabase
        .from('module3_period_results')
        .select('id, is_locked, calculated_at, locked_at')
        .eq('company_id', this.companyId)
        .eq('period_type', 'WEEK')
        .eq('fiscal_year', fiscalYear)
        .eq('fiscal_week', fiscalWeek)
        .maybeSingle();

      if (error) {
        console.error('[PeriodResults] Error checking status:', error);
        return { exists: false, isLocked: false, calculatedAt: null, lockedAt: null };
      }

      if (!data) {
        return { exists: false, isLocked: false, calculatedAt: null, lockedAt: null };
      }

      return {
        exists: true,
        isLocked: data.is_locked || false,
        calculatedAt: data.calculated_at ? new Date(data.calculated_at) : null,
        lockedAt: data.locked_at ? new Date(data.locked_at) : null
      };
    } catch (err) {
      console.error('[PeriodResults] Unexpected error in getPeriodStatus:', err);
      return { exists: false, isLocked: false, calculatedAt: null, lockedAt: null };
    }
  }

  /**
   * Récupère les résultats d'une période validée
   */
  async getPeriodResults(
    fiscalWeek: number,
    fiscalYear: number
  ): Promise<PeriodResult | null> {
    try {
      const { data, error } = await supabase
        .from('module3_period_results')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('period_type', 'WEEK')
        .eq('fiscal_year', fiscalYear)
        .eq('fiscal_week', fiscalWeek)
        .maybeSingle();

      if (error) {
        console.error('[PeriodResults] Error fetching results:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        company_id: data.company_id,
        period_type: data.period_type,
        fiscal_week: data.fiscal_week,
        fiscal_month: data.fiscal_month,
        fiscal_quarter: data.fiscal_quarter,
        fiscal_year: data.fiscal_year,
        period_start: data.period_start,
        period_end: data.period_end,
        indicators_data: data.indicators_data as IndicatorPerformance[],
        business_lines_data: data.business_lines_data as BusinessLinePerformance[],
        grand_totals: data.grand_totals as GrandTotals,
        employee_details: data.employee_details as EmployeeDetail[],
        employee_count: data.employee_count,
        business_line_count: data.business_line_count,
        currency: data.currency,
        is_locked: data.is_locked,
        locked_at: data.locked_at,
        locked_by: data.locked_by,
        calculated_at: data.calculated_at,
        calculated_by: data.calculated_by
      };
    } catch (err) {
      console.error('[PeriodResults] Unexpected error in getPeriodResults:', err);
      return null;
    }
  }

  /**
   * Liste toutes les périodes validées pour une année
   */
  async listPeriodsByYear(fiscalYear: number): Promise<PeriodResult[]> {
    try {
      const { data, error } = await supabase
        .from('module3_period_results')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('fiscal_year', fiscalYear)
        .order('fiscal_week', { ascending: true });

      if (error) {
        console.error('[PeriodResults] Error listing periods:', error);
        return [];
      }

      return (data || []).map(d => ({
        id: d.id,
        company_id: d.company_id,
        period_type: d.period_type,
        fiscal_week: d.fiscal_week,
        fiscal_month: d.fiscal_month,
        fiscal_quarter: d.fiscal_quarter,
        fiscal_year: d.fiscal_year,
        period_start: d.period_start,
        period_end: d.period_end,
        indicators_data: d.indicators_data as IndicatorPerformance[],
        business_lines_data: d.business_lines_data as BusinessLinePerformance[],
        grand_totals: d.grand_totals as GrandTotals,
        employee_details: d.employee_details as EmployeeDetail[],
        employee_count: d.employee_count,
        business_line_count: d.business_line_count,
        currency: d.currency,
        is_locked: d.is_locked,
        locked_at: d.locked_at,
        locked_by: d.locked_by,
        calculated_at: d.calculated_at,
        calculated_by: d.calculated_by
      }));
    } catch (err) {
      console.error('[PeriodResults] Unexpected error in listPeriodsByYear:', err);
      return [];
    }
  }

  // ============================================
  // ÉCRITURE / VALIDATION
  // ============================================

  /**
   * Sauvegarde et valide les résultats d'une période
   * Cette méthode est appelée lors du clic sur "Valider la semaine"
   */
  async validateAndSavePeriod(
    fiscalWeek: number,
    fiscalYear: number,
    periodStart: Date,
    periodEnd: Date,
    indicatorsData: IndicatorPerformance[],
    businessLinesData: BusinessLinePerformance[],
    grandTotals: GrandTotals,
    employeeDetails: EmployeeDetail[],
    currency: string = 'EUR'
  ): Promise<{ success: boolean; error?: string; data?: PeriodResult }> {
    try {
      // Récupérer l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      // Vérifier si déjà validé et verrouillé
      const status = await this.getPeriodStatus(fiscalWeek, fiscalYear);
      if (status.exists && status.isLocked) {
        return {
          success: false,
          error: 'Cette période est déjà validée et verrouillée. Contactez un administrateur pour la modifier.'
        };
      }

      // Préparer les données
      const periodResult = {
        company_id: this.companyId,
        period_type: 'WEEK' as const,
        fiscal_week: fiscalWeek,
        fiscal_year: fiscalYear,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        indicators_data: indicatorsData,
        business_lines_data: businessLinesData,
        grand_totals: grandTotals,
        employee_details: employeeDetails,
        employee_count: employeeDetails.length,
        business_line_count: businessLinesData.length,
        currency: currency,
        is_locked: true, // Verrouillage automatique à la validation
        locked_at: new Date().toISOString(),
        locked_by: user.id,
        calculated_at: new Date().toISOString(),
        calculated_by: user.id
      };

      // Upsert (insert ou update)
      const { data, error } = await supabase
        .from('module3_period_results')
        .upsert(periodResult, {
          onConflict: 'company_id,period_type,fiscal_year,fiscal_week'
        })
        .select()
        .single();

      if (error) {
        console.error('[PeriodResults] Error saving period:', error);
        return { success: false, error: `Erreur de sauvegarde: ${error.message}` };
      }

      console.log(`[PeriodResults] Period W${fiscalWeek}/${fiscalYear} validated and locked successfully`);

      return {
        success: true,
        data: data as unknown as PeriodResult
      };
    } catch (err: any) {
      console.error('[PeriodResults] Unexpected error in validateAndSavePeriod:', err);
      return { success: false, error: err.message || 'Erreur inattendue' };
    }
  }

  // ============================================
  // VERROUILLAGE / DÉVERROUILLAGE
  // ============================================

  /**
   * Verrouille une période (normalement fait automatiquement à la validation)
   */
  async lockPeriod(fiscalWeek: number, fiscalYear: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('module3_period_results')
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
          locked_by: user?.id
        })
        .eq('company_id', this.companyId)
        .eq('period_type', 'WEEK')
        .eq('fiscal_year', fiscalYear)
        .eq('fiscal_week', fiscalWeek);

      if (error) {
        console.error('[PeriodResults] Error locking period:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[PeriodResults] Unexpected error in lockPeriod:', err);
      return false;
    }
  }

  /**
   * Déverrouille une période (Admin/CEO only - vérifié par RLS)
   */
  async unlockPeriod(
    fiscalWeek: number,
    fiscalYear: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('module3_period_results')
        .update({
          is_locked: false,
          unlock_reason: reason,
          last_modified_at: new Date().toISOString(),
          last_modified_by: user?.id
        })
        .eq('company_id', this.companyId)
        .eq('period_type', 'WEEK')
        .eq('fiscal_year', fiscalYear)
        .eq('fiscal_week', fiscalWeek);

      if (error) {
        console.error('[PeriodResults] Error unlocking period:', error);
        return { success: false, error: error.message };
      }

      console.log(`[PeriodResults] Period W${fiscalWeek}/${fiscalYear} unlocked. Reason: ${reason}`);
      return { success: true };
    } catch (err: any) {
      console.error('[PeriodResults] Unexpected error in unlockPeriod:', err);
      return { success: false, error: err.message };
    }
  }

  // ============================================
  // AGRÉGATION (pour reporting mensuel/trimestriel/annuel)
  // ============================================

  /**
   * Calcule les totaux pour un mois (agrégation des semaines)
   */
  async getMonthlyAggregation(
    fiscalMonth: number,
    fiscalYear: number
  ): Promise<GrandTotals | null> {
    try {
      const { data, error } = await supabase
        .from('module3_period_results')
        .select('grand_totals')
        .eq('company_id', this.companyId)
        .eq('period_type', 'WEEK')
        .eq('fiscal_year', fiscalYear)
        .gte('fiscal_week', (fiscalMonth - 1) * 4 + 1)
        .lte('fiscal_week', fiscalMonth * 4);

      if (error || !data || data.length === 0) {
        return null;
      }

      // Agréger les totaux
      const aggregated: GrandTotals = {
        grandTotalPPR: 0,
        grandTotalEco: 0,
        grandTotalPrevPrime: 0,
        grandTotalPrevTreso: 0,
        grandTotalRealPrime: 0,
        grandTotalRealTreso: 0
      };

      data.forEach(d => {
        const gt = d.grand_totals as GrandTotals;
        aggregated.grandTotalPPR += gt.grandTotalPPR || 0;
        aggregated.grandTotalEco += gt.grandTotalEco || 0;
        aggregated.grandTotalPrevPrime += gt.grandTotalPrevPrime || 0;
        aggregated.grandTotalPrevTreso += gt.grandTotalPrevTreso || 0;
        aggregated.grandTotalRealPrime += gt.grandTotalRealPrime || 0;
        aggregated.grandTotalRealTreso += gt.grandTotalRealTreso || 0;
      });

      return aggregated;
    } catch (err) {
      console.error('[PeriodResults] Error in getMonthlyAggregation:', err);
      return null;
    }
  }

  /**
   * Calcule les totaux pour une année (agrégation de toutes les semaines)
   */
  async getYearlyAggregation(fiscalYear: number): Promise<GrandTotals | null> {
    try {
      const { data, error } = await supabase
        .from('module3_period_results')
        .select('grand_totals')
        .eq('company_id', this.companyId)
        .eq('period_type', 'WEEK')
        .eq('fiscal_year', fiscalYear);

      if (error || !data || data.length === 0) {
        return null;
      }

      const aggregated: GrandTotals = {
        grandTotalPPR: 0,
        grandTotalEco: 0,
        grandTotalPrevPrime: 0,
        grandTotalPrevTreso: 0,
        grandTotalRealPrime: 0,
        grandTotalRealTreso: 0
      };

      data.forEach(d => {
        const gt = d.grand_totals as GrandTotals;
        aggregated.grandTotalPPR += gt.grandTotalPPR || 0;
        aggregated.grandTotalEco += gt.grandTotalEco || 0;
        aggregated.grandTotalPrevPrime += gt.grandTotalPrevPrime || 0;
        aggregated.grandTotalPrevTreso += gt.grandTotalPrevTreso || 0;
        aggregated.grandTotalRealPrime += gt.grandTotalRealPrime || 0;
        aggregated.grandTotalRealTreso += gt.grandTotalRealTreso || 0;
      });

      return aggregated;
    } catch (err) {
      console.error('[PeriodResults] Error in getYearlyAggregation:', err);
      return null;
    }
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createPeriodResultsService(companyId: string): PeriodResultsService {
  return new PeriodResultsService(companyId);
}
