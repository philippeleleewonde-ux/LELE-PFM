// ============================================
// DATA SCANNER MAIN - Application Entry Point
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserStorage } from '@/modules/module1/utils/userStorage';
import { supabase } from '@/integrations/supabase/client';
import { LandingScreen } from './components/LandingScreen';
// ⚠️ TEMPORARY: Disable legacy mode imports to avoid llmClassifier error
// import { UploadZone } from './components/UploadZone';
// import { ScanConversation } from './components/ScanConversation';
// import { ValidationPanel } from './components/ValidationPanel';
// import { ScanResults } from './components/ScanResults';
// import { useScanEngine } from './hooks/useScanEngine';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import './datascanner.css';

// Zone 1 V2 - Nouveau workflow intelligent avec Gemini AI
import { Zone1Provider } from '@/contexts/Zone1Context';
import { Zone1Orchestrator } from '@/components/datascanner-v2/zone1/Zone1Orchestrator';

type AppStep = 'landing' | 'mode_selection' | 'zone1_v2' | 'upload' | 'scanning' | 'validation' | 'results';
type ScannerMode = 'legacy' | 'zone1_v2';

export default function DataScannerMain() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [scannerMode, setScannerMode] = useState<ScannerMode>('legacy');
  const [zone1JobId, setZone1JobId] = useState<string | null>(null);

  // ⚠️ TEMPORARY: useScanEngine disabled to avoid llmClassifier crash
  // const {
  //   uploadedFiles,
  //   scanResults,
  //   validatedDataPoints,
  //   currentValidationIndex,
  //   pendingDataPoints,
  //   statistics,
  //   handleFilesUploaded,
  //   handleRemoveFile,
  //   scanAllFiles,
  //   handleValidation,
  //   reset,
  //   exportToJSON
  // } = useScanEngine();

  // Dummy values for now (legacy mode is disabled anyway)
  const uploadedFiles: any[] = [];
  const scanResults: any[] = [];
  const validatedDataPoints: any[] = [];
  const currentValidationIndex = 0;
  const pendingDataPoints: any[] = [];
  const statistics: any = {};
  const handleFilesUploaded = () => {};
  const handleRemoveFile = () => {};
  const scanAllFiles = async () => {};
  const handleValidation = () => {};
  const reset = () => {};
  const exportToJSON = () => {};

  // Set user ID for scoped storage
  useEffect(() => {
    if (user?.id) {
      UserStorage.setUserId(user.id);
    }
  }, [user?.id]);

  // Auto-advance to validation when scanning completes
  useEffect(() => {
    if (currentStep === 'scanning') {
      const allCompleted = uploadedFiles.every(f => f.status === 'completed' || f.status === 'error');

      if (allCompleted && uploadedFiles.length > 0) {
        // Check if we have data to validate
        if (pendingDataPoints.length > 0) {
          setTimeout(() => setCurrentStep('validation'), 1000);
        } else {
          setTimeout(() => setCurrentStep('results'), 1000);
        }
      }
    }
  }, [uploadedFiles, currentStep, pendingDataPoints]);

  // Auto-advance to results when all validations complete
  useEffect(() => {
    if (currentStep === 'validation' && pendingDataPoints.length === 0 && validatedDataPoints.length > 0) {
      setCurrentStep('results');
    }
  }, [currentStep, pendingDataPoints, validatedDataPoints]);

  const handleGetStarted = () => {
    // ⚠️ TEMPORARY FIX: Go directly to Zone 1 V2 to avoid legacy mode crash
    // The legacy mode causes "TypeError: The superclass is not a constructor" error
    // TODO: Fix llmClassifier import issue in businessLineAggregator.ts
    handleModeSelection('zone1_v2');
  };

  const handleModeSelection = async (mode: ScannerMode) => {
    setScannerMode(mode);

    if (mode === 'zone1_v2') {
      // Vérifier que l'utilisateur est authentifié
      if (!user?.id) {
        alert('Vous devez être connecté pour utiliser cette fonctionnalité.');
        return;
      }

      // Créer un job pour Zone 1 V2 directement via Supabase
      try {
        const { data: job, error: jobError } = await supabase
          .from('extraction_jobs')
          .insert({
            user_id: user.id,
            status: 'pending',
            file_count: 0,
            progress: {
              zone1: 0,
              zone2: 0,
              zone3: 0,
              zone4: 0,
              zone5: 0,
              zone6: 0,
              zone7: 0,
              zone8: 0,
              zone9: 0,
              zone10: 0
            }
          })
          .select()
          .single();

        if (jobError) {
          console.error('❌ Failed to create job:', jobError);
          throw jobError;
        }

        setZone1JobId(job.id);
        setCurrentStep('zone1_v2');
      } catch (error) {
        console.error('❌ Failed to create Zone 1 job:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));

        // Afficher un message d'erreur plus détaillé
        let errorMessage = 'Erreur inconnue';

        if (error && typeof error === 'object') {
          // Supabase error
          if ('message' in error) {
            errorMessage = String(error.message);
          }
          if ('details' in error) {
            errorMessage += `\n\nDétails: ${String(error.details)}`;
          }
          if ('hint' in error) {
            errorMessage += `\n\nIndice: ${String(error.hint)}`;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        alert(`Erreur lors de la création du job:\n${errorMessage}\n\nVeuillez vérifier votre connexion et réessayer.`);
      }
    } else {
      // Mode legacy
      setCurrentStep('upload');
    }
  };

  const handleZone1Complete = () => {
    // Après Zone 1, on pourrait passer à Zone 2 ou afficher un résumé
    alert('Zone 1 complétée ! Fonctionnalité Zone 2 à venir.');
    handleBackToLanding();
  };

  const handleStartScanning = async () => {
    setCurrentStep('scanning');
    await scanAllFiles();
  };

  const handleSaveData = () => {
    try {
      const payload = {
        dataPoints: validatedDataPoints,
        statistics,
        savedAt: new Date().toISOString()
      };
      UserStorage.setItem('hcm_scanner_data', JSON.stringify(payload));
      alert('Data saved successfully to your profile!');
    } catch (error) {
      console.error('Failed to save data:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const handleBackToLanding = () => {
    reset();
    setCurrentStep('landing');
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'landing':
        return <LandingScreen onGetStarted={handleGetStarted} />;

      case 'mode_selection':
        return (
          <div className="datascanner-wrapper p-8">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <Button onClick={handleBackToLanding} variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </div>

              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold datascanner-text-primary mb-4">
                  Choisissez votre Mode de Scan
                </h1>
                <p className="datascanner-text-muted text-lg">
                  Sélectionnez le workflow qui correspond à vos besoins
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Mode Zone 1 V2 - Nouveau */}
                <div
                  onClick={() => handleModeSelection('zone1_v2')}
                  className="group cursor-pointer relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 transition-all hover:border-primary/40 hover:shadow-2xl hover:scale-105"
                >
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                      NOUVEAU
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Zone 1 V2 - Business Lines</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Workflow intelligent avec <strong>Gemini AI</strong> pour extraire et regrouper automatiquement vos business lines
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span>Regroupement intelligent par IA</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span>Validation interactive</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span>96% moins cher que GPT-4</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    Démarrer avec Gemini AI
                  </Button>
                </div>

                {/* Mode Legacy */}
                <div
                  onClick={() => handleModeSelection('legacy')}
                  className="group cursor-pointer relative overflow-hidden rounded-2xl border-2 border-border bg-gradient-to-br from-muted/50 to-muted/30 p-8 transition-all hover:border-border hover:shadow-xl hover:scale-105"
                >
                  <div className="mb-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted group-hover:bg-muted/80 transition-colors">
                      <Save className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Mode Classique</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Workflow traditionnel avec upload, scanning et validation manuelle
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Upload de fichiers Excel/PDF</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Détection par mots-clés</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Validation point par point</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" size="lg">
                    Utiliser le Mode Classique
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'zone1_v2':
        if (!zone1JobId) {
          return (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Initialisation de Zone 1...</p>
              </div>
            </div>
          );
        }

        return (
          <div className="datascanner-wrapper p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <Button onClick={handleBackToLanding} variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>

              <Zone1Provider>
                <Zone1Orchestrator
                  jobId={zone1JobId}
                  onZoneComplete={handleZone1Complete}
                />
              </Zone1Provider>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="datascanner-wrapper p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <Button
                  onClick={handleBackToLanding}
                  variant="ghost"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold datascanner-text-primary mb-4">Upload Financial Documents</h1>
                <p className="datascanner-text-muted">
                  Upload Excel or PDF files containing your financial data
                </p>
              </div>

              <UploadZone
                onFilesUploaded={handleFilesUploaded}
                uploadedFiles={uploadedFiles}
                onRemoveFile={handleRemoveFile}
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={handleStartScanning}
                    size="lg"
                    className="datascanner-btn-primary px-12 py-6 text-xl"
                  >
                    Start Scanning ({uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'})
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'scanning':
        const currentScanFile = uploadedFiles.find(f => f.status === 'scanning' || f.status === 'completed');
        return (
          <div className="datascanner-wrapper p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold datascanner-text-primary mb-4">Scanning Documents</h1>
                <p className="datascanner-text-muted">Please wait while we analyze your files...</p>
              </div>

              {currentScanFile && (
                <ScanConversation
                  fileName={currentScanFile.file.name}
                  status={currentScanFile.status === 'completed' ? 'completed' : 'scanning'}
                  progress={currentScanFile.progress}
                  dataPointsFound={
                    scanResults.find(r => r.fileId === currentScanFile.id)?.dataPoints.length || 0
                  }
                  errorMessage={currentScanFile.errorMessage}
                />
              )}
            </div>
          </div>
        );

      case 'validation':
        const currentDataPoint = pendingDataPoints[0];

        return (
          <div className="datascanner-wrapper p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold datascanner-text-primary mb-4">Validate Extracted Data</h1>
                <p className="datascanner-text-muted">Review each data point and confirm or correct</p>
              </div>

              {currentDataPoint ? (
                <ValidationPanel
                  dataPoint={currentDataPoint}
                  onValidate={handleValidation}
                  currentIndex={currentValidationIndex}
                  totalCount={pendingDataPoints.length + validatedDataPoints.length}
                />
              ) : (
                <div className="text-center datascanner-text-primary">
                  <p>All data points validated!</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="datascanner-wrapper p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold datascanner-text-primary mb-4">Scan Results</h1>
                    <p className="datascanner-text-muted">Your validated financial data is ready</p>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      onClick={handleSaveData}
                      variant="default"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save to Profile
                    </Button>
                    <Button
                      onClick={handleBackToLanding}
                      variant="outline"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      New Scan
                    </Button>
                  </div>
                </div>
              </div>

              <ScanResults
                dataPoints={validatedDataPoints}
                statistics={statistics}
                onExport={exportToJSON}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="datascanner-wrapper">
      {renderContent()}
    </div>
  );
}
