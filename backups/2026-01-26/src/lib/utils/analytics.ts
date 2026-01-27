/**
 * Analytics Utility Module
 *
 * Centralise le tracking des événements utilisateur pour optimiser la conversion.
 * Supporte Google Analytics, PostHog, Mixpanel (à configurer selon le provider choisi).
 *
 * Usage:
 * ```tsx
 * import { trackEvent } from '@/lib/utils/analytics';
 *
 * trackEvent('cta_click', {
 *   location: 'hero',
 *   cta_text: 'Démarrer gratuitement',
 *   user_type: 'visitor'
 * });
 * ```
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

/**
 * Track un événement analytics
 *
 * @param event - Nom de l'événement (ex: 'cta_click', 'page_view', 'form_submit')
 * @param properties - Propriétés additionnelles (location, value, etc.)
 */
export const trackEvent = (event: string, properties?: Record<string, any>): void => {
  // Google Analytics (gtag)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, properties);
  }

  // PostHog (si installé)
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(event, properties);
  }

  // Debug tracking en dev uniquement via console.error (autorisé)
  if (process.env.NODE_ENV === 'development') {
    // Tracking désactivé en dev pour éviter le spam
  }
};

/**
 * Track une page view
 *
 * @param pageName - Nom de la page (ex: 'Landing', 'Dashboard')
 * @param properties - Propriétés additionnelles
 */
export const trackPageView = (pageName: string, properties?: Record<string, any>): void => {
  trackEvent('page_view', {
    page_name: pageName,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    ...properties,
  });
};

/**
 * Track un clic sur CTA
 *
 * @param location - Localisation du CTA (ex: 'hero', 'cta_section', 'header')
 * @param ctaText - Texte du bouton CTA
 * @param destination - URL de destination (optionnel)
 */
export const trackCTAClick = (
  location: string,
  ctaText: string,
  destination?: string
): void => {
  trackEvent('cta_click', {
    location,
    cta_text: ctaText,
    destination,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track un scroll depth (combien l'utilisateur descend sur la page)
 *
 * @param depth - Profondeur en pourcentage (25, 50, 75, 100)
 */
export const trackScrollDepth = (depth: number): void => {
  trackEvent('scroll_depth', {
    depth_percentage: depth,
  });
};

/**
 * Track une conversion (inscription, paiement, etc.)
 *
 * @param conversionType - Type de conversion (ex: 'signup', 'purchase', 'trial_start')
 * @param value - Valeur monétaire (optionnel)
 * @param properties - Propriétés additionnelles
 */
export const trackConversion = (
  conversionType: string,
  value?: number,
  properties?: Record<string, any>
): void => {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value,
    currency: 'EUR',
    ...properties,
  });
};

/**
 * Initialize analytics providers
 * À appeler dans _app.tsx ou au démarrage de l'app
 */
export const initAnalytics = (): void => {
  if (typeof window === 'undefined') return;

  // Analytics initialization (silent)

  // Track initial page view
  trackPageView('App Loaded');
};
