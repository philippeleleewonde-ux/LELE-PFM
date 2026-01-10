/**
 * ============================================
 * INDICATOR EMPLOYEE ANALYSIS
 * ============================================
 *
 * Analyse des salariés pour UN indicateur spécifique :
 * - 2 graphiques (barres + donut)
 * - Top Performer + Alerte (2 blocs) - avec gestion équitable des égalités
 * - Analyse Primes pour cet indicateur
 *
 * GESTION DES CAS D'ÉGALITÉ :
 * - Tous à 0€ : Message "Aucune économie réalisée"
 * - Tous égaux (>0) : Card "Performance Uniforme"
 * - Variance faible : Utilisation du progressPercent comme critère secondaire
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Users,
  BarChart3,
  Trophy,
  AlertTriangle,
  Award,
  TrendingDown,
  Equal,
  Info,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import { formatCompactAmount } from '../../utils/indicatorAnalysis';
import IndicatorEmployeeCharts from './IndicatorEmployeeCharts';

interface EmployeeIndicatorData {
  employeeId: string;
  employeeName: string;
  economiesRealisees: number;
  objectif: number;
  prevPrime: number;
  prevTreso: number;
  realPrime: number;
  realTreso: number;
  progressPercent: number;
}

interface IndicatorEmployeeAnalysisProps {
  employees: EmployeeIndicatorData[];
  departmentName: string;
  indicatorKey: string;
  indicatorName: string;
  indicatorColor: string;
  currency: Currency;
  defaultExpanded?: boolean;
}

// Types pour l'état des données
type DataStatus = 'normal' | 'all_zero' | 'all_equal' | 'low_variance';

interface AnalysisResult {
  status: DataStatus;
  best: EmployeeIndicatorData | null;
  worst: EmployeeIndicatorData | null;
  bestByPrime: EmployeeIndicatorData | null;
  worstByPrime: EmployeeIndicatorData | null;
  uniformValue: number;
  employeesAtSameLevel: number;
  totalEmployees: number;
  variance: number;
  bestByProgress: EmployeeIndicatorData | null;
  worstByProgress: EmployeeIndicatorData | null;
}

export default function IndicatorEmployeeAnalysis({
  employees,
  departmentName,
  indicatorKey,
  indicatorName,
  indicatorColor,
  currency,
  defaultExpanded = false
}: IndicatorEmployeeAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const currencyConfig = CURRENCY_CONFIG[currency];

  // Calculs avec détection d'égalité et variance
  const analysis = useMemo((): AnalysisResult | null => {
    if (employees.length === 0) return null;

    const economies = employees.map(e => e.economiesRealisees);
    const totalEmployees = employees.length;

    // Calcul de la variance
    const mean = economies.reduce((a, b) => a + b, 0) / totalEmployees;
    const variance = economies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totalEmployees;
    const stdDev = Math.sqrt(variance);

    // Détection des cas spéciaux
    const allZero = economies.every(e => e === 0);
    const uniqueValues = new Set(economies);
    const allEqual = uniqueValues.size === 1;
    const lowVariance = stdDev < (mean * 0.1) && mean > 0; // Écart-type < 10% de la moyenne

    // Compter les employés au même niveau que le max
    const maxEco = Math.max(...economies);
    const employeesAtSameLevel = economies.filter(e => e === maxEco).length;

    // Tri principal par économies, secondaire par progressPercent
    const sortedByEconomies = [...employees].sort((a, b) => {
      // Critère principal : économies réalisées (décroissant)
      if (b.economiesRealisees !== a.economiesRealisees) {
        return b.economiesRealisees - a.economiesRealisees;
      }
      // Critère secondaire : progressPercent (décroissant)
      return b.progressPercent - a.progressPercent;
    });

    // Tri par progressPercent uniquement
    const sortedByProgress = [...employees].sort((a, b) => b.progressPercent - a.progressPercent);

    // Tri par prime réalisée
    const sortedByPrimeAsc = [...employees].sort((a, b) => a.realPrime - b.realPrime);
    const sortedByPrimeDesc = [...employees].sort((a, b) => b.realPrime - a.realPrime);

    // Déterminer le statut
    let status: DataStatus = 'normal';
    if (allZero) {
      status = 'all_zero';
    } else if (allEqual) {
      status = 'all_equal';
    } else if (lowVariance && employeesAtSameLevel > totalEmployees * 0.5) {
      status = 'low_variance';
    }

    return {
      status,
      best: sortedByEconomies[0],
      worst: sortedByEconomies[sortedByEconomies.length - 1],
      bestByPrime: sortedByPrimeDesc[0],
      worstByPrime: sortedByPrimeAsc[0],
      uniformValue: allEqual ? economies[0] : mean,
      employeesAtSameLevel,
      totalEmployees,
      variance,
      bestByProgress: sortedByProgress[0],
      worstByProgress: sortedByProgress[sortedByProgress.length - 1]
    };
  }, [employees]);

  if (employees.length === 0 || !analysis) return null;

  // Classes de couleur avec support light/dark mode
  const colorClasses: Record<string, { bg: string; border: string; text: string; gradient: string; bgLight: string }> = {
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-500/10',
      border: 'border-orange-300 dark:border-orange-500/30',
      text: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-100 to-orange-50 dark:from-orange-500/10 dark:to-orange-950/10',
      bgLight: 'bg-orange-50 dark:bg-orange-500/20'
    },
    rose: {
      bg: 'bg-rose-100 dark:bg-rose-500/10',
      border: 'border-rose-300 dark:border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
      gradient: 'from-rose-100 to-rose-50 dark:from-rose-500/10 dark:to-rose-950/10',
      bgLight: 'bg-rose-50 dark:bg-rose-500/20'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-500/10',
      border: 'border-red-300 dark:border-red-500/30',
      text: 'text-red-600 dark:text-red-400',
      gradient: 'from-red-100 to-red-50 dark:from-red-500/10 dark:to-red-950/10',
      bgLight: 'bg-red-50 dark:bg-red-500/20'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-500/10',
      border: 'border-blue-300 dark:border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-blue-950/10',
      bgLight: 'bg-blue-50 dark:bg-blue-500/20'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-500/10',
      border: 'border-purple-300 dark:border-purple-500/30',
      text: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-100 to-purple-50 dark:from-purple-500/10 dark:to-purple-950/10',
      bgLight: 'bg-purple-50 dark:bg-purple-500/20'
    },
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-500/10',
      border: 'border-cyan-300 dark:border-cyan-500/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      gradient: 'from-cyan-100 to-cyan-50 dark:from-cyan-500/10 dark:to-cyan-950/10',
      bgLight: 'bg-cyan-50 dark:bg-cyan-500/20'
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-500/10',
      border: 'border-pink-300 dark:border-pink-500/30',
      text: 'text-pink-600 dark:text-pink-400',
      gradient: 'from-pink-100 to-pink-50 dark:from-pink-500/10 dark:to-pink-950/10',
      bgLight: 'bg-pink-50 dark:bg-pink-500/20'
    }
  };

  const colors = colorClasses[indicatorColor] || colorClasses.cyan;

  // Rendu des cards selon le statut des données
  const renderPerformanceCards = () => {
    // CAS 1: Tous à zéro - Aucune économie réalisée
    if (analysis.status === 'all_zero') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card informative - Aucune économie */}
          <div className={cn(
            "rounded-lg p-4 border col-span-1 md:col-span-2",
            "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/30",
            "border-slate-300 dark:border-slate-600/30"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-slate-200 dark:bg-slate-700/50">
                <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">Aucune Économie Réalisée</span>
                <p className="text-xs text-slate-500 dark:text-slate-500">sur l'indicateur {indicatorName}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Les {analysis.totalEmployees} salariés n'ont pas généré d'économies sur cet indicateur pour cette période.
            </p>

            {/* Afficher le meilleur par taux d'atteinte si disponible */}
            {analysis.bestByProgress && analysis.bestByProgress.progressPercent > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Meilleur taux d'atteinte objectif</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-900 dark:text-white">{analysis.bestByProgress.employeeName}</span>
                  <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {analysis.bestByProgress.progressPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // CAS 2: Tous égaux (>0) - Performance uniforme
    if (analysis.status === 'all_equal') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card Performance Uniforme */}
          <div className={cn(
            "rounded-lg p-4 border col-span-1 md:col-span-2",
            "bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-950/20",
            "border-indigo-300 dark:border-indigo-500/30"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-indigo-200 dark:bg-indigo-500/20">
                <Equal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase">Performance Uniforme</span>
                <p className="text-xs text-indigo-600 dark:text-indigo-400/70">Équité totale entre les salariés</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Économies par salarié</p>
                <p className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCompactAmount(analysis.uniformValue, currencyConfig.symbol)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Nombre de salariés</p>
                <p className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {analysis.totalEmployees}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tous les salariés ont réalisé exactement les mêmes économies sur {indicatorName}.
              Aucune différenciation n'est possible sur ce critère.
            </p>

            {/* Départage par progressPercent si variance existe */}
            {analysis.bestByProgress && analysis.worstByProgress &&
             analysis.bestByProgress.progressPercent !== analysis.worstByProgress.progressPercent && (
              <div className="mt-4 pt-3 border-t border-indigo-300 dark:border-indigo-500/20">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-2">
                  Départage par taux d'atteinte de l'objectif :
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/20 rounded-lg p-2 border border-emerald-300 dark:border-emerald-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Trophy className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase">Meilleur</span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white truncate">{analysis.bestByProgress.employeeName}</p>
                    <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {analysis.bestByProgress.progressPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-300 dark:border-amber-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase">À suivre</span>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white truncate">{analysis.worstByProgress.employeeName}</p>
                    <p className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                      {analysis.worstByProgress.progressPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // CAS 3: Variance faible - Afficher avec avertissement
    if (analysis.status === 'low_variance' && analysis.best && analysis.worst) {
      return (
        <div className="space-y-3">
          {/* Avertissement variance faible */}
          <div className={cn(
            "rounded-lg p-3 border",
            "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-950/10",
            "border-amber-300 dark:border-amber-500/20"
          )}>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">{analysis.employeesAtSameLevel}/{analysis.totalEmployees}</span> salariés
                ont des performances très proches. Le classement ci-dessous utilise le taux d'atteinte comme critère secondaire.
              </p>
            </div>
          </div>

          {/* Cards normales avec indication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderBestCard(analysis.best, true)}
            {renderWorstCard(analysis.worst, true)}
          </div>
        </div>
      );
    }

    // CAS 4: Normal - Variance suffisante
    if (analysis.best && analysis.worst) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderBestCard(analysis.best, false)}
          {renderWorstCard(analysis.worst, false)}
        </div>
      );
    }

    return null;
  };

  // Card "Meilleure Maîtrise"
  const renderBestCard = (employee: EmployeeIndicatorData, showSecondary: boolean) => (
    <div className={cn(
      "rounded-lg p-4 border",
      "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-950/20",
      "border-emerald-300 dark:border-emerald-500/30"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Meilleure Maîtrise</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{employee.employeeName}</p>
      <p className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
        {formatCompactAmount(employee.economiesRealisees, currencyConfig.symbol)}
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-400">économisés sur {indicatorName}</p>

      {/* Barre de progression */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
        </div>
        <span className="text-xs text-emerald-600 dark:text-emerald-400">100%</span>
      </div>

      {/* Indicateur secondaire si variance faible */}
      {showSecondary && (
        <div className="mt-2 pt-2 border-t border-emerald-300 dark:border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600 dark:text-slate-400">Taux d'atteinte objectif</span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {employee.progressPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Card "Attention Requise"
  const renderWorstCard = (employee: EmployeeIndicatorData, showSecondary: boolean) => {
    const relativePct = analysis?.best && analysis.best.economiesRealisees > 0
      ? (employee.economiesRealisees / analysis.best.economiesRealisees) * 100
      : 0;

    return (
      <div className={cn(
        "rounded-lg p-4 border",
        "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20",
        "border-amber-300 dark:border-amber-500/30"
      )}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Attention Requise</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{employee.employeeName}</p>
        <p className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
          {formatCompactAmount(employee.economiesRealisees, currencyConfig.symbol)}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">économisés sur {indicatorName}</p>

        {/* Barre de progression relative */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${relativePct}%` }}
            />
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {relativePct.toFixed(0)}%
          </span>
        </div>

        {/* Indicateur secondaire si variance faible */}
        {showSecondary && (
          <div className="mt-2 pt-2 border-t border-amber-300 dark:border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-600 dark:text-slate-400">Taux d'atteinte objectif</span>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                {employee.progressPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rendu des cards de primes avec gestion d'égalité
  const renderPrimeCards = () => {
    // Vérifier si les primes sont toutes égales
    const allPrimesEqual = analysis.bestByPrime && analysis.worstByPrime &&
      analysis.bestByPrime.realPrime === analysis.worstByPrime.realPrime;

    const allPrimesZero = analysis.bestByPrime && analysis.bestByPrime.realPrime === 0;

    if (allPrimesZero) {
      return (
        <div className={cn(
          "rounded-lg p-4 border",
          "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/30",
          "border-slate-300 dark:border-slate-600/30"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Aucune Prime Générée</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Aucun salarié n'a généré de prime sur l'indicateur {indicatorName} pour cette période.
          </p>
        </div>
      );
    }

    if (allPrimesEqual && analysis.bestByPrime) {
      return (
        <div className={cn(
          "rounded-lg p-4 border",
          "bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-950/10",
          "border-indigo-300 dark:border-indigo-500/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Equal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Primes Uniformes</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Tous les salariés ont la même prime sur cet indicateur.
          </p>
          <p className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {formatCompactAmount(analysis.bestByPrime.realPrime, currencyConfig.symbol)}
          </p>
        </div>
      );
    }

    // Affichage normal des primes
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Meilleure Prime */}
        {analysis.bestByPrime && (
          <div className={cn(
            "rounded-lg p-4 border",
            "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-950/10",
            "border-emerald-300 dark:border-emerald-500/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Meilleure Prime</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{analysis.bestByPrime.employeeName}</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCompactAmount(analysis.bestByPrime.realPrime, currencyConfig.symbol)}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">réalisée</p>
              </div>
              <div className="text-slate-400 dark:text-slate-600">→</div>
              <div>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                  {formatCompactAmount(analysis.bestByPrime.prevPrime, currencyConfig.symbol)}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">prévue</p>
              </div>
            </div>
          </div>
        )}

        {/* Plus Faible Prime */}
        {analysis.worstByPrime && (
          <div className={cn(
            "rounded-lg p-4 border",
            "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-950/10",
            "border-amber-300 dark:border-amber-500/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Plus Faible Prime</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{analysis.worstByPrime.employeeName}</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatCompactAmount(analysis.worstByPrime.realPrime, currencyConfig.symbol)}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">réalisée</p>
              </div>
              <div className="text-slate-400 dark:text-slate-600">→</div>
              <div>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                  {formatCompactAmount(analysis.worstByPrime.prevPrime, currencyConfig.symbol)}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">prévue</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("border-t", colors.border)}>
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "bg-gradient-to-r", colors.gradient,
          "hover:opacity-80 transition-opacity cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-md", colors.bg, colors.text)}>
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Analyse salariés - {indicatorName}
          </span>
          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full", colors.bgLight, colors.text)}>
            <Users className="w-3 h-3" />
            <span className="text-xs font-medium">{employees.length}</span>
          </div>
          {/* Badge de statut */}
          {analysis.status === 'all_zero' && (
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
              0 économies
            </span>
          )}
          {analysis.status === 'all_equal' && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium">
              Uniforme
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isExpanded ? 'Réduire' : 'Développer'}
          </span>
          {isExpanded ? (
            <ChevronDown className={cn("w-4 h-4", colors.text)} />
          ) : (
            <ChevronRight className={cn("w-4 h-4", colors.text)} />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900/50 dark:to-slate-950/30">
              {/* Graphiques - toujours affichés sauf si tous à zéro */}
              {analysis.status !== 'all_zero' && (
                <IndicatorEmployeeCharts
                  employees={employees}
                  indicatorName={indicatorName}
                  indicatorColor={indicatorColor}
                  currency={currency}
                />
              )}

              {/* Top Performer & Alerte - avec gestion d'égalité */}
              {renderPerformanceCards()}

              {/* Analyse Primes pour cet indicateur */}
              {renderPrimeCards()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
