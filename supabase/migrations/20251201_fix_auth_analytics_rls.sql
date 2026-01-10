-- ============================================
-- MIGRATION: Fix Auth Events RLS
-- Date: 2025-12-01
-- Purpose: Allow authenticated users to insert auth events (e.g. signin_success, signout)
--          and ensure non-blocking analytics.
-- ============================================

-- 1. Allow authenticated users to insert events
CREATE POLICY "Authenticated users can insert auth events"
ON public.auth_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Update Anon policy to include 'signin_success' just in case of race conditions
-- (Though normally signin_success happens with a valid session)
-- We drop the old policy and recreate it with the updated list if needed, 
-- but simpler to just add the authenticated policy first.
-- If we want to be safe, we can update the check constraint or the policy list.

-- Let's stick to adding the authenticated policy, as that's the main gap.
-- The existing Anon policy covers 'signin_started' and 'signin_failed'.
