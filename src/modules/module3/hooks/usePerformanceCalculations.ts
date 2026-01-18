/**
 * ============================================
 * HCM COST SAVINGS - PERFORMANCE CALCULATIONS HOOK
 * ============================================
 * 23 formules Excel pour le calcul des performances
 * Source: Feuille L1 du fichier Excel source a1RiskoM3-S1M1.xls
 */

import type {
  TeamMember,
  CostEntry,
  BusinessLine,
  FinancialParams,
  EmployeePerformance,
  IndicatorData,
  IndicatorTotals,
  KPIType,
} from '../types/performance';

// Import des fonctions du calculationEngine pour usage LOCAL
import {
  calculateScoreFinancier,
  calculatePertesConstateesBrut,
  calculatePertesConstateesAvecIncapacite,
  calculatePPRPrevues,
  calculatePPRPerPersonFromSources,
  calculateScoreFinancierN2,
  calculatePertesConstateesN2,
  // Import des fonctions N2 agrégées
  type TempsN2Map,
  getTempsN2FromMap,
  getFeesN2FromMap,
} from '../engine/calculationEngine';

// ============================================
// HELPER FUNCTIONS - FORMULES EXCEL CONFORMES
// ============================================

/**
 * Calcule le coefficient de compétence selon formule Excel:
 * = (F1 + F2 + F3) / 63
 */
const getVersatilityCoefficient = (level: string): number => {
  if (!level || level.includes("ne fait pas") || level.includes("Does not")) return 0;
  if (level.includes("Débutant") || level.includes("Apprentice")) return 7;
  if (level.includes("Confirmé") || level.includes("Confirmed")) return 14;
  if (level.includes("Expérimenté") || level.includes("Experimented")) return 21;
  return 0;
};

export const calculateCoefficientCompetence = (f1: string, f2: string, f3: string): number => {
  const coef1 = getVersatilityCoefficient(f1);
  const coef2 = getVersatilityCoefficient(f2);
  const coef3 = getVersatilityCoefficient(f3);
  return (coef1 + coef2 + coef3) / 63;
};

/**
 * Convertit durée (heures + minutes) en heures décimales
 */
export const convertToDecimalHours = (hours: number, minutes: number): number => {
  return hours + (minutes / 60);
};

/**
 * FORMULE EXCEL: M3-Temps-Calcul
 * NIVEAU 1: =E6+0 (Temps collecté + 0)
 * NIVEAU 2: =S6+0 (Temps collecté niveau 2 + 0)
 */
export const calculateTempsCalcul = (tempsCollecte: number): number => {
  return tempsCollecte + 0;
};

// Re-export depuis calculationEngine (SOURCE UNIQUE)
export {
  calculateScoreFinancier,
  calculatePertesConstateesBrut,
  calculatePertesConstateesAvecIncapacite,
  calculatePPRPrevues,
  // Fonctions PPR dynamique par période sélectionnée
  getPeriodInfoFromSelectedWeek,
  getPPRPerPersonForPeriod,
  calculatePPRPrevuesFromPeriod,
  getCurrentPeriodInfo,
  // 🆕 Recalcul PPR depuis les sources (évite drift avec DB)
  calculatePPRPerPersonFromSources,
} from '../engine/calculationEngine';

// Re-export types PPR dynamique
export type {
  SelectedPeriodInfo,
  PPRPerPersonData,
  PriorityActionData,
  PriorityActionDistribution,
  QuarterlyPPRData,
  // 🆕 Types pour recalcul PPR
  IndicatorRatesModule3,
  Module1BusinessLineData,
} from '../engine/calculationEngine';

/**
 * FORMULE EXCEL: ECONOMIES REALISEES (semaine) - Version 1
 */
export const calculateEconomiesRealiseesN1 = (
  tempsCalculN1: number,
  tempsCalculN2: number,
  salariéExiste: boolean,
  economiesBrut: number
): number => {
  if (tempsCalculN1 === 0 && tempsCalculN2 === 0 && salariéExiste) return economiesBrut;
  if (tempsCalculN1 === 0 && tempsCalculN2 === 0 && !salariéExiste) return 0;
  if (tempsCalculN1 > 0 && tempsCalculN2 === 0) return economiesBrut;
  if (tempsCalculN1 === 0 && tempsCalculN2 > 0) return 0;
  return 0;
};

/**
 * FORMULE EXCEL: ECONOMIES REALISEES (semaine) - Version brut finale
 */
