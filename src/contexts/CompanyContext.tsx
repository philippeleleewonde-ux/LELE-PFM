import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Company {
    id: string;
    name: string;
    industry: string;
    employees_count: number;
    slug: string;
}

interface CompanyContextType {
    companyId: string | null;
    company: Company | null;
    isLoading: boolean;
    error: Error | null;
    refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCompanyData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 1. Get User
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                setCompanyId(null);
                setCompany(null);
                setIsLoading(false);
                return;
            }

            // 2. Get Profile to find Company ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (profileError) {
                // If no profile found, it might be a new user or error
                console.error('Error fetching profile:', profileError);
                setCompanyId(null);
                setCompany(null);
                setIsLoading(false);
                return;
            }

            if (!profile?.company_id) {
                setCompanyId(null);
                setCompany(null);
                setIsLoading(false);
                return;
            }

            setCompanyId(profile.company_id);

            // 3. Get Company Details
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', profile.company_id)
                .single();

            if (companyError) {
                console.error('Error fetching company:', companyError);
                // We still have the ID, so we don't fail completely
            } else {
                setCompany(companyData as Company);
            }

        } catch (err: any) {
            console.error('Unexpected error in CompanyProvider:', err);
            setError(err);
            toast.error("Erreur lors du chargement des données entreprise");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();

        // Listen for auth changes to re-fetch
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchCompanyData();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <CompanyContext.Provider value={{
            companyId,
            company,
            isLoading,
            error,
            refreshCompany: fetchCompanyData
        }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
}
