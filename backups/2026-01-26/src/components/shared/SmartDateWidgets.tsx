/**
 * ============================================
 * SmartDateWidgets - Widgets de Dates Intelligents
 * ============================================
 *
 * Composants de dates dynamiques connectés au LaunchDateService.
 * Utilise la date de lancement configurée pour calculer les périodes N+X.
 *
 * VERSION 3.0 - Intégration CalendarEventBus pour synchronisation temps réel
 *
 * @author LELE HCM Platform
 * @version 3.0.0
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Calendar, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  launchDateService,
  useLaunchDate,
  LaunchConfig,
  LockedDate,
  LockedDateConfig,
  DateProjection,
  QuarterProjection,
  WeekProjection,
} from '@/lib/fiscal/LaunchDateService';
import {
  calendarEventBus,
  useCalendarEvent,
} from '@/lib/fiscal/CalendarEventBus';

// ============================================
// CONTEXT - Partage de la date de lancement
// ============================================

interface LaunchDateContextValue {
  launchDate: Date | null;
  config: LaunchConfig | null;
  loading: boolean;
  hasLaunchDate: boolean;
  // Projections temporelles (NEW v3.0)
  projections: DateProjection[];
  quarters: QuarterProjection[];
  weeks: WeekProjection[];
  lockedPeriodsFlat: Record<string, boolean>;
  // Fonctions de verrouillage
  isDateLocked: (yearOffset: number, periodType?: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK', periodNumber?: number) => boolean;
  toggleDateLock: (yearOffset: number, currentDate: Date, periodType?: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK', periodNumber?: number) => boolean;
  getLockedDate: (yearOffset: number, periodType?: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK', periodNumber?: number) => LockedDate | null;
  // Nouvelle fonction de rafraîchissement (NEW v3.0)
  refreshConfig: () => Promise<void>;
}

const LaunchDateContext = createContext<LaunchDateContextValue>({
  launchDate: null,
  config: null,
  loading: true,
  hasLaunchDate: false,
  projections: [],
  quarters: [],
  weeks: [],
  lockedPeriodsFlat: {},
  isDateLocked: () => false,
  toggleDateLock: () => false,
  getLockedDate: () => null,
  refreshConfig: async () => {},
});

/**
 * Provider pour partager la date de lancement dans l'arbre de composants
 * VERSION 3.0 - Intégration CalendarEventBus
 */
export function LaunchDateProvider({
  companyId,
  children,
}: {
  companyId: string;
  children: React.ReactNode;
}) {
  const {
    config,
    loading,
    hasLaunchDate,
    isDateLocked: isDateLockedHook,
    toggleDateLock: toggleDateLockHook,
    getLockedDate: getLockedDateHook,
    reloadConfig,
  } = useLaunchDate(companyId);

  // États locaux pour les projections (v3.0)
  const [projections, setProjections] = useState<DateProjection[]>([]);
  const [quarters, setQuarters] = useState<QuarterProjection[]>([]);
  const [weeks, setWeeks] = useState<WeekProjection[]>([]);
  const [lockedPeriodsFlat, setLockedPeriodsFlat] = useState<Record<string, boolean>>({});

  // Charger les projections quand la config change
  useEffect(() => {
    if (config && !loading) {
      const yearProjections = launchDateService.projectYears();
      const quarterProjections = launchDateService.projectQuarters();
      const weekProjections = launchDateService.projectWeeks();
      const lockedFlat = launchDateService.getAllLockedPeriodsFlat();

      setProjections(yearProjections);
      setQuarters(quarterProjections);
      setWeeks(weekProjections);
      setLockedPeriodsFlat(lockedFlat);

      // Émettre l'événement de mise à jour de config
      calendarEventBus.emitConfigUpdate(config, yearProjections, quarterProjections);
    }
  }, [config, loading]);

  // Fonction de rafraîchissement (v3.0)
  const refreshConfig = useCallback(async () => {
    if (reloadConfig) {
      await reloadConfig();
      // Les projections seront mises à jour via le useEffect ci-dessus
    }
  }, [reloadConfig]);

  // Wrapper toggleDateLock pour émettre des événements
  const toggleDateLockWithEvent = useCallback((
    yearOffset: number,
    currentDate: Date,
    periodType?: 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK',
    periodNumber?: number
  ): boolean => {
    const result = toggleDateLockHook(yearOffset, currentDate, periodType, periodNumber);

    // Générer la clé de période
    let periodKey = `year_${yearOffset}`;
    if (periodType === 'QUARTER' && periodNumber) {
      periodKey = `quarter_${yearOffset}_${periodNumber}`;
    } else if (periodType === 'MONTH' && periodNumber) {
      periodKey = `month_${yearOffset}_${periodNumber}`;
    } else if (periodType === 'WEEK' && periodNumber) {
      periodKey = `week_${yearOffset}_${periodNumber}`;
    }

    // Émettre l'événement de verrouillage
    calendarEventBus.emitPeriodLocked(
      periodKey,
      result, // true si verrouillé, false si déverrouillé
      currentDate,
      true // CASCADE mode
    );

    // Mettre à jour l'état local des périodes verrouillées
    setLockedPeriodsFlat(launchDateService.getAllLockedPeriodsFlat());

    return result;
  }, [toggleDateLockHook]);

  // Écouter les demandes de rafraîchissement (v3.0)
  useCalendarEvent('REFRESH_REQUESTED', (event) => {
    if (event.payload.scope === 'all' || event.payload.scope === 'config') {
      refreshConfig();
    }
  }, [refreshConfig]);

  const value: LaunchDateContextValue = {
    launchDate: config?.platformLaunchDate || null,
    config,
    loading,
    hasLaunchDate,
    projections,
    quarters,
    weeks,
    lockedPeriodsFlat,
    isDateLocked: isDateLockedHook,
    toggleDateLock: toggleDateLockWithEvent,
    getLockedDate: getLockedDateHook,
    refreshConfig,
  };

  return (
    <LaunchDateContext.Provider value={value}>
      {children}
    </LaunchDateContext.Provider>
  );
}

