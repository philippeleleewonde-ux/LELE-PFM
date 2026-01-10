/**
 * ============================================
 * VIRTUALIZED EKH TABLE
 * ============================================
 *
 * Composant optimisé utilisant @tanstack/react-virtual
 * pour ne rendre que les lignes visibles dans le viewport.
 *
 * PERFORMANCE: Au lieu de rendre 73 employés × 10 colonnes = 730 cellules,
 * on ne rend que ~15 lignes × 10 colonnes = 150 cellules (5× moins)
 */

import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
interface EKHData {
  coefficientCompetence: number;
  scoreFinancierN1: number;
  pertesConstateesN1: number;
  pprPrevuesN1: number;
  economiesRealiseesN1: number;
  pertesEnPourcentageN1: number;
  pertesConstateesRefN1: number;
  pertesN1PctRef: number;
  scoreFinancierN2: number;
  pertesConstateesN2: number;
  pprPrevuesN2: number;
  economiesRealiseesN2: number;
  pertesEnPourcentageN2: number;
  pertesConstateesRefN2: number;
  pertesN2PctRef: number;
  pertesConstateesTotal: number;
}

interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  category: string;
  incapacityRate: number;
  coefficientCompetence: number;
}

interface BusinessLine {
  id: string;
  name: string;
}

interface VirtualizedEKHTableProps {
  level: '1' | '2' | 'total';
  employees: EmployeePerformance[];
  businessLines: BusinessLine[];
  getEKHData: (perf: EmployeePerformance) => EKHData;
  currencySymbol: string;
  ekhTotalsN1?: {
    scoreFinancierTotal: number;
    pertesConstateesTotal: number;
    pprPrevuesTotal: number;
    economiesRealiseesTotal: number;
  };
  ekhTotalsN2?: {
    scoreFinancierTotal: number;
    pertesConstateesTotal: number;
    pprPrevuesTotal: number;
    economiesRealiseesTotal: number;
  };
  ekhTotalsCalculated?: {
    scoreFinancierTotalN1: number;
    scoreFinancierTotalN2: number;
    pertesConstateesTotalN1: number;
    pertesConstateesTotalN2: number;
    pprPrevuesTotalN1: number;
    pprPrevuesTotalN2: number;
    economiesRealiseesTotalN1: number;
    economiesRealiseesTotalN2: number;
    pertesEnPctTotal: number;
  };
}

