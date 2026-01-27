
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars from root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

console.log('🚀 Starting Emergency Fix...');
console.log('🔗 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixData() {
    const email = 'ceo9@gmail.com';
    console.log(`🔧 Fixing data for ${email}...`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('❌ Error listing users:', userError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('❌ User not found!');
        return;
    }
    console.log('✅ Found user:', user.id);

    // 2. Fix Profile
    // We use admin mode (service role) so we bypass RLS
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

    let companyId;

    if (!profiles || profiles.length === 0) {
        console.log('⚠️ No profile found. Creating one...');

        // Get a company
        const { data: companies } = await supabase.from('companies').select('id').limit(1);
        if (companies && companies.length > 0) {
            companyId = companies[0].id;
        } else {
            // Create company
            const { data: newCompany } = await supabase.from('companies').insert({
                name: 'LELE HCM Default',
                slug: 'lele-hcm-default'
            }).select().single();
            companyId = newCompany.id;
        }

        await supabase.from('profiles').insert({
            id: user.id,
            email: email,
            first_name: 'CEO',
            last_name: 'User',
            company_id: companyId
        });
        console.log('✅ Profile created.');
    } else {
        console.log('✅ Profile exists.');
        companyId = profiles[0].company_id;
    }

    // 3. Fix Role
    const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

    if (!roles || roles.length === 0) {
        console.log('⚠️ No role found. Inserting CEO role...');
        const { error: insertError } = await supabase.from('user_roles').insert({
            user_id: user.id,
            role: 'CEO'
        });
        if (insertError) console.error('❌ Error inserting role:', insertError);
        else console.log('✅ Role inserted.');
    } else {
        console.log('✅ Role exists:', roles[0].role);
        if (roles[0].role !== 'CEO') {
            console.log('⚠️ Role is not CEO. Updating...');
            await supabase.from('user_roles').update({ role: 'CEO' }).eq('user_id', user.id);
            console.log('✅ Role updated.');
        }
    }
}

fixData().catch(console.error);
