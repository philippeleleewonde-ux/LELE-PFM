/**
 * ============================================
 * CalendarPeriodSelector - Sélecteur de Période Intelligent
 * ============================================
 *
 * Composant de pont entre le LELE HCM Widget Smart Calendar
 * et les modules HCM Cost Savings (Module 3).
 *
 * FONCTIONNALITÉS:
 * - Sélection de période basée sur le calendrier fiscal configuré
 * - Affichage des périodes verrouillées avec icône cadenas
 * - Indication visuelle des semaines avec données enregistrées
 * - Sélection automatique de la semaine courante
 * - Compatible avec CostDataEntry et PerformanceCalculation
 * - SYNC TEMPS RÉEL via CalendarEventBus (v2.0)
 *
 * @author LELE HCM Platform
 * @version 2.0.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  TrendingUp,
  Clock,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { launchDateService, DateProjection, QuarterProjection, WeekProjection } from '@/lib/fiscal/LaunchDateService';
import { calendarEventBus, useCalendarEvent } from '@/lib/fiscal/CalendarEventBus';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface PeriodSelection {
  periodStart: string;
  periodEnd: string;
  yearOffset: number;
  quarterNumber?: number;
  weekNumber?: number;
  isLocked: boolean;
  hasData: boolean;
}

export interface WeekWithData {
  weekNumber: number;
  yearOffset: number;
  periodStart: string;
  periodEnd: string;
  hasData: boolean;
  entryCount: number;
  totalAmount: number;
}

interface CalendarPeriodSelectorProps {
  companyId: string;
  businessLineId?: string;
  onPeriodChange: (period: PeriodSelection) => void;
  selectedPeriod?: PeriodSelection;
  granularity?: 'week' | 'month' | 'quarter' | 'year';
  showDataIndicator?: boolean;
  className?: string;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CalendarPeriodSelector({
  companyId,
  businessLineId,
  onPeriodChange,
  selectedPeriod,
  granularity = 'week',
  showDataIndicator = true,
  className,
}: CalendarPeriodSelectorProps) {
  // États
  const [projections, setProjections] = useState<DateProjection[]>([]);
  const [quarters, setQuarters] = useState<QuarterProjection[]>([]);
  const [weeks, setWeeks] = useState<WeekProjection[]>([]);
  const [weeksWithData, setWeeksWithData] = useState<WeekWithData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(1); // N+1 par défaut
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);
  // État pour les périodes verrouillées (synchronisé avec Company Profile)
  const [lockedPeriods, setLockedPeriods] = useState<Record<string, boolean>>({});

  // Fonction de chargement de la config (réutilisable)
  const loadCalendarConfig = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      // Charger la config depuis LaunchDateService
      const config = await launchDateService.loadConfig(companyId);

      if (config) {
        setProjections(launchDateService.projectYears());
        setQuarters(launchDateService.projectQuarters());
        // Charger les périodes verrouillées depuis LaunchDateService
        const locked = launchDateService.getAllLockedPeriodsFlat();
        setLockedPeriods(locked);
        setConfigLoaded(true);
      } else {
        // Fallback: utiliser la date courante comme base
        const today = new Date();
        launchDateService.setLaunchDate(today, 3);
        setProjections(launchDateService.projectYears());
        setQuarters(launchDateService.projectQuarters());
        setConfigLoaded(true);
      }
    } catch (error) {
      console.error('Error loading calendar config:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Charger la configuration du calendrier au montage
  useEffect(() => {
    loadCalendarConfig();
  }, [loadCalendarConfig]);

  // ============================================
  // EVENT BUS LISTENERS (v2.0 - Sync temps réel)
  // ============================================

  // Écouter les mises à jour de configuration
  useCalendarEvent('CONFIG_UPDATED', (event) => {
    console.log('[CalendarPeriodSelector] Config updated, refreshing...');
    setProjections(event.payload.projections);
    setQuarters(event.payload.quarters);
    // Recharger les périodes verrouillées
    const locked = launchDateService.getAllLockedPeriodsFlat();
    setLockedPeriods(locked);
  }, []);

  // Écouter les verrouillages de période en temps réel
  useCalendarEvent('PERIOD_LOCKED', (event) => {
    console.log('[CalendarPeriodSelector] Period lock changed:', event.payload.periodKey, event.payload.isLocked);
    setLockedPeriods(prev => ({
      ...prev,
      [event.payload.periodKey]: event.payload.isLocked,
    }));

    // Si mode CASCADE, mettre à jour toutes les périodes enfants
    if (event.payload.cascadeMode) {
      const locked = launchDateService.getAllLockedPeriodsFlat();
      setLockedPeriods(locked);
    }
  }, []);

  // Écouter les nouvelles données enregistrées
  useCalendarEvent('DATA_ENTERED', (event) => {
    console.log('[CalendarPeriodSelector] New data entered for period:', event.payload.periodStart);
    // Recharger les semaines avec données
    loadWeeksWithData();
  }, []);

  // Fonction de chargement des semaines avec données (extraite pour réutilisation)
  const loadWeeksWithData = useCallback(async () => {
    if (!companyId || !showDataIndicator) return;

    try {
      let query = supabase
        .from('module3_cost_entries')
        .select('period_start, period_end, compensation_amount')
        .eq('company_id', companyId);

      if (businessLineId) {
        query = query.eq('business_line_id', businessLineId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading weeks with data:', error);
        return;
      }

      // Agréger par période
      const periodsMap = new Map<string, WeekWithData>();

      data?.forEach((entry) => {
        const key = `${entry.period_start}-${entry.period_end}`;
        if (periodsMap.has(key)) {
          const existing = periodsMap.get(key)!;
          existing.entryCount++;
          existing.totalAmount += Number(entry.compensation_amount) || 0;
        } else {
          const startDate = new Date(entry.period_start);
          const yearOffset = calculateYearOffset(startDate);
          const weekNumber = getWeekNumber(startDate);

          periodsMap.set(key, {
            weekNumber,
            yearOffset,
            periodStart: entry.period_start,
            periodEnd: entry.period_end,
            hasData: true,
            entryCount: 1,
            totalAmount: Number(entry.compensation_amount) || 0,
          });
        }
      });

      setWeeksWithData(Array.from(periodsMap.values()));
    } catch (error) {
      console.error('Error loading weeks data:', error);
    }
  }, [companyId, businessLineId, showDataIndicator]);

  // Charger les semaines avec données enregistrées au montage
  useEffect(() => {
    loadWeeksWithData();
  }, [loadWeeksWithData]);

  // Sélectionner automatiquement la semaine courante
  useEffect(() => {
    if (configLoaded && projections.length > 0 && !selectedPeriod) {
      const today = new Date();
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

      // Trouver l'année active
      const activeYear = projections.find(p => p.isActive);
      if (activeYear) {
        setSelectedYear(activeYear.yearOffset);

        // Sélectionner la semaine courante par défaut
        const weekNum = getWeekNumber(today);
        setSelectedWeek(weekNum);

        // Notifier le parent
        onPeriodChange({
          periodStart: format(currentWeekStart, 'yyyy-MM-dd'),
          periodEnd: format(currentWeekEnd, 'yyyy-MM-dd'),
          yearOffset: activeYear.yearOffset,
          weekNumber: weekNum,
          isLocked: false,
          hasData: checkIfWeekHasData(format(currentWeekStart, 'yyyy-MM-dd'), format(currentWeekEnd, 'yyyy-MM-dd')),
        });
      }
    }
  }, [configLoaded, projections]);

  // Helpers
  function calculateYearOffset(date: Date): number {
    const config = launchDateService.getConfig();
    if (!config) return 1;
    const launchDate = new Date(config.platformLaunchDate);
    return date.getFullYear() - launchDate.getFullYear();
  }

  function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  function checkIfWeekHasData(periodStart: string, periodEnd: string): boolean {
    return weeksWithData.some(w => w.periodStart === periodStart && w.periodEnd === periodEnd);
  }

  /**
   * Vérifie si une semaine est verrouillée (synchronisé avec Company Profile)
   * Prend en compte le mode CASCADE: si l'année ou le trimestre est verrouillé,
   * la semaine est automatiquement verrouillée
   */
  function isWeekLocked(weekNumber: number, yearOffset: number): boolean {
    // Vérifier si l'année entière est verrouillée
    if (lockedPeriods[`year_${yearOffset}`]) return true;

    // Vérifier si le trimestre contenant cette semaine est verrouillé
    const quarter = Math.ceil(weekNumber / 13);
    if (lockedPeriods[`quarter_${yearOffset}_${quarter}`]) return true;

    // Vérifier si le mois contenant cette semaine est verrouillé
    const month = Math.ceil(weekNumber / 4.33);
    if (lockedPeriods[`month_${yearOffset}_${Math.floor(month)}`]) return true;

    // Vérifier si la semaine spécifique est verrouillée
    if (lockedPeriods[`week_${yearOffset}_${weekNumber}`]) return true;

    return false;
  }

  function getWeekDataInfo(periodStart: string, periodEnd: string): WeekWithData | undefined {
    return weeksWithData.find(w => w.periodStart === periodStart && w.periodEnd === periodEnd);
  }

  // Générer les semaines pour l'année sélectionnée
  const weeksForYear = useMemo(() => {
    if (!projections.length) return [];

    const yearProjection = projections.find(p => p.yearOffset === selectedYear);
    if (!yearProjection) return [];

    const weeks: Array<{
      weekNumber: number;
      startDate: Date;
      endDate: Date;
      label: string;
      hasData: boolean;
      dataInfo?: WeekWithData;
    }> = [];

    let currentWeekStart = startOfWeek(yearProjection.startDate, { weekStartsOn: 1 });
    let weekNum = 1;

    while (isBefore(currentWeekStart, yearProjection.endDate)) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const periodStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const periodEndStr = format(currentWeekEnd, 'yyyy-MM-dd');
      const dataInfo = getWeekDataInfo(periodStartStr, periodEndStr);

      weeks.push({
        weekNumber: weekNum,
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        label: `Sem ${weekNum} (${format(currentWeekStart, 'd MMM', { locale: fr })} - ${format(currentWeekEnd, 'd MMM', { locale: fr })})`,
        hasData: !!dataInfo,
        dataInfo,
      });

      currentWeekStart = addWeeks(currentWeekStart, 1);
      weekNum++;
    }

    return weeks;
  }, [projections, selectedYear, weeksWithData]);

  // Handlers
  const handleYearChange = (yearOffset: string) => {
    const offset = parseInt(yearOffset);
    setSelectedYear(offset);
    setSelectedQuarter(null);
    setSelectedWeek(null);

    const yearProjection = projections.find(p => p.yearOffset === offset);
    if (yearProjection) {
      // Vérifier si l'année est verrouillée
      const yearIsLocked = lockedPeriods[`year_${offset}`] || false;
      onPeriodChange({
        periodStart: format(yearProjection.startDate, 'yyyy-MM-dd'),
        periodEnd: format(yearProjection.endDate, 'yyyy-MM-dd'),
        yearOffset: offset,
        isLocked: yearIsLocked,
        hasData: false,
      });
    }
  };

  const handleWeekSelect = (weekNumber: number) => {
    // Vérifier si la semaine est verrouillée
    const weekIsLocked = isWeekLocked(weekNumber, selectedYear);

    // Permettre la sélection même si verrouillée (pour voir les données)
    // mais signaler le statut au parent
    setSelectedWeek(weekNumber);
    const week = weeksForYear.find(w => w.weekNumber === weekNumber);
    if (week) {
      const periodStart = format(week.startDate, 'yyyy-MM-dd');
      const periodEnd = format(week.endDate, 'yyyy-MM-dd');

      // Notifier le parent
      onPeriodChange({
        periodStart,
        periodEnd,
        yearOffset: selectedYear,
        weekNumber,
        isLocked: weekIsLocked,
        hasData: week.hasData,
      });

      // Émettre l'événement pour synchronisation globale (v2.0)
      calendarEventBus.emitPeriodSelected(
        periodStart,
        periodEnd,
        selectedYear,
        weekIsLocked,
        weekNumber
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4 animate-spin" />
        <span className="text-sm">Chargement du calendrier...</span>
      </div>
    );
  }

  return (
    <Card className={cn("bg-card/50 border-border backdrop-blur-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Période d'analyse
          {selectedPeriod?.isLocked && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 ml-auto">
              <Lock className="w-3 h-3 mr-1" />
              Verrouillée
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélection de l'année */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Année fiscale</label>
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="Sélectionnez une année" />
            </SelectTrigger>
            <SelectContent>
              {projections.map((p) => (
                <SelectItem key={p.yearOffset} value={p.yearOffset.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{p.label}</span>
                    <span className="text-muted-foreground text-xs">
                      ({format(p.startDate, 'yyyy')})
                    </span>
                    {p.isActive && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        Active
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sélection de la semaine (grille visuelle) */}
        {granularity === 'week' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Semaine
              {showDataIndicator && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Les semaines avec un indicateur vert contiennent des données</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-[200px] overflow-y-auto p-1 rounded-lg bg-muted/30">
              {weeksForYear.map((week) => {
                const weekLocked = isWeekLocked(week.weekNumber, selectedYear);
                return (
                  <TooltipProvider key={week.weekNumber}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleWeekSelect(week.weekNumber)}
                          className={cn(
                            "relative flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs",
                            "hover:bg-primary/10 border border-transparent",
                            selectedWeek === week.weekNumber
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:border-primary/30",
                            week.hasData && selectedWeek !== week.weekNumber && !weekLocked && "ring-1 ring-green-500/50",
                            // Style pour les semaines verrouillées
                            weekLocked && selectedWeek !== week.weekNumber && "bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500/30"
                          )}
                        >
                          <span className="font-semibold">{week.weekNumber}</span>
                          {/* Icône cadenas pour semaines verrouillées */}
                          {weekLocked && (
                            <Lock className="absolute top-0.5 left-0.5 w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                          )}
                          {/* Point vert animé pour données existantes (si non verrouillé) - v2.0 */}
                          {week.hasData && selectedWeek !== week.weekNumber && !weekLocked && (
                            <div className="absolute -top-0.5 -right-0.5">
                              <span className="flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                              </span>
                            </div>
                          )}
                          {/* Checkmark pour verrouillé avec données */}
                          {week.hasData && weekLocked && selectedWeek !== week.weekNumber && (
                            <Check className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="font-medium flex items-center gap-1">
                          {week.label}
                          {weekLocked && <Lock className="w-3 h-3 text-green-500" />}
                        </p>
                        {/* Badge verrouillé */}
                        {weekLocked && (
                          <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                            <Lock className="w-3 h-3" />
                            <span>Période validée et verrouillée</span>
                          </div>
                        )}
                        {week.dataInfo && (
                          <div className="mt-1 pt-1 border-t border-border/50 text-xs">
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="w-3 h-3" />
                              <span>{week.dataInfo.entryCount} entrée(s)</span>
                            </div>
                            <div className="text-muted-foreground">
                              Total: {week.dataInfo.totalAmount.toFixed(2)} €
                            </div>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* Résumé de la sélection */}
        {selectedPeriod && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Période sélectionnée</span>
              {selectedPeriod.hasData && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Données existantes
                </Badge>
              )}
            </div>
            <div className="font-medium text-foreground">
              {format(new Date(selectedPeriod.periodStart), 'd MMMM yyyy', { locale: fr })}
              {' → '}
              {format(new Date(selectedPeriod.periodEnd), 'd MMMM yyyy', { locale: fr })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// HOOK POUR INTÉGRATION FACILE
// ============================================

export function useCalendarPeriod(companyId: string) {
  const [period, setPeriod] = useState<PeriodSelection | null>(null);
  const [projections, setProjections] = useState<DateProjection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        await launchDateService.loadConfig(companyId);
        setProjections(launchDateService.projectYears());
      } catch (error) {
        console.error('Error loading calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId]);

  return {
    period,
    setPeriod,
    projections,
    loading,
    // Helpers
    getCurrentWeek: () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      return {
        periodStart: format(weekStart, 'yyyy-MM-dd'),
        periodEnd: format(weekEnd, 'yyyy-MM-dd'),
      };
    },
  };
}

export default CalendarPeriodSelector;
