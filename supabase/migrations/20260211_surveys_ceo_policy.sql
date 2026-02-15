-- ============================================================================
-- Allow CEO and CONSULTANT to manage surveys (INSERT/UPDATE/DELETE)
-- Previously only RH_MANAGER had this permission
-- ============================================================================

CREATE POLICY "CEO can manage surveys"
ON surveys FOR ALL
USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    public.auth_has_role(auth.uid(), 'CEO')
    OR public.auth_has_role(auth.uid(), 'CONSULTANT')
  )
);
