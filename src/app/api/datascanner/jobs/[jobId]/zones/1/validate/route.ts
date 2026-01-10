// ============================================
// API ROUTE: POST /api/datascanner/jobs/[jobId]/zones/1/validate
// Valide les Business Lines après modifications utilisateur
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ZoneNumber } from '@/types/datascanner-v2'
import { validateExactly8Lines } from '@/lib/datascanner-v2/services/zone1/BusinessLinesExtractor'
import type { BusinessLine, Zone1Data } from '@/types/datascanner-v2'

// Supabase client (avec service role pour bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Body de la requête
 */
interface ValidateRequestBody {
  business_lines: BusinessLine[] // Les 8 business lines validées par l'utilisateur
  user_notes?: string // Notes optionnelles de l'utilisateur
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    const body = await request.json() as ValidateRequestBody

    // Valider le body
    if (!body.business_lines || !Array.isArray(body.business_lines)) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'business_lines array is required' },
        { status: 400 }
      )
    }

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

    // Valider qu'on a exactement 8 lignes
    const validation = validateExactly8Lines(body.business_lines)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', message: validation.error },
        { status: 400 }
      )
    }

    // Récupérer les données extraites originales pour comparaison
    const { data: extractedData } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('job_id', jobId)
      .eq('zone_number', ZoneNumber.ZONE_1)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Préparer les données validées
    const validatedZone1Data: Zone1Data = {
      business_lines: body.business_lines,
      total_lines: body.business_lines.length,
      detection_method: extractedData?.raw_data?.detection_method || 'manual'
    }

    // Sauvegarder dans validated_data
    const { error: insertError } = await supabase
      .from('validated_data')
      .insert({
        job_id: jobId,
        zone_number: ZoneNumber.ZONE_1,
        zone_name: 'Business Lines',
        validated_data: validatedZone1Data,
        user_notes: body.user_notes,
        metadata: {
          original_data_id: extractedData?.id,
          validated_at: new Date().toISOString(),
          total_revenue: body.business_lines.reduce((sum, line) => sum + (line.metrics.revenue || 0), 0),
          total_expenses: body.business_lines.reduce((sum, line) => sum + (line.metrics.expenses || 0), 0),
          total_headcount: body.business_lines.reduce((sum, line) => sum + (line.metrics.headcount || 0), 0)
        }
      })

    if (insertError) {
      console.error('[API] Failed to save validated data:', insertError)
      return NextResponse.json(
        { error: 'Database error', message: insertError.message },
        { status: 500 }
      )
    }

    // Mettre à jour la progression du job (100% pour Zone 1)
    const { error: progressError } = await supabase
      .from('extraction_jobs')
      .update({
        progress: {
          ...(job.progress || {}),
          zone1: 100
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (progressError) {
      console.error('[API] Failed to update job progress:', progressError)
    }

    // Vérifier si toutes les zones sont complétées (pour mettre status = completed)
    const progress = {
      ...(job.progress || {}),
      zone1: 100
    }

    // Pour l'instant, seulement Zone 1 est implémentée
    // TODO: Vérifier progress.zone2 à zone10 quand implémentées
    const allZonesCompleted = progress.zone1 === 100

    if (allZonesCompleted) {
      await supabase
        .from('extraction_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      }

    // Log la validation
    await supabase.from('extraction_logs').insert({
      job_id: jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'validation_completed',
      status: 'success',
      details: {
        business_lines_count: body.business_lines.length,
        total_revenue: body.business_lines.reduce((sum, line) => sum + (line.metrics.revenue || 0), 0),
        total_expenses: body.business_lines.reduce((sum, line) => sum + (line.metrics.expenses || 0), 0),
        has_user_notes: !!body.user_notes
      }
    })

    // Retourner le résultat
    return NextResponse.json({
      success: true,
      data: validatedZone1Data,
      zone_completed: true,
      job_completed: allZonesCompleted,
      message: allZonesCompleted
        ? 'Zone 1 validated successfully. All zones completed!'
        : 'Zone 1 validated successfully. Proceed to next zone.'
    })

  } catch (error) {
    console.error('[API] POST /zones/1/validate error:', error)

    // Log l'erreur
    await supabase.from('extraction_logs').insert({
      job_id: params.jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'validation_failed',
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
