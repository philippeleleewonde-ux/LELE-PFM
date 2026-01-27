// src/modules/module3/components/PerformanceScoreCard.tsx

/**
 * ============================================
 * PERFORMANCE SCORECARD - KPI DASHBOARD
 * ============================================
 *
 * Composant de cartes KPI pour l'onglet Analyses du Bulletin de Performance.
 * Design professionnel pour auditeurs financiers senior.
 *
 * Features:
 * - 4 KPI majeurs en gros caractères
 * - Tendances avec indicateurs visuels
 * - Couleurs dynamiques selon performance
 * - Effet hover professionnel
 * - Compatible Light/Dark mode
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, PiggyBank, Award, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';

// ============================================
// TYPES
// ============================================

interface KPICardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'primary' | 'success' | 'info' | 'warning' | 'danger';
}

interface PerformanceScoreCardProps {
  tauxRealisation: number;        // % d'atteinte des objectifs
  economiesRealisees: number;     // Montant total des économies
  performanceMoyenne: number;     // Note moyenne /10
  ecartBudgetaire: number;        // % d'écart budget/réalisé
  currency?: Currency;
  previousTauxRealisation?: number;
  previousEconomies?: number;
}

// ============================================
// CONSTANTES
// ============================================

const VARIANT_COLORS = {
  primary: {
    border: 'border-t-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500'
  },
  success: {
    border: 'border-t-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'text-emerald-500'
  },
  info: {
    border: 'border-t-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-cyan-500'
  },
  warning: {
    border: 'border-t-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500'
  },
  danger: {
    border: 'border-t-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-500'
  }
};

// ============================================
// COMPOSANT KPI CARD
// ============================================

const KPICard: React.FC<KPICardProps> = ({
  value,
  label,
  icon,
  trend,
  variant = 'primary'
}) => {
  const colors = VARIANT_COLORS[variant];

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-slate-800 rounded-xl p-5",
        "border-t-4 shadow-md hover:shadow-lg transition-all duration-300",
        "hover:-translate-y-1 cursor-default min-h-[160px]",
        "flex flex-col justify-between",
        colors.border
      )}
    >
      {/* Icône en haut à droite */}
      <div className={cn("absolute top-4 right-4 opacity-20", colors.icon)}>
        {icon}
      </div>

      {/* Contenu principal */}
      <div>
        {/* Valeur principale (ÉQUILIBRÉE - 2.25rem / 36px) */}
        <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-mono leading-tight">
          {value}
        </div>

        {/* Label (AGRANDI - 0.9rem / 14.4px) */}
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide leading-snug">
          {label}
        </div>
      </div>

      {/* Tendance (en bas de la carte) - TEXTE MULTI-LIGNES */}
      {trend && (
        <div
          className={cn(
            "flex items-start gap-1.5 text-[13px] font-medium mt-3 pt-3 border-t border-slate-100 dark:border-slate-700",
            trend.direction === 'up' && "text-emerald-600 dark:text-emerald-400",
            trend.direction === 'down' && "text-red-600 dark:text-red-400",
            trend.direction === 'neutral' && "text-slate-500 dark:text-slate-400"
          )}
        >
          {trend.direction === 'up' && <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {trend.direction === 'down' && <TrendingDown className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {trend.direction === 'neutral' && <Minus className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span className="leading-snug">{trend.value}</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPOSANT PRINCIPAL - SCORECARD
// ============================================

export const PerformanceScoreCard: React.FC<PerformanceScoreCardProps> = ({
  tauxRealisation,
  economiesRealisees,
  performanceMoyenne,
  ecartBudgetaire,
  currency = 'EUR',
  previousTauxRealisation,
  previousEconomies
}) => {
  // Calcul des tendances
  const tauxTrend = previousTauxRealisation !== undefined
    ? tauxRealisation - previousTauxRealisation
    : null;

  const ecoTrend = previousEconomies !== undefined && previousEconomies > 0
    ? ((economiesRealisees - previousEconomies) / previousEconomies) * 100
    : null;

  // Déterminer les variants selon les valeurs
  const getTauxVariant = (): 'success' | 'warning' | 'danger' => {
    if (tauxRealisation >= 80) return 'success';
    if (tauxRealisation >= 50) return 'warning';
    return 'danger';
  };

  const getPerfVariant = (): 'success' | 'info' | 'warning' | 'danger' => {
    if (performanceMoyenne >= 8) return 'success';
    if (performanceMoyenne >= 6) return 'info';
    if (performanceMoyenne >= 4) return 'warning';
    return 'danger';
  };

  const getEcartVariant = (): 'success' | 'warning' | 'danger' => {
    if (ecartBudgetaire >= 0) return 'success';
    if (ecartBudgetaire >= -20) return 'warning';
    return 'danger';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* KPI 1 : Taux de réalisation */}
      <KPICard
        value={`${tauxRealisation.toFixed(1)}%`}
        label="Taux de réalisation"
        icon={<Target className="w-10 h-10" />}
        trend={tauxTrend !== null ? {
          value: `${tauxTrend >= 0 ? '+' : ''}${tauxTrend.toFixed(1)}% vs période N-1`,
          direction: tauxTrend > 0 ? 'up' : tauxTrend < 0 ? 'down' : 'neutral'
        } : {
          value: tauxRealisation >= 80 ? 'Performance solide' : 'À améliorer',
          direction: tauxRealisation >= 80 ? 'up' : 'down'
        }}
        variant={getTauxVariant()}
      />

      {/* KPI 2 : Économies réalisées */}
      <KPICard
        value={formatCurrency(economiesRealisees, currency)}
        label="Économies réalisées"
        icon={<PiggyBank className="w-10 h-10" />}
        trend={ecoTrend !== null ? {
          value: `${ecoTrend >= 0 ? '+' : ''}${ecoTrend.toFixed(1)}% vs objectif`,
          direction: ecoTrend > 0 ? 'up' : ecoTrend < 0 ? 'down' : 'neutral'
        } : {
          value: economiesRealisees > 0 ? 'Contribution positive' : 'Aucune économie',
          direction: economiesRealisees > 0 ? 'up' : 'neutral'
        }}
        variant="success"
      />

      {/* KPI 3 : Performance moyenne */}
      <KPICard
        value={`${performanceMoyenne.toFixed(1)}/10`}
        label="Note globale"
        icon={<Award className="w-10 h-10" />}
        trend={{
          value: performanceMoyenne >= 7 ? 'Au-dessus de la moyenne' : performanceMoyenne >= 5 ? 'Dans la moyenne' : 'Sous la moyenne',
          direction: performanceMoyenne >= 7 ? 'up' : performanceMoyenne >= 5 ? 'neutral' : 'down'
        }}
        variant={getPerfVariant()}
      />

      {/* KPI 4 : Écart budgétaire */}
      <KPICard
        value={`${ecartBudgetaire >= 0 ? '+' : ''}${ecartBudgetaire.toFixed(0)}%`}
        label="Écart budget/réalisé"
        icon={<AlertTriangle className="w-10 h-10" />}
        trend={{
          value: ecartBudgetaire >= 0 ? 'Objectif dépassé' : `Écart à combler`,
          direction: ecartBudgetaire >= 0 ? 'up' : 'down'
        }}
        variant={getEcartVariant()}
      />
    </div>
  );
};

export default PerformanceScoreCard;
