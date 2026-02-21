/**
 * ============================================
 * EXECUTIVE SUMMARY - KPI CARDS HERO SECTION
 * ============================================
 *
 * Section Hero avec 5 KPI Cards pour la page
 * Centre de Performance Globale et par Indicateurs
 *
 * Destiné aux auditeurs, consultants, banquiers et investisseurs
 * Lecture instantanée des KPIs clés
 *
 * SUPPORT LIGHT/DARK MODE :
 * - Toutes les couleurs utilisent le pattern dark:xxx pour la compatibilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  PiggyBank,
  Target,
  Users,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';

// ============================================
// TYPES
// ============================================

interface DepartmentData {
  id: string;
  name: string;
  employeeCount: number;
  totalObjectif: number;
  totalEconomies: number;
  totalPrevPrime: number;
  totalPrevTreso: number;
  totalRealPrime: number;
  totalRealTreso: number;
  contributionPct: number;
}

interface ExecutiveSummaryGlobalProps {
  departments: DepartmentData[];
  totalEmployees: number;
  fiscalWeek: number;
  fiscalYear: number;
  currency: Currency;
}

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  accentColor: 'cyan' | 'emerald' | 'violet' | 'amber' | 'blue';
  delay?: number;
}

const KPICard: React.FC<KPICardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  accentColor,
  delay = 0
}) => {
  const colorConfig = {
    cyan: {
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-300 dark:border-cyan-500/30',
      bg: 'bg-cyan-100 dark:bg-cyan-500/10'
    },
    emerald: {
      gradient: 'from-emerald-500 to-emerald-600',
      glow: 'shadow-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-300 dark:border-emerald-500/30',
      bg: 'bg-emerald-100 dark:bg-emerald-500/10'
    },
    violet: {
      gradient: 'from-violet-500 to-violet-600',
      glow: 'shadow-violet-500/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-300 dark:border-violet-500/30',
      bg: 'bg-violet-100 dark:bg-violet-500/10'
    },
    amber: {
      gradient: 'from-amber-500 to-amber-600',
      glow: 'shadow-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-500/30',
      bg: 'bg-amber-100 dark:bg-amber-500/10'
    },
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-500/30',
      bg: 'bg-blue-100 dark:bg-blue-500/10'
    }
  };

  const colors = colorConfig[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        "bg-white dark:bg-slate-800/50",
        "backdrop-blur-sm",
        "border",
        colors.border,
        "shadow-lg",
        colors.glow,
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:-translate-y-1",
        "hover:shadow-xl",
        "group"
      )}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute -top-10 -right-10 w-24 h-24",
          "rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity",
          colors.bg
        )}
      />

      {/* Icon - décoratif */}
      <div
        aria-hidden="true"
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
          "bg-gradient-to-br",
          colors.gradient,
          "text-white shadow-md"
        )}
      >
        {icon}
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
        {title}
      </p>

      {/* Value */}
      <p className={cn("text-2xl font-bold", colors.text)}>
        {value}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {subtitle}
        </p>
      )}

      {/* Trend */}
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-sm font-medium",
            trend.direction === 'up' && "text-emerald-600 dark:text-emerald-400",
            trend.direction === 'down' && "text-red-600 dark:text-red-400",
            trend.direction === 'neutral' && "text-slate-500 dark:text-slate-400"
          )}
        >
          {trend.direction === 'up' && <ArrowUpRight className="w-4 h-4" />}
          {trend.direction === 'down' && <ArrowDownRight className="w-4 h-4" />}
          <span>{trend.value}</span>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ExecutiveSummaryGlobal({
  departments,
  totalEmployees,
  fiscalWeek,
  fiscalYear,
  currency
}: ExecutiveSummaryGlobalProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  // Calculs des KPIs
  const totalObjectifs = departments.reduce((sum, d) => sum + d.totalObjectif, 0);
  const totalEconomies = departments.reduce((sum, d) => sum + d.totalEconomies, 0);
  const totalRealTreso = departments.reduce((sum, d) => sum + d.totalRealTreso, 0);
  const tauxAtteinte = totalObjectifs > 0 ? (totalEconomies / totalObjectifs) * 100 : 0;

  // Top département
  const topDept = [...departments].sort((a, b) => b.contributionPct - a.contributionPct)[0];

  // Formatage des montants
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B ${currencyConfig.symbol}`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M ${currencyConfig.symbol}`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K ${currencyConfig.symbol}`;
    }
    return `${amount.toLocaleString('fr-FR')} ${currencyConfig.symbol}`;
  };

  return (
    <motion.section
      role="region"
      aria-label="Résumé exécutif des performances - KPIs clés"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative rounded-2xl p-6 mb-8 overflow-hidden",
        "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900/80 dark:via-slate-800/60 dark:to-slate-900/80",
        "border border-slate-200 dark:border-slate-700/50",
        "shadow-2xl"
      )}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.3) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-3xl opacity-5 dark:opacity-10 bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Executive Summary
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Semaine fiscale S{fiscalWeek} - {fiscalYear}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30">
          <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
            LIVE DATA
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Économies Totales */}
        <KPICard
          icon={<PiggyBank className="w-5 h-5" />}
          title="Économies Totales"
          value={formatAmount(totalEconomies)}
          subtitle="Cette semaine"
          trend={{
            value: 'Objectif en cours',
            direction: tauxAtteinte >= 70 ? 'up' : 'neutral'
          }}
          accentColor="emerald"
          delay={0}
        />

        {/* KPI 2: Taux d'Atteinte */}
        <KPICard
          icon={<Target className="w-5 h-5" />}
          title="Taux d'Atteinte"
          value={`${tauxAtteinte.toFixed(1)}%`}
          subtitle={`Sur ${formatAmount(totalObjectifs)} objectif`}
          trend={{
            value: tauxAtteinte >= 80 ? 'Excellent' : tauxAtteinte >= 60 ? 'Bon' : 'À améliorer',
            direction: tauxAtteinte >= 70 ? 'up' : tauxAtteinte >= 50 ? 'neutral' : 'down'
          }}
          accentColor="cyan"
          delay={1}
        />

        {/* KPI 3: Effectif Total */}
        <KPICard
          icon={<Users className="w-5 h-5" />}
          title="Effectif Total"
          value={`${totalEmployees}`}
          subtitle={`${departments.length} départements`}
          accentColor="violet"
          delay={2}
        />

        {/* KPI 4: Top Département */}
        <KPICard
          icon={<Trophy className="w-5 h-5" />}
          title="Top Département"
          value={topDept?.name?.length > 15 ? topDept?.name?.slice(0, 15) + '...' : topDept?.name || '-'}
          subtitle={`${topDept?.contributionPct?.toFixed(1) || 0}% contribution`}
          trend={{
            value: formatAmount(topDept?.totalEconomies || 0),
            direction: 'up'
          }}
          accentColor="amber"
          delay={3}
        />

        {/* KPI 5: Trésorerie Réalisée */}
        <KPICard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Trésorerie Réalisée"
          value={formatAmount(totalRealTreso)}
          subtitle="Impact financier"
          trend={{
            value: 'Gains confirmés',
            direction: 'up'
          }}
          accentColor="blue"
          delay={4}
        />
      </div>
    </motion.section>
  );
}
