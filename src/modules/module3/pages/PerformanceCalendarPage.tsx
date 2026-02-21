/**
 * ============================================
 * CALENDRIER DE SUIVI DES PERFORMANCES
 * ============================================
 *
 * Calendrier intelligent de performance pour le suivi des réductions de coûts.
 * Inspiré du modèle Gemini, adapté à l'architecture LELE HCM.
 *
 * ARCHITECTURE À 3 NIVEAUX:
 * 1. Vue Annuelle: Grille 12 mois × 4 semaines avec color-coding
 * 2. Vue Mensuelle: Détail des semaines du mois sélectionné
 * 3. Vue Hebdomadaire: Rapport complet avec ventilation par indicateur
 *
 * SOURCES DE DONNÉES:
 * - Objectifs: Module 1 (Profil Entreprise)
 * - Réalisés: Module 3 (HCM COST SAVINGS - moteur de calcul)
 * - Verrouillage: LaunchDateService (Smart Calendar CASCADE)
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '@/contexts/CompanyContext';
import {
  Calendar,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Printer,
  Target,
  Users,
  Building2,
  BarChart3,
  PieChart,
  Award,
  Clock,
  Zap,
  UserCircle,
  Shield,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';
import { launchDateService, getLastCompletedWeek, type LockedDateConfig, type LastCompletedWeekResult } from '@/lib/fiscal/LaunchDateService';
import { calendarEventBus, useCalendarEvent } from '@/lib/fiscal/CalendarEventBus';
import { supabase } from '@/integrations/supabase/client';
// ✅ TRANSFERT DONNÉES: Import du context PerformanceData pour accès aux données OBJ/RÉAL
import { usePerformanceData } from '../contexts/PerformanceDataContext';
// ✅ TRANSFERT DONNÉES: Import du context GLOBAL pour accès aux grandTotals (TOTAL GÉNÉRAL)
// Source: PerformanceRecapPage → setPerformanceData() → grandTotals.grandTotalPPR / grandTotals.grandTotalEco
import { usePerformanceData as useGlobalPerformanceData, type GrandTotals } from '@/contexts/PerformanceDataContext';
// ✅ VALIDATION RATIO 33%/67%: Import des fonctions de validation Prime/Trésorerie
import { validatePrimeTresoRatio, PRIME_RATIO, TRESO_RATIO, type RatioValidationResult } from '../types/performanceCenter';

// ============================================
// TYPES
// ============================================

interface WeekData {
  id: string;
  weekNumber: number;
  globalWeekNumber: number;
  target: number;
  actual: number;
  isLocked: boolean;
  isCurrentWeek: boolean; // Indicateur semaine courante (dernière complétée)
  isBeforeLaunch: boolean; // Semaine avant la date de lancement plateforme
  status: 'success' | 'warning' | 'critical' | 'planned' | 'before-launch';
  variance: number;
  variancePercent: number;
  // Dates de la semaine (pour affichage "Sem. du XX au XX")
  startDate: string; // Format: "06 Jan"
  endDate: string;   // Format: "12 Jan"
  // Ventilation par indicateur
  indicators?: {
    abs: { target: number; actual: number };
    qd: { target: number; actual: number };
    oa: { target: number; actual: number };
    ddp: { target: number; actual: number };
    ekh: { target: number; actual: number };
  };
  // ✅ NOUVEAU: Ventilation par ligne d'activité
  byBusinessLine?: {
    lineId: string;
    lineName: string;
    target: number;
    actual: number;
  }[];
  // Flag pour indiquer si des données RÉAL existent
  hasRealData: boolean;
}

interface MonthData {
  name: string;
  shortName: string;
  weeks: WeekData[];
}

interface YearData {
  year: number;
  yearOffset: number; // 1=N+1, 2=N+2, 3=N+3
  label: string;
  months: Record<string, MonthData>;
  totalTarget: number;
  totalActual: number;
  lockedWeeks: number;
  totalWeeks: number;
}

/**
 * ✅ Type pour les entrées de coûts depuis Supabase (module3_cost_entries)
 */
interface CostEntryDB {
  id: string;
  company_id: string;
  kpi_type: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
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

// ✅ Mois FISCAUX: ordre basé sur la date de lancement (Décembre → Novembre)
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

const INDICATOR_CONFIGS = [
  { key: 'abs', label: 'Absentéisme', icon: UserCircle, color: 'orange' },
  { key: 'qd', label: 'Défauts Qualité', icon: AlertTriangle, color: 'rose' },
  { key: 'oa', label: 'Accidents Travail', icon: Zap, color: 'red' },
  { key: 'ddp', label: 'Délai Production', icon: Clock, color: 'blue' },
  { key: 'ekh', label: 'Efficacité KH', icon: Target, color: 'purple' }
];

/**
 * ✅ MAPPING EXPLICITE pour éviter la purge Tailwind en production
 * Les classes dynamiques comme `bg-${color}-100` sont purgées car Tailwind
 * ne peut pas les détecter statiquement. Ce mapping assure leur inclusion.
 */
const INDICATOR_STYLES: Record<string, { bg: string; text: string }> = {
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400'
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400'
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400'
  }
};

// Seuils de performance
const THRESHOLDS = {
  SUCCESS: 95,    // >= 95% = Vert (Atteint)
  WARNING: 85,    // 85-95% = Orange (À surveiller)
  // < 85% = Rouge (Critique)
};

// ============================================
// CONSTANTES FILTRES
// ============================================

// Modes de vue temporelle
type ViewMode = 'years' | 'months' | 'weeks';
const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'years', label: 'Années' },
  { key: 'months', label: 'Mois' },
  { key: 'weeks', label: 'Semaines' }
];

// Indicateurs de performance (pour filtrage)
const PERFORMANCE_INDICATORS = [
  { key: 'abs', label: 'Absentéisme' },
  { key: 'qd', label: 'Défaut de qualité' },
  { key: 'oa', label: 'Accident de travail' },
  { key: 'ddp', label: 'Écart de productivité directe' },
  { key: 'ekh', label: 'Écart de Know How' }
];

// Domaines clés socio-économiques
const SOCIO_ECONOMIC_DOMAINS = [
  { key: 'time_mgmt', label: 'Gestion du temps', indicators: ['abs'] },
  { key: 'work_org', label: "L'organisation du travail", indicators: ['ddp'] },
  { key: 'work_cond', label: 'Les conditions de travail', indicators: ['oa'] },
  { key: 'strategy', label: 'La mise en œuvre stratégique', indicators: ['qd'] },
  { key: '3c_training', label: '3C et Formation intégrée', indicators: ['ekh'] }
];

// Mois abrégés pour l'affichage des dates
const MONTHS_SHORT_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ============================================
// UTILITAIRE: Calcul des dates de semaine
// ============================================

/**
 * Calcule les dates de début et fin d'une semaine donnée pour une année (objets Date)
 * @param year - Année (ex: 2027)
 * @param weekNumber - Numéro de semaine (1-52)
 * @returns { weekStartDate: Date, weekEndDate: Date }
 */
function getWeekDatesAsObjects(year: number, weekNumber: number): { weekStartDate: Date; weekEndDate: Date } {
  // Trouver le premier lundi de l'année (ISO week)
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  // Ajustement pour trouver le premier lundi (dimanche = 0, lundi = 1, etc.)
  const daysToFirstMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);

  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);

  // Calculer le lundi de la semaine demandée
  const weekStartDate = new Date(firstMonday);
  weekStartDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  weekStartDate.setHours(0, 0, 0, 0);

  // Calculer le dimanche de cette semaine (23:59:59)
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  return { weekStartDate, weekEndDate };
}

/**
 * Calcule les dates de début et fin d'une semaine donnée pour une année
 * @param year - Année (ex: 2027)
 * @param weekNumber - Numéro de semaine (1-52)
 * @returns { startDate: "06 Jan", endDate: "12 Jan" }
 */
function getWeekDateRange(year: number, weekNumber: number): { startDate: string; endDate: string } {
  const { weekStartDate, weekEndDate } = getWeekDatesAsObjects(year, weekNumber);

  // Formater les dates
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = MONTHS_SHORT_FR[date.getMonth()];
    return `${day} ${month}`;
  };

  return {
    startDate: formatDate(weekStartDate),
    endDate: formatDate(weekEndDate)
  };
}

/**
 * ✅ UTILITAIRE FISCAL: Calcul des dates de semaine FISCALE
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
): { startDate: Date; endDate: Date; periodStart: string; periodEnd: string } {
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

  // Format ISO pour matching avec module3_cost_entries
  const periodStart = weekStart.toISOString().split('T')[0];
  const periodEnd = weekEnd.toISOString().split('T')[0];

  return { startDate: weekStart, endDate: weekEnd, periodStart, periodEnd };
}

/**
 * Format date court pour affichage
 */
function formatDateShort(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTHS_SHORT_FR[date.getMonth()];
  return `${day} ${month}`;
}

// ============================================
// COMPOSANT: Barre de progression
// ============================================

