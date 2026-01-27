/**
 * ============================================
 * PERIOD STATUS DASHBOARD
 * ============================================
 *
 * Barre de statut centralisée pour visualiser l'état de toutes les périodes.
 * Affiche les 52 semaines avec un statut clair :
 * - 🔒 Validé (vert) : période verrouillée et validée
 * - ✏️ En cours (bleu) : période active courante
 * - ○ À venir (gris) : période future non commencée
 *
 * SUPPORT LIGHT/DARK MODE via Tailwind dark: prefix
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Calendar,
  CheckCircle,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { launchDateService } from '@/lib/fiscal/LaunchDateService';
import type { LockedDateConfig } from '@/lib/fiscal/LaunchDateService';

// ============================================
// TYPES
// ============================================

export type PeriodStatus = 'locked' | 'current' | 'upcoming' | 'past';

export interface WeekStatus {
  weekNumber: number;
  yearOffset: number;
  status: PeriodStatus;
  isLocked: boolean;
  startDate?: Date;
  endDate?: Date;
  lockedAt?: Date;
  lockedBy?: string;
}

export interface PeriodStatusDashboardProps {
  /** Année sélectionnée (1=N+1, 2=N+2, 3=N+3) */
  selectedYear?: number;
  /** Semaine sélectionnée (optionnel) */
  selectedWeek?: number;
  /** Callback quand une semaine est cliquée */
  onWeekClick?: (weekNumber: number, yearOffset: number) => void;
  /** Afficher en mode compact (horizontal uniquement) */
  compact?: boolean;
  /** Afficher le panneau déplié par défaut */
  defaultExpanded?: boolean;
  /** Titre personnalisé */
  title?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

// ============================================
// CONSTANTES
// ============================================

