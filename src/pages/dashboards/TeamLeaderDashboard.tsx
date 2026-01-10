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
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  UserCheck
} from 'lucide-react';

const TeamLeaderDashboard = () => {
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
          <h1 className="text-4xl font-bold mb-2">Tableau de Bord Team Leader</h1>
          <p className="text-muted-foreground text-lg">
            Pilotez votre équipe vers le succès
          </p>
        </div>

        {/* Team Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres d'Équipe</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                Collaborateurs actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                Objectifs atteints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                En cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes</CardTitle>
              <AlertCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Nécessitent attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Vue d'ensemble de l'Équipe</CardTitle>
            <CardDescription>Performance et indicateurs clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Taux de présence</p>
                    <p className="text-sm text-muted-foreground">Très bon</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">96%</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Objectifs complétés</p>
                    <p className="text-sm text-muted-foreground">Ce trimestre</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-primary">23/25</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Modules de Gestion</h2>
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

        {/* Team Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions d'Équipe</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/modules/module4')}
            >
              <Users className="mr-2 h-4 w-4" />
              Gérer mon équipe
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/reports')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Rapports d'équipe
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/modules/module2')}
            >
              <Target className="mr-2 h-4 w-4" />
              Évaluations
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TeamLeaderDashboard;
