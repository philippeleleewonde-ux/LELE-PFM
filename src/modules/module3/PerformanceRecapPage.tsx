/**
 * ============================================
 * HCM COST SAVINGS - RÉCAPITULATIF DES PERFORMANCES RÉALISÉES
 * ============================================
 *
 * Interface basée sur la feuille L1 du fichier Excel source a1RiskoM3-S1M1.xls
 *
 * STRUCTURE DES DONNÉES:
 * - 5 Indicateurs: ABS, QD, OA, DDP, EKH
 * - 2 Niveaux par indicateur: N1 (données brutes) et N2 (données prises en compte)
 * - Totaux par indicateur
 *
 * FORMULES APPLIQUÉES (basées sur Excel source):
 * - Temps-Calcul = données temps collecté (convertie en heures décimales)
 * - Score financier = temps-calcul × taux horaire moyen
 * - Pertes constatées = Score financier × (1 - taux d'incapacité/100)
 * - PPR PREVUES = Pertes prévues (référence externe ou calculée)
 * - ECONOMIES REALISEES = PPR PREVUES - Pertes constatées
 * - Pertes en % = (Pertes constatées / PPR PREVUES) × 100
 */

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';

// OPTIMISATION 10K: Constantes de pagination
const PAGE_SIZE_MEMBERS = 500;
const PAGE_SIZE_ENTRIES = 500;
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Clock,
  DollarSign,
  Calendar,
  Target,
  Activity,
  AlertTriangle,
  Zap,
  UserCircle,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
  Award,
  PiggyBank,
  BarChart3,
  Percent,
  Calculator,
  Home,
  Coins,
  X
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';
// Smart Calendar Integration - Dernière semaine complétée
import { getLastCompletedWeek, type LastCompletedWeekResult } from '@/lib/fiscal/LaunchDateService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from '@/lib/utils';
import { formatCurrency, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import { debugLogger } from '@/utils/debugLogger';
import { usePerformanceData } from '@/contexts/PerformanceDataContext';
import type { Currency } from '@/modules/module1/types';
import { FiscalCalendarWidget } from '@/components/shared/FiscalCalendarWidget';
import { createMetricsService } from '@/lib/fiscal';
// Import du dashboard de statut des périodes
import PeriodStatusDashboard from '@/components/shared/PeriodStatusDashboard';

// OPTIMISATION PERFORMANCE: Table virtualisée EKH
import { VirtualizedEKHTable } from './components/VirtualizedEKHTable';
import { VirtualizedSynthesisTable, EmployeeScore, EligibilityStats, GlobalTotals } from './components/VirtualizedSynthesisTable';

// PHASE 2: Import du service de cache (optionnel, fallback sur calcul si échec)
import { createPerformanceCacheService, PerformanceCacheEntry, PerformanceTotalsCache } from './services/PerformanceCacheService';

// SOURCE UNIQUE: Fonctions de calcul depuis calculationEngine
import {
  calculateScoreFinancier,
  calculateScoreFinancierN2,
  calculatePertesConstateesBrut,
  calculatePertesConstateesAvecIncapacite,
  calculatePertesConstateesN2,
  calculatePertesConstateesN2AvecLogiqueCroisee,
  calculatePPRPrevues,
  // 🆕 Recalcul PPR depuis les sources (évite drift avec DB)
  calculatePPRPerPersonFromSources,
  // 🆕 Colonnes spécifiques DDP
  calculatePertesAvecIncapaciteDDP,
  calculatePertesEnPourcentageDDP
} from './engine/calculationEngine';

// ============================================
// MOTEUR DE CALCUL TYPESCRIPT - 100% CONFORME EXCEL
// ============================================
// Le moteur de calcul reste 100% côté client (TypeScript)
// pour garantir la conformité avec les formules Excel.
//
// OPTIMISATION: Utilisation de requestIdleCallback/setTimeout
// pour exécuter le calcul par petits chunks sans bloquer l'UI.
// ============================================

// ============================================
// TYPES
// ============================================

interface CostEntry {
  id: string;
  company_id: string;
  business_line_id: string;
  employee_id: string;
  kpi_type: string;
  period_start: string;
  period_end: string;
  event_date: string;
  duration_hours: number;
  duration_minutes: number;
  compensation_amount: number;
  defect_types?: string[];
  responsibility_level?: string;
  selected_days?: string[];
  recovered_time_hours?: number;
  recovered_time_minutes?: number;
  saved_expenses?: number;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  professional_category: string;
  tech_level: string;
  business_line_id: string;
  incapacity_rate: number;
  versatility_f1: string;
  versatility_f2: string;
  versatility_f3: string;
}

interface BusinessLine {
  id: string;
  activity_name: string;
  team_leader: string | null;
}

// Structure pour les calculs de performance par salarié
interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  professionalCategory: string;
  incapacityRate: number;
  coefficientCompetence: number;
  // Informations de l'équipe (business line)
  businessLineId: string;
  businessLineName: string;
  // Données par indicateur
  abs: IndicatorData;
  qd: IndicatorData;
  oa: IndicatorData;
  ddp: IndicatorData;
  ekh: IndicatorData;
}

interface IndicatorData {
  // Niveau 1 - Données collectées
  tempsCollecte: number;
  tempsCalcul: number;
  fraisCollectes: number;
  scoreFinancier: number;
  pertesConstateesBrut: number;   // Pertes Constatées (brut) = SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))
  pertesConstatees: number;
  pprPrevues: number;
  economiesRealisees: number;      // ECONOMIES REALISEES 1 (N1)
  economiesRealisees2: number;     // ECONOMIES REALISEES 2 (N1) = J6-M6
  pertesEnPourcentage: number;
  // Niveau 2 - Données prises en compte (avec code PRC)
  codePRC: boolean;
  tempsCollecteN2: number;         // M3-Données de temps N2
  tempsCalculN2: number;           // M3-Temps-Calcul N2 = S6+0
  tempsPrisEnCompte: number;       // M3-Temps-Pris en compte N2
  fraisCollectesN2: number;        // M3-Les frais N2
  fraisPrisEnCompte: number;       // M3-Les frais-Pris en compte N2
  scoreFinancierN2: number;        // Score financier N2 (avec U6)
  pertesConstateesN2: number;      // Pertes Constatées N2
  pprPrevuesN2: number;            // PPR PREVUES N2 = J6 (même que N1)
  economiesRealiseesN2: number;    // ECONOMIES REALISEES 1 N2
  economiesRealisees2N2: number;   // ECONOMIES REALISEES 2 N2
  pertesEnPourcentageN2: number;   // Pertes en % N2
}

interface IndicatorTotals {
  // Totaux Niveau 1
  tempsTotal: number;
  fraisTotal: number;
  scoreFinancierTotal: number;
  pertesConstateesBrutTotal: number;  // 🆕 Total Pertes Constatées (brut)
  pertesConstateesTotal: number;
  pprPrevuesTotal: number;
  economiesRealiseesTotal: number;
  pertesEnPourcentageTotal: number;
  // Totaux Niveau 2
  tempsTotalN2: number;
  fraisTotalN2: number;
  scoreFinancierTotalN2: number;
  pertesConstateesTotalN2: number;
  economiesRealiseesTotalN2: number;
  pertesEnPourcentageTotalN2: number;
  // Totaux combinés (N1 + N2) - NIVEAU TOTAL selon Excel
  tempsTotalCombine: number;        // SOMME(F6:F1705)+SOMME(U6:U1705)
  fraisTotalCombine: number;        // SOMME(G6:G1705)+SOMME(W6:W1705)
  scoreFinancierTotalCombine: number; // SOMME(H6:H1705)+SOMME(X6:X1705)
  pertesConstateesTotalCombine: number; // Formule complexe avec SI
  economiesRealiseesTotalCombine: number; // SOMME(K6:K1705)+SOMME(AA6:AA1705)
  pertesEnPourcentageTotalCombine: number; // SOMME(L6:L1705)+SOMME(AB6:AB1705)
}

// ============================================
// KPI CONFIGURATION
// ============================================

const KPI_CONFIG: Record<string, {
  label: string;
  labelFr: string;
  color: string;
  icon: React.ReactNode;
  gradient: string;
  bgClass: string;
}> = {
  'abs': {
    label: 'Absenteeism',
    labelFr: 'Absentéisme',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    bgClass: 'bg-orange-500/10',
    icon: <UserCircle className="w-5 h-5" />
  },
  'qd': {
    label: 'Quality Defects',
    labelFr: 'Défauts Qualité',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    bgClass: 'bg-rose-500/10',
    icon: <AlertTriangle className="w-5 h-5" />
  },
  'oa': {
    label: 'Occupational Accidents',
    labelFr: 'Accidents du Travail',
    color: 'red',
    gradient: 'from-red-500 to-rose-600',
    bgClass: 'bg-red-500/10',
    icon: <Zap className="w-5 h-5" />
  },
  'ddp': {
    label: 'Direct Productivity',
    labelFr: 'Écarts Productivité',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    bgClass: 'bg-violet-500/10',
    icon: <Target className="w-5 h-5" />
  },
  'ekh': {
    label: 'Know-How Gaps',
    labelFr: 'Écarts Know-How',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600',
    bgClass: 'bg-cyan-500/10',
    icon: <Activity className="w-5 h-5" />
  }
};

// ============================================
// HELPER FUNCTIONS - FORMULES EXCEL CONFORMES
// ============================================
// Source: Formules fournies par l'utilisateur - Feuille L1
// Structure: NIVEAU 1 (données brutes) et NIVEAU 2 (données prises en compte)

/**
 * Calcule le coefficient de compétence selon formule Excel:
 * = (F1 + F2 + F3) / 63
 * où F1, F2, F3 = 0 (ne fait pas), 7 (débutant), 14 (confirmé), 21 (expérimenté)
 */
const getVersatilityCoefficient = (level: string): number => {
  if (!level || level.includes("ne fait pas") || level.includes("Does not")) return 0;
  if (level.includes("Débutant") || level.includes("Apprentice")) return 7;
  if (level.includes("Confirmé") || level.includes("Confirmed")) return 14;
  if (level.includes("Expérimenté") || level.includes("Experimented")) return 21;
  return 0;
};

const calculateCoefficientCompetence = (f1: string, f2: string, f3: string): number => {
  const coef1 = getVersatilityCoefficient(f1);
  const coef2 = getVersatilityCoefficient(f2);
  const coef3 = getVersatilityCoefficient(f3);
  return (coef1 + coef2 + coef3) / 63;
};

/**
 * Convertit durée (heures + minutes) en heures décimales
 */
const convertToDecimalHours = (hours: number, minutes: number): number => {
  return hours + (minutes / 60);
};

/**
 * FORMULE EXCEL: M3-Temps-Calcul
 * NIVEAU 1: =E6+0 (Temps collecté + 0)
 * NIVEAU 2: =S6+0 (Temps collecté niveau 2 + 0)
 * Note: Le +0 force la conversion en nombre
 */
const calculateTempsCalcul = (tempsCollecte: number): number => {
  return tempsCollecte + 0; // Équivalent à =E6+0 ou =S6+0
};

// NOTE: Fonctions importées depuis ./engine/calculationEngine (SOURCE UNIQUE):
// - calculateScoreFinancier, calculateScoreFinancierN2
// - calculatePertesConstateesBrut, calculatePertesConstateesAvecIncapacite
// - calculatePPRPrevues

/**
 * FORMULE EXCEL: ECONOMIES REALISEES (semaine) - Version 1
 * =SI(ET(F6=0;T6=0;B6<>0);N6;SI(ET(F6=0;T6=0;B6=0);0;SI(ET(F6>0;T6=0);N6;SI(ET(F6=0;T6>0);0))))
 *
 * Où:
 * - F6 = Temps-Calcul Niveau 1
 * - T6 = Temps-Calcul Niveau 2 (temps pris en compte)
 * - B6 = Nom du salarié
 * - N6 = Économies (brut)
 *
 * Logique:
 * - Si F6=0 ET T6=0 ET salarié existe → N6 (économies brut)
 * - Si F6=0 ET T6=0 ET salarié n'existe pas → 0
 * - Si F6>0 ET T6=0 → N6 (économies brut)
 * - Si F6=0 ET T6>0 → 0
 */
const calculateEconomiesRealiseesN1 = (
  tempsCalculN1: number,
  tempsCalculN2: number,
  salariéExiste: boolean,
  economiesBrut: number
): number => {
  if (tempsCalculN1 === 0 && tempsCalculN2 === 0 && salariéExiste) return economiesBrut;
  if (tempsCalculN1 === 0 && tempsCalculN2 === 0 && !salariéExiste) return 0;
  if (tempsCalculN1 > 0 && tempsCalculN2 === 0) return economiesBrut;
  if (tempsCalculN1 === 0 && tempsCalculN2 > 0) return 0;
  return 0;
};

/**
 * FORMULE EXCEL: ECONOMIES REALISEES (semaine) - Version brut finale
 * =SI(M6<0;J6-0;SI(M6>0;J6-M6;SI(M6=0;J6-M6)))
 *
 * Où:
 * - M6 = Pertes Constatées (avec incapacité)
 * - J6 = PPR PREVUES
 *
 * Logique:
 * - Si pertes < 0 → PPR - 0 = PPR (toutes les économies)
 * - Si pertes > 0 → PPR - pertes
 * - Si pertes = 0 → PPR - 0 = PPR
 */
const calculateEconomiesRealiseesBrut = (
  pprPrevues: number,
  pertesConstatees: number
): number => {
  if (pertesConstatees < 0) return pprPrevues - 0;
  if (pertesConstatees > 0) return pprPrevues - pertesConstatees;
  if (pertesConstatees === 0) return pprPrevues - pertesConstatees;
  return 0;
};

/**
 * FORMULE EXCEL: Pertes en %
 * =SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6/$E$3)))
 *
 * Où:
 * - M6 = Pertes Constatées
 * - $E$3 = Valeur de référence totale (Score Financier total ou PPR total)
 *
 * Note: $E$3 est une référence absolue - probablement le total des scores ou PPR
 */
const calculatePertesEnPourcentage = (
  pertesConstatees: number,
  valeurReference: number
): number => {
  if (pertesConstatees < 0) return 0;
  if (pertesConstatees === 0) return 0;
  if (pertesConstatees > 0 && valeurReference !== 0) {
    return (pertesConstatees / valeurReference) * 100;
  }
  return 0;
};

// ============================================
// FORMULES NIVEAU 2 - Données prises en compte
// ============================================

/**
 * FORMULE EXCEL: code salariés P.R.C (Pris en compte) - NIVEAU 2
 * =SI(O6=0;0;SI(O6>0;1))
 *
 * Où O6 = Temps collecté au niveau 2
 * Si temps = 0 → 0 (non pris en compte)
 * Si temps > 0 → 1 (pris en compte)
 */
const calculateCodePRC = (tempsCollecteN2: number): number => {
  if (tempsCollecteN2 === 0) return 0;
  if (tempsCollecteN2 > 0) return 1;
  return 0;
};

/**
 * FORMULE EXCEL: M3-Temps-Pris en compte - NIVEAU 2
 * =SI(P6=0;0;SI(P6>0;T6))
 *
 * Où:
 * - P6 = Code PRC
 * - T6 = Temps-Calcul
 *
 * Si PRC = 0 → 0
 * Si PRC > 0 → Temps-Calcul
 */
const calculateTempsPrisEnCompte = (codePRC: number, tempsCalcul: number): number => {
  if (codePRC === 0) return 0;
  if (codePRC > 0) return tempsCalcul;
  return 0;
};

/**
 * FORMULE EXCEL: M3-Les frais-Pris en compte - NIVEAU 2
 * =SI(P6=0;0;SI(P6>0;V6))
 *
 * Où:
 * - P6 = Code PRC
 * - V6 = Frais collectés
 */
const calculateFraisPrisEnCompte = (codePRC: number, fraisCollectes: number): number => {
  if (codePRC === 0) return 0;
  if (codePRC > 0) return fraisCollectes;
  return 0;
};

/**
 * FORMULE EXCEL: ECONOMIES REALISEES - NIVEAU 2
 * =SI(ET(F6=0;U6=0);0;SI(ET(F6>0;U6=0);0;SI(ET(F6=0;U6>0);AD6)))
 *
 * Où:
 * - F6 = Temps-Calcul Niveau 1
 * - U6 = Temps-Pris en compte (Niveau 2)
 * - AD6 = PPR Prévues Niveau 2
 *
 * Logique:
 * - Si F6=0 ET U6=0 → 0
 * - Si F6>0 ET U6=0 → 0
 * - Si F6=0 ET U6>0 → PPR Prévues
 */
const calculateEconomiesRealiseesN2 = (
  tempsCalculN1: number,
  tempsPrisEnCompte: number,
  pprPrevuesN2: number
): number => {
  if (tempsCalculN1 === 0 && tempsPrisEnCompte === 0) return 0;
  if (tempsCalculN1 > 0 && tempsPrisEnCompte === 0) return 0;
  if (tempsCalculN1 === 0 && tempsPrisEnCompte > 0) return pprPrevuesN2;
  return 0;
};

/**
 * Détermine si un salarié est "Pris en Compte" (code PRC)
 * Basé sur s'il a des entrées de coûts pour l'indicateur
 */
const determineCodePRC = (hasEntries: boolean): boolean => {
  return hasEntries;
};

// NOTE: calculateScoreFinancierN2 et calculatePertesConstateesN2 importés depuis ./engine/calculationEngine

/**
 * FORMULE EXCEL: ECONOMIES REALISEES 2 (semaine) NIVEAU 2
 * =SI(AC6<0;Z6-0;SI(AC6>0;Z6-AC6;SI(AC6=0;Z6-AC6)))
 *
 * Où:
 * - AC6 = Pertes Constatées NIVEAU 2
 * - Z6 = PPR PREVUES (semaine) NIVEAU 2
 */
const calculateEconomiesRealisees2N2 = (
  pprPrevuesN2: number,
  pertesConstateesN2: number
): number => {
  if (pertesConstateesN2 < 0) return pprPrevuesN2 - 0;
  if (pertesConstateesN2 > 0) return pprPrevuesN2 - pertesConstateesN2;
  if (pertesConstateesN2 === 0) return pprPrevuesN2 - pertesConstateesN2;
  return 0;
};

/**
 * FORMULE EXCEL: Pertes en % NIVEAU 2
 * =SI(AC6<0;0;SI(AC6=0;0;SI(AC6>0;AC6/$E$3)))
 *
 * Où:
 * - AC6 = Pertes Constatées NIVEAU 2
 * - $E$3 = Pertes constatées avec prise en compte du taux d'incapacité (semaine) NIVEAU TOTAL
 */
const calculatePertesEnPourcentageN2 = (
  pertesConstateesN2: number,
  totalPertesReference: number
): number => {
  if (pertesConstateesN2 < 0) return 0;
  if (pertesConstateesN2 === 0) return 0;
  if (pertesConstateesN2 > 0 && totalPertesReference !== 0) {
    return (pertesConstateesN2 / totalPertesReference) * 100;
  }
  return 0;
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
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ icon, label, value, subValue, gradient, delay = 0, trend }: StatCardProps) {
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
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{value}</p>
                {trend && (
                  trend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-green-300" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-red-300" />
                  ) : null
                )}
              </div>
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
// INDICATOR TABLE COMPONENT - REFONTE COMPLÈTE
// ============================================
// NIVEAU 1: 11 colonnes exactes selon spécifications Excel
// NIVEAU 2: 16 colonnes exactes selon spécifications Excel
// NIVEAU TOTAL: Non affiché (calculs internes uniquement)

interface IndicatorTableProps {
  kpiType: string;
  performances: EmployeePerformance[];
  totals: IndicatorTotals;
  currencySymbol: string;
  level: 1 | 2 | 'total';
  businessLines: BusinessLine[];
}

