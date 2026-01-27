// ============================================
// API ROUTE: GET /api/datascanner/jobs/[jobId]/zones/1
// Retourne le statut actuel de la Zone 1 (Business Lines)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GetZoneResponse, ZoneNumber } from '@/types/datascanner-v2'

// Supabase client (avec service role pour bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
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

    // Récupérer le choix utilisateur (extract vs calculate)
    const { data: choice } = await supabase
      .from('zone_choices')
      .select('*')
      .eq('job_id', jobId)
      .eq('zone_number', ZoneNumber.ZONE_1)
      .single()

    // Récupérer les données extraites (si elles existent)
    const { data: extractedData } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('job_id', jobId)
      .eq('zone_number', ZoneNumber.ZONE_1)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Récupérer les données validées (si elles existent)
    const { data: validatedData } = await supabase
      .from('validated_data')
      .select('*')
      .eq('job_id', jobId)
      .eq('zone_number', ZoneNumber.ZONE_1)
      .single()

    // Déterminer le statut actuel
    let status: 'pending' | 'awaiting_choice' | 'extracting' | 'awaiting_validation' | 'completed'

    if (validatedData) {
      status = 'completed'
    } else if (extractedData && !validatedData) {
      status = 'awaiting_validation'
    } else if (choice?.user_choice && !extractedData) {
      status = 'extracting'
    } else if (choice && !choice.user_choice) {
      status = 'awaiting_choice'
    } else {
      status = 'pending'
    }

    const response: GetZoneResponse = {
      zone_number: ZoneNumber.ZONE_1,
      zone_name: 'Business Lines',
      choice: choice || null,
      extracted_data: extractedData || null,
      validated_data: validatedData || null,
      status
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[API] GET /zones/1 error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