const WEEKS_PER_YEAR = 52;
const WEEKS_PER_QUARTER = 13;

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function PeriodStatusDashboard({
  selectedYear = 1,
  selectedWeek,
  onWeekClick,
  compact = false,
  defaultExpanded = false,
  title = 'STATUT DES PÉRIODES',
  className
}: PeriodStatusDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  // Récupérer toutes les périodes verrouillées
  const lockedPeriods = useMemo(() => {
    return launchDateService.getAllLockedPeriodsFlat();
  }, []);

  // Vérifier si l'année entière est verrouillée (mode CASCADE)
  const isYearLocked = useMemo(() => {
    return lockedPeriods[`year_${selectedYear}`] === true;
  }, [lockedPeriods, selectedYear]);

  // Obtenir la date d'aujourd'hui
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calculer la semaine courante de l'année
  const getCurrentWeek = useCallback((): number => {
    const yearProjection = launchDateService.getYearProjection(selectedYear);
    if (!yearProjection) return 1;

    const startOfYear = yearProjection.startDate;
    const diffDays = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const weekNum = Math.ceil(diffDays / 7);
    return Math.max(1, Math.min(weekNum, WEEKS_PER_YEAR));
  }, [selectedYear, today]);

  // Générer les statuts pour toutes les semaines
  const weeksStatus = useMemo((): WeekStatus[] => {
    const currentWeek = getCurrentWeek();
    const yearProjection = launchDateService.getYearProjection(selectedYear);
    const isYearActive = yearProjection?.isActive ?? false;
    const isYearPast = yearProjection?.isPast ?? false;
    const isYearFuture = yearProjection?.isFuture ?? true;

    return Array.from({ length: WEEKS_PER_YEAR }, (_, i) => {
      const weekNumber = i + 1;
      const weekKey = `week_${selectedYear}_${weekNumber}`;
      const isLocked = lockedPeriods[weekKey] === true;

      let status: PeriodStatus = 'upcoming';

      if (isYearPast || isLocked) {
        status = 'locked';
      } else if (isYearActive) {
        if (weekNumber < currentWeek) {
          status = 'past';
        } else if (weekNumber === currentWeek) {
          status = 'current';
        } else {
          status = 'upcoming';
        }
      } else if (isYearFuture) {
        status = 'upcoming';
      }

      // Obtenir les dates de la semaine
      const weekProjections = launchDateService.projectWeeks(selectedYear);
      const weekProj = weekProjections.find(w => w.weekNumber === weekNumber);

      return {
        weekNumber,
        yearOffset: selectedYear,
        status,
        isLocked,
        startDate: weekProj?.startDate,
        endDate: weekProj?.endDate,
      };
    });
  }, [selectedYear, lockedPeriods, getCurrentWeek]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const locked = weeksStatus.filter(w => w.status === 'locked' || w.isLocked).length;
    const current = weeksStatus.filter(w => w.status === 'current').length;
    const past = weeksStatus.filter(w => w.status === 'past' && !w.isLocked).length;
    const upcoming = weeksStatus.filter(w => w.status === 'upcoming').length;

    return { locked, current, past, upcoming };
  }, [weeksStatus]);

  // Obtenir la couleur et l'icône selon le statut
  const getStatusStyle = useCallback((status: PeriodStatus, isLocked: boolean) => {
    if (isLocked) {
      return {
        bg: 'bg-emerald-500 dark:bg-emerald-600',
        bgHover: 'hover:bg-emerald-400 dark:hover:bg-emerald-500',
        border: 'border-emerald-400 dark:border-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        icon: Lock,
        label: 'Validé'
      };
    }

    switch (status) {
      case 'current':
        return {
          bg: 'bg-blue-500 dark:bg-blue-600',
          bgHover: 'hover:bg-blue-400 dark:hover:bg-blue-500',
          border: 'border-blue-400 dark:border-blue-500',
          text: 'text-blue-600 dark:text-blue-400',
          icon: Clock,
          label: 'En cours'
        };
      case 'past':
        return {
          bg: 'bg-amber-500 dark:bg-amber-600',
          bgHover: 'hover:bg-amber-400 dark:hover:bg-amber-500',
          border: 'border-amber-400 dark:border-amber-500',
          text: 'text-amber-600 dark:text-amber-400',
          icon: AlertTriangle,
          label: 'Non validé'
        };
      case 'upcoming':
      default:
        return {
          bg: 'bg-slate-300 dark:bg-slate-700',
          bgHover: 'hover:bg-slate-200 dark:hover:bg-slate-600',
          border: 'border-slate-300 dark:border-slate-600',
          text: 'text-slate-500 dark:text-slate-400',
          icon: Circle,
          label: 'À venir'
        };
    }
  }, []);

  // Formater une date
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '-';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Rendu d'une semaine individuelle
  const renderWeek = useCallback((week: WeekStatus) => {
    const style = getStatusStyle(week.status, week.isLocked);
    const isSelected = selectedWeek === week.weekNumber;
    const isHovered = hoveredWeek === week.weekNumber;

    return (
      <motion.button
        key={week.weekNumber}
        onClick={() => onWeekClick?.(week.weekNumber, week.yearOffset)}
        onMouseEnter={() => setHoveredWeek(week.weekNumber)}
        onMouseLeave={() => setHoveredWeek(null)}
        className={cn(
          "relative w-4 h-4 rounded-sm transition-all duration-150",
          style.bg,
          style.bgHover,
          isSelected && "ring-2 ring-offset-1 ring-white dark:ring-offset-slate-900",
          "cursor-pointer"
        )}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.95 }}
        title={`Sem ${week.weekNumber} - ${style.label}`}
      >
        {week.isLocked && (
          <Lock className="w-2 h-2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
      </motion.button>
    );
  }, [getStatusStyle, selectedWeek, hoveredWeek, onWeekClick]);

  // Rendu d'un trimestre (13 semaines)
  const renderQuarter = useCallback((quarterIndex: number) => {
    const startWeek = quarterIndex * WEEKS_PER_QUARTER + 1;
    const endWeek = Math.min(startWeek + WEEKS_PER_QUARTER - 1, WEEKS_PER_YEAR);
    const quarterWeeks = weeksStatus.slice(startWeek - 1, endWeek);

    return (
      <div key={quarterIndex} className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
          Q{quarterIndex + 1}
        </span>
        <div className="flex flex-wrap gap-0.5">
          {quarterWeeks.map(renderWeek)}
        </div>
      </div>
    );
  }, [weeksStatus, renderWeek]);

  // Tooltip pour la semaine survolée
  const renderTooltip = useCallback(() => {
    if (hoveredWeek === null) return null;

    const week = weeksStatus.find(w => w.weekNumber === hoveredWeek);
    if (!week) return null;

    const style = getStatusStyle(week.status, week.isLocked);
    const IconComponent = style.icon;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className={cn(
            "absolute z-50 px-3 py-2 rounded-lg shadow-xl",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "text-xs"
          )}
          style={{
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className={cn("w-3.5 h-3.5", style.text)} />
            <span className="font-bold text-slate-900 dark:text-white">
              Semaine {week.weekNumber}
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-300">
            {formatDate(week.startDate)} - {formatDate(week.endDate)}
          </div>
          <div className={cn("font-medium mt-1", style.text)}>
            {style.label}
          </div>
          {week.isLocked && week.lockedAt && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Validé le {week.lockedAt.toLocaleDateString('fr-FR')}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }, [hoveredWeek, weeksStatus, getStatusStyle]);

  // Mode compact - barre horizontale simple
  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-gradient-to-r from-slate-100 to-slate-50",
          "dark:from-slate-800/80 dark:to-slate-900/60",
          "border border-slate-200 dark:border-slate-700/50"
        )}>
          {/* Icône mode CASCADE si année verrouillée */}
          {isYearLocked && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                CASCADE
              </span>
            </div>
          )}

          {/* Barre de progression */}
          <div className="flex-1 flex items-center gap-0.5">
            {weeksStatus.map(renderWeek)}
          </div>

          {/* Statistiques compactes */}
          <div className="flex items-center gap-2 text-[10px] ml-2">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-3 h-3" />
              {stats.locked}
            </span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Clock className="w-3 h-3" />
              {stats.current}
            </span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Circle className="w-3 h-3" />
              {stats.upcoming}
            </span>
          </div>
        </div>

        {/* Tooltip */}
        {renderTooltip()}
      </div>
    );
  }

  // Mode étendu avec accordéon
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-gradient-to-br from-slate-50 to-white",
        "dark:from-slate-900/80 dark:to-slate-800/60",
        "border border-slate-200 dark:border-slate-700/50",
        "shadow-sm",
        className
      )}
    >
      {/* Header cliquable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
          "transition-colors cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              N+{selectedYear} • {WEEKS_PER_YEAR} semaines
            </p>
          </div>

          {/* Badge CASCADE si année verrouillée */}
          {isYearLocked && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 ml-2">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                MODE CASCADE ACTIF
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Stats badges */}
          <div className="hidden sm:flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
              "bg-emerald-100 text-emerald-700",
              "dark:bg-emerald-500/20 dark:text-emerald-400"
            )}>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{stats.locked} validé{stats.locked > 1 ? 's' : ''}</span>
            </div>

            {stats.current > 0 && (
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                "bg-blue-100 text-blue-700",
                "dark:bg-blue-500/20 dark:text-blue-400"
              )}>
                <Clock className="w-3.5 h-3.5" />
                <span>En cours</span>
              </div>
            )}

            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
              "bg-slate-100 text-slate-600",
              "dark:bg-slate-700/50 dark:text-slate-400"
            )}>
              <Circle className="w-3.5 h-3.5" />
              <span>{stats.upcoming} à venir</span>
            </div>
          </div>

          {/* Chevron */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Contenu dépliable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50 pt-3">
              {/* Légende */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-400">Validé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-500" />
                  <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-600 dark:text-slate-400">En cours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-slate-600 dark:text-slate-400">Non validé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700" />
                  <Circle className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">À venir</span>
                </div>
              </div>

              {/* Grille des 52 semaines par trimestre */}
              <div className="relative grid grid-cols-4 gap-4">
                {[0, 1, 2, 3].map(renderQuarter)}

                {/* Tooltip */}
                {renderTooltip()}
              </div>

              {/* Barre de progression globale */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Progression de validation
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round((stats.locked / WEEKS_PER_YEAR) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.locked / WEEKS_PER_YEAR) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
