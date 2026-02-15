// ============================================
// ZONE 2 - FINANCIAL HISTORY TYPES
// Historique financier: heures annuelles + CA/Charges multi-années
// ============================================

export interface Zone2FinancialYear {
  year: number
  yearLabel: string      // "N-1", "N-2", etc.
  sales: number          // en milliers
  spending: number       // en milliers
  confidence: number     // 0-1
}

export interface Zone2ExtractedData {
  annualHoursPerPerson: number
  hoursSource: 'extracted' | 'manual'
  financialYears: Zone2FinancialYear[]
  currency: string
  confidence: number
}

export interface Zone2ValidatedData {
  annualHoursPerPerson: number
  financialYears: Zone2FinancialYear[]
  currency: string
}
