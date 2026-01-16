/**
 * ============================================
 * HCM COST SAVINGS - CALCULATION ENGINE V2
 * ============================================
 *
 * Moteur de calcul COMPLET basé sur l'analyse Excel a1RiskoM3-S1M1.xls
 * Feuilles analysées: L1-L8, R-L1 à R-L8, B-L1 à B-L8
 *
 * 5 KPIs (Indicateurs de Performance):
 * - ABS: Absentéisme
 * - DFQ: Défauts Qualité
 * - ADT: Accidents de Travail
 * - EPD: Écarts de Productivité Directe
 * - EKH: Écarts de Savoir-faire (Know-How)
 *
 * FORMULES EXCEL VALIDÉES (Feuille L1):
 * =====================================
 *
 * NIVEAU 1 (Colonnes A-N):
 * - F6 (Temps-Calcul): =E6+0 (temps collecté)
 * - H6 (Score Financier): directement les frais
 * - I6 (Pertes constatées avec incapacité): =IF(M6<0,0,IF(M6=0,0,IF(M6>0,M6)))
 * - M6 (Pertes Constatées): =IF((H6+G6)=0,0,IF((H6+G6)>0,(H6+G6)-D6))
 * - K6 (Économies Réalisées): =IF(AND(F6=0,T6=0,B6<>0),N6,IF(AND(F6=0,T6=0,B6=0),0,IF(AND(F6>0,T6=0),N6,IF(AND(F6=0,T6>0),0))))
 * - L6 (Pertes %): =IF(M6<0,0,IF(M6=0,0,IF(M6>0,M6/$E$3)))
 * - N6 (Économies Réalisées semaine): =IF(M6<0,J6-0,IF(M6>0,J6-M6,IF(M6=0,J6-M6)))
 *
 * NIVEAU 2 (Colonnes O-AC):
 * - P6 (Code P.R.C): =IF(O6=0,0,IF(O6>0,1))
 * - U6 (Temps-Pris en compte): =IF(P6=0,0,IF(P6>0,T6))
 * - W6 (Frais-Pris en compte): =IF(P6=0,0,IF(P6>0,V6))
 * - Y6 (Pertes avec incapacité N2): =IF(AC6<0,0,IF(AC6=0,0,IF(AC6>0,AC6)))
 * - AA6 (Économies N2): =IF(AND(F6=0,U6=0),0,IF(AND(F6>0,U6=0),0,IF(AND(F6=0,U6>0),AD6)))
 * - AB6 (Pertes % N2): =IF(AC6<0,0,IF(AC6=0,0,IF(AC6>0,AC6/$E$3)))
 * - AC6 (Pertes N2): =IF((X6+W6)=0,0,IF((X6+W6)>0,(X6+W6)-R6))
 *
 * TOTAUX (Row 3):
 * - B3: =SUM(F6:F1705)+SUM(U6:U1705) (Total temps)
 * - C3: =SUM(G6:G1705)+SUM(W6:W1705) (Total frais)
 * - D3: =SUM(H6:H1705)+SUM(X6:X1705) (Score financier total)
 * - E3: =IF((SUM(I6:I1705)+SUM(Y6:Y1705))<0,0,...) (Pertes totales)
 * - F3: =SUM(J6:J1705) (PPR Prévues)
 * - G3: =SUM(K6:K1705)+SUM(AA6:AA1705) (Économies totales)
 * - H3: =SUM(L6:L1705)+SUM(AB6:AB1705) (Pertes % total)
 *
 * RÉPARTITION R-L1:
 * - I3 (Contribution %): =IF(ISERROR(D3/$D$2),0,(D3/$D$2))
 * - Distribution: 67% Trésorerie / 33% Primes
 */

// ============================================
// TYPES COMPLETS
// ============================================

export interface TeamMember {
  id: string;
  name: string;
  professional_category: string;
  tech_level: string;
  handicap_shape: string;
  incapacity_rate: number;
  versatility_f1: string;
  versatility_f2: string;
  versatility_f3: string;
}

export interface CostEntry {
  id: string;
  employee_id: string;
  employee_name?: string;
  kpi_type: 'abs' | 'qd' | 'oa' | 'ddp' | 'ekh';
  period_start: string;
  period_end: string;
  event_date: string;
  duration_hours: number;
  duration_minutes: number;
  compensation_amount: number;
  total_duration_minutes: number;
}

export interface PPRData {
  ppr_annuel: number;
  ppr_hebdomadaire: number;
  ppr_trimestriel: number;
}

/**
 * Paramètres financiers N-1 pour le calcul du Score Financier
 * Source: HCM Performance Plan / Page 3 - Financial History & Employee Engagement
 */
export interface FinancialParams {
  /** Recettes N-1 (Sales/Turnover) - Source: employeeEngagement.financialHistory.sales */
  recettesN1: number;
  /** Dépenses N-1 (Total Spending) - Source: employeeEngagement.financialHistory.spending */
  depensesN1: number;
  /** Volume Horaire N-1 = annualHoursPerPerson (heures annuelles par personne) */
  volumeHoraireN1: number;
}

// ============================================
// NIVEAU 1 - Données par salarié
// ============================================

export interface EmployeeKPIDataNiveau1 {
  // Identification
  numero: number;
  employeeId: string;
  nomSalarie: string;
  categoriePro: string;
  tauxIncapacite: number;

  // Données collectées
  donneesTemps: number; // minutes
  tempsCalcul: number;
  fraisCollectes: number;
  scoreFinancier: number;

  // Calculs de performance
  pertesConstatees: number;
  pertesAvecIncapacite: number;
  pprPrevues: number;
  economiesRealisees: number;
  pertesPercent: number;
}

// ============================================
// NIVEAU 2 - Données avec code P.R.C
// ============================================

export interface EmployeeKPIDataNiveau2 extends EmployeeKPIDataNiveau1 {
  // Code P.R.C (Pris en compte)
  codePRC: number; // 0 ou 1

  // Données Pris en compte
  tempsPrisEnCompte: number;
  fraisPrisEnCompte: number;

  // Calculs Niveau 2
  scoreFinancierN2: number;
  pertesConstatéesN2: number;
  pertesAvecIncapaciteN2: number;
  economiesRealiseesN2: number;
  pertesPercentN2: number;
}

// ============================================
// RÉSULTATS KPI
// ============================================

export interface KPIResult {
  kpiCode: string;
  kpiName: string;
  kpiNameFr: string;

  // Niveau 1 - Données par salarié
  niveau1Data: EmployeeKPIDataNiveau1[];

  // Niveau 2 - Données avec P.R.C
  niveau2Data: EmployeeKPIDataNiveau2[];

  // Totaux Niveau 1
  totalTempsN1: number;
  totalFraisN1: number;
  totalScoreFinancierN1: number;
  totalPertesN1: number;
  totalPprN1: number;
  totalEconomiesN1: number;
  totalPertesPercentN1: number;

  // Totaux Niveau 2
  totalTempsN2: number;
  totalFraisN2: number;
  totalScoreFinancierN2: number;
  totalPertesN2: number;
  totalEconomiesN2: number;
  totalPertesPercentN2: number;

  // Totaux combinés (N1 + N2)
  totalTemps: number;
  totalFrais: number;
  totalScoreFinancier: number;
  totalPertes: number;
  totalPpr: number;
  totalEconomies: number;
  totalPertesPercent: number;

  // Statistiques
  nombreIncidents: number;
  employesConcernes: string[];

  // Ancien format pour compatibilité
  tempsCollecte: number;
  fraisCollectes: number;
  tempsCalcule: number;
  scoreFinancier: number;
  pprPrevues: number;
  pertesConstatees: number;
  economiesRealisees: number;
  pertesPercent: number;
}

export interface EKHResult extends KPIResult {
  coefficientCompetence: number;
  scoreFinancierEKH: number;
  economiesEKH: number;

  // EKH par salarié
  ekhParSalarie: {
    employeeId: string;
    nomSalarie: string;
    categoriePro: string;
    coefficientCompetence: number;
    scoreFinancier: number;
    pertesConstatees: number;
    pprPrevues: number;
    economiesRealisees: number;
    pertesPercent: number;
  }[];
}

// ============================================
// SYNTHÈSE DE PERFORMANCE DE LA LIGNE
// ============================================

export interface SynthesePerformanceNiveau1 {
  employeeId: string;
  nomSalarie: string;
  categorie: string;
  scoresPertesPercent: number;
  partPrimeContribution: number;
  partTresorerieContribution: number;
  contributionPercent: number; // Ratio d'efficience globale
  trancheNotePercent: number;
  triTrancheNote: string;
  triN2TrancheNote: string;
  scorePrimeTotal: number;
  scoreNoteTotalPercent: number;
  totalEconomieRealisee: number;

  // Taux économie par indicateur
  tauxEconomieABS: number;
  tauxEconomieDFQ: number;
  tauxEconomieADT: number;
  tauxEconomieEPD: number;
  tauxEconomieEKH: number;
  totalTauxEconomie: number;
}

export interface SynthesePerformanceNiveau2 {
  indicateur: string;
  objectifLigne: number;
  economiesRealisees: number;
}

export interface SynthesePerformanceNiveau3 {
  fluxTresorerie: number;
  sortiesPrimes: number;
  partPrimeContribution: number;
  contributionPercent: number;
  trancheNotePercent: number;
}

// ============================================
// RÉPARTITION DES PRIMES
// ============================================

export interface RepartitionPrimesNiveau1Salarie {
  employeeId: string;
  nomSalarie: string;

  // ABS
  previsionnelPrimeABS: number;
  previsionnelTresorerieABS: number;
  realisePrimeABS: number;
  realiseTresorerieABS: number;

  // DFQ
  previsionnelPrimeDFQ: number;
  previsionnelTresorerieDFQ: number;
  realisePrimeDFQ: number;
  realiseTresorerieDFQ: number;

