import * as Sentry from "@sentry/react";

/**
 * 🔍 OBSERVABILITY MVP - Sentry Configuration
 *
 * Configuration minimale pour error tracking et monitoring.
 * Free tier Sentry permet 5k events/mois - largement suffisant pour démarrer.
 */

export const initSentry = () => {
  // Ne pas initialiser en dev local pour éviter le spam
  if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_FORCE_DEV) {
    console.log('🔍 Sentry disabled in development mode');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️ SENTRY_DSN not configured - Error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // Intégrations essentielles
    integrations: [
      // Performance monitoring
      Sentry.browserTracingIntegration({
        // Tracer les navigations
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/.*\.supabase\.co/,
          /^https:\/\/.*\.vercel\.app/,
        ],
      }),

      // Session replay pour debug visuel
      Sentry.replayIntegration({
        maskAllText: true,  // GDPR compliance
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% des sessions normales
    replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreur

    // Enrichissement automatique des événements
    beforeSend(event, hint) {
      // Ajouter contexte métier
      const error = hint.originalException;

      if (error instanceof Error) {
        // Tag pour faciliter le filtrage
        event.tags = {
          ...event.tags,
          errorBoundary: 'global',
        };
      }

      // Ne pas envoyer les erreurs réseau en dev
      if (import.meta.env.MODE === 'development' && event.exception) {
        console.error('🔍 Sentry would capture:', event);
        return null; // Bloquer l'envoi
      }

      return event;
    },

    // Ignorer les erreurs connues non-critiques
    ignoreErrors: [
      // Erreurs navigateur
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Erreurs extension navigateur
      /chrome-extension:/,
      /moz-extension:/,
    ],
  });

  console.log('✅ Sentry initialized:', import.meta.env.MODE);
};

/**
 * Capturer une erreur auth avec contexte enrichi
 */
export const captureAuthError = (
  error: Error,
  context: {
    email?: string;
    role?: string;
    action: 'signup' | 'signin' | 'signout';
  }
) => {
  Sentry.captureException(error, {
    tags: {
      errorType: 'auth',
      authAction: context.action,
      role: context.role,
    },
    contexts: {
      auth: {
        email: context.email,
        emailDomain: context.email?.split('@')[1],
        action: context.action,
      },
    },
    level: 'error',
  });
};

/**
 * Capturer un événement custom (non-erreur)
 */
export const captureAuthEvent = (
  message: string,
  context: {
    email?: string;
    role?: string;
    action: string;
  }
) => {
  Sentry.captureMessage(message, {
    level: 'info',
    tags: {
      eventType: 'auth',
      authAction: context.action,
      role: context.role,
    },
    contexts: {
      auth: context,
    },
  });
};
