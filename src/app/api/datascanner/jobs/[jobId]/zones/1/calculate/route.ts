// ============================================
// API ROUTE: POST /api/datascanner/jobs/[jobId]/zones/1/calculate
// Calcule les 8 Business Lines depuis les données comptables
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { ZoneNumber, ExtractionMode } from '@/types/datascanner-v2'
import {
  calculateBusinessLines,
  extractAccountingDataFromExcel
} from '@/lib/datascanner-v2/services/zone1/BusinessLinesCalculator'

// Supabase client (avec service role pour bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params

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

    // Récupérer les fichiers comptables uploadés
    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('job_id', jobId)
      .eq('file_type', 'excel')

    if (filesError || !files || files.length === 0) {
      return NextResponse.json(
        {
          error: 'No files found',
          message: 'No Excel files uploaded for this job. Please upload accounting files first.'
        },
        { status: 400 }
      )
    }

    // Télécharger et parser le premier fichier comptable
    // TODO: Si plusieurs fichiers, combiner les données comptables
    const file = files[0]

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(file.storage_bucket)
      .download(file.storage_path)

    if (downloadError) {
      return NextResponse.json(
        { error: 'Download failed', message: `Failed to download file: ${downloadError.message}` },
        { status: 500 }
      )
    }

    // Parser le fichier Excel
    const arrayBuffer = await fileData.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Extraire les données comptables depuis le workbook
    const accountingData = await extractAccountingDataFromExcel(
      workbook,
      job.year || new Date().getFullYear()
    )

    // Calculer les 8 business lines
    const businessLines = await calculateBusinessLines(accountingData, {
      year: job.year || new Date().getFullYear(),
      useDefaultMapping: true
    })

    // Sauvegarder le choix utilisateur (calculate) dans zone_choices
    const { error: choiceError } = await supabase
      .from('zone_choices')
      .upsert({
        job_id: jobId,
        zone_number: ZoneNumber.ZONE_1,
        user_choice: ExtractionMode.CALCULATE,
        can_extract: false,
        can_calculate: true,
        chosen_at: new Date().toISOString()
      })

    if (choiceError) {
      console.error('[API] Failed to save user choice:', choiceError)
    }

    // Sauvegarder les données calculées dans extracted_data
    const { error: insertError } = await supabase
      .from('extracted_data')
      .insert({
        job_id: jobId,
        zone_number: ZoneNumber.ZONE_1,
        zone_name: 'Business Lines',
        extraction_mode: ExtractionMode.CALCULATE,
        raw_data: {
          business_lines: businessLines,
          total_lines: businessLines.length,
          detection_method: 'calculation'
        },
        confidence_score: 0.8, // Calcul = confidence plus faible qu'extraction directe
        needs_review: false, // Toujours 8 lignes, pas de regroupement nécessaire
        metadata: {
          total_accounting_categories: accountingData.categories.length,
          total_revenue: accountingData.totalRevenue,
          total_expenses: accountingData.totalExpenses,
          year: accountingData.year,
          source_files: [file.filename]
        }
      })

    if (insertError) {
      console.error('[API] Failed to save calculated data:', insertError)
      return NextResponse.json(
        { error: 'Database error', message: insertError.message },
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

    // Log le calcul
    await supabase.from('extraction_logs').insert({
      job_id: jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'calculation_completed',
      status: 'success',
      details: {
        business_lines_count: businessLines.length,
        accounting_categories: accountingData.categories.length,
        total_revenue: accountingData.totalRevenue,
        total_expenses: accountingData.totalExpenses
      }
    })

    // Retourner le résultat
    return NextResponse.json({
      success: true,
      data: {
        business_lines: businessLines,
        total_lines: businessLines.length,
        detection_method: 'calculation'
      },
      needs_regrouping: false, // Toujours 8 lignes
      message: `Successfully calculated ${businessLines.length} business lines from accounting data.`
    })

  } catch (error) {
    console.error('[API] POST /zones/1/calculate error:', error)

    // Log l'erreur
    await supabase.from('extraction_logs').insert({
      job_id: params.jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'calculation_failed',
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
