-- ============================================================================
-- Allow CEO and CONSULTANT to view survey_responses
-- Previously only RH_MANAGER had SELECT permission
-- ============================================================================

CREATE POLICY "CEO and CONSULTANT can view responses"
ON survey_responses FOR SELECT
USING (
  survey_id IN (
    SELECT id FROM surveys
    WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
  AND (
    public.auth_has_role(auth.uid(), 'CEO')
    OR public.auth_has_role(auth.uid(), 'CONSULTANT')
  )
);
