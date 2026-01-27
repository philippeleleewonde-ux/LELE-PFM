import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormData, FormStep } from '@/modules/module1/types';
import { UserStorage } from '../utils/userStorage';
import { WelcomeSection } from './sections/WelcomeSection';
import { CompanyInfoSection } from './sections/CompanyInfoSection';
import { BusinessLinesSection } from './sections/BusinessLinesSection';
import { EmployeeEngagementSection } from './sections/EmployeeEngagementSection';
import { RiskDataSection } from './sections/RiskDataSection';
import { QualitativeAssessmentSection } from './sections/QualitativeAssessmentSection';
import { SocioeconomicSection } from './sections/SocioeconomicSection';
import { Page7CalculatedResults } from './steps/Page7CalculatedResults';
import { Page8EmployeeEngagement } from './steps/Page8EmployeeEngagement';
import { Page9IPLEAccounts } from './steps/Page9IPLEAccounts';
import { Page10EconomicBreakdown } from './steps/Page10EconomicBreakdown';
import { Page11RiskThreshold } from './steps/Page11RiskThreshold';
import { Page12IPLEPlan } from './steps/Page12IPLEPlan';
import { Page13Dashboard } from './steps/Page13Dashboard';
import { Page14PriorityActionsN1 } from './steps/Page14PriorityActionsN1';
import { Page15PriorityActionsN2 } from './steps/Page15PriorityActionsN2';
import { Page16PriorityActionsN3 } from './steps/Page16PriorityActionsN3';
import { Page17GlobalReporting } from './reporting/Page17GlobalReporting';
import { FormNavigation } from './FormNavigation';
import { StepIndicator } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, FileText, CheckCircle } from 'lucide-react';
import { SupabaseService } from '../services/SupabaseService';
import { Loader2 } from 'lucide-react';
import { SaveDataDialog } from './SaveDataDialog';

interface CFOFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
}