// Composant ligne employé mémorisé
const EmployeeRowN1 = React.memo(function EmployeeRowN1({
  employee,
  data,
  currencySymbol,
  isEven
}: {
  employee: EmployeePerformance;
  data: EKHData;
  currencySymbol: string;
  isEven: boolean;
}) {
  return (
    <tr className={cn(
      "border-b hover:bg-cyan-500/5 transition-colors",
      isEven && "bg-muted/20"
    )}>
      <td className="py-2 px-2 font-medium">{employee.employeeName}</td>
      <td className="py-2 px-2">{employee.category}</td>
      <td className="py-2 px-2 text-center">
        <Badge variant="outline">{(employee.incapacityRate * 100).toFixed(0)}%</Badge>
      </td>
      <td className="py-2 px-2 text-right text-blue-600 font-medium">
        {data.scoreFinancierN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-orange-600">
        {data.pertesConstateesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right">
        {data.pprPrevuesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-green-600 font-bold">
        {data.economiesRealiseesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-muted-foreground">
        {data.pertesConstateesRefN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-orange-500">
        {data.pertesConstateesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-center">
        <Badge variant="outline" className={cn(
          data.pertesN1PctRef > 80 ? "bg-red-500/10 text-red-600" :
          data.pertesN1PctRef > 50 ? "bg-orange-500/10 text-orange-600" :
          "bg-green-500/10 text-green-600"
        )}>
          {data.pertesN1PctRef.toFixed(2)}%
        </Badge>
      </td>
    </tr>
  );
});

const EmployeeRowN2 = React.memo(function EmployeeRowN2({
  employee,
  data,
  currencySymbol,
  isEven
}: {
  employee: EmployeePerformance;
  data: EKHData;
  currencySymbol: string;
  isEven: boolean;
}) {
  return (
    <tr className={cn(
      "border-b hover:bg-cyan-500/5 transition-colors",
      isEven && "bg-muted/20"
    )}>
      <td className="py-2 px-2 font-medium">{employee.employeeName}</td>
      <td className="py-2 px-2">{employee.category}</td>
      <td className="py-2 px-2 text-center">
        <Badge variant="outline">{(employee.incapacityRate * 100).toFixed(0)}%</Badge>
      </td>
      <td className="py-2 px-2 text-right text-blue-600 font-medium">
        {data.scoreFinancierN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-orange-600">
        {data.pertesConstateesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right">
        {data.pprPrevuesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-green-600 font-bold">
        {data.economiesRealiseesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-muted-foreground">
        {data.pertesConstateesRefN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-right text-orange-500">
        {data.pertesConstateesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
      </td>
      <td className="py-2 px-2 text-center">
        <Badge variant="outline" className={cn(
          data.pertesN2PctRef > 80 ? "bg-red-500/10 text-red-600" :
          data.pertesN2PctRef > 50 ? "bg-orange-500/10 text-orange-600" :
          "bg-green-500/10 text-green-600"
        )}>
          {data.pertesN2PctRef.toFixed(2)}%
        </Badge>
      </td>
    </tr>
  );
});

// Composant principal
export const VirtualizedEKHTable = React.memo(function VirtualizedEKHTable({
  level,
  employees,
  businessLines,
  getEKHData,
  currencySymbol,
  ekhTotalsN1,
  ekhTotalsN2,
  ekhTotalsCalculated
}: VirtualizedEKHTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Pré-calculer toutes les données EKH une seule fois
  const employeesWithData = useMemo(() => {
    return employees.map(emp => ({
      employee: emp,
      data: getEKHData(emp)
    }));
  }, [employees, getEKHData]);

  // Virtualizer pour les lignes
  const rowVirtualizer = useVirtualizer({
    count: employeesWithData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // hauteur estimée d'une ligne
    overscan: 5, // rendre 5 lignes supplémentaires au-dessus/en-dessous
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // NIVEAU 1
  if (level === '1') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b-2 bg-cyan-500/10">
              <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Nom du salarié</th>
              <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Catégorie pro</th>
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Taux d'incapacité</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Score Financier N1</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes Constatées N1</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">PPR PREVUES N1</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">ECONOMIES N1</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes Ref N1</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes N1</th>
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Pertes %</th>
            </tr>
          </thead>
        </table>
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: '400px' }}
        >
          <table className="w-full text-sm">
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow) => {
                const { employee, data } = employeesWithData[virtualRow.index];
                return (
                  <tr
                    key={employee.employeeId}
                    className={cn(
                      "border-b hover:bg-cyan-500/5 transition-colors absolute w-full",
                      virtualRow.index % 2 === 0 && "bg-muted/20"
                    )}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td className="py-2 px-2 font-medium" style={{width: '15%'}}>{employee.employeeName}</td>
                    <td className="py-2 px-2" style={{width: '10%'}}>{employee.category}</td>
                    <td className="py-2 px-2 text-center" style={{width: '8%'}}>
                      <Badge variant="outline">{(employee.incapacityRate * 100).toFixed(0)}%</Badge>
                    </td>
                    <td className="py-2 px-2 text-right text-blue-600 font-medium" style={{width: '12%'}}>
                      {data.scoreFinancierN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-orange-600" style={{width: '12%'}}>
                      {data.pertesConstateesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right" style={{width: '10%'}}>
                      {data.pprPrevuesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-green-600 font-bold" style={{width: '10%'}}>
                      {data.economiesRealiseesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-muted-foreground" style={{width: '10%'}}>
                      {data.pertesConstateesRefN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-orange-500" style={{width: '8%'}}>
                      {data.pertesConstateesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-center" style={{width: '5%'}}>
                      <Badge variant="outline" className={cn(
                        data.pertesN1PctRef > 80 ? "bg-red-500/10 text-red-600" :
                        data.pertesN1PctRef > 50 ? "bg-orange-500/10 text-orange-600" :
                        "bg-green-500/10 text-green-600"
                      )}>
                        {data.pertesN1PctRef.toFixed(2)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ekhTotalsN1 && (
          <table className="w-full text-sm">
            <tfoot>
              <tr className="border-t-2 font-bold bg-cyan-500/10">
                <td colSpan={3} className="py-4 px-2 text-right">TOTAL EKH NIVEAU 1:</td>
                <td className="py-4 px-2 text-right text-blue-600">
                  {ekhTotalsN1.scoreFinancierTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td className="py-4 px-2 text-right text-orange-600">
                  {ekhTotalsN1.pertesConstateesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td className="py-4 px-2 text-right">
                  {ekhTotalsN1.pprPrevuesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td className="py-4 px-2 text-right text-green-600">
                  {ekhTotalsN1.economiesRealiseesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        )}
        <div className="text-xs text-muted-foreground text-center py-2">
          {employees.length} employés (virtualisé - seules les lignes visibles sont rendues)
        </div>
      </div>
    );
  }

  // NIVEAU 2
  if (level === '2') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b-2 bg-cyan-500/10">
              <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Nom du salarié</th>
              <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Catégorie pro</th>
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Taux d'incapacité</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Score Financier N2</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes Constatées N2</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">PPR PREVUES N2</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">ECONOMIES N2</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes Ref N2</th>
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes N2</th>
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Pertes %</th>
            </tr>
          </thead>
        </table>
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: '400px' }}
        >
          <table className="w-full text-sm">
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow) => {
                const { employee, data } = employeesWithData[virtualRow.index];
                return (
                  <tr
                    key={employee.employeeId}
                    className={cn(
                      "border-b hover:bg-cyan-500/5 transition-colors absolute w-full",
                      virtualRow.index % 2 === 0 && "bg-muted/20"
                    )}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td className="py-2 px-2 font-medium" style={{width: '15%'}}>{employee.employeeName}</td>
                    <td className="py-2 px-2" style={{width: '10%'}}>{employee.category}</td>
                    <td className="py-2 px-2 text-center" style={{width: '8%'}}>
                      <Badge variant="outline">{(employee.incapacityRate * 100).toFixed(0)}%</Badge>
                    </td>
                    <td className="py-2 px-2 text-right text-blue-600 font-medium" style={{width: '12%'}}>
                      {data.scoreFinancierN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-orange-600" style={{width: '12%'}}>
                      {data.pertesConstateesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right" style={{width: '10%'}}>
                      {data.pprPrevuesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-green-600 font-bold" style={{width: '10%'}}>
                      {data.economiesRealiseesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-muted-foreground" style={{width: '10%'}}>
                      {data.pertesConstateesRefN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-right text-orange-500" style={{width: '8%'}}>
                      {data.pertesConstateesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                    </td>
                    <td className="py-2 px-2 text-center" style={{width: '5%'}}>
                      <Badge variant="outline" className={cn(
                        data.pertesN2PctRef > 80 ? "bg-red-500/10 text-red-600" :
                        data.pertesN2PctRef > 50 ? "bg-orange-500/10 text-orange-600" :
                        "bg-green-500/10 text-green-600"
                      )}>
                        {data.pertesN2PctRef.toFixed(2)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ekhTotalsN2 && (
          <table className="w-full text-sm">
            <tfoot>
              <tr className="border-t-2 font-bold bg-cyan-500/10">
                <td colSpan={3} className="py-4 px-2 text-right">TOTAL EKH NIVEAU 2:</td>
                <td className="py-4 px-2 text-right text-blue-600">
                  {ekhTotalsN2.scoreFinancierTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td className="py-4 px-2 text-right text-orange-600">
                  {ekhTotalsN2.pertesConstateesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td className="py-4 px-2 text-right">
                  {ekhTotalsN2.pprPrevuesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td className="py-4 px-2 text-right text-green-600">
                  {ekhTotalsN2.economiesRealiseesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        )}
        <div className="text-xs text-muted-foreground text-center py-2">
          {employees.length} employés (virtualisé - seules les lignes visibles sont rendues)
        </div>
      </div>
    );
  }

  // NIVEAU TOTAL
  return (
    <div className="overflow-x-auto p-4">
      <div className="text-center text-lg font-bold mb-4">
        EKH NIVEAU TOTAL - Synthèse N1 + N2
      </div>
      {ekhTotalsCalculated && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 bg-cyan-500/10">
              <th className="text-center py-3 px-4 font-semibold">Score Financier</th>
              <th className="text-center py-3 px-4 font-semibold">Pertes Constatées</th>
              <th className="text-center py-3 px-4 font-semibold">PPR PREVUES</th>
              <th className="text-center py-3 px-4 font-semibold">ECONOMIES REALISEES</th>
              <th className="text-center py-3 px-4 font-semibold">Pertes %</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center text-2xl font-bold">
              <td className="py-4 px-4 text-blue-600">
                {(ekhTotalsCalculated.scoreFinancierTotalN1 + ekhTotalsCalculated.scoreFinancierTotalN2).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
              </td>
              <td className="py-4 px-4 text-orange-600">
                {(ekhTotalsCalculated.pertesConstateesTotalN1 + ekhTotalsCalculated.pertesConstateesTotalN2).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
              </td>
              <td className="py-4 px-4">
                {(ekhTotalsCalculated.pprPrevuesTotalN1 + ekhTotalsCalculated.pprPrevuesTotalN2).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
              </td>
              <td className="py-4 px-4 text-green-600">
                {(ekhTotalsCalculated.economiesRealiseesTotalN1 + ekhTotalsCalculated.economiesRealiseesTotalN2).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
              </td>
              <td className="py-4 px-4">
                <Badge variant="outline" className={cn(
                  "text-lg font-bold",
                  ekhTotalsCalculated.pertesEnPctTotal > 80 ? "bg-red-500/10 text-red-600" :
                  ekhTotalsCalculated.pertesEnPctTotal > 50 ? "bg-orange-500/10 text-orange-600" :
                  "bg-green-500/10 text-green-600"
                )}>
                  {ekhTotalsCalculated.pertesEnPctTotal.toFixed(1)}%
                </Badge>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="text-xs text-muted-foreground">
              <td className="py-2 px-4 text-center">
                <span className="block">N1: {ekhTotalsCalculated.scoreFinancierTotalN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="block">N2: {ekhTotalsCalculated.scoreFinancierTotalN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </td>
              <td className="py-2 px-4 text-center">
                <span className="block">N1: {ekhTotalsCalculated.pertesConstateesTotalN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="block">N2: {ekhTotalsCalculated.pertesConstateesTotalN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </td>
              <td className="py-2 px-4 text-center">
                <span className="block">N1: {ekhTotalsCalculated.pprPrevuesTotalN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="block">N2: {ekhTotalsCalculated.pprPrevuesTotalN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </td>
              <td className="py-2 px-4 text-center">
                <span className="block">N1: {ekhTotalsCalculated.economiesRealiseesTotalN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="block">N2: {ekhTotalsCalculated.economiesRealiseesTotalN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </td>
              <td className="py-2 px-4 text-center">-</td>
            </tr>
          </tfoot>
        </table>
      )}
      <div className="text-xs text-muted-foreground text-center py-2">
        {employees.length} employés - Vue synthétique
      </div>
    </div>
  );
});

export default VirtualizedEKHTable;