  // ADT
  previsionnelPrimeADT: number;
  previsionnelTresorerieADT: number;
  realisePrimeADT: number;
  realiseTresorerieADT: number;

  // EPD
  previsionnelPrimeEPD: number;
  previsionnelTresorerieEPD: number;
  realisePrimeEPD: number;
  realiseTresorerieEPD: number;

  // EKH
  previsionnelPrimeEKH: number;
  previsionnelTresorerieEKH: number;
  realisePrimeEKH: number;
  realiseTresorerieEKH: number;

  // Totaux
  totalPrevisionnelPrime: number;
  totalPrevisionnelTresorerie: number;
  totalRealisePrime: number;
  totalRealiseTresorerie: number;
}

export interface RepartitionPrimesNiveau2 {
  indicateur: string;
  totalPrevisionnelPrime: number;
  totalPrevisionnelTresorerie: number;
  totalRealisePrime: number;
  totalRealiseTresorerie: number;
}

// ============================================
// SYNTHÈSE LIGNE COMPLÈTE
// ============================================

export interface SyntheseLigne {
  businessLineId: string;
  businessLineName: string;

  // Résultats par KPI
  kpiResults: KPIResult[];
  ekhResult: EKHResult | null;

  // Synthèse de Performance
  syntheseNiveau1: SynthesePerformanceNiveau1[];
  syntheseNiveau2: SynthesePerformanceNiveau2[];
  syntheseNiveau3: SynthesePerformanceNiveau3;

  // Répartition des Primes
  repartitionNiveau1: RepartitionPrimesNiveau1Salarie[];
  repartitionNiveau2: RepartitionPrimesNiveau2[];
  totalRepartition: {
    totalPrevisionnelPrime: number;
    totalPrevisionnelTresorerie: number;
    totalRealisePrime: number;
    totalRealiseTresorerie: number;
  };

  // Totaux globaux
  totalTempsCalcule: number;
  totalScoreFinancier: number;
  totalPertes: number;
  totalEconomies: number;

  // Distribution FIXE 67%/33%
  fluxTresorerie: number;
  sortiesPrimes: number;

  // Statistiques
  totalIncidents: number;
  employesConcernesUniques: string[];
}

export interface GlobalSynthesis {
  lignes: SyntheseLigne[];
  grandTotalTemps: number;
  grandTotalScoreFinancier: number;
  grandTotalPertes: number;
  grandTotalEconomies: number;
  grandTotalTresorerie: number;
  grandTotalPrimes: number;
  repartitionKPI: {
    kpiCode: string;
    kpiName: string;
    totalPertes: number;
    totalEconomies: number;
    percentOfTotal: number;
  }[];
}

// ============================================
// CONSTANTS
// ============================================

export const POLYVALENCE_COEFFICIENTS: Record<string, number> = {
  "Does not make / does not know": 0,
  "Apprentice (learning)": 7,
  "Confirmed (autonomous)": 14,
  "Experimented (trainer)": 21,
};

export const MAX_POLYVALENCE_COEFFICIENT = 63;

// Distribution FIXE (JAMAIS MODIFIER)
export const TAUX_TRESORERIE = 0.67;
export const TAUX_PRIMES = 0.33;

export const KPI_DEFINITIONS = {
  abs: { code: 'ABS', name: 'Absenteeism', nameFr: 'Absentéisme' },
  qd: { code: 'DFQ', name: 'Quality Defects', nameFr: 'Défauts Qualité' },
  oa: { code: 'ADT', name: 'Occupational Accidents', nameFr: 'Accidents de Travail' },
  ddp: { code: 'EPD', name: 'Direct Productivity Gaps', nameFr: 'Écarts de Productivité Directe' },
  ekh: { code: 'EKH', name: 'Know-How Gaps', nameFr: 'Écarts de Savoir-faire' },
} as const;

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calcule le coefficient de polyvalence
 * Formule: (CoefF1 + CoefF2 + CoefF3) / 63
 */
export function calculatePolyvalenceCoefficient(member: TeamMember): number {
  const coefF1 = POLYVALENCE_COEFFICIENTS[member.versatility_f1] || 0;
  const coefF2 = POLYVALENCE_COEFFICIENTS[member.versatility_f2] || 0;
  const coefF3 = POLYVALENCE_COEFFICIENTS[member.versatility_f3] || 0;
  const total = coefF1 + coefF2 + coefF3;
  return total / MAX_POLYVALENCE_COEFFICIENT;
}

/**
 * Calcule le temps ajusté (Temps-Calcul)
 * Formule Excel: =E6+0 (simplement le temps collecté)
 */
export function calculateAdjustedTime(timeMinutes: number, incapacityRate: number): number {
  return timeMinutes * (1 - incapacityRate / 100);
}

/**
 * @deprecated Utiliser calculateFinancialScoreCorrect à la place
 * Ancienne formule (incorrecte): frais * (1 - taux_incapacité / 100)
 * Conservée pour rétrocompatibilité
 */
export function calculateFinancialScore(amount: number, incapacityRate: number): number {
  return amount * (1 - incapacityRate / 100);
}

/**
 * FORMULE CORRECTE DU SCORE FINANCIER
 * ============================================
 * Score Financier = ((RECETTE N-1 - DEPENSES N-1) / VOLUME HORAIRE N-1) × Temps Collecté
 *
 * Sources des données:
 * - RECETTE N-1: HCM Performance Plan / Page 3 / Financial History / Sales/Turnover N-1
 * - DEPENSES N-1: HCM Performance Plan / Page 3 / Financial History / Total Spending N-1
 * - VOLUME HORAIRE N-1: HCM Performance Plan / Page 3 / Employee Engagement / Annual Hours per Person × nb employés
 * - Temps Collecté: HCM Cost Savings / Récapitulatif des Performances Réalisées / Temps Collecté
 *
 * @param tempsCollecte - Temps collecté en heures décimales (M3-Données de temps)
 * @param financialParams - Paramètres financiers N-1 (recettesN1, depensesN1, volumeHoraireN1)
 * @returns Score financier calculé
 */
export function calculateFinancialScoreCorrect(
  tempsCollecte: number,
  financialParams: FinancialParams
): number {
  const { recettesN1, depensesN1, volumeHoraireN1 } = financialParams;

  // Éviter la division par zéro
  if (volumeHoraireN1 === 0) return 0;

  // Formule: ((Recettes N-1 - Dépenses N-1) / Volume Horaire N-1) × Temps Collecté
  // Conversion k¥ → ¥ (×1000) pour cohérence avec PPR Prévues
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  return tauxMargeHoraire * tempsCollecte * 1000;
}

/**
 * SCORE FINANCIER - NIVEAU 1 (Signature simplifiée)
 * ============================================
 * Formule Excel: =(('2-Tri-TB Fixe-Données Risko M1'!L3-M3)/K3)*E6
 *
 * @param tempsCalcul - Temps calculé en heures décimales
 * @param recettesN1 - Recettes N-1 en k¥
 * @param depensesN1 - Dépenses N-1 en k¥
 * @param volumeHoraireN1 - Volume horaire N-1
 * @returns Score financier en ¥ (converti depuis k¥)
 */
export function calculateScoreFinancier(
  tempsCalcul: number,
  recettesN1: number,
  depensesN1: number,
  volumeHoraireN1: number
): number {
  if (volumeHoraireN1 === 0) return 0;
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  // Conversion k¥ → ¥ (×1000) pour cohérence avec PPR Prévues
  return tauxMargeHoraire * tempsCalcul * 1000;
}

/**
 * SCORE FINANCIER - NIVEAU 2 (Temps pris en compte)
 * ============================================
 * Même formule que N1 mais avec temps pris en compte au lieu de temps calculé
 *
 * @param tempsPrisEnCompte - Temps pris en compte NIVEAU 2
 * @param recettesN1 - Recettes N-1 en k¥
 * @param depensesN1 - Dépenses N-1 en k¥
 * @param volumeHoraireN1 - Volume horaire N-1
 * @returns Score financier N2 en ¥ (converti depuis k¥)
 */
export function calculateScoreFinancierN2(
  tempsPrisEnCompte: number,
  recettesN1: number,
  depensesN1: number,
  volumeHoraireN1: number
): number {
  if (volumeHoraireN1 === 0) return 0;
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  // Conversion k¥ → ¥ (×1000) pour cohérence avec PPR Prévues
  return tauxMargeHoraire * tempsPrisEnCompte * 1000;
}

/**
 * Calcule les pertes constatées BRUTES (avant application du taux d'incapacité)
 *
 * FORMULE EXCEL M6: =SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))
 *
 * Où:
 * - H6 = Score Financier
 * - G6 = Frais collectés
 * - D6 = PPR Prévues (Score de Budgétisation)
 *
 * @param scoreFinancier - Score financier calculé (H6)
 * @param frais - Frais collectés (G6)
 * @param pprPrevues - PPR Prévues / Score de Budgétisation (D6)
 * @returns Pertes brutes = (Score + Frais) - PPR, ou 0 si (Score + Frais) <= 0
 */
export function calculatePertesConstatees(
  scoreFinancier: number,
  frais: number,
  pprPrevues: number = 0
): number {
  const total = scoreFinancier + frais;
  // Formule Excel: SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))
  if (total === 0) return 0;
  if (total > 0) return total - pprPrevues;
  return 0;
}

/**
 * PERTES CONSTATÉES AVEC PRISE EN COMPTE DU TAUX D'INCAPACITÉ
 * ============================================================
 *
 * LOGIQUE FINANCIÈRE VALIDÉE (Logique B):
 * - Le taux d'incapacité représente le % de handicap du salarié
 * - Les pertes "avec incapacité" = part des pertes CAUSÉES par le handicap
 * - Un salarié avec 30% d'incapacité → 30% des pertes lui sont attribuées
 *
 * FORMULE: Pertes avec incapacité = Pertes brutes × (TauxIncapacité / 100)
 *
 * EXEMPLES:
 * - Taux 0%  → Pertes × 0%   = 0 ¥ (salarié valide, pas de pertes liées au handicap)
 * - Taux 30% → Pertes × 30%  = 30% des pertes attribuées au handicap
 * - Taux 100% → Pertes × 100% = 100% des pertes attribuées au handicap
 *
 * @param pertesConstatees - Pertes brutes (Score + Frais)
 * @param tauxIncapacite - Taux d'incapacité en % (0-100)
 * @returns Pertes attribuables au handicap du salarié
 */
