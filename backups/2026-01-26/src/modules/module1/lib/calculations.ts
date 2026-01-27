import type { FormData, CalculatedFields, FinancialData } from '@/modules/module1/types';

// Moteur de calcul V3 - Entièrement ré-analysé et corrigé par le Chef de Projet
// Cette version est la seule version de confiance.
export class CFOCalculationEngine {
  // Qualitative conversion helpers (used by Pages 5, 9, 10)
  static convertQualitativeToQuantitative(value: string | number): number {
    if (typeof value === 'number') return value;
    const map: Record<string, number> = {
      'Not important at all': 1,
      'Not very important': 2,
      'Somewhat important': 3,
      'Important': 4,
      'Very important': 5,
    };
    return map[value] ?? 3;
  }

  static convertQuantitativeToQualitative(value: number | string): string {
    if (typeof value === 'string') return value;
    const v = Math.max(1, Math.min(5, Math.round(value)));
    const reverse: Record<number, string> = {
      1: 'Not important at all',
      2: 'Not very important',
      3: 'Somewhat important',
      4: 'Important',
      5: 'Very important',
    };
    return reverse[v];
  }

  // Socioeconomic weighting (Page 6/9): 0..4 scale as per source fields 210..215
  static convertSocioQualToWeight(value: string | number): number {
    if (typeof value === 'number') {
      // Accept 0..4 directly; if given 1..5, shift to 0..4
      if (value >= 0 && value <= 4) return value;
      if (value >= 1 && value <= 5) return value - 1;
      return Math.max(0, Math.min(4, Math.round(value)));
    }
    const map: Record<string, number> = {
      'Not important at all': 0,
      'Not very important': 1,
      'Somewhat important': 2,
      'Important': 3,
      'Very important': 4,
    };
    return map[value] ?? 2;
  }

  static calculateAll(formData: FormData): CalculatedFields {
    const calculated: Partial<CalculatedFields> = {};

    // Extraire les données d'entrée de manière sécurisée
    const salesHistory = (formData.employeeEngagement?.financialHistory || []).map(item => item.sales);
    const spendingHistory = (formData.employeeEngagement?.financialHistory || []).map(item => item.spending);
    const totalStaff = (formData.businessLines || []).reduce((sum, line) => sum + (line.staffCount || 0), 0);
    const businessSector = formData.companyInfo?.businessSector || 'No choice';
    const totalUL = formData.riskData?.totalUL || 0;
    const yearsOfCollection = formData.riskData?.yearsOfCollection || 1;

    // L'ordre de calcul est crucial et suit les dépendances de l'application source
    this.calculatePotentialsAndGaps(salesHistory, spendingHistory, calculated);
    this.calculateExpectedLosses(calculated);
    this.calculateStatisticalMeasures(calculated);
    this.calculateUnexpectedLosses(totalUL, yearsOfCollection, totalStaff, businessSector, calculated);
    this.calculateHistoricRiskAppetite(calculated);
    
    // La VaR doit être calculée APRÈS UL et EL
    calculated.var = (calculated.ulCalcul || 0) + (calculated.totalELHistorique || 0);

    this.calculatePRL(calculated);
    this.calculateForecastEL(calculated);
    this.calculateThreeYearPlan(calculated);

    // 🆕 Calculer les indicateurs de performance pour Page 14
    this.calculatePerformanceIndicators(formData.socioeconomicImprovement, calculated);

    // 🆕 Calculer et sauvegarder les PPR par personne par indicateur par business line (Page 14, 15, 16)
    // Ces données sont utilisées par le Module 3 HCM COST SAVINGS
    this.calculatePriorityActionsDistributions(formData.businessLines || [], calculated);

    return calculated as CalculatedFields;
  }

  // Étape 1: Calculer les potentiels et les écarts (la base pour EL)
  private static calculatePotentialsAndGaps(sales: number[], spending: number[], calculated: Partial<CalculatedFields>) {
    if (sales.length < 5 || spending.length < 5) return;

    const avgSalesRate = this.getAverageRate(sales);
    const avgSpendingRate = this.getAverageRate(spending);

    for (let i = 0; i < 5; i++) {
      const potentialSales = sales[i] * (1 + avgSalesRate / 100);
      const potentialSpending = spending[i] * (1 + avgSpendingRate / 100);
      // Utiliser des écarts positifs (valeur absolue) comme dans l'app source (champs 125..129 & 135..139)
      (calculated as any)[`ecartCAN${i + 1}`] = Math.abs(potentialSales - sales[i]);
      (calculated as any)[`ecartDepensesN${i + 1}`] = Math.abs(potentialSpending - spending[i]);
    }
  }

