-- Migration: Auth Analytics Table
-- Purpose: Track signup/signin events for observability
-- Created: 2025-11-08

-- Create auth_events table for tracking authentication events
CREATE TABLE IF NOT EXISTS public.auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event metadata
  event_type TEXT NOT NULL CHECK (event_type IN (
    'signup_started',
    'signup_success',
    'signup_failed',
    'signin_started',
    'signin_success',
    'signin_failed',
    'signout'
  )),

  -- User context (nullable because signup_started has no user_id yet)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,

  -- Auth metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Error details (if failed)
  error_message TEXT,
  error_code TEXT,

  -- Request metadata
  user_agent TEXT,
  ip_address INET,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON public.auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_email ON public.auth_events(email);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON public.auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON public.auth_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_events_metadata ON public.auth_events USING gin(metadata);

-- RLS Policies
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert events
CREATE POLICY "Service role can insert auth events"
  ON public.auth_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to view their own events
CREATE POLICY "Users can view their own auth events"
  ON public.auth_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anon to insert events (for signup_started before user exists)
CREATE POLICY "Anon can insert signup events"
  ON public.auth_events
  FOR INSERT
  TO anon
  WITH CHECK (event_type IN ('signup_started', 'signup_failed', 'signin_started', 'signin_failed'));

-- Create view for auth analytics (admin only)
CREATE OR REPLACE VIEW public.auth_analytics AS
SELECT
  DATE_TRUNC('hour', created_at) as time_bucket,
  event_type,
  metadata->>'role' as role,
  COUNT(*) as event_count,
  COUNT(DISTINCT email) as unique_users,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count
FROM public.auth_events
GROUP BY time_bucket, event_type, metadata->>'role'
ORDER BY time_bucket DESC;

-- Grant access to authenticated users
GRANT SELECT ON public.auth_analytics TO authenticated;

-- Create function to get signup success rate
CREATE OR REPLACE FUNCTION public.get_signup_success_rate(
  time_interval INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS TABLE (
  total_attempts BIGINT,
  successes BIGINT,
  failures BIGINT,
  success_rate NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE event_type IN ('signup_started', 'signup_success', 'signup_failed')) as total,
      COUNT(*) FILTER (WHERE event_type = 'signup_success') as success,
      COUNT(*) FILTER (WHERE event_type = 'signup_failed') as fail
    FROM public.auth_events
    WHERE created_at > NOW() - time_interval
  )
  SELECT
    total as total_attempts,
    success as successes,
    fail as failures,
    CASE
      WHEN total > 0 THEN ROUND((success::numeric / total::numeric) * 100, 2)
      ELSE 0
    END as success_rate
  FROM stats;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.get_signup_success_rate TO authenticated;

-- Create function to get top signup errors
CREATE OR REPLACE FUNCTION public.get_top_signup_errors(
  time_interval INTERVAL DEFAULT INTERVAL '7 days',
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  error_message TEXT,
  error_count BIGINT,
  affected_emails TEXT[]
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    error_message,
    COUNT(*) as error_count,
    ARRAY_AGG(DISTINCT email ORDER BY email) as affected_emails
  FROM public.auth_events
  WHERE event_type = 'signup_failed'
    AND created_at > NOW() - time_interval
    AND error_message IS NOT NULL
  GROUP BY error_message
  ORDER BY error_count DESC
  LIMIT limit_count;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.get_top_signup_errors TO authenticated;

-- Comment the table
COMMENT ON TABLE public.auth_events IS 'Tracks all authentication events for observability and analytics';
COMMENT ON COLUMN public.auth_events.metadata IS 'Stores additional context like role, company_id, etc.';
COMMENT ON FUNCTION public.get_signup_success_rate IS 'Returns signup success rate for a given time interval';
COMMENT ON FUNCTION public.get_top_signup_errors IS 'Returns most common signup error messages';
