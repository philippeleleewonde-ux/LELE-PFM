/**
 * ============================================
 * CalendarPerformanceTracker - Suivi des Performances
 * ============================================
 *
 * Widget de visualisation de l'évolution des performances
 * dans le temps, synchronisé avec le LELE HCM Widget Smart Calendar.
 *
 * FONCTIONNALITÉS:
 * - Affichage des semaines avec données collectées
 * - Progression vers les objectifs par période
 * - Indicateurs visuels des performances (vert/orange/rouge)
 * - Mini-graphique d'évolution hebdomadaire
 * - Compatible avec LaunchDateSelector et SmartDateWidgets
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, isBefore, differenceInWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  ChevronRight,
  BarChart3,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { launchDateService, DateProjection } from '@/lib/fiscal/LaunchDateService';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

interface WeeklyPerformance {
  weekNumber: number;
  periodStart: string;
  periodEnd: string;
  totalPertes: number;
  totalEconomies: number;
  entryCount: number;
  performancePercent: number;
}

interface YearlyProgress {
  yearOffset: number;
  label: string;
  weeksWithData: number;
  totalWeeks: number;
  totalEconomies: number;
  targetEconomies: number;
  progressPercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface CalendarPerformanceTrackerProps {
  companyId: string;
  businessLineId?: string;
  pprAnnuel?: number;
  className?: string;
  compact?: boolean;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function CalendarPerformanceTracker({
  companyId,
  businessLineId,
  pprAnnuel = 100000,
  className,
  compact = false,
}: CalendarPerformanceTrackerProps) {
  const [projections, setProjections] = useState<DateProjection[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPerformance[]>([]);
  const [yearlyProgress, setYearlyProgress] = useState<YearlyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(1);
  // État pour les périodes verrouillées (synchronisé avec Company Profile)
  const [lockedPeriods, setLockedPeriods] = useState<Record<string, boolean>>({});

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        // Charger la config du calendrier
        await launchDateService.loadConfig(companyId);
        const projs = launchDateService.projectYears();
        setProjections(projs);

        // Charger les périodes verrouillées depuis LaunchDateService
        const locked = launchDateService.getAllLockedPeriodsFlat();
        setLockedPeriods(locked);

        // Charger les données de performance
        let query = supabase
          .from('module3_cost_entries')
          .select('period_start, period_end, compensation_amount, kpi_code')
          .eq('company_id', companyId);

        if (businessLineId) {
          query = query.eq('business_line_id', businessLineId);
        }

        const { data: entries, error } = await query;
        if (error) throw error;

        // Agréger par semaine
        const weeklyMap = new Map<string, WeeklyPerformance>();

        entries?.forEach((entry) => {
          const key = `${entry.period_start}-${entry.period_end}`;
          const amount = Number(entry.compensation_amount) || 0;

          if (weeklyMap.has(key)) {
            const existing = weeklyMap.get(key)!;
            existing.totalPertes += amount;
            existing.entryCount++;
          } else {
            const startDate = new Date(entry.period_start);
            weeklyMap.set(key, {
              weekNumber: getWeekNumber(startDate),
              periodStart: entry.period_start,
              periodEnd: entry.period_end,
              totalPertes: amount,
              totalEconomies: 0, // Calculé après
              entryCount: 1,
              performancePercent: 0,
            });
          }
        });

        // Calculer les économies (PPR hebdo - Pertes)
        const pprHebdo = pprAnnuel / 52;
        const weeklyPerfs = Array.from(weeklyMap.values()).map(week => ({
          ...week,
          totalEconomies: Math.max(0, pprHebdo - week.totalPertes),
          performancePercent: Math.min(100, ((pprHebdo - week.totalPertes) / pprHebdo) * 100),
        }));

        setWeeklyData(weeklyPerfs);

        // Calculer la progression par année
        const yearlyProgs: YearlyProgress[] = projs.map(proj => {
          const yearWeeks = weeklyPerfs.filter(w => {
            const weekStart = new Date(w.periodStart);
            return weekStart >= proj.startDate && weekStart <= proj.endDate;
          });

          const totalWeeksInYear = differenceInWeeks(proj.endDate, proj.startDate);
          const totalEco = yearWeeks.reduce((sum, w) => sum + w.totalEconomies, 0);
          const targetEco = pprAnnuel;

          // Calculer la tendance
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (yearWeeks.length >= 2) {
            const lastTwo = yearWeeks.slice(-2);
            if (lastTwo[1].totalEconomies > lastTwo[0].totalEconomies) trend = 'up';
            else if (lastTwo[1].totalEconomies < lastTwo[0].totalEconomies) trend = 'down';
          }

          return {
            yearOffset: proj.yearOffset,
            label: proj.label,
            weeksWithData: yearWeeks.length,
            totalWeeks: totalWeeksInYear,
            totalEconomies: totalEco,
            targetEconomies: targetEco,
            progressPercent: Math.min(100, (totalEco / targetEco) * 100),
            trend,
          };
        });

        setYearlyProgress(yearlyProgs);

        // Sélectionner l'année active
        const activeYear = projs.find(p => p.isActive);
        if (activeYear) setSelectedYear(activeYear.yearOffset);
      } catch (error) {
        console.error('Error loading performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, businessLineId, pprAnnuel]);

  // Helpers
  function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
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

  // Données filtrées pour l'année sélectionnée
  const currentYearData = useMemo(() => {
    const yearProj = projections.find(p => p.yearOffset === selectedYear);
    if (!yearProj) return [];

    return weeklyData.filter(w => {
      const weekStart = new Date(w.periodStart);
      return weekStart >= yearProj.startDate && weekStart <= yearProj.endDate;
    }).sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());
  }, [weeklyData, projections, selectedYear]);

  const currentYearProgress = yearlyProgress.find(y => y.yearOffset === selectedYear);

  if (loading) {
    return (
      <Card className={cn("bg-card/50 border-border", className)}>
        <CardContent className="p-6 flex items-center justify-center">
          <Clock className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Chargement...</span>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Version compacte pour sidebar ou header
    return (
      <Card className={cn("bg-card/50 border-border", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Performance {selectedYear > 0 ? `N+${selectedYear}` : 'N'}</span>
            </div>
            {currentYearProgress && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  currentYearProgress.trend === 'up' && "bg-green-500/10 text-green-600 border-green-500/30",
                  currentYearProgress.trend === 'down' && "bg-red-500/10 text-red-600 border-red-500/30",
                  currentYearProgress.trend === 'stable' && "bg-blue-500/10 text-blue-600 border-blue-500/30"
                )}
              >
                {currentYearProgress.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {currentYearProgress.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                {currentYearProgress.trend === 'stable' && <Activity className="w-3 h-3 mr-1" />}
                {currentYearProgress.progressPercent.toFixed(1)}%
              </Badge>
            )}
          </div>

          {currentYearProgress && (
            <>
              <Progress
                value={currentYearProgress.progressPercent}
                className={cn(
                  "h-2 mb-2",
                  currentYearProgress.progressPercent >= 75 && "[&>div]:bg-green-500",
                  currentYearProgress.progressPercent >= 50 && currentYearProgress.progressPercent < 75 && "[&>div]:bg-blue-500",
                  currentYearProgress.progressPercent < 50 && "[&>div]:bg-orange-500"
                )}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentYearProgress.weeksWithData} sem. enregistrées</span>
                <span>{currentYearProgress.totalEconomies.toFixed(0)} € économisés</span>
              </div>
            </>
          )}

          {/* Mini-graphique des 8 dernières semaines */}
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {currentYearData.slice(-8).map((week, idx) => (
              <TooltipProvider key={idx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex-1 rounded-t transition-all cursor-pointer hover:opacity-80",
                        week.performancePercent >= 75 && "bg-green-500",
                        week.performancePercent >= 50 && week.performancePercent < 75 && "bg-blue-500",
                        week.performancePercent < 50 && "bg-orange-500"
                      )}
                      style={{ height: `${Math.max(10, week.performancePercent)}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Sem {week.weekNumber}</p>
                    <p className="text-xs text-muted-foreground">{week.performancePercent.toFixed(1)}% perf.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Version complète
  return (
    <Card className={cn("bg-card/50 border-border backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Suivi des Performances HCM
        </CardTitle>
        <CardDescription>
          Évolution des économies réalisées connectées au calendrier fiscal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection d'année */}
        <div className="flex gap-2 flex-wrap">
          {yearlyProgress.map((year) => (
            <button
              key={year.yearOffset}
              onClick={() => setSelectedYear(year.yearOffset)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                selectedYear === year.yearOffset
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {year.label}
              {year.weeksWithData > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({year.weeksWithData} sem.)</span>
              )}
            </button>
          ))}
        </div>

        {/* Progression de l'année */}
        {currentYearProgress && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="font-medium">Objectif Annuel {currentYearProgress.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {currentYearProgress.trend === 'up' && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                {currentYearProgress.trend === 'down' && (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-lg font-bold text-primary">
                  {currentYearProgress.progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <Progress
              value={currentYearProgress.progressPercent}
              className="h-3 mb-3"
            />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Semaines</p>
                <p className="text-lg font-semibold">
                  {currentYearProgress.weeksWithData}/{currentYearProgress.totalWeeks}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Économies</p>
                <p className="text-lg font-semibold text-green-600">
                  {currentYearProgress.totalEconomies.toFixed(0)} €
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Objectif</p>
                <p className="text-lg font-semibold">
                  {currentYearProgress.targetEconomies.toFixed(0)} €
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Graphique des semaines */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Évolution hebdomadaire
          </h4>

          <div className="grid grid-cols-13 gap-1 p-3 rounded-lg bg-muted/30">
            {currentYearData.length > 0 ? (
              currentYearData.slice(0, 52).map((week, idx) => {
                const weekLocked = isWeekLocked(week.weekNumber, selectedYear);
                return (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square rounded transition-all cursor-pointer hover:ring-2 hover:ring-primary/50 relative flex items-center justify-center",
                          week.performancePercent >= 75 && "bg-green-500",
                          week.performancePercent >= 50 && week.performancePercent < 75 && "bg-blue-500",
                          week.performancePercent >= 25 && week.performancePercent < 50 && "bg-orange-500",
                          week.performancePercent < 25 && "bg-red-500",
                          // Style spécial pour les semaines verrouillées
                          weekLocked && "ring-2 ring-green-400/50"
                        )}
                      >
                        {/* Icône cadenas pour semaines verrouillées */}
                        {weekLocked && (
                          <Lock className="w-2.5 h-2.5 text-white/90" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium flex items-center gap-1">
                          Semaine {week.weekNumber}
                          {weekLocked && <Lock className="w-3 h-3 text-green-500" />}
                        </p>
                        <p className="text-xs">
                          {format(new Date(week.periodStart), 'd MMM', { locale: fr })} -{' '}
                          {format(new Date(week.periodEnd), 'd MMM', { locale: fr })}
                        </p>
                        {/* Badge verrouillé */}
                        {weekLocked && (
                          <div className="flex items-center gap-1 text-green-500 text-xs mt-1">
                            <Lock className="w-3 h-3" />
                            <span>Période validée et verrouillée</span>
                          </div>
                        )}
                        <div className="pt-1 border-t border-border/50 text-xs">
                          <div className="flex justify-between">
                            <span>Pertes:</span>
                            <span className="text-red-400">{week.totalPertes.toFixed(0)} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Économies:</span>
                            <span className="text-green-400">{week.totalEconomies.toFixed(0)} €</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Performance:</span>
                            <span>{week.performancePercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )})
            ) : (
              <div className="col-span-13 text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune donnée pour cette année</p>
                <p className="text-xs">Commencez à saisir des coûts dans le Module 3</p>
              </div>
            )}
          </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>≥75%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>50-74%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>25-49%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>&lt;25%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CalendarPerformanceTracker;
