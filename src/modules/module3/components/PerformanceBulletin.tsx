/**
 * ============================================
 * BULLETIN DE PERFORMANCE
 * ============================================
 *
 * Composant pour afficher et imprimer le bulletin de performance
 * d'un salarié par indicateurs socio-économiques.
 *
 * Format: A4 Paysage optimisé pour impression PDF
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  Users,
  Building2,
  BarChart3,
  PieChart,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  Trophy,
  Lightbulb,
  Star,
  PiggyBank
} from 'lucide-react';
import CircularGauge from './CircularGauge';
import { PerformanceScoreCard } from './PerformanceScoreCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';

import {
  EmployeePerformance,
  getGradeColor,
  getGradeTextColor,
  INDICATOR_LABELS,
  sanitizeEmployeePerformances
} from '../types/performanceCenter';

// Import des sous-modules du bulletin
import {
  // Types
  type TabType,
  type EvolutionViewMode,
  type PerformanceHistory,

  // Constantes
  CHART_COLORS,

  // Fonctions utilitaires
  getProgressColor,
  getProgressWidth,
  isZeroPercentage,
  getProgressTrackClass,
  generateDemoHistory,
  calculateTrend,
  getDepartmentEmployeesFromStorage,
  calculateBenchmark
} from './bulletin';

import { BenchmarkSection, EmptyBenchmark } from './bulletin';

// ============================================
// PROPS
// ============================================

interface PerformanceBulletinProps {
  employee: EmployeePerformance;
  onBack: () => void;
  currency?: Currency;
}

// Note: Les couleurs et helpers sont maintenant dans ./bulletin/bulletinHelpers.ts

const CHART_COLORS_LOCAL = [
  '#10b981', // emerald - Absentéisme
  '#eab308', // yellow - Qualité
  '#3b82f6', // blue - Accident
  '#6366f1', // indigo - Productivité
  '#8b5cf6'  // purple - Savoir-faire
];

// ============================================
// BARRE DE PROGRESSION - COULEURS
// ============================================

/**
 * Retourne la couleur de la barre de progression selon le pourcentage
 * 0-50% : Rouge (#EF4444) - Insuffisant/Échec
 * 51-79% : Orange (#F59E0B) - Moyen
 * 80-99% : Bleu (#3B82F6) - Proche de l'objectif
 * 100%+ : Vert (#10B981) - Objectif atteint
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 100) return '#10B981'; // Vert - Objectif atteint
  if (percentage >= 80) return '#3B82F6';  // Bleu - Proche
  if (percentage >= 51) return '#F59E0B';  // Orange - Moyen (51-79%)
  return '#EF4444';                         // Rouge - Insuffisant (0-50%)
}

/**
 * Calcule la largeur de la barre de progression
 * Si 0%, on affiche une barre minimale de 8% pour montrer visuellement l'échec
 */
function getProgressWidth(economiesRealisees: number, objectif: number): number {
  if (objectif <= 0) return 0;
  const percentage = (economiesRealisees / objectif) * 100;
  // Si 0%, afficher une barre minimale de 8% pour visualiser l'échec plus clairement
  if (percentage === 0) return 8;
  return Math.min(percentage, 100);
}

/**
 * Détermine si on doit afficher l'alerte pour un échec (0%)
 */
function isZeroPercentage(economiesRealisees: number, objectif: number): boolean {
  if (objectif <= 0) return false;
  return economiesRealisees === 0 || (economiesRealisees / objectif) * 100 === 0;
}

/**
 * Retourne la classe de fond pour la barre de progression
 * Fond rouge clair si 0%, sinon gris normal
 */
function getProgressTrackClass(economiesRealisees: number, objectif: number): string {
  if (objectif <= 0) return 'bg-gray-200 dark:bg-gray-600';
  const percentage = (economiesRealisees / objectif) * 100;
  if (percentage === 0) {
    return 'bg-red-200 dark:bg-red-900/50'; // Fond rouge clair pour 0%
  }
  return 'bg-gray-200 dark:bg-gray-600';
}

// ============================================
// TYPES ONGLETS
// ============================================

type TabType = 'synthese' | 'details' | 'analyses';
type EvolutionViewMode = 'note' | 'economies';

// ============================================
// INTERFACE HISTORIQUE PERFORMANCE
// ============================================

interface PerformanceHistory {
  week: string;           // "S48", "S49", etc.
  date: string;           // "25/11 - 01/12"
  globalNote: number;     // 0-10
  economiesRealisees: number;
  objectif: number;
  grade: string;          // A, B, C, D, E
}

// ============================================
// GÉNÉRATION DONNÉES HISTORIQUES SIMULÉES
// ============================================

/**
 * Génère des données historiques simulées basées sur la note actuelle
 * pour montrer une tendance progressive
 */
function generateDemoHistory(currentNote: number, currentEconomies: number, objectif: number): PerformanceHistory[] {
  const weeks = ['S48', 'S49', 'S50', 'S51', 'S52'];
  const dates = ['25/11-01/12', '02/12-08/12', '09/12-15/12', '16/12-22/12', '23/12-26/12'];

  // Calculer une base de départ plus basse pour montrer une progression
  const baseNote = Math.max(0, currentNote - 0.7);
  const baseEconomies = Math.max(0, currentEconomies - (currentEconomies * 0.25));

  return weeks.map((week, index) => {
    // Progression graduelle avec légère variation aléatoire
    const progressRatio = index / (weeks.length - 1);
    const noteVariation = (Math.random() * 0.2 - 0.1);
    const note = Math.min(10, Math.max(0, baseNote + (currentNote - baseNote) * progressRatio + noteVariation));
    const economies = Math.round(baseEconomies + (currentEconomies - baseEconomies) * progressRatio + (Math.random() * 20 - 10));

    // Calculer le grade en fonction de la note
    const roundedNote = Math.round(note);
    let grade = 'E';
    if (roundedNote >= 9) grade = 'A+';
    else if (roundedNote >= 8) grade = 'A';
    else if (roundedNote >= 7) grade = 'B+';
    else if (roundedNote >= 6) grade = 'B';
    else if (roundedNote >= 5) grade = 'C+';
    else if (roundedNote >= 4) grade = 'C';
    else if (roundedNote >= 3) grade = 'D+';
    else if (roundedNote >= 2) grade = 'D';
    else if (roundedNote >= 1) grade = 'E+';

    return {
      week,
      date: dates[index],
      globalNote: Math.round(note * 10) / 10,
      economiesRealisees: Math.max(0, economies),
      objectif,
      grade
    };
  });
}

