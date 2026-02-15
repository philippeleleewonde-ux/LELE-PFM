// ============================================
// DATA INJECTOR SERVICE
// Injecte les données validées des 3 zones dans le FormData du Module 1
// ============================================

import { supabase } from '@/integrations/supabase/client'
import type { FormData, BusinessLine as M1BusinessLine, FinancialData } from '@/modules/module1/types'

interface InjectionResult {
  success: boolean
  performancePlanId?: string
  error?: string
  injectedZones: number[]
}

interface Zone1ValidatedData {
  business_lines: Array<{
    name: string
    category: string
    year: number
    metrics: {
      revenue?: number
      expenses?: number
      headcount?: number
      team_count?: number
      budget?: number
    }
    confidence: number
    // Legacy fields from validation table
    revenue_n?: number
    headcount_n?: number
    team_count?: number
    budget?: number
  }>
}

interface Zone2ValidatedData {
  annualHoursPerPerson: number
  financialYears: Array<{
    year: number
    yearLabel: string
    sales: number
    spending: number
    confidence: number
  }>
  currency: string
}

interface Zone3ValidatedData {
  totalUL: number
  yearsOfCollection: number
  riskCategories: {
    operationalRisk: number
    creditRisk: number
    marketRisk: number
    liquidityRisk: number
    reputationalRisk: number
    strategicRisk: number
  }
}

