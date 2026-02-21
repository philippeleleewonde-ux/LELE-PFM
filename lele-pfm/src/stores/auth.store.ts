import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  session: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  };

  // Actions
  setUser: (user: User | null) => void;
  setSession: (token: string, refreshToken?: string, expiresAt?: number) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  session: {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  },

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setSession: (token, refreshToken, expiresAt) =>
    set({
      session: {
        accessToken: token,
        refreshToken: refreshToken || null,
        expiresAt: expiresAt || null,
      },
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      session: {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      },
      error: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      session: {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      },
      error: null,
    });
  },

  isTokenExpired: () => {
    const state = get();
    if (!state.session.expiresAt) return false;
    return Date.now() > state.session.expiresAt;
  },
}));
