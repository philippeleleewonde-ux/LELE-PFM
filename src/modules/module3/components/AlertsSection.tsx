/**
 * ============================================
 * ALERTS SECTION
 * ============================================
 *
 * Section avec 3 blocs orange/rouge montrant les alertes :
 * 1. Plus faible contribution
 * 2. Plus faible impact trésorerie
 * 3. Plus éloigné de l'objectif
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Wallet, TrendingDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import type { DepartmentData } from '../utils/indicatorAnalysis';
import {
  getWorstContribution,
  getWorstTresorerie,
  getFurthestFromObjective,
  getAttainmentRate,
  formatCompactAmount,
  formatPercent,
  formatEcart
} from '../utils/indicatorAnalysis';

// ============================================
// TYPES
// ============================================

interface AlertsSectionProps {
  departments: DepartmentData[];
  currency: Currency;
}

interface AlertBlockProps {
  title: string;
  icon: React.ReactNode;
  department: string;
  mainValue: string;
  mainLabel: string;
  secondaryValue: string;
  secondaryLabel: string;
  alertMessage?: string;
  type: 'warning' | 'danger';
  progressPercent?: number;
  delay?: number;
}

// ============================================
// ALERT BLOCK COMPONENT
// ============================================

const AlertBlock: React.FC<AlertBlockProps> = ({
  title,
  icon,
  department,
  mainValue,
  mainLabel,
  secondaryValue,
  secondaryLabel,
  alertMessage,
  type,
  progressPercent,
  delay = 0
}) => {
  const isWarning = type === 'warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        isWarning
          ? "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-950/20 border-amber-300 dark:border-amber-500/30"
          : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-950/20 border-red-300 dark:border-red-500/30",
        "border shadow-lg",
        isWarning ? "hover:shadow-amber-500/10" : "hover:shadow-red-500/10",
        "transition-all duration-200",
        "hover:transform hover:-translate-y-1"
      )}
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-20",
        isWarning ? "bg-amber-500/30" : "bg-red-500/30"
      )} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "p-2 rounded-lg",
          isWarning ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
        )}>
          {icon}
        </div>
        <h3 className={cn(
          "text-sm font-bold uppercase tracking-wide",
          isWarning ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300"
        )}>
          {title}
        </h3>
      </div>

      {/* Department name */}
      <p className="text-lg font-semibold text-slate-900 dark:text-white mb-4 truncate" title={department}>
        {department}
      </p>

      {/* Main value */}
      <div className="mb-3">
        <p className={cn(
          "text-3xl font-mono font-bold",
          isWarning ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
        )}>
          {mainValue}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{mainLabel}</p>
      </div>

      {/* Secondary value */}
      <div className="flex items-center justify-between">
        <div>
          <p className={cn(
            "text-lg font-semibold",
            isWarning ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300"
          )}>
            {secondaryValue}
          </p>
          <p className="text-xs text-slate-500">{secondaryLabel}</p>
        </div>
        {progressPercent !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isWarning
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-red-500 to-red-400"
                )}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-medium",
              isWarning ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
            )}>
              {progressPercent.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Alert message */}
      {alertMessage && (
        <div className={cn(
          "mt-3 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
          isWarning ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"
        )}>
          <AlertTriangle className="w-3 h-3" />
          {alertMessage}
        </div>
      )}

      {/* Alert badge */}
      <div className="absolute top-3 right-3">
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold border",
          isWarning
            ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
            : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30"
        )}>
          {isWarning ? 'ALERTE' : 'CRITIQUE'}
        </span>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function AlertsSection({
  departments,
  currency
}: AlertsSectionProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  // Calculs des alertes
  const worstContribution = getWorstContribution(departments);
  const worstTresorerie = getWorstTresorerie(departments);
  const furthestFromObjective = getFurthestFromObjective(departments);

  if (!worstContribution || !worstTresorerie || !furthestFromObjective) {
    return null;
  }

  // Calculs des valeurs
  const furthestTauxAtteinte = getAttainmentRate(furthestFromObjective);
  const furthestEcart = furthestFromObjective.totalEconomies - furthestFromObjective.totalObjectif;
  const tresoRatio = worstTresorerie.totalPrevTreso > 0
    ? (worstTresorerie.totalRealTreso / worstTresorerie.totalPrevTreso) * 100
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          ALERTES - ÉCONOMIES
        </h2>
      </div>

      {/* 3 Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Block 1: Plus faible contribution */}
        <AlertBlock
          title="Plus Faible Contrib."
          icon={<TrendingDown className="w-4 h-4" />}
          department={worstContribution.name}
          mainValue={formatPercent(worstContribution.contributionPct)}
          mainLabel="contribution totale"
          secondaryValue={formatCompactAmount(worstContribution.totalEconomies, currencyConfig.symbol)}
          secondaryLabel="économies réalisées"
          alertMessage="Attention requise"
          type="warning"
          progressPercent={worstContribution.contributionPct * 3} // Scale for visibility
          delay={0}
        />

        {/* Block 2: Plus faible trésorerie */}
        <AlertBlock
          title="Plus Faible Trésorerie"
          icon={<Wallet className="w-4 h-4" />}
          department={worstTresorerie.name}
          mainValue={formatCompactAmount(worstTresorerie.totalRealTreso, currencyConfig.symbol)}
          mainLabel="trésorerie réalisée"
          secondaryValue={formatPercent(tresoRatio)}
          secondaryLabel="du prévisionnel"
          alertMessage="Impact limité"
          type="warning"
          progressPercent={Math.min(100, tresoRatio)}
          delay={1}
        />

        {/* Block 3: Plus éloigné de l'objectif */}
        <AlertBlock
          title="Plus Éloigné Objectif"
          icon={<Target className="w-4 h-4" />}
          department={furthestFromObjective.name}
          mainValue={formatPercent(furthestTauxAtteinte)}
          mainLabel="objectif atteint"
          secondaryValue={formatEcart(furthestEcart, currencyConfig.symbol)}
          secondaryLabel="écart à combler"
          alertMessage="Action corrective recommandée"
          type="danger"
          progressPercent={Math.min(100, furthestTauxAtteinte)}
          delay={2}
        />
      </div>
    </motion.section>
  );
}
