/**
 * ============================================
 * INDICATOR EMPLOYEE CHARTS
 * ============================================
 *
 * 2 graphiques pour visualiser la maîtrise d'un indicateur :
 * 1. Barres horizontales - Top 10 salariés par économies
 * 2. Donut - Répartition des performances (Excellent/Bon/Moyen/Faible)
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';

interface EmployeeIndicatorData {
  employeeName: string;
  economiesRealisees: number;
  objectif: number;
  progressPercent: number;
}

interface IndicatorEmployeeChartsProps {
  employees: EmployeeIndicatorData[];
  indicatorName: string;
  indicatorColor: string;
  currency: Currency;
}

export default function IndicatorEmployeeCharts({
  employees,
  indicatorName,
  indicatorColor,
  currency
}: IndicatorEmployeeChartsProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  // Top 10 salariés par économies
  const top10 = useMemo(() => {
    return [...employees]
      .sort((a, b) => b.economiesRealisees - a.economiesRealisees)
      .slice(0, 10);
  }, [employees]);

  const maxEconomies = top10[0]?.economiesRealisees || 1;

  // Répartition des performances
  const distribution = useMemo(() => {
    const excellent = employees.filter(e => e.progressPercent >= 80).length;
    const bon = employees.filter(e => e.progressPercent >= 50 && e.progressPercent < 80).length;
    const moyen = employees.filter(e => e.progressPercent >= 25 && e.progressPercent < 50).length;
    const faible = employees.filter(e => e.progressPercent < 25).length;
    const total = employees.length || 1;

    return {
      excellent: { count: excellent, pct: (excellent / total) * 100 },
      bon: { count: bon, pct: (bon / total) * 100 },
      moyen: { count: moyen, pct: (moyen / total) * 100 },
      faible: { count: faible, pct: (faible / total) * 100 }
    };
  }, [employees]);

  // Classes de couleur avec support light/dark mode
  const colorClasses: Record<string, { bar: string; light: string; text: string }> = {
    orange: { bar: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
    rose: { bar: 'bg-rose-500', light: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
    red: { bar: 'bg-red-500', light: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
    blue: { bar: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    purple: { bar: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
    cyan: { bar: 'bg-cyan-500', light: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
    pink: { bar: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400' }
  };

  const colors = colorClasses[indicatorColor] || colorClasses.cyan;

  if (employees.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Graphique 1: Barres horizontales - Top 10 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "rounded-lg p-4 border",
          "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-950/30",
          "border-slate-200 dark:border-slate-700/50"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className={cn("w-4 h-4", colors.text)} />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            TOP 10 - {indicatorName.toUpperCase()}
          </h4>
        </div>

        <div className="space-y-2">
          {top10.map((emp, idx) => {
            const widthPct = maxEconomies > 0 ? (emp.economiesRealisees / maxEconomies) * 100 : 0;
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-900 dark:text-white truncate" title={emp.employeeName}>
                      {emp.employeeName}
                    </span>
                    <span className={cn("text-xs font-mono font-bold", colors.text)}>
                      {emp.economiesRealisees >= 1000
                        ? `${(emp.economiesRealisees / 1000).toFixed(1)}K`
                        : emp.economiesRealisees.toFixed(0)} {currencyConfig.symbol}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ delay: idx * 0.05, duration: 0.5 }}
                      className={cn("h-full rounded-full", colors.bar)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Graphique 2: Donut de répartition */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "rounded-lg p-4 border",
          "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-950/30",
          "border-slate-200 dark:border-slate-700/50"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChart className={cn("w-4 h-4", colors.text)} />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            RÉPARTITION PERFORMANCES
          </h4>
        </div>

        <div className="flex items-center gap-6">
          {/* Donut SVG */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background circle - adapté au mode */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="12"
              />

              {/* Segments */}
              {(() => {
                let offset = 0;
                const segments = [
                  { pct: distribution.excellent.pct, color: '#10b981' },
                  { pct: distribution.bon.pct, color: '#f59e0b' },
                  { pct: distribution.moyen.pct, color: '#f97316' },
                  { pct: distribution.faible.pct, color: '#ef4444' }
                ];

                return segments.map((seg, i) => {
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -(offset / 100) * circumference;
                  offset += seg.pct;

                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{employees.length}</span>
            </div>
          </div>

          {/* Légende */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Excellent (&ge;80%)</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{distribution.excellent.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Bon (50-79%)</span>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{distribution.bon.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Moyen (25-49%)</span>
              </div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{distribution.moyen.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Faible (&lt;25%)</span>
              </div>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{distribution.faible.count}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