const ProgressBar = ({
  current,
  max,
  colorClass,
  showLabel = false,
  size = 'md'
}: {
  current: number;
  max: number;
  colorClass: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (current / safeMax) * 100));

  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }[size];

  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", heightClass)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn("h-full rounded-full", colorClass)}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 min-w-[40px] text-right">
          {percent.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

// ============================================
// COMPOSANT: Badge Validation Ratio 33%/67%
// ============================================

/**
 * ✅ Affiche la validation du ratio Prime (33%) / Trésorerie (67%)
 * Conforme aux règles LELE HCM de répartition des économies
 */
const RatioValidationBadge = ({
  economiesRealisees,
  realPrime,
  realTreso,
  showDetails = false
}: {
  economiesRealisees: number;
  realPrime: number;
  realTreso: number;
  showDetails?: boolean;
}) => {
  const validation = validatePrimeTresoRatio(economiesRealisees, realPrime, realTreso);

  if (economiesRealisees <= 0) {
    return (
      <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <Info className="w-4 h-4 text-slate-400" aria-hidden="true" />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Ratio 33%/67% - En attente de données
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      validation.isValid
        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          )}
          <span className={cn(
            "text-xs font-bold",
            validation.isValid
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300"
          )}>
            Ratio {PRIME_RATIO * 100}% / {TRESO_RATIO * 100}%
          </span>
        </div>
        <Badge variant={validation.isValid ? "default" : "secondary"} className={cn(
          "text-[10px]",
          validation.isValid
            ? "bg-emerald-600 hover:bg-emerald-600"
            : "bg-amber-600 hover:bg-amber-600 text-white"
        )}>
          {validation.isValid ? 'Conforme' : 'À vérifier'}
        </Badge>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Prime: </span>
            <span className={cn(
              "font-medium",
              Math.abs(validation.actualPrimeRatio - PRIME_RATIO) <= 0.01
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )}>
              {(validation.actualPrimeRatio * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400"> (cible: {PRIME_RATIO * 100}%)</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Tréso: </span>
            <span className={cn(
              "font-medium",
              Math.abs(validation.actualTresoRatio - TRESO_RATIO) <= 0.01
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )}>
              {(validation.actualTresoRatio * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400"> (cible: {TRESO_RATIO * 100}%)</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPOSANT: KPI Card
// ============================================

const KPICard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  subtitle,
  trend
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}) => (
  <Card className={cn("border-l-4", colorClass)}>
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "p-2 rounded-lg",
          colorClass.replace('border-l-', 'bg-').replace('500', '100'),
          "dark:" + colorClass.replace('border-l-', 'bg-').replace('500', '900/30')
        )}>
          <Icon className={cn("w-5 h-5", colorClass.replace('border-l-', 'text-'))} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" aria-hidden="true" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" aria-hidden="true" />}
          <span className={cn(
            "text-xs",
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          )}>
            {trend === 'up' ? 'En hausse' : trend === 'down' ? 'En baisse' : 'Stable'}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

// ============================================
// COMPOSANT: Widget de Filtrage Complet
// ============================================

interface FilterWidgetProps {
  // Année
  selectedYearOffset: number;
  onYearChange: (offset: number) => void;
  availableYears: { offset: number; year: number; label: string }[];
  // Mode de vue
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Ligne d'activité
  selectedBusinessLine: string;
  onBusinessLineChange: (bl: string) => void;
  businessLines: { id: string; name: string }[];
  // Indicateurs
  selectedIndicators: string[];
  onIndicatorsChange: (indicators: string[]) => void;
  // Domaines
  selectedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
}

const FilterWidget = ({
  selectedYearOffset,
  onYearChange,
  availableYears,
  viewMode,
  onViewModeChange,
  selectedBusinessLine,
  onBusinessLineChange,
  businessLines,
  selectedIndicators,
  onIndicatorsChange,
  selectedDomains,
  onDomainsChange
}: FilterWidgetProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200 dark:border-slate-700">
      <CardContent className="p-4">
        {/* Ligne principale de filtres */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtre Année */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <span id="year-filter-label" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Année</span>
            <Select value={selectedYearOffset.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
              <SelectTrigger className="w-[120px] h-8 text-sm bg-white dark:bg-slate-800" aria-labelledby="year-filter-label">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y.offset} value={y.offset.toString()}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Séparateur */}
          <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 hidden sm:block" />

          {/* Filtre Vue */}
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span id="view-filter-label" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Vue</span>
            <div role="group" aria-labelledby="view-filter-label" className="flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              {VIEW_MODES.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => onViewModeChange(mode.key)}
                  aria-pressed={viewMode === mode.key}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    viewMode === mode.key
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Séparateur */}
          <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 hidden sm:block" />

          {/* Filtre Ligne d'activité */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" aria-hidden="true" />
            <span id="businessline-filter-label" className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase hidden md:inline">Ligne</span>
            <span id="businessline-filter-label-sr" className="sr-only">Ligne d'activité</span>
            <Select value={selectedBusinessLine} onValueChange={onBusinessLineChange}>
              <SelectTrigger className="w-[160px] h-8 text-sm bg-white dark:bg-slate-800" aria-labelledby="businessline-filter-label-sr">
                <SelectValue placeholder="Ligne d'activité" />
              </SelectTrigger>
              <SelectContent>
                {businessLines.map(bl => (
                  <SelectItem key={bl.id} value={bl.id}>
                    {bl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bouton filtres avancés */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "ml-auto gap-1.5",
              showAdvancedFilters && "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700"
            )}
          >
            <Info className="w-3.5 h-3.5" />
            Filtres avancés
            {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Filtres avancés (expandable) */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Dropdown Indicateurs de performance */}
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                      <Select
                        value={selectedIndicators.length === 1 ? selectedIndicators[0] : (selectedIndicators.length > 1 ? 'multiple' : 'all')}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            onIndicatorsChange([]);
                          } else if (value !== 'multiple') {
                            // Toggle single selection
                            if (selectedIndicators.includes(value)) {
                              onIndicatorsChange(selectedIndicators.filter(i => i !== value));
                            } else {
                              onIndicatorsChange([...selectedIndicators, value]);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-9 text-sm bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-2">
                            <SelectValue placeholder="Indicateurs de Performance">
                              {selectedIndicators.length === 0
                                ? "Tous les indicateurs"
                                : selectedIndicators.length === 1
                                ? PERFORMANCE_INDICATORS.find(i => i.key === selectedIndicators[0])?.label
                                : `${selectedIndicators.length} indicateurs sélectionnés`
                              }
                            </SelectValue>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <span className="font-medium">Tous les indicateurs</span>
                          </SelectItem>
                          {PERFORMANCE_INDICATORS.map(ind => (
                            <SelectItem key={ind.key} value={ind.key}>
                              <div className="flex items-center gap-2">
                                {selectedIndicators.includes(ind.key) && (
                                  <CheckCircle className="w-3 h-3 text-orange-500" />
                                )}
                                <span className={selectedIndicators.includes(ind.key) ? "font-medium text-orange-600 dark:text-orange-400" : ""}>
                                  {ind.label}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedIndicators.length > 0 && (
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] flex-shrink-0">
                        {selectedIndicators.length}
                      </Badge>
                    )}
                  </div>

                  {/* Dropdown Domaines socio-économiques */}
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <div className="flex-1">
                      <Select
                        value={selectedDomains.length === 1 ? selectedDomains[0] : (selectedDomains.length > 1 ? 'multiple' : 'all')}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            onDomainsChange([]);
                          } else if (value !== 'multiple') {
                            // Toggle single selection
                            if (selectedDomains.includes(value)) {
                              onDomainsChange(selectedDomains.filter(d => d !== value));
                            } else {
                              onDomainsChange([...selectedDomains, value]);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-9 text-sm bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-2">
                            <SelectValue placeholder="Domaines Socio-Économiques">
                              {selectedDomains.length === 0
                                ? "Tous les domaines"
                                : selectedDomains.length === 1
                                ? SOCIO_ECONOMIC_DOMAINS.find(d => d.key === selectedDomains[0])?.label
                                : `${selectedDomains.length} domaines sélectionnés`
                              }
                            </SelectValue>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <span className="font-medium">Tous les domaines</span>
                          </SelectItem>
                          {SOCIO_ECONOMIC_DOMAINS.map(dom => (
                            <SelectItem key={dom.key} value={dom.key}>
                              <div className="flex items-center gap-2">
                                {selectedDomains.includes(dom.key) && (
                                  <CheckCircle className="w-3 h-3 text-cyan-500" />
                                )}
                                <span className={selectedDomains.includes(dom.key) ? "font-medium text-cyan-600 dark:text-cyan-400" : ""}>
                                  {dom.label}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedDomains.length > 0 && (
                      <Badge className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-[10px] flex-shrink-0">
                        {selectedDomains.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

// ============================================
// ANIMATIONS DE TRANSITION
// ============================================

const viewTransitionVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      duration: 0.3
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  })
};

// ============================================
// COMPOSANT: Vue Années (3 cartes comparatives)
// ============================================

interface YearViewProps {
  availableYears: { offset: number; year: number; label: string }[];
  yearsData: Record<number, YearData>;
  currencySymbol: string;
  onYearClick: (yearOffset: number) => void;
}

const YearView = ({
  availableYears,
  yearsData,
  currencySymbol,
  onYearClick
}: YearViewProps) => {
  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toFixed(0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {availableYears.map((yearInfo, index) => {
        const data = yearsData[yearInfo.offset];
        const rate = data?.totalTarget > 0
          ? Math.round((data.totalActual / data.totalTarget) * 100)
          : 0;
        const hasData = data?.totalActual > 0;
        const variance = (data?.totalActual || 0) - (data?.totalTarget || 0);

        const getStatusColor = () => {
          if (!hasData) return 'border-slate-300 dark:border-slate-600';
          if (rate >= 95) return 'border-emerald-500';
          if (rate >= 85) return 'border-amber-500';
          return 'border-red-500';
        };

        const getStatusBg = () => {
          if (!hasData) return 'from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50';
          if (rate >= 95) return 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-950/30';
          if (rate >= 85) return 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-950/30';
          return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-950/30';
        };

        return (
          <motion.div
            key={yearInfo.offset}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card
              className={cn(
                "cursor-pointer hover:shadow-xl transition-all duration-300 border-2 overflow-hidden",
                getStatusColor()
              )}
              onClick={() => onYearClick(yearInfo.offset)}
            >
              {/* Header avec année */}
              <div className={cn(
                "px-6 py-4 bg-gradient-to-r",
                hasData
                  ? "from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800"
                  : "from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{yearInfo.year}</h3>
                    <p className="text-white/80 text-sm">N+{yearInfo.offset}</p>
                  </div>
                  <div className={cn(
                    "text-3xl font-bold",
                    hasData ? "text-white" : "text-white/50"
                  )}>
                    {hasData ? `${rate}%` : '-'}
                  </div>
                </div>
              </div>

              <CardContent className={cn("p-6 bg-gradient-to-br", getStatusBg())}>
                {/* Barre de progression */}
                <div className="mb-6">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, rate)}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        rate >= 95 ? "bg-emerald-500" :
                        rate >= 85 ? "bg-amber-500" :
                        rate > 0 ? "bg-red-500" : "bg-slate-300"
                      )}
                    />
                  </div>
                </div>

                {/* Objectif & Réalisé */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Objectif</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatAmount(data?.totalTarget || 0)} {currencySymbol}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Réalisé</p>
                    <p className={cn(
                      "text-xl font-bold",
                      hasData
                        ? rate >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                          rate >= 85 ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        : "text-slate-400"
                    )}>
                      {formatAmount(data?.totalActual || 0)} {currencySymbol}
                    </p>
                  </div>
                </div>

                {/* Écart */}
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg mb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Écart</p>
                  <p className={cn(
                    "text-lg font-bold",
                    variance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {variance >= 0 ? '+' : ''}{formatAmount(variance)} {currencySymbol}
                  </p>
                </div>

                {/* Semaines validées */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={cn(
                      "w-4 h-4",
                      (data?.lockedWeeks || 0) > 0 ? "text-emerald-500" : "text-slate-400"
                    )} />
                    <span className="text-slate-600 dark:text-slate-400">
                      {data?.lockedWeeks || 0}/{data?.totalWeeks || 52} semaines validées
                    </span>
                  </div>
                </div>

                {/* Bouton */}
                <Button
                  className="w-full mt-4 gap-2"
                  variant={hasData ? "default" : "outline"}
                >
                  {hasData ? 'Voir les détails' : 'Planifier'}
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

// ============================================
// COMPOSANT: Vue Mois (12 cartes agrégées)
// ============================================

interface MonthViewProps {
  yearData: YearData;
  currencySymbol: string;
  onMonthClick: (monthName: string) => void;
  onBackToYears: () => void;
}

const MonthView = ({
  yearData,
  currencySymbol,
  onMonthClick,
  onBackToYears
}: MonthViewProps) => {
  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toFixed(0);
  };

  return (
    <div className="space-y-4">
      {/* Header avec navigation retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToYears}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour aux années
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
            {yearData.year}
          </Badge>
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            12 mois
          </span>
        </div>
      </div>

      {/* Grille des mois */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(yearData.months).map(([monthName, monthData], index) => {
          // Calculs agrégés pour le mois
          const monthTarget = monthData.weeks.reduce((sum, w) => sum + w.target, 0);
          const monthActual = monthData.weeks.reduce((sum, w) => sum + w.actual, 0);
          const monthLocked = monthData.weeks.filter(w => w.isLocked).length;
          const rate = monthTarget > 0 ? Math.round((monthActual / monthTarget) * 100) : 0;
          const hasData = monthActual > 0;

          const getStatusColor = () => {
            if (!hasData) return 'border-slate-200 dark:border-slate-700';
            if (rate >= 95) return 'border-emerald-400 dark:border-emerald-600';
            if (rate >= 85) return 'border-amber-400 dark:border-amber-600';
            return 'border-red-400 dark:border-red-600';
          };

          const getHeaderBg = () => {
            if (!hasData) return 'from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700';
            if (rate >= 95) return 'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700';
            if (rate >= 85) return 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700';
            return 'from-red-500 to-red-600 dark:from-red-600 dark:to-red-700';
          };

          return (
            <motion.div
              key={monthName}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
            >
              <Card
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-all duration-200 border-2 overflow-hidden",
                  getStatusColor()
                )}
                onClick={() => onMonthClick(monthName)}
              >
                {/* Header du mois */}
                <div className={cn(
                  "px-4 py-3 bg-gradient-to-r flex items-center justify-between",
                  getHeaderBg()
                )}>
                  <h4 className="font-bold text-white">{monthName}</h4>
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {hasData ? `${rate}%` : '-'}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  {/* Mini barre de progression */}
                  <div className="mb-3">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, rate)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.03 }}
                        className={cn(
                          "h-full rounded-full",
                          rate >= 95 ? "bg-emerald-500" :
                          rate >= 85 ? "bg-amber-500" :
                          rate > 0 ? "bg-red-500" : "bg-slate-300"
                        )}
                      />
                    </div>
                  </div>

                  {/* Objectif & Réalisé compact */}
                  <div className="grid grid-cols-2 gap-2 text-center mb-3">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Obj.</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {formatAmount(monthTarget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Réal.</p>
                      <p className={cn(
                        "text-sm font-bold",
                        hasData
                          ? rate >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                            rate >= 85 ? "text-amber-600 dark:text-amber-400" :
                            "text-red-600 dark:text-red-400"
                          : "text-slate-400"
                      )}>
                        {formatAmount(monthActual)}
                      </p>
                    </div>
                  </div>

                  {/* Semaines validées */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <CheckCircle className={cn(
                      "w-3 h-3",
                      monthLocked > 0 ? "text-emerald-500" : "text-slate-400"
                    )} />
                    {monthLocked}/{monthData.weeks.length} sem.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT: Cellule de semaine
// ============================================

const WeekCell = ({
  week,
  isSelected,
  onClick,
  currencySymbol
}: {
  week: WeekData;
  isSelected: boolean;
  onClick: () => void;
  currencySymbol: string;
}) => {
  const getStatusColor = () => {
    // ✅ Semaine avant lancement = grisé avec pattern diagonal
    if (week.status === 'before-launch') return 'bg-slate-200/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 opacity-60';
    if (week.status === 'planned') return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    if (week.status === 'success') return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    if (week.status === 'warning') return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getPercentColor = () => {
    // ✅ Semaine avant lancement = style grisé
    if (week.status === 'before-launch') return 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400';
    if (week.status === 'planned') return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    if (week.status === 'success') return 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300';
    if (week.status === 'warning') return 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300';
    return 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300';
  };

  const percent = week.target > 0 ? Math.round((week.actual / week.target) * 100) : 0;

  // Formatage compact des montants
  const formatAmount = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toFixed(0);
  };

  // ✅ WCAG: Générer un label accessible pour les lecteurs d'écran
  const getAriaLabel = () => {
    const statusText = week.status === 'success' ? 'Objectif atteint' :
                       week.status === 'warning' ? 'En surveillance' :
                       week.status === 'critical' ? 'Critique' :
                       week.status === 'before-launch' ? 'Avant lancement' :
                       'Planifié';
    const lockText = week.isLocked ? ', verrouillée' : ', non verrouillée';
    const currentText = week.isCurrentWeek ? ' (semaine en cours)' : '';
    return `Semaine ${week.globalWeekNumber}, du ${week.startDate} au ${week.endDate}. ${statusText}${lockText}. Performance: ${percent}%${currentText}`;
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={getAriaLabel()}
      aria-pressed={isSelected}
      className={cn(
        "group flex flex-col p-3 rounded-lg border transition-all cursor-pointer w-full relative",
        getStatusColor(),
        isSelected && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900",
        // ✅ Style spécial pour la semaine courante (dernière complétée avec données)
        week.isCurrentWeek && "ring-2 ring-orange-500 dark:ring-orange-400 border-orange-400 dark:border-orange-500 shadow-md shadow-orange-200 dark:shadow-orange-900/30"
      )}
    >
      {/* ✅ Badge "En cours" pour la semaine courante */}
      {week.isCurrentWeek && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
          En cours
        </div>
      )}
      {/* Ligne 1: Date + Verrouillage + Pourcentage */}
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
          <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300" title={`Semaine du ${week.startDate} au ${week.endDate}`}>
            {week.startDate} → {week.endDate}
          </p>
        </div>

        {/* Badge de pourcentage */}
        <div className={cn(
          "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
          getPercentColor()
        )}>
          {percent}%
        </div>
      </div>

      {/* Ligne 2: Objectif + Réalisé */}
      <div className="flex items-center justify-between w-full gap-2 mb-2">
        {/* Objectif */}
        <div className="flex-1 text-left">
          <p className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-medium">Obj.</p>
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {formatAmount(week.target)} {currencySymbol}
          </p>
        </div>

        {/* Séparateur */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-600" />

        {/* Réalisé */}
        <div className="flex-1 text-right">
          <p className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-medium">Réal.</p>
          {week.hasRealData ? (
            <p className={cn(
              "text-[10px] font-bold",
              week.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
              week.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
              week.status === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
            )}>
              {formatAmount(week.actual)} {currencySymbol}
            </p>
          ) : (
            <p className="text-[8px] text-slate-400 dark:text-slate-500 italic leading-tight">
              Pas de résultat
            </p>
          )}
        </div>
      </div>

      {/* Ligne 3: Barre de progression */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            week.status === 'success' ? 'bg-emerald-500' :
            week.status === 'warning' ? 'bg-amber-500' :
            week.status === 'critical' ? 'bg-red-500' : 'bg-slate-400'
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </motion.button>
  );
};

// ============================================
// COMPOSANT: Panel de détail (slide-in)
// ============================================

const WeekDetailPanel = ({
  weekData,
  month,
  year,
  yearLabel,
  currencySymbol,
  onClose,
  onToggleLock
}: {
  weekData: WeekData | null;
  month: string;
  year: number;
  yearLabel: string;
  currencySymbol: string;
  onClose: () => void;
  onToggleLock: () => void;
}) => {
  if (!weekData) return null;

  const percent = weekData.target > 0 ? Math.round((weekData.actual / weekData.target) * 100) : 0;

  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toFixed(0);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Rapport Hebdomadaire
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {month} {year} ({yearLabel}) - Sem. du {weekData.startDate} au {weekData.endDate}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le panneau de détail hebdomadaire">
          <X className="w-5 h-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Section Statut */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              weekData.isLocked
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            )}>
              {weekData.isLocked ? <Lock className="w-5 h-5" aria-hidden="true" /> : <Unlock className="w-5 h-5" aria-hidden="true" />}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Statut Période</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {weekData.isLocked ? 'Verrouillée (Planification Bloquée)' : 'Ouverte (Modifications possibles)'}
              </p>
            </div>
          </div>
          <Button
            onClick={onToggleLock}
            size="sm"
            variant={weekData.isLocked ? "outline" : "default"}
            className={cn(
              weekData.isLocked
                ? ""
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            {weekData.isLocked ? 'Débloquer' : 'Bloquer & Valider'}
          </Button>
        </div>

        {/* Comparaison Objectif vs Réalisé */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">
              Objectif Cible
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatAmount(weekData.target)} {currencySymbol}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-xl border",
            !weekData.hasRealData
              ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              : weekData.status === 'success'
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
              : weekData.status === 'warning'
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
          )}>
            <p className={cn(
              "text-xs font-bold uppercase mb-1",
              !weekData.hasRealData ? "text-slate-500 dark:text-slate-400" :
              weekData.status === 'success' ? "text-emerald-600 dark:text-emerald-400" :
              weekData.status === 'warning' ? "text-amber-600 dark:text-amber-400" :
              "text-red-600 dark:text-red-400"
            )}>
              Réalisé
            </p>
            {weekData.hasRealData ? (
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {formatAmount(weekData.actual)} {currencySymbol}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                Pas de résultats pour le moment
              </p>
            )}
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Taux de réalisation
            </span>
            <span className={cn(
              "text-sm font-bold",
              percent >= THRESHOLDS.SUCCESS ? "text-emerald-600" :
              percent >= THRESHOLDS.WARNING ? "text-amber-600" :
              "text-red-600"
            )}>
              {percent}%
            </span>
          </div>
          <ProgressBar
            current={weekData.actual}
            max={weekData.target}
            colorClass={
              percent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
              percent >= THRESHOLDS.WARNING ? "bg-amber-500" :
              "bg-red-500"
            }
            size="lg"
          />
        </div>

        {/* Analyse graphique simplifiée */}
        <div>
          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm">
            Analyse de Performance
          </h4>
          <div className="relative h-40 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 p-4 flex items-end justify-around">
            {/* Barre Objectif */}
            <div className="flex flex-col items-center group">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                {formatAmount(weekData.target)} {currencySymbol}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '80%' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-12 bg-indigo-400 dark:bg-indigo-500 rounded-t-lg"
              />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">Objectif</p>
            </div>

            {/* Barre Réalisé */}
            <div className="flex flex-col items-center group">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                {weekData.hasRealData ? `${formatAmount(weekData.actual)} ${currencySymbol}` : '-'}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: weekData.hasRealData ? `${Math.min(100, percent) * 0.8}%` : '0%' }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(
                  "w-12 rounded-t-lg",
                  !weekData.hasRealData ? "bg-slate-300 dark:bg-slate-600" :
                  percent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
                  percent >= THRESHOLDS.WARNING ? "bg-amber-500" :
                  "bg-red-500"
                )}
              />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">Réalisé</p>
            </div>
          </div>
        </div>

        {/* Ventilation par indicateur */}
        {weekData.indicators && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm">
              Ventilation par Indicateur
            </h4>
            <div className="space-y-3">
              {INDICATOR_CONFIGS.map(ind => {
                const data = weekData.indicators?.[ind.key as keyof typeof weekData.indicators];
                if (!data) return null;

                const indPercent = data.target > 0 ? Math.round((data.actual / data.target) * 100) : 0;
                const IconComponent = ind.icon;

                const styles = INDICATOR_STYLES[ind.color];
                return (
                  <div
                    key={ind.key}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg"
                  >
                    <div className={cn("p-1.5 rounded-lg", styles.bg)}>
                      <IconComponent className={cn("w-4 h-4", styles.text)} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {ind.label}
                        </span>
                        {weekData.hasRealData ? (
                          <span className={cn(
                            "text-xs font-bold",
                            indPercent >= THRESHOLDS.SUCCESS ? "text-emerald-600" :
                            indPercent >= THRESHOLDS.WARNING ? "text-amber-600" :
                            "text-red-600"
                          )}>
                            {indPercent}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">-</span>
                        )}
                      </div>
                      <ProgressBar
                        current={weekData.hasRealData ? data.actual : 0}
                        max={data.target}
                        colorClass={
                          !weekData.hasRealData ? "bg-slate-300" :
                          indPercent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
                          indPercent >= THRESHOLDS.WARNING ? "bg-amber-500" :
                          "bg-red-500"
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ✅ NOUVEAU: Ventilation par Ligne d'Activité */}
        {weekData.byBusinessLine && weekData.byBusinessLine.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              Ventilation par Ligne d'Activité
            </h4>
            <div className="space-y-3">
              {weekData.byBusinessLine.map((line, idx) => {
                const linePercent = line.target > 0 ? Math.round((line.actual / line.target) * 100) : 0;

                return (
                  <div
                    key={line.lineId || idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {line.lineName}
                      </span>
                      {weekData.hasRealData ? (
                        <span className={cn(
                          "text-xs font-bold",
                          linePercent >= THRESHOLDS.SUCCESS ? "text-emerald-600" :
                          linePercent >= THRESHOLDS.WARNING ? "text-amber-600" :
                          "text-red-600"
                        )}>
                          {linePercent}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pas de résultats</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-slate-500">OBJ: </span>
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {formatAmount(line.target)} {currencySymbol}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">RÉAL: </span>
                        {weekData.hasRealData ? (
                          <span className={cn(
                            "font-medium",
                            linePercent >= THRESHOLDS.SUCCESS ? "text-emerald-600" :
                            linePercent >= THRESHOLDS.WARNING ? "text-amber-600" :
                            "text-red-600"
                          )}>
                            {formatAmount(line.actual)} {currencySymbol}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </div>
                    </div>
                    <ProgressBar
                      current={weekData.hasRealData ? line.actual : 0}
                      max={line.target}
                      colorClass={
                        !weekData.hasRealData ? "bg-slate-300" :
                        linePercent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
                        linePercent >= THRESHOLDS.WARNING ? "bg-amber-500" :
                        "bg-red-500"
                      }
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" className="w-full gap-2">
            <FileText className="w-4 h-4" aria-hidden="true" />
            Télécharger le Rapport Complet (PDF)
          </Button>

          {!weekData.isLocked && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Les données de cette semaine sont encore modifiables via le module HCM COST SAVINGS.
                Bloquez la période pour figer les résultats.
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// COMPOSANT: Panel de détail Mensuel (slide-in)
// ============================================

interface MonthDetailData {
  monthName: string;
  year: number;
  yearLabel: string;
  totalTarget: number;
  totalActual: number;
  lockedWeeks: number;
  totalWeeks: number;
  weeks: WeekData[];
  indicators?: {
    abs: { target: number; actual: number };
    qd: { target: number; actual: number };
    oa: { target: number; actual: number };
    ddp: { target: number; actual: number };
    ekh: { target: number; actual: number };
  };
}

const MonthDetailPanel = ({
  monthData,
  currencySymbol,
  onClose,
  onViewWeeks
}: {
  monthData: MonthDetailData | null;
  currencySymbol: string;
  onClose: () => void;
  onViewWeeks: () => void;
}) => {
  if (!monthData) return null;

  const percent = monthData.totalTarget > 0
    ? Math.round((monthData.totalActual / monthData.totalTarget) * 100)
    : 0;
  const variance = monthData.totalActual - monthData.totalTarget;

  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toFixed(0);
  };

  const getStatusColor = () => {
    if (percent >= THRESHOLDS.SUCCESS) return 'emerald';
    if (percent >= THRESHOLDS.WARNING) return 'amber';
    return 'red';
  };

  const statusColor = getStatusColor();

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500 to-purple-600 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white">
            Rapport Mensuel
          </h3>
          <p className="text-white/80 text-sm">
            {monthData.monthName} {monthData.year} ({monthData.yearLabel})
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20" aria-label="Fermer le panneau de détail mensuel">
          <X className="w-5 h-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Section Statut global */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              monthData.lockedWeeks === monthData.totalWeeks
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : monthData.lockedWeeks > 0
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400"
            )}>
              {monthData.lockedWeeks === monthData.totalWeeks ? <Lock className="w-5 h-5" aria-hidden="true" /> : <Unlock className="w-5 h-5" aria-hidden="true" />}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Statut du Mois</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {monthData.lockedWeeks}/{monthData.totalWeeks} semaines verrouillées
              </p>
            </div>
          </div>
          <Badge className={cn(
            monthData.lockedWeeks === monthData.totalWeeks
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          )}>
            {Math.round((monthData.lockedWeeks / monthData.totalWeeks) * 100)}% validé
          </Badge>
        </div>

        {/* Comparaison Objectif vs Réalisé */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">
              Objectif Mensuel
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatAmount(monthData.totalTarget)} {currencySymbol}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-xl border",
            statusColor === 'emerald'
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
              : statusColor === 'amber'
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
          )}>
            <p className={cn(
              "text-xs font-bold uppercase mb-1",
              statusColor === 'emerald' ? "text-emerald-600 dark:text-emerald-400" :
              statusColor === 'amber' ? "text-amber-600 dark:text-amber-400" :
              "text-red-600 dark:text-red-400"
            )}>
              Réalisé
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatAmount(monthData.totalActual)} {currencySymbol}
            </p>
          </div>
        </div>

        {/* Écart */}
        <div className={cn(
          "p-4 rounded-xl border",
          variance >= 0
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Écart</p>
              <p className={cn(
                "text-xl font-bold",
                variance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {variance >= 0 ? '+' : ''}{formatAmount(variance)} {currencySymbol}
              </p>
            </div>
            <div className={cn(
              "p-2 rounded-full",
              variance >= 0 ? "bg-emerald-100 dark:bg-emerald-800" : "bg-red-100 dark:bg-red-800"
            )}>
              {variance >= 0 ? (
                <TrendingUp className={cn("w-5 h-5", variance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")} aria-hidden="true" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Taux de réalisation mensuel
            </span>
            <span className={cn(
              "text-sm font-bold",
              percent >= THRESHOLDS.SUCCESS ? "text-emerald-600" :
              percent >= THRESHOLDS.WARNING ? "text-amber-600" :
              "text-red-600"
            )}>
              {percent}%
            </span>
          </div>
          <ProgressBar
            current={monthData.totalActual}
            max={monthData.totalTarget}
            colorClass={
              percent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
              percent >= THRESHOLDS.WARNING ? "bg-amber-500" :
              "bg-red-500"
            }
            size="lg"
          />
        </div>

        {/* Aperçu des semaines du mois */}
        <div>
          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm">
            Aperçu des {monthData.totalWeeks} semaines
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {monthData.weeks.slice(0, 4).map((week, idx) => {
              const weekPercent = week.target > 0 ? Math.round((week.actual / week.target) * 100) : 0;
              return (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Sem. {week.weekNumber}
                    </span>
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold",
                      week.isLocked
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      {week.isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-bold",
                      !week.hasRealData ? "text-slate-400" :
                      weekPercent >= 95 ? "text-emerald-600" :
                      weekPercent >= 85 ? "text-amber-600" :
                      weekPercent > 0 ? "text-red-600" : "text-slate-400"
                    )}>
                      {week.hasRealData ? `${weekPercent}%` : '-'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {week.hasRealData ? formatAmount(week.actual) : '-'}/{formatAmount(week.target)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {monthData.weeks.length > 4 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              +{monthData.weeks.length - 4} semaine(s) supplémentaire(s)
            </p>
          )}
        </div>

        {/* Ventilation par indicateur (si disponible) */}
        {monthData.indicators && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm">
              Ventilation par Indicateur
            </h4>
            <div className="space-y-3">
              {INDICATOR_CONFIGS.map(ind => {
                const data = monthData.indicators?.[ind.key as keyof typeof monthData.indicators];
                if (!data) return null;

                const indPercent = data.target > 0 ? Math.round((data.actual / data.target) * 100) : 0;
                const IconComponent = ind.icon;
                const styles = INDICATOR_STYLES[ind.color];

                return (
                  <div key={ind.key} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className={cn("p-2 rounded-lg", styles.bg)}>
                      <IconComponent className={cn("w-4 h-4", styles.text)} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{ind.label}</span>
                        <span className={cn(
                          "text-xs font-bold",
                          indPercent >= 95 ? "text-emerald-600" :
                          indPercent >= 85 ? "text-amber-600" :
                          "text-red-600"
                        )}>
                          {indPercent}%
                        </span>
                      </div>
                      <ProgressBar
                        current={data.actual}
                        max={data.target}
                        colorClass={
                          indPercent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
                          indPercent >= THRESHOLDS.WARNING ? "bg-amber-500" :
                          "bg-red-500"
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onViewWeeks} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Voir les semaines de {monthData.monthName}
          </Button>
          <Button variant="outline" className="w-full gap-2">
            <FileText className="w-4 h-4" aria-hidden="true" />
            Télécharger le Rapport Mensuel (PDF)
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// COMPOSANT: Panel de détail Annuel (slide-in)
// ============================================

interface YearDetailData {
  year: number;
  yearOffset: number;
  yearLabel: string;
  totalTarget: number;
  totalActual: number;
  lockedWeeks: number;
  totalWeeks: number;
  monthsData: { name: string; target: number; actual: number; locked: number; total: number }[];
  indicators?: {
    abs: { target: number; actual: number };
    qd: { target: number; actual: number };
    oa: { target: number; actual: number };
    ddp: { target: number; actual: number };
    ekh: { target: number; actual: number };
  };
}

const YearDetailPanel = ({
  yearData,
  currencySymbol,
  onClose,
  onViewMonths,
  grandTotals
}: {
  yearData: YearDetailData | null;
  currencySymbol: string;
  onClose: () => void;
  onViewMonths: () => void;
  grandTotals?: GrandTotals | null;
}) => {
  if (!yearData) return null;

  const percent = yearData.totalTarget > 0
    ? Math.round((yearData.totalActual / yearData.totalTarget) * 100)
    : 0;
  const variance = yearData.totalActual - yearData.totalTarget;

  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toFixed(0);
  };

  const getStatusColor = () => {
    if (percent >= THRESHOLDS.SUCCESS) return 'emerald';
    if (percent >= THRESHOLDS.WARNING) return 'amber';
    return 'red';
  };

  const statusColor = getStatusColor();

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600 to-teal-600 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white">
            Rapport Annuel
          </h3>
          <p className="text-white/80 text-sm">
            Année {yearData.year} (N+{yearData.yearOffset})
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20" aria-label="Fermer le panneau de détail annuel">
          <X className="w-5 h-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Section Statut global */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              yearData.lockedWeeks === yearData.totalWeeks
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : yearData.lockedWeeks > 0
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400"
            )}>
              {yearData.lockedWeeks === yearData.totalWeeks ? <Lock className="w-5 h-5" aria-hidden="true" /> : <Unlock className="w-5 h-5" aria-hidden="true" />}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Statut Annuel</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {yearData.lockedWeeks}/{yearData.totalWeeks} semaines verrouillées
              </p>
            </div>
          </div>
          <Badge className={cn(
            yearData.lockedWeeks === yearData.totalWeeks
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          )}>
            {Math.round((yearData.lockedWeeks / yearData.totalWeeks) * 100)}% validé
          </Badge>
        </div>

        {/* Comparaison Objectif vs Réalisé */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">
              Objectif Annuel
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatAmount(yearData.totalTarget)} {currencySymbol}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-xl border",
            statusColor === 'emerald'
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
              : statusColor === 'amber'
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
          )}>
            <p className={cn(
              "text-xs font-bold uppercase mb-1",
              statusColor === 'emerald' ? "text-emerald-600 dark:text-emerald-400" :
              statusColor === 'amber' ? "text-amber-600 dark:text-amber-400" :
              "text-red-600 dark:text-red-400"
            )}>
              Réalisé
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatAmount(yearData.totalActual)} {currencySymbol}
            </p>
          </div>
        </div>

        {/* Écart */}
        <div className={cn(
          "p-4 rounded-xl border",
          variance >= 0
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Écart Annuel</p>
              <p className={cn(
                "text-xl font-bold",
                variance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {variance >= 0 ? '+' : ''}{formatAmount(variance)} {currencySymbol}
              </p>
            </div>
            <div className={cn(
              "p-2 rounded-full",
              variance >= 0 ? "bg-emerald-100 dark:bg-emerald-800" : "bg-red-100 dark:bg-red-800"
            )}>
              {variance >= 0 ? (
                <TrendingUp className={cn("w-5 h-5", variance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")} aria-hidden="true" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Taux de réalisation annuel
            </span>
            <span className={cn(
              "text-sm font-bold",
              percent >= THRESHOLDS.SUCCESS ? "text-emerald-600" :
              percent >= THRESHOLDS.WARNING ? "text-amber-600" :
              "text-red-600"
            )}>
              {percent}%
            </span>
          </div>
          <ProgressBar
            current={yearData.totalActual}
            max={yearData.totalTarget}
            colorClass={
              percent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
              percent >= THRESHOLDS.WARNING ? "bg-amber-500" :
              "bg-red-500"
            }
            size="lg"
          />
        </div>

        {/* Aperçu des 12 mois */}
        <div>
          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm">
            Performance par Mois
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {yearData.monthsData.slice(0, 12).map((month, idx) => {
              const monthPercent = month.target > 0 ? Math.round((month.actual / month.target) * 100) : 0;
              const hasData = month.actual > 0;
              return (
                <div key={idx} className={cn(
                  "p-2 rounded-lg border text-center",
                  hasData
                    ? monthPercent >= 95
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                      : monthPercent >= 85
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                )}>
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {month.name.slice(0, 3)}
                  </p>
                  <p className={cn(
                    "text-xs font-bold",
                    hasData
                      ? monthPercent >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                        monthPercent >= 85 ? "text-amber-600 dark:text-amber-400" :
                        "text-red-600 dark:text-red-400"
                      : "text-slate-400"
                  )}>
                    {hasData ? `${monthPercent}%` : '-'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ventilation par indicateur (si disponible) */}
        {yearData.indicators && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm">
              Ventilation par Indicateur
            </h4>
            <div className="space-y-3">
              {INDICATOR_CONFIGS.map(ind => {
                const data = yearData.indicators?.[ind.key as keyof typeof yearData.indicators];
                if (!data) return null;

                const indPercent = data.target > 0 ? Math.round((data.actual / data.target) * 100) : 0;
                const IconComponent = ind.icon;
                const styles = INDICATOR_STYLES[ind.color];

                return (
                  <div key={ind.key} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className={cn("p-2 rounded-lg", styles.bg)}>
                      <IconComponent className={cn("w-4 h-4", styles.text)} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{ind.label}</span>
                        <span className={cn(
                          "text-xs font-bold",
                          indPercent >= 95 ? "text-emerald-600" :
                          indPercent >= 85 ? "text-amber-600" :
                          "text-red-600"
                        )}>
                          {indPercent}%
                        </span>
                      </div>
                      <ProgressBar
                        current={data.actual}
                        max={data.target}
                        colorClass={
                          indPercent >= THRESHOLDS.SUCCESS ? "bg-emerald-500" :
                          indPercent >= THRESHOLDS.WARNING ? "bg-amber-500" :
                          "bg-red-500"
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ✅ Validation Ratio 33%/67% Prime/Trésorerie */}
        {grandTotals && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm">
              Répartition Prime / Trésorerie
            </h4>
            <RatioValidationBadge
              economiesRealisees={grandTotals.grandTotalEco * 1000}
              realPrime={grandTotals.grandTotalRealPrime * 1000}
              realTreso={grandTotals.grandTotalRealTreso * 1000}
              showDetails={true}
            />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onViewMonths} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Voir les 12 mois de {yearData.year}
          </Button>
          <Button variant="outline" className="w-full gap-2">
            <FileText className="w-4 h-4" aria-hidden="true" />
            Télécharger le Rapport Annuel (PDF)
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function PerformanceCalendarPage() {
  const navigate = useNavigate();
  const { company: currentCompany } = useCompany();

  // ============================================
  // ✅ TRANSFERT DONNÉES: Hook PerformanceData pour OBJ/RÉAL
  // Source: PerformanceRecapPage (RÉAL) + Page17GlobalReporting (OBJ)
  // ============================================
  const {
    financialParams,
    getGlobalStats,
    getTotals,
    selectedCurrency: contextCurrency,
    loading: contextLoading
  } = usePerformanceData();

  // ============================================
  // ✅ TRANSFERT DONNÉES: Hook Context GLOBAL pour grandTotals
  // Source: PerformanceRecapPage bloc "TOTAL GÉNÉRAL - Répartition des Performances"
  // - grandTotals.grandTotalPPR = OBJ (68,612 k¥)
  // - grandTotals.grandTotalEco = RÉAL (58,899 k¥)
  // Ces valeurs sont les VRAIES valeurs du bloc "TOTAL GÉNÉRAL" ≠ getGlobalStats()
  // ============================================
  const {
    grandTotals,
    indicatorsPerformance,
    isDataLoaded: globalDataLoaded
  } = useGlobalPerformanceData();

  // États de base
  // ✅ N+1 par défaut (pas de N, uniquement N+1, N+2, N+3 comme le Widget Smart Calendar)
  const [selectedYearOffset, setSelectedYearOffset] = useState(1); // 1=N+1, 2=N+2, 3=N+3
  const [selectedWeekData, setSelectedWeekData] = useState<{
    week: WeekData;
    month: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockedPeriods, setLockedPeriods] = useState<Record<string, boolean>>({});

  // Date de lancement depuis le Widget Smart Calendar
  const [launchDate, setLaunchDate] = useState<Date | null>(null);

  // États des filtres
  const [viewMode, setViewMode] = useState<ViewMode>('weeks');
  const [selectedBusinessLine, setSelectedBusinessLine] = useState<string>('all');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  // États pour la navigation entre vues
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [viewDirection, setViewDirection] = useState(0); // -1 = back, 1 = forward

  // États pour les panneaux de détail (slide-in)
  const [selectedMonthData, setSelectedMonthData] = useState<MonthDetailData | null>(null);
  const [selectedYearData, setSelectedYearData] = useState<YearDetailData | null>(null);

  // Années réelles calculées depuis la date de lancement du Widget Smart Calendar
  const baseYear = useMemo(() => {
    if (launchDate) {
      return launchDate.getFullYear();
    }
    // Fallback: année actuelle si pas de date de lancement configurée
    return new Date().getFullYear();
  }, [launchDate]);

  // ✅ Années disponibles: N+1, N+2, N+3 (pas de N !)
  // L'année fiscale N+X affiche l'année: baseYear + (X - 1)
  // Exemple: baseYear=2025, N+1 → 2025, N+2 → 2026, N+3 → 2027
  const availableYears = useMemo(() => [
    { offset: 1, year: baseYear, label: `N+1 (${baseYear})` },           // N+1 = année de lancement
    { offset: 2, year: baseYear + 1, label: `N+2 (${baseYear + 1})` },
    { offset: 3, year: baseYear + 2, label: `N+3 (${baseYear + 2})` }
  ], [baseYear]);

  // Lignes d'activité - chargées depuis la base de données
  const [businessLines, setBusinessLines] = useState<{ id: string; name: string }[]>([
    { id: 'all', name: 'Toutes les lignes' }
  ]);

  // Devise - chargée depuis company_performance_scores.factors.selectedCurrency
  // (même source que HCM PERFORMANCE PLAN et HCM COST SAVINGS pour cohérence)
  const [currency, setCurrency] = useState<Currency>('EUR');
  const currencyConfig = CURRENCY_CONFIG[currency];

  // ============================================
  // OBJECTIFS PPR (Potentiel de Performance Réalisable)
  // Source: PerformanceDataContext.getGlobalStats().totalPPR
  // ============================================
  const [pprSettings, setPprSettings] = useState<{
    abs: number;
    qd: number;
    oa: number;
    ddp: number;
    ekh: number;
    total: number;
  }>({
    abs: 0,
    qd: 0,
    oa: 0,
    ddp: 0,
    ekh: 0,
    total: 0
  });

  // ============================================
  // RÉAL - Économies Réalisées (Performance)
  // Source: PerformanceDataContext.getGlobalStats().totalEconomies
  // ============================================
  const [realSettings, setRealSettings] = useState<{
    abs: number;
    qd: number;
    oa: number;
    ddp: number;
    ekh: number;
    total: number;
  }>({
    abs: 0,
    qd: 0,
    oa: 0,
    ddp: 0,
    ekh: 0,
    total: 0
  });

  // ============================================
  // DERNIÈRE SEMAINE COMPLÉTÉE (Smart Calendar)
  // ============================================
  const [lastCompletedWeek, setLastCompletedWeek] = useState<LastCompletedWeekResult | null>(null);

  // ============================================
  // DONNÉES RÉELLES DEPUIS MODULE3_COST_ENTRIES
  // ============================================

  // Structure pour stocker les coûts agrégés par semaine
  interface WeeklyCostEntry {
    year: number;
    weekNumber: number;
    periodStart: string;
    periodEnd: string;
    kpiType: string; // 'abs', 'qd', 'oa', 'ddp', 'ekh'
    totalAmount: number;
    entryCount: number;
  }

  const [costEntries, setCostEntries] = useState<WeeklyCostEntry[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fonction pour charger les données réelles depuis module3_cost_entries
  const loadCostEntries = useCallback(async () => {
    if (!currentCompany?.id) return;

    try {
      // [DEBUG] console.log('[PerformanceCalendar] 📥 Chargement des données de coûts...');

      const { data, error } = await supabase
        .from('module3_cost_entries')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('period_start', { ascending: true });

      if (error) {
        console.error('[PerformanceCalendar] ❌ Erreur chargement coûts:', error);
        return;
      }

      if (data && data.length > 0) {
        // Agréger les données par semaine et par KPI
        const aggregated: WeeklyCostEntry[] = [];
        const groupedByWeek: Record<string, Record<string, { amount: number; count: number; entry: CostEntryDB }>> = {};

        (data as CostEntryDB[]).forEach((entry) => {
          const periodStart = new Date(entry.period_start);
          const year = periodStart.getFullYear();
          // Calculer le numéro de semaine ISO
          const startOfYear = new Date(year, 0, 1);
          const days = Math.floor((periodStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

          const weekKey = `${year}-W${weekNumber}`;
          const kpiType = entry.kpi_type || 'unknown';

          if (!groupedByWeek[weekKey]) {
            groupedByWeek[weekKey] = {};
          }

          if (!groupedByWeek[weekKey][kpiType]) {
            groupedByWeek[weekKey][kpiType] = { amount: 0, count: 0, entry };
          }

          groupedByWeek[weekKey][kpiType].amount += entry.total_amount || 0;
          groupedByWeek[weekKey][kpiType].count += 1;
        });

        // Convertir en tableau
        Object.entries(groupedByWeek).forEach(([weekKey, kpis]) => {
          const [yearStr, weekStr] = weekKey.split('-W');
          const year = parseInt(yearStr);
          const weekNumber = parseInt(weekStr);

          Object.entries(kpis).forEach(([kpiType, { amount, count, entry }]) => {
            // ✅ FIX: Normaliser les dates au format YYYY-MM-DD pour matching cohérent
            // Les dates de la DB peuvent avoir un format "2025-12-01T00:00:00.000Z"
            // Le calendrier fiscal génère "2025-12-01"
            const normalizedPeriodStart = entry.period_start?.split('T')[0] || entry.period_start;
            const normalizedPeriodEnd = entry.period_end?.split('T')[0] || entry.period_end;

            aggregated.push({
              year,
              weekNumber,
              periodStart: normalizedPeriodStart,
              periodEnd: normalizedPeriodEnd,
              kpiType,
              totalAmount: amount,
              entryCount: count
            });
          });
        });

        setCostEntries(aggregated);
        // [DEBUG] console.log('[PerformanceCalendar] ✅ Données de coûts chargées:', aggregated.length, 'entrées agrégées');

        // Debug: Afficher les périodes disponibles pour vérifier le format
        if (aggregated.length > 0) {
          const uniquePeriods = [...new Set(aggregated.map(e => `${e.periodStart} → ${e.periodEnd}`))];
          // [DEBUG] console.log('[PerformanceCalendar] 📅 Périodes disponibles:', uniquePeriods.slice(0, 5));
        }
      } else {
        setCostEntries([]);
        // [DEBUG] console.log('[PerformanceCalendar] ℹ️ Aucune donnée de coûts trouvée');
      }
    } catch (err) {
      console.error('[PerformanceCalendar] ❌ Exception chargement coûts:', err);
    }
  }, [currentCompany?.id]);

  // ============================================
  // ✅ TRANSFERT DONNÉES OBJ/RÉAL: Depuis Context GLOBAL (grandTotals)
  // Source: PerformanceRecapPage bloc "TOTAL GÉNÉRAL - Répartition des Performances"
  // - grandTotals.grandTotalPPR = OBJ (68,612 k¥) - PPR Prévues hebdo
  // - grandTotals.grandTotalEco = RÉAL (58,899 k¥) - Total Économies réalisées
  // Règle LELE HCM: TRANSFERT de données DIRECT, pas de nouveau calcul
  // ============================================
  useEffect(() => {
    // Attendre que le context soit chargé
    if (contextLoading) {
      // [DEBUG] console.log('[PerformanceCalendar] ⏳ En attente du chargement du context...');
      return;
    }

    // ✅ TRANSFERT DIRECT: Utiliser grandTotals du contexte GLOBAL
    // Ces valeurs proviennent du bloc "TOTAL GÉNÉRAL" de PerformanceRecapPage
    // et sont DIFFÉRENTES de getGlobalStats() qui retourne des calculs intermédiaires
    const objFromGrandTotals = grandTotals?.grandTotalPPR || 0;
    const realFromGrandTotals = grandTotals?.grandTotalEco || 0;

    const globalStats = getGlobalStats();

    // ✅ OBJ HEBDOMADAIRE: Depuis grandTotals (PRIORITÉ)
    // IMPORTANT: grandTotalPPR est DÉJÀ la valeur de la SEMAINE DE LANCEMENT
    // C'est le résultat du bloc "TOTAL GÉNÉRAL" = performances de la semaine
    // Les valeurs sont en k¥, multiplier par 1000 pour obtenir les ¥
    // PAS DE DIVISION PAR 52 - ce sont déjà des valeurs hebdomadaires !
    let objHebdo = objFromGrandTotals * 1000;

    // Fallback si grandTotals n'a pas de données
    if (objHebdo < 1000) {
      // Essayer getGlobalStats() comme fallback (aussi en k¥ hebdo)
      objHebdo = (globalStats.totalPPR || 0) * 1000;

      if (objHebdo < 1000) {
        // Dernier recours: financialParams (attention: ceux-ci peuvent être annuels)
        const pprRef = financialParams?.pprAnnuelReference || 0;
        const gainsN1 = financialParams?.gainsN1 || 0;

        if (pprRef > objHebdo) {
          // pprAnnuelReference est ANNUEL, diviser par 52
          objHebdo = pprRef / 52;
          // [DEBUG] console.log('[PerformanceCalendar] 📊 Fallback: pprAnnuelReference (annuel):', pprRef);
        } else if (gainsN1 > objHebdo) {
          // gainsN1 est ANNUEL, diviser par 52
          objHebdo = gainsN1 / 52;
          // [DEBUG] console.log('[PerformanceCalendar] 📊 Fallback: gainsN1 (annuel):', gainsN1);
        }
      } else {
        // [DEBUG] console.log('[PerformanceCalendar] 📊 Fallback: getGlobalStats().totalPPR');
      }
    }

    // Ventilation par indicateur depuis indicatorsPerformance (contexte GLOBAL)
    // Ces valeurs sont AUSSI des valeurs hebdomadaires (pas de division par 52)
    const hasIndicatorPerformance = indicatorsPerformance && indicatorsPerformance.length > 0 &&
      indicatorsPerformance.some(ind => ind.pprPrevues > 0);

    const equalShare = objHebdo / 5;

    const ppr = {
      abs: hasIndicatorPerformance
        ? (indicatorsPerformance.find(i => i.key === 'abs')?.pprPrevues || 0) * 1000
        : equalShare,
      qd: hasIndicatorPerformance
        ? (indicatorsPerformance.find(i => i.key === 'qd')?.pprPrevues || 0) * 1000
        : equalShare,
      oa: hasIndicatorPerformance
        ? (indicatorsPerformance.find(i => i.key === 'oa')?.pprPrevues || 0) * 1000
        : equalShare,
      ddp: hasIndicatorPerformance
        ? (indicatorsPerformance.find(i => i.key === 'ddp')?.pprPrevues || 0) * 1000
        : equalShare,
      ekh: hasIndicatorPerformance
        ? (indicatorsPerformance.find(i => i.key === 'ekh')?.pprPrevues || 0) * 1000
        : equalShare,
      total: objHebdo
    };

    setPprSettings(ppr);

    // ✅ TRANSFERT RÉAL: Depuis grandTotals.grandTotalEco
    // IMPORTANT: grandTotalEco est DÉJÀ la valeur de la SEMAINE DE LANCEMENT
    // C'est le "Total Économies" du bloc "TOTAL GÉNÉRAL" = économies de la semaine
    // PAS DE DIVISION PAR 52 !
    let realHebdo = realFromGrandTotals * 1000;

    // Fallback si grandTotals n'a pas de données RÉAL
    if (realHebdo < 1000) {
      // Essayer getGlobalStats() comme fallback (aussi en k¥ hebdo)
      realHebdo = (globalStats.totalEconomies || 0) * 1000;
      // [DEBUG] console.log('[PerformanceCalendar] 📊 Fallback RÉAL: getGlobalStats().totalEconomies');
    }

    // RÉAL par indicateur depuis indicatorsPerformance (contexte GLOBAL)
    // Ces valeurs sont AUSSI des valeurs hebdomadaires (pas de division par 52)
    const hasRealByIndicator = indicatorsPerformance && indicatorsPerformance.length > 0 &&
      indicatorsPerformance.some(ind => ind.totalEconomies > 0);

    const equalShareReal = realHebdo / 5;

    const real = {
      abs: hasRealByIndicator
        ? (indicatorsPerformance.find(i => i.key === 'abs')?.totalEconomies || 0) * 1000
        : equalShareReal,
      qd: hasRealByIndicator
        ? (indicatorsPerformance.find(i => i.key === 'qd')?.totalEconomies || 0) * 1000
        : equalShareReal,
      oa: hasRealByIndicator
        ? (indicatorsPerformance.find(i => i.key === 'oa')?.totalEconomies || 0) * 1000
        : equalShareReal,
      ddp: hasRealByIndicator
        ? (indicatorsPerformance.find(i => i.key === 'ddp')?.totalEconomies || 0) * 1000
        : equalShareReal,
      ekh: hasRealByIndicator
        ? (indicatorsPerformance.find(i => i.key === 'ekh')?.totalEconomies || 0) * 1000
        : equalShareReal,
      total: realHebdo
    };

    setRealSettings(real);
  }, [contextLoading, grandTotals, indicatorsPerformance, getGlobalStats, financialParams]);

  // Synchroniser la devise depuis le context
  useEffect(() => {
    if (contextCurrency) {
      setCurrency(contextCurrency);
    }
  }, [contextCurrency]);

  // Écouter les événements DATA_ENTERED pour rafraîchir en temps réel
  useCalendarEvent('DATA_ENTERED', (event) => {
    // [DEBUG] console.log('[PerformanceCalendar] 📢 Événement DATA_ENTERED reçu:', event.payload);
    // Rafraîchir les données
    loadCostEntries();
    setLastRefresh(Date.now());
    toast.success('Données mises à jour', {
      description: `${event.payload.entryCount} entrée(s) pour ${event.payload.kpiType.toUpperCase()}`
    });
  }, [loadCostEntries]);

  // Écouter les verrouillages de période
  useCalendarEvent('PERIOD_LOCKED', (event) => {
    // [DEBUG] console.log('[PerformanceCalendar] 🔒 Période verrouillée/déverrouillée:', event.payload);
    // Rafraîchir les périodes verrouillées
    const locked = launchDateService.getAllLockedPeriodsFlat();
    setLockedPeriods(locked);
  }, []);

  // Helper: obtenir les données réelles pour une semaine
  // ✅ FIX: Utilise la correspondance par DATES au lieu des numéros de semaine
  // Cela résout le problème de désalignement entre le calendrier simplifié et les données ISO
  const getRealWeekData = useCallback((year: number, globalWeekNum: number): {
    target: number;
    actual: number; // Économies réalisées (Objectif - Coûts)
    indicators: Record<string, { target: number; actual: number }>;
    hasData: boolean; // Indicateur si des données existent pour cette semaine
  } => {
    // ✅ NOUVEAU: Calculer les dates réelles de la semaine du calendrier
    const { weekStartDate, weekEndDate } = getWeekDatesAsObjects(year, globalWeekNum);

    // ✅ NOUVEAU: Filtrer par PLAGE DE DATES au lieu de numéro de semaine
    // Une entrée correspond si sa period_start tombe dans la semaine du calendrier
    const weekEntries = costEntries.filter(entry => {
      const entryDate = new Date(entry.periodStart);
      return entryDate >= weekStartDate && entryDate <= weekEndDate;
    });

    // ✅ OBJECTIFS RÉELS depuis company_ppr_settings
    const indicators: Record<string, { target: number; actual: number }> = {
      abs: { target: pprSettings.abs, actual: 0 },
      qd: { target: pprSettings.qd, actual: 0 },
      oa: { target: pprSettings.oa, actual: 0 },
      ddp: { target: pprSettings.ddp, actual: 0 },
      ekh: { target: pprSettings.ekh, actual: 0 }
    };

    // Agréger les coûts réels par KPI
    let totalCosts = 0;
    weekEntries.forEach(entry => {
      const kpi = entry.kpiType.toLowerCase();
      if (indicators[kpi]) {
        totalCosts += entry.totalAmount;
      }
    });

    // ✅ Calculer les économies par indicateur
    // Économie = Objectif PPR - Coût réel saisi
    const kpiTypes = ['abs', 'qd', 'oa', 'ddp', 'ekh'];
    kpiTypes.forEach(kpi => {
      const kpiEntries = weekEntries.filter(e => e.kpiType.toLowerCase() === kpi);
      const kpiCost = kpiEntries.reduce((sum, e) => sum + e.totalAmount, 0);
      // Économie réalisée = Objectif - Coût (plus l'économie est grande, mieux c'est)
      indicators[kpi].actual = Math.max(0, indicators[kpi].target - kpiCost);
    });

    // Objectif total = somme des objectifs PPR
    const target = pprSettings.total;

    // Économies totales réalisées = somme des économies par indicateur
    const totalSavings = Object.values(indicators).reduce((sum, ind) => sum + ind.actual, 0);

    return {
      target,
      actual: totalSavings,
      indicators,
      hasData: weekEntries.length > 0 // ✅ Indicateur de données présentes
    };
  }, [costEntries, pprSettings]);

  // ✅ TRANSFERT DONNÉES: Helper pour fournir les données OBJ/RÉAL
  // - target (OBJ) = pprSettings.total (depuis grandTotals.grandTotalPPR)
  // - actual (RÉAL) = realSettings.total (depuis grandTotals.grandTotalEco)
  // IMPORTANT: hasData est basé sur les VRAIES entrées de coûts (module3_cost_entries)
  // pas sur la valeur de actual qui est maintenant toujours > 0
  const getRealWeekDataByPeriod = useCallback((periodStart: string, periodEnd: string): {
    target: number;
    actual: number;
    indicators: Record<string, { target: number; actual: number }>;
    hasData: boolean;
    dataCount: number;
  } => {
    // ✅ Vérifier si des entrées de coûts RÉELLES existent pour cette période
    // C'est le VRAI critère pour savoir si des calculs ont été faits
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const weekEntries = costEntries.filter(entry => {
      const entryDate = new Date(entry.periodStart);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // hasData = true UNIQUEMENT si des entrées existent dans module3_cost_entries
    const hasData = weekEntries.length > 0;
    const dataCount = weekEntries.length;

    // OBJ: Toujours affiché (objectif reste le même)
    const target = pprSettings.total;

    // RÉAL: Seulement si des données existent pour cette période
    // Sinon on retourne 0 (sera affiché comme "Pas de résultat")
    const actual = hasData ? realSettings.total : 0;

    // Indicateurs: OBJ toujours, RÉAL seulement si données
    const indicators: Record<string, { target: number; actual: number }> = {
      abs: { target: pprSettings.abs, actual: hasData ? realSettings.abs : 0 },
      qd: { target: pprSettings.qd, actual: hasData ? realSettings.qd : 0 },
      oa: { target: pprSettings.oa, actual: hasData ? realSettings.oa : 0 },
      ddp: { target: pprSettings.ddp, actual: hasData ? realSettings.ddp : 0 },
      ekh: { target: pprSettings.ekh, actual: hasData ? realSettings.ekh : 0 }
    };

    return {
      target,
      actual,
      indicators,
      hasData,
      dataCount
    };
  }, [pprSettings, realSettings, costEntries]);

  // Charger les périodes verrouillées et la devise depuis les sources HCM
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (currentCompany?.id) {
          // 1. Charger la configuration depuis LaunchDateService (Widget Smart Calendar)
          await launchDateService.loadConfig(currentCompany.id);

          // 1.1 Récupérer et stocker la date de lancement
          const config = launchDateService.getConfig();
          if (config?.platformLaunchDate) {
            setLaunchDate(new Date(config.platformLaunchDate));
            // [DEBUG] console.log('[PerformanceCalendar] ✅ Launch date loaded:', config.platformLaunchDate);
          }

          // 2. Charger la devise depuis company_performance_scores.factors.selectedCurrency
          // (même source que CostSavingsReportingPage, PerformanceRecapPage, GlobalPerformanceCenterPage)
          const { data: scoreData } = await import('@/integrations/supabase/client')
            .then(mod => mod.supabase)
            .then(supabase => supabase
              .from('company_performance_scores')
              .select('factors')
              .eq('company_id', currentCompany.id)
              .eq('module_number', 1)
              .order('calculation_date', { ascending: false })
              .limit(1)
              .maybeSingle()
            );

          if (scoreData?.factors) {
            const factors = scoreData.factors as any;
            if (factors.selectedCurrency) {
              setCurrency(factors.selectedCurrency as Currency);
              // [DEBUG] console.log('[PerformanceCalendar] ✅ Currency set to:', factors.selectedCurrency);
            }
          }

          // 3. Charger les lignes d'activité depuis la base de données
          const { data: blData } = await import('@/integrations/supabase/client')
            .then(mod => mod.supabase)
            .then(supabase => supabase
              .from('business_lines')
              .select('id, activity_name')
              .eq('company_id', currentCompany.id)
              .order('created_at', { ascending: true })
            );

          if (blData && blData.length > 0) {
            const realBusinessLines = [
              { id: 'all', name: 'Toutes les lignes' },
              ...blData.map(bl => ({
                id: bl.id,
                name: bl.activity_name || 'Ligne sans nom'
              }))
            ];
            setBusinessLines(realBusinessLines);
            // [DEBUG] console.log('[PerformanceCalendar] ✅ Business lines loaded:', blData.length);
          }

          // ============================================
          // ✅ TRANSFERT DONNÉES OBJ: Depuis PerformanceDataContext
          // Source: Module 1 Page17GlobalReporting (Section H - Priority Actions N+1)
          // Règle LELE HCM: Pas de calcul, uniquement TRANSFERT de données
          // ============================================
          // Les données OBJ sont maintenant chargées via useEffect séparé (voir ci-dessous)
          // qui écoute les changements de financialParams du context
          // [DEBUG] console.log('[PerformanceCalendar] 📥 OBJ données transférées depuis PerformanceDataContext');

          // 5. Charger la dernière semaine complétée (Smart Calendar)
          const completedWeek = await getLastCompletedWeek(currentCompany.id);
          if (completedWeek) {
            setLastCompletedWeek(completedWeek);
            // [DEBUG] console.log('[PerformanceCalendar] ✅ Last completed week:', completedWeek.periodLabel);
          }
        }

        // 6. Récupérer les périodes verrouillées
        const locked = launchDateService.getAllLockedPeriodsFlat();
        setLockedPeriods(locked);

        // 7. Charger les données de coûts depuis module3_cost_entries
        await loadCostEntries();
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentCompany?.id, loadCostEntries]);

  // ============================================
  // GÉNÉRATION DES DONNÉES DU CALENDRIER FISCAL
  // ============================================
  //
  // ✅ ARCHITECTURE FISCALE (alignée sur Widget Smart Calendar):
  // - Ordre des mois: Décembre → Janvier → ... → Novembre (FISCAL_MONTHS)
  // - Les semaines sont calculées depuis la date de lancement
  // - N+1 commence le 1er décembre 2025 (si lancement = 1 déc 2025)
  // - Semaine 1 N+1 = 1 déc 2025 → 7 déc 2025
  // - Semaine 52 N+1 = 23 nov 2026 → 29 nov 2026
  //
  const yearData = useMemo((): YearData => {
    // L'année affichée pour N+X = baseYear + (X - 1)
    // N+1 → 2025, N+2 → 2026, N+3 → 2027 (si lancement = Dec 2025)
    const fiscalStartYear = baseYear + (selectedYearOffset - 1);

    let totalTarget = 0;
    let totalActual = 0;
    let lockedWeeks = 0;
    let totalWeeks = 0;

    const months: Record<string, MonthData> = {};

    // Si pas de date de lancement, utiliser un fallback
    const effectiveLaunchDate = launchDate || new Date(baseYear, 11, 1); // 1er décembre par défaut

    let globalWeekNum = 0;

    // ✅ Parcourir les 12 mois FISCAUX (Décembre → Novembre)
    FISCAL_MONTHS.forEach((month, fiscalMonthIndex) => {
      const weeksInMonth: WeekData[] = [];

      // Nombre de semaines par mois (Décembre et Novembre peuvent avoir 5 semaines)
      const weeksCount = (fiscalMonthIndex === 0 || fiscalMonthIndex === 11) ? 5 : 4;

      for (let w = 1; w <= weeksCount; w++) {
        globalWeekNum++;
        if (globalWeekNum > 52) break;

        // ✅ Calculer les dates FISCALES depuis la date de lancement
        const { startDate, endDate, periodStart, periodEnd } = getFiscalWeekDateRange(
          effectiveLaunchDate,
          selectedYearOffset,
          globalWeekNum
        );

        const weekKey = `week_${selectedYearOffset}_${globalWeekNum}`;
        const isLocked = lockedPeriods[weekKey] === true ||
                         lockedPeriods[`year_${selectedYearOffset}`] === true;

        // ✅ DONNÉES RÉELLES: matcher par period_start/period_end
        const realData = getRealWeekDataByPeriod(periodStart, periodEnd);
        const target = realData.target;
        const actual = realData.actual;

        const variance = actual - target;
        const variancePercent = target > 0 ? (variance / target) * 100 : 0;

        // Formater les dates pour l'affichage
        const startDateFormatted = formatDateShort(startDate);
        const endDateFormatted = formatDateShort(endDate);

        // Déterminer le statut basé sur les données réelles
        let status: WeekData['status'] = 'planned';
        if (realData.hasData) {
          const percent = target > 0 ? (actual / target) * 100 : 0;
          if (percent >= THRESHOLDS.SUCCESS) status = 'success';
          else if (percent >= THRESHOLDS.WARNING) status = 'warning';
          else status = 'critical';
        } else if (isLocked) {
          status = 'planned';
        }

        // ✅ Déterminer si c'est la semaine courante
        const isCurrentWeek = lastCompletedWeek?.found &&
          lastCompletedWeek.yearOffset === selectedYearOffset &&
          lastCompletedWeek.weekNumber === globalWeekNum;

        // ✅ TRANSFERT DONNÉES: Ventilation par ligne d'activité depuis financialParams
        const byBusinessLine: WeekData['byBusinessLine'] = financialParams.module1BusinessLines?.map(bl => {
          // OBJ par ligne = (PPR hebdo total) × (budgetRate / 100)
          const lineTarget = target * ((bl.budgetRate || 0) / 100);
          // RÉAL par ligne = filtrer costEntries par business_line_id (à implémenter)
          // Pour l'instant on distribue proportionnellement au budget
          const lineActual = actual * ((bl.budgetRate || 0) / 100);

          return {
            lineId: bl.id,
            lineName: bl.activityName || 'Ligne sans nom',
            target: lineTarget,
            actual: lineActual
          };
        }) || [];

        const weekData: WeekData = {
          id: `fiscal-${fiscalStartYear}-${month.name}-W${w}`,
          weekNumber: w,
          globalWeekNumber: globalWeekNum,
          target,
          actual,
          isLocked,
          isCurrentWeek: isCurrentWeek || false,
          isBeforeLaunch: false, // Plus de semaines avant lancement dans le calendrier fiscal
          status,
          variance,
          variancePercent,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          indicators: realData.indicators as WeekData['indicators'],
          // ✅ NOUVEAU: Données pour affichage
          hasRealData: realData.hasData,
          byBusinessLine
        };

        weeksInMonth.push(weekData);

        if (!isLocked || realData.hasData) {
          totalTarget += target;
          totalActual += actual;
        }
        if (isLocked) lockedWeeks++;
        totalWeeks++;
      }

      if (weeksInMonth.length > 0) {
        months[month.name] = {
          name: month.name,
          shortName: month.short,
          weeks: weeksInMonth
        };
      }
    });

    return {
      year: fiscalStartYear,
      yearOffset: selectedYearOffset,
      label: `N+${selectedYearOffset}`,
      months,
      totalTarget,
      totalActual,
      lockedWeeks,
      totalWeeks
    };
  }, [baseYear, selectedYearOffset, lockedPeriods, getRealWeekDataByPeriod, costEntries, lastRefresh, lastCompletedWeek, launchDate]);

  // Statistiques de l'année
  const yearStats = useMemo(() => {
    const rate = yearData.totalTarget > 0
      ? Math.round((yearData.totalActual / yearData.totalTarget) * 100)
      : 0;

    return {
      totalTarget: yearData.totalTarget,
      totalActual: yearData.totalActual,
      rate,
      lockedWeeks: yearData.lockedWeeks,
      totalWeeks: yearData.totalWeeks
    };
  }, [yearData]);

  // Générer les données pour les 3 années (pour YearView)
  // ✅ CORRIGÉ: Utilise FISCAL_MONTHS et getRealWeekDataByPeriod (aligné sur yearData)
  const allYearsData = useMemo((): Record<number, YearData> => {
    const result: Record<number, YearData> = {};

    // Si pas de date de lancement, utiliser un fallback
    const effectiveLaunchDate = launchDate || new Date(baseYear, 11, 1); // 1er décembre par défaut

    [1, 2, 3].forEach(offset => {
      // ✅ FIX BUG #1: Même formule que yearData
      const fiscalStartYear = baseYear + (offset - 1);
      let totalTarget = 0;
      let totalActual = 0;
      let lockedWks = 0;
      let totalWks = 0;
      const months: Record<string, MonthData> = {};

      let globalWeekNum = 0;

      // ✅ FIX BUG #2: Utiliser FISCAL_MONTHS (Décembre → Novembre) au lieu de MONTHS_FR
      FISCAL_MONTHS.forEach((month, fiscalMonthIndex) => {
        const weeksInMonth: WeekData[] = [];
        // Nombre de semaines par mois (Décembre et Novembre peuvent avoir 5 semaines)
        const weeksCount = (fiscalMonthIndex === 0 || fiscalMonthIndex === 11) ? 5 : 4;

        for (let w = 1; w <= weeksCount; w++) {
          globalWeekNum++;
          if (globalWeekNum > 52) break;

          // ✅ FIX BUG #3: Utiliser getFiscalWeekDateRange (même que yearData)
          const { startDate, endDate, periodStart, periodEnd } = getFiscalWeekDateRange(
            effectiveLaunchDate,
            offset,
            globalWeekNum
          );

          const weekKey = `week_${offset}_${globalWeekNum}`;
          const isLocked = lockedPeriods[weekKey] === true ||
                           lockedPeriods[`year_${offset}`] === true;

          // ✅ FIX BUG #3: Utiliser getRealWeekDataByPeriod (même que yearData)
          const realData = getRealWeekDataByPeriod(periodStart, periodEnd);
          const target = realData.target;
          const actual = realData.actual;

          let status: WeekData['status'] = 'planned';
          if (realData.hasData) {
            const percent = target > 0 ? (actual / target) * 100 : 0;
            if (percent >= THRESHOLDS.SUCCESS) status = 'success';
            else if (percent >= THRESHOLDS.WARNING) status = 'warning';
            else status = 'critical';
          }

          // ✅ Déterminer si c'est la semaine courante (dernière complétée avec données)
          const isCurrentWeek = lastCompletedWeek?.found &&
            lastCompletedWeek.yearOffset === offset &&
            lastCompletedWeek.weekNumber === globalWeekNum;

          weeksInMonth.push({
            id: `fiscal-${fiscalStartYear}-${month.name}-W${w}`,
            weekNumber: w,
            globalWeekNumber: globalWeekNum,
            target,
            actual,
            isLocked,
            isCurrentWeek: isCurrentWeek || false,
            isBeforeLaunch: false,
            status,
            variance: actual - target,
            variancePercent: target > 0 ? ((actual - target) / target) * 100 : 0,
            startDate: formatDateShort(startDate),
            endDate: formatDateShort(endDate),
            indicators: realData.indicators as WeekData['indicators'],
            hasRealData: realData.hasData,
            byBusinessLine: []
          });

          totalTarget += target;
          totalActual += actual;
          if (isLocked) lockedWks++;
          totalWks++;
        }

        months[month.name] = {
          name: month.name,
          shortName: month.short,
          weeks: weeksInMonth
        };
      });

      result[offset] = {
        year: fiscalStartYear, // ✅ FIX: Utiliser fiscalStartYear au lieu de yr
        yearOffset: offset,
        label: `N+${offset}`,
        months,
        totalTarget,
        totalActual,
        lockedWeeks: lockedWks,
        totalWeeks: totalWks
      };
    });

    return result;
  // ✅ Dépendances mises à jour pour inclure getRealWeekDataByPeriod et launchDate
  }, [baseYear, lockedPeriods, getRealWeekDataByPeriod, costEntries, lastRefresh, lastCompletedWeek, launchDate]);

  // Handlers de navigation entre vues
  const handleYearClick = useCallback((yearOffset: number) => {
    // Ouvrir le panneau de détail annuel au lieu de naviguer directement
    const data = allYearsData[yearOffset];
    if (data) {
      const yearInfo = availableYears.find(y => y.offset === yearOffset);
      const monthsData = Object.entries(data.months).map(([name, monthData]) => ({
        name,
        target: monthData.weeks.reduce((sum, w) => sum + w.target, 0),
        actual: monthData.weeks.reduce((sum, w) => sum + w.actual, 0),
        locked: monthData.weeks.filter(w => w.isLocked).length,
        total: monthData.weeks.length
      }));

      // ✅ Agréger les indicateurs de toutes les semaines de l'année
      const aggregatedIndicators = {
        abs: { target: 0, actual: 0 },
        qd: { target: 0, actual: 0 },
        oa: { target: 0, actual: 0 },
        ddp: { target: 0, actual: 0 },
        ekh: { target: 0, actual: 0 }
      };
      Object.values(data.months).forEach(monthData => {
        monthData.weeks.forEach(week => {
          if (week.indicators) {
            (['abs', 'qd', 'oa', 'ddp', 'ekh'] as const).forEach(key => {
              if (week.indicators && week.indicators[key]) {
                aggregatedIndicators[key].target += week.indicators[key].target;
                aggregatedIndicators[key].actual += week.indicators[key].actual;
              }
            });
          }
        });
      });

      setSelectedYearData({
        year: data.year,
        yearOffset: yearOffset,
        yearLabel: yearInfo?.label || `N+${yearOffset}`,
        totalTarget: data.totalTarget,
        totalActual: data.totalActual,
        lockedWeeks: data.lockedWeeks,
        totalWeeks: data.totalWeeks,
        monthsData,
        indicators: aggregatedIndicators // ✅ Ajout des indicateurs agrégés
      });
    }
  }, [allYearsData, availableYears]);

  const handleMonthClick = useCallback((monthName: string) => {
    // Ouvrir le panneau de détail mensuel au lieu de naviguer directement
    const data = allYearsData[selectedYearOffset];
    if (data && data.months[monthName]) {
      const monthData = data.months[monthName];
      const yearInfo = availableYears.find(y => y.offset === selectedYearOffset);

      // ✅ Agréger les indicateurs de toutes les semaines du mois
      const aggregatedIndicators = {
        abs: { target: 0, actual: 0 },
        qd: { target: 0, actual: 0 },
        oa: { target: 0, actual: 0 },
        ddp: { target: 0, actual: 0 },
        ekh: { target: 0, actual: 0 }
      };
      monthData.weeks.forEach(week => {
        if (week.indicators) {
          (['abs', 'qd', 'oa', 'ddp', 'ekh'] as const).forEach(key => {
            if (week.indicators && week.indicators[key]) {
              aggregatedIndicators[key].target += week.indicators[key].target;
              aggregatedIndicators[key].actual += week.indicators[key].actual;
            }
          });
        }
      });

      setSelectedMonthData({
        monthName,
        year: data.year,
        yearLabel: yearInfo?.label || `N+${selectedYearOffset}`,
        totalTarget: monthData.weeks.reduce((sum, w) => sum + w.target, 0),
        totalActual: monthData.weeks.reduce((sum, w) => sum + w.actual, 0),
        lockedWeeks: monthData.weeks.filter(w => w.isLocked).length,
        totalWeeks: monthData.weeks.length,
        weeks: monthData.weeks,
        indicators: aggregatedIndicators // ✅ Ajout des indicateurs agrégés
      });
    }
  }, [allYearsData, selectedYearOffset, availableYears]);

  // Handlers pour naviguer depuis les panneaux de détail
  const handleViewMonthsFromPanel = useCallback(() => {
    if (selectedYearData) {
      setSelectedYearOffset(selectedYearData.yearOffset);
      setSelectedYearData(null);
      setViewDirection(1);
      setViewMode('months');
    }
  }, [selectedYearData]);

  const handleViewWeeksFromPanel = useCallback(() => {
    if (selectedMonthData) {
      setSelectedMonth(selectedMonthData.monthName);
      setSelectedMonthData(null);
      setViewDirection(1);
      setViewMode('weeks');
    }
  }, [selectedMonthData]);

  const handleBackToYears = useCallback(() => {
    setViewDirection(-1);
    setViewMode('years');
  }, []);

  const handleBackToMonths = useCallback(() => {
    setSelectedMonth(null);
    setViewDirection(-1);
    setViewMode('months');
  }, []);

  // Handler pour le changement de vue via le toggle
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    const modeOrder = { years: 0, months: 1, weeks: 2 };
    setViewDirection(modeOrder[newMode] > modeOrder[viewMode] ? 1 : -1);
    setViewMode(newMode);
    if (newMode === 'years') {
      setSelectedMonth(null);
    }
  }, [viewMode]);

  // Handlers
  const handleWeekClick = useCallback((week: WeekData, monthName: string) => {
    setSelectedWeekData({ week, month: monthName });
  }, []);

  const handleToggleLock = useCallback(async () => {
    if (!selectedWeekData || !currentCompany?.id) return;

    const weekKey = `week_${selectedYearOffset}_${selectedWeekData.week.globalWeekNumber}`;
    const newLocked = !selectedWeekData.week.isLocked;

    // Mise à jour locale
    setLockedPeriods(prev => ({
      ...prev,
      [weekKey]: newLocked
    }));

    // Mise à jour de la sélection
    setSelectedWeekData(prev => prev ? {
      ...prev,
      week: { ...prev.week, isLocked: newLocked }
    } : null);

    // Sauvegarder dans LaunchDateService
    try {
      if (newLocked) {
        launchDateService.lockDate(
          selectedYearOffset,
          new Date(),
          'WEEK',
          selectedWeekData.week.globalWeekNumber,
          currentCompany.id
        );
      } else {
        launchDateService.unlockDate(selectedYearOffset, 'WEEK', selectedWeekData.week.globalWeekNumber);
      }

      await launchDateService.saveLockedDates(currentCompany.id);
      toast.success(newLocked ? 'Semaine verrouillée' : 'Semaine déverrouillée');
    } catch (error) {
      console.error('Erreur sauvegarde verrou:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [selectedWeekData, selectedYearOffset, currentCompany?.id]);

  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toFixed(0);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HCMLoader text="Chargement du calendrier..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/modules/module3/global-performance-center')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Calendrier de Suivi des Performances
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                    Module Cost Savings
                  </Badge>
                  <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
                    Année {availableYears.find(y => y.offset === selectedYearOffset)?.year || baseYear + selectedYearOffset}
                  </Badge>
                </div>
              </div>
            </div>

{/* Actions rapides */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" aria-hidden="true" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Printer className="w-4 h-4" aria-hidden="true" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Widget de Filtrage Complet */}
          <FilterWidget
            selectedYearOffset={selectedYearOffset}
            onYearChange={setSelectedYearOffset}
            availableYears={availableYears}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            selectedBusinessLine={selectedBusinessLine}
            onBusinessLineChange={setSelectedBusinessLine}
            businessLines={businessLines}
            selectedIndicators={selectedIndicators}
            onIndicatorsChange={setSelectedIndicators}
            selectedDomains={selectedDomains}
            onDomainsChange={setSelectedDomains}
          />

          {/* Contenu conditionnel avec animations de transition */}
          <AnimatePresence mode="wait" custom={viewDirection}>
            {/* VUE ANNÉES - 3 cartes comparatives */}
            {viewMode === 'years' && (
              <motion.div
                key="years-view"
                custom={viewDirection}
                variants={viewTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <YearView
                  availableYears={availableYears}
                  yearsData={allYearsData}
                  currencySymbol={currencyConfig.symbol}
                  onYearClick={handleYearClick}
                />
              </motion.div>
            )}

            {/* VUE MOIS - 12 cartes agrégées */}
            {viewMode === 'months' && (
              <motion.div
                key="months-view"
                custom={viewDirection}
                variants={viewTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <MonthView
                  yearData={yearData}
                  currencySymbol={currencyConfig.symbol}
                  onMonthClick={handleMonthClick}
                  onBackToYears={handleBackToYears}
                />
              </motion.div>
            )}

            {/* VUE SEMAINES - Grille détaillée */}
            {viewMode === 'weeks' && (
              <motion.div
                key="weeks-view"
                custom={viewDirection}
                variants={viewTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {/* Navigation retour si un mois est sélectionné */}
                {selectedMonth && (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToMonths}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      Retour aux mois
                    </Button>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        {selectedMonth} {yearData.year}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Grille du calendrier - filtrée par mois si sélectionné */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(yearData.months)
                    .filter(([monthName]) => !selectedMonth || monthName === selectedMonth)
                    .map(([monthName, monthData]) => {
                      const hasData = monthData.weeks.some(week => week.actual > 0 || week.isLocked);

                      return (
                        <Card
                          key={monthName}
                          className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700"
                        >
                          {/* Header du mois - Vert si données enregistrées, Rouge sinon */}
                          <div className={cn(
                            "px-4 py-3 flex justify-between items-center bg-gradient-to-r",
                            hasData
                              ? "from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800"
                              : "from-red-500 to-red-600 dark:from-red-600 dark:to-red-700"
                          )}>
                            <h3 className="font-bold text-white">{monthName}</h3>
                            <Badge className="bg-white/20 text-white border-0">
                              {monthData.weeks.length} sem.
                            </Badge>
                          </div>

                          {/* Liste des semaines */}
                          <CardContent className="p-3 space-y-2">
                            {monthData.weeks.map(week => (
                              <WeekCell
                                key={week.id}
                                week={week}
                                isSelected={selectedWeekData?.week.id === week.id}
                                onClick={() => handleWeekClick(week, monthName)}
                                currencySymbol={currencyConfig.symbol}
                              />
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Légende */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">≥95% Atteint</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">85-95% À surveiller</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-slate-600 dark:text-slate-400">&lt;85% Critique</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-300 dark:bg-slate-600" />
                  <span className="text-slate-600 dark:text-slate-400">Planifié</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-600 dark:text-slate-400">Validé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Ouvert</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de détail Semaine (slide-in à droite) */}
        <AnimatePresence>
          {selectedWeekData && (
            <WeekDetailPanel
              weekData={selectedWeekData.week}
              month={selectedWeekData.month}
              year={yearData.year}
              yearLabel={yearData.label}
              currencySymbol={currencyConfig.symbol}
              onClose={() => setSelectedWeekData(null)}
              onToggleLock={handleToggleLock}
            />
          )}
        </AnimatePresence>

        {/* Panel de détail Mensuel (slide-in à droite) */}
        <AnimatePresence>
          {selectedMonthData && (
            <MonthDetailPanel
              monthData={selectedMonthData}
              currencySymbol={currencyConfig.symbol}
              onClose={() => setSelectedMonthData(null)}
              onViewWeeks={handleViewWeeksFromPanel}
            />
          )}
        </AnimatePresence>

        {/* Panel de détail Annuel (slide-in à droite) */}
        <AnimatePresence>
          {selectedYearData && (
            <YearDetailPanel
              yearData={selectedYearData}
              currencySymbol={currencyConfig.symbol}
              onClose={() => setSelectedYearData(null)}
              onViewMonths={handleViewMonthsFromPanel}
              grandTotals={grandTotals}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
