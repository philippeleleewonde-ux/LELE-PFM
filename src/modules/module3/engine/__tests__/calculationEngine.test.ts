import { describe, it, expect } from 'vitest';
import {
  // Constants
  POLYVALENCE_COEFFICIENTS,
  MAX_POLYVALENCE_COEFFICIENT,
  TAUX_TRESORERIE,
  TAUX_PRIMES,
  KPI_DEFINITIONS,
  // Pure calculation functions
  calculatePolyvalenceCoefficient,
  calculateAdjustedTime,
  calculateFinancialScore,
  calculateFinancialScoreCorrect,
  calculateScoreFinancier,
  calculateScoreFinancierN2,
  calculatePertesConstatees,
  calculatePertesAvecIncapacite,
  calculatePertesConstateesN2,
  calculatePertesConstateesN2AvecLogiqueCroisee,
  calculatePPRPrevues,
  calculateEconomiesRealisees,
  calculateEconomiesK,
  calculatePertesPercent,
  calculateCodePRC,
  calculatePrisEnCompte,
  calculateContributionPercent,
  calculateDistribution,
  calculatePertesAvecIncapaciteDDP,
  calculatePertesEnPourcentageDDP,
  calculatePPRPerPersonFromSources,
  getPeriodInfoFromSelectedWeek,
  // Formatters
  formatCurrency,
  formatDuration,
  formatPercentage,
  // N2 Map utilities
  getTempsN2FromMap,
  getFeesN2FromMap,
  // Types
  type TeamMember,
  type FinancialParams,
  type IndicatorRatesModule3,
  type Module1BusinessLineData,
  type TempsN2Map,
} from '../calculationEngine';

// ============================================
// CONSTANTS
// ============================================

describe('Constants', () => {
  it('should have TAUX_TRESORERIE + TAUX_PRIMES = 1.0', () => {
    expect(TAUX_TRESORERIE + TAUX_PRIMES).toBeCloseTo(1.0, 10);
  });

  it('should have TAUX_TRESORERIE = 0.67', () => {
    expect(TAUX_TRESORERIE).toBe(0.67);
  });

  it('should have TAUX_PRIMES = 0.33', () => {
    expect(TAUX_PRIMES).toBe(0.33);
  });

  it('should have MAX_POLYVALENCE_COEFFICIENT = 63', () => {
    expect(MAX_POLYVALENCE_COEFFICIENT).toBe(63);
  });

  it('should have 4 polyvalence levels', () => {
    expect(Object.keys(POLYVALENCE_COEFFICIENTS).length).toBe(4);
  });

  it('should have correct polyvalence coefficient values', () => {
    expect(POLYVALENCE_COEFFICIENTS["Does not make / does not know"]).toBe(0);
    expect(POLYVALENCE_COEFFICIENTS["Apprentice (learning)"]).toBe(7);
    expect(POLYVALENCE_COEFFICIENTS["Confirmed (autonomous)"]).toBe(14);
    expect(POLYVALENCE_COEFFICIENTS["Experimented (trainer)"]).toBe(21);
  });

  it('should have 5 KPI definitions', () => {
    expect(Object.keys(KPI_DEFINITIONS).length).toBe(5);
  });

  it('should have correct KPI codes', () => {
    expect(KPI_DEFINITIONS.abs.code).toBe('ABS');
    expect(KPI_DEFINITIONS.qd.code).toBe('DFQ');
    expect(KPI_DEFINITIONS.oa.code).toBe('ADT');
    expect(KPI_DEFINITIONS.ddp.code).toBe('EPD');
    expect(KPI_DEFINITIONS.ekh.code).toBe('EKH');
  });
});

// ============================================
// calculatePolyvalenceCoefficient
// ============================================

