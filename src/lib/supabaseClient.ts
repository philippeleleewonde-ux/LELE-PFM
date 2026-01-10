/**
 * Supabase Client Alias
 *
 * This file serves as a compatibility layer, re-exporting the Supabase client
 * from its canonical location in @/integrations/supabase/client
 *
 * Import using: import { supabase } from '@/lib/supabaseClient';
 */

export { supabase } from '@/integrations/supabase/client';
export type { Database } from '@/integrations/supabase/types';
