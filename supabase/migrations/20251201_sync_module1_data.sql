-- ============================================
-- SYNC SCRIPT: Restore Real Module 1 Data to Business Lines
-- ============================================

DO $$
DECLARE
    r RECORD;
    score_record RECORD;
    line jsonb;
    item jsonb;
    synced_count INTEGER;
BEGIN
    -- Loop through all profiles that have a company_id
    FOR r IN 
        SELECT p.id as user_id, p.company_id 
        FROM profiles p 
        WHERE p.company_id IS NOT NULL
    LOOP
        synced_count := 0;

        -- Find latest score with business lines for this company
        -- We look for a record where factors->'businessLines' exists and is not empty
        SELECT factors FROM company_performance_scores 
        WHERE company_id = r.company_id 
        AND factors->'businessLines' IS NOT NULL
        AND jsonb_array_length(factors->'businessLines') > 0
        ORDER BY calculation_date DESC 
        LIMIT 1 
        INTO score_record;

        -- If we found valid Module 1 data
        IF score_record.factors IS NOT NULL THEN
            
            RAISE NOTICE 'Found real Module 1 data for company % (User %). Syncing...', r.company_id, r.user_id;

            -- 1. DELETE existing lines for this company (including the "Rescue" line)
            DELETE FROM business_lines WHERE company_id = r.company_id;

            -- 2. INSERT real lines from the JSON
            FOR item IN SELECT * FROM jsonb_array_elements(score_record.factors->'businessLines')
            LOOP
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
                    item->>'activityName',
                    COALESCE((item->>'staffCount')::int, 0),
                    COALESCE((item->>'teamCount')::int, 0),
                    COALESCE((item->>'budget')::numeric, 0),
                    1, -- Default order
                    'module1_sync',
                    true
                );
                synced_count := synced_count + 1;
            END LOOP;

            RAISE NOTICE 'Successfully synced % lines for company %', synced_count, r.company_id;
            
        ELSE
            RAISE NOTICE 'No valid Module 1 data found for company %. Skipping.', r.company_id;
        END IF;
    END LOOP;
END $$;