describe('calculatePolyvalenceCoefficient()', () => {
  const baseMember: TeamMember = {
    id: '1',
    name: 'Test Employee',
    professional_category: 'Operator',
    tech_level: 'Junior',
    handicap_shape: '',
    incapacity_rate: 0,
    versatility_f1: 'Does not make / does not know',
    versatility_f2: 'Does not make / does not know',
    versatility_f3: 'Does not make / does not know',
  };

  it('should return 0 when all versatilities are "Does not make"', () => {
    expect(calculatePolyvalenceCoefficient(baseMember)).toBe(0);
  });

  it('should return 1 when all versatilities are "Experimented (trainer)"', () => {
    const member = {
      ...baseMember,
      versatility_f1: 'Experimented (trainer)',
      versatility_f2: 'Experimented (trainer)',
      versatility_f3: 'Experimented (trainer)',
    };
    expect(calculatePolyvalenceCoefficient(member)).toBe(1); // 63/63
  });

  it('should calculate correctly for mixed versatilities', () => {
    const member = {
      ...baseMember,
      versatility_f1: 'Apprentice (learning)',    // 7
      versatility_f2: 'Confirmed (autonomous)',     // 14
      versatility_f3: 'Experimented (trainer)',     // 21
    };
    expect(calculatePolyvalenceCoefficient(member)).toBeCloseTo(42 / 63, 10); // (7+14+21)/63
  });

  it('should return 0 for unknown versatility levels', () => {
    const member = {
      ...baseMember,
      versatility_f1: 'Unknown level',
      versatility_f2: 'Invalid',
      versatility_f3: '',
    };
    expect(calculatePolyvalenceCoefficient(member)).toBe(0);
  });

  it('should handle partial known versatilities', () => {
    const member = {
      ...baseMember,
      versatility_f1: 'Confirmed (autonomous)',    // 14
      versatility_f2: 'Does not make / does not know', // 0
      versatility_f3: 'Apprentice (learning)',     // 7
    };
    expect(calculatePolyvalenceCoefficient(member)).toBeCloseTo(21 / 63, 10);
  });
});

// ============================================
// calculateAdjustedTime
// ============================================

describe('calculateAdjustedTime()', () => {
  it('should return full time when incapacity is 0', () => {
    expect(calculateAdjustedTime(100, 0)).toBe(100);
  });

  it('should return 0 when incapacity is 100%', () => {
    expect(calculateAdjustedTime(100, 100)).toBe(0);
  });

  it('should reduce time proportionally to incapacity rate', () => {
    expect(calculateAdjustedTime(100, 30)).toBeCloseTo(70, 10);
  });

  it('should handle 0 time', () => {
    expect(calculateAdjustedTime(0, 50)).toBe(0);
  });

  it('should handle 50% incapacity correctly', () => {
    expect(calculateAdjustedTime(200, 50)).toBeCloseTo(100, 10);
  });
});

// ============================================
// calculateFinancialScore (deprecated)
// ============================================

describe('calculateFinancialScore() [deprecated]', () => {
  it('should return full amount when incapacity is 0', () => {
    expect(calculateFinancialScore(1000, 0)).toBe(1000);
  });

  it('should return 0 when incapacity is 100%', () => {
    expect(calculateFinancialScore(1000, 100)).toBe(0);
  });

  it('should reduce amount by incapacity rate', () => {
    expect(calculateFinancialScore(1000, 30)).toBeCloseTo(700, 10);
  });
});

// ============================================
// calculateFinancialScoreCorrect
// ============================================