export function calculatePertesAvecIncapacite(
  pertesConstatees: number,
  tauxIncapacite: number = 0
): number {
  if (pertesConstatees <= 0) return 0;
  if (tauxIncapacite <= 0) return 0;
  if (tauxIncapacite > 100) return pertesConstatees; // Plafond à 100%

  // Logique B: Pertes × (TauxIncapacité / 100)
  return pertesConstatees * (tauxIncapacite / 100);
}

// ALIAS pour compatibilité avec le code existant
export const calculatePertesConstateesBrut = calculatePertesConstatees;
export const calculatePertesConstateesAvecIncapacite = calculatePertesAvecIncapacite;

/**
 * PERTES CONSTATÉES BRUTES - NIVEAU 2 (AC6)
 *
 * FORMULE EXCEL AC6: =SI((X6+W6)=0;0;SI((X6+W6)>0;(X6+W6)-R6))
 *
 * Où:
 * - X6 = Score Financier N2
 * - W6 = Frais-Pris en compte N2
 * - R6 = PPR Prévues N2 (Score de Budgétisation)
 *
 * @param scoreFinancierN2 - Score financier NIVEAU 2 (X6)
 * @param fraisPrisEnCompte - Frais pris en compte NIVEAU 2 (W6)
 * @param pprPrevuesN2 - PPR Prévues N2 / Score de Budgétisation (R6)
 * @returns Pertes brutes N2 = (Score + Frais) - PPR, ou 0 si (Score + Frais) <= 0
 */
export function calculatePertesConstateesN2(
  scoreFinancierN2: number,
  fraisPrisEnCompte: number,
  pprPrevuesN2: number = 0
): number {
  const total = scoreFinancierN2 + fraisPrisEnCompte;
  // Formule Excel: SI((X6+W6)=0;0;SI((X6+W6)>0;(X6+W6)-R6))
  if (total === 0) return 0;
  if (total > 0) return total - pprPrevuesN2;
  return 0;
}

/**
 * PERTES CONSTATÉES AVEC LOGIQUE CROISÉE N1/N2 (DQ6)
 * ============================================
 *
 * Formule Excel (DQ6):
 * =IF(AND(DE6=0,DW6=0,DG6<>0),0,
 *  IF(AND(DE6=0,DW6=0,DG6=0),0,
 *   IF(AND(DE6>0,DW6=0),0,
 *    IF(AND(DE6=0,DW6>0,DG6<>0),DV6,
 *     IF(AND(DE6=0,DW6>0,DG6=0),0)))))
 *
 * Où:
 * - DE6 = ECONOMIES REALISEES N1
 * - DW6 = ECONOMIES REALISEES N2
 * - DG6 = Nom salarié N2 (salarié existe)
 * - DV6 = Pertes constatées N2 (calculées précédemment)
 *
 * Logique métier: Éviter le double-comptage des pertes entre N1 et N2
 * - Retourne DV6 UNIQUEMENT si N1 n'a pas d'économies ET N2 a des économies ET salarié existe
 * - Retourne 0 dans tous les autres cas
 *
 * @param economiesRealiseesN1 - Économies réalisées NIVEAU 1 (DE6)
 * @param economiesRealiseesN2 - Économies réalisées NIVEAU 2 (DW6)
 * @param salariéExiste - Le salarié existe (DG6 <> 0)
 * @param pertesConstateesN2Brut - Pertes constatées N2 brutes (DV6)
 * @returns Pertes N2 filtrées selon logique croisée (DQ6)
 */
export function calculatePertesConstateesN2AvecLogiqueCroisee(
  economiesRealiseesN1: number,
  economiesRealiseesN2: number,
  salariéExiste: boolean,
  pertesConstateesN2Brut: number
): number {
  // Condition 1: DE6=0, DW6=0, DG6<>0 → 0
  if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && salariéExiste) {
    return 0;
  }

  // Condition 2: DE6=0, DW6=0, DG6=0 → 0
  if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && !salariéExiste) {
    return 0;
  }

  // Condition 3: DE6>0, DW6=0 → 0
  if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
    return 0;
  }

  // Condition 4: DE6=0, DW6>0, DG6<>0 → DV6 (retourne les pertes N2)
  if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0 && salariéExiste) {
    return pertesConstateesN2Brut;
  }

  // Condition 5: DE6=0, DW6>0, DG6=0 → 0
  if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0 && !salariéExiste) {
    return 0;
  }

  // Fallback: 0
  return 0;
}

/**
 * PPR PREVUES (semaine)
 * ============================================
 * Formule Excel: =SI(B6<>0;('2-Tri-TB Fixe-Données Risko M1'!O3/3)/4;SI(B6=0;0))
 *
 * Source des données:
 * - Module: HCM PERFORMANCE PLAN
 * - Page: "14 - PRIORITY ACTIONS - N+1"
 * - Section: TRIMESTRE 1 - ANNÉE N+1
 * - Champ: Indicateur // par personne
 *
 * Calcul:
 * 1. PPR k¥ → PPR ¥ (× 1000)
 * 2. PPR trimestriel → PPR mensuel (÷ 3)
 * 3. PPR mensuel → PPR hebdomadaire (÷ 4)
 *
 * @param salarieExiste - Si le salarié existe (B6 <> 0)
 * @param pprParPersonneParIndicateur - PPR par personne par indicateur en k¥
 * @returns PPR prévues par semaine en ¥
 */
export function calculatePPRPrevues(
  salarieExiste: boolean,
  pprParPersonneParIndicateur: number
): number {
  if (!salarieExiste) return 0;
  if (pprParPersonneParIndicateur === 0) return 0;

  // Conversion k¥ → ¥ (× 1000) pour cohérence avec Score Financier
  const pprEnUnites = pprParPersonneParIndicateur * 1000;

  // PPR semaine = (PPR par personne en ¥ / 3 mois) / 4 semaines
  const pprSemaine = (pprEnUnites / 3) / 4;

  return pprSemaine;
}

// ============================================
// RECALCUL PPR PAR PERSONNE DEPUIS LES SOURCES
// ============================================
// Cette fonction recalcule les PPR par personne directement depuis les données sources,
// EXACTEMENT comme le fait Module 1 dans Page14PriorityActionsN1.tsx
// Cela évite tout drift entre les données stockées et les données affichées

/**
 * Interface des taux par indicateur (format Module 3)
 */
export interface IndicatorRatesModule3 {
  abs: number;  // Absentéisme (%)
  qd: number;   // Défauts qualité (%)
  oa: number;   // Accidents travail (%)
  ddp: number;  // Écarts productivité (%)
  ekh: number;  // Écarts know-how (%)
}

/**
 * Interface des lignes d'activité Module 1
 */
export interface Module1BusinessLineData {
  activityName: string;
  staffCount: number;
  budget: number;
  budgetRate?: number;
}

/**
 * Calcule la PPR par personne pour un indicateur et une ligne d'activité
 * DIRECTEMENT depuis les données sources (même logique que Module 1)
 *
 * Formule Module 1:
 * perLine = gainsN1 × (indicatorRate / 100) × lineBudgetRate
 * perPerson = perLine / lineStaffCount
 *
 * @param businessLineName - Nom de la ligne d'activité
 * @param indicatorId - ID de l'indicateur ('absenteeism', 'quality', 'accidents', 'productivity', 'knowhow')
 * @param gainsN1 - PPR total annuel N+1 (en k¥)
 * @param indicatorRates - Taux par indicateur (en %)
 * @param module1BusinessLines - Lignes d'activité avec staffCount et budget
 * @returns PPR par personne en k¥
 */
export function calculatePPRPerPersonFromSources(
  businessLineName: string,
  indicatorId: string,
  gainsN1: number,
  indicatorRates: IndicatorRatesModule3 | undefined,
  module1BusinessLines: Module1BusinessLineData[] | undefined
): number {
  // Validation des données
  if (!businessLineName || !indicatorId) return 0;
  if (!gainsN1 || gainsN1 <= 0) return 0;
  if (!indicatorRates) return 0;
  if (!module1BusinessLines || module1BusinessLines.length === 0) return 0;

  // Mapper l'indicatorId du format Module 3 vers le format Module 1
  // Module 3: 'absenteeism', 'quality', 'accidents', 'productivity', 'knowhow'
  // IndicatorRates: 'abs', 'qd', 'oa', 'ddp', 'ekh'
  const indicatorRateMap: Record<string, keyof IndicatorRatesModule3> = {
    'absenteeism': 'abs',
    'quality': 'qd',
    'accidents': 'oa',
    'productivity': 'ddp',
    'knowhow': 'ekh',
    // Alias directs
    'abs': 'abs',
    'qd': 'qd',
    'oa': 'oa',
    'ddp': 'ddp',
    'ekh': 'ekh'
  };

  const rateKey = indicatorRateMap[indicatorId.toLowerCase()];
  if (!rateKey) {
    console.warn(`[calculatePPRPerPersonFromSources] Unknown indicatorId: ${indicatorId}`);
    return 0;
  }

  const indicatorRate = indicatorRates[rateKey] || 0;
  if (indicatorRate <= 0) return 0;

  // Trouver la ligne d'activité
  const businessLine = module1BusinessLines.find(
    bl => bl.activityName && bl.activityName.toLowerCase() === businessLineName.toLowerCase()
  );

  if (!businessLine) {
    console.warn(`[calculatePPRPerPersonFromSources] Business line not found: ${businessLineName}`);
    return 0;
  }

  // Calculer le budgetRate
  const totalBudget = module1BusinessLines.reduce((sum, bl) => sum + (bl.budget || 0), 0);
  const lineBudget = businessLine.budget || 0;
  const calculatedBudgetRate = totalBudget > 0 ? (lineBudget / totalBudget) * 100 : 0;
  const lineBudgetRate = (businessLine.budgetRate || calculatedBudgetRate) / 100; // % -> décimal

  const lineStaffCount = businessLine.staffCount || 1; // Éviter division par zéro

  // FORMULE IDENTIQUE À MODULE 1:
  // perLine = gainsN1 × (indicatorRate / 100) × lineBudgetRate
  // perPerson = perLine / lineStaffCount
  const perLine = gainsN1 * (indicatorRate / 100) * lineBudgetRate;
  const perPerson = perLine / lineStaffCount;

  return perPerson;
}

