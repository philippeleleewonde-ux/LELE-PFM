// Updated Supabase Types - Post Migration
// Created: 2025-11-15
// Author: elite-saas-developer
// Note: This file shows expected types AFTER running migrations
// To regenerate from actual schema: npx supabase gen types typescript --project-id yhidlozgpvzsroetjxqb > src/integrations/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          bank_name: string | null
          company_id: string // ✅ FIXED: Now NOT NULL (was: string | null)
          company_name: string | null
          consulting_firm: string | null
          created_at: string
          department: string | null
          email: string
          employee_id: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bank_name?: string | null
          company_id: string // ✅ REQUIRED on insert
          company_name?: string | null
          consulting_firm?: string | null
          created_at?: string
          department?: string | null
          email: string
          employee_id?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bank_name?: string | null
          company_id?: string // Can update company_id
          company_name?: string | null
          consulting_firm?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_company"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
          industry: string | null
          size: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          size?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          size?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"] // ✅ FIXED: Now uses updated enum
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      banker_access_grants: {
        Row: {
          id: string
          banker_id: string
          company_id: string // ✅ FIXED: Now NOT NULL
          granted_at: string
          granted_by: string
          is_active: boolean
          access_level: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          banker_id: string
          company_id: string
          granted_at?: string
          granted_by: string
          is_active?: boolean
          access_level?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          banker_id?: string
          company_id?: string
          granted_at?: string
          granted_by?: string
          is_active?: boolean
          access_level?: string | null
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_banker_access_company"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_banker_access_banker"
            columns: ["banker_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          operation: string
          user_id: string
          company_id: string
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          operation: string
          user_id: string
          company_id: string
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          operation?: string
          user_id?: string
          company_id?: string
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "CONSULTANT"    // ✅ FIXED: Matches frontend
        | "BANQUIER"      // ✅ FIXED: Matches frontend
        | "CEO"           // ✅ FIXED: Matches frontend
        | "RH_MANAGER"    // ✅ FIXED: Matches frontend
        | "EMPLOYEE"      // ✅ FIXED: Matches frontend
        | "TEAM_LEADER"   // ✅ FIXED: Matches frontend
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// HELPER TYPES FOR FRONTEND USE
// ============================================================================

export type UserRole = Database["public"]["Enums"]["app_role"]

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export type Company = Database["public"]["Tables"]["companies"]["Row"]
export type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"]
export type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"]

export type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"]
export type UserRoleInsert = Database["public"]["Tables"]["user_roles"]["Insert"]
export type UserRoleUpdate = Database["public"]["Tables"]["user_roles"]["Update"]

export type BankerAccessGrant = Database["public"]["Tables"]["banker_access_grants"]["Row"]
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"]

// ============================================================================
// MIGRATION NOTES
// ============================================================================

/*
Changes from original types.ts:

1. ✅ app_role enum: Changed from ("admin" | "user" | "manager") to 6 frontend roles
   - Migration: 20251115000001_fix_app_role_enum.sql
   - Impact: CEO role can now be saved to database

2. ✅ profiles.company_id: Changed from nullable to NOT NULL
   - Migration: 20251115000002_secure_multi_tenant.sql
   - Impact: All users MUST belong to a company (multi-tenant architecture)

3. ✅ Foreign key constraint: profiles.company_id → companies.id
   - Migration: 20251115000002_secure_multi_tenant.sql
   - Impact: Referential integrity enforced

4. ✅ RLS enabled on all tables
   - Migration: 20251115000003_enable_rls_policies.sql
   - Impact: Tenant isolation enforced at database level

5. ✅ New table: audit_logs
   - Migration: 20251115000003_enable_rls_policies.sql
   - Impact: GDPR compliance (audit trail)

To regenerate from actual Supabase schema after running migrations:
```bash
npx supabase gen types typescript --project-id yhidlozgpvzsroetjxqb > src/integrations/supabase/types.ts
```

IMPORTANT: Do NOT run this command until migrations are applied to production!
*/
