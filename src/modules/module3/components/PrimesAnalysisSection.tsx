/**
 * ============================================
 * PRIMES ANALYSIS SECTION
 * ============================================
 *
 * Section avec 2 blocs analysant les primes :
 * 1. Plus grosse prime réalisée
 * 2. Plus faible prime réalisée
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingDown, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import type { DepartmentData } from '../utils/indicatorAnalysis';
import {
  getBestPrime,
  getWorstPrime,
  getPrimeRatio,
  getPrimeEconomy,
  formatCompactAmount,
  formatPercent,
  formatEcart
} from '../utils/indicatorAnalysis';

// ============================================
// TYPES
// ============================================

interface PrimesAnalysisSectionProps {
  departments: DepartmentData[];
  currency: Currency;
}

interface PrimeBlockProps {
  title: string;
  icon: React.ReactNode;
  department: string;
  primeRealisee: string;
  primePrevue: string;
  ratio: string;
  economieEntreprise: string;
  interpretation: string;
  type: 'success' | 'warning';
  delay?: number;
}

// ============================================
// PRIME BLOCK COMPONENT
// ============================================

const PrimeBlock: React.FC<PrimeBlockProps> = ({
  title,
  icon,
  department,
  primeRealisee,
  primePrevue,
  ratio,
  economieEntreprise,
  interpretation,
  type,
  delay = 0
}) => {
  const isSuccess = type === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-6",
        isSuccess
          ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-500/30"
          : "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-950/20 border-amber-300 dark:border-amber-500/30",
        "border shadow-lg",
        isSuccess ? "hover:shadow-emerald-500/10" : "hover:shadow-amber-500/10",
        "transition-all duration-200",
        "hover:transform hover:-translate-y-1"
      )}
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 dark:opacity-20",
        isSuccess ? "bg-emerald-500/30" : "bg-amber-500/30"
      )} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            isSuccess ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
          )}>
            {icon}
          </div>
          <h3 className={cn(
            "text-sm font-bold uppercase tracking-wide",
            isSuccess ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
          )}>
            {title}
          </h3>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold border",
          isSuccess
            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
            : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
        )}>
          {isSuccess ? 'TOP PRIME' : 'A SURVEILLER'}
        </span>
      </div>

      {/* Department name */}
      <p className="text-xl font-semibold text-slate-900 dark:text-white mb-5 truncate" title={department}>
        {department}
      </p>

      {/* Prime comparison */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className={cn(
          "p-3 rounded-lg",
          isSuccess ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-amber-100 dark:bg-amber-500/10"
        )}>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Prime réalisée</p>
          <p className={cn(
            "text-xl font-mono font-bold",
            isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {primeRealisee}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Prime prévue</p>
          <p className="text-xl font-mono font-bold text-slate-700 dark:text-slate-300">
            {primePrevue}
          </p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/30 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Ratio:</span>
          <span className={cn(
            "text-lg font-bold",
            isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          )}>
            {ratio}
          </span>
        </div>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Économie entreprise:</span>
          <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
            {economieEntreprise}
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Interpretation */}
      <div className={cn(
        "px-3 py-2 rounded-lg text-sm",
        isSuccess ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
      )}>
        <span className="font-medium">{interpretation}</span>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function PrimesAnalysisSection({
  departments,
  currency
}: PrimesAnalysisSectionProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  // Calculs
  const bestPrime = getBestPrime(departments);
  const worstPrime = getWorstPrime(departments);

  if (!bestPrime || !worstPrime) {
    return null;
  }

  // Calculs des métriques
  const bestRatio = getPrimeRatio(bestPrime);
  const bestEconomy = getPrimeEconomy(bestPrime);
  const worstRatio = getPrimeRatio(worstPrime);
  const worstEconomy = getPrimeEconomy(worstPrime);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Coins className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          ANALYSE PRIMES
        </h2>
      </div>

      {/* 2 Blocks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Block 1: Plus grosse prime */}
        <PrimeBlock
          title="Plus Grosse Prime Réalisée"
          icon={<Award className="w-4 h-4" />}
          department={bestPrime.name}
          primeRealisee={formatCompactAmount(bestPrime.totalRealPrime, currencyConfig.symbol)}
          primePrevue={formatCompactAmount(bestPrime.totalPrevPrime, currencyConfig.symbol)}
          ratio={formatPercent(bestRatio)}
          economieEntreprise={formatEcart(bestEconomy, currencyConfig.symbol)}
          interpretation="Économie pour l'entreprise"
          type="success"
          delay={0}
        />

        {/* Block 2: Plus faible prime */}
        <PrimeBlock
          title="Plus Faible Prime Réalisée"
          icon={<TrendingDown className="w-4 h-4" />}
          department={worstPrime.name}
          primeRealisee={formatCompactAmount(worstPrime.totalRealPrime, currencyConfig.symbol)}
          primePrevue={formatCompactAmount(worstPrime.totalPrevPrime, currencyConfig.symbol)}
          ratio={formatPercent(worstRatio)}
          economieEntreprise={formatEcart(worstEconomy, currencyConfig.symbol)}
          interpretation="Performance sous les attentes"
          type="warning"
          delay={1}
        />
      </div>
    </motion.section>
  );
}