// ============================================
// SELECTION DYNAMIQUE PPR PAR TRIMESTRE
// ============================================
//
// LOGIQUE:
// 1. L'utilisateur sélectionne une période de saisie (semaine) dans Module 3
// 2. Le système détermine dans quel trimestre (T1-T4) et année (N+1/N+2/N+3) cette période se trouve
// 3. Le système récupère la PPR par personne correspondante depuis Module 1
// 4. Cette valeur est utilisée dans les calculs de PPR PREVUES
//

/**
 * Information sur la période sélectionnée
 */
export interface SelectedPeriodInfo {
  yearOffset: number;       // 1 = N+1, 2 = N+2, 3 = N+3
  quarter: 1 | 2 | 3 | 4;   // Trimestre
  fiscalYear: string;       // "N+1", "N+2", "N+3"
  quarterLabel: string;     // "T1", "T2", "T3", "T4"
  fiscalWeek: number;       // Semaine fiscale (1-156 sur 3 ans)
  weekInYear: number;       // Semaine dans l'année (1-52)
  weekInQuarter: number;    // Semaine dans le trimestre (1-13)
  isValid: boolean;         // true si dans la période du plan (3 ans)
}

/**
 * Données PPR par personne pour un indicateur et une ligne d'activité
 */
export interface PPRPerPersonData {
  businessLine: string;
  indicator: string;
  perPerson: number;        // PPR par personne en k¥ (valeur de Module 1)
  perLine: number;          // PPR total pour la ligne
  periodInfo: SelectedPeriodInfo;
}

/**
 * Détermine la période (trimestre et année fiscale) à partir de la période de saisie sélectionnée
 *
 * @param launchDate - Date de lancement de la plateforme (depuis Company Profile)
 * @param periodStart - Date de début de la période de saisie sélectionnée (format ISO: "2025-12-01")
 * @returns Information sur la période ou null si invalide
 */
export function getPeriodInfoFromSelectedWeek(
  launchDate: Date,
  periodStart: string
): SelectedPeriodInfo | null {
  if (!launchDate || !periodStart) return null;

  // Parser les dates
  const launch = new Date(launchDate);
  launch.setHours(0, 0, 0, 0);

  // Parser periodStart (format ISO: "2025-12-01")
  const [year, month, day] = periodStart.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day, 0, 0, 0);

  // Si avant le lancement, retourner null
  if (selectedDate < launch) {
    console.warn('[getPeriodInfoFromSelectedWeek] Date sélectionnée avant le lancement');
    return null;
  }

  // Calculer le nombre de jours depuis le lancement
  const diffMs = selectedDate.getTime() - launch.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Calculer la semaine fiscale (1-indexed)
  const fiscalWeek = Math.floor(diffDays / 7) + 1;

  // Calculer l'année fiscale offset (1 = N+1, 2 = N+2, 3 = N+3)
  const weeksPerYear = 52;
  const yearOffset = Math.floor((fiscalWeek - 1) / weeksPerYear) + 1;

  // Calculer la semaine dans l'année courante (1-52)
  const weekInYear = ((fiscalWeek - 1) % weeksPerYear) + 1;

  // Calculer le trimestre (1-4) : semaines 1-13 = T1, 14-26 = T2, 27-39 = T3, 40-52 = T4
  const quarter = Math.ceil(weekInYear / 13) as 1 | 2 | 3 | 4;

  // Calculer la semaine dans le trimestre (1-13)
  const weekInQuarter = ((weekInYear - 1) % 13) + 1;

  // Vérifier si dans la période du plan (3 ans max)
  const isValid = yearOffset >= 1 && yearOffset <= 3;

  const result: SelectedPeriodInfo = {
    yearOffset,
    quarter,
    fiscalYear: `N+${yearOffset}`,
    quarterLabel: `T${quarter}`,
    fiscalWeek,
    weekInYear,
    weekInQuarter,
    isValid,
  };

  console.log(`[getPeriodInfoFromSelectedWeek] Period: ${periodStart} → ${result.fiscalYear} ${result.quarterLabel} (Semaine ${result.weekInYear})`);

  return result;
}

/**
 * Structure PPR par trimestre (import depuis Module 1)
 */
export interface QuarterlyPPRData {
  T1: number;
  T2: number;
  T3: number;
  T4: number;
}

/**
 * Structure des données Priority Actions de Module 1
 */
export interface PriorityActionDistribution {
  indicator: string;
  perLine: number;
  perPerson: number;
  // 🆕 Données trimestrielles différenciées
  perPersonByQuarter?: QuarterlyPPRData;
  perLineByQuarter?: QuarterlyPPRData;
}

export interface PriorityActionData {
  businessLine: string;
  staffCount: number;
  budgetRate: number;
  distributions: PriorityActionDistribution[];
}

/**
 * Récupère la PPR par personne pour une période, une ligne d'activité et un indicateur
 *
 * @param periodInfo - Information sur la période sélectionnée
 * @param businessLineName - Nom de la ligne d'activité
 * @param indicatorId - ID de l'indicateur ('abs', 'qd', 'oa', 'ddp', 'ekh')
 * @param priorityActionsN1 - Données Priority Actions N+1 depuis Module 1
 * @param priorityActionsN2 - Données Priority Actions N+2 depuis Module 1
 * @param priorityActionsN3 - Données Priority Actions N+3 depuis Module 1
 * @returns PPR par personne en k¥ ou 0 si non trouvé
 */
export function getPPRPerPersonForPeriod(
  periodInfo: SelectedPeriodInfo | null,
  businessLineName: string,
  indicatorId: string,
  priorityActionsN1?: PriorityActionData[],
  priorityActionsN2?: PriorityActionData[],
  priorityActionsN3?: PriorityActionData[]
): number {
  if (!periodInfo || !periodInfo.isValid) {
    console.warn('[getPPRPerPersonForPeriod] Période invalide');
    return 0;
  }

  // Sélectionner les données de l'année correspondante
  let priorityActions: PriorityActionData[] | undefined;
  switch (periodInfo.yearOffset) {
    case 1:
      priorityActions = priorityActionsN1;
      break;
    case 2:
      priorityActions = priorityActionsN2;
      break;
    case 3:
      priorityActions = priorityActionsN3;
      break;
    default:
      console.warn(`[getPPRPerPersonForPeriod] Année non supportée: N+${periodInfo.yearOffset}`);
      return 0;
  }

  if (!priorityActions || priorityActions.length === 0) {
    console.warn(`[getPPRPerPersonForPeriod] Pas de données Priority Actions pour ${periodInfo.fiscalYear}`);
    return 0;
  }

  // Mapper l'indicatorId vers le format de Module 1
  const indicatorMap: Record<string, string> = {
    'abs': 'absenteeism',
    'qd': 'quality',
    'oa': 'accidents',
    'ddp': 'productivity',
    'ekh': 'knowhow',
  };
  const module1IndicatorId = indicatorMap[indicatorId] || indicatorId;

  // Trouver la ligne d'activité
  const lineData = priorityActions.find(
    pa => pa.businessLine.toLowerCase() === businessLineName.toLowerCase()
  );

  if (!lineData) {
    console.warn(`[getPPRPerPersonForPeriod] Ligne d'activité non trouvée: ${businessLineName}`);
    return 0;
  }

  // Trouver l'indicateur
  const distribution = lineData.distributions.find(
    d => d.indicator === module1IndicatorId || d.indicator === indicatorId
  );

  if (!distribution) {
    console.warn(`[getPPRPerPersonForPeriod] Indicateur non trouvé: ${indicatorId} pour ${businessLineName}`);
    return 0;
  }

  // 🆕 SÉLECTION DYNAMIQUE PAR TRIMESTRE
  // Priorité 1: Utiliser les données trimestrielles différenciées si disponibles
  // Priorité 2: Fallback sur division par 4 de la valeur annuelle
  let pprPerPersonQuarterly: number;
  const quarterKey = `T${periodInfo.quarter}` as keyof QuarterlyPPRData;

  if (distribution.perPersonByQuarter && distribution.perPersonByQuarter[quarterKey] !== undefined) {
    // ✅ Données trimestrielles DIFFÉRENCIÉES disponibles
    pprPerPersonQuarterly = distribution.perPersonByQuarter[quarterKey];
    console.log(`[getPPRPerPersonForPeriod] ✅ Données trimestrielles: ${periodInfo.fiscalYear} ${periodInfo.quarterLabel} | ${businessLineName} | ${indicatorId} → PPR/personne: ${pprPerPersonQuarterly.toFixed(2)} k¥`);
  } else {
    // ⚠️ Fallback: Division par 4 de la valeur annuelle
    pprPerPersonQuarterly = distribution.perPerson / 4;
    console.log(`[getPPRPerPersonForPeriod] ⚠️ Fallback /4: ${periodInfo.fiscalYear} ${periodInfo.quarterLabel} | ${businessLineName} | ${indicatorId} → PPR/personne: ${pprPerPersonQuarterly.toFixed(2)} k¥`);
  }

  return pprPerPersonQuarterly;
}

