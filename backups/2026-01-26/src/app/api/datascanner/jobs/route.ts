// ============================================
// API ROUTE: POST /api/datascanner/jobs
// Crée un nouveau job d'extraction
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await request.json()
    const { year, user_id } = body

    // Validation
    if (!year || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: year, user_id' },
        { status: 400 }
      )
    }

    // Créer le job
    const { data: job, error: jobError } = await supabase
      .from('extraction_jobs')
      .insert({
        user_id,
        status: 'pending',
        year,
        progress: {
          zone1: 0,
          zone2: 0,
          zone3: 0,
          zone4: 0,
          zone5: 0,
          zone6: 0,
          zone7: 0,
          zone8: 0,
          zone9: 0,
          zone10: 0
        },
        metadata: {
          created_via: 'web_ui',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('❌ Failed to create job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      year: job.year,
      progress: job.progress,
      created_at: job.created_at
    })
  } catch (error) {
    console.error('❌ Error in POST /api/datascanner/jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      )
    }

    // Récupérer tous les jobs de l'utilisateur
    const { data: jobs, error } = await supabase
      .from('extraction_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('❌ Error in GET /api/datascanner/jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
