/**
 * ============================================
 * HCM COST SAVINGS - RÉCAPITULATIF DES COÛTS PAR SALARIÉ
 * ============================================
 *
 * Interface de transfert des données de coûts provenant du module Cost Savings
 * Source: "2- Les données des coûts générés au quotidien par votre activité"
 *
 * OBJECTIF:
 * Récapituler tous les coûts enregistrés par les chefs d'équipe, organisés par:
 * - Ligne d'activité
 * - Indicateur de performance (ABS, QD, OA, DDP, EKH)
 * - Nom du salarié
 * - Données de temps (Date, Heure)
 * - Frais enregistrés
 *
 * SOURCES DE DONNÉES:
 * - Table: module3_cost_entries
 * - Données saisies via CostDataEntry.tsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
// Smart Calendar Integration
import { getLastCompletedWeek, type LastCompletedWeekResult } from '@/lib/fiscal/LaunchDateService';

// OPTIMISATION 10K: Constantes de pagination
const PAGE_SIZE_MEMBERS = 500;
const PAGE_SIZE_ENTRIES = 500;
import {
  ArrowLeft,
  ArrowRight,
  Database,
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
  Search,
  Layers,
  Home
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { formatCurrency, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';

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
  created_by: string;
}

interface BusinessLine {
  id: string;
  activity_name: string;
  team_leader: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  professional_category: string;
  tech_level: string;
  business_line_id: string;
}

interface EnrichedCostEntry extends CostEntry {
  employee_name: string;
  employee_tech_level: string;
  employee_category: string;
  business_line_name: string;
  team_leader: string | null;
}

// ============================================
// KPI CONFIGURATION
// ============================================

const KPI_CONFIG: Record<string, { label: string; labelFr: string; color: string; icon: React.ReactNode; gradient: string }> = {
  'abs': {
    label: 'Absenteeism',
    labelFr: 'Absentéisme',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    icon: <UserCircle className="w-4 h-4" />
  },
  'qd': {
    label: 'Quality Defects',
    labelFr: 'Défauts Qualité',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  'oa': {
    label: 'Occupational Accidents',
    labelFr: 'Accidents du Travail',
    color: 'red',
    gradient: 'from-red-500 to-rose-600',
    icon: <Zap className="w-4 h-4" />
  },
  'ddp': {
    label: 'Direct Productivity',
    labelFr: 'Écarts Productivité',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    icon: <Target className="w-4 h-4" />
  },
  'ekh': {
    label: 'Know-How Gaps',
    labelFr: 'Écarts Know-How',
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    icon: <Activity className="w-4 h-4" />
  }
};

const getKPIBadgeColor = (kpiType: string) => {
  const config = KPI_CONFIG[kpiType];
  switch (config?.color) {
    case 'orange': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
    case 'rose': return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
    case 'red': return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'violet': return 'bg-violet-500/10 text-violet-600 border-violet-500/30';
    case 'green': return 'bg-green-500/10 text-green-600 border-green-500/30';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDuration = (hours: number, minutes: number): string => {
  return `${hours}h${minutes.toString().padStart(2, '0')}m`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
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
// MAIN COMPONENT
// ============================================

export default function CostRecapByEmployeePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId, isLoading: isCompanyLoading } = useCompany();

  const [costEntries, setCostEntries] = useState<EnrichedCostEntry[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('EUR');

  // Smart Calendar State - Dernière semaine complétée
  const [lastCompletedWeek, setLastCompletedWeek] = useState<LastCompletedWeekResult | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusinessLine, setSelectedBusinessLine] = useState<string>('all');
  const [selectedKPI, setSelectedKPI] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

        let periodStart: string | null = null;
        let periodEnd: string | null = null;

        if (completedWeek) {
          setLastCompletedWeek(completedWeek);
          console.log('[CostRecapByEmployeePage] ✅ Last completed week:', completedWeek.periodLabel);

          // Format for Supabase query
          periodStart = completedWeek.weekStart.toISOString().split('T')[0];
          periodEnd = completedWeek.weekEnd.toISOString().split('T')[0];
        }

        // 1. Fetch business lines
        const { data: blData, error: blError } = await supabase
          .from('business_lines')
          .select('id, activity_name, team_leader')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });

        if (!isMounted) return;
        if (blError) {
          console.error('[AUDIT] Erreur business_lines:', blError);
          throw blError;
        }
        setBusinessLines(blData || []);

        // 2. OPTIMISATION 10K: Fetch team members avec pagination
        const businessLineIds = blData?.map(bl => bl.id) || [];
        let membersData: any[] = [];

        if (businessLineIds.length > 0) {
          let page = 0;
          let hasMore = true;
          while (hasMore) {
            const from = page * PAGE_SIZE_MEMBERS;
            const to = from + PAGE_SIZE_MEMBERS - 1;
            const { data: members, error: membersError } = await supabase
              .from('module3_team_members')
              .select('id, name, professional_category, tech_level, business_line_id')
              .in('business_line_id', businessLineIds)
              .order('name', { ascending: true })
              .range(from, to);

            if (!isMounted) return;
            if (membersError) {
              console.error('[AUDIT] Erreur module3_team_members:', membersError);
              throw membersError;
            }
            membersData = [...membersData, ...(members || [])];
            page++;
            hasMore = (members?.length || 0) === PAGE_SIZE_MEMBERS;
          }
        }

        // 3. OPTIMISATION 10K: Fetch cost entries avec pagination
        // FILTRE PAR SEMAINE: Only fetch entries for the current fiscal week
        let allEntries: any[] = [];
        let entriesPage = 0;
        let hasMoreEntries = true;
        while (hasMoreEntries) {
          const from = entriesPage * PAGE_SIZE_ENTRIES;
          const to = from + PAGE_SIZE_ENTRIES - 1;

          // Build query with week filter if available
          let query = supabase
            .from('module3_cost_entries')
            .select('*')
            .eq('company_id', companyId);

          // Filter by period if Smart Calendar is configured
          if (periodStart && periodEnd) {
            query = query
              .gte('period_start', periodStart)
              .lte('period_end', periodEnd);
          }

          const { data: entriesData, error: entriesError } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

          if (!isMounted) return;
          if (entriesError) {
            console.error('[AUDIT] Erreur module3_cost_entries:', entriesError);
            throw entriesError;
          }
          allEntries = [...allEntries, ...(entriesData || [])];
          entriesPage++;
          hasMoreEntries = (entriesData?.length || 0) === PAGE_SIZE_ENTRIES;
        }
        // 4. Fetch currency from Module 1 (using companyId directly)
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
          if (factors.selectedCurrency) {
            setSelectedCurrency(factors.selectedCurrency as Currency);
          }
        }

        // 5. Enrich cost entries with employee and business line info
        const membersMap = new Map(membersData.map(m => [m.id, m]));
        const blMap = new Map((blData || []).map(bl => [bl.id, bl]));

        const enrichedEntries: EnrichedCostEntry[] = allEntries.map(entry => {
          const member = membersMap.get(entry.employee_id);
          const bl = blMap.get(entry.business_line_id);

          return {
            ...entry,
            employee_name: member?.name || `ID: ${entry.employee_id?.substring(0, 8)}...`,
            employee_tech_level: member?.tech_level || 'Standard',
            employee_category: member?.professional_category || '',
            business_line_name: bl?.activity_name || `Ligne ID: ${entry.business_line_id?.substring(0, 8)}...`,
            team_leader: bl?.team_leader || null
          };
        });

        if (!isMounted) return;
        setCostEntries(enrichedEntries);

        } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching cost recap data:', err);
        toast.error("Erreur lors du chargement des données de coûts");
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

  // Filter entries
  const filteredEntries = useMemo(() => {
    return costEntries.filter(entry => {
      const matchesSearch = searchTerm === '' ||
        entry.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.business_line_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBL = selectedBusinessLine === 'all' || entry.business_line_id === selectedBusinessLine;
      const matchesKPI = selectedKPI === 'all' || entry.kpi_type === selectedKPI;

      return matchesSearch && matchesBL && matchesKPI;
    });
  }, [costEntries, searchTerm, selectedBusinessLine, selectedKPI]);

  // Group entries by employee
  const entriesByEmployee = useMemo(() => {
    const grouped = new Map<string, EnrichedCostEntry[]>();

    filteredEntries.forEach(entry => {
      const key = entry.employee_id;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });

    return grouped;
  }, [filteredEntries]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCost = filteredEntries.reduce((sum, e) => sum + (e.compensation_amount || 0), 0);
    const totalHours = filteredEntries.reduce((sum, e) => sum + (e.duration_hours || 0) + (e.duration_minutes || 0) / 60, 0);
    const uniqueEmployees = new Set(filteredEntries.map(e => e.employee_id)).size;
    const kpiBreakdown = filteredEntries.reduce((acc, e) => {
      acc[e.kpi_type] = (acc[e.kpi_type] || 0) + (e.compensation_amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return { totalCost, totalHours, uniqueEmployees, kpiBreakdown };
  }, [filteredEntries]);

  const toggleRow = (employeeId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const currencyConfig = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.EUR;

  // Afficher le loader si: en chargement OU si pas encore de companyId
  if (loading || isCompanyLoading || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <HCMLoader text="Chargement des données de coûts..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
            <FileSpreadsheet className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              HCM COST SAVINGS - Récapitulatif des Coûts
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-orange-500 to-red-500 bg-clip-text text-transparent">
            Récapitulatif des Coûts Enregistrés par Salarié
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Données de coûts provenant des chefs d'équipe - Organisées par indicateur de performance
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

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {Object.entries(KPI_CONFIG).map(([key, config]) => (
              <Badge key={key} variant="outline" className={getKPIBadgeColor(key)}>
                {config.icon}
                <span className="ml-1">{config.labelFr}</span>
              </Badge>
            ))}
          </div>

          {/* Bouton Retour Menu Principal */}
          <Button
            onClick={() => navigate('/modules/module3')}
            variant="outline"
            className="mt-4 gap-2 border-orange-500/30 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            <Home className="w-4 h-4" />
            Retour menu principal
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-white" />}
            label="Total des Frais"
            value={`${stats.totalCost.toLocaleString('fr-FR')} ${currencyConfig.symbol}`}
            subValue="Coûts enregistrés"
            gradient="from-orange-600 to-red-700"
            delay={0.1}
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-white" />}
            label="Temps Total"
            value={`${stats.totalHours.toFixed(1)}h`}
            subValue="Heures impactées"
            gradient="from-blue-600 to-cyan-700"
            delay={0.2}
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-white" />}
            label="Salariés Concernés"
            value={stats.uniqueEmployees}
            subValue={`${filteredEntries.length} entrées`}
            gradient="from-purple-600 to-pink-700"
            delay={0.3}
          />
          <StatCard
            icon={<Layers className="w-6 h-6 text-white" />}
            label="Lignes d'Activité"
            value={businessLines.length}
            subValue="Départements actifs"
            gradient="from-green-600 to-emerald-700"
            delay={0.4}
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-2 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un salarié ou une ligne d'activité..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Business Line Filter */}
                <Select value={selectedBusinessLine} onValueChange={setSelectedBusinessLine}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Ligne d'activité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les lignes</SelectItem>
                    {businessLines.map(bl => (
                      <SelectItem key={bl.id} value={bl.id}>{bl.activity_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* KPI Filter */}
                <Select value={selectedKPI} onValueChange={setSelectedKPI}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Target className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Indicateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les indicateurs</SelectItem>
                    {Object.entries(KPI_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.labelFr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Refresh */}
                <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Entries Table */}
        {filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune donnée de coût</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Aucune entrée de coût n'a été trouvée. Les chefs d'équipe doivent d'abord saisir
                  les données via le module "Contrôle des Indicateurs de Performance".
                </p>
                <Button
                  onClick={() => navigate('/modules/module3/cost-data-entry')}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Saisir des données de coûts
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-2 border-orange-500/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-500/20">
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-500" />
                  Détail des Coûts par Salarié
                </CardTitle>
                <CardDescription>
                  {filteredEntries.length} entrée(s) • {entriesByEmployee.size} salarié(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Ligne d'Activité</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Indicateur</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Nom du Salarié</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Durée</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Frais ({currencyConfig.symbol})</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, idx) => {
                        const kpiConfig = KPI_CONFIG[entry.kpi_type] || KPI_CONFIG['abs'];
                        const isExpanded = expandedRows.has(entry.id);

                        return (
                          <React.Fragment key={entry.id}>
                          <motion.tr
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                              "border-b border-border/50 transition-colors",
                              "hover:bg-orange-500/5",
                              idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                            )}
                          >
                            {/* Ligne d'Activité */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-orange-500" />
                                <div>
                                  <span className="font-medium text-foreground text-sm">
                                    {entry.business_line_name}
                                  </span>
                                  {entry.team_leader && (
                                    <p className="text-xs text-muted-foreground">
                                      Chef: {entry.team_leader}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Indicateur */}
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={getKPIBadgeColor(entry.kpi_type)}>
                                {kpiConfig.icon}
                                <span className="ml-1">{kpiConfig.labelFr}</span>
                              </Badge>
                            </td>

                            {/* Nom du Salarié */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <UserCircle className="w-4 h-4 text-purple-500" />
                                <div>
                                  <span className="font-medium text-foreground">
                                    {entry.employee_name}
                                  </span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {entry.employee_tech_level}
                                  </Badge>
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-medium text-foreground">
                                  {formatDate(entry.event_date)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(entry.created_at)}
                                </span>
                              </div>
                            </td>

                            {/* Durée */}
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(entry.duration_hours, entry.duration_minutes)}
                              </Badge>
                            </td>

                            {/* Frais */}
                            <td className="py-3 px-4 text-right">
                              <span className="font-bold text-orange-600 dark:text-orange-400">
                                {entry.compensation_amount.toLocaleString('fr-FR')} {currencyConfig.symbol}
                              </span>
                            </td>

                            {/* Détails (expand) */}
                            <td className="py-3 px-4 text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleRow(entry.id)}
                                      className={cn(
                                        "rounded-full transition-all duration-200",
                                        isExpanded && "bg-orange-500/10 text-orange-600"
                                      )}
                                    >
                                      <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </motion.div>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{isExpanded ? 'Masquer les détails' : 'Voir les détails'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          </motion.tr>

                          {/* Panneau de détails déroulant */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                              >
                                <td colSpan={7} className="p-0">
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    className="bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-red-500/5 border-l-4 border-orange-500 mx-2 mb-2 rounded-lg p-4"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {/* Informations de période */}
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-orange-500" />
                                          Période d'analyse
                                        </h4>
                                        <div className="bg-background/50 rounded-lg p-3 space-y-1">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Début:</span>
                                            <span className="font-medium">{formatDate(entry.period_start)}</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Fin:</span>
                                            <span className="font-medium">{formatDate(entry.period_end)}</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Date événement:</span>
                                            <span className="font-medium text-orange-600">{formatDate(entry.event_date)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Informations de temps et coûts */}
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-blue-500" />
                                          Temps & Coûts
                                        </h4>
                                        <div className="bg-background/50 rounded-lg p-3 space-y-1">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Durée:</span>
                                            <span className="font-medium">{formatDuration(entry.duration_hours, entry.duration_minutes)}</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Compensation:</span>
                                            <span className="font-bold text-orange-600">
                                              {entry.compensation_amount.toLocaleString('fr-FR')} {currencyConfig.symbol}
                                            </span>
                                          </div>
                                          {entry.saved_expenses !== undefined && entry.saved_expenses > 0 && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Économies:</span>
                                              <span className="font-medium text-green-600">
                                                {entry.saved_expenses.toLocaleString('fr-FR')} {currencyConfig.symbol}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Informations spécifiques au KPI */}
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          {kpiConfig.icon}
                                          <span className="text-orange-500">Détails {kpiConfig.labelFr}</span>
                                        </h4>
                                        <div className="bg-background/50 rounded-lg p-3 space-y-2">
                                          {/* Défauts Qualité - Types de défauts */}
                                          {entry.kpi_type === 'qd' && entry.defect_types && entry.defect_types.length > 0 && (
                                            <div>
                                              <span className="text-xs text-muted-foreground">Types de défauts:</span>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {entry.defect_types.map((defect, i) => (
                                                  <Badge key={i} variant="outline" className="text-xs bg-rose-500/10 text-rose-600 border-rose-500/30">
                                                    {defect}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Accidents - Niveau de responsabilité */}
                                          {entry.kpi_type === 'oa' && entry.responsibility_level && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Responsabilité:</span>
                                              <Badge variant="outline" className={cn(
                                                "text-xs",
                                                entry.responsibility_level === 'high' && "bg-red-500/10 text-red-600 border-red-500/30",
                                                entry.responsibility_level === 'medium' && "bg-orange-500/10 text-orange-600 border-orange-500/30",
                                                entry.responsibility_level === 'low' && "bg-green-500/10 text-green-600 border-green-500/30"
                                              )}>
                                                {entry.responsibility_level === 'high' ? 'Élevée' :
                                                 entry.responsibility_level === 'medium' ? 'Moyenne' : 'Faible'}
                                              </Badge>
                                            </div>
                                          )}

                                          {/* Productivité - Jours sélectionnés et temps récupéré */}
                                          {entry.kpi_type === 'ddp' && (
                                            <>
                                              {entry.selected_days && entry.selected_days.length > 0 && (
                                                <div>
                                                  <span className="text-xs text-muted-foreground">Jours concernés:</span>
                                                  <div className="flex flex-wrap gap-1 mt-1">
                                                    {entry.selected_days.map((day, i) => (
                                                      <Badge key={i} variant="outline" className="text-xs bg-violet-500/10 text-violet-600 border-violet-500/30">
                                                        {day}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {(entry.recovered_time_hours !== undefined || entry.recovered_time_minutes !== undefined) && (
                                                <div className="flex justify-between text-sm mt-2">
                                                  <span className="text-muted-foreground">Temps récupéré:</span>
                                                  <span className="font-medium text-green-600">
                                                    {formatDuration(entry.recovered_time_hours || 0, entry.recovered_time_minutes || 0)}
                                                  </span>
                                                </div>
                                              )}
                                            </>
                                          )}

                                          {/* Informations employé */}
                                          <div className="pt-2 border-t border-border/50">
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Catégorie:</span>
                                              <span className="font-medium">{entry.employee_category || 'Non définie'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Niveau tech:</span>
                                              <Badge variant="outline" className="text-xs">
                                                {entry.employee_tech_level}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Métadonnées */}
                                    <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                                      <span>ID: {entry.id.substring(0, 8)}...</span>
                                      <span>Créé le: {formatDate(entry.created_at)} à {formatTime(entry.created_at)}</span>
                                    </div>
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                        );
                      })}
                    </tbody>
                    {/* Footer with totals */}
                    <tfoot>
                      <tr className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-t-2 border-orange-500/30">
                        <td colSpan={4} className="py-4 px-4 text-right font-bold text-foreground">
                          TOTAL:
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            {stats.totalHours.toFixed(1)}h
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                            {stats.totalCost.toLocaleString('fr-FR')} {currencyConfig.symbol}
                          </span>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
            onClick={() => navigate('/modules/module3/data-alignment')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Alignement des données
          </Button>

          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground hidden md:block">
              {filteredEntries.length} coûts • {stats.uniqueEmployees} salariés
            </p>
            <Button
              onClick={() => navigate('/modules/module3/performance-recap')}
              disabled={filteredEntries.length === 0}
              className="gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/25"
            >
              Récapitulatif des performances
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