/**
 * Calcule la PPR PREVUES (semaine) à partir de la période sélectionnée
 *
 * FORMULE: PPR semaine = (PPR par personne k¥ × 1000 / 3 mois) / 4 semaines
 *
 * @param launchDate - Date de lancement
 * @param periodStart - Période de saisie sélectionnée
 * @param businessLineName - Nom de la ligne d'activité
 * @param indicatorId - ID de l'indicateur
 * @param priorityActionsN1 - Données N+1
 * @param priorityActionsN2 - Données N+2
 * @param priorityActionsN3 - Données N+3
 * @returns PPR PREVUES (semaine) en ¥
 */
export function calculatePPRPrevuesFromPeriod(
  launchDate: Date,
  periodStart: string,
  businessLineName: string,
  indicatorId: string,
  priorityActionsN1?: PriorityActionData[],
  priorityActionsN2?: PriorityActionData[],
  priorityActionsN3?: PriorityActionData[]
): { pprSemaine: number; periodInfo: SelectedPeriodInfo | null } {
  // 1. Déterminer la période (trimestre + année)
  const periodInfo = getPeriodInfoFromSelectedWeek(launchDate, periodStart);

  if (!periodInfo) {
    return { pprSemaine: 0, periodInfo: null };
  }

  // 2. Récupérer la PPR par personne pour cette période
  const pprPerPersonK = getPPRPerPersonForPeriod(
    periodInfo,
    businessLineName,
    indicatorId,
    priorityActionsN1,
    priorityActionsN2,
    priorityActionsN3
  );

  if (pprPerPersonK === 0) {
    return { pprSemaine: 0, periodInfo };
  }

  // 3. Calculer la PPR semaine avec la formule standard
  // PPR semaine = (PPR k¥ × 1000 / 3) / 4
  const pprSemaine = calculatePPRPrevues(true, pprPerPersonK);

  return { pprSemaine, periodInfo };
}

// Ancien alias pour compatibilité
export function getCurrentPeriodInfo(
  launchDate: Date,
  currentDate: Date = new Date()
): SelectedPeriodInfo | null {
  // Convertir la date en format ISO string
  const periodStart = currentDate.toISOString().split('T')[0];
  return getPeriodInfoFromSelectedWeek(launchDate, periodStart);
}

/**
 * Calcule les économies réalisées
 * Formule Excel N6: =IF(M6<0,J6-0,IF(M6>0,J6-M6,IF(M6=0,J6-M6)))
 */
export function calculateEconomiesRealisees(ppr: number, pertesConstatees: number): number {
  if (pertesConstatees < 0) return ppr;
  return ppr - pertesConstatees;
}

/**
 * Calcule les économies réalisées (formule K6)
 * Formule: =IF(AND(F6=0,T6=0,B6<>0),N6,IF(AND(F6=0,T6=0,B6=0),0,IF(AND(F6>0,T6=0),N6,IF(AND(F6=0,T6>0),0))))
 */
export function calculateEconomiesK(
  tempsN1: number,
  tempsN2: number,
  nomSalarie: string | number,
  economiesN: number
): number {
  if (tempsN1 === 0 && tempsN2 === 0 && nomSalarie !== 0) return economiesN;
  if (tempsN1 === 0 && tempsN2 === 0 && nomSalarie === 0) return 0;
  if (tempsN1 > 0 && tempsN2 === 0) return economiesN;
  if (tempsN1 === 0 && tempsN2 > 0) return 0;
  return 0;
}

/**
 * Calcule le pourcentage de pertes
 * Formule Excel L6: =IF(M6<0,0,IF(M6=0,0,IF(M6>0,M6/$E$3)))
 */
export function calculatePertesPercent(pertesConstatees: number, totalPertes: number): number {
  if (pertesConstatees < 0) return 0;
  if (pertesConstatees === 0) return 0;
  if (totalPertes === 0) return 0;
  return (pertesConstatees / totalPertes) * 100;
}

/**
 * Calcule le code P.R.C (Pris en compte)
 * Formule Excel P6: =IF(O6=0,0,IF(O6>0,1))
 */
export function calculateCodePRC(nomSalarie: string | number): number {
  if (nomSalarie === 0 || nomSalarie === '' || nomSalarie === null) return 0;
  return 1;
}

/**
 * Calcule les valeurs "Pris en compte"
 * Formule Excel U6: =IF(P6=0,0,IF(P6>0,T6))
 */
export function calculatePrisEnCompte(codePRC: number, valeur: number): number {
  if (codePRC === 0) return 0;
  return valeur;
}

/**
 * Calcul de la contribution en %
 * Formule: economies / totalEconomies
 */
export function calculateContributionPercent(economies: number, totalEconomies: number): number {
  if (totalEconomies === 0) return 0;
  return (economies / totalEconomies) * 100;
}

/**
 * Calcule la distribution Trésorerie/Primes
 */
export function calculateDistribution(totalEconomies: number): {
  tresorerie: number;
  primes: number;
} {
  return {
    tresorerie: totalEconomies * TAUX_TRESORERIE,
    primes: totalEconomies * TAUX_PRIMES,
  };
}

// ============================================
// CALCUL KPI COMPLET
// ============================================

export function calculateKPIResultComplete(
  kpiType: 'abs' | 'qd' | 'oa' | 'ddp',
  entries: CostEntry[],
  members: TeamMember[],
  pprData: PPRData,
  financialParams?: FinancialParams // Paramètre optionnel pour la nouvelle formule Score Financier
): KPIResult {
  const kpiDef = KPI_DEFINITIONS[kpiType];
  const kpiEntries = entries.filter(e => e.kpi_type === kpiType);

  const niveau1Data: EmployeeKPIDataNiveau1[] = [];
  const niveau2Data: EmployeeKPIDataNiveau2[] = [];
  const employeesSet = new Set<string>();

  // PPR par salarié
  const pprParSalarie = members.length > 0 ? pprData.ppr_hebdomadaire / members.length : 0;

  // Grouper les entrées par employé
  const entriesByEmployee = new Map<string, CostEntry[]>();
  kpiEntries.forEach(entry => {
    const existing = entriesByEmployee.get(entry.employee_id) || [];
    existing.push(entry);
    entriesByEmployee.set(entry.employee_id, existing);
  });

  // Calculer pour chaque employé
  let numero = 1;
  members.forEach(member => {
    const employeeEntries = entriesByEmployee.get(member.id) || [];

    // Totaux pour cet employé
    let totalTemps = 0;
    let totalFrais = 0;

    employeeEntries.forEach(entry => {
      totalTemps += entry.total_duration_minutes;
      totalFrais += entry.compensation_amount;
    });

    // Calculs Niveau 1
    const tempsCalcul = calculateAdjustedTime(totalTemps, member.incapacity_rate);
    // Score Financier: Utilise la nouvelle formule si financialParams fourni, sinon ancienne formule
    const tempsEnHeures = totalTemps / 60; // Conversion minutes -> heures pour la formule
    const scoreFinancier = financialParams
      ? calculateFinancialScoreCorrect(tempsEnHeures, financialParams)
      : calculateFinancialScore(totalFrais, member.incapacity_rate);
    const pertesConstatees = scoreFinancier + totalFrais - member.incapacity_rate;
    const pertesAvecIncapacite = calculatePertesAvecIncapacite(pertesConstatees > 0 ? pertesConstatees : 0);

    const n1Data: EmployeeKPIDataNiveau1 = {
      numero,
      employeeId: member.id,
      nomSalarie: member.name,
      categoriePro: member.professional_category,
      tauxIncapacite: member.incapacity_rate,
      donneesTemps: totalTemps,
      tempsCalcul,
      fraisCollectes: totalFrais,
      scoreFinancier,
      pertesConstatees: pertesConstatees > 0 ? pertesConstatees : 0,
      pertesAvecIncapacite,
      pprPrevues: pprParSalarie,
      economiesRealisees: Math.max(0, pprParSalarie - pertesAvecIncapacite),
      pertesPercent: 0, // Calculé après
    };
    niveau1Data.push(n1Data);

    // Calculs Niveau 2
    const codePRC = calculateCodePRC(member.name);
    const tempsPrisEnCompte = calculatePrisEnCompte(codePRC, tempsCalcul);
    const fraisPrisEnCompte = calculatePrisEnCompte(codePRC, totalFrais);

    const n2Data: EmployeeKPIDataNiveau2 = {
      ...n1Data,
      codePRC,
      tempsPrisEnCompte,
      fraisPrisEnCompte,
      scoreFinancierN2: calculatePrisEnCompte(codePRC, scoreFinancier),
      pertesConstatéesN2: calculatePrisEnCompte(codePRC, n1Data.pertesConstatees),
      pertesAvecIncapaciteN2: calculatePrisEnCompte(codePRC, pertesAvecIncapacite),
      economiesRealiseesN2: calculatePrisEnCompte(codePRC, n1Data.economiesRealisees),
      pertesPercentN2: 0, // Calculé après
    };
    niveau2Data.push(n2Data);

    if (totalTemps > 0 || totalFrais > 0) {
      employeesSet.add(member.id);
    }
    numero++;
  });

  // Calculer les totaux
  const totalTempsN1 = niveau1Data.reduce((sum, d) => sum + d.donneesTemps, 0);
  const totalFraisN1 = niveau1Data.reduce((sum, d) => sum + d.fraisCollectes, 0);
  const totalScoreFinancierN1 = niveau1Data.reduce((sum, d) => sum + d.scoreFinancier, 0);
  const totalPertesN1 = niveau1Data.reduce((sum, d) => sum + d.pertesConstatees, 0);
  const totalPprN1 = niveau1Data.reduce((sum, d) => sum + d.pprPrevues, 0);
  const totalEconomiesN1 = niveau1Data.reduce((sum, d) => sum + d.economiesRealisees, 0);

  const totalTempsN2 = niveau2Data.reduce((sum, d) => sum + d.tempsPrisEnCompte, 0);
  const totalFraisN2 = niveau2Data.reduce((sum, d) => sum + d.fraisPrisEnCompte, 0);
  const totalScoreFinancierN2 = niveau2Data.reduce((sum, d) => sum + d.scoreFinancierN2, 0);
  const totalPertesN2 = niveau2Data.reduce((sum, d) => sum + d.pertesConstatéesN2, 0);
  const totalEconomiesN2 = niveau2Data.reduce((sum, d) => sum + d.economiesRealiseesN2, 0);

  // Totaux combinés
  const totalTemps = totalTempsN1 + totalTempsN2;
  const totalFrais = totalFraisN1 + totalFraisN2;
  const totalScoreFinancier = totalScoreFinancierN1 + totalScoreFinancierN2;
  const totalPertes = totalPertesN1 + totalPertesN2;
  const totalEconomies = totalEconomiesN1 + totalEconomiesN2;

  // Mettre à jour les pourcentages de pertes
  niveau1Data.forEach(d => {
    d.pertesPercent = totalPertes > 0 ? (d.pertesConstatees / totalPertes) * 100 : 0;
  });
  niveau2Data.forEach(d => {
    d.pertesPercentN2 = totalPertes > 0 ? (d.pertesConstatéesN2 / totalPertes) * 100 : 0;
  });

  return {
    kpiCode: kpiDef.code,
    kpiName: kpiDef.name,
    kpiNameFr: kpiDef.nameFr,
    niveau1Data,
    niveau2Data,
    totalTempsN1,
    totalFraisN1,
    totalScoreFinancierN1,
    totalPertesN1,
    totalPprN1,
    totalEconomiesN1,
    totalPertesPercentN1: totalPprN1 > 0 ? (totalPertesN1 / totalPprN1) * 100 : 0,
    totalTempsN2,
    totalFraisN2,
    totalScoreFinancierN2,
    totalPertesN2,
    totalEconomiesN2,
    totalPertesPercentN2: totalPprN1 > 0 ? (totalPertesN2 / totalPprN1) * 100 : 0,
    totalTemps,
    totalFrais,
    totalScoreFinancier,
    totalPertes,
    totalPpr: totalPprN1,
    totalEconomies,
    totalPertesPercent: totalPprN1 > 0 ? (totalPertes / totalPprN1) * 100 : 0,
    nombreIncidents: kpiEntries.length,
    employesConcernes: Array.from(employeesSet),
    // Ancien format pour compatibilité
    tempsCollecte: totalTempsN1,
    fraisCollectes: totalFraisN1,
    tempsCalcule: niveau1Data.reduce((sum, d) => sum + d.tempsCalcul, 0),
    scoreFinancier: totalScoreFinancierN1,
    pprPrevues: pprData.ppr_hebdomadaire,
    pertesConstatees: totalPertesN1,
    economiesRealisees: totalEconomiesN1,
    pertesPercent: totalPprN1 > 0 ? (totalPertesN1 / totalPprN1) * 100 : 0,
  };
}

