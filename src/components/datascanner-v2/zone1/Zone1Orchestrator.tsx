// ============================================
// ZONE 1 ORCHESTRATOR - Composant Principal
// Coordonne le workflow complet de la Zone 1 (Business Lines)
// Utilise React Context + Stepper UI pour guider l'utilisateur
// ============================================

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useZone1Context, useZone1Actions } from '@/contexts/Zone1Context'
import type { Zone1Step } from '@/contexts/Zone1Context'

// Composants enfants
import { Zone1Questionnaire } from './Zone1Questionnaire'
import { Zone1ExtractionResult } from './Zone1ExtractionResult'
import { Zone1RegroupementProposal } from './Zone1RegroupementProposal'
import { Zone1ValidationTable } from './Zone1ValidationTable'

interface Zone1OrchestratorProps {
  jobId: string
  onZoneComplete?: () => void
}

// Configuration des étapes du workflow
const WORKFLOW_STEPS: Array<{
  id: Zone1Step
  label: string
  description: string
  progress: number
}> = [
  {
    id: 'questionnaire',
    label: 'Mode de Saisie',
    description: 'Choisissez entre extraction automatique ou calcul depuis comptabilité',
    progress: 0
  },
  {
    id: 'extraction_result',
    label: 'Résultat Extraction',
    description: 'Vérification des données extraites',
    progress: 33
  },
  {
    id: 'regroupement',
    label: 'Regroupement Intelligent',
    description: 'Gemini AI regroupe vos lignes en 8 catégories',
    progress: 66
  },
  {
    id: 'validation',
    label: 'Validation Finale',
    description: 'Vérifiez et modifiez les 8 business lines avant validation',
    progress: 85
  },
  {
    id: 'completed',
    label: 'Complété',
    description: 'Zone 1 terminée avec succès',
    progress: 100
  }
]

