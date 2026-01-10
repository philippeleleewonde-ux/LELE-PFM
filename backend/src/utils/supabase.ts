// ============================================
// SUPABASE CLIENT - Backend Service Role
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid reading env vars before dotenv.config()
let supabaseInstance: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }

    // Client avec service_role pour bypass RLS
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseInstance
}

// Export a getter instead of the instance directly
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

// Helper pour vérifier qu'un job appartient à un user
export async function verifyJobOwnership(jobId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('extraction_jobs')
    .select('user_id')
    .eq('id', jobId)
    .single()

  if (error || !data) return false
  return data.user_id === userId
}
