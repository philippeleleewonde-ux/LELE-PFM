import { FormData, BusinessLine, FinancialData, BUSINESS_SECTORS, SocioeconomicImprovement, QualitativeAssessment } from '@/modules/module1/types';

/**
 * Demo data generator that matches the original application's demo functionality
 * This ensures consistent testing and demonstration capabilities
 */
export class CFODemoDataGenerator {
  
  /**
   * Generate exact demo data as specified for testing and comparison
   */
  static generateCompleteDemo(): FormData {
    return {
      companyInfo: {
        email: 'test@yahoo.fr',
        companyName: 'test',
        activity: 'test',
        businessSector: 'Electronics industry',
        currency: 'USD'
      },
      businessLines: [
        { id: 1, activityName: 'Test 1', staffCount: 8, teamCount: 1, budget: 1200 },
        { id: 2, activityName: 'Test 2', staffCount: 2, teamCount: 1, budget: 500 },
        { id: 3, activityName: 'Test 3', staffCount: 5, teamCount: 1, budget: 1100 },
        { id: 4, activityName: 'Test 4', staffCount: 7, teamCount: 1, budget: 2500 },
        { id: 5, activityName: 'Test 5', staffCount: 4, teamCount: 1, budget: 1500 },
        { id: 6, activityName: 'Test 6', staffCount: 8, teamCount: 1, budget: 1300 },
        { id: 7, activityName: 'Test 7', staffCount: 9, teamCount: 1, budget: 1100 },
        { id: 8, activityName: 'Test 8', staffCount: 6, teamCount: 1, budget: 300 }
      ],
      employeeEngagement: {
        annualHoursPerPerson: 1250,
        financialHistory: [
          { year: 'N-1', sales: 5000, spending: 4900 },
          { year: 'N-2', sales: 4500, spending: 4400 },
          { year: 'N-3', sales: 4400, spending: 4200 },
          { year: 'N-4', sales: 4000, spending: 3500 },
          { year: 'N-5', sales: 3500, spending: 2500 }
        ]
      },
      riskData: {
        totalUL: 8000,
        yearsOfCollection: 4,
        riskCategories: {
          operationalRisk: 3000,
          creditRisk: 1000,
          marketRisk: 500,
          liquidityRisk: 1400,
          reputationalRisk: 1300,
          strategicRisk: 1200
        }
      },
      qualitativeAssessment: {
        operationalRiskIncidents: 'Not very important',
        creditRiskAssessment: 'Somewhat important',
        marketVolatility: 'Important',
        liquidityPosition: 'Important',
        reputationalFactors: 'Very important',
        strategicAlignment: 'Very important'
      },
      socioeconomicImprovement: {
        keyArea1_workingConditions: 'Not very important',
        keyArea2_workOrganization: 'Somewhat important',
        keyArea3_communication: 'Important',
        keyArea4_timeManagement: 'Important',
        keyArea5_training: 'Very important',
        keyArea6_strategy: 'Very important'
      },
      calculatedFields: {} as any // Will be calculated by the useEffect in page.tsx
    };
  }

  // Simplified version for quick testing
  static generateExactDemo(): FormData {
    return this.generateCompleteDemo();
  }

  private static generateCompanyInfo() {
    return {
      email: 'test@yahoo.fr',
      companyName: 'test',
      activity: 'test',
      businessSector: 'Electronics industry',
      currency: 'USD'
    };
  }

  private static generateBusinessLines(): BusinessLine[] {
    return [
      { id: 1, activityName: 'Test 1', staffCount: 8, teamCount: 1, budget: 1200 },
      { id: 2, activityName: 'Test 2', staffCount: 2, teamCount: 1, budget: 500 },
      { id: 3, activityName: 'Test 3', staffCount: 5, teamCount: 1, budget: 1100 },
      { id: 4, activityName: 'Test 4', staffCount: 7, teamCount: 1, budget: 2500 },
      { id: 5, activityName: 'Test 5', staffCount: 4, teamCount: 1, budget: 1500 },
      { id: 6, activityName: 'Test 6', staffCount: 8, teamCount: 1, budget: 1300 },
      { id: 7, activityName: 'Test 7', staffCount: 9, teamCount: 1, budget: 1100 },
      { id: 8, activityName: 'Test 8', staffCount: 6, teamCount: 1, budget: 300 }
    ];
  }

  private static generateEmployeeEngagement() {
    return {
      annualHoursPerPerson: 1250,
      financialHistory: [
        { year: 'N-1', sales: 5000, spending: 4900 },
        { year: 'N-2', sales: 4500, spending: 4400 },
        { year: 'N-3', sales: 4400, spending: 4200 },
        { year: 'N-4', sales: 4000, spending: 3500 },
        { year: 'N-5', sales: 3500, spending: 2500 }
      ]
    };
  }

  private static generateRiskData() {
    return {
      totalUL: 8000,
      yearsOfCollection: 4,
      riskCategories: {
        operationalRisk: 3000,
        creditRisk: 1000,
        marketRisk: 500,
        liquidityRisk: 1400,
        reputationalRisk: 1300,
        strategicRisk: 1200
      }
    };
  }

  private static generateQualitativeAssessment(): QualitativeAssessment {
    return {
      operationalRiskIncidents: 'Not very important',
      creditRiskAssessment: 'Somewhat important',
      marketVolatility: 'Important',
      liquidityPosition: 'Important',
      reputationalFactors: 'Very important',
      strategicAlignment: 'Very important'
    };
  }

  private static generateSocioeconomicImprovement(): SocioeconomicImprovement {
    return {
      keyArea1_workingConditions: 'Not very important',
      keyArea2_workOrganization: 'Somewhat important',
      keyArea3_communication: 'Important',
      keyArea4_timeManagement: 'Important',
      keyArea5_training: 'Very important',
      keyArea6_strategy: 'Very important'
    };
  }
}

export class CFODemoEventHandlers {
  
  static setupKeyboardShortcuts(generateCallback: () => void) {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        generateCallback();
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }
}