export const calculateEconomiesRealiseesBrut = (
  pprPrevues: number,
  pertesConstatees: number
): number => {
  if (pertesConstatees < 0) return pprPrevues - 0;
  if (pertesConstatees > 0) return pprPrevues - pertesConstatees;
  if (pertesConstatees === 0) return pprPrevues - pertesConstatees;
  return 0;
};

/**
 * FORMULE EXCEL: Pertes en %
 */
export const calculatePertesEnPourcentage = (
  pertesConstatees: number,
  valeurReference: number
): number => {
  if (pertesConstatees < 0) return 0;
  if (pertesConstatees === 0) return 0;
  if (pertesConstatees > 0 && valeurReference !== 0) {
    return (pertesConstatees / valeurReference) * 100;
  }
  return 0;
};

/**
 * FORMULE EXCEL: code salariés P.R.C (Pris en compte) - NIVEAU 2
 */
export const calculateCodePRC = (tempsCollecteN2: number): number => {
  if (tempsCollecteN2 === 0) return 0;
  if (tempsCollecteN2 > 0) return 1;
  return 0;
};

/**
 * FORMULE EXCEL: M3-Temps-Pris en compte - NIVEAU 2
 */
export const calculateTempsPrisEnCompte = (codePRC: number, tempsCalcul: number): number => {
  if (codePRC === 0) return 0;
  if (codePRC > 0) return tempsCalcul;
  return 0;
};

/**
 * FORMULE EXCEL: M3-Les frais-Pris en compte - NIVEAU 2
 */
export const calculateFraisPrisEnCompte = (codePRC: number, fraisCollectes: number): number => {
  if (codePRC === 0) return 0;
  if (codePRC > 0) return fraisCollectes;
  return 0;
};

/**
 * FORMULE EXCEL: ECONOMIES REALISEES - NIVEAU 2
 */
export const calculateEconomiesRealiseesN2 = (
  tempsCalculN1: number,
  tempsPrisEnCompte: number,
  pprPrevuesN2: number
): number => {
  if (tempsCalculN1 === 0 && tempsPrisEnCompte === 0) return 0;
  if (tempsCalculN1 > 0 && tempsPrisEnCompte === 0) return 0;
  if (tempsCalculN1 === 0 && tempsPrisEnCompte > 0) return pprPrevuesN2;
  return 0;
};

// Re-export depuis calculationEngine (SOURCE UNIQUE)
export { calculateScoreFinancierN2, calculatePertesConstateesN2 } from '../engine/calculationEngine';

/**
 * FORMULE EXCEL: ECONOMIES REALISEES 2 (semaine) NIVEAU 2
 */
export const calculateEconomiesRealisees2N2 = (
  pprPrevuesN2: number,
  pertesConstateesN2: number
): number => {
  if (pertesConstateesN2 < 0) return pprPrevuesN2 - 0;
  if (pertesConstateesN2 > 0) return pprPrevuesN2 - pertesConstateesN2;
  if (pertesConstateesN2 === 0) return pprPrevuesN2 - pertesConstateesN2;
  return 0;
};

/**
 * FORMULE EXCEL: Pertes en % NIVEAU 2
 */
export const calculatePertesEnPourcentageN2 = (
  pertesConstateesN2: number,
  totalPertesReference: number
): number => {
  if (pertesConstateesN2 < 0) return 0;
  if (pertesConstateesN2 === 0) return 0;
  if (pertesConstateesN2 > 0 && totalPertesReference !== 0) {
    return (pertesConstateesN2 / totalPertesReference) * 100;
  }
  return 0;
};

// ============================================
// MAIN CALCULATION FUNCTIONS
// ============================================

const getIndicatorId = (kpi: string): string => {
  switch (kpi) {
    case 'abs': return 'absenteeism';
    case 'qd': return 'quality';
    case 'oa': return 'accidents';
    case 'ddp': return 'productivity';
    case 'ekh': return 'knowhow';
    default: return '';
  }
};