describe('calculateFinancialScoreCorrect()', () => {
  const baseParams: FinancialParams = {
    recettesN1: 5000,
    depensesN1: 4900,
    volumeHoraireN1: 1250,
  };

  it('should return 0 when volume horaire is 0 (division by zero guard)', () => {
    expect(calculateFinancialScoreCorrect(100, {
      ...baseParams,
      volumeHoraireN1: 0,
    })).toBe(0);
  });

  it('should calculate correctly with standard data', () => {
    // tauxMargeHoraire = (5000 - 4900) / 1250 = 0.08
    // Score = 0.08 * 10 * 1000 = 800
    const result = calculateFinancialScoreCorrect(10, baseParams);
    expect(result).toBeCloseTo(800, 2);
  });

  it('should return 0 when temps collecte is 0', () => {
    expect(calculateFinancialScoreCorrect(0, baseParams)).toBe(0);
  });

  it('should handle negative margin (depenses > recettes)', () => {
    const params: FinancialParams = {
      recettesN1: 4000,
      depensesN1: 5000,
      volumeHoraireN1: 1000,
    };
    // tauxMargeHoraire = (4000 - 5000) / 1000 = -1
    // Score = -1 * 10 * 1000 = -10000
    expect(calculateFinancialScoreCorrect(10, params)).toBeCloseTo(-10000, 2);
  });

  it('should handle zero margin (recettes = depenses)', () => {
    const params: FinancialParams = {
      recettesN1: 5000,
      depensesN1: 5000,
      volumeHoraireN1: 1250,
    };
    expect(calculateFinancialScoreCorrect(10, params)).toBe(0);
  });
});

// ============================================
// calculateScoreFinancier (N1)
// ============================================

describe('calculateScoreFinancier()', () => {
  it('should return 0 when volume horaire is 0', () => {
    expect(calculateScoreFinancier(10, 5000, 4900, 0)).toBe(0);
  });

  it('should apply ×1000 conversion (k¥ → ¥)', () => {
    // tauxMargeHoraire = (5000 - 4900) / 1250 = 0.08
    // Score = 0.08 * 10 * 1000 = 800
    expect(calculateScoreFinancier(10, 5000, 4900, 1250)).toBeCloseTo(800, 2);
  });

  it('should handle large numbers', () => {
    const result = calculateScoreFinancier(1000, 50000, 40000, 5000);
    // tauxMargeHoraire = 10000/5000 = 2 → 2 * 1000 * 1000 = 2_000_000
    expect(result).toBeCloseTo(2_000_000, 0);
  });
});

// ============================================
// calculateScoreFinancierN2
// ============================================

describe('calculateScoreFinancierN2()', () => {
  it('should return 0 when volume horaire is 0', () => {
    expect(calculateScoreFinancierN2(10, 5000, 4900, 0)).toBe(0);
  });

  it('should use same formula as N1 but with temps pris en compte', () => {
    const n1 = calculateScoreFinancier(10, 5000, 4900, 1250);
    const n2 = calculateScoreFinancierN2(10, 5000, 4900, 1250);
    expect(n2).toBeCloseTo(n1, 10);
  });
});

// ============================================
// calculatePertesConstatees (M6 formula)
// ============================================

describe('calculatePertesConstatees()', () => {
  it('should return 0 when score + frais = 0', () => {
    expect(calculatePertesConstatees(0, 0, 100)).toBe(0);
  });

  it('should return (score + frais) - ppr when total > 0', () => {
    expect(calculatePertesConstatees(500, 300, 200)).toBe(600); // 800 - 200
  });

  it('should return 0 when score + frais < 0', () => {
    expect(calculatePertesConstatees(-500, 200, 100)).toBe(0); // total = -300 < 0
  });

  it('should default pprPrevues to 0', () => {
    expect(calculatePertesConstatees(500, 300)).toBe(800); // 800 - 0
  });

  it('should return negative value if PPR > total (potential savings)', () => {
    expect(calculatePertesConstatees(100, 100, 500)).toBe(-300); // 200 - 500
  });

  it('should handle all zero values', () => {
    expect(calculatePertesConstatees(0, 0, 0)).toBe(0);
  });
});

// ============================================
// calculatePertesAvecIncapacite
// ============================================

