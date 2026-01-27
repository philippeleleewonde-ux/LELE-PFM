/**
 * ============================================
 * WEEK CALENDAR SELECTOR
 * ============================================
 *
 * Sélecteur de période hebdomadaire visuel pour HCM Cost Savings.
 * Inspiré du design de PerformanceCalendarPage mais optimisé
 * pour la SÉLECTION de périodes de saisie de données.
 *
 * FONCTIONNALITÉS:
 * - Affichage visuel des semaines avec dates (ex: "06 Jan → 12 Jan")
 * - Indicateur de données existantes (vert) vs sans données (rouge)
 * - Indicateur de verrouillage
 * - Sélection de période pour la saisie
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLaunchDateContext } from '@/components/shared/SmartDateWidgets';
import { supabase } from '@/integrations/supabase/client';
import { calendarEventBus } from '@/lib/fiscal/CalendarEventBus';
import { launchDateService, type LaunchConfig } from '@/lib/fiscal/LaunchDateService';

// ============================================
// TYPES
// ============================================

export interface WeekSelection {
  periodStart: string; // Format: YYYY-MM-DD
  periodEnd: string;   // Format: YYYY-MM-DD
  weekNumber: number;
  globalWeekNumber: number;
  yearOffset: number;
  isLocked: boolean;
  hasData: boolean;
}

interface WeekData {
  id: string;
  weekNumber: number;
  globalWeekNumber: number;
  startDate: Date;
  endDate: Date;
  startDateFormatted: string; // "06 Jan"
  endDateFormatted: string;   // "12 Jan"
  isLocked: boolean;
  hasData: boolean;
  dataCount?: number;
  monthName: string;
}

interface MonthData {
  name: string;
  shortName: string;
  weeks: WeekData[];
}

interface WeekCalendarSelectorProps {
  companyId: string;
  businessLineId?: string;
  onPeriodChange: (period: WeekSelection) => void;
  selectedPeriod?: WeekSelection;
  className?: string;
}

// ============================================
// CONSTANTES
// ============================================

const MONTHS_FR = [
  { name: 'Janvier', short: 'Jan' },
  { name: 'Février', short: 'Fév' },
  { name: 'Mars', short: 'Mar' },
  { name: 'Avril', short: 'Avr' },
  { name: 'Mai', short: 'Mai' },
  { name: 'Juin', short: 'Jun' },
  { name: 'Juillet', short: 'Jul' },
  { name: 'Août', short: 'Aoû' },
  { name: 'Septembre', short: 'Sep' },
  { name: 'Octobre', short: 'Oct' },
  { name: 'Novembre', short: 'Nov' },
  { name: 'Décembre', short: 'Déc' }
];

// Mois fiscaux: ordre basé sur la date de lancement (Décembre → Novembre)
// N+1 avec lancement le 1er décembre 2025 = Dec 2025, Jan 2026, ..., Nov 2026
const FISCAL_MONTHS = [
  { name: 'Décembre', short: 'Déc', calendarMonth: 11 },   // Mois 1 fiscal = Décembre
  { name: 'Janvier', short: 'Jan', calendarMonth: 0 },    // Mois 2 fiscal = Janvier
  { name: 'Février', short: 'Fév', calendarMonth: 1 },
  { name: 'Mars', short: 'Mar', calendarMonth: 2 },
  { name: 'Avril', short: 'Avr', calendarMonth: 3 },
  { name: 'Mai', short: 'Mai', calendarMonth: 4 },
  { name: 'Juin', short: 'Jun', calendarMonth: 5 },
  { name: 'Juillet', short: 'Jul', calendarMonth: 6 },
  { name: 'Août', short: 'Aoû', calendarMonth: 7 },
  { name: 'Septembre', short: 'Sep', calendarMonth: 8 },
  { name: 'Octobre', short: 'Oct', calendarMonth: 9 },
  { name: 'Novembre', short: 'Nov', calendarMonth: 10 }   // Mois 12 fiscal = Novembre
];

const MONTHS_SHORT_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ============================================
// UTILITAIRE: Calcul des dates de semaine FISCALE
// ============================================

/**
 * Calcule les dates de début et fin d'une semaine fiscale
 * basée sur la date de lancement de la plateforme.
 *
 * Exemple: Si lancement = 1er décembre 2025
 * - Semaine 1 N+1 = 1 déc 2025 → 7 déc 2025
 * - Semaine 2 N+1 = 8 déc 2025 → 14 déc 2025
 * - Semaine 52 N+1 = 23 nov 2026 → 29 nov 2026
 *
 * @param launchDate Date de lancement de la plateforme
 * @param yearOffset Offset d'année fiscale (1 = N+1, 2 = N+2, 3 = N+3)
 * @param weekNumber Numéro de semaine fiscale (1-52)
 */