/**
 * Calcule EKH (Écarts de Savoir-faire)
 */
export function calculateEKHResultComplete(
  members: TeamMember[],
  pprData: PPRData
): EKHResult {
  const kpiDef = KPI_DEFINITIONS.ekh;
  const ekhParSalarie: EKHResult['ekhParSalarie'] = [];

  let totalScoreFinancierEKH = 0;
  let totalEconomiesEKH = 0;
  let totalPertesEKH = 0;
  const employeesSet = new Set<string>();
  const pprParSalarie = members.length > 0 ? pprData.ppr_hebdomadaire / members.length : 0;

  members.forEach(member => {
    const coefficient = calculatePolyvalenceCoefficient(member);
    const scoreFinancier = pprParSalarie * (1 - coefficient);
    const economies = pprParSalarie * coefficient;
    const pertes = scoreFinancier;

    totalScoreFinancierEKH += scoreFinancier;
    totalEconomiesEKH += economies;
    totalPertesEKH += pertes;

    ekhParSalarie.push({
      employeeId: member.id,
      nomSalarie: member.name,
      categoriePro: member.professional_category,
      coefficientCompetence: coefficient,
      scoreFinancier,
      pertesConstatees: pertes,
      pprPrevues: pprParSalarie,
      economiesRealisees: economies,
      pertesPercent: pprParSalarie > 0 ? (pertes / pprParSalarie) * 100 : 0,
    });

    if (coefficient < 1) {
      employeesSet.add(member.id);
    }
  });

  const avgCoefficient = members.length > 0
    ? members.reduce((sum, m) => sum + calculatePolyvalenceCoefficient(m), 0) / members.length
    : 0;

  // Créer les données niveau 1 et 2 pour EKH (pas de temps/frais)
  const niveau1Data: EmployeeKPIDataNiveau1[] = ekhParSalarie.map((e, i) => ({
    numero: i + 1,
    employeeId: e.employeeId,
    nomSalarie: e.nomSalarie,
    categoriePro: e.categoriePro,
    tauxIncapacite: 0,
    donneesTemps: 0,
    tempsCalcul: 0,
    fraisCollectes: 0,
    scoreFinancier: e.scoreFinancier,
    pertesConstatees: e.pertesConstatees,
    pertesAvecIncapacite: e.pertesConstatees,
    pprPrevues: e.pprPrevues,
    economiesRealisees: e.economiesRealisees,
    pertesPercent: e.pertesPercent,
  }));

  const niveau2Data: EmployeeKPIDataNiveau2[] = niveau1Data.map(n1 => ({
    ...n1,
    codePRC: 1,
    tempsPrisEnCompte: 0,
    fraisPrisEnCompte: 0,
    scoreFinancierN2: n1.scoreFinancier,
    pertesConstatéesN2: n1.pertesConstatees,
    pertesAvecIncapaciteN2: n1.pertesAvecIncapacite,
    economiesRealiseesN2: n1.economiesRealisees,
    pertesPercentN2: n1.pertesPercent,
  }));

  return {
    kpiCode: kpiDef.code,
    kpiName: kpiDef.name,
    kpiNameFr: kpiDef.nameFr,
    niveau1Data,
    niveau2Data,
    totalTempsN1: 0,
    totalFraisN1: 0,
    totalScoreFinancierN1: totalScoreFinancierEKH,
    totalPertesN1: totalPertesEKH,
    totalPprN1: pprData.ppr_hebdomadaire,
    totalEconomiesN1: totalEconomiesEKH,
    totalPertesPercentN1: pprData.ppr_hebdomadaire > 0 ? (totalPertesEKH / pprData.ppr_hebdomadaire) * 100 : 0,
    totalTempsN2: 0,
    totalFraisN2: 0,
    totalScoreFinancierN2: 0,
    totalPertesN2: 0,
    totalEconomiesN2: 0,
    totalPertesPercentN2: 0,
    totalTemps: 0,
    totalFrais: 0,
    totalScoreFinancier: totalScoreFinancierEKH,
    totalPertes: totalPertesEKH,
    totalPpr: pprData.ppr_hebdomadaire,
    totalEconomies: totalEconomiesEKH,
    totalPertesPercent: pprData.ppr_hebdomadaire > 0 ? (totalPertesEKH / pprData.ppr_hebdomadaire) * 100 : 0,
    nombreIncidents: 0,
    employesConcernes: Array.from(employeesSet),
    // Ancien format
    tempsCollecte: 0,
    fraisCollectes: 0,
    tempsCalcule: 0,
    scoreFinancier: totalScoreFinancierEKH,
    pprPrevues: pprData.ppr_hebdomadaire,
    pertesConstatees: totalPertesEKH,
    economiesRealisees: totalEconomiesEKH,
    pertesPercent: pprData.ppr_hebdomadaire > 0 ? (totalPertesEKH / pprData.ppr_hebdomadaire) * 100 : 0,
    coefficientCompetence: avgCoefficient,
    scoreFinancierEKH: totalScoreFinancierEKH,
    economiesEKH: totalEconomiesEKH,
    ekhParSalarie,
  };
}

// ============================================
// SYNTHÈSE LIGNE COMPLÈTE
// ============================================

