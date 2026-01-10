// ============================================
// API ROUTE: POST /api/datascanner/jobs/[jobId]/zones/1/extract
// Exécute l'extraction des Business Lines depuis les fichiers uploadés
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { ZoneNumber, ExtractionMode } from '@/types/datascanner-v2'
import {
  extractBusinessLinesFromMultipleFiles,
  toZone1Data
} from '@/lib/datascanner-v2/services/zone1/BusinessLinesExtractor'

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

    // Récupérer les fichiers uploadés pour ce job
    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('job_id', jobId)
      .eq('file_type', 'excel') // Seulement Excel pour l'extraction

    if (filesError || !files || files.length === 0) {
      return NextResponse.json(
        {
          error: 'No files found',
          message: 'No Excel files uploaded for this job. Please upload files first.'
        },
        { status: 400 }
      )
    }

    // Télécharger et parser chaque fichier Excel
    const workbooks: Array<{ workbook: XLSX.WorkBook; filename: string }> = []

    for (const file of files) {
      try {
        // Télécharger depuis Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(file.storage_bucket)
          .download(file.storage_path)

        if (downloadError) {
          console.error(`[API] Failed to download file ${file.filename}:`, downloadError)
          continue
        }

        // Convertir en ArrayBuffer et parser avec XLSX
        const arrayBuffer = await fileData.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        workbooks.push({ workbook, filename: file.filename })
        } catch (error) {
        console.error(`[API] Error processing file ${file.filename}:`, error)
        // Continuer avec les autres fichiers
      }
    }

    if (workbooks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse files', message: 'All files failed to parse' },
        { status: 500 }
      )
    }

    // Appeler le service d'extraction
    const extractionResult = await extractBusinessLinesFromMultipleFiles(
      workbooks,
      {
        year: job.year || new Date().getFullYear(),
        confidenceThreshold: 0.5
      }
    )

    // Sauvegarder le choix utilisateur (extract) dans zone_choices
    const { error: choiceError } = await supabase
      .from('zone_choices')
      .upsert({
        job_id: jobId,
        zone_number: ZoneNumber.ZONE_1,
        user_choice: ExtractionMode.EXTRACT,
        can_extract: true,
        can_calculate: false,
        chosen_at: new Date().toISOString()
      })

    if (choiceError) {
      console.error('[API] Failed to save user choice:', choiceError)
    }

    // Sauvegarder les données extraites dans extracted_data
    const zone1Data = toZone1Data(extractionResult)

    const { error: insertError } = await supabase
      .from('extracted_data')
      .insert({
        job_id: jobId,
        zone_number: ZoneNumber.ZONE_1,
        zone_name: 'Business Lines',
        extraction_mode: ExtractionMode.EXTRACT,
        raw_data: zone1Data,
        confidence_score: extractionResult.metadata.confidence,
        needs_review: extractionResult.needsRegrouping, // Flag si > 8 lignes
        metadata: {
          total_detected: extractionResult.totalDetected,
          detection_method: extractionResult.metadata.detectionMethod,
          source_files: extractionResult.metadata.sourceFiles
        }
      })

    if (insertError) {
      console.error('[API] Failed to save extracted data:', insertError)
      return NextResponse.json(
        { error: 'Database error', message: insertError.message },
        { status: 500 }
      )
    }

    // Mettre à jour la progression du job
    // 50% si regroupement nécessaire, 80% si données directement validables
    const newProgress = extractionResult.needsRegrouping ? 50 : 80

    const { error: progressError } = await supabase
      .from('extraction_jobs')
      .update({
        progress: {
          ...(job.progress || {}),
          zone1: newProgress
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (progressError) {
      console.error('[API] Failed to update job progress:', progressError)
    }

    // Log l'extraction
    await supabase.from('extraction_logs').insert({
      job_id: jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'extraction_completed',
      status: 'success',
      details: {
        lines_detected: extractionResult.totalDetected,
        needs_regrouping: extractionResult.needsRegrouping,
        confidence: extractionResult.metadata.confidence
      }
    })

    // Retourner le résultat
    return NextResponse.json({
      success: true,
      data: zone1Data,
      needs_regrouping: extractionResult.needsRegrouping,
      total_detected: extractionResult.totalDetected,
      confidence: extractionResult.metadata.confidence,
      message: extractionResult.needsRegrouping
        ? `${extractionResult.totalDetected} business lines detected. Regrouping required.`
        : `${extractionResult.totalDetected} business lines detected. Ready for validation.`
    })

  } catch (error) {
    console.error('[API] POST /zones/1/extract error:', error)

    // Log l'erreur
    await supabase.from('extraction_logs').insert({
      job_id: params.jobId,
      zone_number: ZoneNumber.ZONE_1,
      action: 'extraction_failed',
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