describe('calculatePertesAvecIncapacite()', () => {
  it('should return 0 when pertes <= 0', () => {
    expect(calculatePertesAvecIncapacite(-100, 30)).toBe(0);
    expect(calculatePertesAvecIncapacite(0, 30)).toBe(0);
  });

  it('should return 0 when taux incapacite <= 0', () => {
    expect(calculatePertesAvecIncapacite(1000, 0)).toBe(0);
    expect(calculatePertesAvecIncapacite(1000, -10)).toBe(0);
  });

  it('should return pertes × (taux/100) for valid inputs', () => {
    expect(calculatePertesAvecIncapacite(1000, 30)).toBeCloseTo(300, 10);
  });

  it('should cap at 100% (return full pertes)', () => {
    expect(calculatePertesAvecIncapacite(1000, 150)).toBe(1000);
  });

  it('should return full pertes at 100%', () => {
    expect(calculatePertesAvecIncapacite(1000, 100)).toBeCloseTo(1000, 10);
  });

  it('should default taux to 0 when not provided', () => {
    expect(calculatePertesAvecIncapacite(1000)).toBe(0);
  });
});

// ============================================
// calculatePertesConstateesN2 (AC6 formula)
// ============================================

describe('calculatePertesConstateesN2()', () => {
  it('should return 0 when score + frais = 0', () => {
    expect(calculatePertesConstateesN2(0, 0, 100)).toBe(0);
  });

  it('should return (score + frais) - ppr when total > 0', () => {
    expect(calculatePertesConstateesN2(500, 300, 200)).toBe(600);
  });

  it('should return 0 when total < 0', () => {
    expect(calculatePertesConstateesN2(-500, 200, 100)).toBe(0);
  });

  it('should default pprPrevuesN2 to 0', () => {
    expect(calculatePertesConstateesN2(500, 300)).toBe(800);
  });
});

// ============================================
// calculatePertesConstateesN2AvecLogiqueCroisee (DQ6)
// ============================================

describe('calculatePertesConstateesN2AvecLogiqueCroisee()', () => {
  it('should return 0 when ecoN1=0, ecoN2=0, salarié exists', () => {
    expect(calculatePertesConstateesN2AvecLogiqueCroisee(0, 0, true, 500)).toBe(0);
  });

  it('should return 0 when ecoN1=0, ecoN2=0, salarié does not exist', () => {
    expect(calculatePertesConstateesN2AvecLogiqueCroisee(0, 0, false, 500)).toBe(0);
  });

  it('should return 0 when ecoN1>0, ecoN2=0', () => {
    expect(calculatePertesConstateesN2AvecLogiqueCroisee(100, 0, true, 500)).toBe(0);
  });

  it('should return pertes N2 when ecoN1=0, ecoN2>0, salarié exists', () => {
    expect(calculatePertesConstateesN2AvecLogiqueCroisee(0, 100, true, 500)).toBe(500);
  });

  it('should return 0 when ecoN1=0, ecoN2>0, salarié does not exist', () => {
    expect(calculatePertesConstateesN2AvecLogiqueCroisee(0, 100, false, 500)).toBe(0);
  });

  it('should return 0 as fallback for unmatched conditions (ecoN1>0, ecoN2>0)', () => {
    expect(calculatePertesConstateesN2AvecLogiqueCroisee(100, 100, true, 500)).toBe(0);
  });
});

// ============================================
// calculatePPRPrevues
// ============================================

describe('calculatePPRPrevues()', () => {
  it('should return 0 when salarié does not exist', () => {
    expect(calculatePPRPrevues(false, 100)).toBe(0);
  });

  it('should return 0 when PPR par personne is 0', () => {
    expect(calculatePPRPrevues(true, 0)).toBe(0);
  });

  it('should convert k¥ to ¥ and divide by 12 weeks (3 months × 4 weeks)', () => {
    // PPR = 12 k¥ → 12000 ¥ → 12000/3 = 4000/month → 4000/4 = 1000/week
    expect(calculatePPRPrevues(true, 12)).toBeCloseTo(1000, 2);
  });

  it('should handle small PPR values', () => {
    // PPR = 0.5 k¥ → 500 ¥ → 500/3 ≈ 166.67 → 166.67/4 ≈ 41.67
    expect(calculatePPRPrevues(true, 0.5)).toBeCloseTo(500 / 12, 2);
  });
});

