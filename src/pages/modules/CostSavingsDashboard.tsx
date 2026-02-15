import { ModuleAccess } from '@/components/ModuleAccess';
import Module3Router from '@/modules/module3/Module3Router';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { useLocation } from 'react-router-dom';
import { ModuleBreadcrumb } from '@/modules/module3/components/navigation';

const ROUTE_LABELS: Record<string, string> = {
  'team-identification': 'Identification Équipe',
  'team-members': 'Membres Équipe',
  'team-recap': 'Récapitulatif Équipe',
  'team-recap-global': 'Récapitulatif Global',
  'cost-data-entry': 'Saisie des Coûts',
  'analysis-configuration': 'Configuration Analyse',
  'data-alignment': 'Alignement Données',
  'cost-recap': 'Recap Coûts par Salarié',
  'performance-recap': 'Recap Performance',
  'ekh-analysis': 'Analyse EKH',
  'synthesis': 'Synthèse Performance',
  'prime-distribution': 'Distribution Primes',
  'performance-calculation': 'Calcul Performance',
  'cost-savings-reporting': 'Reporting Économies',
  'performance-center': 'Centre Performance',
  'global-performance-center': 'Performance Globale',
  'performance-calendar': 'Calendrier Performance',
};

function useBreadcrumbItems() {
  const location = useLocation();
  const pathname = location.pathname;

  const basePath = '/modules/module3';
  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const segments = relativePath.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Cost Savings' }];
  }

  const items: Array<{ label: string; path?: string }> = [
    { label: 'Cost Savings', path: basePath },
  ];

  let currentPath = basePath;
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = ROUTE_LABELS[segment] || segment;
    const isLast = index === segments.length - 1;

    items.push({
      label,
      path: isLast ? undefined : currentPath,
    });
  });

  return items;
}

export default function CostSavingsDashboard() {
  const breadcrumbItems = useBreadcrumbItems();
  const location = useLocation();

  const isMainPage = location.pathname === '/modules/module3' || location.pathname === '/modules/module3/';

  return (
    <ModuleAccess moduleNumber={3} requiredPermissions={['read']}>
      <div className="flex h-screen overflow-hidden">
        {/* CEO Sidebar - Menu gauche moderne (collapsible) */}
        <CEOSidebar />

        {/* Main Content Area - Module 3 */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Top Bar - Contrôles */}
          <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Sidebar Toggle - Visible toujours */}
                <SidebarToggle />

                {/* Title - Hidden on small mobile */}
                <h2 className="hidden sm:block text-lg font-bold text-foreground">
                  HCM Cost Savings
                </h2>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Breadcrumb - Shown on sub-pages only */}
            {!isMainPage && (
              <div className="px-4 sm:px-6 border-t border-border/50">
                <ModuleBreadcrumb items={breadcrumbItems} />
              </div>
            )}
          </div>

          {/* Module 3 Content */}
          <div className="relative">
            <Module3Router />
          </div>
        </main>
      </div>
    </ModuleAccess>
  );
}
