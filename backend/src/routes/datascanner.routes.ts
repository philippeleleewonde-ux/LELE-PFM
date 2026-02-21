// ============================================
// DATASCANNER ROUTES - API Endpoints
// ============================================

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authenticateUser } from '../middleware/auth.ts'
import { supabase } from '../utils/supabase.ts'
import { extractBusinessLinesFromMultipleFiles } from '../services/zone1/BusinessLinesExtractor.ts'
import { extractFinancialHistory } from '../services/zone2/FinancialHistoryExtractor.ts'
import { extractRiskData } from '../services/zone3/RiskDataExtractor.ts'
import * as XLSX from 'xlsx'
import type { ExtractRequest, ExtractResponse, ErrorResponse } from '../types/datascanner.ts'

const router = Router()

// ============================================
// ZOD SCHEMAS
// ============================================

const uuidSchema = z.string().uuid('jobId must be a valid UUID')

const extractParamsSchema = z.object({
  jobId: uuidSchema,
})

/**
 * POST /api/datascanner/jobs/:jobId/zones/1/extract
 * Extrait les business lines depuis les fichiers uploadés
 */
router.post(
  '/jobs/:jobId/zones/1/extract',
  authenticateUser,
  async (req: Request<{ jobId: string }, {}, ExtractRequest>, res: Response<ExtractResponse | ErrorResponse>) => {
    try {
      // Validate params
      const paramsResult = extractParamsSchema.safeParse(req.params)
      if (!paramsResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: paramsResult.error.issues.map(i => i.message).join(', ')
        })
        return
      }

      const { jobId } = paramsResult.data
      const userId = req.user!.id

      console.log(`\n[API] POST /zones/1/extract - Job: ${jobId}, User: ${userId}`)

      // 1. Vérifier que le job existe et appartient à l'utilisateur
      const { data: job, error: jobError } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single()

      if (jobError || !job) {
        res.status(404).json({
          error: 'Not Found',
          message: `No job found with id ${jobId} for this user`
        })
        return
      }

      // 2. Récupérer les fichiers Excel uploadés pour ce job
      const { data: files, error: filesError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('job_id', jobId)
        .in('file_type', ['excel'])

      if (filesError || !files || files.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'No Excel files found for this job. Please upload files first.'
        })
        return
      }

      console.log(`[API] Found ${files.length} Excel file(s) to process`)

      // 3. Télécharger et parser chaque fichier Excel
      const workbooks: Array<{ workbook: XLSX.WorkBook; filename: string }> = []

      for (const file of files) {
        try {
          console.log(`[API] Downloading file: ${file.filename} from ${file.storage_path}`)

          // Télécharger depuis Supabase Storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(file.storage_bucket)
            .download(file.storage_path)

          if (downloadError) {
            console.error(`[API] Failed to download ${file.filename}:`, downloadError)
            continue
          }

          // Convertir en ArrayBuffer et parser avec XLSX
          const arrayBuffer = await fileData.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })

          workbooks.push({ workbook, filename: file.filename })
          console.log(`[API] ✅ Successfully parsed ${file.filename}`)
        } catch (error) {
          console.error(`[API] Error processing file ${file.filename}:`, error)
          // Continuer avec les autres fichiers
        }
      }

      if (workbooks.length === 0) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'All files failed to parse'
        })
        return
      }

      // 4. Appeler le service d'extraction avec Gemini AI
      console.log('[API] 🚀 Starting extraction with Gemini AI...')

      const extractionResult = await extractBusinessLinesFromMultipleFiles(workbooks, {
        useGemini: true
      })

      console.log(`[API] ✅ Extraction complete: ${extractionResult.total_lines} lines detected`)

      // 5. Sauvegarder dans extracted_data (optionnel)
      try {
        await supabase.from('extracted_data').insert({
          job_id: jobId,
          zone_number: 1,
          zone_name: 'Business Lines',
          extraction_mode: 'extract',
          raw_data: extractionResult,
          confidence_score: extractionResult.confidence,
          extraction_method: extractionResult.extraction_method
        })
      } catch (error) {
        console.error('[API] Failed to save extracted_data:', error)
        // Non-bloquant
      }

      // 6. Mettre à jour le job progress
      try {
        await supabase
          .from('extraction_jobs')
          .update({
            progress: { ...job.progress, zone1: 100 },
            file_count: files.length
          })
          .eq('id', jobId)
      } catch (error) {
        console.error('[API] Failed to update job progress:', error)
      }

      // 7. Retourner le résultat
      res.status(200).json({
        success: true,
        data: extractionResult,
        total_detected: extractionResult.total_lines,
        needs_regrouping: extractionResult.needs_regrouping,
        confidence: extractionResult.confidence
      })
    } catch (error) {
      console.error('[API] Error in /zones/1/extract:', error)
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      })
    }
  }
)

