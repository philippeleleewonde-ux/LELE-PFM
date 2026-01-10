/**
 * SCRIPT D'URGENCE - Restauration du rôle CEO via SQL direct
 * Contourne l'Admin API qui ne fonctionne pas
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const CEO_EMAIL = 'ceo9@gmail.com';

async function main() {
  console.log('🚨 EMERGENCY CEO ROLE RESTORATION (SQL Direct)\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get CEO user ID via SQL
    console.log('\n📋 Step 1: Finding CEO user via SQL...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', CEO_EMAIL)
      .maybeSingle();

    if (usersError) {
      console.error('❌ Error querying profiles:', usersError);
      throw usersError;
    }

    if (!users) {
      // Try auth.users table via RPC
      console.log('   Not in profiles, checking auth.users via raw SQL...');
      const { data: authUser, error: authError } = await supabase.rpc('get_user_by_email', {
        target_email: CEO_EMAIL
      });

      if (authError || !authUser) {
        console.error(`❌ CEO user (${CEO_EMAIL}) not found in database`);
        console.log('\n⚠️  Creating RPC function to find user...');

        // Fallback: We know the UUID from previous session
        console.log('   Using known CEO UUID: 5f83e714-02ef-4272-a748-b2bff71d920b');
        const CEO_UUID = '5f83e714-02ef-4272-a748-b2bff71d920b';

        await restoreRole(CEO_UUID);
        return;
      }
    }

    const ceoUserId = users!.id;
    console.log(`✅ CEO user found: ${ceoUserId}`);

    await restoreRole(ceoUserId);

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  }
}

async function restoreRole(userId: string) {
  // Step 2: Check current role
  console.log('\n📋 Step 2: Checking current role...');
  const { data: currentRole, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (roleError && roleError.code !== 'PGRST116') {
    console.error('❌ Error checking role:', roleError);
    throw roleError;
  }

  if (currentRole) {
    console.log(`   Current role: ${currentRole.role}`);
    console.log(`   Created: ${currentRole.created_at}`);

    if (currentRole.role === 'CEO') {
      console.log('\n✅ CEO role already exists!');
      console.log('   The problem might be in get_my_role() function.');
      console.log('   Proceeding with verification...');
    } else {
      console.log(`\n⚠️  Wrong role: ${currentRole.role} (should be CEO)`);
    }
  } else {
    console.log('❌ NO ROLE FOUND!');
  }

  // Step 3: ATOMIC UPSERT of CEO role
  console.log('\n📋 Step 3: Restoring CEO role (ATOMIC UPSERT)...');

  const { data: upserted, error: upsertError } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: userId, role: 'CEO' },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (upsertError) {
    console.error('❌ Upsert failed:', upsertError);
    console.log('\n⚠️  Trying alternative approach with DELETE + INSERT...');

    // Fallback: Manual transaction-like approach
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      throw deleteError;
    }

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'CEO' });

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      throw insertError;
    }

    console.log('✅ Role restored via DELETE + INSERT');
  } else {
    console.log('✅ Role restored via UPSERT');
  }

  // Step 4: Verify
  console.log('\n📋 Step 4: Verifying restoration...');
  const { data: verified, error: verifyError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
    throw verifyError;
  }

  console.log(`✅ Verified: ${verified.role}`);
  console.log(`   User ID: ${verified.user_id}`);
  console.log(`   Created: ${verified.created_at}`);
  console.log(`   Updated: ${verified.updated_at || 'Just now'}`);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SUCCESS! CEO role has been restored in database.');
  console.log('\n📝 NEXT STEPS:');
  console.log('   1. Open browser: http://localhost:8080/');
  console.log('   2. Clear browser cache & cookies for localhost');
  console.log('   3. Log in with: ceo9@gmail.com');
  console.log('   4. You should now access CEO Dashboard');
  console.log('\n⚠️  IF STILL "Rôle non défini":');
  console.log('   → The get_my_role() function in Supabase is broken');
  console.log('   → We need to fix it in Supabase SQL Editor');
  console.log('='.repeat(60));
}

main();
