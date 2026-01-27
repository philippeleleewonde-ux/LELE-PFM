import { useState, useEffect } from 'react';
import { CFOForm } from './components/CFOForm';
import { CFOHeader } from './components/CFOHeader';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DemoDataButton } from './components/DemoDataButton';
import { FormData, Currency } from './types';
import { CFODemoDataGenerator, CFODemoEventHandlers } from './lib/demoData';
import { CFOCalculationEngine } from './lib/calculations';
import { UserStorage } from './utils/userStorage';
import { useAuth } from '@/hooks/useAuth';
import { PerformanceCountdownBanner } from '@/components/shared/PerformanceCountdownBanner';
import { LaunchDateProvider } from '@/components/shared/SmartDateWidgets';
import './module1.css';

export default function Module1Main() {
  const { user } = useAuth();

  // Set user ID for scoped storage when user changes
  useEffect(() => {
    if (user?.id) {
      UserStorage.setUserId(user.id);
    }
  }, [user?.id]);
  const [formData, setFormData] = useState<FormData>({
    selectedCurrency: 'EUR',
    companyInfo: {
      email: '',
      companyName: '',
      activity: '',
      businessSector: 'No choice'
    },
    businessLines: [],
    employeeEngagement: {
      annualHoursPerPerson: 0,
      financialHistory: []
    },
    riskData: {
      totalUL: 0,
      yearsOfCollection: 0,
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
      operationalRiskIncidents: '',
      creditRiskAssessment: '',
      marketVolatility: '',
      liquidityPosition: '',
      reputationalFactors: '',
      strategicAlignment: ''
    },
    socioeconomicImprovement: {
      keyArea1_workingConditions: '',
      keyArea2_workOrganization: '',
      keyArea3_communication: '',
      keyArea4_timeManagement: '',
      keyArea5_training: '',
      keyArea6_strategy: ''
    },
    calculatedFields: {} as any
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');

  // Automatically recalculate when any form data changes
  useEffect(() => {
    // Build a fresh formData object from current dependencies
    const currentFormData: FormData = {
      companyInfo: formData.companyInfo,
      businessLines: formData.businessLines,
      employeeEngagement: formData.employeeEngagement,
      riskData: formData.riskData,
      qualitativeAssessment: formData.qualitativeAssessment,
      socioeconomicImprovement: formData.socioeconomicImprovement,
      calculatedFields: formData.calculatedFields || {} as any
    };

    const newCalculatedFields = CFOCalculationEngine.calculateAll(currentFormData);

    setFormData(currentData => ({
      ...currentData,
      calculatedFields: newCalculatedFields
    }));
  }, [
    formData.companyInfo,
    formData.businessLines,
    formData.employeeEngagement,
    formData.riskData,
    formData.qualitativeAssessment,
    formData.socioeconomicImprovement
  ]);

  // Generate demo data function
  const generateDemoData = async () => {
    setIsLoading(true);
    setLoadingMessage('Generating demo data...');

    try {
      // Simulate loading time like original app
      await new Promise(resolve => setTimeout(resolve, 1000));

      const demoData = CFODemoDataGenerator.generateCompleteDemo();

      setLoadingMessage('Calculating financial metrics...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // The useEffect will automatically calculate the fields
      setFormData(demoData);

      setLoadingMessage('Demo data generated successfully!');

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error generating demo data:', error);
      setLoadingMessage('Error generating demo data');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up keyboard shortcuts
  useEffect(() => {
    const cleanup = CFODemoEventHandlers.setupKeyboardShortcuts(generateDemoData);
    return cleanup;
  }, []);

  // Récupérer le companyId depuis les métadonnées utilisateur
  const companyId = user?.user_metadata?.company_id || user?.id || '';

  return (
    <LaunchDateProvider companyId={companyId}>
      <div className="module1-wrapper">
        {/* Loading Overlay */}
        {isLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Performance Countdown Banner */}
      <div className="mb-6">
        <PerformanceCountdownBanner
          companyId={companyId}
          variant="minimal"
        />
      </div>

      {/* Demo Data Button */}
      <div className="mb-4">
        <DemoDataButton onClick={generateDemoData} />
      </div>

      {/* User Info Badge */}
      {user && (
        <div className="mb-4 p-3 bg-cfo-card border border-cfo-accent rounded-lg inline-flex items-center gap-2">
          <div className="w-2 h-2 bg-cfo-accent rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-cfo-text">
            Connected as: <span className="text-cfo-accent">{user.email}</span>
          </span>
          <span className="text-xs text-cfo-muted ml-2">
            User ID: {user.id.substring(0, 8)}...
          </span>
        </div>
      )}

      {/* Header */}
      <CFOHeader />

      {/* Main Form */}
      <div className="form-container mt-6">
        <CFOForm
          formData={formData}
          onChange={setFormData}
        />
      </div>

      {/* Footer */}
      <footer className="border-t py-6 mt-12" style={{ backgroundColor: 'var(--cfo-card)', borderColor: 'var(--cfo-border)' }}>
        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--cfo-muted)' }}>
            CFO's SAF FinTech Platform - Modern Rebuild © 2025
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--cfo-muted)' }}>
            Press <kbd className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgb(55, 65, 81)' }}>Ctrl+G</kbd> to generate demo data
          </p>
        </div>
      </footer>
      </div>
    </LaunchDateProvider>
  );
}
