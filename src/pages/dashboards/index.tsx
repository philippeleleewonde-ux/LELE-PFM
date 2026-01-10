import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppLayout } from '@/components/AppLayout';
import type { UserRole } from '@/types/roles';
import CEODashboard from './CEODashboard';
import ConsultantDashboard from './ConsultantDashboard';
import HRDashboard from './HRDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import TeamLeaderDashboard from './TeamLeaderDashboard';

// Composant de chargement
const LoadingScreen = () => (
  <AppLayout>
    <div className="flex items-center justify-center h-full">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  </AppLayout>
);

// Mapping des dashboards par rôle
const ROLE_DASHBOARDS: Record<UserRole, React.ComponentType> = {
  CEO: CEODashboard,
  CONSULTANT: ConsultantDashboard,
  BANQUIER: () => null, // Le BankerDashboard a sa propre route
  RH_MANAGER: HRDashboard,
  EMPLOYEE: EmployeeDashboard,
  TEAM_LEADER: TeamLeaderDashboard,
};

export const DashboardRouter = () => {
  const { role, loading } = useAppContext();

  if (loading) return <LoadingScreen />;

  if (!role) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Rôle non défini</h2>
            <p className="text-muted-foreground">
              Veuillez contacter un administrateur pour définir votre rôle.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const DashboardComponent = ROLE_DASHBOARDS[role];

  if (!DashboardComponent) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Dashboard non disponible</h2>
            <p className="text-muted-foreground">
              Le dashboard pour le rôle {role} n'est pas encore implémenté.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <DashboardComponent />;
};
