/**
 * ============================================
 * CENTRE DE PERFORMANCE GLOBALE ET PAR INDICATEURS
 * ============================================
 *
 * Cette page affiche les données de performance transférées depuis PerformanceRecapPage.
 * Elle ne fait AUCUN calcul - uniquement de l'affichage des données préexistantes.
 *
 * Sources de données:
 * 1. localStorage 'hcm_bulletin_performances' (transfert direct depuis PerformanceRecapPage)
 * 2. localStorage 'hcm_performance_data' (sauvegardé par PerformanceDataContext)
 *
 * Les 6 tableaux affichés:
 * - SECTION 1: Performance Globale de chaque salarié
 * - SECTION 2: Performance Indicateur Absentéisme
 * - SECTION 3: Performance Indicateur Défauts de Qualité
 * - SECTION 4: Performance Indicateur Accidents de Travail
 * - SECTION 5: Performance Indicateur Délai de Production
 * - SECTION 6: Performance Indicateur Efficacité KH
 * - TOTAL GÉNÉRAL: Répartition des Performances
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompany } from '@/contexts/CompanyContext';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Users,
  Building2,
  Award,
  UserCircle,
  AlertTriangle,
  Zap,
  Clock,
  Target,
  PiggyBank,
  RefreshCw,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';

// Synchronisation avec le Calendrier Intelligent
import { calendarEventBus, useCalendarEvent } from '@/lib/fiscal/CalendarEventBus';
// Smart Calendar Integration - Dernière semaine complétée
import { getLastCompletedWeek, launchDateService, type LastCompletedWeekResult } from '@/lib/fiscal/LaunchDateService';

// Nouveaux composants pour l'amélioration UI
import ExecutiveSummaryGlobal from '../components/ExecutiveSummaryGlobal';
import PerformanceChartsGlobal from '../components/PerformanceChartsGlobal';
import StickyFooterGlobal from '../components/StickyFooterGlobal';
import TopPerformersSection from '../components/TopPerformersSection';
import AlertsSection from '../components/AlertsSection';
import PrimesAnalysisSection from '../components/PrimesAnalysisSection';
import IndicatorRiskAnalysis from '../components/IndicatorRiskAnalysis';
import ChampionsSummaryTable from '../components/ChampionsSummaryTable';

// Composants d'analyse au niveau des salariés
import { EmployeeAnalysisSection, IndicatorEmployeeAnalysis } from '../components/EmployeeAnalysis';

// ============================================
// TYPES - Structure des données transférées
// ============================================

// Structure d'un indicateur (données du localStorage)
interface IndicatorData {
  key: string;
  objectif: number;
  economiesRealisees: number;
  prevPrime: number;
  prevTreso: number;
  realPrime: number;
  realTreso: number;
  totalTemps: number;
  totalFrais: number;
}

// Structure des données employé (depuis hcm_bulletin_performances)
interface EmployeePerformanceData {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  professionalCategory: string;
  globalNote: number;
  grade: string;
  employeePerformance: {
    objectif: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
  };
  // Les indicateurs sont stockés comme un objet { abs: {...}, qd: {...}, ... }
  indicators: Record<string, IndicatorData>;
  fiscalWeek: number;
  fiscalYear: number;
}

interface BusinessLineData {
  id: string;
  name: string;
  employees: EmployeePerformanceData[];
}

// Configuration des indicateurs avec leurs couleurs
const INDICATOR_CONFIGS = [
  { key: 'abs', label: 'Absentéisme', icon: UserCircle, gradient: 'from-orange-500 to-amber-500', gradientLight: 'from-orange-400 to-amber-400', bgLight: 'orange', border: 'orange' },
  { key: 'qd', label: 'Défauts de Qualité', icon: AlertTriangle, gradient: 'from-rose-500 to-pink-500', gradientLight: 'from-rose-400 to-pink-400', bgLight: 'rose', border: 'rose' },
  { key: 'oa', label: 'Accidents de Travail', icon: Zap, gradient: 'from-red-500 to-rose-500', gradientLight: 'from-red-400 to-rose-400', bgLight: 'red', border: 'red' },
  { key: 'ddp', label: 'Délai de Production', icon: Clock, gradient: 'from-blue-500 to-cyan-500', gradientLight: 'from-blue-400 to-cyan-400', bgLight: 'blue', border: 'blue' },
  { key: 'ekh', label: 'Efficacité KH', icon: Target, gradient: 'from-purple-500 to-violet-500', gradientLight: 'from-purple-400 to-violet-400', bgLight: 'purple', border: 'purple' }
];

// ============================================
// CONSTANTS - Optimisation 10K employés
// ============================================
const EMPLOYEES_PER_SECTION = 50; // Pagination par section
const SECTION_IDS = ['global', 'abs', 'qd', 'oa', 'ddp', 'ekh', 'total'] as const;

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function GlobalPerformanceCenterPage() {
  const navigate = useNavigate();
  const { company: currentCompany, loading: isCompanyLoading } = useCompany();

  // États
  const [loading, setLoading] = useState(true);
  const [employeePerformances, setEmployeePerformances] = useState<EmployeePerformanceData[]>([]);
  const [fiscalWeek, setFiscalWeek] = useState<number>(0);
  const [dataSource, setDataSource] = useState<string>('');

  // Smart Calendar - Dernière semaine complétée (avec données)
  const [lastCompletedWeek, setLastCompletedWeek] = useState<LastCompletedWeekResult | null>(null);

  // Date de lancement depuis le Widget Smart Calendar
  const [launchDate, setLaunchDate] = useState<Date | null>(null);

  // Année fiscale calculée depuis la date de lancement du Widget Smart Calendar
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear());

  // Calculer l'année de base depuis lastCompletedWeek
  const baseFiscalYear = useMemo(() => {
    if (lastCompletedWeek?.weekStart) {
      return lastCompletedWeek.weekStart.getFullYear();
    }
    return new Date().getFullYear(); // Fallback
  }, [lastCompletedWeek]);

  // OPTIMISATION 10K: Sections collapsibles (seule 'global' ouverte par défaut)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['global']));

  // OPTIMISATION 10K: Pagination par section { sectionId: nombreAffiché }
  const [employeesShownBySection, setEmployeesShownBySection] = useState<Record<string, number>>({});

  // Helper pour toggler une section
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
        // Initialiser la pagination si pas encore fait
        if (!employeesShownBySection[sectionId]) {
          setEmployeesShownBySection(p => ({ ...p, [sectionId]: EMPLOYEES_PER_SECTION }));
        }
      }
      return newSet;
    });
  }, [employeesShownBySection]);

  // Helper pour voir plus d'employés dans une section
  const showMoreInSection = useCallback((sectionId: string, totalEmployees: number) => {
    setEmployeesShownBySection(prev => ({
      ...prev,
      [sectionId]: Math.min((prev[sectionId] || EMPLOYEES_PER_SECTION) + EMPLOYEES_PER_SECTION, totalEmployees)
    }));
  }, []);

  // Devise
  const [currency, setCurrency] = useState<Currency>('EUR');
  const currencyConfig = CURRENCY_CONFIG[currency];

  // ============================================
  // CHARGEMENT DES DONNÉES DEPUIS LOCALSTORAGE
  // ============================================

  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany?.id) {
        setLoading(false);
        return;
      }

      try {
        // 0. Charger la DERNIÈRE SEMAINE COMPLÉTÉE (avec données)
        const completedWeek = await getLastCompletedWeek(currentCompany.id);
        if (completedWeek) {
          setLastCompletedWeek(completedWeek);
          // Utiliser la semaine complétée comme défaut si localStorage vide
          if (!fiscalWeek) {
            setFiscalWeek(completedWeek.weekNumber);
            setFiscalYear(completedWeek.weekStart.getFullYear());
          }
          console.log('[GlobalPerformanceCenter] ✅ Last completed week:', completedWeek.periodLabel);
        }

        // Récupérer aussi la date de lancement pour référence
        const config = launchDateService.getConfig();
        if (config?.platformLaunchDate) {
          setLaunchDate(new Date(config.platformLaunchDate));
        }

        // Charger la devise depuis company_performance_scores.factors.selectedCurrency
        // (même source que PerformanceCenterPage pour cohérence)
        const { data: scoreData } = await import('@/integrations/supabase/client')
          .then(mod => mod.supabase)
          .then(supabase => supabase
            .from('company_performance_scores')
            .select('factors')
            .eq('company_id', currentCompany.id)
            .eq('module_number', 1)
            .order('calculation_date', { ascending: false })
            .limit(1)
            .maybeSingle()
          );

        if (scoreData?.factors) {
          const factors = scoreData.factors as any;
          if (factors.selectedCurrency) {
            setCurrency(factors.selectedCurrency as Currency);
            console.log('[GlobalPerformanceCenter] ✅ Currency set to:', factors.selectedCurrency);
          }
        }

        // SOURCE 1: localStorage hcm_bulletin_performances (prioritaire)
        const bulletinDataRaw = localStorage.getItem('hcm_bulletin_performances');
        console.log('[GlobalPerformanceCenter] localStorage hcm_bulletin_performances:', bulletinDataRaw ? 'FOUND' : 'NOT FOUND');

        if (bulletinDataRaw) {
          try {
            const parsed = JSON.parse(bulletinDataRaw);
            console.log('[GlobalPerformanceCenter] Parsed data:', {
              hasData: !!parsed.data,
              dataLength: parsed.data?.length || 0,
              companyId: parsed.companyId,
              currentCompanyId: currentCompany.id,
              fiscalWeek: parsed.fiscalWeek,
              fiscalYear: parsed.fiscalYear
            });

            if (parsed.data && parsed.data.length > 0) {
              // Vérifier la structure du premier employé
              console.log('[GlobalPerformanceCenter] Sample employee:', parsed.data[0]);

              setEmployeePerformances(parsed.data);
              setFiscalWeek(parsed.fiscalWeek || 0);
              setFiscalYear(parsed.fiscalYear || baseFiscalYear);
              setDataSource('hcm_bulletin_performances');
              setLoading(false);
              console.log('[GlobalPerformanceCenter] ✅ Data loaded successfully:', parsed.data.length, 'employees');
              return;
            }
          } catch (parseError) {
            console.error('[GlobalPerformanceCenter] Failed to parse bulletin data:', parseError);
          }
        }

        // SOURCE 2: localStorage hcm_performance_data (fallback)
        const savedData = localStorage.getItem('hcm_performance_data');
        console.log('[GlobalPerformanceCenter] localStorage hcm_performance_data:', savedData ? 'FOUND' : 'NOT FOUND');

        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.employees && parsed.employees.length > 0) {
              console.log('[GlobalPerformanceCenter] Using fallback hcm_performance_data:', parsed.employees.length, 'employees');
              setEmployeePerformances(parsed.employees);
              setDataSource('hcm_performance_data');
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error('[GlobalPerformanceCenter] Failed to parse performance data:', parseError);
          }
        }

        // Aucune donnée trouvée
        console.warn('[GlobalPerformanceCenter] ⚠️ No data found in localStorage');
        toast.warning('Aucune donnée de performance disponible. Veuillez d\'abord visiter le Récapitulatif des Performances.');
        setLoading(false);

      } catch (error) {
        console.error('[GlobalPerformanceCenter] Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    loadData();
  }, [currentCompany?.id]);

  // ============================================
  // SYNCHRONISATION AVEC LE CALENDRIER INTELLIGENT
  // ============================================

  // État pour les périodes verrouillées (CASCADE mode)
  const [lockedPeriods, setLockedPeriods] = useState<Record<string, boolean>>({});
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(Date.now());

  // Charger les périodes verrouillées au montage
  useEffect(() => {
    if (currentCompany?.id) {
      launchDateService.loadConfig(currentCompany.id).then(() => {
        const locked = launchDateService.getAllLockedPeriodsFlat();
        setLockedPeriods(locked);
        console.log('[GlobalPerformanceCenter] 🔒 Périodes verrouillées chargées:', Object.keys(locked).length);
      });
    }
  }, [currentCompany?.id]);

  // Écouter les événements DATA_ENTERED pour notifier les nouvelles saisies
  useCalendarEvent('DATA_ENTERED', (event) => {
    console.log('[GlobalPerformanceCenter] 📢 Nouvelle saisie de coûts détectée:', event.payload);
    setLastDataUpdate(Date.now());
    toast.info('Nouvelles données de coûts', {
      description: `${event.payload.entryCount} entrée(s) pour ${event.payload.kpiType.toUpperCase()} ajoutée(s)`,
      action: {
        label: 'Actualiser',
        onClick: () => window.location.reload()
      }
    });
  }, []);

  // Écouter les mises à jour de configuration calendrier
  useCalendarEvent('CONFIG_UPDATED', (event) => {
    console.log('[GlobalPerformanceCenter] 📅 Configuration calendrier mise à jour:', event.payload.config);
    // Rafraîchir les périodes verrouillées
    const locked = launchDateService.getAllLockedPeriodsFlat();
    setLockedPeriods(locked);
  }, []);

  // Écouter les verrouillages de période
  useCalendarEvent('PERIOD_LOCKED', (event) => {
    console.log('[GlobalPerformanceCenter] 🔒 Période verrouillée/déverrouillée:', event.payload);
    setLockedPeriods(prev => ({
      ...prev,
      [event.payload.periodKey]: event.payload.isLocked,
    }));
    // En mode CASCADE, rafraîchir toutes les périodes
    if (event.payload.cascadeMode) {
      const locked = launchDateService.getAllLockedPeriodsFlat();
      setLockedPeriods(locked);
    }
  }, []);

  // ============================================
  // ORGANISATION DES DONNÉES PAR LIGNE D'ACTIVITÉ
  // ============================================

  const businessLinesData = useMemo<BusinessLineData[]>(() => {
    const blMap = new Map<string, BusinessLineData>();

    employeePerformances.forEach(emp => {
      if (!blMap.has(emp.businessLineId)) {
        blMap.set(emp.businessLineId, {
          id: emp.businessLineId,
          name: emp.businessLineName,
          employees: []
        });
      }
      blMap.get(emp.businessLineId)!.employees.push(emp);
    });

    // Trier les employés de chaque ligne par score global (desc) puis par nom (asc)
    const result = Array.from(blMap.values());
    result.forEach(bl => {
      bl.employees.sort((a, b) => {
        // 1. Score global décroissant (les meilleurs en premier)
        const scoreA = a.globalNote ?? 0;
        const scoreB = b.globalNote ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        // 2. Nom alphabétique (A-Z) en cas d'égalité
        const nameCompare = (a.employeeName || '').localeCompare(b.employeeName || '', 'fr', { sensitivity: 'base' });
        if (nameCompare !== 0) return nameCompare;
        // 3. ID pour garantir un ordre stable
        return (a.employeeId || '').localeCompare(b.employeeId || '');
      });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [employeePerformances]);

  // ============================================
  // CALCUL DES TOTAUX GLOBAUX (pour les pourcentages de contribution)
  // ============================================

  const globalTotals = useMemo(() => {
    const totals = {
      objectif: 0,
      economiesRealisees: 0,
      prevPrime: 0,
      prevTreso: 0,
      realPrime: 0,
      realTreso: 0,
      byIndicator: {} as Record<string, { eco: number; ppr: number; prevPrime: number; prevTreso: number; realPrime: number; realTreso: number }>
    };

    // Initialiser les totaux par indicateur
    INDICATOR_CONFIGS.forEach(ind => {
      totals.byIndicator[ind.key] = { eco: 0, ppr: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 };
    });

    employeePerformances.forEach(emp => {
      totals.objectif += emp.employeePerformance.objectif || 0;
      totals.economiesRealisees += emp.employeePerformance.economiesRealisees || 0;
      totals.prevPrime += emp.employeePerformance.prevPrime || 0;
      totals.prevTreso += emp.employeePerformance.prevTreso || 0;
      totals.realPrime += emp.employeePerformance.realPrime || 0;
      totals.realTreso += emp.employeePerformance.realTreso || 0;

      // Totaux par indicateur - indicators est un objet { abs: {...}, qd: {...}, ... }
      if (emp.indicators && typeof emp.indicators === 'object') {
        INDICATOR_CONFIGS.forEach(indConfig => {
          const ind = emp.indicators[indConfig.key];
          if (ind && totals.byIndicator[indConfig.key]) {
            totals.byIndicator[indConfig.key].eco += ind.economiesRealisees || 0;
            totals.byIndicator[indConfig.key].ppr += ind.objectif || 0;
            totals.byIndicator[indConfig.key].prevPrime += ind.prevPrime || 0;
            totals.byIndicator[indConfig.key].prevTreso += ind.prevTreso || 0;
            totals.byIndicator[indConfig.key].realPrime += ind.realPrime || 0;
            totals.byIndicator[indConfig.key].realTreso += ind.realTreso || 0;
          }
        });
      }
    });

    return totals;
  }, [employeePerformances]);

  // ============================================
  // DONNÉES POUR EXECUTIVE SUMMARY & CHARTS
  // ============================================

  const departmentsSummary = useMemo(() => {
    return businessLinesData.map(bl => {
      const totals = bl.employees.reduce((acc, emp) => ({
        objectif: acc.objectif + (emp.employeePerformance?.objectif || 0),
        economies: acc.economies + (emp.employeePerformance?.economiesRealisees || 0),
        prevPrime: acc.prevPrime + (emp.employeePerformance?.prevPrime || 0),
        prevTreso: acc.prevTreso + (emp.employeePerformance?.prevTreso || 0),
        realPrime: acc.realPrime + (emp.employeePerformance?.realPrime || 0),
        realTreso: acc.realTreso + (emp.employeePerformance?.realTreso || 0)
      }), { objectif: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });

      const contributionPct = globalTotals.economiesRealisees > 0
        ? (totals.economies / globalTotals.economiesRealisees) * 100
        : 0;

      return {
        id: bl.id,
        name: bl.name,
        employeeCount: bl.employees.length,
        totalObjectif: totals.objectif,
        totalEconomies: totals.economies,
        totalPrevPrime: totals.prevPrime,
        totalPrevTreso: totals.prevTreso,
        totalRealPrime: totals.realPrime,
        totalRealTreso: totals.realTreso,
        contributionPct
      };
    });
  }, [businessLinesData, globalTotals.economiesRealisees]);

  // Taux d'atteinte global
  const tauxAtteinteGlobal = useMemo(() => {
    return globalTotals.objectif > 0
      ? (globalTotals.economiesRealisees / globalTotals.objectif) * 100
      : 0;
  }, [globalTotals]);

  // ============================================
  // HELPER: Obtenir les données d'un indicateur pour un employé
  // ============================================

  const getIndicatorData = (emp: EmployeePerformanceData, indicatorKey: string): IndicatorData | null => {
    // Les indicateurs sont stockés comme un objet { abs: {...}, qd: {...}, ... }
    const indData = emp.indicators?.[indicatorKey];
    if (!indData) return null;
    return {
      key: indicatorKey,
      objectif: indData.objectif || 0,
      economiesRealisees: indData.economiesRealisees || 0,
      prevPrime: indData.prevPrime || 0,
      prevTreso: indData.prevTreso || 0,
      realPrime: indData.realPrime || 0,
      realTreso: indData.realTreso || 0,
      totalTemps: indData.totalTemps || 0,
      totalFrais: indData.totalFrais || 0
    };
  };

  // ============================================
  // RENDU: ÉTAT DE CHARGEMENT
  // ============================================

  if (loading || isCompanyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <HCMLoader text="Chargement des données de performance..." />
      </div>
    );
  }

  // ============================================
  // RENDU: PAS DE DONNÉES
  // ============================================

  if (employeePerformances.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5" />
                Aucune donnée disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-amber-600 dark:text-amber-400">
                Les données de performance n'ont pas encore été calculées ou transférées.
              </p>
              <p className="text-sm text-muted-foreground">
                Veuillez d'abord visiter la page "Récapitulatif des Performances Réalisées" pour générer les données.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/modules/module3/performance-center')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
                <Button
                  onClick={() => navigate('/modules/module3/performance-recap')}
                  className="gap-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 text-white"
                >
                  <BarChart3 className="w-4 h-4" />
                  Aller au Récapitulatif des Performances
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
            <Award className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              HCM COST SAVINGS - Centre de Performance
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Centre de Performance Globale et par Indicateurs
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Vue consolidée des performances de tous les salariés par indicateur socio-économique
          </p>

          {/* Info Badge */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="outline" className="gap-1 py-1 px-3">
              <Users className="w-3 h-3" />
              {employeePerformances.length} salariés
            </Badge>
            <Badge variant="outline" className="gap-1 py-1 px-3">
              <Building2 className="w-3 h-3" />
              {businessLinesData.length} lignes d'activité
            </Badge>
            <Badge variant="outline" className="gap-1 py-1 px-3">
              Semaine fiscale: S{fiscalWeek} - {fiscalYear}
            </Badge>
          </div>

          {/* Boutons de navigation */}
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Button
              onClick={() => navigate('/modules/module3/performance-center')}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Centre de la Performance
            </Button>
            <Button
              onClick={() => navigate('/modules/module3/performance-calendar')}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
            >
              <Calendar className="w-4 h-4" />
              CALENDRIER DE SUIVI DES PERFORMANCES
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('hcm_bulletin_performances');
                window.location.reload();
              }}
              variant="outline"
              className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser les données
            </Button>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* EXECUTIVE SUMMARY - 5 KPI CARDS */}
        {/* ============================================ */}
        <ExecutiveSummaryGlobal
          departments={departmentsSummary}
          totalEmployees={employeePerformances.length}
          fiscalWeek={fiscalWeek}
          fiscalYear={fiscalYear}
          currency={currency}
        />

        {/* ============================================ */}
        {/* GRAPHIQUES - BARRES + DONUT */}
        {/* ============================================ */}
        <PerformanceChartsGlobal
          departments={departmentsSummary}
          currency={currency}
        />

        {/* ============================================ */}
        {/* TOP PERFORMERS - 3 BLOCS VERTS */}
        {/* ============================================ */}
        <TopPerformersSection
          departments={departmentsSummary}
          currency={currency}
        />

        {/* ============================================ */}
        {/* ALERTES - 3 BLOCS ORANGE/ROUGE */}
        {/* ============================================ */}
        <AlertsSection
          departments={departmentsSummary}
          currency={currency}
        />

        {/* ============================================ */}
        {/* ANALYSE PRIMES - 2 BLOCS */}
        {/* ============================================ */}
        <PrimesAnalysisSection
          departments={departmentsSummary}
          currency={currency}
        />

        {/* ============================================ */}
        {/* ANALYSE PAR INDICATEUR DE RISQUE - 5 CARTES */}
        {/* ============================================ */}
        <IndicatorRiskAnalysis
          employeePerformances={employeePerformances}
          currency={currency}
        />

        {/* ============================================ */}
        {/* RÉCAPITULATIF CHAMPIONS */}
        {/* ============================================ */}
        <ChampionsSummaryTable
          employeePerformances={employeePerformances}
        />

        {/* ============================================ */}
        {/* SECTION 1: PERFORMANCE GLOBALE DE CHAQUE SALARIÉ */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-indigo-200 dark:border-indigo-800 overflow-hidden">
            {/* OPTIMISATION 10K: Header cliquable pour collapse avec mini-KPIs */}
            <CardHeader
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white cursor-pointer hover:from-indigo-700 hover:to-violet-700 transition-colors"
              onClick={() => toggleSection('global')}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-lg font-bold">PERFORMANCE GLOBALE</span>
                  </div>
                  {/* Mini-KPIs toujours visibles */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 rounded bg-white/20 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {employeePerformances.length}
                    </span>
                    <span className="text-white/60 hidden sm:inline">│</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-100 hidden sm:flex items-center gap-1">
                      <PiggyBank className="w-3 h-3" />
                      {globalTotals.economiesRealisees >= 1000000
                        ? `${(globalTotals.economiesRealisees / 1000000).toFixed(1)}M`
                        : globalTotals.economiesRealisees >= 1000
                        ? `${(globalTotals.economiesRealisees / 1000).toFixed(0)}K`
                        : globalTotals.economiesRealisees.toFixed(0)} {currencyConfig.symbol}
                    </span>
                    <span className="text-white/60 hidden md:inline">│</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded hidden md:flex items-center gap-1",
                      tauxAtteinteGlobal >= 80 ? "bg-emerald-500/30 text-emerald-100" :
                      tauxAtteinteGlobal >= 50 ? "bg-amber-500/30 text-amber-100" : "bg-red-500/30 text-red-100"
                    )}>
                      <Target className="w-3 h-3" />
                      {tauxAtteinteGlobal.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {expandedSections.has('global') ? (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                )}
              </CardTitle>
            </CardHeader>

            {/* OPTIMISATION 10K: Contenu rendu uniquement si section expanded */}
            {expandedSections.has('global') && (
            <CardContent className="p-0">
              {businessLinesData.map((bl, blIndex) => {
                // OPTIMISATION 10K: Pagination par business line dans la section global
                const sectionKey = `global-${bl.id}`;
                const currentShown = employeesShownBySection[sectionKey] || EMPLOYEES_PER_SECTION;
                const visibleEmployees = bl.employees.slice(0, currentShown);
                const hasMoreEmployees = currentShown < bl.employees.length;

                return (
                <div key={bl.id} className={blIndex > 0 ? 'border-t border-indigo-200 dark:border-indigo-800' : ''}>
                  {/* Header ligne d'activité */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-indigo-900 dark:text-indigo-100">{bl.name}</span>
                    <Badge className="bg-indigo-500 text-white ml-2">{bl.employees.length} salariés</Badge>
                  </div>

                  {/* Section Analyse des salariés (accordéon dépliable) */}
                  <EmployeeAnalysisSection
                    employees={bl.employees}
                    departmentName={bl.name}
                    departmentId={bl.id}
                    globalTotalEconomies={globalTotals.economiesRealisees}
                    currency={currency}
                  />

                  {/* Tableau */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100">
                          <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Nom du salarié</th>
                          <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Objectif (semaine)</th>
                          <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ÉCONOMIES RÉALISÉES</th>
                          <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prév. Prime</th>
                          <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prév. Trésorerie</th>
                          <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime</th>
                          <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie</th>
                          <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleEmployees.map((emp, empIndex) => {
                          const contribution = globalTotals.economiesRealisees > 0
                            ? (emp.employeePerformance.economiesRealisees / globalTotals.economiesRealisees) * 100
                            : 0;
                          // Mini-barre: % d'atteinte de l'objectif
                          const tauxAtteinte = emp.employeePerformance.objectif > 0
                            ? Math.min(100, (emp.employeePerformance.economiesRealisees / emp.employeePerformance.objectif) * 100)
                            : 0;

                          return (
                            <tr
                              key={emp.employeeId}
                              className={cn(
                                empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-indigo-50/30 dark:bg-indigo-900/10',
                                'hover:bg-indigo-100/50 dark:hover:bg-indigo-800/20 transition-colors'
                              )}
                            >
                              {/* Nom + Mini-barre de progression */}
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{emp.employeeName}</span>
                                  {/* Mini-barre */}
                                  <div className="hidden lg:flex items-center gap-1.5 ml-auto">
                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          tauxAtteinte >= 80 ? "bg-emerald-500" :
                                          tauxAtteinte >= 50 ? "bg-amber-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${Math.min(100, tauxAtteinte)}%` }}
                                      />
                                    </div>
                                    <span className={cn(
                                      "text-[10px] font-medium w-8 text-right",
                                      tauxAtteinte >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                                      tauxAtteinte >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                      {tauxAtteinte.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right">{emp.employeePerformance.objectif.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right font-bold text-green-600 dark:text-green-400">{emp.employeePerformance.economiesRealisees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">{emp.employeePerformance.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">{emp.employeePerformance.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">{emp.employeePerformance.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">{emp.employeePerformance.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              {/* Badge de contribution avec code couleur amélioré */}
                              <td className="py-2 px-3 text-center">
                                <Badge className={cn(
                                  contribution >= 10 ? "bg-emerald-500" :
                                  contribution >= 5 ? "bg-green-500" :
                                  contribution >= 2 ? "bg-amber-500" :
                                  contribution >= 1 ? "bg-orange-500" : "bg-red-500",
                                  "text-white"
                                )}>
                                  {contribution.toFixed(2)}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Total ligne d'activité */}
                        {(() => {
                          const blTotals = bl.employees.reduce((acc, emp) => ({
                            objectif: acc.objectif + emp.employeePerformance.objectif,
                            economies: acc.economies + emp.employeePerformance.economiesRealisees,
                            prevPrime: acc.prevPrime + emp.employeePerformance.prevPrime,
                            prevTreso: acc.prevTreso + emp.employeePerformance.prevTreso,
                            realPrime: acc.realPrime + emp.employeePerformance.realPrime,
                            realTreso: acc.realTreso + emp.employeePerformance.realTreso
                          }), { objectif: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });
                          const blContrib = globalTotals.economiesRealisees > 0 ? (blTotals.economies / globalTotals.economiesRealisees) * 100 : 0;

                          return (
                            <tr className="bg-gradient-to-r from-indigo-200 to-violet-200 dark:from-indigo-800/50 dark:to-violet-800/50 font-bold border-t-2 border-indigo-400">
                              <td className="py-2 px-3 font-bold text-indigo-900 dark:text-indigo-100">TOTAL LIGNE D'ACTIVITÉ</td>
                              <td className="py-2 px-3 text-right font-bold">{blTotals.objectif.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotals.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotals.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                              <td className="py-2 px-3 text-center">
                                <Badge className="bg-indigo-600 text-white">{blContrib.toFixed(2)}%</Badge>
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* OPTIMISATION 10K: Bouton voir plus par business line */}
                  {hasMoreEmployees && (
                    <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 border-t border-indigo-200 dark:border-indigo-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">
                          Affichage de {currentShown} sur {bl.employees.length} salariés
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            showMoreInSection(sectionKey, bl.employees.length);
                          }}
                          className="border-indigo-300 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                        >
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Voir {Math.min(bl.employees.length - currentShown, EMPLOYEES_PER_SECTION)} de plus
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </CardContent>
            )}
          </Card>
        </motion.div>

        {/* ============================================ */}
        {/* SECTIONS 2-6: PERFORMANCE PAR INDICATEUR */}
        {/* OPTIMISATION 10K: Sections collapsibles avec pagination */}
        {/* ============================================ */}
        {INDICATOR_CONFIGS.map((indConfig, indIndex) => {
          // Calcul des mini-KPIs pour cet indicateur
          const indTotals = globalTotals.byIndicator[indConfig.key] || { eco: 0, ppr: 0 };
          const indTauxAtteinte = indTotals.ppr > 0 ? (indTotals.eco / indTotals.ppr) * 100 : 0;

          return (
          <motion.div
            key={indConfig.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + indIndex * 0.1 }}
          >
            <Card className={`border-${indConfig.border}-200 dark:border-${indConfig.border}-800 overflow-hidden`}>
              {/* OPTIMISATION 10K: Header cliquable pour collapse avec mini-KPIs */}
              <CardHeader
                className={`bg-gradient-to-r ${indConfig.gradient} text-white cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => toggleSection(indConfig.key)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <indConfig.icon className="w-5 h-5" />
                      <span className="text-lg font-bold hidden sm:inline">INDICATEUR {indConfig.label.toUpperCase()}</span>
                      <span className="text-lg font-bold sm:hidden">{indConfig.label.toUpperCase()}</span>
                    </div>
                    {/* Mini-KPIs toujours visibles */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded bg-white/20 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {employeePerformances.length}
                      </span>
                      <span className="text-white/60 hidden sm:inline">│</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-100 hidden sm:flex items-center gap-1">
                        <PiggyBank className="w-3 h-3" />
                        {indTotals.eco >= 1000000
                          ? `${(indTotals.eco / 1000000).toFixed(1)}M`
                          : indTotals.eco >= 1000
                          ? `${(indTotals.eco / 1000).toFixed(0)}K`
                          : indTotals.eco.toFixed(0)} {currencyConfig.symbol}
                      </span>
                      <span className="text-white/60 hidden md:inline">│</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded hidden md:flex items-center gap-1",
                        indTauxAtteinte >= 80 ? "bg-emerald-500/30 text-emerald-100" :
                        indTauxAtteinte >= 50 ? "bg-amber-500/30 text-amber-100" : "bg-red-500/30 text-red-100"
                      )}>
                        <Target className="w-3 h-3" />
                        {indTauxAtteinte.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {expandedSections.has(indConfig.key) ? (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 flex-shrink-0" />
                  )}
                </CardTitle>
              </CardHeader>

              {/* OPTIMISATION 10K: Contenu rendu uniquement si section expanded */}
              {expandedSections.has(indConfig.key) && (
              <CardContent className="p-0">
                {businessLinesData.map((bl, blIndex) => {
                  const indicatorTotalEco = globalTotals.byIndicator[indConfig.key]?.eco || 1;

                  // OPTIMISATION 10K: Pagination par business line
                  const sectionKey = `${indConfig.key}-${bl.id}`;
                  const currentShown = employeesShownBySection[sectionKey] || EMPLOYEES_PER_SECTION;
                  const visibleEmployees = bl.employees.slice(0, currentShown);
                  const hasMoreEmployees = currentShown < bl.employees.length;

                  return (
                    <div key={`${indConfig.key}-${bl.id}`} className={blIndex > 0 ? `border-t border-${indConfig.border}-200 dark:border-${indConfig.border}-800` : ''}>
                      {/* Header ligne d'activité */}
                      <div className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r ${indConfig.gradientLight} text-white`}>
                        <Building2 className="w-4 h-4" />
                        <span className="font-semibold">{bl.name}</span>
                        <Badge className="bg-white/20 text-white ml-2">{bl.employees.length} salariés</Badge>
                      </div>

                      {/* Section Analyse des salariés pour cet indicateur */}
                      <IndicatorEmployeeAnalysis
                        employees={bl.employees.map(emp => {
                          const indData = getIndicatorData(emp, indConfig.key);
                          return {
                            employeeId: emp.employeeId,
                            employeeName: emp.employeeName,
                            economiesRealisees: indData?.economiesRealisees || 0,
                            objectif: indData?.objectif || 0,
                            prevPrime: indData?.prevPrime || 0,
                            prevTreso: indData?.prevTreso || 0,
                            realPrime: indData?.realPrime || 0,
                            realTreso: indData?.realTreso || 0,
                            progressPercent: (indData?.objectif || 0) > 0
                              ? ((indData?.economiesRealisees || 0) / (indData?.objectif || 1)) * 100
                              : 0
                          };
                        })}
                        departmentName={bl.name}
                        indicatorKey={indConfig.key}
                        indicatorName={indConfig.label}
                        indicatorColor={indConfig.bgLight}
                        currency={currency}
                      />

                      {/* Tableau */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`bg-${indConfig.bgLight}-50 dark:bg-${indConfig.bgLight}-900/30`}>
                              <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">Indicateur {indConfig.label}</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total temps</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Total frais</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">PPR PREVUES</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">ÉCONOMIES RÉALISÉES</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prév. Prime</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Prév. Trésorerie</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Prime</th>
                              <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Réalisé Trésorerie</th>
                              <th className="text-center py-2 px-3 font-semibold whitespace-nowrap">Contribution %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleEmployees.map((emp, empIndex) => {
                              const indData = getIndicatorData(emp, indConfig.key);
                              if (!indData) return null;

                              const totalTemps = (indData.tempsCalcul || 0) + (indData.tempsPrisEnCompte || 0);
                              const totalFrais = (indData.fraisCollectes || 0) + (indData.fraisPrisEnCompte || 0);
                              const economies = (indData.economiesRealisees || 0) + (indData.economiesRealiseesN2 || 0);
                              const contribution = indicatorTotalEco > 0 ? (economies / indicatorTotalEco) * 100 : 0;

                              return (
                                <tr
                                  key={emp.employeeId}
                                  className={cn(
                                    empIndex % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : `bg-${indConfig.bgLight}-50/30 dark:bg-${indConfig.bgLight}-900/10`,
                                    `hover:bg-${indConfig.bgLight}-100/50 dark:hover:bg-${indConfig.bgLight}-800/20 transition-colors`
                                  )}
                                >
                                  <td className="py-2 px-3 font-medium">{emp.employeeName}</td>
                                  <td className="py-2 px-3 text-right">{totalTemps.toFixed(2)}h</td>
                                  <td className="py-2 px-3 text-right">{totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right">{(indData.pprPrevues || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right font-bold text-green-600 dark:text-green-400">{economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">{(indData.prevPrime || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">{(indData.prevTreso || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">{(indData.realPrime || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">{(indData.realTreso || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-center">
                                    <Badge className={cn(
                                      contribution > 5 ? "bg-green-500" :
                                      contribution > 0 ? "bg-amber-500" : "bg-gray-400",
                                      "text-white"
                                    )}>
                                      {contribution.toFixed(2)}%
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Total ligne d'activité par indicateur */}
                            {(() => {
                              const blTotals = bl.employees.reduce((acc, emp) => {
                                const indData = getIndicatorData(emp, indConfig.key);
                                if (!indData) return acc;
                                return {
                                  totalTemps: acc.totalTemps + (indData.tempsCalcul || 0) + (indData.tempsPrisEnCompte || 0),
                                  totalFrais: acc.totalFrais + (indData.fraisCollectes || 0) + (indData.fraisPrisEnCompte || 0),
                                  pprPrevues: acc.pprPrevues + (indData.pprPrevues || 0),
                                  economies: acc.economies + (indData.economiesRealisees || 0) + (indData.economiesRealiseesN2 || 0),
                                  prevPrime: acc.prevPrime + (indData.prevPrime || 0),
                                  prevTreso: acc.prevTreso + (indData.prevTreso || 0),
                                  realPrime: acc.realPrime + (indData.realPrime || 0),
                                  realTreso: acc.realTreso + (indData.realTreso || 0)
                                };
                              }, { totalTemps: 0, totalFrais: 0, pprPrevues: 0, economies: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 });
                              const blContrib = indicatorTotalEco > 0 ? (blTotals.economies / indicatorTotalEco) * 100 : 0;

                              return (
                                <tr className={`bg-gradient-to-r from-${indConfig.bgLight}-200 to-${indConfig.bgLight}-300 dark:from-${indConfig.bgLight}-800/50 dark:to-${indConfig.bgLight}-700/50 font-bold border-t-2 border-${indConfig.border}-400`}>
                                  <td className={`py-2 px-3 font-bold text-${indConfig.bgLight}-900 dark:text-${indConfig.bgLight}-100`}>TOTAL LIGNE D'ACTIVITÉ</td>
                                  <td className="py-2 px-3 text-right font-bold">{blTotals.totalTemps.toFixed(2)}h</td>
                                  <td className="py-2 px-3 text-right font-bold">{blTotals.totalFrais.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right font-bold">{blTotals.pprPrevues.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.economies.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotals.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">{blTotals.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-right font-bold text-green-700 dark:text-green-300">{blTotals.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                                  <td className="py-2 px-3 text-center">
                                    <Badge className={`bg-${indConfig.bgLight}-600 text-white`}>{blContrib.toFixed(2)}%</Badge>
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {/* OPTIMISATION 10K: Bouton voir plus par business line */}
                      {hasMoreEmployees && (
                        <div className={`px-4 py-3 bg-${indConfig.bgLight}-50 dark:bg-${indConfig.bgLight}-900/30 border-t border-${indConfig.border}-200 dark:border-${indConfig.border}-700`}>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm text-${indConfig.bgLight}-600 dark:text-${indConfig.bgLight}-400`}>
                              Affichage de {currentShown} sur {bl.employees.length} salariés
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                showMoreInSection(sectionKey, bl.employees.length);
                              }}
                              className={`border-${indConfig.border}-300 text-${indConfig.bgLight}-600 hover:bg-${indConfig.bgLight}-100 dark:border-${indConfig.border}-700 dark:text-${indConfig.bgLight}-400`}
                            >
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Voir {Math.min(bl.employees.length - currentShown, EMPLOYEES_PER_SECTION)} de plus
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
              )}
            </Card>
          </motion.div>
        );
        })}

        {/* ============================================ */}
        {/* TOTAL GÉNÉRAL - RÉPARTITION DES PERFORMANCES */}
        {/* OPTIMISATION 10K: Section collapsible */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-2 border-emerald-300 dark:border-emerald-700 overflow-hidden">
            {/* OPTIMISATION 10K: Header cliquable pour collapse avec mini-KPIs */}
            <CardHeader
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white cursor-pointer hover:from-emerald-700 hover:to-green-700 transition-colors"
              onClick={() => toggleSection('total')}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-6 h-6" />
                    <span className="text-lg font-bold">TOTAL GÉNÉRAL</span>
                  </div>
                  {/* Mini-KPIs toujours visibles */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 rounded bg-white/20 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      5 indicateurs
                    </span>
                    <span className="text-white/60 hidden sm:inline">│</span>
                    <span className="px-2 py-0.5 rounded bg-white/30 text-white hidden sm:flex items-center gap-1">
                      <PiggyBank className="w-3 h-3" />
                      {globalTotals.economiesRealisees >= 1000000
                        ? `${(globalTotals.economiesRealisees / 1000000).toFixed(1)}M`
                        : globalTotals.economiesRealisees >= 1000
                        ? `${(globalTotals.economiesRealisees / 1000).toFixed(0)}K`
                        : globalTotals.economiesRealisees.toFixed(0)} {currencyConfig.symbol}
                    </span>
                    <span className="text-white/60 hidden md:inline">│</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded hidden md:flex items-center gap-1 bg-white/20"
                    )}>
                      <Target className="w-3 h-3" />
                      {tauxAtteinteGlobal.toFixed(1)}% atteinte
                    </span>
                  </div>
                </div>
                {expandedSections.has('total') ? (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedSections.has('total') && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
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
                    {INDICATOR_CONFIGS.map((indConfig, idx) => {
                      const indTotals = globalTotals.byIndicator[indConfig.key] || { eco: 0, ppr: 0, prevPrime: 0, prevTreso: 0, realPrime: 0, realTreso: 0 };
                      const totalGlobalEco = Object.values(globalTotals.byIndicator).reduce((sum, t) => sum + t.eco, 0);
                      const partPct = totalGlobalEco > 0 ? (indTotals.eco / totalGlobalEco) * 100 : 0;

                      return (
                        <tr key={indConfig.key} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-emerald-50/30 dark:bg-emerald-900/10'}>
                          <td className="py-3 px-4 font-medium flex items-center gap-2">
                            <indConfig.icon className="w-4 h-4" />
                            {indConfig.label}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{indTotals.ppr.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">{indTotals.eco.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-3 px-4 text-right text-amber-600">{indTotals.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-3 px-4 text-right text-amber-600">{indTotals.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-3 px-4 text-right text-green-600">{indTotals.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-3 px-4 text-right text-green-600">{indTotals.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-3 px-4 text-center"><Badge className="bg-emerald-500 text-white">{partPct.toFixed(2)}%</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const grandTotals = {
                        ppr: Object.values(globalTotals.byIndicator).reduce((sum, t) => sum + t.ppr, 0),
                        eco: Object.values(globalTotals.byIndicator).reduce((sum, t) => sum + t.eco, 0),
                        prevPrime: Object.values(globalTotals.byIndicator).reduce((sum, t) => sum + t.prevPrime, 0),
                        prevTreso: Object.values(globalTotals.byIndicator).reduce((sum, t) => sum + t.prevTreso, 0),
                        realPrime: Object.values(globalTotals.byIndicator).reduce((sum, t) => sum + t.realPrime, 0),
                        realTreso: Object.values(globalTotals.byIndicator).reduce((sum, t) => sum + t.realTreso, 0)
                      };

                      return (
                        <tr className="bg-gradient-to-r from-emerald-200 to-green-200 dark:from-emerald-800/50 dark:to-green-800/50 font-bold border-t-2 border-emerald-400">
                          <td className="py-4 px-4 font-bold text-lg text-emerald-900 dark:text-emerald-100">GRAND TOTAL</td>
                          <td className="py-4 px-4 text-right font-bold text-xl text-indigo-700 dark:text-indigo-300">{grandTotals.ppr.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-4 px-4 text-right font-bold text-xl text-green-700 dark:text-green-300">{grandTotals.eco.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-4 px-4 text-right font-bold text-lg text-amber-700 dark:text-amber-300">{grandTotals.prevPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-4 px-4 text-right font-bold text-lg text-amber-700 dark:text-amber-300">{grandTotals.prevTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-4 px-4 text-right font-bold text-lg text-green-700 dark:text-green-300">{grandTotals.realPrime.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-4 px-4 text-right font-bold text-lg text-green-700 dark:text-green-300">{grandTotals.realTreso.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencyConfig.symbol}</td>
                          <td className="py-4 px-4 text-center"><Badge className="bg-emerald-600 text-white text-lg px-3 py-1">100%</Badge></td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Espace pour le Sticky Footer */}
        <div className="h-20" />
      </div>

      {/* ============================================ */}
      {/* STICKY FOOTER */}
      {/* ============================================ */}
      <StickyFooterGlobal
        totalEmployees={employeePerformances.length}
        totalEconomies={globalTotals.economiesRealisees}
        tauxAtteinte={tauxAtteinteGlobal}
        currency={currency}
      />
    </div>
  );
}
