# ADR-003: Multi-Tenant Security Architecture

> **Date**: 2025-11-15
> **Status**: ✅ Ready for Execution
> **Skill**: elite-saas-developer
> **Author**: Claude (elite-backend-architect audit)
> **Decision**: Fix critical multi-tenant security vulnerabilities identified in backend audit

---

## 🎯 CONTEXT

### Problem Statement

Backend audit by **elite-backend-architect** revealed **4 CRITICAL security vulnerabilities** in LELE HCM Portal V2:

1. **Multi-tenant architecture broken**: `company_id` nullable in profiles table
2. **Role model inconsistent**: Database has 3 roles, frontend expects 6 roles
3. **No Row-Level Security (RLS)**: CEO from Company A can see data from Company B
4. **No GDPR compliance**: No audit trails, data retention, right to erasure

### Impact

- 🔴 **CRITICAL**: Data leakage between companies (multi-tenant isolation broken)
- 🔴 **CRITICAL**: Cannot save CEO role to database (enum mismatch)
- 🔴 **CRITICAL**: Legal compliance violations (GDPR, SOC2)
- 🟡 **HIGH**: Cannot trust analytics (invalid data model)

### Files Analyzed

- `src/integrations/supabase/types.ts` (Line 349: company_id nullable)
- `src/integrations/supabase/types.ts` (Line 708: app_role enum = "admin" | "user" | "manager")
- `src/types/modules.ts` (Line 62-99: Frontend expects CONSULTANT, BANQUIER, CEO, RH_MANAGER, EMPLOYEE, TEAM_LEADER)

---

## 🛠️ DECISION

Implement **3 SQL migrations + 1 Edge Function** to fix all vulnerabilities:

### Migration 1: Fix app_role enum
- **File**: `supabase/migrations/20251115000001_fix_app_role_enum.sql`
- **Changes**:
  - Drop old enum: `("admin" | "user" | "manager")`
  - Create new enum: `("CONSULTANT" | "BANQUIER" | "CEO" | "RH_MANAGER" | "EMPLOYEE" | "TEAM_LEADER")`
  - Migrate data: admin → CEO, manager → RH_MANAGER, user → EMPLOYEE
  - Add check constraint for validation

### Migration 2: Secure multi-tenant
- **File**: `supabase/migrations/20251115000002_secure_multi_tenant.sql`
- **Changes**:
  - Create default company for orphaned users
  - Update all NULL company_id to default company
  - Make company_id NOT NULL
  - Add foreign key: `profiles.company_id → companies.id ON DELETE CASCADE`
  - Add unique index: `(email, company_id)` (same email allowed across companies)

### Migration 3: Enable RLS
- **File**: `supabase/migrations/20251115000003_enable_rls_policies.sql`
- **Changes**:
  - Enable RLS on: profiles, companies, user_roles, banker_access_grants
  - Create helper function: `auth.user_company_id()`
  - Create 15+ RLS policies for tenant isolation
  - Create audit_logs table for GDPR compliance
  - Add audit trigger on profiles table

### Edge Function: Analytics
- **File**: `supabase/functions/get-stats/index.ts`
- **Purpose**: Query registered user profiles with proper RLS enforcement
- **Returns**: `{ totalUsers, usersByRole, usersByCompany, recentUsers }`
- **Security**: Only CEO and RH_MANAGER can access, scoped to their company_id

---

## 🔒 SECURITY MODEL

### Row-Level Security Policies

#### Profiles Table
1. ✅ Users can view profiles from own company
2. ✅ Users can update own profile
3. ✅ CEOs and RH_MANAGERs can view all company profiles
4. ✅ RH_MANAGERs can update company profiles

#### Companies Table
1. ✅ Users can view own company
2. ✅ CEOs can update own company
3. ✅ Consultants/Bankers can view client companies (via banker_access_grants)

#### User Roles Table
1. ✅ Users can view own roles
2. ✅ RH_MANAGERs can view/update roles of users in their company

#### Banker Access Grants Table
1. ✅ Bankers can view own access grants
2. ✅ CEOs can view/manage access grants for their company

### Tenant Isolation Strategy

**Approach**: Column-level multi-tenancy with RLS enforcement

```
User (auth.uid) → Profile → company_id → RLS policies filter all queries
```

**Advantages**:
- ✅ Single database (cost-effective)
- ✅ Database-enforced isolation (RLS)
- ✅ Cross-company queries possible (consultants/bankers)
- ✅ Supabase native support

**Disadvantages**:
- ⚠️ RLS policies must be perfect (no bugs)
- ⚠️ Requires indexes on company_id (performance)
- ⚠️ Complex policies for multi-company roles

