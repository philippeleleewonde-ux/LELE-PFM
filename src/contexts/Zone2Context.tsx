// ============================================
// ZONE 2 CONTEXT - État Global du Workflow
// Gère le workflow: Questionnaire → Extraction → Validation → Completed
// ============================================

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import type { ExtractionMode } from '@/types/datascanner-v2'
import type { Zone2ExtractedData, Zone2ValidatedData } from '@/types/datascanner-zone2'

// ============================================
// TYPES
// ============================================

export type Zone2Step =
  | 'questionnaire'
  | 'extraction_result'
  | 'validation'
  | 'completed'

export interface Zone2State {
  currentStep: Zone2Step
  jobId: string | null
  extractionMode: ExtractionMode | null
  extractedData: Zone2ExtractedData | null
  validatedData: Zone2ValidatedData | null
  isLoading: boolean
  error: string | null
  confidence: number
}

export type Zone2Action =
  | { type: 'SET_JOB_ID'; payload: string }
  | { type: 'SET_MODE'; payload: ExtractionMode }
  | { type: 'SET_EXTRACTED_DATA'; payload: { data: Zone2ExtractedData; confidence: number } }
  | { type: 'SET_VALIDATED_DATA'; payload: Zone2ValidatedData }
  | { type: 'SET_STEP'; payload: Zone2Step }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

// ============================================
// INITIAL STATE
// ============================================

const initialState: Zone2State = {
  currentStep: 'questionnaire',
  jobId: null,
  extractionMode: null,
  extractedData: null,
  validatedData: null,
  isLoading: false,
  error: null,
  confidence: 0
}

// ============================================
// REDUCER
// ============================================

function zone2Reducer(state: Zone2State, action: Zone2Action): Zone2State {
  switch (action.type) {
    case 'SET_JOB_ID':
      return { ...state, jobId: action.payload }

    case 'SET_MODE':
      return { ...state, extractionMode: action.payload }

    case 'SET_EXTRACTED_DATA':
      return {
        ...state,
        extractedData: action.payload.data,
        confidence: action.payload.confidence,
        isLoading: false,
        currentStep: 'extraction_result'
      }

    case 'SET_VALIDATED_DATA':
      return {
        ...state,
        validatedData: action.payload,
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

interface Zone2ContextValue {
  state: Zone2State
  dispatch: React.Dispatch<Zone2Action>
}

const Zone2Context = createContext<Zone2ContextValue | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

interface Zone2ProviderProps {
  children: ReactNode
}

export function Zone2Provider({ children }: Zone2ProviderProps) {
  const [state, dispatch] = useReducer(zone2Reducer, initialState)

  return (
    <Zone2Context.Provider value={{ state, dispatch }}>
      {children}
    </Zone2Context.Provider>
  )
}

// ============================================
// HOOKS
// ============================================

export function useZone2Context() {
  const context = useContext(Zone2Context)
  if (!context) {
    throw new Error('useZone2Context must be used within Zone2Provider')
  }
  return context
}

export function useZone2Actions() {
  const { dispatch } = useZone2Context()

  return {
    setJobId: (jobId: string) => dispatch({ type: 'SET_JOB_ID', payload: jobId }),
    setMode: (mode: ExtractionMode) => dispatch({ type: 'SET_MODE', payload: mode }),
    setExtractedData: (data: Zone2ExtractedData, confidence: number) =>
      dispatch({ type: 'SET_EXTRACTED_DATA', payload: { data, confidence } }),
    setValidatedData: (data: Zone2ValidatedData) =>
      dispatch({ type: 'SET_VALIDATED_DATA', payload: data }),
    setStep: (step: Zone2Step) => dispatch({ type: 'SET_STEP', payload: step }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    reset: () => dispatch({ type: 'RESET' })
  }
}
