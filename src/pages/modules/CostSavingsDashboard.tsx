import { ModuleAccess } from '@/components/ModuleAccess';
import Module3Router from '@/modules/module3/Module3Router';
import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';

export default function CostSavingsDashboard() {
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
