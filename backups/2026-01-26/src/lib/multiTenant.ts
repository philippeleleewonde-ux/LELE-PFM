/**
 * Multi-Tenant Helpers
 *
 * Utilities for working with schema-per-tenant architecture
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Company {
  id: string;
  name: string;
  slug: string;
  schema_name: string;
  owner_user_id: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyParams {
  name: string;
  slug: string;
}

// ============================================================================
// COMPANY MANAGEMENT
// ============================================================================

/**
 * Create a new company (tenant)
 *
 * This will:
 * 1. Insert row in public.companies
 * 2. Automatically create PostgreSQL schema (via trigger)
 * 3. Automatically create all tables in schema (via trigger)
 *
 * @param params Company name and slug
 * @returns Created company or error
 */
export async function createCompany(params: CreateCompanyParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: new Error('User not authenticated')
      };
    }

    // Generate schema name from slug
    const { data: schemaNameData, error: schemaError } = await supabase
      .rpc('generate_schema_name', { company_slug: params.slug });

    if (schemaError) {
      console.error('❌ Error generating schema name:', schemaError);
      return { data: null, error: schemaError };
    }

    // Insert company
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: params.name,
        slug: params.slug,
        schema_name: schemaNameData,
        owner_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating company:', error);
      return { data: null, error };
    }

    return { data, error: null };

  } catch (err) {
    console.error('❌ Unexpected error creating company:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Get current user's company
 *
 * @returns User's company or null if none found
 */
export async function getCurrentUserCompany(): Promise<{
  data: Company | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: new Error('User not authenticated')
      };
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ Error fetching user company:', error);
      return { data: null, error };
    }

    return { data: data || null, error: null };

  } catch (err) {
    console.error('❌ Unexpected error fetching user company:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Get current user's company schema name
 *
 * Uses PostgreSQL function for efficiency
 *
 * @returns Schema name or null
 */
export async function getCurrentUserCompanySchema(): Promise<{
  data: string | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_company_schema');

    if (error) {
      console.error('❌ Error fetching user company schema:', error);
      return { data: null, error };
    }

    return { data: data || null, error: null };

  } catch (err) {
    console.error('❌ Unexpected error fetching user company schema:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

// ============================================================================
// TENANT-SCOPED QUERIES
// ============================================================================

/**
 * Query a tenant table
 *
 * Example:
 * ```ts
 * const { data, error } = await queryTenantTable({
 *   schema: 'tenant_acme_corp',
 *   table: 'employees',
 *   select: '*',
 *   filters: { is_active: true }
 * });
 * ```
 *
 * @param params Query parameters
 * @returns Query result
 */
export async function queryTenantTable<T = any>(params: {
  schema: string;
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const { schema, table, select = '*', filters, orderBy, limit } = params;

    // Build query
    let query = supabase
      .from(`${schema}.${table}`)
      .select(select);

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.ascending ?? true
      });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ Error querying ${schema}.${table}:`, error);
      return { data: null, error };
    }

    return { data: data as T[], error: null };

  } catch (err) {
    console.error('❌ Unexpected error querying tenant table:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Insert into a tenant table
 *
 * Example:
 * ```ts
 * const { data, error } = await insertTenantRow({
 *   schema: 'tenant_acme_corp',
 *   table: 'employees',
 *   values: { first_name: 'John', last_name: 'Doe', email: 'john@acme.com' }
 * });
 * ```
 */
export async function insertTenantRow<T = any>(params: {
  schema: string;
  table: string;
  values: Record<string, any>;
}): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { schema, table, values } = params;

    const { data, error } = await supabase
      .from(`${schema}.${table}`)
      .insert(values)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error inserting into ${schema}.${table}:`, error);
      return { data: null, error };
    }

    return { data: data as T, error: null };

  } catch (err) {
    console.error('❌ Unexpected error inserting into tenant table:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Update a tenant table row
 */
export async function updateTenantRow<T = any>(params: {
  schema: string;
  table: string;
  id: string;
  values: Record<string, any>;
}): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { schema, table, id, values } = params;

    const { data, error } = await supabase
      .from(`${schema}.${table}`)
      .update(values)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error updating ${schema}.${table}:`, error);
      return { data: null, error };
    }

    return { data: data as T, error: null };

  } catch (err) {
    console.error('❌ Unexpected error updating tenant table:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Delete a tenant table row
 */
export async function deleteTenantRow(params: {
  schema: string;
  table: string;
  id: string;
}): Promise<{ error: Error | null }> {
  try {
    const { schema, table, id } = params;

    const { error } = await supabase
      .from(`${schema}.${table}`)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ Error deleting from ${schema}.${table}:`, error);
      return { error };
    }

    return { error: null };

  } catch (err) {
    console.error('❌ Unexpected error deleting from tenant table:', err);
    return {
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

// ============================================================================
// SLUG GENERATION HELPER
// ============================================================================

/**
 * Generate a URL-friendly slug from company name
 *
 * Example: "LELE HCM Accounting" → "lele-hcm-accounting"
 *
 * @param name Company name
 * @returns URL-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/-+/g, '-')       // Replace multiple - with single -
    .replace(/^-+|-+$/g, '');  // Trim - from start/end
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate company slug
 *
 * Rules:
 * - Min 3 characters
 * - Max 63 characters (PostgreSQL schema name limit)
 * - Only lowercase letters, numbers, hyphens
 * - Cannot start/end with hyphen
 *
 * @param slug Company slug
 * @returns Validation result
 */
export function validateSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  if (!slug || slug.length < 3) {
    return {
      valid: false,
      error: 'Slug must be at least 3 characters'
    };
  }

  if (slug.length > 63) {
    return {
      valid: false,
      error: 'Slug must be 63 characters or less'
    };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens'
    };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return {
      valid: false,
      error: 'Slug cannot start or end with a hyphen'
    };
  }

  return { valid: true };
}
