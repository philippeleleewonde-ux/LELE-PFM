// ============================================
// ZONE 1 CONTEXT - État Global du Workflow
// Gère le workflow: Question → Extract/Calculate → Regroup → Validate
// ============================================

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import type { BusinessLine, ExtractionMode, Zone1Data } from '@/types/datascanner-v2'
import type { RegroupementResult } from '@/lib/datascanner-v2/services/zone1/BusinessLinesRegrouper'

// ============================================
// TYPES
// ============================================

export type Zone1Step =
  | 'questionnaire'       // Choix Extract/Calculate
  | 'extraction_result'   // Affichage N lignes détectées
  | 'regroupement'        // Proposition Gemini (si N > 8)
  | 'validation'          // Validation finale 8 lignes
  | 'completed'           // Zone 1 terminée

export interface Zone1State {
  // Workflow
  currentStep: Zone1Step
  jobId: string | null

  // Mode choisi
  extractionMode: ExtractionMode | null

  // Données extraites/calculées
  extractedData: Zone1Data | null
  needsRegrouping: boolean

  // Données regroupées (si applicable)
  regroupementResult: RegroupementResult | null

  // Données validées finales (8 lignes)
  validatedLines: BusinessLine[] | null

  // UI State
  isLoading: boolean
  error: string | null

  // Métadonnées
  totalDetected: number
  confidence: number
}

export type Zone1Action =
  | { type: 'SET_JOB_ID'; payload: string }
  | { type: 'SET_MODE'; payload: ExtractionMode }
  | { type: 'SET_EXTRACTED_DATA'; payload: { data: Zone1Data; needsRegrouping: boolean; totalDetected: number; confidence: number } }
  | { type: 'SET_REGROUPED_DATA'; payload: RegroupementResult }
  | { type: 'SET_VALIDATED_DATA'; payload: BusinessLine[] }
  | { type: 'SET_STEP'; payload: Zone1Step }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

// ============================================
// INITIAL STATE
// ============================================

const initialState: Zone1State = {
  currentStep: 'questionnaire',
  jobId: null,
  extractionMode: null,
  extractedData: null,
  needsRegrouping: false,
  regroupementResult: null,
  validatedLines: null,
  isLoading: false,
  error: null,
  totalDetected: 0,
  confidence: 0
}

// ============================================
// REDUCER
// ============================================

function zone1Reducer(state: Zone1State, action: Zone1Action): Zone1State {
  switch (action.type) {
    case 'SET_JOB_ID':
      return { ...state, jobId: action.payload }

    case 'SET_MODE':
      return { ...state, extractionMode: action.payload }

    case 'SET_EXTRACTED_DATA':
      return {
        ...state,
        extractedData: action.payload.data,
        needsRegrouping: action.payload.needsRegrouping,
        totalDetected: action.payload.totalDetected,
        confidence: action.payload.confidence,
        isLoading: false,
        currentStep: action.payload.needsRegrouping ? 'regroupement' : 'validation'
      }

    case 'SET_REGROUPED_DATA':
      return {
        ...state,
        regroupementResult: action.payload,
        currentStep: 'validation'
      }

    case 'SET_VALIDATED_DATA':
      return {
        ...state,
        validatedLines: action.payload,
        currentStep: 'completed'
      }

    case 'SET_STEP':
      return { ...state, currentStep: action.payload }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ============================================
// CONTEXT
// ============================================

interface Zone1ContextValue {
  state: Zone1State
  dispatch: React.Dispatch<Zone1Action>
}

const Zone1Context = createContext<Zone1ContextValue | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

interface Zone1ProviderProps {
  children: ReactNode
}

export function Zone1Provider({ children }: Zone1ProviderProps) {
  const [state, dispatch] = useReducer(zone1Reducer, initialState)

  return (
    <Zone1Context.Provider value={{ state, dispatch }}>
      {children}
    </Zone1Context.Provider>
  )
}

// ============================================
// HOOK CUSTOM
// ============================================

export function useZone1Context() {
  const context = useContext(Zone1Context)

  if (!context) {
    throw new Error('useZone1Context must be used within Zone1Provider')
  }

  return context
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Hook pour les actions courantes
 */
export function useZone1Actions() {
  const { dispatch } = useZone1Context()

  return {
    setJobId: (jobId: string) => dispatch({ type: 'SET_JOB_ID', payload: jobId }),

    setMode: (mode: ExtractionMode) => dispatch({ type: 'SET_MODE', payload: mode }),

    setExtractedData: (data: Zone1Data, needsRegrouping: boolean, totalDetected: number, confidence: number) =>
      dispatch({ type: 'SET_EXTRACTED_DATA', payload: { data, needsRegrouping, totalDetected, confidence } }),

    setRegroupedData: (result: RegroupementResult) =>
      dispatch({ type: 'SET_REGROUPED_DATA', payload: result }),

    setValidatedData: (lines: BusinessLine[]) =>
      dispatch({ type: 'SET_VALIDATED_DATA', payload: lines }),

    setStep: (step: Zone1Step) => dispatch({ type: 'SET_STEP', payload: step }),

    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),

    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),

    reset: () => dispatch({ type: 'RESET' })
  }
}

/**
 * Hook pour vérifier si on peut avancer à l'étape suivante
 */
export function useCanProceed() {
  const { state } = useZone1Context()

  switch (state.currentStep) {
    case 'questionnaire':
      return state.extractionMode !== null

    case 'extraction_result':
      return state.extractedData !== null

    case 'regroupement':
      return state.regroupementResult !== null

    case 'validation':
      return state.validatedLines !== null && state.validatedLines.length === 8

    case 'completed':
      return true

    default:
      return false
  }
}
