import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  // First get current user
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.error('❌ No active session. Please login first.')
    return
  }
  
  console.log('✅ Logged in as:', session.user.id)
  console.log('Email:', session.user.email)
  
  // Try to insert a job
  console.log('\n🔧 Attempting to create extraction job...')
  
  const { data: job, error } = await supabase
    .from('extraction_jobs')
    .insert({
      user_id: session.user.id,
      status: 'pending',
      file_count: 0,
      progress: { zone1: 0 }
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ INSERT FAILED:')
    console.error('Code:', error.code)
    console.error('Message:', error.message)
    console.error('Details:', error.details)
    console.error('Hint:', error.hint)
    console.error('\n📝 Full error:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ Job created successfully!')
    console.log('Job ID:', job.id)
    console.log('Data:', JSON.stringify(job, null, 2))
  }
}

testInsert().catch(console.error)
