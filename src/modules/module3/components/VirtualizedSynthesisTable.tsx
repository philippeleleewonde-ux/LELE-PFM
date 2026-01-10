/**
 * ============================================
 * VIRTUALIZED SYNTHESIS TABLE
 * ============================================
 *
 * Composant optimisé utilisant @tanstack/react-virtual
 * pour ne rendre que les lignes visibles dans le viewport.
 *
 * PERFORMANCE: Support 10K+ salariés en ne rendant que ~15 lignes visibles
 */

import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
export interface EmployeeScore {
  employee: {
    employeeId: string;
    employeeName: string;
    professionalCategory: string;
  };
  empTotalEco: number;
  empTotalPPR: number;
  empTotalPertes: number;
  hasActivityData: boolean;
  scoresPertesEn: number;
  partPrime: number;
  partTresorerie: number;
  contributionPct: number;
  trancheNote: number;
  triTrancheNote: number;
  triN2TrancheNote: number;
  scorePrimeTotal: number;
  scoreNoteTotalPct: number;
  tauxEcoByIndicator: Record<string, number>;
  totalTauxEco: number;
}

export interface EligibilityStats {
  totalEmployees: number;
  eligibleEmployees: number;
  nonEligibleEmployees: number;
  totalPertesEligibles: number;
}

export interface GlobalTotals {
  grandTotalObjectif: number;
  grandTotalEconomies: number;
  fluxTresorerie: number;
  sortiesPrimes: number;
  scoreNoteTotalPct: number;
}

interface VirtualizedSynthesisTableProps {
  employeeScores: EmployeeScore[];
  eligibilityStats: EligibilityStats;
  globalTotals: GlobalTotals;
  currencySymbol: string;
}

// Indicateurs configuration
const INDICATEURS = [
  { key: 'abs', label: 'ABS', fullLabel: 'Absentéisme' },
  { key: 'qd', label: 'QD', fullLabel: 'Défaut Qualité' },
  { key: 'oa', label: 'AT', fullLabel: 'Accident Travail' },
  { key: 'ddp', label: 'EPD', fullLabel: 'Écart Productivité Directe' },
  { key: 'ekh', label: 'ESF', fullLabel: 'Écart Savoir Faire' }
] as const;

