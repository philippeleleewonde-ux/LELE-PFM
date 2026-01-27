import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  User,
  Building2,
  Bot,
  LayoutDashboard,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Award,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

// ============================================================================
// TYPES - Unified Navigation Card System
// ============================================================================

interface NavCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: {
    label: string;
    color: 'cyan' | 'green' | 'blue' | 'purple' | 'orange' | 'red';
  };
  path?: string;
  subItems?: Array<{
    id: string;
    label: string;
    path: string;
  }>;
  action?: 'logout';
  gradientIntensity: 'light' | 'medium' | 'strong' | 'logout';
}

// ============================================================================
// GRADIENT SYSTEM - Unified Cyan Palette
// ============================================================================

const GRADIENT_PRESETS = {
  light: 'from-cyan-500/10 to-cyan-600/5',
  medium: 'from-cyan-500/15 to-cyan-600/10',
  strong: 'from-cyan-500/20 to-cyan-600/15',
  logout: 'from-red-500/10 to-red-600/5', // Exception pour logout
};

const BADGE_COLORS = {
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  green: 'bg-green-500/20 text-green-300 border-green-400/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  red: 'bg-red-500/20 text-red-300 border-red-400/30',
};

// ============================================================================
// NAVIGATION DATA - All Items as Unified Cards
// ============================================================================

const NAV_CARDS: NavCard[] = [
  // TOP SECTION - Profile & Core Features
  {
    id: 'profil-user',
    title: 'Profil Utilisateur',
    icon: <User className="h-6 w-6" />,
    path: '/profile',
    gradientIntensity: 'light',
    badge: { label: 'Vous', color: 'cyan' },
  },
  {
    id: 'profil-entreprise',
    title: 'Profil Entreprise',
    icon: <Building2 className="h-6 w-6" />,
    path: '/company-profile',
    gradientIntensity: 'light',
    badge: { label: 'Admin', color: 'blue' },
  },
  {
    id: 'ia-lele',
    title: 'IA LELE-HCM',
    icon: <Bot className="h-6 w-6" />,
    path: '/ai-assistant',
    gradientIntensity: 'light',
    badge: { label: 'New', color: 'purple' },
  },
  {
    id: 'dashboard-hcm',
    title: 'Dashboard HCM',
    icon: <LayoutDashboard className="h-6 w-6" />,
    path: '/dashboards/ceo',
    gradientIntensity: 'light',
    badge: { label: 'Core', color: 'cyan' },
  },

  // MODULES SECTION - LELE HCM Solutions
  {
    id: 'financial-dept',
    title: 'Financial Department',
    icon: <TrendingUp className="h-6 w-6" />,
    gradientIntensity: 'medium',
    badge: { label: 'Core', color: 'blue' },
    subItems: [
      { id: 'data-scanner', label: 'HCM Data scanner', path: '/modules/datascanner' },
      { id: 'performance-plan', label: 'HCM Performance plan', path: '/modules/module1' },
      { id: 'banker-access', label: 'Banker/Insurer access', path: '/banker-access' },
    ],
  },
  {
    id: 'hr-dept',
    title: 'HR Department',
    icon: <Users className="h-6 w-6" />,
    gradientIntensity: 'medium',
    badge: { label: 'Popular', color: 'green' },
    subItems: [
      { id: 'employee-satisfaction', label: 'Employee satisfaction', path: '/modules/module2' },
      { id: 'psychosocial-risks', label: 'Psychosocial risks', path: '/modules/psychosocial-risks' },
    ],
  },
  {
    id: 'cost-savings',
    title: 'Cost Savings',
    icon: <DollarSign className="h-6 w-6" />,
    gradientIntensity: 'medium',
    badge: { label: 'ROI+', color: 'orange' },
    subItems: [
      { id: 'hcm-cost-savings', label: 'HCM Cost Savings', path: '/modules/module3' },
    ],
  },
  {
    id: 'lines-performance',
    title: 'Lines of Activities',
    icon: <BarChart3 className="h-6 w-6" />,
    gradientIntensity: 'medium',
    subItems: [
      { id: 'lines-module', label: 'Performance Tracking', path: '/modules/lines-performance' },
    ],
  },
  {
    id: 'performance-cards',
    title: 'Employee Performance',
    icon: <Award className="h-6 w-6" />,
    gradientIntensity: 'medium',
    badge: { label: 'New', color: 'purple' },
    subItems: [
      { id: 'perf-cards-module', label: 'Performance Cards', path: '/modules/performance-cards' },
    ],
  },

  // BOTTOM SECTION - Settings & Logout
  {
    id: 'pricing',
    title: 'Abonnements / Pricing',
    icon: <CreditCard className="h-6 w-6" />,
    path: '/subscription',
    gradientIntensity: 'light',
  },
  {
    id: 'settings',
    title: 'Parametrage',
    icon: <Settings className="h-6 w-6" />,
    path: '/settings',
    gradientIntensity: 'light',
  },
  {
    id: 'logout',
    title: 'Déconnexion',
    icon: <LogOut className="h-6 w-6" />,
    action: 'logout',
    gradientIntensity: 'logout',
    badge: { label: 'Exit', color: 'red' },
  },
];

