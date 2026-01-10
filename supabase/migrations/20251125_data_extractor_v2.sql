-- ============================================
-- HCM DATA EXTRACTOR V2 - DATABASE SCHEMA
-- Migration: 20251125_data_extractor_v2
-- Description: Tables pour le système d'extraction intelligent de données financières
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: extraction_jobs
-- Jobs d'extraction globaux (1 job = 1 session d'extraction complète)
-- ============================================
CREATE TABLE extraction_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  file_count INTEGER DEFAULT 0,

  -- Progress tracking pour les 10 zones (0-100 pour chaque zone)
  progress JSONB DEFAULT '{
    "zone1": 0, "zone2": 0, "zone3": 0, "zone4": 0, "zone5": 0,
    "zone6": 0, "zone7": 0, "zone8": 0, "zone9": 0, "zone10": 0
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- RLS: L'utilisateur ne voit que ses jobs
  CONSTRAINT user_owns_job CHECK (user_id = auth.uid())
);

-- Index pour performance
CREATE INDEX idx_extraction_jobs_user ON extraction_jobs(user_id);
CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX idx_extraction_jobs_created ON extraction_jobs(created_at DESC);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_extraction_jobs_updated_at
  BEFORE UPDATE ON extraction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE 2: uploaded_files
-- Fichiers uploadés par l'utilisateur (Excel, PDF, CSV)
-- ============================================
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,

  -- File metadata
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'excel', 'csv')),
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 52428800), -- Max 50 MB
  mime_type TEXT NOT NULL,

  -- Supabase Storage
  storage_path TEXT NOT NULL UNIQUE, -- Format: "user_id/job_id/filename"
  storage_bucket TEXT NOT NULL DEFAULT 'data-extractor-uploads',

  -- Processing status
  status TEXT NOT NULL CHECK (status IN ('pending', 'scanning', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index
CREATE INDEX idx_uploaded_files_job ON uploaded_files(job_id);
CREATE INDEX idx_uploaded_files_status ON uploaded_files(status);

-- ============================================
-- TABLE 3: extracted_data
-- Données extraites BRUTES (avant validation utilisateur)
-- ============================================
CREATE TABLE extracted_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,

  -- Zone identification
  zone_number INTEGER NOT NULL CHECK (zone_number BETWEEN 1 AND 10),
  zone_name TEXT NOT NULL,

  -- Extraction mode
  extraction_mode TEXT NOT NULL CHECK (extraction_mode IN ('extract', 'calculate')),

  -- Raw data (format spécifique à chaque zone)
  raw_data JSONB NOT NULL,

  -- Confidence score (0.0 - 1.0)
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),

  -- Source tracking
  source_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  extraction_method TEXT, -- 'keyword', 'llm', 'formula', 'ocr', etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_extracted_data_job_zone ON extracted_data(job_id, zone_number);
CREATE INDEX idx_extracted_data_zone ON extracted_data(zone_number);

-- ============================================
-- TABLE 4: validated_data
-- Données VALIDÉES par l'utilisateur (après modification éventuelle)
-- ============================================
CREATE TABLE validated_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,

  -- Zone identification
  zone_number INTEGER NOT NULL CHECK (zone_number BETWEEN 1 AND 10),
  zone_name TEXT NOT NULL,

  -- Validated data (format final prêt pour injection)
  validated_data JSONB NOT NULL,

  -- User modifications tracking
  user_modifications JSONB, -- Diff entre extracted_data et validated_data
  was_modified BOOLEAN DEFAULT false,

  -- Validation metadata
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  validated_by UUID NOT NULL REFERENCES auth.users(id),

  -- Link to original extraction
  extracted_data_id UUID REFERENCES extracted_data(id) ON DELETE SET NULL,

  -- Unique constraint: 1 validation par zone par job
  UNIQUE(job_id, zone_number)
);

-- Index
CREATE INDEX idx_validated_data_job ON validated_data(job_id);
CREATE INDEX idx_validated_data_zone ON validated_data(zone_number);

-- ============================================
-- TABLE 5: performance_plan_injections
-- Tracking des injections vers HCM Performance Plan
-- ============================================
CREATE TABLE performance_plan_injections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,

  -- Injection status
  injection_status TEXT NOT NULL CHECK (injection_status IN ('pending', 'in_progress', 'success', 'failed')) DEFAULT 'pending',

  -- Zones injectées
  injected_zones JSONB NOT NULL, -- Liste des zone_numbers injectés
  total_zones INTEGER DEFAULT 10,

  -- Performance Plan reference (à adapter selon votre structure)
  performance_plan_id UUID, -- ID du plan de performance créé/mis à jour

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index
CREATE INDEX idx_injections_job ON performance_plan_injections(job_id);
CREATE INDEX idx_injections_status ON performance_plan_injections(injection_status);

-- ============================================
-- TABLE 6: zone_choices
-- Choix utilisateur "Extraire vs Calculer" pour chaque zone
-- ============================================
CREATE TABLE zone_choices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES extraction_jobs(id) ON DELETE CASCADE,
  zone_number INTEGER NOT NULL CHECK (zone_number BETWEEN 1 AND 10),

  -- Capacités détectées automatiquement
  can_extract BOOLEAN DEFAULT false,
  can_calculate BOOLEAN DEFAULT false,

  -- Choix utilisateur
  user_choice TEXT CHECK (user_choice IN ('extract', 'calculate', null)),

  -- Metadata
  chosen_at TIMESTAMPTZ,

  -- Unique constraint: 1 choix par zone par job
  UNIQUE(job_id, zone_number)
);

-- Index
CREATE INDEX idx_zone_choices_job ON zone_choices(job_id);

