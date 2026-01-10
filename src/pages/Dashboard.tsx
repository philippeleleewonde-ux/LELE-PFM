import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { InvitationCodeCard } from '@/components/InvitationCodeCard';
import { Zap } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAccessibleModules } from '@/hooks/useModuleAccess';
import { MODULE_CONFIGS } from '@/types/modules';
import { ModuleCard } from '@/components/ModuleCard';
import { MODULE_PERMISSIONS } from '@/types/modules';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  credits_remaining: number;
  plan_type: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const { modules: accessibleModules, loading: modulesLoading } = useAccessibleModules();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Rediriger les banquiers vers leur dashboard spécifique
  useEffect(() => {
    if (!roleLoading && role === 'BANQUIER') {
      navigate('/banker/dashboard', { replace: true });
    }
  }, [role, roleLoading, navigate]);

  // Ne pas afficher le contenu pour les banquiers
  if (!roleLoading && role === 'BANQUIER') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('credits_remaining, plan_type')
        .eq('user_id', user.id)
        .single();

      if (subData) {
        setSubscription(subData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading || roleLoading || modulesLoading) {
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Tableau de Bord</h1>
          <p className="text-muted-foreground text-lg">
            Bienvenue sur votre portail HCM modulaire
          </p>
          {/* Debug Info */}
          <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
            <p><strong>Rôle actuel:</strong> {role || 'Non défini'}</p>
            <p><strong>Modules accessibles:</strong> {accessibleModules.length > 0 ? accessibleModules.join(', ') : 'Aucun'}</p>
          </div>
        </div>

        {/* Credits Card */}
        {subscription && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle>Crédits Disponibles</CardTitle>
                    <CardDescription>Plan {subscription.plan_type}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                    {subscription.credits_remaining}
                  </div>
                  <div className="text-sm text-muted-foreground">crédits restants</div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Invitation Code Card - Only for CEO, CONSULTANT, and RH_MANAGER */}
        {role && ['CEO', 'CONSULTANT', 'RH_MANAGER'].includes(role) && (
          <InvitationCodeCard />
        )}

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
      </div>
    </AppLayout>
  );
};

export default Dashboard;