/**
 * Calcule la tendance sur la période
 */
function calculateTrend(data: PerformanceHistory[]) {
  if (data.length < 2) return { direction: 'stable' as const, percentage: 0, diff: '0' };

  const first = data[0].globalNote;
  const last = data[data.length - 1].globalNote;
  const diff = last - first;
  const percentage = first > 0 ? Math.abs((diff / first) * 100) : 0;

  return {
    direction: diff > 0.1 ? 'up' as const : diff < -0.1 ? 'down' as const : 'stable' as const,
    percentage: Math.round(percentage * 10) / 10,
    diff: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
  };
}

// ============================================
// INTERFACE BENCHMARK - COMPARAISON ÉQUIPE
// ============================================

interface BenchmarkData {
  rank: number;                    // Position du salarié (1, 2, 3...)
  totalInDepartment: number;       // Nombre total de salariés dans le département
  percentile: number;              // Top X% (ex: top 33%)

  employeeNote: number;            // Note du salarié actuel
  departmentAverage: number;       // Moyenne du département
  departmentMin: number;           // Note minimum
  departmentMax: number;           // Note maximum

  bestPerformer: {
    name: string;
    note: number;
    grade: string;
  };

  gapToAverage: number;            // Écart par rapport à la moyenne (+/-)
  gapToTop: number;                // Écart par rapport au meilleur
  pointsToNextRank: number;        // Points nécessaires pour monter d'un rang
}

interface DepartmentEmployee {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  globalNote: number;
  grade: string;
}

/**
 * Récupère les données des collègues depuis localStorage
 */
function getDepartmentEmployeesFromStorage(currentBusinessLineId: string): DepartmentEmployee[] {
  try {
    const bulletinData = localStorage.getItem('hcm_bulletin_performances');
    if (!bulletinData) return [];

    const parsed = JSON.parse(bulletinData);
    // Structure: { companyId, data: [...] }
    const rawEmployees: DepartmentEmployee[] = parsed.data || [];

    // ✅ SANITIZATION: Garantir Réalisé ≤ Prévu (rigueur comptable)
    const allEmployees = sanitizeEmployeePerformances(rawEmployees);

    // Filtrer par même Business Line
    return allEmployees.filter(
      (emp: DepartmentEmployee) => emp.businessLineId === currentBusinessLineId
    );
  } catch (error) {
    console.warn('[Benchmark] Failed to load department data:', error);
    return [];
  }
}

/**
 * Calcule les données de benchmark pour la comparaison d'équipe
 */
function calculateBenchmark(
  currentEmployeeId: string,
  currentNote: number,
  departmentEmployees: DepartmentEmployee[]
): BenchmarkData | null {
  if (departmentEmployees.length <= 1) return null;

  // Trier par note décroissante
  const sorted = [...departmentEmployees].sort((a, b) => b.globalNote - a.globalNote);

  // Classement
  const rank = sorted.findIndex(emp => emp.employeeId === currentEmployeeId) + 1;
  const totalInDepartment = sorted.length;
  const percentile = Math.round((rank / totalInDepartment) * 100);

  // Stats
  const notes = sorted.map(emp => emp.globalNote);
  const departmentAverage = notes.reduce((a, b) => a + b, 0) / notes.length;
  const departmentMin = Math.min(...notes);
  const departmentMax = Math.max(...notes);

  // Meilleur performeur
  const bestPerformer = {
    name: sorted[0].employeeName,
    note: sorted[0].globalNote,
    grade: sorted[0].grade
  };

  // Écarts
  const gapToAverage = currentNote - departmentAverage;
  const gapToTop = currentNote - departmentMax;

  // Points pour monter d'un rang
  const currentIndex = rank - 1;
  const pointsToNextRank = currentIndex > 0
    ? sorted[currentIndex - 1].globalNote - currentNote
    : 0;

  return {
    rank,
    totalInDepartment,
    percentile,
    employeeNote: currentNote,
    departmentAverage,
    departmentMin,
    departmentMax,
    bestPerformer,
    gapToAverage,
    gapToTop,
    pointsToNextRank
  };
}

// ============================================
// COMPOSANT BENCHMARK SECTION
// ============================================

interface BenchmarkSectionProps {
  benchmark: BenchmarkData;
  departmentName: string;
}

