// ⚠️ TEMPORARY: Disable lazy loading to force module reload
// import { lazy, Suspense } from 'react';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import DataScannerMain from '@/modules/datascanner/DataScannerMain';

// // ✅ Lazy load DataScannerMain to reduce initial bundle size (10+ MB)
// // Wrap import avec error handling pour identifier le problème
// const DataScannerMain = lazy(() =>
//   import('@/modules/datascanner/DataScannerMain')
//     .catch((err) => {
//       console.error('❌ Failed to load DataScannerMain:', err);
//       // Return a fallback component
//       return {
//         default: () => (
//           <div className="flex items-center justify-center min-h-[60vh] p-8">
//             <div className="max-w-2xl text-center space-y-4">
//               <h2 className="text-2xl font-bold text-destructive">Erreur de chargement du module</h2>
//               <p className="text-muted-foreground">Le module DataScanner n'a pas pu être chargé.</p>
//               <pre className="text-left bg-muted p-4 rounded text-sm overflow-auto">
//                 {err.toString()}
//               </pre>
//               <button
//                 onClick={() => window.location.reload()}
//                 className="px-4 py-2 bg-primary text-primary-foreground rounded"
//               >
//                 Recharger
//               </button>
//             </div>
//           </div>
//         )
//       };
//     })
// );

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
    <p className="text-sm text-muted-foreground animate-pulse">
      Chargement du scanner de données...
    </p>
  </div>
);

export default function DataScannerDashboard() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* CEO Sidebar - Menu gauche moderne (collapsible) */}
      <CEOSidebar />

      {/* Main Content Area - Data Scanner */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Bar - Contrôles */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle - Visible toujours */}
              <SidebarToggle />

              {/* Title - Hidden on small mobile */}
              <h2 className="hidden sm:block text-lg font-bold text-foreground">
                HCM Data Scanner
              </h2>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Data Scanner Content - Lazy loading temporarily disabled */}
        <div className="relative">
          <DataScannerMain />
        </div>
      </main>
    </div>
  );
}