function getFiscalWeekDateRange(
  launchDate: Date,
  yearOffset: number,
  weekNumber: number
): { startDate: Date; endDate: Date } {
  // Calculer le début de l'année fiscale N+X
  // yearOffset = 1 → année fiscale commence à launchDate
  // yearOffset = 2 → année fiscale commence à launchDate + 1 an
  const fiscalYearStart = new Date(launchDate);
  fiscalYearStart.setFullYear(launchDate.getFullYear() + (yearOffset - 1));

  // Calculer le début de la semaine demandée
  const weekStart = new Date(fiscalYearStart);
  weekStart.setDate(fiscalYearStart.getDate() + (weekNumber - 1) * 7);

  // Calculer la fin de la semaine (6 jours après le début)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return { startDate: weekStart, endDate: weekEnd };
}

// Ancienne fonction ISO (gardée pour compatibilité)
function getWeekDateRange(year: number, weekNumber: number): { startDate: Date; endDate: Date } {
  // Trouver le premier lundi de l'année (ISO week)
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToFirstMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);

  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);

  // Calculer le lundi de la semaine demandée
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  // Calculer le dimanche de cette semaine
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return { startDate: weekStart, endDate: weekEnd };
}

function formatDateShort(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTHS_SHORT_FR[date.getMonth()];
  return `${day} ${month}`;
}

// ============================================
// COMPOSANT: Cellule de semaine
// ============================================

interface WeekCellProps {
  week: WeekData;
  isSelected: boolean;
  onClick: () => void;
}

