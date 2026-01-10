/**
 * ============================================
 * EMPLOYEE INDICATOR CARDS
 * ============================================
 *
 * 5 cartes d'analyse par indicateur socio-économique
 * pour les salariés d'un département :
 * - Absentéisme
 * - Défauts de Qualité
 * - Accidents de Travail
 * - Écart de Productivité
 * - Écart de Know-How
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle,
  AlertTriangle,
  Zap,
  Clock,
  Target,
  Trophy,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import type { EmployeeData, IndicatorKey } from '../../utils/employeeAnalysis';
import { analyzeEmployeeIndicator } from '../../utils/employeeAnalysis';
import { formatCompactAmount } from '../../utils/indicatorAnalysis';

// ============================================
// TYPES
// ============================================

interface EmployeeIndicatorCardsProps {
  employees: EmployeeData[];
  departmentName: string;
  currency: Currency;
}

// ============================================
// INDICATOR CONFIGS
// ============================================

const INDICATOR_CONFIGS: {
  key: IndicatorKey;
  name: string;
  icon: typeof UserCircle;
  headerBg: string;
  headerBorder: string;
  iconColor: string;
  gradient: string;
}[] = [
  {
    key: 'absenteisme',
    name: 'Absentéisme',
    icon: UserCircle,
    headerBg: 'bg-orange-500/20',
    headerBorder: 'border-orange-500/30',
    iconColor: 'text-orange-400',
    gradient: 'from-orange-900/20 to-orange-950/10'
  },
  {
    key: 'defautsQualite',
    name: 'Défauts de Qualité',
    icon: AlertTriangle,
    headerBg: 'bg-pink-500/20',
    headerBorder: 'border-pink-500/30',
    iconColor: 'text-pink-400',
    gradient: 'from-pink-900/20 to-pink-950/10'
  },
  {
    key: 'accidentsTravail',
    name: 'Accidents de Travail',
    icon: Zap,
    headerBg: 'bg-red-500/20',
    headerBorder: 'border-red-500/30',
    iconColor: 'text-red-400',
    gradient: 'from-red-900/20 to-red-950/10'
  },
  {
    key: 'ecartProductivite',
    name: 'Écart Productivité',
    icon: Clock,
    headerBg: 'bg-cyan-500/20',
    headerBorder: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    gradient: 'from-cyan-900/20 to-cyan-950/10'
  },
  {
    key: 'ecartKnowHow',
    name: 'Écart Know-How',
    icon: Target,
    headerBg: 'bg-purple-500/20',
    headerBorder: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    gradient: 'from-purple-900/20 to-purple-950/10'
  }
];

// ============================================
// INDICATOR CARD COMPONENT
// ============================================

interface IndicatorCardProps {
  config: typeof INDICATOR_CONFIGS[0];
  employees: EmployeeData[];
  currency: Currency;
  delay: number;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({
  config,
  employees,
  currency,
  delay
}) => {
  const currencyConfig = CURRENCY_CONFIG[currency];
  const IconComponent = config.icon;
  const analysis = analyzeEmployeeIndicator(employees, config.key);

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.05 }}
        className={cn(
          "rounded-lg overflow-hidden border",
          config.headerBorder,
          "bg-slate-900/50"
        )}
      >
        <div className={cn("px-3 py-2 flex items-center gap-2", config.headerBg)}>
          <IconComponent className={cn("w-4 h-4", config.iconColor)} />
          <span className="font-bold text-white text-xs">{config.name.toUpperCase()}</span>
        </div>
        <div className="p-3 text-center text-slate-500 text-xs">
          Données non disponibles
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 }}
      className={cn(
        "rounded-lg overflow-hidden border",
        config.headerBorder,
        "bg-gradient-to-br",
        config.gradient,
        "hover:shadow-md transition-shadow"
      )}
    >
      {/* Header */}
      <div className={cn("px-3 py-2 flex items-center gap-2", config.headerBg)}>
        <IconComponent className={cn("w-4 h-4", config.iconColor)} />
        <span className="font-bold text-white text-xs">{config.name.toUpperCase()}</span>
      </div>

      {/* Content - 2 columns */}
      <div className="grid grid-cols-2 divide-x divide-slate-700/50">
        {/* Champion column */}
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">MEILLEURE MAÎTRISE</span>
          </div>
          <p className="text-white font-semibold text-sm mb-1 truncate" title={analysis.best.name}>
            {analysis.best.name}
          </p>
          <p className="text-emerald-400 font-mono font-bold text-base mb-0.5">
            {formatCompactAmount(analysis.best.value, currencyConfig.symbol)}
          </p>
          <p className="text-[10px] text-slate-400">économisés</p>
          {/* Progress bar */}
          <div className="mt-2">
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '100%' }} />
            </div>
            <span className="text-[9px] text-emerald-400 font-medium">100%</span>
          </div>
        </div>

        {/* Alert column */}
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400">ATTENTION REQUISE</span>
          </div>
          <p className="text-white font-semibold text-sm mb-1 truncate" title={analysis.worst.name}>
            {analysis.worst.name}
          </p>
          <p className="text-amber-400 font-mono font-bold text-base mb-0.5">
            {formatCompactAmount(analysis.worst.value, currencyConfig.symbol)}
          </p>
          <p className="text-[10px] text-slate-400">économisés</p>
          {/* Progress bar */}
          <div className="mt-2">
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{ width: `${analysis.worst.percentOfMax}%` }}
              />
            </div>
            <span className="text-[9px] text-amber-400 font-medium">{analysis.worst.percentOfMax}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmployeeIndicatorCards({
  employees,
  departmentName,
  currency
}: EmployeeIndicatorCardsProps) {
  if (employees.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-bold text-white">
          MAÎTRISE DES INDICATEURS - SALARIÉS
        </h3>
        <span className="text-xs text-slate-500">({departmentName})</span>
      </div>

      <div className="space-y-3">
        {INDICATOR_CONFIGS.map((config, index) => (
          <IndicatorCard
            key={config.key}
            config={config}
            employees={employees}
            currency={currency}
            delay={index}
          />
        ))}
      </div>
    </div>
  );
}
