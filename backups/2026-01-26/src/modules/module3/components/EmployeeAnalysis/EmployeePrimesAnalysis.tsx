/**
 * ============================================
 * EMPLOYEE PRIMES ANALYSIS
 * ============================================
 *
 * 2 blocs côte à côte analysant les primes des salariés :
 * 1. Plus grosse prime réalisée
 * 2. Plus faible prime réalisée
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingDown, Coins, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import type { EmployeeData } from '../../utils/employeeAnalysis';
import {
  getBestEmployeePrime,
  getWorstEmployeePrime,
  getEmployeePrimeRatio,
  getEmployeePrimeEconomy
} from '../../utils/employeeAnalysis';
import { formatCompactAmount, formatPercent, formatEcart } from '../../utils/indicatorAnalysis';

// ============================================
// TYPES
// ============================================

interface EmployeePrimesAnalysisProps {
  employees: EmployeeData[];
  departmentName: string;
  currency: Currency;
}

interface PrimeBlockProps {
  title: string;
  icon: React.ReactNode;
  employeeName: string;
  primeRealisee: string;
  primePrevue: string;
  ratio: string;
  economieEntreprise: string;
  type: 'success' | 'warning';
  delay?: number;
}

// ============================================
// PRIME BLOCK COMPONENT
// ============================================

const PrimeBlock: React.FC<PrimeBlockProps> = ({
  title,
  icon,
  employeeName,
  primeRealisee,
  primePrevue,
  ratio,
  economieEntreprise,
  type,
  delay = 0
}) => {
  const isSuccess = type === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-lg p-4",
        isSuccess
          ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-500/30"
          : "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-950/20 border-amber-300 dark:border-amber-500/30",
        "border shadow-md",
        isSuccess ? "hover:shadow-emerald-500/10" : "hover:shadow-amber-500/10",
        "transition-all duration-200"
      )}
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-20",
        isSuccess ? "bg-emerald-500/30" : "bg-amber-500/30"
      )} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-md",
            isSuccess ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
          )}>
            {icon}
          </div>
          <h4 className={cn(
            "text-xs font-bold uppercase tracking-wide",
            isSuccess ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
          )}>
            {title}
          </h4>
        </div>
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-[9px] font-bold border",
          isSuccess
            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
            : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
        )}>
          {isSuccess ? 'TOP PRIME' : 'A SURVEILLER'}
        </span>
      </div>

      {/* Employee name */}
      <p className="text-base font-semibold text-slate-900 dark:text-white mb-4 truncate" title={employeeName}>
        {employeeName}
      </p>

      {/* Prime comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={cn(
          "p-2.5 rounded-md",
          isSuccess ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-amber-100 dark:bg-amber-500/10"
        )}>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">Prime réalisée</p>
          <p className={cn(
            "text-lg font-mono font-bold",
            isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {primeRealisee}
          </p>
        </div>
        <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800/50">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1">Prime prévue</p>
          <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300">
            {primePrevue}
          </p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-100 dark:bg-slate-800/30">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400">Ratio:</span>
          <span className={cn(
            "text-sm font-bold",
            isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {ratio}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400">Économie:</span>
          <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5">
            {economieEntreprise}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmployeePrimesAnalysis({
  employees,
  departmentName,
  currency
}: EmployeePrimesAnalysisProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  if (employees.length === 0) {
    return null;
  }

  // Calculs
  const bestPrime = getBestEmployeePrime(employees);
  const worstPrime = getWorstEmployeePrime(employees);

  if (!bestPrime || !worstPrime) {
    return null;
  }

  // Calculs des métriques
  const bestRatio = getEmployeePrimeRatio(bestPrime);
  const bestEconomy = getEmployeePrimeEconomy(bestPrime);
  const worstRatio = getEmployeePrimeRatio(worstPrime);
  const worstEconomy = getEmployeePrimeEconomy(worstPrime);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Coins className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          ANALYSE PRIMES - SALARIÉS
        </h3>
        <span className="text-xs text-slate-500">({departmentName})</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PrimeBlock
          title="Plus Grosse Prime"
          icon={<Award className="w-3.5 h-3.5" />}
          employeeName={bestPrime.employeeName}
          primeRealisee={formatCompactAmount(bestPrime.realPrime, currencyConfig.symbol)}
          primePrevue={formatCompactAmount(bestPrime.prevPrime, currencyConfig.symbol)}
          ratio={formatPercent(bestRatio)}
          economieEntreprise={formatEcart(bestEconomy, currencyConfig.symbol)}
          type="success"
          delay={0}
        />

        <PrimeBlock
          title="Plus Faible Prime"
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          employeeName={worstPrime.employeeName}
          primeRealisee={formatCompactAmount(worstPrime.realPrime, currencyConfig.symbol)}
          primePrevue={formatCompactAmount(worstPrime.prevPrime, currencyConfig.symbol)}
          ratio={formatPercent(worstRatio)}
          economieEntreprise={formatEcart(worstEconomy, currencyConfig.symbol)}
          type="warning"
          delay={1}
        />
      </div>
    </div>
  );
}
