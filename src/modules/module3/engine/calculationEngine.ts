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
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  return tauxMargeHoraire * tempsCollecte;
}

/**
 * Calcule les pertes constatées
 * Formule Excel M6: =IF((H6+G6)=0,0,IF((H6+G6)>0,(H6+G6)-D6))
 */
export function calculatePertesConstatees(
  scoreFinancier: number,
  frais: number,
  tauxIncapacite: number
): number {
  const total = scoreFinancier + frais;
  if (total === 0) return 0;
  if (total > 0) return total - tauxIncapacite;
  return 0;
}

/**
 * Calcule les pertes avec prise en compte du taux d'incapacité
 * Formule Excel I6: =IF(M6<0,0,IF(M6=0,0,IF(M6>0,M6)))
 */
export function calculatePertesAvecIncapacite(pertesConstatees: number): number {
  if (pertesConstatees < 0) return 0;
  if (pertesConstatees === 0) return 0;
  return pertesConstatees;
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