// ============================================================================
// UNIFIED NAV CARD COMPONENT - Premium Cards for All Items
// ============================================================================

interface UnifiedNavCardProps {
  card: NavCard;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const UnifiedNavCard = ({ card, onNavigate, onLogout }: UnifiedNavCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();

  const hasSubItems = card.subItems && card.subItems.length > 0;
  const isActive = card.path ? location.pathname === card.path : false;
  const isLogout = card.action === 'logout';

  const handleClick = () => {
    if (hasSubItems) {
      setIsExpanded(!isExpanded);
    } else if (isLogout) {
      onLogout();
    } else if (card.path) {
      onNavigate(card.path);
    }
  };

  return (
    <div className="group">
      {/* Card Header - Clickable */}
      <button
        onClick={handleClick}
        className={cn(
          'w-full rounded-2xl p-4 transition-all duration-300',
          'bg-gradient-to-br',
          'relative overflow-hidden',

          // Theme-aware background and borders
          theme === 'light' ? [
            'bg-white border-gray-200',
            isActive && !hasSubItems && 'bg-cyan-50 border-cyan-300 shadow-md',
          ] : [
            GRADIENT_PRESETS[card.gradientIntensity],
            'border-white/10',
            isActive && !hasSubItems && [
              'border-cyan-400/60',
              'shadow-lg shadow-cyan-500/30',
              'bg-gradient-to-br from-cyan-500/25 to-cyan-600/15',
            ],
          ],
          'border',

          // Hover effects - theme aware
          theme === 'light' ? [
            isLogout
              ? 'hover:border-red-300 hover:shadow-md hover:shadow-red-200/50'
              : 'hover:border-cyan-300 hover:shadow-md hover:shadow-cyan-200/50',
          ] : [
            isLogout
              ? 'hover:border-red-400/40 hover:shadow-lg hover:shadow-red-500/20'
              : 'hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/20',
          ],
          'hover:-translate-y-0.5',
        )}
      >
        {/* Badge - Top Right */}
        {card.badge && (
          <div className={cn(
            'absolute top-2 right-2',
            'px-2 py-0.5 rounded-full text-xs font-bold border',
            BADGE_COLORS[card.badge.color]
          )}>
            {card.badge.label}
          </div>
        )}

        {/* Icon + Title + Chevron */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              'shrink-0 transition-all duration-300 group-hover:scale-110 transform',
              theme === 'light' ? [
                isLogout
                  ? 'text-red-500 group-hover:text-red-600'
                  : isActive && !hasSubItems
                    ? 'text-cyan-600'
                    : 'text-cyan-500 group-hover:text-cyan-600',
              ] : [
                isLogout
                  ? 'text-red-400/80 group-hover:text-red-300'
                  : isActive && !hasSubItems
                    ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(93,211,243,0.5)]'
                    : 'text-cyan-300/70 group-hover:text-cyan-200',
              ]
            )}
          >
            {card.icon}
          </div>

          {/* Title + Subtitle */}
          <div className="flex-1 text-left">
            <h3
              className={cn(
                'text-sm font-bold transition-colors',
                theme === 'light' ? [
                  isActive && !hasSubItems
                    ? 'text-gray-900'
                    : 'text-gray-700 group-hover:text-gray-900',
                ] : [
                  isActive && !hasSubItems
                    ? 'text-white'
                    : 'text-white/90 group-hover:text-white',
                ]
              )}
            >
              {card.title}
            </h3>
            {hasSubItems && (
              <p className={cn(
                'text-xs mt-0.5',
                theme === 'light' ? 'text-gray-500' : 'text-white/60'
              )}>
                {card.subItems.length} module{card.subItems.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Chevron for expandable cards */}
          {hasSubItems && (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-all duration-300',
                theme === 'light' ? 'text-gray-500' : 'text-cyan-300/70',
                isExpanded ? 'rotate-180' : 'rotate-0'
              )}
            />
          )}
        </div>

