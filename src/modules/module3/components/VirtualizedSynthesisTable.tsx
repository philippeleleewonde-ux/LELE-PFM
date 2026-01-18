/**
 * ============================================
 * VIRTUALIZED SYNTHESIS TABLE
 * ============================================
 *
 * Composant optimisé utilisant @tanstack/react-virtual
 * pour ne rendre que les lignes visibles dans le viewport.
 *
 * UTILISE CSS GRID pour garantir l'alignement parfait des colonnes
 * avec la virtualisation (position absolute).
 *
 * PERFORMANCE: Support 10K+ salariés en ne rendant que ~15 lignes visibles
 */

import React, { useRef, useMemo, useCallback } from 'react';
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

// Configuration des colonnes avec largeurs fixes en pixels (total ~1600px)
const COLUMN_WIDTHS = {
  nom: 180,        // 12%
  cat: 75,         // 5%
  pertes: 75,      // 5%
  partPrime: 100,  // 7%
  partTreso: 100,  // 7%
  contrib: 75,     // 5%
  tranche: 75,     // 5%
  triTr: 75,       // 5%
  triN2: 75,       // 5%
  scorePrime: 100, // 7%
  scoreNote: 80,   // 5%
  totalEco: 100,   // 7%
  txInd: 60,       // 4% x 5 = 300
  totalTx: 75,     // 5%
};

const TOTAL_WIDTH =
  COLUMN_WIDTHS.nom +
  COLUMN_WIDTHS.cat +
  COLUMN_WIDTHS.pertes +
  COLUMN_WIDTHS.partPrime +
  COLUMN_WIDTHS.partTreso +
  COLUMN_WIDTHS.contrib +
  COLUMN_WIDTHS.tranche +
  COLUMN_WIDTHS.triTr +
  COLUMN_WIDTHS.triN2 +
  COLUMN_WIDTHS.scorePrime +
  COLUMN_WIDTHS.scoreNote +
  COLUMN_WIDTHS.totalEco +
  (COLUMN_WIDTHS.txInd * 5) +
  COLUMN_WIDTHS.totalTx;

// Grid template columns
const GRID_TEMPLATE = `${COLUMN_WIDTHS.nom}px ${COLUMN_WIDTHS.cat}px ${COLUMN_WIDTHS.pertes}px ${COLUMN_WIDTHS.partPrime}px ${COLUMN_WIDTHS.partTreso}px ${COLUMN_WIDTHS.contrib}px ${COLUMN_WIDTHS.tranche}px ${COLUMN_WIDTHS.triTr}px ${COLUMN_WIDTHS.triN2}px ${COLUMN_WIDTHS.scorePrime}px ${COLUMN_WIDTHS.scoreNote}px ${COLUMN_WIDTHS.totalEco}px repeat(5, ${COLUMN_WIDTHS.txInd}px) ${COLUMN_WIDTHS.totalTx}px`;

