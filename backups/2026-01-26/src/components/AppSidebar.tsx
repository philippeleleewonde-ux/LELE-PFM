import { User, CreditCard, LogOut, TrendingUp, Users, DollarSign, Award, Building2, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useAccessibleModules } from '@/hooks/useModuleAccess';
import { MODULE_CONFIGS } from '@/types/modules';
import { ThemeLogo } from './ThemeLogo';
import { useUserRole } from '@/hooks/useUserRole';

const menuItems = [
  { title: 'Profil', url: '/profile', icon: User, roles: ['CONSULTANT', 'CEO', 'RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER', 'BANQUIER'] },
  { title: 'Abonnement', url: '/subscription', icon: CreditCard, roles: ['CONSULTANT', 'CEO', 'RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER', 'BANQUIER'] },
  { title: 'Gestion Utilisateurs', url: '/settings/users', icon: Shield, roles: ['CEO', 'CONSULTANT'] },
  { title: 'Accès Banquier', url: '/settings/banker-access', icon: Building2, roles: ['CEO'] },
  { title: 'Portfolio Clients', url: '/banker/dashboard', icon: Building2, roles: ['BANQUIER'] },
];

const moduleIcons = {
  TrendingUp,
  Users,
  DollarSign,
  Award
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuth();
  const { role } = useUserRole(user?.id);
  const { modules: accessibleModules } = useAccessibleModules();
  const isCollapsed = state === 'collapsed';

  // Filtrer les items du menu selon le rôle
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(role || '')
  );

  return (
    <Sidebar collapsible="icon"  className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="px-4 py-6 flex justify-center">
          <ThemeLogo className={isCollapsed ? 'h-8 w-8' : 'h-16 w-auto'} />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-sidebar-accent'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {accessibleModules.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              Modules
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accessibleModules.map((moduleNumber) => {
                  const moduleConfig = MODULE_CONFIGS[moduleNumber];
                  const Icon = moduleIcons[moduleConfig.icon as keyof typeof moduleIcons];
                  
                  return (
                    <SidebarMenuItem key={moduleNumber}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={moduleConfig.route}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth ${
                              isActive
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'hover:bg-sidebar-accent'
                            }`
                          }
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm">{moduleConfig.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user && (
          <div className="space-y-2">
            <div className="px-2 py-2 text-sm text-muted-foreground truncate">
              {user.email}
            </div>
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full justify-start"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Déconnexion</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}