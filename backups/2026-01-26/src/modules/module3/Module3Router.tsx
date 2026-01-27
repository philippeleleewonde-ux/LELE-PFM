import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PerformanceDataProvider } from './contexts/PerformanceDataContext';

// ============================================
// PERFORMANCE: Lazy loading de tous les composants
// ============================================
const Module3Main = lazy(() => import('./Module3Main'));
const TeamConfigurationForm = lazy(() => import('./TeamConfigurationForm'));
const TeamMembersList = lazy(() => import('./TeamMembersList'));
const TeamRecapView = lazy(() => import('./TeamRecapView'));
const TeamRecapGlobal = lazy(() => import('./TeamRecapGlobal'));
const CostDataEntry = lazy(() => import('./CostDataEntry'));
const AnalysisConfigurationPage = lazy(() => import('./AnalysisConfigurationPage'));
const DataAlignmentPage = lazy(() => import('./DataAlignmentPage'));
const CostRecapByEmployeePage = lazy(() => import('./CostRecapByEmployeePage'));
const PerformanceRecapPage = lazy(() => import('./PerformanceRecapPage'));
const PerformanceCalculation = lazy(() => import('./PerformanceCalculation'));

// NOUVELLES PAGES - Architecture séparée pour scalabilité 10K+ salariés
const EKHAnalysisPage = lazy(() => import('./pages/EKHAnalysisPage'));
const SynthesisPerformancePage = lazy(() => import('./pages/SynthesisPerformancePage'));
const PrimeDistributionPage = lazy(() => import('./pages/PrimeDistributionPage'));

// REPORTING - Tableau de bord des économies de coûts
const CostSavingsReportingPage = lazy(() => import('./pages/CostSavingsReportingPage'));

// CENTRE DE PERFORMANCE - Performance des salariés par indicateurs socio-économiques
const PerformanceCenterPage = lazy(() => import('./pages/PerformanceCenterPage'));

// CENTRE DE PERFORMANCE GLOBALE - Vue consolidée des performances par indicateur
const GlobalPerformanceCenterPage = lazy(() => import('./pages/GlobalPerformanceCenterPage'));

// CALENDRIER DE SUIVI DES PERFORMANCES - Calendrier intelligent de suivi
const PerformanceCalendarPage = lazy(() => import('./pages/PerformanceCalendarPage'));

// Composant de fallback pendant le chargement
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Chargement...</span>
    </div>
  </div>
);

// ============================================
// ROUTES PERFORMANCE - Wrappées dans PerformanceDataProvider
// ============================================
// Ces routes partagent le même contexte de données pour éviter
// les rechargements multiples et permettre la navigation fluide
function PerformanceRoutes() {
  return (
    <PerformanceDataProvider>
      <Routes>
        {/* Performance Recap - Page principale (Phase 3 - Step 4) */}
        <Route path="/" element={<PerformanceRecapPage />} />

        {/* EKH Analysis - Écarts de Know-How (sous-page) */}
        <Route path="/ekh-analysis" element={<EKHAnalysisPage />} />

        {/* Synthesis Performance - Synthèse par ligne d'activité (sous-page) */}
        <Route path="/synthesis" element={<SynthesisPerformancePage />} />

        {/* Prime Distribution - Répartition des primes (sous-page) */}
        <Route path="/prime-distribution" element={<PrimeDistributionPage />} />
      </Routes>
    </PerformanceDataProvider>
  );
}

export default function Module3Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Main landing page */}
        <Route path="/" element={<Module3Main />} />

        {/* Team configuration form */}
        <Route path="/team-identification" element={<TeamConfigurationForm />} />

        {/* Team Members List */}
        <Route path="/team-members" element={<TeamMembersList />} />

        {/* Team Recap View - Global view of all employees */}
        <Route path="/team-recap" element={<TeamRecapView />} />

        {/* Team Recap Global - Global table view */}
        <Route path="/team-recap-global" element={<TeamRecapGlobal />} />

        {/* Cost Data Entry - Control of Performance Indicators */}
        <Route path="/cost-data-entry" element={<CostDataEntry />} />

        {/* Analysis Configuration - Vue d'ensemble des équipes (Phase 3 - Step 1) */}
        <Route path="/analysis-configuration" element={<AnalysisConfigurationPage />} />

        {/* Data Alignment - Feuille 2: TB Fixe-Données Risko M1 (Phase 3 - Step 2) */}
        <Route path="/data-alignment" element={<DataAlignmentPage />} />

        {/* Cost Recap By Employee - Récapitulatif des coûts enregistrés par salarié (Phase 3 - Step 3) */}
        <Route path="/cost-recap" element={<CostRecapByEmployeePage />} />

        {/* Performance Recap et sous-pages - Wrappées dans PerformanceDataProvider */}
        <Route path="/performance-recap/*" element={<PerformanceRoutes />} />

        {/* Performance Calculation - Phase 3 - Step 5 */}
        <Route path="/performance-calculation" element={<PerformanceCalculation />} />

        {/* Cost Savings Reporting - Tableau de bord des économies */}
        <Route path="/cost-savings-reporting" element={<CostSavingsReportingPage />} />

        {/* Performance Center - Centre de la performance des salariés */}
        <Route path="/performance-center" element={<PerformanceCenterPage />} />

        {/* Global Performance Center - Centre de performance globale et par indicateurs */}
        <Route path="/global-performance-center" element={<GlobalPerformanceCenterPage />} />

        {/* Performance Calendar - Calendrier de suivi des performances */}
        {/* ✅ Wrappé dans PerformanceDataProvider pour accès aux données OBJ/RÉAL */}
        <Route path="/performance-calendar" element={
          <PerformanceDataProvider>
            <PerformanceCalendarPage />
          </PerformanceDataProvider>
        } />

        {/* Fallback to main */}
        <Route path="*" element={<Navigate to="/modules/module3" replace />} />
      </Routes>
    </Suspense>
  );
}
