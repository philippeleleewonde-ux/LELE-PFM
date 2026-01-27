/**
 * FiscalCalendarWidget - Widget de calendrier fiscal pour la plateforme LELE HCM
 *
 * Affiche une timeline visuelle sur 3 ans (N, N+1, N+2, N+3) permettant aux utilisateurs
 * de voir clairement le lien entre les données planifiées et le calendrier réel.
 *
 * Utilisé dans:
 * - Module 1: Pages 14, 15, 16, 17 (Priority Actions)
 * - Module 3: PerformanceRecapPage (HCM Cost Savings)
 * - Profil Entreprise: Card HCM Performance Plan
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// TYPES
// ============================================================================

export interface FiscalPeriod {
  year: number;
  quarter: number;
  label: string;
  shortLabel: string;
  startDate: Date;
  endDate: Date;
  months: { month: number; name: string; shortName: string }[];
  weeksInQuarter: number;
}

export interface FiscalYear {
  year: number;
  label: string; // 'N', 'N+1', 'N+2', 'N+3'
  displayLabel: string; // '2024 (N)', '2025 (N+1)'
  quarters: FiscalPeriod[];
}

export interface FiscalCalendarWidgetProps {
  /** Année de base pour le calcul (défaut: année courante pour N) */
  baseYear?: number;
  /** Période sélectionnée (optionnel) */
  selectedPeriod?: { year: number; quarter: number };
  /** Callback lors de la sélection d'une période */
  onPeriodSelect?: (period: FiscalPeriod) => void;
  /** Mode compact pour sidebar ou header réduit */
  compact?: boolean;
  /** Mode minimal (juste la date du jour et période courante) */
  minimal?: boolean;
  /** Afficher le bouton d'info */
  showInfo?: boolean;
  /** Titre personnalisé */
  title?: string;
  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère les données de calendrier fiscal pour N+1, N+2, N+3
 */
const generateFiscalYears = (baseYear: number): FiscalYear[] => {
  const years: FiscalYear[] = [];

  // N+1, N+2, N+3
  for (let offset = 1; offset <= 3; offset++) {
    const year = baseYear + offset;
    const label = `N+${offset}`;

    const quarters: FiscalPeriod[] = [];

    for (let q = 1; q <= 4; q++) {
      const startMonth = (q - 1) * 3;
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, startMonth + 3, 0); // Dernier jour du trimestre

      const months = [0, 1, 2].map(m => {
        const monthDate = new Date(year, startMonth + m, 1);
        return {
          month: startMonth + m + 1,
          name: monthDate.toLocaleString('fr-FR', { month: 'long' }),
          shortName: monthDate.toLocaleString('fr-FR', { month: 'short' }),
        };
      });

      // Approximation: ~13 semaines par trimestre
      const weeksInQuarter = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      quarters.push({
        year,
        quarter: q,
        label: `Q${q} ${year}`,
        shortLabel: `Q${q}`,
        startDate,
        endDate,
        months,
        weeksInQuarter,
      });
    }

    years.push({
      year,
      label,
      displayLabel: `${year} (${label})`,
      quarters,
    });
  }

  return years;
};

/**
 * Détermine la période courante
 */
const getCurrentPeriod = (today: Date = new Date()): { year: number; quarter: number; month: number } => {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;

  return { year, quarter, month: month + 1 };
};

/**
 * Formate une plage de dates
 */
const formatDateRange = (start: Date, end: Date): string => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
};

/**
 * Calcule le nombre de jours restants jusqu'à une date
 */
