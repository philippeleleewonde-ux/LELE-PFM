/**
 * ============================================
 * PERFORMANCE CHARTS - VISUALISATIONS
 * ============================================
 *
 * Section avec 2 graphiques côte à côte :
 * 1. Barres horizontales : Objectif vs Réalisé par département
 * 2. Donut : Répartition des contributions
 *
 * Pour la page Centre de Performance Globale
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
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

interface PerformanceChartsGlobalProps {
  departments: DepartmentData[];
  currency: Currency;
}

// ============================================
// COULEURS POUR LES DÉPARTEMENTS
// ============================================

const DEPARTMENT_COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#6366F1', // indigo
  '#84CC16', // lime
  '#F97316'  // orange
];

// ============================================
// CUSTOM TOOLTIP - BAR CHART
// ============================================

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
  currency: Currency;
}

const BarChartTooltip: React.FC<BarTooltipProps> = ({ active, payload, label, currency }) => {
  if (!active || !payload) return null;
  const currencyConfig = CURRENCY_CONFIG[currency];

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M ${currencyConfig.symbol}`;
    }
    return `${value.toLocaleString('fr-FR')} ${currencyConfig.symbol}`;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-white mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">
            {entry.dataKey === 'objectif' ? 'Objectif' : 'Réalisé'}:
          </span>
          <span className="font-semibold text-white">
            {formatValue(entry.value)}
          </span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <span className="text-xs text-slate-400">Taux d'atteinte: </span>
          <span className={cn(
            "text-sm font-bold",
            payload[1].value / payload[0].value >= 0.8 ? "text-emerald-400" :
            payload[1].value / payload[0].value >= 0.5 ? "text-amber-400" : "text-red-400"
          )}>
            {((payload[1].value / payload[0].value) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// CUSTOM TOOLTIP - PIE CHART
// ============================================

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      contribution: number;
    };
  }>;
  currency: Currency;
}

const PieChartTooltip: React.FC<PieTooltipProps> = ({ active, payload, currency }) => {
  if (!active || !payload || payload.length === 0) return null;
  const currencyConfig = CURRENCY_CONFIG[currency];
  const data = payload[0].payload;

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M ${currencyConfig.symbol}`;
    }
    return `${value.toLocaleString('fr-FR')} ${currencyConfig.symbol}`;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-white mb-1">{data.name}</p>
      <p className="text-sm text-slate-400">
        Économies: <span className="text-emerald-400 font-semibold">{formatValue(data.value)}</span>
      </p>
      <p className="text-sm text-slate-400">
        Contribution: <span className="text-cyan-400 font-semibold">{data.contribution.toFixed(1)}%</span>
      </p>
    </div>
  );
};

// ============================================
// CUSTOM LEGEND
// ============================================

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4 px-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-400">
            {entry.value.length > 12 ? entry.value.slice(0, 12) + '...' : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function PerformanceChartsGlobal({
  departments,
  currency
}: PerformanceChartsGlobalProps) {
  const currencyConfig = CURRENCY_CONFIG[currency];

  // Préparer les données pour le bar chart (trié par contribution décroissante)
  const barChartData = [...departments]
    .sort((a, b) => b.contributionPct - a.contributionPct)
    .map(d => ({
      name: d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name,
      fullName: d.name,
      objectif: d.totalObjectif,
      realise: d.totalEconomies,
      tauxAtteinte: d.totalObjectif > 0 ? (d.totalEconomies / d.totalObjectif) * 100 : 0
    }));

  // Préparer les données pour le pie chart
  const totalEconomies = departments.reduce((sum, d) => sum + d.totalEconomies, 0);
  const pieChartData = [...departments]
    .sort((a, b) => b.contributionPct - a.contributionPct)
    .map((d, index) => ({
      name: d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name,
      fullName: d.name,
      value: d.totalEconomies,
      contribution: d.contributionPct,
      color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]
    }));

  // Formatage du total pour le centre du donut
  const formatTotal = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('fr-FR');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Bar Chart - Performance par Département */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "rounded-2xl p-6 overflow-hidden",
          "bg-white/5 dark:bg-slate-800/50",
          "border border-slate-700/50",
          "shadow-lg"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">
            Performance par Département
          </h3>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={100}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <Tooltip content={<BarChartTooltip currency={currency} />} />
              <Bar
                dataKey="objectif"
                fill="rgba(148, 163, 184, 0.4)"
                radius={[0, 4, 4, 0]}
                name="Objectif"
              />
              <Bar
                dataKey="realise"
                fill="#10B981"
                radius={[0, 4, 4, 0]}
                name="Réalisé"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Légende */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-slate-500/40" />
            <span className="text-sm text-slate-400">Objectif</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-sm text-slate-400">Réalisé</span>
          </div>
        </div>
      </motion.div>

      {/* Pie Chart - Répartition des Contributions */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "rounded-2xl p-6 overflow-hidden",
          "bg-white/5 dark:bg-slate-800/50",
          "border border-slate-700/50",
          "shadow-lg"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">
            Répartition des Contributions
          </h3>
        </div>

        <div className="h-[350px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                animationDuration={800}
              >
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="rgba(15, 23, 42, 0.8)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieChartTooltip currency={currency} />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre du donut */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-2xl font-bold text-white">
              {formatTotal(totalEconomies)}
            </p>
            <p className="text-xs text-slate-400">{currencyConfig.symbol}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
