import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================================
// MODULE 5 — ROUTER
// 3 routes: selection page, demo, dashboard
// Pattern copied from Module2Router.tsx
// ============================================================================

const Module5SelectionPage = lazy(() => import('./pages/Module5SelectionPage'));
const Module5DemoPage = lazy(() => import('./pages/Module5DemoPage'));
const Module5Dashboard = lazy(() => import('@/pages/modules/Module5Dashboard'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Chargement...</span>
    </div>
  </div>
);

export default function Module5Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Module5SelectionPage />} />
        <Route path="/demo" element={<Module5DemoPage />} />
        <Route path="/dashboard" element={<Module5Dashboard />} />
        <Route path="*" element={<Navigate to="/modules/psychosocial-risks" replace />} />
      </Routes>
    </Suspense>
  );
}
