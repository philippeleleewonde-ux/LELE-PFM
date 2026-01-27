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
  User,
  Target,
  BookOpen,
  Calendar
} from 'lucide-react';

const EmployeeDashboard = () => {
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
          <h1 className="text-4xl font-bold mb-2">Mon Espace Employé</h1>
          <p className="text-muted-foreground text-lg">
            Suivez votre parcours et votre développement professionnel
          </p>
        </div>

        {/* Employee Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">
                Objectifs atteints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formations</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                En cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compétences</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Acquises
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prochaine Revue</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12j</div>
              <p className="text-xs text-muted-foreground">
                Évaluation annuelle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Mes Modules</h2>
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

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Accès Rapide</CardTitle>
            <CardDescription>Vos outils quotidiens</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              Mon Profil
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/reports')}
            >
              <Target className="mr-2 h-4 w-4" />
              Mes Objectifs
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EmployeeDashboard;