        {/* Glow effect on hover - theme aware */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none',
            theme === 'light' ? [
              isLogout
                ? 'bg-gradient-to-r from-red-200/0 via-red-200/15 to-red-200/0'
                : 'bg-gradient-to-r from-cyan-200/0 via-cyan-200/15 to-cyan-200/0'
            ] : [
              isLogout
                ? 'bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0'
                : 'bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0'
            ]
          )}
        />
      </button>

      {/* Expanded Sub-items (Accordion) */}
      {hasSubItems && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
          )}
        >
          <div className="space-y-1 pl-2">
            {card.subItems!.map((subItem) => {
              const isSubActive = location.pathname === subItem.path;
              return (
                <button
                  key={subItem.id}
                  onClick={() => onNavigate(subItem.path)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-xl',
                    'flex items-center gap-2',
                    'transition-all duration-200',
                    'text-sm font-medium',
                    'border-l-4',
                    theme === 'light' ? [
                      isSubActive
                        ? 'bg-cyan-100 text-cyan-900 border-cyan-500 shadow-md shadow-cyan-200/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent hover:border-cyan-400/50'
                    ] : [
                      isSubActive
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'text-white/80 hover:text-white hover:bg-white/5 border-transparent hover:border-cyan-500/50'
                    ]
                  )}
                >
                  <Zap
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      theme === 'light' ? [
                        isSubActive ? 'text-cyan-600' : 'text-cyan-500/50'
                      ] : [
                        isSubActive ? 'text-cyan-400' : 'text-cyan-300/50'
                      ]
                    )}
                  />
                  <span>{subItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN CEO SIDEBAR COMPONENT
// ============================================================================

export const CEOSidebar = () => {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { signOut } = useAuth();
  const { theme } = useTheme();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      // Use the auth signOut method which properly clears Supabase session
      await signOut();
    }
  };

  // Split cards into sections
  const topCards = NAV_CARDS.slice(0, 4); // Profil, Entreprise, IA, Dashboard
  const moduleCards = NAV_CARDS.slice(4, 9); // All modules
  const bottomCards = NAV_CARDS.slice(9); // Pricing, Settings, Logout

  return (
    <aside
      className={cn(
        'h-screen overflow-y-auto flex-shrink-0 relative transition-all duration-300',
        'backdrop-blur-xl',
        isCollapsed ? 'w-0 md:w-0' : 'w-80',
        // Theme-aware background
        theme === 'light'
          ? 'bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200'
          : 'bg-gradient-to-b from-[rgba(10,47,79,0.95)] to-[rgba(10,47,79,0.98)] border-r border-white/10'
      )}
    >
      {/* Gradient overlay pour profondeur - Theme aware */}
      <div className={cn(
        'absolute inset-0 pointer-events-none',
        theme === 'light'
          ? 'bg-gradient-to-br from-cyan-50/30 via-transparent to-gray-100/20'
          : 'bg-gradient-to-br from-cyan-500/5 via-transparent to-navy-900/20'
      )} />

      {/* Sidebar Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-gradient-to-b from-sidebar/80 to-transparent">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            {/* Logo */}
            <div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #5DD3F3 0%, #0A2F4F 100%)',
                boxShadow: '0 8px 32px rgba(93, 211, 243, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
              }}
            >
              <span className="text-white font-black text-xl drop-shadow-lg">L</span>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Title */}
            <div>
              <h2 className={cn(
                'font-black text-lg tracking-tight drop-shadow-sm',
                theme === 'light' ? 'text-gray-900' : 'text-white'
              )}>
                LELE HCM
              </h2>
              <p className={cn(
                'text-xs font-medium tracking-wide',
                theme === 'light' ? 'text-cyan-600' : 'text-cyan-300/80'
              )}>
                CEO Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className={cn(
          'h-px mx-4',
          theme === 'light'
            ? 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
        )} />
      </div>

      {/* Navigation - All Unified Cards */}
      <nav className="py-4 px-2 relative z-10 space-y-6">
        {/* TOP SECTION - Profile & Core */}
        <div className="space-y-2">
          {topCards.map((card) => (
            <UnifiedNavCard
              key={card.id}
              card={card}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          ))}
        </div>

        {/* MODULES SECTION - LELE HCM Solutions */}
        <div className="space-y-3">
          {/* Section Header */}
          <div className="px-4 pt-2 pb-1">
            <h2 className={cn(
              'text-lg font-black tracking-tight drop-shadow-sm flex items-center gap-2',
              theme === 'light' ? 'text-gray-900' : 'text-white'
            )}>
              <Sparkles className={cn(
                'h-5 w-5',
                theme === 'light' ? 'text-cyan-600' : 'text-cyan-300'
              )} />
              LELE HCM SOLUTIONS
            </h2>
            <p className={cn(
              'text-xs font-medium mt-0.5',
              theme === 'light' ? 'text-gray-600' : 'text-cyan-300/80'
            )}>Modules professionnels</p>
          </div>

          {/* Module Cards */}
          <div className="space-y-2">
            {moduleCards.map((card) => (
              <UnifiedNavCard
                key={card.id}
                card={card}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM SECTION - Settings & Logout */}
        <div className={cn(
          'border-t pt-4 space-y-2',
          theme === 'light' ? 'border-gray-300' : 'border-white/10'
        )}>
          {bottomCards.map((card) => (
            <UnifiedNavCard
              key={card.id}
              card={card}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          ))}
        </div>
      </nav>

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
    </aside>
  );
};