---

## 📊 DATA MIGRATION STRATEGY

### Safe Migration Steps

1. **Backup** (CRITICAL - must do before execution):
   ```bash
   # Export all tables to CSV
   supabase db dump --project-id yhidlozgpvzsroetjxqb > backup_2025_11_15.sql
   ```

2. **Migrate app_role enum**:
   - Create new enum with 6 roles
   - Add temporary column `role_new`
   - Map old → new: admin → CEO, manager → RH_MANAGER, user → EMPLOYEE
   - Drop old column, rename new column
   - Drop old enum, rename new enum

3. **Secure company_id**:
   - Create default company (id: `default-company-migration`)
   - Update all NULL company_id → default company
   - Make NOT NULL
   - Add foreign key constraint

4. **Enable RLS**:
   - Enable RLS on all tables
   - Create policies one by one
   - Test each policy with sample queries

5. **Verify**:
   ```sql
   -- No orphaned profiles
   SELECT COUNT(*) FROM profiles WHERE company_id IS NULL; -- Should return 0

   -- Role distribution
   SELECT role, COUNT(*) FROM user_roles GROUP BY role;

   -- Test RLS (as CEO from Company A)
   SELECT * FROM profiles; -- Should only return Company A profiles
   ```

---

## 🧪 TESTING PLAN

### Test Cases

#### TC-001: Role Migration
- **Given**: Database has users with roles "admin", "user", "manager"
- **When**: Migration 1 runs
- **Then**: All roles mapped to CONSULTANT/BANQUIER/CEO/RH_MANAGER/EMPLOYEE/TEAM_LEADER
- **Verify**: `SELECT role, COUNT(*) FROM user_roles GROUP BY role`

#### TC-002: Company_id NOT NULL
- **Given**: Some profiles have company_id = NULL
- **When**: Migration 2 runs
- **Then**: All profiles have valid company_id
- **Verify**: `SELECT COUNT(*) FROM profiles WHERE company_id IS NULL` returns 0

#### TC-003: RLS Tenant Isolation
- **Given**: Two companies (A, B) with CEOs (Alice, Bob)
- **When**: Alice queries `SELECT * FROM profiles`
- **Then**: Alice only sees Company A profiles
- **Verify**: Login as Alice, run query, check results

#### TC-004: Cross-Company Access (Banker)
- **Given**: Banker Charlie has access to Companies A, B, C
- **When**: Charlie queries companies
- **Then**: Charlie sees A, B, C (via banker_access_grants)
- **Verify**: Login as Charlie, check accessible companies

#### TC-005: Analytics Endpoint
- **Given**: CEO Alice from Company A
- **When**: Alice calls `/functions/v1/get-stats`
- **Then**: Returns stats only for Company A
- **Verify**: Check response JSON, verify company_id scope

---

## 📋 ROLLBACK PLAN

### If Migration Fails

1. **Restore from backup**:
   ```bash
   psql $DATABASE_URL < backup_2025_11_15.sql
   ```

2. **Revert enum change** (if Migration 1 fails):
   ```sql
   -- Drop new enum
   DROP TYPE app_role;

   -- Recreate old enum
   CREATE TYPE app_role AS ENUM ('admin', 'user', 'manager');

   -- Restore user_roles table from backup
   ```

3. **Remove RLS** (if Migration 3 causes issues):
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
   -- Temporarily disable RLS while investigating
   ```

---

## 🎯 EXECUTION CHECKLIST

### Pre-Execution (CRITICAL)

- [ ] **Backup Supabase database** (full SQL dump)
- [ ] **Export profiles table to CSV**
- [ ] **Export user_roles table to CSV**
- [ ] **Export companies table to CSV**
- [ ] **Verify backup restoration works** (test on dev environment if available)
- [ ] **Schedule maintenance window** (if production)
- [ ] **Notify users** (if production)

### Execution Order

- [ ] **1. Run Migration 1**: Fix app_role enum
  ```bash
  supabase migration up --file 20251115000001_fix_app_role_enum.sql
  ```
  - Verify: `SELECT DISTINCT role FROM user_roles;`

- [ ] **2. Run Migration 2**: Secure multi-tenant
  ```bash
  supabase migration up --file 20251115000002_secure_multi_tenant.sql
  ```
  - Verify: `SELECT COUNT(*) FROM profiles WHERE company_id IS NULL;` (should be 0)

- [ ] **3. Run Migration 3**: Enable RLS
  ```bash
  supabase migration up --file 20251115000003_enable_rls_policies.sql
  ```
  - Verify: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`