const BenchmarkSection: React.FC<BenchmarkSectionProps> = ({ benchmark, departmentName }) => {
  const {
    rank,
    totalInDepartment,
    percentile,
    employeeNote,
    departmentAverage,
    departmentMin,
    departmentMax,
    bestPerformer,
    gapToAverage,
    pointsToNextRank
  } = benchmark;

  const isAboveAverage = gapToAverage >= 0;

  // Calcul de la position sur la barre (éviter division par zéro)
  const range = departmentMax - departmentMin;
  const employeePosition = range > 0 ? ((employeeNote - departmentMin) / range) * 100 : 50;
  const averagePosition = range > 0 ? ((departmentAverage - departmentMin) / range) * 100 : 50;

  return (
    <section className="mb-6 animate-fade-in-up animate-delay-400">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 border-l-4 border-purple-500 pl-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-500" />
        Positionnement dans l'Équipe
      </h3>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm card-hover-lift">

        {/* Ligne 1 : Classement principal */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {rank}<sup className="text-sm">{rank === 1 ? 'er' : 'e'}</sup>
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {rank}{rank === 1 ? 'er' : 'ème'} sur {totalInDepartment} salariés
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {departmentName}
              </p>
            </div>
          </div>

          {/* Badge Top X% avec animation pop */}
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold animate-badge-pop",
            percentile <= 25
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : percentile <= 50
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : percentile <= 75
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            Top {percentile}%
          </div>
        </div>

        {/* Ligne 2 : Comparaison visuelle (gauge/slider) */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Min: {departmentMin.toFixed(1)}</span>
            <span>Moyenne: {departmentAverage.toFixed(1)}</span>
            <span>Max: {departmentMax.toFixed(1)}</span>
          </div>

          {/* Barre de positionnement */}
          <div className="relative h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 dark:from-red-900/50 dark:via-yellow-900/50 dark:to-green-900/50 rounded-full">
            {/* Marqueur moyenne */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-400"
              style={{ left: `${averagePosition}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-600 dark:bg-gray-400 rotate-45" />
            </div>

            {/* Position du salarié - Animée */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-lg animate-marker-slide"
              style={{
                left: `calc(${Math.min(95, Math.max(5, employeePosition))}% - 10px)`,
                backgroundColor: isAboveAverage ? '#10B981' : '#F59E0B'
              }}
            />
          </div>

          {/* Labels sous la barre */}
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Dernier</span>
            <span className={cn(
              "text-sm font-semibold",
              isAboveAverage ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
            )}>
              Vous: {employeeNote.toFixed(1)}/10
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Premier</span>
          </div>
        </div>

        {/* Ligne 3 : Stats en grille */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Votre note */}
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Votre note</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{employeeNote.toFixed(1)}</p>
          </div>

          {/* Moyenne */}
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Moyenne équipe</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{departmentAverage.toFixed(1)}</p>
          </div>

          {/* Écart */}
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Écart</p>
            <p className={cn(
              "text-xl font-bold",
              gapToAverage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {gapToAverage >= 0 ? '+' : ''}{gapToAverage.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Ligne 4 : Meilleur performeur */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Meilleure performance :</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-white">{bestPerformer.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">({bestPerformer.note.toFixed(1)}/10)</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-semibold",
              bestPerformer.grade.startsWith('A')
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                : bestPerformer.grade.startsWith('B')
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
            )}>
              {bestPerformer.grade}
            </span>
          </div>
        </div>

        {/* Ligne 5 : Conseil pour progresser */}
        {rank > 1 && pointsToNextRank > 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Pour monter d'un rang :</span> il vous faut
              <span className="font-bold text-blue-600 dark:text-blue-400"> +{pointsToNextRank.toFixed(2)} pts</span>
            </p>
          </div>
        )}

        {rank === 1 && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Star className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Félicitations !</span> Vous êtes le meilleur performeur de votre département !
            </p>
          </div>
        )}

      </div>
    </section>
  );
};

// ============================================
// COMPOSANT EMPTY BENCHMARK
// ============================================

const EmptyBenchmark: React.FC = () => (
  <section className="mb-6">
    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 border-l-4 border-purple-500 pl-3 flex items-center gap-2">
      <Users className="w-4 h-4 text-purple-500" />
      Positionnement dans l'Équipe
    </h3>
    <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-xl text-center border border-gray-200 dark:border-gray-700">
      <Users className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">
        Comparaison non disponible
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
        Vous êtes le seul salarié évalué dans ce département
      </p>
    </div>
  </section>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

// ============================================
// COMPOSANT TABBUTTON
// ============================================

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "tab-animated flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all whitespace-nowrap",
      "active:scale-95",
      active
        ? "border-blue-500 text-blue-600 dark:text-blue-400 active"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
    )}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function PerformanceBulletin({ employee, onBack, currency = 'EUR' }: PerformanceBulletinProps) {

  // ============================================
  // STATE - ONGLETS & ANIMATIONS
  // ============================================

  const [activeTab, setActiveTab] = useState<TabType>('synthese');
  const [evolutionViewMode, setEvolutionViewMode] = useState<EvolutionViewMode>('note');
  const [selectedWeek, setSelectedWeek] = useState<PerformanceHistory | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentKey, setContentKey] = useState(0); // Pour forcer le re-render des animations

  // Handler de changement d'onglet avec transition
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setContentKey(prev => prev + 1); // Re-déclenche les animations
      setIsTransitioning(false);
    }, 150);
  };

  // Persistance de l'onglet actif
  useEffect(() => {
    const saved = localStorage.getItem('bulletin_active_tab');
    if (saved && ['synthese', 'details', 'analyses'].includes(saved)) {
      setActiveTab(saved as TabType);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bulletin_active_tab', activeTab);
  }, [activeTab]);

  // ============================================
  // DONNÉES HISTORIQUES (simulées ou réelles)
  // ============================================

  const performanceHistory = useMemo(() => {
    // TODO: Remplacer par des données réelles depuis localStorage ou API
    // Pour l'instant, on génère des données simulées basées sur les performances actuelles
    return generateDemoHistory(
      employee.globalNote,
      employee.employeePerformance.economiesRealisees,
      employee.employeePerformance.objectif
    );
  }, [employee.globalNote, employee.employeePerformance.economiesRealisees, employee.employeePerformance.objectif]);

  const trend = useMemo(() => calculateTrend(performanceHistory), [performanceHistory]);

  // ============================================
  // DONNÉES GRAPHIQUES
  // ============================================

  const pieChartData = useMemo(() => {
    return [
      { name: 'Absent.', value: employee.indicators.absenteisme.economiesRealisees, color: CHART_COLORS[0] },
      { name: 'Qualité', value: employee.indicators.qualite.economiesRealisees, color: CHART_COLORS[1] },
      { name: 'Accident', value: employee.indicators.accident.economiesRealisees, color: CHART_COLORS[2] },
      { name: 'Product.', value: employee.indicators.productivite.economiesRealisees, color: CHART_COLORS[3] },
      { name: 'Savoir', value: employee.indicators.savoirFaire.economiesRealisees, color: CHART_COLORS[4] }
    ].filter(d => d.value > 0);
  }, [employee]);

  const barChartData = useMemo(() => {
    return [
      {
        name: 'Prime',
        previsionnel: employee.employeePerformance.prevPrime,
        realise: employee.employeePerformance.realPrime
      },
      {
        name: 'Trésorerie',
        previsionnel: employee.employeePerformance.prevTreso,
        realise: employee.employeePerformance.realTreso
      }
    ];
  }, [employee]);

  // ============================================
  // INDICATEURS DÉTAILLÉS
  // ============================================

  const indicatorsList = useMemo(() => [
    { ...employee.indicators.absenteisme, label: 'Absentéisme' },
    { ...employee.indicators.qualite, label: 'Défauts de qualité' },
    { ...employee.indicators.accident, label: 'Accidents du travail' },
    { ...employee.indicators.productivite, label: 'Écarts de productivité directe' },
    { ...employee.indicators.savoirFaire, label: 'Écarts de savoir-faire' }
  ], [employee]);

  // ============================================
  // DONNÉES BENCHMARK - COMPARAISON ÉQUIPE
  // ============================================

  const benchmarkData = useMemo(() => {
    // Récupérer les collègues du même département depuis localStorage
    const departmentEmployees = getDepartmentEmployeesFromStorage(employee.businessLineId);

    // Calculer le benchmark
    return calculateBenchmark(
      employee.id,
      employee.globalNote,
      departmentEmployees
    );
  }, [employee.id, employee.globalNote, employee.businessLineId]);

  // ============================================
  // IMPRESSION
  // ============================================

  const handlePrint = () => {
    window.print();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="bg-zinc-600 dark:bg-zinc-800 min-h-screen p-4 md:p-8 print:bg-white print:p-0">
      {/* Barre d'outils (Non imprimée) */}
      <div className="max-w-[297mm] mx-auto mb-4 flex justify-between items-center no-print">
        <Button
          onClick={onBack}
          variant="secondary"
          className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimer / PDF
        </Button>
      </div>

      {/* === DÉBUT DU DOCUMENT PAPIER === */}
      <div className="bg-white dark:bg-slate-900 shadow-2xl mx-auto p-6 md:p-10 relative flex flex-col sheet-print print:shadow-none print:p-8 print:bg-white" style={{ maxWidth: '297mm', minHeight: '210mm' }}>

        {/* ============================================ */}
        {/* EN-TÊTE - LAYOUT MOCKUP UTILISATEUR */}
        {/* Grid 2 colonnes : Titres à gauche | [Card infos + Jauge] à droite */}
        {/* ============================================ */}
        {/* HEADER ADAPTATIF LIGHT/DARK MODE - NOUVEAU DESIGN */}
        <header
          className={cn(
            "rounded-2xl p-6 md:p-8 mb-8 shadow-2xl print:shadow-none print:bg-slate-100 print:border print:border-slate-300",
            // Mode Light: Fond bleu ciel lumineux
            "bg-gradient-to-br from-sky-200 via-sky-300 to-sky-400",
            // Mode Dark: Override complet du gradient
            "dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e293b]",
            "dark:border dark:border-blue-500/20",
            // Animation subtile pour le header
            "transition-all duration-300"
          )}
        >
          {/* LAYOUT VERTICAL : Titres centrés EN HAUT → Cartes EN BAS */}
          <div className="flex flex-col gap-6">

            {/* SECTION 1 : Titres CENTRÉS */}
            <div className="text-center">
              {/* Petit titre supérieur */}
              <div
                className={cn(
                  "text-xs md:text-sm font-semibold tracking-[3px] uppercase mb-2",
                  // Light: texte sombre sur fond clair
                  "text-slate-700",
                  // Dark: texte clair
                  "dark:text-slate-300"
                )}
              >
                Rapport de gestion sociale
              </div>

              {/* Titre principal - Police serif comme mockup */}
              <h1
                className={cn(
                  "text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-2 print:text-slate-900",
                  // Light: texte slate foncé italic
                  "text-slate-800 italic",
                  // Dark: texte cyan lumineux
                  "dark:text-cyan-400 dark:not-italic"
                )}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Bulletin de performance
              </h1>

              {/* Sous-titre italic */}
              <p
                className={cn(
                  "text-base md:text-lg italic print:text-slate-600",
                  // Light: texte gris foncé
                  "text-slate-600",
                  // Dark: texte gris clair
                  "dark:text-slate-400"
                )}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Par indicateurs socio-économiques
              </p>
            </div>

            {/* SECTION 2 : Les 2 cartes côte à côte EN DESSOUS */}
            <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 lg:gap-6">

              {/* Card d'informations (période, salarié, etc.) - FOND SLATE FIXE */}
              <div
                className={cn(
                  "rounded-xl p-4 md:p-5 min-w-[280px] print:bg-white print:border print:border-slate-300",
                  // Fond slate-800 dans les DEUX modes (light et dark)
                  "bg-slate-800",
                  // Bordure subtile
                  "border border-slate-700",
                  // Shadow pour profondeur
                  "shadow-lg"
                )}
              >
                {/* PÉRIODE */}
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-white/10">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wide print:text-slate-600">
                    PÉRIODE :
                  </div>
                  <div className="text-sm font-semibold text-white text-right leading-relaxed print:text-slate-900 ml-4">
                    {employee.period}
                  </div>
                </div>

                {/* NOM DU SALARIÉ */}
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-white/10">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wide print:text-slate-600">
                    NOM DU<br />SALARIÉ :
                  </div>
                  <div className="text-base font-bold text-white text-right print:text-slate-900 ml-4">
                    {employee.name}
                  </div>
                </div>

                {/* LIGNE D'ACTIVITÉ */}
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-white/10">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wide print:text-slate-600">
                    LIGNE<br />D'ACTIVITÉ :
                  </div>
                  <div className="text-sm font-semibold text-white text-right print:text-slate-900 ml-4">
                    {employee.businessLineName}
                  </div>
                </div>

                {/* TEAM LEADER */}
                <div className="flex justify-between items-start">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wide print:text-slate-600">
                    TEAM<br />LEADER :
                  </div>
                  <div className="text-sm font-semibold text-white text-right print:text-slate-900 ml-4">
                    {employee.teamLeader}
                  </div>
                </div>
              </div>

              {/* Jauge circulaire avec effet lumineux - FOND SLATE FIXE */}
              <div
                className={cn(
                  "rounded-2xl p-4 flex items-center justify-center relative overflow-visible print:bg-white flex-shrink-0",
                  // Fond slate-800 dans les DEUX modes (comme la carte infos)
                  "bg-slate-800",
                  // Bordure subtile
                  "border border-slate-700",
                  // Shadow avec glow émeraude (unifié dans les deux modes)
                  "shadow-lg shadow-emerald-500/20",
                  // Transition pour le mode switch
                  "transition-all duration-500"
                )}
              >
                {/* Cercle lumineux derrière (effet glow émeraude) */}
                <div
                  className="absolute inset-0 pointer-events-none print:hidden rounded-2xl bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.25)_0%,rgba(16,185,129,0.1)_40%,transparent_70%)]"
                  style={{ filter: 'blur(20px)' }}
                />

                {/* Jauge circulaire */}
                <div className="relative z-10">
                  <CircularGauge
                    score={employee.globalNote}
                    maxScore={10}
                    grade={employee.grade}
                    previousScore={employee.previousGlobalNote}
                    size={160}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* NAVIGATION PAR ONGLETS (Non imprimée) */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6 no-print">
          <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
            <TabButton
              active={activeTab === 'synthese'}
              onClick={() => handleTabChange('synthese')}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Synthèse"
            />
            <TabButton
              active={activeTab === 'details'}
              onClick={() => handleTabChange('details')}
              icon={<ClipboardList className="w-4 h-4" />}
              label="Détail des indicateurs"
            />
            <TabButton
              active={activeTab === 'analyses'}
              onClick={() => handleTabChange('analyses')}
              icon={<TrendingUp className="w-4 h-4" />}
              label="Analyses"
            />
          </nav>
        </div>

        {/* ============================================ */}
        {/* ONGLET 1 : SYNTHÈSE */}
        {/* ============================================ */}
        {(activeTab === 'synthese' || typeof window === 'undefined') && (
          <div
            key={`synthese-${contentKey}`}
            className={cn(
              "transition-opacity duration-150",
              isTransitioning ? "opacity-0" : "opacity-100"
            )}
          >
            {/* SECTION KPI - LIGNE ET SALARIÉ */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Performance de la ligne */}
          <div className="animate-fade-in-up animate-delay-100 card-hover-lift border border-slate-900 dark:border-slate-600 rounded-sm shadow-sm bg-white dark:bg-slate-800 overflow-hidden flex flex-col cursor-pointer">
            <div className="bg-slate-900 dark:bg-slate-700 text-white text-sm font-bold px-5 py-3 uppercase flex justify-between items-center">
              <span>Performance de la Ligne</span>
              <Building2 className="w-5 h-5 opacity-50" />
            </div>
            <div className="p-4 flex-grow">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">1- Objectif</span>
                  <span className="font-bold text-slate-900 dark:text-white text-lg">{formatCurrency(employee.linePerformance.objectif, currency)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">2- Économies réalisées</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{formatCurrency(employee.linePerformance.economiesRealisees, currency)}</span>
                </div>
                <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 my-1"></div>
                <div>
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">3- Prév. Prime</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{formatCurrency(employee.linePerformance.prevPrime, currency)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">5- Réal. Prime</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(employee.linePerformance.realPrime, currency)}</span>
                </div>
                <div>
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">4- Prév. Tréso</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{formatCurrency(employee.linePerformance.prevTreso, currency)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">6- Réal. Tréso</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(employee.linePerformance.realTreso, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance du salarié */}
          <div className="animate-fade-in-up animate-delay-200 card-hover-lift border border-slate-300 dark:border-slate-600 rounded-sm shadow-sm bg-slate-50 dark:bg-slate-800 overflow-hidden flex flex-col cursor-pointer">
            <div className="bg-blue-900 dark:bg-blue-800 text-white text-sm font-bold px-5 py-3 uppercase flex justify-between items-center">
              <span>Performance Globale du Salarié</span>
              <Users className="w-5 h-5 opacity-50" />
            </div>
            <div className="p-4 flex-grow">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">1- Objectif</span>
                  <span className="font-bold text-slate-900 dark:text-white text-lg">{formatCurrency(employee.employeePerformance.objectif, currency)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">2- Économies réalisées</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{formatCurrency(employee.employeePerformance.economiesRealisees, currency)}</span>
                </div>
                <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 my-1"></div>
                <div>
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">3- Prév. Prime</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{formatCurrency(employee.employeePerformance.prevPrime, currency)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">5- Réal. Prime</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-400">{formatCurrency(employee.employeePerformance.realPrime, currency)}</span>
                </div>
                <div>
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">4- Prév. Tréso</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{formatCurrency(employee.employeePerformance.prevTreso, currency)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-500 dark:text-slate-400 text-[10px] uppercase">6- Réal. Tréso</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-400">{formatCurrency(employee.employeePerformance.realTreso, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

            {/* MINI-RÉSUMÉ DES INDICATEURS */}
            <section className="mb-6 animate-fade-in-up animate-delay-300">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 border-l-4 border-slate-900 dark:border-slate-500 pl-3">
                Aperçu des Indicateurs
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {indicatorsList.map((indicator, idx) => {
                  const percentage = indicator.objectif > 0
                    ? Math.round((indicator.economiesRealisees / indicator.objectif) * 100)
                    : 0;
                  const isSuccess = percentage >= 100;
                  const isFailure = indicator.objectif > 0 && percentage === 0;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border transition-colors card-hover-scale",
                        isFailure
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          : isSuccess
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                          : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                      )}
                    >
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 truncate" title={indicator.label}>
                        {indicator.label.length > 20 ? indicator.label.substring(0, 18) + '...' : indicator.label}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Barre de progression mini animée */}
                        <div className={cn(
                          "flex-1 h-2 rounded-full overflow-hidden",
                          getProgressTrackClass(indicator.economiesRealisees, indicator.objectif)
                        )}>
                          <div
                            className="h-full rounded-full animate-progress-fill"
                            style={{
                              width: `${getProgressWidth(indicator.economiesRealisees, indicator.objectif)}%`,
                              backgroundColor: getProgressColor(percentage)
                            }}
                          />
                        </div>
                        {/* Icône status */}
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : isFailure ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : null}
                      </div>
                      <div className={cn(
                        "text-xs font-bold mt-1",
                        isFailure ? "text-red-600 dark:text-red-400" :
                        isSuccess ? "text-emerald-600 dark:text-emerald-400" :
                        "text-gray-600 dark:text-gray-400"
                      )}>
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION BENCHMARK - POSITIONNEMENT DANS L'ÉQUIPE */}
            {benchmarkData ? (
              <BenchmarkSection
                benchmark={benchmarkData}
                departmentName={employee.businessLineName}
              />
            ) : (
              <EmptyBenchmark />
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* ONGLET 2 : DÉTAIL DES INDICATEURS */}
        {/* ============================================ */}
        {(activeTab === 'details' || typeof window === 'undefined') && (
          <section className="mb-6 flex-grow print:block animate-fade-in-up">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3 border-l-4 border-slate-900 dark:border-slate-500 pl-3">
              Détail des Indicateurs Socio-Économiques
            </h3>
          <div className="border border-slate-300 dark:border-slate-600 rounded-sm overflow-hidden card-hover-lift">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-b-2 border-slate-900 dark:border-slate-500 text-xs uppercase font-serif">
                <tr>
                  <th className="p-2 border-r border-slate-300 dark:border-slate-600">Indicateur</th>
                  <th className="p-2 text-center border-r border-slate-300 dark:border-slate-600">Total Temps</th>
                  <th className="p-2 text-center border-r border-slate-300 dark:border-slate-600">Total Frais</th>
                  <th className="p-2 text-center border-r border-slate-300 dark:border-slate-600">Objectif</th>
                  <th className="p-2 text-center text-emerald-800 dark:text-emerald-400 font-bold border-r border-slate-300 dark:border-slate-600">Éco. Réal.</th>
                  <th className="p-2 text-center border-r border-slate-300 dark:border-slate-600">Prév. Prime</th>
                  <th className="p-2 text-center border-r border-slate-300 dark:border-slate-600">Réal. Prime</th>
                  <th className="p-2 text-center border-r border-slate-300 dark:border-slate-600">Prév. Tréso</th>
                  <th className="p-2 text-center text-blue-900 dark:text-blue-400">Réal. Tréso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {indicatorsList.map((indicator, idx) => (
                  <tr key={idx} className="table-row-hover transition-colors duration-150">
                    <td className="p-2 font-bold border-r border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white">{indicator.label}</td>
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {indicator.totalTemps?.toFixed(1) || '0'} h
                    </td>
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {formatCurrency(indicator.totalFrais || 0, currency)}
                    </td>
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {formatCurrency(indicator.objectif, currency)}
                    </td>
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700">
                      {/* Montant existant */}
                      <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                        {formatCurrency(indicator.economiesRealisees, currency)}
                      </div>
                      {/* Barre de progression animée avec alerte pour 0% */}
                      {indicator.objectif > 0 ? (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <div className={cn(
                            "w-14 h-2 rounded-full overflow-hidden",
                            getProgressTrackClass(indicator.economiesRealisees, indicator.objectif)
                          )}>
                            <div
                              className="h-full rounded-full animate-progress-fill"
                              style={{
                                width: `${getProgressWidth(indicator.economiesRealisees, indicator.objectif)}%`,
                                backgroundColor: getProgressColor((indicator.economiesRealisees / indicator.objectif) * 100)
                              }}
                            />
                          </div>
                          <span className={cn(
                            "text-[9px] w-7 text-right",
                            isZeroPercentage(indicator.economiesRealisees, indicator.objectif)
                              ? "text-red-500 dark:text-red-400 font-bold"
                              : "text-gray-500 dark:text-gray-400"
                          )}>
                            {Math.round((indicator.economiesRealisees / indicator.objectif) * 100)}%
                          </span>
                          {/* Icône alerte pour 0% */}
                          {isZeroPercentage(indicator.economiesRealisees, indicator.objectif) && (
                            <AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400" />
                          )}
                        </div>
                      ) : (
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">N/A</div>
                      )}
                    </td>
                    {/* PRÉV. PRIME - plus lumineux en dark mode */}
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {formatCurrency(indicator.prevPrime, currency)}
                    </td>
                    {/* RÉAL. PRIME */}
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-200">
                      {formatCurrency(indicator.realPrime, currency)}
                    </td>
                    {/* PRÉV. TRÉSO - plus lumineux en dark mode */}
                    <td className="p-2 text-center border-r border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {formatCurrency(indicator.prevTreso, currency)}
                    </td>
                    <td className="p-2 text-center font-mono text-xs text-blue-900 dark:text-blue-400 font-bold">
                      {formatCurrency(indicator.realTreso, currency)}
                    </td>
                  </tr>
                ))}
                {/* Ligne TOTAL - Style distinct */}
                <tr className="bg-slate-200 dark:bg-slate-600 font-semibold border-t-2 border-slate-400 dark:border-slate-500">
                  <td className="p-2 uppercase text-slate-900 dark:text-white">TOTAL</td>
                  <td className="p-2 text-center font-mono text-xs text-slate-700 dark:text-slate-200">
                    {indicatorsList.reduce((sum, i) => sum + (i.totalTemps || 0), 0).toFixed(1)} h
                  </td>
                  <td className="p-2 text-center font-mono text-xs text-slate-700 dark:text-slate-200">
                    {formatCurrency(indicatorsList.reduce((sum, i) => sum + (i.totalFrais || 0), 0), currency)}
                  </td>
                  <td className="p-2 text-center font-mono text-xs text-slate-700 dark:text-slate-200">
                    {formatCurrency(employee.employeePerformance.objectif, currency)}
                  </td>
                  <td className="p-2 text-center">
                    {/* Montant TOTAL */}
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                      {formatCurrency(employee.employeePerformance.economiesRealisees, currency)}
                    </div>
                    {/* Barre de progression TOTAL avec alerte pour 0% */}
                    {employee.employeePerformance.objectif > 0 ? (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className={cn(
                          "w-14 h-2 rounded-full overflow-hidden",
                          getProgressTrackClass(employee.employeePerformance.economiesRealisees, employee.employeePerformance.objectif)
                        )}>
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${getProgressWidth(employee.employeePerformance.economiesRealisees, employee.employeePerformance.objectif)}%`,
                              backgroundColor: getProgressColor((employee.employeePerformance.economiesRealisees / employee.employeePerformance.objectif) * 100)
                            }}
                          />
                        </div>
                        <span className={cn(
                          "text-[9px] w-7 text-right font-bold",
                          isZeroPercentage(employee.employeePerformance.economiesRealisees, employee.employeePerformance.objectif)
                            ? "text-red-500 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-300"
                        )}>
                          {Math.round((employee.employeePerformance.economiesRealisees / employee.employeePerformance.objectif) * 100)}%
                        </span>
                        {/* Icône alerte pour 0% */}
                        {isZeroPercentage(employee.employeePerformance.economiesRealisees, employee.employeePerformance.objectif) && (
                          <AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400" />
                        )}
                      </div>
                    ) : (
                      <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">N/A</div>
                    )}
                  </td>
                  {/* PRÉV. PRIME TOTAL - plus lumineux en dark mode */}
                  <td className="p-2 text-center font-mono text-xs text-slate-700 dark:text-slate-200">
                    {formatCurrency(employee.employeePerformance.prevPrime, currency)}
                  </td>
                  {/* RÉAL. PRIME TOTAL */}
                  <td className="p-2 text-center font-mono text-xs text-slate-800 dark:text-slate-100 font-bold">
                    {formatCurrency(employee.employeePerformance.realPrime, currency)}
                  </td>
                  {/* PRÉV. TRÉSO TOTAL - plus lumineux en dark mode */}
                  <td className="p-2 text-center font-mono text-xs text-slate-700 dark:text-slate-200">
                    {formatCurrency(employee.employeePerformance.prevTreso, currency)}
                  </td>
                  <td className="p-2 text-center text-blue-900 dark:text-blue-400 font-mono text-xs font-bold">
                    {formatCurrency(employee.employeePerformance.realTreso, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </section>
        )}

        {/* ============================================ */}
        {/* ONGLET 3 : ANALYSES - DASHBOARD PROFESSIONNEL */}
        {/* ============================================ */}
        {(activeTab === 'analyses' || typeof window === 'undefined') && (
          <section className="flex-grow print:block animate-fade-in-up">

            {/* ============================================ */}
            {/* SECTION 1: SCORECARD KPI MAJEURS */}
            {/* ============================================ */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 border-l-4 border-blue-500 pl-4 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Dashboard Analytique
              </h3>

              <PerformanceScoreCard
                tauxRealisation={employee.employeePerformance.objectif > 0
                  ? (employee.employeePerformance.economiesRealisees / employee.employeePerformance.objectif) * 100
                  : 0}
                economiesRealisees={employee.employeePerformance.economiesRealisees}
                performanceMoyenne={employee.globalNote}
                ecartBudgetaire={employee.employeePerformance.objectif > 0
                  ? ((employee.employeePerformance.economiesRealisees - employee.employeePerformance.objectif) / employee.employeePerformance.objectif) * 100
                  : 0}
                currency={currency}
              />
            </div>

            {/* ============================================ */}
            {/* SECTION 2: GRAPHIQUES XXL - GRILLE 2 COLONNES */}
            {/* ============================================ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">

              {/* Graphique Donut XXL - Sources d'économies */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg card-hover-lift animate-fade-in-up animate-delay-100">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-200 dark:border-slate-700 pb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  Répartition des Sources d'Économies
                </h4>

                {/* Graphique XXL */}
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={130}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '0.75rem',
                          color: 'white',
                          padding: '1rem',
                          fontSize: '0.95rem',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconSize={16}
                        iconType="square"
                        wrapperStyle={{ fontSize: '14px', fontWeight: 500 }}
                        formatter={(value: string, entry: any) => {
                          const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
                          const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0;
                          return (
                            <span className="text-slate-700 dark:text-slate-300">
                              {value}: <strong>{formatCurrency(entry.payload.value, currency)}</strong> ({percent}%)
                            </span>
                          );
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Total central (info supplémentaire) */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total économies</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(pieChartData.reduce((sum, item) => sum + item.value, 0), currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphique Barres XXL - Fiabilité budgétaire */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg card-hover-lift animate-fade-in-up animate-delay-200">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-200 dark:border-slate-700 pb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  Fiabilité Budgétaire (Prévisionnel vs Réalisé)
                </h4>

                {/* Graphique XXL */}
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      barGap={12}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.3}
                        stroke="#cbd5e1"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 14, fontWeight: 500, fill: '#475569' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        tick={{ fontSize: 13, fill: '#475569' }}
                        tickFormatter={(v) => `${v.toLocaleString()}${CURRENCY_CONFIG[currency]?.symbol || '€'}`}
                        axisLine={{ stroke: '#cbd5e1' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value, currency),
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '0.75rem',
                          color: 'white',
                          padding: '1rem',
                          fontSize: '0.95rem',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '1rem', fontSize: '14px' }}
                        formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                      />
                      <Bar
                        dataKey="previsionnel"
                        name="Prévisionnel"
                        fill="#94a3b8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={80}
                      />
                      <Bar
                        dataKey="realise"
                        name="Réalisé"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={80}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Légende avec calcul d'écart */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Prime</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(employee.employeePerformance.realPrime, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Trésorerie</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCurrency(employee.employeePerformance.realTreso, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* GRAPHIQUE 3 : ÉVOLUTION TEMPORELLE - PLEINE LARGEUR XXL */}
            {/* ============================================ */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg card-hover-lift animate-fade-in-up animate-delay-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-gray-200 dark:border-slate-700 pb-4">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Évolution de la Performance (5 semaines)
                </h4>

                {/* Toggle Note/Économies - Design amélioré */}
                <div className="flex gap-2 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button
                    onClick={() => setEvolutionViewMode('note')}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                      evolutionViewMode === 'note'
                        ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    Note globale
                  </button>
                  <button
                    onClick={() => setEvolutionViewMode('economies')}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                      evolutionViewMode === 'economies'
                        ? "bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    Économies ({CURRENCY_CONFIG[currency]?.symbol || '€'})
                  </button>
                </div>
              </div>

              {/* Graphique Line Chart XXL - Pleine largeur */}
              {performanceHistory.length <= 1 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Données historiques insuffisantes</p>
                  <p className="text-sm mt-2">Le graphique sera disponible après plusieurs semaines d'évaluation</p>
                </div>
              ) : (
                <>
                  {/* Graphique XXL - 400px de hauteur */}
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceHistory}
                        margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                        onClick={(data) => {
                          if (data && data.activePayload) {
                            setSelectedWeek(data.activePayload[0].payload);
                          }
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          opacity={0.3}
                          stroke="#cbd5e1"
                        />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 14, fontWeight: 500, fill: '#475569' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          domain={evolutionViewMode === 'note' ? [0, 10] : ['auto', 'auto']}
                          tick={{ fontSize: 13, fill: '#475569' }}
                          tickFormatter={evolutionViewMode === 'economies'
                            ? (v) => `${v.toLocaleString()}${CURRENCY_CONFIG[currency]?.symbol || '€'}`
                            : (v) => `${v}/10`
                          }
                          axisLine={{ stroke: '#cbd5e1' }}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '0.75rem',
                            color: 'white',
                            padding: '1rem',
                            fontSize: '0.95rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                          }}
                          formatter={(value: number, name: string) => [
                            evolutionViewMode === 'note'
                              ? `${value}/10`
                              : formatCurrency(value, currency),
                            name === 'globalNote' ? 'Note' : name === 'economiesRealisees' ? 'Économies' : 'Objectif'
                          ]}
                          labelFormatter={(label) => `Semaine ${label}`}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '1rem', fontSize: '14px' }}
                          formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                        />

                        {/* Courbe principale - Plus épaisse et visible */}
                        <Line
                          type="monotone"
                          dataKey={evolutionViewMode === 'note' ? 'globalNote' : 'economiesRealisees'}
                          name={evolutionViewMode === 'note' ? 'Note globale' : 'Économies réalisées'}
                          stroke={evolutionViewMode === 'note' ? '#8B5CF6' : '#10B981'}
                          strokeWidth={4}
                          dot={{ fill: evolutionViewMode === 'note' ? '#8B5CF6' : '#10B981', strokeWidth: 3, r: 6 }}
                          activeDot={{ r: 10, fill: evolutionViewMode === 'note' ? '#8B5CF6' : '#10B981', cursor: 'pointer', strokeWidth: 2, stroke: '#fff' }}
                        />

                        {/* Ligne de référence: Objectif (mode économies) */}
                        {evolutionViewMode === 'economies' && (
                          <ReferenceLine
                            y={employee.employeePerformance.objectif}
                            stroke="#F59E0B"
                            strokeDasharray="8 4"
                            strokeWidth={2}
                            label={{
                              value: `Objectif: ${formatCurrency(employee.employeePerformance.objectif, currency)}`,
                              fill: '#F59E0B',
                              fontSize: 12,
                              fontWeight: 600,
                              position: 'right'
                            }}
                          />
                        )}

                        {/* Ligne de référence: Seuil Grade B (note >= 6) */}
                        {evolutionViewMode === 'note' && (
                          <>
                            <ReferenceLine
                              y={6}
                              stroke="#F59E0B"
                              strokeDasharray="8 4"
                              strokeWidth={2}
                              label={{
                                value: 'Seuil Grade B (6/10)',
                                fill: '#F59E0B',
                                fontSize: 12,
                                fontWeight: 600,
                                position: 'right'
                              }}
                            />
                            <ReferenceLine
                              y={8}
                              stroke="#10B981"
                              strokeDasharray="8 4"
                              strokeWidth={2}
                              label={{
                                value: 'Seuil Grade A (8/10)',
                                fill: '#10B981',
                                fontSize: 12,
                                fontWeight: 600,
                                position: 'right'
                              }}
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Barre d'informations sous le graphique */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Indicateur de tendance */}
                    <div className={cn(
                      "p-4 rounded-lg border-2 flex items-center gap-4",
                      trend.direction === 'up'
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                        : trend.direction === 'down'
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    )}>
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        trend.direction === 'up' ? "bg-emerald-100 dark:bg-emerald-900/50" :
                        trend.direction === 'down' ? "bg-red-100 dark:bg-red-900/50" :
                        "bg-slate-200 dark:bg-slate-600"
                      )}>
                        {trend.direction === 'up' ? (
                          <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        ) : trend.direction === 'down' ? (
                          <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                        ) : (
                          <Minus className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className={cn(
                          "text-2xl font-bold",
                          trend.direction === 'up' ? "text-emerald-600 dark:text-emerald-400" :
                          trend.direction === 'down' ? "text-red-600 dark:text-red-400" :
                          "text-slate-600 dark:text-slate-400"
                        )}>
                          {trend.diff} pts
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                          Tendance période
                        </div>
                      </div>
                    </div>

                    {/* Note actuelle */}
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {employee.globalNote.toFixed(1)}/10
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                          Note actuelle
                        </div>
                      </div>
                    </div>

                    {/* Économies actuelles */}
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <PiggyBank className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(employee.employeePerformance.economiesRealisees, currency)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                          Économies actuelles
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détails semaine sélectionnée */}
                  {selectedWeek && (
                    <div className="mt-6 p-5 border-2 rounded-xl border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h5 className="text-lg font-bold text-slate-900 dark:text-white">
                              Semaine {selectedWeek.week}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedWeek.date}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedWeek(null)}
                          className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 flex items-center justify-center transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Note</span>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{selectedWeek.globalNote}/10</p>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Grade</span>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{selectedWeek.grade}</p>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Économies</span>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatCurrency(selectedWeek.economiesRealisees, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* FOOTER - Zone Signatures (toujours visible pour impression) */}
        <footer className="mt-auto border-t border-slate-300 dark:border-slate-600 pt-6 print:block">
          <div className="flex justify-between gap-4 items-end text-center text-[10px] uppercase font-bold text-slate-800 dark:text-slate-200">
            <div className="flex-1 border-t border-slate-300 dark:border-slate-600 pt-2">
              <div className="h-12"></div>
              <span>Salarié</span>
            </div>
            <div className="flex-1 border-t border-slate-300 dark:border-slate-600 pt-2">
              <div className="h-12"></div>
              <span>Team Leader</span>
            </div>
            <div className="flex-1 border-t border-slate-300 dark:border-slate-600 pt-2">
              <div className="h-12"></div>
              <span>Direction</span>
            </div>
          </div>
        </footer>

      </div>

      {/* CSS d'impression et variables mode sombre */}
      <style>{`
        /* Variables CSS pour les tooltips des graphiques */
        :root {
          --tooltip-bg: #ffffff;
          --tooltip-border: #e2e8f0;
          --tooltip-text: #1e293b;

          /* Variables pour le badge de score - UNIFIÉ (fond slate-800 dans les deux modes) */
          --score-ring-color: #10B981;
          --score-ring-glow: 0 0 30px rgba(16, 185, 129, 0.4);
          --score-text-color: #34D399;
          --score-badge-bg: linear-gradient(135deg, #10B981 0%, #059669 100%);
        }
        .dark {
          --tooltip-bg: #1e293b;
          --tooltip-border: #475569;
          --tooltip-text: #f1f5f9;

          /* Variables pour le badge de score - IDENTIQUES (fond sombre unifié) */
          --score-ring-color: #10B981;
          --score-ring-glow: 0 0 40px rgba(16, 185, 129, 0.5);
          --score-text-color: #34D399;
          --score-badge-bg: linear-gradient(135deg, #10B981 0%, #059669 100%);
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .sheet-print, .sheet-print * {
            visibility: visible;
          }
          .sheet-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 297mm;
            min-height: 210mm;
            margin: 0;
            box-shadow: none;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
