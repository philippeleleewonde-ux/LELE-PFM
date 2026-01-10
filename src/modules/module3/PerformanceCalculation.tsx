/**
 * ============================================
 * HCM COST SAVINGS - PERFORMANCE CALCULATION
 * ============================================
 *
 * Page 3 - Le calcul des performances de vos équipes
 * Interface moderne et futuriste pour visualiser les résultats
 * du moteur de calcul basé sur l'analyse Excel
 *
 * Sections:
 * - Sélection de la ligne d'activité et période
 * - Dashboard temps réel des 5 KPIs
 * - Synthèse Niveau 1 & Niveau 2
 * - Distribution Trésorerie/Primes (67%/33%)
 * - Export PDF
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

// OPTIMISATION 10K: Constantes de pagination
const PAGE_SIZE_MEMBERS = 500;
const PAGE_SIZE_ENTRIES = 500;
import {
  ArrowLeft,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Target,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Layers,
  Calculator,
  Wallet,
  Award,
  ChevronRight,
  Info,
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Import des widgets connectés au calendrier fiscal (Mission 3)
import { CalendarPeriodSelector, CalendarPerformanceTracker, type PeriodSelection } from '@/components/shared';

import {
  calculateLineSynthesis,
  calculateGlobalSynthesis,
  formatCurrency,
  formatDuration,
  formatPercentage,
  TAUX_TRESORERIE,
  TAUX_PRIMES,
  KPI_DEFINITIONS,
  type TeamMember,
  type CostEntry,
  type PPRData,
  type SyntheseLigne,
  type GlobalSynthesis,
  type KPIResult,
  type EKHResult,
  type SynthesePerformanceNiveau1,
  type SynthesePerformanceNiveau2,
  type SynthesePerformanceNiveau3,
  type RepartitionPrimesNiveau1Salarie,
  type RepartitionPrimesNiveau2,
  type FinancialParams,
} from './engine/calculationEngine';

// ============================================
// TYPES
// ============================================

interface BusinessLine {
  id: string;
  activity_name: string;
  staff_count: number;
  team_leader: string | null;
}

// ============================================
// KPI CARD COMPONENT
// ============================================

interface KPICardProps {
  kpiCode: string;
  kpiNameFr: string;
  pertes: number;
  economies: number;
  percent: number;
  incidents: number;
  isPositive: boolean;
  gradient: string;
  icon: React.ReactNode;
}

function KPICard({ kpiCode, kpiNameFr, pertes, economies, percent, incidents, isPositive, gradient, icon }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <Card className={cn(
        "border-2 transition-all duration-300 hover:shadow-xl",
        isPositive ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"
      )}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              `bg-gradient-to-br ${gradient}`
            )}>
              {icon}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "font-bold",
                isPositive
                  ? "bg-green-500/10 text-green-600 border-green-500/30"
                  : "bg-orange-500/10 text-orange-600 border-orange-500/30"
              )}
            >
              {kpiCode}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-bold text-foreground mb-3">{kpiNameFr}</h3>

          {/* Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                Pertes
              </span>
              <span className="font-semibold text-red-600">{formatCurrency(pertes)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                Économies
              </span>
              <span className="font-semibold text-green-600">{formatCurrency(economies)}</span>
            </div>

            {/* Progress Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Performance</span>
                <span className={cn(
                  "font-bold",
                  percent < 50 ? "text-green-600" : "text-orange-600"
                )}>
                  {formatPercentage(100 - percent)} efficacité
                </span>
              </div>
              <Progress
                value={100 - percent}
                className={cn(
                  "h-2",
                  percent < 50 ? "[&>div]:bg-green-500" : "[&>div]:bg-orange-500"
                )}
              />
            </div>

            {/* Incidents */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
              <span className="text-muted-foreground">Incidents</span>
              <Badge variant="secondary" className="text-xs">
                {incidents}
              </Badge>
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

