-- ============================================
-- MANUAL REPAIR SCRIPT: Force Business Line Creation
-- ============================================

-- 1. Identify the user and company (Replace with actual IDs if known, or use current user context if running in SQL Editor)
-- For this script, we will try to fix it for ALL companies that have no business lines but have a profile.

DO $$
DECLARE
    r RECORD;
    line_exists BOOLEAN;
BEGIN
    -- Loop through all profiles that have a company_id
    FOR r IN 
        SELECT p.id as user_id, p.company_id 
        FROM profiles p 
        WHERE p.company_id IS NOT NULL
    LOOP
        -- Check if business lines exist for this company
        SELECT EXISTS (
            SELECT 1 FROM business_lines WHERE company_id = r.company_id
        ) INTO line_exists;

        -- If no lines exist, insert a default one
        IF NOT line_exists THEN
            RAISE NOTICE 'Fixing missing business lines for Company % (User %)', r.company_id, r.user_id;
            
            INSERT INTO business_lines (
                company_id, 
                user_id, 
                activity_name, 
                staff_count, 
                team_count, 
                budget, 
                display_order, 
                source, 
                is_active
            ) VALUES (
                r.company_id,
                r.user_id,
                'Activite Principale (Auto-Repair)', -- Default Name
                10, -- Default Staff
                1,  -- Default Team Count
                100000, -- Default Budget
                1,
                'manual_repair',
                true
            );
        END IF;
    END LOOP;
END $$;