function IndicatorTable({ kpiType, performances, totals, currencySymbol, level, businessLines }: IndicatorTableProps) {
  const kpiConfig = KPI_CONFIG[kpiType];
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set(businessLines.map(bl => bl.id)));

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const getData = (perf: EmployeePerformance) => {
    switch (kpiType) {
      case 'abs': return perf.abs;
      case 'qd': return perf.qd;
      case 'oa': return perf.oa;
      case 'ddp': return perf.ddp;
      case 'ekh': return perf.ekh;
      default: return perf.abs;
    }
  };

  // Grouper TOUS les salariés par équipe (business line)
  const performancesByTeam = useMemo(() => {
    const grouped = new Map<string, EmployeePerformance[]>();
    businessLines.forEach(bl => {
      grouped.set(bl.id, []);
    });
    performances.forEach(perf => {
      const teamPerfs = grouped.get(perf.businessLineId);
      if (teamPerfs) {
        teamPerfs.push(perf);
      }
    });
    return grouped;
  }, [performances, businessLines]);

  // Vérifier si un salarié a des données pour cet indicateur
  const hasDataForIndicator = (perf: EmployeePerformance): boolean => {
    const data = getData(perf);
    if (level === 1) return data.tempsCollecte > 0 || data.fraisCollectes > 0;
    if (level === 2) return data.codePRC;
    // NIVEAU TOTAL: a des données si N1 ou N2 a des données
    return (data.tempsCollecte > 0 || data.fraisCollectes > 0) || data.codePRC;
  };

  if (performances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Aucun salarié enregistré</p>
      </div>
    );
  }

  // Nombre de colonnes exact: N1=12, N2=16
  const getColSpan = () => level === 1 ? 12 : 16;

  // ============================================
  // RENDU NIVEAU 1 - 12 COLONNES EXACTES
  // ============================================
  if (level === 1) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={cn("border-b-2", kpiConfig.bgClass)}>
              {/* COL 1 */}
              <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Nom du salarié</th>
              {/* COL 2 */}
              <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Catégorie pro</th>
              {/* COL 3 */}
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Taux d'incapacité</th>
              {/* COL 4 */}
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">M3-Données de temps</th>
              {/* COL 5 */}
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">M3-Temps-Calcul</th>
              {/* COL 6 */}
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">M3-Les frais</th>
              {/* COL 7 */}
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Score Financier</th>
              {/* COL 8 */}
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes constatées avec prise en compte du taux d'incapacité (semaine)</th>
              {/* COL 9 */}
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">PPR PREVUES (semaine)</th>
              {/* COL 10 */}
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">ECONOMIES REALISEES 1</th>
              {/* COL 11 */}
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Pertes en %</th>
              {/* COL 12 - 🆕 Pertes Constatées (brut) après Pertes en % */}
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes Constatées</th>
              {/* COL 13 */}
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">ECONOMIES REALISEES 2</th>
            </tr>
          </thead>
          <tbody>
            {businessLines.map((bl) => {
              const teamPerformances = performancesByTeam.get(bl.id) || [];
              const isTeamExpanded = expandedTeams.has(bl.id);
              const teamHasData = teamPerformances.some(p => hasDataForIndicator(p));

              // Totaux équipe N1
              const teamTotals = teamPerformances.reduce((acc, perf) => {
                const data = getData(perf);
                return {
                  economiesRealisees: acc.economiesRealisees + data.economiesRealisees,
                  economiesRealisees2: acc.economiesRealisees2 + data.economiesRealisees2,
                };
              }, { economiesRealisees: 0, economiesRealisees2: 0 });

              return (
                <React.Fragment key={bl.id}>
                  {/* En-tête équipe */}
                  <tr
                    className={cn("bg-gradient-to-r cursor-pointer transition-all hover:opacity-90", kpiConfig.gradient, "text-white")}
                    onClick={() => toggleTeam(bl.id)}
                  >
                    <td colSpan={13} className="py-3 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div animate={{ rotate: isTeamExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-5 h-5" />
                          </motion.div>
                          <Building2 className="w-5 h-5" />
                          <span className="font-bold text-base">{bl.activity_name}</span>
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
                            {teamPerformances.length} salarié(s)
                          </Badge>
                          {teamHasData && <Badge className="bg-white/30 text-white text-xs">Données enregistrées</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Éco 1: <strong>{teamTotals.economiesRealisees.toLocaleString('fr-FR')} {currencySymbol}</strong></span>
                          <span>Éco 2: <strong>{teamTotals.economiesRealisees2.toLocaleString('fr-FR')} {currencySymbol}</strong></span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Salariés */}
                  <AnimatePresence>
                    {isTeamExpanded && teamPerformances.map((perf, idx) => {
                      const data = getData(perf);
                      const hasData = hasDataForIndicator(perf);

                      return (
                        <motion.tr
                          key={perf.employeeId}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            "border-b border-border/50 transition-colors hover:bg-muted/30",
                            idx % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                            !hasData && "opacity-60"
                          )}
                        >
                          {/* COL 1: Nom du salarié */}
                          <td className="py-2 px-2 font-medium">{perf.employeeName}</td>
                          {/* COL 2: Catégorie pro */}
                          <td className="py-2 px-2 text-muted-foreground">{perf.professionalCategory}</td>
                          {/* COL 3: Taux d'incapacité */}
                          <td className="py-2 px-2 text-center">
                            <Badge variant="outline" className={cn(
                              perf.incapacityRate > 50 ? "bg-red-500/10 text-red-600 border-red-500/30" :
                              perf.incapacityRate > 20 ? "bg-orange-500/10 text-orange-600 border-orange-500/30" :
                              "bg-green-500/10 text-green-600 border-green-500/30"
                            )}>
                              {perf.incapacityRate}%
                            </Badge>
                          </td>
                          {/* COL 4: M3-Données de temps */}
                          <td className="py-2 px-2 text-center">{data.tempsCollecte.toFixed(2)}h</td>
                          {/* COL 5: M3-Temps-Calcul = E6+0 */}
                          <td className="py-2 px-2 text-center font-medium">{data.tempsCalcul.toFixed(2)}h</td>
                          {/* COL 6: M3-Les frais */}
                          <td className="py-2 px-2 text-right">{data.fraisCollectes.toLocaleString('fr-FR')} {currencySymbol}</td>
                          {/* COL 7: Score Financier */}
                          <td className="py-2 px-2 text-right font-medium text-blue-600">{data.scoreFinancier.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                          {/* COL 8: Pertes constatées */}
                          <td className="py-2 px-2 text-right font-medium text-orange-600">{data.pertesConstatees.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                          {/* COL 9: PPR PREVUES (semaine) */}
                          <td className="py-2 px-2 text-right">{data.pprPrevues.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                          {/* COL 10: ECONOMIES REALISEES 1 */}
                          <td className="py-2 px-2 text-right font-bold text-green-600">{data.economiesRealisees.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                          {/* COL 11: Pertes en % N1 = Pertes N1 / (Pertes Total N1 + Pertes Total N2) × 100 */}
                          {(() => {
                            const totalPertesReference = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;
                            const pertesEnPourcentageCorrect = totalPertesReference > 0
                              ? (data.pertesConstatees / totalPertesReference) * 100
                              : 0;
                            return (
                              <td className="py-2 px-2 text-center">
                                <Badge variant="outline" className={cn(
                                  pertesEnPourcentageCorrect > 80 ? "bg-red-500/10 text-red-600" :
                                  pertesEnPourcentageCorrect > 50 ? "bg-orange-500/10 text-orange-600" :
                                  "bg-green-500/10 text-green-600"
                                )}>
                                  {pertesEnPourcentageCorrect.toFixed(1)}%
                                </Badge>
                              </td>
                            );
                          })()}
                          {/* COL 12: 🆕 Pertes Constatées (brut) = SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6)) */}
                          <td className="py-2 px-2 text-right font-medium text-orange-600">{data.pertesConstateesBrut.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                          {/* COL 13: ECONOMIES REALISEES 2 */}
                          <td className="py-2 px-2 text-right font-bold text-emerald-600">{data.economiesRealisees2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
          {/* Footer totaux N1 */}
          <tfoot>
            <tr className={cn("border-t-2 font-bold", kpiConfig.bgClass)}>
              <td colSpan={6} className="py-4 px-2 text-right">TOTAL NIVEAU 1:</td>
              <td className="py-4 px-2 text-right text-blue-600">{totals.scoreFinancierTotal.toLocaleString('fr-FR')} {currencySymbol}</td>
              <td className="py-4 px-2 text-right text-orange-600">{totals.pertesConstateesTotal.toLocaleString('fr-FR')} {currencySymbol}</td>
              <td className="py-4 px-2 text-right">{totals.pprPrevuesTotal.toLocaleString('fr-FR')} {currencySymbol}</td>
              <td className="py-4 px-2 text-right text-green-600">{totals.economiesRealiseesTotal.toLocaleString('fr-FR')} {currencySymbol}</td>
              <td className="py-4 px-2 text-center">
                <Badge className={cn(
                  totals.pertesEnPourcentageTotal > 80 ? "bg-red-500" :
                  totals.pertesEnPourcentageTotal > 50 ? "bg-orange-500" : "bg-green-500",
                  "text-white"
                )}>
                  {totals.pertesEnPourcentageTotal.toFixed(1)}%
                </Badge>
              </td>
              {/* 🆕 COL 12: Pertes Constatées (brut) TOTAL */}
              <td className="py-4 px-2 text-right text-orange-600">{totals.pertesConstateesBrutTotal.toLocaleString('fr-FR')} {currencySymbol}</td>
              {/* COL 13: ECONOMIES REALISEES 2 TOTAL */}
              <td className="py-4 px-2 text-right text-emerald-600">{(totals.pprPrevuesTotal - totals.pertesConstateesTotal).toLocaleString('fr-FR')} {currencySymbol}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // ============================================
  // RENDU NIVEAU 2 - 16 COLONNES EXACTES
  // ============================================
  if (level === 2) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={cn("border-b-2", kpiConfig.bgClass)}>
            {/* COL 1 */}
            <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Nom du salarié</th>
            {/* COL 2 */}
            <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">code salariés P.R.C</th>
            {/* COL 3 */}
            <th className="text-left py-3 px-2 font-semibold whitespace-nowrap">Catégorie pro</th>
            {/* COL 4 */}
            <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Taux d'incapacité</th>
            {/* COL 5 */}
            <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">M3-Données de temps</th>
            {/* COL 6 */}
            <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">M3-Temps-Calcul</th>
            {/* COL 7 */}
            <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">M3-Temps-Pris en compte</th>
            {/* COL 8 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">M3-Les frais</th>
            {/* COL 9 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">M3-Les frais-Pris en compte</th>
            {/* COL 10 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Score financier</th>
            {/* COL 11 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes constatées avec prise en compte du taux d'incapacité (semaine)</th>
            {/* COL 12 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">PPR PREVUES (semaine)</th>
            {/* COL 13 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">ECONOMIES REALISEES 1</th>
            {/* COL 14 */}
            <th className="text-center py-3 px-2 font-semibold whitespace-nowrap">Pertes en %</th>
            {/* COL 15 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">Pertes Constatées</th>
            {/* COL 16 - DDP ONLY: Pertes avec incapacité (DD6) - ENTRE Pertes Constatées et ECONOMIES REALISEES 2 */}
            {kpiType === 'ddp' && (
              <th className="text-right py-3 px-2 font-semibold whitespace-nowrap bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">Pertes avec incapacité (DDP)</th>
            )}
            {/* COL 17 */}
            <th className="text-right py-3 px-2 font-semibold whitespace-nowrap">ECONOMIES REALISEES 2</th>
            {/* COL 18 - DDP ONLY: Pertes en % (DF6) */}
            {kpiType === 'ddp' && (
              <th className="text-center py-3 px-2 font-semibold whitespace-nowrap bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">Pertes en % (DDP)</th>
            )}
          </tr>
        </thead>
        <tbody>
          {businessLines.map((bl) => {
            const teamPerformances = performancesByTeam.get(bl.id) || [];
            const isTeamExpanded = expandedTeams.has(bl.id);
            const teamHasData = teamPerformances.some(p => hasDataForIndicator(p));

            // Totaux équipe N2
            const teamTotals = teamPerformances.reduce((acc, perf) => {
              const data = getData(perf);
              return {
                economiesRealiseesN2: acc.economiesRealiseesN2 + data.economiesRealiseesN2,
                economiesRealisees2N2: acc.economiesRealisees2N2 + data.economiesRealisees2N2,
              };
            }, { economiesRealiseesN2: 0, economiesRealisees2N2: 0 });

            return (
              <React.Fragment key={bl.id}>
                {/* En-tête équipe */}
                <tr
                  className={cn("bg-gradient-to-r cursor-pointer transition-all hover:opacity-90", kpiConfig.gradient, "text-white")}
                  onClick={() => toggleTeam(bl.id)}
                >
                  <td colSpan={kpiType === 'ddp' ? 18 : 16} className="py-3 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div animate={{ rotate: isTeamExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                        <Building2 className="w-5 h-5" />
                        <span className="font-bold text-base">{bl.activity_name}</span>
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
                          {teamPerformances.length} salarié(s)
                        </Badge>
                        {teamHasData && <Badge className="bg-white/30 text-white text-xs">Données PRC</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Éco 1: <strong>{teamTotals.economiesRealiseesN2.toLocaleString('fr-FR')} {currencySymbol}</strong></span>
                        <span>Éco 2: <strong>{teamTotals.economiesRealisees2N2.toLocaleString('fr-FR')} {currencySymbol}</strong></span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Salariés N2 */}
                <AnimatePresence>
                  {isTeamExpanded && teamPerformances.map((perf, idx) => {
                    const data = getData(perf);
                    const hasData = hasDataForIndicator(perf);
                    // Code PRC: =SI(O6=0;0;SI(O6>0;1)) - basé sur tempsCollecteN2
                    const codePRCValue = data.tempsCollecteN2 > 0 ? 1 : 0;

                    return (
                      <motion.tr
                        key={perf.employeeId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={cn(
                          "border-b border-border/50 transition-colors hover:bg-muted/30",
                          idx % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                          !hasData && "opacity-60"
                        )}
                      >
                        {/* COL 1: Nom du salarié */}
                        <td className="py-2 px-2 font-medium">{perf.employeeName}</td>
                        {/* COL 2: code salariés P.R.C */}
                        <td className="py-2 px-2 text-center">
                          {codePRCValue === 1 ? (
                            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">1</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">0</Badge>
                          )}
                        </td>
                        {/* COL 3: Catégorie pro */}
                        <td className="py-2 px-2 text-muted-foreground">{perf.professionalCategory}</td>
                        {/* COL 4: Taux d'incapacité */}
                        <td className="py-2 px-2 text-center">
                          <Badge variant="outline" className={cn(
                            perf.incapacityRate > 50 ? "bg-red-500/10 text-red-600 border-red-500/30" :
                            perf.incapacityRate > 20 ? "bg-orange-500/10 text-orange-600 border-orange-500/30" :
                            "bg-green-500/10 text-green-600 border-green-500/30"
                          )}>
                            {perf.incapacityRate}%
                          </Badge>
                        </td>
                        {/* COL 5: M3-Données de temps - Données N1 transférées des lignes d'activité */}
                        <td className="py-2 px-2 text-center">{data.tempsCollecte.toFixed(2)}h</td>
                        {/* COL 6: M3-Temps-Calcul N2 = S6+0 */}
                        <td className="py-2 px-2 text-center font-medium">{data.tempsCalculN2.toFixed(2)}h</td>
                        {/* COL 7: M3-Temps-Pris en compte = SI(P6=0;0;SI(P6>0;T6)) */}
                        <td className="py-2 px-2 text-center font-medium text-blue-600">{data.tempsPrisEnCompte.toFixed(2)}h</td>
                        {/* COL 8: M3-Les frais - Données N1 transférées des lignes d'activité */}
                        <td className="py-2 px-2 text-right">{data.fraisCollectes.toLocaleString('fr-FR')} {currencySymbol}</td>
                        {/* COL 9: M3-Les frais-Pris en compte = SI(P6=0;0;SI(P6>0;V6)) */}
                        <td className="py-2 px-2 text-right font-medium text-blue-600">{data.fraisPrisEnCompte.toLocaleString('fr-FR')} {currencySymbol}</td>
                        {/* COL 10: Score financier N2 */}
                        <td className="py-2 px-2 text-right font-medium text-blue-600">{data.scoreFinancierN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                        {/* COL 11: Pertes constatées N2 (avec incapacité) */}
                        <td className="py-2 px-2 text-right font-medium text-orange-600">{data.pertesConstateesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                        {/* COL 12: PPR PREVUES (semaine) = J6 */}
                        <td className="py-2 px-2 text-right">{data.pprPrevuesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                        {/* COL 13: ECONOMIES REALISEES 1 N2 */}
                        <td className="py-2 px-2 text-right font-bold text-green-600">{data.economiesRealiseesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                        {/* COL 14: Pertes en % N2 = Pertes N2 / (Pertes Total N1 + Pertes Total N2) × 100 */}
                        {(() => {
                          const totalPertesReference = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;
                          const pertesEnPourcentageN2Correct = totalPertesReference > 0
                            ? (data.pertesConstateesN2 / totalPertesReference) * 100
                            : 0;
                          return (
                            <td className="py-2 px-2 text-center">
                              <Badge variant="outline" className={cn(
                                pertesEnPourcentageN2Correct > 80 ? "bg-red-500/10 text-red-600" :
                                pertesEnPourcentageN2Correct > 50 ? "bg-orange-500/10 text-orange-600" :
                                "bg-green-500/10 text-green-600"
                              )}>
                                {pertesEnPourcentageN2Correct.toFixed(1)}%
                              </Badge>
                            </td>
                          );
                        })()}
                        {/* COL 15: Pertes Constatées N2 (brut avant incapacité) */}
                        <td className="py-2 px-2 text-right text-orange-500">{(data.scoreFinancierN2 + data.fraisPrisEnCompte - perf.incapacityRate).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                        {/* COL 16 - DDP ONLY: Pertes avec incapacité N2 (DD6) - ENTRE Pertes Constatées et ECONOMIES REALISEES 2 */}
                        {kpiType === 'ddp' && (
                          <td className="py-2 px-2 text-right font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30">
                            {calculatePertesAvecIncapaciteDDP(data.pprPrevuesN2, data.pertesConstateesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                          </td>
                        )}
                        {/* COL 17: ECONOMIES REALISEES 2 N2 */}
                        <td className="py-2 px-2 text-right font-bold text-emerald-600">{data.economiesRealisees2N2.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}</td>
                        {/* COL 18 - DDP ONLY: Pertes en % N2 (DF6) = (PPR N2 - Pertes N2) / Total */}
                        {kpiType === 'ddp' && (() => {
                          const pertesAvecIncapaciteN2 = calculatePertesAvecIncapaciteDDP(data.pprPrevuesN2, data.pertesConstateesN2);
                          const totalPertesRef = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;
                          const pertesEnPctDDPN2 = calculatePertesEnPourcentageDDP(pertesAvecIncapaciteN2, totalPertesRef) * 100;
                          return (
                            <td className="py-2 px-2 text-center bg-purple-100 dark:bg-purple-900/30">
                              <Badge variant="outline" className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">
                                {pertesEnPctDDPN2.toFixed(1)}%
                              </Badge>
                            </td>
                          );
                        })()}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
        {/* Footer totaux N2 */}
        <tfoot>
          <tr className={cn("border-t-2 font-bold", kpiConfig.bgClass)}>
            <td colSpan={9} className="py-4 px-2 text-right">TOTAL NIVEAU 2:</td>
            <td className="py-4 px-2 text-right text-blue-600">{totals.scoreFinancierTotalN2.toLocaleString('fr-FR')} {currencySymbol}</td>
            <td className="py-4 px-2 text-right text-orange-600">{totals.pertesConstateesTotalN2.toLocaleString('fr-FR')} {currencySymbol}</td>
            <td className="py-4 px-2 text-right">{totals.pprPrevuesTotal.toLocaleString('fr-FR')} {currencySymbol}</td>
            <td className="py-4 px-2 text-right text-green-600">{totals.economiesRealiseesTotalN2.toLocaleString('fr-FR')} {currencySymbol}</td>
            <td className="py-4 px-2 text-center">
              <Badge className={cn(
                totals.pertesEnPourcentageTotalN2 > 80 ? "bg-red-500" :
                totals.pertesEnPourcentageTotalN2 > 50 ? "bg-orange-500" : "bg-green-500",
                "text-white"
              )}>
                {totals.pertesEnPourcentageTotalN2.toFixed(1)}%
              </Badge>
            </td>
            <td className="py-4 px-2 text-right text-orange-500">{totals.pertesConstateesTotalN2.toLocaleString('fr-FR')} {currencySymbol}</td>
            {/* COL 16 - DDP ONLY: Total Pertes avec incapacité N2 - ENTRE Pertes Constatées et ECONOMIES REALISEES 2 */}
            {kpiType === 'ddp' && (
              <td className="py-4 px-2 text-right text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 font-bold">
                {calculatePertesAvecIncapaciteDDP(totals.pprPrevuesTotal, totals.pertesConstateesTotalN2).toLocaleString('fr-FR')} {currencySymbol}
              </td>
            )}
            {/* COL 17: ECONOMIES REALISEES 2 Total N2 */}
            <td className="py-4 px-2 text-right text-emerald-600">{(totals.pprPrevuesTotal - totals.pertesConstateesTotalN2).toLocaleString('fr-FR')} {currencySymbol}</td>
            {/* COL 18 - DDP ONLY: Total Pertes en % N2 */}
            {kpiType === 'ddp' && (() => {
              const totalPertesAvecIncapN2 = calculatePertesAvecIncapaciteDDP(totals.pprPrevuesTotal, totals.pertesConstateesTotalN2);
              const totalPertesRef = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;
              const totalPertesEnPctDDPN2 = calculatePertesEnPourcentageDDP(totalPertesAvecIncapN2, totalPertesRef) * 100;
              return (
                <td className="py-4 px-2 text-center bg-purple-100 dark:bg-purple-900/30">
                  <Badge className="bg-purple-600 dark:bg-purple-500 text-white">
                    {totalPertesEnPctDDPN2.toFixed(1)}%
                  </Badge>
                </td>
              );
            })()}
          </tr>
        </tfoot>
      </table>
    </div>
  );
  }

  // ============================================
  // RENDU NIVEAU TOTAL - 6 COLONNES EXACTES
  // ============================================
  // Colonnes selon spécifications Excel:
  // 1. M3-Données de temps NIVEAU TOTAL = SOMME(F6:F1705)+SOMME(U6:U1705)
  // 2. M3-Les frais NIVEAU TOTAL = SOMME(G6:G1705)+SOMME(W6:W1705)
  // 3. Score financier NIVEAU TOTAL = SOMME(H6:H1705)+SOMME(X6:X1705)
  // 4. Pertes constatées NIVEAU TOTAL = Formule SI complexe
  // 5. ECONOMIES REALISEES NIVEAU TOTAL = SOMME(K6:K1705)+SOMME(AA6:AA1705)
  // 6. Pertes en % NIVEAU TOTAL = SOMME(L6:L1705)+SOMME(AB6:AB1705)
  return (
    <div className="overflow-x-auto">
      <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Calculator className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-purple-700 dark:text-purple-400">NIVEAU TOTAL - Synthèse Globale</CardTitle>
              <CardDescription>Combinaison des données Niveau 1 + Niveau 2</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-purple-500/30 bg-purple-500/10">
                {/* COL 1 */}
                <th className="text-center py-3 px-4 font-semibold whitespace-nowrap">M3-Données de temps</th>
                {/* COL 2 */}
                <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">M3-Les frais</th>
                {/* COL 3 */}
                <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">Score financier</th>
                {/* COL 4 */}
                <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">Pertes constatées</th>
                {/* COL 5 - PPR PREVUES = SOMME(J6:J1705) */}
                <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">PPR PREVUES</th>
                {/* COL 6 */}
                <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">ECONOMIES REALISEES</th>
                {/* COL 7 */}
                <th className="text-center py-3 px-4 font-semibold whitespace-nowrap">Pertes en %</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-purple-500/20 bg-white/50 dark:bg-gray-800/50">
                {/* COL 1: M3-Données de temps TOTAL = N1 temps + N2 temps pris en compte */}
                <td className="py-4 px-4 text-center font-bold text-lg text-purple-700">
                  {totals.tempsTotalCombine.toFixed(2)}h
                </td>
                {/* COL 2: M3-Les frais TOTAL = N1 frais + N2 frais pris en compte */}
                <td className="py-4 px-4 text-right font-bold text-lg">
                  {totals.fraisTotalCombine.toLocaleString('fr-FR')} {currencySymbol}
                </td>
                {/* COL 3: Score financier TOTAL */}
                <td className="py-4 px-4 text-right font-bold text-lg text-blue-600">
                  {totals.scoreFinancierTotalCombine.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                {/* COL 4: Pertes constatées TOTAL */}
                <td className="py-4 px-4 text-right font-bold text-lg text-orange-600">
                  {totals.pertesConstateesTotalCombine.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                {/* COL 5: PPR PREVUES TOTAL = SOMME(J6:J1705) */}
                <td className="py-4 px-4 text-right font-bold text-lg text-purple-600">
                  {(totals.pprPrevuesTotal ?? 0).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                {/* COL 6: ECONOMIES REALISEES TOTAL */}
                <td className="py-4 px-4 text-right font-bold text-xl text-green-600">
                  {totals.economiesRealiseesTotalCombine.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currencySymbol}
                </td>
                {/* COL 7: Pertes en % TOTAL */}
                <td className="py-4 px-4 text-center">
                  <Badge className={cn(
                    "text-lg px-4 py-2",
                    totals.pertesEnPourcentageTotalCombine > 80 ? "bg-red-500" :
                    totals.pertesEnPourcentageTotalCombine > 50 ? "bg-orange-500" : "bg-green-500",
                    "text-white"
                  )}>
                    {totals.pertesEnPourcentageTotalCombine.toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            </tbody>
            {/* Détail N1 + N2 */}
            <tfoot>
              <tr className="border-t border-purple-500/30 text-xs text-muted-foreground">
                <td className="py-2 px-4 text-center">
                  <span className="block">N1: {totals.tempsTotal.toFixed(2)}h</span>
                  <span className="block">N2: {totals.tempsTotalN2.toFixed(2)}h</span>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="block">N1: {totals.fraisTotal.toLocaleString('fr-FR')}</span>
                  <span className="block">N2: {totals.fraisTotalN2.toLocaleString('fr-FR')}</span>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="block">N1: {totals.scoreFinancierTotal.toLocaleString('fr-FR')}</span>
                  <span className="block">N2: {totals.scoreFinancierTotalN2.toLocaleString('fr-FR')}</span>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="block">N1: {totals.pertesConstateesTotal.toLocaleString('fr-FR')}</span>
                  <span className="block">N2: {totals.pertesConstateesTotalN2.toLocaleString('fr-FR')}</span>
                </td>
                {/* COL 5: PPR PREVUES footer - N1/N2 breakdown */}
                <td className="py-2 px-4 text-right">
                  <span className="block">N1: {(totals.pprPrevuesTotal ?? 0).toLocaleString('fr-FR')}</span>
                  <span className="block">N2: {(totals.pprPrevuesTotalN2 ?? 0).toLocaleString('fr-FR')}</span>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="block">N1: {totals.economiesRealiseesTotal.toLocaleString('fr-FR')}</span>
                  <span className="block">N2: {totals.economiesRealiseesTotalN2.toLocaleString('fr-FR')}</span>
                </td>
                <td className="py-2 px-4 text-center">
                  <span className="block">N1: {totals.pertesEnPourcentageTotal.toFixed(1)}%</span>
                  <span className="block">N2: {totals.pertesEnPourcentageTotalN2.toFixed(1)}%</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PAGINATION HELPER COMPONENT
// Optimisation performance: Limite le nombre de lignes DOM rendues
// ============================================

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const PaginationControls = React.memo(function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t bg-muted/30">
      <span className="text-sm text-muted-foreground">
        Affichage {startIdx}-{endIdx} sur {totalItems} employés
      </span>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={cn(
                "cursor-pointer",
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

          {/* Afficher max 5 pages */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={cn(
                "cursor-pointer",
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export default function PerformanceRecapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId, isLoading: isCompanyLoading } = useCompany();
  const {
    setPerformanceData,
    indicatorsPerformance: contextIndicators,
    businessLinePerformances: contextBusinessLines,
    grandTotals: contextGrandTotals
  } = usePerformanceData();

  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('EUR');
  const [selectedKPI, setSelectedKPI] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLevel, setActiveLevel] = useState<'1' | '2' | 'total'>('1');

  // OPTIMISATION PERFORMANCE: Ne rendre qu'UNE section à la fois
  // Évite le recalcul des IIFEs des sections non visibles
  const [activeSection, setActiveSection] = useState<'indicators' | 'ekh' | 'synthesis' | 'primes'>('indicators');

  // État pour les indicateurs rétractables (tous fermés par défaut)
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(new Set());

  // Toggle pour ouvrir/fermer un indicateur
  const toggleIndicator = useCallback((kpiType: string) => {
    setExpandedIndicators(prev => {
      const next = new Set(prev);
      if (next.has(kpiType)) {
        next.delete(kpiType);
      } else {
        next.add(kpiType);
      }
      return next;
    });
  }, []);

  // ============================================
  // OPTIMISATION: useTransition pour changements non-bloquants
  // ============================================
  const [isLevelPending, startLevelTransition] = useTransition();
  const [isSectionPending, startSectionTransition] = useTransition();

  // Handler optimisé pour le changement de section (non-bloquant)
  const handleSectionChange = useCallback((newSection: 'indicators' | 'ekh' | 'synthesis' | 'primes') => {
    startSectionTransition(() => {
      setActiveSection(newSection);
    });
  }, []);

  // Handler optimisé pour le changement de niveau
  const handleLevelChange = useCallback((newLevel: '1' | '2' | 'total') => {
    startLevelTransition(() => {
      setActiveLevel(newLevel);
    });
  }, []);

  // ============================================
  // PAGINATION: État pour limiter le nombre de lignes affichées
  // ============================================
  // OPTIMISATION PERFORMANCE: Réduit de 50 à 10 pour limiter les nœuds DOM
  // 10 employés × 10 colonnes = 100 cellules max par groupe au lieu de 500
  const EMPLOYEES_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    ekhN1: 1,
    ekhN2: 1,
    ekhTotal: 1,
    primeDistribution: 1,
    syntheseN1: 1,
    syntheseTotal: 1
  });

  // Reset pagination when level changes
  useEffect(() => {
    setCurrentPage(prev => ({
      ...prev,
      ekhN1: 1,
      ekhN2: 1,
      ekhTotal: 1,
      syntheseN1: 1,
      syntheseTotal: 1
    }));
  }, [activeLevel]);

  // Data states
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [employeePerformances, setEmployeePerformances] = useState<EmployeePerformance[]>([]);

  // Paramètres financiers de l'entreprise (de la feuille '2-Tri-TB Fixe-Données Risko M1')
  // Ces valeurs viennent du module HCM Performance Plan
  const [financialParams, setFinancialParams] = useState({
    recettesN1: 0,        // L3 - Recettes N-1
    depensesN1: 0,        // M3 - Dépenses N-1
    volumeHoraireN1: 1,   // K3 - Volume horaire N-1 (1 par défaut pour éviter division par 0)
    pprAnnuelReference: 0, // O3 - PPR annuel de référence (pour formule PPR PREVUES)
    // PPR N+1 (gainsN1) et taux par indicateur depuis Page 14 Priority Actions N+1
    gainsN1: 0,           // PPR total trimestriel N+1
    indicatorRates: {
      abs: 0,   // indicator_absenteeism_rate
      qd: 0,    // indicator_quality_rate
      oa: 0,    // indicator_accidents_rate
      ddp: 0,   // indicator_productivity_rate
      ekh: 0    // indicator_knowhow_rate
    }
  });

  // Business Lines du Module 1 avec budgets (pour le calcul PPR par ligne d'activité)
  // Source: factors.businessLines depuis company_performance_scores
  interface Module1BusinessLine {
    id: number;
    activityName: string;
    staffCount: number;
    budget: number;
    budgetRate?: number;
  }
  const [module1BusinessLines, setModule1BusinessLines] = useState<Module1BusinessLine[]>([]);

  // Référence totale pour calcul du pourcentage de pertes ($E$3)
  const [totalScoreFinancierReference, setTotalScoreFinancierReference] = useState(0);

  // PHASE 2: États pour le cache de performance
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheLastUpdated, setCacheLastUpdated] = useState<Date | null>(null);

  // OPTIMISATION 10K: État de progression du calcul async
  const [calculationProgress, setCalculationProgress] = useState<{
    isCalculating: boolean;
    current: number;
    total: number;
    percentage: number;
  }>({ isCalculating: false, current: 0, total: 0, percentage: 0 });

  // Smart Calendar - Dernière semaine complétée (avec données)
  const [lastCompletedWeek, setLastCompletedWeek] = useState<LastCompletedWeekResult | null>(null);

  // Semaine et année fiscale pour le cache (depuis lastCompletedWeek)
  const currentFiscalWeek = useMemo(() => {
    return lastCompletedWeek?.weekNumber || 1;
  }, [lastCompletedWeek]);

  const currentFiscalYear = useMemo(() => {
    if (lastCompletedWeek?.weekStart) {
      return lastCompletedWeek.weekStart.getFullYear();
    }
    return new Date().getFullYear(); // Fallback
  }, [lastCompletedWeek]);

  // Fetch all data
  useEffect(() => {
    // Guard: wait for companyId to be available
    if (!user || isCompanyLoading || !companyId) {
      return;
    }

    let isMounted = true;

    // TIMEOUT DE SÉCURITÉ: Éviter un chargement infini (30 secondes max)
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[PerformanceRecapPage] Safety timeout reached - forcing loading to false');
        setLoading(false);
      }
    }, 30000);

    const fetchAllData = async () => {
      try {
        setLoading(true);

        // ============================================
        // PHASE 0: Charger la DERNIÈRE SEMAINE COMPLÉTÉE (avec données)
        // ============================================
        const completedWeek = await getLastCompletedWeek(companyId);

        let periodStart: string | null = null;
        let periodEnd: string | null = null;

        if (completedWeek) {
          setLastCompletedWeek(completedWeek);
          console.log('[PerformanceRecapPage] ✅ Last completed week:', completedWeek.periodLabel);

          // Format for Supabase query
          periodStart = completedWeek.weekStart.toISOString().split('T')[0];
          periodEnd = completedWeek.weekEnd.toISOString().split('T')[0];
        } else {
          console.warn('[PerformanceRecapPage] ⚠️ No completed week found');
        }

        // ============================================
        // PHASE 2: Tentative de lecture depuis le cache
        // ============================================
        // Si le cache est valide, on peut afficher instantanément
        try {
          const cacheService = createPerformanceCacheService(companyId);
          const cacheStatus = await cacheService.getCacheStatus(currentFiscalWeek, currentFiscalYear);

          // 🚫 CACHE DÉSACTIVÉ TEMPORAIREMENT - PPR doivent être recalculées depuis les sources
          // Raison: Le cache stocke des PPR obsolètes qui ne reflètent pas les paramètres actuels
          // TODO: Refactoriser pour recalculer les PPR même avec le cache
          if (false && cacheStatus.exists && !cacheStatus.isStale && cacheStatus.entryCount > 0) {
            // Cache valide - charger les données essentielles en parallèle avec le cache
            // IMPORTANT: Inclure team_members pour récupérer les noms des salariés
            const [cachedData, blResult, membersResult] = await Promise.all([
              cacheService.getFromCache(currentFiscalWeek, currentFiscalYear),
              supabase
                .from('business_lines')
                .select('id, activity_name, team_leader')
                .eq('company_id', companyId)
                .order('created_at', { ascending: true }),
              supabase
                .from('team_members')
                .select('id, name, professional_category, coefficient_competence, business_line_id, incapacity_rate, odoo_employee_id')
                .eq('company_id', companyId)
            ]);

            if (!isMounted) return;

            if (cachedData && cachedData.length > 0 && blResult.data && membersResult.data) {
              // Reconstruire employeePerformances depuis le cache
              const blData = blResult.data;
              const membersData = membersResult.data;
              setBusinessLines(blData);

              // Créer un map des membres pour accès rapide par ID
              const membersMap = new Map<string, typeof membersData[0]>();
              membersData.forEach(member => {
                membersMap.set(member.id, member);
              });

              // Grouper les données du cache par employé
              const employeeMap = new Map<string, any>();

              cachedData.forEach(entry => {
                if (!employeeMap.has(entry.employee_id)) {
                  // Récupérer les infos du salarié depuis team_members
                  const memberInfo = membersMap.get(entry.employee_id);

                  employeeMap.set(entry.employee_id, {
                    employeeId: entry.employee_id,
                    odooEmployeeId: memberInfo?.odoo_employee_id || '',
                    employeeName: memberInfo?.name || '', // Nom du salarié depuis team_members
                    professionalCategory: memberInfo?.professional_category || '',
                    incapacityRate: memberInfo?.incapacity_rate || 0,
                    coefficientCompetence: memberInfo?.coefficient_competence || 0,
                    businessLineId: entry.business_line_id,
                    businessLineName: blData.find(bl => bl.id === entry.business_line_id)?.activity_name || '',
                    abs: null, qd: null, oa: null, ddp: null, ekh: null
                  });
                }

                const emp = employeeMap.get(entry.employee_id)!;
                emp[entry.indicator_key] = {
                  tempsCollecte: 0,
                  tempsCalcul: entry.temps_calcul,
                  fraisCollectes: entry.frais_collectes,
                  scoreFinancier: entry.score_financier,
                  pertesConstatees: entry.pertes_constatees,
                  pprPrevues: entry.ppr_prevues,
                  economiesRealisees: entry.economies_realisees,
                  economiesRealisees2: 0,
                  pertesEnPourcentage: entry.pertes_pct,
                  codePRC: true,
                  tempsCollecteN2: 0,
                  tempsCalculN2: 0,
                  tempsPrisEnCompte: 0,
                  fraisCollectesN2: 0,
                  fraisPrisEnCompte: 0,
                  scoreFinancierN2: 0,
                  pertesConstateesN2: 0,
                  pprPrevuesN2: 0,
                  economiesRealiseesN2: 0,
                  economiesRealisees2N2: 0,
                  pertesEnPourcentageN2: 0
                };
              });

              const performances = Array.from(employeeMap.values());
              setEmployeePerformances(performances);
              setIsFromCache(true);
              setCacheLastUpdated(cacheStatus.lastCalculated);
              setLoading(false);

              console.log(`[PerformanceCache] Loaded ${performances.length} employees from cache (${cacheStatus.entryCount} entries)`);
              return; // Sortir - pas besoin de recalculer
            }
          }
        } catch (cacheError) {
          // Erreur de cache - continuer avec le calcul normal
          console.warn('[PerformanceCache] Cache read failed, falling back to calculation:', cacheError);
        }

        // ============================================
        // PHASE 1: Requêtes parallèles indépendantes (fallback si pas de cache)
        // ============================================
        // business_lines, cost_entries et performance_scores peuvent être chargés en parallèle

        // Build cost entries query with optional period filter
        let entriesQuery = supabase
          .from('module3_cost_entries')
          .select('*')
          .eq('company_id', companyId);

        // FILTER BY PERIOD if Smart Calendar data is available
        if (periodStart && periodEnd) {
          entriesQuery = entriesQuery
            .gte('period_start', periodStart)
            .lte('period_end', periodEnd);
        }

        const [blResult, entriesResult, scoreResult] = await Promise.all([
          // 1. Fetch business lines
          supabase
            .from('business_lines')
            .select('id, activity_name, team_leader')
            .eq('company_id', companyId)
            .order('created_at', { ascending: true }),

          // 2. Fetch cost entries (première page - on pagine après si besoin) - WITH PERIOD FILTER
          entriesQuery
            .order('created_at', { ascending: false })
            .range(0, PAGE_SIZE_ENTRIES - 1),

          // 3. Fetch performance scores
          supabase
            .from('company_performance_scores')
            .select('factors')
            .eq('company_id', companyId)
            .eq('module_number', 1)
            .order('calculation_date', { ascending: false })
            .limit(1)
            .single()
        ]);

        if (!isMounted) return;

        // Traiter business lines
        if (blResult.error) throw blResult.error;
        const blData = blResult.data || [];
        setBusinessLines(blData);

        // Traiter cost entries (continuer pagination si nécessaire)
        if (entriesResult.error) throw entriesResult.error;
        let allEntries: any[] = entriesResult.data || [];

        // Continuer la pagination des entries si nécessaire (en parallèle avec members)
        const fetchRemainingEntries = async () => {
          if ((entriesResult.data?.length || 0) === PAGE_SIZE_ENTRIES) {
            let entriesPage = 1;
            let hasMoreEntries = true;
            while (hasMoreEntries) {
              const from = entriesPage * PAGE_SIZE_ENTRIES;
              const to = from + PAGE_SIZE_ENTRIES - 1;

              // Build query with period filter
              let paginationQuery = supabase
                .from('module3_cost_entries')
                .select('*')
                .eq('company_id', companyId);

              // FILTER BY PERIOD if Smart Calendar data is available
              if (periodStart && periodEnd) {
                paginationQuery = paginationQuery
                  .gte('period_start', periodStart)
                  .lte('period_end', periodEnd);
              }

              const { data: moreEntries, error: entriesError } = await paginationQuery
                .order('created_at', { ascending: false })
                .range(from, to);

              if (!isMounted) return allEntries;
              if (entriesError) throw entriesError;

              allEntries = [...allEntries, ...(moreEntries || [])];
              entriesPage++;
              hasMoreEntries = (moreEntries?.length || 0) === PAGE_SIZE_ENTRIES;
            }
          }
          return allEntries;
        };

        // ============================================
        // PHASE 2: Requêtes dépendantes (team_members dépend de businessLineIds)
        // ============================================
        const businessLineIds = blData.map(bl => bl.id);

        // Lancer en parallèle: pagination entries + fetch members
        const fetchMembers = async () => {
          let membersData: TeamMember[] = [];
          if (businessLineIds.length > 0) {
            let page = 0;
            let hasMore = true;
            while (hasMore) {
              const from = page * PAGE_SIZE_MEMBERS;
              const to = from + PAGE_SIZE_MEMBERS - 1;
              const { data: members, error: membersError } = await supabase
                .from('module3_team_members')
                .select('id, name, professional_category, tech_level, business_line_id, incapacity_rate, versatility_f1, versatility_f2, versatility_f3')
                .in('business_line_id', businessLineIds)
                .order('name', { ascending: true })
                .range(from, to);

              if (!isMounted) return membersData;
              if (membersError) throw membersError;

              const formattedMembers = (members || []).map(m => ({
                ...m,
                incapacity_rate: m.incapacity_rate || 0,
                versatility_f1: m.versatility_f1 || '',
                versatility_f2: m.versatility_f2 || '',
                versatility_f3: m.versatility_f3 || ''
              }));
              membersData = [...membersData, ...formattedMembers];
              page++;
              hasMore = (members?.length || 0) === PAGE_SIZE_MEMBERS;
            }
          }
          return membersData;
        };

        // Exécuter en parallèle
        const [membersData, finalEntries] = await Promise.all([
          fetchMembers(),
          fetchRemainingEntries()
        ]);

        if (!isMounted) return;
        setTeamMembers(membersData);
        setCostEntries(finalEntries);

        // ============================================
        // PHASE 3: Traitement des paramètres financiers
        // ============================================
        const scoreData = scoreResult.data;

        let fetchedFinancialParams = {
          recettesN1: 0,        // L3 - Sales/Turnover (Financial History)
          depensesN1: 0,        // M3 - Total Spending (Financial History)
          volumeHoraireN1: 1,   // K3 - Annual Hours per Person (Employee Engagement)
          pprAnnuelReference: 0 // O3 - PPR annuel de référence
        };

        if (!isMounted) return;

        if (scoreData?.factors) {
          const factors = scoreData.factors as any;

          // Set currency
          if (factors.selectedCurrency) {
            setSelectedCurrency(factors.selectedCurrency as Currency);
          }

          // Extract financial parameters from HCM Performance Plan data
          // Ces données viennent du module HCM Performance Plan / Page 3

          // Recettes N-1 (Sales/Turnover) - dernière année de l'historique financier
          // Source: employeeEngagement.financialHistory.sales
          // CORRECTION: On garde les valeurs brutes, pas de conversion
          if (factors.employeeEngagement?.financialHistory?.length > 0) {
            const financialHistory = factors.employeeEngagement.financialHistory;
            // CORRECTION BUG: N-1 est à l'INDEX 0, pas à la fin du tableau
            // L'array est ordonné: [N-1, N-2, N-3, N-4, N-5]
            const yearN1 = financialHistory.find((y: any) => y.year === 'N-1') || financialHistory[0];
            if (yearN1) {
              // Valeurs brutes - pas de multiplication par 1000
              fetchedFinancialParams.recettesN1 = yearN1.sales || 0;
              fetchedFinancialParams.depensesN1 = yearN1.spending || 0;
            }
          }

          // Volume Horaire N-1 (Annual Hours per Person)
          // CORRECTION: On utilise directement annualHoursPerPerson, PAS multiplié par le nombre d'employés
          // Car la formule est: ((Recettes - Dépenses) / Volume Horaire) × Temps Collecté
          if (factors.employeeEngagement?.annualHoursPerPerson) {
            fetchedFinancialParams.volumeHoraireN1 = factors.employeeEngagement.annualHoursPerPerson;
          }

          // PPR Annuel de Référence (O3) - Paramètre pour formule PPR PREVUES
          // Source: HCM Performance Plan - Score/Final Score ou calculé
          // Le PPR annuel représente les Pertes Prévisionnelles de Référence pour l'année
          // CORRECTION: Valeurs brutes - pas de multiplication par 1000
          if (factors.finalScore?.breakdown?.totalPotentialLoss) {
            // Utiliser le totalPotentialLoss calculé par le Module 1
            fetchedFinancialParams.pprAnnuelReference = factors.finalScore.breakdown.totalPotentialLoss;
          } else if (factors.employeeEngagement?.financialHistory?.length > 0) {
            // Sinon, estimer le PPR à partir de l'historique financier
            // PPR estimé = (Recettes - Dépenses) * 5% (taux de pertes estimé)
            const financialHistory = factors.employeeEngagement.financialHistory;
            // CORRECTION BUG: N-1 est à l'INDEX 0, pas à la fin du tableau
            const yearN1 = financialHistory.find((y: any) => y.year === 'N-1') || financialHistory[0];
            if (yearN1) {
              // Valeurs brutes - pas de multiplication par 1000
              const marge = (yearN1.sales || 0) - (yearN1.spending || 0);
              // Estimer 5% de la marge comme PPR de référence
              fetchedFinancialParams.pprAnnuelReference = Math.abs(marge) * 0.05;
            }
          }

          // 🆕 NOUVELLE LOGIQUE: Récupérer gainsN1 et les taux par indicateur
          // Source: Page 14 - Priority Actions N+1 (calculatedFields)
          // gainsN1 = PPR total trimestriel N+1
          // indicator_*_rate = pourcentage de répartition par indicateur
          if (factors.calculatedFields) {
            const calc = factors.calculatedFields;

            // gainsN1 = PPR trimestriel N+1 (valeur totale pour le trimestre)
            (fetchedFinancialParams as any).gainsN1 = calc.gainsN1 || 0;

            // Taux par indicateur (en %)
            (fetchedFinancialParams as any).indicatorRates = {
              abs: calc.indicator_absenteeism_rate || 0,    // Absentéisme
              qd: calc.indicator_quality_rate || 0,         // Défauts Qualité
              oa: calc.indicator_accidents_rate || 0,       // Accidents du Travail
              ddp: calc.indicator_productivity_rate || 0,   // Écarts Productivité
              ekh: calc.indicator_knowhow_rate || 0         // Écarts Know-How
            };

            // 🆕 Récupérer les distributions PPR par personne DÉJÀ CALCULÉES (priorityActionsN1)
            // Source: Page 14 - Priority Actions N+1
            // Structure: { businessLine, staffCount, budgetRate, distributions: [{ indicator, perLine, perPerson }] }
            if (calc.priorityActionsN1 && Array.isArray(calc.priorityActionsN1) && calc.priorityActionsN1.length > 0) {
              (fetchedFinancialParams as any).priorityActionsN1 = calc.priorityActionsN1;
              } else {
              // 🆕 FALLBACK: Récupérer depuis la table calculated_metrics
              // Si priorityActionsN1 n'est pas dans le JSON, utiliser le CalculatedMetricsService
              try {
                const metricsService = createMetricsService(companyId);
                const priorityActionsFromDB = await metricsService.getPriorityActions(1); // yearOffset=1 pour N+1

                if (priorityActionsFromDB && priorityActionsFromDB.length > 0) {
                  (fetchedFinancialParams as any).priorityActionsN1 = priorityActionsFromDB;
                  } else {
                  }
              } catch (dbError) {
                console.error('Error fetching Priority Actions from DB:', dbError);
              }
            }

            // 🆕 Récupérer gainsN1 depuis la table calculated_metrics si absent du JSON
            if (!(fetchedFinancialParams as any).gainsN1 || (fetchedFinancialParams as any).gainsN1 === 0) {
              try {
                const metricsService = createMetricsService(companyId);
                const gainsFromDB = await metricsService.getGains(1); // yearOffset=1 pour N+1

                if (gainsFromDB > 0) {
                  (fetchedFinancialParams as any).gainsN1 = gainsFromDB;
                  }
              } catch (dbError) {
                console.error('Error fetching Gains from DB:', dbError);
              }
            }

            // 🆕 Récupérer les taux d'indicateurs depuis la table calculated_metrics si absents du JSON
            const indicatorRates = (fetchedFinancialParams as any).indicatorRates;
            const hasNoRates = !indicatorRates ||
              (indicatorRates.abs === 0 && indicatorRates.qd === 0 &&
               indicatorRates.oa === 0 && indicatorRates.ddp === 0 && indicatorRates.ekh === 0);

            if (hasNoRates) {
              try {
                const metricsService = createMetricsService(companyId);
                const ratesFromDB = await metricsService.getIndicatorRates();

                if (ratesFromDB && Object.keys(ratesFromDB).length > 0) {
                  (fetchedFinancialParams as any).indicatorRates = {
                    abs: ratesFromDB.absenteeism || 0,
                    qd: ratesFromDB.quality || 0,
                    oa: ratesFromDB.accidents || 0,
                    ddp: ratesFromDB.productivity || 0,
                    ekh: ratesFromDB.knowhow || 0
                  };
                  }
              } catch (dbError) {
                console.error('Error fetching indicator rates from DB:', dbError);
              }
            }
          }

          // 🆕 Récupérer les businessLines du Module 1 avec leurs budgets
          // Source: factors.businessLines (Page 4 - Business Lines du Module 1)
          // Ces données contiennent le budget et staffCount par ligne d'activité
          // nécessaires pour le calcul PPR par personne (Page 14 Priority Actions N+1)
          if (factors.businessLines && Array.isArray(factors.businessLines)) {
            const m1BusinessLines = factors.businessLines.map((bl: any) => ({
              id: bl.id,
              activityName: bl.activityName || '',
              staffCount: bl.staffCount || 0,
              budget: bl.budget || 0,
              budgetRate: bl.budgetRate || 0
            }));
            setModule1BusinessLines(m1BusinessLines);

            // Stocker dans fetchedFinancialParams pour le calcul
            (fetchedFinancialParams as any).module1BusinessLines = m1BusinessLines;
          }
        }

        if (!isMounted) return;

        // Update financial params state
        setFinancialParams(fetchedFinancialParams);

        // 5. Calculate performances with the fetched financial parameters and business lines
        // Calculer les performances avec le moteur de calcul TypeScript 100% conforme Excel
        // OPTIMISATION 10K: Appel async pour ne pas bloquer l'UI avec de grands datasets
        await calculatePerformances(membersData, finalEntries, fetchedFinancialParams, blData);

      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching performance data:', err);
        toast.error("Erreur lors du chargement des données de performance");
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
      clearTimeout(safetyTimeout);
    };
  }, [user, isCompanyLoading, companyId]);

  // ============================================
  // OPTIMISATION 10K: Constantes et helpers pour calcul async
  // ============================================
  const CHUNK_SIZE = 100; // Traiter 100 salariés par chunk

  // Helper pour scheduler le prochain chunk sans bloquer l'UI
  const scheduleChunk = (callback: () => void): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => { callback(); resolve(); }, { timeout: 50 });
      } else {
        setTimeout(() => { callback(); resolve(); }, 0);
      }
    });
  };

  const calculatePerformances = async (
    members: TeamMember[],
    entries: CostEntry[],
    finParams?: {
      recettesN1: number;
      depensesN1: number;
      volumeHoraireN1: number;
      pprAnnuelReference: number;
      gainsN1?: number;
      indicatorRates?: { abs: number; qd: number; oa: number; ddp: number; ekh: number };
    },
    blData?: BusinessLine[]
  ): Promise<void> => {
    // Utiliser les paramètres passés ou l'état actuel
    const params = finParams || financialParams;

    // Créer une map des business lines pour lookup rapide
    const blMap = new Map<string, BusinessLine>();
    (blData || businessLines).forEach(bl => blMap.set(bl.id, bl));

    // Compter le nombre de membres par business line pour le calcul PPR par personne
    const memberCountByBusinessLine = new Map<string, number>();
    members.forEach(m => {
      const currentCount = memberCountByBusinessLine.get(m.business_line_id) || 0;
      memberCountByBusinessLine.set(m.business_line_id, currentCount + 1);
    });

    // Group entries by employee and KPI type
    const entriesByEmployee = new Map<string, Map<string, CostEntry[]>>();

    entries.forEach(entry => {
      if (!entriesByEmployee.has(entry.employee_id)) {
        entriesByEmployee.set(entry.employee_id, new Map());
      }
      const employeeEntries = entriesByEmployee.get(entry.employee_id)!;
      if (!employeeEntries.has(entry.kpi_type)) {
        employeeEntries.set(entry.kpi_type, []);
      }
      employeeEntries.get(entry.kpi_type)!.push(entry);
    });

    // ============================================
    // 🆕 MÉMORISATION PPR: Pré-calcul O(BL × 5) au lieu de O(membres × 5)
    // ============================================
    // Calcule une fois toutes les PPR par business line et indicateur
    // Évite les recalculs redondants pour chaque membre de la même BL
    const memoizedPPRByBusinessLine = new Map<string, Map<string, number>>();
    const indicators = ['absenteeism', 'quality', 'accidents', 'productivity', 'knowhow'];

    for (const bl of params.module1BusinessLines || []) {
      const indicatorMap = new Map<string, number>();
      for (const indicator of indicators) {
        // 🔧 FIX: calculatePPRPerPersonFromSources retourne la valeur ANNUELLE
        // Mais calculatePPRPrevues() attend une valeur TRIMESTRIELLE
        // Donc on divise par 4 pour convertir ANNUEL → TRIMESTRIEL
        const pprAnnuel = calculatePPRPerPersonFromSources(
          bl.activityName,
          indicator,
          params.gainsN1 || 0,
          params.indicatorRates,
          params.module1BusinessLines
        );
        const pprTrimestriel = pprAnnuel / 4; // 🔧 Conversion ANNUEL → TRIMESTRIEL
        indicatorMap.set(indicator, pprTrimestriel);
      }
      // Stocker avec clé lowercase pour lookup insensible à la casse
      memoizedPPRByBusinessLine.set(bl.activityName.toLowerCase(), indicatorMap);
    }

    // ============================================
    // OPTIMISATION 10K: Fonction interne pour traiter un membre
    // ============================================
    const processSingleMember = (member: TeamMember): EmployeePerformance => {
      const memberEntries = entriesByEmployee.get(member.id) || new Map();
      const coefficientCompetence = calculateCoefficientCompetence(
        member.versatility_f1,
        member.versatility_f2,
        member.versatility_f3
      );

      // Récupérer les informations de la business line
      const memberBusinessLine = blMap.get(member.business_line_id);

      // Le salarié existe si son nom est défini (B6 <> 0 dans Excel)
      const salariéExiste = member.name && member.name.trim() !== '';

      const calculateIndicatorData = (kpiType: string): IndicatorData => {
        const kpiEntries = memberEntries.get(kpiType) || [];

        // Aggregate data from all entries for this KPI
        let totalHours = 0;
        let totalMinutes = 0;
        let totalFrais = 0;
        let totalSavedExpenses = 0;
        let totalRecoveredHours = 0;
        let totalRecoveredMinutes = 0;

        kpiEntries.forEach(entry => {
          totalHours += entry.duration_hours || 0;
          totalMinutes += entry.duration_minutes || 0;
          totalFrais += entry.compensation_amount || 0;
          totalSavedExpenses += entry.saved_expenses || 0;
          totalRecoveredHours += entry.recovered_time_hours || 0;
          totalRecoveredMinutes += entry.recovered_time_minutes || 0;
        });

        // NIVEAU 1: Données collectées
        const tempsCollecte = convertToDecimalHours(totalHours, totalMinutes);
        // Formule Excel: =E6+0 (Temps-Calcul = Temps collecté)
        const tempsCalculN1 = calculateTempsCalcul(tempsCollecte);
        const fraisCollectes = totalFrais;

        // NIVEAU 2: Données collectées
        // 🔧 FIX 2026-01-14: Correction bug tempsCalculN2 hardcodé à 0
        // Formule Excel DK6: =SI(ESTERREUR('20-Tri-NIVEAU2-LIGNES'!$S$37>0);0;(...))
        // Les données N2 utilisent les mêmes entrées que N1 pour l'affichage individuel
        const tempsCollecteN2 = tempsCollecte; // Utiliser les données réelles des entrées
        // Formule Excel DL6: =DK6+0 (M3-Temps-Calcul N2)
        const tempsCalculN2 = calculateTempsCalcul(tempsCollecteN2); // = tempsCollecteN2 + 0

        // For EKH, calculations are based on coefficient de compétence
        let scoreFinancier: number;
        if (kpiType === 'ekh') {
          // Score EKH = coefficient de compétence × facteur économique
          const FACTEUR_EKH = 1000; // Valeur économique par point de coefficient
          scoreFinancier = coefficientCompetence * FACTEUR_EKH;
        } else {
          // Formule Excel: Score Financier = ((L3 - M3) / K3) * E6 * 1000
          scoreFinancier = calculateScoreFinancier(
            tempsCalculN1,
            params.recettesN1,
            params.depensesN1,
            params.volumeHoraireN1
          );
        }

        // 🆕 PPR PREVUES - CALCULÉ AVANT PERTES (nécessaire pour formule Excel)
        // Source: priorityActionsN1 depuis calculatedFields (Module 1)
        // Structure: { businessLine, staffCount, budgetRate, distributions: [{ indicator, perLine, perPerson }] }
        const priorityActionsN1 = (params as any).priorityActionsN1 || [];

        // Convertir kpiType en indicatorId de Page 14
        const getIndicatorId = (kpi: string): string => {
          switch (kpi) {
            case 'abs': return 'absenteeism';
            case 'qd': return 'quality';
            case 'oa': return 'accidents';
            case 'ddp': return 'productivity';
            case 'ekh': return 'knowhow';
            default: return '';
          }
        };

        const indicatorId = getIndicatorId(kpiType);
        const memberBLName = memberBusinessLine?.activity_name || '';

        // 🆕 LOOKUP O(1) depuis le Map pré-calculé (au lieu de recalculer pour chaque membre)
        // Les PPR ont été pré-calculées une seule fois pour toutes les BL × indicateurs
        const pprParPersonneParIndicateur = memoizedPPRByBusinessLine
          .get(memberBLName.toLowerCase())
          ?.get(indicatorId) || 0;

        // PPR semaine = perPerson / 3 mois / 4 semaines
        const pprPrevues = calculatePPRPrevues(salariéExiste, pprParPersonneParIndicateur);

        // Formule Excel M6: Pertes Constatées (brut) = SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))
        // Où H6 = Score Financier, G6 = Frais, D6 = PPR Prévues
        const pertesConstateesBrut = calculatePertesConstateesBrut(
          scoreFinancier,
          fraisCollectes,
          pprPrevues  // D6 = PPR Prévues (corrigé: était member.incapacity_rate)
        );

        // Application du taux d'incapacité (Logique B)
        const pertesConstatees = calculatePertesConstateesAvecIncapacite(pertesConstateesBrut, member.incapacity_rate);

        // Formule Excel: ECONOMIES (brut) = SI(M6<0;J6-0;SI(M6>0;J6-M6;SI(M6=0;J6-M6)))
        const economiesBrut = calculateEconomiesRealiseesBrut(pprPrevues, pertesConstatees);

        // Formule Excel: ECONOMIES REALISEES = SI(ET(F6=0;T6=0;B6<>0);N6;...)
        const economiesRealisees = calculateEconomiesRealiseesN1(
          tempsCalculN1,
          tempsCalculN2,
          salariéExiste,
          economiesBrut
        ) + totalSavedExpenses;

        // PASSE 1: pertesEnPourcentage = 0 (placeholder)
        // La vraie valeur sera calculée en PASSE 2 après avoir le total des pertes ($E$3)
        // Formule Excel L6: =SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6/$E$3)))
        // $E$3 = Total pertes N1 + N2 de tous les salariés (inconnu à ce stade)
        const pertesEnPourcentage = 0; // Recalculé à l'affichage avec le bon $E$3

        // NIVEAU 2: Code PRC et données prises en compte
        const hasEntries = kpiEntries.length > 0 && tempsCollecteN2 > 0;
        // Formule Excel: code PRC = SI(O6=0;0;SI(O6>0;1))
        const codePRCValue = calculateCodePRC(tempsCollecteN2);
        const codePRC = codePRCValue === 1;

        // Formule Excel: M3-Temps-Pris en compte = SI(P6=0;0;SI(P6>0;T6))
        const tempsPrisEnCompte = calculateTempsPrisEnCompte(codePRCValue, tempsCalculN2);

        // Formule Excel: M3-Les frais-Pris en compte = SI(P6=0;0;SI(P6>0;V6))
        const fraisPrisEnCompte = calculateFraisPrisEnCompte(codePRCValue, totalSavedExpenses);

        // ECONOMIES REALISEES 2 (N1) = J6-M6
        const economiesRealisees2 = calculateEconomiesRealiseesBrut(pprPrevues, pertesConstatees);

        // ============================================
        // NIVEAU 2 - Calculs complets
        // ============================================

        // M3-Les frais N2 (frais collectés au niveau 2)
        const fraisCollectesN2 = totalSavedExpenses;

        // Score Financier NIVEAU 2: Formule avec U6 (tempsPrisEnCompte)
        let scoreFinancierN2: number;
        if (kpiType === 'ekh') {
          scoreFinancierN2 = codePRC ? coefficientCompetence * 1000 : 0;
        } else {
          scoreFinancierN2 = calculateScoreFinancierN2(
            tempsPrisEnCompte,
            params.recettesN1,
            params.depensesN1,
            params.volumeHoraireN1
          );
        }

        // PPR PREVUES NIVEAU 2 = J6 (même que N1, calculé AVANT pertes)
        const pprPrevuesN2 = pprPrevues;

        // Pertes Constatées NIVEAU 2 BRUTES (AC6): =SI((X6+W6)=0;0;SI((X6+W6)>0;(X6+W6)-R6))
        // Où X6 = Score Financier N2, W6 = Frais N2, R6 = PPR Prévues N2
        const pertesConstateesN2Brut = calculatePertesConstateesN2(
          scoreFinancierN2,
          fraisPrisEnCompte,
          pprPrevuesN2  // R6 = PPR Prévues N2 (corrigé: était member.incapacity_rate)
        );

        // ECONOMIES REALISEES 2 NIVEAU 2 = Z6-AC6 (calculé d'abord car nécessaire pour économies N2)
        const economiesRealisees2N2 = calculateEconomiesRealisees2N2(pprPrevuesN2, pertesConstateesN2Brut);

        // ECONOMIES REALISEES 1 NIVEAU 2 (DW6)
        // =SI(ET(F6=0;U6=0);0;SI(ET(F6>0;U6=0);0;SI(ET(F6=0;U6>0);AD6)))
        // AD6 = PPR Prévues N2 (pas economiesRealisees2N2)
        const economiesRealiseesN2 = calculateEconomiesRealiseesN2(
          tempsCalculN1,
          tempsPrisEnCompte,
          pprPrevuesN2  // AD6 = PPR Prévues N2
        );

        // 🆕 PERTES CONSTATÉES AVEC LOGIQUE CROISÉE N1/N2 (DQ6)
        // Formule Excel: =IF(AND(DE6=0,DW6=0,DG6<>0),0,IF(AND(DE6=0,DW6=0,DG6=0),0,
        //   IF(AND(DE6>0,DW6=0),0,IF(AND(DE6=0,DW6>0,DG6<>0),DV6,IF(AND(DE6=0,DW6>0,DG6=0),0)))))
        // Logique: Évite le double-comptage des pertes entre N1 et N2
        const pertesConstateesN2Final = calculatePertesConstateesN2AvecLogiqueCroisee(
          economiesRealisees,      // DE6 = Économies Réalisées N1
          economiesRealiseesN2,    // DW6 = Économies Réalisées N2
          salariéExiste,           // DG6 = Salarié existe
          pertesConstateesN2Brut   // DV6 = Pertes N2 brutes
        );

        // Pertes en % NIVEAU 2 (sera recalculé avec total reference)
        // Pour l'instant, utiliser pprPrevues comme référence temporaire
        // PASSE 1: pertesEnPourcentageN2 = 0 (placeholder)
        // La vraie valeur sera calculée en PASSE 2 après avoir le total des pertes ($E$3)
        // Formule Excel AB6: =SI(AC6<0;0;SI(AC6=0;0;SI(AC6>0;AC6/$E$3)))
        // $E$3 = Total pertes N1 + N2 de tous les salariés (inconnu à ce stade)
        const pertesEnPourcentageN2 = 0; // Recalculé à l'affichage avec le bon $E$3

        return {
          // NIVEAU 1
          tempsCollecte,
          tempsCalcul: tempsCalculN1,
          fraisCollectes,
          scoreFinancier,
          pertesConstateesBrut,  // 🆕 Pertes Constatées (brut) = SI((H6+G6)=0;0;SI((H6+G6)>0;(H6+G6)-D6))
          pertesConstatees,
          pprPrevues,
          economiesRealisees,
          economiesRealisees2,
          pertesEnPourcentage,
          // NIVEAU 2
          codePRC,
          tempsCollecteN2,
          tempsCalculN2,
          tempsPrisEnCompte,
          fraisCollectesN2,
          fraisPrisEnCompte,
          scoreFinancierN2,
          pertesConstateesN2: pertesConstateesN2Final,
          pprPrevuesN2,
          economiesRealiseesN2,
          economiesRealisees2N2,
          pertesEnPourcentageN2
        };
      };

      return {
        employeeId: member.id,
        employeeName: member.name,
        professionalCategory: member.professional_category || 'Non définie',
        incapacityRate: member.incapacity_rate,
        coefficientCompetence,
        businessLineId: member.business_line_id,
        businessLineName: memberBusinessLine?.activity_name || 'Équipe inconnue',
        abs: calculateIndicatorData('abs'),
        qd: calculateIndicatorData('qd'),
        oa: calculateIndicatorData('oa'),
        ddp: calculateIndicatorData('ddp'),
        ekh: calculateIndicatorData('ekh')
      };
    }; // Fin de processSingleMember

    // ============================================
    // OPTIMISATION 10K: Traitement async par chunks
    // ============================================
    const totalMembers = members.length;

    // Pour moins de 200 salariés: calcul synchrone (pas de surcoût)
    if (totalMembers < 200) {
      const performances = members.map(processSingleMember);
      setEmployeePerformances(performances);
      return;
    }

    // Pour 200+ salariés: calcul async par chunks pour ne pas bloquer l'UI
    setCalculationProgress({ isCalculating: true, current: 0, total: totalMembers, percentage: 0 });

    const allPerformances: EmployeePerformance[] = [];

    for (let i = 0; i < totalMembers; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, totalMembers);
      const chunk = members.slice(i, chunkEnd);

      // Traiter ce chunk de manière async
      await scheduleChunk(() => {
        chunk.forEach(member => {
          allPerformances.push(processSingleMember(member));
        });
      });

      // Mettre à jour la progression
      const percentage = Math.round((chunkEnd / totalMembers) * 100);
      setCalculationProgress({
        isCalculating: true,
        current: chunkEnd,
        total: totalMembers,
        percentage
      });
    }

    // Fin du calcul
    setCalculationProgress({ isCalculating: false, current: totalMembers, total: totalMembers, percentage: 100 });
    setEmployeePerformances(allPerformances);
  };

  // Calculate totals for each indicator
  // Formule Excel: Les totaux sont la somme des valeurs individuelles
  // NIVEAU 1: SOMME(colonnes N1)
  // NIVEAU 2: SOMME(colonnes N2)
  // NIVEAU TOTAL: N1 + N2 combinés selon formules Excel spécifiques
  const calculateTotals = (kpiType: string): IndicatorTotals => {
    const getData = (perf: EmployeePerformance) => {
      switch (kpiType) {
        case 'abs': return perf.abs;
        case 'qd': return perf.qd;
        case 'oa': return perf.oa;
        case 'ddp': return perf.ddp;
        case 'ekh': return perf.ekh;
        default: return perf.abs;
      }
    };

    // Calculer tous les totaux en une seule passe
    const totals = employeePerformances.reduce((acc, perf) => {
      const data = getData(perf);

      // Pour EKH: ECONOMIES REALISEES = ECONOMIES DDP × Coefficient compétence
      // (formule correcte utilisée dans getEKHData et les tableaux détaillés)
      let economiesRealisees = data.economiesRealisees;
      let economiesRealiseesN2 = data.economiesRealisees2N2;

      if (kpiType === 'ekh') {
        const ddpData = perf.ddp;
        const coefficientCompetence = perf.coefficientCompetence || 0;
        const economiesDDP = ddpData.economiesRealisees || 0;
        // Score Financier = ECONOMIES DDP × Coef compétence
        economiesRealisees = economiesDDP * coefficientCompetence;
        economiesRealiseesN2 = 0; // N2 EKH = 0 car identique à N1 dans la formule
      }

      return {
        // NIVEAU 1 - Totaux
        tempsTotal: acc.tempsTotal + data.tempsCalcul,
        fraisTotal: acc.fraisTotal + data.fraisCollectes,
        scoreFinancierTotal: acc.scoreFinancierTotal + data.scoreFinancier,
        pertesConstateesBrutTotal: acc.pertesConstateesBrutTotal + data.pertesConstateesBrut,  // 🆕
        pertesConstateesTotal: acc.pertesConstateesTotal + data.pertesConstatees,
        pprPrevuesTotal: acc.pprPrevuesTotal + data.pprPrevues,
        economiesRealiseesTotal: acc.economiesRealiseesTotal + economiesRealisees,
        pertesEnPourcentageTotal: 0, // Calculé ci-dessous
        // NIVEAU 2 - Totaux
        tempsTotalN2: acc.tempsTotalN2 + data.tempsPrisEnCompte,
        fraisTotalN2: acc.fraisTotalN2 + data.fraisPrisEnCompte,
        scoreFinancierTotalN2: acc.scoreFinancierTotalN2 + data.scoreFinancierN2,
        pertesConstateesTotalN2: acc.pertesConstateesTotalN2 + data.pertesConstateesN2,
        economiesRealiseesTotalN2: acc.economiesRealiseesTotalN2 + economiesRealiseesN2,
        pertesEnPourcentageTotalN2: 0, // Calculé ci-dessous
        // NIVEAU TOTAL - Combinés (placeholders, calculés ci-dessous)
        tempsTotalCombine: 0,
        fraisTotalCombine: 0,
        scoreFinancierTotalCombine: 0,
        pertesConstateesTotalCombine: 0,
        economiesRealiseesTotalCombine: 0,
        pertesEnPourcentageTotalCombine: 0
      };
    }, {
      // NIVEAU 1 - Initialisation
      tempsTotal: 0,
      fraisTotal: 0,
      scoreFinancierTotal: 0,
      pertesConstateesBrutTotal: 0,  // 🆕
      pertesConstateesTotal: 0,
      pprPrevuesTotal: 0,
      economiesRealiseesTotal: 0,
      pertesEnPourcentageTotal: 0,
      // NIVEAU 2 - Initialisation
      tempsTotalN2: 0,
      fraisTotalN2: 0,
      scoreFinancierTotalN2: 0,
      pertesConstateesTotalN2: 0,
      economiesRealiseesTotalN2: 0,
      pertesEnPourcentageTotalN2: 0,
      // NIVEAU TOTAL - Initialisation
      tempsTotalCombine: 0,
      fraisTotalCombine: 0,
      scoreFinancierTotalCombine: 0,
      pertesConstateesTotalCombine: 0,
      economiesRealiseesTotalCombine: 0,
      pertesEnPourcentageTotalCombine: 0
    });

    // 🔧 FIX: $E$3 = Pertes constatées TOTAL (N1 + N2) - CALCULÉ EN PREMIER
    // Formule Excel: =SI(M6<0;0;SI(M6=0;0;SI(M6>0;M6/$E$3)))
    const totalPertesReference = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;

    // NIVEAU 1: Pertes en % = Pertes Constatées N1 / $E$3
    // Résultat: Contribution du N1 aux pertes totales
    totals.pertesEnPourcentageTotal = calculatePertesEnPourcentage(
      totals.pertesConstateesTotal,
      totalPertesReference > 0 ? totalPertesReference : 1
    );

    // NIVEAU 2: Pertes en % N2 = Pertes Constatées N2 / $E$3
    // Résultat: Contribution du N2 aux pertes totales
    totals.pertesEnPourcentageTotalN2 = calculatePertesEnPourcentageN2(
      totals.pertesConstateesTotalN2,
      totalPertesReference > 0 ? totalPertesReference : 1
    );

    // ============================================
    // NIVEAU TOTAL - Formules Excel exactes
    // ============================================

    // Colonne 1: M3-Temps-Calcul (h) = SOMME(F6:F1705)+SOMME(U6:U1705)
    totals.tempsTotalCombine = totals.tempsTotal + totals.tempsTotalN2;

    // Colonne 2: M3-Les frais = SOMME(G6:G1705)+SOMME(W6:W1705)
    totals.fraisTotalCombine = totals.fraisTotal + totals.fraisTotalN2;

    // Colonne 3: Score financier = SOMME(H6:H1705)+SOMME(X6:X1705)
    totals.scoreFinancierTotalCombine = totals.scoreFinancierTotal + totals.scoreFinancierTotalN2;

    // Colonne 4: Pertes Constatées = Formule Excel:
    // =SI((AH3+AH4)=0;0;SI((AH3+AH4)>0;(AH3+AH4)-E3))
    // Où AH3 = Score Financier Total Combiné, AH4 = Frais Total Combiné, E3 = Taux référence
    // Simplification: Si (ScoreTotal + FraisTotal) > 0, alors résultat, sinon 0
    const totalScoreEtFraisCombine = totals.scoreFinancierTotalCombine + totals.fraisTotalCombine;
    if (totalScoreEtFraisCombine === 0) {
      totals.pertesConstateesTotalCombine = 0;
    } else if (totalScoreEtFraisCombine > 0) {
      // La formule soustrait E3 (référence) mais dans le contexte des totaux,
      // on prend la somme directe des pertes N1 + N2
      totals.pertesConstateesTotalCombine = totals.pertesConstateesTotal + totals.pertesConstateesTotalN2;
    } else {
      totals.pertesConstateesTotalCombine = 0;
    }

    // Colonne 5: ECONOMIES REALISEES = SOMME(K6:K1705)+SOMME(AA6:AA1705)
    totals.economiesRealiseesTotalCombine = totals.economiesRealiseesTotal + totals.economiesRealiseesTotalN2;

    // Colonne 6: Pertes en % = SOMME(L6:L1705)+SOMME(AB6:AB1705)
    // Note: Dans Excel, c'est la somme des pourcentages individuels
    totals.pertesEnPourcentageTotalCombine = totals.pertesEnPourcentageTotal + totals.pertesEnPourcentageTotalN2;

    return totals;
  };

  // ============================================
  // OPTIMISATION PERFORMANCE: Mémorisation des totaux KPI
  // ============================================
  // Pré-calcule TOUS les totaux une seule fois quand employeePerformances change
  // Évite les recalculs multiples dans le JSX
  const memoizedKPITotals = useMemo(() => {
    console.time('🔴 MEMOIZED_KPI_TOTALS');
    const result = {
      abs: calculateTotals('abs'),
      qd: calculateTotals('qd'),
      oa: calculateTotals('oa'),
      ddp: calculateTotals('ddp'),
      ekh: calculateTotals('ekh')
    };
    console.timeEnd('🔴 MEMOIZED_KPI_TOTALS');
    return result;
  }, [employeePerformances]);

  // Fonction wrapper pour utiliser les totaux mémorisés
  const getTotals = useCallback((kpiType: string): IndicatorTotals => {
    switch (kpiType) {
      case 'abs': return memoizedKPITotals.abs;
      case 'qd': return memoizedKPITotals.qd;
      case 'oa': return memoizedKPITotals.oa;
      case 'ddp': return memoizedKPITotals.ddp;
      case 'ekh': return memoizedKPITotals.ekh;
      default: return memoizedKPITotals.abs;
    }
  }, [memoizedKPITotals]);

  // Global statistics
  const globalStats = useMemo(() => {
    const allTotals = [memoizedKPITotals.abs, memoizedKPITotals.qd, memoizedKPITotals.oa, memoizedKPITotals.ddp, memoizedKPITotals.ekh];

    return {
      totalEconomies: allTotals.reduce((sum, t) => sum + t.economiesRealiseesTotal, 0),
      totalPertes: allTotals.reduce((sum, t) => sum + t.pertesConstateesTotal, 0),
      totalPPR: allTotals.reduce((sum, t) => sum + t.pprPrevuesTotal, 0),
      totalScoreFinancier: allTotals.reduce((sum, t) => sum + t.scoreFinancierTotal, 0),
      employeesCount: employeePerformances.length,
      employeesWithData: employeePerformances.filter(p =>
        p.abs.codePRC || p.qd.codePRC || p.oa.codePRC || p.ddp.codePRC || p.ekh.codePRC
      ).length
    };
  }, [memoizedKPITotals, employeePerformances]);

  // Filter performances based on search
  const filteredPerformances = useMemo(() => {
    return employeePerformances.filter(perf => {
      const matchesSearch = searchTerm === '' ||
        perf.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perf.professionalCategory.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [employeePerformances, searchTerm]);

  const currencyConfig = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.EUR;

  // ============================================
  // OPTIMISATION PERFORMANCE: Mémorisation des calculs EKH
  // ============================================
  // Pré-calcule TOUTES les données EKH une seule fois
  // Évite la définition de getEKHData() à chaque render dans le JSX
  const memoizedEKHData = useMemo(() => {
    console.time('🔴 MEMOIZED_EKH_DATA');

    // Récupérer les totaux depuis le cache mémorisé
    const ekhTotals = memoizedKPITotals.ekh;

    // Grouper les performances par équipe
    const performancesByTeam = new Map<string, EmployeePerformance[]>();
    filteredPerformances.forEach(perf => {
      const teamId = perf.businessLineId;
      if (!performancesByTeam.has(teamId)) {
        performancesByTeam.set(teamId, []);
      }
      performancesByTeam.get(teamId)!.push(perf);
    });

    // ============================================
    // CALCULER $EB$3 = Total Pertes Constatées EKH (N1 + N2)
    // Cette valeur est utilisée comme référence pour chaque salarié
    // ============================================
    const pertesConstateesRefEB3 = filteredPerformances.reduce((total, perf) => {
      const ddpData = perf.ddp;
      const ekhData = perf.ekh;
      const coefficientCompetence = perf.coefficientCompetence || 0;
      const economiesDDP_N1 = ddpData.economiesRealisees || 0;
      const scoreFinancierN1 = economiesDDP_N1 * coefficientCompetence;
      const pprPrevuesN1 = ekhData.pprPrevues || 0;
      const economiesRealiseesN1 = scoreFinancierN1;
      const economiesRealiseesN2 = scoreFinancierN1;

      let pertesN1 = pprPrevuesN1 - economiesRealiseesN1;
      let pertesN2 = pprPrevuesN1 - economiesRealiseesN2;

      const nomSalarie = perf.employeeName || '';
      let pertesConstateesN1Final: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
        pertesConstateesN1Final = pertesN1;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
        pertesConstateesN1Final = 0;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesConstateesN1Final = pertesN1;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
        pertesConstateesN1Final = 0;
      } else {
        pertesConstateesN1Final = pertesN1;
      }

      let pertesConstateesN2Final: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
        pertesConstateesN2Final = pertesN2;
      } else {
        pertesConstateesN2Final = pertesN2;
      }

      return total + pertesConstateesN1Final + pertesConstateesN2Final;
    }, 0);

    // Fonction pour obtenir les données EKH d'un salarié
    const getEKHDataForEmployee = (perf: EmployeePerformance) => {
      const ddpData = perf.ddp;
      const ekhData = perf.ekh;
      const coefficientCompetence = perf.coefficientCompetence || 0;

      // NIVEAU 1
      const economiesDDP_N1 = ddpData.economiesRealisees || 0;
      const scoreFinancierN1 = economiesDDP_N1 * coefficientCompetence;
      const pprPrevuesN1 = ekhData.pprPrevues || 0;
      const economiesRealiseesN1 = scoreFinancierN1;

      // NIVEAU 2
      const scoreFinancierN2 = economiesDDP_N1 * coefficientCompetence;
      const pprPrevuesN2 = pprPrevuesN1;
      const economiesRealiseesN2 = scoreFinancierN2;

      // Pertes constatées N1
      let pertesConstateesN1_EKH: number;
      if (economiesRealiseesN1 < 0) {
        pertesConstateesN1_EKH = pprPrevuesN1 - (-economiesRealiseesN1);
      } else if (economiesRealiseesN1 > 0) {
        pertesConstateesN1_EKH = pprPrevuesN1 - economiesRealiseesN1;
      } else {
        pertesConstateesN1_EKH = pprPrevuesN1 - economiesRealiseesN1;
      }

      // Pertes constatées N2
      let pertesConstateesN2_EKH: number;
      if (economiesRealiseesN2 < 0) {
        pertesConstateesN2_EKH = pprPrevuesN2 - (-economiesRealiseesN2);
      } else if (economiesRealiseesN2 > 0) {
        pertesConstateesN2_EKH = pprPrevuesN2 - economiesRealiseesN2;
      } else {
        pertesConstateesN2_EKH = pprPrevuesN2 - economiesRealiseesN2;
      }

      const nomSalarie = perf.employeeName || '';

      // Pertes constatées N1 Final
      let pertesConstateesN1Final: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
        pertesConstateesN1Final = pertesConstateesN1_EKH;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
        pertesConstateesN1Final = 0;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesConstateesN1Final = pertesConstateesN1_EKH;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
        pertesConstateesN1Final = 0;
      } else {
        pertesConstateesN1Final = pertesConstateesN1_EKH;
      }

      const pertesConstateesRefN1 = pertesConstateesRefEB3;

      // Pertes en % 2 N1
      let pertesEnPourcentage2_N1: number;
      if (pertesConstateesN1Final === 0) {
        pertesEnPourcentage2_N1 = 0;
      } else if (pertesConstateesRefN1 === 0) {
        pertesEnPourcentage2_N1 = 0;
      } else {
        pertesEnPourcentage2_N1 = (pertesConstateesN1Final / pertesConstateesRefN1) * 100;
      }

      // Pertes en % N1
      let pertesEnPourcentageN1: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0) {
        pertesEnPourcentageN1 = pertesEnPourcentage2_N1;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesEnPourcentageN1 = pertesEnPourcentage2_N1;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
        pertesEnPourcentageN1 = 0;
      } else {
        pertesEnPourcentageN1 = pertesEnPourcentage2_N1;
      }

      // Pertes constatées N2 Final
      let pertesConstateesN2Final: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0 && nomSalarie !== '') {
        pertesConstateesN2Final = pertesConstateesN2_EKH;
      } else {
        pertesConstateesN2Final = pertesConstateesN2_EKH;
      }

      const pertesConstateesRefN2 = pertesConstateesRefN1;

      // Pertes en % 2 N2
      let pertesEnPourcentage2_N2: number;
      if (pertesConstateesN2Final === 0) {
        pertesEnPourcentage2_N2 = 0;
      } else if (pertesConstateesRefN2 === 0) {
        pertesEnPourcentage2_N2 = 0;
      } else {
        pertesEnPourcentage2_N2 = (pertesConstateesN2Final / pertesConstateesRefN2) * 100;
      }

      // Pertes en % N2
      let pertesEnPourcentageN2: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0) {
        pertesEnPourcentageN2 = 0;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesEnPourcentageN2 = 0;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
        pertesEnPourcentageN2 = pertesEnPourcentage2_N2;
      } else {
        pertesEnPourcentageN2 = pertesEnPourcentage2_N2;
      }

      const pertesConstateesTotal = ekhTotals.pertesConstateesTotal + ekhTotals.pertesConstateesTotalN2;

      // ============================================
      // PRÉ-CALCUL DES POURCENTAGES POUR ÉVITER LES IIFEs
      // Ces valeurs sont utilisées dans les badges du tableau EKH
      // ============================================
      const pertesN1PctRef = pertesConstateesRefN1 > 0
        ? (pertesConstateesN1Final / pertesConstateesRefN1) * 100
        : 0;
      const pertesN2PctRef = pertesConstateesRefN2 > 0
        ? (pertesConstateesN2Final / pertesConstateesRefN2) * 100
        : 0;

      return {
        coefficientCompetence,
        scoreFinancierN1,
        pertesConstateesN1: pertesConstateesN1Final,
        pprPrevuesN1,
        economiesRealiseesN1,
        pertesEnPourcentageN1,
        pertesEnPourcentage2_N1,
        pertesConstateesRefN1,
        pertesN1PctRef, // PRÉ-CALCULÉ pour éviter IIFE
        scoreFinancierN2,
        pertesConstateesN2: pertesConstateesN2Final,
        pprPrevuesN2,
        economiesRealiseesN2,
        pertesEnPourcentageN2,
        pertesEnPourcentage2_N2,
        pertesConstateesRefN2,
        pertesN2PctRef, // PRÉ-CALCULÉ pour éviter IIFE
        pertesConstateesTotal
      };
    };

    // Pré-calculer les données EKH pour tous les employés
    const employeesEKHData = new Map<string, ReturnType<typeof getEKHDataForEmployee>>();
    filteredPerformances.forEach(perf => {
      employeesEKHData.set(perf.employeeId, getEKHDataForEmployee(perf));
    });

    // Calculer les totaux EKH par niveau
    const ekhTotalsN1 = filteredPerformances.reduce((acc, perf) => {
      const data = employeesEKHData.get(perf.employeeId)!;
      return {
        scoreFinancierTotal: acc.scoreFinancierTotal + data.scoreFinancierN1,
        pertesConstateesTotal: acc.pertesConstateesTotal + data.pertesConstateesN1,
        pprPrevuesTotal: acc.pprPrevuesTotal + data.pprPrevuesN1,
        economiesRealiseesTotal: acc.economiesRealiseesTotal + data.economiesRealiseesN1
      };
    }, {
      scoreFinancierTotal: 0,
      pertesConstateesTotal: 0,
      pprPrevuesTotal: 0,
      economiesRealiseesTotal: 0
    });

    const ekhTotalsN2 = filteredPerformances.reduce((acc, perf) => {
      const data = employeesEKHData.get(perf.employeeId)!;
      return {
        scoreFinancierTotal: acc.scoreFinancierTotal + data.scoreFinancierN2,
        pertesConstateesTotal: acc.pertesConstateesTotal + data.pertesConstateesN2,
        pprPrevuesTotal: acc.pprPrevuesTotal + data.pprPrevuesN2,
        economiesRealiseesTotal: acc.economiesRealiseesTotal + data.economiesRealiseesN2
      };
    }, {
      scoreFinancierTotal: 0,
      pertesConstateesTotal: 0,
      pprPrevuesTotal: 0,
      economiesRealiseesTotal: 0
    });

    // Totaux combinés pour NIVEAU TOTAL
    const pertesTotalN1N2 = ekhTotalsN1.pertesConstateesTotal + ekhTotalsN2.pertesConstateesTotal;
    const pprTotalN1N2 = ekhTotalsN1.pprPrevuesTotal + ekhTotalsN2.pprPrevuesTotal;

    const ekhTotalsCalculated = {
      scoreFinancierTotalN1: ekhTotalsN1.scoreFinancierTotal,
      scoreFinancierTotalN2: ekhTotalsN2.scoreFinancierTotal,
      pertesConstateesTotalN1: ekhTotalsN1.pertesConstateesTotal,
      pertesConstateesTotalN2: ekhTotalsN2.pertesConstateesTotal,
      pprPrevuesTotalN1: ekhTotalsN1.pprPrevuesTotal,
      pprPrevuesTotalN2: ekhTotalsN2.pprPrevuesTotal,
      economiesRealiseesTotalN1: ekhTotalsN1.economiesRealiseesTotal,
      economiesRealiseesTotalN2: ekhTotalsN2.economiesRealiseesTotal,
      // PRÉ-CALCULÉ pour éviter IIFE dans NIVEAU TOTAL
      pertesEnPctTotal: pprTotalN1N2 > 0 ? (pertesTotalN1N2 / pprTotalN1N2) * 100 : 0
    };

    console.timeEnd('🔴 MEMOIZED_EKH_DATA');

    return {
      performancesByTeam,
      pertesConstateesRefEB3,
      employeesEKHData,
      ekhTotalsN1,
      ekhTotalsN2,
      ekhTotalsCalculated,
      ekhTotals,
      getEKHData: (perf: EmployeePerformance) => employeesEKHData.get(perf.employeeId)!
    };
  }, [filteredPerformances, memoizedKPITotals]);

  // ============================================
  // OPTIMISATION CRITIQUE: Pré-calcul pagination EKH par niveau
  // Évite le recalcul à chaque render dans l'IIFE
  // ============================================
  const memoizedEKHPaginationN1 = useMemo(() => {
    const pageKey = 'ekhN1';
    const currentPageNum = currentPage[pageKey] || 1;
    const totalEmployees = filteredPerformances.length;
    const totalPages = Math.ceil(totalEmployees / EMPLOYEES_PER_PAGE);
    const startIdx = (currentPageNum - 1) * EMPLOYEES_PER_PAGE;
    const paginatedPerformances = filteredPerformances.slice(startIdx, startIdx + EMPLOYEES_PER_PAGE);

    const paginatedByTeam = new Map<string, EmployeePerformance[]>();
    paginatedPerformances.forEach(perf => {
      const teamId = perf.businessLineId;
      if (!paginatedByTeam.has(teamId)) paginatedByTeam.set(teamId, []);
      paginatedByTeam.get(teamId)!.push(perf);
    });

    const visibleBusinessLines = businessLines.filter(bl => paginatedByTeam.has(bl.id));

    return { currentPageNum, totalEmployees, totalPages, paginatedPerformances, paginatedByTeam, visibleBusinessLines };
  }, [currentPage, filteredPerformances, businessLines, EMPLOYEES_PER_PAGE]);

  const memoizedEKHPaginationN2 = useMemo(() => {
    const pageKey = 'ekhN2';
    const currentPageNum = currentPage[pageKey] || 1;
    const totalEmployees = filteredPerformances.length;
    const totalPages = Math.ceil(totalEmployees / EMPLOYEES_PER_PAGE);
    const startIdx = (currentPageNum - 1) * EMPLOYEES_PER_PAGE;
    const paginatedPerformances = filteredPerformances.slice(startIdx, startIdx + EMPLOYEES_PER_PAGE);

    const paginatedByTeam = new Map<string, EmployeePerformance[]>();
    paginatedPerformances.forEach(perf => {
      const teamId = perf.businessLineId;
      if (!paginatedByTeam.has(teamId)) paginatedByTeam.set(teamId, []);
      paginatedByTeam.get(teamId)!.push(perf);
    });

    const visibleBusinessLines = businessLines.filter(bl => paginatedByTeam.has(bl.id));

    return { currentPageNum, totalEmployees, totalPages, paginatedPerformances, paginatedByTeam, visibleBusinessLines };
  }, [currentPage, filteredPerformances, businessLines, EMPLOYEES_PER_PAGE]);

  const memoizedEKHPaginationTotal = useMemo(() => {
    const pageKey = 'ekhTotal';
    const currentPageNum = currentPage[pageKey] || 1;
    const totalEmployees = filteredPerformances.length;
    const totalPages = Math.ceil(totalEmployees / EMPLOYEES_PER_PAGE);
    const startIdx = (currentPageNum - 1) * EMPLOYEES_PER_PAGE;
    const paginatedPerformances = filteredPerformances.slice(startIdx, startIdx + EMPLOYEES_PER_PAGE);

    const paginatedByTeam = new Map<string, EmployeePerformance[]>();
    paginatedPerformances.forEach(perf => {
      const teamId = perf.businessLineId;
      if (!paginatedByTeam.has(teamId)) paginatedByTeam.set(teamId, []);
      paginatedByTeam.get(teamId)!.push(perf);
    });

    const visibleBusinessLines = businessLines.filter(bl => paginatedByTeam.has(bl.id));

    return { currentPageNum, totalEmployees, totalPages, paginatedPerformances, paginatedByTeam, visibleBusinessLines };
  }, [currentPage, filteredPerformances, businessLines, EMPLOYEES_PER_PAGE]);

  // ============================================
  // OPTIMISATION PERFORMANCE: Données Synthèse pré-calculées
  // ============================================
  const memoizedSynthesisData = useMemo(() => {
    // Indicateurs configuration
    const indicateurs = [
      { key: 'abs', label: 'ABS', fullLabel: 'Absentéisme' },
      { key: 'qd', label: 'QD', fullLabel: 'Défaut Qualité' },
      { key: 'oa', label: 'AT', fullLabel: 'Accident Travail' },
      { key: 'ddp', label: 'EPD', fullLabel: 'Écart Productivité Directe' },
      { key: 'ekh', label: 'ESF', fullLabel: 'Écart Savoir Faire' }
    ] as const;

    // Fonction pour obtenir les données d'un salarié pour un indicateur
    const getIndicatorData = (perf: EmployeePerformance, indicatorKey: string) => {
      switch (indicatorKey) {
        case 'abs': return perf.abs;
        case 'qd': return perf.qd;
        case 'oa': return perf.oa;
        case 'ddp': return perf.ddp;
        case 'ekh': return perf.ekh;
        default: return perf.abs;
      }
    };

    // Calculer les TOTAUX GLOBAUX pour NIVEAU TOTAL
    const globalTotalsPerIndicator = indicateurs.map(ind => {
      const totals = calculateTotals(ind.key);
      return {
        indicateur: ind,
        objectif: totals.pprPrevuesTotal,
        economiesRealisees: totals.economiesRealiseesTotalCombine
      };
    });

    // Total global tous indicateurs confondus
    const grandTotalObjectif = globalTotalsPerIndicator.reduce((sum, t) => sum + t.objectif, 0);
    const grandTotalEconomies = globalTotalsPerIndicator.reduce((sum, t) => sum + t.economiesRealisees, 0);

    // Répartition: 67% trésorerie, 33% primes
    const fluxTresorerie = grandTotalEconomies * 0.67;
    const sortiesPrimes = grandTotalEconomies * 0.33;

    // Pré-calculer les totaux de pertes par indicateur pour les pourcentages
    const indicatorTotalsMap = indicateurs.reduce((acc, ind) => {
      const totals = calculateTotals(ind.key);
      acc[ind.key] = {
        totalPertesN1: totals.pertesConstateesTotal,
        totalPertesN2: totals.pertesConstateesTotalN2,
        totalPertesReference: totals.pertesConstateesTotal + totals.pertesConstateesTotalN2
      };
      return acc;
    }, {} as Record<string, { totalPertesN1: number; totalPertesN2: number; totalPertesReference: number }>);

    // PASSE 1: Calcul des données de base
    const employeeScoresPass1 = filteredPerformances.map(emp => {
      const hasActivityData = indicateurs.some(ind => {
        const data = getIndicatorData(emp, ind.key);
        return (
          data.tempsCollecte > 0 ||
          data.fraisCollectes > 0 ||
          data.tempsCollecteN2 > 0 ||
          data.tempsPrisEnCompte > 0 ||
          data.fraisPrisEnCompte > 0
        );
      });

      const empTotalEco = indicateurs.reduce((sum, ind) => {
        const data = getIndicatorData(emp, ind.key);
        const ecoN1 = Math.max(0, data.economiesRealisees);
        const ecoN2 = Math.max(0, data.economiesRealiseesN2);
        return sum + ecoN1 + ecoN2;
      }, 0);

      const empTotalPPR = indicateurs.reduce((sum, ind) => {
        const data = getIndicatorData(emp, ind.key);
        return sum + data.pprPrevues;
      }, 0);

      const empTotalPertes = indicateurs.reduce((sum, ind) => {
        const data = getIndicatorData(emp, ind.key);
        return sum + data.pertesConstatees + data.pertesConstateesN2;
      }, 0);

      const tauxEcoByIndicator = indicateurs.reduce((acc, ind) => {
        const data = getIndicatorData(emp, ind.key);
        const ecoN1 = Math.max(0, data.economiesRealisees);
        const ecoN2 = Math.max(0, data.economiesRealiseesN2);
        const eco = ecoN1 + ecoN2;
        acc[ind.key] = empTotalEco > 0 ? eco / empTotalEco : 0;
        return acc;
      }, {} as Record<string, number>);

      const totalTauxEco = Object.values(tauxEcoByIndicator).reduce((a, b) => a + b, 0);

      const scoresPertesEn = indicateurs.reduce((sum, ind) => {
        const data = getIndicatorData(emp, ind.key);
        const totalsRef = indicatorTotalsMap[ind.key];
        const pertesN1Pct = totalsRef.totalPertesReference > 0
          ? (data.pertesConstatees / totalsRef.totalPertesReference) * 100
          : 0;
        const pertesN2Pct = totalsRef.totalPertesReference > 0
          ? (data.pertesConstateesN2 / totalsRef.totalPertesReference) * 100
          : 0;
        return sum + pertesN1Pct + pertesN2Pct;
      }, 0);

      let trancheNote: number;
      if (scoresPertesEn <= 10) trancheNote = 100;
      else if (scoresPertesEn <= 33) trancheNote = 60;
      else if (scoresPertesEn <= 54) trancheNote = 30;
      else if (scoresPertesEn <= 79) trancheNote = 10;
      else trancheNote = 0;

      const triTrancheNote = emp.employeeName ? trancheNote : 0;
      const triN2TrancheNote = triTrancheNote;

      return {
        employee: {
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          professionalCategory: emp.professionalCategory
        },
        empTotalEco,
        empTotalPPR,
        empTotalPertes,
        hasActivityData,
        scoresPertesEn,
        trancheNote,
        triTrancheNote,
        triN2TrancheNote,
        tauxEcoByIndicator,
        totalTauxEco
      };
    });

    // Score Note total
    const scoreNoteTotalPct = employeeScoresPass1.reduce((sum, emp) => sum + emp.triN2TrancheNote, 0);

    // Statistiques d'éligibilité
    const eligibilityStats: EligibilityStats = {
      totalEmployees: employeeScoresPass1.length,
      eligibleEmployees: employeeScoresPass1.filter(e => e.hasActivityData).length,
      nonEligibleEmployees: employeeScoresPass1.filter(e => !e.hasActivityData).length,
      totalPertesEligibles: employeeScoresPass1
        .filter(e => e.hasActivityData)
        .reduce((sum, e) => sum + e.empTotalPertes, 0)
    };

    // PASSE 2: Calcul des colonnes dépendantes
    const employeeScores: EmployeeScore[] = employeeScoresPass1.map(empData => {
      const empScoreNoteTotalPct = empData.employee.employeeName ? scoreNoteTotalPct : 0;
      const contributionRatio = empScoreNoteTotalPct > 0
        ? empData.triN2TrancheNote / empScoreNoteTotalPct
        : 0;
      const contributionPct = contributionRatio * 100;
      const scorePrimeTotal = empData.employee.employeeName ? sortiesPrimes : 0;
      const partPrime = scorePrimeTotal * contributionRatio;
      const partTresorerie = fluxTresorerie * contributionRatio;

      return {
        employee: empData.employee,
        empTotalEco: empData.empTotalEco,
        empTotalPPR: empData.empTotalPPR,
        empTotalPertes: empData.empTotalPertes,
        hasActivityData: empData.hasActivityData,
        scoresPertesEn: empData.scoresPertesEn,
        partPrime,
        partTresorerie,
        contributionPct,
        trancheNote: empData.trancheNote,
        triTrancheNote: empData.triTrancheNote,
        triN2TrancheNote: empData.triN2TrancheNote,
        scorePrimeTotal,
        scoreNoteTotalPct: empScoreNoteTotalPct,
        tauxEcoByIndicator: empData.tauxEcoByIndicator,
        totalTauxEco: empData.totalTauxEco
      };
    });

    const globalTotals: GlobalTotals = {
      grandTotalObjectif,
      grandTotalEconomies,
      fluxTresorerie,
      sortiesPrimes,
      scoreNoteTotalPct
    };

    return { employeeScores, eligibilityStats, globalTotals };
  }, [filteredPerformances, calculateTotals]);

  // ============================================
  // OPTIMISATION PERFORMANCE: Données Primes pré-calculées
  // ============================================
  const memoizedPrimesData = useMemo(() => {
    const primeIndicateurs = [
      { key: 'abs', label: 'Absentéisme', shortLabel: 'ABS' },
      { key: 'qd', label: 'Défauts de qualité', shortLabel: 'QD' },
      { key: 'oa', label: 'Accidents de travail', shortLabel: 'AT' },
      { key: 'ddp', label: 'Écart de productivité directe', shortLabel: 'EPD' },
      { key: 'ekh', label: 'Écart de Know-how', shortLabel: 'EKH' }
    ];

    const getIndicatorDataForPrime = (perf: EmployeePerformance, indicatorKey: string) => {
      switch (indicatorKey) {
        case 'abs': return perf.abs;
        case 'qd': return perf.qd;
        case 'oa': return perf.oa;
        case 'ddp': return perf.ddp;
        case 'ekh': return perf.ekh;
        default: return perf.abs;
      }
    };

    // Grouper les salariés par ligne d'activité
    const performancesByBusinessLineForPrime = new Map<string, EmployeePerformance[]>();
    businessLines.forEach(bl => {
      performancesByBusinessLineForPrime.set(bl.id, []);
    });
    filteredPerformances.forEach(perf => {
      const blPerfs = performancesByBusinessLineForPrime.get(perf.businessLineId);
      if (blPerfs) blPerfs.push(perf);
    });

    // Calculs globaux
    const grandTotalEconomies = primeIndicateurs.reduce((total, ind) => {
      const indTotals = calculateTotals(ind.key);
      return total + indTotals.economiesRealiseesTotalCombine;
    }, 0);

    const fluxTresoreriePrime = grandTotalEconomies * 0.67;
    const sortiesPrimesPrime = grandTotalEconomies * 0.33;

    // Calcul des données de prime par salarié
    const indicatorTotalsMapPrime = primeIndicateurs.reduce((acc, ind) => {
      const totals = calculateTotals(ind.key);
      acc[ind.key] = { totalPertesReference: totals.pertesConstateesTotal + totals.pertesConstateesTotalN2 };
      return acc;
    }, {} as Record<string, { totalPertesReference: number }>);

    const employeePrimeData = filteredPerformances.map(emp => {
      const hasActivityData = primeIndicateurs.some(ind => {
        const data = getIndicatorDataForPrime(emp, ind.key);
        return data.tempsCollecte > 0 || data.fraisCollectes > 0 || data.tempsCollecteN2 > 0 || data.tempsPrisEnCompte > 0 || data.fraisPrisEnCompte > 0;
      });

      const empTotalEco = primeIndicateurs.reduce((sum, ind) => {
        const data = getIndicatorDataForPrime(emp, ind.key);
        return sum + Math.max(0, data.economiesRealisees) + Math.max(0, data.economiesRealiseesN2);
      }, 0);

      const tauxEcoByIndicator = primeIndicateurs.reduce((acc, ind) => {
        const data = getIndicatorDataForPrime(emp, ind.key);
        const eco = Math.max(0, data.economiesRealisees) + Math.max(0, data.economiesRealiseesN2);
        acc[ind.key] = empTotalEco > 0 ? eco / empTotalEco : 0;
        return acc;
      }, {} as Record<string, number>);

      const scoresPertesEn = primeIndicateurs.reduce((sum, ind) => {
        const data = getIndicatorDataForPrime(emp, ind.key);
        const totalsRef = indicatorTotalsMapPrime[ind.key];
        const pertesN1Pct = totalsRef.totalPertesReference > 0 ? (data.pertesConstatees / totalsRef.totalPertesReference) * 100 : 0;
        const pertesN2Pct = totalsRef.totalPertesReference > 0 ? (data.pertesConstateesN2 / totalsRef.totalPertesReference) * 100 : 0;
        return sum + pertesN1Pct + pertesN2Pct;
      }, 0);

      let trancheNote: number;
      if (scoresPertesEn <= 10) trancheNote = 100;
      else if (scoresPertesEn <= 33) trancheNote = 60;
      else if (scoresPertesEn <= 54) trancheNote = 30;
      else if (scoresPertesEn <= 79) trancheNote = 10;
      else trancheNote = 0;

      const triN2TrancheNote = emp.employeeName ? trancheNote : 0;

      return { emp, hasActivityData, empTotalEco, tauxEcoByIndicator, triN2TrancheNote };
    });

    const sumTriN2TrancheNote = employeePrimeData.reduce((sum, d) => sum + d.triN2TrancheNote, 0);

    // Calculer les scores finaux avec contribution
    const employeePrimeScores = employeePrimeData.map(data => {
      const contributionRatio = sumTriN2TrancheNote > 0 ? data.triN2TrancheNote / sumTriN2TrancheNote : 0;
      const scorePrimeTotal = data.emp.employeeName ? sortiesPrimesPrime : 0;
      const partPrime = scorePrimeTotal * contributionRatio;
      const partTresorerie = fluxTresoreriePrime * contributionRatio;

      return { ...data, contributionRatio, partPrime, partTresorerie };
    });

    // Map pour accès rapide
    const employeePrimeScoresMap = new Map(employeePrimeScores.map(s => [s.emp.employeeName, s]));

    // Fonction de calcul des données de prime
    const calculatePrimeData = (emp: EmployeePerformance, indicatorKey: string) => {
      const empScore = employeePrimeScoresMap.get(emp.employeeName);
      const indicatorData = getIndicatorDataForPrime(emp, indicatorKey);
      const prevPrime = indicatorData.pprPrevues * 0.33;
      const prevTreso = indicatorData.pprPrevues * 0.67;

      if (!empScore) return { prevPrime, prevTreso, realPrime: 0, realTreso: 0 };

      const tauxEco = empScore.tauxEcoByIndicator[indicatorKey] || 0;
      const realPrime = empScore.partPrime * tauxEco;
      const realTreso = empScore.partTresorerie * tauxEco;

      return { prevPrime, prevTreso, realPrime, realTreso };
    };

    return {
      primeIndicateurs,
      performancesByBusinessLineForPrime,
      grandTotalEconomies,
      fluxTresoreriePrime,
      sortiesPrimesPrime,
      employeePrimeScores,
      calculatePrimeData
    };
  }, [filteredPerformances, businessLines, calculateTotals]);

  // ============================================
  // PHASE 2: Sauvegarde automatique dans le cache après calcul
  // ============================================
  // Cette sauvegarde est "write-through": elle ne modifie pas le flux existant
  // mais pré-remplit le cache pour les prochaines visites
  useEffect(() => {
    // Ne sauvegarder que si on a des données calculées
    if (!companyId || !employeePerformances.length || loading || isFromCache) {
      return;
    }

    const saveToCache = async () => {
      try {
        const cacheService = createPerformanceCacheService(companyId);

        // Préparer les entrées de cache par employé/indicateur
        const cacheEntries: PerformanceCacheEntry[] = [];
        const indicators = ['abs', 'qd', 'oa', 'ddp', 'ekh'] as const;

        employeePerformances.forEach(emp => {
          indicators.forEach(indKey => {
            const indData = emp[indKey];
            if (!indData) return;

            // Calculer les primes pour cet employé/indicateur
            const totals = calculateTotals(indKey);
            const totalEcoIndicator = totals.economiesRealiseesTotal || 1;
            // CORRECTION: Plafonner les économies à 0 minimum (pas de négatif)
            // Conforme au fichier Excel et à l'affichage du tableau PERFORMANCE GLOBALE
            const ecoN1 = Math.max(0, indData.economiesRealisees || 0);
            const ecoN2 = Math.max(0, indData.economiesRealiseesN2 || 0);
            const empEconomies = ecoN1 + ecoN2;
            const contributionPct = totalEcoIndicator > 0 ? (empEconomies / totalEcoIndicator) * 100 : 0;

            // Calculer les vraies valeurs Prime/Trésorerie
            const pprPrevues = indData.pprPrevues || 0;
            const prevPrime = pprPrevues * 0.33;
            const prevTreso = pprPrevues * 0.67;
            const realPrime = empEconomies * 0.33;
            const realTreso = empEconomies * 0.67;

            cacheEntries.push({
              company_id: companyId,
              employee_id: emp.employeeId,
              business_line_id: emp.businessLineId,
              indicator_key: indKey,
              ppr_prevues: pprPrevues,
              economies_realisees: empEconomies,
              pertes_constatees: (indData.pertesConstatees || 0) + (indData.pertesConstateesN2 || 0),
              temps_calcul: (indData.tempsCalcul || 0) + (indData.tempsPrisEnCompte || 0),
              frais_collectes: (indData.fraisCollectes || 0) + (indData.fraisPrisEnCompte || 0),
              score_financier: (indData.scoreFinancier || 0) + (indData.scoreFinancierN2 || 0),
              prev_prime: prevPrime,
              prev_treso: prevTreso,
              real_prime: realPrime,
              real_treso: realTreso,
              contribution_pct: contributionPct,
              pertes_pct: indData.pertesEnPourcentage || 0,
              fiscal_week: currentFiscalWeek,
              fiscal_year: currentFiscalYear
            });
          });
        });

        // Sauvegarder en background (ne pas bloquer l'UI)
        if (cacheEntries.length > 0) {
          await cacheService.saveToCache(cacheEntries);
          setCacheLastUpdated(new Date());
          console.log(`[PerformanceCache] Saved ${cacheEntries.length} entries to cache`);
        }

        // ============================================
        // TRANSFERT DIRECT VIA LOCALSTORAGE
        // ============================================
        // Sauvegarde instantanée pour le bulletin de performance
        // Structure optimisée pour PerformanceCenterPage
        const bulletinData = employeePerformances.map(emp => {
          // Calculer les totaux par employé
          const indicators = ['abs', 'qd', 'oa', 'ddp', 'ekh'] as const;
          let totalObjectif = 0;
          let totalEconomies = 0;
          let totalPrevPrime = 0;
          let totalPrevTreso = 0;
          let totalRealPrime = 0;
          let totalRealTreso = 0;

          const indicatorsData: Record<string, any> = {};

          indicators.forEach(indKey => {
            const indData = emp[indKey];
            if (!indData) return;

            const pprPrevues = indData.pprPrevues || 0;
            // CORRECTION: Plafonner les économies à 0 minimum (pas de négatif)
            // Conforme au fichier Excel et à l'affichage du tableau PERFORMANCE GLOBALE
            const ecoN1 = Math.max(0, indData.economiesRealisees || 0);
            const ecoN2 = Math.max(0, indData.economiesRealiseesN2 || 0);
            const empEconomies = ecoN1 + ecoN2;

            const prevPrime = pprPrevues * 0.33;
            const prevTreso = pprPrevues * 0.67;
            const realPrime = empEconomies * 0.33;
            const realTreso = empEconomies * 0.67;

            totalObjectif += pprPrevues;
            totalEconomies += empEconomies;
            totalPrevPrime += prevPrime;
            totalPrevTreso += prevTreso;
            totalRealPrime += realPrime;
            totalRealTreso += realTreso;

            indicatorsData[indKey] = {
              objectif: pprPrevues,
              economiesRealisees: empEconomies,
              prevPrime,
              prevTreso,
              realPrime,
              realTreso,
              totalTemps: (indData.tempsCalcul || 0) + (indData.tempsPrisEnCompte || 0),
              totalFrais: (indData.fraisCollectes || 0) + (indData.fraisPrisEnCompte || 0)
            };
          });

          // Calculer note et grade
          const globalNote = totalObjectif > 0 ? Math.min(10, (totalEconomies / totalObjectif) * 10) : 0;
          const grade = globalNote >= 9 ? 'A+' : globalNote >= 8 ? 'A' : globalNote >= 7 ? 'B' : globalNote >= 6 ? 'C' : globalNote >= 5 ? 'D' : 'E';

          return {
            employeeId: emp.employeeId,
            employeeName: emp.employeeName,
            businessLineId: emp.businessLineId,
            businessLineName: emp.businessLineName,
            professionalCategory: emp.professionalCategory,
            globalNote,
            grade,
            employeePerformance: {
              objectif: totalObjectif,
              economiesRealisees: totalEconomies,
              prevPrime: totalPrevPrime,
              prevTreso: totalPrevTreso,
              realPrime: totalRealPrime,
              realTreso: totalRealTreso
            },
            indicators: indicatorsData,
            fiscalWeek: currentFiscalWeek,
            fiscalYear: currentFiscalYear
          };
        });

        // Trier les données par score global (desc) puis par nom (asc) avant sauvegarde
        bulletinData.sort((a, b) => {
          // 1. Score global décroissant (les meilleurs en premier)
          const scoreA = a.globalNote ?? 0;
          const scoreB = b.globalNote ?? 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          // 2. Nom alphabétique (A-Z) en cas d'égalité
          const nameCompare = a.employeeName.localeCompare(b.employeeName, 'fr', { sensitivity: 'base' });
          if (nameCompare !== 0) return nameCompare;
          // 3. ID pour garantir un ordre stable
          return a.employeeId.localeCompare(b.employeeId);
        });

        // OPTIMISATION 10K: Sauvegarder dans localStorage avec gestion du quota
        const dataToSave = {
          data: bulletinData,
          companyId,
          fiscalWeek: currentFiscalWeek,
          fiscalYear: currentFiscalYear,
          savedAt: new Date().toISOString(),
          employeeCount: bulletinData.length // Métadonnée pour vérification
        };

        const jsonString = JSON.stringify(dataToSave);
        const sizeInMB = (new Blob([jsonString]).size / 1024 / 1024).toFixed(2);

        try {
          // localStorage a une limite ~5-10MB selon le navigateur
          if (parseFloat(sizeInMB) > 4) {
            console.warn(`[PerformanceRecap] ⚠️ Large data size: ${sizeInMB}MB for ${bulletinData.length} employees`);
          }

          localStorage.setItem('hcm_bulletin_performances', jsonString);
          console.log(`[PerformanceRecap] ✅ Saved ${bulletinData.length} employees (${sizeInMB}MB) to localStorage for bulletin`);
        } catch (storageError) {
          // Quota exceeded - essayer de supprimer les anciennes données et réessayer
          console.warn(`[PerformanceRecap] ⚠️ localStorage quota exceeded for ${bulletinData.length} employees (${sizeInMB}MB)`);

          // Nettoyer les anciens caches
          try {
            localStorage.removeItem('hcm_bulletin_performances');
            localStorage.removeItem('hcm_performance_data');
            localStorage.setItem('hcm_bulletin_performances', jsonString);
            console.log(`[PerformanceRecap] ✅ Saved after cleanup: ${bulletinData.length} employees (${sizeInMB}MB)`);
          } catch (retryError) {
            // En dernier recours, stocker seulement les données essentielles
            console.error(`[PerformanceRecap] ❌ Cannot save to localStorage even after cleanup. Data too large: ${sizeInMB}MB`);
            // Les données seront recalculées à la prochaine visite
          }
        }

      } catch (err) {
        // Erreur silencieuse - le cache est optionnel
        console.warn('[PerformanceCache] Failed to save to cache:', err);
      }
    };

    // Sauvegarder après un court délai pour ne pas bloquer le rendu
    const timeoutId = setTimeout(saveToCache, 1000);
    return () => clearTimeout(timeoutId);
  }, [companyId, employeePerformances, loading, isFromCache, currentFiscalWeek, currentFiscalYear]);

  if (loading || isCompanyLoading || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <HCMLoader text="Calcul des performances en cours..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
            <Award className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              HCM COST SAVINGS - Performances
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-green-500 to-cyan-500 bg-clip-text text-transparent">
            Récapitulatif des Performances Réalisées
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Analyse complète des performances par indicateur - Basé sur la feuille L1
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
                lastCompletedWeek.hasData
                  ? "text-green-600 dark:text-green-400"
                  : "text-orange-600 dark:text-orange-400"
              )}>
                Semaine {lastCompletedWeek.weekNumber} — {lastCompletedWeek.fiscalYear}
              </span>
              <span className="text-xs text-muted-foreground">
                ({lastCompletedWeek.weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - {lastCompletedWeek.weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })})
              </span>
              {lastCompletedWeek.hasData ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                  Données disponibles
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
                  Aucune donnée
                </Badge>
              )}
            </div>
          )}

          {/* Bouton Retour Menu Principal */}
          <div className="mt-4 flex items-center justify-center">
            <Button
              onClick={() => navigate('/modules/module3')}
              variant="outline"
              className="gap-2 border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              <Home className="w-4 h-4" />
              Retour menu principal
            </Button>
          </div>
        </motion.div>

        {/* Navigation vers les sous-pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* EKH Analysis */}
          <Card
            className={cn(
              "cursor-pointer border-2 hover:shadow-lg transition-all duration-300 group",
              activeSection === 'ekh'
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-cyan-500/20 hover:border-cyan-500/50",
              isSectionPending && "opacity-70 pointer-events-none"
            )}
            onClick={() => handleSectionChange('ekh')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-cyan-700 dark:text-cyan-400">Écarts de Know-How</h3>
                  <p className="text-xs text-muted-foreground">Analyse des compétences EKH</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>

          {/* Synthesis Performance */}
          <Card
            className={cn(
              "cursor-pointer border-2 hover:shadow-lg transition-all duration-300 group",
              activeSection === 'synthesis'
                ? "border-purple-500 bg-purple-500/10"
                : "border-purple-500/20 hover:border-purple-500/50",
              isSectionPending && "opacity-70 pointer-events-none"
            )}
            onClick={() => handleSectionChange('synthesis')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700 dark:text-purple-400">Synthèse Performance</h3>
                  <p className="text-xs text-muted-foreground">Vue par ligne d'activité</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>

          {/* Prime Distribution */}
          <Card
            className={cn(
              "cursor-pointer border-2 hover:shadow-lg transition-all duration-300 group",
              activeSection === 'primes'
                ? "border-amber-500 bg-amber-500/10"
                : "border-amber-500/20 hover:border-amber-500/50",
              isSectionPending && "opacity-70 pointer-events-none"
            )}
            onClick={() => handleSectionChange('primes')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white group-hover:scale-110 transition-transform">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-700 dark:text-amber-400">Répartition des Primes</h3>
                  <p className="text-xs text-muted-foreground">Distribution par salarié</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Indicateur de chargement pendant le changement de section */}
        {isSectionPending && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full border border-cyan-500/30">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                Chargement de la section...
              </span>
            </div>
          </div>
        )}

        {/* Dashboard de Statut des Périodes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PeriodStatusDashboard
            selectedYear={1}
            compact={false}
            defaultExpanded={false}
            title="STATUT DES VALIDATIONS - N+1"
          />
        </motion.div>

        {/* Filters & Controls - SANS calendrier ni cards de synthèse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-2 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un salarié..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* KPI Filter */}
                <Select value={selectedKPI} onValueChange={setSelectedKPI}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Target className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Indicateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les indicateurs</SelectItem>
                    {Object.entries(KPI_CONFIG).filter(([key]) => key !== 'ekh').map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.labelFr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Level Toggle - N1, N2, TOTAL - OPTIMISÉ avec useTransition */}
                <Tabs value={activeLevel} onValueChange={(v) => handleLevelChange(v as '1' | '2' | 'total')} className="w-auto">
                  <TabsList className={cn(isLevelPending && "opacity-70")}>
                    <TabsTrigger value="1" disabled={isLevelPending}>Niveau 1</TabsTrigger>
                    <TabsTrigger value="2" disabled={isLevelPending}>Niveau 2</TabsTrigger>
                    <TabsTrigger value="total" disabled={isLevelPending}>Niveau TOTAL</TabsTrigger>
                  </TabsList>
                </Tabs>
                {isLevelPending && <span className="text-xs text-muted-foreground animate-pulse">Chargement...</span>}

                {/* Refresh */}
                <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Indicator Tables */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {(selectedKPI === 'all' ? Object.keys(KPI_CONFIG).filter(k => k !== 'ekh') : [selectedKPI].filter(k => k !== 'ekh')).map((kpiType) => {
            const kpiConfig = KPI_CONFIG[kpiType];
            const totals = getTotals(kpiType);

            const isExpanded = expandedIndicators.has(kpiType);

            return (
              <Card key={kpiType} className="border-2 overflow-hidden" style={{ borderColor: `var(--${kpiConfig.color}-500, #888)20` }}>
                <CardHeader
                  className={cn("border-b bg-gradient-to-r cursor-pointer hover:opacity-90 transition-opacity", kpiConfig.gradient)}
                  onClick={() => toggleIndicator(kpiType)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/20">
                        {kpiConfig.icon}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">
                          {kpiConfig.labelFr}
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Niveau {activeLevel} - {isExpanded ? 'Cliquez pour réduire' : 'Cliquez pour voir les détails'}
                        </CardDescription>
                      </div>
                    </div>
                    {/* Résumé des totaux quand fermé + Flèche */}
                    <div className="flex items-center gap-4">
                      {!isExpanded && totals && (
                        <div className="hidden md:flex items-center gap-4 text-white/90 text-sm">
                          <span className="px-2 py-1 bg-white/20 rounded">
                            Économies: {(totals.economiesRealiseesTotal ?? 0).toLocaleString('fr-FR')} {currencyConfig.symbol}
                          </span>
                          <span className="px-2 py-1 bg-white/20 rounded">
                            PPR: {(totals.pprPrevuesTotal ?? 0).toLocaleString('fr-FR')} {currencyConfig.symbol}
                          </span>
                        </div>
                      )}
                      <div className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="p-0">
                    <IndicatorTable
                      kpiType={kpiType}
                      performances={filteredPerformances}
                      totals={totals}
                      currencySymbol={currencyConfig.symbol}
                      level={activeLevel === 'total' ? 'total' : (parseInt(activeLevel) as 1 | 2)}
                      businessLines={businessLines}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </motion.div>

        {/* ============================================ */}
        {/* TABLEAU SPÉCIFIQUE - ÉCARTS DE KNOW-HOW (EKH) */}
        {/* Placé après les tableaux standards, avant la synthèse */}
        {/* OPTIMISATION: Ne rendre que si activeSection === 'ekh' */}
        {/* ============================================ */}
        {activeSection === 'ekh' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          className="mt-6"
        >
          <Card className="border-2 border-cyan-500/30 overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-cyan-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">
                      Écarts de Know-How (EKH)
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      Niveau {activeLevel} - Analyse spécifique des compétences
                    </CardDescription>
                  </div>
                </div>
                {/* Bouton fermer */}
                <button
                  onClick={() => handleSectionChange('indicators')}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  title="Fermer cette section"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* ============================================ */}
              {/* OPTIMISATION PERFORMANCE: Composant virtualisé */}
              {/* Remplace l'IIFE de ~400 lignes par un composant */}
              {/* qui ne rend que les lignes visibles (15 au lieu de 73+) */}
              {/* ============================================ */}
              <VirtualizedEKHTable
                level={activeLevel as '1' | '2' | 'total'}
                employees={filteredPerformances}
                businessLines={businessLines}
                getEKHData={memoizedEKHData.getEKHData}
                currencySymbol={currencyConfig.symbol}
                ekhTotalsN1={memoizedEKHData.ekhTotalsN1}
                ekhTotalsN2={memoizedEKHData.ekhTotalsN2}
                ekhTotalsCalculated={memoizedEKHData.ekhTotalsCalculated}
              />
              {/* NOTE: ~360 lignes d'ancien code IIFE supprimées et remplacées par VirtualizedEKHTable ci-dessus */}
              {/* === ANCIEN CODE N1/N2/TOTAL SUPPRIMÉ (lignes 3392-3732) ===
                 Code remplacé par VirtualizedEKHTable ci-dessus.
                 L'ancien code IIFE faisait ~340 lignes et causait un blocage de l'UI.
                 Le nouveau composant VirtualizedEKHTable utilise @tanstack/react-virtual
                 pour ne rendre que ~15 lignes visibles au lieu de 73+ employés.
              === FIN SUPPRESSION === */}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* ============================================ */}
        {/* TABLEAU: Synthèse de la performance de la ligne d'activité */}
        {/* Structure: NIVEAU 1 (18 colonnes) + NIVEAU TOTAL (11 colonnes avec sous-colonnes) */}
        {/* OPTIMISATION: Ne rendre que si activeSection === 'synthesis' */}
        {/* ============================================ */}
        {activeSection === 'synthesis' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-8"
        >
          <Card className="border-2 border-indigo-500/30 overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">
                      Synthèse de la performance de la ligne d'activité
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      Répartition du bénéfice économique (Economies de coûts) entre la trésorerie et les primes des salariés
                    </CardDescription>
                  </div>
                </div>
                {/* Bouton fermer */}
                <button
                  onClick={() => handleSectionChange('indicators')}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  title="Fermer cette section"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* OPTIMISATION: Utilisation du composant virtualisé */}
              <VirtualizedSynthesisTable
                employeeScores={memoizedSynthesisData.employeeScores}
                eligibilityStats={memoizedSynthesisData.eligibilityStats}
                globalTotals={memoizedSynthesisData.globalTotals}
                currencySymbol={currencyConfig.symbol}
              />
              {/* LEGACY CODE REMOVED - Replaced by VirtualizedSynthesisTable above */}
              {false && (() => {
                // ============================================
                // CALCULS POUR LE TABLEAU SYNTHÈSE - LEGACY CODE DISABLED
                // Source: Tous les indicateurs (ABS, QD, AT, EPD, ESF)
                // ============================================

                // Indicateurs avec leurs labels pour les colonnes
                const indicateurs = [
                  { key: 'abs', label: 'ABS', fullLabel: 'Absentéisme' },
                  { key: 'qd', label: 'QD', fullLabel: 'Défaut Qualité' },
                  { key: 'oa', label: 'AT', fullLabel: 'Accident Travail' },
                  { key: 'ddp', label: 'EPD', fullLabel: 'Écart Productivité Directe' },
                  { key: 'ekh', label: 'ESF', fullLabel: 'Écart Savoir Faire' }
                ] as const;

                // Fonction pour obtenir les données d'un salarié pour un indicateur
                const getIndicatorData = (perf: EmployeePerformance, indicatorKey: string) => {
                  switch (indicatorKey) {
                    case 'abs': return perf.abs;
                    case 'qd': return perf.qd;
                    case 'oa': return perf.oa;
                    case 'ddp': return perf.ddp;
                    case 'ekh': return perf.ekh;
                    default: return perf.abs;
                  }
                };

                // Grouper les salariés par ligne d'activité
                const performancesByBusinessLine = new Map<string, EmployeePerformance[]>();
                businessLines.forEach(bl => {
                  performancesByBusinessLine.set(bl.id, []);
                });
                filteredPerformances.forEach(perf => {
                  const blPerfs = performancesByBusinessLine.get(perf.businessLineId);
                  if (blPerfs) {
                    blPerfs.push(perf);
                  }
                });

                // Calculer les TOTAUX GLOBAUX pour NIVEAU TOTAL
                const globalTotals = indicateurs.map(ind => {
                  const totals = calculateTotals(ind.key);
                  return {
                    indicateur: ind,
                    objectif: totals.pprPrevuesTotal,
                    economiesRealisees: totals.economiesRealiseesTotalCombine
                  };
                });

                // Total global tous indicateurs confondus
                const grandTotalObjectif = globalTotals.reduce((sum, t) => sum + t.objectif, 0);
                const grandTotalEconomies = globalTotals.reduce((sum, t) => sum + t.economiesRealisees, 0);

                // Répartition: 67% trésorerie, 33% primes
                const fluxTresorerie = grandTotalEconomies * 0.67;
                const sortiesPrimes = grandTotalEconomies * 0.33;

                // Pré-calculer les totaux de pertes par indicateur pour les pourcentages
                // Ces totaux sont utilisés comme référence pour calculer "Pertes en %"
                const indicatorTotalsMap = indicateurs.reduce((acc, ind) => {
                  const totals = calculateTotals(ind.key);
                  acc[ind.key] = {
                    totalPertesN1: totals.pertesConstateesTotal,
                    totalPertesN2: totals.pertesConstateesTotalN2,
                    totalPertesReference: totals.pertesConstateesTotal + totals.pertesConstateesTotalN2
                  };
                  return acc;
                }, {} as Record<string, { totalPertesN1: number; totalPertesN2: number; totalPertesReference: number }>);

                // ============================================
                // CALCUL EN DEUX PASSES (nécessaire car COLONNE 11 dépend de la somme globale)
                // ============================================

                // PASSE 1: Calcul des données de base et triN2TrancheNote pour chaque salarié
                const employeeScoresPass1 = filteredPerformances.map(emp => {
                  // ============================================
                  // CRITÈRE D'ÉLIGIBILITÉ À LA DISTRIBUTION (SOLUTION A - AUDIT CONFORME)
                  // ============================================
                  // Un salarié est ÉLIGIBLE à la distribution si et seulement si
                  // il a des données d'activité réelles (temps ou frais collectés)
                  // sur AU MOINS UN indicateur.
                  //
                  // PRINCIPE COMPTABLE: Respect du principe de CAUSALITÉ (IAS/IFRS)
                  // "Les coûts doivent être imputés aux unités qui les ont générés"
                  // ============================================
                  const hasActivityData = indicateurs.some(ind => {
                    const data = getIndicatorData(emp, ind.key);
                    // Vérifier si le salarié a des données de coûts réels
                    // Niveau 1: tempsCollecte ou fraisCollectes
                    // Niveau 2: tempsCollecteN2, tempsPrisEnCompte ou fraisPrisEnCompte
                    return (
                      data.tempsCollecte > 0 ||
                      data.fraisCollectes > 0 ||
                      data.tempsCollecteN2 > 0 ||
                      data.tempsPrisEnCompte > 0 ||
                      data.fraisPrisEnCompte > 0
                    );
                  });

                  // ============================================
                  // TOTAUX SALARIÉ - CONDITIONNÉS PAR hasActivityData
                  // ============================================
                  // RÈGLE AUDIT CONFORME:
                  // Seuls les salariés ayant généré des coûts (hasActivityData = true)
                  // doivent avoir des valeurs dans ces colonnes.
                  // Les salariés sans activité = 0 (pas de coûts = pas d'économies)
                  //
                  // JUSTIFICATION (IAS/IFRS):
                  // - Principe de Causalité: pas d'activité → pas d'imputation
                  // - Cohérence avec le fichier Excel source
                  // - Traçabilité audit: lien direct coûts ↔ économies
                  // ============================================

                  // Total économies du salarié
                  // = 0 si pas d'activité (hasActivityData = false)
                  // ============================================
                  // CORRECTION AUDIT: Plafonnement à 0 des économies négatives
                  // ============================================
                  // PROBLÈME IDENTIFIÉ: economiesRealisees peut être négatif quand Pertes > PPR
                  // Ex: [ekh] PPR: 141.87 | Pertes: 666.67 | Éco = -524.80 (NÉGATIF)
                  //
                  // SOLUTION: Plafonner chaque économie à 0 minimum
                  // Car on ne peut pas avoir des "économies négatives"
                  // Si Pertes > PPR → Économie = 0 (pas de gain, mais pas de perte comptabilisée ici)
                  //
                  // CONFORME AU FICHIER EXCEL: Aucune valeur négative dans les colonnes K6, AA6, etc.
                  // ============================================
                  // TOUS les salariés participent - calcul pour tous
                  const empTotalEco = indicateurs.reduce((sum, ind) => {
                    const data = getIndicatorData(emp, ind.key);
                    // Plafonner chaque économie à 0 minimum (pas de négatif)
                    const ecoN1 = Math.max(0, data.economiesRealisees);
                    const ecoN2 = Math.max(0, data.economiesRealiseesN2);
                    return sum + ecoN1 + ecoN2;
                  }, 0);

                  // Total PPR du salarié - calcul pour tous les salariés
                  const empTotalPPR = indicateurs.reduce((sum, ind) => {
                    const data = getIndicatorData(emp, ind.key);
                    return sum + data.pprPrevues;
                  }, 0);

                  // Total Pertes Constatées du salarié (pour traçabilité audit)
                  const empTotalPertes = indicateurs.reduce((sum, ind) => {
                    const data = getIndicatorData(emp, ind.key);
                    return sum + data.pertesConstatees + data.pertesConstateesN2;
                  }, 0);

                  // COLONNE 13-17: Taux économie par indicateur (ratio)
                  // FORMULE EXCEL: =IF(ISERROR((K6+AA6)/FI6),0,((K6+AA6)/FI6))
                  // (eco_indicateur_N1 + eco_indicateur_N2) / empTotalEco
                  // RÉSULTAT = ratio (ex: 0.25 = 25%)
                  // CORRECTION AUDIT: Plafonner les économies à 0 minimum (cohérent avec empTotalEco)
                  const tauxEcoByIndicator = indicateurs.reduce((acc, ind) => {
                    const data = getIndicatorData(emp, ind.key);
                    // Plafonner chaque économie à 0 minimum (pas de négatif)
                    const ecoN1 = Math.max(0, data.economiesRealisees);
                    const ecoN2 = Math.max(0, data.economiesRealiseesN2);
                    const eco = ecoN1 + ecoN2;
                    // FI6 = empTotalEco (Total Economie Réalisée)
                    // Stocke le ratio, pas le pourcentage
                    acc[ind.key] = empTotalEco > 0 ? eco / empTotalEco : 0;
                    return acc;
                  }, {} as Record<string, number>);

                  // COLONNE 18: Total taux économie = somme des ratios (devrait être ~1.0 = 100%)
                  // FORMULE EXCEL: =SUM(FJ6:FN6)
                  const totalTauxEco = Object.values(tauxEcoByIndicator).reduce((a, b) => a + b, 0);

                  // COLONNE 3: Scores - Pertes constatées en %
                  // FORMULE EXCEL: =(L6+AB6)+(AR6+BH6)+(BW6+CM6)+(DB6+DT6)+(EH6+ES6)
                  const scoresPertesEn = indicateurs.reduce((sum, ind) => {
                    const data = getIndicatorData(emp, ind.key);
                    const totalsRef = indicatorTotalsMap[ind.key];
                    const pertesN1Pct = totalsRef.totalPertesReference > 0
                      ? (data.pertesConstatees / totalsRef.totalPertesReference) * 100
                      : 0;
                    const pertesN2Pct = totalsRef.totalPertesReference > 0
                      ? (data.pertesConstateesN2 / totalsRef.totalPertesReference) * 100
                      : 0;
                    return sum + pertesN1Pct + pertesN2Pct;
                  }, 0);

                  // COLONNE 7: Tranche note salarié en %
                  // FORMULE EXCEL: =SI(EZ6<=10%;"100%";SI(EZ6<=33%;"60%";...))
                  // Tranches: ≤10%→100%, ≤33%→60%, ≤54%→30%, ≤79%→10%, >79%→0%
                  let trancheNote: number;
                  if (scoresPertesEn <= 10) trancheNote = 100;
                  else if (scoresPertesEn <= 33) trancheNote = 60;
                  else if (scoresPertesEn <= 54) trancheNote = 30;
                  else if (scoresPertesEn <= 79) trancheNote = 10;
                  else trancheNote = 0;

                  // ============================================
                  // COLONNE 8: Tri-Tranche Note salarié - DISTRIBUTION ÉQUITABLE
                  // ============================================
                  // FORMULE: =SI(EX6<>0;FD6;0)
                  // → TOUS les salariés existants participent à la distribution
                  //
                  // PRINCIPE DE DISTRIBUTION:
                  // - Un salarié avec faible score de pertes (ex: 0.5%) = excellent
                  //   → trancheNote élevée (100) = participation importante aux primes
                  // - Un salarié avec fort score de pertes (ex: 80%) = moins performant
                  //   → trancheNote faible (0) = participation réduite aux primes
                  //
                  // JUSTIFICATION:
                  // - Équité: tous les salariés contribuent selon leur performance
                  // - Un salarié sans coûts générés est un EXCELLENT contributeur
                  // ============================================
                  const triTrancheNote = emp.employeeName ? trancheNote : 0;

                  // COLONNE 9: Tri N°2-Tranche Note salarié
                  // FORMULE EXCEL: =FE6+0
                  const triN2TrancheNote = triTrancheNote;

                  return {
                    employee: emp,
                    empTotalEco,
                    empTotalPPR,
                    empTotalPertes,
                    hasActivityData,
                    scoresPertesEn,
                    trancheNote,
                    triTrancheNote,
                    triN2TrancheNote,
                    tauxEcoByIndicator,
                    totalTauxEco
                  };
                });

                // COLONNE 11 (NIVEAU TOTAL): Score Note total en % = SOMME de tous les triN2TrancheNote
                // FORMULE EXCEL: $FO$4 = SOMME(FF6:FF1705)
                const scoreNoteTotalPct = employeeScoresPass1.reduce((sum, emp) => sum + emp.triN2TrancheNote, 0);

                // ============================================
                // STATISTIQUES D'ÉLIGIBILITÉ (POUR TRAÇABILITÉ AUDIT)
                // ============================================
                const eligibilityStats = {
                  totalEmployees: employeeScoresPass1.length,
                  eligibleEmployees: employeeScoresPass1.filter(e => e.hasActivityData).length,
                  nonEligibleEmployees: employeeScoresPass1.filter(e => !e.hasActivityData).length,
                  totalPertesEligibles: employeeScoresPass1
                    .filter(e => e.hasActivityData)
                    .reduce((sum, e) => sum + e.empTotalPertes, 0)
                };

                // PASSE 2: Calcul des colonnes dépendantes de scoreNoteTotalPct
                const employeeScores = employeeScoresPass1.map(empData => {
                  const emp = empData.employee;

                  // COLONNE 11 (NIVEAU 1): Score Note total en %
                  // FORMULE EXCEL: =SI(EX6<>0;$FO$4;0)
                  // Si salarié existe → scoreNoteTotalPct, Sinon → 0
                  const empScoreNoteTotalPct = emp.employeeName ? scoreNoteTotalPct : 0;

                  // COLONNE 6: Contribution en % au résultat commun
                  // FORMULE EXCEL: =IF(ISERROR(FF6/FH6),0,(FF6/FH6))
                  // FF6 = triN2TrancheNote (COLONNE 9)
                  // FH6 = scoreNoteTotalPct (COLONNE 11 - somme globale $FO$4)
                  // RÉSULTAT = ratio (ex: 0.05 = 5%)
                  const contributionRatio = empScoreNoteTotalPct > 0
                    ? empData.triN2TrancheNote / empScoreNoteTotalPct
                    : 0;
                  // Pour l'affichage en pourcentage
                  const contributionPct = contributionRatio * 100;

                  // COLONNE 10: Score-Prime TOTAL
                  // FORMULE EXCEL: =IF(EX6<>0,$FL$4,0)
                  // Si salarié existe → sortiesPrimes, Sinon → 0
                  // $FL$4 = sortiesPrimes (33% des économies totales)
                  const scorePrimeTotal = emp.employeeName ? sortiesPrimes : 0;

                  // COLONNE 4: Part de la prime correspondant à la contribution du salarié
                  // FORMULE EXCEL: =FG6*FC6
                  // FG6 = scorePrimeTotal (COLONNE 10)
                  // FC6 = contributionRatio (COLONNE 6 - ratio, pas pourcentage)
                  const partPrime = scorePrimeTotal * contributionRatio;

                  // COLONNE 5: Part Trésorerie/Contribution salarié
                  // FORMULE EXCEL: =$FK$4*FC6
                  // $FK$4 = fluxTresorerie (67% des économies totales = FI4*67%)
                  // FC6 = contributionRatio (COLONNE 6 - ratio)
                  const partTresorerie = fluxTresorerie * contributionRatio;

                  return {
                    employee: emp,
                    empTotalEco: empData.empTotalEco,
                    empTotalPPR: empData.empTotalPPR,
                    empTotalPertes: empData.empTotalPertes,
                    hasActivityData: empData.hasActivityData,
                    scoresPertesEn: empData.scoresPertesEn,
                    partPrime,
                    partTresorerie,
                    contributionPct,
                    trancheNote: empData.trancheNote,
                    triTrancheNote: empData.triTrancheNote,
                    triN2TrancheNote: empData.triN2TrancheNote,
                    scorePrimeTotal,
                    scoreNoteTotalPct: empScoreNoteTotalPct,
                    tauxEcoByIndicator: empData.tauxEcoByIndicator,
                    totalTauxEco: empData.totalTauxEco
                  };
                });

                return (
                  <div className="space-y-6">
                    {/* ============================================ */}
                    {/* BANDEAU STATISTIQUES D'ÉLIGIBILITÉ (AUDIT) */}
                    {/* ============================================ */}
                    <div className="p-4 bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">
                          Critères d'Éligibilité à la Distribution (Conforme Audit IAS/IFRS)
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-md p-3 border border-slate-200 dark:border-slate-600">
                          <div className="text-slate-500 dark:text-slate-400 text-xs">Total Salariés</div>
                          <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            {eligibilityStats.totalEmployees}
                          </div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-md p-3 border border-emerald-200 dark:border-emerald-700">
                          <div className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Éligibles (avec coûts)
                          </div>
                          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                            {eligibilityStats.eligibleEmployees}
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md p-3 border border-slate-200 dark:border-slate-600">
                          <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Non-éligibles (sans coûts)
                          </div>
                          <div className="text-xl font-bold text-slate-600 dark:text-slate-300">
                            {eligibilityStats.nonEligibleEmployees}
                          </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-md p-3 border border-amber-200 dark:border-amber-700">
                          <div className="text-amber-600 dark:text-amber-400 text-xs">Pertes Totales Éligibles</div>
                          <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                            {formatCurrency(eligibilityStats.totalPertesEligibles, selectedCurrency)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">
                        Principe de Causalité (IAS/IFRS): Seuls les salariés ayant généré des coûts (temps ou frais collectés) participent à la distribution des économies/pertes.
                      </p>
                    </div>

                    {/* ============================================ */}
                    {/* NIVEAU 1: Tableau détaillé par salarié (18 colonnes) */}
                    {/* ============================================ */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        NIVEAU 1 - Détail par salarié
                        <Badge variant="outline" className="ml-2 text-xs">
                          {eligibilityStats.eligibleEmployees} éligible(s) sur {eligibilityStats.totalEmployees}
                        </Badge>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b-2 border-indigo-500/30 bg-indigo-500/10">
                              {/* COL 1: Nom du salarié */}
                              <th className="text-left py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 sticky left-0 bg-indigo-100 dark:bg-indigo-900/50 z-10">
                                Nom du salarié
                              </th>
                              {/* COL 2: Catégorie pro */}
                              <th className="text-left py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20">
                                Catégorie pro
                              </th>
                              {/* COL 3: Scores - Pertes constatées en % */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-orange-100 dark:bg-orange-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Scores Pertes %</TooltipTrigger>
                                    <TooltipContent><p>Scores - Pertes constatées en %</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 4: Part de la prime correspondant à la contribution du salarié */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-amber-100 dark:bg-amber-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Part Prime</TooltipTrigger>
                                    <TooltipContent><p>Part de la prime correspondant à la contribution du salarié</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 5: Part Trésorerie/Contribution salarié */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-cyan-100 dark:bg-cyan-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Part Tréso</TooltipTrigger>
                                    <TooltipContent><p>Part Trésorerie/Contribution salarié = $FK$4*FC6</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 6: Contribution en % au résultat commun */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-purple-100 dark:bg-purple-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Contrib %</TooltipTrigger>
                                    <TooltipContent><p>Contribution en % au résultat commun (Ratio d'efficience globale)</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 7: Tranche note salarié en % */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-blue-100 dark:bg-blue-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tranche %</TooltipTrigger>
                                    <TooltipContent><p>Tranche note salarié en %</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 8: Tri-Tranche Note salarié */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-indigo-100 dark:bg-indigo-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tri-Tranche</TooltipTrigger>
                                    <TooltipContent><p>Tri-Tranche Note salarié</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 9: Tri N°2-Tranche Note salarié */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-violet-100 dark:bg-violet-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tri N°2</TooltipTrigger>
                                    <TooltipContent><p>Tri N°2-Tranche Note salarié</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 10: Score-Prime TOTAL */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-green-100 dark:bg-green-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Score-Prime</TooltipTrigger>
                                    <TooltipContent><p>Score-Prime TOTAL</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 11: Score Note total en % */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-emerald-100 dark:bg-emerald-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Score Note %</TooltipTrigger>
                                    <TooltipContent><p>Score Note total en %</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 12: Total Economie Réalisée */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-green-200 dark:bg-green-800/30">
                                Total Éco
                              </th>
                              {/* COL 13-17: Taux Economie par indicateur */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-orange-50 dark:bg-orange-900/20">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tx ABS</TooltipTrigger>
                                    <TooltipContent><p>Taux Economie - Absentéisme</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-rose-50 dark:bg-rose-900/20">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tx QD</TooltipTrigger>
                                    <TooltipContent><p>Taux Economie - Défauts de qualité</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-red-50 dark:bg-red-900/20">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tx AT</TooltipTrigger>
                                    <TooltipContent><p>Taux Economie - Accidents de travail</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-violet-50 dark:bg-violet-900/20">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tx EPD</TooltipTrigger>
                                    <TooltipContent><p>Taux Economie - Ecart de productivité directe</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-indigo-500/20 bg-cyan-50 dark:bg-cyan-900/20">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tx ESF</TooltipTrigger>
                                    <TooltipContent><p>Taux Economie - Ecart de Know-how</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              {/* COL 18: Total Taux Economie */}
                              <th className="text-center py-2 px-2 font-semibold whitespace-nowrap bg-teal-100 dark:bg-teal-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Total Tx</TooltipTrigger>
                                    <TooltipContent><p>Total Taux Economie</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Itérer sur chaque ligne d'activité */}
                            {businessLines.map((bl) => {
                              const blEmployees = performancesByBusinessLine.get(bl.id) || [];
                              const blScores = employeeScores.filter(s => s.employee.businessLineId === bl.id);

                              return (
                                <React.Fragment key={bl.id}>
                                  {/* Ligne d'en-tête pour la business line */}
                                  <tr className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-t-2 border-indigo-500/30">
                                    <td colSpan={18} className="py-2 px-2 font-bold text-indigo-700 dark:text-indigo-300">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        {bl.activity_name}
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {blEmployees.length} salarié(s)
                                        </Badge>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Lignes des salariés */}
                                  {blScores.map((score, empIdx) => (
                                    <tr
                                      key={score.employee.employeeId}
                                      className={cn(
                                        "border-b border-indigo-500/10 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors",
                                        empIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-800/20",
                                        // Indicateur visuel d'éligibilité
                                        !score.hasActivityData && "opacity-50"
                                      )}
                                    >
                                      {/* COL 1: Nom du salarié + Indicateur d'éligibilité */}
                                      <td className="py-1.5 px-2 font-medium sticky left-0 bg-inherit">
                                        <div className="flex items-center gap-1.5">
                                          {/* Indicateur d'éligibilité (point coloré) */}
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className={cn(
                                                  "w-2 h-2 rounded-full flex-shrink-0",
                                                  score.hasActivityData
                                                    ? "bg-emerald-500"
                                                    : "bg-slate-300 dark:bg-slate-600"
                                                )} />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">
                                                  {score.hasActivityData
                                                    ? "Éligible: a des coûts enregistrés"
                                                    : "Non-éligible: aucun coût enregistré"}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          <span>{score.employee.employeeName}</span>
                                        </div>
                                      </td>
                                      {/* COL 2: Catégorie pro */}
                                      <td className="py-1.5 px-2 text-muted-foreground">
                                        {score.employee.professionalCategory}
                                      </td>
                                      {/* COL 3: Scores - Pertes constatées en % */}
                                      <td className="py-1.5 px-2 text-center">
                                        <Badge variant="outline" className={cn(
                                          "text-xs",
                                          score.scoresPertesEn > 50 ? "bg-red-500/20 text-red-600" :
                                          score.scoresPertesEn > 25 ? "bg-orange-500/20 text-orange-600" :
                                          "bg-green-500/20 text-green-600"
                                        )}>
                                          {score.scoresPertesEn.toFixed(1)}%
                                        </Badge>
                                      </td>
                                      {/* COL 4: Part Prime */}
                                      <td className="py-1.5 px-2 text-center font-medium text-amber-600">
                                        {score.partPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      {/* COL 5: Part Trésorerie */}
                                      <td className="py-1.5 px-2 text-center font-medium text-cyan-600">
                                        {score.partTresorerie.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      {/* COL 6: Contribution % */}
                                      <td className="py-1.5 px-2 text-center">
                                        <Badge variant="outline" className="bg-purple-500/20 text-purple-600">
                                          {score.contributionPct.toFixed(2)}%
                                        </Badge>
                                      </td>
                                      {/* COL 7: Tranche note % */}
                                      <td className="py-1.5 px-2 text-center font-medium">
                                        {score.trancheNote}
                                      </td>
                                      {/* COL 8: Tri-Tranche */}
                                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                                        {score.triTrancheNote}
                                      </td>
                                      {/* COL 9: Tri N°2 */}
                                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                                        {score.triN2TrancheNote.toFixed(1)}
                                      </td>
                                      {/* COL 10: Score-Prime TOTAL */}
                                      <td className="py-1.5 px-2 text-center font-bold text-green-600">
                                        {score.scorePrimeTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      {/* COL 11: Score Note total (somme des tranches $FO$4) */}
                                      <td className="py-1.5 px-2 text-center">
                                        <Badge className={cn(
                                          "text-xs",
                                          score.scoreNoteTotalPct > 0 ? "bg-emerald-500" : "bg-gray-400",
                                          "text-white"
                                        )}>
                                          {score.scoreNoteTotalPct.toFixed(0)}
                                        </Badge>
                                      </td>
                                      {/* COL 12: Total Économie */}
                                      <td className="py-1.5 px-2 text-center font-bold text-green-700">
                                        {score.empTotalEco.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      {/* COL 13-17: Taux par indicateur (ratio × 100 pour affichage en %) */}
                                      {indicateurs.map(ind => (
                                        <td key={`tx-${ind.key}`} className="py-1.5 px-2 text-center text-xs">
                                          {(score.tauxEcoByIndicator[ind.key] * 100).toFixed(1)}%
                                        </td>
                                      ))}
                                      {/* COL 18: Total Taux (ratio × 100 pour affichage en %) */}
                                      <td className="py-1.5 px-2 text-center font-medium">
                                        {(score.totalTauxEco * 100).toFixed(1)}%
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ============================================ */}
                    {/* NIVEAU TOTAL: Tableau récapitulatif (11 colonnes avec sous-colonnes) */}
                    {/* ============================================ */}
                    <div className="p-4 border-t-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10">
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        NIVEAU TOTAL - Synthèse globale
                        <Badge variant="outline" className="ml-2 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                          {eligibilityStats.eligibleEmployees} salarié(s) éligible(s)
                        </Badge>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            {/* Ligne 1: En-têtes groupés */}
                            <tr className="border-b border-purple-500/30 bg-purple-500/10">
                              {/* COL 1-5: Indicateurs avec sous-colonnes */}
                              <th colSpan={2} className="text-center py-2 px-2 font-bold whitespace-nowrap border-r border-purple-500/30 bg-orange-100 dark:bg-orange-900/30">
                                ABSENTÉISME
                              </th>
                              <th colSpan={2} className="text-center py-2 px-2 font-bold whitespace-nowrap border-r border-purple-500/30 bg-rose-100 dark:bg-rose-900/30">
                                DÉFAUT DE QUALITÉ
                              </th>
                              <th colSpan={2} className="text-center py-2 px-2 font-bold whitespace-nowrap border-r border-purple-500/30 bg-red-100 dark:bg-red-900/30">
                                ACCIDENT DE TRAVAIL
                              </th>
                              <th colSpan={2} className="text-center py-2 px-2 font-bold whitespace-nowrap border-r border-purple-500/30 bg-violet-100 dark:bg-violet-900/30">
                                ÉCART PRODUCTIVITÉ
                              </th>
                              <th colSpan={2} className="text-center py-2 px-2 font-bold whitespace-nowrap border-r border-purple-500/30 bg-cyan-100 dark:bg-cyan-900/30">
                                ÉCART SAVOIR FAIRE
                              </th>
                              {/* COL 6: TOTAL */}
                              <th colSpan={2} className="text-center py-2 px-2 font-bold whitespace-nowrap border-r border-purple-500/30 bg-purple-200 dark:bg-purple-800/30">
                                TOTAL
                              </th>
                              {/* COL 7-11: Colonnes simples */}
                              <th rowSpan={2} className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-purple-500/30 bg-green-100 dark:bg-green-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tréso (67%)</TooltipTrigger>
                                    <TooltipContent><p>Flux en renforcement de la trésorerie (67%)</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th rowSpan={2} className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-purple-500/30 bg-amber-100 dark:bg-amber-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Primes (33%)</TooltipTrigger>
                                    <TooltipContent><p>Sorties de trésorerie en renforcement des primes (33%)</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th rowSpan={2} className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-purple-500/30 bg-yellow-100 dark:bg-yellow-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Part Prime</TooltipTrigger>
                                    <TooltipContent><p>Part de la prime correspondant à la contribution du salarié</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th rowSpan={2} className="text-center py-2 px-2 font-semibold whitespace-nowrap border-r border-purple-500/30 bg-indigo-100 dark:bg-indigo-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Contrib %</TooltipTrigger>
                                    <TooltipContent><p>Contribution en % au résultat commun (Ratio d'efficience globale)</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th rowSpan={2} className="text-center py-2 px-2 font-semibold whitespace-nowrap bg-blue-100 dark:bg-blue-900/30">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>Tranche %</TooltipTrigger>
                                    <TooltipContent><p>Tranche de la note en %</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                            </tr>
                            {/* Ligne 2: Sous-colonnes */}
                            <tr className="border-b-2 border-purple-500/30 bg-purple-500/5">
                              {/* Sous-colonnes pour chaque indicateur */}
                              {indicateurs.map(ind => (
                                <React.Fragment key={`sub-${ind.key}`}>
                                  <th className="text-center py-2 px-2 text-xs font-medium border-r border-purple-500/20">
                                    Objectif
                                  </th>
                                  <th className="text-center py-2 px-2 text-xs font-medium border-r border-purple-500/20">
                                    Éco réalisées
                                  </th>
                                </React.Fragment>
                              ))}
                              {/* Sous-colonnes TOTAL */}
                              <th className="text-center py-2 px-2 text-xs font-medium border-r border-purple-500/20 bg-purple-100 dark:bg-purple-800/20">
                                TOTAL Objectif
                              </th>
                              <th className="text-center py-2 px-2 text-xs font-medium border-r border-purple-500/30 bg-purple-100 dark:bg-purple-800/20">
                                TOTAL Éco
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Ligne unique avec les totaux */}
                            <tr className="bg-white dark:bg-transparent border-b border-purple-500/20 hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                              {/* Valeurs par indicateur */}
                              {globalTotals.map(item => (
                                <React.Fragment key={`val-${item.indicateur.key}`}>
                                  <td className="py-3 px-2 text-center font-medium">
                                    {item.objectif.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-2 text-center font-bold text-green-600">
                                    {item.economiesRealisees.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </React.Fragment>
                              ))}
                              {/* TOTAL */}
                              <td className="py-3 px-2 text-center font-bold text-purple-700 bg-purple-50 dark:bg-purple-900/20">
                                {grandTotalObjectif.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2 text-center font-bold text-green-700 text-lg bg-purple-50 dark:bg-purple-900/20">
                                {grandTotalEconomies.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              {/* Colonnes 7-11 */}
                              <td className="py-3 px-2 text-center font-bold text-green-600">
                                {fluxTresorerie.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2 text-center font-bold text-amber-600">
                                {sortiesPrimes.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2 text-center font-medium">
                                {sortiesPrimes.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <Badge className="bg-purple-500 text-white">100%</Badge>
                              </td>
                              {/* COLONNE 11: Tranche de la note en % = SOMME(FF6:FF1705) */}
                              {/* FF6 = Tri N°2-Tranche Note salarié (triN2TrancheNote) */}
                              {/* scoreNoteTotalPct = somme de tous les triN2TrancheNote */}
                              <td className="py-3 px-2 text-center">
                                <Badge className="bg-blue-500 text-white">
                                  {scoreNoteTotalPct.toFixed(1)}
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="bg-gradient-to-r from-purple-200 to-indigo-200 dark:from-purple-900/50 dark:to-indigo-900/50 border-t-2 border-purple-500/30">
                              <td colSpan={17} className="py-3 px-3 text-right font-bold text-purple-700 dark:text-purple-300">
                                <div className="flex items-center justify-end gap-2">
                                  <PiggyBank className="w-5 h-5 text-purple-600" />
                                  Bénéfice économique total:
                                  <span className="text-xl text-green-700 ml-2">
                                    {grandTotalEconomies.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyConfig.symbol}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* ============================================ */}
        {/* TABLEAU: Répartition des Primes par Salarié */}
        {/* ============================================ */}
        {activeSection === 'primes' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-lg">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      Répartition des Primes pour chaque salarié et en fonction de chaque indicateur de performance
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Distribution des primes prévisionnelles et réalisées par indicateur
                    </p>
                  </div>
                </div>
                {/* Bouton fermer */}
                <button
                  onClick={() => handleSectionChange('indicators')}
                  className="p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                  title="Fermer cette section"
                >
                  <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // ============================================
                // OPTIMISATION: Utilise les données pré-calculées de memoizedPrimesData
                // ============================================
                const {
                  primeIndicateurs,
                  performancesByBusinessLineForPrime,
                  calculatePrimeData
                } = memoizedPrimesData;

                return (
                  <div className="space-y-6">
                    {/* NIVEAU 1: Détail par ligne d'activité et par salarié */}
                    {businessLines.map((businessLine, blIndex) => {
                      const blEmployees = performancesByBusinessLineForPrime.get(businessLine.id) || [];
                      if (blEmployees.length === 0) return null;

                      return (
                      <div key={businessLine.id} className="space-y-2">
                        {/* En-tête ligne d'activité */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white">
                          <Building2 className="w-5 h-5" />
                          <span className="font-bold">{businessLine.activity_name}</span>
                          <Badge className="bg-white/20 text-white ml-2">
                            {blEmployees.length} salariés
                          </Badge>
                        </div>

                        {/* Tableau NIVEAU 1 */}
                        <div className="overflow-x-auto rounded-lg border border-amber-200 dark:border-amber-800">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
                                {/* COL 1: Nom du salarié */}
                                <th className="text-left py-2 px-3 font-semibold whitespace-nowrap border-r border-amber-300 dark:border-amber-700 sticky left-0 bg-amber-100 dark:bg-amber-900/50 z-10">
                                  Nom du salarié
                                </th>
                                {/* Colonnes par indicateur (4 colonnes chacun) */}
                                {primeIndicateurs.map((ind, idx) => (
                                  <React.Fragment key={ind.key}>
                                    <th colSpan={4} className={`text-center py-1 px-1 font-semibold whitespace-nowrap border-r border-amber-300 dark:border-amber-700 ${
                                      idx % 2 === 0 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-orange-50 dark:bg-orange-900/30'
                                    }`}>
                                      {ind.label}
                                    </th>
                                  </React.Fragment>
                                ))}
                                {/* TOTAUX */}
                                <th colSpan={4} className="text-center py-1 px-1 font-semibold whitespace-nowrap bg-green-100 dark:bg-green-900/30">
                                  TOTAUX
                                </th>
                              </tr>
                              <tr className="bg-amber-50 dark:bg-amber-900/30 text-xs">
                                <th className="py-1 px-3 sticky left-0 bg-amber-50 dark:bg-amber-900/30 z-10"></th>
                                {/* Sous-colonnes pour chaque indicateur */}
                                {primeIndicateurs.map((ind, idx) => (
                                  <React.Fragment key={`sub-${ind.key}`}>
                                    <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300">Prév. Prime</th>
                                    <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300">Prév. Tréso</th>
                                    <th className="py-1 px-1 text-center whitespace-nowrap text-green-700 dark:text-green-300">Réal. Prime</th>
                                    <th className="py-1 px-1 text-center whitespace-nowrap border-r border-amber-300 dark:border-amber-700 text-green-700 dark:text-green-300">Réal. Tréso</th>
                                  </React.Fragment>
                                ))}
                                {/* Sous-colonnes TOTAUX */}
                                <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300">Prév. Prime</th>
                                <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300">Prév. Tréso</th>
                                <th className="py-1 px-1 text-center whitespace-nowrap text-green-700 dark:text-green-300">Réal. Prime</th>
                                <th className="py-1 px-1 text-center whitespace-nowrap text-green-700 dark:text-green-300">Réal. Tréso</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blEmployees.map((emp, empIndex) => {
                                // Calculer les données pour chaque indicateur
                                const primeDataByIndicator = primeIndicateurs.map(ind => calculatePrimeData(emp, ind.key));

                                // Calculer les totaux ligne
                                const totalPrevPrime = primeDataByIndicator.reduce((sum, d) => sum + d.prevPrime, 0);
                                const totalPrevTreso = primeDataByIndicator.reduce((sum, d) => sum + d.prevTreso, 0);
                                const totalRealPrime = primeDataByIndicator.reduce((sum, d) => sum + d.realPrime, 0);
                                const totalRealTreso = primeDataByIndicator.reduce((sum, d) => sum + d.realTreso, 0);

                                return (
                                  <tr
                                    key={emp.odooEmployeeId || emp.employeeName || empIndex}
                                    className={`${empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-amber-50/30 dark:bg-amber-900/10'} hover:bg-amber-100/50 dark:hover:bg-amber-800/20 transition-colors`}
                                  >
                                    {/* COL 1: Nom du salarié */}
                                    <td className="py-2 px-3 font-medium sticky left-0 bg-inherit z-10 border-r border-amber-200 dark:border-amber-800">
                                      {emp.employeeName || '-'}
                                    </td>
                                    {/* Colonnes par indicateur */}
                                    {primeDataByIndicator.map((data, idx) => (
                                      <React.Fragment key={`data-${idx}`}>
                                        <td className="py-2 px-1 text-center text-amber-600 dark:text-amber-400">
                                          {data.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-1 text-center text-amber-600 dark:text-amber-400">
                                          {data.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-1 text-center text-green-600 dark:text-green-400">
                                          {data.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-1 text-center border-r border-amber-200 dark:border-amber-800 text-green-600 dark:text-green-400">
                                          {data.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </React.Fragment>
                                    ))}
                                    {/* TOTAUX ligne */}
                                    <td className="py-2 px-1 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                                      {totalPrevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-1 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                                      {totalPrevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-1 text-center font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20">
                                      {totalRealPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-1 text-center font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20">
                                      {totalRealTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* LIGNE TOTAL LIGNE D'ACTIVITÉ */}
                              {(() => {
                                // Calculer les totaux pour cette ligne d'activité
                                const blTotalsByIndicator = primeIndicateurs.map(ind => {
                                  let totalPrevPrime = 0;
                                  let totalPrevTreso = 0;
                                  let totalRealPrime = 0;
                                  let totalRealTreso = 0;

                                  blEmployees.forEach(emp => {
                                    const primeData = calculatePrimeData(emp, ind.key);
                                    totalPrevPrime += primeData.prevPrime;
                                    totalPrevTreso += primeData.prevTreso;
                                    totalRealPrime += primeData.realPrime;
                                    totalRealTreso += primeData.realTreso;
                                  });

                                  return { prevPrime: totalPrevPrime, prevTreso: totalPrevTreso, realPrime: totalRealPrime, realTreso: totalRealTreso };
                                });

                                return (
                                  <tr className="bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800/50 dark:to-orange-800/50 font-bold border-t-2 border-amber-400 dark:border-amber-600">
                                    {/* COL 1: Titre */}
                                    <td className="py-2 px-3 font-bold sticky left-0 bg-amber-200 dark:bg-amber-800/50 z-10 border-r border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-100">
                                      TOTAL LIGNE D'ACTIVITÉ
                                    </td>
                                    {/* Totaux par indicateur */}
                                    {blTotalsByIndicator.map((totals, idx) => (
                                      <React.Fragment key={`bl-total-${idx}`}>
                                        <td className="py-2 px-1 text-center font-bold text-amber-800 dark:text-amber-200">
                                          {totals.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-1 text-center font-bold text-amber-800 dark:text-amber-200">
                                          {totals.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-1 text-center font-bold text-green-700 dark:text-green-300">
                                          {totals.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-1 text-center font-bold border-r border-amber-400 dark:border-amber-600 text-green-700 dark:text-green-300">
                                          {totals.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </React.Fragment>
                                    ))}
                                    {/* Cellules vides pour les colonnes TOTAUX (pas demandées) */}
                                    <td className="py-2 px-1 bg-amber-100 dark:bg-amber-900/30"></td>
                                    <td className="py-2 px-1 bg-amber-100 dark:bg-amber-900/30"></td>
                                    <td className="py-2 px-1 bg-green-100 dark:bg-green-900/30"></td>
                                    <td className="py-2 px-1 bg-green-100 dark:bg-green-900/30"></td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      );
                    })}

                    {/* NIVEAU TOTAL: Totaux globaux */}
                    <div className="mt-6">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white mb-2">
                        <PiggyBank className="w-5 h-5" />
                        <span className="font-bold">NIVEAU TOTAL - Récapitulatif Global</span>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-green-200 dark:border-green-800">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50">
                              {/* Colonnes par indicateur (4 colonnes chacun) */}
                              {primeIndicateurs.map((ind, idx) => (
                                <th key={ind.key} colSpan={4} className={`text-center py-2 px-1 font-semibold whitespace-nowrap border-r border-green-300 dark:border-green-700 ${
                                  idx % 2 === 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'
                                }`}>
                                  {ind.label}
                                </th>
                              ))}
                              {/* TOTAUX GLOBAUX */}
                              <th colSpan={4} className="text-center py-2 px-1 font-semibold whitespace-nowrap bg-amber-100 dark:bg-amber-900/30">
                                TOTAUX GLOBAUX
                              </th>
                            </tr>
                            <tr className="bg-green-50 dark:bg-green-900/30 text-xs">
                              {/* Sous-colonnes pour chaque indicateur */}
                              {primeIndicateurs.map((ind) => (
                                <React.Fragment key={`total-sub-${ind.key}`}>
                                  <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300">Total Prév. Prime</th>
                                  <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300">Total Prév. Tréso</th>
                                  <th className="py-1 px-1 text-center whitespace-nowrap text-green-700 dark:text-green-300">Total Réal. Prime</th>
                                  <th className="py-1 px-1 text-center whitespace-nowrap border-r border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">Total Réal. Tréso</th>
                                </React.Fragment>
                              ))}
                              {/* Sous-colonnes TOTAUX GLOBAUX */}
                              <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300 font-bold">TOTAL Prév. Prime</th>
                              <th className="py-1 px-1 text-center whitespace-nowrap text-amber-700 dark:text-amber-300 font-bold">TOTAL Prév. Tréso</th>
                              <th className="py-1 px-1 text-center whitespace-nowrap text-green-700 dark:text-green-300 font-bold">TOTAL Réal. Prime</th>
                              <th className="py-1 px-1 text-center whitespace-nowrap text-green-700 dark:text-green-300 font-bold">TOTAL Réal. Tréso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Calculer les totaux par indicateur
                              const totalsByIndicator = primeIndicateurs.map(ind => {
                                let totalPrevPrime = 0;
                                let totalPrevTreso = 0;
                                let totalRealPrime = 0;
                                let totalRealTreso = 0;

                                filteredPerformances.forEach(emp => {
                                  const primeData = calculatePrimeData(emp, ind.key);
                                  totalPrevPrime += primeData.prevPrime;
                                  totalPrevTreso += primeData.prevTreso;
                                  totalRealPrime += primeData.realPrime;
                                  totalRealTreso += primeData.realTreso;
                                });

                                return {
                                  key: ind.key,
                                  prevPrime: totalPrevPrime,
                                  prevTreso: totalPrevTreso,
                                  realPrime: totalRealPrime,
                                  realTreso: totalRealTreso
                                };
                              });

                              // Calculer les totaux globaux
                              const grandTotalPrevPrime = totalsByIndicator.reduce((sum, t) => sum + t.prevPrime, 0);
                              const grandTotalPrevTreso = totalsByIndicator.reduce((sum, t) => sum + t.prevTreso, 0);
                              const grandTotalRealPrime = totalsByIndicator.reduce((sum, t) => sum + t.realPrime, 0);
                              const grandTotalRealTreso = totalsByIndicator.reduce((sum, t) => sum + t.realTreso, 0);

                              return (
                                <tr className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                  {/* Totaux par indicateur */}
                                  {totalsByIndicator.map((totalInd) => (
                                    <React.Fragment key={`total-${totalInd.key}`}>
                                      <td className="py-3 px-1 text-center font-bold text-amber-700 dark:text-amber-300">
                                        {totalInd.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-3 px-1 text-center font-bold text-amber-700 dark:text-amber-300">
                                        {totalInd.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-3 px-1 text-center font-bold text-green-700 dark:text-green-300">
                                        {totalInd.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-3 px-1 text-center font-bold border-r border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                                        {totalInd.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </React.Fragment>
                                  ))}
                                  {/* TOTAUX GLOBAUX */}
                                  <td className="py-3 px-2 text-center font-bold text-lg text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/30">
                                    {grandTotalPrevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-2 text-center font-bold text-lg text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/30">
                                    {grandTotalPrevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-2 text-center font-bold text-lg text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30">
                                    {grandTotalRealPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-2 text-center font-bold text-lg text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30">
                                    {grandTotalRealTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* ============================================ */}
        {/* TABLEAU: Répartition des Performances par ligne d'activité et par salarié */}
        {/* Référence: Feuille R-L1 du fichier Excel a1RiskoM3-S1M1.xls */}
        {/* ============================================ */}
        {activeSection === 'primes' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/20 dark:to-violet-900/20 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      Répartition des Performances par ligne d'activité et par salarié
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analyse détaillée des performances globales et par indicateur
                    </p>
                  </div>
                </div>
                {/* Bouton fermer */}
                <button
                  onClick={() => handleSectionChange('indicators')}
                  className="p-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors"
                  title="Fermer cette section"
                >
                  <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // ============================================
                // DONNÉES POUR LE TABLEAU RÉPARTITION DES PERFORMANCES
                // ============================================

                // Récupérer les données de prime existantes (même logique)
                const perfIndicateurs = [
                  { key: 'abs', label: 'Absentéisme', shortLabel: 'ABS' },
                  { key: 'qd', label: 'Défauts de qualité', shortLabel: 'QD' },
                  { key: 'oa', label: 'Accidents de travail', shortLabel: 'AT' },
                  { key: 'ddp', label: 'Écart de productivité directe', shortLabel: 'EPD' },
                  { key: 'ekh', label: 'Écart de Know-how', shortLabel: 'EKH' }
                ];

                // Fonction pour obtenir les données d'un salarié pour un indicateur
                const getPerfIndicatorData = (perf: EmployeePerformance, indicatorKey: string) => {
                  switch (indicatorKey) {
                    case 'abs': return perf.abs;
                    case 'qd': return perf.qd;
                    case 'oa': return perf.oa;
                    case 'ddp': return perf.ddp;
                    case 'ekh': return perf.ekh;
                    default: return perf.abs;
                  }
                };

                // Grouper les salariés par ligne d'activité
                const performancesByBLForPerf = new Map<string, EmployeePerformance[]>();
                businessLines.forEach(bl => {
                  performancesByBLForPerf.set(bl.id, []);
                });
                filteredPerformances.forEach(perf => {
                  const blPerfs = performancesByBLForPerf.get(perf.businessLineId);
                  if (blPerfs) {
                    blPerfs.push(perf);
                  }
                });

                // ============================================
                // CALCULS GLOBAUX
                // ============================================

                // Calcul des totaux économies globaux pour le ratio de contribution
                const globalTotalEconomies = perfIndicateurs.reduce((total, ind) => {
                  const indTotals = calculateTotals(ind.key);
                  return total + indTotals.economiesRealiseesTotalCombine;
                }, 0);

                // Répartition: 67% trésorerie, 33% primes
                const globalFluxTresorerie = globalTotalEconomies * 0.67;
                const globalSortiesPrimes = globalTotalEconomies * 0.33;

                // Pré-calcul des données de prime par salarié (réutilisation de la logique existante)
                const employeePerfData = filteredPerformances.map(emp => {
                  // Total économies du salarié (N1 + N2) pour tous indicateurs
                  const empTotalEco = perfIndicateurs.reduce((sum, ind) => {
                    const data = getPerfIndicatorData(emp, ind.key);
                    const ecoN1 = Math.max(0, data.economiesRealisees || 0);
                    const ecoN2 = Math.max(0, data.economiesRealiseesN2 || 0);
                    return sum + ecoN1 + ecoN2;
                  }, 0);

                  // Économies par indicateur
                  const ecoByIndicator = perfIndicateurs.reduce((acc, ind) => {
                    const data = getPerfIndicatorData(emp, ind.key);
                    const ecoN1 = Math.max(0, data.economiesRealisees || 0);
                    const ecoN2 = Math.max(0, data.economiesRealiseesN2 || 0);
                    acc[ind.key] = ecoN1 + ecoN2;
                    return acc;
                  }, {} as Record<string, number>);

                  // Taux économie par indicateur
                  const tauxEcoByIndicator = perfIndicateurs.reduce((acc, ind) => {
                    acc[ind.key] = empTotalEco > 0 ? ecoByIndicator[ind.key] / empTotalEco : 0;
                    return acc;
                  }, {} as Record<string, number>);

                  // Calcul du score pertes en % (pour tranche note)
                  const indicatorTotalsMap = perfIndicateurs.reduce((acc, ind) => {
                    const totals = calculateTotals(ind.key);
                    acc[ind.key] = {
                      totalPertesReference: totals.pertesConstateesTotal + totals.pertesConstateesTotalN2
                    };
                    return acc;
                  }, {} as Record<string, { totalPertesReference: number }>);

                  const scoresPertesEn = perfIndicateurs.reduce((sum, ind) => {
                    const data = getPerfIndicatorData(emp, ind.key);
                    const totalsRef = indicatorTotalsMap[ind.key];
                    const pertesN1Pct = totalsRef.totalPertesReference > 0
                      ? (data.pertesConstatees / totalsRef.totalPertesReference) * 100
                      : 0;
                    const pertesN2Pct = totalsRef.totalPertesReference > 0
                      ? (data.pertesConstateesN2 / totalsRef.totalPertesReference) * 100
                      : 0;
                    return sum + pertesN1Pct + pertesN2Pct;
                  }, 0);

                  // Tranche note
                  let trancheNote: number;
                  if (scoresPertesEn <= 10) trancheNote = 100;
                  else if (scoresPertesEn <= 33) trancheNote = 60;
                  else if (scoresPertesEn <= 54) trancheNote = 30;
                  else if (scoresPertesEn <= 79) trancheNote = 10;
                  else trancheNote = 0;

                  const triN2TrancheNote = emp.employeeName ? trancheNote : 0;

                  return {
                    emp,
                    empTotalEco,
                    ecoByIndicator,
                    tauxEcoByIndicator,
                    triN2TrancheNote
                  };
                });

                // Somme totale des triN2TrancheNote
                const sumTriN2TrancheNote = employeePerfData.reduce((sum, d) => sum + d.triN2TrancheNote, 0);

                // Calcul final des données de performance pour chaque salarié
                const employeePerfScores = employeePerfData.map(data => {
                  const contributionRatio = sumTriN2TrancheNote > 0
                    ? data.triN2TrancheNote / sumTriN2TrancheNote
                    : 0;

                  const partPrime = globalSortiesPrimes * contributionRatio;
                  const partTresorerie = globalFluxTresorerie * contributionRatio;

                  return {
                    ...data,
                    contributionRatio,
                    partPrime,
                    partTresorerie
                  };
                });

                // Map pour accès rapide
                const employeePerfScoresMap = new Map(
                  employeePerfScores.map(s => [s.emp.employeeName, s])
                );

                // Fonction de calcul des données de prime pour un salarié et un indicateur
                const calculatePerfPrimeData = (emp: EmployeePerformance, indicatorKey: string) => {
                  const empScore = employeePerfScoresMap.get(emp.employeeName);
                  const indicatorData = getPerfIndicatorData(emp, indicatorKey);

                  const prevPrime = indicatorData.pprPrevues * 0.33;
                  const prevTreso = indicatorData.pprPrevues * 0.67;

                  if (!empScore) {
                    return { prevPrime, prevTreso, realPrime: 0, realTreso: 0 };
                  }

                  const tauxEco = empScore.tauxEcoByIndicator[indicatorKey] || 0;
                  const realPrime = empScore.partPrime * tauxEco;
                  const realTreso = empScore.partTresorerie * tauxEco;

                  return { prevPrime, prevTreso, realPrime, realTreso };
                };

                // ============================================
                // CALCUL DES TOTAUX PAR INDICATEUR (pour Contribution %)
                // ============================================
                const totalEcoByIndicator = perfIndicateurs.reduce((acc, ind) => {
                  acc[ind.key] = filteredPerformances.reduce((sum, emp) => {
                    // Pour EKH: formule Excel EG146 + ER146 = N1 + N2
                    // economiesRealiseesN1 = scoreFinancierN1 = economiesDDP × coefCompetence
                    // economiesRealiseesN2 = scoreFinancierN2 = economiesDDP × coefCompetence
                    if (ind.key === 'ekh') {
                      const ddpData = getPerfIndicatorData(emp, 'ddp');
                      const coefficientCompetence = emp.coefficientCompetence || 0;
                      const economiesDDP = ddpData.economiesRealisees || 0;
                      const scoreFinancierN1 = economiesDDP * coefficientCompetence;
                      const scoreFinancierN2 = economiesDDP * coefficientCompetence;
                      // Formule Excel: =('L1'!EG146+'L1'!ER146) = N1 + N2
                      return sum + scoreFinancierN1 + scoreFinancierN2;
                    }
                    // Pour les autres indicateurs: formule standard
                    const data = getPerfIndicatorData(emp, ind.key);
                    return sum + (data.economiesRealisees || 0) + (data.economiesRealiseesN2 || 0);
                  }, 0);
                  return acc;
                }, {} as Record<string, number>);

                // ============================================
                // RENDU DES 6 TABLEAUX
                // ============================================
                return (
                  <div className="space-y-8">

                    {/* ============================================ */}
                    {/* SECTION 1: PERFORMANCE GLOBALE DE CHAQUE SALARIÉ */}
                    {/* ============================================ */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg text-white">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-bold text-lg">PERFORMANCE GLOBALE DE CHAQUE SALARIÉ</span>
                      </div>

                      {businessLines.map((businessLine) => {
                        const blEmployees = performancesByBLForPerf.get(businessLine.id) || [];
                        if (blEmployees.length === 0) return null;

                        // Calcul des totaux pour cette ligne d'activité
                        const blTotals = blEmployees.reduce((acc, emp) => {
                          const empScore = employeePerfScoresMap.get(emp.employeeName);

                          // Objectif ligne = somme PPR N1 des 5 indicateurs
                          const objectifLigne = perfIndicateurs.reduce((sum, ind) => {
                            const data = getPerfIndicatorData(emp, ind.key);
                            return sum + (data.pprPrevues || 0);
                          }, 0);

                          // Économies = somme (N1 + N2) des 5 indicateurs
                          const economiesTotal = empScore?.empTotalEco || 0;

                          // Totaux Prime/Trésorerie
                          const primeData = perfIndicateurs.map(ind => calculatePerfPrimeData(emp, ind.key));
                          const totalPrevPrime = primeData.reduce((s, d) => s + d.prevPrime, 0);
                          const totalPrevTreso = primeData.reduce((s, d) => s + d.prevTreso, 0);
                          const totalRealPrime = primeData.reduce((s, d) => s + d.realPrime, 0);
                          const totalRealTreso = primeData.reduce((s, d) => s + d.realTreso, 0);

                          return {
                            objectifLigne: acc.objectifLigne + objectifLigne,
                            economiesTotal: acc.economiesTotal + economiesTotal,
                            totalPrevPrime: acc.totalPrevPrime + totalPrevPrime,
                            totalPrevTreso: acc.totalPrevTreso + totalPrevTreso,
                            totalRealPrime: acc.totalRealPrime + totalRealPrime,
                            totalRealTreso: acc.totalRealTreso + totalRealTreso
                          };
                        }, { objectifLigne: 0, economiesTotal: 0, totalPrevPrime: 0, totalPrevTreso: 0, totalRealPrime: 0, totalRealTreso: 0 });

                        return (
                          <div key={businessLine.id} className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg text-white">
                              <Building2 className="w-5 h-5" />
                              <span className="font-bold">{businessLine.activity_name}</span>
                              <Badge className="bg-white/20 text-white ml-2">
                                {blEmployees.length} salariés
                              </Badge>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-indigo-200 dark:border-indigo-800">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50">
                                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Nom du salarié</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Objectif de la ligne (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ECONOMIES REALISEES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel Prime</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel trésorerie</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie</th>
                                    <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blEmployees.map((emp, empIndex) => {
                                    const empScore = employeePerfScoresMap.get(emp.employeeName);

                                    // Objectif ligne = somme PPR N1 des 5 indicateurs
                                    const objectifLigne = perfIndicateurs.reduce((sum, ind) => {
                                      const data = getPerfIndicatorData(emp, ind.key);
                                      return sum + (data.pprPrevues || 0);
                                    }, 0);

                                    // Économies = somme (N1 + N2) des 5 indicateurs
                                    const economiesTotal = empScore?.empTotalEco || 0;

                                    // Totaux Prime/Trésorerie
                                    const primeData = perfIndicateurs.map(ind => calculatePerfPrimeData(emp, ind.key));
                                    const totalPrevPrime = primeData.reduce((s, d) => s + d.prevPrime, 0);
                                    const totalPrevTreso = primeData.reduce((s, d) => s + d.prevTreso, 0);
                                    const totalRealPrime = primeData.reduce((s, d) => s + d.realPrime, 0);
                                    const totalRealTreso = primeData.reduce((s, d) => s + d.realTreso, 0);

                                    // Contribution % = Économies salarié / Total Économies
                                    const contributionPct = globalTotalEconomies > 0
                                      ? (economiesTotal / globalTotalEconomies) * 100
                                      : 0;

                                    return (
                                      <tr
                                        key={emp.employeeId}
                                        className={`${empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-indigo-50/30 dark:bg-indigo-900/10'} hover:bg-indigo-100/50 dark:hover:bg-indigo-800/20 transition-colors`}
                                      >
                                        <td className="py-2 px-3 font-medium">{emp.employeeName || '-'}</td>
                                        <td className="py-2 px-3 text-right">{objectifLigne.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-600 dark:text-green-400">{economiesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">{totalPrevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">{totalPrevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">{totalRealPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">{totalRealTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center">
                                          <Badge className={cn(
                                            contributionPct > 10 ? "bg-green-500" :
                                            contributionPct > 5 ? "bg-blue-500" :
                                            contributionPct > 0 ? "bg-amber-500" : "bg-gray-400",
                                            "text-white"
                                          )}>
                                            {contributionPct.toFixed(2)}%
                                          </Badge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {/* TOTAL LIGNE D'ACTIVITÉ */}
                                  <tr className="bg-gradient-to-r from-indigo-200 to-violet-200 dark:from-indigo-800/50 dark:to-violet-800/50 font-bold border-t-2 border-indigo-400">
                                    <td className="py-2 px-3 font-bold text-indigo-900 dark:text-indigo-100">TOTAL LIGNE D'ACTIVITÉ</td>
                                    <td className="py-2 px-3 text-right font-bold">{blTotals.objectifLigne.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.economiesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotals.totalPrevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotals.totalPrevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.totalRealPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.totalRealTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-2 px-3 text-center">
                                      <Badge className="bg-indigo-600 text-white">
                                        {globalTotalEconomies > 0 ? ((blTotals.economiesTotal / globalTotalEconomies) * 100).toFixed(2) : '0.00'}%
                                      </Badge>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ============================================ */}
                    {/* SECTION 2: PERFORMANCE INDICATEUR ABSENTÉISME */}
                    {/* ============================================ */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white">
                        <UserCircle className="w-5 h-5" />
                        <span className="font-bold text-lg">PERFORMANCE INDICATEUR ABSENTÉISME DE CHAQUE SALARIÉ</span>
                      </div>

                      {businessLines.map((businessLine) => {
                        const blEmployees = performancesByBLForPerf.get(businessLine.id) || [];
                        if (blEmployees.length === 0) return null;

                        const totalEcoABS = totalEcoByIndicator['abs'] || 1;

                        return (
                          <div key={`abs-${businessLine.id}`} className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-lg text-white">
                              <Building2 className="w-5 h-5" />
                              <span className="font-bold">{businessLine.activity_name}</span>
                              <Badge className="bg-white/20 text-white ml-2">{blEmployees.length} salariés</Badge>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-orange-200 dark:border-orange-800">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 text-orange-900 dark:text-orange-100">
                                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Indicateur Absentéisme</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total temps</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total frais</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">PPR PREVUES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ECONOMIES REALISEES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel Prime - Absentéisme</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel trésorerie - Absentéisme</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime - Absentéisme</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie - Absentéisme</th>
                                    <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blEmployees.map((emp, empIndex) => {
                                    const absData = getPerfIndicatorData(emp, 'abs');
                                    const primeData = calculatePerfPrimeData(emp, 'abs');
                                    const totalTemps = (absData.tempsCalcul || 0) + (absData.tempsPrisEnCompte || 0);
                                    const totalFrais = (absData.fraisCollectes || 0) + (absData.fraisPrisEnCompte || 0);
                                    const pprPrevues = absData.pprPrevues || 0;
                                    const economiesABS = (absData.economiesRealisees || 0) + (absData.economiesRealiseesN2 || 0);
                                    const contributionPct = totalEcoABS > 0 ? (economiesABS / totalEcoABS) * 100 : 0;

                                    return (
                                      <tr key={emp.employeeId} className={`${empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-orange-50/30 dark:bg-orange-900/10'} hover:bg-orange-100/50 dark:hover:bg-orange-800/20`}>
                                        <td className="py-2 px-3 font-medium">{emp.employeeName || '-'}</td>
                                        <td className="py-2 px-3 text-right">{totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right">{totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right">{pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-600">{economiesABS.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className={cn(contributionPct > 5 ? "bg-green-500" : contributionPct > 0 ? "bg-amber-500" : "bg-gray-400", "text-white")}>{contributionPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })}
                                  {/* TOTAL LIGNE D'ACTIVITÉ - ABSENTÉISME */}
                                  {(() => {
                                    const blTotalsABS = blEmployees.reduce((acc, emp) => {
                                      const absData = getPerfIndicatorData(emp, 'abs');
                                      const primeData = calculatePerfPrimeData(emp, 'abs');
                                      return {
                                        totalTemps: acc.totalTemps + (absData.tempsCalcul || 0) + (absData.tempsPrisEnCompte || 0),
                                        totalFrais: acc.totalFrais + (absData.fraisCollectes || 0) + (absData.fraisPrisEnCompte || 0),
                                        pprPrevues: acc.pprPrevues + (absData.pprPrevues || 0),
                                        economies: acc.economies + (absData.economiesRealisees || 0) + (absData.economiesRealiseesN2 || 0),
                                        prevPrime: acc.prevPrime + primeData.prevPrime,
                                        prevTreso: acc.prevTreso + primeData.prevTreso,
                                        realPrime: acc.realPrime + primeData.realPrime,
                                        realTreso: acc.realTreso + primeData.realTreso
                                      };
                                    }, { totalTemps: 0, totalFrais: 0, pprPrevues: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });
                                    const blContribPct = totalEcoABS > 0 ? (blTotalsABS.economies / totalEcoABS) * 100 : 0;
                                    return (
                                      <tr className="bg-gradient-to-r from-orange-200 to-amber-200 dark:from-orange-800/50 dark:to-amber-800/50 font-bold border-t-2 border-orange-400">
                                        <td className="py-2 px-3 font-bold text-orange-900 dark:text-orange-100">TOTAL LIGNE D'ACTIVITÉ</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsABS.totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsABS.totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsABS.pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsABS.economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsABS.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsABS.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsABS.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsABS.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className="bg-orange-600 text-white">{blContribPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ============================================ */}
                    {/* SECTION 3: PERFORMANCE INDICATEUR DÉFAUTS DE QUALITÉ */}
                    {/* ============================================ */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg text-white">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold text-lg">PERFORMANCE INDICATEUR DÉFAUTS DE QUALITÉ DE CHAQUE SALARIÉ</span>
                      </div>

                      {businessLines.map((businessLine) => {
                        const blEmployees = performancesByBLForPerf.get(businessLine.id) || [];
                        if (blEmployees.length === 0) return null;

                        const totalEcoQD = totalEcoByIndicator['qd'] || 1;

                        return (
                          <div key={`qd-${businessLine.id}`} className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-lg text-white">
                              <Building2 className="w-5 h-5" />
                              <span className="font-bold">{businessLine.activity_name}</span>
                              <Badge className="bg-white/20 text-white ml-2">{blEmployees.length} salariés</Badge>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-rose-200 dark:border-rose-800">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 text-rose-900 dark:text-rose-100">
                                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Indicateur Défauts de qualité</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total temps</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total frais</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">PPR PREVUES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ECONOMIES REALISEES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel Prime - Défauts de qualité</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel trésorerie - Défauts de qualité</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime - Défauts de qualité</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie - Défauts de qualité</th>
                                    <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blEmployees.map((emp, empIndex) => {
                                    const qdData = getPerfIndicatorData(emp, 'qd');
                                    const primeData = calculatePerfPrimeData(emp, 'qd');
                                    const totalTemps = (qdData.tempsCalcul || 0) + (qdData.tempsPrisEnCompte || 0);
                                    const totalFrais = (qdData.fraisCollectes || 0) + (qdData.fraisPrisEnCompte || 0);
                                    const pprPrevues = qdData.pprPrevues || 0;
                                    const economiesQD = (qdData.economiesRealisees || 0) + (qdData.economiesRealiseesN2 || 0);
                                    const contributionPct = totalEcoQD > 0 ? (economiesQD / totalEcoQD) * 100 : 0;

                                    return (
                                      <tr key={emp.employeeId} className={`${empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-rose-50/30 dark:bg-rose-900/10'} hover:bg-rose-100/50 dark:hover:bg-rose-800/20`}>
                                        <td className="py-2 px-3 font-medium">{emp.employeeName || '-'}</td>
                                        <td className="py-2 px-3 text-right">{totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right">{totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right">{pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-600">{economiesQD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className={cn(contributionPct > 5 ? "bg-green-500" : contributionPct > 0 ? "bg-amber-500" : "bg-gray-400", "text-white")}>{contributionPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })}
                                  {/* TOTAL LIGNE D'ACTIVITÉ - DÉFAUTS DE QUALITÉ */}
                                  {(() => {
                                    const blTotalsQD = blEmployees.reduce((acc, emp) => {
                                      const qdData = getPerfIndicatorData(emp, 'qd');
                                      const primeData = calculatePerfPrimeData(emp, 'qd');
                                      return {
                                        totalTemps: acc.totalTemps + (qdData.tempsCalcul || 0) + (qdData.tempsPrisEnCompte || 0),
                                        totalFrais: acc.totalFrais + (qdData.fraisCollectes || 0) + (qdData.fraisPrisEnCompte || 0),
                                        pprPrevues: acc.pprPrevues + (qdData.pprPrevues || 0),
                                        economies: acc.economies + (qdData.economiesRealisees || 0) + (qdData.economiesRealiseesN2 || 0),
                                        prevPrime: acc.prevPrime + primeData.prevPrime,
                                        prevTreso: acc.prevTreso + primeData.prevTreso,
                                        realPrime: acc.realPrime + primeData.realPrime,
                                        realTreso: acc.realTreso + primeData.realTreso
                                      };
                                    }, { totalTemps: 0, totalFrais: 0, pprPrevues: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });
                                    const blContribPct = totalEcoQD > 0 ? (blTotalsQD.economies / totalEcoQD) * 100 : 0;
                                    return (
                                      <tr className="bg-gradient-to-r from-rose-200 to-pink-200 dark:from-rose-800/50 dark:to-pink-800/50 font-bold border-t-2 border-rose-400">
                                        <td className="py-2 px-3 font-bold text-rose-900 dark:text-rose-100">TOTAL LIGNE D'ACTIVITÉ</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsQD.totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsQD.totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsQD.pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsQD.economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsQD.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsQD.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsQD.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsQD.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className="bg-rose-600 text-white">{blContribPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ============================================ */}
                    {/* SECTION 4: PERFORMANCE INDICATEUR ACCIDENTS DE TRAVAIL */}
                    {/* ============================================ */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg text-white">
                        <Zap className="w-5 h-5" />
                        <span className="font-bold text-lg">PERFORMANCE INDICATEUR ACCIDENTS DE TRAVAIL DE CHAQUE SALARIÉ</span>
                      </div>

                      {businessLines.map((businessLine) => {
                        const blEmployees = performancesByBLForPerf.get(businessLine.id) || [];
                        if (blEmployees.length === 0) return null;

                        const totalEcoOA = totalEcoByIndicator['oa'] || 1;

                        return (
                          <div key={`oa-${businessLine.id}`} className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-400 to-rose-400 rounded-lg text-white">
                              <Building2 className="w-5 h-5" />
                              <span className="font-bold">{businessLine.activity_name}</span>
                              <Badge className="bg-white/20 text-white ml-2">{blEmployees.length} salariés</Badge>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-red-200 dark:border-red-800">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 text-red-900 dark:text-red-100">
                                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Indicateur Accidents de travail</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total temps</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total frais</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">PPR PREVUES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ECONOMIES REALISEES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel Prime - Accidents de travail</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel trésorerie - Accidents de travail</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime - Accidents de travail</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie - Accidents de travail</th>
                                    <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blEmployees.map((emp, empIndex) => {
                                    const oaData = getPerfIndicatorData(emp, 'oa');
                                    const primeData = calculatePerfPrimeData(emp, 'oa');
                                    const totalTemps = (oaData.tempsCalcul || 0) + (oaData.tempsPrisEnCompte || 0);
                                    const totalFrais = (oaData.fraisCollectes || 0) + (oaData.fraisPrisEnCompte || 0);
                                    const pprPrevues = oaData.pprPrevues || 0;
                                    const economiesOA = (oaData.economiesRealisees || 0) + (oaData.economiesRealiseesN2 || 0);
                                    const contributionPct = totalEcoOA > 0 ? (economiesOA / totalEcoOA) * 100 : 0;

                                    return (
                                      <tr key={emp.employeeId} className={`${empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-red-50/30 dark:bg-red-900/10'} hover:bg-red-100/50 dark:hover:bg-red-800/20`}>
                                        <td className="py-2 px-3 font-medium">{emp.employeeName || '-'}</td>
                                        <td className="py-2 px-3 text-right">{totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right">{totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right">{pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-600">{economiesOA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className={cn(contributionPct > 5 ? "bg-green-500" : contributionPct > 0 ? "bg-amber-500" : "bg-gray-400", "text-white")}>{contributionPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })}
                                  {/* TOTAL LIGNE D'ACTIVITÉ - ACCIDENTS DE TRAVAIL */}
                                  {(() => {
                                    const blTotalsOA = blEmployees.reduce((acc, emp) => {
                                      const oaData = getPerfIndicatorData(emp, 'oa');
                                      const primeData = calculatePerfPrimeData(emp, 'oa');
                                      return {
                                        totalTemps: acc.totalTemps + (oaData.tempsCalcul || 0) + (oaData.tempsPrisEnCompte || 0),
                                        totalFrais: acc.totalFrais + (oaData.fraisCollectes || 0) + (oaData.fraisPrisEnCompte || 0),
                                        pprPrevues: acc.pprPrevues + (oaData.pprPrevues || 0),
                                        economies: acc.economies + (oaData.economiesRealisees || 0) + (oaData.economiesRealiseesN2 || 0),
                                        prevPrime: acc.prevPrime + primeData.prevPrime,
                                        prevTreso: acc.prevTreso + primeData.prevTreso,
                                        realPrime: acc.realPrime + primeData.realPrime,
                                        realTreso: acc.realTreso + primeData.realTreso
                                      };
                                    }, { totalTemps: 0, totalFrais: 0, pprPrevues: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });
                                    const blContribPct = totalEcoOA > 0 ? (blTotalsOA.economies / totalEcoOA) * 100 : 0;
                                    return (
                                      <tr className="bg-gradient-to-r from-red-200 to-rose-200 dark:from-red-800/50 dark:to-rose-800/50 font-bold border-t-2 border-red-400">
                                        <td className="py-2 px-3 font-bold text-red-900 dark:text-red-100">TOTAL LIGNE D'ACTIVITÉ</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsOA.totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsOA.totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsOA.pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsOA.economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsOA.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsOA.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsOA.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsOA.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className="bg-red-600 text-white">{blContribPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ============================================ */}
                    {/* SECTION 5: PERFORMANCE INDICATEUR ÉCART DE PRODUCTIVITÉ DIRECTE */}
                    {/* ============================================ */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg text-white">
                        <Target className="w-5 h-5" />
                        <span className="font-bold text-lg">PERFORMANCE INDICATEUR ÉCART DE PRODUCTIVITÉ DIRECTE DE CHAQUE SALARIÉ</span>
                      </div>

                      {businessLines.map((businessLine) => {
                        const blEmployees = performancesByBLForPerf.get(businessLine.id) || [];
                        if (blEmployees.length === 0) return null;

                        const totalEcoDDP = totalEcoByIndicator['ddp'] || 1;

                        return (
                          <div key={`ddp-${businessLine.id}`} className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-400 to-purple-400 rounded-lg text-white">
                              <Building2 className="w-5 h-5" />
                              <span className="font-bold">{businessLine.activity_name}</span>
                              <Badge className="bg-white/20 text-white ml-2">{blEmployees.length} salariés</Badge>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-violet-200 dark:border-violet-800">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 text-violet-900 dark:text-violet-100">
                                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Indicateur Ecart de productivité directe</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total temps</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total frais</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">PPR PREVUES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ECONOMIES REALISEES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel Prime - Ecart de productivité directe</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel trésorerie - Ecart de productivité directe</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime - Ecart de productivité directe</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie - Ecart de productivité directe</th>
                                    <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blEmployees.map((emp, empIndex) => {
                                    const ddpData = getPerfIndicatorData(emp, 'ddp');
                                    const primeData = calculatePerfPrimeData(emp, 'ddp');
                                    const totalTemps = (ddpData.tempsCalcul || 0) + (ddpData.tempsPrisEnCompte || 0);
                                    const totalFrais = (ddpData.fraisCollectes || 0) + (ddpData.fraisPrisEnCompte || 0);
                                    const pprPrevues = ddpData.pprPrevues || 0;
                                    const economiesDDP = (ddpData.economiesRealisees || 0) + (ddpData.economiesRealiseesN2 || 0);
                                    const contributionPct = totalEcoDDP > 0 ? (economiesDDP / totalEcoDDP) * 100 : 0;

                                    return (
                                      <tr key={emp.employeeId} className={`${empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-violet-50/30 dark:bg-violet-900/10'} hover:bg-violet-100/50 dark:hover:bg-violet-800/20`}>
                                        <td className="py-2 px-3 font-medium">{emp.employeeName || '-'}</td>
                                        <td className="py-2 px-3 text-right">{totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right">{totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right">{pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-600">{economiesDDP.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className={cn(contributionPct > 5 ? "bg-green-500" : contributionPct > 0 ? "bg-amber-500" : "bg-gray-400", "text-white")}>{contributionPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })}
                                  {/* TOTAL LIGNE D'ACTIVITÉ - ÉCART DE PRODUCTIVITÉ DIRECTE */}
                                  {(() => {
                                    const blTotalsDDP = blEmployees.reduce((acc, emp) => {
                                      const ddpData = getPerfIndicatorData(emp, 'ddp');
                                      const primeData = calculatePerfPrimeData(emp, 'ddp');
                                      return {
                                        totalTemps: acc.totalTemps + (ddpData.tempsCalcul || 0) + (ddpData.tempsPrisEnCompte || 0),
                                        totalFrais: acc.totalFrais + (ddpData.fraisCollectes || 0) + (ddpData.fraisPrisEnCompte || 0),
                                        pprPrevues: acc.pprPrevues + (ddpData.pprPrevues || 0),
                                        economies: acc.economies + (ddpData.economiesRealisees || 0) + (ddpData.economiesRealiseesN2 || 0),
                                        prevPrime: acc.prevPrime + primeData.prevPrime,
                                        prevTreso: acc.prevTreso + primeData.prevTreso,
                                        realPrime: acc.realPrime + primeData.realPrime,
                                        realTreso: acc.realTreso + primeData.realTreso
                                      };
                                    }, { totalTemps: 0, totalFrais: 0, pprPrevues: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });
                                    const blContribPct = totalEcoDDP > 0 ? (blTotalsDDP.economies / totalEcoDDP) * 100 : 0;
                                    return (
                                      <tr className="bg-gradient-to-r from-violet-200 to-purple-200 dark:from-violet-800/50 dark:to-purple-800/50 font-bold border-t-2 border-violet-400">
                                        <td className="py-2 px-3 font-bold text-violet-900 dark:text-violet-100">TOTAL LIGNE D'ACTIVITÉ</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsDDP.totalTemps.toFixed(2)}h</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsDDP.totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsDDP.pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsDDP.economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsDDP.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsDDP.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsDDP.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsDDP.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className="bg-violet-600 text-white">{blContribPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ============================================ */}
                    {/* SECTION 6: PERFORMANCE INDICATEUR ÉCART DE KNOW-HOW (sans temps/frais) */}
                    {/* ============================================ */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white">
                        <Activity className="w-5 h-5" />
                        <span className="font-bold text-lg">PERFORMANCE INDICATEUR ÉCART DE KNOW-HOW DE CHAQUE SALARIÉ</span>
                      </div>

                      {businessLines.map((businessLine) => {
                        const blEmployees = performancesByBLForPerf.get(businessLine.id) || [];
                        if (blEmployees.length === 0) return null;

                        // Calculer le total EKH avec formule Excel: =('L1'!EG146+'L1'!ER146) = N1 + N2
                        // EG146 = ECONOMIES REALISEES NIVEAU 1 EKH = scoreFinancierN1 = economiesDDP × coefCompetence
                        // ER146 = ECONOMIES REALISEES NIVEAU 2 EKH = scoreFinancierN2 = economiesDDP × coefCompetence
                        const totalEcoEKH = filteredPerformances.reduce((sum, emp) => {
                          const ddpData = getPerfIndicatorData(emp, 'ddp');
                          const coefficientCompetence = emp.coefficientCompetence || 0;
                          const economiesDDP = ddpData.economiesRealisees || 0;
                          const scoreFinancierN1 = economiesDDP * coefficientCompetence;
                          const scoreFinancierN2 = economiesDDP * coefficientCompetence;
                          // Formule Excel exacte: EG146 + ER146 = N1 + N2
                          return sum + scoreFinancierN1 + scoreFinancierN2;
                        }, 0) || 1;

                        return (
                          <div key={`ekh-${businessLine.id}`} className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-lg text-white">
                              <Building2 className="w-5 h-5" />
                              <span className="font-bold">{businessLine.activity_name}</span>
                              <Badge className="bg-white/20 text-white ml-2">{blEmployees.length} salariés</Badge>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-cyan-200 dark:border-cyan-800">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 text-cyan-900 dark:text-cyan-100">
                                    <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Indicateur Ecart de Know-how</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">PPR PREVUES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ECONOMIES REALISEES (semaine)</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel Prime - Ecart de Know-how</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prévisionnel trésorerie - Ecart de Know-how</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime - Ecart de Know-how</th>
                                    <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie - Ecart de Know-how</th>
                                    <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {blEmployees.map((emp, empIndex) => {
                                    // Calculer les valeurs EKH avec formule Excel
                                    const ekhData = getPerfIndicatorData(emp, 'ekh');
                                    const ddpData = getPerfIndicatorData(emp, 'ddp');
                                    const primeData = calculatePerfPrimeData(emp, 'ekh');
                                    const coefficientCompetence = emp.coefficientCompetence || 0;
                                    const economiesDDP = ddpData.economiesRealisees || 0;

                                    // COLONNE 1: PPR PREVUES = EF146
                                    const pprPrevues = ekhData.pprPrevues || 0;

                                    // COLONNE 2: ECONOMIES REALISEES = EG146 + ER146 (formule Excel exacte)
                                    // EG146 = economiesRealiseesN1 = scoreFinancierN1 = economiesDDP × coefCompetence
                                    // ER146 = economiesRealiseesN2 = scoreFinancierN2 = economiesDDP × coefCompetence
                                    const scoreFinancierN1 = economiesDDP * coefficientCompetence;
                                    const scoreFinancierN2 = economiesDDP * coefficientCompetence;
                                    const economiesEKH = scoreFinancierN1 + scoreFinancierN2;
                                    const contributionPct = totalEcoEKH > 0 ? (economiesEKH / totalEcoEKH) * 100 : 0;

                                    return (
                                      <tr key={emp.employeeId} className={`${empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-cyan-50/30 dark:bg-cyan-900/10'} hover:bg-cyan-100/50 dark:hover:bg-cyan-800/20`}>
                                        <td className="py-2 px-3 font-medium">{emp.employeeName || '-'}</td>
                                        <td className="py-2 px-3 text-right">{pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-600">{economiesEKH.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-amber-600">{primeData.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right text-green-600">{primeData.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className={cn(contributionPct > 5 ? "bg-green-500" : contributionPct > 0 ? "bg-amber-500" : "bg-gray-400", "text-white")}>{contributionPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })}
                                  {/* TOTAL LIGNE D'ACTIVITÉ - ÉCART DE KNOW-HOW (sans temps/frais) */}
                                  {(() => {
                                    const blTotalsEKH = blEmployees.reduce((acc, emp) => {
                                      // Calculer les valeurs EKH avec formule Excel
                                      const ekhData = getPerfIndicatorData(emp, 'ekh');
                                      const ddpData = getPerfIndicatorData(emp, 'ddp');
                                      const primeData = calculatePerfPrimeData(emp, 'ekh');
                                      const coefficientCompetence = emp.coefficientCompetence || 0;
                                      const economiesDDP = ddpData.economiesRealisees || 0;

                                      // COLONNE 2: ECONOMIES REALISEES = EG146 + ER146 (formule Excel exacte)
                                      const scoreFinancierN1 = economiesDDP * coefficientCompetence;
                                      const scoreFinancierN2 = economiesDDP * coefficientCompetence;
                                      const economiesEKH = scoreFinancierN1 + scoreFinancierN2;

                                      return {
                                        pprPrevues: acc.pprPrevues + (ekhData.pprPrevues || 0),
                                        economies: acc.economies + economiesEKH,
                                        prevPrime: acc.prevPrime + primeData.prevPrime,
                                        prevTreso: acc.prevTreso + primeData.prevTreso,
                                        realPrime: acc.realPrime + primeData.realPrime,
                                        realTreso: acc.realTreso + primeData.realTreso
                                      };
                                    }, { pprPrevues: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });
                                    const blContribPct = totalEcoEKH > 0 ? (blTotalsEKH.economies / totalEcoEKH) * 100 : 0;
                                    return (
                                      <tr className="bg-gradient-to-r from-cyan-200 to-blue-200 dark:from-cyan-800/50 dark:to-blue-800/50 font-bold border-t-2 border-cyan-400">
                                        <td className="py-2 px-3 font-bold text-cyan-900 dark:text-cyan-100">TOTAL LIGNE D'ACTIVITÉ</td>
                                        <td className="py-2 px-3 text-right font-bold">{blTotalsEKH.pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsEKH.economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsEKH.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotalsEKH.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsEKH.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotalsEKH.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                        <td className="py-2 px-3 text-center"><Badge className="bg-cyan-600 text-white">{blContribPct.toFixed(2)}%</Badge></td>
                                      </tr>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ============================================ */}
                    {/* TOTAL GÉNÉRAL */}
                    {/* ============================================ */}
                    {(() => {
                      // Clear previous debug data
                      debugLogger.clear();

                      // Pré-calculer tous les totaux par indicateur pour le GRAND TOTAL
                      // IMPORTANT: Utiliser EXACTEMENT les mêmes calculs que les tableaux par ligne d'activité
                      // Source: blTotalsABS, blTotalsQD, blTotalsOA, blTotalsDDP, blTotalsEKH
                      const totalGeneralData = perfIndicateurs.map(ind => {
                        const totalEco = totalEcoByIndicator[ind.key] || 0;

                        // Calculer les totaux en sommant les TOTAL LIGNE D'ACTIVITÉ de chaque BL
                        let totalPPRPrevues = 0;
                        let totalPrevPrime = 0;
                        let totalPrevTreso = 0;
                        let totalRealPrime = 0;
                        let totalRealTreso = 0;

                        // Collecter les données pour le debug logger
                        const employeeValues: { label: string; value: number }[] = [];

                        // Parcourir les lignes d'activité et calculer comme les tableaux par indicateur
                        businessLines.forEach(bl => {
                          const blEmployees = performancesByBLForPerf.get(bl.id) || [];
                          blEmployees.forEach(emp => {
                            const indicatorData = getPerfIndicatorData(emp, ind.key);
                            const primeData = calculatePerfPrimeData(emp, ind.key);

                            // Collecter pour debug
                            employeeValues.push({
                              label: `[${bl.activity_name}] ${emp.employeeName}`,
                              value: primeData.prevTreso
                            });

                            // PPR PREVUES = somme des pprPrevues de chaque salarié
                            totalPPRPrevues += indicatorData.pprPrevues || 0;
                            // Prévisionnel Prime et Trésorerie
                            totalPrevPrime += primeData.prevPrime;
                            totalPrevTreso += primeData.prevTreso;
                            // Réalisé Prime et Trésorerie
                            totalRealPrime += primeData.realPrime;
                            totalRealTreso += primeData.realTreso;
                          });
                        });

                        // Log les données pour chaque indicateur
                        debugLogger.logArray(`TOTAL_GENERAL_${ind.key.toUpperCase()}`, 'prevTreso_par_salarie', employeeValues);
                        debugLogger.log(`TOTAL_GENERAL_${ind.key.toUpperCase()}`, 'totaux', {
                          pprPrevues: totalPPRPrevues,
                          totalEco,
                          totalPrevPrime,
                          totalPrevTreso,
                          totalRealPrime,
                          totalRealTreso
                        });

                        const partPct = globalTotalEconomies > 0 ? (totalEco / globalTotalEconomies) * 100 : 0;

                        return {
                          key: ind.key,
                          label: ind.label,
                          pprPrevuesTotal: totalPPRPrevues,
                          totalEco,
                          totalPrevPrime,
                          totalPrevTreso,
                          totalRealPrime,
                          totalRealTreso,
                          partPct
                        };
                      });

                      // Calculer les GRAND TOTAUX
                      const grandTotalPPR = totalGeneralData.reduce((sum, d) => sum + d.pprPrevuesTotal, 0);
                      const grandTotalEco = totalGeneralData.reduce((sum, d) => sum + d.totalEco, 0);
                      const grandTotalPrevPrime = totalGeneralData.reduce((sum, d) => sum + d.totalPrevPrime, 0);
                      const grandTotalPrevTreso = totalGeneralData.reduce((sum, d) => sum + d.totalPrevTreso, 0);
                      const grandTotalRealPrime = totalGeneralData.reduce((sum, d) => sum + d.totalRealPrime, 0);
                      const grandTotalRealTreso = totalGeneralData.reduce((sum, d) => sum + d.totalRealTreso, 0);

                      // Log les GRAND TOTAUX
                      debugLogger.log('GRAND_TOTAUX', 'resume', {
                        grandTotalPPR,
                        grandTotalEco,
                        grandTotalPrevPrime,
                        grandTotalPrevTreso,
                        grandTotalRealPrime,
                        grandTotalRealTreso,
                        parIndicateur: totalGeneralData.map(d => ({
                          indicateur: d.label,
                          key: d.key,
                          pprPrevues: d.pprPrevuesTotal,
                          totalEco: d.totalEco,
                          totalPrevPrime: d.totalPrevPrime,
                          totalPrevTreso: d.totalPrevTreso,
                          totalRealPrime: d.totalRealPrime,
                          totalRealTreso: d.totalRealTreso,
                          partPct: d.partPct
                        }))
                      });

                      // Sauvegarder dans localStorage pour que Claude puisse lire
                      debugLogger.saveToLocalStorage();
                      console.log('📊 Debug data saved! Run: copy(localStorage.getItem("debug_logger_report")) to get data for Claude');

                      // ============================================
                      // ENVOYER LES DONNÉES AU CONTEXTE PARTAGÉ
                      // Pour alimenter le bloc Reporting
                      // ============================================
                      const performanceIndicators = totalGeneralData.map(d => ({
                        key: d.key,
                        label: d.label,
                        pprPrevues: d.pprPrevuesTotal,
                        totalEconomies: d.totalEco,
                        totalPrevPrime: d.totalPrevPrime,
                        totalPrevTreso: d.totalPrevTreso,
                        totalRealPrime: d.totalRealPrime,
                        totalRealTreso: d.totalRealTreso,
                        partPct: d.partPct
                      }));

                      const performanceTotals = {
                        grandTotalPPR,
                        grandTotalEco,
                        grandTotalPrevPrime,
                        grandTotalPrevTreso,
                        grandTotalRealPrime,
                        grandTotalRealTreso
                      };

                      // ============================================
                      // BLOC 2 & BLOC 4: Calculer les totaux par LIGNE D'ACTIVITÉ
                      // Pour alimenter le Bloc 2 (Objectif/Economies) et Bloc 4 (Prime/Trésorerie) du Reporting
                      // IMPORTANT: Utilise la MÊME logique que le tableau "PERFORMANCE GLOBALE DE CHAQUE SALARIÉ"
                      // ============================================
                      const businessLinePerformancesData = businessLines.map(bl => {
                        const blEmployees = performancesByBLForPerf.get(bl.id) || [];

                        // Calcul identique au tableau PERFORMANCE GLOBALE (lignes 4776-4803)
                        const blTotalsForContext = blEmployees.reduce((acc, emp) => {
                          const empScore = employeePerfScoresMap.get(emp.employeeName);

                          // Objectif ligne = somme PPR N1 des 5 indicateurs (même calcul que ligne 4780-4783)
                          const objectifLigne = perfIndicateurs.reduce((sum, ind) => {
                            const data = getPerfIndicatorData(emp, ind.key);
                            return sum + (data.pprPrevues || 0);
                          }, 0);

                          // Économies = empTotalEco depuis employeePerfScoresMap (même calcul que ligne 4786)
                          const economiesTotal = empScore?.empTotalEco || 0;

                          // BLOC 4: Totaux Prime/Trésorerie (même calcul que lignes 4789-4793)
                          const primeData = perfIndicateurs.map(ind => calculatePerfPrimeData(emp, ind.key));
                          const totalPrevPrime = primeData.reduce((s, d) => s + d.prevPrime, 0);
                          const totalPrevTreso = primeData.reduce((s, d) => s + d.prevTreso, 0);
                          const totalRealPrime = primeData.reduce((s, d) => s + d.realPrime, 0);
                          const totalRealTreso = primeData.reduce((s, d) => s + d.realTreso, 0);

                          return {
                            objectifLigne: acc.objectifLigne + objectifLigne,
                            economiesTotal: acc.economiesTotal + economiesTotal,
                            totalPrevPrime: acc.totalPrevPrime + totalPrevPrime,
                            totalPrevTreso: acc.totalPrevTreso + totalPrevTreso,
                            totalRealPrime: acc.totalRealPrime + totalRealPrime,
                            totalRealTreso: acc.totalRealTreso + totalRealTreso
                          };
                        }, { objectifLigne: 0, economiesTotal: 0, totalPrevPrime: 0, totalPrevTreso: 0, totalRealPrime: 0, totalRealTreso: 0 });

                        return {
                          businessLineId: bl.id,
                          businessLineName: bl.activity_name,
                          objectif: blTotalsForContext.objectifLigne,
                          economiesRealisees: blTotalsForContext.economiesTotal,
                          employeeCount: blEmployees.length,
                          // BLOC 4: Primes et Trésorerie par ligne d'activité
                          prevPrime: blTotalsForContext.totalPrevPrime,
                          prevTreso: blTotalsForContext.totalPrevTreso,
                          realPrime: blTotalsForContext.totalRealPrime,
                          realTreso: blTotalsForContext.totalRealTreso
                        };
                      }).filter(bl => bl.employeeCount > 0); // Ne garder que les lignes avec des employés

                      // Envoyer au contexte (sera disponible pour CostSavingsReportingPage)
                      setPerformanceData(performanceIndicators, performanceTotals, businessLinePerformancesData);

                      return (
                        <div className="mt-8">
                          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg text-white">
                            <PiggyBank className="w-6 h-6" />
                            <span className="font-bold text-xl">TOTAL GÉNÉRAL - Répartition des Performances</span>
                          </div>

                          <div className="mt-4 overflow-x-auto rounded-lg border-2 border-emerald-300 dark:border-emerald-700">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50">
                                  <th className="text-left py-3 px-4 font-bold">Indicateur</th>
                                  <th className="text-right py-3 px-4 font-bold text-indigo-700 dark:text-indigo-300">PPR PREVUES (semaine)</th>
                                  <th className="text-right py-3 px-4 font-bold">Total Économies</th>
                                  <th className="text-right py-3 px-4 font-bold">Total Prév. Prime</th>
                                  <th className="text-right py-3 px-4 font-bold">Total Prév. Trésorerie</th>
                                  <th className="text-right py-3 px-4 font-bold">Total Réal. Prime</th>
                                  <th className="text-right py-3 px-4 font-bold">Total Réal. Trésorerie</th>
                                  <th className="text-center py-3 px-4 font-bold">Part %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {totalGeneralData.map((data, idx) => (
                                  <tr key={data.key} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-emerald-50/30 dark:bg-emerald-900/10'}`}>
                                    <td className="py-3 px-4 font-medium">{data.label}</td>
                                    <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{data.pprPrevuesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-3 px-4 text-right font-bold text-green-600">{data.totalEco.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-3 px-4 text-right text-amber-600">{data.totalPrevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-3 px-4 text-right text-amber-600">{data.totalPrevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-3 px-4 text-right text-green-600">{data.totalRealPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-3 px-4 text-right text-green-600">{data.totalRealTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                    <td className="py-3 px-4 text-center"><Badge className="bg-emerald-500 text-white">{data.partPct.toFixed(2)}%</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gradient-to-r from-emerald-200 to-green-200 dark:from-emerald-800/50 dark:to-green-800/50 font-bold border-t-2 border-emerald-400">
                                  <td className="py-4 px-4 font-bold text-lg text-emerald-900 dark:text-emerald-100">GRAND TOTAL</td>
                                  <td className="py-4 px-4 text-right font-bold text-xl text-indigo-700 dark:text-indigo-300">{grandTotalPPR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-4 px-4 text-right font-bold text-xl text-green-700 dark:text-green-300">{grandTotalEco.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-4 px-4 text-right font-bold text-lg text-amber-700 dark:text-amber-300">{grandTotalPrevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-4 px-4 text-right font-bold text-lg text-amber-700 dark:text-amber-300">{grandTotalPrevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-4 px-4 text-right font-bold text-lg text-green-700 dark:text-green-300">{grandTotalRealPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-4 px-4 text-right font-bold text-lg text-green-700 dark:text-green-300">{grandTotalRealTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-4 px-4 text-center"><Badge className="bg-emerald-600 text-white text-lg px-3 py-1">100%</Badge></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/modules/module3/cost-recap')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Récapitulatif des Coûts
          </Button>

          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground hidden md:block">
              {globalStats.employeesWithData} salariés • {globalStats.totalEconomies.toLocaleString('fr-FR')} {currencyConfig.symbol} d'économies
            </p>
            <Button
              onClick={() => navigate('/modules/module3/cost-savings-reporting')}
              className="gap-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 text-white shadow-lg shadow-green-500/25"
            >
              <BarChart3 className="w-4 h-4" />
              Tableau de bord
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