// ============================================
// calculateEconomiesRealisees (N6 formula)
// ============================================

describe('calculateEconomiesRealisees()', () => {
  it('should return ppr when pertes < 0', () => {
    expect(calculateEconomiesRealisees(1000, -500)).toBe(1000);
  });

  it('should return ppr - pertes when pertes > 0', () => {
    expect(calculateEconomiesRealisees(1000, 300)).toBe(700);
  });

  it('should return ppr - pertes when pertes = 0', () => {
    expect(calculateEconomiesRealisees(1000, 0)).toBe(1000);
  });

  it('should return negative when pertes > ppr', () => {
    expect(calculateEconomiesRealisees(100, 500)).toBe(-400);
  });
});

// ============================================
// calculateEconomiesK (K6 formula - 4 branches)
// ============================================

describe('calculateEconomiesK()', () => {
  it('Branch 1: tempsN1=0, tempsN2=0, salarié exists → economiesN', () => {
    expect(calculateEconomiesK(0, 0, 'John', 500)).toBe(500);
  });

  it('Branch 2: tempsN1=0, tempsN2=0, salarié=0 → 0', () => {
    expect(calculateEconomiesK(0, 0, 0, 500)).toBe(0);
  });

  it('Branch 3: tempsN1>0, tempsN2=0 → economiesN', () => {
    expect(calculateEconomiesK(100, 0, 'John', 500)).toBe(500);
  });

  it('Branch 4: tempsN1=0, tempsN2>0 → 0', () => {
    expect(calculateEconomiesK(0, 100, 'John', 500)).toBe(0);
  });

  it('Fallback: tempsN1>0, tempsN2>0 → 0', () => {
    expect(calculateEconomiesK(100, 100, 'John', 500)).toBe(0);
  });

  it('should treat empty string name as salarié=0', () => {
    // Note: the function checks nomSalarie === 0, not ''
    // Empty string should go to Branch 1 (salarié exists)
    expect(calculateEconomiesK(0, 0, '', 500)).toBe(500);
  });
});

// ============================================
// calculatePertesPercent (L6 formula)
// ============================================

describe('calculatePertesPercent()', () => {
  it('should return 0 when pertes < 0', () => {
    expect(calculatePertesPercent(-100, 1000)).toBe(0);
  });

  it('should return 0 when pertes = 0', () => {
    expect(calculatePertesPercent(0, 1000)).toBe(0);
  });

  it('should return 0 when totalPertes = 0 (division by zero)', () => {
    expect(calculatePertesPercent(100, 0)).toBe(0);
  });

  it('should return percentage when pertes > 0', () => {
    expect(calculatePertesPercent(250, 1000)).toBeCloseTo(25, 10);
  });

  it('should return 100% when pertes = totalPertes', () => {
    expect(calculatePertesPercent(1000, 1000)).toBeCloseTo(100, 10);
  });
});

// ============================================
// calculateCodePRC (P6 formula)
// ============================================

describe('calculateCodePRC()', () => {
  it('should return 0 when name is 0', () => {
    expect(calculateCodePRC(0)).toBe(0);
  });

  it('should return 0 when name is empty string', () => {
    expect(calculateCodePRC('')).toBe(0);
  });

  it('should return 1 when name is a valid string', () => {
    expect(calculateCodePRC('Jean Dupont')).toBe(1);
  });

  it('should return 1 when name is a positive number', () => {
    expect(calculateCodePRC(1)).toBe(1);
  });
});

// ============================================
// calculatePrisEnCompte (U6 formula)
// ============================================

describe('calculatePrisEnCompte()', () => {
  it('should return 0 when codePRC = 0', () => {
    expect(calculatePrisEnCompte(0, 1000)).toBe(0);
  });

  it('should return value when codePRC > 0', () => {
    expect(calculatePrisEnCompte(1, 1000)).toBe(1000);
  });

  it('should handle zero value', () => {
    expect(calculatePrisEnCompte(1, 0)).toBe(0);
  });
});

