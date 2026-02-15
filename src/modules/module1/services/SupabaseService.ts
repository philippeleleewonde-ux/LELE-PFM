import { supabase } from '@/integrations/supabase/client';
import { FormData } from '@/modules/module1/types';
import { createMetricsService, FiscalCalendarEngine } from '@/lib/fiscal';

export const SupabaseService = {
    /**
     * Save the complete CFO Form Data to Supabase
     * This involves:
     * 1. Creating/Updating the Company record
     * 2. Saving the Performance Score and detailed data
     */
    async saveCFOData(formData: FormData): Promise<{ success: boolean; error?: any }> {
        try {
            // 1. Get Current User
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("Utilisateur non connecté. Impossible de sauvegarder sur le profil CEO.");
            }

            // 2. Check User Profile for existing Company Link
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                // Proceeding might be risky if we can't check profile, but let's try to handle it
            }

            let companyId = profile?.company_id;
            let company;

            // Generate unique slug with timestamp suffix to avoid duplicates
            const baseSlug = formData.companyInfo.companyName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');

            // Add unique suffix only for new companies (not updates)
            const uniqueSuffix = !companyId ? `-${Date.now().toString(36)}` : '';
            const slug = baseSlug + uniqueSuffix;

            const companyData = {
                name: formData.companyInfo.companyName,
                slug: slug,
                schema_name: `tenant_${slug.replace(/-/g, '_')}`,
                owner_user_id: user.id,
                industry: formData.companyInfo.activity,
                employees_count: formData.companyInfo.workforce || 0,
                invitation_code: `CFO-${Date.now().toString(36).toUpperCase()}`,
            } as any;

            if (companyId) {
                // 3a. UPDATE existing company (but keep the existing slug to avoid conflicts)
                // Remove slug and schema_name from update to preserve uniqueness
                const updateData = {
                    name: formData.companyInfo.companyName,
                    owner_user_id: user.id,
                    industry: formData.companyInfo.activity,
                    employees_count: formData.companyInfo.workforce || 0,
                } as any;

                const { data: updatedCompany, error: updateError } = await supabase
                    .from('companies')
                    .update(updateData)
                    .eq('id', companyId)
                    .select()
                    .single();

                if (updateError) throw new Error(`Failed to update company: ${updateError.message}`);
                company = updatedCompany;

            } else {
                // 3b. CREATE new company and LINK to profile
                const { data: newCompany, error: createError } = await supabase
                    .from('companies')
                    .insert(companyData)
                    .select()
                    .single();

                if (createError) throw new Error(`Failed to create company: ${createError.message}`);
                company = newCompany;
                companyId = newCompany.id;

                // LINKING: Update profile with new company_id
                const { error: linkError } = await supabase
                    .from('profiles')
                    .update({ company_id: companyId } as any)
                    .eq('id', user.id);

                if (linkError) throw new Error(`Failed to link company to CEO profile: ${linkError.message}`);
            }

            // 4. Save Performance Score
            // MAP Risk Level to DB Enum (LOW, MEDIUM, HIGH)
            let dbRiskLevel = 'MEDIUM';
            const formRisk = (formData.calculatedFields.riskLevel || 'Standard').toUpperCase();
            if (formRisk.includes('LOW') || formRisk.includes('FAIBLE')) dbRiskLevel = 'LOW';
            else if (formRisk.includes('HIGH') || formRisk.includes('ELEV')) dbRiskLevel = 'HIGH';

            // CLAMP Score between 0 and 100
            let dbScore = formData.calculatedFields.engagementScore || 0;
            dbScore = Math.max(0, Math.min(100, dbScore));

            const scoreData = {
                company_id: companyId,
                module_number: 1,
                score_value: dbScore,
                risk_level: dbRiskLevel,
                recommended_rate: 0,
                calculation_date: new Date().toISOString(),
                factors: JSON.parse(JSON.stringify(formData)),
            };

            const { data: score, error: scoreError } = await supabase
                .from('company_performance_scores')
                .insert(scoreData)
                .select()
                .single();

            if (scoreError) throw new Error(`Failed to save performance score: ${scoreError.message}`);

            // 5. SYNC Business Lines to dedicated table (for Module 3 and others)
            if (formData.businessLines && formData.businessLines.length > 0) {
                // CRITICAL: Ensure company_id is a string (business_lines.company_id is TEXT)
                const companyIdString = String(companyId);

                // A. Delete existing lines for this company (simple sync strategy)
                const { error: deleteError } = await supabase
                    .from('business_lines')
                    .delete()
                    .eq('company_id', companyIdString);

                if (deleteError) {
                    console.error('❌ Error clearing old business lines:', deleteError);
                    // Continue anyway - might be first time save
                }

                // B. Prepare new lines with explicit string conversion
                // NOTE: source must be 'manual' | 'datascanner' | 'import' (DB constraint)
                // Detect if data came from DataScanner injection
                const injectionMeta = (formData as any)?._datascannerInjection
                const lineSource = injectionMeta ? 'datascanner' : 'manual'

                const linesToInsert = formData.businessLines.map((line, index) => ({
                    company_id: companyIdString,
                    user_id: user.id,
                    activity_name: line.activityName,
                    staff_count: line.staffCount || 0,
                    team_count: line.teamCount || 0,
                    budget: line.budget || 0,
                    display_order: index + 1,
                    source: lineSource,
                    is_active: true
                }));

                // C. Insert new lines
                const { data: insertedLines, error: insertError } = await supabase
                    .from('business_lines')
                    .insert(linesToInsert as any)
                    .select();

                if (insertError) {
                    console.error('❌ Error syncing business lines:', insertError);
                    console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
                    // IMPORTANT: Throw error so user knows something went wrong
                    throw new Error(`Failed to save business lines: ${insertError.message}`);
                }
            }

            // 6. SYNC Calculated Metrics to calculated_metrics table (for Module 3)
            await this.saveCalculatedMetrics(companyId, formData);

            // 7. Generate Fiscal Calendar if not exists
            await this.ensureFiscalCalendar(companyId);

            return { success: true };

        } catch (error: any) {
            console.error('Supabase Save Failed:', error);
            return { success: false, error: error.message || error };
        }
    },

    /**
     * Load the CFO Form Data from Supabase
     * Retrieves the 'factors' JSON from the latest company_performance_scores record
     */
    async loadCFOData(): Promise<{ success: boolean; data?: FormData; error?: any }> {
        try {
            // 1. Get Current User
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Utilisateur non connecté.");

            // 2. Get User's Company
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            const profile = profileData as { company_id: string | null } | null;

            if (profileError || !profile?.company_id) {
                return { success: false, error: 'No company found' };
            }

            // 3. Get Latest Performance Score
            const { data: scoreData, error: scoreError } = await supabase
                .from('company_performance_scores')
                .select('factors')
                .eq('company_id', profile.company_id)
                .eq('module_number', 1)
                .order('calculation_date', { ascending: false })
                .limit(1)
                .single();

            const score = scoreData as { factors: any } | null;

            if (scoreError) {
                return { success: false, error: 'No data found' };
            }

            if (score && score.factors) {
                // Cast the JSON back to FormData
                return { success: true, data: score.factors as unknown as FormData };
            }

            return { success: false, error: 'Empty data' };

        } catch (error: any) {
            console.error('Supabase Load Failed:', error);
            return { success: false, error: error.message || error };
        }
    },

    /**
     * Save calculated metrics to the calculated_metrics table
     * This includes Priority Actions (PPR per person per indicator per business line)
     */
    async saveCalculatedMetrics(companyId: string, formData: FormData): Promise<void> {
        try {
            const metricsService = createMetricsService(companyId);
            const calc = formData.calculatedFields;

            // 1. Save Priority Actions for N+1, N+2, N+3
            if (calc.priorityActionsN1 && Array.isArray(calc.priorityActionsN1)) {
                await metricsService.savePriorityActions(1, calc.priorityActionsN1);
            }

            if (calc.priorityActionsN2 && Array.isArray(calc.priorityActionsN2)) {
                await metricsService.savePriorityActions(2, calc.priorityActionsN2);
            }

            if (calc.priorityActionsN3 && Array.isArray(calc.priorityActionsN3)) {
                await metricsService.savePriorityActions(3, calc.priorityActionsN3);
            }

            // 2. Save Gains N+1, N+2, N+3
            if (calc.gainsN1 || calc.gainsN2 || calc.gainsN3) {
                await metricsService.saveGains(
                    calc.gainsN1 || 0,
                    calc.gainsN2 || 0,
                    calc.gainsN3 || 0
                );
            }

            // 3. Save Indicator Rates
            const indicatorRates = {
                absenteeism: calc.indicator_absenteeism_rate || 0,
                productivity: calc.indicator_productivity_rate || 0,
                quality: calc.indicator_quality_rate || 0,
                accidents: calc.indicator_accidents_rate || 0,
                knowhow: calc.indicator_knowhow_rate || 0,
                all: 100, // Total
            };

            await metricsService.saveIndicatorRates(indicatorRates as any);
        } catch (error) {
            console.error('Error saving calculated metrics:', error);
            // Don't throw - this is non-blocking
        }
    },

    /**
     * Ensure fiscal calendar exists for the company
     */
    async ensureFiscalCalendar(companyId: string): Promise<void> {
        try {
            // Check if calendar exists
            const { count, error } = await supabase
                .from('fiscal_periods')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId);

            if (error) {
                console.error('Error checking fiscal calendar:', error);
                return;
            }

            // Generate if not exists or very few records
            if ((count || 0) < 10) {
                const fiscalEngine = new FiscalCalendarEngine();
                await fiscalEngine.saveFiscalCalendar(companyId);
            }
        } catch (error) {
            console.error('Error ensuring fiscal calendar:', error);
            // Don't throw - this is non-blocking
        }
    }
};
