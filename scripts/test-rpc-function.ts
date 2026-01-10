/**
 * TEST SCRIPT - Vérifier si get_my_role() existe dans Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CEO_EMAIL = 'ceo9@gmail.com';
const CEO_PASSWORD = 'abc123';

async function testRPCFunction() {
  console.log('🔍 TESTING RPC FUNCTION get_my_role()\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as CEO
    console.log('\n📋 Step 1: Logging in as CEO...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: CEO_EMAIL,
      password: CEO_PASSWORD,
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      throw authError;
    }

    console.log('✅ Logged in as:', authData.user.email);
    console.log('   User ID:', authData.user.id);

    // Step 2: Test RPC function
    console.log('\n📋 Step 2: Calling RPC function get_my_role()...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_role');

    if (rpcError) {
      console.error('❌ RPC ERROR:');
      console.error('   Message:', rpcError.message);
      console.error('   Code:', rpcError.code);
      console.error('   Details:', rpcError.details);
      console.error('   Hint:', rpcError.hint);
      console.error('\n💡 This means the function does NOT exist or has an error!');
    } else {
      console.log('✅ RPC SUCCESS:');
      console.log('   Role:', rpcData);
    }

    // Step 3: Fallback - Direct query
    console.log('\n📋 Step 3: Testing direct query to user_roles...');
    const { data: queryData, error: queryError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (queryError) {
      console.error('❌ DIRECT QUERY ERROR:');
      console.error('   Message:', queryError.message);
      console.error('   Code:', queryError.code);
      console.error('   Details:', queryError.details);
      console.error('\n💡 This means RLS permissions are blocking the query!');
    } else {
      console.log('✅ DIRECT QUERY SUCCESS:');
      console.log('   Role:', queryData?.role || 'NULL (no role found)');
    }

    // Step 4: Check if role exists in database (using service role)
    console.log('\n📋 Step 4: Checking if CEO role exists in database...');
    console.log('   (This requires service role key)');

    console.log('\n' + '='.repeat(60));
    console.log('🎯 SUMMARY:');
    console.log('   RPC function:', rpcError ? '❌ FAILED' : '✅ WORKS');
    console.log('   Direct query:', queryError ? '❌ FAILED' : '✅ WORKS');
    console.log('   Role value:', rpcData || queryData?.role || 'NULL');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  }
}

testRPCFunction();