export const calculateIndicatorData = (
  kpiType: string,
  kpiEntries: CostEntry[],
  member: TeamMember,
  coefficientCompetence: number,
  params: FinancialParams,
  memberBusinessLineName: string,
  salariéExiste: boolean,
  // 🆕 Paramètres optionnels pour données N2 agrégées (Option B - Audit DK6)
  tempsN2Map?: TempsN2Map,
  businessLineId?: string
): IndicatorData => {
  // Aggregate data from all entries for this KPI
  let totalHours = 0;
  let totalMinutes = 0;
  let totalFrais = 0;
  let totalSavedExpenses = 0;
  let totalRecoveredHours = 0;
  let totalRecoveredMinutes = 0;

  kpiEntries.forEach(entry => {
    totalHours += entry.duration_hours || 0;
    totalMinutes += entry.duration_minutes || 0;
    totalFrais += entry.compensation_amount || 0;
    totalSavedExpenses += entry.saved_expenses || 0;
    totalRecoveredHours += entry.recovered_time_hours || 0;
    totalRecoveredMinutes += entry.recovered_time_minutes || 0;
  });

  // NIVEAU 1: Données collectées
  const tempsCollecte = convertToDecimalHours(totalHours, totalMinutes);
  const tempsCalculN1 = calculateTempsCalcul(tempsCollecte);
  const fraisCollectes = totalFrais;

  // NIVEAU 2: Données agrégées par ligne d'activité (Option B - Audit DK6)
  // Équivalent Excel: =SI(ESTERREUR('20-Tri-NIVEAU2-LIGNES'!$S$37>0);0;(...))
  // Si tempsN2Map fourni et businessLineId présent, utiliser les données agrégées
  // Sinon fallback sur tempsCollecte (comportement précédent)
  const tempsCollecteN2 = (tempsN2Map && businessLineId)
    ? getTempsN2FromMap(tempsN2Map, businessLineId, kpiType, tempsCollecte)
    : tempsCollecte;
  const tempsCalculN2 = calculateTempsCalcul(tempsCollecteN2);

  // Score Financier
  let scoreFinancier: number;
  if (kpiType === 'ekh') {
    const FACTEUR_EKH = 1000;
    scoreFinancier = coefficientCompetence * FACTEUR_EKH;
  } else {
    scoreFinancier = calculateScoreFinancier(
      tempsCalculN1,
      params.recettesN1,
      params.depensesN1,
      params.volumeHoraireN1
    );
  }

  // PPR PREVUES (calculé AVANT Pertes car nécessaire pour la formule Excel)
  // 🆕 RECALCUL PPR DEPUIS LES SOURCES (évite drift avec données stockées en DB)
  // Même logique que Module 1 Page14PriorityActionsN1.tsx
  const indicatorId = getIndicatorId(kpiType);

  const pprParPersonneParIndicateur = calculatePPRPerPersonFromSources(
    memberBusinessLineName,
    indicatorId,
    params.gainsN1 || 0,
    params.indicatorRates,
    params.module1BusinessLines
  );

  const pprPrevues = calculatePPRPrevues(salariéExiste, pprParPersonneParIndicateur);

  // Pertes Constatées N1 (APRÈS calcul PPR car formule Excel utilise PPR)
  // FORMULE EXCEL M6: =SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))
  // Où: H6=Score Financier, G6=Frais, D6=PPR Prévues
  // ÉTAPE 1: Calcul des pertes brutes (Score + Frais - PPR)
  const pertesConstateesBrut = calculatePertesConstateesBrut(
    scoreFinancier,
    fraisCollectes,
    pprPrevues  // D6 = PPR Prévues (corrigé: était member.incapacity_rate)
  );
  // ÉTAPE 2: Application du taux d'incapacité (Logique B validée)
  // Pertes avec incapacité = Pertes brutes × (TauxIncapacité / 100)
  const pertesConstatees = calculatePertesConstateesAvecIncapacite(
    pertesConstateesBrut,
    member.incapacity_rate
  );

  // Économies
  const economiesBrut = calculateEconomiesRealiseesBrut(pprPrevues, pertesConstatees);

  // 🆕 AJOUT: Conversion du temps récupéré en valeur monétaire (économies DDP)
  // Le temps récupéré représente le gain de productivité en temps
  // Exemple: Mistral fait gagner 30mn → 0.5h × margeHoraire = économie en ¥
  // Formule: tempsRécupéré × ((recettesN1 - dépensesN1) / volumeHoraireN1) × 1000
  const totalRecoveredDecimalHours = totalRecoveredHours + (totalRecoveredMinutes / 60);
  const economiesTempsRecupere = (kpiType === 'ddp' && totalRecoveredDecimalHours > 0)
    ? calculateScoreFinancier(
        totalRecoveredDecimalHours,
        params.recettesN1,
        params.depensesN1,
        params.volumeHoraireN1
      )
    : 0;

  const economiesRealisees = calculateEconomiesRealiseesN1(
    tempsCalculN1,
    tempsCalculN2,
    salariéExiste,
    economiesBrut
  ) + totalSavedExpenses + economiesTempsRecupere; // ← AJOUT: économies du temps récupéré DDP

  // PASSE 1: pertesEnPourcentage = 0 (placeholder)
  // La vraie valeur sera calculée en PASSE 2 après avoir le total des pertes ($E$3)
  // Formule Excel L6: =SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6/$E$3)))
  // $E$3 = Total pertes N1 + N2 de tous les salariés (inconnu à ce stade)
  const pertesEnPourcentage = 0; // Sera recalculé par recalculatePertesEnPourcentage

  // NIVEAU 2: Code PRC
  const codePRCValue = calculateCodePRC(tempsCollecteN2);
  const codePRC = codePRCValue === 1;

  const tempsPrisEnCompte = calculateTempsPrisEnCompte(codePRCValue, tempsCalculN2);
  const fraisPrisEnCompte = calculateFraisPrisEnCompte(codePRCValue, totalSavedExpenses);

  const economiesRealisees2 = calculateEconomiesRealiseesBrut(pprPrevues, pertesConstatees);

  // NIVEAU 2 calculs
  const fraisCollectesN2 = totalSavedExpenses;

  let scoreFinancierN2: number;
  if (kpiType === 'ekh') {
    scoreFinancierN2 = codePRC ? coefficientCompetence * 1000 : 0;
  } else {
    scoreFinancierN2 = calculateScoreFinancierN2(
      tempsPrisEnCompte,
      params.recettesN1,
      params.depensesN1,
      params.volumeHoraireN1
    );
  }

  // NIVEAU 2: PPR Prévues (identique à N1)
  const pprPrevuesN2 = pprPrevues;

  // NIVEAU 2: Pertes Constatées (APRÈS pprPrevuesN2)
  // FORMULE EXCEL AC6: =SI((X6+W6)=0;0;SI((X6+W6)>0;(X6+W6)-R6))
  // Où: X6=Score Financier N2, W6=Frais N2, R6=PPR Prévues N2
  const pertesConstateesN2Raw = calculatePertesConstateesN2(
    scoreFinancierN2,
    fraisPrisEnCompte,
    pprPrevuesN2  // R6 = PPR Prévues N2 (corrigé: était member.incapacity_rate)
  );
  // Application du taux d'incapacité (Logique B) pour NIVEAU 2
  const pertesConstateesN2Final = calculatePertesConstateesAvecIncapacite(
    pertesConstateesN2Raw,
    member.incapacity_rate
  );

  // FORMULE EXCEL AA6: =SI(ET(F6=0;U6=0);0;SI(ET(F6>0;U6=0);0;SI(ET(F6=0;U6>0);AD6)))
  // AD6 = PPR Prévues N2 (pas economiesRealisees2N2)
  const economiesRealiseesN2 = calculateEconomiesRealiseesN2(
    tempsCalculN1,
    tempsPrisEnCompte,
    pprPrevuesN2  // AD6 = PPR Prévues N2
  );

  // FORMULE EXCEL: Z6-AC6 (PPR N2 - Pertes N2 brutes)
  // AC6 = pertesConstateesN2Raw (avant incapacité), pas pertesConstateesN2Final
  const economiesRealisees2N2 = calculateEconomiesRealisees2N2(pprPrevuesN2, pertesConstateesN2Raw);

  // PASSE 1: pertesEnPourcentageN2 = 0 (placeholder)
  // La vraie valeur sera calculée en PASSE 2 après avoir le total des pertes ($E$3)
  // Formule Excel AB6: =SI(AC6<0;0;SI(AC6=0;0;SI(AC6>0;AC6/$E$3)))
  // $E$3 = Total pertes N1 + N2 de tous les salariés (inconnu à ce stade)
  const pertesEnPourcentageN2 = 0; // Sera recalculé par recalculatePertesEnPourcentageN2

  return {
    tempsCollecte,
    tempsCalcul: tempsCalculN1,
    fraisCollectes,
    scoreFinancier,
    pertesConstatees,
    pprPrevues,
    economiesRealisees,
    economiesRealisees2,
    pertesEnPourcentage,
    codePRC,
    tempsCollecteN2,
    tempsCalculN2,
    tempsPrisEnCompte,
    fraisCollectesN2,
    fraisPrisEnCompte,
    scoreFinancierN2,
    pertesConstateesN2: pertesConstateesN2Final,
    pprPrevuesN2,
    economiesRealiseesN2,
    economiesRealisees2N2,
    pertesEnPourcentageN2
  };
};