- [ ] **4. Deploy Edge Function**: Analytics
  ```bash
  supabase functions deploy get-stats
  ```
  - Verify: `curl -X POST https://yhidlozgpvzsroetjxqb.supabase.co/functions/v1/get-stats`

- [ ] **5. Regenerate TypeScript types**:
  ```bash
  npx supabase gen types typescript --project-id yhidlozgpvzsroetjxqb > src/integrations/supabase/types.ts
  ```

- [ ] **6. Test frontend** (smoke tests):
  - [ ] Login as CEO
  - [ ] View profiles (should only see own company)
  - [ ] Create new employee (should auto-assign company_id)
  - [ ] Call get-stats endpoint (should return scoped data)

### Post-Execution

- [ ] **Monitor error logs** (Sentry, Supabase logs)
- [ ] **Check RLS policy hits** (Supabase dashboard → Performance)
- [ ] **Validate data integrity**: Run all TC-001 to TC-005 test cases
- [ ] **Update documentation**: Mark ADR as "Implemented"
- [ ] **Delete default company** (if no users assigned to it):
  ```sql
  -- Only if COUNT = 0
  SELECT COUNT(*) FROM profiles WHERE company_id = 'default-company-migration';
  DELETE FROM companies WHERE id = 'default-company-migration';
  ```

---

## 📊 BEFORE/AFTER COMPARISON

| Aspect | BEFORE | AFTER |
|--------|--------|-------|
| **Multi-tenant isolation** | ❌ None (company_id nullable) | ✅ Database-enforced (RLS + NOT NULL) |
| **Role model** | ❌ 3 roles (admin/user/manager) | ✅ 6 roles (CONSULTANT/BANQUIER/CEO/RH_MANAGER/EMPLOYEE/TEAM_LEADER) |
| **CEO role** | ❌ Cannot save (enum mismatch) | ✅ Saved correctly |
| **Data leakage** | 🔴 CRITICAL: CEO sees all companies | ✅ FIXED: CEO sees only own company |
| **GDPR compliance** | ❌ No audit trail | ✅ audit_logs table + triggers |
| **Analytics** | ❌ Invalid (no data access) | ✅ Endpoint with RLS enforcement |
| **Foreign keys** | ❌ No referential integrity | ✅ company_id → companies(id) |
| **Indexes** | ⚠️ Missing on company_id | ✅ idx_profiles_company_id |
| **Email uniqueness** | ⚠️ Global (wrong) | ✅ Per-company (correct) |

---

## 🔮 FUTURE IMPROVEMENTS

### Phase 2 (Post-Migration)

1. **Advanced RLS policies**:
   - Department-level isolation (RH can only see their department)
   - Temporary access grants (expiring banker access)
   - Read-only vs read-write permissions

2. **GDPR compliance**:
   - Data export endpoint (right to data portability)
   - Data deletion endpoint (right to erasure)
   - Data retention policies (auto-delete after 7 years)
   - Cookie consent management

3. **Performance optimization**:
   - Materialized views for analytics
   - Caching layer (Redis) for health scores
   - Connection pooling (PgBouncer)

4. **Observability**:
   - RLS policy monitoring (which policies hit most)
   - Query performance tracking
   - Anomaly detection (CEO querying 10,000 profiles = suspicious)

---

## 📚 REFERENCES

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenant Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 🎯 DECISION SUMMARY

**We choose**: Column-level multi-tenancy with RLS enforcement

**Rationale**:
1. ✅ Supabase native support (no custom auth layer)
2. ✅ Cost-effective (single database)
3. ✅ Cross-company queries possible (consultants/bankers)
4. ✅ Database-enforced security (cannot bypass in application code)
5. ✅ GDPR compliant with audit logs

**Accepted trade-offs**:
- ⚠️ RLS policies complexity (15+ policies to maintain)
- ⚠️ Performance overhead (RLS adds WHERE clauses to every query)
- ⚠️ Testing complexity (must test as different roles/companies)

**Rejected alternatives**:
- ❌ Schema-level multi-tenancy (too complex for Supabase)
- ❌ Database-per-tenant (too expensive, too many connections)
- ❌ Application-level filtering (can be bypassed, not secure)

---

**Created**: 2025-11-15
**Author**: Claude (elite-saas-developer)
**Skill**: elite-backend-architect + elite-saas-developer
**Approved by**: User (execute option a: corrige toutes les erreurs)
**Status**: ✅ Ready for Execution
**Next step**: Run migrations on Supabase project yhidlozgpvzsroetjxqb