export const DataInjectorService = {

  /**
   * Inject validated data from all 3 zones into Module 1's Performance Plan
   */
  async injectIntoPerformancePlan(jobId: string, userId: string): Promise<InjectionResult> {
    try {
      console.log(`[Injector] Starting injection for job ${jobId}`)

      // 1. Load validated data for all 3 zones
      const { data: validatedRecords, error: loadError } = await supabase
        .from('validated_data')
        .select('*')
        .eq('job_id', jobId)
        .in('zone_number', [1, 2, 3])
        .order('zone_number')

      if (loadError) {
        throw new Error(`Failed to load validated data: ${loadError.message}`)
      }

      if (!validatedRecords || validatedRecords.length === 0) {
        throw new Error('No validated data found for this job')
      }

      const zone1Data = validatedRecords.find(r => r.zone_number === 1)?.validated_data as Zone1ValidatedData | undefined
      const zone2Data = validatedRecords.find(r => r.zone_number === 2)?.validated_data as Zone2ValidatedData | undefined
      const zone3Data = validatedRecords.find(r => r.zone_number === 3)?.validated_data as Zone3ValidatedData | undefined

      const injectedZones: number[] = []

      // 2. Load existing FormData (if any) from company_performance_scores
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single()

      let existingFormData: Partial<FormData> = {}

      if (profile?.company_id) {
        const { data: scoreData } = await supabase
          .from('company_performance_scores')
          .select('factors')
          .eq('company_id', profile.company_id)
          .eq('module_number', 1)
          .order('calculation_date', { ascending: false })
          .limit(1)
          .single()

        if (scoreData?.factors) {
          existingFormData = scoreData.factors as Partial<FormData>
        }
      }

      // 3. Map Zone 1 → formData.businessLines
      let businessLines: M1BusinessLine[] = existingFormData.businessLines || []
      if (zone1Data?.business_lines) {
        businessLines = zone1Data.business_lines.map((bl, index) => ({
          id: index + 1,
          activityName: bl.name,
          staffCount: bl.metrics?.headcount || bl.headcount_n || 0,
          teamCount: bl.metrics?.team_count || bl.team_count || 0,
          budget: bl.metrics?.budget || bl.metrics?.revenue || bl.budget || bl.revenue_n || 0
        }))
        injectedZones.push(1)
      }

      // 4. Map Zone 2 → formData.employeeEngagement
      let employeeEngagement = existingFormData.employeeEngagement || {
        annualHoursPerPerson: 0,
        financialHistory: []
      }
      if (zone2Data) {
        const financialHistory: FinancialData[] = zone2Data.financialYears.map(fy => ({
          year: fy.yearLabel, // "N-1", "N-2", etc.
          sales: fy.sales,
          spending: fy.spending
        }))

        employeeEngagement = {
          annualHoursPerPerson: zone2Data.annualHoursPerPerson,
          financialHistory
        }
        injectedZones.push(2)
      }

      // 5. Map Zone 3 → formData.riskData
      let riskData = existingFormData.riskData || {
        totalUL: 0,
        yearsOfCollection: 0,
        riskCategories: {
          operationalRisk: 0,
          creditRisk: 0,
          marketRisk: 0,
          liquidityRisk: 0,
          reputationalRisk: 0,
          strategicRisk: 0
        }
      }
      if (zone3Data) {
        riskData = {
          totalUL: zone3Data.totalUL,
          yearsOfCollection: zone3Data.yearsOfCollection,
          riskCategories: {
            operationalRisk: zone3Data.riskCategories.operationalRisk,
            creditRisk: zone3Data.riskCategories.creditRisk,
            marketRisk: zone3Data.riskCategories.marketRisk,
            liquidityRisk: zone3Data.riskCategories.liquidityRisk,
            reputationalRisk: zone3Data.riskCategories.reputationalRisk,
            strategicRisk: zone3Data.riskCategories.strategicRisk
          }
        }
        injectedZones.push(3)
      }

      // 6. Build merged FormData
      const mergedFormData: any = {
        ...existingFormData,
        businessLines,
        employeeEngagement,
        riskData,
        // Metadata
        _datascannerInjection: {
          jobId,
          injectedAt: new Date().toISOString(),
          zones: injectedZones
        }
      }

      // Set defaults for required fields
      if (!mergedFormData.companyInfo) {
        mergedFormData.companyInfo = {
          email: '',
          companyName: '',
          activity: '',
          businessSector: 'No choice'
        }
      }
      if (!mergedFormData.qualitativeAssessment) {
        mergedFormData.qualitativeAssessment = {
          operationalRiskIncidents: '',
          creditRiskAssessment: '',
          marketVolatility: '',
          liquidityPosition: '',
          reputationalFactors: '',
          strategicAlignment: ''
        }
      }
      if (!mergedFormData.socioeconomicImprovement) {
        mergedFormData.socioeconomicImprovement = {
          keyArea1_workingConditions: '',
          keyArea2_workOrganization: '',
          keyArea3_communication: '',
          keyArea4_timeManagement: '',
          keyArea5_training: '',
          keyArea6_strategy: ''
        }
      }
      if (!mergedFormData.calculatedFields) {
        mergedFormData.calculatedFields = {}
      }

      // 7. Save to company_performance_scores
      let companyId = profile?.company_id

      if (!companyId) {
        // Create a company record if needed
        const slug = `datascanner-${Date.now().toString(36)}`
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: mergedFormData.companyInfo.companyName || 'DataScanner Import',
            slug,
            schema_name: `tenant_${slug.replace(/-/g, '_')}`,
            owner_user_id: userId,
            invitation_code: `DS-${Date.now().toString(36).toUpperCase()}`
          } as any)
          .select()
          .single()

        if (companyError) throw new Error(`Failed to create company: ${companyError.message}`)

        companyId = newCompany.id

        // Link company to user
        await supabase
          .from('profiles')
          .update({ company_id: companyId } as any)
          .eq('id', userId)
      }

      const { data: score, error: scoreError } = await supabase
        .from('company_performance_scores')
        .insert({
          company_id: companyId,
          module_number: 1,
          score_value: 0,
          risk_level: 'MEDIUM',
          recommended_rate: 0,
          calculation_date: new Date().toISOString(),
          factors: mergedFormData
        })
        .select()
        .single()

      if (scoreError) throw new Error(`Failed to save performance score: ${scoreError.message}`)

      // 8. Insert business lines into business_lines table
      if (businessLines.length > 0) {
        const companyIdStr = String(companyId)

        // Delete existing datascanner lines
        await supabase
          .from('business_lines')
          .delete()
          .eq('company_id', companyIdStr)
          .eq('source', 'datascanner')

        const linesToInsert = businessLines.map((line, index) => ({
          company_id: companyIdStr,
          user_id: userId,
          activity_name: line.activityName,
          staff_count: line.staffCount || 0,
          team_count: line.teamCount || 0,
          budget: line.budget || 0,
          display_order: index + 1,
          source: 'datascanner',
          is_active: true
        }))

        const { error: blError } = await supabase
          .from('business_lines')
          .insert(linesToInsert as any)

        if (blError) {
          console.error('[Injector] Error inserting business lines:', blError)
        }
      }

      // 9. Log injection
      try {
        await supabase.from('performance_plan_injections' as any).insert({
          job_id: jobId,
          user_id: userId,
          company_id: companyId,
          injected_zones: injectedZones,
          performance_score_id: score.id,
          injected_at: new Date().toISOString()
        })
      } catch {
        // Table might not exist yet, non-blocking
        console.log('[Injector] performance_plan_injections table not found, skipping log')
      }

      console.log(`[Injector] Injection complete. Zones: ${injectedZones.join(', ')}`)

      return {
        success: true,
        performancePlanId: score.id,
        injectedZones
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Injector] Error:', message)
      return {
        success: false,
        error: message,
        injectedZones: []
      }
    }
  }
}