export const calculateEmployeePerformances = (
  members: TeamMember[],
  entries: CostEntry[],
  params: FinancialParams,
  businessLines: BusinessLine[]
): EmployeePerformance[] => {
  const blMap = new Map<string, BusinessLine>();
  businessLines.forEach(bl => blMap.set(bl.id, bl));

  const entriesByEmployee = new Map<string, Map<string, CostEntry[]>>();
  entries.forEach(entry => {
    if (!entriesByEmployee.has(entry.employee_id)) {
      entriesByEmployee.set(entry.employee_id, new Map());
    }
    const employeeEntries = entriesByEmployee.get(entry.employee_id)!;
    if (!employeeEntries.has(entry.kpi_type)) {
      employeeEntries.set(entry.kpi_type, []);
    }
    employeeEntries.get(entry.kpi_type)!.push(entry);
  });

  return members.map(member => {
    const memberEntries = entriesByEmployee.get(member.id) || new Map();
    const coefficientCompetence = calculateCoefficientCompetence(
      member.versatility_f1,
      member.versatility_f2,
      member.versatility_f3
    );

    const memberBusinessLine = blMap.get(member.business_line_id);
    const memberBLName = memberBusinessLine?.activity_name || '';
    const salariéExiste = member.name && member.name.trim() !== '';

    const getIndicatorData = (kpiType: string): IndicatorData => {
      const kpiEntries = memberEntries.get(kpiType) || [];
      return calculateIndicatorData(
        kpiType,
        kpiEntries,
        member,
        coefficientCompetence,
        params,
        memberBLName,
        salariéExiste
      );
    };

    return {
      employeeId: member.id,
      employeeName: member.name,
      professionalCategory: member.professional_category || 'Non définie',
      incapacityRate: member.incapacity_rate,
      coefficientCompetence,
      businessLineId: member.business_line_id,
      businessLineName: memberBLName || 'Équipe inconnue',
      abs: getIndicatorData('abs'),
      qd: getIndicatorData('qd'),
      oa: getIndicatorData('oa'),
      ddp: getIndicatorData('ddp'),
      ekh: getIndicatorData('ekh')
    };
  });
};