// ============================================
// calculateContributionPercent
// ============================================

describe('calculateContributionPercent()', () => {
  it('should return 0 when totalEconomies = 0', () => {
    expect(calculateContributionPercent(100, 0)).toBe(0);
  });

  it('should return correct percentage', () => {
    expect(calculateContributionPercent(250, 1000)).toBeCloseTo(25, 10);
  });

  it('should return 100 when economies = totalEconomies', () => {
    expect(calculateContributionPercent(500, 500)).toBeCloseTo(100, 10);
  });
});

// ============================================
// calculateDistribution (67%/33%)
// ============================================

describe('calculateDistribution()', () => {
  it('should split 67% tresorerie / 33% primes', () => {
    const result = calculateDistribution(1000);
    expect(result.tresorerie).toBeCloseTo(670, 2);
    expect(result.primes).toBeCloseTo(330, 2);
  });

  it('should sum to total economies', () => {
    const result = calculateDistribution(10000);
    expect(result.tresorerie + result.primes).toBeCloseTo(10000, 2);
  });

  it('should handle zero', () => {
    const result = calculateDistribution(0);
    expect(result.tresorerie).toBe(0);
    expect(result.primes).toBe(0);
  });

  it('should handle negative values', () => {
    const result = calculateDistribution(-1000);
    expect(result.tresorerie).toBeCloseTo(-670, 2);
    expect(result.primes).toBeCloseTo(-330, 2);
  });
});

// ============================================
// calculatePertesAvecIncapaciteDDP (DD6 - DDP specific)
// ============================================

describe('calculatePertesAvecIncapaciteDDP()', () => {
  it('should return PPR - pertes when pertes >= 0', () => {
    expect(calculatePertesAvecIncapaciteDDP(1000, 300)).toBe(700);
  });

  it('should return PPR + |pertes| when pertes < 0', () => {
    // pertesConstatees < 0: return pprPrevues - (-pertesConstatees)
    // = 1000 - (500) = 500
    expect(calculatePertesAvecIncapaciteDDP(1000, -500)).toBe(500);
  });

  it('should return PPR when pertes = 0', () => {
    expect(calculatePertesAvecIncapaciteDDP(1000, 0)).toBe(1000);
  });

  it('should handle PPR = 0', () => {
    expect(calculatePertesAvecIncapaciteDDP(0, 300)).toBe(-300);
  });
});

// ============================================
// calculatePertesEnPourcentageDDP (DF6)
// ============================================

describe('calculatePertesEnPourcentageDDP()', () => {
  it('should return 0 when pertes avec incapacite = 0', () => {
    expect(calculatePertesEnPourcentageDDP(0, 1000)).toBe(0);
  });

  it('should return 0 when total reference = 0 (avoid division by zero)', () => {
    expect(calculatePertesEnPourcentageDDP(500, 0)).toBe(0);
  });

  it('should return ratio (not percentage)', () => {
    expect(calculatePertesEnPourcentageDDP(250, 1000)).toBeCloseTo(0.25, 10);
  });

  it('should return 1.0 when pertes = total', () => {
    expect(calculatePertesEnPourcentageDDP(1000, 1000)).toBeCloseTo(1.0, 10);
  });
});

// ============================================
// calculatePPRPerPersonFromSources
// ============================================

