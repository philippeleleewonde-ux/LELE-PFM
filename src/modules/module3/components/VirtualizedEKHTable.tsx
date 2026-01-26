/**
 * ============================================
 * VIRTUALIZED EKH TABLE - CSS GRID VERSION
 * ============================================
 *
 * Composant optimisé utilisant @tanstack/react-virtual
 * pour ne rendre que les lignes visibles dans le viewport.
 *
 * FIX 2026-01-18: Correction alignement colonnes avec CSS Grid
 * - Remplacement structure table par CSS Grid
 * - Synchronisation scroll header/body
 * - Largeurs fixes en pixels pour garantir l'alignement
 *
 * FIX 2026-01-21: Regroupement des salariés par ligne d'activité
 * - Ajout des en-têtes par ligne d'activité (Building2 + nom + badge)
 * - Sous-totaux par ligne d'activité
 * - Cohérence visuelle avec les autres blocs d'indicateurs
 */

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

// Types
interface EKHData {
  coefficientCompetence: number;
  scoreFinancierN1: number;
  pertesConstateesN1: number;
  pertesConstateesIncapN1: number;  // Pertes avec taux incapacité N1
  pertesIncapPctN1: number;  // Pertes en % basé sur pertesConstateesIncap N1
  pprPrevuesN1: number;
  economiesRealiseesN1: number;
  pertesEnPourcentageN1: number;
  pertesConstateesRefN1: number;
  pertesN1PctRef: number;
  scoreFinancierN2: number;
  pertesConstateesN2: number;
  pertesConstateesIncapN2: number;  // Pertes avec taux incapacité N2
  pertesIncapPctN2: number;  // Pertes en % basé sur pertesConstateesIncap N2
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
  professionalCategory: string;
  incapacityRate: number;
  coefficientCompetence: number;
}

interface BusinessLine {
  id: string;
  activity_name: string;
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

// ============================================
// CONSTANTES CSS GRID - Largeurs fixes en pixels
// FIX 2026-01-21: Largeurs augmentées pour éviter chevauchement headers
// ============================================
const COLUMN_WIDTHS = {
  nom: 150,           // Nom du salarié
  categorie: 120,     // Catégorie pro
  coefCompetence: 140, // Coef. Compétence (augmenté de 90 à 140)
  scoreFinancier: 150, // Score Financier N1 (augmenté de 130 à 150)
  pertesConstatees: 165, // Pertes Constatées N1 (augmenté de 130 à 165)
  pprPrevues: 135,    // PPR PREVUES N1 (augmenté de 120 à 135)
  economies: 135,     // ECONOMIES N1 (augmenté de 120 à 135)
  pertesPct: 95,      // Pertes % - Position 8 (déplacé après ECONOMIES)
  pertesRef: 120,     // Pertes Constatées N1 (=$EB$3) - Position 9
  pertesIncap: 130,   // Pertes incap. N1 - Position 10
  pertesIncapPct: 100, // Pertes % basé sur pertesIncap - Position 11 (NOUVELLE)
};

const TOTAL_WIDTH = Object.values(COLUMN_WIDTHS).reduce((a, b) => a + b, 0);

const GRID_TEMPLATE = `${COLUMN_WIDTHS.nom}px ${COLUMN_WIDTHS.categorie}px ${COLUMN_WIDTHS.coefCompetence}px ${COLUMN_WIDTHS.scoreFinancier}px ${COLUMN_WIDTHS.pertesConstatees}px ${COLUMN_WIDTHS.pprPrevues}px ${COLUMN_WIDTHS.economies}px ${COLUMN_WIDTHS.pertesPct}px ${COLUMN_WIDTHS.pertesRef}px ${COLUMN_WIDTHS.pertesIncap}px ${COLUMN_WIDTHS.pertesIncapPct}px`;

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
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

  // Pré-calculer toutes les données EKH une seule fois
  const employeesWithData = useMemo(() => {
    return employees.map(emp => ({
      employee: emp,
      data: getEKHData(emp)
    }));
  }, [employees, getEKHData]);

  // Grouper les employés par ligne d'activité
  const employeesByBusinessLine = useMemo(() => {
    const grouped = new Map<string, Array<{ employee: EmployeePerformance; data: EKHData }>>();
    businessLines.forEach(bl => {
      grouped.set(bl.id, []);
    });
    employeesWithData.forEach(item => {
      const blGroup = grouped.get(item.employee.businessLineId);
      if (blGroup) {
        blGroup.push(item);
      }
    });
    return grouped;
  }, [employeesWithData, businessLines]);