const WeekCell = ({ week, isSelected, onClick }: WeekCellProps) => {
  const getStatusStyles = () => {
    if (week.hasData) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300',
        icon: 'text-emerald-600 dark:text-emerald-400'
      };
    }
    return {
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      badge: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300',
      icon: 'text-red-500 dark:text-red-400'
    };
  };

  const styles = getStatusStyles();

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group flex flex-col p-3 rounded-lg border transition-all cursor-pointer w-full",
        styles.bg,
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-lg"
      )}
    >
      {/* Ligne 1: Date + Verrouillage + Statut données */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-1.5">
          {/* Indicateur de verrouillage */}
          <div className={cn(
            "p-1 rounded-full",
            week.isLocked
              ? "bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
          )}>
            {week.isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
          </div>
          <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300" title={`Semaine ${week.globalWeekNumber}`}>
            {week.startDateFormatted} → {week.endDateFormatted}
          </p>
        </div>

        {/* Badge de statut données */}
        <div className={cn(
          "flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
          styles.badge
        )}>
          {week.hasData ? (
            <>
              <CheckCircle className="w-2.5 h-2.5" />
              <span>Données</span>
            </>
          ) : (
            <>
              <Database className="w-2.5 h-2.5" />
              <span>Vide</span>
            </>
          )}
        </div>
      </div>

      {/* Ligne 2: Numéro de semaine globale */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Calendar className={cn("w-3.5 h-3.5", styles.icon)} />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Semaine {week.globalWeekNumber}
          </span>
        </div>
        {week.dataCount !== undefined && week.dataCount > 0 && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {week.dataCount} entrée(s)
          </span>
        )}
      </div>

      {/* Indicateur de sélection */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700"
        >
          <div className="flex items-center justify-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Période sélectionnée
          </div>
        </motion.div>
      )}
    </motion.button>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function WeekCalendarSelector({
  companyId,
  businessLineId,
  onPeriodChange,
  selectedPeriod,
  className
}: WeekCalendarSelectorProps) {
  // Essayer d'abord le contexte, sinon charger directement
  const { config: contextConfig, refreshConfig } = useLaunchDateContext();
  const [localConfig, setLocalConfig] = useState<LaunchConfig | null>(null);
  const [selectedYearOffset, setSelectedYearOffset] = useState(1); // N+1 par défaut
  const [weeksWithData, setWeeksWithData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lockVersion, setLockVersion] = useState(0); // Force re-render on lock changes

  // Utiliser la config du contexte si disponible, sinon la config locale
  const config = contextConfig || localConfig;

  // Charger la config directement depuis launchDateService si le contexte est vide
  useEffect(() => {
    const loadLaunchConfig = async () => {
      if (!companyId) return;

      // Si le contexte a déjà la config, pas besoin de charger
      if (contextConfig?.platformLaunchDate) {
        console.log('[WeekCalendarSelector] ✅ Using context config');
        return;
      }

      console.log('[WeekCalendarSelector] 📥 Loading config from launchDateService for:', companyId);
      try {
        await launchDateService.loadConfig(companyId);
        const loadedConfig = launchDateService.getConfig();
        console.log('[WeekCalendarSelector] 📦 Loaded config:', loadedConfig);
        if (loadedConfig) {
          setLocalConfig(loadedConfig);
        }
      } catch (error) {
        console.error('[WeekCalendarSelector] ❌ Error loading config:', error);
      }
    };

    loadLaunchConfig();
  }, [companyId, contextConfig?.platformLaunchDate]);

  // Écouter les changements de verrouillage via CalendarEventBus
  useEffect(() => {
    const handleLockChange = () => {
      console.log('[WeekCalendarSelector] Lock change detected, refreshing...');
      setLockVersion(v => v + 1);
      // Aussi rafraîchir la config depuis le contexte
      if (refreshConfig) {
        refreshConfig();
      }
      // Recharger la config locale aussi
      if (companyId) {
        launchDateService.loadConfig(companyId).then(() => {
          const reloadedConfig = launchDateService.getConfig();
          if (reloadedConfig) {
            setLocalConfig(reloadedConfig);
          }
        });
      }
    };

    // S'abonner à l'événement PERIOD_LOCKED
    const unsubscribe = calendarEventBus.subscribe('PERIOD_LOCKED', handleLockChange);
    return () => {
      unsubscribe();
    };
  }, [refreshConfig, companyId]);

  // Charger les données existantes pour marquer les semaines
  useEffect(() => {
    const loadExistingData = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        let query = supabase
          .from('module3_cost_entries')
          .select('period_start, period_end', { count: 'exact' })
          .eq('company_id', companyId);

        if (businessLineId) {
          query = query.eq('business_line_id', businessLineId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('[WeekCalendarSelector] Erreur chargement données:', error);
          return;
        }

        // Compter les entrées par période
        const dataByWeek: Record<string, number> = {};
        if (data) {
          data.forEach((entry: any) => {
            const key = `${entry.period_start}_${entry.period_end}`;
            dataByWeek[key] = (dataByWeek[key] || 0) + 1;
          });
        }
        setWeeksWithData(dataByWeek);
      } catch (err) {
        console.error('[WeekCalendarSelector] Exception:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, [companyId, businessLineId]);

  // Récupérer la date de lancement depuis le config
  const launchDate = useMemo(() => {
    console.log('[WeekCalendarSelector] Config:', config);
    console.log('[WeekCalendarSelector] platformLaunchDate:', config?.platformLaunchDate);

    if (config?.platformLaunchDate) {
      const date = new Date(config.platformLaunchDate);
      console.log('[WeekCalendarSelector] ✅ Using launch date:', date.toLocaleDateString('fr-FR'));
      return date;
    }
    // Fallback: 1er janvier de l'année en cours
    const fallback = new Date(new Date().getFullYear(), 0, 1);
    console.log('[WeekCalendarSelector] ⚠️ Using FALLBACK date:', fallback.toLocaleDateString('fr-FR'));
    return fallback;
  }, [config?.platformLaunchDate]);

  // L'année de début de N+1 = année de la date de lancement
  // Si lancement = 1er décembre 2025, alors N+1 commence en 2025
  const baseYear = useMemo(() => {
    return launchDate.getFullYear();
  }, [launchDate]);

  // Générer les données du calendrier FISCAL
  // Ordre des mois: Décembre → Janvier → ... → Novembre
  // Les semaines sont calculées depuis la date de lancement
  const calendarData = useMemo(() => {
    // L'année affichée pour N+X = baseYear + (X - 1)
    // N+1 → 2025, N+2 → 2026, N+3 → 2027 (si lancement = Dec 2025)
    const fiscalStartYear = baseYear + (selectedYearOffset - 1);

    const months: Record<string, MonthData> = {};
    let globalWeekNum = 0;

    // Parcourir les 12 mois fiscaux (Dec → Nov)
    FISCAL_MONTHS.forEach((month, fiscalMonthIndex) => {
      const weeksInMonth: WeekData[] = [];

      // Calculer l'année calendrier de ce mois
      // Décembre (fiscalMonthIndex = 0) → fiscalStartYear
      // Janvier à Novembre (fiscalMonthIndex 1-11) → fiscalStartYear + 1
      const calendarYear = fiscalMonthIndex === 0 ? fiscalStartYear : fiscalStartYear + 1;

      // Nombre de semaines par mois (approximatif: 4-5 semaines)
      // Décembre et le dernier mois peuvent avoir 5 semaines pour atteindre 52
      const weeksCount = (fiscalMonthIndex === 0 || fiscalMonthIndex === 11) ? 5 : 4;

      for (let w = 1; w <= weeksCount; w++) {
        globalWeekNum++;
        if (globalWeekNum > 52) break;

        // Calculer les dates de cette semaine fiscale
        const { startDate, endDate } = getFiscalWeekDateRange(launchDate, selectedYearOffset, globalWeekNum);

        // Vérifier si des données existent pour cette semaine
        const periodStart = startDate.toISOString().split('T')[0];
        const periodEnd = endDate.toISOString().split('T')[0];
        const dataKey = `${periodStart}_${periodEnd}`;
        const dataCount = weeksWithData[dataKey] || 0;

        // Vérifier le verrouillage - utilise la structure lockedDates du Widget Smart Calendar
        // Structure: lockedDates = { 1: { isLocked: true }, 2: { isLocked: false }, 3: { isLocked: true } }
        const yearLockedData = config?.lockedDates?.[selectedYearOffset];
        const isYearLocked = yearLockedData?.isLocked === true;
        // On peut aussi vérifier une semaine individuelle si implémenté
        const weekKey = `week_${selectedYearOffset}_${globalWeekNum}`;
        const isWeekLocked = config?.lockedDates?.[weekKey] === true;
        const isLocked = isYearLocked || isWeekLocked;

        weeksInMonth.push({
          id: `fiscal-${fiscalStartYear}-${month.name}-W${w}`,
          weekNumber: w,
          globalWeekNumber: globalWeekNum,
          startDate,
          endDate,
          startDateFormatted: formatDateShort(startDate),
          endDateFormatted: formatDateShort(endDate),
          isLocked: !!isLocked,
          hasData: dataCount > 0,
          dataCount,
          monthName: month.name
        });
      }

      if (weeksInMonth.length > 0) {
        months[month.name] = {
          name: month.name,
          shortName: month.short,
          weeks: weeksInMonth
        };
      }
    });

    // L'année affichée = année de début fiscal
    return { year: fiscalStartYear, months };
  }, [baseYear, launchDate, config, selectedYearOffset, weeksWithData, lockVersion]);

  // Gérer le clic sur une semaine
  const handleWeekClick = useCallback((week: WeekData) => {
    const periodStart = week.startDate.toISOString().split('T')[0];
    const periodEnd = week.endDate.toISOString().split('T')[0];

    onPeriodChange({
      periodStart,
      periodEnd,
      weekNumber: week.weekNumber,
      globalWeekNumber: week.globalWeekNumber,
      yearOffset: selectedYearOffset,
      isLocked: week.isLocked,
      hasData: week.hasData
    });
  }, [selectedYearOffset, onPeriodChange]);

  // Vérifier si une semaine est sélectionnée
  const isWeekSelected = useCallback((week: WeekData) => {
    if (!selectedPeriod) return false;
    const periodStart = week.startDate.toISOString().split('T')[0];
    const periodEnd = week.endDate.toISOString().split('T')[0];
    return selectedPeriod.periodStart === periodStart && selectedPeriod.periodEnd === periodEnd;
  }, [selectedPeriod]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    let totalWeeks = 0;
    let weeksWithDataCount = 0;
    let lockedWeeks = 0;

    Object.values(calendarData.months).forEach(month => {
      month.weeks.forEach(week => {
        totalWeeks++;
        if (week.hasData) weeksWithDataCount++;
        if (week.isLocked) lockedWeeks++;
      });
    });

    return { totalWeeks, weeksWithDataCount, lockedWeeks };
  }, [calendarData]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header avec navigation année */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Sélection de la Période
          </h3>
        </div>

        {/* Sélecteur d'année */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedYearOffset(Math.max(1, selectedYearOffset - 1))}
            disabled={selectedYearOffset <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex gap-1">
            {[1, 2, 3].map(offset => (
              <button
                key={offset}
                onClick={() => setSelectedYearOffset(offset)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  selectedYearOffset === offset
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <span className="font-bold">N+{offset}</span>
                {/* L'année fiscale N+X commence à baseYear + (X-1) */}
                <span className="ml-1 opacity-80">({baseYear + offset - 1})</span>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedYearOffset(Math.min(3, selectedYearOffset + 1))}
            disabled={selectedYearOffset >= 3}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="flex items-center gap-4 text-sm">
        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Année {calendarData.year}
        </Badge>
        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          {stats.weeksWithDataCount}/{stats.totalWeeks} semaines avec données
        </Badge>
        <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
          {stats.lockedWeeks} verrouillées
        </Badge>
      </div>

      {/* Grille du calendrier */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Calendar className="w-5 h-5" />
            </motion.div>
            <span>Chargement du calendrier...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Itérer sur FISCAL_MONTHS pour préserver l'ordre Dec → Nov */}
          {FISCAL_MONTHS.map((fiscalMonth) => {
            const monthData = calendarData.months[fiscalMonth.name];
            if (!monthData) return null;

            const hasAnyData = monthData.weeks.some(w => w.hasData);

            return (
              <Card
                key={fiscalMonth.name}
                className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700"
              >
                {/* Header du mois - Vert si données, Rouge sinon */}
                <div className={cn(
                  "px-4 py-3 flex justify-between items-center bg-gradient-to-r",
                  hasAnyData
                    ? "from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800"
                    : "from-red-500 to-red-600 dark:from-red-600 dark:to-red-700"
                )}>
                  <h4 className="font-bold text-white">{fiscalMonth.name}</h4>
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {monthData.weeks.length} sem.
                  </Badge>
                </div>

                {/* Liste des semaines */}
                <CardContent className="p-3 space-y-2">
                  {monthData.weeks.map(week => (
                    <WeekCell
                      key={week.id}
                      week={week}
                      isSelected={isWeekSelected(week)}
                      onClick={() => handleWeekClick(week)}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Légende */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Données enregistrées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600 dark:text-slate-400">Aucune donnée</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-600 dark:text-slate-400">Verrouillée</span>
        </div>
        <div className="flex items-center gap-2">
          <Unlock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-400">Ouverte</span>
        </div>
      </div>
    </div>
  );
}