// Composant principal virtualisé
export function VirtualizedSynthesisTable({
  employeeScores,
  eligibilityStats,
  globalTotals,
  currencySymbol
}: VirtualizedSynthesisTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Trier les employés par contribution décroissante
  const sortedScores = useMemo(() => {
    return [...employeeScores].sort((a, b) => b.contributionPct - a.contributionPct);
  }, [employeeScores]);

  const rowVirtualizer = useVirtualizer({
    count: sortedScores.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-4">
      {/* Bandeau statistiques */}
      <div className="p-4 bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/30 rounded-lg border border-slate-200 dark:border-slate-700 mx-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">
            Statistiques d'éligibilité (Conformité Audit)
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-2 bg-white/50 dark:bg-slate-700/50 rounded">
            <span className="text-muted-foreground">Total salariés:</span>
            <span className="ml-2 font-bold">{eligibilityStats.totalEmployees}</span>
          </div>
          <div className="p-2 bg-green-100/50 dark:bg-green-900/30 rounded">
            <span className="text-green-700 dark:text-green-400">Éligibles:</span>
            <span className="ml-2 font-bold text-green-700 dark:text-green-400">
              {eligibilityStats.eligibleEmployees}
            </span>
          </div>
          <div className="p-2 bg-slate-100/50 dark:bg-slate-700/50 rounded">
            <span className="text-slate-600 dark:text-slate-400">Non éligibles:</span>
            <span className="ml-2 font-bold">{eligibilityStats.nonEligibleEmployees}</span>
          </div>
          <div className="p-2 bg-amber-100/50 dark:bg-amber-900/30 rounded">
            <span className="text-amber-700 dark:text-amber-400">Primes totales:</span>
            <span className="ml-2 font-bold text-amber-700 dark:text-amber-400">
              {globalTotals.sortiesPrimes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}
            </span>
          </div>
        </div>
      </div>

      {/* Résumé global */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-4 text-sm">
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            Total Économies: {globalTotals.grandTotalEconomies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}
          </Badge>
          <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">
            Flux Trésorerie (67%): {globalTotals.fluxTresorerie.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}
          </Badge>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            Sorties Primes (33%): {globalTotals.sortiesPrimes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}
          </Badge>
        </div>
      </div>

      {/* Tableau virtualisé */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Synthèse par salarié (trié par contribution décroissante)
        </h3>

        {/* En-tête fixe */}
        <div className="overflow-x-auto border rounded-t-lg">
          <table className="w-full text-xs border-collapse" style={{ minWidth: '1600px' }}>
            <thead className="bg-indigo-500/10 dark:bg-indigo-900/30">
              <tr className="border-b-2 border-indigo-500/30">
                <th className="text-left py-2 px-2 font-semibold whitespace-nowrap border-r" style={{ width: '12%' }}>
                  Nom du salarié
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r" style={{ width: '5%' }}>
                  Cat.
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r bg-orange-100/50 dark:bg-orange-900/20" style={{ width: '5%' }}>
                  <TooltipProvider><Tooltip><TooltipTrigger>Pertes%</TooltipTrigger>
                    <TooltipContent><p>Scores - Pertes constatées en %</p></TooltipContent>
                  </Tooltip></TooltipProvider>
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r bg-amber-100/50 dark:bg-amber-900/20" style={{ width: '7%' }}>
                  Part Prime
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r bg-cyan-100/50 dark:bg-cyan-900/20" style={{ width: '7%' }}>
                  Part Tréso
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r bg-purple-100/50 dark:bg-purple-900/20" style={{ width: '5%' }}>
                  Contrib%
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r" style={{ width: '5%' }}>
                  Tranche%
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r" style={{ width: '5%' }}>
                  Tri-Tr
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r" style={{ width: '5%' }}>
                  TriN2
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r bg-green-100/50 dark:bg-green-900/20" style={{ width: '7%' }}>
                  Score-Prime
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r" style={{ width: '5%' }}>
                  ScoreNote%
                </th>
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r bg-green-200/50 dark:bg-green-800/20" style={{ width: '7%' }}>
                  Total Éco
                </th>
                {INDICATEURS.map(ind => (
                  <th key={ind.key} className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r" style={{ width: '4%' }}>
                    Tx{ind.label}
                  </th>
                ))}
                <th className="text-center py-2 px-2 font-semibold whitespace-nowrap bg-slate-200/50 dark:bg-slate-700/50" style={{ width: '5%' }}>
                  TotalTx
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Corps virtualisé */}
        <div
          ref={parentRef}
          className="overflow-auto border-x border-b rounded-b-lg"
          style={{ height: '450px' }}
        >
          <table className="w-full text-xs border-collapse" style={{ minWidth: '1600px' }}>
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow) => {
                const empScore = sortedScores[virtualRow.index];
                const isEven = virtualRow.index % 2 === 0;

                return (
                  <tr
                    key={empScore.employee.employeeId}
                    className={cn(
                      "border-b hover:bg-indigo-500/5 transition-colors absolute w-full",
                      isEven && "bg-muted/20",
                      !empScore.hasActivityData && "opacity-50"
                    )}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {/* COL 1: Nom */}
                    <td className="py-2 px-2 font-medium border-r" style={{ width: '12%' }}>
                      {empScore.employee.employeeName}
                      {!empScore.hasActivityData && (
                        <Badge variant="outline" className="ml-1 text-[9px] bg-slate-100 text-slate-500 py-0">
                          N/A
                        </Badge>
                      )}
                    </td>
                    {/* COL 2: Catégorie */}
                    <td className="py-2 px-2 text-center border-r" style={{ width: '5%' }}>
                      {empScore.employee.professionalCategory || '-'}
                    </td>
                    {/* COL 3: Scores Pertes % */}
                    <td className="py-2 px-2 text-center border-r bg-orange-50/30 dark:bg-orange-900/10" style={{ width: '5%' }}>
                      {empScore.scoresPertesEn.toFixed(2)}%
                    </td>
                    {/* COL 4: Part Prime */}
                    <td className="py-2 px-2 text-right border-r bg-amber-50/30 dark:bg-amber-900/10 font-medium text-amber-700 dark:text-amber-300" style={{ width: '7%' }}>
                      {empScore.partPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* COL 5: Part Tréso */}
                    <td className="py-2 px-2 text-right border-r bg-cyan-50/30 dark:bg-cyan-900/10 font-medium text-cyan-700 dark:text-cyan-300" style={{ width: '7%' }}>
                      {empScore.partTresorerie.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* COL 6: Contrib % */}
                    <td className="py-2 px-2 text-center border-r bg-purple-50/30 dark:bg-purple-900/10" style={{ width: '5%' }}>
                      {empScore.contributionPct.toFixed(3)}%
                    </td>
                    {/* COL 7: Tranche % */}
                    <td className="py-2 px-2 text-center border-r" style={{ width: '5%' }}>
                      {empScore.trancheNote.toFixed(2)}%
                    </td>
                    {/* COL 8: Tri-Tranche */}
                    <td className="py-2 px-2 text-center border-r" style={{ width: '5%' }}>
                      {empScore.triTrancheNote.toFixed(3)}
                    </td>
                    {/* COL 9: Tri N°2 */}
                    <td className="py-2 px-2 text-center border-r" style={{ width: '5%' }}>
                      {empScore.triN2TrancheNote.toFixed(3)}
                    </td>
                    {/* COL 10: Score-Prime */}
                    <td className="py-2 px-2 text-right border-r bg-green-50/30 dark:bg-green-900/10" style={{ width: '7%' }}>
                      {empScore.scorePrimeTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* COL 11: Score Note % */}
                    <td className="py-2 px-2 text-center border-r" style={{ width: '5%' }}>
                      {empScore.scoreNoteTotalPct.toFixed(2)}%
                    </td>
                    {/* COL 12: Total Éco */}
                    <td className="py-2 px-2 text-right border-r bg-green-100/30 dark:bg-green-800/10 font-semibold text-green-700 dark:text-green-300" style={{ width: '7%' }}>
                      {empScore.empTotalEco.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* COL 13-17: Taux Économie par indicateur */}
                    {INDICATEURS.map(ind => (
                      <td key={ind.key} className="py-2 px-2 text-center border-r" style={{ width: '4%' }}>
                        {((empScore.tauxEcoByIndicator[ind.key] || 0) * 100).toFixed(1)}%
                      </td>
                    ))}
                    {/* COL 18: Total Taux */}
                    <td className="py-2 px-2 text-center font-semibold bg-slate-100/50 dark:bg-slate-800/50" style={{ width: '5%' }}>
                      {(empScore.totalTauxEco * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Info virtualisation */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          {sortedScores.length} salariés (virtualisé - seules les lignes visibles sont rendues)
        </p>
      </div>
    </div>
  );
}

export default VirtualizedSynthesisTable;
