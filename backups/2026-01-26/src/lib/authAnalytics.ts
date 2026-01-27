import { supabase } from '@/integrations/supabase/client';

/**
 * 📊 AUTH ANALYTICS - Track authentication events
 *
 * Permet de tracker tous les événements d'authentification dans Supabase
 * pour avoir de la visibilité sur les taux de succès/échec.
 */

type AuthEventType =
  | 'signup_started'
  | 'signup_success'
  | 'signup_failed'
  | 'signin_started'
  | 'signin_success'
  | 'signin_failed'
  | 'signout';

interface LogAuthEventParams {
  eventType: AuthEventType;
  email?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Log un événement d'authentification dans la table auth_events
 */
export const logAuthEvent = async ({
  eventType,
  email,
  userId,
  metadata = {},
  error,
}: LogAuthEventParams) => {
  try {
    // Ne pas bloquer le flow principal si le logging échoue
    const { error: insertError } = await supabase
      .from('auth_events')
      .insert({
        event_type: eventType,
        email: email || null,
        user_id: userId || null,
        metadata: metadata,
        error_message: error?.message || null,
        error_code: error?.code || null,
        user_agent: navigator.userAgent,
      });

    if (insertError) {
      console.warn('Failed to log auth event:', insertError);
    }
  } catch (err) {
    // Silent fail - ne pas casser l'UX pour du logging
    console.warn('Auth analytics error:', err);
  }
};

/**
 * Récupère le taux de succès signup sur les dernières 24h
 */
export const getSignupSuccessRate = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_signup_success_rate', {
        time_interval: '24 hours',
      });

    if (error) throw error;

    return data?.[0] || null;
  } catch (err) {
    console.error('Failed to get signup success rate:', err);
    return null;
  }
};

/**
 * Récupère les erreurs signup les plus fréquentes
 */
export const getTopSignupErrors = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_top_signup_errors', {
        time_interval: '7 days',
        limit_count: 5,
      });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Failed to get top signup errors:', err);
    return [];
  }
};
