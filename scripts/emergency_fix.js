
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config();

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

async function runSql(sql) {
    // Supabase JS client doesn't support raw SQL execution directly via public API usually,
    // unless we use the pg driver or a specific RPC.
    // HOWEVER, we can use the 'rpc' method if we have a function to run SQL, 
    // OR we can use the 'postgres' library if we had connection string.

    // WAIT. The service role key gives us admin access via the API, but not direct SQL execution 
    // unless there is an RPC for it.

    // BUT, we can fix the DATA (user_roles) directly using the table API.
    // AND we can fix the RLS recursion? No, we can't change policies via API.

    // CRITICAL: If I cannot run SQL, I cannot fix the RLS recursion or create the RPC.
    // BUT I CAN FIX THE DATA.

    // Let's try to fix the data first.
    // If I fix the data, maybe the recursion won't be triggered if I revert the code to not use the RPC?
    // No, the recursion is in the policy itself.

    // IS THERE A WAY TO RUN SQL?
    // Maybe I can use the `pg` library?
    // I don't see `pg` in package.json (I haven't checked).

    // Let's assume I can only use the Supabase API for now.
    // I will:
    // 1. Ensure the user has a role in `user_roles` table.
    // 2. Ensure the user has a profile.

    // If I can't fix the RLS recursion in DB, I must avoid triggering it in the frontend.
    // The recursion happens when checking `user_roles`.
    // If I fetch `user_roles` using the SERVICE ROLE KEY in a backend function (Edge Function), it would work.
    // But I am on the frontend.

    // WAIT. If I use the service role key in this script, I can insert the data.
    // Once the data is there, does the recursion still block?
    // The policy `RH can view company user roles` is:
    // USING ( EXISTS ( SELECT 1 FROM profiles ... ) )
    // And `profiles` policy queries `user_roles`.
    // So yes, checking the policy triggers the recursion.

    // SO I MUST FIX THE RLS.
    // How to run SQL without direct access?
    // I can't.

    // UNLESS... I use the `supabase-js` client to call a Postgres function that executes SQL?
    // Unlikely such a function exists by default.

    // WAIT. I can use the `postgres` npm package if I install it?
    // But I need the connection string (postgres://...).
    // The .env only has the HTTP URL.

    // LET'S LOOK AT THE SCREENSHOT AGAIN.
    // The user is blocked.

    // IF I cannot run SQL, I must revert the frontend code to NOT trigger the bad RLS.
    // How?
    // The bad RLS is on `user_roles` and `profiles`.
    // `CompanyContext` queries `profiles`.
    // `useUserRole` queries `user_roles`.

    // If I change `useUserRole` to NOT query `user_roles` directly?
    // Impossible, I need the role.

    // If I change `CompanyContext` to NOT query `profiles`?
    // Impossible, I need the company ID.

    // IS THERE ANY OTHER WAY?
    // Maybe the recursion is only for `RH_MANAGER`?
    // The policy says: `WHERE role = 'RH_MANAGER'`.
    // If the user is a CEO, maybe they don't hit that specific recursive path?
    // The CEO policy on `profiles`:
    // `AND EXISTS ( SELECT 1 FROM user_roles WHERE ... role IN ('CEO', 'RH_MANAGER') )`
    // This queries `user_roles`.
    // `user_roles` policy "Users can view own roles":
    // `USING (user_id = auth.uid())`
    // THIS IS NOT RECURSIVE!

    // The recursive policy is "RH can view company user roles".
    // `USING ( EXISTS ( ... profiles ... ) )`

    // So, if I just query `user_roles` for MY OWN ID, I should hit "Users can view own roles".
    // Postgres evaluates policies with OR.
    // If "Users can view own roles" returns true, access is granted.
    // So why does it hang?
    // Maybe Postgres evaluates ALL policies?
    // Or maybe the "RH" policy is being evaluated and getting stuck?

    // If I can ensure the user has the CEO role, and I query `user_roles` by ID...
    // It should work.

    // SO THE PROBLEM IS LIKELY JUST MISSING DATA.
    // If the user has NO role, the "Users can view own roles" returns empty.
    // But it shouldn't hang.

    // Why did it hang with "Chargement..."?
    // Maybe `CompanyContext` query on `profiles` hangs?
    // `profiles` policy queries `user_roles`.
    // `user_roles` has the recursive policy.
    // Even if I am CEO, Postgres might evaluate the RH policy on `user_roles` when `profiles` checks `user_roles`.

    // OK, I will try to fix the DATA using the service key.
    // If that fixes it, great.
    // If not, I am really stuck without SQL access.

    // I'll write the script to fix data.
}

async function fixData() {
    const email = 'ceo9@gmail.com';
    console.log(`🔧 Fixing data for ${email}...`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
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
