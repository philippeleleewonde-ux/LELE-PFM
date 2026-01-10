import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkJob() {
  const jobId = '0d82bc43-aad1-4563-98c8-cf7640f584a7'
  const userId = '576321f0-6df3-4c9f-86c8-27312db4044a'
  
  console.log('🔍 Checking job in database...')
  console.log('Job ID:', jobId)
  console.log('User ID:', userId)
  
  // Check if job exists
  const { data: job, error } = await supabase
    .from('extraction_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  if (error) {
    console.error('❌ Error:', error.message)
    console.error('Details:', error)
  } else if (job) {
    console.log('✅ Job found!')
    console.log(JSON.stringify(job, null, 2))
  } else {
    console.log('❌ Job not found in database')
  }
  
  // Check all jobs for this user
  const { data: userJobs, error: userJobsError } = await supabase
    .from('extraction_jobs')
    .select('id, created_at, status, user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (userJobsError) {
    console.error('Error fetching user jobs:', userJobsError)
  } else {
    console.log('\n📋 Recent jobs for this user:')
    console.table(userJobs)
  }
}

checkJob().catch(console.error)
