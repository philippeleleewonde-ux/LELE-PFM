/**
 * Moteur de particules animées pour background dynamique
 * @version 3.1.0 - Canvas transparent + Toggle support
 */

import { PARTICLE_CONFIG, THEME_COLORS, areParticlesEnabled } from './config';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export class ParticleEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId: number = 0;
  private isRunning: boolean = false;
  private width: number = 0;
  private height: number = 0;

  constructor() {
    this.handleResize = this.handleResize.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.animate = this.animate.bind(this);
  }

  /**
   * Initialise le moteur de particules
   */
  public init(): void {
    // Skip if reduced motion is preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.log('🎨 Particles: Skipped (prefers-reduced-motion)');
      return;
    }

    // Skip if disabled by user
    if (!areParticlesEnabled()) {
      console.log('🎨 Particles: Disabled by user preference');
      return;
    }

    this.createCanvas();
    this.setupEventListeners();
    this.start();
  }

  /**
   * Crée le canvas et l'insère dans le DOM
   */
  private createCanvas(): void {
    // Remove existing canvas
    const existing = document.getElementById('particle-bg');
    if (existing) existing.remove();

    // Create new canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particle-bg';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none;
    `;

    document.body.insertBefore(this.canvas, document.body.firstChild);
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) {
      console.error('🎨 Particles: Canvas context failed');
      return;
    }

    this.handleResize();
    this.initParticles();
  }

  /**
   * Configure les event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('particles-toggle', this.handleToggle as EventListener);
  }

  /**
   * Gère le redimensionnement
   */
  private handleResize(): void {
    if (!this.canvas) return;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Réinitialiser les particules au resize
    this.initParticles();
  }

  /**
   * Gère le toggle on/off
   */
  private handleToggle(event: CustomEvent<{ enabled: boolean }>): void {
    if (event.detail.enabled) {
      if (!this.canvas) {
        this.createCanvas();
        this.setupEventListeners();
      }
      this.start();
    } else {
      this.stop();
      if (this.canvas) {
        this.canvas.remove();
        this.canvas = null;
        this.ctx = null;
      }
    }
  }

  /**
   * Initialise les particules
   */
  private initParticles(): void {
    const { density, maxParticles, speed, minSize, maxSize } = PARTICLE_CONFIG;
    const count = Math.min(Math.floor((this.width * this.height) / density), maxParticles);

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * (maxSize - minSize) + minSize,
      });
    }
  }

  /**
   * Démarre l'animation
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
    console.log('✅ Particles: Animation started');
  }

  /**
   * Arrête l'animation
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    console.log('⏹️ Particles: Animation stopped');
  }

  /**
   * Boucle d'animation principale
   */
  private animate(): void {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    const isDark = document.documentElement.classList.contains('dark');
    const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
    const { connectionDistance } = PARTICLE_CONFIG;

    // ✅ CLEAR avec transparence (pas de fillRect opaque!)
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Dessiner les lignes de connexion
    this.ctx.strokeStyle = colors.lineColor;
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          this.ctx.globalAlpha = (1 - dist / connectionDistance) * colors.lineOpacity * 4;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Dessiner et mettre à jour les particules
    this.ctx.fillStyle = colors.particleColor;
    this.ctx.globalAlpha = 1;

    for (const p of this.particles) {
      // Mise à jour position
      p.x += p.vx;
      p.y += p.vy;

      // Rebond sur les bords
      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      // Dessiner la particule
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(this.animate);
  }

  /**
   * Détruit le moteur et nettoie les resources
   */
  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('particles-toggle', this.handleToggle as EventListener);

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }

    this.particles = [];
    console.log('🗑️ Particles: Engine destroyed');
  }
}

// Singleton instance
let engineInstance: ParticleEngine | null = null;

/**
 * Initialise le background de particules (appelé une seule fois au démarrage)
 */
export function initParticleBackground(): void {
  if (engineInstance) return;

  engineInstance = new ParticleEngine();
  engineInstance.init();
}

/**
 * Récupère l'instance du moteur (pour contrôles avancés)
 */
export function getParticleEngine(): ParticleEngine | null {
  return engineInstance;
}