/**
 * POST /api/datascanner/jobs/:jobId/zones/2/extract
 * Extrait l'historique financier depuis les fichiers uploadés
 */
router.post(
  '/jobs/:jobId/zones/2/extract',
  authenticateUser,
  async (req: Request<{ jobId: string }>, res: Response) => {
    try {
      const paramsResult = extractParamsSchema.safeParse(req.params)
      if (!paramsResult.success) {
        res.status(400).json({ error: 'Validation Error', message: paramsResult.error.issues.map(i => i.message).join(', ') })
        return
      }

      const { jobId } = paramsResult.data
      const userId = req.user!.id

      console.log(`\n[API] POST /zones/2/extract - Job: ${jobId}`)

      // Vérifier le job
      const { data: job, error: jobError } = await supabase
        .from('extraction_jobs').select('*').eq('id', jobId).eq('user_id', userId).single()

      if (jobError || !job) {
        res.status(404).json({ error: 'Not Found', message: `No job found with id ${jobId}` })
        return
      }

      // Récupérer les fichiers Excel
      const { data: files } = await supabase
        .from('uploaded_files').select('*').eq('job_id', jobId).in('file_type', ['excel'])

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Bad Request', message: 'No Excel files found for this job' })
        return
      }

      // Télécharger et parser les fichiers
      const workbooks: Array<{ workbook: XLSX.WorkBook; filename: string }> = []
      for (const file of files) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(file.storage_bucket).download(file.storage_path)
          if (downloadError) continue
          const arrayBuffer = await fileData.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          workbooks.push({ workbook, filename: file.filename })
        } catch { /* continue */ }
      }

      if (workbooks.length === 0) {
        res.status(500).json({ error: 'Internal Server Error', message: 'All files failed to parse' })
        return
      }

      // Extraire l'historique financier
      const result = await extractFinancialHistory(workbooks)

      // Sauvegarder dans extracted_data
      try {
        await supabase.from('extracted_data').insert({
          job_id: jobId, zone_number: 2, zone_name: 'Financial History',
          extraction_mode: 'extract', raw_data: result,
          confidence_score: result.confidence, extraction_method: 'keyword'
        })
      } catch { /* non-blocking */ }

      // Mettre à jour le progress
      try {
        await supabase.from('extraction_jobs')
          .update({ progress: { ...job.progress, zone2: 100 } }).eq('id', jobId)
      } catch { /* non-blocking */ }

      res.status(200).json({ success: true, data: result, confidence: result.confidence })
    } catch (error) {
      console.error('[API] Error in /zones/2/extract:', error)
      res.status(500).json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
)

/**
 * POST /api/datascanner/jobs/:jobId/zones/2/validate
 * Valide les données de Zone 2
 */
