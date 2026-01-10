-- ============================================
-- FIX RLS POLICIES - Remove buggy CHECK constraint and add proper RLS
-- Date: 2025-11-26
-- Issue: CHECK constraint auth.uid() fails on client-side inserts
-- ============================================

-- 1. DROP the buggy CHECK constraint on extraction_jobs
ALTER TABLE extraction_jobs
DROP CONSTRAINT IF EXISTS user_owns_job;

-- 2. ENABLE Row Level Security on all tables
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE validated_data ENABLE ROW LEVEL SECURITY;

-- 3. CREATE proper RLS policies for extraction_jobs
-- Policy: Users can INSERT their own jobs
CREATE POLICY "Users can insert their own jobs"
ON extraction_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can SELECT their own jobs
CREATE POLICY "Users can view their own jobs"
ON extraction_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can UPDATE their own jobs
CREATE POLICY "Users can update their own jobs"
ON extraction_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own jobs
CREATE POLICY "Users can delete their own jobs"
ON extraction_jobs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. CREATE RLS policies for uploaded_files
-- Policy: Users can INSERT files for their own jobs
CREATE POLICY "Users can insert files for their jobs"
ON uploaded_files
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = uploaded_files.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

-- Policy: Users can SELECT files for their own jobs
CREATE POLICY "Users can view files for their jobs"
ON uploaded_files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = uploaded_files.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

-- Policy: Users can UPDATE files for their own jobs
CREATE POLICY "Users can update files for their jobs"
ON uploaded_files
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = uploaded_files.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

-- Policy: Users can DELETE files for their own jobs
CREATE POLICY "Users can delete files for their jobs"
ON uploaded_files
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = uploaded_files.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

-- 5. CREATE RLS policies for extracted_data
CREATE POLICY "Users can insert extracted data for their jobs"
ON extracted_data
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = extracted_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view extracted data for their jobs"
ON extracted_data
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = extracted_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update extracted data for their jobs"
ON extracted_data
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = extracted_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete extracted data for their jobs"
ON extracted_data
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = extracted_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

-- 6. CREATE RLS policies for validated_data
CREATE POLICY "Users can insert validated data for their jobs"
ON validated_data
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = validated_by
  AND EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = validated_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view validated data for their jobs"
ON validated_data
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = validated_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update validated data for their jobs"
ON validated_data
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = validated_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete validated data for their jobs"
ON validated_data
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = validated_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('extraction_jobs', 'uploaded_files', 'extracted_data', 'validated_data');

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('extraction_jobs', 'uploaded_files', 'extracted_data', 'validated_data')
ORDER BY tablename, policyname;
