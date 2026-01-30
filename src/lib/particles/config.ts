/**
 * Configuration centralisée pour le background dynamique de particules
 * @version 3.1.0
 */

export interface ParticleConfig {
  /** Densité des particules (pixels² par particule) - plus petit = plus dense */
  density: number;
  /** Nombre maximum de particules */
  maxParticles: number;
  /** Vitesse de déplacement (0.1 - 2.0) */
  speed: number;
  /** Distance maximale de connexion entre particules */
  connectionDistance: number;
  /** Taille minimale des particules */
  minSize: number;
  /** Taille maximale des particules */
  maxSize: number;
}

export interface ThemeColors {
  /** Couleur des particules (rgba ou hex) */
  particleColor: string;
  /** Couleur des lignes de connexion */
  lineColor: string;
  /** Opacité maximale des lignes (0-1) */
  lineOpacity: number;
}

export const PARTICLE_CONFIG: ParticleConfig = {
  density: 12000,
  maxParticles: 100,
  speed: 0.5,
  connectionDistance: 120,
  minSize: 1.5,
  maxSize: 4,
};

export const THEME_COLORS = {
  dark: {
    particleColor: 'rgba(93, 211, 243, 0.9)',    // Cyan brand
    lineColor: 'rgba(93, 211, 243, 0.25)',
    lineOpacity: 0.25,
  } as ThemeColors,
  light: {
    particleColor: 'rgba(10, 47, 79, 0.7)',      // Navy brand
    lineColor: 'rgba(10, 47, 79, 0.15)',
    lineOpacity: 0.15,
  } as ThemeColors,
};

/** Clé localStorage pour persister la préférence utilisateur */
export const PARTICLES_ENABLED_KEY = 'lele-hcm-particles-enabled';

/** Vérifie si les particules sont activées (défaut: true) */
export function areParticlesEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(PARTICLES_ENABLED_KEY);
  return stored === null ? true : stored === 'true';
}

/** Active ou désactive les particules */
export function setParticlesEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PARTICLES_ENABLED_KEY, String(enabled));
  // Dispatch custom event pour notifier le canvas
  window.dispatchEvent(new CustomEvent('particles-toggle', { detail: { enabled } }));
}
