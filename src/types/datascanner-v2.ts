// ============================================
// HCM DATA EXTRACTOR V2 - TYPESCRIPT TYPES
// Types partagés entre Frontend et Backend
// ============================================

// ============================================
// ENUMS
// ============================================

export enum ExtractionJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum FileStatus {
  PENDING = 'pending',
  SCANNING = 'scanning',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum FileType {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv'
}

export enum ExtractionMode {
  EXTRACT = 'extract',
  CALCULATE = 'calculate'
}

export enum ZoneNumber {
  ZONE_1 = 1,  // Business Lines
  ZONE_2 = 2,  // Working Hours
  ZONE_3 = 3,  // Revenue/Expenses
  ZONE_4 = 4,  // UL Data
  ZONE_5 = 5,  // Operational Risk
  ZONE_6 = 6,  // Credit Risk
  ZONE_7 = 7,  // Market Risk
  ZONE_8 = 8,  // Liquidity/Transformation Risk
  ZONE_9 = 9,  // Organizational Risk
  ZONE_10 = 10 // Health & Insurance Risk
}

export enum InjectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// ============================================
// BASE TYPES
// ============================================

export interface ExtractionJob {
  id: string
  user_id: string
  company_name: string | null
  status: ExtractionJobStatus
  file_count: number
  progress: ZoneProgress
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface ZoneProgress {
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

export interface UploadedFile {
  id: string
  job_id: string
  filename: string
  file_type: FileType
  file_size: number
  mime_type: string
  storage_path: string
  storage_bucket: string
  status: FileStatus
  error_message: string | null
  created_at: string
  processed_at: string | null
}

export interface ZoneChoice {
  id: string
  job_id: string
  zone_number: ZoneNumber
  can_extract: boolean
  can_calculate: boolean
  user_choice: ExtractionMode | null
  chosen_at: string | null
}

// ============================================
// ZONE DATA TYPES (Specific à chaque zone)
// ============================================

// Zone 1: Business Lines (8 categories)
export interface BusinessLine {
  name: string
  category: BusinessLineCategory
  year: number
  metrics: {
    revenue?: number
    expenses?: number
    headcount?: number
    team_count?: number
    budget?: number
    budget_n1?: number
  }
  confidence: number
}

export enum BusinessLineCategory {
  MANUFACTURING_PRODUCTION = 'Manufacturing & Production',
  SALES_DISTRIBUTION = 'Sales & Distribution',
  SERVICES_CONSULTING = 'Services & Consulting',
  TECHNOLOGY_RND = 'Technology & R&D',
  FINANCIAL_SERVICES = 'Financial Services',
  ADMINISTRATIVE_SUPPORT = 'Administrative & Support',
  MARKETING_COMMUNICATION = 'Marketing & Communication',
  OTHER_ACTIVITIES = 'Other Activities'
}

export interface Zone1Data {
  business_lines: BusinessLine[]
  total_lines: number
  detection_method: 'keyword' | 'llm' | 'calculation'
}

// Zone 2: Working Hours per Employee
export interface Zone2Data {
  annual_hours: number
  calculation_method: 'extracted' | 'calculated'
  base_data?: {
    total_hours_worked?: number
    total_employees?: number
    working_days_per_year?: number
    hours_per_day?: number
  }
  confidence: number
}

// Zone 3: Revenue & Expenses (5 years)
export interface Zone3Data {
  years: YearlyFinancialData[]
  currency: string
}

export interface YearlyFinancialData {
  year: number
  revenue: number
  expenses: number
  net_result?: number
  source_file?: string
}

// Zone 4: Unexpected Loss (UL) Data
export interface Zone4Data {
  years: ULYearlyData[]
  total_ul_5_years: number
  calculation_method: 'extracted' | 'basel_formula'
}

export interface ULYearlyData {
  year: number
  unexpected_loss: number
  expected_loss?: number
  confidence_level?: number // 99.9% typically
}

// Zone 5: Operational Risk (Basel II QIS 2)
export interface Zone5Data {
  years: OpRiskYearlyData[]
  total_op_risk_capital: number
}

export interface OpRiskYearlyData {
  year: number
  loss_events: OpRiskLossEvent[]
  total_loss: number
  capital_requirement: number
}

export interface OpRiskLossEvent {
  event_type: OpRiskEventType
  gross_loss: number
  date: string
  description?: string
}

export enum OpRiskEventType {
  INTERNAL_FRAUD = 'Internal fraud',
  EXTERNAL_FRAUD = 'External fraud',
  EMPLOYMENT_PRACTICES = 'Employment Practices and Workplace Safety',
  CLIENTS_PRODUCTS = 'Clients, Products & Business Practices',
  DAMAGE_PHYSICAL_ASSETS = 'Damage to Physical Assets',
  BUSINESS_DISRUPTION = 'Business Disruption and System Failures',
  EXECUTION_DELIVERY = 'Execution, Delivery & Process Management'
}

// Zone 6: Credit Counterparty Risk
export interface Zone6Data {
  years: CreditRiskYearlyData[]
  total_exposure: number
}

export interface CreditRiskYearlyData {
  year: number
  client_risk: CreditExposure
  country_risk: CountryRiskExposure[]
  total_exposure: number
  capital_requirement: number
}

export interface CreditExposure {
  total_exposure: number
  weighted_exposure: number
  probability_of_default: number
  loss_given_default: number
}

export interface CountryRiskExposure {
  country: string
  exposure: number
  risk_rating: string // AAA, AA, A, BBB, etc.
}

// Zone 7: Market Risk (Settlement errors)
export interface Zone7Data {
  years: MarketRiskYearlyData[]
  total_market_risk_capital: number
}

export interface MarketRiskYearlyData {
  year: number
  settlement_errors: SettlementError[]
  total_loss: number
  capital_requirement: number
}

export interface SettlementError {
  date: string
  error_type: 'payment' | 'transaction' | 'reconciliation'
  amount: number
  resolved: boolean
}

// Zone 8: Liquidity & Transformation Risk
export interface Zone8Data {
  years: LiquidityRiskYearlyData[]
  gap_analysis: MaturityGap[]
}

export interface LiquidityRiskYearlyData {
  year: number
  liquidity_ratio: number // Actifs liquides / Passifs à court terme
  transformation_gap: number
  illiquidity_risk_score: number
}

export interface MaturityGap {
  maturity_bucket: string // '1-7 days', '1-3 months', etc.
  assets: number
  liabilities: number
  gap: number
}

// Zone 9: Organizational Risk
export interface Zone9Data {
  years: OrgRiskYearlyData[]
  risk_categories: OrgRiskCategory[]
}

export interface OrgRiskYearlyData {
  year: number
  workforce_risk: WorkforceRisk
  equipment_risk: EquipmentRisk
  environment_risk: EnvironmentRisk
  total_risk_score: number
}

export interface WorkforceRisk {
  employee_turnover_rate: number
  absenteeism_rate: number
  training_hours_per_employee: number
  risk_score: number
}

export interface EquipmentRisk {
  equipment_age_average: number
  maintenance_frequency: number
  breakdown_incidents: number
  risk_score: number
}

export interface EnvironmentRisk {
  safety_incidents: number
  environmental_violations: number
  workplace_accidents: number
  risk_score: number
}

export interface OrgRiskCategory {
  category: 'workforce' | 'equipment' | 'environment'
  weight: number
  score: number
}

// Zone 10: Health & Insurance Risk
export interface Zone10Data {
  years: HealthInsuranceYearlyData[]
  total_premium_collected: number
  total_claims_paid: number
}

export interface HealthInsuranceYearlyData {
  year: number
  premium_collected: number
  claims_paid: number
  claims_ratio: number // claims_paid / premium_collected
  reserves: number
  capital_requirement: number
}

// ============================================
// EXTRACTED & VALIDATED DATA
// ============================================

export interface ExtractedData {
  id: string
  job_id: string
  zone_number: ZoneNumber
  zone_name: string
  extraction_mode: ExtractionMode
  raw_data: ZoneDataUnion
  confidence_score: number
  source_file_id: string | null
  extraction_method: string | null
  created_at: string
}

export interface ValidatedData {
  id: string
  job_id: string
  zone_number: ZoneNumber
  zone_name: string
  validated_data: ZoneDataUnion
  user_modifications: any | null
  was_modified: boolean
  validated_at: string
  validated_by: string
  extracted_data_id: string | null
}

// Union type pour toutes les données de zones
export type ZoneDataUnion =
  | Zone1Data
  | Zone2Data
  | Zone3Data
  | Zone4Data
  | Zone5Data
  | Zone6Data
  | Zone7Data
  | Zone8Data
  | Zone9Data
  | Zone10Data

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// POST /api/datascanner/upload
export interface UploadRequest {
  company_name?: string
}

export interface UploadResponse {
  job_id: string
  upload_url: string // Presigned URL Supabase Storage
}

// GET /api/datascanner/jobs/:jobId
export interface GetJobResponse {
  job: ExtractionJob
  files: UploadedFile[]
  progress: ZoneProgress
}

// POST /api/datascanner/jobs/:jobId/start
export interface StartJobResponse {
  job_id: string
  status: ExtractionJobStatus
  message: string
}

// GET /api/datascanner/jobs/:jobId/zones/:zoneId
export interface GetZoneResponse {
  zone_number: ZoneNumber
  zone_name: string
  choice: ZoneChoice | null
  extracted_data: ExtractedData | null
  validated_data: ValidatedData | null
  status: 'pending' | 'awaiting_choice' | 'extracting' | 'awaiting_validation' | 'completed'
}

// POST /api/datascanner/jobs/:jobId/zones/:zoneId/choose
export interface ChooseZoneModeRequest {
  mode: ExtractionMode // 'extract' or 'calculate'
}

export interface ChooseZoneModeResponse {
  zone_number: ZoneNumber
  mode: ExtractionMode
  message: string
}

// POST /api/datascanner/jobs/:jobId/zones/:zoneId/validate
export interface ValidateZoneRequest {
  validated_data: ZoneDataUnion
  modifications?: any
}

export interface ValidateZoneResponse {
  validation_id: string
  zone_number: ZoneNumber
  message: string
}

// POST /api/datascanner/inject
export interface InjectToPerformancePlanRequest {
  job_id: string
  zones_to_inject: ZoneNumber[] // Par défaut toutes les zones validées
}

export interface InjectToPerformancePlanResponse {
  injection_id: string
  status: InjectionStatus
  injected_zones: ZoneNumber[]
  performance_plan_id: string | null
  message: string
}

// ============================================
// WEBSOCKET EVENTS
// ============================================

export interface WebSocketEvent {
  type: WebSocketEventType
  payload: any
}

export enum WebSocketEventType {
  JOB_STATUS_UPDATE = 'job_status_update',
  FILE_PROCESSING_UPDATE = 'file_processing_update',
  ZONE_PROGRESS_UPDATE = 'zone_progress_update',
  ZONE_EXTRACTION_COMPLETE = 'zone_extraction_complete',
  ZONE_CALCULATION_COMPLETE = 'zone_calculation_complete',
  ERROR = 'error'
}

export interface JobStatusUpdateEvent {
  job_id: string
  status: ExtractionJobStatus
  progress: ZoneProgress
}

export interface FileProcessingUpdateEvent {
  job_id: string
  file_id: string
  filename: string
  status: FileStatus
  progress: number // 0-100
}

export interface ZoneProgressUpdateEvent {
  job_id: string
  zone_number: ZoneNumber
  progress: number // 0-100
  current_step: string
}

export interface ZoneExtractionCompleteEvent {
  job_id: string
  zone_number: ZoneNumber
  extracted_data: ExtractedData
}

// ============================================
// UTILITY TYPES
// ============================================

export interface ApiError {
  error: string
  message: string
  details?: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// Helper type: Get data type for a specific zone
export type ZoneDataType<T extends ZoneNumber> =
  T extends ZoneNumber.ZONE_1 ? Zone1Data :
  T extends ZoneNumber.ZONE_2 ? Zone2Data :
  T extends ZoneNumber.ZONE_3 ? Zone3Data :
  T extends ZoneNumber.ZONE_4 ? Zone4Data :
  T extends ZoneNumber.ZONE_5 ? Zone5Data :
  T extends ZoneNumber.ZONE_6 ? Zone6Data :
  T extends ZoneNumber.ZONE_7 ? Zone7Data :
  T extends ZoneNumber.ZONE_8 ? Zone8Data :
  T extends ZoneNumber.ZONE_9 ? Zone9Data :
  T extends ZoneNumber.ZONE_10 ? Zone10Data :
  never

// Zone metadata
export interface ZoneMetadata {
  number: ZoneNumber
  name: string
  description: string
  supports_extraction: boolean
  supports_calculation: boolean
  requires_formulas: boolean
}

export const ZONE_METADATA: Record<ZoneNumber, ZoneMetadata> = {
  [ZoneNumber.ZONE_1]: {
    number: ZoneNumber.ZONE_1,
    name: 'Business Lines',
    description: 'Lignes d\'activités (8 catégories)',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: false
  },
  [ZoneNumber.ZONE_2]: {
    number: ZoneNumber.ZONE_2,
    name: 'Working Hours per Employee',
    description: 'Nombre d\'heures annuelles travaillées par employé',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  },
  [ZoneNumber.ZONE_3]: {
    number: ZoneNumber.ZONE_3,
    name: 'Revenue & Expenses',
    description: 'Chiffres d\'affaires et charges (5 dernières années)',
    supports_extraction: true,
    supports_calculation: false,
    requires_formulas: false
  },
  [ZoneNumber.ZONE_4]: {
    number: ZoneNumber.ZONE_4,
    name: 'Unexpected Loss (UL) Data',
    description: 'Données de pertes inattendues',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  },
  [ZoneNumber.ZONE_5]: {
    number: ZoneNumber.ZONE_5,
    name: 'Operational Risk',
    description: 'Risque opérationnel (Basel II QIS 2)',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  },
  [ZoneNumber.ZONE_6]: {
    number: ZoneNumber.ZONE_6,
    name: 'Credit Counterparty Risk',
    description: 'Risque de contrepartie de crédit',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  },
  [ZoneNumber.ZONE_7]: {
    number: ZoneNumber.ZONE_7,
    name: 'Market Risk',
    description: 'Risque de marché (erreurs de règlement)',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  },
  [ZoneNumber.ZONE_8]: {
    number: ZoneNumber.ZONE_8,
    name: 'Liquidity & Transformation Risk',
    description: 'Risque de liquidité et de transformation',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  },
  [ZoneNumber.ZONE_9]: {
    number: ZoneNumber.ZONE_9,
    name: 'Organizational Risk',
    description: 'Risque organisationnel (Personnel, Équipement, Environnement)',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  },
  [ZoneNumber.ZONE_10]: {
    number: ZoneNumber.ZONE_10,
    name: 'Health & Insurance Risk',
    description: 'Risque Santé et Assurance',
    supports_extraction: true,
    supports_calculation: true,
    requires_formulas: true
  }
}
