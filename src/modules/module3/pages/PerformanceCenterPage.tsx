/**
 * ============================================
 * CENTRE DE LA PERFORMANCE
 * ============================================
 *
 * Page: Centre de la performance des lignes d'activités
 * et des salariés par indicateurs socio-économiques
 *
 * Affiche un tableau récapitulatif par ligne d'activité avec:
 * - Nom du salarié
 * - Note globale /10
 * - Grade (A+ à E)
 * - Bouton pour générer le bulletin de performance
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import {
  ArrowLeft,
  ArrowRight,
  Users,
  FileText,
  TrendingUp,
  Building2,
  Award,
  ChevronDown,
  ChevronRight,
  Loader2,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { toast } from 'sonner';
// Smart Calendar Integration - Dernière semaine complétée
import { getLastCompletedWeek, launchDateService, type LastCompletedWeekResult } from '@/lib/fiscal/LaunchDateService';

import {
  EmployeePerformance,
  BusinessLineWithEmployees,
  calculateGlobalNote,
  calculateGrade,
  getGradeColor,
  INDICATOR_LABELS,
  sanitizeEmployeePerformances
} from '../types/performanceCenter';

import PerformanceBulletin from '../components/PerformanceBulletin';
import { createPeriodResultsService, EmployeeDetail } from '../services/PeriodResultsService';
import { createPerformanceCacheService, PerformanceCacheEntry } from '../services/PerformanceCacheService';
import type { BusinessLinePerformance } from '@/contexts/PerformanceDataContext';

// Diagnostic des performances (accessible via window.diagPerformance)
import '../utils/performanceDiagnostic';

// ============================================
// CONSTANTS - Virtualisation 10K employés
// ============================================
const EMPLOYEE_ROW_HEIGHT = 64; // Hauteur d'une ligne employé en pixels
const VIRTUALIZED_LIST_HEIGHT = 480; // Hauteur max du conteneur virtualisé (8 lignes visibles)
const OVERSCAN_COUNT = 5; // Nombre de lignes pré-rendues au-delà du viewport

// ============================================
// COMPOSANT VIRTUALISÉ - LISTE EMPLOYÉS
// ============================================

/**
 * Liste virtualisée des employés pour performances optimales avec 10K+ entrées.
 * Utilise @tanstack/react-virtual pour ne rendre que les lignes visibles.
 *
 * @param employees - Tableau des employés à afficher
 * @param onSelectEmployee - Callback pour sélectionner un employé
 */
interface VirtualizedEmployeeListProps {
  employees: EmployeePerformance[];
  onSelectEmployee: (employee: EmployeePerformance) => void;
}