-- ============================================
-- TABLE 7: extraction_logs
-- Logs détaillés pour debugging et audit
-- ============================================
CREATE TABLE extraction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES extraction_jobs(id) ON DELETE CASCADE,

  -- Log metadata
  log_level TEXT NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
  log_message TEXT NOT NULL,
  log_data JSONB,

  -- Context
  zone_number INTEGER CHECK (zone_number BETWEEN 1 AND 10),
  file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance (logs fréquents)
CREATE INDEX idx_extraction_logs_job ON extraction_logs(job_id);
CREATE INDEX idx_extraction_logs_level ON extraction_logs(log_level);
CREATE INDEX idx_extraction_logs_created ON extraction_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Sécuriser l'accès aux données par utilisateur
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE validated_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_plan_injections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour extraction_jobs
CREATE POLICY "Users can view own jobs"
  ON extraction_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON extraction_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON extraction_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour uploaded_files
CREATE POLICY "Users can view files from own jobs"
  ON uploaded_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = uploaded_files.job_id
    AND extraction_jobs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert files to own jobs"
  ON uploaded_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = uploaded_files.job_id
    AND extraction_jobs.user_id = auth.uid()
  ));

-- Policies pour extracted_data
CREATE POLICY "Users can view extracted data from own jobs"
  ON extracted_data FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = extracted_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  ));

CREATE POLICY "System can insert extracted data"
  ON extracted_data FOR INSERT
  WITH CHECK (true); -- Géré côté backend avec service role

-- Policies pour validated_data
CREATE POLICY "Users can view validated data from own jobs"
  ON validated_data FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = validated_data.job_id
    AND extraction_jobs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert validated data to own jobs"
  ON validated_data FOR INSERT
  WITH CHECK (
    auth.uid() = validated_by
    AND EXISTS (
      SELECT 1 FROM extraction_jobs
      WHERE extraction_jobs.id = validated_data.job_id
      AND extraction_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own validated data"
  ON validated_data FOR UPDATE
  USING (auth.uid() = validated_by);

-- Policies pour zone_choices
CREATE POLICY "Users can view zone choices from own jobs"
  ON zone_choices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = zone_choices.job_id
    AND extraction_jobs.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage zone choices for own jobs"
  ON zone_choices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = zone_choices.job_id
    AND extraction_jobs.user_id = auth.uid()
  ));

-- Policies pour extraction_logs (read-only pour users, write pour system)
CREATE POLICY "Users can view logs from own jobs"
  ON extraction_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM extraction_jobs
    WHERE extraction_jobs.id = extraction_logs.job_id
    AND extraction_jobs.user_id = auth.uid()
  ));

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction: Marquer un job comme terminé
CREATE OR REPLACE FUNCTION complete_extraction_job(p_job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE extraction_jobs
  SET status = 'completed',
      completed_at = NOW(),
      progress = '{
        "zone1": 100, "zone2": 100, "zone3": 100, "zone4": 100, "zone5": 100,
        "zone6": 100, "zone7": 100, "zone8": 100, "zone9": 100, "zone10": 100
      }'::jsonb
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Calculer le progrès global d'un job
CREATE OR REPLACE FUNCTION calculate_job_progress(p_job_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_progress INTEGER;
BEGIN
  SELECT (
    (progress->>'zone1')::integer +
    (progress->>'zone2')::integer +
    (progress->>'zone3')::integer +
    (progress->>'zone4')::integer +
    (progress->>'zone5')::integer +
    (progress->>'zone6')::integer +
    (progress->>'zone7')::integer +
    (progress->>'zone8')::integer +
    (progress->>'zone9')::integer +
    (progress->>'zone10')::integer
  ) / 10
  INTO v_progress
  FROM extraction_jobs
  WHERE id = p_job_id;

  RETURN COALESCE(v_progress, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction: Obtenir le statut d'une zone spécifique
CREATE OR REPLACE FUNCTION get_zone_status(p_job_id UUID, p_zone_number INTEGER)
RETURNS TABLE (
  has_choice BOOLEAN,
  has_extracted_data BOOLEAN,
  has_validated_data BOOLEAN,
  progress_percent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS(SELECT 1 FROM zone_choices WHERE job_id = p_job_id AND zone_number = p_zone_number AND user_choice IS NOT NULL) as has_choice,
    EXISTS(SELECT 1 FROM extracted_data WHERE job_id = p_job_id AND zone_number = p_zone_number) as has_extracted_data,
    EXISTS(SELECT 1 FROM validated_data WHERE job_id = p_job_id AND zone_number = p_zone_number) as has_validated_data,
    COALESCE((SELECT (progress->>('zone' || p_zone_number))::integer FROM extraction_jobs WHERE id = p_job_id), 0) as progress_percent;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue: Jobs avec statistiques
CREATE OR REPLACE VIEW extraction_jobs_with_stats AS
SELECT
  ej.id,
  ej.user_id,
  ej.company_name,
  ej.status,
  ej.file_count,
  ej.created_at,
  ej.updated_at,
  ej.completed_at,
  calculate_job_progress(ej.id) as overall_progress,
  (SELECT COUNT(*) FROM uploaded_files WHERE job_id = ej.id) as actual_file_count,
  (SELECT COUNT(*) FROM validated_data WHERE job_id = ej.id) as validated_zones_count,
  (SELECT COUNT(*) FROM zone_choices WHERE job_id = ej.id AND user_choice IS NOT NULL) as zones_with_choice_count
FROM extraction_jobs ej;

-- ============================================
-- SAMPLE DATA (Pour tests locaux uniquement)
-- ============================================

-- Décommenter pour insérer des données de test
/*
INSERT INTO extraction_jobs (user_id, company_name, status)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Company SA',
  'pending'
);
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Prochaine étape : Tester avec `supabase migration up`
