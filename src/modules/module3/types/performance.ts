/**
 * ============================================
 * HCM COST SAVINGS - TYPES PERFORMANCE
 * ============================================
 * Types partagés pour toutes les pages de performance
 */

export interface CostEntry {
  id: string;
  company_id: string;
  business_line_id: string;
  employee_id: string;
  kpi_type: string;
  period_start: string;
  period_end: string;
  event_date: string;
  duration_hours: number;
  duration_minutes: number;
  compensation_amount: number;
  defect_types?: string[];
  responsibility_level?: string;
  selected_days?: string[];
  recovered_time_hours?: number;
  recovered_time_minutes?: number;
  saved_expenses?: number;
  // Champs spécifiques DDP - PERTES
  lost_time_hours?: number;
  lost_time_minutes?: number;
  excess_expenses?: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  professional_category: string;
  tech_level: string;
  business_line_id: string;
  incapacity_rate: number;
  versatility_f1: string;
  versatility_f2: string;
  versatility_f3: string;
}

export interface BusinessLine {
  id: string;
  activity_name: string;
  team_leader: string | null;
}

export interface IndicatorData {
  // Niveau 1 - Données collectées
  tempsCollecte: number;
  tempsCalcul: number;
  fraisCollectes: number;
  scoreFinancier: number;
  pertesConstatees: number;
  pprPrevues: number;
  economiesRealisees: number;
  economiesRealisees2: number;
  pertesEnPourcentage: number;
  // Niveau 2 - Données prises en compte (avec code PRC)
  codePRC: boolean;
  tempsCollecteN2: number;
  tempsCalculN2: number;
  tempsPrisEnCompte: number;
  fraisCollectesN2: number;
  fraisPrisEnCompte: number;
  scoreFinancierN2: number;
  pertesConstateesN2: number;
  pprPrevuesN2: number;
  economiesRealiseesN2: number;
  economiesRealisees2N2: number;
  pertesEnPourcentageN2: number;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  professionalCategory: string;
  incapacityRate: number;
  coefficientCompetence: number;
  businessLineId: string;
  businessLineName: string;
  abs: IndicatorData;
  qd: IndicatorData;
  oa: IndicatorData;
  ddp: IndicatorData;
  ekh: IndicatorData;
}

export interface IndicatorTotals {
  // Totaux Niveau 1
  tempsTotal: number;
  fraisTotal: number;
  scoreFinancierTotal: number;
  pertesConstateesTotal: number;
  pprPrevuesTotal: number;
  economiesRealiseesTotal: number;
  pertesEnPourcentageTotal: number;
  // Totaux Niveau 2
  tempsTotalN2: number;
  fraisTotalN2: number;
  scoreFinancierTotalN2: number;
  pertesConstateesTotalN2: number;
  economiesRealiseesTotalN2: number;
  pertesEnPourcentageTotalN2: number;
  // Totaux combinés (N1 + N2) - NIVEAU TOTAL selon Excel
  tempsTotalCombine: number;
  fraisTotalCombine: number;
  scoreFinancierTotalCombine: number;
  pertesConstateesTotalCombine: number;
  economiesRealiseesTotalCombine: number;
  pertesEnPourcentageTotalCombine: number;
}

export interface FinancialParams {
  recettesN1: number;
  depensesN1: number;
  volumeHoraireN1: number;
  pprAnnuelReference: number;
  gainsN1?: number;
  gainsN2?: number;  // PPR annuelle N+2 pour sélection dynamique
  gainsN3?: number;  // PPR annuelle N+3 pour sélection dynamique
  launchDate?: Date; // Date de lancement pour détection période courante
  indicatorRates?: {
    abs: number;
    qd: number;
    oa: number;
    ddp: number;
    ekh: number;
  };
  priorityActionsN1?: PriorityActionData[];
  module1BusinessLines?: Module1BusinessLine[];
}

export interface PriorityActionData {
  businessLine: string;
  staffCount: number;
  budgetRate: number;
  distributions: {
    indicator: string;
    perLine: number;
    perPerson: number;
  }[];
}

export interface Module1BusinessLine {
  id: number;
  activityName: string;
  staffCount: number;
  budget: number;
  budgetRate?: number;
}

export interface GlobalStats {
  totalEconomies: number;
  totalPertes: number;
  totalPPR: number;
  totalScoreFinancier: number;
  employeesCount: number;
  employeesWithData: number;
}

export type KPIType = 'abs' | 'qd' | 'oa' | 'ddp' | 'ekh';