  // Étape 2: Calculer les pertes attendues (EL)
  private static calculateExpectedLosses(calculated: Partial<CalculatedFields>) {
    const salesGaps = [1, 2, 3, 4, 5].map(i => (calculated as any)[`ecartCAN${i}`] || 0);
    const spendingGaps = [1, 2, 3, 4, 5].map(i => (calculated as any)[`ecartDepensesN${i}`] || 0);

    const elCA = salesGaps.reduce((sum, gap) => sum + gap, 0) / salesGaps.length;
    const elDepenses = spendingGaps.reduce((sum, gap) => sum + gap, 0) / spendingGaps.length;

    calculated.totalELHistorique = elCA + elDepenses;
  }

  // Étape 3: Calculer les mesures statistiques (pour Historic Risk Appetite)
  private static calculateStatisticalMeasures(calculated: Partial<CalculatedFields>) {
    // Conformément au champ 169: somme des écarts-types issus des écarts calculés
    const salesGaps = [1, 2, 3, 4, 5].map(i => (calculated as any)[`ecartCAN${i}`] || 0);
    const spendingGaps = [1, 2, 3, 4, 5].map(i => (calculated as any)[`ecartDepensesN${i}`] || 0);
    calculated.stdDevSales = this.getStdDev(salesGaps);
    calculated.stdDevSpending = this.getStdDev(spendingGaps);
  }

  // Étape 4: Calculer les pertes inattendues (UL)
  private static calculateUnexpectedLosses(totalUL: number, years: number, staff: number, sector: string, calculated: Partial<CalculatedFields>) {
    const sectorMap: Record<string, number> = {
      'Electronics industry': 46000,
      'Metal industry': 18000,
      'Glass factory': 38000,
      'Electrical appliances': 12000,
      'Food-processing industry': 11000,
      'Banking sector': 18000,
      'Insurances': 18000,
      'Maintenance': 16000,
      'Telecommunication': 8000,
      'Public sector': 9000,
      'Service and distribution': 9000,
      'No choice': 9000
    };
    const pertesULPersonnes = sectorMap[sector] || 9000;
    const ulInterne = staff * pertesULPersonnes;
    const ulExterne = totalUL > 0 && years > 0 ? totalUL / years : 0;

    calculated.ulCalcul = (ulInterne + ulExterne) / 2 / 1000;
  }

  // Étape 5: Calculer l'appétit au risque historique
  private static calculateHistoricRiskAppetite(calculated: Partial<CalculatedFields>) {
    const totalSeuilHistorique = (calculated.stdDevSales || 0) + (calculated.stdDevSpending || 0);
    calculated.totalSeuilHistorique = totalSeuilHistorique;
    calculated.historicRiskAppetite = totalSeuilHistorique + (calculated.ulCalcul || 0);
  }

  // Étape 6: Calculer les pertes potentiellement récupérables (PRL)
  private static calculatePRL(calculated: Partial<CalculatedFields>) {
    calculated.prl = (calculated.var || 0) * 0.95;
    calculated.prlAmount = calculated.prl;
  }

  // Étape 7: Calculer les pertes attendues prévisionnelles
  private static calculateForecastEL(calculated: Partial<CalculatedFields>) {
    calculated.forecastEL = (calculated.var || 0) * 0.045;
  }

  // Étape 8: Plan IPLE 3 ans et bonus breakdowns
  private static calculateThreeYearPlan(calculated: Partial<CalculatedFields>) {
    const prl = calculated.prl || 0;
    // Gains (objectifs de récupération)
    calculated.gainsN1 = prl * 0.30;
    calculated.gainsN2 = prl * 0.60;
    calculated.gainsN3 = prl * 1.00;

    // Primes (33%) et Cash-Flow (67%)
    calculated.primesN1 = calculated.gainsN1 * 0.33;
    calculated.primesN2 = calculated.gainsN2 * 0.33;
    calculated.primesN3 = calculated.gainsN3 * 0.33;

    calculated.cashFlowN1 = calculated.gainsN1 * 0.67;
    calculated.cashFlowN2 = calculated.gainsN2 * 0.67;
    calculated.cashFlowN3 = calculated.gainsN3 * 0.67;

    // Bonus périodiques dérivés des primes
    calculated.weeklyBonusN1 = (calculated.primesN1 || 0) / 48;
    calculated.weeklyBonusN2 = (calculated.primesN2 || 0) / 48;
    calculated.weeklyBonusN3 = (calculated.primesN3 || 0) / 48;

    calculated.monthlyBonusN1 = (calculated.primesN1 || 0) / 12;
    calculated.monthlyBonusN2 = (calculated.primesN2 || 0) / 12;
    calculated.monthlyBonusN3 = (calculated.primesN3 || 0) / 12;

    calculated.quarterlyBonusN1 = (calculated.primesN1 || 0) / 4;
    calculated.quarterlyBonusN2 = (calculated.primesN2 || 0) / 4;
    calculated.quarterlyBonusN3 = (calculated.primesN3 || 0) / 4;

    // Alias pour compatibilité avec UI existante
    calculated.prlAmount = calculated.prl || 0;
  }

