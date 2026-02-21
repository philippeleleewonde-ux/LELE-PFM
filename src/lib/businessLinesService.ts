// ============================================
// BUSINESS LINES SERVICE
// Supabase CRUD operations for business_lines table
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
  BusinessLine,
  BusinessLineInsert,
  BusinessLineUpdate,
  BusinessLinesStats,
  BusinessLineFilters,
  BusinessLineSortBy,
  SortOrder,
} from '@/types/business-lines';

/**
 * Get all business lines for current user
 */
export async function getBusinessLines(
  filters?: BusinessLineFilters,
  sortBy: BusinessLineSortBy = 'display_order',
  sortOrder: SortOrder = 'asc'
): Promise<{ data: BusinessLine[] | null; error: PostgrestError | null }> {
  let query = supabase
    .from('business_lines')
    .select('*');

  // Apply filters
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  return { data, error };
}

/**
 * Get business lines for a specific company
 * Used in Module 3 to load business lines when user enters company_id
 */
export async function getBusinessLinesByCompanyId(
  companyId: string
): Promise<{ data: BusinessLine[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('business_lines')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return { data, error };
}

/**
 * Get single business line by ID
 */
export async function getBusinessLineById(
  id: string
): Promise<{ data: BusinessLine | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('business_lines')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Create new business line
 */
export async function createBusinessLine(
  businessLine: BusinessLineInsert
): Promise<{ data: BusinessLine | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('business_lines')
    .insert(businessLine)
    .select()
    .single();

  return { data, error };
}

/**
 * Create multiple business lines (bulk insert)
 * Used when migrating from Module 1 localStorage
 */
export async function createBusinessLines(
  businessLines: BusinessLineInsert[]
): Promise<{ data: BusinessLine[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('business_lines')
    .insert(businessLines)
    .select();

  return { data, error };
}

/**
 * Update business line
 */
export async function updateBusinessLine(
  id: string,
  updates: BusinessLineUpdate
): Promise<{ data: BusinessLine | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('business_lines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete business line (soft delete - set is_active = false)
 */
export async function softDeleteBusinessLine(
  id: string
): Promise<{ data: BusinessLine | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('business_lines')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete business line (hard delete)
 */
export async function deleteBusinessLine(
  id: string
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('business_lines')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Get aggregated stats for user's business lines
 */
export async function getBusinessLinesStats(
  userId: string,
  companyId?: string
): Promise<{ data: BusinessLinesStats | null; error: PostgrestError | null }> {
  let query = supabase
    .from('business_lines_stats')
    .select('*')
    .eq('user_id', userId);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.single();

  return { data, error };
}

/**
 * Recalculate budget and staff rates for all business lines
 * Called after insert/update/delete to keep percentages accurate
 */
export async function recalculateRates(
  userId: string,
  companyId?: string
): Promise<{ data: BusinessLine[] | null; error: PostgrestError | null }> {
  // Get all active business lines
  const { data: lines, error: fetchError } = await getBusinessLines(
    { user_id: userId, company_id: companyId, is_active: true }
  );

  if (fetchError || !lines) {
    return { data: null, error: fetchError };
  }

  // Calculate totals
  const totalStaff = lines.reduce((sum, line) => sum + line.staff_count, 0);
  const totalBudget = lines.reduce((sum, line) => sum + line.budget, 0);

  // Update each line with calculated rates
  const updates = lines.map(line => ({
    id: line.id,
    staff_rate: totalStaff > 0 ? (line.staff_count / totalStaff) * 100 : 0,
    budget_rate: totalBudget > 0 ? (line.budget / totalBudget) * 100 : 0,
  }));

  // Batch update
  const updatePromises = updates.map(({ id, staff_rate, budget_rate }) =>
    updateBusinessLine(id, { staff_rate, budget_rate })
  );

  try {
    await Promise.all(updatePromises);

    // Fetch updated lines
    return await getBusinessLines(
      { user_id: userId, company_id: companyId, is_active: true }
    );
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Validate company_id exists and user has access
 * Used in Module 3 form validation
 */
export async function validateCompanyId(
  companyId: string
): Promise<{ isValid: boolean; lineCount: number }> {
  const { data, error } = await supabase
    .from('business_lines')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error || !data) {
    return { isValid: false, lineCount: 0 };
  }

  return {
    isValid: data.length > 0,
    lineCount: data.length,
  };
}

/**
 * Check if user can add more business lines (max 8 per Module 1 constraint)
 */
export async function canAddBusinessLine(
  userId: string,
  companyId?: string
): Promise<{ canAdd: boolean; currentCount: number; maxAllowed: number }> {
  const MAX_BUSINESS_LINES = 8;

  const { data, error } = await supabase
    .from('business_lines')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (companyId) {
    const filtered = data?.filter(line => line.company_id === companyId) || [];
    return {
      canAdd: filtered.length < MAX_BUSINESS_LINES,
      currentCount: filtered.length,
      maxAllowed: MAX_BUSINESS_LINES,
    };
  }

  const currentCount = data?.length || 0;

  return {
    canAdd: currentCount < MAX_BUSINESS_LINES,
    currentCount,
    maxAllowed: MAX_BUSINESS_LINES,
  };
}
