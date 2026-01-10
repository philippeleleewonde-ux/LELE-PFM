/**
 * SCRIPT D'URGENCE - Restauration du rôle CEO
 *
 * Ce script :
 * 1. Diagnostique l'état actuel du rôle CEO
 * 2. Restaure le rôle CEO immédiatement
 * 3. Vérifie la fonction get_my_role() dans Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const CEO_EMAIL = 'ceo9@gmail.com';

async function main() {
  console.log('🚨 EMERGENCY CEO ROLE RESTORATION\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Find CEO user
    console.log('\n📋 Step 1: Finding CEO user...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error listing users:', usersError);
      throw usersError;
    }

    const ceoUser = users.users.find(u => u.email === CEO_EMAIL);

    if (!ceoUser) {
      console.error(`❌ CEO user (${CEO_EMAIL}) not found`);
      process.exit(1);
    }

    console.log(`✅ CEO user found: ${ceoUser.id}`);

    // Step 2: Check current role status
    console.log('\n📋 Step 2: Checking current role status...');
    const { data: currentRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', ceoUser.id)
      .maybeSingle();

    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ Error checking role:', roleError);
      throw roleError;
    }

    if (currentRole) {
      console.log(`⚠️  Current role found: ${currentRole.role}`);
      console.log(`   Created at: ${currentRole.created_at}`);
      console.log(`   Updated at: ${currentRole.updated_at || 'N/A'}`);

      if (currentRole.role === 'CEO') {
        console.log('\n✅ CEO role is already set correctly!');
        console.log('   The issue might be elsewhere. Checking RPC function...');
      } else {
        console.log(`\n⚠️  Wrong role detected: ${currentRole.role} (should be CEO)`);
      }
    } else {
      console.log('❌ NO ROLE FOUND - This is the problem!');
    }

    // Step 3: Restore CEO role using ATOMIC operation
    console.log('\n📋 Step 3: Restoring CEO role (ATOMIC UPSERT)...');
    const { error: upsertError } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: ceoUser.id,
          role: 'CEO'
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      );

    if (upsertError) {
      console.error('❌ Error upserting role:', upsertError);
      throw upsertError;
    }

    console.log('✅ CEO role restored successfully!');

    // Step 4: Verify restoration
    console.log('\n📋 Step 4: Verifying restoration...');
    const { data: verifiedRole, error: verifyError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', ceoUser.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying role:', verifyError);
      throw verifyError;
    }

    console.log(`✅ Verified role: ${verifiedRole.role}`);
    console.log(`   Created at: ${verifiedRole.created_at}`);
    console.log(`   Updated at: ${verifiedRole.updated_at || 'Just now'}`);

    // Step 5: Test the RPC function
    console.log('\n📋 Step 5: Testing get_my_role() RPC function...');
    console.log('   (This requires being authenticated as the CEO user)');
    console.log('   Skipping RPC test from service role context.');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS! CEO role has been restored.');
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Refresh your browser');
    console.log('   2. Try logging in again with ceo9@gmail.com');
    console.log('   3. If issue persists, we need to fix get_my_role() function');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  }
}

main();
