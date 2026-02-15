// ============================================
// ZONE 3 CONTEXT - Risk Data Workflow State
// Steps: Questionnaire → Extraction → Validation → Completed
// ============================================

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import type { ExtractionMode } from '@/types/datascanner-v2'
import type { Zone3ExtractedRiskData, Zone3ValidatedRiskData } from '@/types/datascanner-zone3'

// ============================================
// TYPES
// ============================================

export type Zone3Step =
  | 'questionnaire'
  | 'extraction_result'
  | 'validation'
  | 'completed'

export interface Zone3State {
  currentStep: Zone3Step
  jobId: string | null
  extractionMode: ExtractionMode | null
  extractedData: Zone3ExtractedRiskData | null
  validatedData: Zone3ValidatedRiskData | null
  isLoading: boolean
  error: string | null
  confidence: number
}

export type Zone3Action =
  | { type: 'SET_JOB_ID'; payload: string }
  | { type: 'SET_MODE'; payload: ExtractionMode }
  | { type: 'SET_EXTRACTED_DATA'; payload: { data: Zone3ExtractedRiskData; confidence: number } }
  | { type: 'SET_VALIDATED_DATA'; payload: Zone3ValidatedRiskData }
  | { type: 'SET_STEP'; payload: Zone3Step }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

const initialState: Zone3State = {
  currentStep: 'questionnaire',
  jobId: null,
  extractionMode: null,
  extractedData: null,
  validatedData: null,
  isLoading: false,
  error: null,
  confidence: 0
}

function zone3Reducer(state: Zone3State, action: Zone3Action): Zone3State {
  switch (action.type) {
    case 'SET_JOB_ID':
      return { ...state, jobId: action.payload }
    case 'SET_MODE':
      return { ...state, extractionMode: action.payload }
    case 'SET_EXTRACTED_DATA':
      return { ...state, extractedData: action.payload.data, confidence: action.payload.confidence, isLoading: false, currentStep: 'extraction_result' }
    case 'SET_VALIDATED_DATA':
      return { ...state, validatedData: action.payload, currentStep: 'completed' }
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

interface Zone3ContextValue {
  state: Zone3State
  dispatch: React.Dispatch<Zone3Action>
}

const Zone3Context = createContext<Zone3ContextValue | undefined>(undefined)

export function Zone3Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(zone3Reducer, initialState)
  return (
    <Zone3Context.Provider value={{ state, dispatch }}>
      {children}
    </Zone3Context.Provider>
  )
}

export function useZone3Context() {
  const context = useContext(Zone3Context)
  if (!context) throw new Error('useZone3Context must be used within Zone3Provider')
  return context
}

export function useZone3Actions() {
  const { dispatch } = useZone3Context()
  return {
    setJobId: (jobId: string) => dispatch({ type: 'SET_JOB_ID', payload: jobId }),
    setMode: (mode: ExtractionMode) => dispatch({ type: 'SET_MODE', payload: mode }),
    setExtractedData: (data: Zone3ExtractedRiskData, confidence: number) =>
      dispatch({ type: 'SET_EXTRACTED_DATA', payload: { data, confidence } }),
    setValidatedData: (data: Zone3ValidatedRiskData) =>
      dispatch({ type: 'SET_VALIDATED_DATA', payload: data }),
    setStep: (step: Zone3Step) => dispatch({ type: 'SET_STEP', payload: step }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    reset: () => dispatch({ type: 'RESET' })
  }
}
