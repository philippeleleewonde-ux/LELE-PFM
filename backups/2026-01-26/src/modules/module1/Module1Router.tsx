import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// ✅ PERFORMANCE: Lazy loading des composants de route Module 1
const Module1Main = lazy(() => import('./Module1Main'));
const ReportLayout = lazy(() => import('./pages/report/layout'));
const ReportOverview = lazy(() => import('./pages/report/page'));

// Composant de fallback pendant le chargement
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Chargement...</span>
    </div>
  </div>
);

export default function Module1Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Main form route */}
        <Route path="/" element={<Module1Main />} />

        {/* Report routes with layout */}
        <Route path="/report" element={<ReportLayout />}>
          <Route index element={<ReportOverview />} />
        </Route>

        {/* Fallback to main form */}
        <Route path="*" element={<Navigate to="/modules/module1" replace />} />
      </Routes>
    </Suspense>
  );
}
