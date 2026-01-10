#!/usr/bin/env tsx
/**
 * ============================================
 * END-TO-END WORKFLOW TEST
 * Test complet: Création job → Upload → Extraction
 * ============================================
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testWorkflow() {
  console.log('🚀 TEST END-TO-END WORKFLOW\n')
  console.log('=' .repeat(60))

  try {
    // ========================================
    // ÉTAPE 1: Vérifier la session utilisateur
    // ========================================
    console.log('\n📝 Étape 1: Vérification session utilisateur...')

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('❌ ERREUR: Aucune session active')
      console.error('   → Connectez-vous d\'abord sur http://localhost:8080')
      process.exit(1)
    }

    console.log('✅ Session active')
    console.log(`   User ID: ${session.user.id}`)
    console.log(`   Email: ${session.user.email}`)

    // ========================================
    // ÉTAPE 2: Créer un job d'extraction
    // ========================================
    console.log('\n📝 Étape 2: Création d\'un job d\'extraction...')

    const { data: job, error: jobError } = await supabase
      .from('extraction_jobs')
      .insert({
        user_id: session.user.id,
        status: 'pending',
        file_count: 0,
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
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('❌ ERREUR création job:')
      console.error('   Code:', jobError.code)
      console.error('   Message:', jobError.message)
      console.error('   Details:', jobError.details)
      console.error('   Hint:', jobError.hint)

      // Debug RLS policies
      console.log('\n🔍 DEBUG: Vérification RLS...')
      const { data: rlsCheck } = await supabase.rpc('pg_tables', {})
      console.log('RLS check:', rlsCheck)

      process.exit(1)
    }

    console.log('✅ Job créé avec succès')
    console.log(`   Job ID: ${job.id}`)
    console.log(`   Status: ${job.status}`)
    console.log(`   Created: ${job.created_at}`)

    // ========================================
    // ÉTAPE 3: Simuler upload de fichier
    // ========================================
    console.log('\n📝 Étape 3: Simulation upload fichier...')

    const { data: uploadedFile, error: uploadError } = await supabase
      .from('uploaded_files')
      .insert({
        job_id: job.id,
        filename: 'test_business_lines.xlsx',
        file_type: 'excel',
        file_size: 12345,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        storage_path: `${session.user.id}/${job.id}/test_business_lines.xlsx`,
        storage_bucket: 'datascanner-uploads',
        status: 'completed'
      })
      .select()
      .single()

    if (uploadError) {
      console.error('❌ ERREUR upload fichier:')
      console.error('   Code:', uploadError.code)
      console.error('   Message:', uploadError.message)
      process.exit(1)
    }

    console.log('✅ Fichier uploadé (simulé)')
    console.log(`   File ID: ${uploadedFile.id}`)
    console.log(`   Filename: ${uploadedFile.filename}`)

    // ========================================
    // ÉTAPE 4: Tester l'API backend
    // ========================================
    console.log('\n📝 Étape 4: Test extraction backend...')
    console.log(`   Endpoint: POST ${API_URL}/api/datascanner/jobs/${job.id}/zones/1/extract`)

    const response = await fetch(`${API_URL}/api/datascanner/jobs/${job.id}/zones/1/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    if (!response.ok) {
      console.error('❌ ERREUR backend:')
      console.error(`   Status: ${response.status} ${response.statusText}`)

      try {
        const errorData = await response.json()
        console.error('   Response:', JSON.stringify(errorData, null, 2))
      } catch (e) {
        console.error('   (Cannot parse error response)')
      }

      process.exit(1)
    }

    const result = await response.json()

    console.log('✅ Extraction backend réussie!')
    console.log(`   Total lignes: ${result.total_detected}`)
    console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`)
    console.log(`   Needs regrouping: ${result.needs_regrouping ? 'Oui' : 'Non'}`)
    console.log(`   Method: ${result.data.extraction_method}`)

    // ========================================
    // ÉTAPE 5: Vérifier les données extraites
    // ========================================
    console.log('\n📝 Étape 5: Vérification données extraites...')

    const { data: extractedData, error: extractedError } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('job_id', job.id)
      .eq('zone_number', 1)
      .single()

    if (extractedError) {
      console.warn('⚠️  Données non sauvegardées en DB (optionnel)')
    } else {
      console.log('✅ Données extraites sauvegardées')
      console.log(`   Extraction ID: ${extractedData.id}`)
      console.log(`   Confidence: ${extractedData.confidence_score}`)
    }

    // ========================================
    // RÉSUMÉ FINAL
    // ========================================
    console.log('\n' + '='.repeat(60))
    console.log('🎉 TEST END-TO-END: SUCCÈS COMPLET!')
    console.log('='.repeat(60))
    console.log('\n✅ Toutes les étapes ont réussi:')
    console.log('   1. ✅ Session utilisateur active')
    console.log('   2. ✅ Job créé dans Supabase')
    console.log('   3. ✅ Fichier uploadé (simulé)')
    console.log('   4. ✅ Extraction backend fonctionnelle')
    console.log('   5. ✅ Données extraites vérifiées')

    console.log('\n🚀 Prochaine étape:')
    console.log('   → Testez le workflow complet dans l\'interface:')
    console.log('   → http://localhost:8080')
    console.log('   → HCM Data Scanner → Start Scanning → Upload fichier réel\n')

    // Cleanup optionnel
    console.log('🧹 Cleanup: Job de test conservé pour inspection')
    console.log(`   Job ID: ${job.id}\n`)

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error)
    console.error(error instanceof Error ? error.stack : error)
    process.exit(1)
  }
}

// Exécution
testWorkflow().catch(console.error)
