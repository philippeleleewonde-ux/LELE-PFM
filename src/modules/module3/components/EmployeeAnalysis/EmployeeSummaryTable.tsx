/**
 * ============================================
 * EMPLOYEE SUMMARY TABLE
 * ============================================
 *
 * Tableau récapitulatif des champions par indicateur
 * avec identification du salarié le plus polyvalent
 * et celui qui a le plus besoin d'accompagnement.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle,
  AlertTriangle,
  Zap,
  Clock,
  Target,
  Trophy,
  Users,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmployeeData, IndicatorKey } from '../../utils/employeeAnalysis';
import { getIndicatorSummary, getMostVersatileEmployee } from '../../utils/employeeAnalysis';

// ============================================
// TYPES
// ============================================

interface EmployeeSummaryTableProps {
  employees: EmployeeData[];
  departmentName: string;
}

// ============================================
// INDICATOR ICONS
// ============================================

const INDICATOR_ICONS: Record<IndicatorKey, typeof UserCircle> = {
  absenteisme: UserCircle,
  defautsQualite: AlertTriangle,
  accidentsTravail: Zap,
  ecartProductivite: Clock,
  ecartKnowHow: Target
};

const INDICATOR_COLORS: Record<IndicatorKey, string> = {
  absenteisme: 'text-orange-400',
  defautsQualite: 'text-pink-400',
  accidentsTravail: 'text-red-400',
  ecartProductivite: 'text-cyan-400',
  ecartKnowHow: 'text-purple-400'
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmployeeSummaryTable({
  employees,
  departmentName
}: EmployeeSummaryTableProps) {
  if (employees.length === 0) {
    return null;
  }

  const summary = getIndicatorSummary(employees);
  const versatility = getMostVersatileEmployee(employees);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-lg overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-indigo-900/20 to-indigo-950/10"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">
            RÉCAPITULATIF - SALARIÉS
          </h3>
          <span className="text-xs text-slate-400">({departmentName})</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">
          <Users className="w-3 h-3" />
          <span className="text-xs font-medium">{employees.length} salariés</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-indigo-900/30 text-indigo-200">
              <th className="text-left py-2.5 px-4 font-semibold">Indicateur</th>
              <th className="text-left py-2.5 px-4 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  Champion
                </div>
              </th>
              <th className="text-left py-2.5 px-4 font-semibold">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  À Accompagner
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, idx) => {
              const IconComponent = INDICATOR_ICONS[row.indicator];
              const iconColor = INDICATOR_COLORS[row.indicator];

              return (
                <tr
                  key={row.indicator}
                  className={cn(
                    idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-indigo-900/10',
                    'hover:bg-indigo-800/20 transition-colors'
                  )}
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn("w-4 h-4", iconColor)} />
                      <span className="text-white font-medium">{row.indicatorLabel}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-emerald-400 font-medium">{row.champion}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-amber-400 font-medium">{row.alert}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with polyvalent summary */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border-t border-indigo-500/30 space-y-2">
        {versatility.mostVersatile && (
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">SALARIÉ LE PLUS POLYVALENT :</span>
            <span className="font-bold text-emerald-400">{versatility.mostVersatile.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              champion sur {versatility.mostVersatile.count} indicateur{versatility.mostVersatile.count > 1 ? 's' : ''}
            </span>
          </div>
        )}
        {versatility.needsMostSupport && (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">SALARIÉ À ACCOMPAGNER :</span>
            <span className="font-bold text-amber-400">{versatility.needsMostSupport.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              en alerte sur {versatility.needsMostSupport.count} indicateur{versatility.needsMostSupport.count > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