/**
 * Hook pour accéder à la date de lancement
 */
export function useLaunchDateContext() {
  return useContext(LaunchDateContext);
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Calcule la date de base selon la config ou la date actuelle
 */
function getBaseDate(launchDate: Date | null): Date {
  if (launchDate) {
    return new Date(launchDate);
  }
  // Fallback: date actuelle si pas de config
  return new Date();
}

/**
 * Formate les mois en français
 */
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTHS_FR_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
];

// ============================================
// SMART DATE WIDGET - Année complète N+X
// ============================================

interface SmartDateWidgetProps {
  yearsOffset: number;
  className?: string;
  showIcon?: boolean;
  /** Afficher l'icône de cadenas pour verrouillage */
  showLockIcon?: boolean;
  /** Permettre le toggle du verrouillage */
  allowLockToggle?: boolean;
  /** Date de lancement override (optionnel - utilise le context sinon) */
  launchDate?: Date | null;
}

/**
 * Widget affichant la date courante + X années
 * Ex: "10 Décembre 2027" pour yearsOffset=2
 * Avec cadenas optionnel pour verrouillage
 */
export function SmartDateWidget({
  yearsOffset,
  className,
  showIcon = true,
  showLockIcon = false,
  allowLockToggle = false,
  launchDate: propLaunchDate,
}: SmartDateWidgetProps) {
  const context = useLaunchDateContext();
  const {
    launchDate: contextLaunchDate = null,
    isDateLocked = () => false,
    toggleDateLock = () => {},
    getLockedDate = () => null,
  } = context || {};
  const launchDate = propLaunchDate ?? contextLaunchDate;

  const [displayDate, setDisplayDate] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Vérifier si cette date est verrouillée
  const isLocked = isDateLocked(yearsOffset, 'YEAR');
  const lockedDateInfo = getLockedDate(yearsOffset, 'YEAR');
  // Utiliser une valeur stable pour éviter les re-renders infinis
  const lockedDateTimestamp = lockedDateInfo?.lockedDate ? new Date(lockedDateInfo.lockedDate).getTime() : null;

  useEffect(() => {
    const updateDate = () => {
      // Si verrouillé, utiliser la date verrouillée
      if (isLocked && lockedDateTimestamp) {
        const date = new Date(lockedDateTimestamp);
        const day = date.getDate();
        const month = MONTHS_FR[date.getMonth()];
        const year = date.getFullYear();
        setDisplayDate(`${day} ${month} ${year}`);
        setCurrentDate(date);
        return;
      }

      // Sinon, calculer dynamiquement
      const baseDate = getBaseDate(launchDate);
      const targetDate = new Date(baseDate);
      targetDate.setFullYear(baseDate.getFullYear() + yearsOffset);

      const day = targetDate.getDate();
      const month = MONTHS_FR[targetDate.getMonth()];
      const year = targetDate.getFullYear();

      setDisplayDate(`${day} ${month} ${year}`);
      setCurrentDate(targetDate);
    };

    updateDate();

    // Mise à jour à minuit seulement si non verrouillé
    if (!isLocked) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        updateDate();
        const interval = setInterval(updateDate, 86400000);
        return () => clearInterval(interval);
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    }
  }, [yearsOffset, launchDate, isLocked, lockedDateTimestamp]);

  const handleLockToggle = () => {
    if (allowLockToggle) {
      toggleDateLock(yearsOffset, currentDate, 'YEAR');
    }
  };

  const LockIcon = isLocked ? Lock : Unlock;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
        isLocked
          ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400 border border-emerald-500/30'
          : 'bg-red-500/10 text-red-500 dark:text-red-400',
        'text-xs font-medium',
        className
      )}
    >
      {showIcon && <Calendar className="w-3.5 h-3.5" />}
      <span>{displayDate}</span>
      {showLockIcon && (
        <button
          onClick={allowLockToggle ? handleLockToggle : undefined}
          disabled={!allowLockToggle}
          className={cn(
            'ml-0.5 p-0.5 rounded transition-colors',
            allowLockToggle && 'hover:bg-white/10 cursor-pointer',
            !allowLockToggle && 'cursor-default',
            isLocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          )}
          title={isLocked ? 'Date verrouillée' : 'Date dynamique'}
        >
          <LockIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ============================================
// SMART YEAR WIDGET - Label année N+X
// ============================================

interface SmartYearWidgetProps {
  yearsOffset: number;
  prefix?: string;
  className?: string;
  launchDate?: Date | null;
}

/**
 * Widget affichant l'année N+X
 * Ex: "YEAR 2027" pour yearsOffset=2
 */
export function SmartYearWidget({
  yearsOffset,
  prefix = 'YEAR',
  className,
  launchDate: propLaunchDate,
}: SmartYearWidgetProps) {
  const context = useLaunchDateContext();
  const { launchDate: contextLaunchDate = null } = context || {};
  const launchDate = propLaunchDate ?? contextLaunchDate;

  const [year, setYear] = useState<number>(new Date().getFullYear() + yearsOffset);

  useEffect(() => {
    const baseDate = getBaseDate(launchDate);
    setYear(baseDate.getFullYear() + yearsOffset);
  }, [yearsOffset, launchDate]);

  return (
    <span className={cn('font-semibold', className)}>
      {prefix} {year}
    </span>
  );
}

// ============================================
// SMART QUARTER DATE WIDGET - Période trimestrielle
// ============================================

interface SmartQuarterDateWidgetProps {
  yearsOffset: number;
  quarter: 1 | 2 | 3 | 4;
  className?: string;
  showIcon?: boolean;
  /** Afficher l'icône de cadenas pour verrouillage */
  showLockIcon?: boolean;
  /** Permettre le toggle du verrouillage */
  allowLockToggle?: boolean;
  launchDate?: Date | null;
}

const QUARTER_MONTHS = {
  1: { start: 0, end: 2 },   // Janvier - Mars
  2: { start: 3, end: 5 },   // Avril - Juin
  3: { start: 6, end: 8 },   // Juillet - Septembre
  4: { start: 9, end: 11 },  // Octobre - Décembre
};

/**
 * Widget affichant la période d'un trimestre
 * Ex: "Janvier - Mars 2027" pour yearsOffset=2, quarter=1
 * Avec cadenas optionnel pour verrouillage
 */
export function SmartQuarterDateWidget({
  yearsOffset,
  quarter,
  className,
  showIcon = true,
  showLockIcon = false,
  allowLockToggle = false,
  launchDate: propLaunchDate,
}: SmartQuarterDateWidgetProps) {
  const context = useLaunchDateContext();
  const {
    launchDate: contextLaunchDate = null,
    isDateLocked = () => false,
    toggleDateLock = () => {},
    getLockedDate = () => null,
  } = context || {};
  const launchDate = propLaunchDate ?? contextLaunchDate;

  const [displayPeriod, setDisplayPeriod] = useState<string>('');
  const [currentEndDate, setCurrentEndDate] = useState<Date>(new Date());

  // Vérifier si ce trimestre est verrouillé
  const isLocked = isDateLocked(yearsOffset, 'QUARTER', quarter);
  const lockedDateInfo = getLockedDate(yearsOffset, 'QUARTER', quarter);
  // Utiliser une valeur stable pour éviter les re-renders infinis
  const lockedDateTimestamp = lockedDateInfo?.lockedDate ? new Date(lockedDateInfo.lockedDate).getTime() : null;

  useEffect(() => {
    const updatePeriod = () => {
      // Si verrouillé, utiliser la date verrouillée pour extraire l'année
      if (isLocked && lockedDateTimestamp) {
        const lockedYear = new Date(lockedDateTimestamp).getFullYear();
        const { start, end } = QUARTER_MONTHS[quarter];
        const startMonth = MONTHS_FR[start];
        const endMonth = MONTHS_FR[end];
        setDisplayPeriod(`${startMonth} - ${endMonth} ${lockedYear}`);
        setCurrentEndDate(new Date(lockedDateTimestamp));
        return;
      }

      // Sinon, calculer dynamiquement
      const baseDate = getBaseDate(launchDate);
      const targetYear = baseDate.getFullYear() + yearsOffset;

      const { start, end } = QUARTER_MONTHS[quarter];
      const startMonth = MONTHS_FR[start];
      const endMonth = MONTHS_FR[end];

      setDisplayPeriod(`${startMonth} - ${endMonth} ${targetYear}`);
      // La date de fin du trimestre
      setCurrentEndDate(new Date(targetYear, end + 1, 0));
    };

    updatePeriod();

    // Mise à jour à minuit seulement si non verrouillé
    if (!isLocked) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        updatePeriod();
        const interval = setInterval(updatePeriod, 86400000);
        return () => clearInterval(interval);
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    }
  }, [yearsOffset, quarter, launchDate, isLocked, lockedDateTimestamp]);

  const handleLockToggle = () => {
    if (allowLockToggle) {
      toggleDateLock(yearsOffset, currentEndDate, 'QUARTER', quarter);
    }
  };

  const LockIcon = isLocked ? Lock : Unlock;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
        isLocked
          ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400 border border-emerald-500/30'
          : 'bg-red-500/10 text-red-500 dark:text-red-400',
        'text-xs font-medium',
        className
      )}
    >
      {showIcon && <Calendar className="w-3.5 h-3.5" />}
      <span>{displayPeriod}</span>
      {showLockIcon && (
        <button
          onClick={allowLockToggle ? handleLockToggle : undefined}
          disabled={!allowLockToggle}
          className={cn(
            'ml-0.5 p-0.5 rounded transition-colors',
            allowLockToggle && 'hover:bg-white/10 cursor-pointer',
            !allowLockToggle && 'cursor-default',
            isLocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          )}
          title={isLocked ? 'Trimestre verrouillé' : 'Trimestre dynamique'}
        >
          <LockIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ============================================
// SMART WEEK LABEL - Label semaine avec dates et cadenas
// ============================================

interface SmartWeekLabelProps {
  yearsOffset: number;
  monthIndex: number; // 0-11
  weekIndex: number;  // 0-3 (semaine dans le mois)
  className?: string;
  /** Afficher l'icône de cadenas pour verrouillage */
  showLockIcon?: boolean;
  /** Permettre le toggle du verrouillage */
  allowLockToggle?: boolean;
  launchDate?: Date | null;
}

/**
 * Widget affichant une semaine avec dates précises et cadenas intelligent
 * Ex: "Sem. 6-12 janv. 2027" avec cadenas rouge/vert
 */
export function SmartWeekLabel({
  yearsOffset,
  monthIndex,
  weekIndex,
  className,
  showLockIcon = true,
  allowLockToggle = true,
  launchDate: propLaunchDate,
}: SmartWeekLabelProps) {
  const context = useLaunchDateContext();
  const {
    launchDate: contextLaunchDate = null,
    isDateLocked = () => false,
    toggleDateLock = () => {},
    getLockedDate = () => null,
  } = context || {};
  const launchDate = propLaunchDate ?? contextLaunchDate;

  const [label, setLabel] = useState<string>('');
  const [currentWeekEnd, setCurrentWeekEnd] = useState<Date>(new Date());

  // Générer une clé unique pour cette semaine (yearOffset_month_week)
  const weekNumber = monthIndex * 4 + weekIndex + 1;

  // Vérifier si cette semaine est verrouillée
  const isLocked = isDateLocked(yearsOffset, 'WEEK', weekNumber);
  const lockedDateInfo = getLockedDate(yearsOffset, 'WEEK', weekNumber);
  // Utiliser une valeur stable pour éviter les re-renders infinis
  const lockedDateTimestamp = lockedDateInfo?.lockedDate ? new Date(lockedDateInfo.lockedDate).getTime() : null;

  useEffect(() => {
    const updateLabel = () => {
      // Si verrouillé, utiliser la date verrouillée
      if (isLocked && lockedDateTimestamp) {
        const lockedDate = new Date(lockedDateTimestamp);
        const weekStart = new Date(lockedDate);
        weekStart.setDate(lockedDate.getDate() - 6); // Début de semaine

        const startDay = weekStart.getDate();
        const endDay = lockedDate.getDate();
        const monthName = MONTHS_FR_SHORT[weekStart.getMonth()];
        const year = weekStart.getFullYear();

        setLabel(`Sem. ${startDay}-${endDay} ${monthName} ${year}`);
        setCurrentWeekEnd(lockedDate);
        return;
      }

      // Sinon, calculer dynamiquement
      const baseDate = getBaseDate(launchDate);
      const targetYear = baseDate.getFullYear() + yearsOffset;

      // Trouver le premier lundi du mois
      const firstOfMonth = new Date(targetYear, monthIndex, 1);
      let firstMonday = new Date(firstOfMonth);
      const dayOfWeek = firstOfMonth.getDay();

      if (dayOfWeek === 0) {
        firstMonday.setDate(firstOfMonth.getDate() + 1);
      } else if (dayOfWeek !== 1) {
        firstMonday.setDate(firstOfMonth.getDate() + (8 - dayOfWeek));
      }

      // Calculer la semaine demandée
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (weekIndex * 7));

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      const monthName = MONTHS_FR_SHORT[weekStart.getMonth()];
      const year = weekStart.getFullYear();

      setLabel(`Sem. ${startDay}-${endDay} ${monthName} ${year}`);
      setCurrentWeekEnd(weekEnd);
    };

    updateLabel();
  }, [yearsOffset, monthIndex, weekIndex, launchDate, isLocked, lockedDateTimestamp]);

  const handleLockToggle = () => {
    if (allowLockToggle) {
      toggleDateLock(yearsOffset, currentWeekEnd, 'WEEK', weekNumber);
    }
  };

  const LockIcon = isLocked ? Lock : Unlock;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md',
        isLocked
          ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400 border border-emerald-500/30'
          : 'bg-red-500/10 text-red-500 dark:text-red-400',
        'text-xs font-medium whitespace-nowrap',
        className
      )}
    >
      <span>{label}</span>
      {showLockIcon && (
        <button
          onClick={allowLockToggle ? handleLockToggle : undefined}
          disabled={!allowLockToggle}
          className={cn(
            'p-0.5 rounded transition-colors',
            allowLockToggle && 'hover:bg-white/10 cursor-pointer',
            !allowLockToggle && 'cursor-default',
            isLocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          )}
          title={isLocked ? 'Semaine verrouillée' : 'Semaine dynamique'}
        >
          <LockIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ============================================
// SMART MONTH LABEL - Label mois avec année
// ============================================

interface SmartMonthLabelProps {
  yearsOffset: number;
  monthIndex: number; // 0-11
  className?: string;
  launchDate?: Date | null;
}

/**
 * Widget affichant un mois avec année
 * Ex: "Janvier 2027"
 */
export function SmartMonthLabel({
  yearsOffset,
  monthIndex,
  className,
  launchDate: propLaunchDate,
}: SmartMonthLabelProps) {
  const context = useLaunchDateContext();
  const { launchDate: contextLaunchDate = null } = context || {};
  const launchDate = propLaunchDate ?? contextLaunchDate;

  const [label, setLabel] = useState<string>('');

  useEffect(() => {
    const baseDate = getBaseDate(launchDate);
    const targetYear = baseDate.getFullYear() + yearsOffset;
    setLabel(`${MONTHS_FR[monthIndex]} ${targetYear}`);
  }, [yearsOffset, monthIndex, launchDate]);

  return (
    <span className={cn('font-medium', className)}>
      {label}
    </span>
  );
}

// ============================================
// SMART DATE RANGE - Plage de dates
// ============================================

interface SmartDateRangeProps {
  yearsOffset: number;
  periodType: 'year' | 'quarter' | 'month';
  periodNumber?: number; // quarter: 1-4, month: 0-11
  className?: string;
  launchDate?: Date | null;
}

/**
 * Widget affichant une plage de dates
 * Ex: "01/01/2027 → 31/12/2027" pour year
 */
export function SmartDateRange({
  yearsOffset,
  periodType,
  periodNumber = 1,
  className,
  launchDate: propLaunchDate,
}: SmartDateRangeProps) {
  const context = useLaunchDateContext();
  const { launchDate: contextLaunchDate = null } = context || {};
  const launchDate = propLaunchDate ?? contextLaunchDate;

  const [range, setRange] = useState<string>('');

  useEffect(() => {
    const baseDate = getBaseDate(launchDate);
    const targetYear = baseDate.getFullYear() + yearsOffset;

    let startDate: Date;
    let endDate: Date;

    switch (periodType) {
      case 'year':
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31);
        break;
      case 'quarter':
        const qStart = (periodNumber - 1) * 3;
        startDate = new Date(targetYear, qStart, 1);
        endDate = new Date(targetYear, qStart + 3, 0);
        break;
      case 'month':
        startDate = new Date(targetYear, periodNumber, 1);
        endDate = new Date(targetYear, periodNumber + 1, 0);
        break;
      default:
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31);
    }

    const formatDate = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    setRange(`${formatDate(startDate)} → ${formatDate(endDate)}`);
  }, [yearsOffset, periodType, periodNumber, launchDate]);

  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      {range}
    </span>
  );
}