export const calculateIndicatorTotals = (
  performances: EmployeePerformance[],
  kpiType: KPIType
): IndicatorTotals => {
  const getData = (perf: EmployeePerformance): IndicatorData => {
    return perf[kpiType];
  };

  const totals = performances.reduce((acc, perf) => {
    const data = getData(perf);
    return {
      tempsTotal: acc.tempsTotal + data.tempsCalcul,
      fraisTotal: acc.fraisTotal + data.fraisCollectes,
      scoreFinancierTotal: acc.scoreFinancierTotal + data.scoreFinancier,
      pertesConstateesTotal: acc.pertesConstateesTotal + data.pertesConstatees,
      pprPrevuesTotal: acc.pprPrevuesTotal + data.pprPrevues,
      economiesRealiseesTotal: acc.economiesRealiseesTotal + data.economiesRealisees,
      pertesEnPourcentageTotal: 0,
      tempsTotalN2: acc.tempsTotalN2 + data.tempsPrisEnCompte,
      fraisTotalN2: acc.fraisTotalN2 + data.fraisPrisEnCompte,
      scoreFinancierTotalN2: acc.scoreFinancierTotalN2 + data.scoreFinancierN2,
      pertesConstateesTotalN2: acc.pertesConstateesTotalN2 + data.pertesConstateesN2,
      economiesRealiseesTotalN2: acc.economiesRealiseesTotalN2 + data.economiesRealisees2N2,
      pertesEnPourcentageTotalN2: 0,
      tempsTotalCombine: 0,
      fraisTotalCombine: 0,
      scoreFinancierTotalCombine: 0,
      pertesConstateesTotalCombine: 0,
      economiesRealiseesTotalCombine: 0,
      pertesEnPourcentageTotalCombine: 0
    };
  }, {
    tempsTotal: 0,
    fraisTotal: 0,
    scoreFinancierTotal: 0,
    pertesConstateesTotal: 0,
    pprPrevuesTotal: 0,
    economiesRealiseesTotal: 0,
    pertesEnPourcentageTotal: 0,
    tempsTotalN2: 0,
    fraisTotalN2: 0,
    scoreFinancierTotalN2: 0,
    pertesConstateesTotalN2: 0,
    economiesRealiseesTotalN2: 0,
    pertesEnPourcentageTotalN2: 0,
    tempsTotalCombine: 0,
    fraisTotalCombine: 0,
    scoreFinancierTotalCombine: 0,
    pertesConstateesTotalCombine: 0,
    economiesRealiseesTotalCombine: 0,
    pertesEnPourcentageTotalCombine: 0
  });

  // Calculate percentages avec $E$3 = Total pertes N1 + N2
  // Formule Excel: L6 = M6/$E$3 et AB6 = AC6/$E$3
  const totalPertesE3 = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;

  totals.pertesEnPourcentageTotal = calculatePertesEnPourcentage(
    totals.pertesConstateesTotal,
    totalPertesE3 > 0 ? totalPertesE3 : 1  // $E$3
  );

  totals.pertesEnPourcentageTotalN2 = calculatePertesEnPourcentageN2(
    totals.pertesConstateesTotalN2,
    totalPertesE3 > 0 ? totalPertesE3 : 1  // $E$3
  );

  // NIVEAU TOTAL
  totals.tempsTotalCombine = totals.tempsTotal + totals.tempsTotalN2;
  totals.fraisTotalCombine = totals.fraisTotal + totals.fraisTotalN2;
  totals.scoreFinancierTotalCombine = totals.scoreFinancierTotal + totals.scoreFinancierTotalN2;

  const totalScoreEtFraisCombine = totals.scoreFinancierTotalCombine + totals.fraisTotalCombine;
  if (totalScoreEtFraisCombine === 0) {
    totals.pertesConstateesTotalCombine = 0;
  } else if (totalScoreEtFraisCombine > 0) {
    totals.pertesConstateesTotalCombine = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;
  } else {
    totals.pertesConstateesTotalCombine = 0;
  }

  totals.economiesRealiseesTotalCombine = totals.economiesRealiseesTotal + totals.economiesRealiseesTotalN2;
  totals.pertesEnPourcentageTotalCombine = totals.pertesEnPourcentageTotal + totals.pertesEnPourcentageTotalN2;

  return totals;
};

