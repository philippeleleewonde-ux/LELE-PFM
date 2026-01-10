// ============================================
// TYPES DATA SCANNER - Backend TypeScript Types
// ============================================

export interface BusinessLine {
  line_name: string
  revenue_n: number
  revenue_n_minus_1: number
  headcount_n?: number
  evolution_percent?: number
  confidence?: number
}

export interface ExtractionResult {
  total_lines: number
  business_lines: BusinessLine[]
  confidence: number
  needs_regrouping: boolean
  extraction_method: 'keyword' | 'llm' | 'formula'
}

export interface ExtractionJob {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_count: number
  progress: {
    zone1: number
    zone2: number
    zone3: number
    zone4: number
    zone5: number
    zone6: number
    zone7: number
    zone8: number
    zone9: number
    zone10: number
  }
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface UploadedFile {
  id: string
  job_id: string
  filename: string
  file_type: 'pdf' | 'excel' | 'csv'
  file_size: number
  mime_type: string
  storage_path: string
  storage_bucket: string
  status: 'pending' | 'scanning' | 'completed' | 'failed'
  created_at: string
}

export interface ExtractRequest {
  file_urls: string[]
}

export interface ExtractResponse {
  success: boolean
  data: ExtractionResult
  total_detected: number
  needs_regrouping: boolean
  confidence: number
}

export interface ErrorResponse {
  error: string
  message: string
  details?: string
}
