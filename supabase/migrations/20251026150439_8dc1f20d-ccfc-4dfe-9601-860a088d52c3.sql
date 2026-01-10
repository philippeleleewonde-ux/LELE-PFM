-- Fix 2: Create secure function to get invitation code (only for authorized roles)
CREATE OR REPLACE FUNCTION public.get_company_invitation_code(company_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  user_company_id UUID;
BEGIN
  -- Get user's company_id
  SELECT company_id INTO user_company_id 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if requesting their own company's code
  IF user_company_id != company_uuid THEN
    RAISE EXCEPTION 'Unauthorized: Can only access your own company code';
  END IF;
  
  -- Check if user has authorized role
  IF NOT (
    has_role(auth.uid(), 'CEO'::app_role) OR 
    has_role(auth.uid(), 'CONSULTANT'::app_role) OR 
    has_role(auth.uid(), 'RH_MANAGER'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only CEO, CONSULTANT, and RH_MANAGER can access invitation codes';
  END IF;
  
  -- Return the invitation code
  SELECT invitation_code INTO code 
  FROM companies 
  WHERE id = company_uuid;
  
  RETURN code;
END;
$$;

-- Fix 3: Update profiles SELECT policy to restrict PII exposure
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile or HR/admin can view all" 
ON profiles
FOR SELECT 
USING (
  auth.uid() = id OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'RH_MANAGER'::app_role)
);

-- Fix 4: Update companies INSERT policy to restrict creation
DROP POLICY IF EXISTS "Users can insert their own company" ON companies;
CREATE POLICY "Only CEO/CONSULTANT/admin can create companies" 
ON companies
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'CEO'::app_role) OR 
  has_role(auth.uid(), 'CONSULTANT'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);