/**
 * ============================================
 * CIRCULAR GAUGE COMPONENT
 * ============================================
 *
 * Jauge circulaire animée pour afficher la note globale
 * avec couleurs dynamiques par grade et indicateur de tendance.
 *
 * Features:
 * - Animation SVG progressive au chargement
 * - Couleurs dynamiques selon le grade (A→E)
 * - Indicateur de tendance (hausse/baisse) TOUJOURS VISIBLE
 * - Effet de glow PRONONCÉ avec espace suffisant
 * - Messages contextuels COMPLETS par grade
 * - COMPATIBILITÉ LIGHT/DARK MODE
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPerformanceAppreciation } from '@/utils/performanceEvaluation';

// ============================================
// TYPES
// ============================================

interface CircularGaugeProps {
  score: number;           // Score actuel (0-10)
  maxScore?: number;       // Score max (défaut: 10)
  grade: string;           // Grade (A, B, C, D, E)
  previousScore?: number;  // Score précédent pour la tendance (optionnel)
  size?: number;           // Taille en pixels (défaut: 160)
}

// ============================================
// CONSTANTES
// ============================================

// Padding pour l'effet glow (espace autour du cercle)
const GLOW_PADDING = 20;

// ============================================
// COULEURS ADAPTATIVES LIGHT/DARK MODE
// ============================================
// Light mode: teintes dorées/ambre pour plus de chaleur
// Dark mode: teintes néon/vives pour un meilleur contraste
// ============================================

interface GradeColorSet {
  // Couleurs pour mode LIGHT (teintes dorées/chaudes)
  light: { primary: string; glow: string; glowStrong: string };
  // Couleurs pour mode DARK (teintes néon/vives)
  dark: { primary: string; glow: string; glowStrong: string };
  // Classe Tailwind pour le badge (fonctionne dans les 2 modes)
  bg: string;
}

// ============================================
// NOUVEAU DESIGN: Fond slate-800 unifié dans les deux modes
// Les couleurs sont donc les mêmes (néon/vives) car le fond est sombre
// ============================================
const GRADE_COLORS_ADAPTIVE: Record<string, GradeColorSet> = {
  'A': {
    // Émeraude vif pour les excellents grades
    light: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.5)', glowStrong: 'rgba(16, 185, 129, 0.8)' },
    dark: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.5)', glowStrong: 'rgba(16, 185, 129, 0.8)' },
    bg: 'bg-emerald-500'
  },
  'A+': {
    light: { primary: '#059669', glow: 'rgba(5, 150, 105, 0.6)', glowStrong: 'rgba(5, 150, 105, 0.9)' },
    dark: { primary: '#059669', glow: 'rgba(5, 150, 105, 0.6)', glowStrong: 'rgba(5, 150, 105, 0.9)' },
    bg: 'bg-emerald-600'
  },
  'B': {
    // Bleu pour les bons grades
    light: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)', glowStrong: 'rgba(59, 130, 246, 0.8)' },
    dark: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)', glowStrong: 'rgba(59, 130, 246, 0.8)' },
    bg: 'bg-blue-500'
  },
  'B+': {
    light: { primary: '#2563EB', glow: 'rgba(37, 99, 235, 0.6)', glowStrong: 'rgba(37, 99, 235, 0.9)' },
    dark: { primary: '#2563EB', glow: 'rgba(37, 99, 235, 0.6)', glowStrong: 'rgba(37, 99, 235, 0.9)' },
    bg: 'bg-blue-600'
  },
  'C': {
    // Ambre pour les grades moyens
    light: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)', glowStrong: 'rgba(245, 158, 11, 0.8)' },
    dark: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)', glowStrong: 'rgba(245, 158, 11, 0.8)' },
    bg: 'bg-amber-500'
  },
  'C+': {
    light: { primary: '#D97706', glow: 'rgba(217, 119, 6, 0.6)', glowStrong: 'rgba(217, 119, 6, 0.9)' },
    dark: { primary: '#D97706', glow: 'rgba(217, 119, 6, 0.6)', glowStrong: 'rgba(217, 119, 6, 0.9)' },
    bg: 'bg-amber-600'
  },
  'D': {
    // Orange pour les grades faibles
    light: { primary: '#F97316', glow: 'rgba(249, 115, 22, 0.5)', glowStrong: 'rgba(249, 115, 22, 0.8)' },
    dark: { primary: '#F97316', glow: 'rgba(249, 115, 22, 0.5)', glowStrong: 'rgba(249, 115, 22, 0.8)' },
    bg: 'bg-orange-500'
  },
  'D+': {
    light: { primary: '#EA580C', glow: 'rgba(234, 88, 12, 0.6)', glowStrong: 'rgba(234, 88, 12, 0.9)' },
    dark: { primary: '#EA580C', glow: 'rgba(234, 88, 12, 0.6)', glowStrong: 'rgba(234, 88, 12, 0.9)' },
    bg: 'bg-orange-600'
  },
  'E': {
    // Rouge pour les mauvais grades
    light: { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)', glowStrong: 'rgba(239, 68, 68, 0.8)' },
    dark: { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)', glowStrong: 'rgba(239, 68, 68, 0.8)' },
    bg: 'bg-red-500'
  },
  'E+': {
    light: { primary: '#DC2626', glow: 'rgba(220, 38, 38, 0.6)', glowStrong: 'rgba(220, 38, 38, 0.9)' },
    dark: { primary: '#DC2626', glow: 'rgba(220, 38, 38, 0.6)', glowStrong: 'rgba(220, 38, 38, 0.9)' },
    bg: 'bg-red-600'
  }
};

// Ancien format pour rétrocompatibilité (sera utilisé via getGradeColors)
const GRADE_COLORS: Record<string, { primary: string; glow: string; glowStrong: string; bg: string }> = {
  'A': { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.5)', glowStrong: 'rgba(16, 185, 129, 0.8)', bg: 'bg-emerald-500' },
  'A+': { primary: '#059669', glow: 'rgba(5, 150, 105, 0.6)', glowStrong: 'rgba(5, 150, 105, 0.9)', bg: 'bg-emerald-600' },
  'B': { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)', glowStrong: 'rgba(59, 130, 246, 0.8)', bg: 'bg-blue-500' },
  'B+': { primary: '#2563EB', glow: 'rgba(37, 99, 235, 0.6)', glowStrong: 'rgba(37, 99, 235, 0.9)', bg: 'bg-blue-600' },
  'C': { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)', glowStrong: 'rgba(245, 158, 11, 0.8)', bg: 'bg-amber-500' },
  'C+': { primary: '#D97706', glow: 'rgba(217, 119, 6, 0.6)', glowStrong: 'rgba(217, 119, 6, 0.9)', bg: 'bg-amber-600' },
  'D': { primary: '#F97316', glow: 'rgba(249, 115, 22, 0.5)', glowStrong: 'rgba(249, 115, 22, 0.8)', bg: 'bg-orange-500' },
  'D+': { primary: '#EA580C', glow: 'rgba(234, 88, 12, 0.6)', glowStrong: 'rgba(234, 88, 12, 0.9)', bg: 'bg-orange-600' },
  'E': { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)', glowStrong: 'rgba(239, 68, 68, 0.8)', bg: 'bg-red-500' },
  'E+': { primary: '#DC2626', glow: 'rgba(220, 38, 38, 0.6)', glowStrong: 'rgba(220, 38, 38, 0.9)', bg: 'bg-red-600' }
};

// Messages contextuels COMPLETS basés sur l'EFFORT (vocabulaire RH conforme)
// NOTE: Les messages sont désormais générés dynamiquement via getPerformanceAppreciation(score)
// pour assurer la cohérence entre la note et le message affiché.

// Fonction pour obtenir la couleur selon le grade (avec fallback)
// Version legacy sans détection de mode
function getGradeColors(grade: string): { primary: string; glow: string; glowStrong: string; bg: string } {
  if (GRADE_COLORS[grade]) return GRADE_COLORS[grade];
  const baseGrade = grade.charAt(0);
  if (GRADE_COLORS[baseGrade]) return GRADE_COLORS[baseGrade];
  return GRADE_COLORS['C'];
}

// Fonction ADAPTIVE pour obtenir les couleurs selon le grade ET le mode (light/dark)
function getAdaptiveGradeColors(grade: string, isDarkMode: boolean): { primary: string; glow: string; glowStrong: string; bg: string } {
  const colorSet = GRADE_COLORS_ADAPTIVE[grade] || GRADE_COLORS_ADAPTIVE[grade.charAt(0)] || GRADE_COLORS_ADAPTIVE['C'];
  const modeColors = isDarkMode ? colorSet.dark : colorSet.light;
  return {
    ...modeColors,
    bg: colorSet.bg
  };
}

// Fonction pour obtenir le message selon le SCORE (basé sur l'EFFORT, pas les objectifs)
function getGradeMessage(score: number): string {
  const appreciation = getPerformanceAppreciation(score);
  return `${appreciation.label} — ${appreciation.description.split('.')[0]}.`;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function CircularGauge({
  score,
  maxScore = 10,
  grade,
  previousScore,
  size = 160 // Taille du cercle SVG
}: CircularGaugeProps) {
  // État pour l'animation
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  // État pour détecter le mode sombre
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Détection du mode sombre via la classe 'dark' sur <html>
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Vérification initiale
    checkDarkMode();

    // Observer les changements de classe sur <html>
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // Taille totale du conteneur (SVG + padding pour glow)
  const containerSize = size + GLOW_PADDING * 2;

  // Calculs SVG
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Couleurs ADAPTATIVES selon le grade ET le mode (light/dark)
  const colors = getAdaptiveGradeColors(grade, isDarkMode);

  // Calcul du pourcentage et de l'offset
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (animatedScore / maxScore) * 100));
  }, [animatedScore, maxScore]);

  const strokeDashoffset = useMemo(() => {
    return circumference - (percentage / 100) * circumference;
  }, [circumference, percentage]);

  // Calcul de la tendance
  const trend = useMemo(() => {
    if (previousScore === undefined || previousScore === null) {
      return { direction: 'new', value: 0 };
    }
    const diff = score - previousScore;
    if (Math.abs(diff) < 0.1) return { direction: 'stable', value: 0 };
    return {
      direction: diff > 0 ? 'up' : 'down',
      value: Math.abs(diff).toFixed(1)
    };
  }, [score, previousScore]);

  // Animation au montage
  useEffect(() => {
    setAnimatedScore(0);
    setIsAnimating(true);

    const duration = 1500;
    const steps = 60;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedScore(score);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(score * easedProgress);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // ID unique pour les filtres SVG
  const filterId = useMemo(() => `glow-${grade}-${Math.random().toString(36).substr(2, 9)}`, [grade]);
  const gradientId = useMemo(() => `gradient-${grade}-${Math.random().toString(36).substr(2, 9)}`, [grade]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-visible"
      style={{
        width: containerSize,
        minHeight: containerSize + 55, // +55 pour message en bas
        padding: GLOW_PADDING
      }}
    >
      {/* Conteneur SVG avec espace pour le glow */}
      <div
        className="relative overflow-visible"
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0 0 15px ${colors.glow})`
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 overflow-visible"
          style={{ overflow: 'visible' }}
        >
          {/* Définition du glow filter RENFORCÉ */}
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur1" />
              <feGaussianBlur stdDeviation="3" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
              <stop offset="50%" stopColor={colors.primary} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors.glowStrong} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Cercle de fond (track) - COMPATIBLE LIGHT/DARK */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="stroke-slate-300 dark:stroke-slate-600"
            strokeWidth={strokeWidth}
            opacity={0.5}
          />

          {/* Cercle de glow externe (sous le principal) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.glowStrong}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            opacity={0.25}
            style={{
              transition: isAnimating ? 'none' : 'stroke-dashoffset 0.3s ease-out'
            }}
          />

          {/* Cercle de progression principal (animé) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#${filterId})`}
            style={{
              transition: isAnimating ? 'none' : 'stroke-dashoffset 0.3s ease-out'
            }}
          />
        </svg>

        {/* Contenu central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Score avec couleur du grade - LISIBLE EN LIGHT ET DARK */}
          <div className="flex items-baseline">
            <span
              className="font-bold font-serif leading-none"
              style={{
                fontSize: size * 0.24,
                color: colors.primary,
                textShadow: `0 0 15px ${colors.glowStrong}, 0 0 30px ${colors.glow}`
              }}
            >
              {animatedScore.toFixed(1)}
            </span>
            <span
              className="text-slate-500 dark:text-slate-400 font-normal ml-0.5"
              style={{ fontSize: size * 0.1 }}
            >
              /{maxScore}
            </span>
          </div>

          {/* Badge Grade avec GLOW */}
          <div
            className={cn(
              "text-white font-bold rounded px-2 py-0.5 mt-1",
              colors.bg
            )}
            style={{
              fontSize: size * 0.07,
              letterSpacing: '0.12em',
              boxShadow: `0 0 12px ${colors.glow}, 0 2px 4px rgba(0,0,0,0.1)`
            }}
          >
            GRADE {grade}
          </div>

          {/* Indicateur de tendance - TOUJOURS VISIBLE - COMPATIBLE LIGHT/DARK */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full font-semibold",
              trend.direction === 'up' && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700",
              trend.direction === 'down' && "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700",
              trend.direction === 'stable' && "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600",
              trend.direction === 'new' && "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
            )}
            style={{ fontSize: size * 0.055 }}
          >
            {trend.direction === 'up' && (
              <>
                <ArrowUp className="w-3 h-3" strokeWidth={2.5} />
                <span>+{trend.value} pts</span>
              </>
            )}
            {trend.direction === 'down' && (
              <>
                <ArrowDown className="w-3 h-3" strokeWidth={2.5} />
                <span>-{trend.value} pts</span>
              </>
            )}
            {trend.direction === 'stable' && (
              <>
                <Minus className="w-3 h-3" strokeWidth={2.5} />
                <span>Stable</span>
              </>
            )}
            {trend.direction === 'new' && (
              <span>1ère évaluation</span>
            )}
          </div>
        </div>
      </div>

      {/* Message contextuel COMPLET - COMPATIBLE LIGHT/DARK */}
      <div
        className="text-center mt-2 font-medium px-1 leading-tight"
        style={{
          fontSize: size * 0.075,
          color: colors.primary,
          textShadow: `0 0 8px ${colors.glow}`,
          maxWidth: containerSize
        }}
      >
        {getGradeMessage(score)}
      </div>
    </div>
  );
}
