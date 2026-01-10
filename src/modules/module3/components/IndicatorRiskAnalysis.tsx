/**
 * ============================================
 * INDICATOR RISK ANALYSIS
 * ============================================
 *
 * Section avec 5 cartes d'analyse par indicateur socio-économique :
 * - Absentéisme
 * - Défauts de Qualité
 * - Accidents de Travail
 * - Écart de Productivité
 * - Écart de Know-How
 *
 * Chaque carte montre le champion et l'alerte pour cet indicateur.
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle,
  AlertTriangle,
  Zap,
  Clock,
  Target,
  Trophy,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import type { IndicatorDepartmentData, IndicatorAnalysisResult } from '../utils/indicatorAnalysis';
import { analyzeIndicator, formatCompactAmount } from '../utils/indicatorAnalysis';

// ============================================
// TYPES
// ============================================

interface EmployeePerformanceData {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  indicators: Record<string, {
    economiesRealisees?: number;
    objectif?: number;
    prevPrime?: number;
    prevTreso?: number;
    realPrime?: number;
    realTreso?: number;
  }>;
}

interface IndicatorRiskAnalysisProps {
  employeePerformances: EmployeePerformanceData[];
  currency: Currency;
}

// ============================================
// INDICATOR CONFIGS
// ============================================

const INDICATOR_CONFIGS = [
  {
    key: 'abs',
    name: 'Absentéisme',
    icon: UserCircle,
    headerBg: 'bg-orange-100 dark:bg-orange-500/20',
    headerBorder: 'border-orange-300 dark:border-orange-500/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-950/10'
  },
  {
    key: 'qd',
    name: 'Défauts de Qualité',
    icon: AlertTriangle,
    headerBg: 'bg-pink-100 dark:bg-pink-500/20',
    headerBorder: 'border-pink-300 dark:border-pink-500/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
    gradient: 'from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-950/10'
  },
  {
    key: 'oa',
    name: 'Accidents de Travail',
    icon: Zap,
    headerBg: 'bg-red-100 dark:bg-red-500/20',
    headerBorder: 'border-red-300 dark:border-red-500/30',
    iconColor: 'text-red-600 dark:text-red-400',
    gradient: 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-950/10'
  },
  {
    key: 'ddp',
    name: 'Écart de Productivité',
    icon: Clock,
    headerBg: 'bg-cyan-100 dark:bg-cyan-500/20',
    headerBorder: 'border-cyan-300 dark:border-cyan-500/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-950/10'
  },
  {
    key: 'ekh',
    name: 'Écart de Know-How',
    icon: Target,
    headerBg: 'bg-purple-100 dark:bg-purple-500/20',
    headerBorder: 'border-purple-300 dark:border-purple-500/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-950/10'
  }
];

// ============================================
// INDICATOR CARD COMPONENT
// ============================================

interface IndicatorCardProps {
  config: typeof INDICATOR_CONFIGS[0];
  analysis: IndicatorAnalysisResult | null;
  currency: Currency;
  delay: number;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({
  config,
  analysis,
  currency,
  delay
}) => {
  const currencyConfig = CURRENCY_CONFIG[currency];
  const IconComponent = config.icon;

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1 }}
        className={cn(
          "rounded-xl overflow-hidden border",
          config.headerBorder,
          "bg-slate-50 dark:bg-slate-900/50"
        )}
      >
        <div className={cn("px-4 py-3 flex items-center gap-2", config.headerBg)}>
          <IconComponent className={cn("w-5 h-5", config.iconColor)} />
          <span className="font-bold text-slate-900 dark:text-white">{config.name.toUpperCase()}</span>
        </div>
        <div className="p-4 text-center text-slate-500">
          Données non disponibles
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className={cn(
        "rounded-xl overflow-hidden border",
        config.headerBorder,
        "bg-gradient-to-br",
        config.gradient,
        "hover:shadow-lg transition-shadow"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        config.headerBg
      )}>
        <div className="flex items-center gap-2">
          <IconComponent className={cn("w-5 h-5", config.iconColor)} />
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{config.name.toUpperCase()}</span>
        </div>
      </div>

      {/* Content - 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700/50">
        {/* Champion column */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">MEILLEURE MAÎTRISE</span>
          </div>
          <p className="text-slate-900 dark:text-white font-semibold mb-2 truncate" title={analysis.best.department}>
            {analysis.best.department}
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-lg mb-1">
            {formatCompactAmount(analysis.best.economiesRealisees, currencyConfig.symbol)}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">économisés</p>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Users className="w-3 h-3" />
            <span>{analysis.best.salaries} salariés</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {formatCompactAmount(analysis.best.economiesParSalarie, currencyConfig.symbol)}/sal.
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100%</span>
          </div>
        </div>

        {/* Alert column */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">ATTENTION REQUISE</span>
          </div>
          <p className="text-slate-900 dark:text-white font-semibold mb-2 truncate" title={analysis.worst.department}>
            {analysis.worst.department}
          </p>
          <p className="text-amber-600 dark:text-amber-400 font-mono font-bold text-lg mb-1">
            {formatCompactAmount(analysis.worst.economiesRealisees, currencyConfig.symbol)}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">économisés</p>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Users className="w-3 h-3" />
            <span>{analysis.worst.salaries} salariés</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {formatCompactAmount(analysis.worst.economiesParSalarie, currencyConfig.symbol)}/sal.
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{ width: `${analysis.worst.percentOfMax}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{analysis.worst.percentOfMax}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function IndicatorRiskAnalysis({
  employeePerformances,
  currency
}: IndicatorRiskAnalysisProps) {
  // Calculer les données par département pour chaque indicateur
  const indicatorAnalyses = useMemo(() => {
    const results: IndicatorAnalysisResult[] = [];

    INDICATOR_CONFIGS.forEach(config => {
      // Agréger les données par département
      const deptMap = new Map<string, IndicatorDepartmentData>();

      employeePerformances.forEach(emp => {
        const indData = emp.indicators?.[config.key];
        if (!indData) return;

        const existing = deptMap.get(emp.businessLineId);
        if (existing) {
          existing.salaries += 1;
          existing.economiesRealisees += indData.economiesRealisees || 0;
          existing.objectif += indData.objectif || 0;
          existing.prevPrime += indData.prevPrime || 0;
          existing.prevTreso += indData.prevTreso || 0;
          existing.realPrime += indData.realPrime || 0;
          existing.realTreso += indData.realTreso || 0;
        } else {
          deptMap.set(emp.businessLineId, {
            department: emp.businessLineName,
            departmentId: emp.businessLineId,
            salaries: 1,
            economiesRealisees: indData.economiesRealisees || 0,
            objectif: indData.objectif || 0,
            prevPrime: indData.prevPrime || 0,
            prevTreso: indData.prevTreso || 0,
            realPrime: indData.realPrime || 0,
            realTreso: indData.realTreso || 0
          });
        }
      });

      const deptData = Array.from(deptMap.values());
      const analysis = analyzeIndicator(deptData, config.key, config.name);
      if (analysis) {
        results.push(analysis);
      }
    });

    return results;
  }, [employeePerformances]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          ANALYSE PAR INDICATEUR DE RISQUE
        </h2>
      </div>

      {/* 5 Indicator Cards */}
      <div className="space-y-4">
        {INDICATOR_CONFIGS.map((config, index) => {
          const analysis = indicatorAnalyses.find(a => a.indicatorKey === config.key) || null;
          return (
            <IndicatorCard
              key={config.key}
              config={config}
              analysis={analysis}
              currency={currency}
              delay={index}
            />
          );
        })}
      </div>
    </motion.section>
  );
}

// Export configs for use in ChampionsSummaryTable
export { INDICATOR_CONFIGS };
