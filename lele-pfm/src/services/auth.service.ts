import { supabase } from '@/infrastructure/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { AuthenticationError, ValidationError } from '@/utils/errors';
import { validateEmail, validatePassword } from '@/utils/validation';

export const authService = {
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new ValidationError(passwordValidation.errors[0]);
      }

      if (!firstName.trim() || !lastName.trim()) {
        throw new ValidationError('First name and last name are required');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        throw new AuthenticationError(error.message);
      }

      if (data.user) {
        useAuthStore.getState().setUser({
          id: data.user.id,
          email: data.user.email || '',
          firstName,
          lastName,
          currency: 'EUR',
          locale: 'fr',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      return { success: false, error: message };
    }
  },

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new AuthenticationError(error.message);
      }

      if (data.session) {
        useAuthStore.getState().setSession(
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_at
        );
      }

      if (data.user) {
        useAuthStore.getState().setUser({
          id: data.user.id,
          email: data.user.email || '',
          firstName: data.user.user_metadata?.first_name || '',
          lastName: data.user.user_metadata?.last_name || '',
          currency: 'EUR',
          locale: 'fr',
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at || data.user.created_at,
        });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      return { success: false, error: message };
    }
  },

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthenticationError(error.message);
      }

      useAuthStore.getState().logout();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      return { success: false, error: message };
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'lele-pfm://reset-password',
      });

      if (error) {
        throw new AuthenticationError(error.message);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: message };
    }
  },

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new ValidationError(passwordValidation.errors[0]);
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new AuthenticationError(error.message);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password update failed';
      return { success: false, error: message };
    }
  },

  async getSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw new AuthenticationError(error.message);
      }

      if (data.session) {
        useAuthStore.getState().setSession(
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_at
        );
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Session retrieval failed';
      return { success: false, error: message };
    }
  },
};