export function calculateLineSynthesis(
  businessLineId: string,
  businessLineName: string,
  entries: CostEntry[],
  members: TeamMember[],
  pprData: PPRData,
  financialParams?: FinancialParams // Paramètre optionnel pour la nouvelle formule Score Financier
): SyntheseLigne {
  // Calculer chaque KPI (passe financialParams si fourni pour utiliser la formule correcte)
  const kpiResults: KPIResult[] = [
    calculateKPIResultComplete('abs', entries, members, pprData, financialParams),
    calculateKPIResultComplete('qd', entries, members, pprData, financialParams),
    calculateKPIResultComplete('oa', entries, members, pprData, financialParams),
    calculateKPIResultComplete('ddp', entries, members, pprData, financialParams),
  ];

  const ekhResult = calculateEKHResultComplete(members, pprData);

  // Totaux
  const totalTempsCalcule = kpiResults.reduce((sum, r) => sum + r.tempsCalcule, 0);
  const totalScoreFinancier = kpiResults.reduce((sum, r) => sum + r.scoreFinancier, 0) + ekhResult.scoreFinancier;
  const totalPertes = kpiResults.reduce((sum, r) => sum + r.pertesConstatees, 0) + ekhResult.pertesConstatees;
  const totalEconomies = kpiResults.reduce((sum, r) => sum + r.economiesRealisees, 0) + ekhResult.economiesRealisees;

  // Distribution
  const distribution = calculateDistribution(totalEconomies);

  // Synthèse Niveau 1 (par salarié)
  const syntheseNiveau1: SynthesePerformanceNiveau1[] = members.map(member => {
    const memberEconomiesABS = kpiResults[0].niveau1Data.find(d => d.employeeId === member.id)?.economiesRealisees || 0;
    const memberEconomiesDFQ = kpiResults[1].niveau1Data.find(d => d.employeeId === member.id)?.economiesRealisees || 0;
    const memberEconomiesADT = kpiResults[2].niveau1Data.find(d => d.employeeId === member.id)?.economiesRealisees || 0;
    const memberEconomiesEPD = kpiResults[3].niveau1Data.find(d => d.employeeId === member.id)?.economiesRealisees || 0;
    const memberEconomiesEKH = ekhResult.ekhParSalarie.find(d => d.employeeId === member.id)?.economiesRealisees || 0;
    const memberTotalEconomies = memberEconomiesABS + memberEconomiesDFQ + memberEconomiesADT + memberEconomiesEPD + memberEconomiesEKH;
    const contributionPercent = totalEconomies > 0 ? (memberTotalEconomies / totalEconomies) * 100 : 0;

    return {
      employeeId: member.id,
      nomSalarie: member.name,
      categorie: member.professional_category,
      scoresPertesPercent: 0, // Calculé selon la logique Excel
      partPrimeContribution: memberTotalEconomies * TAUX_PRIMES,
      partTresorerieContribution: memberTotalEconomies * TAUX_TRESORERIE,
      contributionPercent,
      trancheNotePercent: contributionPercent,
      triTrancheNote: contributionPercent >= 80 ? 'A' : contributionPercent >= 60 ? 'B' : contributionPercent >= 40 ? 'C' : 'D',
      triN2TrancheNote: contributionPercent >= 80 ? 'A' : contributionPercent >= 60 ? 'B' : contributionPercent >= 40 ? 'C' : 'D',
      scorePrimeTotal: memberTotalEconomies * TAUX_PRIMES,
      scoreNoteTotalPercent: contributionPercent,
      totalEconomieRealisee: memberTotalEconomies,
      tauxEconomieABS: totalEconomies > 0 ? (memberEconomiesABS / totalEconomies) * 100 : 0,
      tauxEconomieDFQ: totalEconomies > 0 ? (memberEconomiesDFQ / totalEconomies) * 100 : 0,
      tauxEconomieADT: totalEconomies > 0 ? (memberEconomiesADT / totalEconomies) * 100 : 0,
      tauxEconomieEPD: totalEconomies > 0 ? (memberEconomiesEPD / totalEconomies) * 100 : 0,
      tauxEconomieEKH: totalEconomies > 0 ? (memberEconomiesEKH / totalEconomies) * 100 : 0,
      totalTauxEconomie: contributionPercent,
    };
  });

  // Synthèse Niveau 2 (par indicateur)
  const syntheseNiveau2: SynthesePerformanceNiveau2[] = [
    { indicateur: 'Absentéisme', objectifLigne: kpiResults[0].pprPrevues, economiesRealisees: kpiResults[0].economiesRealisees },
    { indicateur: 'Défauts de Qualité', objectifLigne: kpiResults[1].pprPrevues, economiesRealisees: kpiResults[1].economiesRealisees },
    { indicateur: 'Accidents de Travail', objectifLigne: kpiResults[2].pprPrevues, economiesRealisees: kpiResults[2].economiesRealisees },
    { indicateur: 'Écart de Productivité Directe', objectifLigne: kpiResults[3].pprPrevues, economiesRealisees: kpiResults[3].economiesRealisees },
    { indicateur: 'Écart de Know-How', objectifLigne: ekhResult.pprPrevues, economiesRealisees: ekhResult.economiesRealisees },
  ];

  // Synthèse Niveau 3
  const syntheseNiveau3: SynthesePerformanceNiveau3 = {
    fluxTresorerie: distribution.tresorerie,
    sortiesPrimes: distribution.primes,
    partPrimeContribution: distribution.primes,
    contributionPercent: 100,
    trancheNotePercent: 100,
  };

  // Répartition Niveau 1
  const repartitionNiveau1: RepartitionPrimesNiveau1Salarie[] = members.map(member => {
    const getKPIEconomies = (kpiIndex: number) => kpiResults[kpiIndex]?.niveau1Data.find(d => d.employeeId === member.id)?.economiesRealisees || 0;
    const ekhEco = ekhResult.ekhParSalarie.find(d => d.employeeId === member.id)?.economiesRealisees || 0;
    const getKPIPpr = (kpiIndex: number) => kpiResults[kpiIndex]?.niveau1Data.find(d => d.employeeId === member.id)?.pprPrevues || 0;
    const ekhPpr = ekhResult.ekhParSalarie.find(d => d.employeeId === member.id)?.pprPrevues || 0;

    return {
      employeeId: member.id,
      nomSalarie: member.name,
      previsionnelPrimeABS: getKPIPpr(0) * TAUX_PRIMES,
      previsionnelTresorerieABS: getKPIPpr(0) * TAUX_TRESORERIE,
      realisePrimeABS: getKPIEconomies(0) * TAUX_PRIMES,
      realiseTresorerieABS: getKPIEconomies(0) * TAUX_TRESORERIE,
      previsionnelPrimeDFQ: getKPIPpr(1) * TAUX_PRIMES,
      previsionnelTresorerieDFQ: getKPIPpr(1) * TAUX_TRESORERIE,
      realisePrimeDFQ: getKPIEconomies(1) * TAUX_PRIMES,
      realiseTresorerieDFQ: getKPIEconomies(1) * TAUX_TRESORERIE,
      previsionnelPrimeADT: getKPIPpr(2) * TAUX_PRIMES,
      previsionnelTresorerieADT: getKPIPpr(2) * TAUX_TRESORERIE,
      realisePrimeADT: getKPIEconomies(2) * TAUX_PRIMES,
      realiseTresorerieADT: getKPIEconomies(2) * TAUX_TRESORERIE,
      previsionnelPrimeEPD: getKPIPpr(3) * TAUX_PRIMES,
      previsionnelTresorerieEPD: getKPIPpr(3) * TAUX_TRESORERIE,
      realisePrimeEPD: getKPIEconomies(3) * TAUX_PRIMES,
      realiseTresorerieEPD: getKPIEconomies(3) * TAUX_TRESORERIE,
      previsionnelPrimeEKH: ekhPpr * TAUX_PRIMES,
      previsionnelTresorerieEKH: ekhPpr * TAUX_TRESORERIE,
      realisePrimeEKH: ekhEco * TAUX_PRIMES,
      realiseTresorerieEKH: ekhEco * TAUX_TRESORERIE,
      totalPrevisionnelPrime: (getKPIPpr(0) + getKPIPpr(1) + getKPIPpr(2) + getKPIPpr(3) + ekhPpr) * TAUX_PRIMES,
      totalPrevisionnelTresorerie: (getKPIPpr(0) + getKPIPpr(1) + getKPIPpr(2) + getKPIPpr(3) + ekhPpr) * TAUX_TRESORERIE,
      totalRealisePrime: (getKPIEconomies(0) + getKPIEconomies(1) + getKPIEconomies(2) + getKPIEconomies(3) + ekhEco) * TAUX_PRIMES,
      totalRealiseTresorerie: (getKPIEconomies(0) + getKPIEconomies(1) + getKPIEconomies(2) + getKPIEconomies(3) + ekhEco) * TAUX_TRESORERIE,
    };
  });

  // Répartition Niveau 2
  const repartitionNiveau2: RepartitionPrimesNiveau2[] = [
    {
      indicateur: 'Absentéisme',
      totalPrevisionnelPrime: kpiResults[0].pprPrevues * TAUX_PRIMES,
      totalPrevisionnelTresorerie: kpiResults[0].pprPrevues * TAUX_TRESORERIE,
      totalRealisePrime: kpiResults[0].economiesRealisees * TAUX_PRIMES,
      totalRealiseTresorerie: kpiResults[0].economiesRealisees * TAUX_TRESORERIE,
    },
    {
      indicateur: 'Défauts de Qualité',
      totalPrevisionnelPrime: kpiResults[1].pprPrevues * TAUX_PRIMES,
      totalPrevisionnelTresorerie: kpiResults[1].pprPrevues * TAUX_TRESORERIE,
      totalRealisePrime: kpiResults[1].economiesRealisees * TAUX_PRIMES,
      totalRealiseTresorerie: kpiResults[1].economiesRealisees * TAUX_TRESORERIE,
    },
    {
      indicateur: 'Accidents de Travail',
      totalPrevisionnelPrime: kpiResults[2].pprPrevues * TAUX_PRIMES,
      totalPrevisionnelTresorerie: kpiResults[2].pprPrevues * TAUX_TRESORERIE,
      totalRealisePrime: kpiResults[2].economiesRealisees * TAUX_PRIMES,
      totalRealiseTresorerie: kpiResults[2].economiesRealisees * TAUX_TRESORERIE,
    },
    {
      indicateur: 'Écart de Productivité Directe',
      totalPrevisionnelPrime: kpiResults[3].pprPrevues * TAUX_PRIMES,
      totalPrevisionnelTresorerie: kpiResults[3].pprPrevues * TAUX_TRESORERIE,
      totalRealisePrime: kpiResults[3].economiesRealisees * TAUX_PRIMES,
      totalRealiseTresorerie: kpiResults[3].economiesRealisees * TAUX_TRESORERIE,
    },
    {
      indicateur: 'Écart de Know-How',
      totalPrevisionnelPrime: ekhResult.pprPrevues * TAUX_PRIMES,
      totalPrevisionnelTresorerie: ekhResult.pprPrevues * TAUX_TRESORERIE,
      totalRealisePrime: ekhResult.economiesRealisees * TAUX_PRIMES,
      totalRealiseTresorerie: ekhResult.economiesRealisees * TAUX_TRESORERIE,
    },
  ];

  // Total répartition
  const totalRepartition = {
    totalPrevisionnelPrime: repartitionNiveau2.reduce((sum, r) => sum + r.totalPrevisionnelPrime, 0),
    totalPrevisionnelTresorerie: repartitionNiveau2.reduce((sum, r) => sum + r.totalPrevisionnelTresorerie, 0),
    totalRealisePrime: repartitionNiveau2.reduce((sum, r) => sum + r.totalRealisePrime, 0),
    totalRealiseTresorerie: repartitionNiveau2.reduce((sum, r) => sum + r.totalRealiseTresorerie, 0),
  };

  // Employés uniques
  const allEmployees = new Set<string>();
  kpiResults.forEach(r => r.employesConcernes.forEach(e => allEmployees.add(e)));
  ekhResult.employesConcernes.forEach(e => allEmployees.add(e));

  return {
    businessLineId,
    businessLineName,
    kpiResults,
    ekhResult,
    syntheseNiveau1,
    syntheseNiveau2,
    syntheseNiveau3,
    repartitionNiveau1,
    repartitionNiveau2,
    totalRepartition,
    totalTempsCalcule,
    totalScoreFinancier,
    totalPertes,
    totalEconomies,
    fluxTresorerie: distribution.tresorerie,
    sortiesPrimes: distribution.primes,
    totalIncidents: kpiResults.reduce((sum, r) => sum + r.nombreIncidents, 0),
    employesConcernesUniques: Array.from(allEmployees),
  };
}

