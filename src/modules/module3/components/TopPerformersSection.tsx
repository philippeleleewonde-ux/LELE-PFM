/**
 * ============================================
 * TOP PERFORMERS SECTION
 * ============================================
 *
 * Section avec 3 blocs verts montrant les meilleurs départements :
 * 1. Meilleure contribution économies
 * 2. Meilleur impact trésorerie
 * 3. Plus proche de l'objectif
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Wallet, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import type { DepartmentData } from '../utils/indicatorAnalysis';
import {
  getBestContribution,
  getBestTresorerie,
  getClosestToObjective,
  getAttainmentRate,
  formatCompactAmount,
  formatPercent,
  formatEcart
} from '../utils/indicatorAnalysis';

// ============================================
// TYPES
// ============================================

interface TopPerformersSectionProps {
  departments: DepartmentData[];
  currency: Currency;
}

interface PerformerBlockProps {
  title: string;
  icon: React.ReactNode;
  department: string;
  mainValue: string;
  mainLabel: string;
  secondaryValue: string;
  secondaryLabel: string;
  progressPercent?: number;
  delay?: number;
}

// ============================================
// PERFORMER BLOCK COMPONENT
// ============================================

const PerformerBlock: React.FC<PerformerBlockProps> = ({
  title,
  icon,
  department,
  mainValue,
  mainLabel,
  secondaryValue,
  secondaryLabel,
  progressPercent,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-950/20",
        "border border-emerald-300 dark:border-emerald-500/30",
        "shadow-lg hover:shadow-emerald-500/10",
        "transition-all duration-200",
        "hover:transform hover:-translate-y-1"
      )}
    >
      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-20 bg-emerald-500/30" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
          {title}
        </h3>
      </div>

      {/* Department name */}
      <p className="text-lg font-semibold text-slate-900 dark:text-white mb-4 truncate" title={department}>
        {department}
      </p>

      {/* Main value */}
      <div className="mb-3">
        <p className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {mainValue}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{mainLabel}</p>
      </div>

      {/* Secondary value */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{secondaryValue}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">{secondaryLabel}</p>
        </div>
        {progressPercent !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{progressPercent.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Success badge */}
      <div className="absolute top-3 right-3">
        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
          TOP
        </span>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function TopPerformersSection({
  departments,
  currency
}: TopPerformersSectionProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  // Calculs des top performers
  const bestContribution = getBestContribution(departments);
  const bestTresorerie = getBestTresorerie(departments);
  const closestToObjective = getClosestToObjective(departments);

  if (!bestContribution || !bestTresorerie || !closestToObjective) {
    return null;
  }

  // Calculs des valeurs
  const closestTauxAtteinte = getAttainmentRate(closestToObjective);
  const closestEcart = closestToObjective.totalEconomies - closestToObjective.totalObjectif;
  const tresoRatio = bestTresorerie.totalPrevTreso > 0
    ? (bestTresorerie.totalRealTreso / bestTresorerie.totalPrevTreso) * 100
    : 0;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          TOP PERFORMERS - ÉCONOMIES
        </h2>
      </div>

      {/* 3 Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Block 1: Meilleure contribution */}
        <PerformerBlock
          title="Meilleure Contrib. Économies"
          icon={<Trophy className="w-4 h-4" />}
          department={bestContribution.name}
          mainValue={formatPercent(bestContribution.contributionPct)}
          mainLabel="contribution totale"
          secondaryValue={formatCompactAmount(bestContribution.totalEconomies, currencyConfig.symbol)}
          secondaryLabel="économies réalisées"
          progressPercent={100}
          delay={0}
        />

        {/* Block 2: Meilleur impact trésorerie */}
        <PerformerBlock
          title="Meilleur Impact Trésorerie"
          icon={<Wallet className="w-4 h-4" />}
          department={bestTresorerie.name}
          mainValue={formatCompactAmount(bestTresorerie.totalRealTreso, currencyConfig.symbol)}
          mainLabel="trésorerie réalisée"
          secondaryValue={formatPercent(tresoRatio)}
          secondaryLabel="du prévisionnel"
          progressPercent={Math.min(100, tresoRatio)}
          delay={1}
        />

        {/* Block 3: Plus proche de l'objectif */}
        <PerformerBlock
          title="Plus Proche Objectif"
          icon={<Target className="w-4 h-4" />}
          department={closestToObjective.name}
          mainValue={formatPercent(closestTauxAtteinte)}
          mainLabel="objectif atteint"
          secondaryValue={formatEcart(closestEcart, currencyConfig.symbol)}
          secondaryLabel="écart restant"
          progressPercent={Math.min(100, closestTauxAtteinte)}
          delay={2}
        />
      </div>
    </motion.section>
  );
}
