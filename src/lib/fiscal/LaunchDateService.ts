/**
 * ============================================
 * LaunchDateService - Gestion de la Date de Lancement
 * ============================================
 *
 * Gère la date de lancement de la plateforme pour chaque entreprise.
 * Permet de projeter les périodes abstraites (N+1, N+2, N+3) sur des dates réelles.
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface LaunchConfig {
  id?: string;
  companyId: string;
  platformLaunchDate: Date;
  planDurationYears: number; // 3 par défaut
  fiscalYearStartMonth: number; // 1 = janvier
  createdAt?: Date;
  updatedAt?: Date;
  // Nouvelles propriétés pour verrouillage CASCADE
  lockedDates?: LockedDateConfig;
  cascadeConfig?: CascadeConfig;
}

export interface DateProjection {
  yearOffset: number; // 1=N+1, 2=N+2, 3=N+3
  label: string; // "N+1", "N+2", "N+3"
  startDate: Date;
  endDate: Date;
  daysUntilStart: number;
  daysUntilEnd: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
  percentComplete: number;
}

export interface QuarterProjection {
  yearOffset: number;
  quarter: number; // 1-4
  label: string; // "Q1 2026"
  startDate: Date;
  endDate: Date;
  daysUntilStart: number;
  daysUntilEnd: number;
  weekStart: number; // Semaine de début dans l'année
  weekEnd: number; // Semaine de fin dans l'année
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface WeekProjection {
  yearOffset: number;
  weekNumber: number;
  label: string; // "Sem 12 (18-24 Mars)"
  startDate: Date;
  endDate: Date;
  daysUntilStart: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface CountdownInfo {
  daysUntilLaunch: number;
  isLaunched: boolean;
  launchDate: Date;
  planEndDate: Date;
  daysUntilPlanEnd: number;
  totalPlanDays: number;
  daysElapsed: number;
  percentComplete: number;
  currentYear: DateProjection | null;
  nextMilestone: {
    label: string;
    date: Date;
    daysRemaining: number;
  } | null;
}

// ============================================
// TYPES POUR VERROUILLAGE DES DATES (CASCADE)
// ============================================

/**
 * Une date verrouillée comme objectif fixe
 */
export interface LockedDate {
  yearOffset: number;
  periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK';
  periodNumber?: number;
  lockedDate: Date;
  lockedAt: Date;
  lockedBy?: string;
}

/**
 * Configuration des dates verrouillées par année
 */
export interface LockedDateConfig {
  [yearOffset: number]: {
    isLocked: boolean;
    lockedDate?: Date;
    lockedAt?: Date;
    lockedBy?: string;
    quarters?: {
      [quarter: number]: LockedDate;
    };
    months?: {
      [month: number]: LockedDate;
    };
  };
}

/**
 * Mode de cascade pour le recalcul des dates
 */
export type CascadeMode = 'CASCADE' | 'INDEPENDENT' | 'CHAIN';

/**
 * Configuration du mode cascade
 */
export interface CascadeConfig {
  mode: CascadeMode;
  autoRecalculate: boolean;
}

// ============================================
// LAUNCH DATE SERVICE
// ============================================

export class LaunchDateService {
  private config: LaunchConfig | null = null;
  private today: Date;
  private cascadeConfig: CascadeConfig = {
    mode: 'CASCADE',
    autoRecalculate: true,
  };

  constructor() {
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
  }

  // =====================
  // GETTERS
  // =====================

  getConfig(): LaunchConfig | null {
    return this.config;
  }

  /**
   * Met à jour la configuration en mémoire (sans sauvegarder en base)
   * Utilisé pour synchroniser le service avec une config externe
   */
  setConfig(config: LaunchConfig | null): void {
    this.config = config;
  }

  getCascadeConfig(): CascadeConfig {
    return this.cascadeConfig;
  }

  // =====================
  // CONFIGURATION
  // =====================

  /**
   * Charge la configuration de lancement depuis Supabase
   */
  async loadConfig(companyId: string): Promise<LaunchConfig | null> {
    try {
      console.log('[LaunchDateService] 📥 Loading config for companyId:', companyId);

      const { data, error } = await supabase
        .from('company_launch_config')
        .select('*')
        .eq('company_id', companyId)
        .single();

      console.log('[LaunchDateService] 📦 Raw data from Supabase:', data);
      console.log('[LaunchDateService] 📅 platform_launch_date:', data?.platform_launch_date);

      if (error) {
        console.log('[LaunchDateService] ⚠️ Error or no config:', error?.message);
        // Table n'existe peut-être pas encore ou pas de config
        return null;
      }

      // Parser les dates verrouillées si présentes
      let lockedDates: LockedDateConfig | undefined;
      console.log('[LaunchDateService] 🔒 Raw locked_dates_json from DB:', data.locked_dates_json);
      if (data.locked_dates_json) {
        try {
          lockedDates = this.parseLockedDatesFromJson(
            typeof data.locked_dates_json === 'string'
              ? JSON.parse(data.locked_dates_json)
              : data.locked_dates_json
          );
          console.log('[LaunchDateService] 🔒 Parsed lockedDates:', JSON.stringify(lockedDates, null, 2));
        } catch (e) {
          console.warn('[LaunchDateService] ⚠️ Failed to parse locked_dates_json:', e);
        }
      } else {
        console.log('[LaunchDateService] 🔒 No locked_dates_json in database');
      }

      // Parser le mode CASCADE si présent
      if (data.cascade_mode) {
        this.cascadeConfig.mode = data.cascade_mode as CascadeMode;
      }

      // FIX: Parser la date correctement pour éviter les problèmes de fuseau horaire
      // "2025-12-01" doit rester le 1er décembre, pas revenir au 30 novembre
      const [year, month, day] = data.platform_launch_date.split('-').map(Number);
      const launchDate = new Date(year, month - 1, day, 12, 0, 0); // Midi pour éviter les problèmes de TZ

      console.log('[LaunchDateService] ✅ Parsed launch date:', launchDate.toLocaleDateString('fr-FR'));

      this.config = {
        id: data.id,
        companyId: data.company_id,
        platformLaunchDate: launchDate,
        planDurationYears: data.plan_duration_years || 3,
        fiscalYearStartMonth: data.fiscal_year_start_month || 1,
        createdAt: data.created_at ? new Date(data.created_at) : undefined,
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        lockedDates,
        cascadeConfig: this.cascadeConfig,
      };

      return this.config;
    } catch (error) {
      console.error('Error loading launch config:', error);
      return null;
    }
  }