export function CFOForm({ formData, onChange }: CFOFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [welcomeAccepted, setWelcomeAccepted] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await SupabaseService.loadCFOData();
        if (result.success && result.data) {
          onChange(result.data);
          // Optional: Jump to last active step or stay at 0? 
          // For now, let's stay at 0 or 1.
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  // ... existing handlers ...

  const handleFinalSave = async () => {
    try {
      setIsSaving(true);
      const result = await SupabaseService.saveCFOData(formData);

      if (result.success) {
        // Local backup as fallback
        UserStorage.setItem('cfo_data_locked', 'true');
        UserStorage.setItem('cfo_final_data', JSON.stringify(formData));

        setShowSaveDialog(false);
        alert('Données enregistrées et sécurisées avec succès dans la base de données !');
      } else {
        alert(`Erreur lors de la sauvegarde : ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Une erreur inattendue est survenue.');
    } finally {
      setIsSaving(false);
    }
  };

  // Define form steps with welcome page as first step
  const steps: FormStep[] = [
    {
      id: 0,
      title: 'General conditions',
      description: 'CFO Platform terms and risk appetite thresholds',
      isCompleted: welcomeAccepted,
      isActive: currentStep === 0
    },
    {
      id: 1,
      title: "CFO's SAF FinTech Platform",
      description: 'Basic company details and business sector',
      isCompleted: !!formData.companyInfo.companyName && !!formData.companyInfo.email,
      isActive: currentStep === 1
    },
    {
      id: 2,
      title: "2- Customized configuration of the company's business lines",
      description: `Provide asset data for business lines or business management functions grouped into a maximum of 8 lines (Example for industry and services, this is usually general administration, purchasing, finance and accounting, logistics, marketing and sales, production, research and development , human resources, design, legal function, exploration function, etc.):

- Workforce of the line

- Number of team leaders (1 for maxi 20 employees)

- Annual budget of the line`,
      isCompleted: formData.businessLines.length > 0,
      isActive: currentStep === 2
    },
    {
      id: 3,
      title: '3- Provide data to be treated to schedule and program employee engagement accounts (EE)',
      description: 'Annual hours and financial history',
      isCompleted: formData.employeeEngagement.annualHoursPerPerson > 0 &&
        formData.employeeEngagement.financialHistory.length >= 2,
      isActive: currentStep === 3
    },
    {
      id: 4,
      title: '4- Programming data of potentially recoverable loss accounts (PRL)',
      description: 'Enter the data from your risk register or risk map stored in the internal database of unexpected losses (UL). - Loss events or malfunctions.',
      isCompleted: formData.riskData.totalUL > 0,
      isActive: currentStep === 4
    },
    {
      id: 5,
      title: '5- Programming data of potentially recoverable loss accounts (PRL)',
      description: 'Qualitative estimate of the incidents of operational risk',
      isCompleted: !!formData.qualitativeAssessment.operationalRiskIncidents,
      isActive: currentStep === 5
    },
    {
      id: 6,
      title: '6- Programming data of potentially recoverable loss accounts (PRL)',
      description: 'Qualitative estimate of keys areas of socioeconomic improvement',
      isCompleted: !!formData.socioeconomicImprovement.keyArea1_workingConditions,
      isActive: currentStep === 6
    },
    {
      id: 7,
      title: '7- Programming data of potentially recoverable loss accounts (PRL)',
      description: 'Data analysis by the Online Analytical Processing Center (OLAPC) of your Sustainability Accounting FinTech (SAF)',
      isCompleted: true,
      isActive: currentStep === 7
    },
    {
      id: 8,
      title: '8- Data Processing for Programming and Managing... Employee Engagement Accounts (EE)',
      description: 'Plan de gains sur 3 ans basé sur les Pertes Potentiellement Récupérables',
      isCompleted: true,
      isActive: currentStep === 8
    },
    {
      id: 9,
      title: '9- Data Processing for Programming and Managing... Incentivized Pay Leverage Effect (IPLE) Accounts',
      description: 'Répartition du gain potentiel total entre les domaines clés',
      isCompleted: true,
      isActive: currentStep === 9
    },
    {
      id: 10,
      title: '10- Breakdown of the programmed economic benefit to loss events and risks induced as consequences (Some are common to all business sectors. Others are specific)',
      description: 'Ventilation du gain total (VaR) par ligne d\'activité et par type de risque',
      isCompleted: true,
      isActive: currentStep === 10
    },
    {
      id: 11,
      title: '11- BREACKDOWN OF THE AMOUNT OF LOSSES RELATED TO RISK APPETITE THRESHOLD',
      description: 'Ventilation des montants des pertes par ligne d\'activité',
      isCompleted: true,
      isActive: currentStep === 11
    },
    {
      id: 12,
      title: '12- Breakdown of the Incentivized Pay Leverage Effect (IPLE) expected from the Financial Performance of Workstations over a 3-year plan',
      description: 'Flux financiers attendus sur le plan de 3 ans',
      isCompleted: true,
      isActive: currentStep === 12
    },
    {
      id: 13,
      title: '13- Dashboard of the real-time driving plan and feedback of the internal financial performance scheduled for the counterpart of the Incentivized Pay (Bonus or variable salary)',
      description: 'Tableau de bord consolidé du plan de performance financière',
      isCompleted: true,
      isActive: currentStep === 13
    },
    {
      id: 14,
      title: '14- PRIORITY ACTIONS - N+1 / Action plan or progress plan by key areas of socio-economic improvement',
      description: 'Distribution des objectifs d\'économie de coûts pour l\'année N+1 par ligne d\'activité et par indicateur de performance',
      isCompleted: true,
      isActive: currentStep === 14
    },
    {
      id: 15,
      title: '15- PRIORITY ACTIONS - N+2 / Action plan or progress plan by key areas of socio-economic improvement',
      description: 'Distribution des objectifs d\'économie de coûts pour l\'année N+2 par ligne d\'activité et par indicateur de performance',
      isCompleted: true,
      isActive: currentStep === 15
    },
    {
      id: 16,
      title: '16- PRIORITY ACTIONS - N+3 / Action plan or progress plan by key areas of socio-economic improvement',
      description: 'Distribution des objectifs d\'économie de coûts pour l\'année N+3 par ligne d\'activité et par indicateur de performance',
      isCompleted: true,
      isActive: currentStep === 16
    },
    {
      id: 17,
      title: '17- GLOBAL REPORTING HCM PERFORMANCE PLAN',
      description: 'Synthèse complète de l\'analyse socio-économique et planification stratégique sur 3 ans - Consolidation de toutes les pages précédentes',
      isCompleted: true,
      isActive: currentStep === 17
    }
  ];

  const handleStepChange = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await SupabaseService.saveCFOData(formData);

      if (result.success) {
        // Local backup as fallback
        UserStorage.setItem('cfo_data_locked', 'true');
        UserStorage.setItem('cfo_final_data', JSON.stringify(formData));

        alert('Sauvegarde intermédiaire réussie !');
      } else {
        console.error('Save error:', result.error);
        alert(`Erreur lors de la sauvegarde : ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Une erreur inattendue est survenue lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    // Implement export functionality
    // Could generate PDF, Excel, etc.
  };

  const handleWelcomeAccept = () => {
    setWelcomeAccepted(true);
    setCurrentStep(1); // Move to company info after acceptance
  };

  const handleRestart = () => {
    // Logic to restart analysis
    setShowSaveDialog(false);
    setCurrentStep(1); // Go back to "CFO's SAF FinTech Platform" (Step 1)
  };

  const renderCurrentSection = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeSection onAccept={handleWelcomeAccept} />;
      case 1:
        return <CompanyInfoSection
          companyInfo={formData.companyInfo}
          selectedCurrency={formData.selectedCurrency}
          onCompanyInfoChange={(companyInfo) => onChange({ ...formData, companyInfo })}
          onCurrencyChange={(currency) => onChange({ ...formData, selectedCurrency: currency })}
        />;
      case 2:
        return <BusinessLinesSection data={formData.businessLines} onChange={(businessLines) => onChange({ ...formData, businessLines })} currency={formData.selectedCurrency} />;
      case 3:
        return <EmployeeEngagementSection data={formData.employeeEngagement} selectedCurrency={formData.selectedCurrency} onChange={(employeeEngagement) => onChange({ ...formData, employeeEngagement })} />;
      case 4:
        return <RiskDataSection data={formData.riskData} selectedCurrency={formData.selectedCurrency} onChange={(riskData) => onChange({ ...formData, riskData })} />;
      case 5:
        return <QualitativeAssessmentSection data={formData.qualitativeAssessment} onChange={(qualitativeAssessment) => onChange({ ...formData, qualitativeAssessment })} />;
      case 6:
        return <SocioeconomicSection data={formData.socioeconomicImprovement} onChange={(socioeconomicImprovement) => onChange({ ...formData, socioeconomicImprovement })} />;
      case 7:
        return <Page7CalculatedResults formData={formData} selectedCurrency={formData.selectedCurrency} calculated={formData.calculatedFields} onExport={handleExport} />;
      case 8:
        return <Page8EmployeeEngagement calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} />;
      case 9:
        return <Page9IPLEAccounts calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} socioeconomicData={formData.socioeconomicImprovement} />;
      case 10:
        return <Page10EconomicBreakdown calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} businessLines={formData.businessLines} qualitativeData={formData.qualitativeAssessment} socioeconomicData={formData.socioeconomicImprovement} />;
      case 11:
        return <Page11RiskThreshold calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} businessLines={formData.businessLines} qualitativeData={formData.qualitativeAssessment} />;
      case 12:
        return <Page12IPLEPlan calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} socioeconomicData={formData.socioeconomicImprovement} qualitativeData={formData.qualitativeAssessment} />;
      case 13:
        return <Page13Dashboard calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} />;
      case 14:
        return <Page14PriorityActionsN1 calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} businessLines={formData.businessLines} />;
      case 15:
        return <Page15PriorityActionsN2 calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} businessLines={formData.businessLines} />;
      case 16:
        return <Page16PriorityActionsN3 calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} businessLines={formData.businessLines} />;
      case 17:
        return <Page17GlobalReporting calculated={formData.calculatedFields} selectedCurrency={formData.selectedCurrency} businessLines={formData.businessLines} socioeconomicData={formData.socioeconomicImprovement} qualitativeData={formData.qualitativeAssessment} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={handleStepChange}
      />

      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Current Step Content */}
      <div className="form-section animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="form-section-title">{steps[currentStep].title}</h2>
            <div className="text-cfo-muted whitespace-pre-line">{steps[currentStep].description}</div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="default"
              size="sm"
              className="!text-slate-900 dark:!text-slate-900"
              title="Save Progress"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button
              onClick={handleExport}
              variant="default"
              size="sm"
              className="!text-slate-900 dark:!text-slate-900"
              title="Export Report"
            >
              <FileText className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Section Content */}
        {renderCurrentSection()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-cfo-border">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="default"
          size="default"
          className="!text-slate-900 dark:!text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <div className="text-center">
          <span className="text-cfo-muted text-sm">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={() => setShowSaveDialog(true)}
            variant="default"
            size="default"
            className="!bg-green-600 hover:!bg-green-700 !text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            title="Finalize and Save Data"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>SAVE YOUR DATA</span>
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="default"
            size="default"
            className="!text-slate-900 dark:!text-slate-900"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <SaveDataDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleFinalSave}
        onCancel={handleRestart}
        isSaving={isSaving}
      />
    </div>
  );
}