router.post(
  '/jobs/:jobId/zones/2/validate',
  authenticateUser,
  async (req: Request<{ jobId: string }>, res: Response) => {
    try {
      const paramsResult = extractParamsSchema.safeParse(req.params)
      if (!paramsResult.success) {
        res.status(400).json({ error: 'Validation Error', message: paramsResult.error.issues.map(i => i.message).join(', ') })
        return
      }

      const { jobId } = paramsResult.data
      const userId = req.user!.id

      // Vérifier le job
      const { data: job, error: jobError } = await supabase
        .from('extraction_jobs').select('*').eq('id', jobId).eq('user_id', userId).single()

      if (jobError || !job) {
        res.status(404).json({ error: 'Not Found', message: `No job found with id ${jobId}` })
        return
      }

      // Sauvegarder les données validées
      const { data: validation, error: validationError } = await supabase
        .from('validated_data').insert({
          job_id: jobId, zone_number: 2, zone_name: 'Financial History',
          validated_data: req.body.validated_data,
          user_modifications: req.body.modifications || null,
          was_modified: !!req.body.modifications,
          validated_by: userId
        }).select().single()

      if (validationError) {
        res.status(500).json({ error: 'Save Error', message: validationError.message })
        return
      }

      res.status(200).json({ success: true, validation_id: validation.id, zone_number: 2, message: 'Zone 2 validated' })
    } catch (error) {
      console.error('[API] Error in /zones/2/validate:', error)
      res.status(500).json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
)

/**
 * POST /api/datascanner/jobs/:jobId/zones/3/extract
 * Extrait les données de risque depuis les fichiers uploadés
 */
router.post(
  '/jobs/:jobId/zones/3/extract',
  authenticateUser,
  async (req: Request<{ jobId: string }>, res: Response) => {
    try {
      const paramsResult = extractParamsSchema.safeParse(req.params)
      if (!paramsResult.success) {
        res.status(400).json({ error: 'Validation Error', message: paramsResult.error.issues.map(i => i.message).join(', ') })
        return
      }

      const { jobId } = paramsResult.data
      const userId = req.user!.id

      console.log(`\n[API] POST /zones/3/extract - Job: ${jobId}`)

      // Vérifier le job
      const { data: job, error: jobError } = await supabase
        .from('extraction_jobs').select('*').eq('id', jobId).eq('user_id', userId).single()

      if (jobError || !job) {
        res.status(404).json({ error: 'Not Found', message: `No job found with id ${jobId}` })
        return
      }

      // Récupérer les fichiers
      const { data: files } = await supabase
        .from('uploaded_files').select('*').eq('job_id', jobId).in('file_type', ['excel', 'pdf'])

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Bad Request', message: 'No files found for this job' })
        return
      }

      // Télécharger et parser les fichiers Excel en workbooks
      const workbooks: Array<{ workbook: XLSX.WorkBook; filename: string }> = []
      for (const file of files) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(file.storage_bucket).download(file.storage_path)
          if (downloadError) continue

          if (file.file_type === 'excel') {
            const arrayBuffer = await fileData.arrayBuffer()
            const workbook = XLSX.read(arrayBuffer, { type: 'array' })
            workbooks.push({ workbook, filename: file.filename })
          }
        } catch { /* continue */ }
      }

      if (workbooks.length === 0) {
        res.status(500).json({ error: 'Internal Server Error', message: 'No workbooks could be parsed' })
        return
      }

      // Extraire les données de risque via RiskDataExtractor
      console.log(`[API] 🚀 Starting risk data extraction from ${workbooks.length} workbook(s)...`)
      const result = await extractRiskData(workbooks)

      // Sauvegarder dans extracted_data
      try {
        await supabase.from('extracted_data').insert({
          job_id: jobId, zone_number: 3, zone_name: 'Risk Data',
          extraction_mode: 'extract', raw_data: result,
          confidence_score: result.confidence, extraction_method: 'keyword'
        })
      } catch { /* non-blocking */ }

      // Mettre à jour le progress
      try {
        await supabase.from('extraction_jobs')
          .update({ progress: { ...job.progress, zone3: 100 } }).eq('id', jobId)
      } catch { /* non-blocking */ }

      res.status(200).json({ success: true, data: result, confidence: result.confidence })
    } catch (error) {
      console.error('[API] Error in /zones/3/extract:', error)
      res.status(500).json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
)

/**
 * POST /api/datascanner/jobs/:jobId/zones/3/validate
 * Valide les données de risque Zone 3
 */
router.post(
  '/jobs/:jobId/zones/3/validate',
  authenticateUser,
  async (req: Request<{ jobId: string }>, res: Response) => {
    try {
      const paramsResult = extractParamsSchema.safeParse(req.params)
      if (!paramsResult.success) {
        res.status(400).json({ error: 'Validation Error', message: paramsResult.error.issues.map(i => i.message).join(', ') })
        return
      }

      const { jobId } = paramsResult.data
      const userId = req.user!.id

      const { data: job, error: jobError } = await supabase
        .from('extraction_jobs').select('*').eq('id', jobId).eq('user_id', userId).single()

      if (jobError || !job) {
        res.status(404).json({ error: 'Not Found', message: `No job found with id ${jobId}` })
        return
      }

      const { data: validation, error: validationError } = await supabase
        .from('validated_data').insert({
          job_id: jobId, zone_number: 3, zone_name: 'Risk Data',
          validated_data: req.body.validated_data,
          user_modifications: req.body.modifications || null,
          was_modified: !!req.body.modifications,
          validated_by: userId
        }).select().single()

      if (validationError) {
        res.status(500).json({ error: 'Save Error', message: validationError.message })
        return
      }

      res.status(200).json({ success: true, validation_id: validation.id, zone_number: 3, message: 'Zone 3 validated' })
    } catch (error) {
      console.error('[API] Error in /zones/3/validate:', error)
      res.status(500).json({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
)

/**
 * GET /api/datascanner/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'HCM Data Scanner Backend',
    timestamp: new Date().toISOString(),
    gemini_configured: !!process.env.GEMINI_API_KEY,
    supabase_configured: !!process.env.SUPABASE_URL
  })
})

export default router
