/**
 * ============================================
 * EMPLOYEE TOP PERFORMERS & ALERTS
 * ============================================
 *
 * 2 rangées de 3 blocs chacune :
 * - Rangée 1 (verte) : Top 3 performers du département
 * - Rangée 2 (orange/rouge) : 3 alertes du département
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Wallet, Target, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import type { EmployeeData } from '../../utils/employeeAnalysis';
import {
  getBestEmployeeContribution,
  getWorstEmployeeContribution,
  getBestEmployeeTresorerie,
  getWorstEmployeeTresorerie,
  getClosestToObjectiveEmployee,
  getFurthestFromObjectiveEmployee,
  getEmployeeTresoRatio
} from '../../utils/employeeAnalysis';
import { formatCompactAmount, formatPercent, formatEcart } from '../../utils/indicatorAnalysis';

// ============================================
// TYPES
// ============================================

interface EmployeeTopPerformersProps {
  employees: EmployeeData[];
  departmentName: string;
  currency: Currency;
}

interface PerformerBlockProps {
  title: string;
  icon: React.ReactNode;
  employeeName: string;
  mainValue: string;
  mainLabel: string;
  secondaryValue: string;
  secondaryLabel: string;
  progressPercent?: number;
  type: 'success' | 'warning' | 'danger';
  badge: string;
  alertMessage?: string;
  delay?: number;
}

// ============================================
// PERFORMER BLOCK COMPONENT
// ============================================

const PerformerBlock: React.FC<PerformerBlockProps> = ({
  title,
  icon,
  employeeName,
  mainValue,
  mainLabel,
  secondaryValue,
  secondaryLabel,
  progressPercent,
  type,
  badge,
  alertMessage,
  delay = 0
}) => {
  const colors = {
    success: {
      bg: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-950/20',
      border: 'border-emerald-300 dark:border-emerald-500/30',
      glow: 'bg-emerald-500/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      titleText: 'text-emerald-700 dark:text-emerald-300',
      mainText: 'text-emerald-600 dark:text-emerald-400',
      secondaryText: 'text-emerald-700 dark:text-emerald-300',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      badgeBorder: 'border-emerald-300 dark:border-emerald-500/30',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      progressBg: 'from-emerald-500 to-emerald-400',
      hover: 'hover:shadow-emerald-500/10'
    },
    warning: {
      bg: 'from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-950/20',
      border: 'border-amber-300 dark:border-amber-500/30',
      glow: 'bg-amber-500/30',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      iconText: 'text-amber-600 dark:text-amber-400',
      titleText: 'text-amber-700 dark:text-amber-300',
      mainText: 'text-amber-600 dark:text-amber-400',
      secondaryText: 'text-amber-700 dark:text-amber-300',
      badgeBg: 'bg-amber-100 dark:bg-amber-500/20',
      badgeBorder: 'border-amber-300 dark:border-amber-500/30',
      badgeText: 'text-amber-700 dark:text-amber-300',
      progressBg: 'from-amber-500 to-amber-400',
      hover: 'hover:shadow-amber-500/10'
    },
    danger: {
      bg: 'from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-950/20',
      border: 'border-red-300 dark:border-red-500/30',
      glow: 'bg-red-500/30',
      iconBg: 'bg-red-100 dark:bg-red-500/20',
      iconText: 'text-red-600 dark:text-red-400',
      titleText: 'text-red-700 dark:text-red-300',
      mainText: 'text-red-600 dark:text-red-400',
      secondaryText: 'text-red-700 dark:text-red-300',
      badgeBg: 'bg-red-100 dark:bg-red-500/20',
      badgeBorder: 'border-red-300 dark:border-red-500/30',
      badgeText: 'text-red-700 dark:text-red-300',
      progressBg: 'from-red-500 to-red-400',
      hover: 'hover:shadow-red-500/10'
    }
  };

  const c = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-lg p-4",
        "bg-gradient-to-br", c.bg,
        "border", c.border,
        "shadow-md", c.hover,
        "transition-all duration-200"
      )}
    >
      {/* Glow effect */}
      <div className={cn("absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-10 dark:opacity-20", c.glow)} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-md", c.iconBg, c.iconText)}>
          {icon}
        </div>
        <h4 className={cn("text-xs font-bold uppercase tracking-wide", c.titleText)}>
          {title}
        </h4>
      </div>

      {/* Employee name */}
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3 truncate" title={employeeName}>
        {employeeName}
      </p>

      {/* Main value */}
      <div className="mb-2">
        <p className={cn("text-xl font-mono font-bold", c.mainText)}>
          {mainValue}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{mainLabel}</p>
      </div>

      {/* Secondary value */}
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-semibold", c.secondaryText)}>{secondaryValue}</p>
          <p className="text-[10px] text-slate-500">{secondaryLabel}</p>
        </div>
        {progressPercent !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn("h-full bg-gradient-to-r rounded-full transition-all", c.progressBg)}
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
            <span className={cn("text-[10px] font-medium", c.mainText)}>{progressPercent.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Alert message */}
      {alertMessage && (
        <div className={cn(
          "mt-2 px-2 py-1 rounded-full text-[10px] font-medium inline-flex items-center gap-1",
          c.badgeBg, c.badgeText
        )}>
          <AlertTriangle className="w-2.5 h-2.5" />
          {alertMessage}
        </div>
      )}

      {/* Badge */}
      <div className="absolute top-2 right-2">
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-[9px] font-bold border",
          c.badgeBg, c.badgeText, c.badgeBorder
        )}>
          {badge}
        </span>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmployeeTopPerformers({
  employees,
  departmentName,
  currency
}: EmployeeTopPerformersProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  if (employees.length === 0) {
    return null;
  }

  // Calculs des top performers
  const bestContribution = getBestEmployeeContribution(employees);
  const bestTresorerie = getBestEmployeeTresorerie(employees);
  const closestToObjective = getClosestToObjectiveEmployee(employees);

  // Calculs des alertes
  const worstContribution = getWorstEmployeeContribution(employees);
  const worstTresorerie = getWorstEmployeeTresorerie(employees);
  const furthestFromObjective = getFurthestFromObjectiveEmployee(employees);

  if (!bestContribution || !bestTresorerie || !closestToObjective ||
      !worstContribution || !worstTresorerie || !furthestFromObjective) {
    return null;
  }

  // Calculs des valeurs
  const closestEcart = closestToObjective.economiesRealisees - closestToObjective.objectif;
  const furthestEcart = furthestFromObjective.economiesRealisees - furthestFromObjective.objectif;
  const bestTresoRatio = getEmployeeTresoRatio(bestTresorerie);
  const worstTresoRatio = getEmployeeTresoRatio(worstTresorerie);

  return (
    <div className="space-y-4">
      {/* Top Performers Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            TOP PERFORMERS - SALARIÉS
          </h3>
          <span className="text-xs text-slate-500">({departmentName})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PerformerBlock
            title="Meilleure Contrib."
            icon={<Trophy className="w-3.5 h-3.5" />}
            employeeName={bestContribution.employeeName}
            mainValue={formatCompactAmount(bestContribution.economiesRealisees, currencyConfig.symbol)}
            mainLabel="économies réalisées"
            secondaryValue={formatPercent(bestContribution.progressPercent)}
            secondaryLabel="de l'objectif"
            progressPercent={100}
            type="success"
            badge="TOP"
            delay={0}
          />

          <PerformerBlock
            title="Meilleur Impact Tréso"
            icon={<Wallet className="w-3.5 h-3.5" />}
            employeeName={bestTresorerie.employeeName}
            mainValue={formatCompactAmount(bestTresorerie.realTreso, currencyConfig.symbol)}
            mainLabel="trésorerie réalisée"
            secondaryValue={formatPercent(bestTresoRatio)}
            secondaryLabel="du prévu"
            progressPercent={Math.min(100, bestTresoRatio)}
            type="success"
            badge="TOP"
            delay={1}
          />

          <PerformerBlock
            title="Plus Proche Objectif"
            icon={<Target className="w-3.5 h-3.5" />}
            employeeName={closestToObjective.employeeName}
            mainValue={formatPercent(closestToObjective.progressPercent)}
            mainLabel="objectif atteint"
            secondaryValue={formatEcart(closestEcart, currencyConfig.symbol)}
            secondaryLabel="écart restant"
            progressPercent={Math.min(100, closestToObjective.progressPercent)}
            type="success"
            badge="TOP"
            delay={2}
          />
        </div>
      </div>

      {/* Alerts Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            ALERTES - SALARIÉS
          </h3>
          <span className="text-xs text-slate-500">({departmentName})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PerformerBlock
            title="Plus Faible Contrib."
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            employeeName={worstContribution.employeeName}
            mainValue={formatCompactAmount(worstContribution.economiesRealisees, currencyConfig.symbol)}
            mainLabel="économies réalisées"
            secondaryValue={formatPercent(worstContribution.progressPercent)}
            secondaryLabel="de l'objectif"
            progressPercent={worstContribution.progressPercent}
            type="warning"
            badge="ALERTE"
            alertMessage="Accompagnement requis"
            delay={3}
          />

          <PerformerBlock
            title="Plus Faible Tréso"
            icon={<Wallet className="w-3.5 h-3.5" />}
            employeeName={worstTresorerie.employeeName}
            mainValue={formatCompactAmount(worstTresorerie.realTreso, currencyConfig.symbol)}
            mainLabel="trésorerie réalisée"
            secondaryValue={formatPercent(worstTresoRatio)}
            secondaryLabel="du prévu"
            progressPercent={Math.min(100, worstTresoRatio)}
            type="warning"
            badge="ALERTE"
            delay={4}
          />

          <PerformerBlock
            title="Plus Éloigné Objectif"
            icon={<Target className="w-3.5 h-3.5" />}
            employeeName={furthestFromObjective.employeeName}
            mainValue={formatPercent(furthestFromObjective.progressPercent)}
            mainLabel="objectif atteint"
            secondaryValue={formatEcart(furthestEcart, currencyConfig.symbol)}
            secondaryLabel="écart à combler"
            progressPercent={Math.min(100, furthestFromObjective.progressPercent)}
            type="danger"
            badge="CRITIQUE"
            alertMessage="Action urgente"
            delay={5}
          />
        </div>
      </div>
    </div>
  );
}
