/**
 * ============================================
 * CHAMPIONS SUMMARY TABLE
 * ============================================
 *
 * Tableau récapitulatif compact des champions et alertes par indicateur.
 * Identifie le département le plus polyvalent et celui nécessitant le plus d'accompagnement.
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  AlertTriangle,
  UserCircle,
  Zap,
  Clock,
  Target,
  Medal,
  HeartHandshake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IndicatorAnalysisResult, ChampionshipCount } from '../utils/indicatorAnalysis';
import { countChampionships, analyzeIndicator } from '../utils/indicatorAnalysis';

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
  }>;
}

interface ChampionsSummaryTableProps {
  employeePerformances: EmployeePerformanceData[];
}

// ============================================
// INDICATOR CONFIGS (same as IndicatorRiskAnalysis)
// ============================================

const INDICATOR_CONFIGS = [
  { key: 'abs', name: 'Absentéisme', icon: UserCircle, iconColor: 'text-orange-600 dark:text-orange-400' },
  { key: 'qd', name: 'Défauts de Qualité', icon: AlertTriangle, iconColor: 'text-pink-600 dark:text-pink-400' },
  { key: 'oa', name: 'Accidents de Travail', icon: Zap, iconColor: 'text-red-600 dark:text-red-400' },
  { key: 'ddp', name: 'Écart de Productivité', icon: Clock, iconColor: 'text-cyan-600 dark:text-cyan-400' },
  { key: 'ekh', name: 'Écart de Know-How', icon: Target, iconColor: 'text-purple-600 dark:text-purple-400' }
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function ChampionsSummaryTable({
  employeePerformances
}: ChampionsSummaryTableProps) {
  // Calculer les analyses pour chaque indicateur
  const { indicatorAnalyses, championshipStats } = useMemo(() => {
    const analyses: IndicatorAnalysisResult[] = [];

    INDICATOR_CONFIGS.forEach(config => {
      // Agréger les données par département
      const deptMap = new Map<string, {
        department: string;
        departmentId: string;
        salaries: number;
        economiesRealisees: number;
        objectif: number;
        prevPrime: number;
        prevTreso: number;
        realPrime: number;
        realTreso: number;
      }>();

      employeePerformances.forEach(emp => {
        const indData = emp.indicators?.[config.key];
        if (!indData) return;

        const existing = deptMap.get(emp.businessLineId);
        if (existing) {
          existing.salaries += 1;
          existing.economiesRealisees += indData.economiesRealisees || 0;
          existing.objectif += indData.objectif || 0;
        } else {
          deptMap.set(emp.businessLineId, {
            department: emp.businessLineName,
            departmentId: emp.businessLineId,
            salaries: 1,
            economiesRealisees: indData.economiesRealisees || 0,
            objectif: indData.objectif || 0,
            prevPrime: 0,
            prevTreso: 0,
            realPrime: 0,
            realTreso: 0
          });
        }
      });

      const deptData = Array.from(deptMap.values());
      const analysis = analyzeIndicator(deptData, config.key, config.name);
      if (analysis) {
        analyses.push(analysis);
      }
    });

    const stats = countChampionships(analyses);

    return {
      indicatorAnalyses: analyses,
      championshipStats: stats
    };
  }, [employeePerformances]);

  if (indicatorAnalyses.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Medal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          RÉCAPITULATIF - MAÎTRISE DES INDICATEURS
        </h2>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50">
        <table className="w-full text-sm" aria-label="Champions et employés à surveiller par indicateur">
          <caption className="sr-only">
            Tableau récapitulatif des meilleurs performeurs (champions) et des employés nécessitant un suivi pour chaque indicateur de performance
          </caption>
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
              <th className="text-left py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                INDICATEUR
              </th>
              <th className="text-left py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" aria-hidden="true" />
                  CHAMPION
                </div>
              </th>
              <th className="text-left py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  À SURVEILLER
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {INDICATOR_CONFIGS.map((config, index) => {
              const analysis = indicatorAnalyses.find(a => a.indicatorKey === config.key);
              const IconComponent = config.icon;

              return (
                <tr
                  key={config.key}
                  className={cn(
                    index % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/30' : 'bg-white dark:bg-slate-800/10',
                    'hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors'
                  )}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn("w-4 h-4", config.iconColor)} />
                      <span className="text-slate-900 dark:text-white font-medium">{config.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {analysis ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {analysis.best.department}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {analysis ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {analysis.worst.department}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Most Polyvalent */}
            {championshipStats.mostPolyvalent && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                  <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Département le plus polyvalent
                  </p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {championshipStats.mostPolyvalent.department}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {championshipStats.mostPolyvalent.count}x champion sur 5 indicateurs
                  </p>
                </div>
              </div>
            )}

            {/* Needs Most Support */}
            {championshipStats.needsMostSupport && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                  <HeartHandshake className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Département à accompagner
                  </p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {championshipStats.needsMostSupport.department}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {championshipStats.needsMostSupport.count}x en alerte sur 5 indicateurs
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