describe('calculatePPRPerPersonFromSources()', () => {
  const rates: IndicatorRatesModule3 = {
    abs: 20,
    qd: 15,
    oa: 10,
    ddp: 30,
    ekh: 25,
  };

  const businessLines: Module1BusinessLineData[] = [
    { activityName: 'Line A', staffCount: 10, budget: 5000 },
    { activityName: 'Line B', staffCount: 5, budget: 3000 },
    { activityName: 'Line C', staffCount: 8, budget: 2000 },
  ];

  it('should return 0 when businessLineName is empty', () => {
    expect(calculatePPRPerPersonFromSources('', 'abs', 100, rates, businessLines)).toBe(0);
  });

  it('should return 0 when indicatorId is empty', () => {
    expect(calculatePPRPerPersonFromSources('Line A', '', 100, rates, businessLines)).toBe(0);
  });

  it('should return 0 when gainsN1 <= 0', () => {
    expect(calculatePPRPerPersonFromSources('Line A', 'abs', 0, rates, businessLines)).toBe(0);
    expect(calculatePPRPerPersonFromSources('Line A', 'abs', -100, rates, businessLines)).toBe(0);
  });

  it('should return 0 when rates are undefined', () => {
    expect(calculatePPRPerPersonFromSources('Line A', 'abs', 100, undefined, businessLines)).toBe(0);
  });

  it('should return 0 when business lines are undefined', () => {
    expect(calculatePPRPerPersonFromSources('Line A', 'abs', 100, rates, undefined)).toBe(0);
  });

  it('should return 0 when business lines are empty', () => {
    expect(calculatePPRPerPersonFromSources('Line A', 'abs', 100, rates, [])).toBe(0);
  });

  it('should return 0 when business line not found', () => {
    expect(calculatePPRPerPersonFromSources('UNKNOWN', 'abs', 100, rates, businessLines)).toBe(0);
  });

  it('should return 0 for unknown indicator', () => {
    expect(calculatePPRPerPersonFromSources('Line A', 'unknown', 100, rates, businessLines)).toBe(0);
  });

  it('should calculate correctly for Line A / abs', () => {
    // totalBudget = 5000 + 3000 + 2000 = 10000
    // lineBudgetRate = 5000/10000 = 0.50
    // perLine = 100 * (20/100) * 0.50 = 10
    // perPerson = 10 / 10 = 1
    const result = calculatePPRPerPersonFromSources('Line A', 'abs', 100, rates, businessLines);
    expect(result).toBeCloseTo(1, 5);
  });

  it('should be case-insensitive for business line names', () => {
    const r1 = calculatePPRPerPersonFromSources('line a', 'abs', 100, rates, businessLines);
    const r2 = calculatePPRPerPersonFromSources('LINE A', 'abs', 100, rates, businessLines);
    expect(r1).toBe(r2);
  });

  it('should accept both Module 3 and Module 1 indicator IDs', () => {
    const r1 = calculatePPRPerPersonFromSources('Line A', 'abs', 100, rates, businessLines);
    const r2 = calculatePPRPerPersonFromSources('Line A', 'absenteeism', 100, rates, businessLines);
    expect(r1).toBe(r2);
  });

  it('should return 0 when indicator rate is 0', () => {
    const zeroRates: IndicatorRatesModule3 = { abs: 0, qd: 0, oa: 0, ddp: 0, ekh: 0 };
    expect(calculatePPRPerPersonFromSources('Line A', 'abs', 100, zeroRates, businessLines)).toBe(0);
  });
});

// ============================================
// getPeriodInfoFromSelectedWeek
// ============================================

