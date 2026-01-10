// ============================================
// API ROUTE: POST /api/datascanner/jobs/[jobId]/zones/1/regroup
// Regroupe intelligemment N business lines en 8 avec Gemini 1.5 Flash
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ZoneNumber } from '@/types/datascanner-v2'
import { regroupBusinessLines } from '@/lib/datascanner-v2/services/zone1/BusinessLinesRegrouper'
import type { BusinessLine } from '@/types/datascanner-v2'

// Supabase client (avec service role pour bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Body de la requête
 */
interface RegroupRequestBody {
  use_llm?: boolean // Utiliser Gemini pour regroupement intelligent (défaut: true)
  llm_provider?: 'gemini' | 'openai' // Provider LLM (défaut: gemini)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    const body = await request.json() as RegroupRequestBody

    // Vérifier que le job existe
    const { data: job, error: jobError } = await supabase
      .from('extraction_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found', message: `No job found with id ${jobId}` },
        { status: 404 }
      )
    }

    // Récupérer les données extraites (extracted_data)
    const { data: extractedData, error: extractedError } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('job_id', jobId)
      .eq('zone_number', ZoneNumber.ZONE_1)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (extractedError || !extractedData) {
      return NextResponse.json(
        {
          error: 'No extracted data found',
          message: 'Please run extraction first before regrouping.'
        },
        { status: 400 }
      )
    }

    // Extraire les business lines depuis raw_data
    const businessLines = extractedData.raw_data?.business_lines as BusinessLine[] | undefined

    if (!businessLines || businessLines.length === 0) {
      return NextResponse.json(
        { error: 'No business lines found', message: 'No business lines in extracted data.' },
        { status: 400 }
      )
    }

    // Vérifier si regroupement nécessaire
    if (businessLines.length <= 8) {
      return NextResponse.json(
        {
          error: 'Regrouping not needed',
          message: `Only ${businessLines.length} business lines detected. No regrouping required.`
        },
        { status: 400 }
      )
    }

    // Appeler le service de regroupement
    const useLLM = body.use_llm !== false // Défaut: true
    const llmProvider = body.llm_provider || 'gemini' // Défaut: Gemini

    const regroupementResult = await regroupBusinessLines(businessLines, {
      targetCount: 8,
      useLLM,
      llmProvider,
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      preserveMetrics: true
    })

    // Mettre à jour extracted_data avec les données regroupées
    const { error: updateError } = await supabase
      .from('extracted_data')
      .update({
        raw_data: {
          business_lines: regroupementResult.groupedLines,
          total_lines: regroupementResult.groupedLines.length,
          detection_method: regroupementResult.method,
          regrouping_mapping: regroupementResult.mapping
        },
        confidence_score: regroupementResult.confidence,
        needs_review: false, // Plus besoin de review après regroupement
        metadata: {
          ...extractedData.metadata,
          regrouping_method: regroupementResult.method,
          original_lines_count: businessLines.length,
          regrouped_at: new Date().toISOString()
        }
      })
      .eq('id', extractedData.id)

    if (updateError) {
      console.error('[API] Failed to update extracted data:', updateError)
      return NextResponse.json(
        { error: 'Database error', message: updateError.message },
        { status: 500 }
      )
    }

    // Mettre à jour la progression du job (80% - prêt pour validation)
    const { error: progressError } = await supabase
      .from('extraction_jobs')
      .update({
        progress: {
          ...(job.progress || {}),
          zone1: 80
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (progressError) {
      console.error('[API] Failed to update job progress:', progressError)
    }

    // Log le regroupement
    await supabase.from('extraction_logs').insert({
      job_id: jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'regrouping_completed',
      status: 'success',
      details: {
        original_count: businessLines.length,
        grouped_count: regroupementResult.groupedLines.length,
        method: regroupementResult.method,
        confidence: regroupementResult.confidence,
        llm_provider: llmProvider
      }
    })

    // Retourner le résultat
    return NextResponse.json({
      success: true,
      data: {
        business_lines: regroupementResult.groupedLines,
        total_lines: regroupementResult.groupedLines.length,
        detection_method: regroupementResult.method,
        mapping: regroupementResult.mapping
      },
      method: regroupementResult.method,
      confidence: regroupementResult.confidence,
      original_count: businessLines.length,
      message: `Successfully regrouped ${businessLines.length} lines into ${regroupementResult.groupedLines.length} using ${regroupementResult.method}.`
    })

  } catch (error) {
    console.error('[API] POST /zones/1/regroup error:', error)

    // Log l'erreur
    await supabase.from('extraction_logs').insert({
      job_id: params.jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'regrouping_failed',
      status: 'error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
