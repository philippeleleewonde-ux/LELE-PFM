// ============================================
// ZONE 3 ORCHESTRATOR - Risk Data Workflow
// Steps: Questionnaire → Extraction Result → Validation → Completed
// ============================================

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useZone3Context, useZone3Actions } from '@/contexts/Zone3Context'
import type { Zone3Step } from '@/contexts/Zone3Context'

import { Zone3Questionnaire } from './Zone3Questionnaire'
import { Zone3ExtractionResult } from './Zone3ExtractionResult'
import { Zone3ValidationTable } from './Zone3ValidationTable'

interface Zone3OrchestratorProps {
  jobId: string
  onZoneComplete?: () => void
}

const WORKFLOW_STEPS: Array<{
  id: Zone3Step
  label: string
  description: string
  progress: number
}> = [
  { id: 'questionnaire', label: 'Mode de Saisie', description: 'Choisissez entre extraction automatique ou saisie manuelle', progress: 0 },
  { id: 'extraction_result', label: 'Résultat Extraction', description: 'Vérification des données de risque extraites', progress: 40 },
  { id: 'validation', label: 'Validation Finale', description: 'Vérifiez les 6 catégories de risque', progress: 75 },
  { id: 'completed', label: 'Complété', description: 'Zone 3 terminée avec succès', progress: 100 }
]

export function Zone3Orchestrator({ jobId, onZoneComplete }: Zone3OrchestratorProps) {
  const { state } = useZone3Context()
  const { setStep, setJobId, reset } = useZone3Actions()

  useEffect(() => {
    if (jobId && state.jobId !== jobId) {
      setJobId(jobId)
    }
  }, [jobId, state.jobId, setJobId])

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === state.currentStep)
  const currentStepConfig = WORKFLOW_STEPS[currentStepIndex]

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'questionnaire':
        return <Zone3Questionnaire jobId={jobId} onNext={() => setStep('extraction_result')} />

      case 'extraction_result':
        if (!state.extractedData) {
          return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>Aucune donnée extraite disponible</AlertDescription>
            </Alert>
          )
        }
        return (
          <Zone3ExtractionResult
            data={state.extractedData}
            confidence={state.confidence}
            onContinue={() => setStep('validation')}
            onRetry={() => setStep('questionnaire')}
          />
        )

      case 'validation':
        return <Zone3ValidationTable jobId={jobId} onComplete={() => { setStep('completed'); onZoneComplete?.() }} />

      case 'completed':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-900">Zone 3 Complétée !</CardTitle>
                <CardDescription className="text-green-700">
                  Les données de risque ont été validées avec succès
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-white p-4">
                  <h4 className="mb-2 font-semibold text-green-900">Récapitulatif</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>✓ Total UL : {state.extractedData?.totalUL?.toLocaleString('fr-FR') || 0}</li>
                    <li>✓ Années de collecte : {state.extractedData?.yearsOfCollection || 0}</li>
                    <li>✓ 6 catégories de risque renseignées</li>
                  </ul>
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => { reset(); setStep('questionnaire') }}>
                    Recommencer Zone 3
                  </Button>
                  <Button onClick={onZoneComplete}>
                    Voir le récapitulatif
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
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zone 3 : Données de Risque</h1>
            <p className="mt-1 text-muted-foreground">Total UL, années de collecte et 6 catégories de risque</p>
          </div>
          {state.currentStep !== 'completed' && (
            <div className="text-right">
              <p className="text-sm font-medium">Progression</p>
              <p className="text-2xl font-bold text-primary">{currentStepConfig.progress}%</p>
            </div>
          )}
        </div>
        <Progress value={currentStepConfig.progress} className="h-2" />
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
              const isActive = step.id === state.currentStep
              const isCompleted = index < currentStepIndex
              const isUpcoming = index > currentStepIndex

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex h-10 w-10 items-center justify-center rounded-full
                        ${isCompleted ? 'bg-green-100 text-green-600' : ''}
                        ${isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                        ${isUpcoming ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> :
                       isActive ? <Loader2 className="h-5 w-5 animate-spin" /> :
                       <Circle className="h-5 w-5" />}
                    </motion.div>
                    <p className={`mt-2 text-xs font-medium
                      ${isActive ? 'text-primary' : ''}
                      ${isCompleted ? 'text-green-600' : ''}
                      ${isUpcoming ? 'text-muted-foreground' : ''}
                    `}>{step.label}</p>
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 ${isCompleted ? 'bg-green-600' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
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
                  <p className="mt-4 text-muted-foreground">Analyse des données de risque...</p>
                </div>
              </CardContent>
            </Card>
          ) : renderStepContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