  /**
   * Sauvegarde la configuration de lancement
   */
  async saveConfig(config: Omit<LaunchConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string }> {
    try {
      // FIX: Formatter la date en utilisant les composants locaux, PAS toISOString() qui convertit en UTC
      const d = config.platformLaunchDate;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateToSave = `${year}-${month}-${day}`;

      console.log('[LaunchDateService] 💾 Saving config...');
      console.log('[LaunchDateService] 📅 Original date object:', d.toLocaleDateString('fr-FR'), '(', d.toISOString(), ')');
      console.log('[LaunchDateService] 📅 Date to save (formatted locally):', dateToSave);
      console.log('[LaunchDateService] 🏢 Company ID:', config.companyId);

      const record = {
        company_id: config.companyId,
        platform_launch_date: dateToSave,
        plan_duration_years: config.planDurationYears,
        fiscal_year_start_month: config.fiscalYearStartMonth,
        updated_at: new Date().toISOString(),
      };

      console.log('[LaunchDateService] 📝 Record to upsert:', record);

      const { error, data } = await supabase
        .from('company_launch_config')
        .upsert(record, {
          onConflict: 'company_id',
        })
        .select()
        .single();

      if (error) {
        console.error('[LaunchDateService] ❌ Upsert error:', JSON.stringify(error, null, 2));
        console.error('[LaunchDateService] ❌ Error code:', error.code);
        console.error('[LaunchDateService] ❌ Error message:', error.message);
        console.error('[LaunchDateService] ❌ Error details:', error.details);
        throw new Error(error.message || 'Supabase error');
      }

      console.log('[LaunchDateService] ✅ Upsert successful, returned data:', data);
      console.log('[LaunchDateService] 📅 Saved date in DB:', data?.platform_launch_date);

      // Mettre à jour le cache local avec la date correctement parsée
      if (data?.platform_launch_date) {
        const [year, month, day] = data.platform_launch_date.split('-').map(Number);
        const parsedDate = new Date(year, month - 1, day, 12, 0, 0);

        this.config = {
          ...config,
          platformLaunchDate: parsedDate,
          updatedAt: new Date(),
        };

        console.log('[LaunchDateService] 📦 Updated cache with date:', parsedDate.toLocaleDateString('fr-FR'));
      } else {
        this.config = {
          ...config,
          updatedAt: new Date(),
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving launch config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Supprime la configuration de lancement (avec archivage dans l'historique)
   */
  async deleteConfig(companyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // D'abord, archiver dans l'historique si la table existe
      const currentConfig = await this.loadConfig(companyId);
      if (currentConfig) {
        try {
          await supabase
            .from('company_launch_config_history')
            .insert({
              company_id: companyId,
              platform_launch_date: currentConfig.platformLaunchDate.toISOString().split('T')[0],
              plan_duration_years: currentConfig.planDurationYears,
              fiscal_year_start_month: currentConfig.fiscalYearStartMonth,
              action: 'DELETE',
              deleted_at: new Date().toISOString(),
            });
        } catch {
          // Table historique n'existe peut-être pas encore, on continue
          }
      }

      // Supprimer la configuration
      const { error } = await supabase
        .from('company_launch_config')
        .delete()
        .eq('company_id', companyId);

      if (error) throw error;

      // Réinitialiser le cache local
      this.config = null;

      return { success: true };
    } catch (error) {
      console.error('Error deleting launch config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Définit la date de lancement (sans persistence)
   * IMPORTANT: Préserve les lockedDates si elles existent déjà
   */
  setLaunchDate(date: Date, planDurationYears: number = 3): void {
    // Préserver les données existantes (lockedDates, cascadeConfig, etc.)
    const existingLockedDates = this.config?.lockedDates;
    const existingCascadeConfig = this.config?.cascadeConfig;
    const existingCompanyId = this.config?.companyId || '';

    this.config = {
      companyId: existingCompanyId,
      platformLaunchDate: date,
      planDurationYears,
      fiscalYearStartMonth: 1,
      lockedDates: existingLockedDates,
      cascadeConfig: existingCascadeConfig,
    };
  }

  /**
   * Vérifie si la configuration est chargée
   */
  hasConfig(): boolean {
    return this.config !== null;
  }

  /**
   * Obtient la date de lancement
   */
  getLaunchDate(): Date | null {
    return this.config?.platformLaunchDate || null;
  }

  // =====================
  // PROJECTIONS ANNUELLES
  // =====================

  /**
   * Projette les années N+1, N+2, N+3 sur des dates réelles
   */
  projectYears(): DateProjection[] {
    if (!this.config) return [];

    const launchDate = new Date(this.config.platformLaunchDate);
    launchDate.setHours(0, 0, 0, 0);

    const projections: DateProjection[] = [];

    for (let offset = 1; offset <= this.config.planDurationYears; offset++) {
      const startDate = new Date(launchDate);
      // FIX: N+1 commence à la date de lancement (pas +1 an après)
      // offset=1 → +0 an, offset=2 → +1 an, offset=3 → +2 ans
      startDate.setFullYear(launchDate.getFullYear() + (offset - 1));

      const endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1); // Dernier jour de l'année

      const daysUntilStart = this.daysBetween(this.today, startDate);
      const daysUntilEnd = this.daysBetween(this.today, endDate);

      const isActive = this.today >= startDate && this.today <= endDate;
      const isPast = this.today > endDate;
      const isFuture = this.today < startDate;

      // Calcul du pourcentage de complétion
      let percentComplete = 0;
      if (isPast) {
        percentComplete = 100;
      } else if (isActive) {
        const totalDays = this.daysBetween(startDate, endDate);
        const elapsed = this.daysBetween(startDate, this.today);
        percentComplete = Math.round((elapsed / totalDays) * 100);
      }

      projections.push({
        yearOffset: offset,
        label: `N+${offset}`,
        startDate,
        endDate,
        daysUntilStart,
        daysUntilEnd,
        isActive,
        isPast,
        isFuture,
        percentComplete,
      });
    }

    return projections;
  }

  /**
   * Obtient la projection pour une année spécifique
   */
  getYearProjection(yearOffset: number): DateProjection | null {
    const projections = this.projectYears();
    return projections.find(p => p.yearOffset === yearOffset) || null;
  }

  // =====================
  // PROJECTIONS TRIMESTRIELLES
  // =====================

  /**
   * Projette tous les trimestres sur des dates réelles
   */
  projectQuarters(): QuarterProjection[] {
    if (!this.config) return [];

    const launchDate = new Date(this.config.platformLaunchDate);
    launchDate.setHours(0, 0, 0, 0);

    const projections: QuarterProjection[] = [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let yearOffset = 1; yearOffset <= this.config.planDurationYears; yearOffset++) {
      const yearStart = new Date(launchDate);
      yearStart.setFullYear(launchDate.getFullYear() + yearOffset);

      for (let quarter = 1; quarter <= 4; quarter++) {
        const startMonth = (quarter - 1) * 3;
        const startDate = new Date(yearStart.getFullYear(), startMonth, 1);
        const endDate = new Date(yearStart.getFullYear(), startMonth + 3, 0);

        const daysUntilStart = this.daysBetween(this.today, startDate);
        const daysUntilEnd = this.daysBetween(this.today, endDate);

        const isActive = this.today >= startDate && this.today <= endDate;
        const isPast = this.today > endDate;
        const isFuture = this.today < startDate;

        // Calculer les semaines
        const weekStart = this.getWeekNumber(startDate);
        const weekEnd = this.getWeekNumber(endDate);

        projections.push({
          yearOffset,
          quarter,
          label: `Q${quarter} ${yearStart.getFullYear()}`,
          startDate,
          endDate,
          daysUntilStart,
          daysUntilEnd,
          weekStart,
          weekEnd,
          isActive,
          isPast,
          isFuture,
        });
      }
    }

    return projections;
  }

  /**
   * Obtient la projection pour un trimestre spécifique
   */
  getQuarterProjection(yearOffset: number, quarter: number): QuarterProjection | null {
    const projections = this.projectQuarters();
    return projections.find(p => p.yearOffset === yearOffset && p.quarter === quarter) || null;
  }

  // =====================
  // PROJECTIONS HEBDOMADAIRES
  // =====================

  /**
   * Projette les semaines pour une année donnée
   * IMPORTANT: Utilise la date de début fiscal (launchDate) et non le 1er janvier
   */
  projectWeeks(yearOffset: number): WeekProjection[] {
    if (!this.config) return [];

    const yearProjection = this.getYearProjection(yearOffset);
    if (!yearProjection) return [];

    const projections: WeekProjection[] = [];
    // Utiliser la date de début de l'année fiscale (depuis launchDate)
    const fiscalYearStart = yearProjection.startDate;
    const weeksInYear = 52; // Année fiscale = 52 semaines

    for (let week = 1; week <= weeksInYear; week++) {
      // Calculer les dates à partir de la date de début fiscal
      // Semaine 1 = fiscalYearStart, Semaine 2 = fiscalYearStart + 7 jours, etc.
      const startDate = new Date(fiscalYearStart);
      startDate.setDate(fiscalYearStart.getDate() + (week - 1) * 7);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const daysUntilStart = this.daysBetween(this.today, startDate);
      const isActive = this.today >= startDate && this.today <= endDate;
      const isPast = this.today > endDate;
      const isFuture = this.today < startDate;

      // Format: "Sem 12 (18-24 Mars)"
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      const monthName = startDate.toLocaleDateString('fr-FR', { month: 'short' });

      projections.push({
        yearOffset,
        weekNumber: week,
        label: `Sem ${week} (${startDay}-${endDay} ${monthName})`,
        startDate,
        endDate,
        daysUntilStart,
        isActive,
        isPast,
        isFuture,
      });
    }

    return projections;
  }

  // =====================
  // COUNTDOWN
  // =====================

  /**
   * Obtient les informations de countdown
   */
  getCountdown(): CountdownInfo | null {
    if (!this.config) return null;

    const launchDate = new Date(this.config.platformLaunchDate);
    launchDate.setHours(0, 0, 0, 0);

    const planEndDate = new Date(launchDate);
    planEndDate.setFullYear(launchDate.getFullYear() + this.config.planDurationYears);
    planEndDate.setDate(planEndDate.getDate() - 1);

    const daysUntilLaunch = this.daysBetween(this.today, launchDate);
    const isLaunched = this.today >= launchDate;
    const daysUntilPlanEnd = this.daysBetween(this.today, planEndDate);
    const totalPlanDays = this.daysBetween(launchDate, planEndDate);

    let daysElapsed = 0;
    let percentComplete = 0;

    if (isLaunched) {
      daysElapsed = this.daysBetween(launchDate, this.today);
      percentComplete = Math.min(100, Math.round((daysElapsed / totalPlanDays) * 100));
    }

    // Trouver l'année courante
    const yearProjections = this.projectYears();
    const currentYear = yearProjections.find(p => p.isActive) || null;

    // Trouver le prochain milestone
    let nextMilestone: CountdownInfo['nextMilestone'] = null;

    if (!isLaunched) {
      nextMilestone = {
        label: 'Lancement plateforme',
        date: launchDate,
        daysRemaining: Math.abs(daysUntilLaunch),
      };
    } else {
      // Chercher la prochaine fin de trimestre
      const quarters = this.projectQuarters();
      const nextQuarter = quarters.find(q => q.isFuture || q.isActive);
      if (nextQuarter) {
        nextMilestone = {
          label: `Fin ${nextQuarter.label}`,
          date: nextQuarter.endDate,
          daysRemaining: nextQuarter.daysUntilEnd,
        };
      }
    }

    return {
      daysUntilLaunch,
      isLaunched,
      launchDate,
      planEndDate,
      daysUntilPlanEnd,
      totalPlanDays,
      daysElapsed,
      percentComplete,
      currentYear,
      nextMilestone,
    };
  }

  // =====================
  // CONVERSION PÉRIODE → DATE
  // =====================

  /**
   * Convertit une période abstraite en date réelle
   * Ex: "N+1, Q2" → "01/04/2026 - 30/06/2026"
   */
  periodToRealDate(
    yearOffset: number,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK',
    periodNumber: number = 1
  ): { startDate: Date; endDate: Date; label: string } | null {
    if (!this.config) return null;

    const yearProjection = this.getYearProjection(yearOffset);
    if (!yearProjection) return null;

    const year = yearProjection.startDate.getFullYear();

    switch (periodType) {
      case 'YEAR':
        return {
          startDate: yearProjection.startDate,
          endDate: yearProjection.endDate,
          label: `${year} (${yearProjection.label})`,
        };

      case 'QUARTER': {
        const quarter = this.getQuarterProjection(yearOffset, periodNumber);
        if (!quarter) return null;
        return {
          startDate: quarter.startDate,
          endDate: quarter.endDate,
          label: quarter.label,
        };
      }

      case 'MONTH': {
        const startDate = new Date(year, periodNumber - 1, 1);
        const endDate = new Date(year, periodNumber, 0);
        const monthName = startDate.toLocaleDateString('fr-FR', { month: 'long' });
        return {
          startDate,
          endDate,
          label: `${monthName} ${year}`,
        };
      }

      case 'WEEK': {
        const { startDate, endDate } = this.getWeekDates(year, periodNumber);
        return {
          startDate,
          endDate,
          label: `Semaine ${periodNumber} - ${year}`,
        };
      }

      default:
        return null;
    }
  }

  /**
   * Obtient la date exacte à laquelle un objectif devrait être atteint
   */
  getTargetDate(yearOffset: number, periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK', periodNumber: number = 1): Date | null {
    const period = this.periodToRealDate(yearOffset, periodType, periodNumber);
    return period ? period.endDate : null;
  }

  /**
   * Calcule combien de jours restent jusqu'à une échéance
   */
  getDaysUntilTarget(yearOffset: number, periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK', periodNumber: number = 1): number | null {
    const targetDate = this.getTargetDate(yearOffset, periodType, periodNumber);
    if (!targetDate) return null;
    return this.daysBetween(this.today, targetDate);
  }

  // =====================
  // FORMATAGE
  // =====================

  /**
   * Formate une date pour affichage
   */
  formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const options: Intl.DateTimeFormatOptions = {
      short: { day: 'numeric', month: 'numeric', year: '2-digit' },
      medium: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    }[format];

    return date.toLocaleDateString('fr-FR', options);
  }

  /**
   * Formate une plage de dates
   */
  formatDateRange(startDate: Date, endDate: Date): string {
    const start = this.formatDate(startDate, 'short');
    const end = this.formatDate(endDate, 'short');
    return `${start} → ${end}`;
  }

  /**
   * Formate les jours restants en texte
   */
  formatDaysRemaining(days: number): string {
    if (days < 0) {
      return `${Math.abs(days)} jours passés`;
    } else if (days === 0) {
      return "Aujourd'hui";
    } else if (days === 1) {
      return 'Demain';
    } else if (days < 7) {
      return `${days} jours`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mois`;
    } else {
      const years = Math.floor(days / 365);
      const remainingMonths = Math.floor((days % 365) / 30);
      if (remainingMonths > 0) {
        return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
      }
      return `${years} an${years > 1 ? 's' : ''}`;
    }
  }

  // =====================
  // VERROUILLAGE DES DATES (CASCADE)
  // =====================

  /**
   * Vérifie si une date est verrouillée
   * MODE CASCADE: Si l'année est verrouillée, tous ses trimestres, mois et semaines
   * sont automatiquement considérés comme verrouillés
   */
  isDateLocked(
    yearOffset: number,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number
  ): boolean {
    if (!this.config?.lockedDates) return false;

    const yearConfig = this.config.lockedDates[yearOffset];
    if (!yearConfig) return false;

    // Si l'année est verrouillée, TOUS les sous-périodes (trimestres, mois, semaines) sont verrouillées
    // C'est le comportement CASCADE
    if (yearConfig.isLocked === true) {
      return true;
    }

    // Sinon, vérifier si la période spécifique est verrouillée individuellement
    if (periodType === 'QUARTER' && periodNumber !== undefined) {
      return !!yearConfig.quarters?.[periodNumber];
    }

    if (periodType === 'MONTH' && periodNumber !== undefined) {
      return !!yearConfig.months?.[periodNumber];
    }

    return false;
  }

  /**
   * Obtient les informations d'une date verrouillée
   * MODE CASCADE: Si l'année est verrouillée, retourne les infos de l'année
   * pour les sous-périodes (trimestres, mois, semaines)
   */
  getLockedDate(
    yearOffset: number,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number
  ): LockedDate | null {
    if (!this.config?.lockedDates) return null;

    const yearConfig = this.config.lockedDates[yearOffset];
    if (!yearConfig) return null;

    // Si l'année est verrouillée, retourner les infos de l'année pour toutes les sous-périodes
    // C'est le comportement CASCADE
    if (yearConfig.isLocked && yearConfig.lockedDate) {
      return {
        yearOffset,
        periodType: 'YEAR',
        lockedDate: yearConfig.lockedDate,
        lockedAt: yearConfig.lockedAt || new Date(),
        lockedBy: yearConfig.lockedBy,
      };
    }

    // Sinon, vérifier si la période spécifique est verrouillée individuellement
    if (periodType === 'QUARTER' && periodNumber !== undefined) {
      return yearConfig.quarters?.[periodNumber] || null;
    }

    if (periodType === 'MONTH' && periodNumber !== undefined) {
      return yearConfig.months?.[periodNumber] || null;
    }

    return null;
  }

  /**
   * Retourne toutes les périodes verrouillées sous forme de Record<string, boolean>
   * Format des clés: "year_1", "quarter_1_2", "month_1_6", "week_1_15"
   * Utilisé par CalendarPeriodSelector pour vérifier rapidement les verrous
   */
  getAllLockedPeriodsFlat(): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    if (!this.config?.lockedDates) return result;

    for (const [yearOffsetStr, yearConfig] of Object.entries(this.config.lockedDates)) {
      const yearOffset = parseInt(yearOffsetStr, 10);
      if (isNaN(yearOffset)) continue;

      // Année verrouillée
      if (yearConfig.isLocked) {
        result[`year_${yearOffset}`] = true;

        // Mode CASCADE: marquer aussi toutes les sous-périodes comme verrouillées
        for (let q = 1; q <= 4; q++) {
          result[`quarter_${yearOffset}_${q}`] = true;
        }
        for (let m = 1; m <= 12; m++) {
          result[`month_${yearOffset}_${m}`] = true;
        }
        for (let w = 1; w <= 52; w++) {
          result[`week_${yearOffset}_${w}`] = true;
        }
      }

      // Trimestres verrouillés individuellement
      if (yearConfig.quarters) {
        for (const [qStr, qData] of Object.entries(yearConfig.quarters)) {
          const q = parseInt(qStr, 10);
          if (!isNaN(q) && qData) {
            result[`quarter_${yearOffset}_${q}`] = true;

            // CASCADE: verrouiller aussi les mois et semaines du trimestre
            const startMonth = (q - 1) * 3 + 1;
            for (let m = startMonth; m < startMonth + 3; m++) {
              result[`month_${yearOffset}_${m}`] = true;
            }
            const startWeek = (q - 1) * 13 + 1;
            for (let w = startWeek; w < startWeek + 13; w++) {
              result[`week_${yearOffset}_${w}`] = true;
            }
          }
        }
      }

      // Mois verrouillés individuellement
      if (yearConfig.months) {
        for (const [mStr, mData] of Object.entries(yearConfig.months)) {
          const m = parseInt(mStr, 10);
          if (!isNaN(m) && mData) {
            result[`month_${yearOffset}_${m}`] = true;

            // CASCADE: verrouiller aussi les semaines du mois (~4 semaines par mois)
            const startWeek = Math.floor((m - 1) * 4.33) + 1;
            const endWeek = Math.floor(m * 4.33);
            for (let w = startWeek; w <= endWeek; w++) {
              result[`week_${yearOffset}_${w}`] = true;
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Vérifie si une semaine spécifique est verrouillée (par numéro de semaine)
   * Prend en compte le mode CASCADE
   */
  isWeekLocked(yearOffset: number, weekNumber: number): boolean {
    if (!this.config?.lockedDates) return false;

    const yearConfig = this.config.lockedDates[yearOffset];
    if (!yearConfig) return false;

    // Si l'année entière est verrouillée (CASCADE)
    if (yearConfig.isLocked) return true;

    // Vérifier si le trimestre contenant cette semaine est verrouillé
    const quarter = Math.ceil(weekNumber / 13);
    if (yearConfig.quarters?.[quarter]) return true;

    // Vérifier si le mois contenant cette semaine est verrouillé
    const month = Math.ceil(weekNumber / 4.33);
    if (yearConfig.months?.[month]) return true;

    return false;
  }

  /**
   * Verrouille une date comme objectif fixe
   */
  lockDate(
    yearOffset: number,
    date: Date,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number,
    lockedBy?: string
  ): void {
    if (!this.config) return;

    // Initialiser lockedDates si nécessaire
    if (!this.config.lockedDates) {
      this.config.lockedDates = {};
    }

    // Initialiser la config pour cette année si nécessaire
    if (!this.config.lockedDates[yearOffset]) {
      this.config.lockedDates[yearOffset] = {
        isLocked: false,
      };
    }

    const yearConfig = this.config.lockedDates[yearOffset];
    const now = new Date();

    if (periodType === 'YEAR') {
      yearConfig.isLocked = true;
      yearConfig.lockedDate = date;
      yearConfig.lockedAt = now;
      yearConfig.lockedBy = lockedBy;

      // Mode CASCADE: Recalculer les années futures
      if (this.cascadeConfig.mode === 'CASCADE' && this.cascadeConfig.autoRecalculate) {
        this.recalculateFutureYears(yearOffset);
      }
    } else if (periodType === 'QUARTER' && periodNumber !== undefined) {
      if (!yearConfig.quarters) yearConfig.quarters = {};
      yearConfig.quarters[periodNumber] = {
        yearOffset,
        periodType: 'QUARTER',
        periodNumber,
        lockedDate: date,
        lockedAt: now,
        lockedBy,
      };
    } else if (periodType === 'MONTH' && periodNumber !== undefined) {
      if (!yearConfig.months) yearConfig.months = {};
      yearConfig.months[periodNumber] = {
        yearOffset,
        periodType: 'MONTH',
        periodNumber,
        lockedDate: date,
        lockedAt: now,
        lockedBy,
      };
    }
  }

  /**
   * Déverrouille une date
   */
  unlockDate(
    yearOffset: number,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number
  ): void {
    if (!this.config?.lockedDates) return;

    const yearConfig = this.config.lockedDates[yearOffset];
    if (!yearConfig) return;

    if (periodType === 'YEAR') {
      yearConfig.isLocked = false;
      delete yearConfig.lockedDate;
      delete yearConfig.lockedAt;
      delete yearConfig.lockedBy;
    } else if (periodType === 'QUARTER' && periodNumber !== undefined && yearConfig.quarters) {
      delete yearConfig.quarters[periodNumber];
    } else if (periodType === 'MONTH' && periodNumber !== undefined && yearConfig.months) {
      delete yearConfig.months[periodNumber];
    }
  }

  /**
   * Définit toutes les dates verrouillées en batch
   * Utilisé par LaunchDateSelector pour sauvegarder l'état complet des verrous
   */
  setLockedDates(lockedDates: LockedDateConfig): void {
    if (!this.config) {
      console.warn('setLockedDates called without config');
      return;
    }
    this.config.lockedDates = lockedDates;
  }

  /**
   * Toggle le verrouillage d'une date
   */
  toggleDateLock(
    yearOffset: number,
    currentDate: Date,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number,
    lockedBy?: string
  ): boolean {
    const isLocked = this.isDateLocked(yearOffset, periodType, periodNumber);

    if (isLocked) {
      this.unlockDate(yearOffset, periodType, periodNumber);
      return false;
    } else {
      this.lockDate(yearOffset, currentDate, periodType, periodNumber, lockedBy);
      return true;
    }
  }

  /**
   * Recalcule les dates des années futures basé sur une année verrouillée
   * Mode CASCADE: Les années futures partent de la fin de l'année verrouillée
   */
  private recalculateFutureYears(lockedYearOffset: number): void {
    if (!this.config?.lockedDates) return;

    const lockedYear = this.config.lockedDates[lockedYearOffset];
    if (!lockedYear?.isLocked || !lockedYear.lockedDate) return;

    // La date de fin de l'année verrouillée devient la base
    const lockedEndDate = new Date(lockedYear.lockedDate);

    // Recalculer les années suivantes
    for (let offset = lockedYearOffset + 1; offset <= this.config.planDurationYears; offset++) {
      if (!this.config.lockedDates[offset]?.isLocked) {
        // Cette année n'est pas verrouillée, elle sera recalculée dynamiquement
        // en fonction de la date verrouillée précédente
        // (Le SmartDateWidget gère ça automatiquement)
      }
    }
  }

  /**
   * Parse les dates verrouillées depuis le JSON Supabase
   */
  parseLockedDatesFromJson(json: Record<string, unknown> | null): LockedDateConfig {
    console.log('[LaunchDateService] 🔍 parseLockedDatesFromJson input:', JSON.stringify(json, null, 2));
    if (!json) return {};

    const lockedDates: LockedDateConfig = {};

    for (const [key, value] of Object.entries(json)) {
      console.log('[LaunchDateService] 🔍 Processing key:', key, 'value:', JSON.stringify(value));
      const yearOffset = parseInt(key, 10);
      if (isNaN(yearOffset)) {
        console.log('[LaunchDateService] 🔍 Skipping non-numeric key:', key);
        continue;
      }

      const yearData = value as Record<string, unknown>;
      lockedDates[yearOffset] = {
        isLocked: yearData.isLocked === true,
        lockedDate: yearData.lockedDate ? new Date(yearData.lockedDate as string) : undefined,
        lockedAt: yearData.lockedAt ? new Date(yearData.lockedAt as string) : undefined,
        lockedBy: yearData.lockedBy as string | undefined,
      };

      // Parse quarters if present
      if (yearData.quarters && typeof yearData.quarters === 'object') {
        lockedDates[yearOffset].quarters = {};
        for (const [qKey, qValue] of Object.entries(yearData.quarters as Record<string, unknown>)) {
          const quarterNum = parseInt(qKey, 10);
          if (isNaN(quarterNum)) continue;
          const qData = qValue as Record<string, unknown>;
          lockedDates[yearOffset].quarters![quarterNum] = {
            yearOffset,
            periodType: 'QUARTER',
            periodNumber: quarterNum,
            lockedDate: new Date(qData.lockedDate as string),
            lockedAt: new Date(qData.lockedAt as string),
            lockedBy: qData.lockedBy as string | undefined,
          };
        }
      }
    }

    return lockedDates;
  }

  /**
   * Sérialise les dates verrouillées pour stockage JSON
   */
  serializeLockedDatesToJson(lockedDates: LockedDateConfig): Record<string, unknown> {
    const json: Record<string, unknown> = {};

    for (const [yearOffset, yearData] of Object.entries(lockedDates)) {
      json[yearOffset] = {
        isLocked: yearData.isLocked,
        lockedDate: yearData.lockedDate?.toISOString(),
        lockedAt: yearData.lockedAt?.toISOString(),
        lockedBy: yearData.lockedBy,
        quarters: yearData.quarters ? Object.fromEntries(
          Object.entries(yearData.quarters).map(([k, v]) => [k, {
            lockedDate: v.lockedDate.toISOString(),
            lockedAt: v.lockedAt.toISOString(),
            lockedBy: v.lockedBy,
          }])
        ) : undefined,
      };
    }

    return json;
  }

  /**
   * Sauvegarde les dates verrouillées dans Supabase
   */
  async saveLockedDates(companyId: string): Promise<{ success: boolean; error?: string }> {
    const lockedDates: LockedDateConfig = this.config?.lockedDates || {};

    console.log('[LaunchDateService] 🔒 saveLockedDates called for companyId:', companyId);
    console.log('[LaunchDateService] 🔒 lockedDates to save:', JSON.stringify(lockedDates, null, 2));

    try {
      const lockedDatesJson = this.serializeLockedDatesToJson(lockedDates);
      console.log('[LaunchDateService] 🔒 Serialized JSON:', JSON.stringify(lockedDatesJson, null, 2));

      const { error } = await supabase
        .from('company_launch_config')
        .update({
          locked_dates_json: lockedDatesJson,
          cascade_mode: this.cascadeConfig.mode,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId);

      // Gérer gracieusement si les colonnes n'existent pas encore
      if (error?.message?.includes('column') || error?.code === '42703') {
        console.warn('[LaunchDateService] ⚠️ Locked dates columns not found in database. Please run the migration.');
        return { success: true }; // Ne pas bloquer si migration pas encore faite
      }

      if (error) {
        console.error('[LaunchDateService] ❌ Error saving locked dates:', error);
        throw error;
      }

      console.log('[LaunchDateService] ✅ Locked dates saved successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error saving locked dates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =====================
  // UTILITAIRES PRIVÉS
  // =====================

  private daysBetween(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getWeeksInYear(year: number): number {
    const dec31 = new Date(year, 11, 31);
    const week = this.getWeekNumber(dec31);
    return week === 1 ? 52 : week;
  }

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
}

// ============================================
// FONCTION: DERNIÈRE SEMAINE COMPLÉTÉE
// ============================================

/**
 * Résultat de la recherche de la dernière semaine complétée
 */
export interface LastCompletedWeekResult {
  found: boolean;
  weekNumber: number;
  yearOffset: number;
  fiscalYear: string; // "N+1", "N+2", etc.
  weekStart: Date;
  weekEnd: Date;
  periodLabel: string;
  hasData: boolean;
}

/**
 * Trouve la dernière semaine qui a des données enregistrées dans module3_cost_entries
 * Cette fonction est utilisée par les pages 2-7 pour afficher les données de la dernière semaine complétée
 * au lieu de la semaine courante (qui peut être vide)
 */
export async function getLastCompletedWeek(companyId: string): Promise<LastCompletedWeekResult | null> {
  try {
    console.log('[getLastCompletedWeek] 🔍 Searching for last completed week for company:', companyId);

    // 1. Charger la config du Smart Calendar
    await launchDateService.loadConfig(companyId);
    const config = launchDateService.getConfig();

    if (!config?.platformLaunchDate) {
      console.log('[getLastCompletedWeek] ⚠️ No launch date configured');
      return null;
    }

    const launchDate = new Date(config.platformLaunchDate);
    launchDate.setHours(0, 0, 0, 0);

    // 2. Chercher la dernière entrée de coût avec des données
    const { data: lastEntry, error } = await supabase
      .from('module3_cost_entries')
      .select('period_start, period_end')
      .eq('company_id', companyId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[getLastCompletedWeek] ❌ Error fetching last entry:', error);
      return null;
    }

    // 3. Si aucune donnée, retourner semaine 1 par défaut (mais sans données)
    if (!lastEntry) {
      console.log('[getLastCompletedWeek] ⚠️ No cost entries found, returning week 1');

      const weekStart = new Date(launchDate);
      const weekEnd = new Date(launchDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return {
        found: false,
        weekNumber: 1,
        yearOffset: 1,
        fiscalYear: 'N+1',
        weekStart,
        weekEnd,
        periodLabel: `Semaine 1 — N+1 (${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })})`,
        hasData: false
      };
    }

    // 4. Parser les dates de la dernière entrée
    const [startYear, startMonth, startDay] = lastEntry.period_start.split('-').map(Number);
    const periodStartDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);

    // 5. Calculer le numéro de semaine fiscale
    const diffTime = periodStartDate.getTime() - launchDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.max(1, Math.floor(diffDays / 7) + 1);

    // 6. Calculer le yearOffset (N+1, N+2, etc.)
    const weeksPerYear = 52;
    const yearOffset = Math.floor((weekNumber - 1) / weeksPerYear) + 1;
    const weekInYear = ((weekNumber - 1) % weeksPerYear) + 1;

    // 7. Recalculer les dates exactes de la semaine
    const weekStart = new Date(launchDate);
    weekStart.setDate(launchDate.getDate() + (weekNumber - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const fiscalYear = `N+${yearOffset}`;
    const periodLabel = `Semaine ${weekInYear} — ${fiscalYear} (${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })})`;

    console.log(`[getLastCompletedWeek] ✅ Found week ${weekInYear} of ${fiscalYear}: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);

    return {
      found: true,
      weekNumber: weekInYear,
      yearOffset,
      fiscalYear,
      weekStart,
      weekEnd,
      periodLabel,
      hasData: true
    };

  } catch (error) {
    console.error('[getLastCompletedWeek] ❌ Error:', error);
    return null;
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const launchDateService = new LaunchDateService();

// ============================================
// HOOK REACT
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useLaunchDate(companyId: string | null) {
  const [config, setConfig] = useState<LaunchConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la configuration
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const loadConfig = async () => {
      setLoading(true);
      setError(null);

      const result = await launchDateService.loadConfig(companyId);
      setConfig(result);
      setLoading(false);
    };

    loadConfig();
  }, [companyId]);

  // Sauvegarder la configuration
  const saveLaunchDate = useCallback(async (
    launchDate: Date,
    planDurationYears: number = 3
  ) => {
    if (!companyId) return { success: false, error: 'No company ID' };

    console.log('[useLaunchDate] 💾 Saving launch date:', launchDate.toLocaleDateString('fr-FR'));

    const result = await launchDateService.saveConfig({
      companyId,
      platformLaunchDate: launchDate,
      planDurationYears,
      fiscalYearStartMonth: 1,
    });

    if (result.success) {
      console.log('[useLaunchDate] ✅ Save successful, reloading config from DB...');

      // IMPORTANT: Recharger depuis la DB pour s'assurer de la cohérence
      const reloadedConfig = await launchDateService.loadConfig(companyId);

      if (reloadedConfig) {
        console.log('[useLaunchDate] 📅 Reloaded date:', reloadedConfig.platformLaunchDate.toLocaleDateString('fr-FR'));
        setConfig(reloadedConfig);
      } else {
        // Fallback: utiliser la date qu'on vient de sauvegarder
        setConfig({
          companyId,
          platformLaunchDate: launchDate,
          planDurationYears,
          fiscalYearStartMonth: 1,
        });
      }
    } else {
      console.error('[useLaunchDate] ❌ Save failed:', result.error);
    }

    return result;
  }, [companyId]);

  // Supprimer la configuration
  const deleteLaunchDate = useCallback(async () => {
    if (!companyId) return { success: false, error: 'No company ID' };

    const result = await launchDateService.deleteConfig(companyId);

    if (result.success) {
      setConfig(null);
    }

    return result;
  }, [companyId]);

  // Obtenir les projections
  const getProjections = useCallback(() => {
    if (!config) return null;

    launchDateService.setLaunchDate(config.platformLaunchDate, config.planDurationYears);

    return {
      years: launchDateService.projectYears(),
      quarters: launchDateService.projectQuarters(),
      countdown: launchDateService.getCountdown(),
    };
  }, [config]);

  // Recharger la configuration depuis Supabase
  const reloadConfig = useCallback(async () => {
    if (!companyId) return;

    const result = await launchDateService.loadConfig(companyId);
    setConfig(result);
  }, [companyId]);

  // Verrouiller une date
  const lockDate = useCallback(async (
    yearOffset: number,
    date: Date,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number,
    lockedBy?: string
  ) => {
    if (!companyId) return;

    launchDateService.lockDate(yearOffset, date, periodType, periodNumber, lockedBy);

    // Sauvegarder dans Supabase
    await launchDateService.saveLockedDates(companyId);

    // Mettre à jour le state local
    const updatedConfig = launchDateService.getConfig();
    if (updatedConfig) {
      setConfig({ ...updatedConfig });
    }
  }, [companyId]);

  // Déverrouiller une date
  const unlockDate = useCallback(async (
    yearOffset: number,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number
  ) => {
    if (!companyId) return;

    launchDateService.unlockDate(yearOffset, periodType, periodNumber);

    // Sauvegarder dans Supabase
    await launchDateService.saveLockedDates(companyId);

    // Mettre à jour le state local
    const updatedConfig = launchDateService.getConfig();
    if (updatedConfig) {
      setConfig({ ...updatedConfig });
    }
  }, [companyId]);

  // Toggle le verrouillage d'une date
  const toggleDateLock = useCallback(async (
    yearOffset: number,
    currentDate: Date,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number,
    lockedBy?: string
  ): Promise<boolean> => {
    if (!companyId) return false;

    const isNowLocked = launchDateService.toggleDateLock(
      yearOffset,
      currentDate,
      periodType,
      periodNumber,
      lockedBy
    );

    // Sauvegarder dans Supabase
    await launchDateService.saveLockedDates(companyId);

    // Mettre à jour le state local
    const updatedConfig = launchDateService.getConfig();
    if (updatedConfig) {
      setConfig({ ...updatedConfig });
    }

    return isNowLocked;
  }, [companyId]);

  // Vérifier si une date est verrouillée
  const isDateLocked = useCallback((
    yearOffset: number,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number
  ): boolean => {
    return launchDateService.isDateLocked(yearOffset, periodType, periodNumber);
  }, []);

  // Obtenir les infos d'une date verrouillée
  const getLockedDate = useCallback((
    yearOffset: number,
    periodType: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' = 'YEAR',
    periodNumber?: number
  ): LockedDate | null => {
    return launchDateService.getLockedDate(yearOffset, periodType, periodNumber);
  }, []);

  // Sauvegarder toutes les périodes verrouillées en batch
  // Cette fonction est appelée depuis LaunchDateSelector via onLockChange
  const saveLockedPeriods = useCallback(async (
    lockedPeriods: LockedDateConfig
  ): Promise<{ success: boolean; error?: string }> => {
    if (!companyId) return { success: false, error: 'No company ID' };

    try {
      // Mettre à jour le service avec les nouvelles périodes verrouillées
      launchDateService.setLockedDates(lockedPeriods);

      // Sauvegarder dans Supabase
      const result = await launchDateService.saveLockedDates(companyId);

      if (result.success) {
        // Mettre à jour le state local
        const updatedConfig = launchDateService.getConfig();
        if (updatedConfig) {
          setConfig({ ...updatedConfig });
        }
      }

      return result;
    } catch (error) {
      console.error('Error saving locked periods:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [companyId]);

  return {
    config,
    loading,
    error,
    saveLaunchDate,
    deleteLaunchDate,
    getProjections,
    hasLaunchDate: config !== null,
    // Nouvelles fonctions de verrouillage
    reloadConfig,
    lockDate,
    unlockDate,
    toggleDateLock,
    isDateLocked,
    getLockedDate,
    saveLockedPeriods,
  };
}