const getDaysUntil = (targetDate: Date, fromDate: Date = new Date()): number => {
  const diffTime = targetDate.getTime() - fromDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FiscalCalendarWidget({
  baseYear,
  selectedPeriod,
  onPeriodSelect,
  compact = false,
  minimal = false,
  showInfo = true,
  title = 'Calendrier Fiscal',
  className,
}: FiscalCalendarWidgetProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const effectiveBaseYear = baseYear || currentYear;

  // État pour navigation (optionnel pour version étendue)
  const [viewStartIndex, setViewStartIndex] = useState(0);

  // Période courante
  const currentPeriod = useMemo(() => getCurrentPeriod(today), []);

  // Générer les années fiscales
  const fiscalYears = useMemo(() => generateFiscalYears(effectiveBaseYear), [effectiveBaseYear]);

  // Années visibles (3 à la fois pour la version complète)
  const visibleYears = useMemo(() => {
    if (compact || minimal) return fiscalYears.slice(0, 3);
    return fiscalYears.slice(viewStartIndex, viewStartIndex + 3);
  }, [fiscalYears, viewStartIndex, compact, minimal]);

  // Helpers pour déterminer l'état d'une période
  const isPeriodCurrent = (year: number, quarter: number) =>
    year === currentPeriod.year && quarter === currentPeriod.quarter;

  const isPeriodSelected = (year: number, quarter: number) =>
    selectedPeriod?.year === year && selectedPeriod?.quarter === quarter;

  const isPeriodPast = (year: number, quarter: number) => {
    if (year < currentPeriod.year) return true;
    if (year === currentPeriod.year && quarter < currentPeriod.quarter) return true;
    return false;
  };

  const isPeriodFuture = (year: number, quarter: number) => {
    if (year > currentPeriod.year) return true;
    if (year === currentPeriod.year && quarter > currentPeriod.quarter) return true;
    return false;
  };

  // =====================
  // MODE MINIMAL
  // =====================
  if (minimal) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
        "border border-blue-200 dark:border-blue-800",
        className
      )}>
        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          {today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="text-blue-400 dark:text-blue-600">|</span>
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Q{currentPeriod.quarter} {currentPeriod.year}
        </span>
      </div>
    );
  }

  // =====================
  // MODE COMPACT
  // =====================
  if (compact) {
    return (
      <Card className={cn(
        "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
        "border-blue-200 dark:border-blue-800",
        className
      )}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aujourd'hui</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-sm font-medium">
              <Clock className="w-3.5 h-3.5" />
              Q{currentPeriod.quarter} {currentPeriod.year}
            </div>
          </div>

          {/* Mini timeline */}
          <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center gap-1">
              {visibleYears.map((fiscalYear, yearIdx) => (
                <div key={fiscalYear.year} className="flex-1">
                  <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mb-1">
                    {fiscalYear.label}
                  </p>
                  <div className="flex gap-0.5">
                    {fiscalYear.quarters.map((period) => (
                      <TooltipProvider key={`${period.year}-Q${period.quarter}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onPeriodSelect?.(period)}
                              className={cn(
                                "flex-1 h-2 rounded-sm transition-all",
                                isPeriodCurrent(period.year, period.quarter) && "bg-blue-600 dark:bg-blue-500",
                                isPeriodSelected(period.year, period.quarter) &&
                                  !isPeriodCurrent(period.year, period.quarter) &&
                                  "bg-indigo-400 dark:bg-indigo-500",
                                isPeriodPast(period.year, period.quarter) &&
                                  !isPeriodCurrent(period.year, period.quarter) &&
                                  "bg-slate-300 dark:bg-slate-600",
                                isPeriodFuture(period.year, period.quarter) &&
                                  !isPeriodCurrent(period.year, period.quarter) &&
                                  !isPeriodSelected(period.year, period.quarter) &&
                                  "bg-blue-200 dark:bg-blue-800"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <p className="font-semibold">{period.label}</p>
                            <p className="text-slate-500">{formatDateRange(period.startDate, period.endDate)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =====================
  // MODE COMPLET
  // =====================
  return (
    <TooltipProvider>
      <Card className={cn(
        "bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/30",
        "border-slate-200 dark:border-slate-700",
        className
      )}>
        <CardContent className="p-4">
          {/* Header avec date du jour */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
                  {showInfo && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">
                          Ce calendrier montre le planning sur 3 ans de votre entreprise.
                          Les données PPR et économies sont synchronisées avec ces périodes.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {today.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Badge période courante */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-sm font-semibold shadow-lg shadow-blue-500/25">
                <Clock className="w-4 h-4" />
                <span>Période: Q{currentPeriod.quarter} {currentPeriod.year}</span>
              </div>
            </div>
          </div>

          {/* Navigation (si plus de 3 années) */}
          {fiscalYears.length > 3 && (
            <div className="flex justify-end gap-1 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={viewStartIndex === 0}
                onClick={() => setViewStartIndex(Math.max(0, viewStartIndex - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={viewStartIndex >= fiscalYears.length - 3}
                onClick={() => setViewStartIndex(Math.min(fiscalYears.length - 3, viewStartIndex + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Timeline des années */}
          <div className="grid grid-cols-3 gap-4">
            {visibleYears.map((fiscalYear) => (
              <div key={fiscalYear.year} className="space-y-2">
                {/* Header année */}
                <div className="flex items-center justify-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-lg font-bold text-slate-800 dark:text-white">
                    {fiscalYear.year}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {fiscalYear.label}
                  </span>
                </div>

                {/* Grille des trimestres */}
                <div className="grid grid-cols-4 gap-1.5">
                  {fiscalYear.quarters.map((period) => {
                    const isCurrent = isPeriodCurrent(period.year, period.quarter);
                    const isSelected = isPeriodSelected(period.year, period.quarter);
                    const isPast = isPeriodPast(period.year, period.quarter);
                    const isFuture = isPeriodFuture(period.year, period.quarter);
                    const daysUntil = getDaysUntil(period.startDate);

                    return (
                      <Tooltip key={`${period.year}-Q${period.quarter}`}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onPeriodSelect?.(period)}
                            className={cn(
                              "relative p-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                              "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                              // Période courante
                              isCurrent && [
                                "bg-blue-600 dark:bg-blue-500 text-white",
                                "ring-2 ring-blue-300 dark:ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900",
                                "shadow-lg shadow-blue-500/30"
                              ],
                              // Période sélectionnée (non courante)
                              isSelected && !isCurrent && [
                                "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300",
                                "ring-2 ring-indigo-300 dark:ring-indigo-500"
                              ],
                              // Passé (non courant, non sélectionné)
                              isPast && !isCurrent && !isSelected && [
                                "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                              ],
                              // Futur (non courant, non sélectionné)
                              isFuture && !isCurrent && !isSelected && [
                                "bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300",
                                "border border-slate-200 dark:border-slate-700",
                                "hover:border-blue-300 dark:hover:border-blue-600",
                                "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              ]
                            )}
                          >
                            Q{period.quarter}

                            {/* Indicateur période courante */}
                            {isCurrent && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-3 max-w-[200px]">
                          <div className="space-y-2">
                            <p className="font-bold text-base">{period.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDateRange(period.startDate, period.endDate)}
                            </p>

                            {/* Mois du trimestre */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {period.months.map(m => (
                                <span
                                  key={m.month}
                                  className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded capitalize"
                                >
                                  {m.shortName}
                                </span>
                              ))}
                            </div>

                            {/* Info contextuelle */}
                            {isCurrent && (
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium pt-1">
                                Période en cours
                              </p>
                            )}
                            {isFuture && daysUntil > 0 && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 pt-1">
                                Commence dans {daysUntil} jours
                              </p>
                            )}
                            {isPast && !isCurrent && (
                              <p className="text-xs text-slate-400 pt-1">
                                Période passée
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="relative w-3 h-3 bg-blue-600 rounded">
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
              </span>
              <span>Période courante</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600" />
              <span>Passé</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-white dark:bg-slate-800/50 rounded border border-slate-300 dark:border-slate-600" />
              <span>Futur (planifié)</span>
            </div>
            {selectedPeriod && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-100 dark:bg-indigo-900/50 rounded ring-1 ring-indigo-300" />
                <span>Sélectionné</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// ============================================================================
// EXPORTS ADDITIONNELS
// ============================================================================

export { generateFiscalYears, getCurrentPeriod, formatDateRange, getDaysUntil };