  // Fonctions utilitaires helpers
  private static getAverageRate(history: number[]): number {
    if (history.length < 2) return 0;
    const rates = [];
    for (let i = 0; i < history.length - 1; i++) {
      if (history[i + 1] !== 0) {
        rates.push(((history[i] - history[i + 1]) / history[i + 1]) * 100);
      }
    }
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  }

  private static getStdDev(data: number[]): number {
    if (data.length === 0) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  // 🆕 Étape 9: Calculer les indicateurs de performance (Page 14)
  // Basé sur feuille Excel "3-NOTATION DOMAINES CLES" et logique Page 12
  private static calculatePerformanceIndicators(
    socioeconomicData: any,
    calculated: Partial<CalculatedFields>
  ) {
    // Convertir les 6 domaines clés (1-5 → 0-4)
    const weight_area1 = this.convertSocioQualToWeight(socioeconomicData.keyArea1_workingConditions || 0);    // Conditions travail
    const weight_area2 = this.convertSocioQualToWeight(socioeconomicData.keyArea2_workOrganization || 0);     // Organisation travail
    const weight_area3 = this.convertSocioQualToWeight(socioeconomicData.keyArea3_communication || 0);        // 3C Communication
    const weight_area4 = this.convertSocioQualToWeight(socioeconomicData.keyArea4_timeManagement || 0);       // Gestion temps
    const weight_area5 = this.convertSocioQualToWeight(socioeconomicData.keyArea5_training || 0);             // Formation
    const weight_area6 = this.convertSocioQualToWeight(socioeconomicData.keyArea6_strategy || 0);             // Stratégie

    // Mapping des indicateurs selon Excel et Page 12:
    // - Accidents (OA) = Domaine 1 (Conditions travail)
    // - Qualité (QD) = Domaine 2 (Organisation travail)
    // - Know-how (EKH) = Domaines 3+5 (Communication + Formation)
    // - Absentéisme (ABS) = Domaine 4 (Gestion temps)
    // - Productivité (DDP) = Domaine 6 (Stratégie)

    calculated.indicator_accidents_weight = weight_area1;
    calculated.indicator_quality_weight = weight_area2;
    calculated.indicator_knowhow_weight = weight_area3 + weight_area5;  // Somme des 2 domaines
    calculated.indicator_absenteeism_weight = weight_area4;
    calculated.indicator_productivity_weight = weight_area6;

    // Total des poids (pour calcul des taux relatifs)
    const totalWeight =
      calculated.indicator_accidents_weight +
      calculated.indicator_quality_weight +
      calculated.indicator_knowhow_weight +
      calculated.indicator_absenteeism_weight +
      calculated.indicator_productivity_weight;

    // Calculer les taux relatifs (%) - Division par total comme dans Excel
    if (totalWeight > 0) {
      calculated.indicator_accidents_rate = (calculated.indicator_accidents_weight / totalWeight) * 100;
      calculated.indicator_quality_rate = (calculated.indicator_quality_weight / totalWeight) * 100;
      calculated.indicator_knowhow_rate = (calculated.indicator_knowhow_weight / totalWeight) * 100;
      calculated.indicator_absenteeism_rate = (calculated.indicator_absenteeism_weight / totalWeight) * 100;
      calculated.indicator_productivity_rate = (calculated.indicator_productivity_weight / totalWeight) * 100;
    } else {
      // Si aucun domaine clé n'est renseigné, distribution égale
      calculated.indicator_accidents_rate = 20;
      calculated.indicator_quality_rate = 20;
      calculated.indicator_knowhow_rate = 20;
      calculated.indicator_absenteeism_rate = 20;
      calculated.indicator_productivity_rate = 20;
    }
  }

  // 🆕 Étape 10: Calculer les distributions PPR par personne par indicateur par business line
  // Source: Page 14, 15, 16 - Priority Actions N+1, N+2, N+3
  // Ces données sont sauvegardées pour être utilisées par le Module 3 HCM COST SAVINGS
  private static calculatePriorityActionsDistributions(
    businessLines: any[],
    calculated: Partial<CalculatedFields>
  ) {
    if (!businessLines || businessLines.length === 0) return;

    // Total budget pour calculer le budgetRate si non fourni
    const totalBudget = businessLines.reduce((sum, line) => sum + (line.budget || 0), 0);

    // Les 5 indicateurs avec leurs taux (déjà calculés dans calculatePerformanceIndicators)
    const indicators = [
      { id: 'absenteeism', rate: calculated.indicator_absenteeism_rate || 0 },
      { id: 'productivity', rate: calculated.indicator_productivity_rate || 0 },
      { id: 'quality', rate: calculated.indicator_quality_rate || 0 },
      { id: 'accidents', rate: calculated.indicator_accidents_rate || 0 },
      { id: 'knowhow', rate: calculated.indicator_knowhow_rate || 0 }
    ];

    // 🆕 Distribution PROGRESSIVE des PPR trimestrielles
    // Logique: Performance croissante au fil de l'année (montée en compétence)
    // Total = 100% (0.20 + 0.23 + 0.27 + 0.30 = 1.00)
    const QUARTERLY_DISTRIBUTION = {
      T1: 0.20,  // Trimestre 1: 20% (phase d'apprentissage)
      T2: 0.23,  // Trimestre 2: 23% (montée en compétence)
      T3: 0.27,  // Trimestre 3: 27% (performance croissante)
      T4: 0.30,  // Trimestre 4: 30% (performance maximale)
    };

    // Fonction helper pour calculer les distributions pour une année donnée
    const calculateDistributionsForYear = (pprTotal: number) => {
      return businessLines.map(line => {
        const lineBudget = line.budget || 0;
        // Calculer le budgetRate: utiliser le stocké ou calculer depuis le budget
        const calculatedBudgetRate = totalBudget > 0 ? (lineBudget / totalBudget) * 100 : 0;
        const lineBudgetRate = (line.budgetRate || calculatedBudgetRate) / 100; // Convertir % en décimal
        const lineStaffCount = line.staffCount || 1; // Éviter division par 0

        // Pour chaque indicateur: PPR × Taux indicateur × Taux budget ligne / staffCount
        const distributions = indicators.map(indicator => {
          const perLine = pprTotal * (indicator.rate / 100) * lineBudgetRate;
          const perPerson = perLine / lineStaffCount;

          // 🆕 Calcul des PPR par trimestre (valeurs DIFFÉRENCIÉES)
          // Utilise la distribution configurée (par défaut 25% par trimestre)
          const perPersonByQuarter = {
            T1: perPerson * QUARTERLY_DISTRIBUTION.T1,
            T2: perPerson * QUARTERLY_DISTRIBUTION.T2,
            T3: perPerson * QUARTERLY_DISTRIBUTION.T3,
            T4: perPerson * QUARTERLY_DISTRIBUTION.T4,
          };

          const perLineByQuarter = {
            T1: perLine * QUARTERLY_DISTRIBUTION.T1,
            T2: perLine * QUARTERLY_DISTRIBUTION.T2,
            T3: perLine * QUARTERLY_DISTRIBUTION.T3,
            T4: perLine * QUARTERLY_DISTRIBUTION.T4,
          };

          return {
            indicator: indicator.id,
            perLine: perLine,
            perPerson: perPerson,
            // 🆕 Données trimestrielles pour sélection dynamique Module 3
            perPersonByQuarter: perPersonByQuarter,
            perLineByQuarter: perLineByQuarter,
          };
        });

        return {
          businessLine: line.activityName || '',
          staffCount: lineStaffCount,
          budgetRate: line.budgetRate || calculatedBudgetRate,
          distributions: distributions
        };
      });
    };

    // Calculer pour N+1, N+2, N+3
    calculated.priorityActionsN1 = calculateDistributionsForYear(calculated.gainsN1 || 0);
    calculated.priorityActionsN2 = calculateDistributionsForYear(calculated.gainsN2 || 0);
    calculated.priorityActionsN3 = calculateDistributionsForYear(calculated.gainsN3 || 0);
  }
}