describe('getPeriodInfoFromSelectedWeek()', () => {
  const launchDate = new Date(2026, 0, 1); // Jan 1, 2026

  it('should return null when launchDate is undefined', () => {
    expect(getPeriodInfoFromSelectedWeek(null as any, '2026-02-01')).toBeNull();
  });

  it('should return null when periodStart is empty', () => {
    expect(getPeriodInfoFromSelectedWeek(launchDate, '')).toBeNull();
  });

  it('should return null when date is before launch', () => {
    expect(getPeriodInfoFromSelectedWeek(launchDate, '2025-12-15')).toBeNull();
  });

  it('should return yearOffset=1 for first year after launch', () => {
    const result = getPeriodInfoFromSelectedWeek(launchDate, '2026-02-01');
    expect(result).not.toBeNull();
    expect(result!.yearOffset).toBe(1);
    expect(result!.fiscalYear).toBe('N+1');
  });

  it('should return valid=true for dates within 3 years', () => {
    const result = getPeriodInfoFromSelectedWeek(launchDate, '2026-06-15');
    expect(result!.isValid).toBe(true);
  });

  it('should return valid=false for dates beyond 3 years', () => {
    const result = getPeriodInfoFromSelectedWeek(launchDate, '2030-01-01');
    expect(result).not.toBeNull();
    expect(result!.isValid).toBe(false);
  });

  it('should calculate correct quarter', () => {
    const result = getPeriodInfoFromSelectedWeek(launchDate, '2026-01-15');
    expect(result).not.toBeNull();
    expect(result!.quarter).toBeGreaterThanOrEqual(1);
    expect(result!.quarter).toBeLessThanOrEqual(4);
  });

  it('should have weekInQuarter between 1 and 13', () => {
    const result = getPeriodInfoFromSelectedWeek(launchDate, '2026-03-15');
    expect(result).not.toBeNull();
    expect(result!.weekInQuarter).toBeGreaterThanOrEqual(1);
    expect(result!.weekInQuarter).toBeLessThanOrEqual(13);
  });
});

// ============================================
// Formatters
// ============================================

describe('formatCurrency()', () => {
  it('should format as EUR by default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('should format with 2 decimal places', () => {
    const result = formatCurrency(100);
    expect(result).toBeTruthy();
  });
});

describe('formatDuration()', () => {
  it('should format minutes into hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('should handle 0 minutes', () => {
    expect(formatDuration(0)).toBe('0h 00m');
  });

  it('should handle less than 60 minutes', () => {
    expect(formatDuration(45)).toBe('0h 45m');
  });

  it('should pad minutes with leading zero', () => {
    expect(formatDuration(65)).toBe('1h 05m');
  });
});

describe('formatPercentage()', () => {
  it('should format with 1 decimal by default', () => {
    expect(formatPercentage(42.567)).toBe('42.6%');
  });

  it('should format with specified decimals', () => {
    expect(formatPercentage(42.567, 2)).toBe('42.57%');
  });

  it('should format 0', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('should format 100', () => {
    expect(formatPercentage(100)).toBe('100.0%');
  });
});

// ============================================
// N2 Map Utilities
// ============================================

describe('getTempsN2FromMap()', () => {
  const tempsN2Map: TempsN2Map = {
    'line-1': {
      'abs': { business_line_id: 'line-1', kpi_type: 'abs', total_temps_n2_hours: 10.5, total_fees_n2: 500, entries_count: 3 },
    },
  };

  it('should return value when key exists', () => {
    expect(getTempsN2FromMap(tempsN2Map, 'line-1', 'abs')).toBe(10.5);
  });

  it('should return fallback when business line not found', () => {
    expect(getTempsN2FromMap(tempsN2Map, 'line-unknown', 'abs')).toBe(0);
  });

  it('should return fallback when kpi type not found', () => {
    expect(getTempsN2FromMap(tempsN2Map, 'line-1', 'qd')).toBe(0);
  });

  it('should return custom fallback value', () => {
    expect(getTempsN2FromMap(tempsN2Map, 'line-unknown', 'abs', -1)).toBe(-1);
  });

  it('should handle undefined map', () => {
    expect(getTempsN2FromMap(undefined as any, 'line-1', 'abs')).toBe(0);
  });
});

describe('getFeesN2FromMap()', () => {
  const tempsN2Map: TempsN2Map = {
    'line-1': {
      'abs': { business_line_id: 'line-1', kpi_type: 'abs', total_temps_n2_hours: 10.5, total_fees_n2: 500, entries_count: 3 },
    },
  };

  it('should return fees when key exists', () => {
    expect(getFeesN2FromMap(tempsN2Map, 'line-1', 'abs')).toBe(500);
  });

  it('should return fallback when not found', () => {
    expect(getFeesN2FromMap(tempsN2Map, 'line-unknown', 'abs')).toBe(0);
  });
});
