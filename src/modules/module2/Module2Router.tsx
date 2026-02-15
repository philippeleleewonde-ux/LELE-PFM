import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ModuleAccess } from '@/components/ModuleAccess';

// ============================================================================
// MODULE 2 — ROUTER
// 3 routes: selection page, demo, dashboard
// Pattern copied from Module1Router.tsx
// ============================================================================

const Module2SelectionPage = lazy(() => import('./pages/Module2SelectionPage'));
const Module2DemoPage = lazy(() => import('./pages/Module2DemoPage'));
const Module2Dashboard = lazy(() => import('@/pages/modules/Module2Dashboard'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Chargement...</span>
    </div>
  </div>
);

export default function Module2Router() {
  return (
    <ModuleAccess moduleNumber={2} requiredPermissions={['read']}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Module2SelectionPage />} />
          <Route path="/demo" element={<Module2DemoPage />} />
          <Route path="/dashboard" element={<Module2Dashboard />} />
          <Route path="*" element={<Navigate to="/modules/module2" replace />} />
        </Routes>
      </Suspense>
    </ModuleAccess>
  );
}
