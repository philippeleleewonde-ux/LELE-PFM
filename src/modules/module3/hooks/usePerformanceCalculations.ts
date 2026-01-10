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

/**
 * FORMULE EXCEL: Score financier
 * =(('2-Tri-TB Fixe-Données Risko M1'!L3-'2-Tri-TB Fixe-Données Risko M1'!M3)/'2-Tri-TB Fixe-Données Risko M1'!K3)*E6
 */
export const calculateScoreFinancier = (
  tempsCalcul: number,
  recettesN1: number,
  depensesN1: number,
  volumeHoraireN1: number
): number => {
  if (volumeHoraireN1 === 0) return 0;
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  return tauxMargeHoraire * tempsCalcul;
};

/**
 * FORMULE EXCEL: Pertes constatées avec prise en compte du taux d'incapacité (semaine)
 * =SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6)))
 */
export const calculatePertesConstateesAvecIncapacite = (pertesConstateesBrut: number): number => {
  if (pertesConstateesBrut < 0) return 0;
  if (pertesConstateesBrut === 0) return 0;
  if (pertesConstateesBrut > 0) return pertesConstateesBrut;
  return 0;
};

/**
 * FORMULE EXCEL: Pertes Constatées (brut)
 * =SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))
 */
export const calculatePertesConstateesBrut = (
  scoreFinancier: number,
  fraisCollectes: number,
  tauxIncapacite: number
): number => {
  const total = scoreFinancier + fraisCollectes;
  if (total === 0) return 0;
  if (total > 0) {
    return total - tauxIncapacite;
  }
  return 0;
};

/**
 * FORMULE EXCEL: PPR PREVUES (semaine)
 * =SI(B6<>0;('2-Tri-TB Fixe-Données Risko M1'!O3/3)/4;SI(B6=0;0))
 * Conversion k€ → €
 */
export const calculatePPRPrevues = (
  salariéExiste: boolean,
  pprParPersonneParIndicateur: number
): number => {
  if (!salariéExiste) return 0;
  if (pprParPersonneParIndicateur === 0) return 0;

  const pprEnUnites = pprParPersonneParIndicateur * 1000;
  const pprSemaine = (pprEnUnites / 3) / 4;
  return pprSemaine;
};

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

/**
 * FORMULE EXCEL: Score Financier NIVEAU 2
 */
export const calculateScoreFinancierN2 = (
  tempsPrisEnCompte: number,
  recettesN1: number,
  depensesN1: number,
  volumeHoraireN1: number
): number => {
  if (volumeHoraireN1 === 0) return 0;
  const tauxMargeHoraire = (recettesN1 - depensesN1) / volumeHoraireN1;
  return tauxMargeHoraire * tempsPrisEnCompte;
};

/**
 * FORMULE EXCEL: Pertes Constatées NIVEAU 2
 */
export const calculatePertesConstateesN2 = (
  scoreFinancierN2: number,
  fraisPrisEnCompte: number,
  tauxIncapacite: number
): number => {
  const total = scoreFinancierN2 + fraisPrisEnCompte;
  if (total === 0) return 0;
  if (total > 0) return total - tauxIncapacite;
  return 0;
};

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
  salariéExiste: boolean
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

  // NIVEAU 2: Données collectées identiques au N1
  const tempsCollecteN2 = tempsCollecte;
  const tempsCalculN2 = calculateTempsCalcul(tempsCollecte);

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

  // Pertes Constatées
  const pertesConstateesBrut = calculatePertesConstateesBrut(
    scoreFinancier,
    fraisCollectes,
    member.incapacity_rate
  );
  const pertesConstatees = calculatePertesConstateesAvecIncapacite(pertesConstateesBrut);

  // PPR PREVUES
  const priorityActionsN1 = params.priorityActionsN1 || [];
  const indicatorId = getIndicatorId(kpiType);

  let pprParPersonneParIndicateur = 0;
  const blData = priorityActionsN1.find((bl) =>
    bl.businessLine && bl.businessLine.toLowerCase() === memberBusinessLineName.toLowerCase()
  );

  if (blData && blData.distributions) {
    const indicatorDist = blData.distributions.find((d) => d.indicator === indicatorId);
    if (indicatorDist) {
      pprParPersonneParIndicateur = indicatorDist.perPerson || 0;
    }
  }

  const pprPrevues = calculatePPRPrevues(salariéExiste, pprParPersonneParIndicateur);

  // Économies
  const economiesBrut = calculateEconomiesRealiseesBrut(pprPrevues, pertesConstatees);
  const economiesRealisees = calculateEconomiesRealiseesN1(
    tempsCalculN1,
    tempsCalculN2,
    salariéExiste,
    economiesBrut
  ) + totalSavedExpenses;

  const pertesEnPourcentage = calculatePertesEnPourcentage(
    pertesConstatees,
    pprPrevues > 0 ? pprPrevues : 1
  );

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

  const pertesConstateesN2Raw = calculatePertesConstateesN2(
    scoreFinancierN2,
    fraisPrisEnCompte,
    member.incapacity_rate
  );
  const pertesConstateesN2Final = calculatePertesConstateesAvecIncapacite(pertesConstateesN2Raw);

  const pprPrevuesN2 = pprPrevues;

  const economiesRealiseesN2 = calculateEconomiesRealiseesN2(
    tempsCalculN1,
    tempsPrisEnCompte,
    calculateEconomiesRealisees2N2(pprPrevuesN2, pertesConstateesN2Final)
  );

  const economiesRealisees2N2 = calculateEconomiesRealisees2N2(pprPrevuesN2, pertesConstateesN2Final);

  const pertesEnPourcentageN2 = calculatePertesEnPourcentageN2(
    pertesConstateesN2Final,
    pprPrevuesN2 > 0 ? pprPrevuesN2 : 1
  );

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

  // Calculate percentages
  totals.pertesEnPourcentageTotal = calculatePertesEnPourcentage(
    totals.pertesConstateesTotal,
    totals.pprPrevuesTotal > 0 ? totals.pprPrevuesTotal : 1
  );

  const totalPertesReference = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;
  totals.pertesEnPourcentageTotalN2 = calculatePertesEnPourcentageN2(
    totals.pertesConstateesTotalN2,
    totalPertesReference > 0 ? totalPertesReference : 1
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
