/**
 * ============================================
 * HCM COST SAVINGS - DATA ALIGNMENT PAGE
 * ============================================
 *
 * Interface 2 basée sur la feuille Excel: "2-Tri-TB Fixe-Données Risko M1"
 *
 * OBJECTIF:
 * Calculer le PPR (Pertes Potentiellement Récouvrables) par salarié et par indicateur
 *
 * STRUCTURE:
 * - Affichage par LIGNE D'ACTIVITÉ (L1 à L8)
 * - À l'intérieur de chaque ligne: les SALARIÉS avec leurs PPR/PERS
 *
 * FORMULE PPR/PERS (extraite de l'Excel):
 * ═══════════════════════════════════════════════════════════════════
 * PPR/PERS (indicateur) = (PPR_trimestre × indicator_rate × budget_rate) / nb_salariés / sales_N1
 *
 * Où:
 * - PPR_trimestre = gainsN1 / 4 (gains prévus N+1 divisés par 4 trimestres)
 * - indicator_rate = taux relatif de l'indicateur (Page 14 - Distribution)
 * - budget_rate = budget_ligne / budget_total (pondération par ligne)
 * - nb_salariés = nombre de salariés dans la ligne d'activité
 * - sales_N1 = chiffre d'affaires N-1 (Financial History)
 * ═══════════════════════════════════════════════════════════════════
 *
 * INDICATEURS (5):
 * - ABS: Absentéisme (Gestion du temps)
 * - DFQ: Défauts Qualité (Organisation du travail)
 * - ADT: Accidents du Travail (Conditions de travail)
 * - EPD: Écarts de Productivité Directe (Stratégie)
 * - EKH: Écarts de Know-How (Formation/3C)
 *
 * DONNÉES TRANSFÉRÉES:
 * - Volume Horaire N-1 (Annual Hours per Person)
 * - Sales/Turnover N-1 (depuis Financial History)
 * - Total Spending N-1 (depuis Financial History)
 * - PPR PRÉVU/PERS par indicateur pour chaque ligne (T1/N+1)
 *
 * SOURCES:
 * - Données salarié: Page précédente (AnalysisConfigurationPage)
 * - Données M1: HCM Performance Plan → Page 3 → Financial History
 * - PPR PRÉVU/PERS: HCM Performance Plan → Page 14 → Distribution T1
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
// Smart Calendar Integration
import { getLastCompletedWeek, type LastCompletedWeekResult } from '@/lib/fiscal/LaunchDateService';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Users,
  Building2,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Layers,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Calculator,
  Workflow,
  FileSpreadsheet,
  User,
  Bot,
  Cpu,
  UserCircle,
  Home,
  Calendar
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { formatCurrency as formatCurrencyM1, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';

// ============================================
// TYPES
// ============================================

interface TeamMember {
  id: string;
  name: string;
  professional_category: string;
  tech_level: string;
  handicap_shape: string;
  incapacity_rate: number;
  versatility_f1: string;
  versatility_f2: string;
  versatility_f3: string;
  business_line_id: string;
}

interface BusinessLine {
  id: string;
  name: string;
  description: string;
  team_count: number;
  team_leader: string | null;
  team_mission: string | null;
  budget?: number;
  budget_rate?: number;
  staff_count?: number;
  members: TeamMember[];
}

interface M1Data {
  annualHoursPerPerson: number;
  salesTurnoverN1: number;   // En k€ (milliers) - EXACTEMENT comme dans Module 1
  totalSpendingN1: number;   // En k€ (milliers) - EXACTEMENT comme dans Module 1
}

interface PPRIndicators {
  // PPR PRÉVU/PERS = Pertes Potentiellement Récouvrables par personne
  // Valeurs en k€ (milliers) - transférées depuis Page 14 HCM Performance Plan
  abs: number; // Absentéisme (k€)
  dfq: number; // Défauts Qualité (k€)
  adt: number; // Accidents du Travail (k€)
  epd: number; // Écarts de Productivité Directe (k€)
  ekh: number; // Écarts de Know-How (k€)
}

// ============================================
// INDICATOR CONFIGURATION
// ============================================

const INDICATORS = [
  { id: 'abs', label: 'Absentéisme', shortLabel: 'ABS', color: 'yellow', domain: 'Gestion du temps' },
  { id: 'dfq', label: 'Défauts Qualité', shortLabel: 'DFQ', color: 'purple', domain: 'Organisation du travail' },
  { id: 'adt', label: 'Accidents du Travail', shortLabel: 'ADT', color: 'red', domain: 'Conditions de travail' },
  { id: 'epd', label: 'Productivité Directe', shortLabel: 'EPD', color: 'blue', domain: 'Mise en œuvre stratégique' },
  { id: 'ekh', label: 'Écarts Know-How', shortLabel: 'EKH', color: 'green', domain: 'Formation intégrée et 3C' }
];

const getIndicatorColor = (id: string) => {
  const indicator = INDICATORS.find(i => i.id === id);
  switch (indicator?.color) {
    case 'yellow': return 'from-yellow-500 to-amber-600';
    case 'purple': return 'from-purple-500 to-pink-600';
    case 'red': return 'from-red-500 to-rose-600';
    case 'blue': return 'from-blue-500 to-cyan-600';
    case 'green': return 'from-green-500 to-emerald-600';
    default: return 'from-gray-500 to-slate-600';
  }
};

const getIndicatorBadgeColor = (id: string) => {
  const indicator = INDICATORS.find(i => i.id === id);
  switch (indicator?.color) {
    case 'yellow': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'purple': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
    case 'red': return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'blue': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'green': return 'bg-green-500/10 text-green-600 border-green-500/30';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format currency in thousands (k€) - EXACT same display as Module 1
// NO CONVERSION - values are stored and displayed in k€
const createKCurrencyFormatter = (currency: Currency = 'EUR') => {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR;
  return (value: number) => {
    if (isNaN(value) || value === 0) return `0 k${config.symbol}`;
    const formattedNumber = value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return `${formattedNumber} k${config.symbol}`;
  };
};

// Format PPR values in k€ with decimals (PPR/PERS can be small values like 0.23 k€)
const createPPRFormatter = (currency: Currency = 'EUR') => {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR;
  return (value: number) => {
    if (isNaN(value) || value === 0) return `0.00 k${config.symbol}`;
    // Show 2 decimals for small PPR values
    const formattedNumber = value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formattedNumber} k${config.symbol}`;
  };
};

const formatNumber = (value: number, decimals: number = 2) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

const getTechIcon = (techLevel: string) => {
  switch (techLevel) {
    case 'IA': return <Bot className="w-4 h-4" />;
    case 'Cobot': return <Cpu className="w-4 h-4" />;
    case 'Autonomous': return <Zap className="w-4 h-4" />;
    default: return <User className="w-4 h-4" />;
  }
};

const getTechColor = (techLevel: string) => {
  switch (techLevel) {
    case 'IA': return 'from-purple-500 to-pink-500';
    case 'Cobot': return 'from-blue-500 to-cyan-500';
    case 'Autonomous': return 'from-orange-500 to-red-500';
    default: return 'from-gray-400 to-gray-500';
  }
};

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  gradient: string;
  delay?: number;
}

function StatCard({ icon, label, value, subValue, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
        "bg-gradient-to-br",
        gradient
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 mb-1">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
              {subValue && (
                <p className="text-xs text-white/60 mt-1">{subValue}</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// BUSINESS LINE CARD COMPONENT
// ============================================

interface BusinessLineCardProps {
  businessLine: BusinessLine;
  lineIndex: number;
  m1Data: M1Data;
  pprIndicators: PPRIndicators;
  isExpanded: boolean;
  onToggle: () => void;
  formatKCurrency: (value: number) => string;  // For Sales/Spending (ex: "50 000 k€")
  formatPPR: (value: number) => string;        // For PPR values (ex: "0,23 k€")
}

function BusinessLineCard({
  businessLine,
  lineIndex,
  m1Data,
  pprIndicators,
  isExpanded,
  onToggle,
  formatKCurrency,
  formatPPR
}: BusinessLineCardProps) {
  // Total PPR per person for this line (sum of all indicators, in k€)
  const totalPPR = pprIndicators.abs + pprIndicators.dfq +
                   pprIndicators.adt + pprIndicators.epd +
                   pprIndicators.ekh;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: lineIndex * 0.1 }}
    >
      <Card className={cn(
        "overflow-hidden border-2 transition-all duration-500",
        isExpanded
          ? "border-purple-500/50 shadow-2xl shadow-purple-500/20"
          : "border-border hover:border-purple-500/30 hover:shadow-lg"
      )}>
        {/* Header - Business Line Info */}
        <CardHeader
          className={cn(
            "cursor-pointer transition-all duration-300",
            "bg-gradient-to-r from-slate-900/5 via-purple-500/10 to-cyan-500/5",
            "dark:from-slate-900/50 dark:via-purple-500/20 dark:to-cyan-500/10",
            "border-b-2",
            isExpanded ? "border-purple-500/50" : "border-transparent"
          )}
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            {/* Left: Business Line Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-600 shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {lineIndex + 1}
                </div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {businessLine.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {businessLine.members.length} employés
                  </span>
                  {businessLine.team_leader && (
                    <span className="flex items-center gap-1">
                      <UserCircle className="w-3 h-3" />
                      {businessLine.team_leader}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            {/* Right: M1 Data Summary + Expand Button */}
            <div className="flex items-center gap-4">
              {/* Quick Stats Badges */}
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatNumber(m1Data.annualHoursPerPerson, 0)}h
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {formatKCurrency(m1Data.salesTurnoverN1)}
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                  <Target className="w-3 h-3 mr-1" />
                  {formatPPR(totalPPR)}
                </Badge>
              </div>

              {/* Expand Button */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full transition-all duration-300",
                  isExpanded
                    ? "bg-purple-500/20 text-purple-600"
                    : "hover:bg-purple-500/10"
                )}
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <CardContent className="p-6 space-y-6">
                {/* M1 Data Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    Données M1 - Provenant de HCM Performance Plan (Page 3)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                          Annual Hours per Person
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatNumber(m1Data.annualHoursPerPerson, 0)} h
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-500 dark:text-green-400 font-medium">
                          Sales/Turnover N-1
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatKCurrency(m1Data.salesTurnoverN1)}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                          Total Spending N-1
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatKCurrency(m1Data.totalSpendingN1)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PPR Indicators Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    PPR PRÉVU/PERS - Ligne {lineIndex + 1} (Trimestre 1 / N+1)
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {INDICATORS.map(indicator => {
                      const value = pprIndicators[indicator.id as keyof PPRIndicators];
                      return (
                        <TooltipProvider key={indicator.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "px-4 py-3 rounded-xl border-2 transition-all hover:scale-105",
                                getIndicatorBadgeColor(indicator.id)
                              )}>
                                <div className="text-xs font-bold mb-1">{indicator.shortLabel}</div>
                                <div className="text-lg font-mono font-bold">
                                  {formatPPR(value)}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">{indicator.label}</p>
                              <p className="text-xs text-muted-foreground">{indicator.domain}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    {/* Total PPR */}
                    <div className="px-4 py-3 rounded-xl border-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/40">
                      <div className="text-xs font-bold mb-1 text-purple-600 dark:text-purple-400">TOTAL</div>
                      <div className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                        {formatPPR(totalPPR)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employees Table with PPR/PERS */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-500" />
                    Salariés de la ligne ({businessLine.members.length}) — PPR PRÉVU/PERS (Trimestre 1 / N+1)
                  </h4>
                  <div className="rounded-xl border-2 border-cyan-500/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          {/* First header row - Categories */}
                          <tr className="bg-gradient-to-r from-slate-900/10 to-purple-500/10 dark:from-slate-900/50 dark:to-purple-500/20">
                            <th colSpan={5} className="py-2 px-4 text-xs font-semibold text-foreground border-b border-border/30">
                              Informations Salarié
                            </th>
                            <th colSpan={3} className="py-2 px-4 text-xs font-semibold text-blue-600 dark:text-blue-400 border-b border-border/30 border-l border-border/20">
                              Données M1
                            </th>
                            <th colSpan={5} className="py-2 px-4 text-xs font-semibold text-purple-600 dark:text-purple-400 border-b border-border/30 border-l border-border/20">
                              PPR PRÉVU/PERS — Ligne {lineIndex + 1} (T1/N+1)
                            </th>
                          </tr>
                          {/* Second header row - Column names */}
                          <tr className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                            <th className="text-left py-3 px-3 text-xs font-semibold text-foreground">#</th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-foreground">Nom</th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-foreground">Catégorie</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold text-foreground">Tech</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold text-foreground">Inc.%</th>
                            {/* M1 Data */}
                            <th className="text-center py-3 px-3 text-xs font-semibold text-blue-600 dark:text-blue-400 border-l border-border/20">Vol.H</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-green-600 dark:text-green-400">Sales</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-red-600 dark:text-red-400">Spend</th>
                            {/* PPR Indicators */}
                            <th className="text-center py-3 px-2 text-xs font-bold text-yellow-600 dark:text-yellow-400 border-l border-border/20">ABS</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-purple-600 dark:text-purple-400">DFQ</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-red-600 dark:text-red-400">ADT</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-blue-600 dark:text-blue-400">EPD</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-green-600 dark:text-green-400">EKH</th>
                          </tr>
                        </thead>
                        <tbody>
                          {businessLine.members.map((member, idx) => (
                            <motion.tr
                              key={member.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={cn(
                                "border-b border-border/50 transition-colors",
                                "hover:bg-cyan-500/5",
                                idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                              )}
                            >
                              <td className="py-3 px-3 font-mono text-sm text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "p-1.5 rounded-lg",
                                    `bg-gradient-to-br ${getTechColor(member.tech_level)}`
                                  )}>
                                    {getTechIcon(member.tech_level)}
                                  </div>
                                  <span className="font-medium text-foreground text-sm whitespace-nowrap">
                                    {member.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  {member.professional_category}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  member.tech_level === 'IA' ? "bg-purple-500/10 text-purple-600 border-purple-500/30" :
                                  member.tech_level === 'Cobot' ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                                  member.tech_level === 'Autonomous' ? "bg-orange-500/10 text-orange-600 border-orange-500/30" :
                                  "bg-gray-500/10 text-gray-600 border-gray-500/30"
                                )}>
                                  {member.tech_level || 'Std'}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-mono text-xs",
                                    member.incapacity_rate > 50
                                      ? "bg-red-500/10 text-red-600 border-red-500/30"
                                      : member.incapacity_rate > 20
                                        ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
                                        : "bg-green-500/10 text-green-600 border-green-500/30"
                                  )}
                                >
                                  {member.incapacity_rate}%
                                </Badge>
                              </td>
                              {/* M1 Data Columns */}
                              <td className="py-3 px-3 text-center font-mono text-xs text-blue-600 dark:text-blue-400 border-l border-border/20">
                                {formatNumber(m1Data.annualHoursPerPerson, 0)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-xs text-green-600 dark:text-green-400">
                                {formatKCurrency(m1Data.salesTurnoverN1)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-xs text-red-600 dark:text-red-400">
                                {formatKCurrency(m1Data.totalSpendingN1)}
                              </td>
                              {/* PPR/PERS Columns - Per Employee Per Indicator (in k€) */}
                              <td className="py-3 px-2 text-center border-l border-border/20">
                                <span className="font-mono text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                                  {formatPPR(pprIndicators.abs)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                                  {formatPPR(pprIndicators.dfq)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-mono text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                  {formatPPR(pprIndicators.adt)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                  {formatPPR(pprIndicators.epd)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="font-mono text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">
                                  {formatPPR(pprIndicators.ekh)}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                        {/* Footer with totals */}
                        <tfoot>
                          <tr className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-t-2 border-purple-500/30">
                            <td colSpan={8} className="py-3 px-3 text-right text-xs font-bold text-foreground">
                              TOTAL PPR/PERS Ligne {lineIndex + 1}:
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="font-mono text-xs font-bold text-yellow-600 dark:text-yellow-400">
                                {formatPPR(pprIndicators.abs)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                                {formatPPR(pprIndicators.dfq)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                {formatPPR(pprIndicators.adt)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                {formatPPR(pprIndicators.epd)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="font-mono text-xs font-bold text-green-600 dark:text-green-400">
                                {formatPPR(pprIndicators.ekh)}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DataAlignmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId, isLoading: isCompanyLoading } = useCompany();

  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [m1Data, setM1Data] = useState<M1Data | null>(null);
  const [pprDataByLine, setPprDataByLine] = useState<Record<string, PPRIndicators>>({});
  const [loading, setLoading] = useState(true);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('EUR');

  // Smart Calendar State - Dernière semaine complétée
  const [lastCompletedWeek, setLastCompletedWeek] = useState<LastCompletedWeekResult | null>(null);

  // Create currency formatters based on selected currency
  // formatKCurrency: for Sales/Spending (ex: "50 000 k€")
  // formatPPR: for PPR/PERS values with decimals (ex: "0,23 k€")
  const formatKCurrency = useMemo(() => createKCurrencyFormatter(selectedCurrency), [selectedCurrency]);
  const formatPPR = useMemo(() => createPPRFormatter(selectedCurrency), [selectedCurrency]);

  // Fetch all data
  useEffect(() => {
    // Guard: wait for companyId to be available
    if (!user || isCompanyLoading || !companyId) {
      return;
    }

    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setLoading(true);

        // 0. Load DERNIÈRE SEMAINE COMPLÉTÉE (avec données)
        const completedWeek = await getLastCompletedWeek(companyId);
        if (completedWeek) {
          setLastCompletedWeek(completedWeek);
          console.log('[DataAlignmentPage] ✅ Last completed week:', completedWeek.periodLabel);
        }

        // 1. Fetch business lines with members
        const { data: businessLinesData, error: blError } = await supabase
          .from('business_lines')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });

        if (!isMounted) return;
        if (blError) throw blError;

        // 2. Fetch team members for each business line
        const businessLinesWithMembers: BusinessLine[] = await Promise.all(
          (businessLinesData || []).map(async (bl, index) => {
            if (!isMounted) return null;

            const { data: membersData } = await supabase
              .from('module3_team_members')
              .select('*')
              .eq('business_line_id', bl.id)
              .order('created_at', { ascending: true });

            return {
              id: bl.id,
              name: bl.activity_name || bl.name || `Ligne d'activité ${index + 1}`,
              description: bl.description || '',
              team_count: bl.team_count || 0,
              team_leader: bl.team_leader || null,
              team_mission: bl.team_mission || null,
              budget: bl.budget || 0,
              budget_rate: bl.budget_rate || 0,
              staff_count: bl.staff_count || membersData?.length || 0,
              members: membersData || []
            };
          })
        );

        if (!isMounted) return;

        // Filter out null values
        const validBusinessLines = businessLinesWithMembers.filter((bl): bl is BusinessLine => bl !== null);
        setBusinessLines(validBusinessLines);

        // Auto-expand first line if only one or two
        if (validBusinessLines.length <= 2) {
          setExpandedLines(new Set(validBusinessLines.map(bl => bl.id)));
        }

        // 3. Fetch M1 Data from HCM Performance Plan (company_performance_scores.factors)
        // Source: Page 3 - "Provide data to be treated to schedule and program employee engagement accounts (EE)"

        if (!isMounted) return;

        let m1DataFound = false;

        // Use companyId directly (already available from context)
        // Fetch from company_performance_scores.factors (where Module 1 data is stored)
        const { data: scoreData } = await supabase
          .from('company_performance_scores')
          .select('factors')
          .eq('company_id', companyId)
          .eq('module_number', 1)
          .order('calculation_date', { ascending: false })
          .limit(1)
          .single();

        if (!isMounted) return;

        if (scoreData?.factors) {
          const factors = scoreData.factors as any;
          m1DataFound = true;

          // Extract selected currency from Module 1
          const currency = factors.selectedCurrency || 'EUR';
          setSelectedCurrency(currency as Currency);

          // Extract Financial History for N-1
          // Structure: factors.employeeEngagement.financialHistory = [{ year: 'N-1', sales: ..., spending: ... }, ...]
          const financialHistory = factors.employeeEngagement?.financialHistory || [];
          const n1Data = financialHistory.find((f: any) => f.year === 'N-1') || financialHistory[0] || {};

          // Values are stored in k€ (thousands) in Module 1
          // Keep them in k€ for storage, the formatter will handle display
          const salesK = n1Data.sales || 0;
          const spendingK = n1Data.spending || 0;

          const extractedM1Data: M1Data = {
            annualHoursPerPerson: factors.employeeEngagement?.annualHoursPerPerson || 0,
            salesTurnoverN1: salesK, // Keep in k€
            totalSpendingN1: spendingK // Keep in k€
          };

          setM1Data(extractedM1Data);

          // 4. Calculate PPR indicators from module1 calculated fields
          // Source: Page 14 - Priority Actions N+1 - Distribution by business line (TRIMESTRE 1)
          // FORMULA EXACTLY AS IN PAGE 14:
          //   perLine = pprN1 * (indicator.rate / 100) * lineBudgetRate
          //   perPerson = perLine / lineStaffCount
          // Result is in k€ (NOT percentage!)

          const calculated = factors.calculatedFields || {};
          const pprN1 = calculated.gainsN1 || 0; // Total gains N+1 in k€
          const quarterPPR = pprN1 / 4; // Trimestre 1 (in k€) - Division par 4 pour avoir T1

          // Get indicator rates from Page 14 calculations (as percentages 0-100)
          const indicatorRates = {
            abs: calculated.indicator_absenteeism_rate || 20, // Already in %
            dfq: calculated.indicator_quality_rate || 20,
            adt: calculated.indicator_accidents_rate || 20,
            epd: calculated.indicator_productivity_rate || 20,
            ekh: calculated.indicator_knowhow_rate || 20
          };

          // Use business lines from Module 1 (factors.businessLines) for budget calculation
          const m1BusinessLines = factors.businessLines || [];
          const totalBudget = m1BusinessLines.reduce((sum: number, line: any) => sum + (line.budget || 0), 0);

          // Generate PPR data for each business line (matching by name)
          const pprByLine: Record<string, PPRIndicators> = {};

          businessLinesWithMembers.forEach((bl) => {
            // Find corresponding M1 business line by name
            const m1Line = m1BusinessLines.find((m1bl: any) =>
              m1bl.activityName === bl.name ||
              m1bl.activityName === bl.name.replace(/^Ligne d'activité \d+ - /, '')
            );

            // Calculate budget rate from M1 business line or distribute evenly
            const lineBudget = m1Line?.budget || bl.budget || 0;
            const lineBudgetRate = totalBudget > 0
              ? lineBudget / totalBudget
              : 1 / Math.max(businessLinesWithMembers.length, 1);

            // Staff count from M1 or from module3 members
            const lineStaffCount = m1Line?.staffCount || bl.members.length || 1;

            // PPR/PERS formula EXACTLY as Page 14:
            // perPerson = (quarterPPR * (rate/100) * lineBudgetRate) / lineStaffCount
            // Result is in k€
            pprByLine[bl.id] = {
              abs: (quarterPPR * (indicatorRates.abs / 100) * lineBudgetRate) / lineStaffCount,
              dfq: (quarterPPR * (indicatorRates.dfq / 100) * lineBudgetRate) / lineStaffCount,
              adt: (quarterPPR * (indicatorRates.adt / 100) * lineBudgetRate) / lineStaffCount,
              epd: (quarterPPR * (indicatorRates.epd / 100) * lineBudgetRate) / lineStaffCount,
              ekh: (quarterPPR * (indicatorRates.ekh / 100) * lineBudgetRate) / lineStaffCount
            };
          });

          setPprDataByLine(pprByLine);

          }

        if (!isMounted) return;

        if (!m1DataFound) {
          // Default M1 data if not found
          setM1Data({
            annualHoursPerPerson: 1820, // Default annual hours
            salesTurnoverN1: 0,
            totalSpendingN1: 0
          });
          toast.warning("Données Financial History non trouvées. Veuillez compléter HCM Performance Plan - Page 3.");
        }

      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching data:', err);
        toast.error("Erreur lors du chargement des données");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [user, isCompanyLoading, companyId]);

  const toggleBusinessLine = (id: string) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLines(new Set(businessLines.map(bl => bl.id)));
  };

  const collapseAll = () => {
    setExpandedLines(new Set());
  };

  // Statistics
  const totalEmployees = businessLines.reduce((sum, bl) => sum + bl.members.length, 0);
  const totalBusinessLines = businessLines.length;

  if (loading || isCompanyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <HCMLoader text="Alignement des données en cours..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
            <FileSpreadsheet className="w-4 h-4 text-purple-500 animate-pulse" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Interface 2 - Feuille: 2-Tri-TB Fixe-Données Risko M1
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            Alignement des Données par Ligne d'Activité
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Données M1 + PPR PRÉVU/PERS par indicateur - Trimestre 1 / N+1
          </p>

          {/* Smart Calendar Period Indicator - Dernière semaine complétée */}
          {lastCompletedWeek && (
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm",
              lastCompletedWeek.hasData
                ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                : "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30"
            )}>
              <Calendar className={cn("w-4 h-4", lastCompletedWeek.hasData ? "text-green-500" : "text-orange-500")} />
              <span className={cn(
                "text-sm font-semibold",
                lastCompletedWeek.hasData ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
              )}>
                Semaine {lastCompletedWeek.weekNumber} — {lastCompletedWeek.fiscalYear}
              </span>
              <span className="text-xs text-muted-foreground">
                ({lastCompletedWeek.weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - {lastCompletedWeek.weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })})
              </span>
              {!lastCompletedWeek.hasData && (
                <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-600 border-orange-500/30">
                  Aucune donnée
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
              <Clock className="w-3 h-3 mr-1" />
              Annual Hours per Person
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Sales/Turnover N-1
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
              <TrendingDown className="w-3 h-3 mr-1" />
              Total Spending N-1
            </Badge>
          </div>

          {/* Bouton Retour Menu Principal */}
          <Button
            onClick={() => navigate('/modules/module3')}
            variant="outline"
            className="mt-4 gap-2 border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            <Home className="w-4 h-4" />
            Retour menu principal
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="w-6 h-6 text-white" />}
            label="Lignes d'Activité"
            value={totalBusinessLines}
            subValue={`${totalEmployees} salariés au total`}
            gradient="from-purple-600 to-pink-700"
            delay={0.1}
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-white" />}
            label="Annual Hours/Person"
            value={formatNumber(m1Data?.annualHoursPerPerson || 0, 0)}
            subValue="Volume horaire N-1"
            gradient="from-blue-600 to-cyan-700"
            delay={0.2}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            label="Sales/Turnover N-1"
            value={formatKCurrency(m1Data?.salesTurnoverN1 || 0)}
            subValue="Financial History"
            gradient="from-green-600 to-emerald-700"
            delay={0.3}
          />
          <StatCard
            icon={<TrendingDown className="w-6 h-6 text-white" />}
            label="Total Spending N-1"
            value={formatKCurrency(m1Data?.totalSpendingN1 || 0)}
            subValue="Financial History"
            gradient="from-orange-600 to-red-700"
            delay={0.4}
          />
        </div>

        {/* Data Source Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-slate-900/5 via-purple-500/5 to-cyan-500/5 dark:from-slate-900/30 dark:via-purple-500/10 dark:to-cyan-500/10 border-2 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Database className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="font-semibold text-foreground">HCM Performance Plan</p>
                    <p className="text-xs text-muted-foreground">Page 3: Financial History</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-purple-500" />
                  <div className="flex gap-1">
                    {INDICATORS.map((ind) => (
                      <div
                        key={ind.id}
                        className={cn(
                          "w-3 h-3 rounded-full",
                          `bg-gradient-to-r ${getIndicatorColor(ind.id)}`
                        )}
                      />
                    ))}
                  </div>
                  <Calculator className="w-5 h-5 text-purple-500" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <BarChart3 className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="font-semibold text-foreground">Alignement Données</p>
                    <p className="text-xs text-muted-foreground">Par Ligne d'Activité</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PPR Indicators Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Légende des Indicateurs PPR PRÉVU/PERS
              </CardTitle>
              <CardDescription>
                5 indicateurs de performance × {totalBusinessLines} lignes d'activité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {INDICATORS.map(indicator => (
                  <div
                    key={indicator.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border",
                      getIndicatorBadgeColor(indicator.id)
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      `bg-gradient-to-r ${getIndicatorColor(indicator.id)}`
                    )} />
                    <div>
                      <div className="text-xs font-bold">{indicator.shortLabel}</div>
                      <div className="text-[10px] opacity-80">{indicator.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs"
            >
              Tout déplier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs"
            >
              Tout replier
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Actualiser
          </Button>
        </motion.div>

        {/* Business Lines */}
        {businessLines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune ligne d'activité</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Aucune donnée n'a été trouvée. Veuillez d'abord configurer vos lignes d'activité
                  et renseigner les données dans HCM Performance Plan.
                </p>
                <Button
                  onClick={() => navigate('/modules/module3/analysis-configuration')}
                  className="bg-gradient-to-r from-purple-500 to-cyan-600 text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la configuration
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {businessLines.map((businessLine, index) => (
              <BusinessLineCard
                key={businessLine.id}
                businessLine={businessLine}
                lineIndex={index}
                m1Data={m1Data || { annualHoursPerPerson: 0, salesTurnoverN1: 0, totalSpendingN1: 0 }}
                pprIndicators={pprDataByLine[businessLine.id] || { abs: 0, dfq: 0, adt: 0, epd: 0, ekh: 0 }}
                isExpanded={expandedLines.has(businessLine.id)}
                onToggle={() => toggleBusinessLine(businessLine.id)}
                formatKCurrency={formatKCurrency}
                formatPPR={formatPPR}
              />
            ))}
          </div>
        )}

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/modules/module3/analysis-configuration')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vue d'ensemble des équipes
          </Button>

          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground hidden md:block">
              {totalBusinessLines} lignes × {totalEmployees} salariés × 5 indicateurs
            </p>
            <Button
              onClick={() => navigate('/modules/module3/cost-recap')}
              disabled={totalEmployees === 0}
              className="gap-2 bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700 text-white shadow-lg shadow-purple-500/25"
            >
              Récapitulatif des coûts
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