export function Zone1Orchestrator({ jobId, onZoneComplete }: Zone1OrchestratorProps) {
  const { state } = useZone1Context()
  const { setStep: setCurrentStep, setJobId, reset: resetState } = useZone1Actions()

  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoNext, setCanGoNext] = useState(false)

  // Initialiser le jobId dans le contexte
  useEffect(() => {
    if (jobId && state.jobId !== jobId) {
      setJobId(jobId)
    }
  }, [jobId, state.jobId, setJobId])

  // Déterminer l'étape actuelle et la navigation
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === state.currentStep)
  const currentStepConfig = WORKFLOW_STEPS[currentStepIndex]

  useEffect(() => {
    // Logique de navigation
    setCanGoBack(currentStepIndex > 0 && state.currentStep !== 'completed')

    // On peut avancer uniquement dans certains cas
    const canAdvance =
      (state.currentStep === 'extraction_result' && !state.needsRegrouping) ||
      (state.currentStep === 'regroupement' && state.regroupementResult !== null)

    setCanGoNext(canAdvance)
  }, [currentStepIndex, state.currentStep, state.needsRegrouping, state.regroupementResult])

  // Navigation entre étapes
  const handleNext = () => {
    if (state.currentStep === 'questionnaire') {
      // Transition gérée par Zone1Questionnaire après fetch
      return
    }

    if (state.currentStep === 'extraction_result') {
      if (state.needsRegrouping) {
        setCurrentStep('regroupement')
      } else {
        setCurrentStep('validation')
      }
    }

    if (state.currentStep === 'regroupement') {
      setCurrentStep('validation')
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const previousStep = WORKFLOW_STEPS[currentStepIndex - 1].id
      setCurrentStep(previousStep)
    }
  }

  const handleQuestionnaireNext = () => {
    // Après extraction/calcul, passer à extraction_result
    if (state.needsRegrouping) {
      setCurrentStep('regroupement')
    } else {
      setCurrentStep('validation')
    }
  }

  const handleRegroupementAccept = () => {
    setCurrentStep('validation')
  }

  const handleRegroupementManualEntry = () => {
    // Si l'utilisateur veut saisir manuellement, aller directement à validation
    setCurrentStep('validation')
  }

  const handleValidationComplete = () => {
    setCurrentStep('completed')

    // Notifier le parent que la zone est complétée
    if (onZoneComplete) {
      onZoneComplete()
    }
  }

  // Rendu conditionnel du composant selon l'étape
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'questionnaire':
        return (
          <Zone1Questionnaire
            jobId={jobId}
            onNext={handleQuestionnaireNext}
          />
        )

      case 'extraction_result':
        if (!state.extractedData) {
          return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Aucune donnée extraite disponible
              </AlertDescription>
            </Alert>
          )
        }

        return (
          <Zone1ExtractionResult
            data={state.extractedData}
            needsRegrouping={state.needsRegrouping}
            confidence={state.confidence}
            onContinue={handleNext}
            onRetry={() => setCurrentStep('questionnaire')}
          />
        )

      case 'regroupement':
        return (
          <Zone1RegroupementProposal
            jobId={jobId}
            onAccept={handleRegroupementAccept}
            onManualEntry={handleRegroupementManualEntry}
          />
        )

      case 'validation':
        return (
          <Zone1ValidationTable
            jobId={jobId}
            onComplete={handleValidationComplete}
          />
        )

      case 'completed':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-900">
                  Zone 1 Complétée !
                </CardTitle>
                <CardDescription className="text-green-700">
                  Les 8 business lines ont été validées avec succès
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-white p-4">
                  <h4 className="mb-2 font-semibold text-green-900">Récapitulatif</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>✓ Mode de saisie : {state.extractionMode === 'extract' ? 'Extraction' : 'Calcul'}</li>
                    <li>✓ Méthode de détection : {state.extractedData?.detection_method || 'N/A'}</li>
                    <li>✓ Regroupement : {state.needsRegrouping ? 'Effectué avec Gemini AI' : 'Non nécessaire'}</li>
                    <li>✓ Lignes validées : 8</li>
                  </ul>
                </div>

                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetState()
                      setCurrentStep('questionnaire')
                    }}
                  >
                    Recommencer Zone 1
                  </Button>
                  <Button onClick={onZoneComplete}>
                    Passer à la Zone 2
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header avec titre et progression */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Zone 1 : Business Lines
            </h1>
            <p className="mt-1 text-muted-foreground">
              Extraction et validation des 8 lignes métier
            </p>
          </div>

          {state.currentStep !== 'completed' && (
            <div className="text-right">
              <p className="text-sm font-medium">Progression</p>
              <p className="text-2xl font-bold text-primary">
                {currentStepConfig.progress}%
              </p>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <Progress value={currentStepConfig.progress} className="h-2" />
      </div>

      {/* Stepper horizontal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
              const isActive = step.id === state.currentStep
              const isCompleted = index < currentStepIndex
              const isUpcoming = index > currentStepIndex

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  {/* Icône de l'étape */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        flex h-10 w-10 items-center justify-center rounded-full
                        ${isCompleted ? 'bg-green-100 text-green-600' : ''}
                        ${isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                        ${isUpcoming ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </motion.div>

                    {/* Label de l'étape */}
                    <div className="mt-2 text-center">
                      <p className={`
                        text-xs font-medium
                        ${isActive ? 'text-primary' : ''}
                        ${isCompleted ? 'text-green-600' : ''}
                        ${isUpcoming ? 'text-muted-foreground' : ''}
                      `}>
                        {step.label}
                      </p>
                    </div>
                  </div>

                  {/* Ligne de connexion (sauf pour la dernière étape) */}
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className={`
                      mx-2 h-0.5 flex-1
                      ${isCompleted ? 'bg-green-600' : 'bg-muted'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Affichage des erreurs */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Contenu de l'étape actuelle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {state.isLoading ? (
            <Card>
              <CardContent className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Chargement...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            renderStepContent()
          )}
        </motion.div>
      </AnimatePresence>

      {/* Informations contextuelles */}
      {state.currentStep !== 'completed' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">
                  {currentStepConfig.label}
                </h4>
                <p className="text-sm text-blue-700">
                  {currentStepConfig.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