// Composant principal virtualisé
export function VirtualizedSynthesisTable({
  employeeScores,
  eligibilityStats,
  globalTotals,
  currencySymbol
}: VirtualizedSynthesisTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Synchronisation du scroll horizontal entre header et body
  const handleBodyScroll = useCallback(() => {
    if (parentRef.current && headerRef.current) {
      headerRef.current.scrollLeft = parentRef.current.scrollLeft;
    }
  }, []);

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

      {/* Grille virtualisée avec CSS Grid */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Synthèse par salarié (trié par contribution décroissante)
        </h3>

        {/* Container scrollable */}
        <div className="border rounded-lg overflow-hidden">
          {/* Header fixe avec scroll synchronisé */}
          <div
            ref={headerRef}
            className="overflow-x-auto"
            style={{ overflowY: 'hidden' }}
          >
            <div
              className="grid text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 border-b-2 border-indigo-500/30"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_TEMPLATE,
                minWidth: `${TOTAL_WIDTH}px`,
              }}
            >
              <div className="py-2 px-2 text-left border-r border-indigo-200 dark:border-indigo-700 truncate">
                Nom du salarié
              </div>
              <div className="py-2 px-2 text-center border-r border-indigo-200 dark:border-indigo-700">
                Cat.
              </div>
              <div className="py-2 px-2 text-center border-r border-indigo-200 dark:border-indigo-700 bg-orange-100 dark:bg-orange-900/50">
                <TooltipProvider><Tooltip><TooltipTrigger>Pertes%</TooltipTrigger>
                  <TooltipContent><p>Scores - Pertes constatées en %</p></TooltipContent>
                </Tooltip></TooltipProvider>
              </div>
              <div className="py-2 px-2 text-right border-r border-indigo-200 dark:border-indigo-700 bg-amber-100 dark:bg-amber-900/50">
                Part Prime
              </div>
              <div className="py-2 px-2 text-right border-r border-indigo-200 dark:border-indigo-700 bg-cyan-100 dark:bg-cyan-900/50">
                Part Tréso
              </div>
              <div className="py-2 px-2 text-center border-r border-indigo-200 dark:border-indigo-700 bg-purple-100 dark:bg-purple-900/50">
                Contrib%
              </div>
              <div className="py-2 px-2 text-center border-r border-indigo-200 dark:border-indigo-700">
                Tranche%
              </div>
              <div className="py-2 px-2 text-center border-r border-indigo-200 dark:border-indigo-700">
                Tri-Tr
              </div>
              <div className="py-2 px-2 text-center border-r border-indigo-200 dark:border-indigo-700">
                TriN2
              </div>
              <div className="py-2 px-2 text-right border-r border-indigo-200 dark:border-indigo-700 bg-green-100 dark:bg-green-900/50">
                Score-Prime
              </div>
              <div className="py-2 px-2 text-center border-r border-indigo-200 dark:border-indigo-700">
                ScoreNote%
              </div>
              <div className="py-2 px-2 text-right border-r border-indigo-200 dark:border-indigo-700 bg-green-200 dark:bg-green-800/50">
                Total Éco
              </div>
              {INDICATEURS.map(ind => (
                <div key={ind.key} className="py-2 px-1 text-center border-r border-indigo-200 dark:border-indigo-700 text-[10px]">
                  Tx{ind.label}
                </div>
              ))}
              <div className="py-2 px-2 text-center bg-slate-200 dark:bg-slate-700">
                TotalTx
              </div>
            </div>
          </div>

          {/* Body virtualisé avec scroll synchronisé */}
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{ height: '450px' }}
            onScroll={handleBodyScroll}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: `${TOTAL_WIDTH}px`,
                minWidth: `${TOTAL_WIDTH}px`,
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow) => {
                const empScore = sortedScores[virtualRow.index];
                const isEven = virtualRow.index % 2 === 0;

                return (
                  <div
                    key={empScore.employee.employeeId}
                    className={cn(
                      "grid text-xs border-b border-slate-200 dark:border-slate-700 hover:bg-indigo-500/5 transition-colors absolute left-0 right-0",
                      isEven && "bg-muted/20",
                      !empScore.hasActivityData && "opacity-50"
                    )}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: GRID_TEMPLATE,
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      width: `${TOTAL_WIDTH}px`,
                    }}
                  >
                    {/* COL 1: Nom */}
                    <div className="py-2 px-2 font-medium border-r border-slate-200 dark:border-slate-700 truncate flex items-center">
                      <span className="truncate">{empScore.employee.employeeName}</span>
                      {!empScore.hasActivityData && (
                        <Badge variant="outline" className="ml-1 text-[9px] bg-slate-100 text-slate-500 py-0 flex-shrink-0">
                          N/A
                        </Badge>
                      )}
                    </div>
                    {/* COL 2: Catégorie */}
                    <div className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 truncate flex items-center justify-center">
                      {empScore.employee.professionalCategory || '-'}
                    </div>
                    {/* COL 3: Scores Pertes % */}
                    <div className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 bg-orange-50/30 dark:bg-orange-900/10 flex items-center justify-center">
                      {empScore.scoresPertesEn.toFixed(2)}%
                    </div>
                    {/* COL 4: Part Prime */}
                    <div className="py-2 px-2 text-right border-r border-slate-200 dark:border-slate-700 bg-amber-50/30 dark:bg-amber-900/10 font-medium text-amber-700 dark:text-amber-300 flex items-center justify-end">
                      {empScore.partPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {/* COL 5: Part Tréso */}
                    <div className="py-2 px-2 text-right border-r border-slate-200 dark:border-slate-700 bg-cyan-50/30 dark:bg-cyan-900/10 font-medium text-cyan-700 dark:text-cyan-300 flex items-center justify-end">
                      {empScore.partTresorerie.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {/* COL 6: Contrib % */}
                    <div className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center justify-center">
                      {empScore.contributionPct.toFixed(3)}%
                    </div>
                    {/* COL 7: Tranche % */}
                    <div className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {empScore.trancheNote.toFixed(2)}%
                    </div>
                    {/* COL 8: Tri-Tranche */}
                    <div className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {empScore.triTrancheNote.toFixed(3)}
                    </div>
                    {/* COL 9: Tri N°2 */}
                    <div className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {empScore.triN2TrancheNote.toFixed(3)}
                    </div>
                    {/* COL 10: Score-Prime */}
                    <div className="py-2 px-2 text-right border-r border-slate-200 dark:border-slate-700 bg-green-50/30 dark:bg-green-900/10 flex items-center justify-end">
                      {empScore.scorePrimeTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {/* COL 11: Score Note % */}
                    <div className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {empScore.scoreNoteTotalPct.toFixed(2)}%
                    </div>
                    {/* COL 12: Total Éco */}
                    <div className="py-2 px-2 text-right border-r border-slate-200 dark:border-slate-700 bg-green-100/30 dark:bg-green-800/10 font-semibold text-green-700 dark:text-green-300 flex items-center justify-end">
                      {empScore.empTotalEco.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {/* COL 13-17: Taux Économie par indicateur */}
                    {INDICATEURS.map(ind => (
                      <div key={ind.key} className="py-2 px-1 text-center border-r border-slate-200 dark:border-slate-700 text-[10px] flex items-center justify-center">
                        {((empScore.tauxEcoByIndicator[ind.key] || 0) * 100).toFixed(1)}%
                      </div>
                    ))}
                    {/* COL 18: Total Taux */}
                    <div className="py-2 px-2 text-center font-semibold bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center">
                      {(empScore.totalTauxEco * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
