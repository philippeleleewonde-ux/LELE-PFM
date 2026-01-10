// @ts-nocheck
import { FormData, Currency } from '@/modules/module1/types';
import { CFOCalculationEngine } from './calculations';

// Test exact avec les données du bug report
describe('Regression Test - Bug Report Data', () => {
  it('should match source application calculations', () => {
    const testData: FormData = {
      selectedCurrency: 'EUR' as Currency,
      companyInfo: {
        email: 'test@company.com',
        companyName: 'Test Company',
        activity: 'Electronics industry',
        businessSector: 'Electronics industry'
      },
      businessLines: [
        { id: 1, activityName: 'Line 1', staffCount: 8, teamCount: 2, budget: 1200 },
        { id: 2, activityName: 'Line 2', staffCount: 2, teamCount: 1, budget: 800 },
        { id: 3, activityName: 'Line 3', staffCount: 5, teamCount: 2, budget: 1500 },
        { id: 4, activityName: 'Line 4', staffCount: 7, teamCount: 2, budget: 2000 },
        { id: 5, activityName: 'Line 5', staffCount: 4, teamCount: 1, budget: 1000 },
        { id: 6, activityName: 'Line 6', staffCount: 8, teamCount: 2, budget: 1800 },
        { id: 7, activityName: 'Line 7', staffCount: 9, teamCount: 3, budget: 2200 },
        { id: 8, activityName: 'Line 8', staffCount: 6, teamCount: 2, budget: 1000 }
      ],
      employeeEngagement: {
        annualHoursPerPerson: 1250,
        financialHistory: [
          { year: 'N-1', sales: 5000, spending: 4900 },
          { year: 'N-2', sales: 4500, spending: 4410 },
          { year: 'N-3', sales: 4400, spending: 4312 },
          { year: 'N-4', sales: 4000, spending: 3920 },
          { year: 'N-5', sales: 3500, spending: 3430 },
        ]
      },
      riskData: {
        totalUL: 8000,
        yearsOfCollection: 4,
        riskCategories: {
          operationalRisk: 0,
          creditRisk: 0,
          marketRisk: 0,
          liquidityRisk: 0,
          reputationalRisk: 0,
          strategicRisk: 0
        }
      },
      qualitativeAssessment: {
        operationalRiskIncidents: 0,
        creditRiskAssessment: 0,
        marketVolatility: 0,
        liquidityPosition: 0,
        reputationalFactors: '',
        strategicAlignment: ''
      },
      socioeconomicImprovement: {
        keyArea1_workingConditions: 'Medium',
        keyArea2_workOrganization: 'Medium',
        keyArea3_communication: 'Medium',
        keyArea4_timeManagement: 'Medium',
        keyArea5_training: 'Medium',
        keyArea6_strategy: 'Medium'
      },
      calculatedFields: {
        tauxL1Budget: 0, tauxL2Budget: 0, tauxL3Budget: 0, tauxL4Budget: 0, tauxL5Budget: 0,
        tauxMoyenL1: 0, tauxMoyenL2: 0, tauxMoyenL3: 0, tauxMoyenL4: 0, tauxMoyenL5: 0,
        valeurPotentielleL1: 0, valeurPotentielleL2: 0, valeurPotentielleL3: 0, valeurPotentielleL4: 0, valeurPotentielleL5: 0,
        totalEL: 0, totalELHistorique: 0, var95: 0, var99: 0, var: 0,
        totalHours: 0, averageHoursPerPerson: 0, engagementScore: 0,
        prlAmount: 0, totalBudget: 0, totalPotential: 0,
        weeklyBonusN1: 0, weeklyBonusN2: 0, weeklyBonusN3: 0,
        quarterlyBonusN1: 0, quarterlyBonusN2: 0, quarterlyBonusN3: 0,
        monthlyBonusN1: 0, monthlyBonusN2: 0, monthlyBonusN3: 0,
        gainsN1: 0, gainsN2: 0, gainsN3: 0,
        square1: 0, square2: 0, square3: 0, square4: 0, square5: 0,
        variance: 0, standardDeviation: 0, stdDevSales: 0, stdDevSpending: 0,
        historicRiskAppetite: 0
      }
    };

    const result = CFOCalculationEngine.calculateAll(testData);
    
    console.log('=== RÉSULTATS DU TEST DE RÉGRESSION ===');
    console.log('1- Unexpected losses (UL):', result.ulCalcul);
    console.log('2- Expected losses (EL):', result.totalELHistorique);
    console.log('3- VaR (UL + EL):', result.var);
    console.log('4- Historic Risk Appetite:', result.historicRiskAppetite);
    console.log('5- PRL (Recoverable):', result.prl);
    console.log('6- Forecast expected Losses (EL):', result.forecastEL);
    
    // Valeurs attendues de l'application source
    const expected = {
      ul: 1128.00,
      el: 1145.35,
      var: 2273.35,
      historicRiskAppetite: 1333.74,
      prl: 2159.68,
      forecastEL: 102.30
    };

    console.log('=== COMPARAISON ===');
    console.log('UL - Actuel:', result.ulCalcul, 'Attendu:', expected.ul);
    console.log('Historic - Actuel:', result.historicRiskAppetite, 'Attendu:', expected.historicRiskAppetite);
    console.log('PRL - Actuel:', result.prl, 'Attendu:', expected.prl);
    
    // Le test échouera intentionnellement pour montrer les écarts
    expect(result.ulCalcul).toBeCloseTo(expected.ul, 2);
    expect(result.var).toBeCloseTo(expected.var, 2);
    expect(result.historicRiskAppetite).toBeCloseTo(expected.historicRiskAppetite, 2);
    expect(result.prl).toBeCloseTo(expected.prl, 2);
    expect(result.forecastEL).toBeCloseTo(expected.forecastEL, 2);
  });
});
