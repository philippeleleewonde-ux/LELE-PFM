/**
 * ============================================
 * FiscalCalendarEngine - Moteur de Calendrier Fiscal
 * ============================================
 *
 * Gère la synchronisation entre les données planifiées et le calendrier réel.
 * Utilisé par tous les modules HCM pour:
 * - Déterminer la période courante
 * - Générer les périodes N+1, N+2, N+3
 * - Distribuer les valeurs annuelles sur les périodes
 * - Synchroniser avec Supabase (table fiscal_periods)
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export type PeriodType = 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK';

export interface FiscalPeriod {
  id?: string;
  companyId: string;
  fiscalYear: number;
  periodType: PeriodType;
  periodNumber: number;
  periodLabel: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isClosed: boolean;
  yearOffset: number; // 1=N+1, 2=N+2, 3=N+3
}

export interface CurrentPeriodInfo {
  year: number;
  quarter: number;
  month: number;
  week: number;
  dayOfYear: number;
  isQ1: boolean;
  isQ2: boolean;
  isQ3: boolean;
  isQ4: boolean;
  yearOffset: number; // Par rapport à l'année de base
}

export interface FiscalCalendarConfig {
  baseYear?: number; // Année de référence (défaut: année courante)
  fiscalYearStartMonth?: number; // 1 = janvier (défaut), peut être différent pour certaines entreprises
  includeWeeks?: boolean; // Générer les semaines (plus granulaire)
}

// ============================================
// FISCAL CALENDAR ENGINE
// ============================================

export class FiscalCalendarEngine {
  private config: Required<FiscalCalendarConfig>;
  private today: Date;

  constructor(config: FiscalCalendarConfig = {}) {
    this.today = new Date();
    this.config = {
      baseYear: config.baseYear || this.today.getFullYear(),
      fiscalYearStartMonth: config.fiscalYearStartMonth || 1,
      includeWeeks: config.includeWeeks || false,
    };
  }

  // =====================
  // PÉRIODE COURANTE
  // =====================

  /**
   * Obtient les informations sur la période courante
   */
  getCurrentPeriod(): CurrentPeriodInfo {
    const year = this.today.getFullYear();
    const month = this.today.getMonth() + 1; // 1-12
    const quarter = Math.ceil(month / 3);
    const week = this.getWeekNumber(this.today);
    const dayOfYear = this.getDayOfYear(this.today);

    return {
      year,
      quarter,
      month,
      week,
      dayOfYear,
      isQ1: quarter === 1,
      isQ2: quarter === 2,
      isQ3: quarter === 3,
      isQ4: quarter === 4,
      yearOffset: year - this.config.baseYear,
    };
  }

  /**
   * Vérifie si une date est dans la période courante
   */
  isInCurrentPeriod(date: Date, periodType: PeriodType): boolean {
    const current = this.getCurrentPeriod();

    switch (periodType) {
      case 'YEAR':
        return date.getFullYear() === current.year;
      case 'QUARTER':
        return (
          date.getFullYear() === current.year &&
          Math.ceil((date.getMonth() + 1) / 3) === current.quarter
        );
      case 'MONTH':
        return (
          date.getFullYear() === current.year &&
          date.getMonth() + 1 === current.month
        );
      case 'WEEK':
        return (
          date.getFullYear() === current.year &&
          this.getWeekNumber(date) === current.week
        );
      default:
        return false;
    }
  }

  // =====================
  // GÉNÉRATION DE PÉRIODES
  // =====================

  /**
   * Génère toutes les périodes fiscales pour une entreprise (N+1 à N+3)
   */
  generateFiscalCalendar(companyId: string): FiscalPeriod[] {
    const periods: FiscalPeriod[] = [];

    for (let yearOffset = 1; yearOffset <= 3; yearOffset++) {
      const year = this.config.baseYear + yearOffset;

      // Année complète
      periods.push(this.createYearPeriod(companyId, year, yearOffset));

      // Trimestres
      for (let q = 1; q <= 4; q++) {
        periods.push(this.createQuarterPeriod(companyId, year, q, yearOffset));
      }

      // Mois
      for (let m = 1; m <= 12; m++) {
        periods.push(this.createMonthPeriod(companyId, year, m, yearOffset));
      }

      // Semaines (optionnel)
      if (this.config.includeWeeks) {
        const weeksInYear = this.getWeeksInYear(year);
        for (let w = 1; w <= weeksInYear; w++) {
          periods.push(this.createWeekPeriod(companyId, year, w, yearOffset));
        }
      }
    }

    return periods;
  }

  /**
   * Crée une période annuelle
   */
  private createYearPeriod(
    companyId: string,
    year: number,
    yearOffset: number
  ): FiscalPeriod {
    return {
      companyId,
      fiscalYear: year,
      periodType: 'YEAR',
      periodNumber: 1,
      periodLabel: `${year} (N+${yearOffset})`,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31),
      isCurrent: year === this.today.getFullYear(),
      isClosed: year < this.today.getFullYear(),
      yearOffset,
    };
  }

  /**
   * Crée une période trimestrielle
   */
  private createQuarterPeriod(
    companyId: string,
    year: number,
    quarter: number,
    yearOffset: number
  ): FiscalPeriod {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0); // Dernier jour du trimestre

    const current = this.getCurrentPeriod();
    const isCurrent = year === current.year && quarter === current.quarter;

    return {
      companyId,
      fiscalYear: year,
      periodType: 'QUARTER',
      periodNumber: quarter,
      periodLabel: `Q${quarter} ${year}`,
      startDate,
      endDate,
      isCurrent,
      isClosed: endDate < this.today,
      yearOffset,
    };
  }

  /**
   * Crée une période mensuelle
   */
  private createMonthPeriod(
    companyId: string,
    year: number,
    month: number,
    yearOffset: number
  ): FiscalPeriod {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];

    const current = this.getCurrentPeriod();
    const isCurrent = year === current.year && month === current.month;

    return {
      companyId,
      fiscalYear: year,
      periodType: 'MONTH',
      periodNumber: month,
      periodLabel: `${monthNames[month - 1]} ${year}`,
      startDate,
      endDate,
      isCurrent,
      isClosed: endDate < this.today,
      yearOffset,
    };
  }

  /**
   * Crée une période hebdomadaire
   */
  private createWeekPeriod(
    companyId: string,
    year: number,
    week: number,
    yearOffset: number
  ): FiscalPeriod {
    const { startDate, endDate } = this.getWeekDates(year, week);

    const current = this.getCurrentPeriod();
    const isCurrent = year === current.year && week === current.week;

    return {
      companyId,
      fiscalYear: year,
      periodType: 'WEEK',
      periodNumber: week,
      periodLabel: `S${week.toString().padStart(2, '0')} ${year}`,
      startDate,
      endDate,
      isCurrent,
      isClosed: endDate < this.today,
      yearOffset,
    };
  }

  // =====================
  // DISTRIBUTION DE VALEURS
  // =====================

  /**
   * Distribue une valeur annuelle sur les périodes
   */
  distributeAnnualValue(
    annualValue: number,
    targetPeriodType: PeriodType
  ): { periodNumber: number; value: number }[] {
    const divisor = this.getPeriodDivisor(targetPeriodType);
    const valuePerPeriod = annualValue / divisor;

    const result: { periodNumber: number; value: number }[] = [];
    for (let i = 1; i <= divisor; i++) {
      result.push({ periodNumber: i, value: valuePerPeriod });
    }

    return result;
  }

  /**
   * Distribue avec pondération personnalisée
   */
  distributeWithWeights(
    annualValue: number,
    weights: number[] // Doit totaliser 100
  ): number[] {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => (annualValue * w) / totalWeight);
  }

  /**
   * Obtient la valeur pour une période spécifique
   */
  getValueForPeriod(
    annualValue: number,
    periodType: PeriodType,
    periodNumber: number
  ): number {
    // Distribution égale par défaut
    const divisor = this.getPeriodDivisor(periodType);
    return annualValue / divisor;
  }

  // =====================
  // SUPABASE INTEGRATION
  // =====================

  /**
   * Sauvegarde le calendrier fiscal dans Supabase
   */
  async saveFiscalCalendar(companyId: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const periods = this.generateFiscalCalendar(companyId);

      // Transformer pour Supabase
      const records = periods.map(p => ({
        company_id: p.companyId,
        fiscal_year: p.fiscalYear,
        period_type: p.periodType,
        period_number: p.periodNumber,
        period_label: p.periodLabel,
        start_date: p.startDate.toISOString().split('T')[0],
        end_date: p.endDate.toISOString().split('T')[0],
        is_current: p.isCurrent,
        is_closed: p.isClosed,
        year_offset: p.yearOffset,
      }));

      // Upsert par lots
      const { error } = await supabase
        .from('fiscal_periods')
        .upsert(records, {
          onConflict: 'company_id,fiscal_year,period_type,period_number',
        });

      if (error) throw error;

      return { success: true, count: records.length };
    } catch (error) {
      console.error('Error saving fiscal calendar:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Charge le calendrier fiscal depuis Supabase
   */
  async loadFiscalCalendar(companyId: string): Promise<FiscalPeriod[]> {
    try {
      const { data, error } = await supabase
        .from('fiscal_periods')
        .select('*')
        .eq('company_id', companyId)
        .order('fiscal_year', { ascending: true })
        .order('period_type', { ascending: true })
        .order('period_number', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        companyId: row.company_id,
        fiscalYear: row.fiscal_year,
        periodType: row.period_type as PeriodType,
        periodNumber: row.period_number,
        periodLabel: row.period_label,
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        isCurrent: row.is_current,
        isClosed: row.is_closed,
        yearOffset: row.year_offset,
      }));
    } catch (error) {
      console.error('Error loading fiscal calendar:', error);
      return [];
    }
  }

  /**
   * Récupère la période courante depuis Supabase
   */
  async getCurrentPeriodFromDB(
    companyId: string,
    periodType: PeriodType = 'QUARTER'
  ): Promise<FiscalPeriod | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('fiscal_periods')
        .select('*')
        .eq('company_id', companyId)
        .eq('period_type', periodType)
        .lte('start_date', today)
        .gte('end_date', today)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        companyId: data.company_id,
        fiscalYear: data.fiscal_year,
        periodType: data.period_type as PeriodType,
        periodNumber: data.period_number,
        periodLabel: data.period_label,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        isCurrent: true,
        isClosed: data.is_closed,
        yearOffset: data.year_offset,
      };
    } catch (error) {
      console.error('Error getting current period:', error);
      return null;
    }
  }

  // =====================
  // UTILITAIRES
  // =====================

  /**
   * Obtient le numéro de semaine ISO
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Obtient le jour de l'année
   */
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtient le nombre de semaines dans une année
   */
  private getWeeksInYear(year: number): number {
    const dec31 = new Date(year, 11, 31);
    const week = this.getWeekNumber(dec31);
    return week === 1 ? 52 : week;
  }

  /**
   * Obtient les dates de début et fin d'une semaine
   */
  private getWeekDates(year: number, week: number): { startDate: Date; endDate: Date } {
    const jan1 = new Date(year, 0, 1);
    const days = (week - 1) * 7;
    const dayOfWeek = jan1.getDay();
    const startOffset = (dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek);

    const startDate = new Date(year, 0, 1 + startOffset + days);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return { startDate, endDate };
  }

  /**
   * Obtient le diviseur pour une période
   */
  private getPeriodDivisor(periodType: PeriodType): number {
    switch (periodType) {
      case 'YEAR': return 1;
      case 'QUARTER': return 4;
      case 'MONTH': return 12;
      case 'WEEK': return 52;
      default: return 1;
    }
  }

  /**
   * Formate une date pour affichage
   */
  formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const options: Intl.DateTimeFormatOptions = {
      short: { day: 'numeric', month: 'numeric' },
      medium: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    }[format];

    return date.toLocaleDateString('fr-FR', options);
  }

  /**
   * Calcule le nombre de jours restants dans une période
   */
  getDaysRemainingInPeriod(periodType: PeriodType): number {
    const current = this.getCurrentPeriod();
    let endDate: Date;

    switch (periodType) {
      case 'YEAR':
        endDate = new Date(current.year, 11, 31);
        break;
      case 'QUARTER':
        endDate = new Date(current.year, current.quarter * 3, 0);
        break;
      case 'MONTH':
        endDate = new Date(current.year, current.month, 0);
        break;
      case 'WEEK':
        const weekDates = this.getWeekDates(current.year, current.week);
        endDate = weekDates.endDate;
        break;
      default:
        endDate = this.today;
    }

    const diffTime = endDate.getTime() - this.today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const fiscalCalendar = new FiscalCalendarEngine();
