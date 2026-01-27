import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAccessibleModules } from '@/hooks/useModuleAccess';
import { MODULE_CONFIGS } from '@/types/modules';
import { ModuleCard } from '@/components/ModuleCard';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { MODULE_PERMISSIONS } from '@/types/modules';
import {
  Briefcase,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';
import { InvitationCodeCard } from '@/components/InvitationCodeCard';

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const { modules: accessibleModules, loading: modulesLoading } = useAccessibleModules();

  if (modulesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Tableau de Bord Consultant</h1>
          <p className="text-muted-foreground text-lg">
            Gérez vos missions et accompagnez vos clients
          </p>
        </div>

        {/* Invitation Code Card */}
        <InvitationCodeCard />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missions Actives</CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Clients en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rapports</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Livrés ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                Ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">
                Clients satisfaits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Modules Disponibles</h2>
          {accessibleModules.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun module accessible avec votre rôle actuel.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessibleModules.map((moduleNumber) => {
                const moduleConfig = MODULE_CONFIGS[moduleNumber];
                const moduleAccess = role ? MODULE_PERMISSIONS[role][moduleNumber] : { canRead: false, canWrite: false, canAdmin: false };

                return (
                  <ModuleCard
                    key={moduleNumber}
                    module={moduleConfig}
                    access={moduleAccess}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Générer un rapport
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/profile')}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Gérer mes missions
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ConsultantDashboard;
