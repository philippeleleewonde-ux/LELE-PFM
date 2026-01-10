/**
 * Script d'urgence pour corriger le rôle CEO
 * Applique la migration self-healing directement à Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCEORole() {
  console.log('🔧 Fixing CEO role...\n');
  console.log('⚠️  Note: The SQL function get_my_role() must be created manually via Supabase Dashboard SQL Editor.');
  console.log('    Migration file: supabase/migrations/20251201_self_healing_role.sql\n');

  try {

    // 2. Fix the CEO user data directly
    console.log('👤 Fixing CEO user (ceo9@gmail.com)...');

    // Get CEO user ID
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error listing users:', usersError);
      throw usersError;
    }

    const ceoUser = users.users.find(u => u.email === 'ceo9@gmail.com');

    if (!ceoUser) {
      console.error('❌ CEO user not found in auth.users');
      process.exit(1);
    }

    console.log(`✅ Found CEO user: ${ceoUser.id}\n`);

    // Insert/Update role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: ceoUser.id,
        role: 'CEO'
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      console.error('❌ Error setting CEO role:', roleError);
      throw roleError;
    }

    console.log('✅ CEO role assigned successfully\n');

    // 3. Verify
    const { data: roleData, error: verifyError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', ceoUser.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying role:', verifyError);
      throw verifyError;
    }

    console.log(`✅ Verification: Role = ${roleData.role}\n`);
    console.log('🎉 SUCCESS! CEO role fixed. Please refresh your browser.\n');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

fixCEORole();