/**
 * PASSE 2: Recalcule pertesEnPourcentage (N1) et pertesEnPourcentageN2 (N2) pour tous les salariés
 *
 * Formule Excel L6 (N1): =SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6/$E$3)))
 * Formule Excel AB6 (N2): =SI(AC6<0;0;SI(AC6=0;0;SI(AC6>0;AC6/$E$3)))
 *
 * $E$3 = Total des pertes N1 + N2 de TOUS les salariés (même dénominateur pour N1 et N2)
 *
 * @param performances - Les performances calculées en PASSE 1
 * @param kpiType - Le type d'indicateur
 * @param totals - Les totaux calculés (contient $E$3 = pertesConstateesTotal + pertesConstateesTotalN2)
 * @returns Les performances avec pertesEnPourcentage et pertesEnPourcentageN2 recalculés
 */
export const recalculatePertesEnPourcentage = (
  performances: EmployeePerformance[],
  kpiType: KPIType,
  totals: IndicatorTotals
): EmployeePerformance[] => {
  // $E$3 = Total des pertes N1 + N2 de tous les salariés pour cet indicateur
  const totalPertesE3 = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;

  return performances.map(perf => {
    const data = perf[kpiType];

    // Formule Excel L6 (N1): =SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6/$E$3)))
    const pertesEnPourcentageRecalcule = calculatePertesEnPourcentage(
      data.pertesConstatees,
      totalPertesE3 > 0 ? totalPertesE3 : 1
    );

    // Formule Excel AB6 (N2): =SI(AC6<0;0;SI(AC6=0;0;SI(AC6>0;AC6/$E$3)))
    const pertesEnPourcentageN2Recalcule = calculatePertesEnPourcentageN2(
      data.pertesConstateesN2,
      totalPertesE3 > 0 ? totalPertesE3 : 1
    );

    return {
      ...perf,
      [kpiType]: {
        ...data,
        pertesEnPourcentage: pertesEnPourcentageRecalcule,
        pertesEnPourcentageN2: pertesEnPourcentageN2Recalcule
      }
    };
  });
};

// Alias pour compatibilité (ancien nom)
export const recalculatePertesEnPourcentageN2 = recalculatePertesEnPourcentage;