  // Compter les lignes d'activité avec des employés
  const businessLinesWithEmployees = useMemo(() => {
    return businessLines.filter(bl => (employeesByBusinessLine.get(bl.id) || []).length > 0);
  }, [businessLines, employeesByBusinessLine]);

  // ============================================
  // NIVEAU 1
  // ============================================
  if (level === '1') {
    return (
      <div className="overflow-hidden space-y-4">
        {businessLines.map((businessLine) => {
          const blEmployeesWithData = employeesByBusinessLine.get(businessLine.id) || [];
          if (blEmployeesWithData.length === 0) return null;

          // Calculer sous-totaux de cette ligne d'activité
          const blTotals = blEmployeesWithData.reduce((acc, { data }) => ({
            scoreFinancier: acc.scoreFinancier + data.scoreFinancierN1,
            pertesConstatees: acc.pertesConstatees + data.pertesConstateesN1,
            pprPrevues: acc.pprPrevues + data.pprPrevuesN1,
            economiesRealisees: acc.economiesRealisees + data.economiesRealiseesN1,
          }), { scoreFinancier: 0, pertesConstatees: 0, pprPrevues: 0, economiesRealisees: 0 });

          return (
            <div key={businessLine.id} className="space-y-2">
              {/* En-tête ligne d'activité */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-lg text-white">
                <Building2 className="w-5 h-5" />
                <span className="font-bold">{businessLine.activity_name}</span>
                <Badge className="bg-white/20 text-white ml-2">{blEmployeesWithData.length} salariés</Badge>
              </div>

              {/* Tableau scrollable - FIX 2026-01-23: Restructuration pour synchronisation scroll */}
              {/* Le conteneur principal gère TOUT le scroll (horizontal ET vertical) */}
              <div className="rounded-lg border border-cyan-200" style={{ maxHeight: '400px', overflow: 'auto' }}>
                {/* Header colonnes - sticky pour rester visible lors du scroll vertical */}
                <div
                  className="text-sm font-semibold bg-cyan-500/10 border-b-2 sticky top-0 z-10"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_TEMPLATE,
                    width: `${TOTAL_WIDTH}px`,
                  }}
                >
                  <div className="py-3 px-2 text-left whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Nom du salarié</div>
                  <div className="py-3 px-2 text-left whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Catégorie pro</div>
                  <div className="py-3 px-2 text-center whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Coef. Compétence</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Score Financier N1</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes Constatées N1</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">PPR PREVUES N1</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">ECONOMIES N1</div>
                  <div className="py-3 px-2 text-center whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes %</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes Constatées N1</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes incap. N1</div>
                  <div className="py-3 px-2 text-center whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes %</div>
                </div>

                {/* Body - liste des employés - Plus de sous-conteneur, tout dans le même flux */}
                <div>
                  {blEmployeesWithData.map(({ employee, data }, idx) => (
                    <div
                      key={employee.employeeId}
                      className={cn(
                        "border-b hover:bg-cyan-500/5 transition-colors text-sm",
                        idx % 2 === 0 && "bg-muted/20"
                      )}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: GRID_TEMPLATE,
                        width: `${TOTAL_WIDTH}px`,
                      }}
                    >
                      <div className="py-2 px-2 font-medium truncate">{employee.employeeName}</div>
                      <div className="py-2 px-2 truncate">{employee.professionalCategory}</div>
                      <div className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn(
                          employee.coefficientCompetence >= 0.8 ? "bg-green-500/10 text-green-600 border-green-500/30" :
                          employee.coefficientCompetence >= 0.5 ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                          "bg-orange-500/10 text-orange-600 border-orange-500/30"
                        )}>
                          {employee.coefficientCompetence.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="py-2 px-2 text-right text-blue-600 font-medium">
                        {data.scoreFinancierN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right text-orange-600">
                        {data.pertesConstateesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right">
                        {data.pprPrevuesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right text-green-600 font-bold">
                        {data.economiesRealiseesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn(
                          data.pertesEnPourcentageN1 > 80 ? "bg-red-500/10 text-red-600" :
                          data.pertesEnPourcentageN1 > 50 ? "bg-orange-500/10 text-orange-600" :
                          "bg-green-500/10 text-green-600"
                        )}>
                          {data.pertesEnPourcentageN1.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="py-2 px-2 text-right text-muted-foreground">
                        {data.pertesConstateesRefN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right text-orange-600">
                        {data.pertesConstateesIncapN1.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn(
                          data.pertesIncapPctN1 > 80 ? "bg-red-500/10 text-red-600" :
                          data.pertesIncapPctN1 > 50 ? "bg-orange-500/10 text-orange-600" :
                          "bg-green-500/10 text-green-600"
                        )}>
                          {data.pertesIncapPctN1.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sous-total ligne d'activité */}
                <div
                  className="text-sm font-bold bg-cyan-500/20 border-t-2"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_TEMPLATE,
                    minWidth: `${TOTAL_WIDTH}px`,
                  }}
                >
                  <div className="py-3 px-2 text-right" style={{ gridColumn: 'span 3' }}>
                    TOTAL {businessLine.activity_name}:
                  </div>
                  <div className="py-3 px-2 text-right text-blue-600">
                    {blTotals.scoreFinancier.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-right text-orange-600">
                    {blTotals.pertesConstatees.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-right">
                    {blTotals.pprPrevues.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-right text-green-600">
                    {blTotals.economiesRealisees.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-center">-</div>
                  <div className="py-3 px-2 text-right">-</div>
                  <div className="py-3 px-2 text-right">-</div>
                  <div className="py-3 px-2 text-center">-</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* TOTAL GLOBAL EKH NIVEAU 1 */}
        {ekhTotalsN1 && (
          <div
            className="text-sm font-bold bg-cyan-600/20 border-2 border-cyan-500 rounded-lg"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_TEMPLATE,
              minWidth: `${TOTAL_WIDTH}px`,
            }}
          >
            <div className="py-4 px-2 text-right" style={{ gridColumn: 'span 3' }}>TOTAL EKH NIVEAU 1:</div>
            <div className="py-4 px-2 text-right text-blue-600">
              {ekhTotalsN1.scoreFinancierTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-right text-orange-600">
              {ekhTotalsN1.pertesConstateesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-right">
              {ekhTotalsN1.pprPrevuesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-right text-green-600">
              {ekhTotalsN1.economiesRealiseesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-center">-</div>
            <div className="py-4 px-2 text-right">-</div>
            <div className="py-4 px-2 text-right">-</div>
            <div className="py-4 px-2 text-center">-</div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center py-2">
          {employees.length} employés répartis sur {businessLinesWithEmployees.length} lignes d'activité
        </div>
      </div>
    );
  }

  // ============================================
  // NIVEAU 2
  // ============================================
  if (level === '2') {
    return (
      <div className="overflow-hidden space-y-4">
        {businessLines.map((businessLine) => {
          const blEmployeesWithData = employeesByBusinessLine.get(businessLine.id) || [];
          if (blEmployeesWithData.length === 0) return null;

          // Calculer sous-totaux de cette ligne d'activité
          const blTotals = blEmployeesWithData.reduce((acc, { data }) => ({
            scoreFinancier: acc.scoreFinancier + data.scoreFinancierN2,
            pertesConstatees: acc.pertesConstatees + data.pertesConstateesN2,
            pprPrevues: acc.pprPrevues + data.pprPrevuesN2,
            economiesRealisees: acc.economiesRealisees + data.economiesRealiseesN2,
          }), { scoreFinancier: 0, pertesConstatees: 0, pprPrevues: 0, economiesRealisees: 0 });

          return (
            <div key={businessLine.id} className="space-y-2">
              {/* En-tête ligne d'activité */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-lg text-white">
                <Building2 className="w-5 h-5" />
                <span className="font-bold">{businessLine.activity_name}</span>
                <Badge className="bg-white/20 text-white ml-2">{blEmployeesWithData.length} salariés</Badge>
              </div>

              {/* Tableau scrollable - FIX 2026-01-23: Restructuration pour synchronisation scroll */}
              {/* Le conteneur principal gère TOUT le scroll (horizontal ET vertical) */}
              <div className="rounded-lg border border-cyan-200" style={{ maxHeight: '400px', overflow: 'auto' }}>
                {/* Header colonnes - sticky pour rester visible lors du scroll vertical */}
                <div
                  className="text-sm font-semibold bg-cyan-500/10 border-b-2 sticky top-0 z-10"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_TEMPLATE,
                    width: `${TOTAL_WIDTH}px`,
                  }}
                >
                  <div className="py-3 px-2 text-left whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Nom du salarié</div>
                  <div className="py-3 px-2 text-left whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Catégorie pro</div>
                  <div className="py-3 px-2 text-center whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Coef. Compétence</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Score Financier N2</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes Constatées N2</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">PPR PREVUES N2</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">ECONOMIES N2</div>
                  <div className="py-3 px-2 text-center whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes %</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes Constatées N2</div>
                  <div className="py-3 px-2 text-right whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes incap. N2</div>
                  <div className="py-3 px-2 text-center whitespace-nowrap overflow-hidden text-ellipsis bg-cyan-500/10">Pertes %</div>
                </div>

                {/* Body - liste des employés - Plus de sous-conteneur, tout dans le même flux */}
                <div>
                  {blEmployeesWithData.map(({ employee, data }, idx) => (
                    <div
                      key={employee.employeeId}
                      className={cn(
                        "border-b hover:bg-cyan-500/5 transition-colors text-sm",
                        idx % 2 === 0 && "bg-muted/20"
                      )}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: GRID_TEMPLATE,
                        width: `${TOTAL_WIDTH}px`,
                      }}
                    >
                      <div className="py-2 px-2 font-medium truncate">{employee.employeeName}</div>
                      <div className="py-2 px-2 truncate">{employee.professionalCategory}</div>
                      <div className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn(
                          employee.coefficientCompetence >= 0.8 ? "bg-green-500/10 text-green-600 border-green-500/30" :
                          employee.coefficientCompetence >= 0.5 ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                          "bg-orange-500/10 text-orange-600 border-orange-500/30"
                        )}>
                          {employee.coefficientCompetence.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="py-2 px-2 text-right text-blue-600 font-medium">
                        {data.scoreFinancierN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right text-orange-600">
                        {data.pertesConstateesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right">
                        {data.pprPrevuesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right text-green-600 font-bold">
                        {data.economiesRealiseesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn(
                          data.pertesEnPourcentageN2 > 80 ? "bg-red-500/10 text-red-600" :
                          data.pertesEnPourcentageN2 > 50 ? "bg-orange-500/10 text-orange-600" :
                          "bg-green-500/10 text-green-600"
                        )}>
                          {data.pertesEnPourcentageN2.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="py-2 px-2 text-right text-muted-foreground">
                        {data.pertesConstateesRefN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-right text-orange-600">
                        {data.pertesConstateesIncapN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                      </div>
                      <div className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn(
                          data.pertesIncapPctN2 > 80 ? "bg-red-500/10 text-red-600" :
                          data.pertesIncapPctN2 > 50 ? "bg-orange-500/10 text-orange-600" :
                          "bg-green-500/10 text-green-600"
                        )}>
                          {data.pertesIncapPctN2.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sous-total ligne d'activité */}
                <div
                  className="text-sm font-bold bg-cyan-500/20 border-t-2"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_TEMPLATE,
                    minWidth: `${TOTAL_WIDTH}px`,
                  }}
                >
                  <div className="py-3 px-2 text-right" style={{ gridColumn: 'span 3' }}>
                    TOTAL {businessLine.activity_name}:
                  </div>
                  <div className="py-3 px-2 text-right text-blue-600">
                    {blTotals.scoreFinancier.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-right text-orange-600">
                    {blTotals.pertesConstatees.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-right">
                    {blTotals.pprPrevues.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-right text-green-600">
                    {blTotals.economiesRealisees.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                  </div>
                  <div className="py-3 px-2 text-center">-</div>
                  <div className="py-3 px-2 text-right">-</div>
                  <div className="py-3 px-2 text-right">-</div>
                  <div className="py-3 px-2 text-center">-</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* TOTAL GLOBAL EKH NIVEAU 2 */}
        {ekhTotalsN2 && (
          <div
            className="text-sm font-bold bg-cyan-600/20 border-2 border-cyan-500 rounded-lg"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_TEMPLATE,
              minWidth: `${TOTAL_WIDTH}px`,
            }}
          >
            <div className="py-4 px-2 text-right" style={{ gridColumn: 'span 3' }}>TOTAL EKH NIVEAU 2:</div>
            <div className="py-4 px-2 text-right text-blue-600">
              {ekhTotalsN2.scoreFinancierTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-right text-orange-600">
              {ekhTotalsN2.pertesConstateesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-right">
              {ekhTotalsN2.pprPrevuesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-right text-green-600">
              {ekhTotalsN2.economiesRealiseesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
            </div>
            <div className="py-4 px-2 text-center">-</div>
            <div className="py-4 px-2 text-right">-</div>
            <div className="py-4 px-2 text-right">-</div>
            <div className="py-4 px-2 text-center">-</div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center py-2">
          {employees.length} employés répartis sur {businessLinesWithEmployees.length} lignes d'activité
        </div>
      </div>
    );
  }

  // ============================================
  // NIVEAU TOTAL
  // ============================================
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