/**
 * Calcule la synthèse globale
 */
export function calculateGlobalSynthesis(lignes: SyntheseLigne[]): GlobalSynthesis {
  const grandTotalTemps = lignes.reduce((sum, l) => sum + l.totalTempsCalcule, 0);
  const grandTotalScoreFinancier = lignes.reduce((sum, l) => sum + l.totalScoreFinancier, 0);
  const grandTotalPertes = lignes.reduce((sum, l) => sum + l.totalPertes, 0);
  const grandTotalEconomies = lignes.reduce((sum, l) => sum + l.totalEconomies, 0);
  const grandTotalTresorerie = lignes.reduce((sum, l) => sum + l.fluxTresorerie, 0);
  const grandTotalPrimes = lignes.reduce((sum, l) => sum + l.sortiesPrimes, 0);

  const kpiTotals: Record<string, { pertes: number; economies: number }> = {};

  lignes.forEach(ligne => {
    ligne.kpiResults.forEach(kpi => {
      if (!kpiTotals[kpi.kpiCode]) {
        kpiTotals[kpi.kpiCode] = { pertes: 0, economies: 0 };
      }
      kpiTotals[kpi.kpiCode].pertes += kpi.pertesConstatees;
      kpiTotals[kpi.kpiCode].economies += kpi.economiesRealisees;
    });

    if (ligne.ekhResult) {
      if (!kpiTotals[ligne.ekhResult.kpiCode]) {
        kpiTotals[ligne.ekhResult.kpiCode] = { pertes: 0, economies: 0 };
      }
      kpiTotals[ligne.ekhResult.kpiCode].pertes += ligne.ekhResult.pertesConstatees;
      kpiTotals[ligne.ekhResult.kpiCode].economies += ligne.ekhResult.economiesRealisees;
    }
  });

  const repartitionKPI = Object.entries(kpiTotals).map(([code, data]) => {
    const kpiDef = Object.values(KPI_DEFINITIONS).find(d => d.code === code);
    return {
      kpiCode: code,
      kpiName: kpiDef?.name || code,
      totalPertes: data.pertes,
      totalEconomies: data.economies,
      percentOfTotal: grandTotalPertes > 0 ? (data.pertes / grandTotalPertes) * 100 : 0,
    };
  });

  return {
    lignes,
    grandTotalTemps,
    grandTotalScoreFinancier,
    grandTotalPertes,
    grandTotalEconomies,
    grandTotalTresorerie,
    grandTotalPrimes,
    repartitionKPI,
  };
}

// Pour compatibilité avec l'ancien code
export function calculateKPIResult(
  kpiType: 'abs' | 'qd' | 'oa' | 'ddp',
  entries: CostEntry[],
  members: TeamMember[],
  pprData: PPRData,
  financialParams?: FinancialParams
): KPIResult {
  return calculateKPIResultComplete(kpiType, entries, members, pprData, financialParams);
}

export function calculateEKHResult(members: TeamMember[], pprData: PPRData): EKHResult {
  return calculateEKHResultComplete(members, pprData);
}

// ============================================
// FORMATTERS
// ============================================

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================
// DONNÉES NIVEAU 2 AGRÉGÉES
// ============================================

/**
 * Interface pour les données N2 agrégées
 */
export interface TempsN2AggregatedData {
  business_line_id: string;
  kpi_type: string;
  total_temps_n2_hours: number;
  total_fees_n2: number;
  entries_count: number;
}

/**
 * Type pour le map des données N2 agrégées
 * Structure: { [businessLineId]: { [kpiType]: TempsN2AggregatedData } }
 */
export type TempsN2Map = Record<string, Record<string, TempsN2AggregatedData>>;

/**
 * Récupère tous les temps N2 agrégés pour une company/période
 * Équivalent Excel: =SI(ESTERREUR('20-Tri-NIVEAU2-LIGNES'!$S$37>0);0;(...))
 *
 * @param supabase - Client Supabase
 * @param companyId - ID de la company
 * @param periodStart - Date de début de période
 * @param periodEnd - Date de fin de période
 * @returns Map des données N2 par businessLine et kpiType
 */
export async function getAllTempsN2Aggregated(
  supabase: any, // SupabaseClient type
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<TempsN2Map> {
  try {
    const { data, error } = await supabase
      .rpc('get_all_temps_n2_aggregated', {
        p_company_id: companyId,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });

    if (error) {
      console.warn('[N2] Error fetching aggregated temps N2:', error);
      return {};
    }

    // Construire le map
    const tempsN2Map: TempsN2Map = {};
    (data || []).forEach((row: TempsN2AggregatedData) => {
      if (!tempsN2Map[row.business_line_id]) {
        tempsN2Map[row.business_line_id] = {};
      }
      tempsN2Map[row.business_line_id][row.kpi_type] = row;
    });

    return tempsN2Map;
  } catch (err) {
    console.warn('[N2] Exception fetching aggregated temps N2:', err);
    return {}; // Fallback vide comme ESTERREUR
  }
}

/**
 * Récupère le temps N2 agrégé pour une business_line/kpi spécifique
 * Utilise le map pré-chargé pour éviter les requêtes multiples
 *
 * @param tempsN2Map - Map pré-chargé des données N2
 * @param businessLineId - ID de la ligne d'activité
 * @param kpiType - Type de KPI (abs, qd, oa, ddp)
 * @param fallbackValue - Valeur de fallback si pas de données (défaut: 0)
 * @returns Temps N2 en heures décimales
 */
export function getTempsN2FromMap(
  tempsN2Map: TempsN2Map,
  businessLineId: string,
  kpiType: string,
  fallbackValue: number = 0
): number {
  return tempsN2Map?.[businessLineId]?.[kpiType]?.total_temps_n2_hours ?? fallbackValue;
}

/**
 * Récupère les frais N2 agrégés pour une business_line/kpi spécifique
 *
 * @param tempsN2Map - Map pré-chargé des données N2
 * @param businessLineId - ID de la ligne d'activité
 * @param kpiType - Type de KPI (abs, qd, oa, ddp)
 * @param fallbackValue - Valeur de fallback si pas de données (défaut: 0)
 * @returns Frais N2 en euros
 */
export function getFeesN2FromMap(
  tempsN2Map: TempsN2Map,
  businessLineId: string,
  kpiType: string,
  fallbackValue: number = 0
): number {
  return tempsN2Map?.[businessLineId]?.[kpiType]?.total_fees_n2 ?? fallbackValue;
}

// ============================================
// COLONNES SPÉCIFIQUES DDP (Écarts de Productivité Directe)
// ============================================

/**
 * PERTES AVEC INCAPACITÉ - SPÉCIFIQUE DDP (DD6)
 *
 * FORMULE EXCEL DD6:
 * =SI(DE6<0;CZ6--DE6;SI(DE6>0;CZ6-DE6;SI(DE6=0;CZ6-DE6)))
 *
 * Simplification:
 * - Si pertes < 0: PPR + |pertes| (PPR - (-pertes))
 * - Si pertes >= 0: PPR - pertes
 *
 * Où:
 * - CZ6 = PPR Prévues
 * - DE6 = Pertes Constatées
 *
 * @param pprPrevues - PPR Prévues (CZ6)
 * @param pertesConstatees - Pertes Constatées (DE6)
 * @returns Pertes avec incapacité pour DDP
 */
export function calculatePertesAvecIncapaciteDDP(
  pprPrevues: number,
  pertesConstatees: number
): number {
  if (pertesConstatees < 0) {
    // Pertes négatives: PPR - (-pertes) = PPR + |pertes|
    return pprPrevues - (-pertesConstatees);
  }
  // Pertes >= 0: PPR - pertes
  return pprPrevues - pertesConstatees;
}

/**
 * PERTES EN % - SPÉCIFIQUE DDP (DF6)
 *
 * FORMULE EXCEL DF6:
 * =SI(DD6=0;"0%";SI(ESTERREUR(DD6/DC6);0%;DD6/DC6))
 *
 * Où:
 * - DD6 = Pertes avec incapacité (calculé par calculatePertesAvecIncapaciteDDP)
 * - DC6 = $CU$3 = Total des pertes (référence)
 *
 * @param pertesAvecIncapacite - Pertes avec incapacité DDP (DD6)
 * @param totalPertesReference - Total des pertes ($CU$3)
 * @returns Pertes en % pour DDP (0-1, pas 0-100)
 */
export function calculatePertesEnPourcentageDDP(
  pertesAvecIncapacite: number,
  totalPertesReference: number
): number {
  if (pertesAvecIncapacite === 0) return 0;
  if (totalPertesReference === 0) return 0; // Éviter division par 0

  // Retourner le ratio (sera formaté en % à l'affichage)
  return pertesAvecIncapacite / totalPertesReference;
}
