// Supabase Edge Function: Get User Statistics
// Created: 2025-11-15
// Author: elite-saas-developer
// Purpose: Analytics endpoint to query registered user profiles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface UserStats {
  totalUsers: number
  usersByRole: Record<string, number>
  usersByCompany: Array<{ companyName: string; userCount: number }>
  recentUsers: Array<{
    fullName: string
    email: string
    role: string
    companyName: string
    createdAt: string
  }>
}

serve(async (req: Request) => {
  // CORS headers — restricted to known frontend domains
  const ALLOWED_ORIGINS = [
    'https://yhidlozgpvzsroetjxqb.supabase.co',
    'https://lele-hcm.lovable.app',
    'https://lele-hcm.vercel.app',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated and has admin/CEO role
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check user role
    const { data: userRoleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRoleData) {
      return new Response(
        JSON.stringify({ error: 'User role not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Only CEOs and RH_MANAGERs can access stats
    const allowedRoles = ['CEO', 'RH_MANAGER']
    if (!allowedRoles.includes(userRoleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user's company_id
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData?.company_id) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const userCompanyId = profileData.company_id

    // Query 1: Total users in company
    const { count: totalUsers, error: countError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', userCompanyId)

    if (countError) {
      throw countError
    }

    // Query 2: Users by role
    const { data: roleDistribution, error: roleDistError } = await supabaseClient
      .from('user_roles')
      .select('role, user_id')
      .in(
        'user_id',
        supabaseClient
          .from('profiles')
          .select('id')
          .eq('company_id', userCompanyId)
      )

    if (roleDistError) {
      throw roleDistError
    }

    const usersByRole: Record<string, number> = {}
    roleDistribution?.forEach((item) => {
      usersByRole[item.role] = (usersByRole[item.role] || 0) + 1
    })

    // Query 3: Users by company (for consultants/bankers - multi-company view)
    let usersByCompany: Array<{ companyName: string; userCount: number }> = []

    if (userRoleData.role === 'CONSULTANT' || userRoleData.role === 'BANQUIER') {
      // Get all companies they have access to
      const { data: companiesData, error: companiesError } = await supabaseClient
        .from('companies')
        .select('id, name')
        .or(`id.eq.${userCompanyId},banker_access_grants.banker_id.eq.${user.id}`)

      if (!companiesError && companiesData) {
        for (const company of companiesData) {
          const { count: companyUserCount } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

          usersByCompany.push({
            companyName: company.name || 'Unknown',
            userCount: companyUserCount || 0,
          })
        }
      }
    } else {
      // For CEO/RH_MANAGER - only their own company
      const { data: companyData } = await supabaseClient
        .from('companies')
        .select('name')
        .eq('id', userCompanyId)
        .single()

      usersByCompany = [
        {
          companyName: companyData?.name || 'Unknown',
          userCount: totalUsers || 0,
        },
      ]
    }

    // Query 4: Recent users (last 10)
    const { data: recentUsersData, error: recentError } = await supabaseClient
      .from('profiles')
      .select(`
        full_name,
        email,
        created_at,
        company_id,
        companies (name),
        user_roles (role)
      `)
      .eq('company_id', userCompanyId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      throw recentError
    }

    const recentUsers = recentUsersData?.map((user) => ({
      fullName: user.full_name || 'Unknown',
      email: user.email,
      role: user.user_roles?.[0]?.role || 'Unknown',
      companyName: user.companies?.name || 'Unknown',
      createdAt: user.created_at,
    })) || []

    // Construct response
    const stats: UserStats = {
      totalUsers: totalUsers || 0,
      usersByRole,
      usersByCompany,
      recentUsers,
    }

    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error fetching stats:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/* Example usage:

// With authenticated user (CEO or RH_MANAGER)
const response = await fetch('https://yhidlozgpvzsroetjxqb.supabase.co/functions/v1/get-stats', {
  headers: {
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
    'Content-Type': 'application/json'
  }
})

const stats = await response.json()

// Response format:
{
  "totalUsers": 47,
  "usersByRole": {
    "CEO": 1,
    "RH_MANAGER": 2,
    "EMPLOYEE": 35,
    "TEAM_LEADER": 9
  },
  "usersByCompany": [
    { "companyName": "Acme Corp", "userCount": 47 }
  ],
  "recentUsers": [
    {
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "EMPLOYEE",
      "companyName": "Acme Corp",
      "createdAt": "2025-11-15T10:30:00Z"
    },
    // ... 9 more recent users
  ]
}
*/