function VirtualizedEmployeeList({ employees, onSelectEmployee }: VirtualizedEmployeeListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => EMPLOYEE_ROW_HEIGHT,
    overscan: OVERSCAN_COUNT
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="overflow-x-auto">
      {/* En-tête fixe du tableau */}
      <div
        className="bg-slate-100 dark:bg-slate-700/50 grid grid-cols-[1fr,120px,100px,180px] gap-2 px-6 py-3"
        role="row"
        aria-label="En-tête du tableau des performances"
      >
        <div
          className="text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
          role="columnheader"
        >
          Collaborateur
        </div>
        <div
          className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
          role="columnheader"
        >
          Note Globale
        </div>
        <div
          className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
          role="columnheader"
        >
          Grade
        </div>
        <div
          className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
          role="columnheader"
        >
          Bulletin
        </div>
      </div>

      {/* Conteneur scrollable virtualisé */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: Math.min(VIRTUALIZED_LIST_HEIGHT, employees.length * EMPLOYEE_ROW_HEIGHT) }}
        role="table"
        aria-label="Tableau des performances des employés"
        aria-rowcount={employees.length}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualItems.map(virtualRow => {
            const employee = employees[virtualRow.index];
            return (
              <div
                key={employee.id}
                role="row"
                aria-rowindex={virtualRow.index + 1}
                className="absolute top-0 left-0 w-full grid grid-cols-[1fr,120px,100px,180px] gap-2 px-6 items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-slate-200 dark:border-slate-700"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {/* Collaborateur */}
                <div role="cell">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {employee.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {employee.role}
                  </p>
                </div>

                {/* Note Globale */}
                <div role="cell" className="text-center">
                  <span
                    className="font-mono font-bold text-lg text-slate-900 dark:text-white"
                    aria-label={`Note: ${employee.globalNote.toFixed(1)} sur 10`}
                  >
                    {employee.globalNote.toFixed(1)}/10
                  </span>
                </div>

                {/* Grade */}
                <div role="cell" className="flex justify-center">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold text-sm",
                      getGradeColor(employee.grade)
                    )}
                    role="img"
                    aria-label={`Grade ${employee.grade}`}
                  >
                    {employee.grade}
                  </span>
                </div>

                {/* Bouton Bulletin */}
                <div role="cell" className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectEmployee(employee)}
                    className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    aria-label={`Générer le bulletin de performance pour ${employee.name}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Bulletin
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicateur de nombre d'employés */}
      <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {employees.length} collaborateur{employees.length > 1 ? 's' : ''} • Scroll virtualisé pour performances optimales
        </p>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function PerformanceCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company: currentCompany } = useCompany();

  // États
  const [loading, setLoading] = useState(true);
  const [businessLinesWithEmployees, setBusinessLinesWithEmployees] = useState<BusinessLineWithEmployees[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformance | null>(null);

  // État supprimé: employeesShown - remplacé par virtualisation
  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const [weekEnd, setWeekEnd] = useState<Date>(new Date());

  // Données de période validée (pour les totaux de ligne)
  const [periodBusinessLinePerformances, setPeriodBusinessLinePerformances] = useState<BusinessLinePerformance[]>([]);

  // Données de période validée (pour les performances individuelles des employés)
  const [periodEmployeeDetails, setPeriodEmployeeDetails] = useState<EmployeeDetail[]>([]);

  // Devise configurée dans HCM Performance Plan
  const [currency, setCurrency] = useState<Currency>('EUR');

  // Smart Calendar - Dernière semaine complétée (avec données)
  const [lastCompletedWeek, setLastCompletedWeek] = useState<LastCompletedWeekResult | null>(null);

  // Date de lancement depuis le Widget Smart Calendar
  const [launchDate, setLaunchDate] = useState<Date | null>(null);

  // Semaine fiscale courante - depuis lastCompletedWeek
  const currentFiscalWeek = useMemo(() => {
    return lastCompletedWeek?.weekNumber || 1;
  }, [lastCompletedWeek]);

  // Année fiscale calculée depuis lastCompletedWeek
  const currentFiscalYear = useMemo(() => {
    if (lastCompletedWeek?.weekStart) {
      return lastCompletedWeek.weekStart.getFullYear();
    }
    return new Date().getFullYear(); // Fallback
  }, [lastCompletedWeek]);

  // ============================================
  // CALCUL DES DATES DE SEMAINE FISCALE
  // ============================================
  // Recalculer les dates de semaine quand launchDate change
  useEffect(() => {
    if (!launchDate) return;

    // selectedYearOffset est toujours 1 pour cette page (N+1)
    const selectedYearOffset = 1;
    const weekNumber = currentFiscalWeek;

    // Calculer le début de l'année fiscale basé sur la date de lancement + offset
    const fiscalYearStart = new Date(launchDate);
    fiscalYearStart.setFullYear(launchDate.getFullYear() + (selectedYearOffset - 1));

    // Calculer le début de la semaine: fiscalYearStart + (weekNumber - 1) * 7 jours
    const calculatedWeekStart = new Date(fiscalYearStart);
    calculatedWeekStart.setDate(fiscalYearStart.getDate() + (weekNumber - 1) * 7);

    // Calculer la fin de la semaine: weekStart + 6 jours
    const calculatedWeekEnd = new Date(calculatedWeekStart);
    calculatedWeekEnd.setDate(calculatedWeekStart.getDate() + 6);

    setWeekStart(calculatedWeekStart);
    setWeekEnd(calculatedWeekEnd);

    console.log(`[PerformanceCenter] Fiscal Week ${weekNumber}: ${calculatedWeekStart.toLocaleDateString()} - ${calculatedWeekEnd.toLocaleDateString()}`);
  }, [launchDate, currentFiscalWeek]);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  useEffect(() => {
    const loadData = async () => {
      if (!currentCompany?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // ============================================
        // 0. Charger la DERNIÈRE SEMAINE COMPLÉTÉE (avec données)
        // ============================================
        const completedWeek = await getLastCompletedWeek(currentCompany.id);

        // Variables locales pour la semaine fiscale (calculées immédiatement)
        let localLaunchDate: Date | null = null;
        let localFiscalWeek = 1;
        let localFiscalYear = new Date().getFullYear();
        let localWeekStart: Date = new Date();
        let localWeekEnd: Date = new Date();

        if (completedWeek) {
          setLastCompletedWeek(completedWeek);
          localFiscalWeek = completedWeek.weekNumber;
          localFiscalYear = completedWeek.weekStart.getFullYear();
          localWeekStart = completedWeek.weekStart;
          localWeekEnd = completedWeek.weekEnd;

          setWeekStart(localWeekStart);
          setWeekEnd(localWeekEnd);

          console.log('[PerformanceCenter] ✅ Last completed week:', completedWeek.periodLabel);
        } else {
          console.warn('[PerformanceCenter] ⚠️ No completed week found');
        }

        // Récupérer aussi la date de lancement pour référence
        const config = launchDateService.getConfig();
        if (config?.platformLaunchDate) {
          localLaunchDate = new Date(config.platformLaunchDate);
          setLaunchDate(localLaunchDate);
        }

        // ============================================
        // 1. Charger les données de performance par ligne d'activité ET par employé
        // PRIORITÉ 0: localStorage hcm_bulletin_performances (TRANSFERT DIRECT depuis PerformanceRecapPage)
        // Source 1: localStorage hcm_performance_data (sauvegardé par PerformanceDataContext)
        // Source 2: module3_period_results (période validée)
        // ============================================
        let periodBLPerformances: BusinessLinePerformance[] = [];
        let periodEmpDetails: EmployeeDetail[] = [];

        // Structure pour stocker les données du bulletin (transfert direct)
        let bulletinPerformances: any[] = [];

        // PRIORITÉ 0: Lire les données du bulletin depuis localStorage (transfert direct)
        try {
          const bulletinData = localStorage.getItem('hcm_bulletin_performances');
          if (bulletinData) {
            const parsed = JSON.parse(bulletinData);
            if (parsed.data && parsed.data.length > 0 && parsed.companyId === currentCompany.id) {
              // ✅ SANITIZATION: Garantir Réalisé ≤ Prévu (rigueur comptable)
              bulletinPerformances = sanitizeEmployeePerformances(parsed.data);
              console.log('[PerformanceCenter] ✅ PRIORITÉ 0: Bulletin data from localStorage:', bulletinPerformances.length, 'employees');
              console.log('[PerformanceCenter] Sample data:', bulletinPerformances[0]);
            }
          }
        } catch (bulletinError) {
          console.warn('[PerformanceCenter] Bulletin localStorage read failed:', bulletinError);
        }

        // Essayer d'abord localStorage (données fraîches du contexte)
        try {
          const savedData = localStorage.getItem('hcm_performance_data');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.businessLines && parsed.businessLines.length > 0) {
              periodBLPerformances = parsed.businessLines;
              setPeriodBusinessLinePerformances(periodBLPerformances);
              console.log('[PerformanceCenter] ✅ BL data from localStorage:', periodBLPerformances.length);
            }
          }
        } catch (lsError) {
          console.warn('[PerformanceCenter] localStorage read failed:', lsError);
        }

        // Charger depuis module3_period_results (source principale pour employee_details)
        // Utiliser les variables locales calculées immédiatement
        try {
          const periodService = createPeriodResultsService(currentCompany.id);
          const periodResults = await periodService.getPeriodResults(localFiscalWeek, localFiscalYear);

          if (periodResults) {
            // Charger les données de ligne si pas encore chargées depuis localStorage
            if (periodBLPerformances.length === 0 && periodResults.business_lines_data) {
              periodBLPerformances = periodResults.business_lines_data;
              setPeriodBusinessLinePerformances(periodBLPerformances);
              console.log('[PerformanceCenter] ✅ BL data from period_results:', periodBLPerformances.length);
            }

            // Charger les données individuelles des employés (CRUCIALE pour le bulletin)
            if (periodResults.employee_details && periodResults.employee_details.length > 0) {
              periodEmpDetails = periodResults.employee_details;
              setPeriodEmployeeDetails(periodEmpDetails);
              console.log('[PerformanceCenter] ✅ Employee details loaded:', periodEmpDetails.length, periodEmpDetails);
            } else {
              console.log('[PerformanceCenter] ⚠️ No employee_details in period_results');
            }
          } else {
            console.log('[PerformanceCenter] ⚠️ No validated period data found, will use calculated values');
          }
        } catch (periodError) {
          console.warn('[PerformanceCenter] Error loading period results (non-blocking):', periodError);
        }

        // 1. Charger les lignes d'activité (avec team_leader pour les bulletins)
        const { data: businessLines, error: blError } = await supabase
          .from('business_lines')
          .select('id, activity_name, team_leader')
          .eq('company_id', currentCompany.id)
          .eq('is_active', true);

        if (blError) throw blError;
        console.log('[PerformanceCenter] Business lines loaded:', businessLines?.length || 0, businessLines);

        // 1.5. Charger la devise configurée dans HCM Performance Plan
        try {
          const { data: scoreData } = await supabase
            .from('company_performance_scores')
            .select('factors')
            .eq('company_id', currentCompany.id)
            .eq('module_number', 1)
            .order('calculation_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (scoreData?.factors) {
            const factors = scoreData.factors as any;
            if (factors.selectedCurrency) {
              setCurrency(factors.selectedCurrency as Currency);
              console.log('[PerformanceCenter] ✅ Currency set to:', factors.selectedCurrency);
            }
          }
        } catch (currencyError) {
          console.warn('[PerformanceCenter] Currency load failed (non-blocking):', currencyError);
        }

        // 2. Charger les membres d'équipe avec leur ligne d'activité
        // Note: La table correcte est module3_team_members, pas team_members
        const businessLineIds = (businessLines || []).map(bl => bl.id);
        let teamMembers: any[] = [];
        let teamsData: any[] = [];

        if (businessLineIds.length > 0) {
          // Charger les membres ET les teams en parallèle
          const [tmResult, teamsResult] = await Promise.all([
            supabase
              .from('module3_team_members')
              .select('id, name, professional_category, tech_level, business_line_id')
              .in('business_line_id', businessLineIds)
              .order('name', { ascending: true }),
            supabase
              .from('module3_teams')
              .select('id, business_line_id, team_leader_id')
              .in('business_line_id', businessLineIds)
          ]);

          if (tmResult.error) throw tmResult.error;
          teamMembers = tmResult.data || [];
          teamsData = teamsResult.data || [];
        }
        console.log('[PerformanceCenter] Team members loaded:', teamMembers.length);
        console.log('[PerformanceCenter] Teams loaded:', teamsData.length);

        // 3. Charger les données depuis le cache de performance (prioritaire)
        // Note: Le cache contient les données calculées exactes depuis PerformanceRecapPage
        // Utiliser les variables locales calculées immédiatement
        const cacheService = createPerformanceCacheService(currentCompany.id);
        const cachedPerformances = await cacheService.getFromCache(localFiscalWeek, localFiscalYear);
        console.log('[PerformanceCenter] Cached performances loaded:', cachedPerformances?.length || 0);

        // 4. Charger les cost_entries comme fallback
        // FILTRE PAR SEMAINE: Only fetch entries for the current fiscal week
        const periodStartStr = localWeekStart.toISOString().split('T')[0];
        const periodEndStr = localWeekEnd.toISOString().split('T')[0];

        let costEntriesQuery = supabase
          .from('module3_cost_entries')
          .select('*')
          .eq('company_id', currentCompany.id);

        // Filtrer par période si Smart Calendar est configuré
        if (localLaunchDate) {
          costEntriesQuery = costEntriesQuery
            .gte('period_start', periodStartStr)
            .lte('period_end', periodEndStr);
        }

        const { data: costEntries, error: ceError } = await costEntriesQuery;

        if (ceError) throw ceError;
        console.log(`[PerformanceCenter] Cost entries loaded for week ${localFiscalWeek}:`, costEntries?.length || 0);

        // 5. Charger les PPR settings pour les objectifs
        const { data: pprSettings } = await supabase
          .from('company_ppr_settings')
          .select('*')
          .eq('company_id', currentCompany.id)
          .single();

        // 6. Charger les calculated_metrics pour les données supplémentaires
        const { data: calculatedMetrics } = await supabase
          .from('calculated_metrics')
          .select('*')
          .eq('company_id', currentCompany.id)
          .single();

        // Grouper les données du cache par employé pour accès rapide
        const cacheByEmployee = new Map<string, PerformanceCacheEntry[]>();
        if (cachedPerformances && cachedPerformances.length > 0) {
          cachedPerformances.forEach(entry => {
            const existing = cacheByEmployee.get(entry.employee_id) || [];
            existing.push(entry);
            cacheByEmployee.set(entry.employee_id, existing);
          });
          console.log('[PerformanceCenter] ✅ Cache grouped by employee:', cacheByEmployee.size, 'employees');
        }

        // NOTE: Les dates weekStart/weekEnd sont maintenant calculées
        // dans les variables locales ci-dessus (localWeekStart, localWeekEnd)

        // Définir les variables pour la période (utilisées dans EmployeePerformance)
        const startOfWeek = localWeekStart;
        const endOfWeek = localWeekEnd;
        const periodStr = `Semaine ${localFiscalWeek} — ${localWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} au ${localWeekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

        // ============================================
        // CALCUL DES PERFORMANCES PAR EMPLOYÉ
        // ============================================

        const businessLinesMap = new Map<string, BusinessLineWithEmployees>();

        // Map pour accéder au Team Leader par businessLineId
        // SOURCE 1: business_lines.team_leader (chaîne de texte directe)
        // SOURCE 2: module3_teams.team_leader_id (référence vers module3_team_members)
        const teamLeaderMap = new Map<string, string>();

        // Créer un Map des membres par ID pour lookup rapide
        const membersById = new Map<string, string>();
        teamMembers.forEach(m => {
          membersById.set(m.id, m.name);
        });

        // D'abord, remplir depuis module3_teams (team_leader_id → nom du membre)
        teamsData.forEach(team => {
          if (team.team_leader_id && team.business_line_id) {
            const leaderName = membersById.get(team.team_leader_id);
            if (leaderName && !teamLeaderMap.has(team.business_line_id)) {
              teamLeaderMap.set(team.business_line_id, leaderName);
              console.log('[PerformanceCenter] Team leader from module3_teams:', team.business_line_id, '→', leaderName);
            }
          }
        });

        // Ensuite, compléter/écraser avec business_lines.team_leader si renseigné
        (businessLines || []).forEach(bl => {
          if (bl.team_leader) {
            teamLeaderMap.set(bl.id, bl.team_leader);
            console.log('[PerformanceCenter] Team leader from business_lines:', bl.id, '→', bl.team_leader);
          }
        });

        console.log('[PerformanceCenter] Team leaders mapped (total):', teamLeaderMap.size);

        // Initialiser les lignes d'activité avec les totaux de période validée si disponibles
        (businessLines || []).forEach(bl => {
          // Chercher les données de période validée pour cette ligne
          const periodData = periodBLPerformances.find(p => p.businessLineId === bl.id);

          businessLinesMap.set(bl.id, {
            id: bl.id,
            name: bl.activity_name,
            employees: [],
            totals: {
              objectif: periodData?.objectif || 0,
              economiesRealisees: periodData?.economiesRealisees || 0,
              avgNote: 0,
              // Totaux Prime/Trésorerie depuis période validée
              prevPrime: periodData?.prevPrime || 0,
              prevTreso: periodData?.prevTreso || 0,
              realPrime: periodData?.realPrime || 0,
              realTreso: periodData?.realTreso || 0
            }
          });
        });

        // Calculer les données par employé
        teamMembers.forEach(member => {
          const blId = member.business_line_id;
          console.log('[PerformanceCenter] Processing member:', member.name, 'business_line_id:', blId);
          const bl = businessLinesMap.get(blId);
          if (!bl) {
            console.log('[PerformanceCenter] No matching business line for member:', member.name, 'blId:', blId);
            return;
          }

          // ============================================
          // PRIORITÉ 0: Données du bulletin (TRANSFERT DIRECT depuis PerformanceRecapPage)
          // PRIORITÉ 1: Données de période validée
          // PRIORITÉ 2: Cache de performance (depuis PerformanceRecapPage)
          // PRIORITÉ 3: Fallback cost_entries
          // ============================================
          const bulletinEmpData = bulletinPerformances.find(p => p.employeeId === member.id);
          const periodEmpData = periodEmpDetails.find(p => p.employeeId === member.id);
          const cachedEmpData = cacheByEmployee.get(member.id);

          let totalObjectif = 0;
          let totalEconomies = 0;
          let totalPrevPrime = 0;
          let totalPrevTreso = 0;
          let totalRealPrime = 0;
          let totalRealTreso = 0;
          let indicators: any;

          if (bulletinEmpData) {
            // ============================================
            // PRIORITÉ 0: TRANSFERT DIRECT depuis PerformanceRecapPage
            // ============================================
            // Données exactes calculées dans PerformanceRecapPage et transférées via localStorage
            console.log('[PerformanceCenter] ✅✅ PRIORITÉ 0: Using bulletin data for:', member.name, bulletinEmpData.employeePerformance);

            totalObjectif = bulletinEmpData.employeePerformance.objectif;
            totalEconomies = bulletinEmpData.employeePerformance.economiesRealisees;
            totalPrevPrime = bulletinEmpData.employeePerformance.prevPrime;
            totalPrevTreso = bulletinEmpData.employeePerformance.prevTreso;
            // ✅ CORRECTION AUDIT 05/02/2026: Plafonnement Réalisé ≤ Prévu (rigueur comptable)
            totalRealPrime = Math.min(bulletinEmpData.employeePerformance.realPrime || 0, totalPrevPrime);
            totalRealTreso = Math.min(bulletinEmpData.employeePerformance.realTreso || 0, totalPrevTreso);

            // Reconstruire les indicateurs depuis les données du bulletin
            indicators = {
              absenteisme: buildIndicatorFromBulletin('abs', bulletinEmpData.indicators),
              qualite: buildIndicatorFromBulletin('qd', bulletinEmpData.indicators),
              accident: buildIndicatorFromBulletin('oa', bulletinEmpData.indicators),
              productivite: buildIndicatorFromBulletin('ddp', bulletinEmpData.indicators),
              savoirFaire: buildIndicatorFromBulletin('ekh', bulletinEmpData.indicators)
            };
          } else if (periodEmpData) {
            // PRIORITÉ 1: Utiliser les données validées de la période
            console.log('[PerformanceCenter] ✅ Using validated period data for:', member.name, periodEmpData.totals);

            totalObjectif = periodEmpData.totals.totalPPR || 0;
            totalEconomies = periodEmpData.totals.totalEconomies || 0;
            totalPrevPrime = periodEmpData.totals.totalPrevPrime || 0;
            totalPrevTreso = periodEmpData.totals.totalPrevTreso || 0;
            // ✅ CORRECTION AUDIT 05/02/2026: Plafonnement Réalisé ≤ Prévu (rigueur comptable)
            totalRealPrime = Math.min(periodEmpData.totals.totalRealPrime || 0, totalPrevPrime);
            totalRealTreso = Math.min(periodEmpData.totals.totalRealTreso || 0, totalPrevTreso);

            // Reconstruire les indicateurs depuis les données de période
            // IMPORTANT: Utiliser les ratios officiels 33%/67% (PRIME_RATIO/TRESO_RATIO)
            const primeRate = 0.33;
            const tresoRate = 0.67;
            indicators = {
              absenteisme: buildIndicatorFromPeriod('abs', periodEmpData.indicators, primeRate, tresoRate),
              qualite: buildIndicatorFromPeriod('qd', periodEmpData.indicators, primeRate, tresoRate),
              accident: buildIndicatorFromPeriod('oa', periodEmpData.indicators, primeRate, tresoRate),
              productivite: buildIndicatorFromPeriod('ddp', periodEmpData.indicators, primeRate, tresoRate),
              savoirFaire: buildIndicatorFromPeriod('ekh', periodEmpData.indicators, primeRate, tresoRate)
            };
          } else if (cachedEmpData && cachedEmpData.length > 0) {
            // PRIORITÉ 2: Utiliser le cache de performance (données exactes depuis PerformanceRecapPage)
            console.log('[PerformanceCenter] ✅ Using cached performance data for:', member.name, 'entries:', cachedEmpData.length);

            // Construire les indicateurs depuis le cache
            const buildIndicatorFromCache = (indicatorKey: string) => {
              const cached = cachedEmpData.find(c => c.indicator_key === indicatorKey);
              if (!cached) {
                return {
                  key: indicatorKey,
                  label: INDICATOR_LABELS[indicatorKey] || indicatorKey.toUpperCase(),
                  totalTemps: 0,
                  totalFrais: 0,
                  objectif: 0,
                  economiesRealisees: 0,
                  prevPrime: 0,
                  prevTreso: 0,
                  realPrime: 0,
                  realTreso: 0
                };
              }
              // ✅ CORRECTION AUDIT 04/02/2026: Plafonnement Réalisé ≤ Prévu (rigueur comptable)
              const prevPrime = cached.prev_prime || (cached.ppr_prevues * 0.33);
              const prevTreso = cached.prev_treso || (cached.ppr_prevues * 0.67);
              const rawRealPrime = cached.real_prime || (cached.economies_realisees * 0.33);
              const rawRealTreso = cached.real_treso || (cached.economies_realisees * 0.67);

              return {
                key: indicatorKey,
                label: INDICATOR_LABELS[indicatorKey] || indicatorKey.toUpperCase(),
                totalTemps: cached.temps_calcul || 0,
                totalFrais: cached.frais_collectes || 0,
                objectif: cached.ppr_prevues || 0,
                economiesRealisees: cached.economies_realisees || 0,
                prevPrime,
                prevTreso,
                realPrime: Math.min(rawRealPrime, prevPrime),  // PLAFONNÉ
                realTreso: Math.min(rawRealTreso, prevTreso)   // PLAFONNÉ
              };
            };

            indicators = {
              absenteisme: buildIndicatorFromCache('abs'),
              qualite: buildIndicatorFromCache('qd'),
              accident: buildIndicatorFromCache('oa'),
              productivite: buildIndicatorFromCache('ddp'),
              savoirFaire: buildIndicatorFromCache('ekh')
            };

            // Calculer les totaux depuis les indicateurs cachés
            totalObjectif = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.objectif, 0);
            totalEconomies = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.economiesRealisees, 0);
            totalPrevPrime = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.prevPrime, 0);
            totalPrevTreso = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.prevTreso, 0);
            totalRealPrime = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.realPrime, 0);
            totalRealTreso = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.realTreso, 0);
          } else {
            // PRIORITÉ 3: Fallback - Calculer depuis cost_entries (formule simplifiée)
            console.log('[PerformanceCenter] ⚠️ No period/cache data for:', member.name, '- using cost_entries fallback');

            const employeeEntries = (costEntries || []).filter(e => e.employee_id === member.id);
            indicators = {
              absenteisme: calculateIndicatorData('ABS', employeeEntries, pprSettings),
              qualite: calculateIndicatorData('QD', employeeEntries, pprSettings),
              accident: calculateIndicatorData('OA', employeeEntries, pprSettings),
              productivite: calculateIndicatorData('DDP', employeeEntries, pprSettings),
              savoirFaire: calculateIndicatorData('EKH', employeeEntries, pprSettings)
            };

            totalObjectif = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.objectif, 0);
            totalEconomies = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.economiesRealisees, 0);
            totalPrevPrime = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.prevPrime, 0);
            totalPrevTreso = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.prevTreso, 0);
            totalRealPrime = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.realPrime, 0);
            totalRealTreso = Object.values(indicators).reduce((sum: number, ind: any) => sum + ind.realTreso, 0);
          }

          // Calculer note et grade
          const globalNote = calculateGlobalNote(totalEconomies, totalObjectif);
          const grade = calculateGrade(globalNote);

          // Créer l'objet EmployeePerformance
          // Note: linePerformance sera mis à jour après le calcul des totaux de ligne
          const empPerf: EmployeePerformance = {
            id: member.id,
            name: member.name,
            role: member.professional_category || 'Collaborateur',
            businessLineId: blId,
            businessLineName: bl.name,
            teamLeader: teamLeaderMap.get(blId) || 'Non renseigné',
            period: periodStr,
            periodStart: startOfWeek,
            periodEnd: endOfWeek,
            globalNote,
            grade,
            linePerformance: {
              // Ces valeurs seront mises à jour après le calcul des totaux
              objectif: 0,
              economiesRealisees: 0,
              prevPrime: 0,
              prevTreso: 0,
              realPrime: 0,
              realTreso: 0
            },
            employeePerformance: {
              objectif: totalObjectif,
              economiesRealisees: totalEconomies,
              prevPrime: totalPrevPrime,
              prevTreso: totalPrevTreso,
              realPrime: totalRealPrime,
              realTreso: totalRealTreso
            },
            indicators
          };

          bl.employees.push(empPerf);

          // Accumuler les totaux de la ligne (si pas de données de période validée)
          // Les données de période validée sont déjà chargées dans bl.totals
          if (!periodBLPerformances.find(p => p.businessLineId === blId)) {
            bl.totals.objectif += totalObjectif;
            bl.totals.economiesRealisees += totalEconomies;
            bl.totals.prevPrime = (bl.totals.prevPrime || 0) + totalPrevPrime;
            bl.totals.prevTreso = (bl.totals.prevTreso || 0) + totalPrevTreso;
            bl.totals.realPrime = (bl.totals.realPrime || 0) + totalRealPrime;
            bl.totals.realTreso = (bl.totals.realTreso || 0) + totalRealTreso;
          }
        });

        // Calculer la moyenne des notes par ligne et propager les totaux aux employés
        businessLinesMap.forEach(bl => {
          if (bl.employees.length > 0) {
            bl.totals.avgNote = bl.employees.reduce((sum, e) => sum + e.globalNote, 0) / bl.employees.length;
          }
          // Mettre à jour la performance de ligne pour chaque employé
          // avec les totaux de la ligne (depuis période validée ou calculés)
          bl.employees.forEach(emp => {
            emp.linePerformance.objectif = bl.totals.objectif;
            emp.linePerformance.economiesRealisees = bl.totals.economiesRealisees;
            emp.linePerformance.prevPrime = bl.totals.prevPrime || 0;
            emp.linePerformance.prevTreso = bl.totals.prevTreso || 0;
            emp.linePerformance.realPrime = bl.totals.realPrime || 0;
            emp.linePerformance.realTreso = bl.totals.realTreso || 0;
          });
          console.log(`[PerformanceCenter] Line "${bl.name}" totals:`, bl.totals);
        });

        // Convertir en array et trier
        const allLines = Array.from(businessLinesMap.values());
        console.log('[PerformanceCenter] All business lines with employees count:', allLines.map(bl => ({ name: bl.name, employeeCount: bl.employees.length })));

        // Trier les employés de chaque ligne par score global (desc) puis par nom (asc)
        allLines.forEach(bl => {
          bl.employees.sort((a, b) => {
            // 1. Score global décroissant (les meilleurs en premier)
            const scoreA = a.globalNote ?? 0;
            const scoreB = b.globalNote ?? 0;
            if (scoreB !== scoreA) return scoreB - scoreA;
            // 2. Nom alphabétique (A-Z) en cas d'égalité
            const nameCompare = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
            if (nameCompare !== 0) return nameCompare;
            // 3. ID pour garantir un ordre stable
            return a.id.localeCompare(b.id);
          });
        });

        const result = allLines
          .filter(bl => bl.employees.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log('[PerformanceCenter] Final result (lines with employees):', result.length);
        setBusinessLinesWithEmployees(result);

        // OPTIMISATION 10K: Virtualisation activée - ouvrir la première ligne par défaut
        if (result.length > 0) {
          setExpandedLines(new Set([result[0].id]));
        }

      } catch (error) {
        console.error('Erreur chargement données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentCompany?.id]);

  // Debug: Log data state
  useEffect(() => {
    console.log('[PerformanceCenter] currentCompany:', currentCompany?.id || 'NOT SET');
    console.log('[PerformanceCenter] businessLinesWithEmployees:', businessLinesWithEmployees.length);
  }, [currentCompany?.id, businessLinesWithEmployees]);

  // ============================================
  // HELPERS
  // ============================================

  function calculateIndicatorData(
    kpiType: string,
    entries: any[],
    pprSettings: any
  ) {
    const indicatorEntries = entries.filter(e => e.kpi_type === kpiType);

    const totalTemps = indicatorEntries.reduce((sum, e) => sum + (e.duration_hours || 0) + (e.duration_minutes || 0) / 60, 0);
    const totalFrais = indicatorEntries.reduce((sum, e) => sum + (e.compensation_amount || 0), 0);

    // Objectif depuis PPR settings
    const pprKey = `ppr_${kpiType.toLowerCase()}_weekly`;
    const objectif = pprSettings?.[pprKey] || 0;

    // Économies réalisées = objectif - frais engagés (simplifié)
    const economiesRealisees = Math.max(0, objectif - totalFrais);

    // Primes et trésorerie (ratios standards: 33% prime, 67% trésorerie)
    const primeRate = 0.33;
    const tresoRate = 0.67;

    // ✅ CORRECTION AUDIT 04/02/2026: Plafonnement Réalisé ≤ Prévu (rigueur comptable)
    const prevPrime = objectif * primeRate;
    const prevTreso = objectif * tresoRate;

    return {
      key: kpiType.toLowerCase(),
      label: INDICATOR_LABELS[kpiType.toLowerCase()] || kpiType,
      totalTemps,
      totalFrais,
      objectif,
      economiesRealisees,
      prevPrime,
      prevTreso,
      realPrime: Math.min(economiesRealisees * primeRate, prevPrime),  // PLAFONNÉ
      realTreso: Math.min(economiesRealisees * tresoRate, prevTreso)   // PLAFONNÉ
    };
  }

  // Helper pour reconstruire un indicateur depuis les données de période validée
  function buildIndicatorFromPeriod(
    key: string,
    indicators: Record<string, any>,
    primeRate: number,
    tresoRate: number
  ) {
    const indData = indicators[key] || {};
    const objectif = indData.pprPrevues || 0;
    const economiesRealisees = indData.economiesRealisees || 0;

    // ✅ CORRECTION AUDIT 04/02/2026: Plafonnement Réalisé ≤ Prévu (rigueur comptable)
    const prevPrime = indData.prevPrime || objectif * primeRate;
    const prevTreso = indData.prevTreso || objectif * tresoRate;
    const rawRealPrime = indData.realPrime || economiesRealisees * primeRate;
    const rawRealTreso = indData.realTreso || economiesRealisees * tresoRate;

    return {
      key,
      label: INDICATOR_LABELS[key] || key.toUpperCase(),
      totalTemps: 0, // Non disponible dans les données de période
      totalFrais: 0, // Non disponible dans les données de période
      objectif,
      economiesRealisees,
      prevPrime,
      prevTreso,
      realPrime: Math.min(rawRealPrime, prevPrime),  // PLAFONNÉ
      realTreso: Math.min(rawRealTreso, prevTreso)   // PLAFONNÉ
    };
  }

  // Helper pour reconstruire un indicateur depuis les données du bulletin (localStorage)
  // ✅ CORRECTION AUDIT 05/02/2026: Plafonnement Réalisé ≤ Prévu (rigueur comptable)
  function buildIndicatorFromBulletin(
    key: string,
    indicators: Record<string, any>
  ) {
    const indData = indicators?.[key] || {};
    const objectif = indData.objectif || 0;
    const economiesRealisees = indData.economiesRealisees || 0;
    const primeRate = 0.33;
    const tresoRate = 0.67;

    // Calculer les valeurs prévues et réalisées
    const prevPrime = indData.prevPrime || objectif * primeRate;
    const prevTreso = indData.prevTreso || objectif * tresoRate;
    const rawRealPrime = indData.realPrime || economiesRealisees * primeRate;
    const rawRealTreso = indData.realTreso || economiesRealisees * tresoRate;

    return {
      key,
      label: INDICATOR_LABELS[key] || key.toUpperCase(),
      totalTemps: indData.totalTemps || 0,
      totalFrais: indData.totalFrais || 0,
      objectif,
      economiesRealisees,
      prevPrime,
      prevTreso,
      realPrime: Math.min(rawRealPrime, prevPrime),  // PLAFONNÉ
      realTreso: Math.min(rawRealTreso, prevTreso)   // PLAFONNÉ
    };
  }

  // Toggle ligne d'activité
  const toggleLine = (lineId: string) => {
    setExpandedLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) {
        newSet.delete(lineId);
      } else {
        newSet.add(lineId);
      }
      return newSet;
    });
  };

  // ============================================
  // RENDER - BULLETIN SI SÉLECTIONNÉ
  // ============================================

  if (selectedEmployee) {
    return (
      <PerformanceBulletin
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
        currency={currency}
      />
    );
  }

  // ============================================
  // RENDER - LISTE
  // ============================================

  if (loading) {
    return <HCMLoader text="Chargement du Centre de Performance..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Centre de la Performance
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Performance des lignes d'activités et des salariés par indicateurs socio-économiques
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
              <span className="font-semibold mr-2">Semaine {currentFiscalWeek}</span>
              {weekStart.toLocaleDateString('fr-FR')} - {weekEnd.toLocaleDateString('fr-FR')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto space-y-6">
        {businessLinesWithEmployees.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-center">
                Aucune donnée de performance disponible.<br />
                Assurez-vous d'avoir configuré les équipes et saisi les données.
              </p>
            </CardContent>
          </Card>
        ) : (
          businessLinesWithEmployees.map(businessLine => (
            <Card key={businessLine.id} className="bg-white dark:bg-slate-800 overflow-hidden">
              {/* En-tête de la ligne d'activité */}
              <CardHeader
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => toggleLine(businessLine.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedLines.has(businessLine.id) ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">
                        {businessLine.name}
                      </CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {businessLine.employees.length} salarié(s) • Note moyenne: {businessLine.totals.avgNote.toFixed(1)}/10
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Objectif</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(businessLine.totals.objectif, currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Réalisé</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(businessLine.totals.economiesRealisees, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Tableau des employés - VIRTUALISÉ pour 10K+ employés */}
              {expandedLines.has(businessLine.id) && (
                <CardContent className="p-0">
                  <VirtualizedEmployeeList
                    employees={businessLine.employees}
                    onSelectEmployee={setSelectedEmployee}
                  />
                </CardContent>
              )}
            </Card>
          ))
        )}

        {/* ============================================ */}
        {/* BOUTON: CENTRE DE PERFORMANCE GLOBALE */}
        {/* ============================================ */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => navigate('/modules/module3/global-performance-center')}
            className="gap-3 px-6 py-6 text-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <BarChart3 className="w-5 h-5" />
            Centre de performance globale et par indicateurs
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
