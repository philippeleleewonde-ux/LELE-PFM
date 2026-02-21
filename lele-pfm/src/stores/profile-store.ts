import { create } from 'zustand';
import { Profile } from '@/types';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  
  setProfile: (profile: Profile) => {
    set({ profile, error: null });
  },
  
  clearProfile: () => {
    set({ profile: null, error: null });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
}));
