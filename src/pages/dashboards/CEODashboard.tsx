import { CEOSidebar } from '@/components/layout/CEOSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SidebarToggle } from '@/components/ui/SidebarToggle';
import { Sparkles, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const CEODashboard = () => {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* CEO Sidebar - Menu gauche moderne (collapsible) */}
      <CEOSidebar />

      {/* Main Content Area - Dark mode aware + Responsive */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Bar - Contrôles */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle - Visible toujours */}
              <SidebarToggle />

              {/* Title - Hidden on small mobile */}
              <h2 className="hidden sm:block text-lg font-bold text-foreground">
                Dashboard CEO
              </h2>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Background avec particules géré par ParticleBackground global */}

        {/* Content container - Responsive padding */}
        <div className="relative z-10 h-full flex items-center justify-center p-4 sm:p-6 md:p-8 pt-24">
          {/* Card centrale premium - Dark mode aware */}
          <div
            className={cn(
              'max-w-5xl w-full transform transition-all duration-500',
              'hover:scale-[1.01] sm:hover:scale-[1.02]',
              'rounded-2xl sm:rounded-3xl',
              // Glassmorphism adapté au theme
              'bg-white/90 dark:bg-gray-900/90',
              'backdrop-blur-2xl',
              'border border-cyan-200/30 dark:border-cyan-500/20',
              'shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5'
            )}
          >
            <div className="p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8">
              {/* Header avec gradient text */}
              <div className="text-center space-y-3 sm:space-y-4">
                {/* Badge moderne */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border border-cyan-200/50 dark:border-cyan-500/30">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                    Version 2.0 - Dashboard CEO
                  </span>
                </div>

                {/* Titre avec gradient - Responsive */}
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #0A2F4F 0%, #5DD3F3 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  DASHBOARD CEO
                </h1>

                {/* Sous-titre - Responsive */}
                <p className="text-sm sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 font-light max-w-xl mx-auto px-4">
                  Interface de pilotage stratégique de votre organisation
                </p>
              </div>

              {/* Séparateur avec gradient */}
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/50 dark:via-cyan-500/30 to-transparent" />

              {/* Quick Stats Preview - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  {
                    icon: Users,
                    label: 'Équipe',
                    value: '156',
                    color: 'cyan',
                  },
                  {
                    icon: TrendingUp,
                    label: 'Performance',
                    value: '+12%',
                    color: 'blue',
                  },
                  {
                    icon: DollarSign,
                    label: 'Économies',
                    value: '€2.4M',
                    color: 'indigo',
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className={cn(
                        'group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6',
                        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
                        'bg-gradient-to-br from-white/90 to-white/60',
                        'dark:from-gray-800/90 dark:to-gray-800/60',
                        'border border-cyan-200/30 dark:border-cyan-500/20'
                      )}
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/0 to-cyan-100/50 dark:from-cyan-500/0 dark:to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10 space-y-2">
                        <div
                          className={cn(
                            'inline-flex p-2 rounded-xl',
                            'bg-gradient-to-br from-cyan-100/50 to-cyan-100/20',
                            'dark:from-cyan-500/20 dark:to-cyan-500/10'
                          )}
                        >
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status message */}
              <div
                className={cn(
                  'text-center py-4 sm:py-6 rounded-xl sm:rounded-2xl',
                  'bg-gradient-to-br from-cyan-50/50 to-blue-50/50',
                  'dark:from-cyan-950/30 dark:to-blue-950/30'
                )}
              >
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Le menu latéral est opérationnel
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 px-4">
                    Système light/dark + sidebar collapsible + responsive mobile
                  </p>
                </div>
              </div>

              {/* Footer info */}
              <div className="text-center pt-2 sm:pt-4">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  LELE HCM © 2025 - World Finance Innovation Awards
                </p>
              </div>
            </div>

            {/* Effet de brillance au hover */}
            <div
              className={cn(
                'absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none',
                'rounded-2xl sm:rounded-3xl',
                'bg-gradient-to-br from-transparent via-cyan-500/5 to-transparent'
              )}
            />
          </div>
        </div>

        {/* Floating elements pour profondeur - Hidden on mobile */}
        <div className="hidden md:block absolute top-20 left-20 w-64 h-64 bg-cyan-200/10 dark:bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="hidden md:block absolute bottom-20 right-20 w-96 h-96 bg-blue-200/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
      </main>

    </div>
  );
};

export default CEODashboard;
