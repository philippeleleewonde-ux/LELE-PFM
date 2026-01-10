/**
 * ============================================
 * EMPLOYEE ANALYSIS SECTION
 * ============================================
 *
 * Container principal pour l'analyse des salariés
 * au sein d'un département. Contient :
 * - Toggle pour ouvrir/fermer la section
 * - Top Performers & Alertes (6 blocs)
 * - Analyse Primes (2 blocs)
 * - Maîtrise des Indicateurs (5 cartes)
 * - Tableau Récapitulatif
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Currency } from '@/modules/module1/types';
import { transformEmployeePerformanceData } from '../../utils/employeeAnalysis';

import EmployeeTopPerformers from './EmployeeTopPerformers';
import EmployeePrimesAnalysis from './EmployeePrimesAnalysis';
import EmployeeIndicatorCards from './EmployeeIndicatorCards';
import EmployeeSummaryTable from './EmployeeSummaryTable';

// ============================================
// TYPES
// ============================================

interface EmployeePerformanceData {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  employeePerformance: {
    objectif: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
  };
  indicators?: Record<string, {
    economiesRealisees?: number;
  }>;
}

interface EmployeeAnalysisSectionProps {
  employees: EmployeePerformanceData[];
  departmentName: string;
  departmentId: string;
  globalTotalEconomies: number;
  currency: Currency;
  defaultExpanded?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmployeeAnalysisSection({
  employees,
  departmentName,
  departmentId,
  globalTotalEconomies,
  currency,
  defaultExpanded = false
}: EmployeeAnalysisSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Transformer les données employés vers le format EmployeeData
  const transformedEmployees = useMemo(() => {
    return employees.map(emp => transformEmployeePerformanceData(emp, globalTotalEconomies));
  }, [employees, globalTotalEconomies]);

  if (employees.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-indigo-200/30 dark:border-indigo-800/30">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "bg-gradient-to-r from-violet-500/10 to-indigo-500/10",
          "hover:from-violet-500/20 hover:to-indigo-500/20",
          "transition-colors cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-violet-500/20 text-violet-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-white">
            Analyse des salariés
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
            <Users className="w-3 h-3" />
            <span className="text-xs font-medium">{employees.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {isExpanded ? 'Réduire' : 'Développer'}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-violet-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-violet-400" />
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
            <div className="p-4 space-y-6 bg-gradient-to-br from-slate-900/50 to-slate-950/30">
              {/* Top Performers & Alerts */}
              <EmployeeTopPerformers
                employees={transformedEmployees}
                departmentName={departmentName}
                currency={currency}
              />

              {/* Primes Analysis */}
              <EmployeePrimesAnalysis
                employees={transformedEmployees}
                departmentName={departmentName}
                currency={currency}
              />

              {/* Indicator Cards */}
              <EmployeeIndicatorCards
                employees={transformedEmployees}
                departmentName={departmentName}
                currency={currency}
              />

              {/* Summary Table */}
              <EmployeeSummaryTable
                employees={transformedEmployees}
                departmentName={departmentName}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
