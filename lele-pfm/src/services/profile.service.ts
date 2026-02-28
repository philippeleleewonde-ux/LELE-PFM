import { supabase } from '@/infrastructure/supabase/client';
import { Profile } from '@/types/database';
import { useAuthStore } from '@/stores/auth.store';
import { withTimeout } from '@/utils/timeout';

export const profileService = {
  async getProfile(): Promise<{ success: boolean; data?: Profile; error?: string }> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await withTimeout(supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single());

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Profile };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      return { success: false, error: message };
    }
  },

  async createProfile(
    profileData: Partial<Profile>
  ): Promise<{ success: boolean; data?: Profile; error?: string }> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await withTimeout(supabase
        .from('profiles')
        .insert({
          user_id: userId,
          profile_type: profileData.profile_type || 'Salarié',
          situation: profileData.situation || '',
          budget_period: profileData.budget_period || 0,
          weekly_target_epr: profileData.weekly_target_epr || 0,
          incompressibility_rate: profileData.incompressibility_rate || 0,
          flexibility_score: profileData.flexibility_score || 50,
          dependents: profileData.dependents || 0,
          experience_years: profileData.experience_years || 0,
          age: profileData.age || 25,
          risk_profile: profileData.risk_profile || 'Modéré',
        })
        .select()
        .single());

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Profile };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create profile';
      return { success: false, error: message };
    }
  },

  async updateProfile(
    updates: Partial<Profile>
  ): Promise<{ success: boolean; data?: Profile; error?: string }> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await withTimeout(supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single());

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Profile };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      return { success: false, error: message };
    }
  },
};
