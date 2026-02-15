// ============================================================================
// HOOK: useCampaigns
// Fetches surveys with start/end dates for campaign calendar management
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

export type CampaignStatus = 'planned' | 'active' | 'completed';

export interface Campaign {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  is_active: boolean;
  status: CampaignStatus;
  response_count?: number;
}

function computeStatus(startDate: string | null, endDate: string | null): CampaignStatus {
  if (!startDate || !endDate) return 'completed'; // legacy surveys without dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (today < start) return 'planned';
  if (today > end) return 'completed';
  return 'active';
}

interface UseCampaignsReturn {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  activeCampaign: Campaign | null;
  hasActiveCampaign: boolean;
  refetch: () => void;
}

export function useCampaigns(excludeDemo = true): UseCampaignsReturn {
  const { companyId } = useCompany();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setCampaigns([]);
      return;
    }

    let cancelled = false;

    async function fetchCampaigns() {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('surveys')
          .select('id, title, start_date, end_date, created_at, is_active')
          .eq('company_id', companyId!)
          .order('created_at', { ascending: true });

        if (excludeDemo) {
          query = query.not('title', 'like', '[DEMO]%');
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw new Error(fetchError.message);

        if (!cancelled && data) {
          const mapped: Campaign[] = data.map(s => ({
            id: s.id,
            title: s.title,
            start_date: s.start_date,
            end_date: s.end_date,
            created_at: s.created_at,
            is_active: s.is_active,
            status: computeStatus(s.start_date, s.end_date),
          }));
          setCampaigns(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCampaigns();
    return () => { cancelled = true; };
  }, [companyId, excludeDemo, trigger]);

  const activeCampaign = campaigns.find(c => c.status === 'active') || null;

  return {
    campaigns,
    loading,
    error,
    activeCampaign,
    hasActiveCampaign: activeCampaign !== null,
    refetch: useCallback(() => setTrigger(t => t + 1), []),
  };
}