export default function PerformanceCalculation() {
  const navigate = useNavigate();
  const { companyId, isLoading: isCompanyLoading } = useCompany();

  // Debug logging
  // Selection state
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [selectedBusinessLine, setSelectedBusinessLine] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // PPR Data (normally from Module 1)
  const [pprData, setPprData] = useState<PPRData>({
    ppr_annuel: 100000,
    ppr_hebdomadaire: 1923.08, // 100000 / 52
    ppr_trimestriel: 25000,
  });

  // Financial parameters from Module 1 (HCM Performance Plan)
  // Used for correct Score Financier calculation
  const [financialParams, setFinancialParams] = useState<FinancialParams | null>(null);

  // Calculated data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [synthesis, setSynthesis] = useState<SyntheseLigne | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch business lines on mount
  useEffect(() => {
    if (!isCompanyLoading) {
      if (companyId) {
        fetchBusinessLines();
      } else {
        // No company ID - stop loading
        setLoading(false);
      }
    }
  }, [companyId, isCompanyLoading]);

  const fetchBusinessLines = async () => {
    try {
      setLoading(true);

      // OPTIMISATION: Requêtes parallèles
      const [blResult, scoreResult] = await Promise.all([
        supabase
          .from('business_lines')
          .select('id, activity_name, staff_count, team_leader')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true }),
        supabase
          .from('company_performance_scores')
          .select('factors')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      if (blResult.error) throw blResult.error;
      setBusinessLines(blResult.data || []);

      // Fetch financial parameters from Module 1 (company_performance_scores)
      // Used for correct Score Financier calculation
      const scoreData = scoreResult.data;

      if (scoreData?.factors) {
        const factors = scoreData.factors as any;
        let recettesN1 = 0;
        let depensesN1 = 0;
        let volumeHoraireN1 = 1; // Default to avoid division by zero

        // Get Recettes and Dépenses from Financial History (N-1)
        if (factors.employeeEngagement?.financialHistory?.length > 0) {
          const financialHistory = factors.employeeEngagement.financialHistory;
          const lastYear = financialHistory[financialHistory.length - 1];
          if (lastYear) {
            recettesN1 = lastYear.sales || 0;
            depensesN1 = lastYear.spending || 0;
          }
        }

        // Get Volume Horaire N-1 = annualHoursPerPerson (heures annuelles par personne)
        // Note: On utilise directement annualHoursPerPerson, PAS multiplié par le nombre d'employés
        // Car la formule est: ((Recettes - Dépenses) / Volume Horaire) × Temps Collecté
        if (factors.employeeEngagement?.annualHoursPerPerson) {
          volumeHoraireN1 = factors.employeeEngagement.annualHoursPerPerson;
        }

        setFinancialParams({
          recettesN1,
          depensesN1,
          volumeHoraireN1
        });
      }
    } catch (error) {
      console.error('Error fetching business lines:', error);
      toast.error("Erreur lors du chargement des lignes d'activité");
    } finally {
      setLoading(false);
    }
  };

  const fetchDataAndCalculate = async () => {
    if (!selectedBusinessLine || !periodStart || !periodEnd) {
      toast.error("Veuillez sélectionner une ligne et une période");
      return;
    }

    try {
      setCalculating(true);

      // OPTIMISATION: Fetch members et entries en parallèle
      const fetchAllMembers = async () => {
        let allMembers: any[] = [];
        let membersPage = 0;
        let hasMoreMembers = true;
        while (hasMoreMembers) {
          const from = membersPage * PAGE_SIZE_MEMBERS;
          const to = from + PAGE_SIZE_MEMBERS - 1;
          const { data: members, error: membersError } = await supabase
            .from('module3_team_members')
            .select('*')
            .eq('business_line_id', selectedBusinessLine)
            .range(from, to);

          if (membersError) throw membersError;
          allMembers = [...allMembers, ...(members || [])];
          membersPage++;
          hasMoreMembers = (members?.length || 0) === PAGE_SIZE_MEMBERS;
        }
        return allMembers;
      };

      const fetchAllEntries = async () => {
        let allEntries: any[] = [];
        let entriesPage = 0;
        let hasMoreEntries = true;
        while (hasMoreEntries) {
          const from = entriesPage * PAGE_SIZE_ENTRIES;
          const to = from + PAGE_SIZE_ENTRIES - 1;
          const { data: entries, error: entriesError } = await supabase
            .from('module3_cost_entries')
            .select('*')
            .eq('business_line_id', selectedBusinessLine)
            .gte('event_date', periodStart)
            .lte('event_date', periodEnd)
            .range(from, to);

          if (entriesError) throw entriesError;
          allEntries = [...allEntries, ...(entries || [])];
          entriesPage++;
          hasMoreEntries = (entries?.length || 0) === PAGE_SIZE_ENTRIES;
        }
        return allEntries;
      };

      // Exécuter en parallèle
      const [allMembers, allEntries] = await Promise.all([
        fetchAllMembers(),
        fetchAllEntries()
      ]);

      setTeamMembers(allMembers);
      setCostEntries(allEntries);

      // Calculate synthesis with correct Score Financier formula
      // financialParams contains recettesN1, depensesN1, volumeHoraireN1 from Module 1
      const businessLine = businessLines.find(bl => bl.id === selectedBusinessLine);
      const result = calculateLineSynthesis(
        selectedBusinessLine,
        businessLine?.activity_name || 'Ligne',
        allEntries,
        allMembers,
        pprData,
        financialParams || undefined // Pass financial params for correct Score Financier calculation
      );

      setSynthesis(result);
      toast.success("Calcul effectué avec succès");
    } catch (error) {
      console.error('Error calculating performance:', error);
      toast.error("Erreur lors du calcul des performances");
    } finally {
      setCalculating(false);
    }
  };

  const selectedBusinessLineData = businessLines.find(bl => bl.id === selectedBusinessLine);

  // KPI Icons and gradients
  const kpiVisuals = {
    ABS: { icon: <Users className="w-6 h-6 text-white" />, gradient: "from-orange-500 to-amber-600" },
    DFQ: { icon: <AlertTriangle className="w-6 h-6 text-white" />, gradient: "from-rose-500 to-pink-600" },
    ADT: { icon: <Zap className="w-6 h-6 text-white" />, gradient: "from-red-500 to-rose-600" },
    EPD: { icon: <Target className="w-6 h-6 text-white" />, gradient: "from-violet-500 to-purple-600" },
    EKH: { icon: <Layers className="w-6 h-6 text-white" />, gradient: "from-blue-500 to-cyan-600" },
  };

  if (loading || isCompanyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <HCMLoader text="Chargement du moteur de calcul..." />
      </div>
    );
  }

  // No company associated
  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Aucune entreprise associée
          </h3>
          <p className="text-muted-foreground mb-6">
            Vous devez être associé à une entreprise pour accéder au moteur de calcul.
            Veuillez contacter votre administrateur.
          </p>
          <Button variant="outline" onClick={() => navigate('/modules/module3')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Calculator className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              HCM COST SAVINGS - Module 3
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent">
            Calcul des Performances de vos Équipes
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            3- Moteur de calcul économique basé sur les 5 indicateurs de performance
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-600 dark:text-green-400">
            <Shield className="w-3 h-3" />
            Formules Excel validées - Distribution 67%/33%
          </div>
        </motion.div>

        {/* Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 border-border backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Configuration de l'analyse
              </CardTitle>
              <CardDescription>
                Sélectionnez la ligne d'activité et la période à analyser
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Business Line + Calculate */}
                <div className="space-y-4">
                  {/* Business Line Select */}
                  <div className="space-y-3">
                    <Label className="text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Ligne d'activité
                    </Label>
                    <Select value={selectedBusinessLine} onValueChange={setSelectedBusinessLine}>
                      <SelectTrigger className="h-12 bg-background border-input hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Sélectionnez une ligne" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessLines.map((line) => (
                          <SelectItem key={line.id} value={line.id}>
                            <div className="flex items-center gap-2">
                              <span>{line.activity_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {line.staff_count} emp.
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calculate Button */}
                  <Button
                    onClick={fetchDataAndCalculate}
                    disabled={!selectedBusinessLine || !periodStart || !periodEnd || calculating}
                    className="h-12 w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground shadow-lg shadow-primary/25"
                  >
                    {calculating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Calcul en cours...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Lancer le calcul
                      </>
                    )}
                  </Button>
                </div>

                {/* Right Column: Calendar Period Selector */}
                {companyId && (
                  <CalendarPeriodSelector
                    companyId={companyId}
                    businessLineId={selectedBusinessLine || undefined}
                    onPeriodChange={(period: PeriodSelection) => {
                      setPeriodStart(period.periodStart);
                      setPeriodEnd(period.periodEnd);
                    }}
                    selectedPeriod={periodStart && periodEnd ? {
                      periodStart,
                      periodEnd,
                      yearOffset: 1,
                      isLocked: false,
                      hasData: false
                    } : undefined}
                    granularity="week"
                    showDataIndicator={true}
                  />
                )}
              </div>

              {/* PPR Input */}
              <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
                <Label className="text-foreground flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  PPR Annuel (Potentiel de Performance Récupérable)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={pprData.ppr_annuel}
                    onChange={(e) => {
                      const annual = parseFloat(e.target.value) || 0;
                      setPprData({
                        ppr_annuel: annual,
                        ppr_hebdomadaire: annual / 52,
                        ppr_trimestriel: annual / 4,
                      });
                    }}
                    className="max-w-xs bg-background border-input"
                  />
                  <span className="text-sm text-muted-foreground">
                    Hebdo: {formatCurrency(pprData.ppr_hebdomadaire)} | Trim: {formatCurrency(pprData.ppr_trimestriel)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {synthesis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Main Tabs Row */}
                <div className="space-y-2 mb-6">
                  {/* Primary Navigation */}
                  <TabsList className="flex flex-wrap gap-1 w-full max-w-5xl mx-auto bg-muted/50 p-1 rounded-xl h-auto">
                    <TabsTrigger
                      value="dashboard"
                      className="flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs sm:text-sm py-2"
                    >
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                      value="indicateurs"
                      className="flex-1 min-w-[100px] data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg text-xs sm:text-sm py-2"
                    >
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Indicateurs
                    </TabsTrigger>
                    <TabsTrigger
                      value="synthese"
                      className="flex-1 min-w-[100px] data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg text-xs sm:text-sm py-2"
                    >
                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Synthèse
                    </TabsTrigger>
                    <TabsTrigger
                      value="repartition"
                      className="flex-1 min-w-[100px] data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg text-xs sm:text-sm py-2"
                    >
                      <PieChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Répartition
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-8 space-y-8">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Pertes */}
                    <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <TrendingDown className="w-8 h-8 text-red-500" />
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            PERTES
                          </Badge>
                        </div>
                        <p className="text-3xl font-bold text-red-600">
                          {formatCurrency(synthesis.totalPertes)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Score financier total
                        </p>
                      </CardContent>
                    </Card>

                    {/* Total Économies */}
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <TrendingUp className="w-8 h-8 text-green-500" />
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            ÉCONOMIES
                          </Badge>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(synthesis.totalEconomies)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Économies réalisées
                        </p>
                      </CardContent>
                    </Card>

                    {/* Flux Trésorerie */}
                    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Wallet className="w-8 h-8 text-blue-500" />
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                            67%
                          </Badge>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                          {formatCurrency(synthesis.fluxTresorerie)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Flux Trésorerie
                        </p>
                      </CardContent>
                    </Card>

                    {/* Sorties Primes */}
                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Award className="w-8 h-8 text-purple-500" />
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                            33%
                          </Badge>
                        </div>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatCurrency(synthesis.sortiesPrimes)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sorties Primes
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {synthesis.kpiResults.map((kpi) => {
                      const visual = kpiVisuals[kpi.kpiCode as keyof typeof kpiVisuals];
                      return (
                        <KPICard
                          key={kpi.kpiCode}
                          kpiCode={kpi.kpiCode}
                          kpiNameFr={kpi.kpiNameFr}
                          pertes={kpi.pertesConstatees}
                          economies={kpi.economiesRealisees}
                          percent={kpi.pertesPercent}
                          incidents={kpi.nombreIncidents}
                          isPositive={kpi.pertesPercent < 50}
                          gradient={visual?.gradient || "from-gray-500 to-gray-600"}
                          icon={visual?.icon || <Activity className="w-6 h-6 text-white" />}
                        />
                      );
                    })}

                    {/* EKH Card */}
                    {synthesis.ekhResult && (
                      <KPICard
                        kpiCode={synthesis.ekhResult.kpiCode}
                        kpiNameFr={synthesis.ekhResult.kpiNameFr}
                        pertes={synthesis.ekhResult.pertesConstatees}
                        economies={synthesis.ekhResult.economiesRealisees}
                        percent={synthesis.ekhResult.pertesPercent}
                        incidents={0}
                        isPositive={synthesis.ekhResult.coefficientCompetence > 0.5}
                        gradient={kpiVisuals.EKH.gradient}
                        icon={kpiVisuals.EKH.icon}
                      />
                    )}
                  </div>

                  {/* EKH Coefficient Info */}
                  {synthesis.ekhResult && (
                    <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-blue-500/10">
                            <Layers className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground mb-2">
                              Coefficient de Compétence (EKH)
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4">
                              Basé sur la polyvalence F1 + F2 + F3 des {teamMembers.length} employés
                            </p>
                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-xs text-muted-foreground">Coefficient moyen</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {formatPercentage(synthesis.ekhResult.coefficientCompetence * 100)}
                                </p>
                              </div>
                              <div className="flex-1">
                                <Progress
                                  value={synthesis.ekhResult.coefficientCompetence * 100}
                                  className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Performance Tracker - Évolution des performances dans le temps */}
                  {companyId && (
                    <CalendarPerformanceTracker
                      companyId={companyId}
                      businessLineId={selectedBusinessLine || undefined}
                      pprAnnuel={pprData.ppr_annuel}
                      compact={false}
                    />
                  )}
                </TabsContent>

                {/* INDICATEURS Tab - 5 KPIs détaillés */}
                <TabsContent value="indicateurs" className="mt-8 space-y-6">
                  {/* Sub-navigation pour les 5 KPIs */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      { code: 'ABS', label: 'Absentéisme', color: 'orange' },
                      { code: 'DFQ', label: 'Défauts Qualité', color: 'rose' },
                      { code: 'ADT', label: 'Accidents Travail', color: 'red' },
                      { code: 'EPD', label: 'Productivité', color: 'violet' },
                      { code: 'EKH', label: 'Savoir-faire', color: 'blue' },
                    ].map((kpi) => (
                      <Badge
                        key={kpi.code}
                        className={cn(
                          "cursor-pointer px-4 py-2 text-sm transition-all",
                          `bg-gradient-to-r ${kpiVisuals[kpi.code as keyof typeof kpiVisuals]?.gradient || 'from-gray-500 to-gray-600'} text-white hover:scale-105`
                        )}
                      >
                        {kpi.code} - {kpi.label}
                      </Badge>
                    ))}
                  </div>

                  {/* Affichage de tous les KPIs */}
                  {synthesis.kpiResults.map((kpi, index) => (
                    <Card key={kpi.kpiCode} className="bg-card/50 border-border backdrop-blur-xl">
                      <CardHeader className={cn(
                        "border-b border-border",
                        `bg-gradient-to-r ${kpiVisuals[kpi.kpiCode as keyof typeof kpiVisuals]?.gradient.replace('from-', 'from-').replace(' to-', '/10 to-')}/10`
                      )}>
                        <CardTitle className="flex items-center gap-3">
                          <Badge className={cn(
                            "px-3 py-1",
                            `bg-gradient-to-r ${kpiVisuals[kpi.kpiCode as keyof typeof kpiVisuals]?.gradient || 'from-gray-500 to-gray-600'} text-white`
                          )}>
                            {kpi.kpiCode}
                          </Badge>
                          <span>{kpi.kpiNameFr}</span>
                        </CardTitle>
                        <CardDescription>
                          Données Niveau 1 et Niveau 2 - {kpi.nombreIncidents} incident(s) enregistré(s)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Résumé KPI */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="p-4 rounded-xl bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Temps Total</p>
                            <p className="text-lg font-bold text-foreground">{formatDuration(kpi.totalTemps)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Score Financier</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(kpi.totalScoreFinancier)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-red-500/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Pertes</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(kpi.totalPertes)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-green-500/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Économies</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(kpi.totalEconomies)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-blue-500/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">PPR Prévu</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(kpi.totalPpr)}</p>
                          </div>
                        </div>

                        {/* Tableau Niveau 1 */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-500" />
                            NIVEAU 1 - Données par Salarié
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border bg-muted/30">
                                  <th className="text-left py-2 px-3">N°</th>
                                  <th className="text-left py-2 px-3">Nom Salarié</th>
                                  <th className="text-left py-2 px-3">Catégorie</th>
                                  <th className="text-right py-2 px-3">Taux Inc.</th>
                                  <th className="text-right py-2 px-3">Temps</th>
                                  <th className="text-right py-2 px-3">Frais</th>
                                  <th className="text-right py-2 px-3">Score Fin.</th>
                                  <th className="text-right py-2 px-3">Pertes</th>
                                  <th className="text-right py-2 px-3">PPR</th>
                                  <th className="text-right py-2 px-3">Économies</th>
                                  <th className="text-right py-2 px-3">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kpi.niveau1Data.slice(0, 10).map((row) => (
                                  <tr key={row.employeeId} className="border-b border-border/30 hover:bg-muted/20">
                                    <td className="py-2 px-3 font-mono text-muted-foreground">{row.numero}</td>
                                    <td className="py-2 px-3 font-medium">{row.nomSalarie}</td>
                                    <td className="py-2 px-3 text-muted-foreground">{row.categoriePro}</td>
                                    <td className="py-2 px-3 text-right font-mono">{row.tauxIncapacite}%</td>
                                    <td className="py-2 px-3 text-right font-mono">{formatDuration(row.donneesTemps)}</td>
                                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(row.fraisCollectes)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-primary">{formatCurrency(row.scoreFinancier)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-red-600">{formatCurrency(row.pertesConstatees)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-blue-600">{formatCurrency(row.pprPrevues)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-green-600 font-bold">{formatCurrency(row.economiesRealisees)}</td>
                                    <td className="py-2 px-3 text-right font-mono">{formatPercentage(row.pertesPercent)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-muted/50 font-bold">
                                  <td colSpan={4} className="py-2 px-3">TOTAL NIVEAU 1</td>
                                  <td className="py-2 px-3 text-right font-mono">{formatDuration(kpi.totalTempsN1)}</td>
                                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(kpi.totalFraisN1)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-primary">{formatCurrency(kpi.totalScoreFinancierN1)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-red-600">{formatCurrency(kpi.totalPertesN1)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-blue-600">{formatCurrency(kpi.totalPprN1)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-green-600">{formatCurrency(kpi.totalEconomiesN1)}</td>
                                  <td className="py-2 px-3 text-right font-mono">{formatPercentage(kpi.totalPertesPercentN1)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Tableau Niveau 2 */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            NIVEAU 2 - Données Pris en Compte (Code P.R.C)
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border bg-green-500/10">
                                  <th className="text-left py-2 px-3">N°</th>
                                  <th className="text-left py-2 px-3">Nom Salarié</th>
                                  <th className="text-center py-2 px-3">P.R.C</th>
                                  <th className="text-right py-2 px-3">Temps PEC</th>
                                  <th className="text-right py-2 px-3">Frais PEC</th>
                                  <th className="text-right py-2 px-3">Score Fin. N2</th>
                                  <th className="text-right py-2 px-3">Pertes N2</th>
                                  <th className="text-right py-2 px-3">Économies N2</th>
                                  <th className="text-right py-2 px-3">% N2</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kpi.niveau2Data.slice(0, 10).map((row) => (
                                  <tr key={row.employeeId} className="border-b border-border/30 hover:bg-muted/20">
                                    <td className="py-2 px-3 font-mono text-muted-foreground">{row.numero}</td>
                                    <td className="py-2 px-3 font-medium">{row.nomSalarie}</td>
                                    <td className="py-2 px-3 text-center">
                                      <Badge variant={row.codePRC === 1 ? "default" : "secondary"} className="text-xs">
                                        {row.codePRC}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono">{formatDuration(row.tempsPrisEnCompte)}</td>
                                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(row.fraisPrisEnCompte)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-primary">{formatCurrency(row.scoreFinancierN2)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-red-600">{formatCurrency(row.pertesConstatéesN2)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-green-600 font-bold">{formatCurrency(row.economiesRealiseesN2)}</td>
                                    <td className="py-2 px-3 text-right font-mono">{formatPercentage(row.pertesPercentN2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-green-500/20 font-bold">
                                  <td colSpan={3} className="py-2 px-3">TOTAL NIVEAU 2</td>
                                  <td className="py-2 px-3 text-right font-mono">{formatDuration(kpi.totalTempsN2)}</td>
                                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(kpi.totalFraisN2)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-primary">{formatCurrency(kpi.totalScoreFinancierN2)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-red-600">{formatCurrency(kpi.totalPertesN2)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-green-600">{formatCurrency(kpi.totalEconomiesN2)}</td>
                                  <td className="py-2 px-3 text-right font-mono">{formatPercentage(kpi.totalPertesPercentN2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* TOTAUX combinés */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30">
                          <h4 className="font-bold text-foreground mb-3">TOTAUX (Niveau 1 + Niveau 2)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Temps Total</p>
                              <p className="text-xl font-bold text-foreground">{formatDuration(kpi.totalTemps)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Score Financier</p>
                              <p className="text-xl font-bold text-primary">{formatCurrency(kpi.totalScoreFinancier)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Pertes Totales</p>
                              <p className="text-xl font-bold text-red-600">{formatCurrency(kpi.totalPertes)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Économies Totales</p>
                              <p className="text-xl font-bold text-green-600">{formatCurrency(kpi.totalEconomies)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* EKH Spécial */}
                  {synthesis.ekhResult && (
                    <Card className="bg-card/50 border-blue-500/30 backdrop-blur-xl">
                      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-border">
                        <CardTitle className="flex items-center gap-3">
                          <Badge className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                            EKH
                          </Badge>
                          <span>Écarts de Savoir-faire (Know-How)</span>
                        </CardTitle>
                        <CardDescription>
                          Basé sur le coefficient de polyvalence F1 + F2 + F3
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Résumé EKH */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl bg-blue-500/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Coefficient Moyen</p>
                            <p className="text-2xl font-bold text-blue-600">{formatPercentage(synthesis.ekhResult.coefficientCompetence * 100)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-primary/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Score Financier EKH</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(synthesis.ekhResult.scoreFinancierEKH)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-red-500/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Pertes EKH</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(synthesis.ekhResult.pertesConstatees)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-green-500/10 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Économies EKH</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(synthesis.ekhResult.economiesEKH)}</p>
                          </div>
                        </div>

                        {/* Tableau EKH par salarié */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-blue-500/10">
                                <th className="text-left py-2 px-3">Nom Salarié</th>
                                <th className="text-left py-2 px-3">Catégorie</th>
                                <th className="text-right py-2 px-3">Coefficient</th>
                                <th className="text-right py-2 px-3">Score Fin.</th>
                                <th className="text-right py-2 px-3">Pertes</th>
                                <th className="text-right py-2 px-3">PPR</th>
                                <th className="text-right py-2 px-3">Économies</th>
                                <th className="text-right py-2 px-3">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {synthesis.ekhResult.ekhParSalarie.map((row) => (
                                <tr key={row.employeeId} className="border-b border-border/30 hover:bg-muted/20">
                                  <td className="py-2 px-3 font-medium">{row.nomSalarie}</td>
                                  <td className="py-2 px-3 text-muted-foreground">{row.categoriePro}</td>
                                  <td className="py-2 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Progress value={row.coefficientCompetence * 100} className="w-16 h-2 [&>div]:bg-blue-500" />
                                      <span className="font-mono">{formatPercentage(row.coefficientCompetence * 100)}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-primary">{formatCurrency(row.scoreFinancier)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-red-600">{formatCurrency(row.pertesConstatees)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-blue-600">{formatCurrency(row.pprPrevues)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-green-600 font-bold">{formatCurrency(row.economiesRealisees)}</td>
                                  <td className="py-2 px-3 text-right font-mono">{formatPercentage(row.pertesPercent)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* SYNTHÈSE Tab */}
                <TabsContent value="synthese" className="mt-8 space-y-6">
                  {/* Synthèse Niveau 1 - Par Salarié */}
                  <Card className="bg-card/50 border-border backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-border">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-500" />
                        Synthèse de Performance - NIVEAU 1 (Par Salarié)
                      </CardTitle>
                      <CardDescription>
                        Contribution individuelle à la performance globale
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left py-2 px-3">Nom Salarié</th>
                              <th className="text-left py-2 px-3">Catégorie</th>
                              <th className="text-right py-2 px-3">Part Prime</th>
                              <th className="text-right py-2 px-3">Part Tréso.</th>
                              <th className="text-right py-2 px-3">Contrib. %</th>
                              <th className="text-center py-2 px-3">Note</th>
                              <th className="text-right py-2 px-3">Score Prime</th>
                              <th className="text-right py-2 px-3">Total Éco.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {synthesis.syntheseNiveau1.map((row) => (
                              <tr key={row.employeeId} className="border-b border-border/30 hover:bg-muted/20">
                                <td className="py-2 px-3 font-medium">{row.nomSalarie}</td>
                                <td className="py-2 px-3 text-muted-foreground">{row.categorie}</td>
                                <td className="py-2 px-3 text-right font-mono text-purple-600">{formatCurrency(row.partPrimeContribution)}</td>
                                <td className="py-2 px-3 text-right font-mono text-blue-600">{formatCurrency(row.partTresorerieContribution)}</td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Progress value={row.contributionPercent} className="w-16 h-2" />
                                    <span className="font-mono">{formatPercentage(row.contributionPercent)}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <Badge variant={
                                    row.triTrancheNote === 'A' ? 'default' :
                                    row.triTrancheNote === 'B' ? 'secondary' :
                                    row.triTrancheNote === 'C' ? 'outline' : 'destructive'
                                  }>
                                    {row.triTrancheNote}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-purple-600 font-bold">{formatCurrency(row.scorePrimeTotal)}</td>
                                <td className="py-2 px-3 text-right font-mono text-green-600 font-bold">{formatCurrency(row.totalEconomieRealisee)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Taux économie par indicateur (détail) */}
                      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
                        <h4 className="font-semibold text-foreground mb-3">Taux d'économie par indicateur (par salarié)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 px-2">Salarié</th>
                                <th className="text-right py-2 px-2">ABS</th>
                                <th className="text-right py-2 px-2">DFQ</th>
                                <th className="text-right py-2 px-2">ADT</th>
                                <th className="text-right py-2 px-2">EPD</th>
                                <th className="text-right py-2 px-2">EKH</th>
                                <th className="text-right py-2 px-2 font-bold">TOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {synthesis.syntheseNiveau1.slice(0, 5).map((row) => (
                                <tr key={row.employeeId} className="border-b border-border/30">
                                  <td className="py-1 px-2">{row.nomSalarie}</td>
                                  <td className="py-1 px-2 text-right font-mono">{formatPercentage(row.tauxEconomieABS)}</td>
                                  <td className="py-1 px-2 text-right font-mono">{formatPercentage(row.tauxEconomieDFQ)}</td>
                                  <td className="py-1 px-2 text-right font-mono">{formatPercentage(row.tauxEconomieADT)}</td>
                                  <td className="py-1 px-2 text-right font-mono">{formatPercentage(row.tauxEconomieEPD)}</td>
                                  <td className="py-1 px-2 text-right font-mono">{formatPercentage(row.tauxEconomieEKH)}</td>
                                  <td className="py-1 px-2 text-right font-mono font-bold text-primary">{formatPercentage(row.totalTauxEconomie)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Synthèse Niveau 2 - Par Indicateur */}
                  <Card className="bg-card/50 border-border backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-border">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-500" />
                        Synthèse de Performance - NIVEAU 2 (Par Indicateur)
                      </CardTitle>
                      <CardDescription>
                        Performance globale par type d'indicateur
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {synthesis.syntheseNiveau2.map((item, index) => {
                          const kpiCode = ['ABS', 'DFQ', 'ADT', 'EPD', 'EKH'][index];
                          const visual = kpiVisuals[kpiCode as keyof typeof kpiVisuals];
                          const performance = item.objectifLigne > 0
                            ? (item.economiesRealisees / item.objectifLigne) * 100
                            : 0;
                          return (
                            <Card key={item.indicateur} className="bg-muted/20">
                              <CardContent className="p-4 text-center">
                                <Badge className={cn(
                                  "mb-3",
                                  `bg-gradient-to-r ${visual?.gradient || 'from-gray-500 to-gray-600'} text-white`
                                )}>
                                  {kpiCode}
                                </Badge>
                                <p className="text-xs text-muted-foreground mb-2">{item.indicateur}</p>
                                <p className="text-sm text-muted-foreground">Objectif:</p>
                                <p className="text-lg font-bold text-foreground">{formatCurrency(item.objectifLigne)}</p>
                                <p className="text-sm text-muted-foreground mt-2">Économies:</p>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(item.economiesRealisees)}</p>
                                <Progress value={performance} className="h-2 mt-3" />
                                <p className="text-xs text-muted-foreground mt-1">{formatPercentage(performance)} réalisé</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Synthèse Niveau 3 - Global */}
                  <Card className="bg-card/50 border-primary/30 backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Synthèse de Performance - NIVEAU 3 (Global)
                      </CardTitle>
                      <CardDescription>
                        Distribution finale des économies - 67% Trésorerie / 33% Primes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-center">
                          <Wallet className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground mb-2">Flux Trésorerie (67%)</p>
                          <p className="text-3xl font-bold text-blue-600">{formatCurrency(synthesis.syntheseNiveau3.fluxTresorerie)}</p>
                        </div>
                        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-center">
                          <Award className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground mb-2">Sorties Primes (33%)</p>
                          <p className="text-3xl font-bold text-purple-600">{formatCurrency(synthesis.syntheseNiveau3.sortiesPrimes)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* RÉPARTITION Tab */}
                <TabsContent value="repartition" className="mt-8 space-y-6">
                  {/* Répartition Niveau 1 - Par Salarié */}
                  <Card className="bg-card/50 border-border backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border">
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-500" />
                        Répartition des Primes - NIVEAU 1 (Par Salarié)
                      </CardTitle>
                      <CardDescription>
                        Détail prévisionnel et réalisé par salarié et par indicateur
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left py-2 px-2" rowSpan={2}>Salarié</th>
                              <th className="text-center py-1 px-1 bg-orange-500/10" colSpan={2}>ABS</th>
                              <th className="text-center py-1 px-1 bg-rose-500/10" colSpan={2}>DFQ</th>
                              <th className="text-center py-1 px-1 bg-red-500/10" colSpan={2}>ADT</th>
                              <th className="text-center py-1 px-1 bg-violet-500/10" colSpan={2}>EPD</th>
                              <th className="text-center py-1 px-1 bg-blue-500/10" colSpan={2}>EKH</th>
                              <th className="text-center py-1 px-1 bg-primary/10" colSpan={2}>TOTAL</th>
                            </tr>
                            <tr className="border-b border-border">
                              <th className="text-right py-1 px-1 text-[10px]">Prime</th>
                              <th className="text-right py-1 px-1 text-[10px]">Tréso</th>
                              <th className="text-right py-1 px-1 text-[10px]">Prime</th>
                              <th className="text-right py-1 px-1 text-[10px]">Tréso</th>
                              <th className="text-right py-1 px-1 text-[10px]">Prime</th>
                              <th className="text-right py-1 px-1 text-[10px]">Tréso</th>
                              <th className="text-right py-1 px-1 text-[10px]">Prime</th>
                              <th className="text-right py-1 px-1 text-[10px]">Tréso</th>
                              <th className="text-right py-1 px-1 text-[10px]">Prime</th>
                              <th className="text-right py-1 px-1 text-[10px]">Tréso</th>
                              <th className="text-right py-1 px-1 text-[10px] font-bold">Prime</th>
                              <th className="text-right py-1 px-1 text-[10px] font-bold">Tréso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {synthesis.repartitionNiveau1.slice(0, 10).map((row) => (
                              <tr key={row.employeeId} className="border-b border-border/30 hover:bg-muted/20">
                                <td className="py-1 px-2 font-medium truncate max-w-[100px]">{row.nomSalarie}</td>
                                <td className="py-1 px-1 text-right font-mono text-purple-600">{formatCurrency(row.realisePrimeABS)}</td>
                                <td className="py-1 px-1 text-right font-mono text-blue-600">{formatCurrency(row.realiseTresorerieABS)}</td>
                                <td className="py-1 px-1 text-right font-mono text-purple-600">{formatCurrency(row.realisePrimeDFQ)}</td>
                                <td className="py-1 px-1 text-right font-mono text-blue-600">{formatCurrency(row.realiseTresorerieDFQ)}</td>
                                <td className="py-1 px-1 text-right font-mono text-purple-600">{formatCurrency(row.realisePrimeADT)}</td>
                                <td className="py-1 px-1 text-right font-mono text-blue-600">{formatCurrency(row.realiseTresorerieADT)}</td>
                                <td className="py-1 px-1 text-right font-mono text-purple-600">{formatCurrency(row.realisePrimeEPD)}</td>
                                <td className="py-1 px-1 text-right font-mono text-blue-600">{formatCurrency(row.realiseTresorerieEPD)}</td>
                                <td className="py-1 px-1 text-right font-mono text-purple-600">{formatCurrency(row.realisePrimeEKH)}</td>
                                <td className="py-1 px-1 text-right font-mono text-blue-600">{formatCurrency(row.realiseTresorerieEKH)}</td>
                                <td className="py-1 px-1 text-right font-mono text-purple-600 font-bold">{formatCurrency(row.totalRealisePrime)}</td>
                                <td className="py-1 px-1 text-right font-mono text-blue-600 font-bold">{formatCurrency(row.totalRealiseTresorerie)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Répartition Niveau 2 - Par Indicateur */}
                  <Card className="bg-card/50 border-border backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-500" />
                        Répartition des Primes - NIVEAU 2 (Par Indicateur)
                      </CardTitle>
                      <CardDescription>
                        Totaux prévisionnels et réalisés par indicateur
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left py-3 px-4">Indicateur</th>
                              <th className="text-right py-3 px-4">Prévi. Prime</th>
                              <th className="text-right py-3 px-4">Prévi. Tréso.</th>
                              <th className="text-right py-3 px-4">Réalisé Prime</th>
                              <th className="text-right py-3 px-4">Réalisé Tréso.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {synthesis.repartitionNiveau2.map((row, index) => {
                              const kpiCode = ['ABS', 'DFQ', 'ADT', 'EPD', 'EKH'][index];
                              const visual = kpiVisuals[kpiCode as keyof typeof kpiVisuals];
                              return (
                                <tr key={row.indicateur} className="border-b border-border/50 hover:bg-muted/20">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <Badge className={cn(
                                        `bg-gradient-to-r ${visual?.gradient || 'from-gray-500 to-gray-600'} text-white`
                                      )}>
                                        {kpiCode}
                                      </Badge>
                                      <span className="text-sm">{row.indicateur}</span>
                                    </div>
                                  </td>
                                  <td className="text-right py-3 px-4 font-mono text-muted-foreground">{formatCurrency(row.totalPrevisionnelPrime)}</td>
                                  <td className="text-right py-3 px-4 font-mono text-muted-foreground">{formatCurrency(row.totalPrevisionnelTresorerie)}</td>
                                  <td className="text-right py-3 px-4 font-mono text-purple-600 font-bold">{formatCurrency(row.totalRealisePrime)}</td>
                                  <td className="text-right py-3 px-4 font-mono text-blue-600 font-bold">{formatCurrency(row.totalRealiseTresorerie)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gradient-to-r from-primary/10 to-purple-500/10 font-bold">
                              <td className="py-3 px-4">TOTAL GÉNÉRAL</td>
                              <td className="py-3 px-4 text-right font-mono">{formatCurrency(synthesis.totalRepartition.totalPrevisionnelPrime)}</td>
                              <td className="py-3 px-4 text-right font-mono">{formatCurrency(synthesis.totalRepartition.totalPrevisionnelTresorerie)}</td>
                              <td className="py-3 px-4 text-right font-mono text-purple-600">{formatCurrency(synthesis.totalRepartition.totalRealisePrime)}</td>
                              <td className="py-3 px-4 text-right font-mono text-blue-600">{formatCurrency(synthesis.totalRepartition.totalRealiseTresorerie)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Distribution visuelle */}
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Award className="w-8 h-8 text-purple-500" />
                              <div>
                                <p className="font-semibold text-foreground">Total Primes (33%)</p>
                                <p className="text-xs text-muted-foreground">Distribution aux salariés</p>
                              </div>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{formatCurrency(synthesis.totalRepartition.totalRealisePrime)}</p>
                          </div>
                          <Progress value={33} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
                        </div>

                        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Wallet className="w-8 h-8 text-blue-500" />
                              <div>
                                <p className="font-semibold text-foreground">Total Trésorerie (67%)</p>
                                <p className="text-xs text-muted-foreground">Flux financier entreprise</p>
                              </div>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(synthesis.totalRepartition.totalRealiseTresorerie)}</p>
                          </div>
                          <Progress value={67} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Distribution Tab (legacy - kept for backward compatibility) */}
                <TabsContent value="distribution" className="mt-8 hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Distribution Chart */}
                    <Card className="bg-card/50 border-border backdrop-blur-xl">
                      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-purple-500" />
                          Distribution des Économies
                        </CardTitle>
                        <CardDescription>
                          Répartition FIXE 67% Trésorerie / 33% Primes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        {/* Visual Distribution */}
                        <div className="relative h-64 mb-8">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Total Économies</p>
                              <p className="text-2xl font-bold text-foreground">
                                {formatCurrency(synthesis.totalEconomies)}
                              </p>
                            </div>
                          </div>

                          {/* Circle Progress */}
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="15"
                              className="text-muted/20"
                            />
                            {/* Trésorerie 67% */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="url(#tresorerieGradient)"
                              strokeWidth="15"
                              strokeDasharray={`${67 * 2.51} ${100 * 2.51}`}
                              strokeDashoffset="0"
                              transform="rotate(-90 50 50)"
                            />
                            {/* Primes 33% */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="url(#primesGradient)"
                              strokeWidth="15"
                              strokeDasharray={`${33 * 2.51} ${100 * 2.51}`}
                              strokeDashoffset={`${-67 * 2.51}`}
                              transform="rotate(-90 50 50)"
                            />
                            <defs>
                              <linearGradient id="tresorerieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#06b6d4" />
                              </linearGradient>
                              <linearGradient id="primesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#ec4899" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-cyan-500" />
                              <div>
                                <p className="font-semibold text-foreground">Flux Trésorerie</p>
                                <p className="text-xs text-muted-foreground">67% des économies</p>
                              </div>
                            </div>
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(synthesis.fluxTresorerie)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
                              <div>
                                <p className="font-semibold text-foreground">Sorties Primes</p>
                                <p className="text-xs text-muted-foreground">33% des économies</p>
                              </div>
                            </div>
                            <p className="text-xl font-bold text-purple-600">
                              {formatCurrency(synthesis.sortiesPrimes)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistics Card */}
                    <Card className="bg-card/50 border-border backdrop-blur-xl">
                      <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-cyan-500" />
                          Statistiques de la Période
                        </CardTitle>
                        <CardDescription>
                          {periodStart} au {periodEnd}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Line Info */}
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-3 mb-4">
                            <Building2 className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-semibold text-foreground">{synthesis.businessLineName}</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedBusinessLineData?.team_leader && `Team Leader: ${selectedBusinessLineData.team_leader}`}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-lg bg-background/50">
                              <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
                              <p className="text-xs text-muted-foreground">Employés</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-background/50">
                              <p className="text-2xl font-bold text-foreground">{synthesis.totalIncidents}</p>
                              <p className="text-xs text-muted-foreground">Incidents</p>
                            </div>
                          </div>
                        </div>

                        {/* KPI Breakdown */}
                        <div className="space-y-3">
                          <p className="font-semibold text-foreground">Répartition par KPI</p>
                          {synthesis.kpiResults.map((kpi) => {
                            const percentOfTotal = synthesis.totalPertes > 0
                              ? (kpi.pertesConstatees / synthesis.totalPertes) * 100
                              : 0;
                            return (
                              <div key={kpi.kpiCode} className="flex items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "w-12 justify-center",
                                    `bg-gradient-to-r ${kpiVisuals[kpi.kpiCode as keyof typeof kpiVisuals]?.gradient || "from-gray-500 to-gray-600"} text-white border-none`
                                  )}
                                >
                                  {kpi.kpiCode}
                                </Badge>
                                <div className="flex-1">
                                  <Progress
                                    value={percentOfTotal}
                                    className="h-2"
                                  />
                                </div>
                                <span className="text-xs font-mono w-12 text-right">
                                  {formatPercentage(percentOfTotal, 0)}
                                </span>
                              </div>
                            );
                          })}

                          {/* EKH */}
                          {synthesis.ekhResult && (
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="w-12 justify-center bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-none"
                              >
                                EKH
                              </Badge>
                              <div className="flex-1">
                                <Progress
                                  value={synthesis.totalPertes > 0 ? (synthesis.ekhResult.pertesConstatees / synthesis.totalPertes) * 100 : 0}
                                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500"
                                />
                              </div>
                              <span className="text-xs font-mono w-12 text-right">
                                {formatPercentage(synthesis.totalPertes > 0 ? (synthesis.ekhResult.pertesConstatees / synthesis.totalPertes) * 100 : 0, 0)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* PPR Info */}
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <p className="font-semibold text-foreground">PPR Configuré</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(pprData.ppr_annuel)}</p>
                              <p className="text-xs text-muted-foreground">Annuel</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(pprData.ppr_trimestriel)}</p>
                              <p className="text-xs text-muted-foreground">Trimestriel</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(pprData.ppr_hebdomadaire)}</p>
                              <p className="text-xs text-muted-foreground">Hebdo</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!synthesis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Calculator className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Prêt pour le calcul
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sélectionnez une ligne d'activité et une période, puis cliquez sur "Calculer"
              pour voir les performances de votre équipe.
            </p>
          </motion.div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between pt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/modules/module3')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          {synthesis && (
            <Button
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter en PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