// ============================================
// LOCKABLE DATE WIDGET - Widget avec cadenas
// ============================================

interface LockableDateWidgetProps {
  yearsOffset: number;
  isLocked?: boolean;
  lockedDate?: Date | null;
  onToggleLock?: (locked: boolean, date: Date) => void;
  className?: string;
  showIcon?: boolean;
  launchDate?: Date | null;
}

/**
 * Widget de date avec possibilité de verrouiller
 * Affiche un cadenas ouvert/fermé selon l'état
 */
export function LockableDateWidget({
  yearsOffset,
  isLocked = false,
  lockedDate,
  onToggleLock,
  className,
  showIcon = true,
  launchDate: propLaunchDate,
}: LockableDateWidgetProps) {
  const context = useLaunchDateContext();
  const { launchDate: contextLaunchDate = null } = context || {};
  const launchDate = propLaunchDate ?? contextLaunchDate;

  const [displayDate, setDisplayDate] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const updateDate = () => {
      // Si verrouillé, utiliser la date verrouillée
      if (isLocked && lockedDate) {
        const day = lockedDate.getDate();
        const month = MONTHS_FR[lockedDate.getMonth()];
        const year = lockedDate.getFullYear();
        setDisplayDate(`${day} ${month} ${year}`);
        setCurrentDate(lockedDate);
        return;
      }

      // Sinon, calculer dynamiquement
      const baseDate = getBaseDate(launchDate);
      const targetDate = new Date(baseDate);
      targetDate.setFullYear(baseDate.getFullYear() + yearsOffset);

      const day = targetDate.getDate();
      const month = MONTHS_FR[targetDate.getMonth()];
      const year = targetDate.getFullYear();

      setDisplayDate(`${day} ${month} ${year}`);
      setCurrentDate(targetDate);
    };

    updateDate();

    if (!isLocked) {
      // Mise à jour à minuit seulement si non verrouillé
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        updateDate();
        const interval = setInterval(updateDate, 86400000);
        return () => clearInterval(interval);
      }, msUntilMidnight);

      return () => clearTimeout(timeout);
    }
  }, [yearsOffset, launchDate, isLocked, lockedDate]);

  const handleLockToggle = () => {
    if (onToggleLock) {
      onToggleLock(!isLocked, currentDate);
    }
  };

  const LockIcon = isLocked ? Lock : Unlock;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
        isLocked
          ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400 border border-emerald-500/30'
          : 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
        'text-xs font-medium',
        className
      )}
    >
      {showIcon && <Calendar className="w-3.5 h-3.5" />}
      <span>{displayDate}</span>
      {onToggleLock && (
        <button
          onClick={handleLockToggle}
          className={cn(
            'ml-1 p-0.5 rounded hover:bg-white/10 transition-colors',
            isLocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-500/60 dark:text-blue-400/60'
          )}
          title={isLocked ? 'Date verrouillée - Cliquer pour déverrouiller' : 'Cliquer pour verrouiller cette date'}
        >
          <LockIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export default {
  SmartDateWidget,
  SmartYearWidget,
  SmartQuarterDateWidget,
  SmartWeekLabel,
  SmartMonthLabel,
  SmartDateRange,
  LockableDateWidget,
  LaunchDateProvider,
  useLaunchDateContext,
};
